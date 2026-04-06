import type { KeystrokeEvent, LayerScore, BurstEvent } from '../types';

export function analyzeTemporalPatterns(events: KeystrokeEvent[]): LayerScore {
  const keydowns = events.filter(e => e.type === 'keydown');

  if (keydowns.length < 2) {
    return {
      score: 50,
      confidence: 0,
      flags: ['insufficient_data'],
      rawMetrics: { sampleSize: keydowns.length },
    };
  }

  // Inter-keystroke intervals
  const ikis: number[] = [];
  for (let i = 1; i < keydowns.length; i++) {
    ikis.push(keydowns[i].timestamp - keydowns[i - 1].timestamp);
  }

  const meanIKI = ikis.reduce((a, b) => a + b, 0) / ikis.length;
  const variance = ikis.reduce((sum, x) => sum + (x - meanIKI) ** 2, 0) / ikis.length;
  const stdDevIKI = Math.sqrt(variance);
  const coefficientOfVariation = meanIKI > 0 ? stdDevIKI / meanIKI : 0;

  // Pause distribution histogram
  const pauseDistribution = {
    '0-500ms': 0,
    '500ms-2s': 0,
    '2s-10s': 0,
    '10s-30s': 0,
    '30s+': 0,
  };
  for (const iki of ikis) {
    if (iki < 500) pauseDistribution['0-500ms']++;
    else if (iki < 2000) pauseDistribution['500ms-2s']++;
    else if (iki < 10000) pauseDistribution['2s-10s']++;
    else if (iki < 30000) pauseDistribution['10s-30s']++;
    else pauseDistribution['30s+']++;
  }

  // Burst pattern detection: acceleration/deceleration sequences
  const BURST_THRESHOLD_MS = 200;
  const MIN_BURST_LENGTH = 4;
  const burstPattern: BurstEvent[] = [];
  let inBurst = false;
  let burstStart = 0;

  for (let i = 0; i < ikis.length; i++) {
    if (ikis[i] < BURST_THRESHOLD_MS && !inBurst) {
      inBurst = true;
      burstStart = i;
    } else if (ikis[i] >= BURST_THRESHOLD_MS && inBurst) {
      inBurst = false;
      const burstLen = i - burstStart;
      if (burstLen >= MIN_BURST_LENGTH) {
        const burstIKIs = ikis.slice(burstStart, i);
        const avgIKI = burstIKIs.reduce((a, b) => a + b, 0) / burstIKIs.length;
        burstPattern.push({
          startIndex: burstStart,
          endIndex: i,
          type: avgIKI < meanIKI ? 'acceleration' : 'deceleration',
          avgIKI,
        });
      }
    }
  }

  // Rhythm score: higher stddev = more human-like irregularity
  // Perfect transcription: stddev < 50ms (red flag)
  // Normal human writing: stddev > 150ms (authentic)
  const flags: string[] = [];
  let rhythmScore: number;

  if (stdDevIKI < 30) {
    rhythmScore = 5;
    flags.push('extremely_regular_timing');
  } else if (stdDevIKI < 50) {
    rhythmScore = 15;
    flags.push('suspiciously_regular_timing');
  } else if (stdDevIKI < 100) {
    rhythmScore = 40;
  } else if (stdDevIKI < 150) {
    rhythmScore = 65;
  } else if (stdDevIKI < 300) {
    rhythmScore = 85;
  } else {
    rhythmScore = 95;
  }

  if (coefficientOfVariation > 0.5) rhythmScore = Math.min(100, rhythmScore + 10);
  if (coefficientOfVariation < 0.2) {
    rhythmScore = Math.max(0, rhythmScore - 20);
    flags.push('low_coefficient_of_variation');
  }

  const confidence = Math.min(1, ikis.length / 200);

  return {
    score: rhythmScore,
    confidence,
    flags,
    rawMetrics: {
      interKeystrokeIntervals: ikis,
      meanIKI,
      stdDevIKI,
      coefficientOfVariation,
      pauseDistribution,
      burstPattern,
      rhythmScore,
      sampleSize: ikis.length,
    },
  };
}
