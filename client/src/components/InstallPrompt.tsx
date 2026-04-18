import { useState, useEffect } from 'react'
import { X, Smartphone } from 'lucide-react'
import { listSessions } from '../utils/sessionStorage'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'wv_install_dismissed'
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Don't show if dismissed in the last 7 days
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedAt && Date.now() - dismissedAt < SEVEN_DAYS) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Only show once user has completed their first session
    const check = () => {
      const sessions = listSessions()
      if (sessions.length >= 1) setShow(true)
    }
    check()
    const interval = setInterval(check, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearInterval(interval)
    }
  }, [])

  if (!deferredPrompt || !show || dismissed) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDismissed(true)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-auto md:top-16 md:left-auto md:right-4 md:p-0 md:w-80 safe-bottom">
      <div className="bg-surface border border-border md:border-t-2 md:border-t-primary rounded-2xl md:rounded-xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-sm font-semibold">
              📱 Add WriteVault to your home screen
            </p>
            <p className="text-text-muted text-xs mt-1 leading-relaxed">
              Get instant access to your writing proof anytime.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="text-text-muted hover:text-text-secondary p-1 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4 mt-3 pl-13">
          <button
            onClick={handleInstall}
            className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Install — it's free
          </button>
          <button
            onClick={handleDismiss}
            className="text-text-muted hover:text-text-secondary text-sm transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
