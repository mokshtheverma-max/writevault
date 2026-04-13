import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Fingerprint,
  PenLine,
  Activity,
  ShieldCheck,
  GraduationCap,
  School,
  BookOpen,
  Users,
  Check,
  X,
  Copy,
  Share2 as Twitter,
  ArrowRight,
  Sparkles,
  FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Confetti from '../components/Confetti'

const ONBOARDING_KEY = 'wv_onboarding_complete'
const PROFILE_KEY = 'wv_user_profile'

type UserType = 'highschool' | 'college' | 'grad' | 'educator'

const USER_TYPES: { id: UserType; label: string; icon: typeof GraduationCap }[] = [
  { id: 'highschool', label: 'High School Student', icon: BookOpen },
  { id: 'college',    label: 'College Student',    icon: GraduationCap },
  { id: 'grad',       label: 'Graduate Student',   icon: School },
  { id: 'educator',   label: 'Educator',           icon: Users },
]

const WORRIES = [
  'Getting falsely accused',
  'Proving my work to professors',
  'AI detectors flagging my essays',
  'Building my writing history',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [worries, setWorries] = useState<string[]>([])

  const firstName = useMemo(() => (user?.name || 'friend').split(' ')[0], [user])

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    navigate('/editor')
  }

  const skip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    navigate('/editor')
  }

  const next = () => {
    setDirection(1)
    setStep(s => Math.min(s + 1, 4))
  }

  const saveProfile = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ userType, worries }))
    next()
  }

  const stepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <div className="min-h-screen bg-base text-text-primary relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary-glow blur-3xl opacity-60" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="text-xs tracking-wide text-text-secondary font-mono">
          Step {step + 1} / 5
        </div>
        <button
          onClick={skip}
          className="text-sm text-text-secondary hover:text-text-primary transition flex items-center gap-1"
        >
          Skip <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-6">
        <div className="h-1 w-full bg-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={false}
            animate={{ width: `${((step + 1) / 5) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10 min-h-[70vh] flex items-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full"
          >
            {step === 0 && <StepWelcome firstName={firstName} onNext={next} />}
            {step === 1 && (
              <StepProfile
                userType={userType}
                setUserType={setUserType}
                worries={worries}
                setWorries={setWorries}
                onNext={saveProfile}
              />
            )}
            {step === 2 && <StepDemo onNext={next} />}
            {step === 3 && <StepTry onNext={next} onSkip={skip} />}
            {step === 4 && <StepShare user={user} onFinish={finish} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Step 1 — Welcome                                            */
/* ─────────────────────────────────────────────────────────── */

function StepWelcome({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-glow border border-primary/30 mb-8 shadow-glow"
      >
        <Fingerprint className="w-12 h-12 text-primary" />
      </motion.div>

      <h1 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
        Welcome to WriteVault, {firstName}! 👋
      </h1>
      <p className="text-text-secondary text-lg mb-10">
        You're about to write smarter. Here's what happens next:
      </p>

      <div className="space-y-3 max-w-md mx-auto mb-10 text-left">
        {[
          { icon: '✍️', text: 'Write your essay in our editor' },
          { icon: '🔬', text: 'We silently analyze your writing behavior' },
          { icon: '🛡️', text: 'Get proof no one can dispute' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="flex items-center gap-4 px-5 py-4 rounded-xl bg-elevated border border-border"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-text-primary">{item.text}</span>
          </motion.div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium shadow-glow transition"
      >
        Let's set up your profile <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Step 2 — Profile                                            */
/* ─────────────────────────────────────────────────────────── */

function StepProfile({
  userType,
  setUserType,
  worries,
  setWorries,
  onNext,
}: {
  userType: UserType | null
  setUserType: (t: UserType) => void
  worries: string[]
  setWorries: (w: string[]) => void
  onNext: () => void
}) {
  const toggleWorry = (w: string) =>
    setWorries(worries.includes(w) ? worries.filter(x => x !== w) : [...worries, w])

  const canContinue = userType !== null

  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-2">Tell us about yourself</h2>
      <p className="text-text-secondary text-center mb-8">A few quick questions to personalize your experience.</p>

      <div className="mb-8">
        <div className="text-sm text-text-secondary mb-3 uppercase tracking-wide">What are you?</div>
        <div className="grid grid-cols-2 gap-3">
          {USER_TYPES.map(({ id, label, icon: Icon }) => {
            const selected = userType === id
            return (
              <button
                key={id}
                onClick={() => setUserType(id)}
                className={`p-4 rounded-xl border transition text-left flex items-center gap-3 ${
                  selected
                    ? 'bg-primary-glow border-primary shadow-glow-sm'
                    : 'bg-elevated border-border hover:border-border-light'
                }`}
              >
                <Icon className={`w-6 h-6 ${selected ? 'text-primary' : 'text-text-secondary'}`} />
                <span className="font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-10">
        <div className="text-sm text-text-secondary mb-3 uppercase tracking-wide">What's your biggest worry?</div>
        <div className="flex flex-wrap gap-2">
          {WORRIES.map(w => {
            const selected = worries.includes(w)
            return (
              <button
                key={w}
                onClick={() => toggleWorry(w)}
                className={`px-4 py-2 rounded-full border text-sm transition ${
                  selected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-elevated text-text-secondary border-border hover:border-border-light'
                }`}
              >
                {selected && <Check className="inline w-3 h-3 mr-1" />}
                {w}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium shadow-glow transition"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Step 3 — Demo                                               */
/* ─────────────────────────────────────────────────────────── */

function StepDemo({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1500),
      setTimeout(() => setPhase(2), 3500),
      setTimeout(() => setPhase(3), 5500),
      setTimeout(() => onNext(), 8000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onNext])

  const demoText = 'Writing this myself, in real time.'

  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-2">Watch how WriteVault protects you</h2>
      <p className="text-text-secondary text-center mb-8">Every keystroke becomes evidence.</p>

      <div className="rounded-2xl bg-surface border border-border p-6 space-y-5">
        {/* 1. Typing */}
        <div className="rounded-lg bg-elevated border border-border p-4 font-mono text-sm">
          <div className="text-xs text-text-secondary mb-2">editor</div>
          <TypewriterLine text={demoText} active={phase >= 0} />
        </div>

        {/* 2. Keystrokes captured */}
        <div className="flex items-center gap-3">
          <Activity className={`w-5 h-5 ${phase >= 1 ? 'text-primary' : 'text-text-muted'}`} />
          <div className="text-sm flex-1">
            <span className={phase >= 1 ? 'text-text-primary' : 'text-text-muted'}>
              Capturing keystroke patterns
            </span>
          </div>
          <DotStream active={phase >= 1} />
        </div>

        {/* 3. Score gauge */}
        <div className="flex items-center gap-4">
          <Sparkles className={`w-5 h-5 ${phase >= 2 ? 'text-accent' : 'text-text-muted'}`} />
          <div className="flex-1">
            <div className="text-sm mb-1.5 flex justify-between">
              <span className={phase >= 2 ? 'text-text-primary' : 'text-text-muted'}>Human authenticity score</span>
              <span className="font-mono text-success">{phase >= 2 ? '94%' : '—'}</span>
            </div>
            <div className="h-2 w-full bg-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-success"
                initial={{ width: 0 }}
                animate={{ width: phase >= 2 ? '94%' : '0%' }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* 4. Certificate */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              className="rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/40 p-4 flex items-center gap-3 shadow-glow-sm"
            >
              <FileText className="w-6 h-6 text-primary" />
              <div className="flex-1">
                <div className="font-medium">Certificate generated</div>
                <div className="text-xs text-text-secondary font-mono">cryptographic proof of authorship</div>
              </div>
              <ShieldCheck className="w-5 h-5 text-success" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium shadow-glow transition"
        >
          Got it <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function TypewriterLine({ text, active }: { text: string; active: boolean }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    if (!active) return
    let i = 0
    const t = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(t)
    }, 60)
    return () => clearInterval(t)
  }, [text, active])
  return (
    <div className="text-text-primary">
      {shown}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
        className="inline-block w-[2px] h-4 bg-primary align-middle ml-0.5"
      />
    </div>
  )
}

function DotStream({ active }: { active: boolean }) {
  if (!active) return <div className="w-20 h-2" />
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary"
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Step 4 — Try it                                             */
/* ─────────────────────────────────────────────────────────── */

function StepTry({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [text, setText] = useState('')
  const [keystrokes, setKeystrokes] = useState(0)
  const [pauses, setPauses] = useState(0)
  const lastKeyAt = useRef<number>(0)
  const intervals = useRef<number[]>([])

  const onKey = () => {
    const now = Date.now()
    if (lastKeyAt.current) {
      const gap = now - lastKeyAt.current
      intervals.current.push(gap)
      if (gap > 800) setPauses(p => p + 1)
    }
    lastKeyAt.current = now
    setKeystrokes(k => k + 1)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  // Simple "human score" — variability of intervals + presence of pauses
  const score = useMemo(() => {
    if (keystrokes < 5) return 0
    const ivs = intervals.current
    if (ivs.length < 3) return 50
    const mean = ivs.reduce((a, b) => a + b, 0) / ivs.length
    const variance = ivs.reduce((a, b) => a + (b - mean) ** 2, 0) / ivs.length
    const std = Math.sqrt(variance)
    const cv = mean ? std / mean : 0
    const base = Math.min(100, 60 + cv * 40 + Math.min(pauses, 5) * 3)
    return Math.round(Math.max(50, Math.min(99, base)))
  }, [keystrokes, pauses])

  const ready = wordCount >= 10

  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-2">Try it right now</h2>
      <p className="text-text-secondary text-center mb-8">
        Type one sentence below and see WriteVault in action.
      </p>

      <div className="rounded-2xl bg-surface border border-border p-5">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Start with: 'I am writing this myself because...'"
          rows={4}
          className="w-full bg-elevated border border-border rounded-lg p-4 text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-primary transition font-serif"
        />

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Keystrokes" value={keystrokes.toString()} />
          <Stat label="Pauses" value={pauses.toString()} />
          <Stat
            label="Human score"
            value={keystrokes < 5 ? 'calculating…' : `${score}%`}
            highlight={keystrokes >= 5}
          />
        </div>

        <div className="mt-4">
          <div className="h-2 w-full bg-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-accent to-success"
              animate={{ width: `${score}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
            />
          </div>
        </div>

        <AnimatePresence>
          {ready && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-center shadow-[0_0_24px_rgba(16,185,129,0.25)]"
            >
              <div className="text-success font-medium">
                Your writing is already {score}% authentic!
              </div>
              <div className="text-sm text-text-secondary mt-1">
                Imagine what a full essay looks like 📄
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium shadow-glow transition"
        >
          Write My First Essay <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={onSkip} className="text-sm text-text-secondary hover:text-text-primary transition">
          I'll explore on my own
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-elevated border border-border px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-text-secondary">{label}</div>
      <div className={`font-mono mt-0.5 ${highlight ? 'text-success' : 'text-text-primary'}`}>{value}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Step 5 — Share                                              */
/* ─────────────────────────────────────────────────────────── */

function StepShare({ user, onFinish }: { user: { referralCode?: string } | null; onFinish: () => void }) {
  const refLink = useMemo(() => {
    const code = user?.referralCode || ''
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return code ? `${base}/auth?ref=${code}` : `${base}/auth`
  }, [user])

  const tweet = encodeURIComponent(
    `I just joined @writevault to prove my writing is mine. Every keystroke becomes evidence. Join me: ${refLink}`
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink)
      toast.success('Link copied!')
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className="text-center relative">
      <Confetti />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
        className="text-6xl mb-4"
      >
        🎉
      </motion.div>

      <h2 className="text-4xl md:text-5xl font-semibold mb-3">You're all set!</h2>
      <p className="text-text-secondary text-lg mb-10">Your writing is now protected.</p>

      <div className="rounded-2xl bg-surface border border-border p-6 max-w-md mx-auto mb-8 text-left">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <div className="font-medium">Get 3 extra free sessions</div>
        </div>
        <div className="text-sm text-text-secondary mb-4">when you invite friends to WriteVault</div>

        <div className="flex gap-2">
          <input
            readOnly
            value={refLink}
            className="flex-1 bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-secondary outline-none"
          />
          <button
            onClick={copy}
            className="px-3 rounded-lg bg-primary hover:bg-primary-hover text-white transition"
            aria-label="Copy link"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <a
          href={`https://twitter.com/intent/tweet?text=${tweet}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-elevated hover:bg-border border border-border transition text-sm"
        >
          <Twitter className="w-4 h-4 text-primary" />
          Share on Twitter
        </a>
      </div>

      <button
        onClick={onFinish}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium shadow-glow transition"
      >
        <PenLine className="w-4 h-4" /> Start Writing
      </button>
    </div>
  )
}
