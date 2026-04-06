import { useState, useRef, useCallback } from 'react'
import { X, Copy, Check, Download, Gift } from 'lucide-react'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import ShareCard from './ShareCard'
import { useAuth } from '../context/AuthContext'

interface ShareScoreModalProps {
  score: number
  sessionTitle: string
  wordCount: number
  onClose: () => void
}

export default function ShareScoreModal({ score, onClose }: ShareScoreModalProps) {
  const { user } = useAuth()
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const referralCode = (user as unknown as Record<string, unknown>)?.referralCode as string | undefined
  const referralUrl = referralCode
    ? `https://writevault.app/auth?ref=${referralCode}`
    : 'https://writevault.app/waitlist'

  const shareTexts = {
    twitter: `Just proved my essay is 100% human-written using @WriteVaultApp \u{1F9E0}\u{270D}\u{FE0F}

My authenticity score: ${score}/100

AI detectors keep falsely flagging students. WriteVault gives us proof.

Try it free \u{1F447}
${referralUrl}

#StudentLife #AIDetection #WriteVault`,

    linkedin: `Interesting tool for students dealing with false AI detection accusations.

WriteVault records your writing process cryptographically \u2014 creating behavioral proof that you wrote your work.

As AI detectors become standard in education, tools like this will matter.

${referralUrl}`,

    reddit: `This tool saved me from a false AI cheating accusation

My professor flagged my essay with Turnitin's AI detector. I had literally written every word myself.

Found WriteVault \u2014 it records your keystroke patterns, pauses, and revisions. Generated a full report showing my writing process.

Professor accepted it and dropped the accusation.

Free to try: ${referralUrl}`,
  }

  const downloadImage = useCallback(async () => {
    const el = document.querySelector('[data-share-card]') as HTMLElement | null
    if (!el) return

    try {
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `writevault-score-${score}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Image downloaded!')
    } catch {
      toast.error('Failed to generate image')
    }
  }, [score])

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const copyCode = () => {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode)
    setCodeCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const openShare = (platform: 'twitter' | 'linkedin' | 'reddit') => {
    const text = encodeURIComponent(shareTexts[platform])
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      reddit: `https://www.reddit.com/submit?title=${encodeURIComponent('This tool saved me from a false AI cheating accusation')}&text=${text}`,
    }
    window.open(urls[platform], '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-elevated border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Share your score</h2>
            <p className="text-text-muted text-sm mt-0.5">Let other students know WriteVault has their back</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Card Preview */}
        <div className="px-6 py-4 flex justify-center" ref={cardRef}>
          <ShareCard score={score} scale={0.5} />
        </div>

        {/* Download */}
        <div className="px-6 pb-2">
          <button
            onClick={downloadImage}
            className="w-full flex items-center justify-center gap-2 bg-surface border border-border hover:border-border-light text-text-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} /> Download Image
          </button>
        </div>

        {/* Share buttons */}
        <div className="px-6 py-3">
          <p className="text-xs text-text-muted mb-3">Share on</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => openShare('twitter')}
              className="flex flex-col items-center gap-1.5 bg-[#0f0f0f] hover:bg-[#1a1a1a] text-white px-3 py-3 rounded-xl text-xs font-medium transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> X
            </button>
            <button
              onClick={() => openShare('linkedin')}
              className="flex flex-col items-center gap-1.5 bg-[#0a66c2] hover:bg-[#084d94] text-white px-3 py-3 rounded-xl text-xs font-medium transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn
            </button>
            <button
              onClick={() => openShare('reddit')}
              className="flex flex-col items-center gap-1.5 bg-[#ff4500] hover:bg-[#cc3700] text-white px-3 py-3 rounded-xl text-xs font-medium transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 00.029-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.095z"/></svg>
              Reddit
            </button>
            <button
              onClick={copyLink}
              className="flex flex-col items-center gap-1.5 bg-surface border border-border hover:border-border-light text-text-primary px-3 py-3 rounded-xl text-xs font-medium transition-colors"
            >
              {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Referral section */}
        {referralCode && (
          <div className="mx-6 mb-6 mt-2 bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} className="text-primary" />
              <span className="text-sm font-medium text-text-primary">Share your referral link and get bonus sessions</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-sm text-primary tracking-wider">
                {referralCode}
              </div>
              <button
                onClick={copyCode}
                className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2">
              You've referred {String((user as unknown as Record<string, unknown>)?.referralCount ?? 0)} students
              {' \u2014 '}earned {String((user as unknown as Record<string, unknown>)?.bonusSessions ?? 0)} bonus sessions
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
