import toast from 'react-hot-toast'

/* ── Milestone definitions ────────────────────────────────────────────── */

interface MilestoneDef {
  id: string
  check: (ctx: MilestoneContext) => boolean
  icon: string
  message: string | ((ctx: MilestoneContext) => string)
  cta?: { label: string; href: string }
}

export interface MilestoneContext {
  sessionCount: number
  humanScore?: number
  shareCount?: number
  referralCompleted?: boolean
  referrerName?: string
}

const MILESTONES: MilestoneDef[] = [
  {
    id: 'first_session',
    check: ctx => ctx.sessionCount === 1,
    icon: '\u{1F389}',
    message: 'First session recorded! Your Writing DNA has begun.',
  },
  {
    id: 'third_session',
    check: ctx => ctx.sessionCount === 3,
    icon: '\u{1F9EC}',
    message: 'Writing DNA activated! Sessions now compared to your fingerprint.',
  },
  {
    id: 'high_score',
    check: ctx => (ctx.humanScore ?? 0) > 90,
    icon: '\u{1F525}',
    message: 'Exceptional score! Your writing is strongly authentic.',
  },
  {
    id: 'first_share',
    check: ctx => ctx.shareCount === 1,
    icon: '\u{1F4E3}',
    message: 'Thanks for spreading the word! +1 bonus session added.',
  },
  {
    id: 'referral_complete',
    check: ctx => !!ctx.referralCompleted,
    icon: '\u{1F38A}',
    message: ctx =>
      `${ctx.referrerName ?? 'Someone'} joined WriteVault! You earned 2 bonus sessions.`,
  },
  {
    id: 'ten_sessions',
    check: ctx => ctx.sessionCount === 10,
    icon: '\u{1F48E}',
    message: '10 sessions! Your Writing DNA is now court-ready evidence.',
  },
]

/* ── Storage for celebrated milestones ────────────────────────────────── */

const CELEBRATED_KEY = 'wv_milestones_celebrated'

function getCelebrated(): Set<string> {
  try {
    const raw = localStorage.getItem(CELEBRATED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function markCelebrated(id: string) {
  const set = getCelebrated()
  set.add(id)
  localStorage.setItem(CELEBRATED_KEY, JSON.stringify([...set]))
}

/* ── Main function ────────────────────────────────────────────────────── */

export function checkMilestones(ctx: MilestoneContext) {
  const celebrated = getCelebrated()

  for (const m of MILESTONES) {
    // Skip already celebrated (except high_score which can repeat)
    if (m.id !== 'high_score' && celebrated.has(m.id)) continue

    if (m.check(ctx)) {
      const msg = typeof m.message === 'function' ? m.message(ctx) : m.message

      // Use a unique id per milestone to avoid duplicates
      const toastId = `milestone_${m.id}`

      toast(
        (t) => (
          <div className="flex items-start gap-3 max-w-sm">
            <span className="text-2xl shrink-0">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{msg}</p>
              {m.cta && (
                <a
                  href={m.cta.href}
                  className="text-xs text-primary hover:text-primary-hover mt-1 inline-block"
                >
                  {m.cta.label}
                </a>
              )}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-text-muted hover:text-text-primary text-xs shrink-0 mt-0.5"
            >
              &times;
            </button>
          </div>
        ),
        {
          id: toastId,
          duration: 5000,
          style: {
            background: '#151528',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px',
            color: '#f8fafc',
            padding: '14px 16px',
            maxWidth: '400px',
          },
        }
      )

      markCelebrated(m.id)
    }
  }
}

export default checkMilestones
