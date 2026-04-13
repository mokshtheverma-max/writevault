import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { track, Events } from '../utils/analytics'
import { API_BASE } from '../config'
import { useAuth } from '../context/AuthContext'
import { Check, X, Sparkles, Shield, GraduationCap, Building2, ChevronDown, ChevronUp, Lock } from 'lucide-react'

const PRICES = {
  student: { monthly: 7, annual: 58 },
  teacher: { monthly: 19, annual: 158 },
  institution: { monthly: 299, annual: 2490 },
}

interface FAQ {
  q: string
  a: string
}

const FAQS: FAQ[] = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — your first 3 sessions are completely free, no credit card required.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, cancel anytime from your account settings. No questions asked.',
  },
  {
    q: 'Do teachers need to pay?',
    a: 'Students pay for WriteVault. Teachers can verify sessions for free at writevault.app/verify/teacher. Teacher plan adds bulk tools.',
  },
  {
    q: 'Is my writing data private?',
    a: 'Your writing content is encrypted and never shared. Only you and educators you share with can view your sessions.',
  },
]

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface/50 transition-colors"
      >
        <span className="text-text-primary font-medium text-sm">{faq.q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-4">
          <p className="text-text-secondary text-sm leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  )
}

function Feature({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {included ? (
        <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
      ) : (
        <X className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
      )}
      <span className={included ? 'text-text-secondary' : 'text-text-muted'}>{children}</span>
    </li>
  )
}

export default function Pricing() {
  const navigate = useNavigate()
  const { isAuthenticated, token } = useAuth()
  const [annual, setAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  useEffect(() => { track(Events.PRICING_VIEWED) }, [])

  const handleUpgrade = async (plan: 'student' | 'teacher') => {
    if (!isAuthenticated || !token) {
      navigate('/auth?mode=register')
      return
    }
    setLoadingPlan(plan)
    try {
      const res = await fetch(`${API_BASE}/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        track(Events.UPGRADE_CLICKED, { plan })
        window.location.href = data.checkoutUrl
      } else {
        console.error('Checkout failed:', data.error)
        setLoadingPlan(null)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-base text-text-primary">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 h-16 border-b border-border bg-base/80 backdrop-blur-xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-bold text-lg tracking-tight text-text-primary">WriteVault</span>
        </button>
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/editor')}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Start Writing Free
          </button>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-28 sm:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary mb-4">
          Simple, honest pricing.
        </h1>
        <p className="text-text-secondary text-xl max-w-lg mx-auto mb-10">
          Start free. Upgrade when you need proof.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 bg-surface border border-border rounded-full px-1.5 py-1.5">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-primary text-white' : 'text-text-muted hover:text-text-secondary'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-primary text-white' : 'text-text-muted hover:text-text-secondary'}`}
          >
            Annual
            <span className={`text-xs px-2 py-0.5 rounded-full ${annual ? 'bg-white/20 text-white' : 'bg-success/10 text-success'}`}>
              2 months free
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">

          {/* FREE */}
          <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <Sparkles className="w-8 h-8 text-text-muted mb-4" />
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-text-primary">$0</span>
                <span className="text-text-muted text-sm">/month</span>
              </div>
              <p className="text-text-muted text-sm">Forever free</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <Feature included>3 writing sessions</Feature>
              <Feature included>Basic authenticity score</Feature>
              <Feature included={false}>Writing DNA</Feature>
              <Feature included={false}>PDF certificates</Feature>
              <Feature included={false}>Share With Teacher</Feature>
            </ul>
            <button
              onClick={() => navigate('/editor')}
              className="w-full border border-primary text-primary hover:bg-primary/10 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              Get Started Free
            </button>
          </div>

          {/* STUDENT — Most Popular */}
          <div className="bg-surface border-2 border-primary rounded-2xl p-8 flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full font-semibold">
              Most Popular
            </span>
            <div className="mb-6">
              <GraduationCap className="w-8 h-8 text-primary mb-4" />
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-text-primary">
                  ${annual ? Math.round(PRICES.student.annual / 12) : PRICES.student.monthly}
                </span>
                <span className="text-text-muted text-sm">/month</span>
              </div>
              <p className="text-text-muted text-sm">
                Per student {annual && <span className="text-success">· billed ${PRICES.student.annual}/yr</span>}
              </p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <Feature included>Unlimited sessions</Feature>
              <Feature included>Full 5-layer analysis</Feature>
              <Feature included>Writing DNA (unlimited)</Feature>
              <Feature included>PDF certificate export</Feature>
              <Feature included>Share With Teacher</Feature>
              <Feature included>Session history (last 50)</Feature>
              <Feature included>Priority support</Feature>
            </ul>
            <button
              onClick={() => handleUpgrade('student')}
              disabled={loadingPlan === 'student'}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors text-sm hover:shadow-glow-sm disabled:opacity-60"
            >
              {loadingPlan === 'student' ? 'Loading…' : 'Start Student Plan'}
            </button>
          </div>

          {/* TEACHER */}
          <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <Shield className="w-8 h-8 text-primary mb-4" />
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-text-primary">
                  ${annual ? Math.round(PRICES.teacher.annual / 12) : PRICES.teacher.monthly}
                </span>
                <span className="text-text-muted text-sm">/month</span>
              </div>
              <p className="text-text-muted text-sm">
                Per educator {annual && <span className="text-success">· billed ${PRICES.teacher.annual}/yr</span>}
              </p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <Feature included>Everything in Student</Feature>
              <Feature included>Educator verification portal</Feature>
              <Feature included>Bulk verification (200 students)</Feature>
              <Feature included>Class dashboard</Feature>
              <Feature included>CSV export</Feature>
            </ul>
            <button
              onClick={() => handleUpgrade('teacher')}
              disabled={loadingPlan === 'teacher'}
              className="w-full border border-primary text-primary hover:bg-primary/10 font-medium py-3 rounded-xl transition-colors text-sm disabled:opacity-60"
            >
              {loadingPlan === 'teacher' ? 'Loading…' : 'Start Teacher Plan'}
            </button>
          </div>

          {/* INSTITUTION */}
          <div className="bg-elevated border border-border rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <Building2 className="w-8 h-8 text-text-muted mb-4" />
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-text-primary">
                  ${annual ? Math.round(PRICES.institution.annual / 12) : PRICES.institution.monthly}
                </span>
                <span className="text-text-muted text-sm">/month</span>
              </div>
              <p className="text-text-muted text-sm">
                Per institution {annual && <span className="text-success">· billed ${PRICES.institution.annual}/yr</span>}
              </p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <Feature included>Everything in Teacher</Feature>
              <Feature included>Unlimited students</Feature>
              <Feature included>API access</Feature>
              <Feature included>Custom branding</Feature>
              <Feature included>Dedicated support</Feature>
              <Feature included>SSO integration (coming soon)</Feature>
            </ul>
            <a
              href="mailto:sales@writevault.app"
              className="w-full border border-border text-text-secondary hover:text-text-primary hover:border-border-light font-medium py-3 rounded-xl transition-colors text-sm text-center block"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-elevated border border-border rounded-2xl p-6 text-center flex items-center justify-center gap-3">
            <Lock className="w-5 h-5 text-primary" />
            <p className="text-text-secondary text-sm font-medium">
              30-day money back guarantee. No questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 text-text-muted text-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <p className="font-medium text-text-secondary mb-1">WriteVault</p>
            <p>Protecting student integrity in the age of AI</p>
          </div>
          <div className="flex gap-6">
            <a href="/verify/teacher" className="hover:text-text-secondary transition-colors">For Educators</a>
            <a href="/methodology" className="hover:text-text-secondary transition-colors">Methodology</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
