import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      navigate('/auth?error=google', { replace: true })
      return
    }
    loginWithToken(token)
    navigate('/', { replace: true })
  }, [searchParams, loginWithToken, navigate])

  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="flex items-center gap-3 text-text-secondary">
        <Loader2 size={20} className="animate-spin text-primary" />
        <span>Signing you in…</span>
      </div>
    </div>
  )
}
