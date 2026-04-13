import { Link, useLocation } from 'react-router-dom'
import { House, PenLine, History, User } from 'lucide-react'

const TABS = [
  { to: '/', icon: House, label: 'Home' },
  { to: '/editor', icon: PenLine, label: 'Write' },
  { to: '/sessions', icon: History, label: 'Sessions' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomTabBar() {
  const location = useLocation()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border safe-bottom"
      style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px))` }}
    >
      <div className="flex items-stretch justify-around" style={{ height: 56 }}>
        {TABS.map(({ to, icon: Icon, label }) => {
          const active =
            to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
