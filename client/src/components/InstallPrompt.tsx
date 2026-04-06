import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed this session
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (sessionStorage.getItem('wv_install_dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Show after 2 minutes
    const timer = setTimeout(() => {
      setShow(true)
    }, 120_000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
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
    sessionStorage.setItem('wv_install_dismissed', '1')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-auto md:top-16 md:left-auto md:right-4 md:p-0 md:w-80 safe-bottom">
      <div className="bg-surface border border-border md:border-t-2 md:border-t-primary rounded-2xl md:rounded-xl p-4 flex items-center gap-3 shadow-lg">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-semibold">Install WriteVault</p>
          <p className="text-text-muted text-xs">Add to home screen for quick access</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-text-muted hover:text-text-secondary p-1 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
