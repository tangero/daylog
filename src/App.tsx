import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Hashtags from './pages/Hashtags'
import Clients from './pages/Clients'
import Stats from './pages/Stats'
import Changelog from './pages/Changelog'
import { isTokenValid, setAuthErrorHandler, getUserFromToken } from './lib/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Kontrola tokenu v localStorage - včetně expirace!
    const valid = isTokenValid()
    setIsAuthenticated(valid)

    if (valid) {
      const user = getUserFromToken()
      setUserEmail(user?.email || null)
    } else {
      setUserEmail(null)
      // Pokud token existuje ale není platný, smazat ho
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token')
      }
    }

    // Nastavit handler pro automatické odhlášení při 401 chybě z API
    setAuthErrorHandler(() => {
      setIsAuthenticated(false)
      setUserEmail(null)
    })
  }, [])

  // Loading stav
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={() => {
              setIsAuthenticated(true)
              const user = getUserFromToken()
              setUserEmail(user?.email || null)
            }} />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Register onRegister={() => {
              setIsAuthenticated(true)
              const user = getUserFromToken()
              setUserEmail(user?.email || null)
            }} />
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
            <Dashboard onLogout={() => {
              setIsAuthenticated(false)
              setUserEmail(null)
            }} userEmail={userEmail} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/hashtags"
        element={
          isAuthenticated ? (
            <Hashtags onLogout={() => {
              setIsAuthenticated(false)
              setUserEmail(null)
            }} userEmail={userEmail} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/clients"
        element={
          isAuthenticated ? (
            <Clients onLogout={() => {
              setIsAuthenticated(false)
              setUserEmail(null)
            }} userEmail={userEmail} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/stats"
        element={
          isAuthenticated ? (
            <Stats onLogout={() => {
              setIsAuthenticated(false)
              setUserEmail(null)
            }} userEmail={userEmail} />
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
  )
}

export default App
