import { useState, useRef, useEffect, forwardRef } from 'react'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckCircle,
} from 'lucide-react'
import CoachPanel from './CoachPanel'

/* ── Constants ────────────────────────────────────────────────────────── */
const PAGE_WIDTH = 816        // US Letter @ 96 dpi
const PAGE_HEIGHT = 1056
const PAGE_PADDING = 96       // 1 inch margins
const CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING * 2 // 864px usable
const LINE_HEIGHT = 32        // double-spaced 16px font
const LINES_PER_PAGE = Math.floor(CONTENT_HEIGHT / LINE_HEIGHT) // ~27
const CHARS_PER_LINE = 75
const CHARS_PER_PAGE = LINES_PER_PAGE * CHARS_PER_LINE // ~2025

/* ── Types ────────────────────────────────────────────────────────────── */
interface DocumentEditorProps {
  content: string
  onContentChange: (value: string) => void
  sessionTitle: string
  onTitleChange: (value: string) => void
  isRecording: boolean
  isAnalyzing: boolean
  wordCount: number
  charCount: number
  keystrokeCount: number
  pauseCount: number
  pasteCount: number
  elapsed: number
  onFinish: () => void
  canFinish: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  formatTime: (ms: number) => string
}

interface FinishModalProps {
  wordCount: number
  duration: string
  keystrokeCount: number
  pauseCount: number
  pasteCount: number
  pages: number
  onKeepWriting: () => void
  onAnalyze: () => void
}

/* ── Finish Modal ─────────────────────────────────────────────────────── */
function FinishModal({
  wordCount,
  duration,
  keystrokeCount,
  pauseCount,
  pasteCount,
  pages,
  onKeepWriting,
  onAnalyze,
}: FinishModalProps) {
  const stats = [
    { label: 'Words Written', value: wordCount.toLocaleString() },
    { label: 'Time Spent', value: duration },
    { label: 'Keystrokes', value: keystrokeCount.toLocaleString() },
    { label: 'Pauses Detected', value: pauseCount.toLocaleString() },
    { label: 'Corrections Made', value: pasteCount.toLocaleString() },
    { label: 'Pages Written', value: pages.toLocaleString() },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center mb-6">
          <CheckCircle className="text-indigo-600 mb-4" size={48} strokeWidth={1.5} />
          <h2 className="text-xl font-semibold text-gray-900">Ready to analyze your session?</h2>
          <p className="text-sm text-gray-500 mt-1">WriteVault recorded your complete writing process.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg px-4 py-3">
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="text-lg font-semibold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onKeepWriting}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Keep Writing
          </button>
          <button
            onClick={onAnalyze}
            className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Analyze My Writing &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Toolbar Button ───────────────────────────────────────────────────── */
function ToolbarBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="text-gray-600 hover:bg-gray-100 rounded p-1.5 transition-colors cursor-default">
      {children}
    </button>
  )
}

function ToolbarSep() {
  return <div className="w-px h-5 bg-gray-300 mx-1" />
}

/* ── Main Component ───────────────────────────────────────────────────── */
const DocumentEditor = forwardRef<HTMLTextAreaElement, DocumentEditorProps>(
  function DocumentEditor(props, _ref) {
    const {
      content,
      onContentChange,
      sessionTitle,
      onTitleChange,
      isRecording,
      isAnalyzing,
      wordCount,
      charCount,
      keystrokeCount,
      pauseCount,
      elapsed,
      onFinish,
      canFinish,
      textareaRef,
      formatTime,
    } = props

    const [showFinishModal, setShowFinishModal] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const hiddenMeasureRef = useRef<HTMLDivElement>(null)
    const [pages, setPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)

    // Recalculate pages when content changes
    useEffect(() => {
      if (hiddenMeasureRef.current) {
        const measuredHeight = hiddenMeasureRef.current.scrollHeight
        const needed = Math.max(1, Math.ceil(measuredHeight / CONTENT_HEIGHT))
        setPages(needed)
      } else {
        const needed = Math.max(1, Math.ceil(content.length / CHARS_PER_PAGE))
        setPages(needed)
      }
    }, [content])

    // Track current page from scroll position
    useEffect(() => {
      const el = scrollRef.current
      if (!el) return
      const handleScroll = () => {
        const scrollTop = el.scrollTop
        const pageWithGap = PAGE_HEIGHT + 24
        const page = Math.min(pages, Math.floor(scrollTop / pageWithGap) + 1)
        setCurrentPage(page)
      }
      el.addEventListener('scroll', handleScroll, { passive: true })
      return () => el.removeEventListener('scroll', handleScroll)
    }, [pages])

    const handleFinishClick = () => {
      if (!canFinish) return
      setShowFinishModal(true)
    }

    const totalTextareaHeight = Math.max(PAGE_HEIGHT, pages * CONTENT_HEIGHT)

    return (
      <div className="flex flex-col h-screen bg-[#f0f4f9] overflow-hidden">

        {/* ── Top Toolbar ───────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
          {/* Row 1 — App bar */}
          <div className="h-12 flex items-center px-3 sm:px-4 gap-2 sm:gap-3">
            {/* Left: logo + title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-indigo-600" fill="currentColor">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v6a1 1 0 001 1h6v9H6z"/>
              </svg>
              <div className="min-w-0">
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={e => onTitleChange(e.target.value)}
                  className="block w-full border-none outline-none text-gray-800 font-medium text-base sm:text-lg hover:bg-gray-100 rounded px-2 py-0.5 transition-colors bg-transparent"
                  placeholder="Untitled Document"
                />
                <span className="text-xs text-gray-500 px-2 hidden sm:inline">All changes saved</span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-xs">
              {isRecording && (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-red-500 font-medium hidden sm:inline">Recording</span>
                </span>
              )}
              <span className="text-gray-500 hidden sm:inline">{wordCount} words</span>
              <button
                onClick={handleFinishClick}
                disabled={!canFinish || isAnalyzing}
                className="bg-indigo-600 text-white text-sm px-3 sm:px-4 py-1.5 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Analyzing...</span>
                  </span>
                ) : (
                  <span><span className="sm:hidden">Finish</span><span className="hidden sm:inline">Finish & Analyze</span></span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2 — Formatting toolbar (hidden on mobile) */}
          <div className="h-10 border-t border-gray-100 hidden md:flex items-center px-4 gap-1">
            <div className="border border-gray-300 rounded px-2 py-0.5 text-sm text-gray-600 cursor-default select-none">
              Arial
            </div>
            <div className="border border-gray-300 rounded px-2 py-0.5 text-sm text-gray-600 cursor-default select-none ml-1">
              11
            </div>
            <ToolbarSep />
            <ToolbarBtn><Bold size={16} /></ToolbarBtn>
            <ToolbarBtn><Italic size={16} /></ToolbarBtn>
            <ToolbarBtn><Underline size={16} /></ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn><AlignLeft size={16} /></ToolbarBtn>
            <ToolbarBtn><AlignCenter size={16} /></ToolbarBtn>
            <ToolbarBtn><AlignRight size={16} /></ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn><List size={16} /></ToolbarBtn>
            <ToolbarBtn><ListOrdered size={16} /></ToolbarBtn>

            {/* Right side — live stats pills */}
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-gray-100 rounded-full px-2.5 py-0.5">Keystrokes: {keystrokeCount}</span>
              <span className="bg-gray-100 rounded-full px-2.5 py-0.5">Pauses: {pauseCount}</span>
              <span className="bg-gray-100 rounded-full px-2.5 py-0.5">Time: {formatTime(elapsed)}</span>
            </div>
          </div>
        </header>

        {/* ── Body (sidebar + document area) ────────────────────── */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left sidebar — page thumbnails (hidden on mobile) */}
          <div className="hidden md:flex w-[60px] bg-[#f0f4f9] flex-col items-center py-4 gap-2 overflow-y-auto shrink-0">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = scrollRef.current
                  if (el) el.scrollTo({ top: i * (PAGE_HEIGHT + 24), behavior: 'smooth' })
                }}
                className={`w-10 h-14 bg-white rounded text-xs text-gray-400 flex items-center justify-center cursor-pointer transition-all ${
                  currentPage === i + 1
                    ? 'border-2 border-indigo-400 shadow-md'
                    : 'shadow-sm hover:shadow-md border border-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Document scroll area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 sm:py-8 px-2 sm:px-4">
            <div className="flex flex-col items-center gap-6">
              {/* Hidden measure div */}
              <div
                ref={hiddenMeasureRef}
                aria-hidden="true"
                className="absolute opacity-0 pointer-events-none"
                style={{
                  width: PAGE_WIDTH - PAGE_PADDING * 2,
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '16px',
                  lineHeight: '32px',
                  letterSpacing: '0.01em',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {content || ' '}
              </div>

              {/* Page divs */}
              {Array.from({ length: pages }, (_, i) => (
                <div
                  key={i}
                  className="relative bg-white w-full md:w-auto"
                  style={{
                    maxWidth: PAGE_WIDTH,
                    minHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? 'auto' : PAGE_HEIGHT,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
                    padding: typeof window !== 'undefined' && window.innerWidth < 768 ? 24 : PAGE_PADDING,
                  }}
                >
                  {/* Page header */}
                  <span
                    className="absolute select-none pointer-events-none hidden sm:block"
                    style={{ top: 24, right: 32, fontSize: 11, color: '#d1d5db' }}
                  >
                    WriteVault &mdash; Recording Active
                  </span>

                  {/* Textarea on first page */}
                  {i === 0 && (
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={e => onContentChange(e.target.value)}
                      placeholder="Start typing your essay here..."
                      spellCheck
                      autoFocus
                      className="w-full border-none outline-none resize-none bg-transparent"
                      style={{
                        fontFamily: "'Times New Roman', serif",
                        fontSize: '16px',
                        lineHeight: '32px',
                        color: '#1a1a1a',
                        letterSpacing: '0.01em',
                        caretColor: '#4f46e5',
                        height: totalTextareaHeight,
                        minHeight: CONTENT_HEIGHT,
                      }}
                    />
                  )}

                  {/* Page number */}
                  <span
                    className="absolute left-0 right-0 text-center select-none pointer-events-none"
                    style={{ bottom: 24, fontSize: 12, color: '#9ca3af' }}
                  >
                    Page {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Coach Panel (right side) ──────────────────────── */}
          <CoachPanel
            content={content}
            wordCount={wordCount}
            sessionDuration={elapsed}
            pauseCount={pauseCount}
          />
        </div>

        {/* ── Status Bar ────────────────────────────────────────── */}
        <div className="bg-white border-t border-gray-200 h-8 flex items-center justify-between px-3 sm:px-6 shrink-0">
          <span className="text-xs text-gray-500 hidden sm:inline">
            {isAnalyzing ? (
              <span className="text-indigo-600 animate-pulse">Running 5-layer authenticity engine...</span>
            ) : (
              'WriteVault is securely recording your writing process \u{1F512}'
            )}
          </span>
          <span className="text-xs text-gray-500">
            {wordCount} words{' '}<span className="hidden sm:inline">, {charCount} characters</span>
          </span>
          <span className="text-xs text-gray-500">
            Page {currentPage} of {pages}
          </span>
        </div>

        {/* ── Finish Modal ──────────────────────────────────────── */}
        {showFinishModal && (
          <FinishModal
            wordCount={wordCount}
            duration={formatTime(elapsed)}
            keystrokeCount={keystrokeCount}
            pauseCount={pauseCount}
            pasteCount={props.pasteCount}
            pages={pages}
            onKeepWriting={() => setShowFinishModal(false)}
            onAnalyze={() => {
              setShowFinishModal(false)
              onFinish()
            }}
          />
        )}

        {/* Selection styling */}
        <style>{`
          textarea::selection {
            background: rgba(99,102,241,0.2);
          }
          textarea::placeholder {
            color: #9ca3af;
          }
        `}</style>
      </div>
    )
  }
)

export default DocumentEditor
