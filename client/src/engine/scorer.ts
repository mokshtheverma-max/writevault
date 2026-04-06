import type {
  KeystrokeEvent,
  AuthenticityReport,
  ScoringWeights,
  WritingSession,
} from './types';
import { analyzeTemporalPatterns } from './layers/temporalLayer';
import { analyzeRevisionPatterns } from './layers/revisionLayer';
import { analyzeCognitivePatterns } from './layers/cognitiveLayer';
import { analyzeBiometricSignature } from './layers/biometricLayer';
import { analyzeLinguisticPatterns } from './layers/linguisticLayer';
import { generateSessionHash, generateProofId } from './crypto';

export const WEIGHTS: ScoringWeights = {
  temporal: 0.30,   // Most important: timing irregularity
  revision: 0.25,   // Second: authentic editing behaviour
  cognitive: 0.20,  // Thinking and fatigue patterns
  biometric: 0.15,  // Per-key typing signature
  linguistic: 0.10, // Content fingerprint
};

export async function computeAuthenticityScore(
  events: KeystrokeEvent[],
  content: string,
  sessionId = 'session_' + Date.now().toString(36),
): Promise<AuthenticityReport> {

  // Run all 5 layers in parallel
  const [temporal, revision, cognitive, biometric, linguistic] = await Promise.all([
    Promise.resolve(analyzeTemporalPatterns(events)),
    Promise.resolve(analyzeRevisionPatterns(events, content)),
    Promise.resolve(analyzeCognitivePatterns(events)),
    Promise.resolve(analyzeBiometricSignature(events)),
    Promise.resolve(analyzeLinguisticPatterns(content, events)),
  ]);

  // Weighted composite score
  const compositeScore =
    temporal.score  * WEIGHTS.temporal  +
    revision.score  * WEIGHTS.revision  +
    cognitive.score * WEIGHTS.cognitive +
    biometric.score * WEIGHTS.biometric +
    linguistic.score * WEIGHTS.linguistic;

  // Aggregate all red flags from every layer
  const flags = [
    ...temporal.flags,
    ...revision.flags,
    ...cognitive.flags,
    ...biometric.flags,
    ...linguistic.flags,
  ];

  // Overall confidence: mean of layer confidences, scaled by session size
  const avgConfidence =
    (temporal.confidence +
      revision.confidence +
      cognitive.confidence +
      biometric.confidence +
      linguistic.confidence) / 5;

  const sizeFactor =
    events.length < 200 ? 0.60 : events.length < 1000 ? 0.85 : 1.0;
  const confidence = Math.round(avgConfidence * sizeFactor * 100) / 100;

  // Human-readable verdict
  let verdict: string;
  if (compositeScore > 80)
    verdict = 'Strong evidence of authentic human writing';
  else if (compositeScore > 60)
    verdict = 'Moderate evidence of authentic writing';
  else if (compositeScore > 40)
    verdict = 'Mixed signals — manual review recommended';
  else
    verdict = 'Significant patterns inconsistent with human writing';

  // Build session object for cryptographic hashing
  const session: WritingSession = {
    sessionId,
    content,
    events,
    startTime: events[0]?.timestamp ?? Date.now(),
    endTime: events[events.length - 1]?.timestamp ?? Date.now(),
  };

  const [sessionHash, proofId] = await Promise.all([
    generateSessionHash(session),
    Promise.resolve(generateProofId()),
  ]);

  return {
    sessionId,
    compositeScore: Math.round(compositeScore * 10) / 10,
    confidence,
    verdict,
    flags,
    layers: { temporal, revision, cognitive, biometric, linguistic },
    weights: WEIGHTS,
    timestamp: Date.now(),
    proofId,
    sessionHash,
  };
}
