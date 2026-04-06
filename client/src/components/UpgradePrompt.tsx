import { useNavigate } from 'react-router-dom'
import { Sparkles, X, Check } from 'lucide-react'

interface UpgradePromptProps {
  onDismiss?: () => void
  inline?: boolean
}

export default function UpgradePrompt({ onDismiss, inline = false }: UpgradePromptProps) {
  const navigate = useNavigate()

  const content = (
    <div className={`${inline ? '' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'}`}>
      <div className={`bg-surface border border-border rounded-2xl p-8 max-w-md w-full ${inline ? '' : 'mx-4 shadow-xl'}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          {onDismiss && !inline && (
            <button onClick={onDismiss} className="text-text-muted hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <h3 className="text-xl font-bold text-text-primary mb-2">
          You've used your 3 free sessions
        </h3>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
          Upgrade to Student plan for unlimited sessions, Writing DNA, and PDF certificates.
        </p>

        {/* Comparison table */}
        <div className="bg-elevated border border-border rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Feature</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Free</th>
                <th className="text-center px-4 py-3 text-primary font-medium">Student</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-text-secondary">Sessions</td>
                <td className="px-4 py-2.5 text-center text-text-muted">3 total</td>
                <td className="px-4 py-2.5 text-center text-text-primary font-medium">Unlimited</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-text-secondary">DNA Matching</td>
                <td className="px-4 py-2.5 text-center"><X className="w-4 h-4 text-text-muted mx-auto" /></td>
                <td className="px-4 py-2.5 text-center"><Check className="w-4 h-4 text-success mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-text-secondary">PDF Export</td>
                <td className="px-4 py-2.5 text-center"><X className="w-4 h-4 text-text-muted mx-auto" /></td>
                <td className="px-4 py-2.5 text-center"><Check className="w-4 h-4 text-success mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/pricing')}
          className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-all hover:shadow-glow-sm text-sm mb-3"
        >
          Upgrade for $7/month
        </button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-full text-text-muted hover:text-text-secondary text-sm py-2 transition-colors"
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  )

  return content
}
