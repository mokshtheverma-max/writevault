import { useEffect, useState } from 'react'

const COLORS = ['#6366f1', '#8b5cf6', '#ffffff', '#fbbf24']

interface Piece {
  id: number
  left: number
  delay: number
  duration: number
  color: string
  size: number
  drift: number
  rotate: number
}

export default function Confetti({ count = 100, duration = 3000 }: { count?: number; duration?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const arr: Piece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2 + Math.random() * 1.8,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
      drift: -40 + Math.random() * 80,
      rotate: Math.random() * 720,
    }))
    setPieces(arr)
    const t = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(t)
  }, [count, duration])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <style>{`
        @keyframes wv-confetti-fall {
          0%   { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(var(--wv-drift), 110vh, 0) rotate(var(--wv-rot)); opacity: 0.9; }
        }
      `}</style>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 2,
            // @ts-expect-error CSS vars
            '--wv-drift': `${p.drift}px`,
            '--wv-rot': `${p.rotate}deg`,
            animation: `wv-confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(.2,.6,.4,1) forwards`,
            boxShadow: `0 0 6px ${p.color}80`,
          }}
        />
      ))}
    </div>
  )
}
