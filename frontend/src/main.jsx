
import React from 'react'
import './index.css'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Login from './Login'
import Signup from './Signup'
import Dashboard from './Dashboard'
import ProtectedRoute from './ProtectedRoute'
import DoctorDashboard from './DoctorDashboard'
import StudentDashboard from './StudentDashboard'
import StudentProfile from './StudentProfile'
import DevDebug from './DevDebug'

// Development helper: fetch a fresh seed token from backend dev endpoint so token always matches backend secret
if (process.env.NODE_ENV !== 'production') {
  try {
    const base = import.meta.env.VITE_API_URL || ''
    fetch(base + '/api/dev/seed-token', { credentials: 'include' }).then(r => {
      if (!r.ok) return
      return r.json()
    }).then(j => {
      if (!j) return
      if (j.token) localStorage.setItem('sm_token', j.token)
      if (j.user) localStorage.setItem('sm_user', JSON.stringify(j.user))
    }).catch(() => {})
  } catch (e) {}
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DevDebug />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute>
          {/* client-side role guard: only show doctor dashboard to doctor users */}
          {(() => {
            let u = null
            const raw = localStorage.getItem('sm_user')
            if (raw) {
              try { u = JSON.parse(raw) } catch (e) { u = null }
            }
            // fallback: decode token payload
            if (!u) {
              const token = localStorage.getItem('sm_token')
              if (token) {
                try {
                  const parts = token.split('.')
                  if (parts.length === 3) u = JSON.parse(atob(parts[1]))
                } catch (e) { u = null }
              }
            }
            if (!u) return <Navigate to="/login" />
            if (u.role !== 'doctor') return <Navigate to="/dashboard" />
            return <DoctorDashboard />
          })()}
        </ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute>
          {(() => {
            let u = null
            const raw = localStorage.getItem('sm_user')
            if (raw) {
              try { u = JSON.parse(raw) } catch (e) { u = null }
            }
            if (!u) {
              const token = localStorage.getItem('sm_token')
              const _srDebugForce = (typeof window !== 'undefined' && window.location.search && window.location.search.indexOf('debug=1') !== -1)
              if (process.env.NODE_ENV !== 'production' || _srDebugForce) {
                try { console.debug('Student route check - tokenPresent:', !!token, 'rawSmUser:', raw) } catch (e) {}
              }
              if (token) {
                try { const parts = token.split('.') ; if (parts.length === 3) u = JSON.parse(atob(parts[1])) } catch (e) { u = null }
              }
            }
            if (!u) return <Navigate to="/login" />
            if (u.role !== 'student') return <Navigate to="/dashboard" />
            return <StudentDashboard />
          })()}
        </ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute>
          {(() => {
            let u = null
            const raw = localStorage.getItem('sm_user')
            if (raw) {
              try { u = JSON.parse(raw) } catch (e) { u = null }
            }
            if (!u) {
              const token = localStorage.getItem('sm_token')
              if (token) {
                try { const parts = token.split('.') ; if (parts.length === 3) u = JSON.parse(atob(parts[1])) } catch (e) { u = null }
              }
            }
            if (!u) return <Navigate to="/login" />
            if (u.role !== 'student') return <Navigate to="/dashboard" />
            return <StudentProfile />
          })()}
        </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
