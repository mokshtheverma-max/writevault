import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-gray-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="mb-16">
          <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            About WriteVault
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Built by a student who got tired of watching classmates get accused of cheating they didn't do.
          </h1>
        </section>

        {/* Story */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Our Story</h2>
          <div className="text-gray-700 leading-relaxed space-y-4 text-lg">
            <p>WriteVault was started in 2026 by Moksh Verma.</p>
            <p>
              At 14 years old, Moksh watched as AI detection tools became standard in schools — and
              started flagging real student work as AI-generated.
            </p>
            <p>
              The tools were wrong. The students were innocent. And nobody had built anything to help
              them prove it.
            </p>
            <p className="font-semibold text-gray-900">So he built WriteVault.</p>
          </div>
        </section>

        {/* Problem */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            The Problem We're Solving
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              AI detectors have documented false positive rates — meaning real human writing gets
              flagged as AI-generated. Non-native English speakers are especially vulnerable.
            </p>
            <p>When that happens, students have no way to prove their innocence. Until now.</p>
          </div>
        </section>

        {/* What We're Building */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            What We're Building
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              WriteVault is early. We're a small team working hard to protect students everywhere.
            </p>
            <p>If you believe in what we're building, try it free and tell a friend.</p>
          </div>
        </section>

        {/* Founder */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Founder</h2>
          <div className="flex items-center gap-5 pt-2">
            <div
              className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              M
            </div>
            <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <p className="text-lg font-bold text-gray-900">Moksh Verma</p>
              <p className="text-sm text-gray-600">Founder, WriteVault</p>
              <p className="text-sm text-gray-500 mt-0.5">Age 14 · San Ramon, CA</p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Contact</h2>
          <div className="text-gray-700 leading-relaxed space-y-3">
            <p>Want to work with us? Partner with us? Just say hi?</p>
            <p>
              <a href="mailto:hello@writevault.app" className="text-indigo-600 hover:underline text-lg">
                hello@writevault.app
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
