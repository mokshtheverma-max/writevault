import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CreditCard, ArrowLeft, Sparkles } from 'lucide-react'
import { API_BASE } from '../config'
import { useAuth } from '../context/AuthContext'

interface PaymentStatus {
  plan: 'free' | 'student' | 'teacher'
  sessionsUsed: number
  sessionsLimit: number | 'unlimited'
  features: Record<string, unknown>
  planExpiresAt: number | null
}

const PLAN_LABEL: Record<string, { name: string; color: string }> = {
  free: { name: 'Free', color: 'bg-text-muted/15 text-text-muted' },
  student: { name: 'Student', color: 'bg-primary/15 text-primary' },
  teacher: { name: 'Teacher', color: 'bg-success/15 text-success' },
}

const PAID_FEATURES = [
  'Unlimited writing sessions',
  'Full 5-layer authenticity analysis',
  'Writing DNA profile',
  'PDF certificate export',
  'Share With Teacher',
  'Priority support',
]

export default function BillingPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/payments/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch((err) => console.error('Status error:', err))
      .finally(() => setLoading(false))
  }, [token])

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch(`${API_BASE}/payments/portal`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.portalUrl) {
        window.location.href = data.portalUrl
      } else {
        console.error(data.error)
        setPortalLoading(false)
      }
    } catch (err) {
      console.error('Portal error:', err)
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center text-text-muted text-sm">
        Loading billing…
      </div>
    )
  }

  const plan = status?.plan || 'free'
  const isPaid = plan !== 'free'
  const label = PLAN_LABEL[plan]
  const expires = status?.planExpiresAt
    ? new Date(status.planExpiresAt * 1000).toLocaleDateString()
    : null

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 h-16 border-b border-border bg-base/80 backdrop-blur-xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-bold text-lg tracking-tight">WriteVault</span>
        </button>
        <button
          onClick={() => navigate('/editor')}
          className="text-text-muted hover:text-text-primary text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to editor
        </button>
      </nav>

      <main className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Billing</h1>
          <p className="text-text-secondary mb-8">Manage your WriteVault subscription</p>

          {/* Current plan card */}
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Current plan</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{label.name}</h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${label.color}`}>
                    {isPaid ? 'Active' : 'Free tier'}
                  </span>
                </div>
              </div>
              <CreditCard className="w-6 h-6 text-text-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-text-muted text-xs mb-1">Sessions used</p>
                <p className="text-text-primary font-medium">
                  {status?.sessionsUsed ?? 0}
                  {status?.sessionsLimit !== 'unlimited' && ` / ${status?.sessionsLimit}`}
                </p>
              </div>
              {expires && (
                <div>
                  <p className="text-text-muted text-xs mb-1">Next billing date</p>
                  <p className="text-text-primary font-medium">{expires}</p>
                </div>
              )}
            </div>

            {isPaid && (
              <>
                <div className="border-t border-border pt-5 mb-6">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Included</p>
                  <ul className="space-y-2">
                    {PAID_FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
                >
                  {portalLoading ? 'Opening…' : 'Manage Subscription'}
                </button>
              </>
            )}
          </div>

          {/* Free plan upgrade prompt */}
          {!isPaid && (
            <div className="bg-elevated border border-primary/30 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold">Upgrade to Student</h3>
              </div>
              <p className="text-text-secondary mb-6">
                Unlock unlimited sessions, Writing DNA, PDF certificates, and Share With Teacher for just $7/month.
              </p>

              <ul className="space-y-2 mb-6">
                {PAID_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/pricing')}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors hover:shadow-glow-sm"
              >
                See plans →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
