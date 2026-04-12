import { useRef, useCallback } from 'react'
import type { KeystrokeEvent } from '../types'

const PAUSE_THRESHOLD = 2000
const BURST_GAP = 500
const BURST_MIN_CHARS = 20
const CURSOR_JUMP_MIN = 10

const ARROW_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
])

interface UseKeystrokeCaptureOptions {
  onEvent: (event: KeystrokeEvent) => void
}

export function useKeystrokeCapture({ onEvent }: UseKeystrokeCaptureOptions) {
  const lastKeystrokeTime = useRef<number>(0)
  const lastPosition = useRef<number>(0)
  const burstStartTime = useRef<number>(0)
  const burstCharCount = useRef<number>(0)
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const now = performance.now()
      const target = e.target as HTMLElement & { selectionStart?: number }
      let currentPos = 0
      if (typeof target?.selectionStart === 'number') {
        currentPos = target.selectionStart
      } else {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          currentPos = sel.getRangeAt(0).startOffset
        }
      }
      const timeSinceLast = now - lastKeystrokeTime.current

      // Detect pause
      if (lastKeystrokeTime.current > 0 && timeSinceLast > PAUSE_THRESHOLD) {
        onEvent({
          type: 'pause',
          timestamp: now,
          pauseDuration: timeSinceLast,
        })
        burstCharCount.current = 0
        burstStartTime.current = now
      }

      // Detect deletion
      if (e.key === 'Backspace' || e.key === 'Delete') {
        onEvent({
          type: 'delete',
          timestamp: now,
          deletedCount: 1,
          position: currentPos,
        })
      }

      // Track burst typing
      if (timeSinceLast < BURST_GAP) {
        if (burstCharCount.current === 0) {
          burstStartTime.current = now
        }
        burstCharCount.current++
        if (burstCharCount.current > BURST_MIN_CHARS) {
          const elapsed = now - burstStartTime.current
          if (elapsed > 0) {
            const burstWPM =
              (burstCharCount.current / 5) / (elapsed / 60000)
            onEvent({ type: 'burst', timestamp: now, burstWPM })
          }
        }
      } else {
        burstCharCount.current = 1
        burstStartTime.current = now
      }

      // Detect cursor jump
      if (
        lastPosition.current > 0 &&
        !ARROW_KEYS.has(e.key) &&
        e.key !== 'Backspace' &&
        e.key !== 'Delete'
      ) {
        const jump = Math.abs(currentPos - lastPosition.current)
        if (jump > CURSOR_JUMP_MIN) {
          onEvent({
            type: 'cursor_jump',
            timestamp: now,
            jumpDistance: jump,
            position: currentPos,
          })
        }
      }

      // Record the keystroke
      onEvent({
        type: 'keydown',
        timestamp: now,
        key: e.key,
        position: currentPos,
      })

      lastKeystrokeTime.current = now
      lastPosition.current = currentPos

      if (pauseTimer.current) clearTimeout(pauseTimer.current)
    },
    [onEvent]
  )

  const handlePaste = useCallback(
    (_e: ClipboardEvent) => {
      onEvent({
        type: 'paste_attempt',
        timestamp: performance.now(),
      })
    },
    [onEvent]
  )

  const attach = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return
      el.addEventListener('keydown', handleKeyDown)
      el.addEventListener('paste', handlePaste)
      return () => {
        el.removeEventListener('keydown', handleKeyDown)
        el.removeEventListener('paste', handlePaste)
      }
    },
    [handleKeyDown, handlePaste]
  )

  return { attach }
}
