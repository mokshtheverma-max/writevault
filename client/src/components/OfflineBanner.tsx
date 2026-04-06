import { useState, useEffect } from 'react'
import { WifiOff, X } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const goOffline = () => { setOffline(true); setDismissed(false) }
    const goOnline = () => setOffline(false)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warning/90 text-black px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium backdrop-blur-sm">
      <WifiOff className="w-4 h-4" />
      <span>You're offline — WriteVault is saving your work locally</span>
      <button onClick={() => setDismissed(true)} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
