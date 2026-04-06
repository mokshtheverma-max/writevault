export interface WritingDNA {
  userId: string
  createdAt: number
  lastUpdated: number
  sessionCount: number

  temporal: {
    meanIKI: number
    stdDevIKI: number
    preferredBurstLength: number
    avgPauseDuration: number
    pauseFrequency: number
    fatigueRate: number
  }

  revision: {
    personalDeletionRate: number
    avgCorrectionLatency: number
    revisionDensity: number
    backtrackFrequency: number
  }

  biometric: {
    digramLatencies: Record<string, number>
    commonDigrams: string[]
    avgDwellTime: number
    handAlternationRatio: number
    errorRate: number
  }

  linguistic: {
    avgSentenceLength: number
    sentenceLengthStdDev: number
    vocabularyRichness: number
    contractionRate: number
    hedgeWordRate: number
    selfReferenceRate: number
    avgParagraphLength: number
    commonTransitions: string[]
  }

  confidence: {
    overall: number
    temporal: number
    revision: number
    biometric: number
    linguistic: number
  }
}

export interface DNAComparisonResult {
  matchScore: number
  confidence: number
  layerMatches: {
    temporal: number
    revision: number
    biometric: number
    linguistic: number
  }
  verdict: 'strong_match' | 'likely_match' | 'uncertain' | 'mismatch'
  details: string[]
}
