import type { WritingSession } from '../types'

const PREFIX = 'wv_session_'

export function saveSession(session: WritingSession): void {
  localStorage.setItem(`${PREFIX}${session.id}`, JSON.stringify(session))
}

export function loadSession(sessionId: string): WritingSession | null {
  const raw = localStorage.getItem(`${PREFIX}${sessionId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as WritingSession
  } catch {
    return null
  }
}

export function listSessions(): WritingSession[] {
  const sessions: WritingSession[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(PREFIX)) {
      const raw = localStorage.getItem(key)
      if (raw) {
        try {
          sessions.push(JSON.parse(raw))
        } catch {
          // skip corrupted
        }
      }
    }
  }
  return sessions.sort((a, b) => b.startTime - a.startTime)
}

export function deleteSession(sessionId: string): void {
  localStorage.removeItem(`${PREFIX}${sessionId}`)
}
