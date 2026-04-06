import type { WritingDNA } from './types'

// n = new session count (existingCount + 1)
// Recent sessions count 1.5x for recency bias
function weightedAvg(existing: number, incoming: number, n: number): number {
  if (n <= 1) return incoming
  return (existing * (n - 1) + incoming * 1.5) / (n + 0.5)
}

export function mergeDNAWithSession(
  existingDNA: WritingDNA,
  newSessionDNA: Partial<WritingDNA>,
  _sessionWeight: number,
): WritingDNA {
  const n = existingDNA.sessionCount + 1

  function avg(existing: number, incoming: number | undefined): number {
    if (incoming === undefined) return existing
    return weightedAvg(existing, incoming, n)
  }

  return {
    ...existingDNA,
    temporal: {
      meanIKI: avg(existingDNA.temporal.meanIKI, newSessionDNA.temporal?.meanIKI),
      stdDevIKI: avg(existingDNA.temporal.stdDevIKI, newSessionDNA.temporal?.stdDevIKI),
      preferredBurstLength: avg(existingDNA.temporal.preferredBurstLength, newSessionDNA.temporal?.preferredBurstLength),
      avgPauseDuration: avg(existingDNA.temporal.avgPauseDuration, newSessionDNA.temporal?.avgPauseDuration),
      pauseFrequency: avg(existingDNA.temporal.pauseFrequency, newSessionDNA.temporal?.pauseFrequency),
      fatigueRate: avg(existingDNA.temporal.fatigueRate, newSessionDNA.temporal?.fatigueRate),
    },
    revision: {
      personalDeletionRate: avg(existingDNA.revision.personalDeletionRate, newSessionDNA.revision?.personalDeletionRate),
      avgCorrectionLatency: avg(existingDNA.revision.avgCorrectionLatency, newSessionDNA.revision?.avgCorrectionLatency),
      revisionDensity: avg(existingDNA.revision.revisionDensity, newSessionDNA.revision?.revisionDensity),
      backtrackFrequency: avg(existingDNA.revision.backtrackFrequency, newSessionDNA.revision?.backtrackFrequency),
    },
    biometric: {
      digramLatencies: mergeDigramLatencies(
        existingDNA.biometric.digramLatencies,
        newSessionDNA.biometric?.digramLatencies ?? {},
        n,
      ),
      commonDigrams: mergeTopList(existingDNA.biometric.commonDigrams, newSessionDNA.biometric?.commonDigrams ?? [], 20),
      avgDwellTime: avg(existingDNA.biometric.avgDwellTime, newSessionDNA.biometric?.avgDwellTime),
      handAlternationRatio: avg(existingDNA.biometric.handAlternationRatio, newSessionDNA.biometric?.handAlternationRatio),
      errorRate: avg(existingDNA.biometric.errorRate, newSessionDNA.biometric?.errorRate),
    },
    linguistic: {
      avgSentenceLength: avg(existingDNA.linguistic.avgSentenceLength, newSessionDNA.linguistic?.avgSentenceLength),
      sentenceLengthStdDev: avg(existingDNA.linguistic.sentenceLengthStdDev, newSessionDNA.linguistic?.sentenceLengthStdDev),
      vocabularyRichness: avg(existingDNA.linguistic.vocabularyRichness, newSessionDNA.linguistic?.vocabularyRichness),
      contractionRate: avg(existingDNA.linguistic.contractionRate, newSessionDNA.linguistic?.contractionRate),
      hedgeWordRate: avg(existingDNA.linguistic.hedgeWordRate, newSessionDNA.linguistic?.hedgeWordRate),
      selfReferenceRate: avg(existingDNA.linguistic.selfReferenceRate, newSessionDNA.linguistic?.selfReferenceRate),
      avgParagraphLength: avg(existingDNA.linguistic.avgParagraphLength, newSessionDNA.linguistic?.avgParagraphLength),
      commonTransitions: mergeTopList(existingDNA.linguistic.commonTransitions, newSessionDNA.linguistic?.commonTransitions ?? [], 10),
    },
    confidence: updateConfidence(existingDNA.confidence),
  }
}

function mergeDigramLatencies(
  existing: Record<string, number>,
  incoming: Record<string, number>,
  n: number,
): Record<string, number> {
  const merged = { ...existing }
  for (const [digram, latency] of Object.entries(incoming)) {
    merged[digram] = digram in merged ? weightedAvg(merged[digram], latency, n) : latency
  }
  return merged
}

// Keep items seen in both lists first, then new, then old-only — up to `limit`
function mergeTopList(existing: string[], incoming: string[], limit: number): string[] {
  const inBoth = existing.filter(d => incoming.includes(d))
  const onlyNew = incoming.filter(d => !existing.includes(d))
  const onlyOld = existing.filter(d => !incoming.includes(d))
  return [...inBoth, ...onlyNew, ...onlyOld].slice(0, limit)
}

function updateConfidence(existing: WritingDNA['confidence']): WritingDNA['confidence'] {
  const increase = 8
  const cap = 95

  const temporal  = Math.min(existing.temporal  + increase, cap)
  const revision  = Math.min(existing.revision  + increase, cap)
  const biometric = Math.min(existing.biometric + increase, cap)
  const linguistic = Math.min(existing.linguistic + increase, cap)
  const overall   = Math.min(temporal * 0.25 + revision * 0.25 + biometric * 0.35 + linguistic * 0.15, cap)

  return { overall, temporal, revision, biometric, linguistic }
}
