import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { API_BASE as API } from '../config'
const TOKEN_KEY = 'wv_auth_token'

interface User {
  id: string
  email: string
  name: string
  role: string
  sessionCount?: number
  hasDna?: boolean
  referralCode?: string
  referralCount?: number
  bonusSessions?: number
}

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem(TOKEN_KEY))

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token')
        return res.json()
      })
      .then(data => {
        setUser({ id: data.id, email: data.email, name: data.name, role: data.role, sessionCount: data.sessionCount, hasDna: data.hasDna, referralCode: data.referralCode, referralCount: data.referralCount, bonusSessions: data.bonusSessions })
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    const data = await res.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, name: string, role: string) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    const data = await res.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
