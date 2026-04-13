import { useState, useRef, useEffect, forwardRef, useCallback } from 'react'
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
  CheckCircle,
  MoreHorizontal,
} from 'lucide-react'
import CoachPanel from './CoachPanel'

/* ── Constants ────────────────────────────────────────────────────────── */
const PAGE_WIDTH = 816
const PAGE_HEIGHT = 1056
const PAGE_PADDING = 96
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2
const CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING * 2
const PAGE_GAP = 16

const FONTS = [
  'Times New Roman',
  'Arial',
  'Helvetica',
  'Georgia',
  'Verdana',
  'Courier New',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Palatino',
]

const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

const SIZE_MAP: Record<number, string> = {
  8: '1', 9: '2', 10: '3', 11: '3', 12: '4', 14: '5',
  16: '5', 18: '6', 20: '6', 24: '7', 28: '7', 32: '7',
  36: '7', 48: '7', 72: '7',
}

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
  editorRef: React.RefObject<HTMLDivElement | null>
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
  onMouseDown,
  title,
  children,
}: {
  active?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown ?? (e => e.preventDefault())}
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

/* ── Ruler ────────────────────────────────────────────────────────────── */
function Ruler() {
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
        <div className="absolute top-0 bottom-0 bg-[#dce3ec]" style={{ left: 0, width: PAGE_PADDING }} />
        <div className="absolute top-0 bottom-0 bg-[#dce3ec]" style={{ right: 0, width: PAGE_PADDING }} />
        {ticks}
      </div>
    </div>
  )
}

/* ── Table Picker ─────────────────────────────────────────────────────── */
function TablePicker({ onPick, onClose }: { onPick: (rows: number, cols: number) => void; onClose: () => void }) {
  const [hover, setHover] = useState<{ r: number; c: number }>({ r: 0, c: 0 })
  const MAX = 6
  return (
    <div
      className="absolute top-full mt-1 right-0 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
      onMouseDown={e => e.preventDefault()}
    >
      <div className="text-xs text-gray-600 mb-1 text-center">
        {hover.r > 0 ? `${hover.r} x ${hover.c}` : 'Select size'}
      </div>
      <div className="grid grid-cols-6 gap-0.5">
        {Array.from({ length: MAX * MAX }, (_, i) => {
          const r = Math.floor(i / MAX) + 1
          const c = (i % MAX) + 1
          const active = r <= hover.r && c <= hover.c
          return (
            <div
              key={i}
              className={`w-4 h-4 border ${active ? 'bg-indigo-400 border-indigo-500' : 'bg-white border-gray-300'} cursor-pointer`}
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => { onPick(r, c); onClose() }}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────────────── */
const DocumentEditor = forwardRef<HTMLDivElement, DocumentEditorProps>(
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
      editorRef,
      formatTime,
    } = props

    const [showFinishModal, setShowFinishModal] = useState(false)
    const [showTablePicker, setShowTablePicker] = useState(false)
    const [showMobileMore, setShowMobileMore] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [pages, setPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)
    const savedSelection = useRef<Range | null>(null)

    // Formatting state
    const [currentFont, setCurrentFont] = useState('Times New Roman')
    const [currentSize, setCurrentSize] = useState(12)
    const [currentLineHeight, setCurrentLineHeight] = useState('1.5')
    const [isBold, setIsBold] = useState(false)
    const [isItalic, setIsItalic] = useState(false)
    const [isUnderline, setIsUnderline] = useState(false)
    const [isStrike, setIsStrike] = useState(false)
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left')

    // Color picker refs
    const colorInputRef = useRef<HTMLInputElement>(null)
    const highlightInputRef = useRef<HTMLInputElement>(null)

    /* ── Initialize editor with content once ──────────────────────── */
    useEffect(() => {
      if (editorRef.current && !editorRef.current.innerHTML && content) {
        editorRef.current.innerText = content
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /* ── Execute formatting command safely ────────────────────────── */
    const exec = useCallback((cmd: string, value?: string) => {
      editorRef.current?.focus()
      document.execCommand(cmd, false, value)
      // Sync content after command
      if (editorRef.current) {
        onContentChange(editorRef.current.innerText || '')
      }
    }, [editorRef, onContentChange])

    /* ── Input handler ────────────────────────────────────────────── */
    const handleInput = useCallback(() => {
      const text = editorRef.current?.innerText || ''
      onContentChange(text)
    }, [editorRef, onContentChange])

    /* ── Page count ───────────────────────────────────────────────── */
    useEffect(() => {
      // Approximate: ~2800 chars per page at 12pt TNR 1.5 line height
      const CHARS_PER_PAGE = 2800
      const needed = Math.max(1, Math.ceil((content.length || 1) / CHARS_PER_PAGE))
      setPages(needed)
    }, [content])

    /* ── Track current page from scroll ───────────────────────────── */
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

    /* ── Format detection on selection change ─────────────────────── */
    useEffect(() => {
      const handler = () => {
        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const node = sel.anchorNode
        if (!node || !editorRef.current?.contains(node)) return
        try {
          setIsBold(document.queryCommandState('bold'))
          setIsItalic(document.queryCommandState('italic'))
          setIsUnderline(document.queryCommandState('underline'))
          setIsStrike(document.queryCommandState('strikeThrough'))
          if (document.queryCommandState('justifyCenter')) setAlignment('center')
          else if (document.queryCommandState('justifyRight')) setAlignment('right')
          else if (document.queryCommandState('justifyFull')) setAlignment('justify')
          else setAlignment('left')
        } catch { /* ignore */ }
      }
      document.addEventListener('selectionchange', handler)
      return () => document.removeEventListener('selectionchange', handler)
    }, [editorRef])

    /* ── Keyboard shortcuts ───────────────────────────────────────── */
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'b') { e.preventDefault(); exec('bold') }
      else if (k === 'i') { e.preventDefault(); exec('italic') }
      else if (k === 'u') { e.preventDefault(); exec('underline') }
      else if (k === 'z') { e.preventDefault(); exec('undo') }
      else if (k === 'y') { e.preventDefault(); exec('redo') }
      else if (k === 'p') { e.preventDefault(); window.print() }
    }, [exec])

    /* ── Save/restore selection (for color pickers) ───────────────── */
    const saveSelection = () => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) savedSelection.current = sel.getRangeAt(0).cloneRange()
    }
    const restoreSelection = () => {
      const sel = window.getSelection()
      if (sel && savedSelection.current) {
        sel.removeAllRanges()
        sel.addRange(savedSelection.current)
      }
    }

    /* ── Link / Table insertion ───────────────────────────────────── */
    const handleInsertLink = () => {
      const url = window.prompt('Enter URL:')
      if (url) exec('createLink', url)
    }

    const handleInsertTable = (rows: number, cols: number) => {
      let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0;">'
      for (let r = 0; r < rows; r++) {
        html += '<tr>'
        for (let c = 0; c < cols; c++) {
          html += '<td style="border:1px solid #999;padding:6px;min-width:40px;">&nbsp;</td>'
        }
        html += '</tr>'
      }
      html += '</table><p><br></p>'
      exec('insertHTML', html)
    }

    const handleInsertImage = () => {
      const url = window.prompt('Enter image URL:')
      if (url) exec('insertImage', url)
    }

    const handleFinishClick = () => {
      if (!canFinish) return
      setShowFinishModal(true)
    }

    const handlePrint = () => window.print()

    const totalEditorHeight = Math.max(
      CONTENT_HEIGHT,
      pages * CONTENT_HEIGHT + (pages - 1) * (PAGE_PADDING * 2 + PAGE_GAP),
    )

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

          {/* Row 2 — Mobile toolbar (essential controls only) */}
          <div className="md:hidden flex items-center px-2 gap-1 h-11 overflow-x-auto relative">
            <TBtn title="Undo" onClick={() => exec('undo')}><Undo2 size={18} /></TBtn>
            <TBtn title="Bold" active={isBold} onClick={() => exec('bold')}>
              <span className="font-bold text-base leading-none">B</span>
            </TBtn>
            <TBtn title="Italic" active={isItalic} onClick={() => exec('italic')}>
              <span className="italic text-base leading-none font-serif">I</span>
            </TBtn>
            <select
              value={currentSize}
              onMouseDown={saveSelection}
              onChange={e => {
                const size = Number(e.target.value)
                setCurrentSize(size)
                restoreSelection()
                exec('fontSize', SIZE_MAP[size] || '4')
              }}
              className="border border-gray-300 rounded px-1 text-sm bg-white text-gray-700 cursor-pointer h-9 w-14"
            >
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <TBtn
              title="Align"
              onClick={() => {
                const next =
                  alignment === 'left' ? 'center' :
                  alignment === 'center' ? 'right' :
                  alignment === 'right' ? 'justify' : 'left'
                const cmd =
                  next === 'left' ? 'justifyLeft' :
                  next === 'center' ? 'justifyCenter' :
                  next === 'right' ? 'justifyRight' : 'justifyFull'
                exec(cmd)
                setAlignment(next)
              }}
            >
              {alignment === 'center' ? <AlignCenter size={18} /> :
               alignment === 'right' ? <AlignRight size={18} /> :
               alignment === 'justify' ? <AlignJustify size={18} /> :
               <AlignLeft size={18} />}
            </TBtn>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500 tabular-nums">{wordCount}w</span>
              <div className="relative">
                <TBtn title="More" onClick={() => setShowMobileMore(v => !v)}>
                  <MoreHorizontal size={18} />
                </TBtn>
                {showMobileMore && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMobileMore(false)} />
                    <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-1 grid grid-cols-4 gap-1 min-w-[200px]">
                      <TBtn title="Redo" onClick={() => { exec('redo'); setShowMobileMore(false) }}><Redo2 size={16} /></TBtn>
                      <TBtn title="Underline" active={isUnderline} onClick={() => exec('underline')}><Underline size={16} /></TBtn>
                      <TBtn title="Strike" active={isStrike} onClick={() => exec('strikeThrough')}><Strikethrough size={16} /></TBtn>
                      <TBtn title="Bullet list" onClick={() => exec('insertUnorderedList')}><List size={16} /></TBtn>
                      <TBtn title="Number list" onClick={() => exec('insertOrderedList')}><ListOrdered size={16} /></TBtn>
                      <TBtn title="Indent +" onClick={() => exec('indent')}><IndentIncrease size={16} /></TBtn>
                      <TBtn title="Indent -" onClick={() => exec('outdent')}><IndentDecrease size={16} /></TBtn>
                      <TBtn title="Link" onClick={() => { handleInsertLink(); setShowMobileMore(false) }}><LinkIcon size={16} /></TBtn>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Row 2 — Full formatting toolbar (desktop) */}
          <div className="h-11 hidden md:flex items-center px-3 gap-0.5 overflow-x-auto relative">
            {/* History */}
            <TBtn title="Undo (Ctrl+Z)" onClick={() => exec('undo')}><Undo2 size={16} /></TBtn>
            <TBtn title="Redo (Ctrl+Y)" onClick={() => exec('redo')}><Redo2 size={16} /></TBtn>
            <TSep />

            {/* Print */}
            <TBtn title="Print (Ctrl+P)" onClick={handlePrint}><Printer size={16} /></TBtn>
            <TSep />

            {/* Font family */}
            <select
              value={currentFont}
              onMouseDown={saveSelection}
              onChange={e => {
                const f = e.target.value
                setCurrentFont(f)
                restoreSelection()
                exec('fontName', f)
              }}
              style={{ fontFamily: currentFont }}
              className="border border-gray-300 rounded px-2 py-0.5 text-sm bg-white text-gray-700 cursor-pointer hover:bg-gray-50 w-36 mr-1"
            >
              {FONTS.map(f => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>

            {/* Font size */}
            <select
              value={currentSize}
              onMouseDown={saveSelection}
              onChange={e => {
                const size = Number(e.target.value)
                setCurrentSize(size)
                restoreSelection()
                exec('fontSize', SIZE_MAP[size] || '4')
              }}
              className="border border-gray-300 rounded px-1 py-0.5 text-sm bg-white text-gray-700 cursor-pointer w-14 mr-1"
            >
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <TSep />

            {/* Text formatting */}
            <TBtn title="Bold (Ctrl+B)" active={isBold} onClick={() => exec('bold')}>
              <span className="font-bold text-[14px] leading-none">B</span>
            </TBtn>
            <TBtn title="Italic (Ctrl+I)" active={isItalic} onClick={() => exec('italic')}>
              <span className="italic text-[14px] leading-none font-serif">I</span>
            </TBtn>
            <TBtn title="Underline (Ctrl+U)" active={isUnderline} onClick={() => exec('underline')}>
              <Underline size={16} />
            </TBtn>
            <TBtn title="Strikethrough" active={isStrike} onClick={() => exec('strikeThrough')}>
              <Strikethrough size={16} />
            </TBtn>

            {/* Text color / highlight */}
            <TBtn title="Text color" onClick={() => { saveSelection(); colorInputRef.current?.click() }}>
              <div className="flex flex-col items-center leading-none">
                <span className="text-[12px] font-semibold">A</span>
                <span className="block w-3 h-0.5 bg-red-500 mt-px" />
              </div>
            </TBtn>
            <input
              ref={colorInputRef}
              type="color"
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
              onChange={e => { restoreSelection(); exec('foreColor', e.target.value) }}
            />
            <TBtn title="Highlight" onClick={() => { saveSelection(); highlightInputRef.current?.click() }}>
              <Highlighter size={16} />
            </TBtn>
            <input
              ref={highlightInputRef}
              type="color"
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
              onChange={e => { restoreSelection(); exec('hiliteColor', e.target.value) }}
            />
            <TSep />

            {/* Alignment */}
            <TBtn title="Align left" active={alignment === 'left'} onClick={() => { exec('justifyLeft'); setAlignment('left') }}>
              <AlignLeft size={16} />
            </TBtn>
            <TBtn title="Align center" active={alignment === 'center'} onClick={() => { exec('justifyCenter'); setAlignment('center') }}>
              <AlignCenter size={16} />
            </TBtn>
            <TBtn title="Align right" active={alignment === 'right'} onClick={() => { exec('justifyRight'); setAlignment('right') }}>
              <AlignRight size={16} />
            </TBtn>
            <TBtn title="Justify" active={alignment === 'justify'} onClick={() => { exec('justifyFull'); setAlignment('justify') }}>
              <AlignJustify size={16} />
            </TBtn>
            <TSep />

            {/* Line spacing */}
            <select
              value={currentLineHeight}
              onChange={e => setCurrentLineHeight(e.target.value)}
              title="Line spacing"
              className="border border-gray-300 rounded px-1 py-0.5 text-sm bg-white text-gray-700 cursor-pointer w-16 mr-1"
            >
              <option value="1.0">1.0</option>
              <option value="1.15">1.15</option>
              <option value="1.5">1.5</option>
              <option value="2.0">2.0</option>
            </select>
            <TSep />

            {/* Lists */}
            <TBtn title="Bulleted list" onClick={() => exec('insertUnorderedList')}><List size={16} /></TBtn>
            <TBtn title="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered size={16} /></TBtn>
            <TBtn title="Checklist" onClick={() => exec('insertHTML', '<ul style="list-style:none;padding-left:20px;"><li>\u2610 </li></ul>')}>
              <ListChecks size={16} />
            </TBtn>
            <TSep />

            {/* Indent */}
            <TBtn title="Decrease indent" onClick={() => exec('outdent')}><IndentDecrease size={16} /></TBtn>
            <TBtn title="Increase indent" onClick={() => exec('indent')}><IndentIncrease size={16} /></TBtn>
            <TSep />

            {/* Insert */}
            <TBtn title="Insert link" onClick={handleInsertLink}><LinkIcon size={16} /></TBtn>
            <TBtn title="Insert image" onClick={handleInsertImage}><ImageIcon size={16} /></TBtn>
            <div className="relative">
              <TBtn title="Insert table" onClick={() => setShowTablePicker(v => !v)}><TableIcon size={16} /></TBtn>
              {showTablePicker && (
                <TablePicker
                  onPick={(r, c) => handleInsertTable(r, c)}
                  onClose={() => setShowTablePicker(false)}
                />
              )}
            </div>

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
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#f0f4f9] wv-scroll scroll-container">
            <div className="flex flex-col items-center relative" style={{ gap: PAGE_GAP }}>

              {/* Page shells */}
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
                    className="relative bg-white wv-page"
                    style={{
                      width: PAGE_WIDTH,
                      minHeight: PAGE_HEIGHT,
                      padding: PAGE_PADDING,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
                      margin: '0 auto',
                    }}
                  >
                    {i === 0 && (
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        spellCheck
                        autoFocus
                        data-placeholder="Start typing your essay here..."
                        className="wv-editor"
                        style={{
                          fontFamily: currentFont,
                          fontSize: `${currentSize}pt`,
                          lineHeight: currentLineHeight,
                          width: CONTENT_WIDTH,
                          minHeight: CONTENT_HEIGHT,
                          height: totalEditorHeight,
                          outline: 'none',
                          color: '#000',
                          caretColor: '#000',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: '100%',
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
        <div className="bg-white border-t border-gray-200 h-7 flex items-center justify-between px-3 sm:px-4 shrink-0 text-[11px] sm:text-xs text-gray-600">
          <span className="hidden md:inline">
            {isAnalyzing ? (
              <span className="text-indigo-600 animate-pulse">Running 5-layer authenticity engine...</span>
            ) : (
              <>🔒 WriteVault is recording your writing process</>
            )}
          </span>
          <span className="hidden sm:inline">{wordCount} words · {charCount} characters</span>
          <span className="sm:hidden">{wordCount}w</span>
          <span>Page {currentPage}/{pages}</span>
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
          .wv-editor:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          .wv-editor::selection { background: rgba(59,130,246,0.2); }
          .wv-editor a { color: #2563eb; text-decoration: underline; }
          .wv-editor ul, .wv-editor ol { padding-left: 40px; margin: 8px 0; }
          .wv-editor ul { list-style: disc; }
          .wv-editor ol { list-style: decimal; }
          .wv-editor table { border-collapse: collapse; }
          .wv-editor table td { border: 1px solid #999; padding: 6px; }
          .wv-scroll { padding: 24px; }
          @media (max-width: 768px) {
            .wv-scroll { padding: 8px 0; }
            .wv-page {
              width: 100% !important;
              padding: 16px !important;
              min-height: auto !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            .wv-editor {
              width: 100% !important;
              min-height: 60vh !important;
              height: auto !important;
              font-size: 16px !important;
            }
          }
        `}</style>
      </div>
    )
  }
)

export default DocumentEditor
