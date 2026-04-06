import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1
          className="text-8xl font-black mb-4"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </h1>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Page not found</h2>
        <p className="text-text-secondary mb-8">
          The page you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-xl transition-all hover:shadow-glow-sm text-sm"
        >
          Go Home →
        </button>
      </div>
    </div>
  )
}
