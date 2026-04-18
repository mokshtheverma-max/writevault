const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const DB_URL = process.env.DATABASE_URL || 'file:data/writevault.db';

// Ensure data directory exists for local file databases
if (DB_URL.startsWith('file:')) {
  const filePath = DB_URL.replace('file:', '');
  const dataDir = path.dirname(filePath);
  if (dataDir && !fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const client = createClient({
  url: DB_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

// ── Helpers ─────────────────────────────────────────────────────────────────

async function dbRun(sql, args = []) {
  const result = await client.execute({ sql, args });
  return { changes: result.rowsAffected, lastID: Number(result.lastInsertRowid) };
}

async function dbGet(sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows[0] || undefined;
}

async function dbAll(sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows;
}

async function dbExec(sql) {
  await client.executeMultiple(sql);
}

// ── Initialize database ─────────────────────────────────────────────────────

async function initialize() {
  await client.execute('PRAGMA journal_mode = WAL');
  await client.execute('PRAGMA foreign_keys = ON');

  // Run schema as individual statements
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  for (const sql of statements) {
    try { await client.execute(sql); } catch { /* table/index already exists */ }
  }

  // Migrations — safely add columns that may not exist on older databases
  const migrations = [
    "ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','student','teacher','institution'))",
    "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT",
    "ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT",
    "ALTER TABLE users ADD COLUMN plan_expires_at INTEGER",
    "ALTER TABLE users ADD COLUMN sessions_used INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE sessions ADD COLUMN user_id TEXT REFERENCES users(id)",
    "ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE",
    "ALTER TABLE users ADD COLUMN referral_count INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN bonus_sessions INTEGER DEFAULT 0",
  ];
  for (const sql of migrations) {
    try { await client.execute(sql); } catch { /* column already exists */ }
  }

  // Analytics tables
  const analyticsSql = [
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      event TEXT NOT NULL,
      props TEXT,
      timestamp INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    'CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)',
  ];
  for (const sql of analyticsSql) {
    try { await client.execute(sql); } catch { /* already exists */ }
  }
}

// ── Query functions ─────────────────────────────────────────────────────────

const insertSession = (p) => dbRun(
  `INSERT INTO sessions (id, title, content, events, human_score, sha256_hash, start_time, end_time, created_at, metadata, user_id)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), ?, ?)`,
  [p.id, p.title, p.content, p.events, p.human_score, p.sha256_hash, p.start_time, p.end_time, p.metadata, p.user_id]
);

const getSessionById = (id) => dbGet('SELECT * FROM sessions WHERE id = ?', [id]);

const getSessionByHash = (hash) => dbGet('SELECT * FROM sessions WHERE sha256_hash = ?', [hash]);

const insertVerification = (p) => dbRun(
  `INSERT INTO session_verifications (id, session_id, verified_at, verifier_ip)
   VALUES (?, ?, unixepoch(), ?)`,
  [p.id, p.session_id, p.verifier_ip]
);

const getVerificationCount = (sessionId) => dbGet(
  'SELECT COUNT(*) as count FROM session_verifications WHERE session_id = ?', [sessionId]
);

// ── Auth query functions ────────────────────────────────────────────────────

const insertUser = (p) => dbRun(
  `INSERT INTO users (id, email, password_hash, name, role, created_at)
   VALUES (?, ?, ?, ?, ?, unixepoch())`,
  [p.id, p.email, p.password_hash, p.name, p.role]
);

const getUserById = (id) => dbGet('SELECT * FROM users WHERE id = ?', [id]);

const getUserByEmail = (email) => dbGet('SELECT * FROM users WHERE email = ?', [email]);

const updateLastLogin = (timestamp, id) => dbRun(
  'UPDATE users SET last_login = ?, session_count = session_count + 1 WHERE id = ?', [timestamp, id]
);

const updateDnaData = (data, id) => dbRun('UPDATE users SET dna_data = ? WHERE id = ?', [data, id]);

const updateUserPassword = (hash, email) => dbRun('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);

const updateUserPasswordById = (hash, id) => dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);

const updateUserProfile = (name, email, id) => dbRun(
  'UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]
);

const deleteUserById = async (id) => {
  await dbRun('DELETE FROM session_verifications WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', [id]);
  await dbRun('DELETE FROM sessions WHERE user_id = ?', [id]);
  await dbRun('DELETE FROM referrals WHERE referrer_user_id = ? OR referred_user_id = ?', [id, id]);
  await dbRun('DELETE FROM rewards WHERE user_id = ?', [id]);
  await dbRun('DELETE FROM auth_tokens WHERE user_id = ?', [id]);
  return dbRun('DELETE FROM users WHERE id = ?', [id]);
};

const insertWaitlistEntry = (p) => dbRun(
  `INSERT INTO waitlist (id, email, name, role, school, referrer, joined_at)
   VALUES (?, ?, ?, ?, ?, ?, unixepoch())`,
  [p.id, p.email, p.name, p.role, p.school, p.referrer]
);

const getWaitlistCount = () => dbGet('SELECT COUNT(*) as count FROM waitlist');

const getWaitlistByEmail = (email) => dbGet('SELECT * FROM waitlist WHERE email = ?', [email]);

// ── Plan / Stripe query functions ───────────────────────────────────────────

const updateUserPlan = (plan, stripeCustomerId, stripeSubId, expiresAt, userId) => dbRun(
  'UPDATE users SET plan = ?, stripe_customer_id = ?, stripe_subscription_id = ?, plan_expires_at = ? WHERE id = ?',
  [plan, stripeCustomerId, stripeSubId, expiresAt, userId]
);

const updateUserPlanByStripeCustomer = (plan, subId, expiresAt, customerId) => dbRun(
  'UPDATE users SET plan = ?, stripe_subscription_id = ?, plan_expires_at = ? WHERE stripe_customer_id = ?',
  [plan, subId, expiresAt, customerId]
);

const getUserByStripeCustomer = (customerId) => dbGet(
  'SELECT * FROM users WHERE stripe_customer_id = ?', [customerId]
);

const incrementSessionsUsed = (id) => dbRun(
  'UPDATE users SET sessions_used = sessions_used + 1 WHERE id = ?', [id]
);

const downgradeUserByStripeCustomer = (customerId) => dbRun(
  "UPDATE users SET plan = 'free', stripe_subscription_id = NULL, plan_expires_at = NULL WHERE stripe_customer_id = ?",
  [customerId]
);

// ── Referral query functions ────────────────────────────────────────────────

const getUserByReferralCode = (code) => dbGet('SELECT * FROM users WHERE referral_code = ?', [code]);

const setUserReferralCode = (code, id) => dbRun('UPDATE users SET referral_code = ? WHERE id = ?', [code, id]);

const insertReferral = (p) => dbRun(
  `INSERT INTO referrals (id, referrer_user_id, referred_email, referred_user_id, status, created_at)
   VALUES (?, ?, ?, ?, ?, unixepoch())`,
  [p.id, p.referrer_user_id, p.referred_email, p.referred_user_id, p.status]
);

const getReferralsByReferrer = (userId) => dbAll(
  'SELECT * FROM referrals WHERE referrer_user_id = ? ORDER BY created_at DESC', [userId]
);

const getReferralByReferredUser = (userId) => dbGet(
  'SELECT * FROM referrals WHERE referred_user_id = ?', [userId]
);

const completeReferral = (id) => dbRun(
  "UPDATE referrals SET status = 'completed', completed_at = unixepoch() WHERE id = ?", [id]
);

const rewardReferral = (id) => dbRun("UPDATE referrals SET status = 'rewarded' WHERE id = ?", [id]);

const incrementReferralCount = (id) => dbRun(
  'UPDATE users SET referral_count = referral_count + 1 WHERE id = ?', [id]
);

const addBonusSessions = (amount, id) => dbRun(
  'UPDATE users SET bonus_sessions = bonus_sessions + ? WHERE id = ?', [amount, id]
);

const insertReward = (p) => dbRun(
  `INSERT INTO rewards (id, user_id, type, description, granted_at)
   VALUES (?, ?, ?, ?, unixepoch())`,
  [p.id, p.user_id, p.type, p.description]
);

const getSessionsByUserId = (userId) => dbAll(
  `SELECT id, title, human_score, start_time, end_time, created_at, metadata
   FROM sessions WHERE user_id = ? ORDER BY created_at DESC`,
  [userId]
);

const deleteSessionById = (id) => dbRun('DELETE FROM sessions WHERE id = ?', [id]);

const deleteVerificationsBySessionId = (sessionId) => dbRun(
  'DELETE FROM session_verifications WHERE session_id = ?', [sessionId]
);

const getRecentVerificationsByIp = (ip, limit) => dbAll(
  `SELECT v.id, v.session_id, v.verified_at, s.title, s.human_score, s.sha256_hash, s.created_at
   FROM session_verifications v
   JOIN sessions s ON s.id = v.session_id
   WHERE v.verifier_ip = ?
   ORDER BY v.verified_at DESC
   LIMIT ?`, [ip, limit]
);

const countVerificationsByIp = (ip) => dbGet(
  'SELECT COUNT(*) as count FROM session_verifications WHERE verifier_ip = ?', [ip]
);

// ── Exported db helper for inline queries in other files ────────────────────

const db = {
  run: dbRun,
  get: dbGet,
  all: dbAll,
  exec: dbExec,
};

module.exports = {
  initialize,
  db,
  insertSession,
  getSessionById,
  getSessionByHash,
  insertVerification,
  getVerificationCount,
  insertUser,
  getUserById,
  getUserByEmail,
  updateLastLogin,
  updateDnaData,
  insertWaitlistEntry,
  getWaitlistCount,
  getWaitlistByEmail,
  updateUserPlan,
  updateUserPlanByStripeCustomer,
  getUserByStripeCustomer,
  incrementSessionsUsed,
  downgradeUserByStripeCustomer,
  getUserByReferralCode,
  setUserReferralCode,
  insertReferral,
  getReferralsByReferrer,
  getReferralByReferredUser,
  completeReferral,
  rewardReferral,
  incrementReferralCount,
  addBonusSessions,
  insertReward,
  getSessionsByUserId,
  updateUserPassword,
  updateUserPasswordById,
  updateUserProfile,
  deleteUserById,
  deleteSessionById,
  deleteVerificationsBySessionId,
  getRecentVerificationsByIp,
  countVerificationsByIp,
};
