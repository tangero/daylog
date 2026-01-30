import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { checkAuth, setAuthErrorHandler, getUserFromToken, removeToken } from './lib/api'
import { queryClient } from './main'

// Lazy loading stránek - rozdělení bundle
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Hashtags = lazy(() => import('./pages/Hashtags'))
const Clients = lazy(() => import('./pages/Clients'))
const Stats = lazy(() => import('./pages/Stats'))
const Changelog = lazy(() => import('./pages/Changelog'))

// Loading spinner komponenta
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      const user = await checkAuth()
      setIsAuthenticated(!!user)
      setUserEmail(user?.email || null)
      
      if (!user) {
        removeToken()
      }
    }
    
    initAuth()
    
    setAuthErrorHandler(() => {
      setIsAuthenticated(false)
      setUserEmail(null)
      queryClient.clear() // Vyčistit cache při auth chybě
    })
  }, [])

  // Memoizované handlery pro zamezení zbytečných re-renderů
  const handleLogin = useCallback(() => {
    setIsAuthenticated(true)
    const user = getUserFromToken()
    setUserEmail(user?.email || null)
  }, [])

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    setUserEmail(null)
    queryClient.clear() // Vyčistit cache při odhlášení
  }, [])

  // Loading stav
  if (isAuthenticated === null) {
    return <LoadingSpinner />
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register onRegister={handleLogin} />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ForgotPassword />
            )
          }
        />
        <Route
          path="/reset-password"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ResetPassword />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/hashtags"
          element={
            isAuthenticated ? (
              <Hashtags onLogout={handleLogout} userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/clients"
          element={
            isAuthenticated ? (
              <Clients onLogout={handleLogout} userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/stats"
          element={
            isAuthenticated ? (
              <Stats onLogout={handleLogout} userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/changelog" element={<Changelog />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Landing />
            )
          }
        />
      </Routes>
    </Suspense>
  )
}

export default App
