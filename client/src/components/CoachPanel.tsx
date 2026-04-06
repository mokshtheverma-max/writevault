import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, MessageSquare, HelpCircle, LayoutList, Heart } from 'lucide-react'
import { useCoach, type CoachMessage } from '../hooks/useCoach'
import { usePlan } from '../hooks/usePlan'

interface CoachPanelProps {
  content: string
  wordCount: number
  sessionDuration: number
  pauseCount: number
}

function CoachBubble({ msg }: { msg: CoachMessage }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span className="text-[10px] text-gray-400">
          {msg.type === 'feedback' && 'Feedback'}
          {msg.type === 'unstuck' && 'Unstuck Help'}
          {msg.type === 'structure' && 'Structure Review'}
          {msg.type === 'encourage' && 'Encouragement'}
        </span>
      </div>
      <div className="bg-[#151528] rounded-xl p-3 text-sm text-gray-200 leading-relaxed">
        <p>{msg.content}</p>
        {msg.questions && msg.questions.length > 0 && (
          <ol className="mt-2 space-y-1.5 list-decimal list-inside text-gray-300">
            {msg.questions.map((q, i) => (
              <li key={i} className="text-sm">{q}</li>
            ))}
          </ol>
        )}
        {msg.suggestions && msg.suggestions.length > 0 && (
          <ul className="mt-2 space-y-1 text-gray-300">
            {msg.suggestions.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-1.5">
                <span className="text-indigo-400 mt-0.5 shrink-0">-</span>{s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[10px] text-gray-500 italic mt-1">
        This is guidance only. Write the words yourself.
      </p>
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Sparkles className="w-3 h-3 text-indigo-400" />
      <span className="text-xs text-gray-400">Coach is thinking</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </div>
  )
}

export default function CoachPanel({ content, wordCount, sessionDuration, pauseCount }: CoachPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const { currentPlan } = usePlan()
  const {
    messages,
    isLoading,
    requestsUsed,
    requestsLimit,
    canRequest,
    getFeedback,
    getUnstuck,
    checkStructure,
    getEncouragement,
  } = useCoach(currentPlan)

  const lastSentence = content.trim().split(/[.!?]\s+/).pop() || ''

  const actions = [
    {
      label: 'Get Feedback',
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: () => getFeedback(content, sessionDuration, wordCount),
      disabled: !content.trim() || wordCount < 3,
    },
    {
      label: "I'm Stuck",
      icon: <HelpCircle className="w-4 h-4" />,
      onClick: () => getUnstuck(content, lastSentence),
      disabled: false,
    },
    {
      label: 'Check Structure',
      icon: <LayoutList className="w-4 h-4" />,
      onClick: () => checkStructure(content),
      disabled: !content.trim() || wordCount < 20,
    },
    {
      label: 'Encourage Me',
      icon: <Heart className="w-4 h-4" />,
      onClick: () => getEncouragement(wordCount, sessionDuration, pauseCount),
      disabled: false,
    },
  ]

  // ── Collapsed tab (desktop) ───────────────────────────────────────────
  if (!expanded) {
    return (
      <>
        {/* Desktop: vertical tab on right edge */}
        <button
          onClick={() => setExpanded(true)}
          className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 w-10 bg-[#0e0e1c] border border-r-0 border-[#1f1f3d] rounded-l-xl flex-col items-center py-4 gap-2 hover:bg-[#151528] transition-colors"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] text-gray-400 font-medium tracking-wide" style={{ writingMode: 'vertical-rl' }}>
            AI Coach
          </span>
        </button>

        {/* Mobile: floating button */}
        <button
          onClick={() => setExpanded(true)}
          className="md:hidden fixed bottom-20 right-4 z-30 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </>
    )
  }

  // ── Expanded panel ────────────────────────────────────────────────────

  // Mobile: bottom sheet modal
  // Desktop: right sidebar panel
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => setExpanded(false)}
      />

      <AnimatePresence>
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed md:relative right-0 top-0 bottom-0 z-50 md:z-auto w-[320px] bg-[#0e0e1c] border-l border-[#1f1f3d] flex flex-col shrink-0"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1f1f3d] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">WriteVault Coach</span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 italic leading-relaxed">
              Coach gives guidance only — never writes for you. Your authenticity score is not affected.
            </p>
          </div>

          {/* Actions */}
          <div className="px-3 py-3 grid grid-cols-2 gap-2 border-b border-[#1f1f3d] shrink-0">
            {actions.map(action => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={isLoading || !canRequest || action.disabled}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-300 bg-[#151528] hover:bg-[#1a1a34] border border-[#1f1f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

          {/* Usage counter */}
          {!canRequest && (
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
              <p className="text-xs text-amber-400 font-medium">Free limit reached</p>
              <p className="text-[10px] text-amber-400/70">Upgrade to Student plan for unlimited coaching.</p>
            </div>
          )}
          {canRequest && requestsLimit !== Infinity && (
            <div className="px-4 py-2 border-b border-[#1f1f3d]">
              <p className="text-[10px] text-gray-500">
                {requestsUsed} of {requestsLimit} free requests used
              </p>
            </div>
          )}

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium mb-1">Your AI writing coach</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Tap a button above to get feedback, get unstuck, or check your essay structure.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <CoachBubble key={msg.id} msg={msg} />
            ))}

            {isLoading && <LoadingDots />}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
