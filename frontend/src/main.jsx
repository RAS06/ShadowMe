
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Login from './Login'
import Signup from './Signup'
import Dashboard from './Dashboard'
import CreateAppointment from './CreateAppointment'
import BookAppointment from './BookAppointment'
import ManageAppointments from './ManageAppointments'
import ProtectedRoute from './ProtectedRoute'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/appointments/create" element={
          <ProtectedRoute>
            <CreateAppointment />
          </ProtectedRoute>
        } />
        <Route path="/appointments/book" element={
          <ProtectedRoute>
            <BookAppointment />
          </ProtectedRoute>
        } />
        <Route path="/appointments/manage" element={
          <ProtectedRoute>
            <ManageAppointments />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
