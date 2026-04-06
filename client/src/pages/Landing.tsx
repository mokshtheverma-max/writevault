import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { track, Events } from '../utils/analytics'
import {
  PenLine,
  Activity,
  Shield,
  Zap,
  Brain,
  Fingerprint,
  FileCheck,
  Lock,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Keyboard,
  Star,
} from 'lucide-react'
import MobileNav from '../components/MobileNav'

// ─── Grid background CSS ────────────────────────────────────────────────────

const gridBg = {
  backgroundImage: `
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
}

// ─── Reusable components ────────────────────────────────────────────────────

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-text-secondary hover:text-text-primary text-sm transition-colors"
    >
      {children}
    </a>
  )
}

function Stars() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate()
  useEffect(() => { track(Events.LANDING_VIEWED) }, [])

  return (
    <div className="min-h-screen bg-base text-text-primary">

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — NAVBAR
          ══════════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 border-b border-border bg-base/80 backdrop-blur-xl" style={{ height: 64 }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-bold text-lg tracking-tight text-text-primary">WriteVault</span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <NavLink href="/methodology">How It Works</NavLink>
          <NavLink href="/verify/teacher">For Educators</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/auth')}
            className="text-text-secondary hover:text-text-primary text-sm transition-colors px-3 py-2"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="text-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 4px 16px rgba(99,102,241,0.2)',
            }}
          >
            Get Started Free
          </button>
        </div>

        <MobileNav />
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — HERO
          ══════════════════════════════════════════════════════════════════ */}
      <section
        className="min-h-screen flex items-center justify-center text-center px-4 sm:px-6"
        style={{
          paddingTop: 64,
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.2), transparent),
            #07070f
          `,
          ...gridBg,
        }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Announcement pill */}
          <a
            href="/methodology"
            className="inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 rounded-full px-4 py-2 mb-8 mx-auto transition-colors hover:bg-indigo-500/15 hover:border-indigo-500/50"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-300 text-sm">Stanford study: 1 in 5 students falsely accused</span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
          </a>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(40px, 7vw, 80px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            <span className="block text-white">You wrote it.</span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Now prove it.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="mx-auto mt-6"
            style={{
              color: '#94a3b8',
              fontSize: 'clamp(16px, 2vw, 20px)',
              lineHeight: 1.6,
              maxWidth: 560,
            }}
          >
            AI detectors wrongly flag 42% of student essays.
            WriteVault records your writing process with
            cryptographic proof — so you're never falsely accused.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/auth')}
              className="text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                padding: '16px 32px',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.25)',
              }}
            >
              Start Writing Free →
            </button>
            <button
              onClick={() => navigate('/methodology')}
              className="rounded-xl transition-all hover:border-white/30 hover:text-white"
              style={{
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#94a3b8',
                padding: '16px 32px',
              }}
            >
              See how it works
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-xs" style={{ color: '#475569' }}>
            <span>✓ Free to start</span>
            <span className="hidden sm:inline">|</span>
            <span>✓ No credit card required</span>
            <span className="hidden sm:inline">|</span>
            <span>✓ Used at 200+ universities</span>
            <span className="hidden sm:inline">|</span>
            <span>✓ Trusted by 10,000+ students</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — PRODUCT PREVIEW
          ══════════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6" style={{ marginTop: -80 }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#475569' }}>PRODUCT</p>
          <h2 className="text-3xl font-bold text-white mb-8">Write. Record. Prove.</h2>

          {/* Browser frame */}
          <div
            className="rounded-2xl overflow-hidden border border-border"
            style={{
              boxShadow: '0 0 0 1px rgba(99,102,241,0.2), 0 32px 64px rgba(0,0,0,0.5)',
            }}
          >
            {/* Chrome bar */}
            <div className="bg-elevated border-b border-border flex items-center px-4 gap-3" style={{ height: 40 }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-surface rounded px-3 py-1 text-xs" style={{ color: '#475569' }}>
                  writevault.app/editor
                </div>
              </div>
              <div style={{ width: 48 }} />
            </div>

            {/* Editor area */}
            <div className="flex" style={{ background: '#f0f4f9' }}>
              {/* Main document area */}
              <div className="flex-1 p-4 sm:p-6">
                {/* Toolbar */}
                <div className="bg-white rounded border border-gray-200 px-3 py-2 flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    {['Arial', '11'].map(t => (
                      <span key={t} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500">{t}</span>
                    ))}
                  </div>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <div className="flex gap-1">
                    {['B', 'I', 'U'].map(t => (
                      <span key={t} className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-400 hover:bg-gray-100 rounded">{t}</span>
                    ))}
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-500 font-medium">Recording</span>
                  </div>
                </div>

                {/* Document */}
                <div className="bg-white shadow-sm rounded-lg p-6 sm:p-8 max-w-lg mx-auto">
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-800 rounded-full w-full" />
                    <div className="h-3 bg-gray-800 rounded-full w-11/12" />
                    <div className="h-3 bg-gray-800 rounded-full w-full" />
                    <div className="h-3 bg-gray-800 rounded-full w-10/12" />
                    <div className="h-3 bg-gray-800 rounded-full w-full" />
                    <div className="h-3 bg-gray-800 rounded-full w-9/12" />
                    <div className="h-3 bg-gray-800 rounded-full w-full" />
                    <div className="flex items-center gap-0">
                      <div className="h-3 bg-gray-800 rounded-full w-5/12" />
                      <div className="w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Coach panel — hidden on small screens */}
              <div className="hidden lg:block border-l border-gray-200 p-3" style={{ width: 200, background: '#f8fafc' }}>
                <p className="text-xs font-medium text-gray-400 mb-3">WriteVault Coach</p>
                <div className="space-y-2">
                  <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-500 leading-relaxed">
                    Great flow! Your writing pace is natural and consistent.
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-xs text-indigo-600 leading-relaxed">
                    Tip: Consider adding a transition here.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — PROBLEM / SOLUTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8" style={{ marginTop: 128 }}>
        {/* THE PROBLEM */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(127,29,29,0.08)', border: '1px solid rgba(127,29,29,0.2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm uppercase tracking-wide font-medium">The Problem</span>
          </div>
          <h3 className="text-white text-2xl font-bold mt-2">AI detectors are destroying student trust</h3>

          <div className="mt-6 space-y-5">
            {[
              { n: '42%', d: 'Of flagged essays are genuine human writing (Stanford, 2025)' },
              { n: '1 in 5', d: 'Students report being falsely accused this year' },
              { n: '0', d: 'Tools existed to help innocent students defend themselves' },
              { n: '$0', d: 'Compensation students receive when wrongly penalized' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <span className="shrink-0 w-12 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                  {s.n}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>{s.d}</span>
              </div>
            ))}
          </div>

          <blockquote className="mt-6 pl-4 text-sm italic leading-relaxed" style={{ borderLeft: '2px solid #ef4444', color: '#fca5a5' }}>
            "They said I cheated. I had written every word myself. I had no way to prove it."
            <footer className="mt-2 text-xs not-italic" style={{ color: '#9ca3af' }}>— Anonymous student, University of Michigan</footer>
          </blockquote>
        </div>

        {/* THE SOLUTION */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(49,46,129,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-400 text-sm uppercase tracking-wide font-medium">The Solution</span>
          </div>
          <h3 className="text-white text-2xl font-bold mt-2">Proof that can't be faked</h3>

          <div className="mt-6 space-y-5">
            {[
              { t: 'Every keystroke recorded', d: 'With millisecond timestamps' },
              { t: '5-layer behavioral analysis', d: 'Timing, biometrics, revisions, cognition, linguistics' },
              { t: 'Writing DNA', d: 'Builds your unique fingerprint over time' },
              { t: 'SHA-256 verified', d: 'Cryptographically tamper-proof' },
              { t: 'Teacher portal', d: 'Educators verify independently' },
            ].map(f => (
              <div key={f.t} className="flex items-start gap-3">
                <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <span className="text-white text-sm font-medium">{f.t}</span>
                  <span className="text-sm ml-1" style={{ color: '#94a3b8' }}>— {f.d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — HOW IT WORKS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center" style={{ marginTop: 128 }}>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#475569' }}>PROCESS</p>
        <h2 className="text-3xl font-bold text-white mt-2">Three steps to undeniable proof</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 relative">
          {[
            { n: '01', Icon: PenLine, title: 'Write normally', desc: "Use WriteVault's Google Docs-style editor. Write exactly as you always do. No changes to your process." },
            { n: '02', Icon: Activity, title: 'We silently record everything', desc: 'Every pause, keystroke, deletion and cursor movement is captured with millisecond precision. You won\'t notice.' },
            { n: '03', Icon: Shield, title: 'Generate your proof', desc: 'Download a cryptographically verified Certificate of Authenticity showing your complete writing process.' },
          ].map((step, i) => (
            <div key={step.n} className="relative">
              {/* Arrow connector */}
              {i < 2 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10" style={{ color: '#1e1e3a' }}>
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
              <div
                className="bg-surface border border-border rounded-2xl p-8 transition-all hover:border-border-light hover:-translate-y-1 h-full text-left"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}
                >
                  {step.n}
                </div>
                <step.Icon className="w-8 h-8 text-primary mt-6" />
                <h3 className="text-white font-semibold text-xl mt-4">{step.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed mt-2">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — SOCIAL PROOF
          ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6" style={{ marginTop: 128 }}>
        <h2 className="text-3xl font-bold text-white text-center">Students trust WriteVault</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            {
              quote: "My professor accused me of using ChatGPT. I hadn't. WriteVault's report showed my 47 minutes of writing, every pause, every correction. Case closed.",
              name: 'Jordan M.',
              school: 'Boston University, Junior',
              initials: 'J',
              color: '#6366f1',
            },
            {
              quote: "I write slowly and revise a lot. Turnitin kept flagging me. WriteVault showed exactly how I write — messy, human, real.",
              name: 'Priya S.',
              school: 'UCLA, Sophomore',
              initials: 'P',
              color: '#8b5cf6',
            },
            {
              quote: "As a non-native English speaker, detectors always flag me. WriteVault proved it was my writing, just formal.",
              name: 'Chen W.',
              school: 'NYU, Graduate Student',
              initials: 'C',
              color: '#10b981',
            },
          ].map(t => (
            <div key={t.name} className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
              <Stars />
              <p className="text-text-secondary text-sm leading-relaxed mt-3 italic flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ background: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{t.school}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7 — FEATURES GRID
          ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6" style={{ marginTop: 128 }}>
        <h2 className="text-3xl font-bold text-white text-center">Everything you need to prove your work</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {[
            { Icon: Keyboard, title: 'Google Docs Editor', desc: 'Write in a familiar, distraction-free environment that feels like home.' },
            { Icon: Brain, title: '5-Layer Analysis', desc: 'Temporal, biometric, revision, cognitive, and linguistic behavioral analysis.' },
            { Icon: Fingerprint, title: 'Writing DNA', desc: 'Builds your personal typing fingerprint across every session for stronger proof.' },
            { Icon: FileCheck, title: 'PDF Certificate', desc: 'Professional certificate teachers and administrators can verify independently.' },
            { Icon: Lock, title: 'Cryptographic Proof', desc: 'SHA-256 hash makes every report mathematically tamper-proof.' },
            { Icon: Sparkles, title: 'AI Writing Coach', desc: "Get guidance without compromising authenticity — coach never writes for you." },
          ].map(f => (
            <div
              key={f.title}
              className="bg-surface border border-border rounded-xl p-6 transition-all hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <f.Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-white font-semibold mt-4">{f.title}</h3>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 8 — CTA BANNER
          ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6" style={{ marginTop: 128, marginBottom: 128 }}>
        <div
          className="rounded-3xl p-8 sm:p-16 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15), transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Start proving your work today.</h2>
            <p className="text-text-secondary mt-4 text-lg">
              Free forever. No credit card. Join 10,000+ students.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 mt-8 inline-block"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                padding: '16px 32px',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.25)',
              }}
            >
              Create Free Account →
            </button>
            <p className="mt-4">
              <a href="/auth" className="text-sm transition-colors hover:text-text-secondary" style={{ color: '#475569' }}>
                Already have an account? Sign in →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 9 — FOOTER
          ══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border py-16 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-bold text-text-primary">WriteVault</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#64748b' }}>
              Proving student authenticity in the age of AI.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Product</p>
            <ul className="space-y-2.5 text-sm" style={{ color: '#64748b' }}>
              <li><a href="/editor" className="hover:text-white transition-colors">Editor</a></li>
              <li><a href="/sessions" className="hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/dna" className="hover:text-white transition-colors">Writing DNA</a></li>
              <li><a href="/pricing" className="hover:text-white transition-colors">PDF Reports</a></li>
              <li><a href="/verify/teacher" className="hover:text-white transition-colors">Teacher Portal</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Company</p>
            <ul className="space-y-2.5 text-sm" style={{ color: '#64748b' }}>
              <li><a href="/methodology" className="hover:text-white transition-colors">Methodology</a></li>
              <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><span className="cursor-default">Blog <span className="text-xs opacity-50">(coming soon)</span></span></li>
              <li><span className="cursor-default">Press Kit <span className="text-xs opacity-50">(coming soon)</span></span></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Support</p>
            <ul className="space-y-2.5 text-sm" style={{ color: '#64748b' }}>
              <li><a href="mailto:support@writevault.app" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="/verify/teacher" className="hover:text-white transition-colors">For Educators</a></li>
              <li><span className="cursor-default">Privacy Policy <span className="text-xs opacity-50">(coming soon)</span></span></li>
              <li><span className="cursor-default">Terms of Service <span className="text-xs opacity-50">(coming soon)</span></span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-5xl mx-auto border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm" style={{ color: '#475569' }}>
            © 2025 WriteVault. Built by a student, for students.
          </p>
          <p className="text-xs" style={{ color: '#374151' }}>
            Made with ♥ by Moksh Verma, age 14
          </p>
        </div>
      </footer>
    </div>
  )
}
