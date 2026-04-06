import type { KeystrokeEvent, LayerScore } from '../types';

export function analyzeCognitivePatterns(events: KeystrokeEvent[]): LayerScore {
  const keydowns = events.filter(e => e.type === 'keydown');

  if (keydowns.length < 20) {
    return {
      score: 50,
      confidence: 0,
      flags: ['insufficient_data'],
      rawMetrics: { sampleSize: keydowns.length },
    };
  }

  // Pre-word pauses: gaps > 200ms after spacebar
  // (humans pause to retrieve the next word; transcribers don't)
  const preWordPauses: number[] = [];
  // Pre-sentence pauses: gaps > 300ms after sentence-ending punctuation
  const preSentencePauses: number[] = [];
  const sentenceEnders = new Set(['.', '!', '?']);
  // Paragraph transitions: pauses after Enter
  const paragraphTransitions: number[] = [];

  for (let i = 1; i < keydowns.length; i++) {
    const prev = keydowns[i - 1];
    const curr = keydowns[i];
    const gap = curr.timestamp - prev.timestamp;

    if (prev.key === ' ' && gap > 200) preWordPauses.push(gap);
    if (sentenceEnders.has(prev.key) && gap > 300) preSentencePauses.push(gap);
    if (prev.key === 'Enter' && gap > 100) paragraphTransitions.push(gap);
  }

  const avgPreWordPause =
    preWordPauses.length > 0
      ? preWordPauses.reduce((a, b) => a + b, 0) / preWordPauses.length
      : 0;
  const avgPreSentencePause =
    preSentencePauses.length > 0
      ? preSentencePauses.reduce((a, b) => a + b, 0) / preSentencePauses.length
      : 0;
  const avgParagraphPause =
    paragraphTransitions.length > 0
      ? paragraphTransitions.reduce((a, b) => a + b, 0) / paragraphTransitions.length
      : 0;

  // Ideation bursts: sequences of 5+ keystrokes at < 150ms each (flow state)
  // Stuck points: single gaps > 5s mid-sentence (cognitive effort)
  const FLOW_IKI = 150;
  const STUCK_IKI = 5000;
  let ideationBursts = 0;
  let stuckPoints = 0;
  let flowRun = 0;

  for (let i = 1; i < keydowns.length; i++) {
    const iki = keydowns[i].timestamp - keydowns[i - 1].timestamp;
    if (iki < FLOW_IKI) {
      flowRun++;
      if (flowRun === 5) ideationBursts++; // count once per burst onset
    } else {
      flowRun = 0;
    }
    if (iki > STUCK_IKI) stuckPoints++;
  }

  // Fatigue signature: WPM in first third vs last third
  // Human writers slow down; transcribers maintain constant pace
  let fatigueSignature = false;
  const thirdSize = Math.floor(keydowns.length / 3);
  if (thirdSize >= 10) {
    const firstThird = keydowns.slice(0, thirdSize);
    const lastThird = keydowns.slice(2 * thirdSize);
    const firstDuration =
      firstThird[thirdSize - 1].timestamp - firstThird[0].timestamp;
    const lastDuration =
      lastThird[lastThird.length - 1].timestamp - lastThird[0].timestamp;
    const firstRate = firstDuration > 0 ? thirdSize / firstDuration : 0;
    const lastRate = lastDuration > 0 ? thirdSize / lastDuration : 0;
    fatigueSignature = firstRate > 0 && lastRate < firstRate * 0.8;
  }

  const flags: string[] = [];
  let cognitiveScore = 50;

  // Pre-word pauses indicate word retrieval — strong human signal
  if (avgPreWordPause > 400) cognitiveScore += 20;
  else if (avgPreWordPause > 200) cognitiveScore += 10;
  else if (preWordPauses.length > 10 && avgPreWordPause < 100) {
    flags.push('no_pre_word_thinking_pauses');
    cognitiveScore -= 20;
  }

  // Pre-sentence pauses indicate sentence planning
  if (avgPreSentencePause > 1500) cognitiveScore += 15;
  else if (avgPreSentencePause > 600) cognitiveScore += 8;

  // Flow bursts indicate genuine creative output
  if (ideationBursts > 5) cognitiveScore += 10;

  // Stuck points indicate real cognitive effort
  if (stuckPoints > 2) cognitiveScore += 5;

  // Fatigue is a strong human authenticity signal
  if (fatigueSignature) {
    cognitiveScore += 15;
  } else if (keydowns.length > 500) {
    flags.push('no_fatigue_on_long_session');
    cognitiveScore -= 10;
  }

  cognitiveScore = Math.max(0, Math.min(100, cognitiveScore));
  const confidence = Math.min(1, keydowns.length / 300);

  return {
    score: cognitiveScore,
    confidence,
    flags,
    rawMetrics: {
      preWordPauseCount: preWordPauses.length,
      avgPreWordPause,
      preSentencePauseCount: preSentencePauses.length,
      avgPreSentencePause,
      ideationBursts,
      stuckPoints,
      avgParagraphPause,
      fatigueSignature,
      sampleSize: keydowns.length,
    },
  };
}
