import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DNAManager from '../dna'
import { listSessions } from '../utils/sessionStorage'
import {
  Fingerprint,
  ChevronRight,
  Activity,
  Scissors,
  Keyboard,
  BookOpen,
} from 'lucide-react'
import ErrorBoundary from '../components/ErrorBoundary'
import { Skeleton, SkeletonCard } from '../components/Skeleton'
import type { WritingSession } from '../types'
import { usePageTitle } from '../hooks/usePageTitle'

/* ── Helpers ──────────────────────────────────────────────────────────── */

function confidenceBadge(level: string): { label: string; cls: string } {
  switch (level) {
    case 'high':     return { label: 'High Confidence', cls: 'bg-success/10 text-success border-success/20' }
    case 'moderate': return { label: 'Moderate',        cls: 'bg-warning/10 text-warning border-warning/20' }
    case 'low':      return { label: 'Low Confidence',  cls: 'bg-orange-400/10 text-orange-400 border-orange-400/20' }
    default:         return { label: 'Building',        cls: 'bg-primary/10 text-primary border-primary/20' }
  }
}

/* ── Component ────────────────────────────────────────────────────────── */

export default function DNAProfile() {
  usePageTitle('WriteVault — Writing DNA')
  const [sessions, setSessions] = useState<WritingSession[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setSessions(listSessions())
    } catch (e) {
      console.error('Failed to load sessions:', e)
      setLoadError('We could not load your DNA data. Please refresh the page.')
      setSessions([])
    }
  }, [])

  const isLoading = sessions === null
  const safeSessions = sessions ?? []

  const dna = DNAManager.getDNAProfile()
  const sessionCount = DNAManager.getSessionCount()
  const confidence = DNAManager.getConfidenceLevel()
  const badge = confidenceBadge(confidence)

  const totalWords = useMemo(
    () => safeSessions.reduce((sum, s) => sum + s.content.trim().split(/\s+/).filter(Boolean).length, 0),
    [safeSessions]
  )

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Fingerprint size={28} className="text-primary" />
              Your Writing DNA
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              A unique behavioral fingerprint built from your writing history
            </p>
          </div>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {loadError && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl p-4 mb-6">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        ) : (
        <ErrorBoundary section label="DNA profile failed to render.">
        {/* ── Onboarding (< 2 sessions) ─────────────────────────── */}
        {sessionCount < 2 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Fingerprint size={40} className="text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your DNA profile is being built</h2>
            <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto">
              Each essay you write helps us learn your unique writing style. Keep writing to unlock your full fingerprint.
            </p>

            <div className="max-w-sm mx-auto space-y-4 text-left mb-8">
              <Step n={1} done={sessionCount >= 1} label="First session recorded" />
              <Step n={2} done={sessionCount >= 2} label="Second session \u2014 comparison begins" />
              <Step n={3} done={sessionCount >= 3} label="Third session \u2014 biometrics lock in" />
              <Step n={5} done={sessionCount >= 5} label="Fifth session \u2014 high confidence" />
              <Step n={10} done={sessionCount >= 10} label="Full profile \u2014 court-ready evidence" />
            </div>

            <Link
              to="/editor"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Write your next essay to continue <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          /* ── Full Profile (>= 2 sessions) ───────────────────────── */
          <>
            {/* Overview stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="text-xs text-text-muted mb-1">Sessions Analyzed</div>
                <div className="text-2xl font-bold">{sessionCount}</div>
              </div>
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="text-xs text-text-muted mb-1">Overall Confidence</div>
                <div className="text-2xl font-bold">{Math.round(dna.confidence.overall)}%</div>
              </div>
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="text-xs text-text-muted mb-1">Words Analyzed</div>
                <div className="text-2xl font-bold">{totalWords.toLocaleString()}</div>
              </div>
            </div>

            {/* Layer cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Temporal */}
              <ProfileCard
                icon={<Activity size={20} />}
                title="Temporal Profile"
                confidence={Math.round(dna.confidence.temporal)}
              >
                <ProfileRow label="Mean typing speed" value={`${Math.round(dna.temporal.meanIKI)}ms IKI`} />
                <ProfileRow label="Rhythm variance" value={`\u00B1${Math.round(dna.temporal.stdDevIKI)}ms`} />
                <ProfileRow label="Avg pause duration" value={`${Math.round(dna.temporal.avgPauseDuration)}ms`} />
                <ProfileRow label="Burst length" value={`${Math.round(dna.temporal.preferredBurstLength)} chars`} />
                <ProfileRow label="Pause frequency" value={`${(dna.temporal.pauseFrequency * 100).toFixed(1)}%`} />
                <ProfileRow label="Fatigue rate" value={`${(dna.temporal.fatigueRate * 100).toFixed(1)}%`} />
              </ProfileCard>

              {/* Revision */}
              <ProfileCard
                icon={<Scissors size={20} />}
                title="Revision Profile"
                confidence={Math.round(dna.confidence.revision)}
              >
                <ProfileRow label="Deletion rate" value={`${(dna.revision.personalDeletionRate * 100).toFixed(1)}%`} />
                <ProfileRow label="Correction latency" value={`${Math.round(dna.revision.avgCorrectionLatency)}ms`} />
                <ProfileRow label="Revision density" value={`${(dna.revision.revisionDensity * 100).toFixed(1)}%`} />
                <ProfileRow label="Backtrack frequency" value={`${(dna.revision.backtrackFrequency * 100).toFixed(1)}%`} />
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-[11px] text-text-muted">
                    Typical student: 8-15% deletion rate, 400-800ms correction latency
                  </div>
                </div>
              </ProfileCard>

              {/* Biometric */}
              <ProfileCard
                icon={<Keyboard size={20} />}
                title="Biometric Profile"
                confidence={Math.round(dna.confidence.biometric)}
              >
                <div className="mb-3">
                  <div className="text-xs text-text-muted mb-2">Top digrams (personal timing)</div>
                  <div className="flex flex-wrap gap-1.5">
                    {dna.biometric.commonDigrams.slice(0, 10).map(d => (
                      <span key={d} className="bg-elevated border border-border rounded px-2 py-0.5 text-xs text-text-secondary font-mono">
                        &ldquo;{d}&rdquo; &rarr; {Math.round(dna.biometric.digramLatencies[d] ?? 0)}ms
                      </span>
                    ))}
                  </div>
                </div>
                <ProfileRow label="Avg dwell time" value={`${Math.round(dna.biometric.avgDwellTime)}ms`} />
                <ProfileRow label="Hand alternation" value={`${(dna.biometric.handAlternationRatio * 100).toFixed(0)}%`} />
                <ProfileRow label="Error rate" value={`${(dna.biometric.errorRate * 100).toFixed(1)}%`} />
              </ProfileCard>

              {/* Linguistic */}
              <ProfileCard
                icon={<BookOpen size={20} />}
                title="Linguistic Profile"
                confidence={Math.round(dna.confidence.linguistic)}
              >
                <ProfileRow label="Avg sentence length" value={`${Math.round(dna.linguistic.avgSentenceLength)} words`} />
                <ProfileRow label="Sentence variation" value={`\u00B1${Math.round(dna.linguistic.sentenceLengthStdDev)} words`} />
                <ProfileRow label="Vocabulary richness" value={`${(dna.linguistic.vocabularyRichness * 100).toFixed(1)}%`} />
                <ProfileRow label="Contraction rate" value={`${(dna.linguistic.contractionRate * 100).toFixed(1)}%`} />
                <ProfileRow label="Self-reference rate" value={`${(dna.linguistic.selfReferenceRate * 100).toFixed(1)}%`} />
                {dna.linguistic.commonTransitions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[11px] text-text-muted mb-1">Style markers</div>
                    <div className="flex flex-wrap gap-1.5">
                      {dna.linguistic.commonTransitions.slice(0, 6).map(t => (
                        <span key={t} className="bg-elevated border border-border rounded px-2 py-0.5 text-[11px] text-text-secondary">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </ProfileCard>

            </div>
          </>
        )}
        </ErrorBoundary>
        )}

      </div>
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────── */

function Step({ n, done, label }: { n: number; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        done ? 'bg-success/20 text-success' : 'bg-elevated text-text-muted'
      }`}>
        {done ? '\u2713' : n}
      </div>
      <span className={`text-sm ${done ? 'text-text-secondary line-through' : 'text-text-secondary'}`}>
        {label}
      </span>
    </div>
  )
}

function ProfileCard({ icon, title, confidence, children }: {
  icon: React.ReactNode
  title: string
  confidence: number
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        <span className="text-xs text-text-muted">{confidence}% confident</span>
      </div>
      {children}
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-medium font-mono">{value}</span>
    </div>
  )
}
