import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  GraduationCap,
  Search,
  Download,
  FileText,
  Clock,
  ShieldCheck,
  LogOut,
  Settings,
  House,
  History,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  getTeacherDashboard,
  teacherVerifyBulk,
  type BulkVerifyResult,
  type TeacherDashboardData,
} from '../utils/api'
import ErrorBoundary from '../components/ErrorBoundary'

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatDate(ts: number): string {
  if (!ts) return '—'
  const ms = ts < 1e12 ? ts * 1000 : ts
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function scoreColor(score: number | undefined): string {
  if (score == null) return 'text-text-muted'
  if (score >= 75) return 'text-success'
  if (score >= 50) return 'text-warning'
  if (score >= 25) return 'text-orange-400'
  return 'text-danger'
}

function scoreBg(score: number | undefined): string {
  if (score == null) return 'bg-elevated border-border text-text-muted'
  if (score >= 75) return 'bg-success/10 border-success/20 text-success'
  if (score >= 50) return 'bg-warning/10 border-warning/20 text-warning'
  if (score >= 25) return 'bg-orange-400/10 border-orange-400/20 text-orange-400'
  return 'bg-danger/10 border-danger/20 text-danger'
}

function escapeCsv(value: string | number | undefined | null): string {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/* ── Nav links (teacher role) ─────────────────────────────────────────── */

const TEACHER_NAV = [
  { to: '/',         icon: House,         label: 'Home' },
  { to: '/teacher',  icon: ShieldCheck,   label: 'Educator Dashboard' },
  { to: '/verify/teacher', icon: Search,  label: 'Verify Session' },
  { to: '/sessions', icon: History,       label: 'My Sessions' },
  { to: '/pricing',  icon: Sparkles,      label: 'Pricing' },
]

/* ── Component ────────────────────────────────────────────────────────── */

export default function TeacherDashboard() {
  usePageTitle('WriteVault — Educator Dashboard')
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [dashboard, setDashboard] = useState<TeacherDashboardData | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const [bulkInput, setBulkInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyResults, setVerifyResults] = useState<BulkVerifyResult[] | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== 'teacher' && user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    getTeacherDashboard()
      .then(setDashboard)
      .catch(e => {
        console.error('Teacher dashboard load failed:', e)
        setDashboardError(e?.message || 'Failed to load dashboard')
      })
  }, [])

  const parsedInputs = useMemo(() => {
    return bulkInput
      .split(/[\r\n]+/)
      .map(s => s.trim())
      .filter(Boolean)
  }, [bulkInput])

  async function handleVerifyBulk() {
    setVerifyError(null)
    setVerifyResults(null)

    if (parsedInputs.length === 0) {
      setVerifyError('Paste at least one session ID or hash')
      return
    }
    if (parsedInputs.length > 50) {
      setVerifyError('Max 50 entries at once')
      return
    }

    setVerifying(true)
    try {
      const results = await teacherVerifyBulk(parsedInputs)
      setVerifyResults(results)
      const found = results.filter(r => r.found).length
      toast.success(`${found} / ${results.length} verified`)
    } catch (e) {
      console.error('Bulk verify error:', e)
      setVerifyError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  function handleExportCsv() {
    const rows: string[][] = [
      ['Input', 'Found', 'Session ID', 'Title', 'Human Score', 'SHA-256 Hash', 'Word Count', 'Created At', 'Error'],
    ]

    const allRows: BulkVerifyResult[] = [
      ...(verifyResults ?? []),
      ...(dashboard?.recentVerifications.map(r => ({
        input: r.sha256Hash,
        found: true,
        id: r.sessionId,
        title: r.title,
        humanScore: r.humanScore,
        sha256Hash: r.sha256Hash,
        createdAt: r.createdAt,
      })) ?? []),
    ]

    if (allRows.length === 0) {
      toast('Nothing to export yet — verify some sessions first.')
      return
    }

    for (const r of allRows) {
      rows.push([
        escapeCsv(r.input),
        r.found ? 'yes' : 'no',
        escapeCsv(r.id),
        escapeCsv(r.title),
        escapeCsv(r.humanScore),
        escapeCsv(r.sha256Hash),
        escapeCsv(r.wordCount),
        r.createdAt ? formatDate(r.createdAt) : '',
        escapeCsv(r.error),
      ])
    }

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `writevault-verifications-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-screen md:h-screen bg-base text-text-primary md:overflow-hidden">

      {/* Sidebar */}
      <aside className="hidden md:flex w-60 bg-surface border-r border-border h-screen flex-col shrink-0">
        <div className="px-5 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(user?.name?.[0] ?? 'T').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{user?.name ?? 'Educator'}</div>
              <div className="text-xs text-text-muted truncate">{user?.email ?? ''}</div>
            </div>
          </div>
          <span className="inline-block text-[10px] font-medium uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
            Educator
          </span>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {TEACHER_NAV.map(({ to, icon: Icon, label }) => {
            const active = typeof window !== 'undefined' && window.location.pathname === to
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

        <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-3">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-elevated w-full transition-colors">
            <Settings size={18} /> Settings
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-danger hover:bg-danger/5 w-full transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <GraduationCap className="w-7 h-7 text-primary" />
              <h1 className="text-2xl font-bold text-text-primary">Educator Dashboard</h1>
            </div>
            <p className="text-text-secondary text-sm">Verify student writing sessions</p>
          </header>

          {/* Stats */}
          <ErrorBoundary section label="Stats failed to load.">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
              <StatCard
                icon={<ShieldCheck size={20} className="text-primary" />}
                label="Total Verified"
                value={dashboard?.totalVerified ?? '—'}
                sub="sessions you've verified"
              />
              <StatCard
                icon={<History size={20} className="text-primary" />}
                label="Recent"
                value={dashboard?.recentVerifications.length ?? '—'}
                sub="last 10 verifications"
              />
              <StatCard
                icon={<FileText size={20} className="text-primary" />}
                label="Shared With You"
                value={dashboard?.sharedSessions.length ?? 0}
                sub="student-shared sessions"
              />
            </section>
          </ErrorBoundary>

          {dashboardError && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl p-4 mb-6 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{dashboardError}</span>
            </div>
          )}

          {/* Bulk Verify */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-text-primary">Bulk Verify</h2>
              <span className="text-xs text-text-muted">{parsedInputs.length} / 50 entries</span>
            </div>
            <p className="text-text-secondary text-sm mb-3">
              Paste session IDs or SHA-256 hashes — one per line. Up to 50 at once.
            </p>

            <textarea
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              placeholder={'WV-XXXXXX-XXXXXX\n4f1b...\nabc...'}
              rows={6}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors resize-y"
            />

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                onClick={handleVerifyBulk}
                disabled={verifying || parsedInputs.length === 0}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {verifying
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Search size={16} />}
                Verify All
              </button>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 bg-surface border border-border hover:border-border-light text-text-primary text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <Download size={16} /> Export as CSV
              </button>
            </div>

            {verifyError && (
              <div className="mt-4 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {/* Results table */}
            {verifyResults && verifyResults.length > 0 && (
              <div className="mt-5 bg-surface border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-elevated text-text-muted uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Student / Title</th>
                        <th className="text-left px-4 py-3 font-medium">Score</th>
                        <th className="text-left px-4 py-3 font-medium">Date</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="text-right px-4 py-3 font-medium">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifyResults.map((r, i) => (
                        <tr
                          key={`${r.input}-${i}`}
                          className="border-t border-border hover:bg-elevated/60 cursor-pointer transition-colors"
                          onClick={() => {
                            if (r.found && (r.sha256Hash || r.id)) {
                              navigate(`/verify/teacher?hash=${encodeURIComponent(r.sha256Hash || r.id || '')}`)
                            }
                          }}
                        >
                          <td className="px-4 py-3 text-text-primary">
                            <div className="font-medium truncate max-w-[280px]">{r.title || '—'}</div>
                            <div className="text-xs text-text-muted font-mono truncate max-w-[280px]">{r.input}</div>
                          </td>
                          <td className="px-4 py-3">
                            {r.found ? (
                              <span className={`text-sm font-bold px-2 py-0.5 rounded border ${scoreBg(r.humanScore)}`}>
                                {r.humanScore}
                              </span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {r.found && r.createdAt ? formatDate(r.createdAt) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {r.found ? (
                              <span className="inline-flex items-center gap-1 text-xs text-success">
                                <ShieldCheck size={12} /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-danger">
                                <AlertCircle size={12} /> {r.error || 'Not found'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {r.found && (
                              <span className="text-xs text-primary hover:underline">Open →</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Recent verifications */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Recent Verifications</h2>

            {dashboard === null && !dashboardError ? (
              <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-muted text-sm">
                Loading…
              </div>
            ) : dashboard && dashboard.recentVerifications.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-10 text-center">
                <ShieldCheck size={32} className="mx-auto text-primary mb-3 opacity-60" />
                <p className="text-text-secondary text-sm">
                  No verifications yet. Paste a student session ID above to get started.
                </p>
              </div>
            ) : dashboard ? (
              <div className="space-y-2">
                {dashboard.recentVerifications.map(r => (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/verify/teacher?hash=${encodeURIComponent(r.sha256Hash)}`)}
                    className="bg-surface border border-border rounded-xl p-4 hover:border-border-light transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText size={16} className="text-text-muted shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{r.title}</div>
                        <div className="text-xs text-text-muted font-mono truncate">{r.sha256Hash.slice(0, 24)}…</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline text-xs text-text-muted">
                        <Clock size={12} className="inline mr-1" />
                        {formatDate(r.verifiedAt)}
                      </span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded border ${scoreBg(r.humanScore)}`}>
                        {r.humanScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-text-muted">{label}</span></div>
      <div className={`text-2xl font-bold text-text-primary ${scoreColor(undefined)}`}>{value}</div>
      <div className="text-xs text-text-muted mt-1">{sub}</div>
    </div>
  )
}
