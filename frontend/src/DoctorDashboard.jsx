import React from 'react'
import NavBar from './NavBar'
import DoctorOpenings from './DoctorOpenings'
import DoctorBookings from './DoctorBookings'
import DoctorChatList from './DoctorChatList'

export default function DoctorDashboard() {
  function handleLogout() {
    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_user')
    // no-op: main app will redirect
    window.location.href = '/'
  }

  return (
    <div style={{ padding: 24 }}>
      <NavBar onLogout={handleLogout} />
      <h2>Doctor Dashboard</h2>
      <p>Manage your clinic openings and view bookings.</p>
      <DoctorOpenings />
      <hr />
      <DoctorBookings />
      <hr />
      <DoctorChatList />
    </div>
  )
}
