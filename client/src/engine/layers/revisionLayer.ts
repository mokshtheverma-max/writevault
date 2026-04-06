import type { KeystrokeEvent, LayerScore } from '../types';

export function analyzeRevisionPatterns(
  events: KeystrokeEvent[],
  content: string,
): LayerScore {
  const keydowns = events.filter(e => e.type === 'keydown');
  const totalKeystrokes = keydowns.length;

  if (totalKeystrokes < 10) {
    return {
      score: 50,
      confidence: 0,
      flags: ['insufficient_data'],
      rawMetrics: { sampleSize: totalKeystrokes },
    };
  }

  const deletionKeys = new Set(['Backspace', 'Delete']);
  const deletions = keydowns.filter(e => deletionKeys.has(e.key));
  // Printable = single character keys (letters, numbers, punctuation)
  const printableKeystrokes = keydowns.filter(e => e.key.length === 1);

  const deletionRate = deletions.length / totalKeystrokes;
  const revisionDensity =
    printableKeystrokes.length > 0
      ? deletions.length / printableKeystrokes.length
      : 0;

  // Multi-word deletion: count streaks of 5+ consecutive Backspaces
  let multiWordDeletions = 0;
  let consecutiveDeletions = 0;
  for (const event of keydowns) {
    if (event.key === 'Backspace') {
      consecutiveDeletions++;
      if (consecutiveDeletions === 5) multiWordDeletions++;
    } else {
      consecutiveDeletions = 0;
    }
  }

  // Correction latency: time between previous key and each Backspace
  const correctionLatencies: number[] = [];
  for (let i = 1; i < keydowns.length; i++) {
    if (keydowns[i].key === 'Backspace') {
      const latency = keydowns[i].timestamp - keydowns[i - 1].timestamp;
      if (latency > 0 && latency < 5000) correctionLatencies.push(latency);
    }
  }
  const avgCorrectionLatency =
    correctionLatencies.length > 0
      ? correctionLatencies.reduce((a, b) => a + b, 0) / correctionLatencies.length
      : 0;

  // Paragraph revision map (requires cursor position data for accuracy;
  // approximated here from paragraph count)
  const paragraphs = content.split(/\n\n+/);
  const paragraphRevisions: Record<number, number> = {};
  for (let i = 0; i < paragraphs.length; i++) {
    paragraphRevisions[i] = 0;
  }

  // Revision score
  // No deletions = 0 (paste/copy detected)
  // 15-25% revision density = 75-100 (authentic essay range)
  const flags: string[] = [];
  let revisionScore: number;

  if (deletionRate === 0) {
    revisionScore = 0;
    flags.push('no_deletions_detected');
    flags.push('possible_paste_or_direct_input');
  } else if (revisionDensity < 0.05) {
    revisionScore = 20;
    flags.push('very_low_revision_density');
  } else if (revisionDensity < 0.10) {
    revisionScore = 45;
  } else if (revisionDensity < 0.15) {
    revisionScore = 65;
  } else if (revisionDensity < 0.25) {
    revisionScore = 85;
  } else if (revisionDensity < 0.40) {
    revisionScore = 95;
  } else {
    revisionScore = 75;
    flags.push('very_high_deletion_rate');
  }

  if (multiWordDeletions >= 3) revisionScore = Math.min(100, revisionScore + 5);

  const confidence = Math.min(1, totalKeystrokes / 200);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    score: revisionScore,
    confidence,
    flags,
    rawMetrics: {
      deletionRate,
      revisionDensity,
      totalKeystrokes,
      deletionCount: deletions.length,
      printableKeystrokes: printableKeystrokes.length,
      multiWordDeletions,
      correctionLatency: avgCorrectionLatency,
      wordCount,
      paragraphRevisions,
    },
  };
}
