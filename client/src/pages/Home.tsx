import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listSessions } from '../utils/sessionStorage'
import DNAManager from '../dna'
import { checkMilestones } from '../components/MilestoneToast'
import type { WritingSession } from '../types'
import {
  House,
  PenLine,
  History,
  Fingerprint,
  Sparkles,
  GraduationCap,
  Settings,
  LogOut,
  FileText,
  Clock,
  Shield,
  Share2,
  ChevronRight,
  Zap,
} from 'lucide-react'
import BottomTabBar from '../components/BottomTabBar'
import ErrorBoundary from '../components/ErrorBoundary'
import { SkeletonCard, SkeletonRow } from '../components/Skeleton'
import { usePageTitle } from '../hooks/usePageTitle'

/* ── Helpers ──────────────────────────────────────────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m ${s % 60}s`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-success'
  if (score >= 50) return 'text-warning'
  if (score >= 25) return 'text-orange-400'
  return 'text-danger'
}

function scoreBg(score: number): string {
  if (score >= 75) return 'bg-success/10 border-success/20 text-success'
  if (score >= 50) return 'bg-warning/10 border-warning/20 text-warning'
  if (score >= 25) return 'bg-orange-400/10 border-orange-400/20 text-orange-400'
  return 'bg-danger/10 border-danger/20 text-danger'
}

/* ── Nav links ────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { to: '/',                icon: House,         label: 'Home' },
  { to: '/editor',          icon: PenLine,       label: 'New Essay' },
  { to: '/sessions',        icon: History,       label: 'My Sessions' },
  { to: '/dna',             icon: Fingerprint,   label: 'Writing DNA' },
  { to: '/pricing',         icon: Sparkles,      label: 'Pricing' },
  { to: '/verify/teacher',  icon: GraduationCap, label: 'For Educators' },
]

/* ── Component ────────────────────────────────────────────────────────── */

export default function Home() {
  usePageTitle('WriteVault — Home')
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sessions, setSessions] = useState<WritingSession[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const loaded = listSessions()
      setSessions(loaded)
      if (loaded.length > 0) checkMilestones({ sessionCount: loaded.length })
    } catch (e) {
      console.error('Failed to load sessions:', e)
      setLoadError('We could not load your sessions. Please refresh the page.')
      setSessions([])
    }
  }, [])

  const isLoading = sessions === null
  const safeSessions = sessions ?? []

  const recentSessions = safeSessions.slice(0, 5)

  const totalWords = useMemo(
    () => safeSessions.reduce((sum, s) => sum + s.content.trim().split(/\s+/).filter(Boolean).length, 0),
    [safeSessions]
  )

  const avgScore = useMemo(() => {
    if (safeSessions.length === 0) return 0
    return Math.round(safeSessions.reduce((sum, s) => sum + s.humanScore, 0) / safeSessions.length)
  }, [safeSessions])

  const dna = DNAManager.getDNAProfile()
  const dnaConfidence = Math.round(dna.confidence.overall)
  const dnaSessionCount = DNAManager.getSessionCount()

  const firstName = user?.name?.split(' ')[0] ?? 'Writer'

  return (
    <div className="flex min-h-screen md:h-screen bg-base text-text-primary md:overflow-hidden">

      {/* ── Sidebar (desktop only) ─────────────────────────── */}
      <aside className="hidden md:flex w-60 bg-surface border-r border-border h-screen flex-col shrink-0">
        {/* User */}
        <div className="px-5 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(user?.name?.[0] ?? 'W').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{user?.name ?? 'Writer'}</div>
              <div className="text-xs text-text-muted truncate">{user?.email ?? ''}</div>
            </div>
          </div>
          <span className="inline-block text-[10px] font-medium uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
            {user?.role === 'teacher' ? 'Teacher' : 'Student'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-3">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-elevated w-full transition-colors"
          >
            <Settings size={18} /> Settings
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-danger hover:bg-danger/5 w-full transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 md:overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">

          {/* Welcome */}
          <section className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary">
              {getGreeting()}, {firstName}.
            </h1>
            <p className="text-text-secondary text-sm mt-1">Here's your writing activity.</p>
          </section>

          {loadError && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl p-4 mb-6">
              {loadError}
            </div>
          )}

          {/* Stats Row */}
          <ErrorBoundary section label="Stats failed to load.">
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {isLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                <>
                  <StatCard
                    icon={<History size={20} className="text-primary" />}
                    label="Total Sessions"
                    value={safeSessions.length}
                    sub={`${safeSessions.length} session${safeSessions.length !== 1 ? 's' : ''} recorded`}
                  />
                  <StatCard
                    icon={<FileText size={20} className="text-primary" />}
                    label="Words Written"
                    value={totalWords.toLocaleString()}
                    sub={`${totalWords.toLocaleString()} total words`}
                  />
                  <StatCard
                    icon={<Fingerprint size={20} className="text-primary" />}
                    label="DNA Confidence"
                    value={`${dnaConfidence}%`}
                    sub={`Based on ${dnaSessionCount} session${dnaSessionCount !== 1 ? 's' : ''}`}
                  />
                  <StatCard
                    icon={<Zap size={20} className={scoreColor(avgScore)} />}
                    label="Avg Human Score"
                    value={`${avgScore}/100`}
                    sub="average"
                    valueClass={scoreColor(avgScore)}
                  />
                </>
              )}
            </section>
          </ErrorBoundary>

          {/* Recent Sessions */}
          <ErrorBoundary section label="Recent sessions failed to load.">
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Recent Sessions</h2>
              <Link
                to="/editor"
                className="text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
              >
                New Essay <ChevronRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center">
                <PenLine size={40} className="mx-auto text-primary mb-4 opacity-60" />
                <h3 className="text-text-primary font-medium mb-1">No sessions yet</h3>
                <p className="text-text-secondary text-sm mb-5">
                  Write your first essay to start building your proof history
                </p>
                <Link
                  to="/editor"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  Start Writing <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map(session => {
                  const words = session.content.trim().split(/\s+/).filter(Boolean).length
                  const duration = formatDuration(session.endTime - session.startTime)
                  return (
                    <div
                      key={session.id}
                      onClick={() => navigate(`/dashboard/${session.id}`)}
                      className="bg-surface border border-border rounded-xl p-5 hover:border-border-light transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText size={18} className="text-text-muted shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate">{session.title}</div>
                            <div className="text-xs text-text-muted">{formatDate(session.startTime)}</div>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-6 text-xs text-text-secondary shrink-0">
                          <span>{words.toLocaleString()} words</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {duration}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${scoreBg(session.humanScore)}`}>
                            {session.humanScore}
                          </span>
                          <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            View <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
          </ErrorBoundary>

          {/* DNA Progress */}
          <ErrorBoundary section label="Writing DNA panel failed to load.">
          <section className="mb-8">
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Fingerprint size={28} className="text-primary" />
                    <h3 className="text-lg font-semibold text-text-primary">Your Writing DNA</h3>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-text-muted mb-1.5">
                      <span>Profile progress</span>
                      <span>{Math.min(dnaSessionCount, 10)} of 10 sessions</span>
                    </div>
                    <div className="h-2 bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (dnaSessionCount / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">
                    {dnaSessionCount < 10
                      ? `${10 - dnaSessionCount} more session${10 - dnaSessionCount !== 1 ? 's' : ''} to full profile`
                      : 'Full profile unlocked'}
                  </p>
                </div>

                <div className="flex-1">
                  {dnaSessionCount < 3 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-text-secondary mb-3">Keep writing to build your fingerprint</p>
                      <Milestone n={3} current={dnaSessionCount} label="Biometrics lock in" />
                      <Milestone n={5} current={dnaSessionCount} label="High confidence" />
                      <Milestone n={10} current={dnaSessionCount} label="Court-ready evidence" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <ConfidenceBar label="Temporal" value={Math.round(dna.confidence.temporal)} />
                      <ConfidenceBar label="Revision" value={Math.round(dna.confidence.revision)} />
                      <ConfidenceBar label="Biometric" value={Math.round(dna.confidence.biometric)} />
                      <ConfidenceBar label="Linguistic" value={Math.round(dna.confidence.linguistic)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
          </ErrorBoundary>

          {/* Quick Actions */}
          <section className="mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/editor"
                className="bg-primary hover:bg-primary-hover text-white rounded-xl p-5 transition-colors group"
              >
                <PenLine size={22} className="mb-2" />
                <div className="font-medium text-sm">Write New Essay</div>
                <div className="text-xs text-white/70 mt-0.5">Start a new recorded session</div>
              </Link>
              <Link
                to="/verify/teacher"
                className="bg-surface border border-border hover:border-border-light rounded-xl p-5 transition-colors group"
              >
                <Shield size={22} className="mb-2 text-primary" />
                <div className="font-medium text-sm text-text-primary">Verify a Session</div>
                <div className="text-xs text-text-muted mt-0.5">Cryptographic proof lookup</div>
              </Link>
              <Link
                to="/sessions"
                className="bg-surface border border-border hover:border-border-light rounded-xl p-5 transition-colors group"
              >
                <Share2 size={22} className="mb-2 text-primary" />
                <div className="font-medium text-sm text-text-primary">Share With Teacher</div>
                <div className="text-xs text-text-muted mt-0.5">Send proof to your educator</div>
              </Link>
            </div>
          </section>

        </div>
      </main>

      <BottomTabBar />
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────── */

function StatCard({ icon, label, value, sub, valueClass }: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  valueClass?: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-text-muted">{label}</span></div>
      <div className={`text-2xl font-bold ${valueClass ?? 'text-text-primary'}`}>{value}</div>
      <div className="text-xs text-text-muted mt-1">{sub}</div>
    </div>
  )
}

function Milestone({ n, current, label }: { n: number; current: number; label: string }) {
  const done = current >= n
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
        done ? 'bg-success/20 text-success' : 'bg-elevated text-text-muted'
      }`}>
        {done ? '\u2713' : n}
      </div>
      <span className={done ? 'text-text-secondary line-through' : 'text-text-secondary'}>{label}</span>
    </div>
  )
}

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-muted">{value}%</span>
      </div>
      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
