import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'For Educators', href: '/verify/teacher' },
  { label: 'How It Works', href: '/methodology' },
  { label: 'Pricing', href: '/pricing' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function go(href: string) {
    setOpen(false)
    navigate(href)
  }

  return (
    <>
      {/* Hamburger button — visible on mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-[70] w-72 bg-surface border-r border-border flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-bold text-lg tracking-tight text-text-primary">WriteVault</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Links */}
              <nav className="flex-1 px-4 py-6 space-y-1">
                {NAV_LINKS.map(link => (
                  <button
                    key={link.href}
                    onClick={() => go(link.href)}
                    className="w-full text-left px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-elevated text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              {/* CTA */}
              <div className="px-4 pb-6 safe-bottom">
                <button
                  onClick={() => go('/editor')}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Start Writing Free
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
