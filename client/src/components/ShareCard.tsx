import { useRef } from 'react'

interface ShareCardProps {
  score: number
  /** Size multiplier: 1 = full (800x420), 0.5 = half */
  scale?: number
}

function scoreColor(score: number): string {
  if (score >= 75) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

export default function ShareCard({ score, scale = 1 }: ShareCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const w = 800 * scale
  const h = 420 * scale
  const s = scale // shorthand

  return (
    <div
      ref={ref}
      data-share-card
      className="relative overflow-hidden select-none"
      style={{
        width: w,
        height: h,
        background: 'linear-gradient(135deg, #07070f 0%, #1a1a3e 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 16 * s,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Watermark pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 60px,
            rgba(99,102,241,0.03) 60px,
            rgba(99,102,241,0.03) 62px
          )`,
        }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.02, fontSize: 14 * s, color: '#fff', lineHeight: `${40 * s}px`, letterSpacing: 20 * s, overflow: 'hidden' }}>
        {'WV '.repeat(200)}
      </div>

      {/* Top bar */}
      <div className="absolute flex items-center justify-between" style={{ top: 24 * s, left: 32 * s, right: 32 * s }}>
        <div className="flex items-center" style={{ gap: 8 * s }}>
          <svg viewBox="0 0 24 24" fill="#6366f1" style={{ width: 24 * s, height: 24 * s }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v6a1 1 0 001 1h6v9H6z"/>
          </svg>
          <span style={{ color: '#f8fafc', fontSize: 16 * s, fontWeight: 700 }}>WriteVault</span>
        </div>
        <span style={{ color: '#475569', fontSize: 13 * s }}>writevault.app</span>
      </div>

      {/* Center content */}
      <div className="absolute flex items-center" style={{ top: 80 * s, left: 32 * s, right: 32 * s, bottom: 80 * s }}>
        {/* Left text */}
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f8fafc', fontSize: 28 * s, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 * s }}>
            I proved my essay<br />is human.
          </div>
          <div style={{ color: '#94a3b8', fontSize: 14 * s, marginTop: 12 * s }}>
            My WriteVault Authenticity Score:
          </div>
        </div>

        {/* Right score circle */}
        <div className="relative flex items-center justify-center" style={{ width: 160 * s, height: 160 * s }}>
          <svg viewBox="0 0 120 120" style={{ width: 160 * s, height: 160 * s, position: 'absolute' }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#1f1f3d" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={scoreColor(score)}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 327} 327`}
              transform="rotate(-90 60 60)"
              style={{ filter: `drop-shadow(0 0 6px ${scoreColor(score)}40)` }}
            />
          </svg>
          <div className="text-center" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: scoreColor(score), fontSize: 48 * s, fontWeight: 900, lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 14 * s, marginTop: 2 * s }}>/ 100</div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute flex items-center justify-between" style={{ bottom: 24 * s, left: 32 * s, right: 32 * s }}>
        <div style={{ height: 1, flex: 1, background: 'rgba(99,102,241,0.2)', marginRight: 16 * s }} />
        <span style={{ color: '#475569', fontSize: 11 * s, whiteSpace: 'nowrap' }}>5-layer behavioral analysis</span>
        <div style={{ height: 1, width: 24 * s, background: 'rgba(99,102,241,0.2)', margin: `0 ${12 * s}px` }} />
        <span style={{ color: '#475569', fontSize: 11 * s, whiteSpace: 'nowrap' }}>Verified by WriteVault</span>
      </div>
    </div>
  )
}

export { ShareCard }
