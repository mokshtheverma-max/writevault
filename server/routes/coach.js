const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const SYSTEM_PROMPT = `You are WriteVault's writing coach. You help students improve their essays WITHOUT writing any content for them. You can suggest structure, point out weak arguments, recommend stronger transitions, and give encouragement. Never write sentences the student should copy. Never produce paragraphs or essay text they could paste. Keep responses under 100 words. Be encouraging and specific.`;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function chat(userMessage) {
  const client = getClient();
  if (!client) {
    throw new Error('AI coach is not configured. Set ANTHROPIC_API_KEY in .env');
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  return response.content[0].text;
}

// ── POST /api/coach/feedback ────────────────────────────────────────────────

router.post('/feedback', requireAuth, async (req, res) => {
  try {
    const { content, sessionDuration, wordCount } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const durationLabel = sessionDuration
      ? `${Math.round(sessionDuration / 60)}min`
      : 'unknown time';

    const text = await chat(
      `Here's my essay so far (${wordCount || 0} words, ${durationLabel} into writing):\n\n${content}\n\nGive me one specific, actionable piece of feedback.`
    );

    res.json({ feedback: text });
  } catch (err) {
    console.error('Coach feedback error:', err.message);
    res.status(500).json({ error: err.message || 'Coach unavailable' });
  }
});

// ── POST /api/coach/unstuck ─────────────────────────────────────────────────

router.post('/unstuck', requireAuth, async (req, res) => {
  try {
    const { content, lastSentence } = req.body;

    const snippet = lastSentence || (content || '').trim().split(/[.!?]\s+/).pop() || '';

    const text = await chat(
      `I'm stuck after writing: '${snippet}'\n\nGive me 3 questions to ask myself to figure out what to write next. Don't write it for me. Format as a numbered list.`
    );

    const questions = text
      .split(/\n/)
      .map(l => l.replace(/^\d+[.)]\s*/, '').trim())
      .filter(l => l.length > 5);

    res.json({ questions: questions.length > 0 ? questions : [text] });
  } catch (err) {
    console.error('Coach unstuck error:', err.message);
    res.status(500).json({ error: err.message || 'Coach unavailable' });
  }
});

// ── POST /api/coach/structure ───────────────────────────────────────────────

router.post('/structure', requireAuth, async (req, res) => {
  try {
    const { content, assignmentType } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const typeHint = assignmentType ? ` This is a ${assignmentType}.` : '';

    const text = await chat(
      `Review the structure of my essay.${typeHint} Am I missing any important sections? Give me structural feedback only — no rewrites.\n\n${content}`
    );

    const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
    const suggestions = lines.filter(l => /^[-•*]/.test(l) || /^\d+[.)]/.test(l)).map(l => l.replace(/^[-•*\d.)]\s*/, ''));

    res.json({
      feedback: suggestions.length > 0 ? lines.filter(l => !/^[-•*]/.test(l) && !/^\d+[.)]/.test(l)).join(' ') || text : text,
      suggestions: suggestions.length > 0 ? suggestions : [],
    });
  } catch (err) {
    console.error('Coach structure error:', err.message);
    res.status(500).json({ error: err.message || 'Coach unavailable' });
  }
});

// ── POST /api/coach/encourage ───────────────────────────────────────────────

router.post('/encourage', requireAuth, async (req, res) => {
  try {
    const { wordCount, timeSpent, pauseCount } = req.body;

    const timeLabel = timeSpent
      ? `${Math.round(timeSpent / 60)} minutes`
      : 'some time';

    const text = await chat(
      `You've written ${wordCount || 0} words in ${timeLabel} with ${pauseCount || 0} thinking pauses. Give a 1-sentence encouragement.`
    );

    res.json({ message: text });
  } catch (err) {
    console.error('Coach encourage error:', err.message);
    res.status(500).json({ error: err.message || 'Coach unavailable' });
  }
});

module.exports = router;
