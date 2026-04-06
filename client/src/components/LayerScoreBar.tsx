import { useEffect, useRef } from 'react'

interface LayerScoreBarProps {
  name: string
  score: number          // 0–100
  weight: number         // 0–1
  interpretation: string
  flags?: string[]
  animate?: boolean
}

const TOOLTIPS: Record<string, string> = {
  'Temporal Patterns':     'Keystroke timing variance — humans show irregular rhythms; AI/pasted text is suspiciously uniform.',
  'Revision Behavior':     'Deletion and backspace patterns — authentic writing involves frequent corrections and self-editing.',
  'Cognitive Signals':     'Thinking pauses above 2 seconds — indicate real-time idea formation and cognitive processing.',
  'Behavioral Biometrics': 'Typing burst patterns and cursor movement — individual behavioral signature unique to each writer.',
  'Linguistic Flow':       'Vocabulary progression and structural complexity — natural writing builds complexity gradually.',
}

export default function LayerScoreBar({
  name,
  score,
  weight,
  interpretation,
  flags = [],
  animate = true,
}: LayerScoreBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const color =
    score >= 75 ? '#22c55e' : score >= 50 ? '#facc15' : '#ef4444'

  useEffect(() => {
    if (!animate || !barRef.current) return
    const el = barRef.current
    el.style.width = '0%'
    const timeout = setTimeout(() => {
      el.style.width = `${score}%`
    }, 60)
    return () => clearTimeout(timeout)
  }, [score, animate])

  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{name}</span>
          <span className="text-xs text-text-muted">×{Math.round(weight * 100)}%</span>
          {flags.length > 0 && (
            <span className="text-xs text-red-400/80">
              {flags.length} flag{flags.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>

      {/* Track */}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{
            width: animate ? '0%' : `${score}%`,
            backgroundColor: color,
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      <p className="text-xs text-text-muted mt-1">{interpretation}</p>

      {/* Tooltip */}
      {TOOLTIPS[name] && (
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 pointer-events-none">
          <div className="bg-elevated border border-border rounded-lg p-3 text-xs text-text-secondary shadow-xl">
            {TOOLTIPS[name]}
          </div>
        </div>
      )}
    </div>
  )
}
