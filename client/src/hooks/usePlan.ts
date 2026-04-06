import { useState, useEffect } from 'react'
import { API_BASE } from '../config'

export type PlanName = 'free' | 'student' | 'teacher' | 'institution'

interface PlanState {
  currentPlan: PlanName
  sessionsUsed: number
  sessionsLimit: number | 'unlimited'
  canWrite: boolean
  canExportPDF: boolean
  canShareTeacher: boolean
  canUseDNA: boolean
  isAtLimit: boolean
  upgradeRequired: boolean
  loading: boolean
}

const FREE_SESSION_LIMIT = 3

export function usePlan(): PlanState {
  const [plan, setPlan] = useState<PlanName>('free')
  const [sessionsUsed, setSessionsUsed] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('wv_token')
    if (!token) {
      setLoading(false)
      return
    }

    fetch(`${API_BASE}/payments/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch plan status')
        return res.json()
      })
      .then((data) => {
        setPlan((data.plan as PlanName) || 'free')
        setSessionsUsed(data.sessionsUsed || 0)
      })
      .catch(() => {
        // Not logged in or request failed — assume free
        setPlan('free')
      })
      .finally(() => setLoading(false))
  }, [])

  const isFree = plan === 'free'
  const isPaid = !isFree
  const sessionsLimit = isFree ? FREE_SESSION_LIMIT : 'unlimited'
  const isAtLimit = isFree && sessionsUsed >= FREE_SESSION_LIMIT
  const canWrite = !isAtLimit
  const canExportPDF = isPaid
  const canShareTeacher = isPaid
  const canUseDNA = isPaid
  const upgradeRequired = isAtLimit

  return {
    currentPlan: plan,
    sessionsUsed,
    sessionsLimit,
    canWrite,
    canExportPDF,
    canShareTeacher,
    canUseDNA,
    isAtLimit,
    upgradeRequired,
    loading,
  }
}
