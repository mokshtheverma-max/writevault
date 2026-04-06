import type { KeystrokeEvent, SessionMetadata } from '../types'

export function calculateMetadata(
  events: KeystrokeEvent[],
  content: string,
  startTime: number,
  endTime: number
): SessionMetadata {
  const pauses = events.filter((e) => e.type === 'pause')
  const deletions = events.filter((e) => e.type === 'delete')
  const jumps = events.filter((e) => e.type === 'cursor_jump')
  const bursts = events.filter((e) => e.type === 'burst')

  const totalPauses = pauses.length
  const avgPauseMs =
    totalPauses > 0
      ? pauses.reduce((acc, e) => acc + (e.pauseDuration ?? 0), 0) / totalPauses
      : 0
  const longestPause = pauses.reduce(
    (acc, e) => Math.max(acc, e.pauseDuration ?? 0),
    0
  )

  const durationMinutes = (endTime - startTime) / 60000
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const avgWPM = durationMinutes > 0 ? wordCount / durationMinutes : 0

  // Calculate WPM in 30-second buckets for variance
  const bucketMs = 30000
  const keydowns = events.filter((e) => e.type === 'keydown')
  const buckets: number[] = []
  if (keydowns.length > 0) {
    const firstTs = keydowns[0].timestamp
    const lastTs = keydowns[keydowns.length - 1].timestamp
    for (let t = firstTs; t < lastTs; t += bucketMs) {
      const inBucket = keydowns.filter(
        (e) => e.timestamp >= t && e.timestamp < t + bucketMs
      ).length
      const bucketWpm = (inBucket / 5) / (bucketMs / 60000)
      buckets.push(bucketWpm)
    }
  }

  const wpmVariance =
    buckets.length > 1
      ? (() => {
          const mean = buckets.reduce((a, b) => a + b, 0) / buckets.length
          return (
            buckets.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
            buckets.length
          )
        })()
      : 0

  const revisionDensity =
    content.length > 0 ? deletions.length / content.length : 0

  const writingBursts: import('../types').BurstSegment[] = bursts.map((b) => ({
    startTime: b.timestamp,
    endTime: b.timestamp + 1000,
    wpm: b.burstWPM ?? 0,
    charCount: 0,
  }))

  return {
    totalPauses,
    avgPauseMs,
    totalDeletions: deletions.length,
    cursorJumps: jumps.length,
    avgWPM,
    wpmVariance,
    burstCount: bursts.length,
    revisionDensity,
    longestPause,
    writingBursts,
  }
}

export function calculateHumanScore(metadata: SessionMetadata): number {
  let score = 100

  // Penalize suspiciously linear writing
  if (metadata.totalPauses < 3) score -= 30
  if (metadata.totalDeletions < 5) score -= 20
  if (metadata.wpmVariance < 10) score -= 25
  if (metadata.cursorJumps < 2) score -= 15

  // Reward authentic patterns
  if (metadata.avgPauseMs > 3000 && metadata.avgPauseMs < 30000) score += 10
  if (metadata.revisionDensity > 0.15) score += 10

  return Math.max(0, Math.min(100, score))
}
