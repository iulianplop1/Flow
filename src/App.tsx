import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Auth from './pages/Auth'
import { useAuthStore } from './stores/authStore'

function App() {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <Auth />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

