import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'WriteVault — Page Not Found'
  }, [])

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6 relative overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.32, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.18, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="text-center max-w-md relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[140px] leading-none font-black mb-4 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-text-primary mb-3"
        >
          This page doesn't exist
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-text-secondary mb-8"
        >
          The link may be broken, or the page was moved.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-xl transition-all hover:shadow-glow text-sm"
        >
          Go Home →
        </motion.button>
      </div>
    </div>
  )
}
