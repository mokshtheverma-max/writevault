import { useLocation, Navigate } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import type { ReactNode } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import LoadingScreen from './components/LoadingScreen'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import Verify from './pages/Verify'
import TeacherVerify from './pages/TeacherVerify'
import Methodology from './pages/Methodology'
import Auth from './pages/Auth'
import Waitlist from './pages/Waitlist'
import Pricing from './pages/Pricing'
import Sessions from './pages/Sessions'
import DNAProfile from './pages/DNAProfile'
import NotFound from './pages/NotFound'
import InstallPrompt from './components/InstallPrompt'

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <>{children}</>
}

/** Show Landing for guests, Home dashboard for authenticated users */
function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  return isAuthenticated ? <Home /> : <Landing />
}

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.key}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        style={{ minHeight: '100vh' }}
      >
        <Routes location={location}>
          <Route path="/"                         element={<RootRoute />} />
          <Route path="/auth"                     element={<Auth />} />
          <Route path="/waitlist"                 element={<Waitlist />} />
          <Route path="/editor"                   element={<RequireAuth><Editor /></RequireAuth>} />
          <Route path="/sessions"                 element={<RequireAuth><Sessions /></RequireAuth>} />
          <Route path="/dna"                      element={<RequireAuth><DNAProfile /></RequireAuth>} />
          <Route path="/dashboard/:sessionId"     element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/report/:sessionId"        element={<RequireAuth><Report /></RequireAuth>} />
          <Route path="/verify"                   element={<Verify />} />
          <Route path="/verify/teacher"           element={<TeacherVerify />} />
          <Route path="/verify/:hash"             element={<Verify />} />
          <Route path="/methodology"              element={<Methodology />} />
          <Route path="/pricing"                  element={<Pricing />} />
          <Route path="*"                         element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OfflineBanner />
        <AnimatedRoutes />
        <InstallPrompt />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a24',
              color: '#e2e0f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0a0a0f' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0a0f' } },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  )
}
