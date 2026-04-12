import { useState, useRef, useEffect, forwardRef } from 'react'
import {
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  IndentDecrease,
  IndentIncrease,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  Printer,
  Highlighter,
  ChevronDown,
  CheckCircle,
} from 'lucide-react'
import CoachPanel from './CoachPanel'

/* ── Constants ────────────────────────────────────────────────────────── */
const PAGE_WIDTH = 816          // 8.5" @ 96dpi
const PAGE_HEIGHT = 1056        // 11" @ 96dpi
const PAGE_PADDING = 96         // 1" margins
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2   // 624
const CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING * 2 // 864
const PAGE_GAP = 16

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

/* ── Toolbar primitives ───────────────────────────────────────────────── */
function TBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick?: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-8 h-8 rounded flex items-center justify-center text-gray-600 transition-colors cursor-pointer ${
        active ? 'bg-gray-200' : 'hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

function TSep() {
  return <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
}

function TDropdown({ label, width }: { label: string; width: number }) {
  return (
    <div
      className="h-8 px-2 rounded hover:bg-gray-100 flex items-center justify-between gap-1 text-sm text-gray-700 cursor-pointer select-none"
      style={{ width }}
    >
      <span className="truncate">{label}</span>
      <ChevronDown size={14} className="text-gray-500 shrink-0" />
    </div>
  )
}

/* ── Ruler ────────────────────────────────────────────────────────────── */
function Ruler() {
  // 8 inch marks inside 6.5" content area between 1" margins
  const ticks = []
  for (let i = 0; i <= 8; i++) {
    ticks.push(
      <div
        key={i}
        className="absolute top-0 bottom-0 w-px bg-gray-400/60"
        style={{ left: `${i * 96}px` }}
      />
    )
    ticks.push(
      <div
        key={`l-${i}`}
        className="absolute text-[9px] text-gray-500 select-none"
        style={{ left: `${i * 96 + 2}px`, top: 2 }}
      >
        {i}
      </div>
    )
  }
  return (
    <div className="bg-[#f0f4f9] h-6 flex justify-center shrink-0 border-b border-gray-200">
      <div
        className="relative bg-white h-full border-l border-r border-gray-300"
        style={{ width: PAGE_WIDTH }}
      >
        {/* Margin shaded zones */}
        <div
          className="absolute top-0 bottom-0 bg-[#dce3ec]"
          style={{ left: 0, width: PAGE_PADDING }}
        />
        <div
          className="absolute top-0 bottom-0 bg-[#dce3ec]"
          style={{ right: 0, width: PAGE_PADDING }}
        />
        {/* Left margin handle */}
        <div
          className="absolute w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-500"
          style={{ left: PAGE_PADDING - 5, top: 0 }}
        />
        <div
          className="absolute w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-500"
          style={{ left: PAGE_PADDING - 5, bottom: 0 }}
        />
        {/* Right margin handle */}
        <div
          className="absolute w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-500"
          style={{ right: PAGE_PADDING - 5, top: 0 }}
        />
        <div
          className="absolute w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-500"
          style={{ right: PAGE_PADDING - 5, bottom: 0 }}
        />
        {ticks}
      </div>
    </div>
  )
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

    // Toolbar toggle state (visual only — doesn't alter textarea formatting)
    const [bold, setBold] = useState(false)
    const [italic, setItalic] = useState(false)
    const [underline, setUnderline] = useState(false)
    const [strike, setStrike] = useState(false)
    const [align, setAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left')

    // Recalculate pages when content changes
    useEffect(() => {
      if (hiddenMeasureRef.current) {
        const measuredHeight = hiddenMeasureRef.current.scrollHeight
        const needed = Math.max(1, Math.ceil(measuredHeight / CONTENT_HEIGHT))
        setPages(needed)
      } else {
        setPages(1)
      }
    }, [content])

    // Track current page from scroll position
    useEffect(() => {
      const el = scrollRef.current
      if (!el) return
      const handleScroll = () => {
        const scrollTop = el.scrollTop
        const pageWithGap = PAGE_HEIGHT + PAGE_GAP
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

    const handlePrint = () => window.print()

    const totalTextareaHeight = Math.max(CONTENT_HEIGHT, pages * CONTENT_HEIGHT + (pages - 1) * (PAGE_PADDING * 2 + PAGE_GAP))

    return (
      <div className="flex flex-col h-screen bg-[#f0f4f9] overflow-hidden">

        {/* ── Top Toolbar ───────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 shrink-0">
          {/* Row 1 — App bar */}
          <div className="h-12 flex items-center px-3 sm:px-4 gap-2 sm:gap-3 border-b border-gray-100">
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
                  <span><span className="sm:hidden">Finish</span><span className="hidden sm:inline">Finish &amp; Analyze</span></span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2 — Full formatting toolbar */}
          <div className="h-11 hidden md:flex items-center px-3 gap-0.5 overflow-x-auto">
            {/* History */}
            <TBtn title="Undo (Ctrl+Z)"><Undo2 size={16} /></TBtn>
            <TBtn title="Redo (Ctrl+Y)"><Redo2 size={16} /></TBtn>
            <TSep />

            {/* Print */}
            <TBtn title="Print (Ctrl+P)" onClick={handlePrint}><Printer size={16} /></TBtn>
            <TSep />

            {/* Font */}
            <TDropdown label="Times New Roman" width={140} />
            <TDropdown label="12" width={48} />
            <TSep />

            {/* Text formatting */}
            <TBtn title="Bold (Ctrl+B)" active={bold} onClick={() => setBold(v => !v)}>
              <span className="font-bold text-[14px] leading-none">B</span>
            </TBtn>
            <TBtn title="Italic (Ctrl+I)" active={italic} onClick={() => setItalic(v => !v)}>
              <span className="italic text-[14px] leading-none font-serif">I</span>
            </TBtn>
            <TBtn title="Underline (Ctrl+U)" active={underline} onClick={() => setUnderline(v => !v)}>
              <Underline size={16} />
            </TBtn>
            <TBtn title="Strikethrough" active={strike} onClick={() => setStrike(v => !v)}>
              <Strikethrough size={16} />
            </TBtn>

            {/* Text color / highlight */}
            <TBtn title="Text color">
              <div className="flex flex-col items-center leading-none">
                <span className="text-[12px] font-semibold">A</span>
                <span className="block w-3 h-0.5 bg-red-500 mt-px" />
              </div>
            </TBtn>
            <TBtn title="Highlight"><Highlighter size={16} /></TBtn>
            <TSep />

            {/* Alignment */}
            <TBtn title="Align left" active={align === 'left'} onClick={() => setAlign('left')}>
              <AlignLeft size={16} />
            </TBtn>
            <TBtn title="Align center" active={align === 'center'} onClick={() => setAlign('center')}>
              <AlignCenter size={16} />
            </TBtn>
            <TBtn title="Align right" active={align === 'right'} onClick={() => setAlign('right')}>
              <AlignRight size={16} />
            </TBtn>
            <TBtn title="Justify" active={align === 'justify'} onClick={() => setAlign('justify')}>
              <AlignJustify size={16} />
            </TBtn>
            <TSep />

            {/* Lists */}
            <TBtn title="Bulleted list"><List size={16} /></TBtn>
            <TBtn title="Numbered list"><ListOrdered size={16} /></TBtn>
            <TBtn title="Checklist"><ListChecks size={16} /></TBtn>
            <TSep />

            {/* Indent */}
            <TBtn title="Decrease indent"><IndentDecrease size={16} /></TBtn>
            <TBtn title="Increase indent"><IndentIncrease size={16} /></TBtn>
            <TSep />

            {/* Insert */}
            <TBtn title="Insert link"><LinkIcon size={16} /></TBtn>
            <TBtn title="Insert image"><ImageIcon size={16} /></TBtn>
            <TBtn title="Insert table"><TableIcon size={16} /></TBtn>

            {/* Right side — stats */}
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 shrink-0 pl-2">
              <span className="bg-gray-100 rounded-full px-2.5 py-0.5">{wordCount} words</span>
              <span className="bg-gray-100 rounded-full px-2.5 py-0.5">Keys: {keystrokeCount}</span>
              <span className="bg-gray-100 rounded-full px-2.5 py-0.5">Pauses: {pauseCount}</span>
              <span className="bg-gray-100 rounded-full px-2.5 py-0.5">{formatTime(elapsed)}</span>
            </div>
          </div>
        </header>

        {/* Ruler */}
        <div className="hidden md:block shrink-0">
          <Ruler />
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left sidebar — page navigator */}
          <div className="hidden md:flex w-[56px] bg-[#f0f4f9] flex-col items-center py-4 gap-3 overflow-y-auto shrink-0 border-r border-gray-200">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = scrollRef.current
                  if (el) el.scrollTo({ top: i * (PAGE_HEIGHT + PAGE_GAP), behavior: 'smooth' })
                }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`w-10 h-14 bg-white shadow-sm rounded-sm transition-all ${
                    currentPage === i + 1 ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'
                  }`}
                />
                <span className="text-[10px] text-gray-500">{i + 1}</span>
              </button>
            ))}
          </div>

          {/* Document scroll area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#f0f4f9]" style={{ padding: 24 }}>
            <div className="flex flex-col items-center relative" style={{ gap: PAGE_GAP }}>

              {/* Hidden measurement div */}
              <div
                ref={hiddenMeasureRef}
                aria-hidden="true"
                className="absolute opacity-0 pointer-events-none top-0 left-0"
                style={{
                  width: CONTENT_WIDTH,
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '16px',
                  lineHeight: 1.5,
                  letterSpacing: 'normal',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {content || ' '}
              </div>

              {/* Page shells (visual only — textarea lives on first page) */}
              {Array.from({ length: pages }, (_, i) => (
                <div key={i} className="w-full flex justify-center relative">
                  {i > 0 && (
                    <div
                      className="absolute left-0 right-0 flex items-center justify-center select-none pointer-events-none"
                      style={{ top: -PAGE_GAP / 2 - 6 }}
                    >
                      <div className="flex-1 border-t border-dashed border-gray-400/50" />
                      <span className="text-[10px] text-gray-500 px-2 bg-[#f0f4f9]">Page {i + 1}</span>
                      <div className="flex-1 border-t border-dashed border-gray-400/50" />
                    </div>
                  )}
                  <div
                    className="relative bg-white"
                    style={{
                      width: PAGE_WIDTH,
                      minHeight: PAGE_HEIGHT,
                      padding: PAGE_PADDING,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
                      margin: '0 auto',
                    }}
                  >
                    {i === 0 && (
                      <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={e => onContentChange(e.target.value)}
                        placeholder="Start typing your document here..."
                        spellCheck
                        autoFocus
                        className="block border-none outline-none resize-none bg-transparent"
                        style={{
                          fontFamily: "'Times New Roman', Times, serif",
                          fontSize: '16px',
                          lineHeight: 1.5,
                          color: '#000000',
                          width: '100%',
                          height: totalTextareaHeight,
                          minHeight: CONTENT_HEIGHT,
                          caretColor: '#000',
                          textAlign: align,
                          fontWeight: bold ? 700 : 400,
                          fontStyle: italic ? 'italic' : 'normal',
                          textDecoration: [
                            underline ? 'underline' : '',
                            strike ? 'line-through' : '',
                          ].filter(Boolean).join(' ') || 'none',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Coach Panel ───────────────────────────────────── */}
          <CoachPanel
            content={content}
            wordCount={wordCount}
            sessionDuration={elapsed}
            pauseCount={pauseCount}
          />
        </div>

        {/* ── Status Bar ────────────────────────────────────────── */}
        <div className="bg-white border-t border-gray-200 h-7 flex items-center justify-between px-4 shrink-0 text-xs text-gray-600">
          <span className="hidden sm:inline">
            {isAnalyzing ? (
              <span className="text-indigo-600 animate-pulse">Running 5-layer authenticity engine...</span>
            ) : (
              <>🔒 WriteVault is recording your writing process</>
            )}
          </span>
          <span>{wordCount} words · {charCount} characters</span>
          <span>Page {currentPage} of {pages}</span>
        </div>

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

        <style>{`
          textarea::selection { background: rgba(59,130,246,0.2); }
          textarea::placeholder { color: #9ca3af; }
        `}</style>
      </div>
    )
  }
)

export default DocumentEditor
