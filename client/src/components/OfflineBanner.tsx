import { useState, useEffect, useRef } from 'react'
import { WifiOff, Wifi, X } from 'lucide-react'

type Mode = 'hidden' | 'offline' | 'syncing'

export default function OfflineBanner() {
  const [mode, setMode] = useState<Mode>(!navigator.onLine ? 'offline' : 'hidden')
  const [dismissed, setDismissed] = useState(false)
  const autoHideRef = useRef<number | null>(null)

  useEffect(() => {
    const goOffline = () => {
      setMode('offline')
      setDismissed(false)
      if (autoHideRef.current) {
        window.clearTimeout(autoHideRef.current)
        autoHideRef.current = null
      }
    }
    const goOnline = () => {
      setMode('syncing')
      setDismissed(false)
      autoHideRef.current = window.setTimeout(() => {
        setMode('hidden')
        autoHideRef.current = null
      }, 3000)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
      if (autoHideRef.current) window.clearTimeout(autoHideRef.current)
    }
  }, [])

  if (mode === 'hidden' || dismissed) return null

  if (mode === 'syncing') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-green-500/95 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium backdrop-blur-sm">
        <Wifi className="w-4 h-4" />
        <span>Back online! ✓ Syncing your session...</span>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warning/90 text-black px-4 py-3 flex items-start sm:items-center justify-center gap-3 text-sm backdrop-blur-sm">
      <WifiOff className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
      <div className="flex-1 sm:flex-initial sm:text-center leading-snug">
        <div className="font-semibold">You're offline 📡</div>
        <div className="text-xs opacity-90">
          Don't worry — WriteVault saves your writing locally. Your session will sync when you reconnect.
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
