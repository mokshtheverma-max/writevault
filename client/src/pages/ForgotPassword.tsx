import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, Eye, EyeOff, Check } from 'lucide-react'
import { API_BASE } from '../config'

type Step = 'email' | 'code' | 'password'

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()
  const digitRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Redirect after success
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => navigate('/auth'), 2000)
    return () => clearTimeout(t)
  }, [success, navigate])

  async function handleSendCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send code')

      setCode(data.code || '')
      setStep('code')
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)

    if (value && index < 5) {
      digitRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled
    if (value && next.every(d => d !== '')) {
      handleVerifyCode(next.join(''))
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus()
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setDigits(next)
      digitRefs.current[5]?.focus()
      handleVerifyCode(pasted)
    }
  }

  async function handleVerifyCode(codeStr?: string) {
    const fullCode = codeStr || digits.join('')
    if (fullCode.length !== 6) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')

      setResetToken(data.resetToken)
      setStep('password')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getPasswordStrength(): { score: number; label: string; color: string } {
    let score = 0
    if (newPassword.length >= 8) score++
    if (/\d/.test(newPassword)) score++
    if (/[^A-Za-z0-9]/.test(newPassword)) score++
    if (/[A-Z]/.test(newPassword)) score++

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
    if (score <= 3) return { score, label: 'Medium', color: 'bg-yellow-500' }
    return { score, label: 'Strong', color: 'bg-green-500' }
  }

  const strength = getPasswordStrength()

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="font-bold text-2xl tracking-tight text-text-primary">WriteVault</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-8">

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-bold text-text-primary mb-1">Forgot your password?</h1>
                <p className="text-text-secondary text-sm">Enter your email and we'll send you a reset code.</p>
              </div>

              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-elevated border border-border rounded-lg pl-10 pr-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="you@university.edu"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Send Reset Code
              </button>

              <Link to="/auth" className="flex items-center justify-center gap-1.5 text-sm text-primary hover:underline">
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </form>
          )}

          {/* ── Step 2: Code ── */}
          {step === 'code' && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-bold text-text-primary mb-1">Check your email</h1>
                <p className="text-text-secondary text-sm">We sent a 6-digit code to {email}</p>
              </div>

              {/* Dev: show code since no email service */}
              {code && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-center">
                  <p className="text-text-secondary text-xs mb-1">Your code is:</p>
                  <p className="text-primary font-bold text-2xl tracking-widest">{code}</p>
                </div>
              )}

              <div className="flex justify-center gap-2" onPaste={handleDigitPaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { digitRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    className="w-12 h-12 text-center text-xl font-bold bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={() => handleVerifyCode()}
                disabled={loading || digits.some(d => !d)}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Verify Code
              </button>

              <div className="text-center">
                <button
                  onClick={() => { setDigits(['', '', '', '', '', '']); setError(''); handleSendCode() }}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm text-primary hover:underline disabled:text-text-muted disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 'password' && !success && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-bold text-text-primary mb-1">Create new password</h1>
                <p className="text-text-secondary text-sm">Choose a strong password for your account.</p>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-elevated border border-border rounded-lg px-4 py-3 pr-11 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Strength indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= strength.score ? strength.color : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${
                      strength.score <= 1 ? 'text-red-400' : strength.score <= 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1.5">Confirm password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Confirm your password"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Reset Password
              </button>
            </form>
          )}

          {/* ── Success ── */}
          {success && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <Check size={28} className="text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-text-primary">Password reset!</h1>
              <p className="text-text-secondary text-sm">Redirecting you to sign in...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
