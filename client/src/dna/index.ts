import type { KeystrokeEvent } from '../types'
import type { WritingDNA, DNAComparisonResult } from './types'
import { extractDNAFromSession } from './extractor'
import { mergeDNAWithSession } from './merger'
import { compareSessionToDNA } from './comparator'
import { getDNA, getDNALocal, saveDNA, initializeDNA, getUserId } from './storage'

export type { WritingDNA, DNAComparisonResult }

class DNAManager {
  private userId: string
  private dna: WritingDNA

  constructor() {
    this.userId = getUserId()
    this.dna = getDNALocal(this.userId) ?? initializeDNA(this.userId)
    // Hydrate from server if authenticated (async, updates in background)
    this.hydrateFromServer()
  }

  private async hydrateFromServer(): Promise<void> {
    try {
      const serverDNA = await getDNA(this.userId)
      if (serverDNA && serverDNA.sessionCount > this.dna.sessionCount) {
        this.dna = serverDNA
      }
    } catch {
      // Silent fail — local data is fine
    }
  }

  updateFromSession(events: KeystrokeEvent[], content: string): void {
    const sessionDNA = extractDNAFromSession(events, content)
    this.dna = mergeDNAWithSession(this.dna, sessionDNA, 1.0)
    this.dna.sessionCount++
    this.dna.lastUpdated = Date.now()
    saveDNA(this.dna)
  }

  compareSession(events: KeystrokeEvent[], content: string): DNAComparisonResult | null {
    if (this.dna.sessionCount < 1) return null
    return compareSessionToDNA(events, content, this.dna)
  }

  getDNAProfile(): WritingDNA {
    return this.dna
  }

  getSessionCount(): number {
    return this.dna.sessionCount
  }

  hasEnoughData(): boolean {
    return this.dna.sessionCount >= 3
  }

  getConfidenceLevel(): 'building' | 'low' | 'moderate' | 'high' {
    const c = this.dna.confidence.overall
    if (c < 25) return 'building'
    if (c < 50) return 'low'
    if (c < 75) return 'moderate'
    return 'high'
  }
}

export default new DNAManager()
