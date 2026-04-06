import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShieldCheck, ShieldX, Search, ArrowLeft } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { verifyHash, type VerifyResult } from '../utils/api'

function scoreColor(score: number) {
  return score >= 75 ? '#22c55e' : score >= 50 ? '#facc15' : '#ef4444'
}

function verdictLabel(verdict: string) {
  const lower = verdict.toLowerCase()
  if (lower.includes('strong')) return 'AUTHENTIC'
  if (lower.includes('moderate')) return 'LIKELY AUTHENTIC'
  if (lower.includes('mixed')) return 'SUSPICIOUS'
  return 'LIKELY AI-GENERATED'
}

export default function Verify() {
  const { hash: hashParam } = useParams<{ hash?: string }>()
  const navigate = useNavigate()

  const [hashInput, setHashInput] = useState(hashParam ? decodeURIComponent(hashParam) : '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Auto-verify if hash is in URL
  useEffect(() => {
    if (hashParam) {
      const decoded = decodeURIComponent(hashParam)
      setHashInput(decoded)
      if (decoded.length >= 16) {
        handleVerify(decoded)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleVerify(hash?: string) {
    const target = (hash ?? hashInput).trim()
    if (target.length < 16) return

    setLoading(true)
    setHasSearched(true)

    try {
      const res = await verifyHash(target)
      setResult(res)
    } catch {
      setResult({ verified: false, error: 'Server unavailable. The session may not have been submitted to the server.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base text-text-primary flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-16 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-bold tracking-tight text-text-primary">WriteVault</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </button>
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 pt-16 pb-20">
        <div className="w-full max-w-xl">
          {/* Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 text-sm text-primary mb-6">
              <ShieldCheck className="w-4 h-4" />
              Session Verification
            </div>
            <h1 className="text-3xl font-bold mb-3">Verify a Writing Session</h1>
            <p className="text-text-muted">
              Enter the SHA-256 hash from a WriteVault report to verify its authenticity.
            </p>
          </div>

          {/* Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={hashInput}
              onChange={e => setHashInput(e.target.value)}
              placeholder="Paste SHA-256 hash here…"
              className="flex-1 bg-elevated border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 transition-colors"
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
            />
            <button
              onClick={() => handleVerify()}
              disabled={loading || hashInput.trim().length < 16}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? <LoadingSpinner size={16} color="white" /> : <Search className="w-4 h-4" />}
              Verify
            </button>
          </div>

          <p className="text-xs text-text-muted mb-8">
            Hashes must be at least 16 characters. Full SHA-256 hashes are 64 hex characters.
          </p>

          {/* Result */}
          {loading && (
            <div className="flex flex-col items-center py-12 gap-4">
              <LoadingSpinner size={36} color="#7c3aed" label="Querying WriteVault database…" />
            </div>
          )}

          {!loading && hasSearched && result && (
            <div className={`rounded-2xl border p-6 ${
              result.verified
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              {result.verified && result.session ? (
                <>
                  {/* Verified */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-green-300 mb-1">Session Verified</h2>
                      <p className="text-sm text-text-muted">
                        This session is verified authentic in the WriteVault database.
                      </p>
                    </div>
                  </div>

                  {/* Session details */}
                  <div className="bg-elevated rounded-xl p-4 space-y-3 mb-5">
                    <div className="flex justify-between items-start">
                      <span className="text-text-muted text-sm">Document</span>
                      <span className="text-text-primary font-medium text-sm text-right max-w-xs">
                        {result.session.title}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted text-sm">Authenticity Score</span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: scoreColor(result.session.humanScore) }}
                      >
                        {result.session.humanScore} / 100
                      </span>
                    </div>
                    {result.session.humanScore !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted text-sm">Verdict</span>
                        <span
                          className="text-sm font-bold tracking-wide"
                          style={{ color: scoreColor(result.session.humanScore) }}
                        >
                          {verdictLabel(result.session.humanScore >= 75 ? 'strong' : result.session.humanScore >= 55 ? 'moderate' : 'mixed')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted text-sm">Date Written</span>
                      <span className="text-text-primary text-sm">
                        {new Date(result.session.startTime).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>
                    {result.verificationCount !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted text-sm">Times Verified</span>
                        <span className="text-text-primary text-sm">{result.verificationCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Hash */}
                  <div className="bg-base rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">Verified Hash</p>
                    <p className="font-mono text-xs text-green-300 break-all">{result.session.sha256Hash ?? hashInput}</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Not found */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <ShieldX className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-red-300 mb-1">Session Not Found</h2>
                      <p className="text-sm text-text-muted">
                        {result.error ?? 'No session found with this hash in the WriteVault database.'}
                      </p>
                      <p className="text-xs text-text-muted mt-3">
                        Note: Only sessions that were explicitly submitted to the WriteVault server
                        can be verified online. Sessions stored only locally will not appear here.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
