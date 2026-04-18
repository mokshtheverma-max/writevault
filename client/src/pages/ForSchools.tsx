import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  GraduationCap,
  FileText,
  AlertTriangle,
  Users,
  ShieldAlert,
  PenLine,
  Activity,
  Share2,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  Lock,
  Fingerprint,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  Mail,
} from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

// ─── Reusable primitives ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-widest text-indigo-600 font-semibold mb-3">
      {children}
    </p>
  )
}

function StatCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white">
      <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-red-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 text-base leading-snug">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  )
}

function StepCard({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white relative">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
          {n}
        </span>
        <Icon className="w-5 h-5 text-indigo-500" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
      >
        {question}
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-600 border-t border-gray-100 pt-4 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ForSchools() {
  usePageTitle('WriteVault — For Schools & Institutions')
  const navigate = useNavigate()

  const [form, setForm] = useState({
    institution: '',
    role: 'Administrator',
    email: '',
    students: '',
    message: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent(`WriteVault inquiry — ${form.institution || 'Institution'}`)
    const body = encodeURIComponent(
      `Institution: ${form.institution}\n` +
      `Role: ${form.role}\n` +
      `Email: ${form.email}\n` +
      `Number of students: ${form.students}\n\n` +
      `Message:\n${form.message}`
    )
    window.location.href = `mailto:schools@writevault.app?subject=${subject}&body=${body}`
  }

  return (
    <div
      className="min-h-screen bg-white text-gray-800"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="font-semibold text-gray-900 text-sm">WriteVault</span>
            <span className="text-gray-400 text-sm hidden sm:inline">· For Institutions</span>
          </div>
          <a
            href="mailto:schools@writevault.app"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            schools@writevault.app
          </a>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HEADER
          ══════════════════════════════════════════════════════════ */}
      <header className="border-b border-gray-200 bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="max-w-5xl mx-auto px-6 py-20 sm:py-24 text-center">
          <SectionLabel>FOR INSTITUTIONS</SectionLabel>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-5">
            Bring WriteVault to Your School
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Help students prove their authentic work. Give educators a trusted verification tool.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:schools@writevault.app?subject=Demo%20request"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Request a Demo
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </a>
            <a
              href="/methodology"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-800 px-6 py-3 rounded-lg text-sm font-semibold transition-colors bg-white"
            >
              <FileText className="w-4 h-4" />
              Download Overview
            </a>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            No sales pressure. No commitment. Early adopter pricing available.
          </p>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          PROBLEM
          ══════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <SectionLabel>THE PROBLEM</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            The Academic Integrity Crisis
          </h2>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            AI detection is a blunt tool. The cost falls on students who did nothing wrong.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            icon={AlertTriangle}
            title="AI detectors have documented false positive rates"
            body="Major AI detection tools have been shown in peer-reviewed studies to misclassify human writing as AI-generated, sometimes at rates above 20%."
          />
          <StatCard
            icon={Users}
            title="Non-native speakers disproportionately flagged"
            body="A Stanford study found AI detectors flagged 61% of essays by non-native English speakers as AI-written, versus fewer than 5% of native speakers."
          />
          <StatCard
            icon={ShieldAlert}
            title="Students have no tools to prove their innocence"
            body="Once accused, students face the impossible task of proving a negative. WriteVault gives them tamper-evident evidence of their real writing process."
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════════════════════ */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <SectionLabel>HOW IT WORKS FOR SCHOOLS</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Four Steps. No Software to Install.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StepCard
              n={1}
              icon={PenLine}
              title="Students write essays in WriteVault"
              body="Students draft their work in our web editor — no install, no downloads, just a browser."
            />
            <StepCard
              n={2}
              icon={Activity}
              title="Sessions recorded with behavioral proof"
              body="Keystroke timing, pauses, and revision patterns are captured and cryptographically sealed."
            />
            <StepCard
              n={3}
              icon={Share2}
              title="Students share a verification link"
              body="Each session generates a unique link students send to their educator alongside the essay."
            />
            <StepCard
              n={4}
              icon={CheckCircle2}
              title="Educators independently verify"
              body="Teachers open verify.writevault.app, paste the link or hash, and see the tamper-evident report."
            />
          </div>

          <div className="mt-10 text-center">
            <p className="inline-block text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-5 py-3">
              No software to install. Works alongside your existing plagiarism detection tools.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES
          ══════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <SectionLabel>FEATURES FOR INSTITUTIONS</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Built for Schools, Not Just Students
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={GraduationCap}
            title="Independent educator verification portal"
            body="Educators verify sessions at verify.writevault.app without needing an account or student login."
          />
          <FeatureCard
            icon={Users}
            title="Bulk session verification"
            body="Verify up to 200 student sessions at once through the institution dashboard."
          />
          <FeatureCard
            icon={FileSpreadsheet}
            title="CSV export for records"
            body="Export verification results to CSV for LMS imports, grading records, and integrity case files."
          />
          <FeatureCard
            icon={Lock}
            title="No student data shared without consent"
            body="Students explicitly choose which sessions to share. Nothing is surfaced to educators without permission."
          />
          <FeatureCard
            icon={Fingerprint}
            title="FERPA-compliant data handling"
            body="Student data is encrypted in transit and at rest. We never sell or repurpose student information."
          />
          <FeatureCard
            icon={Layers}
            title="Works alongside Turnitin and other tools"
            body="WriteVault complements existing detection workflows. It provides evidence, not a replacement."
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING
          ══════════════════════════════════════════════════════════ */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <SectionLabel>PRICING FOR INSTITUTIONS</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Simple. Transparent. No Gotchas.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="border border-gray-200 rounded-2xl p-8 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Free for Educators</h3>
              <p className="text-sm text-gray-500 mt-1">Always free, no strings attached.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500 text-sm ml-1">/ forever</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-700 mb-8">
                {[
                  'Verify unlimited student sessions',
                  'Access educator portal',
                  'No cost ever',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/verify/teacher"
                className="block text-center border border-gray-300 hover:border-gray-400 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Open Educator Portal
              </a>
            </div>

            {/* Institution */}
            <div className="border-2 border-indigo-500 rounded-2xl p-8 bg-white relative shadow-sm">
              <span className="absolute -top-3 left-8 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                RECOMMENDED
              </span>
              <h3 className="text-lg font-semibold text-gray-900">Institution Plan</h3>
              <p className="text-sm text-gray-500 mt-1">For schools and districts.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-gray-900">$299</span>
                <span className="text-gray-500 text-sm ml-1">/ month</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-700 mb-8">
                {[
                  'Everything in Free, plus:',
                  'Bulk verification dashboard',
                  'CSV export',
                  'Priority support',
                  'Usage analytics',
                  'Custom branding on reports',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:schools@writevault.app?subject=Institution%20Plan%20inquiry"
                className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Contact us for district-wide pricing —{' '}
            <a
              href="mailto:schools@writevault.app"
              className="text-indigo-600 hover:underline"
            >
              schools@writevault.app
            </a>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS
          ══════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <SectionLabel>TESTIMONIALS</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-6">
            Be a Founding Partner
          </h2>
          <div className="border border-dashed border-gray-300 rounded-2xl p-10 bg-gray-50">
            <p className="text-gray-700 text-lg italic leading-relaxed">
              &ldquo;Testimonials coming soon as we partner with early adopter institutions.&rdquo;
            </p>
            <p className="text-gray-600 mt-6">
              Interested in being a founding partner school? Contact us at{' '}
              <a
                href="mailto:schools@writevault.app"
                className="text-indigo-600 font-medium hover:underline"
              >
                schools@writevault.app
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FAQ
          ══════════════════════════════════════════════════════════ */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-10">
            <SectionLabel>FREQUENTLY ASKED</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Questions from Schools
            </h2>
          </div>

          <div className="space-y-3">
            <FAQItem
              question="Is WriteVault FERPA compliant?"
              answer="We take student privacy seriously. Student data is encrypted, never sold, and only shared with educators the student explicitly chooses."
            />
            <FAQItem
              question="Does WriteVault replace plagiarism detection?"
              answer="No. WriteVault complements existing tools. Use it alongside Turnitin or iThenticate."
            />
            <FAQItem
              question="What if a student tries to cheat WriteVault?"
              answer="Our 5-layer behavioral analysis makes gaming the system extremely difficult. Phone transcription, random pauses, and other tricks are detectable through our biometric and cognitive analysis layers."
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CONTACT FORM
          ══════════════════════════════════════════════════════════ */}
      <section className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <SectionLabel>GET IN TOUCH</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            Talk to Our Team
          </h2>
          <p className="text-gray-600">
            Tell us about your institution and we'll be in touch within one business day.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border border-gray-200 rounded-2xl p-8 bg-white">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Institution name</label>
            <input
              required
              type="text"
              value={form.institution}
              onChange={e => setForm({ ...form, institution: e.target.value })}
              placeholder="e.g. Lincoln High School"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Your role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors bg-white"
            >
              <option>Administrator</option>
              <option>Teacher</option>
              <option>IT Director</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@institution.edu"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Number of students</label>
            <input
              type="text"
              value={form.students}
              onChange={e => setForm({ ...form, students: e.target.value })}
              placeholder="e.g. 1,200"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Message</label>
            <textarea
              rows={4}
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us about your situation, questions, or timeline."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            Get in Touch
          </button>

          <p className="text-xs text-gray-500 text-center">
            This opens your email client with a pre-filled message to schools@writevault.app.
          </p>
        </form>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} WriteVault. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="hover:text-gray-800 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-800 transition-colors">Terms</a>
            <a href="/methodology" className="hover:text-gray-800 transition-colors">Methodology</a>
            <a href="mailto:schools@writevault.app" className="hover:text-gray-800 transition-colors">schools@writevault.app</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
