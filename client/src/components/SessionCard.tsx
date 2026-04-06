import { useNavigate } from 'react-router-dom'
import type { WritingSession } from '../types'

interface SessionCardProps {
  session: WritingSession
}

export default function SessionCard({ session }: SessionCardProps) {
  const navigate = useNavigate()
  const duration = Math.round((session.endTime - session.startTime) / 60000)
  const wordCount = session.content.trim().split(/\s+/).filter(Boolean).length

  const scoreColor =
    session.humanScore >= 75
      ? 'text-green-400'
      : session.humanScore >= 50
      ? 'text-yellow-400'
      : 'text-red-400'

  return (
    <div
      onClick={() => navigate(`/dashboard/${session.id}`)}
      className="bg-elevated border border-border rounded-xl p-5 cursor-pointer hover:border-border-light transition-all hover-lift"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-text-primary font-medium truncate flex-1 mr-4">
          {session.title || 'Untitled'}
        </h3>
        <span className={`text-2xl font-bold ${scoreColor}`}>
          {session.humanScore}
        </span>
      </div>
      <div className="flex gap-4 text-text-muted text-sm">
        <span>{wordCount} words</span>
        <span>{duration} min</span>
        <span>{new Date(session.startTime).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
