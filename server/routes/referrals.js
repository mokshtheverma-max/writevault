const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const {
  getUserById,
  getUserByReferralCode,
  getReferralsByReferrer,
  getReferralByReferredUser,
  insertReferral,
  completeReferral,
  rewardReferral,
  incrementReferralCount,
  addBonusSessions,
  insertReward,
  getSessionsByUserId,
} = require('../db/database');

const router = express.Router();

// ── GET /api/referrals/my-code ─────────────────────────────────────────────

router.get('/my-code', requireAuth, (req, res) => {
  const user = getUserById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    code: user.referral_code || null,
    referralCount: user.referral_count || 0,
    bonusSessions: user.bonus_sessions || 0,
    referralUrl: user.referral_code
      ? `${process.env.APP_URL || 'https://writevault.app'}/auth?ref=${user.referral_code}`
      : null,
  });
});

// ── GET /api/referrals/stats ───────────────────────────────────────────────

router.get('/stats', requireAuth, (req, res) => {
  const user = getUserById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const referrals = getReferralsByReferrer.all(req.user.id);

  const completed = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded');
  const pending = referrals.filter(r => r.status === 'pending');

  res.json({
    totalReferrals: referrals.length,
    completedReferrals: completed.length,
    pendingReferrals: pending.length,
    bonusSessionsEarned: user.bonus_sessions || 0,
    referrals: referrals.map(r => ({
      email: r.referred_email ? r.referred_email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'Unknown',
      status: r.status,
      date: r.created_at,
    })),
  });
});

// ── POST /api/referrals/apply ──────────────────────────────────────────────

router.post('/apply', requireAuth, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Referral code is required' });

  // Check if user already has sessions (only applies to new users)
  const sessions = getSessionsByUserId.all(req.user.id);
  if (sessions.length > 0) {
    return res.status(400).json({ error: 'Referral code can only be applied before your first session' });
  }

  // Check if already referred
  const existing = getReferralByReferredUser.get(req.user.id);
  if (existing) {
    return res.status(400).json({ error: 'A referral code has already been applied to your account' });
  }

  const referrer = getUserByReferralCode.get(code.toUpperCase().trim());
  if (!referrer) {
    return res.status(404).json({ error: 'Invalid referral code' });
  }

  if (referrer.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot refer yourself' });
  }

  const user = getUserById.get(req.user.id);

  try {
    insertReferral.run({
      id: uuidv4(),
      referrer_user_id: referrer.id,
      referred_email: user.email,
      referred_user_id: req.user.id,
      status: 'pending',
    });
    res.json({ success: true, message: 'Referral code applied successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to apply referral code' });
  }
});

// ── POST /api/referrals/complete (internal — called after first session) ────

router.post('/complete', requireAuth, (req, res) => {
  const referral = getReferralByReferredUser.get(req.user.id);
  if (!referral || referral.status !== 'pending') {
    return res.json({ success: true, rewarded: false });
  }

  try {
    // Mark referral as completed
    completeReferral.run(referral.id);

    // Grant rewards
    addBonusSessions.run(2, referral.referrer_user_id); // referrer gets +2
    addBonusSessions.run(1, req.user.id);               // referred gets +1
    incrementReferralCount.run(referral.referrer_user_id);

    // Record rewards
    insertReward.run({
      id: uuidv4(),
      user_id: referral.referrer_user_id,
      type: 'referral_bonus',
      description: 'Referral completed — +2 bonus sessions',
    });
    insertReward.run({
      id: uuidv4(),
      user_id: req.user.id,
      type: 'referred_bonus',
      description: 'Joined via referral — +1 bonus session',
    });

    rewardReferral.run(referral.id);

    res.json({ success: true, rewarded: true, bonusEarned: 1 });
  } catch (err) {
    console.error('Referral completion error:', err);
    res.status(500).json({ error: 'Failed to complete referral' });
  }
});

// ── GET /api/referrals/user-sessions ───────────────────────────────────────

router.get('/user-sessions', requireAuth, (req, res) => {
  const sessions = getSessionsByUserId.all(req.user.id);

  const result = sessions.map(s => {
    let metadata = {};
    try { metadata = JSON.parse(s.metadata || '{}'); } catch { /* ignore */ }
    const duration = s.end_time && s.start_time ? s.end_time - s.start_time : 0;
    return {
      id: s.id,
      title: s.title,
      humanScore: s.human_score,
      startTime: s.start_time,
      endTime: s.end_time,
      createdAt: s.created_at,
      duration,
      wordCount: metadata.wordCount || 0,
      avgWPM: metadata.avgWPM || 0,
    };
  });

  res.json({ sessions: result });
});

module.exports = router;
