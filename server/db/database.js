const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'writevault.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqliteDb = new sqlite3.Database(DB_PATH);

// ── Promise wrappers ────────────────────────────────────────────────────────

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbExec(sql) {
  return new Promise((resolve, reject) => {
    sqliteDb.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Convert {key: val} to {$key: val} for named parameters
function $(params) {
  const result = {};
  for (const [k, v] of Object.entries(params)) {
    result[`$${k}`] = v;
  }
  return result;
}

// ── Initialize database ─────────────────────────────────────────────────────

async function initialize() {
  await dbExec('PRAGMA journal_mode = WAL');
  await dbExec('PRAGMA foreign_keys = ON');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await dbExec(schema);

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
    try { await dbExec(sql); } catch { /* column already exists */ }
  }

  // Analytics tables (previously created in analytics.js at load time)
  await dbExec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      event TEXT NOT NULL,
      props TEXT,
      timestamp INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  await dbExec('CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event)');
  await dbExec('CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)');
}

// ── Query functions ─────────────────────────────────────────────────────────

const insertSession = (params) => dbRun(`
  INSERT INTO sessions (id, title, content, events, human_score, sha256_hash, start_time, end_time, created_at, metadata, user_id)
  VALUES ($id, $title, $content, $events, $human_score, $sha256_hash, $start_time, $end_time, unixepoch(), $metadata, $user_id)
`, $(params));

const getSessionById = (id) => dbGet('SELECT * FROM sessions WHERE id = ?', [id]);

const getSessionByHash = (hash) => dbGet('SELECT * FROM sessions WHERE sha256_hash = ?', [hash]);

const insertVerification = (params) => dbRun(`
  INSERT INTO session_verifications (id, session_id, verified_at, verifier_ip)
  VALUES ($id, $session_id, unixepoch(), $verifier_ip)
`, $(params));

const getVerificationCount = (sessionId) => dbGet(
  'SELECT COUNT(*) as count FROM session_verifications WHERE session_id = ?', [sessionId]
);

// ── Auth query functions ────────────────────────────────────────────────────

const insertUser = (params) => dbRun(`
  INSERT INTO users (id, email, password_hash, name, role, created_at)
  VALUES ($id, $email, $password_hash, $name, $role, unixepoch())
`, $(params));

const getUserById = (id) => dbGet('SELECT * FROM users WHERE id = ?', [id]);

const getUserByEmail = (email) => dbGet('SELECT * FROM users WHERE email = ?', [email]);

const updateLastLogin = (timestamp, id) => dbRun(
  'UPDATE users SET last_login = ?, session_count = session_count + 1 WHERE id = ?', [timestamp, id]
);

const updateDnaData = (data, id) => dbRun('UPDATE users SET dna_data = ? WHERE id = ?', [data, id]);

const insertWaitlistEntry = (params) => dbRun(`
  INSERT INTO waitlist (id, email, name, role, school, referrer, joined_at)
  VALUES ($id, $email, $name, $role, $school, $referrer, unixepoch())
`, $(params));

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

const insertReferral = (params) => dbRun(`
  INSERT INTO referrals (id, referrer_user_id, referred_email, referred_user_id, status, created_at)
  VALUES ($id, $referrer_user_id, $referred_email, $referred_user_id, $status, unixepoch())
`, $(params));

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

const insertReward = (params) => dbRun(`
  INSERT INTO rewards (id, user_id, type, description, granted_at)
  VALUES ($id, $user_id, $type, $description, unixepoch())
`, $(params));

const getSessionsByUserId = (userId) => dbAll(`
  SELECT id, title, human_score, start_time, end_time, created_at, metadata
  FROM sessions WHERE user_id = ? ORDER BY created_at DESC
`, [userId]);

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
};
