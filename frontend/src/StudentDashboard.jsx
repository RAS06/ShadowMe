import React from 'react'
import NavBar from './NavBar'
import StudentNearby from './StudentNearby'
import StudentProfile from './StudentProfile'

export default function StudentDashboard() {
  function handleLogout() {
    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_user')
    window.location.href = '/'
  }

  return (
    <div style={{ padding: 24 }}>
      <NavBar onLogout={handleLogout} />
      <h2>Student Dashboard</h2>
      <p>Search for nearby doctors and book appointments.</p>
      <StudentNearby />
      <hr style={{ margin: '24px 0' }} />
      <StudentProfile />
    </div>
  )
}
