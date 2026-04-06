/**
 * Server-side mirror of the frontend humanScore algorithm.
 * Recomputes the score from raw events to detect client-side manipulation.
 *
 * Scoring logic:
 * - Base score starts at 100
 * - Deductions for signals that suggest non-human writing:
 *   - Large paste events (>50 chars in one event): -15 per occurrence
 *   - Abnormally high typing speed (>200 WPM sustained): -10
 *   - No pause events (humans pause while thinking): -20
 *   - Very short session (<30s): -25
 *   - Copy events: -5 per occurrence (max -20)
 */

const PASTE_THRESHOLD = 50;         // chars in a single paste event
const MAX_HUMAN_WPM = 200;          // above this = suspicious
const MIN_HUMAN_SESSION_MS = 30000; // 30 seconds
const PAUSE_THRESHOLD_MS = 2000;    // gap counts as a "thinking pause"

function recomputeScore(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return 0;
  }

  let score = 100;
  let pauses = 0;
  let largePasstes = 0;
  let copyEvents = 0;
  let totalCharsTyped = 0;
  let totalTypingMs = 0;

  const sorted = [...events].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const sessionDuration = (sorted[sorted.length - 1].timestamp || 0) - (sorted[0].timestamp || 0);

  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i];
    const type = event.type || event.eventType;

    if (type === 'paste') {
      const chars = (event.text || event.data || '').length;
      if (chars > PASTE_THRESHOLD) {
        largePasstes++;
      }
    }

    if (type === 'copy') {
      copyEvents++;
    }

    if (type === 'keydown' || type === 'input') {
      const chars = (event.text || event.data || ' ').length;
      totalCharsTyped += chars;

      if (i > 0) {
        const gap = (event.timestamp || 0) - (sorted[i - 1].timestamp || 0);
        if (gap < PAUSE_THRESHOLD_MS && gap > 0) {
          totalTypingMs += gap;
        } else if (gap >= PAUSE_THRESHOLD_MS) {
          pauses++;
        }
      }
    }
  }

  // Deduct for large paste events
  score -= largePasstes * 15;

  // Deduct for copy events (cap at -20)
  score -= Math.min(copyEvents * 5, 20);

  // Deduct if no pauses detected (likely pasted all at once)
  if (pauses === 0 && totalCharsTyped > 100) {
    score -= 20;
  }

  // Deduct for very short session
  if (sessionDuration < MIN_HUMAN_SESSION_MS && totalCharsTyped > 50) {
    score -= 25;
  }

  // Deduct for sustained superhuman typing speed
  if (totalTypingMs > 0) {
    const wordsTyped = totalCharsTyped / 5;
    const wpm = wordsTyped / (totalTypingMs / 60000);
    if (wpm > MAX_HUMAN_WPM) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { recomputeScore };
