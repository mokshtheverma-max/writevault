import { useState, useEffect } from 'react'
import { X, Copy, Check, ExternalLink, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { track, Events } from '../utils/analytics'
import type { WritingSession } from '../types'
import { generateTeacherPDF } from '../utils/reportGenerator'

interface Props {
  session: WritingSession
  hash: string
  onClose: () => void
}

const BASE_URL = 'https://writevault.app'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDuration(startMs: number, endMs: number): string {
  const mins = Math.round((endMs - startMs) / 60000)
  return `${mins} minutes`
}

export default function ShareModal({ session, hash, onClose }: Props) {
  useEffect(() => { track(Events.TEACHER_SHARE_CLICKED) }, [])
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [emailGenerated, setEmailGenerated] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const verificationLink = `${BASE_URL}/verify/teacher?hash=${encodeURIComponent(hash)}`

  const emailSubject = `WriteVault Writing Verification — ${session.title}`

  const emailBody = `Dear ${teacherName || '[Teacher Name]'},

I am writing to provide verification for my essay "${session.title}", submitted on ${formatDate(session.startTime)}.

I used WriteVault to record my writing process, which creates a cryptographic record of every keystroke, pause, and revision during my writing session.

You can independently verify my session here:
${verificationLink}

This link goes directly to WriteVault's educator portal, where you can view my writing timeline, behavioral analysis, and authenticity score. The data is retrieved from WriteVault's servers and cannot be modified by me.

My session details:
• Document: ${session.title}
• Date written: ${formatDate(session.startTime)}
• Writing duration: ${formatDuration(session.startTime, session.endTime)}
• Human Writing Score: ${session.humanScore}/100
• Session ID: ${session.id}

Please let me know if you have any questions about the verification process.

Sincerely,
${studentName || '[Your Name]'}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(verificationLink)
      setCopiedLink(true)
      toast.success('Link copied!')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      toast.error('Copy failed')
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(emailBody)
      setCopiedEmail(true)
      toast.success('Email copied!')
      setTimeout(() => setCopiedEmail(false), 2000)
    } catch {
      toast.error('Copy failed')
    }
  }

  function openMailApp() {
    const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailto, '_blank')
  }

  async function downloadTeacherPDF() {
    setPdfLoading(true)
    try {
      await generateTeacherPDF(session, hash)
      toast.success('Teacher report downloaded!')
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">Share With Your Teacher</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-7 leading-relaxed">
          Send your teacher a link to independently verify your writing session. They can view it
          directly from WriteVault's servers — no way to modify it.
        </p>

        {/* Step 1 — Copy Link */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Step 1 — Verification Link
          </p>
          <p className="text-xs text-gray-500 mb-2">Send this to your teacher</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={verificationLink}
              className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-700 outline-none"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Your teacher can paste this link in their browser to view your verified writing session independently.
          </p>
        </div>

        {/* Step 2 — Generate Email */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Step 2 — Ready-to-Send Email
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Your name</label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Teacher's name</label>
              <input
                type="text"
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                placeholder="Teacher's name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={() => setEmailGenerated(true)}
            className="w-full border border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-3"
          >
            Generate Email
          </button>

          {emailGenerated && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Subject: {emailSubject}</p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {emailBody}
              </pre>
            </div>
          )}

          {emailGenerated && (
            <div className="flex gap-2">
              <button
                onClick={copyEmail}
                className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copiedEmail ? 'Copied!' : 'Copy Email'}
              </button>
              <button
                onClick={openMailApp}
                className="flex-1 flex items-center justify-center gap-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Mail App
              </button>
            </div>
          )}
        </div>

        {/* Step 3 — Download PDF */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Step 3 — Download Teacher Report
          </p>
          <p className="text-xs text-gray-500 mb-3">Or download a PDF formatted for educators</p>
          <button
            onClick={downloadTeacherPDF}
            disabled={pdfLoading}
            className="w-full flex items-center justify-center gap-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {pdfLoading ? 'Generating…' : 'Download Teacher Report PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
