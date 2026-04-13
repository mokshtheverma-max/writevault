import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect } from 'react'
import { track, Events } from '../utils/analytics'

const FEATURES = [
  'Unlimited sessions',
  'Writing DNA',
  'PDF Certificates',
  'Share With Teacher',
]

export default function PaymentSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    track(Events.UPGRADE_CLICKED, { stage: 'success' })
  }, [])

  return (
    <div className="min-h-screen bg-base text-text-primary flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-success/15 border-2 border-success flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          >
            <Check className="w-12 h-12 text-success" strokeWidth={3} />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-3xl font-bold mb-3"
        >
          You're now a WriteVault Student! 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-text-secondary mb-8"
        >
          Your account has been upgraded.
        </motion.p>

        <motion.ul
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-surface border border-border rounded-2xl p-6 mb-8 space-y-3 text-left"
        >
          {FEATURES.map((f, i) => (
            <motion.li
              key={f}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.08 }}
              className="flex items-center gap-3 text-sm text-text-primary"
            >
              <Check className="w-4 h-4 text-success shrink-0" />
              <span>{f}</span>
              <span className="ml-auto text-success text-xs">✓</span>
            </motion.li>
          ))}
        </motion.ul>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          onClick={() => navigate('/editor')}
          className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3.5 rounded-xl transition-colors hover:shadow-glow-sm"
        >
          Start Writing →
        </motion.button>
      </div>
    </div>
  )
}
