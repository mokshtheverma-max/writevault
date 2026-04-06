import { useState } from 'react'
import { ShieldCheck, ShieldX, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface VerificationBadgeProps {
  hash: string
  verified?: boolean
  compact?: boolean
}

export default function VerificationBadge({
  hash,
  verified = true,
  compact = false,
}: VerificationBadgeProps) {
  const [copied, setCopied] = useState(false)
  const shortHash = hash.substring(0, 8).toUpperCase()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      toast.success('Hash copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-elevated hover:bg-border border border-border transition-colors group"
        title="Click to copy full hash"
      >
        {verified ? (
          <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
        ) : (
          <ShieldX className="w-3.5 h-3.5 text-red-400 shrink-0" />
        )}
        <span className="text-xs font-mono text-text-muted">{shortHash}…</span>
        {copied ? (
          <Check className="w-3 h-3 text-success" />
        ) : (
          <Copy className="w-3 h-3 text-text-muted group-hover:text-text-secondary" />
        )}
      </button>
    )
  }

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
      verified
        ? 'bg-green-500/5 border-green-500/20'
        : 'bg-red-500/5 border-red-500/20'
    }`}>
      <div className="flex items-center gap-3">
        {verified ? (
          <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
        ) : (
          <ShieldX className="w-5 h-5 text-red-400 shrink-0" />
        )}
        <div>
          <p className={`text-sm font-medium ${verified ? 'text-green-300' : 'text-red-300'}`}>
            {verified ? 'Verified by WriteVault' : 'Unverified'}
          </p>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            {shortHash}…{hash.substring(hash.length - 4).toUpperCase()}
          </p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Hash</span>
          </>
        )}
      </button>
    </div>
  )
}
