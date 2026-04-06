import { API_BASE } from '../config'

export const Events = {
  LANDING_VIEWED: 'landing_viewed',
  WAITLIST_JOINED: 'waitlist_joined',
  ACCOUNT_CREATED: 'account_created',
  SESSION_STARTED: 'session_started',
  SESSION_COMPLETED: 'session_completed',
  REPORT_GENERATED: 'report_generated',
  TEACHER_SHARE_CLICKED: 'teacher_share_clicked',
  UPGRADE_CLICKED: 'upgrade_clicked',
  PRICING_VIEWED: 'pricing_viewed',
} as const

export function track(event: string, props?: Record<string, string | number>) {
  if (import.meta.env.DEV) {
    console.log('[Analytics]', event, props)
    return
  }

  fetch(`${API_BASE}/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, props, timestamp: Date.now() }),
  }).catch(() => {}) // Silent fail — analytics should never break the app
}
