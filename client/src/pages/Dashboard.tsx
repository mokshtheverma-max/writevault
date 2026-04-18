import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  ScatterChart, Scatter,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useEffect, useState } from 'react'
import { Fingerprint, ArrowLeft, FileText, Share2, Lock, Megaphone, AlertCircle } from 'lucide-react'
import ShareModal from '../components/ShareModal'
import ShareScoreModal from '../components/ShareScoreModal'
import UpgradePrompt from '../components/UpgradePrompt'
import ErrorBoundary from '../components/ErrorBoundary'
import { Skeleton } from '../components/Skeleton'
import { usePlan } from '../hooks/usePlan'
import { loadSession } from '../utils/sessionStorage'
import HumanScoreGauge from '../components/HumanScoreGauge'
import StatBadge from '../components/StatBadge'
import type { WritingSession } from '../types'
import type { AuthenticityReport, LayerScore } from '../engine/types'
import DNAManager from '../dna'
import type { DNAComparisonResult } from '../dna'
import { usePageTitle } from '../hooks/usePageTitle'

// ─── chart data builders ──────────────────────────────────────────────────────

function buildWpmTimeline(events: import('../types').KeystrokeEvent[]) {
  const kd = events.filter(e => e.type === 'keydown')
  if (kd.length < 2) return []
  const first = kd[0].timestamp, last = kd[kd.length - 1].timestamp
  const bucket = 30000
  const data: { time: number; wpm: number }[] = []
  for (let t = first; t <= last; t += bucket) {
    const n = kd.filter(e => e.timestamp >= t && e.timestamp < t + bucket).length
    data.push({ time: Math.round((t - first) / 60000), wpm: Math.round((n / 5) / (bucket / 60000)) })
  }
  return data
}

function buildPauseMap(events: import('../types').KeystrokeEvent[], startTime: number) {
  return events
    .filter(e => e.type === 'pause' && (e.pauseDuration ?? 0) > 2000)
    .map(e => ({ position: Math.round((e.timestamp - startTime) / 1000), duration: Math.round((e.pauseDuration ?? 0) / 1000) }))
}

function buildEditHeatmap(events: import('../types').KeystrokeEvent[], contentLen: number) {
  if (!contentLen) return []
  const segs = 10, sz = Math.ceil(contentLen / segs)
  const counts = Array(segs).fill(0)
  events.filter(e => e.type === 'delete' && e.position != null).forEach(e => {
    counts[Math.min(Math.floor((e.position ?? 0) / sz), segs - 1)]++
  })
  return counts.map((c, i) => ({ segment: `${i * 10}%`, edits: c }))
}

function buildKeystrokeRhythm(events: import('../types').KeystrokeEvent[]) {
  const kd = events.filter(e => e.type === 'keydown')
  const data: { seq: number; gap: number }[] = []
  for (let i = 1; i < kd.length && i < 300; i++) {
    const gap = kd[i].timestamp - kd[i - 1].timestamp
    if (gap < 5000) data.push({ seq: i, gap: Math.round(gap) })
  }
  return data
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function loadReport(sid: string): AuthenticityReport | null {
  const raw = localStorage.getItem(`wv_report_${sid}`)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthenticityReport } catch { return null }
}

function loadDNAComparison(sid: string): DNAComparisonResult | null {
  const raw = localStorage.getItem(`wv_dna_comparison_${sid}`)
  if (!raw) return null
  try { return JSON.parse(raw) as DNAComparisonResult } catch { return null }
}

const CHART_TOOLTIP = {
  contentStyle: {
    background: '#151528',
    border: '1px solid #1f1f3d',
    borderRadius: 8,
    color: '#f8fafc',
    fontSize: 12,
  },
}

const VERDICT_META: Record<DNAComparisonResult['verdict'], { bg: string; text: string; border: string; label: string }> = {
  strong_match: { bg: 'bg-success/10',  text: 'text-success',  border: 'border-success/25',  label: '✓ Strong DNA Match' },
  likely_match: { bg: 'bg-primary/10',  text: 'text-primary',  border: 'border-primary/25',  label: '~ Likely Match' },
  uncertain:    { bg: 'bg-warning/10',  text: 'text-warning',  border: 'border-warning/25',  label: '? Uncertain' },
  mismatch:     { bg: 'bg-danger/10',   text: 'text-danger',   border: 'border-danger/25',   label: '✗ DNA Mismatch' },
}

// ─── sub-components ───────────────────────────────────────────────────────────

function LayerBar({ label, weight, layer }: { label: string; weight: number; layer: LayerScore }) {
  const { score, confidence, flags } = layer
  const color = score > 70 ? '#10b981' : score > 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">{label}</span>
          <span className="text-xs text-text-muted">×{(weight * 100).toFixed(0)}%</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color, opacity: 0.3 + confidence * 0.7 }}
        />
      </div>
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {flags.map((f, i) => (
            <span key={i} className="px-2 py-0.5 bg-danger/10 border border-danger/25 text-danger text-xs rounded">
              {f.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-text-muted mt-1 text-right">{(confidence * 100).toFixed(0)}% conf.</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-base text-text-primary">
      <header className="bg-surface border-b border-border px-4 sm:px-8 py-5">
        <Skeleton className="h-6 w-48" />
      </header>
      <div className="p-4 sm:p-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}

function DNALayerBar({ label, score }: { label: string; score: number }) {
  const color = score > 70 ? '#10b981' : score > 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

type DashboardData = {
  session: WritingSession
  report: AuthenticityReport | null
  dnaComparison: DNAComparisonResult | null
}

export default function Dashboard() {
  usePageTitle('WriteVault — Session Analysis')
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [shareOpen, setShareOpen] = useState(false)
  const [shareScoreOpen, setShareScoreOpen] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { canExportPDF, canShareTeacher, canUseDNA } = usePlan()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }
    try {
      const session = loadSession(sessionId)
      if (!session) {
        setData(null)
      } else {
        setData({
          session,
          report: loadReport(sessionId),
          dnaComparison: loadDNAComparison(sessionId),
        })
      }
    } catch (e) {
      console.error('Failed to load session:', e)
      setLoadError('We could not load this session. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  async function handleDashboardDelete() {
    if (!data) return
    const id = data.session.id
    setDeleting(true)
    try {
      deleteLocalSession(id)
      localStorage.removeItem(`wv_report_${id}`)
      localStorage.removeItem(`wv_hash_${id}`)
      localStorage.removeItem(`wv_dna_comparison_${id}`)
      await deleteSessionRemote(id)
      toast.success('Session deleted')
      navigate('/sessions')
    } catch (e) {
      console.error('Delete failed:', e)
      toast.error('Failed to delete session')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const dnaProfile      = DNAManager.getDNAProfile()
  const dnaSessionCount = DNAManager.getSessionCount()
  const dnaConfLevel    = DNAManager.getConfidenceLevel()

  if (loading) return <LoadingSkeleton />

  if (loadError) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Couldn't load session</h2>
          <p className="text-text-secondary text-sm mb-6">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Session not found.</p>
          <button onClick={() => navigate('/editor')} className="bg-primary text-white px-6 py-2 rounded-lg">
            Start new session
          </button>
        </div>
      </div>
    )
  }

  const { session, report, dnaComparison } = data

  const duration  = Math.round((session.endTime - session.startTime) / 60000)
  const wordCount = session.content.trim().split(/\s+/).filter(Boolean).length
  const wpmData   = buildWpmTimeline(session.events)
  const pauseData = buildPauseMap(session.events, session.startTime)
  const heatData  = buildEditHeatmap(session.events, session.content.length)
  const rhythmData = buildKeystrokeRhythm(session.events)

  return (
    <div className="min-h-screen bg-base text-text-primary flex flex-col">

      {/* ── Top header ─────────────────────────────────────────────── */}
      <header className="bg-surface border-b border-border px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/editor')}
            className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">New Session</span>
          </button>
          <span className="text-border hidden sm:inline">|</span>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-text-primary leading-tight">Session Analysis</h1>
            <p className="text-text-muted text-xs mt-0.5 truncate max-w-[200px] sm:max-w-none">
              {session.title} · {new Date(session.startTime).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShareScoreOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-glow-sm"
          >
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Share Your Score</span>
            <span className="sm:hidden">Share Score</span>
          </button>
          <button
            onClick={() => canShareTeacher ? setShareOpen(true) : setShowUpgrade(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-300 px-3 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all relative"
          >
            {!canShareTeacher && <Lock className="w-3.5 h-3.5 text-text-muted" />}
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share With Teacher</span>
            <span className="sm:hidden">Share</span>
          </button>
          <button
            onClick={() => canExportPDF ? navigate(`/report/${session.id}`) : setShowUpgrade(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-3 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-glow-sm relative"
          >
            {!canExportPDF && <Lock className="w-3.5 h-3.5" />}
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Generate Report →</span>
            <span className="sm:hidden">Report</span>
          </button>

          {/* Three-dots dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-2.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
              aria-label="More actions"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-xl z-30 py-1 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      if (canExportPDF) navigate(`/report/${session.id}`)
                      else setShowUpgrade(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors text-left"
                  >
                    <Download className="w-4 h-4" /> Download Report
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      if (canShareTeacher) setShareOpen(true)
                      else setShowUpgrade(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors text-left"
                  >
                    <Share2 className="w-4 h-4" /> Share With Teacher
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setShowDeleteConfirm(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger hover:text-red-400 hover:bg-danger/5 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Session
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {showUpgrade && <UpgradePrompt onDismiss={() => setShowUpgrade(false)} />}

      {shareScoreOpen && (
        <ShareScoreModal
          score={session.humanScore}
          sessionTitle={session.title}
          wordCount={wordCount}
          onClose={() => setShareScoreOpen(false)}
        />
      )}

      {shareOpen && (() => {
        const hash = localStorage.getItem(`wv_hash_${session.id}`) ?? ''
        return <ShareModal session={session} hash={hash} onClose={() => setShareOpen(false)} />
      })()}

      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* ── Sidebar (horizontal cards on mobile, vertical sidebar on desktop) ── */}
        <aside className="md:w-80 shrink-0 bg-surface md:border-r border-b md:border-b-0 border-border flex md:flex-col p-4 sm:p-6 gap-4 sm:gap-6 overflow-x-auto md:overflow-x-visible md:overflow-y-auto">

          {/* Score card */}
          <div className="bg-elevated border border-border rounded-2xl p-4 sm:p-6 text-center shrink-0 min-w-[200px] md:min-w-0">
            <HumanScoreGauge score={session.humanScore} size={160} />
            <p className="text-xs text-text-muted mt-3">Based on 5-layer behavioral analysis</p>
          </div>

          {/* Session stats */}
          <div className="shrink-0 min-w-[220px] md:min-w-0">
            <h2 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">Session Stats</h2>
            <div className="space-y-0">
              {[
                ['Duration',       `${duration}m`],
                ['Words',          wordCount],
                ['Avg WPM',        Math.round(session.metadata.avgWPM)],
                ['Keystrokes',     session.events.filter(e => e.type === 'keydown').length],
                ['Pauses',         session.metadata.totalPauses],
                ['Deletions',      session.metadata.totalDeletions],
                ['Cursor Jumps',   session.metadata.cursorJumps],
                ['Paste Attempts', session.events.filter(e => e.type === 'paste_attempt').length],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                  <span className="text-text-secondary text-sm">{k}</span>
                  <span className="text-text-primary font-semibold text-sm">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DNA stats */}
          <div className="border-t md:border-t border-border pt-5 shrink-0 min-w-[220px] md:min-w-0">
            <h2 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5" /> Writing DNA
            </h2>
            <div className="space-y-0">
              {[
                ['Sessions Recorded',  dnaSessionCount],
                ['DNA Confidence',     `${Math.round(dnaProfile.confidence.overall)}%`],
                ['Fingerprint Status', dnaConfLevel],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                  <span className="text-text-secondary text-sm">{k}</span>
                  <span className="text-primary font-semibold text-sm capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto p-4 sm:p-8 space-y-6 sm:space-y-8">

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBadge label="Total Time" value={`${duration}m`} />
            <StatBadge label="Words" value={wordCount} />
            <StatBadge label="WPM Variance" value={Math.round(session.metadata.wpmVariance)} />
            <StatBadge label="Revision Density" value={`${(session.metadata.revisionDensity * 100).toFixed(0)}%`} />
          </div>

          {/* 5-Layer Engine */}
          {report && (
            <ErrorBoundary section label="Authenticity layers failed to render.">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Authenticity Layers</h2>
                <div className="flex items-center gap-2">
                  <span
                    className="text-2xl font-black tabular-nums"
                    style={{ color: report.compositeScore > 70 ? '#10b981' : report.compositeScore > 45 ? '#f59e0b' : '#ef4444' }}
                  >
                    {report.compositeScore.toFixed(1)}
                  </span>
                  <span className="text-text-muted text-xs">/ 100</span>
                </div>
              </div>
              {report.verdict && (
                <p className="text-sm text-text-muted italic mb-4">{report.verdict}</p>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4">
                <div>
                  <LayerBar label="Temporal Analysis"  weight={report.weights.temporal}   layer={report.layers.temporal}   />
                  <LayerBar label="Revision Patterns"  weight={report.weights.revision}   layer={report.layers.revision}   />
                  <LayerBar label="Cognitive Load"     weight={report.weights.cognitive}  layer={report.layers.cognitive}  />
                </div>
                <div>
                  <LayerBar label="Biometric Signature"    weight={report.weights.biometric}  layer={report.layers.biometric}  />
                  <LayerBar label="Linguistic Fingerprint" weight={report.weights.linguistic} layer={report.layers.linguistic} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-6 text-xs text-text-muted font-mono">
                <span>Proof: {report.proofId}</span>
                <span className="truncate">Hash: {report.sessionHash.slice(0, 24)}…</span>
              </div>
            </section>
            </ErrorBoundary>
          )}

          {/* Writing DNA — gated for free users */}
          {!canUseDNA && (
            <section className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Fingerprint className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-text-primary">Writing DNA</h2>
                <Lock className="w-4 h-4 text-text-muted ml-auto" />
              </div>
              <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                Writing DNA builds your unique typing fingerprint across sessions — biometric proof impossible to fake.
                Upgrade to the Student plan to unlock this feature.
              </p>
              <button
                onClick={() => setShowUpgrade(true)}
                className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Unlock Writing DNA
              </button>
            </section>
          )}

          {canUseDNA && dnaSessionCount === 1 && !dnaComparison && (
            <section className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Fingerprint className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-text-primary">Building your Writing DNA</h2>
              </div>
              <p className="text-text-secondary text-sm mb-5 leading-relaxed">
                Your personal typing fingerprint is being established. Write 2 more sessions to enable
                DNA matching — a biometric record impossible to fake over time.
              </p>
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: '33%' }} />
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap">1 of 3 sessions</span>
              </div>
            </section>
          )}

          {canUseDNA && dnaComparison && (
            <section className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-text-primary">Writing DNA Analysis</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${VERDICT_META[dnaComparison.verdict].bg} ${VERDICT_META[dnaComparison.verdict].text} ${VERDICT_META[dnaComparison.verdict].border}`}>
                  {VERDICT_META[dnaComparison.verdict].label}
                </span>
              </div>

              <div className="flex items-end gap-2 mb-6">
                <span className="text-5xl font-black tabular-nums" style={{
                  color: dnaComparison.matchScore > 70 ? '#10b981' : dnaComparison.matchScore > 45 ? '#f59e0b' : '#ef4444',
                }}>
                  {dnaComparison.matchScore}
                </span>
                <span className="text-text-muted text-lg mb-1">/ 100 match</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 mb-5">
                <div>
                  <DNALayerBar label="Temporal Rhythm"     score={dnaComparison.layerMatches.temporal}   />
                  <DNALayerBar label="Revision Patterns"   score={dnaComparison.layerMatches.revision}   />
                </div>
                <div>
                  <DNALayerBar label="Biometric Signature" score={dnaComparison.layerMatches.biometric}  />
                  <DNALayerBar label="Linguistic Style"    score={dnaComparison.layerMatches.linguistic} />
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {dnaComparison.details.map((d, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">·</span>{d}
                  </li>
                ))}
              </ul>

              <p className="text-xs text-text-muted border-t border-border pt-3 mt-3">
                Based on {dnaSessionCount} session{dnaSessionCount !== 1 ? 's' : ''} · confidence {dnaComparison.confidence}%
              </p>
            </section>
          )}

          {/* Charts 2×2 */}
          <ErrorBoundary section label="Charts failed to render.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {[
              {
                title: 'WPM Timeline',
                sub: 'Jagged = authentic human pacing',
                chart: (
                  <LineChart data={wpmData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f3d" />
                    <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} label={{ value: 'min', position: 'insideRight', fill: '#475569', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Line type="monotone" dataKey="wpm" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                ),
              },
              {
                title: 'Pause Map',
                sub: 'Thinking pauses = authentic markers',
                chart: (
                  <AreaChart data={pauseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f3d" />
                    <XAxis dataKey="position" tick={{ fill: '#475569', fontSize: 10 }} label={{ value: 'sec', position: 'insideRight', fill: '#475569', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                    <Tooltip {...CHART_TOOLTIP} formatter={(v) => [`${v}s`, 'Pause']} />
                    <Area type="monotone" dataKey="duration" stroke="#6366f1" fill="#6366f120" strokeWidth={2} />
                  </AreaChart>
                ),
              },
              {
                title: 'Revision Heatmap',
                sub: 'Heavy revisions = authentic composition',
                chart: (
                  <BarChart data={heatData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f3d" />
                    <XAxis dataKey="segment" tick={{ fill: '#475569', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Bar dataKey="edits" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ),
              },
              {
                title: 'Keystroke Rhythm',
                sub: 'Scattered cloud = human. Regular dots = transcription.',
                chart: (
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f3d" />
                    <XAxis dataKey="seq" name="Keystroke" tick={{ fill: '#475569', fontSize: 10 }} />
                    <YAxis dataKey="gap" name="Gap (ms)" tick={{ fill: '#475569', fontSize: 10 }} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={rhythmData} fill="#6366f1" fillOpacity={0.6} />
                  </ScatterChart>
                ),
              },
            ].map(({ title, sub, chart }) => (
              <div key={title} className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <h3 className="text-text-primary font-medium mb-1 text-sm sm:text-base">{title}</h3>
                <p className="text-text-muted text-xs mb-4">{sub}</p>
                <div className="h-[200px] sm:h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
