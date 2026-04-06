import type { KeystrokeEvent, LayerScore } from '../types';

export function analyzeBiometricSignature(events: KeystrokeEvent[]): LayerScore {
  const keydowns = events.filter(e => e.type === 'keydown');

  if (keydowns.length < 20) {
    return {
      score: 50,
      confidence: 0,
      flags: ['insufficient_data'],
      rawMetrics: { sampleSize: keydowns.length },
    };
  }

  // Dwell times: duration each key is held (keydown → matching keyup)
  const dwellTimes: Record<string, number[]> = {};
  const dwellMap = new Map<string, number>();

  for (const event of events) {
    if (event.type === 'keydown') {
      dwellMap.set(event.key, event.timestamp);
    } else {
      const downTime = dwellMap.get(event.key);
      if (downTime !== undefined) {
        const dwell = event.timestamp - downTime;
        if (dwell >= 0 && dwell < 1000) {
          if (!dwellTimes[event.key]) dwellTimes[event.key] = [];
          dwellTimes[event.key].push(dwell);
        }
        dwellMap.delete(event.key);
      }
    }
  }

  // Flight times: gap between key-up and the next key-down
  const flightTimes: number[] = [];
  let lastKeyupTime: number | null = null;

  for (const event of events) {
    if (event.type === 'keyup') {
      lastKeyupTime = event.timestamp;
    } else if (event.type === 'keydown' && lastKeyupTime !== null) {
      const flight = event.timestamp - lastKeyupTime;
      if (flight >= 0 && flight < 2000) flightTimes.push(flight);
      lastKeyupTime = null;
    }
  }

  // Digram latencies for common English two-key sequences
  const commonDigrams = new Set([
    'th', 'he', 'in', 'er', 'an', 'on', 'at', 'to', 'nd', 'or', 'ti', 'es',
  ]);
  const digramLatencies: Record<string, number[]> = {};

  for (let i = 0; i < keydowns.length - 1; i++) {
    const digram = (keydowns[i].key + keydowns[i + 1].key).toLowerCase();
    if (commonDigrams.has(digram)) {
      const latency = keydowns[i + 1].timestamp - keydowns[i].timestamp;
      if (latency > 0 && latency < 2000) {
        if (!digramLatencies[digram]) digramLatencies[digram] = [];
        digramLatencies[digram].push(latency);
      }
    }
  }

  // Hand alternation ratio (QWERTY layout)
  const leftKeys = new Set('qwertasdfgzxcvb');
  const rightKeys = new Set('yuiophjklnm');
  let alternations = 0;
  let sameHand = 0;

  for (let i = 0; i < keydowns.length - 1; i++) {
    const k1 = keydowns[i].key.toLowerCase();
    const k2 = keydowns[i + 1].key.toLowerCase();
    const k1l = leftKeys.has(k1);
    const k1r = rightKeys.has(k1);
    const k2l = leftKeys.has(k2);
    const k2r = rightKeys.has(k2);

    if ((k1l && k2r) || (k1r && k2l)) alternations++;
    else if ((k1l && k2l) || (k1r && k2r)) sameHand++;
  }

  const total = alternations + sameHand;
  const handAlternationRatio = total > 0 ? alternations / total : 0;

  // Biometric consistency: coefficient of variation of dwell times per key
  // Human CV is typically 0.2–0.4. Very low = robotic; very high = erratic.
  const dwellCVs: number[] = [];
  for (const times of Object.values(dwellTimes)) {
    if (times.length >= 3) {
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const sd = Math.sqrt(
        times.reduce((s, x) => s + (x - mean) ** 2, 0) / times.length,
      );
      if (mean > 0) dwellCVs.push(sd / mean);
    }
  }

  const avgDwellCV =
    dwellCVs.length > 0
      ? dwellCVs.reduce((a, b) => a + b, 0) / dwellCVs.length
      : 0.5;

  // Score consistency: peak at CV ≈ 0.3 (typical human), fall off on either side
  const biometricConsistency = Math.max(
    0,
    1 - Math.abs(avgDwellCV - 0.3) / 0.5,
  );

  const flags: string[] = [];
  let biometricScore = 40;

  const uniqueKeysTracked = Object.keys(dwellTimes).length;
  if (uniqueKeysTracked > 15) biometricScore += 10;

  if (biometricConsistency > 0.6) biometricScore += 20;
  else if (biometricConsistency < 0.2) {
    flags.push('inconsistent_biometric_patterns');
    biometricScore -= 10;
  }

  // Natural English hand alternation is ~0.45–0.65
  if (handAlternationRatio >= 0.4 && handAlternationRatio <= 0.7) {
    biometricScore += 15;
  } else if (total > 20 && (handAlternationRatio < 0.25 || handAlternationRatio > 0.85)) {
    flags.push('unusual_hand_alternation_ratio');
    biometricScore -= 5;
  }

  if (Object.keys(digramLatencies).length >= 3) biometricScore += 10;
  if (flightTimes.length > 20) biometricScore += 5;

  biometricScore = Math.max(0, Math.min(100, biometricScore));
  const confidence = Math.min(1, keydowns.length / 500);

  return {
    score: biometricScore,
    confidence,
    flags,
    rawMetrics: {
      dwellTimes,
      flightTimes: flightTimes.slice(0, 50),
      digramLatencies,
      handAlternationRatio,
      biometricConsistency,
      avgDwellCV,
      uniqueKeysTracked,
    },
  };
}
