import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Shield,
  ChevronRight,
  ScanSearch,
  UserCheck,
  FileSignature,
  Sparkles,
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

function SetMeta() {
  useEffect(() => {
    const description =
      'Flagged by Turnitin? Learn what Turnitin actually does, why it produces false positives for students, and how WriteVault gives you proof you wrote it yourself.'
    let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    const prev = tag?.getAttribute('content') ?? null
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', description)
    return () => {
      if (prev !== null && tag) tag.setAttribute('content', prev)
    }
  }, [])
  return null
}

export default function VsTurnitin() {
  const navigate = useNavigate()
  usePageTitle('WriteVault vs Turnitin: What Students Need to Know')

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <SetMeta />

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

      {/* ═══ HERO ═══ */}
      <section
        className="px-4 sm:px-6 pt-32 pb-16"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.18), transparent),
            #07070f
          `,
          ...gridBg,
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/10 rounded-full px-4 py-2 mb-8">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-300 text-sm">For students who've been flagged</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 60px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
            className="text-white"
          >
            Turnitin flagged your essay.
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Now what?
            </span>
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
            If you're reading this, you probably wrote every word yourself — and a detector says
            otherwise. Here's what's actually happening, and what you can do about it.
          </p>
        </div>
      </section>

      {/* ═══ WHAT TURNITIN DOES ═══ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6" style={{ marginTop: 96 }}>
        <div className="space-y-16">
          {/* Section 1 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.12)' }}
              >
                <ScanSearch className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">What Turnitin actually does</h2>
            </div>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                Turnitin is a plagiarism checker that universities have used for decades. Its original
                job was straightforward: compare your essay against a database of existing text and
                flag passages that match other sources.
              </p>
              <p>
                In 2023, Turnitin added an <span className="text-text-primary">AI writing detector</span>. This new
                feature tries to predict whether text was written by a human or generated by a tool
                like ChatGPT. It does this by analyzing statistical patterns in your writing — things
                like sentence rhythm, word choice, and predictability.
              </p>
              <p>
                The key word is <em>predict</em>. Turnitin doesn't know how your essay was written. It
                makes an educated guess based on what AI-generated text usually looks like. And
                sometimes, that guess is wrong.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.12)' }}
              >
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Why it fails students</h2>
            </div>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                AI detectors are trained to spot certain writing patterns — smooth transitions,
                balanced sentences, formal phrasing. The problem is that <span className="text-text-primary">many
                humans write this way too</span>.
              </p>
              <p>Students most likely to be falsely flagged include:</p>
              <ul className="space-y-2 ml-1">
                {[
                  'Non-native English speakers who write carefully and formally',
                  'Students who outline and revise heavily before submitting',
                  'Writers with a clean, structured, academic style',
                  'Anyone who edits with tools like Grammarly or word-processor suggestions',
                ].map(item => (
                  <li key={item} className="flex gap-3">
                    <span className="text-red-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                A 2025 Stanford study found that AI detectors disproportionately flag essays written
                by non-native English speakers — a pattern that's led several universities to reduce
                how heavily they weight these scores.
              </p>
              <p>
                The hard truth: a detector score is a <span className="text-text-primary">probability</span>, not a
                verdict. But once your essay has been flagged, the burden of proof often shifts to
                you — and that's where most students get stuck.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">What you can do</h2>
            </div>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>If you've been flagged and you wrote the essay yourself, here's what actually helps:</p>
              <ol className="space-y-3 ml-1 list-none">
                {[
                  {
                    t: 'Stay calm and request details.',
                    d: 'Ask your professor or the academic office for the specific report. You have a right to see what was flagged.',
                  },
                  {
                    t: 'Show your drafts and sources.',
                    d: 'Version history in Google Docs or Word can show writing over time. It\'s not definitive, but it helps.',
                  },
                  {
                    t: 'Explain your writing process.',
                    d: 'Walk through how you wrote the essay — your outline, your research, the parts you revised. Be specific.',
                  },
                  {
                    t: 'Know your institution\'s policy.',
                    d: 'Many universities explicitly say AI detector scores alone are not sufficient evidence for academic misconduct. Find that policy.',
                  },
                ].map((s, i) => (
                  <li key={s.t} className="flex gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{
                        background: 'rgba(16,185,129,0.15)',
                        color: '#6ee7b7',
                        border: '1px solid rgba(16,185,129,0.3)',
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-text-primary font-medium">{s.t}</p>
                      <p className="text-sm mt-1">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Section 4 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.12)' }}
              >
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">How WriteVault helps</h2>
            </div>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                The best defense against a false flag is <span className="text-text-primary">evidence of your
                writing process</span> — proof that you drafted, revised, and worked through the essay
                yourself.
              </p>
              <p>
                That's what WriteVault records. You write in our editor exactly like you would in
                Google Docs. Behind the scenes, every pause, keystroke, deletion, and revision is
                captured with millisecond timestamps. When you're done, you get a session report you
                can share with a professor or academic office.
              </p>
              <p>
                It doesn't replace your institution's processes, and it doesn't argue with Turnitin.
                It just lets you show, plainly, how the essay was written. That's usually enough.
              </p>
              <div
                className="rounded-xl p-5 mt-4"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-text-primary text-sm leading-relaxed">
                    <span className="font-semibold">WriteVault is free to start.</span> If you're
                    worried about being flagged in the future, you can begin recording your writing
                    process today — no credit card, no commitment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6" style={{ marginTop: 128 }}>
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#475569' }}>
            SIDE BY SIDE
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Turnitin vs WriteVault
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            One detects. The other defends. Here's what each tool actually delivers.
          </p>
        </div>

        <ComparisonTable />

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
            <FileSignature className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Protect your next essay.
            </h2>
            <p className="text-text-secondary mt-4 text-lg max-w-xl mx-auto">
              Start writing in WriteVault today. If you're ever flagged, you'll have the proof you
              need — already recorded, already verified.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  padding: '16px 32px',
                  boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.25)',
                }}
              >
                Start Writing Free
                <ChevronRight className="w-5 h-5" />
              </button>
              <a
                href="/compare"
                className="rounded-xl transition-all hover:border-white/30 hover:text-white"
                style={{
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#94a3b8',
                  padding: '16px 32px',
                }}
              >
                Compare all detectors
              </a>
            </div>
            <p className="mt-4 text-xs" style={{ color: '#475569' }}>
              Free forever plan · No credit card required
            </p>
          </div>
        </div>
      </section>

      <BackToTop />
    </div>
  )
}
