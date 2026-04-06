import type { KeystrokeEvent } from '../types'
import type { WritingDNA } from './types'

const HEDGE_WORDS = [
  'perhaps', 'might', 'maybe', 'i think', 'i believe',
  'sort of', 'kind of', 'probably', 'possibly',
]

const LEFT_HAND = new Set(['q','w','e','r','t','a','s','d','f','g','z','x','c','v','b'])
const RIGHT_HAND = new Set(['y','u','i','o','p','h','j','k','l','n','m'])

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function linearRegressionSlope(ys: number[]): number {
  if (ys.length < 2) return 0
  const n = ys.length
  const xs = Array.from({ length: n }, (_, i) => i)
  const mx = mean(xs)
  const my = mean(ys)
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  return den === 0 ? 0 : num / den
}

export function extractDNAFromSession(
  events: KeystrokeEvent[],
  content: string,
): Partial<WritingDNA> {
  const keydowns = events.filter(e => e.type === 'keydown')
  const pauses = events.filter(e => e.type === 'pause')
  const deletes = events.filter(e => e.type === 'delete')
  const backJumps = events.filter(e => e.type === 'cursor_jump' && (e.jumpDistance ?? 0) < 0)

  const words = content.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const totalKeydowns = keydowns.length

  // ─── Temporal ──────────────────────────────────────────────────────────────

  const ikis: number[] = []
  for (let i = 1; i < keydowns.length; i++) {
    const gap = keydowns[i].timestamp - keydowns[i - 1].timestamp
    if (gap > 0 && gap < 5000) ikis.push(gap)
  }

  const meanIKI = mean(ikis)
  const stdDevIKI = stdDev(ikis)

  // Burst length: consecutive keydowns with gap < 300 ms
  let currentBurst = 1
  const burstLengths: number[] = []
  for (let i = 1; i < keydowns.length; i++) {
    if (keydowns[i].timestamp - keydowns[i - 1].timestamp < 300) {
      currentBurst++
    } else {
      if (currentBurst > 1) burstLengths.push(currentBurst)
      currentBurst = 1
    }
  }
  if (currentBurst > 1) burstLengths.push(currentBurst)
  const preferredBurstLength = mean(burstLengths) || 10

  const pauseDurations = pauses.map(e => e.pauseDuration ?? 0).filter(d => d > 0)
  const avgPauseDuration = mean(pauseDurations)
  const pauseFrequency = wordCount > 0 ? (pauses.length / wordCount) * 100 : 0

  // Fatigue: 10 time buckets, fit linear regression on WPM
  let fatigueRate = 0
  if (keydowns.length >= 10) {
    const firstTs = keydowns[0].timestamp
    const lastTs = keydowns[keydowns.length - 1].timestamp
    const duration = lastTs - firstTs
    if (duration > 0) {
      const bucketSize = duration / 10
      const bucketWPMs: number[] = []
      for (let b = 0; b < 10; b++) {
        const start = firstTs + b * bucketSize
        const end = start + bucketSize
        const count = keydowns.filter(e => e.timestamp >= start && e.timestamp < end).length
        const minutes = bucketSize / 60000
        bucketWPMs.push(minutes > 0 ? count / 5 / minutes : 0)
      }
      fatigueRate = linearRegressionSlope(bucketWPMs)
    }
  }

  // ─── Revision ──────────────────────────────────────────────────────────────

  const personalDeletionRate = totalKeydowns > 0 ? (deletes.length / totalKeydowns) * 100 : 0

  const correctionLatencies: number[] = []
  for (const del of deletes) {
    const prev = [...keydowns].reverse().find(e => e.timestamp < del.timestamp)
    if (prev) {
      const latency = del.timestamp - prev.timestamp
      if (latency > 0 && latency < 10000) correctionLatencies.push(latency)
    }
  }
  const avgCorrectionLatency = mean(correctionLatencies)

  const charsDeleted = deletes.reduce((s, e) => s + (e.deletedCount ?? 1), 0)
  const revisionDensity = totalKeydowns > 0 ? charsDeleted / totalKeydowns : 0
  const backtrackFrequency = wordCount > 0 ? (backJumps.length / wordCount) * 100 : 0

  // ─── Biometric ─────────────────────────────────────────────────────────────

  const keysWithChar = keydowns.filter(e => e.key && e.key.length === 1)
  const digramMap: Record<string, number[]> = {}

  for (let i = 1; i < keysWithChar.length; i++) {
    const a = keysWithChar[i - 1].key!.toLowerCase()
    const b = keysWithChar[i].key!.toLowerCase()
    if (/[a-z]/.test(a) && /[a-z]/.test(b)) {
      const latency = keysWithChar[i].timestamp - keysWithChar[i - 1].timestamp
      if (latency > 0 && latency < 1000) {
        const digram = a + b
        if (!digramMap[digram]) digramMap[digram] = []
        digramMap[digram].push(latency)
      }
    }
  }

  const digramLatencies: Record<string, number> = {}
  for (const [digram, latencies] of Object.entries(digramMap)) {
    if (latencies.length >= 2) {
      digramLatencies[digram] = median(latencies)
    }
  }

  const commonDigrams = Object.entries(digramMap)
    .filter(([, v]) => v.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)
    .map(([k]) => k)

  let alternations = 0
  let handTransitions = 0
  for (let i = 1; i < keysWithChar.length; i++) {
    const a = keysWithChar[i - 1].key!.toLowerCase()
    const b = keysWithChar[i].key!.toLowerCase()
    const aL = LEFT_HAND.has(a), aR = RIGHT_HAND.has(a)
    const bL = LEFT_HAND.has(b), bR = RIGHT_HAND.has(b)
    if ((aL || aR) && (bL || bR)) {
      handTransitions++
      if ((aL && bR) || (aR && bL)) alternations++
    }
  }
  const handAlternationRatio = handTransitions > 0 ? alternations / handTransitions : 0.5
  const errorRate = totalKeydowns > 0 ? (deletes.length / totalKeydowns) * 100 : 0

  // ─── Linguistic ────────────────────────────────────────────────────────────

  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0)
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length)
  const avgSentenceLength = mean(sentenceLengths)
  const sentenceLengthStdDev = stdDev(sentenceLengths)

  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z']/g, '')))
  const vocabularyRichness = wordCount > 0 ? uniqueWords.size / wordCount : 0

  const contractions = (content.match(/\b\w+'\w+\b/g) ?? []).length
  const contractionRate = wordCount > 0 ? (contractions / wordCount) * 100 : 0

  const contentLower = content.toLowerCase()
  const hedgeCount = HEDGE_WORDS.reduce((count, hw) => {
    const regex = new RegExp(hw.replace(/\s+/g, '\\s+'), 'gi')
    return count + (contentLower.match(regex) ?? []).length
  }, 0)
  const hedgeWordRate = wordCount > 0 ? (hedgeCount / wordCount) * 100 : 0

  const selfRefCount = (content.match(/\bI\b|\bmy\b|\bme\b|\bmyself\b/g) ?? []).length
  const selfReferenceRate = wordCount > 0 ? (selfRefCount / wordCount) * 100 : 0

  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const paragraphLengths = paragraphs.map(p => p.trim().split(/\s+/).filter(Boolean).length)
  const avgParagraphLength = mean(paragraphLengths)

  const transitionCounts: Record<string, number> = {}
  for (const sentence of sentences) {
    const firstWord = sentence.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
    if (firstWord && firstWord.length > 1) {
      transitionCounts[firstWord] = (transitionCounts[firstWord] ?? 0) + 1
    }
  }
  const commonTransitions = Object.entries(transitionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w)

  return {
    temporal: { meanIKI, stdDevIKI, preferredBurstLength, avgPauseDuration, pauseFrequency, fatigueRate },
    revision: { personalDeletionRate, avgCorrectionLatency, revisionDensity, backtrackFrequency },
    biometric: { digramLatencies, commonDigrams, avgDwellTime: 0, handAlternationRatio, errorRate },
    linguistic: {
      avgSentenceLength, sentenceLengthStdDev, vocabularyRichness,
      contractionRate, hedgeWordRate, selfReferenceRate,
      avgParagraphLength, commonTransitions,
    },
  }
}
