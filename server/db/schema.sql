CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  events TEXT NOT NULL,
  human_score INTEGER NOT NULL,
  sha256_hash TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  metadata TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_verifications (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  verified_at INTEGER DEFAULT (unixepoch()),
  verifier_ip TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);

-- ── Auth tables ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK(role IN ('student','teacher','admin')),
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK(plan IN ('free','student','teacher','institution')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_expires_at INTEGER,
  sessions_used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  last_login INTEGER,
  session_count INTEGER DEFAULT 0,
  dna_data TEXT,
  is_verified INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'student',
  school TEXT,
  referrer TEXT,
  joined_at INTEGER DEFAULT (unixepoch()),
  converted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- ── Referral tables ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,
  referred_email TEXT,
  referred_user_id TEXT,
  status TEXT DEFAULT 'pending'
    CHECK(status IN ('pending','completed','rewarded')),
  created_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER,
  FOREIGN KEY (referrer_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  granted_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
