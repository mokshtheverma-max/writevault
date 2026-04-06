import { v4 as uuidv4 } from 'uuid'
import type { WritingDNA } from './types'
import { API_BASE } from '../config'

const DNA_PREFIX  = 'wv_dna_'
const USER_ID_KEY = 'wv_user_id'
const TOKEN_KEY   = 'wv_auth_token'

function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = uuidv4()
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

export async function getDNA(userId: string): Promise<WritingDNA | null> {
  const token = getAuthToken()

  // If authenticated, try server first
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/auth/dna`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const { dnaData } = await res.json()
        if (dnaData) return dnaData as WritingDNA
      }
    } catch {
      // Fall through to localStorage
    }
  }

  // Fallback to localStorage
  const raw = localStorage.getItem(`${DNA_PREFIX}${userId}`)
  if (!raw) return null
  try { return JSON.parse(raw) as WritingDNA } catch { return null }
}

/** Synchronous local-only read for cases where async isn't possible */
export function getDNALocal(userId: string): WritingDNA | null {
  const raw = localStorage.getItem(`${DNA_PREFIX}${userId}`)
  if (!raw) return null
  try { return JSON.parse(raw) as WritingDNA } catch { return null }
}

export function saveDNA(dna: WritingDNA): void {
  // Always save to localStorage
  localStorage.setItem(`${DNA_PREFIX}${dna.userId}`, JSON.stringify(dna))

  // If authenticated, also sync to server
  const token = getAuthToken()
  if (token) {
    fetch(`${API_BASE}/auth/dna`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dnaData: dna }),
    }).catch(() => {
      // Silent fail — localStorage is the primary store
    })
  }
}

export function initializeDNA(userId: string): WritingDNA {
  const now = Date.now()
  return {
    userId,
    createdAt: now,
    lastUpdated: now,
    sessionCount: 0,
    temporal:  { meanIKI: 0, stdDevIKI: 0, preferredBurstLength: 0, avgPauseDuration: 0, pauseFrequency: 0, fatigueRate: 0 },
    revision:  { personalDeletionRate: 0, avgCorrectionLatency: 0, revisionDensity: 0, backtrackFrequency: 0 },
    biometric: { digramLatencies: {}, commonDigrams: [], avgDwellTime: 0, handAlternationRatio: 0, errorRate: 0 },
    linguistic: {
      avgSentenceLength: 0, sentenceLengthStdDev: 0, vocabularyRichness: 0,
      contractionRate: 0, hedgeWordRate: 0, selfReferenceRate: 0,
      avgParagraphLength: 0, commonTransitions: [],
    },
    confidence: { overall: 0, temporal: 0, revision: 0, biometric: 0, linguistic: 0 },
  }
}
