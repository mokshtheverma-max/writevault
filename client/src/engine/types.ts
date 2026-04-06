export interface KeystrokeEvent {
  type: 'keydown' | 'keyup';
  key: string;
  timestamp: number;
  position?: number;
}

export interface WritingSession {
  sessionId: string;
  content: string;
  events: KeystrokeEvent[];
  startTime: number;
  endTime: number;
}

export interface ScoringWeights {
  temporal: number;
  revision: number;
  cognitive: number;
  biometric: number;
  linguistic: number;
}

export interface LayerScore {
  score: number;
  confidence: number;
  flags: string[];
  rawMetrics: Record<string, unknown>;
}

export interface PauseHistogram {
  '0-500ms': number;
  '500ms-2s': number;
  '2s-10s': number;
  '10s-30s': number;
  '30s+': number;
}

export interface BurstEvent {
  startIndex: number;
  endIndex: number;
  type: 'acceleration' | 'deceleration';
  avgIKI: number;
}

export interface TemporalPattern {
  interKeystrokeIntervals: number[];
  meanIKI: number;
  stdDevIKI: number;
  coefficientOfVariation: number;
  pauseDistribution: PauseHistogram;
  burstPattern: BurstEvent[];
  rhythmScore: number;
}

export interface BiometricProfile {
  dwellTimes: Record<string, number[]>;
  flightTimes: number[];
  digramLatencies: Record<string, number[]>;
  handAlternationRatio: number;
  biometricConsistency: number;
}

export interface LinguisticSignature {
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  vocabularyRichness: number;
  punctuationPattern: Record<string, number>;
  paragraphLengthVariance: number;
  hedgeWordFrequency: number;
  selfReferenceRate: number;
  contractionRate: number;
}

export interface AuthenticityReport {
  sessionId: string;
  compositeScore: number;
  confidence: number;
  verdict: string;
  flags: string[];
  layers: {
    temporal: LayerScore;
    revision: LayerScore;
    cognitive: LayerScore;
    biometric: LayerScore;
    linguistic: LayerScore;
  };
  weights: ScoringWeights;
  timestamp: number;
  proofId: string;
  sessionHash: string;
}
