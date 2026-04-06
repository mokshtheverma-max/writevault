import { useState, useCallback } from 'react'

const TOKEN_KEY = 'wv_auth_token'
const USAGE_KEY = 'wv_coach_usage'
const FREE_LIMIT = 5

export interface CoachMessage {
  id: string
  type: 'feedback' | 'unstuck' | 'structure' | 'encourage'
  content: string
  questions?: string[]
  suggestions?: string[]
  timestamp: number
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function getUsage(): number {
  return parseInt(localStorage.getItem(USAGE_KEY) || '0', 10)
}

function incrementUsage(): number {
  const next = getUsage() + 1
  localStorage.setItem(USAGE_KEY, String(next))
  return next
}

let msgCounter = 0

export function useCoach(plan: string) {
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [requestsUsed, setRequestsUsed] = useState(getUsage)

  const isPaid = plan !== 'free'
  const requestsLimit = isPaid ? Infinity : FREE_LIMIT
  const canRequest = isPaid || requestsUsed < FREE_LIMIT

  const addMessage = useCallback((msg: Omit<CoachMessage, 'id' | 'timestamp'>) => {
    const message: CoachMessage = {
      ...msg,
      id: `coach-${++msgCounter}`,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev.slice(-4), message])
    return message
  }, [])

  const getFeedback = useCallback(async (content: string, sessionDuration: number, wordCount: number) => {
    if (!canRequest) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/coach/feedback', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, sessionDuration, wordCount }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Coach unavailable' }))
        throw new Error(err.error)
      }
      const data = await res.json()
      addMessage({ type: 'feedback', content: data.feedback })
      setRequestsUsed(incrementUsage())
    } catch (err: any) {
      addMessage({ type: 'feedback', content: `Could not get feedback: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }, [canRequest, addMessage])

  const getUnstuck = useCallback(async (content: string, lastSentence: string) => {
    if (!canRequest) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/coach/unstuck', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, lastSentence }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Coach unavailable' }))
        throw new Error(err.error)
      }
      const data = await res.json()
      addMessage({ type: 'unstuck', content: 'Try asking yourself:', questions: data.questions })
    } catch (err: any) {
      addMessage({ type: 'unstuck', content: `Could not help: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }, [canRequest, addMessage])

  const checkStructure = useCallback(async (content: string, assignmentType?: string) => {
    if (!canRequest) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/coach/structure', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, assignmentType }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Coach unavailable' }))
        throw new Error(err.error)
      }
      const data = await res.json()
      addMessage({ type: 'structure', content: data.feedback, suggestions: data.suggestions })
    } catch (err: any) {
      addMessage({ type: 'structure', content: `Could not analyze structure: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }, [canRequest, addMessage])

  const getEncouragement = useCallback(async (wordCount: number, timeSpent: number, pauseCount: number) => {
    if (!canRequest) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/coach/encourage', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ wordCount, timeSpent, pauseCount }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Coach unavailable' }))
        throw new Error(err.error)
      }
      const data = await res.json()
      addMessage({ type: 'encourage', content: data.message })
    } catch (err: any) {
      addMessage({ type: 'encourage', content: `Coach unavailable: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }, [canRequest, addMessage])

  return {
    messages,
    isLoading,
    requestsUsed,
    requestsLimit,
    canRequest,
    getFeedback,
    getUnstuck,
    checkStructure,
    getEncouragement,
  }
}
