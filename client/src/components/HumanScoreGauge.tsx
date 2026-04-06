import { useEffect, useState } from 'react'

interface HumanScoreGaugeProps {
  score: number
  size?: number
  showVerdict?: boolean
  /** Optional verdict override from engine */
  verdictText?: string
}

const ZONE_COLORS = ['#ef4444', '#f97316', '#facc15', '#84cc16', '#22c55e']

export default function HumanScoreGauge({
  score,
  size = 200,
  showVerdict = true,
  verdictText,
}: HumanScoreGaugeProps) {
  const [animated, setAnimated] = useState(0)

  // Animate score in on mount
  useEffect(() => {
    let start: number | null = null
    const duration = 900
    const target = Math.min(100, Math.max(0, score))

    function step(ts: number) {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimated(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [score])

  const color =
    score >= 75 ? '#22c55e' : score >= 55 ? '#84cc16' : score >= 40 ? '#facc15' : '#ef4444'

  const defaultVerdict =
    score >= 75
      ? 'AUTHENTIC'
      : score >= 55
      ? 'LIKELY AUTHENTIC'
      : score >= 40
      ? 'SUSPICIOUS'
      : 'LIKELY AI-GENERATED'

  const label = verdictText ?? defaultVerdict

  // Full circular gauge
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38
  const strokeWidth = size * 0.075
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - animated / 100)

  // 5 colored zone arc segments (background only)
  const zoneAngles = [0, 0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <div className="flex flex-col items-center gap-2 group relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Segment ring (decorative background zones) */}
        {ZONE_COLORS.map((zoneColor, i) => {
          const startAngle = -Math.PI / 2 + 2 * Math.PI * zoneAngles[i]
          const endAngle   = -Math.PI / 2 + 2 * Math.PI * zoneAngles[i + 1]
          const gap = 0.04 // gap between segments in radians
          const sa = startAngle + gap
          const ea = endAngle - gap
          const r = radius + strokeWidth * 0.65
          const x1 = cx + r * Math.cos(sa)
          const y1 = cy + r * Math.sin(sa)
          const x2 = cx + r * Math.cos(ea)
          const y2 = cy + r * Math.sin(ea)
          const largeArc = ea - sa > Math.PI ? 1 : 0
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={zoneColor}
              strokeWidth={strokeWidth * 0.25}
              strokeLinecap="round"
              opacity={0.18}
            />
          )
        })}

        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#1f1f3d"
          strokeWidth={strokeWidth}
        />

        {/* Animated score arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />

        {/* Score number */}
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={size * 0.22}
          fontWeight="bold"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {animated}
        </text>

        {/* /100 label */}
        <text
          x={cx}
          y={cy + size * 0.145}
          textAnchor="middle"
          fill="#475569"
          fontSize={size * 0.075}
          fontFamily="Inter, system-ui, sans-serif"
        >
          / 100
        </text>
      </svg>

      {showVerdict && (
        <p
          className="text-sm font-bold tracking-widest text-center"
          style={{ color }}
        >
          {label}
        </p>
      )}
    </div>
  )
}
