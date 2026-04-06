const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { validateSession, computeHash } = require('../middleware/validateSession');
const { verifyLimiter } = require('../middleware/rateLimiter');
const {
  insertSession,
  getSessionById,
  getSessionByHash,
  insertVerification,
  getVerificationCount,
  incrementSessionsUsed,
} = require('../db/database');
const { recomputeScore } = require('../utils/scoring');
const { checkSessionLimit } = require('../middleware/planGate');

const router = express.Router();

// Optionally attach user from Authorization header (non-blocking)
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const { verifyToken } = require('../utils/jwt');
      const { getUserById } = require('../db/database');
      const payload = verifyToken(header.slice(7));
      if (payload) {
        const user = getUserById.get(payload.userId);
        if (user) req.user = user;
      }
    } catch { /* proceed without auth */ }
  }
  next();
}

// POST /api/sessions — store a new writing session
router.post('/', optionalAuth, checkSessionLimit, validateSession, (req, res) => {
  const session = req.body;

  // Server-side score recomputation to prevent manipulation
  const serverScore = recomputeScore(session.events);
  const scoreDrift = Math.abs(serverScore - session.humanScore);
  if (scoreDrift > 5) {
    return res.status(400).json({
      error: 'humanScore does not match server-side recomputation',
      serverScore,
      clientScore: session.humanScore,
    });
  }

  // Re-verify hash server-side
  const hash = computeHash(session.content, session.events);

  const sessionId = uuidv4();
  const row = {
    id: sessionId,
    title: session.title.trim(),
    content: session.content,
    events: JSON.stringify(session.events),
    human_score: session.humanScore,
    sha256_hash: hash,
    start_time: session.startTime,
    end_time: session.endTime,
    metadata: JSON.stringify(session.metadata),
    user_id: req.user?.id || null,
  };

  try {
    insertSession.run(row);
    // Increment sessions_used for authenticated users
    if (req.user?.id) {
      incrementSessionsUsed.run(req.user.id);
    }
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Session with this hash already exists' });
    }
    console.error('Insert session error:', err);
    return res.status(500).json({ error: 'Failed to store session' });
  }

  res.status(201).json({
    sessionId,
    hash,
    verificationUrl: `/api/verify`,
  });
});

// GET /api/sessions/:id — full session with verification log
router.get('/:id', (req, res) => {
  const session = getSessionById.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Log verification attempt
  try {
    insertVerification.run({
      id: uuidv4(),
      session_id: session.id,
      verifier_ip: req.ip,
    });
  } catch (err) {
    console.error('Verification log error:', err);
  }

  const { count } = getVerificationCount.get(session.id);

  res.json({
    ...session,
    events: JSON.parse(session.events),
    metadata: JSON.parse(session.metadata),
    verificationCount: count,
  });
});

// GET /api/sessions/:id/summary — lightweight session summary
router.get('/:id/summary', (req, res) => {
  const session = getSessionById.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { count } = getVerificationCount.get(session.id);

  res.json({
    id: session.id,
    title: session.title,
    humanScore: session.human_score,
    sha256Hash: session.sha256_hash,
    startTime: session.start_time,
    endTime: session.end_time,
    createdAt: session.created_at,
    metadata: JSON.parse(session.metadata),
    verificationCount: count,
  });
});

// GET /api/sessions/:id/events — paginated events
router.get('/:id/events', (req, res) => {
  const session = getSessionById.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(5000, Math.max(1, parseInt(req.query.limit) || 1000));
  const offset = (page - 1) * limit;

  const events = JSON.parse(session.events);
  const total = events.length;
  const paginated = events.slice(offset, offset + limit);

  res.json({
    sessionId: session.id,
    events: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ─── generateObservations ─────────────────────────────────────────────────────

function generateObservations(session, metadata) {
  const observations = [];

  if (metadata.totalPauses > 10) {
    observations.push('Natural thinking pauses detected throughout session');
  } else if (metadata.totalPauses >= 3) {
    observations.push(`${metadata.totalPauses} thinking pauses detected during session`);
  }

  if (metadata.totalDeletions > 20) {
    observations.push(`${metadata.totalDeletions} corrections and revisions detected`);
  } else if (metadata.totalDeletions > 5) {
    observations.push(`${metadata.totalDeletions} editing revisions observed`);
  }

  if (metadata.avgWPM < 60 && metadata.avgWPM > 10) {
    observations.push('Writing speed within normal human range');
  }

  if (metadata.wpmVariance > 15) {
    observations.push('Writing speed varied naturally throughout session');
  }

  if (metadata.cursorJumps > 5) {
    observations.push('Active editing behavior — cursor movements throughout document');
  }

  // Compute paste attempts from events if available
  const events = Array.isArray(session.events) ? session.events : [];
  const pasteAttempts = events.filter(e => e.type === 'paste_attempt').length;
  if (pasteAttempts === 0) {
    observations.push('No paste events detected during session');
  } else {
    observations.push(`${pasteAttempts} paste event(s) were logged during session`);
  }

  if (metadata.longestPause > 30000) {
    const mins = Math.floor(metadata.longestPause / 60000);
    const secs = Math.floor((metadata.longestPause % 60000) / 1000);
    const label = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    observations.push(`Longest pause: ${label} — consistent with research or thinking`);
  }

  if (metadata.revisionDensity >= 0.15) {
    observations.push('High revision density — iterative, authentic composition pattern');
  }

  return observations;
}

// ─── deriveLayerScores ────────────────────────────────────────────────────────

function deriveLayerScores(humanScore, metadata) {
  const wv = metadata.wpmVariance || 0;
  const temporal = wv >= 25 ? 88 : wv >= 10 ? 72 : wv >= 3 ? 50 : 20;

  const wc = Math.max(1, (metadata.wordCount || 100));
  const density = (metadata.totalDeletions || 0) / wc;
  const revision = density >= 0.4 ? 90 : density >= 0.15 ? 78 : density >= 0.05 ? 55 : 25;

  const pauses = metadata.totalPauses || 0;
  const cognitive = pauses >= 15 ? 88 : pauses >= 8 ? 75 : pauses >= 3 ? 58 : 22;

  const wpm = metadata.avgWPM || 0;
  const biometric = (wpm > 10 && wpm < 120) ? Math.min(90, 50 + wv * 0.8) : 40;

  const linguistic = Math.round((humanScore * 0.9 + temporal * 0.1));

  return {
    temporal: { score: temporal, interpretation: temporal >= 75 ? 'Natural timing patterns detected' : temporal >= 50 ? 'Some timing variation observed' : 'Limited timing variation' },
    revision: { score: revision, interpretation: revision >= 75 ? 'Normal editing behavior observed' : revision >= 50 ? 'Moderate revision activity' : 'Low revision activity' },
    cognitive: { score: cognitive, interpretation: cognitive >= 75 ? 'Thinking pauses present throughout' : cognitive >= 50 ? 'Some cognitive pauses observed' : 'Few thinking pauses detected' },
    biometric: { score: Math.round(biometric), interpretation: biometric >= 75 ? 'Consistent personal typing rhythm' : biometric >= 50 ? 'Some rhythmic consistency observed' : 'Limited biometric data' },
    linguistic: { score: Math.min(100, Math.max(0, linguistic)), interpretation: linguistic >= 75 ? 'Writing style within normal range' : linguistic >= 50 ? 'Some linguistic variation observed' : 'Writing style signals detected' },
  };
}

// GET /api/sessions/:id/teacher-view — educator-facing verified session report
router.get('/:id/teacher-view', (req, res) => {
  const idOrHash = req.params.id;

  // Try lookup by UUID first, then by hash
  let session = getSessionById.get(idOrHash);
  if (!session) {
    session = getSessionByHash.get(idOrHash.toLowerCase().trim());
  }

  if (!session) {
    return res.status(404).json({
      error: 'No session found. The ID or hash may be incorrect, or the student has not submitted their session to WriteVault servers.',
    });
  }

  // Log teacher verification
  try {
    insertVerification.run({
      id: uuidv4(),
      session_id: session.id,
      verifier_ip: req.ip,
    });
  } catch (err) {
    console.error('Teacher verification log error:', err);
  }

  const { count } = getVerificationCount.get(session.id);

  const events = JSON.parse(session.events);
  const metadata = JSON.parse(session.metadata);

  // Server-side score recomputation
  const serverScore = recomputeScore(events);

  // Compute word count from content
  const wordCount = session.content.trim().split(/\s+/).filter(Boolean).length;

  // Generate behavioral observations
  const behavioralObservations = generateObservations({ events }, metadata);

  // Derive 5-layer scores
  const layerScores = deriveLayerScores(serverScore, { ...metadata, wordCount });

  // Build writing timeline
  const keydowns = events.filter(e => e.type === 'keydown');
  const startMs = session.start_time;
  const endMs = session.end_time;
  const durationMs = endMs - startMs;
  const pauseEvents = events.filter(e => e.type === 'pause' && (e.pauseDuration || 0) > 2000);
  const longestPause = metadata.longestPause || 0;

  const writingTimeline = {
    sessionBegan: new Date(startMs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    activePeriodMinutes: Math.round(durationMs / 60000),
    naturalBreaksDetected: pauseEvents.length,
    longestPauseMs: longestPause,
    longestPauseFormatted: longestPause > 60000
      ? `${Math.floor(longestPause / 60000)}m ${Math.floor((longestPause % 60000) / 1000)}s`
      : `${Math.floor(longestPause / 1000)}s`,
    sessionCompleted: new Date(endMs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };

  res.json({
    id: session.id,
    title: session.title,
    humanScore: serverScore,
    sha256Hash: session.sha256_hash,
    startTime: session.start_time,
    endTime: session.end_time,
    createdAt: session.created_at,
    wordCount,
    metadata,
    verificationCount: count,
    behavioralObservations,
    layerScores,
    writingTimeline,
    verifiedAt: Math.floor(Date.now() / 1000),
    retrieved_independently: true,
  });
});

// POST /api/verify — verify by SHA256 hash
router.post('/verify', verifyLimiter, (req, res) => {
  const { hash } = req.body;
  if (!hash || typeof hash !== 'string') {
    return res.status(400).json({ error: 'hash is required' });
  }

  const session = getSessionByHash.get(hash.toLowerCase().trim());
  if (!session) {
    return res.status(404).json({ error: 'No session found with this hash' });
  }

  try {
    insertVerification.run({
      id: uuidv4(),
      session_id: session.id,
      verifier_ip: req.ip,
    });
  } catch (err) {
    console.error('Verification log error:', err);
  }

  const { count } = getVerificationCount.get(session.id);

  res.json({
    verified: true,
    session: {
      id: session.id,
      title: session.title,
      humanScore: session.human_score,
      sha256Hash: session.sha256_hash,
      startTime: session.start_time,
      endTime: session.end_time,
      createdAt: session.created_at,
      metadata: JSON.parse(session.metadata),
    },
    verifiedAt: Math.floor(Date.now() / 1000),
    verificationCount: count,
  });
});

module.exports = router;
