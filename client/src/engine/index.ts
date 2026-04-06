// Types
export type {
  KeystrokeEvent,
  WritingSession,
  ScoringWeights,
  LayerScore,
  AuthenticityReport,
  BiometricProfile,
  TemporalPattern,
  LinguisticSignature,
  PauseHistogram,
  BurstEvent,
} from './types';

// Master scorer
export { computeAuthenticityScore, WEIGHTS } from './scorer';

// Cryptographic verification
export {
  generateSessionHash,
  generateVerificationToken,
  verifySessionIntegrity,
  generateProofId,
} from './crypto';
