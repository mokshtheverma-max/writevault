const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'writevault.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Performance pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema on startup
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

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
  try { db.exec(sql); } catch { /* column already exists */ }
}

// Prepared statements
const insertSession = db.prepare(`
  INSERT INTO sessions (id, title, content, events, human_score, sha256_hash, start_time, end_time, created_at, metadata, user_id)
  VALUES (@id, @title, @content, @events, @human_score, @sha256_hash, @start_time, @end_time, unixepoch(), @metadata, @user_id)
`);

const getSessionById = db.prepare(`
  SELECT * FROM sessions WHERE id = ?
`);

const getSessionByHash = db.prepare(`
  SELECT * FROM sessions WHERE sha256_hash = ?
`);

const insertVerification = db.prepare(`
  INSERT INTO session_verifications (id, session_id, verified_at, verifier_ip)
  VALUES (@id, @session_id, unixepoch(), @verifier_ip)
`);

const getVerificationCount = db.prepare(`
  SELECT COUNT(*) as count FROM session_verifications WHERE session_id = ?
`);

// ── Auth prepared statements ────────────────────────────────────────────────

const insertUser = db.prepare(`
  INSERT INTO users (id, email, password_hash, name, role, created_at)
  VALUES (@id, @email, @password_hash, @name, @role, unixepoch())
`);

const getUserById = db.prepare(`
  SELECT * FROM users WHERE id = ?
`);

const getUserByEmail = db.prepare(`
  SELECT * FROM users WHERE email = ?
`);

const updateLastLogin = db.prepare(`
  UPDATE users SET last_login = ?, session_count = session_count + 1 WHERE id = ?
`);

const updateDnaData = db.prepare(`
  UPDATE users SET dna_data = ? WHERE id = ?
`);

const insertWaitlistEntry = db.prepare(`
  INSERT INTO waitlist (id, email, name, role, school, referrer, joined_at)
  VALUES (@id, @email, @name, @role, @school, @referrer, unixepoch())
`);

const getWaitlistCount = db.prepare(`
  SELECT COUNT(*) as count FROM waitlist
`);

const getWaitlistByEmail = db.prepare(`
  SELECT * FROM waitlist WHERE email = ?
`);

// ── Plan / Stripe prepared statements ──────────────────────────────────────

const updateUserPlan = db.prepare(`
  UPDATE users SET plan = ?, stripe_customer_id = ?, stripe_subscription_id = ?, plan_expires_at = ? WHERE id = ?
`);

const updateUserPlanByStripeCustomer = db.prepare(`
  UPDATE users SET plan = ?, stripe_subscription_id = ?, plan_expires_at = ? WHERE stripe_customer_id = ?
`);

const getUserByStripeCustomer = db.prepare(`
  SELECT * FROM users WHERE stripe_customer_id = ?
`);

const incrementSessionsUsed = db.prepare(`
  UPDATE users SET sessions_used = sessions_used + 1 WHERE id = ?
`);

const downgradeUserByStripeCustomer = db.prepare(`
  UPDATE users SET plan = 'free', stripe_subscription_id = NULL, plan_expires_at = NULL WHERE stripe_customer_id = ?
`);

// ── Referral prepared statements ───────────────────────────────────────────

const getUserByReferralCode = db.prepare(`
  SELECT * FROM users WHERE referral_code = ?
`);

const setUserReferralCode = db.prepare(`
  UPDATE users SET referral_code = ? WHERE id = ?
`);

const insertReferral = db.prepare(`
  INSERT INTO referrals (id, referrer_user_id, referred_email, referred_user_id, status, created_at)
  VALUES (@id, @referrer_user_id, @referred_email, @referred_user_id, @status, unixepoch())
`);

const getReferralsByReferrer = db.prepare(`
  SELECT * FROM referrals WHERE referrer_user_id = ? ORDER BY created_at DESC
`);

const getReferralByReferredUser = db.prepare(`
  SELECT * FROM referrals WHERE referred_user_id = ?
`);

const completeReferral = db.prepare(`
  UPDATE referrals SET status = 'completed', completed_at = unixepoch() WHERE id = ?
`);

const rewardReferral = db.prepare(`
  UPDATE referrals SET status = 'rewarded' WHERE id = ?
`);

const incrementReferralCount = db.prepare(`
  UPDATE users SET referral_count = referral_count + 1 WHERE id = ?
`);

const addBonusSessions = db.prepare(`
  UPDATE users SET bonus_sessions = bonus_sessions + ? WHERE id = ?
`);

const insertReward = db.prepare(`
  INSERT INTO rewards (id, user_id, type, description, granted_at)
  VALUES (@id, @user_id, @type, @description, unixepoch())
`);

const getSessionsByUserId = db.prepare(`
  SELECT id, title, human_score, start_time, end_time, created_at, metadata
  FROM sessions WHERE user_id = ? ORDER BY created_at DESC
`);

module.exports = {
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
