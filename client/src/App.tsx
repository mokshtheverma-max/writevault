import { useLocation, Navigate } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import LoadingScreen from './components/LoadingScreen'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Verify from './pages/Verify'
import TeacherVerify from './pages/TeacherVerify'
import Methodology from './pages/Methodology'
import Auth from './pages/Auth'
import AuthCallback from './pages/AuthCallback'
import ProfilePage from './pages/ProfilePage'
import ForgotPassword from './pages/ForgotPassword'
import Waitlist from './pages/Waitlist'
import Pricing from './pages/Pricing'
import Sessions from './pages/Sessions'
import Onboarding from './pages/Onboarding'
import PaymentSuccess from './pages/PaymentSuccess'
import BillingPage from './pages/BillingPage'
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import AboutPage from './pages/AboutPage'
import ForSchools from './pages/ForSchools'
import DetectorComparison from './pages/DetectorComparison'
import VsTurnitin from './pages/VsTurnitin'
import InstallPrompt from './components/InstallPrompt'

const Dashboard  = lazy(() => import('./pages/Dashboard'))
const Report     = lazy(() => import('./pages/Report'))
const DNAProfile = lazy(() => import('./pages/DNAProfile'))
const Blog       = lazy(() => import('./pages/Blog'))

const ONBOARDING_KEY = 'wv_onboarding_complete'

function needsOnboarding(user: { sessionCount?: number } | null): boolean {
  if (!user) return false
  if (localStorage.getItem(ONBOARDING_KEY)) return false
  return (user.sessionCount ?? 0) === 0
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (needsOnboarding(user) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

/** Show Landing for guests, Home dashboard for authenticated users */
function RootRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (isAuthenticated && needsOnboarding(user)) return <Navigate to="/onboarding" replace />
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
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes location={location}>
              <Route path="/"                         element={<RootRoute />} />
              <Route path="/auth"                     element={<Auth />} />
              <Route path="/auth/callback"            element={<AuthCallback />} />
              <Route path="/profile"                  element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="/forgot-password"            element={<ForgotPassword />} />
              <Route path="/waitlist"                 element={<Waitlist />} />
              <Route path="/editor"                   element={<RequireAuth><Editor /></RequireAuth>} />
              <Route path="/sessions"                 element={<RequireAuth><Sessions /></RequireAuth>} />
              <Route path="/dna"                      element={<RequireAuth><DNAProfile /></RequireAuth>} />
              <Route path="/onboarding"               element={<RequireAuth><Onboarding /></RequireAuth>} />
              <Route path="/dashboard/:sessionId"     element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/report/:sessionId"        element={<RequireAuth><Report /></RequireAuth>} />
              <Route path="/verify"                   element={<Verify />} />
              <Route path="/verify/teacher"           element={<TeacherVerify />} />
              <Route path="/verify/:hash"             element={<Verify />} />
              <Route path="/methodology"              element={<Methodology />} />
              <Route path="/pricing"                  element={<Pricing />} />
              <Route path="/privacy"                  element={<PrivacyPolicy />} />
              <Route path="/terms"                    element={<TermsOfService />} />
              <Route path="/about"                    element={<AboutPage />} />
              <Route path="/schools"                  element={<ForSchools />} />
              <Route path="/compare"                  element={<DetectorComparison />} />
              <Route path="/vs-turnitin"              element={<VsTurnitin />} />
              <Route path="/blog"                     element={<Blog />} />
              <Route path="/payment-success"          element={<RequireAuth><PaymentSuccess /></RequireAuth>} />
              <Route path="/billing"                  element={<RequireAuth><BillingPage /></RequireAuth>} />
              <Route path="*"                         element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  )
}

function useKeepBackendWarm() {
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL
    if (!apiUrl) return
    const ping = () => { fetch(`${apiUrl}/health`).catch(() => {}) }
    ping()
    const id = setInterval(ping, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
}

export default function App() {
  useKeepBackendWarm()
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
