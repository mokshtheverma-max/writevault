import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Shield,
  ChevronRight,
  FileWarning,
  UserX,
  Scale,
  FileText,
  CheckCircle2,
  Share2,
  PenLine,
  Activity,
  Award,
} from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import ComparisonTable from '../components/ComparisonTable'
import MobileNav from '../components/MobileNav'
import BackToTop from '../components/BackToTop'

const gridBg = {
  backgroundImage: `
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-text-secondary hover:text-text-primary text-sm transition-colors">
      {children}
    </a>
  )
}

function TimelineStep({
  Icon,
  title,
  variant,
  last = false,
}: {
  Icon: React.ComponentType<{ className?: string }>
  title: string
  variant: 'bad' | 'good'
  last?: boolean
}) {
  const bad = variant === 'bad'
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: bad ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            border: `1px solid ${bad ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
          }}
        >
          <Icon className={`w-4 h-4 ${bad ? 'text-red-400' : 'text-emerald-400'}`} />
        </div>
        {!last && (
          <div
            className="w-px flex-1 mt-2 mb-2"
            style={{
              background: bad
                ? 'linear-gradient(180deg, rgba(239,68,68,0.4), rgba(239,68,68,0.1))'
                : 'linear-gradient(180deg, rgba(16,185,129,0.4), rgba(16,185,129,0.1))',
              minHeight: 24,
            }}
          />
        )}
      </div>
      <div className="pb-6">
        <p className="text-text-primary text-sm font-medium">{title}</p>
      </div>
    </div>
  )
}

export default function DetectorComparison() {
  const navigate = useNavigate()
  usePageTitle('How AI Detectors Compare — WriteVault')

  return (
    <div className="min-h-screen bg-base text-text-primary">
      {/* ═══ NAVBAR ═══ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 border-b border-border bg-base/80 backdrop-blur-xl"
        style={{ height: 64 }}
      >
        <a href="/" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-bold text-lg tracking-tight text-text-primary">WriteVault</span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          <NavLink href="/methodology">How It Works</NavLink>
          <NavLink href="/compare">Compare</NavLink>
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
            onClick={() => navigate('/auth?mode=register')}
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

      {/* ═══ HEADER ═══ */}
      <section
        className="px-4 sm:px-6 pt-32 pb-16 text-center"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.2), transparent),
            #07070f
          `,
          ...gridBg,
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 rounded-full px-4 py-2 mb-8">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-300 text-sm">Side-by-side comparison</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
            className="text-white"
          >
            How AI Detectors Compare
          </h1>

          <p
            className="mt-6 mx-auto"
            style={{
              color: '#94a3b8',
              fontSize: 'clamp(16px, 2vw, 20px)',
              lineHeight: 1.6,
              maxWidth: 640,
            }}
          >
            And why WriteVault gives you the proof they can't.
          </p>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4">
        <ComparisonTable />

        {/* Disclaimer */}
        <div
          className="mt-6 rounded-xl px-5 py-4 text-sm leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#94a3b8',
          }}
        >
          <p>
            <span className="text-text-primary font-medium">Disclaimer —</span> This comparison is
            based on publicly available information about each tool's capabilities. WriteVault is
            designed to complement, not replace, academic integrity processes.
          </p>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — SIDE BY SIDE ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6" style={{ marginTop: 128 }}>
        <div className="text-center mb-12">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#475569' }}>
            THE DIFFERENCE
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">What actually happens</h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            Two paths for the same student — one leaves you defenseless, the other hands you proof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* LEFT — Without */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: 'rgba(127,29,29,0.08)',
              border: '1px solid rgba(127,29,29,0.25)',
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm uppercase tracking-wide font-medium">
                Without WriteVault
              </span>
            </div>
            <h3 className="text-white text-xl font-bold mb-6">
              You have no way to prove what you wrote.
            </h3>

            <div>
              <TimelineStep Icon={FileText} title="Essay submitted" variant="bad" />
              <TimelineStep Icon={FileWarning} title="Flagged by detector" variant="bad" />
              <TimelineStep Icon={UserX} title="Accused of using AI" variant="bad" />
              <TimelineStep Icon={AlertTriangle} title="No evidence to show" variant="bad" />
              <TimelineStep Icon={Scale} title="Grade penalty" variant="bad" last />
            </div>
          </div>

          {/* RIGHT — With */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: 'rgba(49,46,129,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-400 text-sm uppercase tracking-wide font-medium">
                With WriteVault
              </span>
            </div>
            <h3 className="text-white text-xl font-bold mb-6">
              Your writing process is the proof.
            </h3>

            <div>
              <TimelineStep Icon={PenLine} title="Write in WriteVault" variant="good" />
              <TimelineStep Icon={Activity} title="Session silently recorded" variant="good" />
              <TimelineStep Icon={FileText} title="Essay submitted" variant="good" />
              <TimelineStep Icon={FileWarning} title="Flagged — but you have proof" variant="good" />
              <TimelineStep Icon={Share2} title="Share your session report" variant="good" />
              <TimelineStep Icon={CheckCircle2} title="Cleared" variant="good" last />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ REAL SCENARIO ═══ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6" style={{ marginTop: 128 }}>
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#475569' }}>
            A COMMON SITUATION
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            This happens every week
          </h2>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              A
            </div>
            <div>
              <p className="text-white font-semibold">Alex</p>
              <p className="text-xs text-text-muted">Non-native English speaker · US university</p>
            </div>
          </div>

          <p className="text-text-secondary leading-relaxed text-base sm:text-lg">
            Alex is a non-native English speaker studying at a US university. She writes formal,
            structured essays — a style AI detectors often flag incorrectly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            <div
              className="rounded-xl p-5"
              style={{
                background: 'rgba(127,29,29,0.1)',
                border: '1px solid rgba(127,29,29,0.25)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-xs uppercase tracking-wide font-semibold">
                  Without WriteVault
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                She has no way to prove she wrote her work.
              </p>
            </div>

            <div
              className="rounded-xl p-5"
              style={{
                background: 'rgba(49,46,129,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-400 text-xs uppercase tracking-wide font-semibold">
                  With WriteVault
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                She shares her session report showing 47 minutes of writing, 63 revisions, and a
                91/100 human authenticity score. Her professor reviews the evidence and clears the
                accusation.
              </p>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            {[
              { Icon: Activity, label: '47 min writing' },
              { Icon: PenLine, label: '63 revisions' },
              { Icon: Award, label: '91/100 authenticity' },
            ].map(s => (
              <div
                key={s.label}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: '#c7d2fe',
                }}
              >
                <s.Icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6" style={{ marginTop: 128, marginBottom: 128 }}>
        <div
          className="rounded-3xl p-8 sm:p-16 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15), transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Start building your proof today.
            </h2>
            <p className="text-text-secondary mt-4 text-lg">
              Free forever. No credit card required.
            </p>
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 mt-8 inline-flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                padding: '16px 32px',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.25)',
              }}
            >
              Start Writing Free
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <BackToTop />
    </div>
  )
}
