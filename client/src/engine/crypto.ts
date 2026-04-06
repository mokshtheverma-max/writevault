import type { WritingSession } from './types';

// Uses the native Web Crypto API (available in all modern browsers)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Canonical SHA-256 of the session's content, events, and timestamps.
 * The same session will always produce the same hash, enabling tamper detection.
 */
export async function generateSessionHash(session: WritingSession): Promise<string> {
  const canonical = JSON.stringify({
    content: session.content,
    events: session.events,
    startTime: session.startTime,
    endTime: session.endTime,
  });
  return sha256(canonical);
}

/**
 * Short verification token derived from sessionId + hash + timestamp.
 * 16 hex chars — human-readable on printouts.
 */
export async function generateVerificationToken(
  sessionId: string,
  hash: string,
): Promise<string> {
  const combined = sessionId + hash + Date.now().toString();
  const full = await sha256(combined);
  return full.slice(0, 16).toUpperCase();
}

/**
 * Recomputes the session hash and compares it to the provided value.
 * Returns true only if the session data is unmodified.
 */
export async function verifySessionIntegrity(
  session: WritingSession,
  providedHash: string,
): Promise<boolean> {
  const computed = await generateSessionHash(session);
  return computed === providedHash;
}

/**
 * Generates a UUID v4 formatted as WV-XXXXXX-XXXXXX for report displays.
 */
export function generateProofId(): string {
  const uuid = crypto.randomUUID();
  const hex = uuid.replace(/-/g, '').toUpperCase();
  return `WV-${hex.slice(0, 6)}-${hex.slice(6, 12)}`;
}
