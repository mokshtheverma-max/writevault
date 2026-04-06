export interface KeystrokeEvent {
  type:
    | 'keydown'
    | 'keyup'
    | 'pause'
    | 'burst'
    | 'delete'
    | 'cursor_jump'
    | 'paste_attempt'
  timestamp: number
  key?: string
  position?: number
  pauseDuration?: number
  burstWPM?: number
  deletedCount?: number
  jumpDistance?: number
}

export interface BurstSegment {
  startTime: number
  endTime: number
  wpm: number
  charCount: number
}

export interface SessionMetadata {
  totalPauses: number
  avgPauseMs: number
  totalDeletions: number
  cursorJumps: number
  avgWPM: number
  wpmVariance: number
  burstCount: number
  revisionDensity: number
  longestPause: number
  writingBursts: BurstSegment[]
}

export interface WritingSession {
  id: string
  title: string
  content: string
  events: KeystrokeEvent[]
  startTime: number
  endTime: number
  humanScore: number
  metadata: SessionMetadata
}
