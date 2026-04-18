const express = require('express');
const { randomUUID } = require('crypto');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const {
  getSessionByHash,
  getSessionById,
  insertVerification,
  getRecentVerificationsByIp,
  countVerificationsByIp,
} = require('../db/database');

const router = express.Router();

// GET /api/teacher/dashboard — teacher dashboard summary
router.get('/dashboard', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const ip = req.ip;
    const { count } = await countVerificationsByIp(ip);
    const recentRows = await getRecentVerificationsByIp(ip, 10);

    const recentVerifications = recentRows.map(r => ({
      id: r.id,
      sessionId: r.session_id,
      title: r.title,
      humanScore: r.human_score,
      sha256Hash: r.sha256_hash,
      verifiedAt: r.verified_at,
      createdAt: r.created_at,
    }));

    res.json({
      totalVerified: count || 0,
      recentVerifications,
      sharedSessions: [],
    });
  } catch (err) {
    console.error('Teacher dashboard error:', err);
    res.status(500).json({ error: 'Failed to load teacher dashboard' });
  }
});

// POST /api/teacher/verify-bulk — bulk verify by hashes or IDs
router.post('/verify-bulk', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { hashes } = req.body || {};
    if (!Array.isArray(hashes)) {
      return res.status(400).json({ error: 'hashes must be an array' });
    }
    if (hashes.length === 0) {
      return res.json({ results: [] });
    }
    if (hashes.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 hashes at once' });
    }

    const results = [];
    for (const raw of hashes) {
      const input = String(raw || '').trim();
      if (!input) {
        results.push({ input: raw, found: false, error: 'Empty input' });
        continue;
      }

      let session = await getSessionById(input);
      if (!session) {
        session = await getSessionByHash(input.toLowerCase());
      }

      if (!session) {
        results.push({ input, found: false, error: 'Not found' });
        continue;
      }

      try {
        await insertVerification({
          id: randomUUID(),
          session_id: session.id,
          verifier_ip: req.ip,
        });
      } catch { /* non-fatal */ }

      const metadata = JSON.parse(session.metadata);
      const wordCount = session.content.trim().split(/\s+/).filter(Boolean).length;

      results.push({
        input,
        found: true,
        id: session.id,
        title: session.title,
        humanScore: session.human_score,
        sha256Hash: session.sha256_hash,
        startTime: session.start_time,
        endTime: session.end_time,
        createdAt: session.created_at,
        wordCount,
        metadata,
      });
    }

    res.json({ results });
  } catch (err) {
    console.error('Teacher bulk verify error:', err);
    res.status(500).json({ error: 'Bulk verification failed' });
  }
});

module.exports = router;
