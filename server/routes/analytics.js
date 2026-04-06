const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');

const router = express.Router();

// Ensure analytics table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    event TEXT NOT NULL,
    props TEXT,
    timestamp INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
  )
`);
db.exec('CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event)');
db.exec('CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)');

const insertEvent = db.prepare(`
  INSERT INTO analytics_events (id, event, props, timestamp, created_at)
  VALUES (@id, @event, @props, @timestamp, unixepoch())
`);

// POST /api/analytics/event — log a single analytics event
router.post('/event', (req, res) => {
  try {
    const { event, props, timestamp } = req.body;

    if (!event || typeof event !== 'string') {
      return res.status(400).json({ error: 'event is required' });
    }

    insertEvent.run({
      id: uuidv4(),
      event: event.slice(0, 100),
      props: props ? JSON.stringify(props) : null,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Analytics event error:', err);
    res.json({ ok: true }); // Never fail client-side for analytics
  }
});

// GET /api/analytics/summary — event counts for last 7 and 30 days
router.get('/summary', (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 86400;
    const thirtyDaysAgo = now - 30 * 86400;

    const last7 = db.prepare(`
      SELECT event, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ?
      GROUP BY event
      ORDER BY count DESC
    `).all(sevenDaysAgo);

    const last30 = db.prepare(`
      SELECT event, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ?
      GROUP BY event
      ORDER BY count DESC
    `).all(thirtyDaysAgo);

    const total = db.prepare('SELECT COUNT(*) as count FROM analytics_events').get();

    res.json({ last7days: last7, last30days: last30, totalEvents: total.count });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

module.exports = router;
