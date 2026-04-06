import type { TeacherViewResult } from '../utils/api'

interface Props {
  data: TeacherViewResult
}

function scoreColor(score: number): string {
  return score >= 75 ? '#16a34a' : score >= 50 ? '#ca8a04' : score >= 25 ? '#ea580c' : '#dc2626'
}

function scoreBgBorder(score: number): { bg: string; border: string; text: string } {
  if (score >= 75) return { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700' }
  if (score >= 50) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' }
  if (score >= 25) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' }
  return               { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700' }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(startMs: number, endMs: number): string {
  const mins = Math.round((endMs - startMs) / 60000)
  if (mins < 60) return `${mins} minutes`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const LAYER_LABELS: Record<string, string> = {
  temporal:  'Temporal Analysis',
  revision:  'Revision Behavior',
  cognitive: 'Cognitive Signals',
  biometric: 'Biometric Patterns',
  linguistic:'Linguistic Profile',
}

export default function VerificationCard({ data }: Props) {
  const scoreStyle = scoreBgBorder(data.humanScore)
  const verifiedAt = new Date(data.verifiedAt * 1000)

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 space-y-8">

      {/* ── Header row ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{data.title}</h2>
          <p className="text-sm text-gray-500 mt-1">Session ID: {data.id}</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
          <span>✓</span> Session Verified
        </span>
      </div>

      {/* ── Metadata grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 p-5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
        {([
          ['Session ID',         data.id],
          ['Date Written',       formatDate(data.startTime)],
          ['Total Time',         formatDuration(data.startTime, data.endTime)],
          ['Word Count',         `${data.wordCount} words`],
          ['Verification Hash',  `${data.sha256Hash.slice(0, 16)}…`],
          ['Times Verified',     data.verificationCount],
        ] as [string, string | number][]).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-gray-500 font-medium">{k}</span>
            <span className="text-gray-800 font-mono text-right">{v}</span>
          </div>
        ))}
      </div>

      {/* ── Human Writing Score ──────────────────────────────────── */}
      <div className="text-center py-6 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-2">Behavioral Authenticity Score</p>
        <p
          className="text-7xl font-black tabular-nums"
          style={{ color: scoreColor(data.humanScore) }}
        >
          {data.humanScore}
        </p>
        <p className="text-gray-400 text-sm mt-1">/ 100</p>
        <p className="text-xs text-gray-400 mt-3">Based on 5-layer analysis of writing behavior</p>
        <div className={`mt-4 inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${scoreStyle.bg} ${scoreStyle.border} ${scoreStyle.text}`}>
          {data.humanScore >= 75
            ? 'Strong behavioral evidence of authentic writing'
            : data.humanScore >= 50
            ? 'Moderate evidence, consistent with human writing'
            : data.humanScore >= 25
            ? 'Mixed signals — manual review recommended'
            : 'Patterns inconsistent with human writing behavior'}
        </div>
      </div>

      {/* ── 5-Layer breakdown ────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">5-Layer Analysis</h3>
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-2 px-4 font-medium text-gray-600">Layer</th>
              <th className="text-right py-2 px-4 font-medium text-gray-600">Score</th>
              <th className="text-left py-2 px-4 font-medium text-gray-600">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {(Object.entries(data.layerScores) as [string, { score: number; interpretation: string }][]).map(([key, layer]) => (
              <tr key={key} className="border-t border-gray-100">
                <td className="py-2.5 px-4 text-gray-700">{LAYER_LABELS[key] ?? key}</td>
                <td className="py-2.5 px-4 text-right font-bold tabular-nums" style={{ color: scoreColor(layer.score) }}>
                  {layer.score}
                </td>
                <td className="py-2.5 px-4 text-gray-500">{layer.interpretation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Writing Timeline ─────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Writing Timeline</h3>
        <div className="space-y-1.5 text-sm text-gray-700 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p>Session began: <span className="font-medium">{data.writingTimeline.sessionBegan}</span></p>
          <p>Active writing period: <span className="font-medium">{data.writingTimeline.activePeriodMinutes} minutes</span></p>
          <p>Natural breaks detected: <span className="font-medium">{data.writingTimeline.naturalBreaksDetected}</span></p>
          {data.writingTimeline.longestPauseMs > 0 && (
            <p>Longest pause: <span className="font-medium">{data.writingTimeline.longestPauseFormatted}</span> (likely research or thinking)</p>
          )}
          <p>Session completed: <span className="font-medium">{data.writingTimeline.sessionCompleted}</span></p>
        </div>
      </div>

      {/* ── Key Behavioral Observations ──────────────────────────── */}
      {data.behavioralObservations.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Key Behavioral Observations</h3>
          <ul className="space-y-1.5">
            {data.behavioralObservations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                {obs}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Honest Disclaimer ────────────────────────────────────── */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs font-semibold text-gray-600 mb-1.5">⚠ Important Context</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          This report reflects behavioral patterns during the recorded writing session. WriteVault recommends
          considering this data alongside your knowledge of the student, class participation, and other work
          samples. No automated tool should be the sole basis for academic integrity decisions.
        </p>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 pt-4 space-y-1 text-xs text-gray-400">
        <p>Verified by WriteVault on {verifiedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at {verifiedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
        <p>Session data retrieved independently from WriteVault servers</p>
        <p>This report cannot be modified by the submitting student</p>
        <p className="mt-2">Questions? <a href="mailto:educator@writevault.app" className="text-indigo-500 hover:underline">educator@writevault.app</a></p>
      </div>
    </div>
  )
}
