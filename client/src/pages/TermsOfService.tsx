import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-12" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Last updated: April 2026
        </p>

        <Section title="1. What WriteVault Is">
          <p>
            WriteVault is a writing process recorder that creates behavioral evidence of authentic
            authorship.
          </p>
        </Section>

        <Section title="2. What WriteVault Is NOT">
          <p>
            WriteVault is not a guarantee that any institution will accept our reports. We provide
            evidence — decisions are made by educators, not us.
          </p>
        </Section>

        <Section title="3. Your Account">
          <p>You must be 13 or older to use WriteVault.</p>
          <p>You are responsible for keeping your password secure.</p>
        </Section>

        <Section title="4. Your Content">
          <p>Your essays belong to you. Always.</p>
          <p>We only store behavioral metadata and timing data.</p>
        </Section>

        <Section title="5. Payments">
          <ul className="list-disc pl-6 space-y-2">
            <li>Monthly subscriptions are billed automatically.</li>
            <li>Cancel anytime — no cancellation fees.</li>
            <li>Refunds considered case by case within 7 days.</li>
          </ul>
        </Section>

        <Section title="6. Fair Use">
          <ul className="list-disc pl-6 space-y-2">
            <li>Don't use WriteVault to help others cheat.</li>
            <li>Don't attempt to manipulate your behavioral scores.</li>
            <li>Don't share accounts.</li>
          </ul>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            WriteVault is provided as-is. We're a small startup doing our best. We're not liable for
            decisions made by academic institutions based on our reports.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>
            <a href="mailto:legal@writevault.app" className="text-indigo-600 hover:underline">
              legal@writevault.app
            </a>
          </p>
        </Section>
      </main>
    </div>
  )
}
