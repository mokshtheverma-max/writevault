import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { track, Events } from '../utils/analytics'
import { GraduationCap, BookOpen, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

export default function Auth() {
  usePageTitle('WriteVault — Sign In')
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const m = searchParams.get('mode')
    if (m === 'register') setMode('register')
    else setMode('login')
  }, [searchParams])

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'google') setError('Google sign-in failed. Please try again.')
    else if (err === 'google_not_configured') setError('Google sign-in is not configured yet.')
  }, [searchParams])

  function handleGoogleSignIn() {
    const apiUrl = import.meta.env.VITE_API_URL || ''
    window.location.href = `${apiUrl}/api/oauth/google`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        await register(email, password, name, role)
        track(Events.ACCOUNT_CREATED, { role })
      } else {
        await login(email, password)
      }
      navigate('/editor')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="font-bold text-2xl tracking-tight text-text-primary">WriteVault</span>
          </div>
          <p className="text-text-secondary text-sm">
            {mode === 'register' ? 'Create your account to start proving your work' : 'Welcome back'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-8">
          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-muted text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4 sm:space-y-5">
            {/* Name (register only) */}
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <label className="block text-text-secondary text-sm mb-1.5">Full name</label>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-text-secondary text-sm mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="you@university.edu"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-text-secondary text-sm mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-elevated border border-border rounded-lg px-4 py-3 pr-11 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {mode === 'login' && (
                <div className="text-right mt-1">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline cursor-pointer">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {/* Role selector (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-text-secondary text-sm mb-2">I am a...</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === 'student'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-text-secondary hover:border-border-light'
                    }`}
                  >
                    <GraduationCap size={28} />
                    <span className="text-sm font-medium">Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === 'teacher'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-text-secondary hover:border-border-light'
                    }`}
                  >
                    <BookOpen size={28} />
                    <span className="text-sm font-medium">Teacher</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-300 text-sm"
                  role="alert"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all hover:shadow-glow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'register' ? 'Creating account…' : 'Signing in…'}
                </>
              ) : (
                mode === 'register' ? 'Create Free Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center text-sm text-text-secondary">
            {mode === 'register' ? (
              <>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError('') }} className="text-primary hover:underline font-medium">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to WriteVault?{' '}
                <button onClick={() => { setMode('register'); setError('') }} className="text-primary hover:underline font-medium">
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
