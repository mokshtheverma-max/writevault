const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');

const router = express.Router();

// POST /api/analytics/event — log a single analytics event
router.post('/event', async (req, res) => {
  try {
    const { event, props, timestamp } = req.body;

    if (!event || typeof event !== 'string') {
      return res.status(400).json({ error: 'event is required' });
    }

    await db.run(`
      INSERT INTO analytics_events (id, event, props, timestamp, created_at)
      VALUES (?, ?, ?, ?, unixepoch())
    `, [
      uuidv4(),
      event.slice(0, 100),
      props ? JSON.stringify(props) : null,
      timestamp || Math.floor(Date.now() / 1000),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Analytics event error:', err);
    res.json({ ok: true }); // Never fail client-side for analytics
  }
});

// GET /api/analytics/summary — event counts for last 7 and 30 days
router.get('/summary', async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 86400;
    const thirtyDaysAgo = now - 30 * 86400;

    const last7 = await db.all(`
      SELECT event, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ?
      GROUP BY event
      ORDER BY count DESC
    `, [sevenDaysAgo]);

    const last30 = await db.all(`
      SELECT event, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ?
      GROUP BY event
      ORDER BY count DESC
    `, [thirtyDaysAgo]);

    const total = await db.get('SELECT COUNT(*) as count FROM analytics_events');

    res.json({ last7days: last7, last30days: last30, totalEvents: total.count });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

module.exports = router;
