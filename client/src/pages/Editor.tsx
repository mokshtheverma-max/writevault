import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import type { KeystrokeEvent } from '../types'
import { useKeystrokeCapture } from '../hooks/useKeystrokeCapture'
import { calculateMetadata } from '../utils/scoring'
import { generateSessionHash } from '../utils/crypto'
import { saveSession } from '../utils/sessionStorage'
import { computeAuthenticityScore } from '../engine/scorer'
import DNAManager from '../dna'
import DocumentEditor from '../components/DocumentEditor'
import { track, Events } from '../utils/analytics'
import { checkMilestones } from '../components/MilestoneToast'
import { listSessions } from '../utils/sessionStorage'

const AUTOSAVE_INTERVAL = 30_000
const AUTOSAVE_KEY = 'writevault_autosave'

interface AutoSave {
  title: string
  content: string
  events: KeystrokeEvent[]
  startTime: number
  savedAt: number
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function Editor() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [events, setEvents] = useState<KeystrokeEvent[]>([])
  const [sessionTitle, setSessionTitle] = useState('Untitled Essay')
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryData, setRecoveryData] = useState<AutoSave | null>(null)

  const sessionStart  = useRef<number>(0)
  const editorRef     = useRef<HTMLDivElement>(null)
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const cleanupRef    = useRef<(() => void) | null>(null)
  const eventsRef     = useRef<KeystrokeEvent[]>([])

  const wordCount      = content.trim().split(/\s+/).filter(Boolean).length
  const charCount      = content.length
  const keystrokeCount = events.filter(e => e.type === 'keydown').length
  const pauseCount     = events.filter(e => e.type === 'pause').length
  const pasteCount     = events.filter(e => e.type === 'paste_attempt').length

  useEffect(() => { eventsRef.current = events }, [events])

  const handleEvent = useCallback((event: KeystrokeEvent) => {
    setEvents(prev => [...prev, event])
  }, [])

  const { attach } = useKeystrokeCapture({ onEvent: handleEvent })

  useEffect(() => {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    if (raw) {
      try {
        const data = JSON.parse(raw) as AutoSave
        const ageMin = (Date.now() - data.savedAt) / 60_000
        if (ageMin < 60 && data.content.trim().length > 20) {
          setRecoveryData(data)
          setShowRecovery(true)
          return
        }
      } catch { /* ignore */ }
    }
    startSession()
    track(Events.SESSION_STARTED)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function startSession(restore?: AutoSave) {
    sessionStart.current = restore?.startTime ?? performance.now()
    if (restore) {
      setSessionTitle(restore.title)
      setContent(restore.content)
      setEvents(restore.events)
      eventsRef.current = restore.events
    }
    setIsRecording(true)
    timerRef.current = setInterval(() => {
      setElapsed(performance.now() - sessionStart.current)
    }, 1000)
  }

  useEffect(() => {
    if (!isRecording) return
    const el = editorRef.current
    if (!el) return
    const cleanup = attach(el)
    if (cleanup) cleanupRef.current = cleanup
    return () => { if (cleanupRef.current) cleanupRef.current() }
  }, [isRecording, attach])

  useEffect(() => {
    if (!isRecording) return
    const id = setInterval(() => {
      const data: AutoSave = {
        title: sessionTitle,
        content,
        events: eventsRef.current,
        startTime: sessionStart.current,
        savedAt: Date.now(),
      }
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
      toast.success('Auto-saved', { duration: 1500, icon: '\u{1F4BE}', id: 'autosave' })
    }, AUTOSAVE_INTERVAL)
    return () => clearInterval(id)
  }, [isRecording, sessionTitle, content])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && wordCount >= 5 && !isAnalyzing) handleFinish()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [wordCount, isAnalyzing]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinish = useCallback(() => {
    void (async () => {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsRecording(false)
      setIsAnalyzing(true)
      localStorage.removeItem(AUTOSAVE_KEY)

      try {
        const endTime   = performance.now()
        const sessionId = uuidv4()
        const metadata  = calculateMetadata(events, content, sessionStart.current, endTime)

        const engineEvents = events
          .filter(e => e.type === 'keydown' || e.type === 'keyup')
          .map(e => ({
            type:      e.type as 'keydown' | 'keyup',
            key:       e.key ?? '',
            timestamp: e.timestamp,
            position:  e.position,
          }))

        const report     = await computeAuthenticityScore(engineEvents, content, sessionId)
        const humanScore = Math.max(0, Math.min(100, report.compositeScore - pasteCount * 20))
        const hash       = generateSessionHash(content, events, sessionStart.current)

        saveSession({ id: sessionId, title: sessionTitle, content, events, startTime: sessionStart.current, endTime, humanScore, metadata })
        localStorage.setItem(`wv_hash_${sessionId}`, hash)
        localStorage.setItem(`wv_report_${sessionId}`, JSON.stringify(report))

        const dnaComparison = DNAManager.compareSession(events, content)
        DNAManager.updateFromSession(events, content)
        localStorage.setItem(`wv_dna_comparison_${sessionId}`, JSON.stringify(dnaComparison))

        track(Events.SESSION_COMPLETED, { humanScore, wordCount: metadata.totalPauses })

        // Check milestones after session completes
        const allSessions = listSessions()
        setTimeout(() => {
          checkMilestones({
            sessionCount: allSessions.length,
            humanScore,
          })
        }, 500)

        navigate(`/dashboard/${sessionId}`)
      } catch (err) {
        console.error('Authenticity analysis failed:', err)
        toast.error('Analysis failed. Please try again.')
        setIsAnalyzing(false)
        setIsRecording(true)
        timerRef.current = setInterval(() => setElapsed(performance.now() - sessionStart.current), 1000)
      }
    })()
  }, [content, events, navigate, pasteCount, sessionTitle])

  // ── Recovery dialog ──────────────────────────────────────────────────────────
  if (showRecovery && recoveryData) {
    const ageMin = Math.round((Date.now() - recoveryData.savedAt) / 60_000)
    const recoveryWords = recoveryData.content.trim().split(/\s+/).filter(Boolean).length
    return (
      <div className="min-h-screen bg-[#f0f4f9] flex items-center justify-center px-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
            <span className="text-amber-500 text-lg">&crarr;</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unsaved Session Found</h2>
          <p className="text-gray-600 text-sm mb-1">
            &ldquo;{recoveryData.title}&rdquo; &mdash; {recoveryWords} words
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Last saved {ageMin} minute{ageMin !== 1 ? 's' : ''} ago
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowRecovery(false); startSession(recoveryData); toast.success('Session restored') }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Resume Session
            </button>
            <button
              onClick={() => { localStorage.removeItem(AUTOSAVE_KEY); setShowRecovery(false); startSession() }}
              className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main editor ──────────────────────────────────────────────────────────────
  return (
    <DocumentEditor
      content={content}
      onContentChange={setContent}
      sessionTitle={sessionTitle}
      onTitleChange={setSessionTitle}
      isRecording={isRecording}
      isAnalyzing={isAnalyzing}
      wordCount={wordCount}
      charCount={charCount}
      keystrokeCount={keystrokeCount}
      pauseCount={pauseCount}
      pasteCount={pasteCount}
      elapsed={elapsed}
      onFinish={handleFinish}
      canFinish={wordCount >= 5}
      editorRef={editorRef}
      formatTime={formatTime}
    />
  )
}
