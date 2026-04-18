import type { WritingSession, SessionMetadata } from '../types'
import { API_BASE as API } from '../config'

interface SubmitPayload {
  title: string
  content: string
  events: WritingSession['events']
  humanScore: number
  sha256Hash: string
  startTime: number
  endTime: number
  metadata: SessionMetadata
}

interface SubmitResponse {
  sessionId: string
  hash: string
  verificationUrl: string
}

export async function submitSession(payload: SubmitPayload): Promise<SubmitResponse> {
  const res = await fetch(`${API}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface VerifyResult {
  verified: boolean
  session?: {
    id: string
    title: string
    humanScore: number
    sha256Hash: string
    startTime: number
    endTime: number
    createdAt: number
    metadata: SessionMetadata
  }
  verifiedAt?: number
  verificationCount?: number
  error?: string
}

export interface TeacherLayerScore {
  score: number
  interpretation: string
}

export interface TeacherViewResult {
  id: string
  title: string
  humanScore: number
  sha256Hash: string
  startTime: number
  endTime: number
  createdAt: number
  wordCount: number
  metadata: SessionMetadata
  verificationCount: number
  behavioralObservations: string[]
  layerScores: {
    temporal: TeacherLayerScore
    revision: TeacherLayerScore
    cognitive: TeacherLayerScore
    biometric: TeacherLayerScore
    linguistic: TeacherLayerScore
  }
  writingTimeline: {
    sessionBegan: string
    activePeriodMinutes: number
    naturalBreaksDetected: number
    longestPauseMs: number
    longestPauseFormatted: string
    sessionCompleted: string
  }
  verifiedAt: number
  retrieved_independently: true
}

export async function getTeacherView(idOrHash: string): Promise<{ ok: true; data: TeacherViewResult } | { ok: false; error: string }> {
  const encoded = encodeURIComponent(idOrHash.trim())
  const res = await fetch(`${API}/sessions/${encoded}/teacher-view`)
  if (res.status === 404) {
    return { ok: false, error: 'No session found. The ID may be incorrect or the student has not submitted their session.' }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    return { ok: false, error: err.error || `HTTP ${res.status}` }
  }
  const data = await res.json()
  return { ok: true, data }
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('wv_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function deleteSessionRemote(sessionId: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const res = await fetch(`${API}/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: { ...authHeader() },
    })
    if (res.status === 404) {
      return { success: true }
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      return { success: false, error: err.error || `HTTP ${res.status}` }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export interface TeacherDashboardData {
  totalVerified: number
  recentVerifications: Array<{
    id: string
    sessionId: string
    title: string
    humanScore: number
    sha256Hash: string
    verifiedAt: number
    createdAt: number
  }>
  sharedSessions: Array<unknown>
}

export async function getTeacherDashboard(): Promise<TeacherDashboardData> {
  const res = await fetch(`${API}/teacher/dashboard`, {
    headers: { ...authHeader() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface BulkVerifyResult {
  input: string
  found: boolean
  error?: string
  id?: string
  title?: string
  humanScore?: number
  sha256Hash?: string
  startTime?: number
  endTime?: number
  createdAt?: number
  wordCount?: number
}

export async function teacherVerifyBulk(hashes: string[]): Promise<BulkVerifyResult[]> {
  const res = await fetch(`${API}/teacher/verify-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ hashes }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.results || []
}

export async function verifyHash(hash: string): Promise<VerifyResult> {
  const res = await fetch(`${API}/sessions/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash: hash.trim().toLowerCase() }),
  })
  if (res.status === 404) {
    return { verified: false, error: 'No session found with this hash' }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    return { verified: false, error: err.error || `HTTP ${res.status}` }
  }
  return res.json()
}
