import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { getTeacherView, type TeacherViewResult } from '../utils/api'
import VerificationCard from '../components/VerificationCard'

// ─── Accordion ───────────────────────────────────────────────────────────────

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-600 border-t border-gray-100 pt-4 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TeacherVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [input, setInput] = useState(searchParams.get('hash') ?? searchParams.get('session') ?? '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TeacherViewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // Auto-verify if hash/session in URL
  useEffect(() => {
    const preloaded = searchParams.get('hash') ?? searchParams.get('session')
    if (preloaded && preloaded.length >= 8) {
      handleVerify(preloaded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleVerify(value?: string) {
    const target = (value ?? input).trim()
    if (!target) return

    setLoading(true)
    setSearched(true)
    setError(null)
    setResult(null)

    try {
      const res = await getTeacherView(target)
      if (res.ok) {
        setResult(res.data)
      } else {
        setError(res.error)
      }
    } catch {
      setError('Connection error. Please check your network and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-800" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Header bar ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="font-semibold text-gray-700 text-sm hover:text-gray-900 transition-colors"
            >
              WriteVault
            </button>
            <span className="text-gray-400 text-sm hidden sm:block">Educator Verification Portal</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Lock className="w-3.5 h-3.5" />
            <span>Independent Verification</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-2 pb-1">
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
            This portal allows educators to independently verify student writing sessions. Results are
            retrieved directly from WriteVault servers and cannot be modified by students.
          </p>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        {/* Verify by Session ID / Hash */}
        <section>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Verify a Writing Session</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter the session ID or SHA-256 verification hash provided by the student.
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Session ID or Verification Hash
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="WV-XXXXXX-XXXXXX or SHA-256 hash"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors font-mono"
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
            />
            <button
              onClick={() => handleVerify()}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Search className="w-4 h-4" />}
              Verify Session
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
              <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
              Retrieving session from secure servers…
            </div>
          )}

          {/* Error state */}
          {!loading && searched && error && (
            <div className="mt-6 p-5 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-sm font-semibold text-red-700 mb-1">Session Not Found</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success state */}
          {!loading && result && (
            <div className="mt-6">
              <VerificationCard data={result} />
            </div>
          )}
        </section>

        {/* How to interpret results */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">How to Interpret Results</h2>
          <div className="space-y-2">

            <Accordion title="What does the Human Writing Score mean?">
              <div className="space-y-2 mb-3">
                {([
                  ['75–100', 'Strong behavioral evidence of authentic writing', '#16a34a'],
                  ['50–74',  'Moderate evidence, consistent with human writing', '#ca8a04'],
                  ['25–49',  'Mixed signals — manual review recommended',        '#ea580c'],
                  ['0–24',   'Patterns inconsistent with human writing behavior','#dc2626'],
                ] as [string, string, string][]).map(([range, label, color]) => (
                  <div key={range} className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold shrink-0 pt-0.5" style={{ color }}>{range}</span>
                    <span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs border-t border-gray-100 pt-3">
                This score is one data point among many. WriteVault recommends using it alongside your
                own knowledge of the student's writing ability.
              </p>
            </Accordion>

            <Accordion title="What can WriteVault prove?">
              <ul className="space-y-1.5">
                {[
                  'The writing session occurred over a real time period',
                  'Keystrokes were entered manually one at a time',
                  'Natural human pause and revision patterns were present',
                  'The document content matches what was typed',
                  'The session has not been tampered with (SHA-256 verified)',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-gray-600">
                    <span className="text-green-600 shrink-0 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Accordion>

            <Accordion title="What WriteVault cannot prove">
              <ul className="space-y-1.5 mb-3">
                {[
                  'That the student was not reading from another screen',
                  "The student's identity (no biometric ID verification)",
                  'That the student didn\'t receive verbal assistance',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-gray-600">
                    <span className="text-red-500 shrink-0 font-bold">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-gray-500 text-xs border-t border-gray-100 pt-3">
                We believe transparency about limitations builds more trust than overclaiming. WriteVault
                is one tool among many for assessing academic integrity.
              </p>
            </Accordion>

            <Accordion title="Is this data reliable?">
              <p className="text-gray-600 mb-3">
                Every session generates a unique fingerprint — like a wax seal on an envelope. If anyone
                modifies the session data, the fingerprint changes and verification fails.
              </p>
              <p className="text-gray-600">
                Students cannot alter their reports after submission. The SHA-256 hash is computed
                server-side from the raw keystroke events, document content, and session timing.
                Any modification — even a single character — produces a completely different hash.
              </p>
            </Accordion>

          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 text-xs text-gray-400 space-y-1">
          <p>WriteVault Educator Verification Portal</p>
          <p>Questions? <a href="mailto:educator@writevault.app" className="text-indigo-500 hover:underline">educator@writevault.app</a></p>
          <p>
            <a href="/methodology" className="text-indigo-500 hover:underline">Read our verification methodology</a>
            {' · '}
            <a href="/" className="text-indigo-500 hover:underline">WriteVault home</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
