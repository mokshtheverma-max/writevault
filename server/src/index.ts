import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10mb' }));

interface SessionRecord {
  hash: string;
  title: string;
  score: number;
  verdict: string;
  wordCount: number;
  date: number;
  storedAt: number;
}

// In-memory store: hash -> SessionRecord
const sessions = new Map<string, SessionRecord>();

// POST /api/sessions — store a session record
app.post('/api/sessions', (req, res) => {
  const { hash, title, score, verdict, wordCount, date } = req.body;

  if (!hash || typeof hash !== 'string' || hash.length < 32) {
    return res.status(400).json({ error: 'Invalid hash' });
  }

  const record: SessionRecord = {
    hash,
    title: title || 'Untitled',
    score: Number(score) || 0,
    verdict: verdict || 'UNKNOWN',
    wordCount: Number(wordCount) || 0,
    date: Number(date) || Date.now(),
    storedAt: Date.now(),
  };

  sessions.set(hash, record);
  return res.status(201).json({ ok: true, sessionId: `WV-${hash.substring(0, 6).toUpperCase()}-${hash.substring(6, 12).toUpperCase()}` });
});

// GET /api/verify/:hash — look up a session by hash
app.get('/api/verify/:hash', (req, res) => {
  const { hash } = req.params;

  // Support partial hash lookup (first 16+ chars)
  if (hash.length >= 16) {
    for (const [key, record] of sessions.entries()) {
      if (key.startsWith(hash) || key === hash) {
        return res.json({
          found: true,
          hash: record.hash,
          title: record.title,
          score: record.score,
          verdict: record.verdict,
          wordCount: record.wordCount,
          date: record.date,
          sessionId: `WV-${record.hash.substring(0, 6).toUpperCase()}-${record.hash.substring(6, 12).toUpperCase()}`,
        });
      }
    }
  }

  return res.status(404).json({ found: false, error: 'No session found with this hash' });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, sessions: sessions.size, uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`WriteVault server running on http://localhost:${PORT}`);
});
