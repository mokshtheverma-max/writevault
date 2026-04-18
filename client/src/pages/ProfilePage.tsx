import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, User, Mail, Lock, AlertTriangle, Trash2,
  Loader2, CreditCard, CalendarDays, FileText, Save, Eye, EyeOff,
} from 'lucide-react'
import { API_BASE } from '../config'
import { useAuth } from '../context/AuthContext'
import { listSessions } from '../utils/sessionStorage'
import { usePageTitle } from '../hooks/usePageTitle'

interface MeResponse {
  id: string
  email: string
  name: string
  role: string
  plan: string
  createdAt: number
  sessionCount?: number
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-text-muted/15 text-text-muted border-text-muted/20',
  student: 'bg-primary/15 text-primary border-primary/20',
  teacher: 'bg-success/15 text-success border-success/20',
  institution: 'bg-warning/15 text-warning border-warning/20',
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'bg-elevated' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
  const colors = ['bg-danger', 'bg-danger', 'bg-orange-400', 'bg-warning', 'bg-success', 'bg-success']
  return { score, label: labels[score], color: colors[score] }
}

export default function ProfilePage() {
  usePageTitle('WriteVault — Profile')
  const navigate = useNavigate()
  const { user, token, logout, refreshUser } = useAuth()

  const [me, setMe] = useState<MeResponse | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const [deletePw, setDeletePw] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const strength = useMemo(() => passwordStrength(newPw), [newPw])

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: MeResponse) => {
        setMe(data)
        setName(data.name)
        setEmail(data.email)
      })
      .catch(() => toast.error('Failed to load profile'))
  }, [token])

  const stats = useMemo(() => {
    try {
      const sessions = listSessions()
      const totalWords = sessions.reduce(
        (sum, s) => sum + s.content.trim().split(/\s+/).filter(Boolean).length, 0
      )
      return { sessionCount: sessions.length, totalWords }
    } catch {
      return { sessionCount: 0, totalWords: 0 }
    }
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSavingProfile(true)
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Profile updated')
      await refreshUser()
      setMe(prev => prev ? { ...prev, name: data.name, email: data.email } : prev)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match')
      return
    }
    if (newPw.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSavingPw(true)
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Password updated')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/auth/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Account deleted')
      logout()
      navigate('/', { replace: true })
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const initials = (user?.name || '?')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(s => s[0]?.toUpperCase()).join('') || '?'

  const memberSince = me?.createdAt
    ? new Date(me.createdAt * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  const plan = me?.plan || 'free'
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const deleteEnabled = deleteConfirm === 'DELETE' && !deleting && !!deletePw

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to home
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your profile, security, and account preferences.</p>
        </div>

        {/* Profile Info */}
        <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold truncate">{user?.name}</div>
              <div className="text-sm text-text-muted truncate">{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </form>
        </section>

        {/* Change Password */}
        <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1.5">Current password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  required
                  className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1.5">New password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                minLength={6}
                className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
              {newPw && (
                <div className="mt-2">
                  <div className="h-1.5 bg-elevated rounded-full overflow-hidden flex gap-0.5">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`flex-1 transition-colors ${
                          i < strength.score ? strength.color : 'bg-elevated'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-text-muted mt-1">{strength.label}</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1.5">Confirm new password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
              {confirmPw && newPw && confirmPw !== newPw && (
                <div className="text-xs text-danger mt-1">Passwords do not match</div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingPw}
              className="bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              {savingPw ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Update Password
            </button>
          </form>
        </section>

        {/* Account Stats */}
        <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Account Overview</h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <StatRow icon={<FileText size={16} />} label="Sessions recorded" value={stats.sessionCount.toLocaleString()} />
            <StatRow icon={<FileText size={16} />} label="Words written" value={stats.totalWords.toLocaleString()} />
            <StatRow icon={<CalendarDays size={16} />} label="Member since" value={memberSince} />
            <div>
              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                <CreditCard size={14} /> Current plan
              </div>
              <span className={`inline-block text-xs font-medium border rounded-full px-3 py-1 ${PLAN_COLORS[plan] || PLAN_COLORS.free}`}>
                {planLabel}
              </span>
            </div>
          </div>

          <Link
            to="/billing"
            className="inline-flex items-center gap-2 bg-elevated hover:bg-elevated-light border border-border text-text-primary text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <CreditCard size={16} /> Manage Billing <span aria-hidden>→</span>
          </Link>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-400" />
            <h2 className="text-lg font-semibold text-red-300">Danger Zone</h2>
          </div>

          <h3 className="text-sm font-medium text-text-primary mb-1">Delete account</h3>
          <p className="text-sm text-text-secondary mb-5">
            This permanently deletes all your sessions, Writing DNA, and account data. This cannot be undone.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-text-secondary text-sm mb-1.5">Password</label>
              <input
                type="password"
                value={deletePw}
                onChange={e => setDeletePw(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-elevated border border-red-900/40 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1.5">
                Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-elevated border border-red-900/40 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-red-500/60 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={!deleteEnabled}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete My Account
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">{icon} {label}</div>
      <div className="text-sm font-medium text-text-primary">{value}</div>
    </div>
  )
}
