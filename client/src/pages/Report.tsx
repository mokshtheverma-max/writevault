import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { track, Events } from '../utils/analytics'
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  ScatterChart, Scatter,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Download, Copy, ArrowLeft, ShieldCheck, Printer,
  ExternalLink, Upload, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { loadSession } from '../utils/sessionStorage'
import { generatePDFReport } from '../utils/reportGenerator'
import DNAManager from '../dna'
import type { DNAComparisonResult } from '../dna'
import LayerScoreBar from '../components/LayerScoreBar'
import VerificationBadge from '../components/VerificationBadge'
import HumanScoreGauge from '../components/HumanScoreGauge'
import LoadingSpinner from '../components/LoadingSpinner'
import type { AuthenticityReport } from '../engine/types'

// ─── chart helpers ────────────────────────────────────────────────────────────

function buildWpmTimeline(events: import('../types').KeystrokeEvent[]) {
  const kd = events.filter(e => e.type === 'keydown')
  if (kd.length < 2) return []
  const first = kd[0].timestamp
  const last  = kd[kd.length - 1].timestamp
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
    .map(e => ({
      position: Math.round((e.timestamp - startTime) / 1000),
      duration: Math.round((e.pauseDuration ?? 0) / 1000),
    }))
}

function buildEditHeatmap(events: import('../types').KeystrokeEvent[], contentLen: number) {
  if (!contentLen) return []
  const segs = 10, segSz = Math.ceil(contentLen / segs)
  const counts = Array(segs).fill(0)
  events.filter(e => e.type === 'delete' && e.position != null).forEach(e => {
    counts[Math.min(Math.floor((e.position ?? 0) / segSz), segs - 1)]++
  })
  return counts.map((c, i) => ({ segment: `${i * 10}-${(i + 1) * 10}%`, edits: c }))
}

function buildKeystrokeRhythm(events: import('../types').KeystrokeEvent[]) {
  const kd = events.filter(e => e.type === 'keydown')
  const data: { seq: number; gap: number }[] = []
  for (let i = 1; i < kd.length && i < 200; i++) {
    const gap = kd[i].timestamp - kd[i - 1].timestamp
    if (gap < 5000) data.push({ seq: i, gap: Math.round(gap) })
  }
  return data
}

function loadEngineReport(sessionId: string): AuthenticityReport | null {
  const raw = localStorage.getItem(`wv_report_${sessionId}`)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthenticityReport } catch { return null }
}

// ─── layer names mapping from engine ─────────────────────────────────────────

const LAYER_DEFS = [
  { key: 'temporal'  as const, name: 'Temporal Patterns',     weight: 0.30 },
  { key: 'revision'  as const, name: 'Revision Behavior',     weight: 0.25 },
  { key: 'cognitive' as const, name: 'Cognitive Signals',     weight: 0.20 },
  { key: 'biometric' as const, name: 'Behavioral Biometrics', weight: 0.15 },
  { key: 'linguistic'as const, name: 'Linguistic Flow',       weight: 0.10 },
]

// ─── component ────────────────────────────────────────────────────────────────

export default function Report() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const session = sessionId ? loadSession(sessionId) : null
  const engineReport = sessionId ? loadEngineReport(sessionId) : null
  const hash = sessionId ? localStorage.getItem(`wv_hash_${sessionId}`) ?? '' : ''

  const dnaComparison: DNAComparisonResult | null = (() => {
    if (!sessionId) return null
    const raw = localStorage.getItem(`wv_dna_comparison_${sessionId}`)
    if (!raw) return null
    try { return JSON.parse(raw) as DNAComparisonResult } catch { return null }
  })()
  const dnaSessionCount = DNAManager.getSessionCount()

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Session not found.</p>
          <button onClick={() => navigate('/')} className="bg-primary text-white px-6 py-2 rounded-lg">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const duration  = Math.round((session.endTime - session.startTime) / 60000)
  const wordCount = session.content.trim().split(/\s+/).filter(Boolean).length
  const sessionDate = new Date(session.startTime).toLocaleString()
  const wpmData   = buildWpmTimeline(session.events)
  const pauseData = buildPauseMap(session.events, session.startTime)
  const heatData  = buildEditHeatmap(session.events, session.content.length)
  const rhythmData = buildKeystrokeRhythm(session.events)

  const scoreColor = session.humanScore >= 75 ? '#16a34a' : session.humanScore >= 50 ? '#ca8a04' : '#dc2626'
  const tooltipStyle = {
    contentStyle: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 },
  }

  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      await generatePDFReport(session, hash || 'unavailable')
      toast.success('PDF downloaded!')
      track(Events.REPORT_GENERATED)
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleCopyHash = async () => {
    if (!hash) return toast.error('No hash available')
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      toast.success('Hash copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Action bar (hidden on print) ──────────────────────── */}
      <div className="no-print flex items-center gap-3 px-8 py-3 bg-surface border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(`/dashboard/${session.id}`)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleCopyHash}
            className="flex items-center gap-2 border border-border hover:border-border-light text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Hash'}
          </button>

          <button
            onClick={() => navigate(`/verify/${encodeURIComponent(hash)}`)}
            className="flex items-center gap-2 border border-border hover:border-border-light text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Verify Online
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 border border-border hover:border-border-light text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-glow-sm"
          >
            {pdfLoading ? (
              <LoadingSpinner size={16} color="white" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {pdfLoading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* ── Report content ──────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-violet-600" />
              <span className="font-bold text-lg text-violet-600 tracking-tight">WriteVault</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Certificate of Writing Authenticity</h1>
            <p className="text-sm text-gray-500 mt-1">{session.title}</p>
          </div>
          <HumanScoreGauge score={session.humanScore} size={130} verdictText={
            engineReport?.verdict.split(' — ')[0].toUpperCase()
          } />
        </div>

        {/* Session info */}
        <div className="grid grid-cols-2 gap-6 mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Document Title', session.title],
                ['Date & Time', sessionDate],
                ['Duration', `${duration} minutes`],
                ['Word Count', wordCount.toString()],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="py-1 text-gray-500 font-medium pr-4 whitespace-nowrap">{k}</td>
                  <td className="py-1 text-gray-900">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Session ID</p>
            <p className="font-mono text-xs text-gray-700 break-all mb-3">{session.id}</p>
            {hash && (
              <>
                <p className="text-xs text-gray-500 font-medium mb-1">SHA-256 Verification Hash</p>
                <p className="font-mono text-xs text-gray-700 break-all">{hash}</p>
              </>
            )}
          </div>
        </div>

        {/* Verification badge */}
        {hash && (
          <div className="mb-8">
            <VerificationBadge hash={hash} verified />
          </div>
        )}

        {/* 5-layer scores (from engine if available, else fallback) */}
        {engineReport && (
          <div className="mb-8">
            <h2 className="font-bold text-lg mb-4">5-Layer Authenticity Analysis</h2>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-5">
              {LAYER_DEFS.map(({ key, name, weight }) => {
                const layer = engineReport.layers[key]
                return (
                  <LayerScoreBar
                    key={key}
                    name={name}
                    score={Math.round(layer.score)}
                    weight={weight}
                    interpretation={
                      layer.flags.length > 0
                        ? layer.flags[0]
                        : layer.score >= 75
                        ? 'No anomalies detected'
                        : layer.score >= 50
                        ? 'Minor signals detected'
                        : 'Significant signals detected'
                    }
                    flags={layer.flags}
                  />
                )
              })}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Composite Score</span>
                <span
                  className="text-xl font-bold"
                  style={{ color: scoreColor }}
                >
                  {engineReport.compositeScore.toFixed(1)} / 100
                </span>
              </div>
              <p className="text-sm text-gray-500 italic">{engineReport.verdict}</p>
            </div>
          </div>
        )}

        {/* Writing DNA Verification */}
        {dnaComparison && dnaComparison.confidence > 30 && (
          <div className="mb-8">
            <h2 className="font-bold text-lg mb-4">Writing DNA Verification</h2>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">DNA Match Score</p>
                  <p className="text-3xl font-black tabular-nums" style={{
                    color: dnaComparison.matchScore > 70 ? '#16a34a' : dnaComparison.matchScore > 45 ? '#ca8a04' : '#dc2626'
                  }}>
                    {dnaComparison.matchScore}<span className="text-base font-normal text-gray-400"> / 100</span>
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  dnaComparison.verdict === 'strong_match' ? 'bg-green-50 text-green-700 border-green-200' :
                  dnaComparison.verdict === 'likely_match' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  dnaComparison.verdict === 'uncertain'    ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                             'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {dnaComparison.verdict === 'strong_match' ? '✓ Strong DNA Match' :
                   dnaComparison.verdict === 'likely_match' ? '~ Likely Match' :
                   dnaComparison.verdict === 'uncertain'    ? '? Uncertain' :
                                                              '✗ DNA Mismatch'}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                This student has written {dnaSessionCount} session{dnaSessionCount !== 1 ? 's' : ''} in WriteVault.
                This session matches their established writing fingerprint with{' '}
                <strong>{dnaComparison.matchScore}%</strong> similarity across temporal rhythm, revision behavior,
                biometric typing patterns, and linguistic style.
              </p>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 text-sm">
                {([
                  ['Temporal Rhythm',     dnaComparison.layerMatches.temporal],
                  ['Revision Patterns',   dnaComparison.layerMatches.revision],
                  ['Biometric Signature', dnaComparison.layerMatches.biometric],
                  ['Linguistic Style',    dnaComparison.layerMatches.linguistic],
                ] as [string, number][]).map(([label, score]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className="text-xs font-semibold">{score}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400">
                DNA confidence: {dnaComparison.confidence}% · Based on {dnaSessionCount} session{dnaSessionCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Behavioral analytics table */}
        <h2 className="font-bold text-lg mb-3">Behavioral Analytics</h2>
        <table className="w-full text-sm mb-8 border border-gray-200 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-2 px-4 text-gray-600 font-medium">Metric</th>
              <th className="text-right py-2 px-4 text-gray-600 font-medium">Value</th>
              <th className="text-left py-2 px-4 text-gray-600 font-medium">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {([
              ['Total Pauses (>2s)', session.metadata.totalPauses, session.metadata.totalPauses >= 3 ? 'Normal — thinking pauses detected' : 'Low — unusually linear writing'],
              ['Average Pause', `${Math.round(session.metadata.avgPauseMs / 1000)}s`, 'Typical cognitive processing time'],
              ['Total Deletions', session.metadata.totalDeletions, session.metadata.totalDeletions >= 5 ? 'Normal — iterative editing detected' : 'Low — minimal revisions'],
              ['Cursor Jumps', session.metadata.cursorJumps, session.metadata.cursorJumps >= 2 ? 'Normal — non-linear editing' : 'Low'],
              ['Average WPM', Math.round(session.metadata.avgWPM), 'Sustained writing speed'],
              ['WPM Variance', Math.round(session.metadata.wpmVariance), session.metadata.wpmVariance >= 15 ? 'High — natural speed variation' : 'Low — suspiciously consistent'],
              ['Revision Density', `${(session.metadata.revisionDensity * 100).toFixed(1)}%`, session.metadata.revisionDensity >= 0.15 ? 'High — authentic iterative composition' : 'Normal'],
              ['Paste Attempts', session.events.filter(e => e.type === 'paste_attempt').length, session.events.filter(e => e.type === 'paste_attempt').length === 0 ? 'None detected' : 'Paste events logged'],
            ] as [string, string | number, string][]).map(([metric, value, note]) => (
              <tr key={metric} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-4 font-medium text-gray-800">{metric}</td>
                <td className="py-2 px-4 text-right font-mono font-bold">{value}</td>
                <td className="py-2 px-4 text-gray-500 text-xs">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Charts */}
        <h2 className="font-bold text-lg mb-4">Writing Process Visualizations</h2>
        <div className="grid grid-cols-2 gap-5 mb-8">
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">WPM Timeline</h3>
            <p className="text-xs text-gray-400 mb-3">Jagged = authentic human pacing</p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={wpmData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="wpm" stroke="#7c3aed" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">Pause Map</h3>
            <p className="text-xs text-gray-400 mb-3">Thinking pauses are authentic writing markers</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={pauseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="position" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="duration" stroke="#7c3aed" fill="#7c3aed22" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">Revision Heatmap</h3>
            <p className="text-xs text-gray-400 mb-3">Heavy revisions indicate authentic composition</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={heatData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="segment" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="edits" fill="#7c3aed" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">Keystroke Rhythm</h3>
            <p className="text-xs text-gray-400 mb-3">Scattered cloud = human typing signature</p>
            <ResponsiveContainer width="100%" height={140}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="seq" tick={{ fontSize: 9 }} />
                <YAxis dataKey="gap" tick={{ fontSize: 9 }} />
                <Tooltip {...tooltipStyle} />
                <Scatter data={rhythmData} fill="#7c3aed" fillOpacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document content */}
        <h2 className="font-bold text-lg mb-3">Submitted Document</h2>
        <div className="border border-gray-200 rounded-xl p-6 mb-8 bg-gray-50">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">{session.content}</p>
        </div>

        {/* Educator Verification */}
        <div className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-xl">
          <h2 className="font-bold text-base mb-2 text-gray-800">For Educator Verification</h2>
          <p className="text-sm text-gray-600 mb-3">
            Your teacher can independently verify this report without relying on your copy.
            They retrieve data directly from WriteVault's servers — which cannot be altered by you.
          </p>
          <div className="space-y-1 text-sm text-gray-600">
            <p>Verification portal: <span className="font-mono font-medium text-gray-800">writevault.app/verify/teacher</span></p>
            {session.id && (
              <p>Session ID: <span className="font-mono font-medium text-gray-800">{session.id}</span></p>
            )}
            {hash && (
              <p>Verification hash: <span className="font-mono text-xs text-gray-700 break-all">{hash.slice(0, 32)}…</span></p>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            They do not need your copy of this report — they retrieve data directly from WriteVault's servers.
          </p>
        </div>

        {/* Verification footer */}
        <div className="border-t-2 border-gray-200 pt-6">
          {hash && (
            <div className="mb-4 flex items-center gap-3">
              <Upload className="w-4 h-4 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500">
                To publicly verify this report, visit{' '}
                <button
                  onClick={() => navigate(`/verify/${encodeURIComponent(hash)}`)}
                  className="text-violet-600 underline underline-offset-2 hover:text-violet-800"
                >
                  writevault.app/verify
                </button>{' '}
                and enter the hash above.
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500 leading-relaxed">
            This document was generated by WriteVault. The session ID and SHA-256 hash above can be used
            to verify the authenticity of this writing session. WriteVault cryptographically records the
            complete writing process. The hash is computed from the full keystroke event log, document
            content, and session start time — any alteration invalidates the hash.
          </p>
          <p className="mt-3 font-mono text-gray-400 text-xs">
            Generated: {new Date().toISOString()} | WriteVault v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
