import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { track, Events } from '../utils/analytics'
import { API_BASE } from '../config'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, Share2, Loader2 } from 'lucide-react'

const ROLES = ['Student', 'Teacher', 'Administrator'] as const

export default function Waitlist() {
  const [searchParams] = useSearchParams()
  const refParam = searchParams.get('ref') || ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>('Student')
  const [school, setSchool] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)
  const [position, setPosition] = useState(0)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role: role.toLowerCase(), school, ref: refParam }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Something went wrong' }))
        throw new Error(err.error)
      }
      const data = await res.json()
      setPosition(data.position)
      setJoined(true)
      track(Events.WAITLIST_JOINED, { role: role.toLowerCase() })
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist')
    } finally {
      setLoading(false)
    }
  }

  const referralLink = `writevault.app/waitlist?ref=${encodeURIComponent(email)}`
  const tweetText = encodeURIComponent(
    "I just joined WriteVault \u2014 the tool that proves your essays are human-written. Join the waitlist:"
  )

  function copyLink() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-base text-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-lg py-20">
        {/* Hero text */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="font-bold text-xl tracking-tight">WriteVault</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight mb-4">
            WriteVault is coming.
          </h1>
          <p className="text-2xl text-text-secondary font-medium mb-3">
            Be the first to prove your writing is human.
          </p>
          <p className="text-text-muted text-sm">
            Join 2,000+ students on the waitlist
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!joined ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface border border-border rounded-2xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="you@university.edu"
                  />
                </div>

                {/* Role pills */}
                <div>
                  <label className="block text-text-secondary text-sm mb-2">I am a...</label>
                  <div className="flex gap-2">
                    {ROLES.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          role === r
                            ? 'bg-primary text-white'
                            : 'bg-elevated border border-border text-text-secondary hover:border-border-light'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* School */}
                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">School / University</label>
                  <input
                    type="text"
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Optional"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={20} className="animate-spin" />}
                  Join the Waitlist
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-border rounded-2xl p-10 text-center"
            >
              {/* Checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center mx-auto mb-6"
              >
                <Check size={32} className="text-green-500" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
              <p className="text-text-secondary mb-1">
                You're <span className="text-primary font-semibold">#{position}</span> on the waitlist.
              </p>
              <p className="text-text-muted text-sm mb-8">
                We'll email you the moment WriteVault launches.
              </p>

              {/* Referral section */}
              <div className="bg-elevated border border-border rounded-xl p-5 mb-5">
                <p className="text-sm text-text-secondary mb-3 font-medium">
                  Share with 3 friends to skip the line
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-muted truncate">
                    {referralLink}
                  </div>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Share buttons */}
              <div className="flex gap-3 justify-center">
                <a
                  href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(referralLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-elevated border border-border rounded-lg px-4 py-2 text-sm text-text-secondary hover:border-border-light transition-colors"
                >
                  <Share2 size={14} />
                  Share on X
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
