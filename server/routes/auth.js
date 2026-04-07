const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const {
  insertUser,
  getUserByEmail,
  getUserById,
  updateLastLogin,
  updateDnaData,
  insertWaitlistEntry,
  getWaitlistCount,
  getWaitlistByEmail,
  getUserByReferralCode,
  setUserReferralCode,
  insertReferral,
} = require('../db/database');

function generateReferralCode(name) {
  const prefix = (name || 'USER').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return prefix + suffix;
}

const router = express.Router();

// ── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already taken
    const existing = await getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const validRole = ['student', 'teacher', 'admin'].includes(role) ? role : 'student';

    await insertUser({
      id: userId,
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: name.trim(),
      role: validRole,
    });

    // Generate unique referral code
    let referralCode = generateReferralCode(name);
    let attempts = 0;
    while (await getUserByReferralCode(referralCode) && attempts < 10) {
      referralCode = generateReferralCode(name);
      attempts++;
    }
    try { await setUserReferralCode(referralCode, userId); } catch { /* ignore if collision */ }

    // Handle referral code from registration
    const { referralCode: refCode } = req.body;
    if (refCode) {
      const referrer = await getUserByReferralCode(refCode.toUpperCase().trim());
      if (referrer && referrer.id !== userId) {
        try {
          await insertReferral({
            id: uuidv4(),
            referrer_user_id: referrer.id,
            referred_email: email.toLowerCase().trim(),
            referred_user_id: userId,
            status: 'pending',
          });
        } catch { /* ignore duplicate */ }
      }
    }

    const token = generateToken(userId);

    res.status(201).json({
      token,
      user: { id: userId, email: email.toLowerCase().trim(), name: name.trim(), role: validRole, referralCode },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await updateLastLogin(Math.floor(Date.now() / 1000), user.id);

    const token = generateToken(user.id);

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────

router.get('/me', requireAuth, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan || 'free',
    sessionsUsed: user.sessions_used || 0,
    sessionCount: user.session_count,
    createdAt: user.created_at,
    hasDna: !!user.dna_data,
    referralCode: user.referral_code || null,
    referralCount: user.referral_count || 0,
    bonusSessions: user.bonus_sessions || 0,
  });
});

// ── PUT /api/auth/dna ───────────────────────────────────────────────────────

router.put('/dna', requireAuth, async (req, res) => {
  const { dnaData } = req.body;
  if (!dnaData) {
    return res.status(400).json({ error: 'dnaData is required' });
  }

  try {
    const json = typeof dnaData === 'string' ? dnaData : JSON.stringify(dnaData);
    await updateDnaData(json, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('DNA update error:', err);
    res.status(500).json({ error: 'Failed to save DNA data' });
  }
});

// ── GET /api/auth/dna ───────────────────────────────────────────────────────

router.get('/dna', requireAuth, async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user || !user.dna_data) {
    return res.json({ dnaData: null });
  }

  try {
    res.json({ dnaData: JSON.parse(user.dna_data) });
  } catch {
    res.json({ dnaData: null });
  }
});

// ── POST /api/waitlist ──────────────────────────────────────────────────────

router.post('/waitlist', async (req, res) => {
  try {
    const { email, name, role, school, ref } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if already on waitlist
    const existing = await getWaitlistByEmail(email.toLowerCase().trim());
    if (existing) {
      const { count } = await getWaitlistCount();
      return res.json({ success: true, position: count, alreadyJoined: true });
    }

    const id = uuidv4();
    await insertWaitlistEntry({
      id,
      email: email.toLowerCase().trim(),
      name: name ? name.trim() : null,
      role: role || 'student',
      school: school ? school.trim() : null,
      referrer: ref || null,
    });

    const { count } = await getWaitlistCount();

    res.status(201).json({ success: true, position: count });
  } catch (err) {
    console.error('Waitlist error:', err);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

module.exports = router;
