import type { KeystrokeEvent } from '../types'
import type { WritingDNA, DNAComparisonResult } from './types'
import { extractDNAFromSession } from './extractor'

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function metricSimilarity(session: number, dna: number): number {
  if (dna === 0) return session === 0 ? 100 : 50
  return 100 - clamp(Math.abs(session - dna) / dna * 100, 0, 100)
}

function temporalScore(s: Partial<WritingDNA>, dna: WritingDNA): number {
  if (!s.temporal) return 50
  return (
    metricSimilarity(s.temporal.meanIKI,      dna.temporal.meanIKI)      +
    metricSimilarity(s.temporal.stdDevIKI,    dna.temporal.stdDevIKI)    +
    metricSimilarity(s.temporal.pauseFrequency, dna.temporal.pauseFrequency)
  ) / 3
}

function revisionScore(s: Partial<WritingDNA>, dna: WritingDNA): number {
  if (!s.revision) return 50
  return (
    metricSimilarity(s.revision.personalDeletionRate, dna.revision.personalDeletionRate) +
    metricSimilarity(s.revision.avgCorrectionLatency,  dna.revision.avgCorrectionLatency) +
    metricSimilarity(s.revision.revisionDensity,       dna.revision.revisionDensity)
  ) / 3
}

function biometricScore(s: Partial<WritingDNA>, dna: WritingDNA): number {
  const sessionDigrams = s.biometric?.digramLatencies ?? {}
  const dnaCommon = dna.biometric.commonDigrams
  const dnaDigrams = dna.biometric.digramLatencies

  if (dnaCommon.length === 0) return 50

  let full = 0, partial = 0, total = 0
  for (const digram of dnaCommon) {
    if (!(digram in dnaDigrams) || !(digram in sessionDigrams)) continue
    total++
    const diff = Math.abs(sessionDigrams[digram] - dnaDigrams[digram])
    if (diff <= 30) full++
    else if (diff <= 60) partial++
  }

  return total === 0 ? 50 : ((full + partial * 0.5) / total) * 100
}

function linguisticScore(s: Partial<WritingDNA>, dna: WritingDNA): number {
  if (!s.linguistic) return 50
  return (
    metricSimilarity(s.linguistic.avgSentenceLength,  dna.linguistic.avgSentenceLength)  +
    metricSimilarity(s.linguistic.vocabularyRichness,  dna.linguistic.vocabularyRichness) +
    metricSimilarity(s.linguistic.hedgeWordRate,        dna.linguistic.hedgeWordRate)      +
    metricSimilarity(s.linguistic.selfReferenceRate,    dna.linguistic.selfReferenceRate)
  ) / 4
}

export function compareSessionToDNA(
  sessionEvents: KeystrokeEvent[],
  sessionContent: string,
  storedDNA: WritingDNA,
): DNAComparisonResult {
  const sessionDNA = extractDNAFromSession(sessionEvents, sessionContent)

  const temporal   = temporalScore(sessionDNA,   storedDNA)
  const revision   = revisionScore(sessionDNA,   storedDNA)
  const biometric  = biometricScore(sessionDNA,  storedDNA)
  const linguistic = linguisticScore(sessionDNA, storedDNA)

  const matchScore = clamp(
    temporal * 0.25 + revision * 0.25 + biometric * 0.35 + linguistic * 0.15,
    0, 100,
  )

  const dnaConf = storedDNA.confidence.overall
  const confidence = dnaConf < 30 ? 20 : dnaConf < 60 ? 50 : 80

  let verdict: DNAComparisonResult['verdict']
  if      (matchScore > 75 && confidence > 50) verdict = 'strong_match'
  else if (matchScore > 55 && confidence > 30) verdict = 'likely_match'
  else if (matchScore > 35)                    verdict = 'uncertain'
  else                                         verdict = 'mismatch'

  const ikipct = storedDNA.temporal.meanIKI > 0
    ? Math.round(Math.abs((sessionDNA.temporal?.meanIKI ?? 0) - storedDNA.temporal.meanIKI) / storedDNA.temporal.meanIKI * 100)
    : 0

  const details: string[] = [
    `Your typing rhythm matched your personal baseline within ${ikipct}%`,
    biometric >= 70
      ? 'Digram timing patterns are consistent with your writing history'
      : biometric >= 45
        ? 'Digram timing patterns partially match your writing history'
        : 'Digram timing patterns show some deviation from your baseline',
    revision >= 70
      ? 'Revision patterns match your typical editing behavior'
      : 'Revision patterns show some variation from your baseline',
    linguistic >= 70
      ? `Linguistic style is consistent with your ${storedDNA.sessionCount} previous session${storedDNA.sessionCount !== 1 ? 's' : ''}`
      : 'Linguistic style shows variation from your typical writing',
    `Analysis based on ${storedDNA.sessionCount} prior session${storedDNA.sessionCount !== 1 ? 's' : ''} with ${Math.round(dnaConf)}% DNA confidence`,
  ]

  return {
    matchScore: Math.round(matchScore),
    confidence,
    layerMatches: {
      temporal:   Math.round(temporal),
      revision:   Math.round(revision),
      biometric:  Math.round(biometric),
      linguistic: Math.round(linguistic),
    },
    verdict,
    details,
  }
}
