const crypto = require('crypto');

const REQUIRED_FIELDS = ['title', 'content', 'events', 'humanScore', 'sha256Hash', 'startTime', 'endTime', 'metadata'];

function computeHash(content, events) {
  const payload = content + JSON.stringify(events);
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

function validateSession(req, res, next) {
  const session = req.body;

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (session[field] === undefined || session[field] === null) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  // Validate types
  if (typeof session.title !== 'string' || session.title.trim() === '') {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (typeof session.content !== 'string') {
    return res.status(400).json({ error: 'content must be a string' });
  }
  if (!Array.isArray(session.events)) {
    return res.status(400).json({ error: 'events must be an array' });
  }
  if (typeof session.humanScore !== 'number' || session.humanScore < 0 || session.humanScore > 100) {
    return res.status(400).json({ error: 'humanScore must be a number between 0 and 100' });
  }
  if (typeof session.startTime !== 'number' || typeof session.endTime !== 'number') {
    return res.status(400).json({ error: 'startTime and endTime must be numbers' });
  }
  if (session.endTime < session.startTime) {
    return res.status(400).json({ error: 'endTime must be >= startTime' });
  }

  // Verify SHA256 hash matches content + events
  const expectedHash = computeHash(session.content, session.events);
  if (session.sha256Hash !== expectedHash) {
    return res.status(400).json({ error: 'SHA256 hash does not match content and events' });
  }

  next();
}

module.exports = { validateSession, computeHash };
