import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import BackToTop from '../components/BackToTop'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function PrivacyPolicy() {
  usePageTitle('WriteVault — Privacy Policy')
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

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-12" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Last updated: April 2026
        </p>

        <Section title="1. What We Collect">
          <ul className="list-disc pl-6 space-y-2">
            <li>Your name and email when you create an account.</li>
            <li>
              Keystroke timing patterns and writing behavior — <strong>not</strong> the content of your
              essays. We store behavioral metadata only.
            </li>
            <li>Payment information is processed securely by Stripe. We never see your card details.</li>
          </ul>
        </Section>

        <Section title="2. What We Do With It">
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide writing authenticity verification.</li>
            <li>Generate your behavioral writing profile.</li>
            <li>Process your subscription payments.</li>
            <li>We never sell your data. Ever.</li>
            <li>We never share your essays with anyone.</li>
          </ul>
        </Section>

        <Section title="3. Your Data Rights">
          <ul className="list-disc pl-6 space-y-2">
            <li>Download all of your data anytime.</li>
            <li>Delete your account and all data anytime.</li>
            <li>We delete all data within 30 days of account deletion.</li>
          </ul>
        </Section>

        <Section title="4. Security">
          <ul className="list-disc pl-6 space-y-2">
            <li>All data is encrypted in transit (HTTPS).</li>
            <li>Passwords are hashed with bcrypt.</li>
            <li>Payment data is handled entirely by Stripe.</li>
          </ul>
        </Section>

        <Section title="5. Cookies">
          <ul className="list-disc pl-6 space-y-2">
            <li>We use one cookie: your login session.</li>
            <li>No advertising cookies.</li>
            <li>No tracking pixels.</li>
          </ul>
        </Section>

        <Section title="6. Contact">
          <p>
            Questions? Email us at{' '}
            <a href="mailto:hello@writevault.app" className="text-indigo-600 hover:underline">
              hello@writevault.app
            </a>
            .
          </p>
        </Section>
      </main>
      <BackToTop />
    </div>
  )
}
