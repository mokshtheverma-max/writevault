import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listSessions, deleteSession as deleteLocalSession } from '../utils/sessionStorage'
import { deleteSessionRemote } from '../utils/api'
import type { WritingSession } from '../types'
import {
  Search,
  PenLine,
  FileText,
  Clock,
  ChevronRight,
  Download,
  Share2,
} from 'lucide-react'
import ErrorBoundary from '../components/ErrorBoundary'
import { SkeletonRow } from '../components/Skeleton'
import { usePageTitle } from '../hooks/usePageTitle'

/* ── Helpers ──────────────────────────────────────────────────────────── */

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

function scoreBg(score: number): string {
  if (score >= 75) return 'bg-success/10 border-success/20 text-success'
  if (score >= 50) return 'bg-warning/10 border-warning/20 text-warning'
  if (score >= 25) return 'bg-orange-400/10 border-orange-400/20 text-orange-400'
  return 'bg-danger/10 border-danger/20 text-danger'
}

type Filter = 'all' | 'week' | 'month' | 'high' | 'low'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',   label: 'All' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'high',  label: 'High Score' },
  { key: 'low',   label: 'Low Score' },
]

/* ── Component ────────────────────────────────────────────────────────── */

export default function Sessions() {
  usePageTitle('WriteVault — Sessions')
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<WritingSession[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [deleteTarget, setDeleteTarget] = useState<WritingSession | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleting(true)
    try {
      deleteLocalSession(id)
      localStorage.removeItem(`wv_report_${id}`)
      localStorage.removeItem(`wv_hash_${id}`)
      localStorage.removeItem(`wv_dna_comparison_${id}`)
      await deleteSessionRemote(id)
      setSessions(prev => (prev ? prev.filter(s => s.id !== id) : prev))
      toast.success('Session deleted')
    } catch (e) {
      console.error('Delete failed:', e)
      toast.error('Failed to delete session')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  useEffect(() => {
    try {
      setSessions(listSessions())
    } catch (e) {
      console.error('Failed to load sessions:', e)
      setLoadError('We could not load your sessions. Please refresh the page.')
      setSessions([])
    }
  }, [])

  const isLoading = sessions === null
  const safeSessions = sessions ?? []

  const filtered = useMemo(() => {
    let result = safeSessions

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s => s.title.toLowerCase().includes(q))
    }

    // Filter
    const now = Date.now()
    switch (filter) {
      case 'week':
        result = result.filter(s => now - s.startTime < 7 * 86_400_000)
        break
      case 'month':
        result = result.filter(s => now - s.startTime < 30 * 86_400_000)
        break
      case 'high':
        result = [...result].sort((a, b) => b.humanScore - a.humanScore)
        break
      case 'low':
        result = [...result].sort((a, b) => a.humanScore - b.humanScore)
        break
    }

    return result
  }, [safeSessions, search, filter])

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Sessions</h1>
            <p className="text-text-secondary text-sm mt-1">
              {isLoading
                ? 'Loading sessions…'
                : `${safeSessions.length} total session${safeSessions.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <PenLine size={16} /> New Essay
          </Link>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-elevated'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Session list */}
        <ErrorBoundary section label="Sessions list failed to load.">
        {loadError ? (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl p-6 text-center">
            <p className="font-medium mb-2">Unable to load sessions</p>
            <p className="text-text-secondary">{loadError}</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <PenLine size={40} className="mx-auto text-primary mb-4 opacity-60" />
            <h3 className="text-text-primary font-medium mb-1">
              {safeSessions.length === 0 ? 'No sessions yet' : 'No matching sessions'}
            </h3>
            <p className="text-text-secondary text-sm mb-5">
              {safeSessions.length === 0
                ? 'Write your first essay to start building your proof history'
                : 'Try a different search term or filter'}
            </p>
            {safeSessions.length === 0 && (
              <Link
                to="/editor"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Start Writing <ChevronRight size={14} />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map(session => {
                const words = session.content.trim().split(/\s+/).filter(Boolean).length
                const duration = formatDuration(session.endTime - session.startTime)
                return (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, height: 0, marginTop: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="bg-surface border border-border rounded-xl p-5 hover:border-border-light transition-all cursor-pointer group"
                    onClick={() => navigate(`/dashboard/${session.id}`)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText size={18} className="text-text-muted shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">{session.title}</div>
                          <div className="text-xs text-text-muted">{formatDate(session.startTime)}</div>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-xs text-text-secondary shrink-0">
                        <span>{words.toLocaleString()} words</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {duration}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${scoreBg(session.humanScore)}`}>
                          {session.humanScore}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/dashboard/${session.id}`) }}
                            className="text-xs text-primary hover:text-primary-hover flex items-center gap-0.5"
                            title="View Dashboard"
                          >
                            View <ChevronRight size={12} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/report/${session.id}`) }}
                            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-elevated transition-colors"
                            title="Download Report"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/dashboard/${session.id}`) }}
                            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-elevated transition-colors"
                            title="Share"
                          >
                            <Share2 size={14} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteTarget(session) }}
                            className="p-1.5 text-danger hover:text-red-400 rounded-lg hover:bg-danger/10 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
        </ErrorBoundary>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-surface border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-danger" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-text-primary">Delete this session?</h3>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    This permanently removes the session and its report. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-elevated disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm rounded-lg bg-danger hover:bg-red-600 text-white font-medium disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                >
                  {deleting && <span className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
