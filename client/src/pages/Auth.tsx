import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { track, Events } from '../utils/analytics'
import { GraduationCap, BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Auth() {
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
          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4 sm:space-y-5">
            {/* Name (register only) */}
            {mode === 'register' && (
              <div>
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
              </div>
            )}

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
                <div className="grid grid-cols-2 gap-3">
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
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {mode === 'register' ? 'Create Free Account' : 'Sign In'}
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
