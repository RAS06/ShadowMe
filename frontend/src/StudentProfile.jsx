import React, { useEffect, useState } from 'react'
import api from './api'

export default function StudentProfile() {
  const [profile, setProfile] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const raw = localStorage.getItem('sm_user')
        if (!raw) return
        const user = JSON.parse(raw)
        setProfile(user)
        setName(user.name || '')
        // load student's appointments
        const studentId = user.profileId
        const res = await api(`/api/appointments/student/${studentId}`)
        if (!res.ok) return
        const j = await res.json()
        setAppointments(j.appointments || [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    try {
      // in this app profile update is simulated client-side; call backend if available
      const raw = localStorage.getItem('sm_user')
      if (!raw) return alert('Missing user')
      const user = JSON.parse(raw)
      const updated = { ...user, name }
      localStorage.setItem('sm_user', JSON.stringify(updated))
      setProfile(updated)
      setEditing(false)
      alert('Profile saved')
    } catch (err) {
      console.error(err)
      alert('Save failed')
    }
  }

  async function cancelAppointment(appointment) {
    try {
      const raw = localStorage.getItem('sm_user')
      if (!raw) return alert('Missing user')
      const user = JSON.parse(raw)
      const studentId = user.profileId
      const payload = appointment.appointmentId ? { appointmentId: appointment.appointmentId, studentId } : { start: appointment.start, studentId }
      const res = await api(`/api/appointments/book/${appointment.doctorId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        return alert(e.error || 'Failed to cancel')
      }
      const j = await res.json()
      setAppointments(prev => prev.filter(a => (a.appointmentId || a.start) !== (appointment.appointmentId || appointment.start)))
      alert('Cancelled')
    } catch (err) {
      console.error(err)
      alert('Cancel failed')
    }
  }

  if (!profile) return <div>Missing profile</div>

  return (
    <div>
      <h3>Your Profile</h3>
      {!editing ? (
        <div>
          <div><strong>Name:</strong> {profile.name || '(not set)'}</div>
          <div><strong>Email:</strong> {profile.email}</div>
          <button onClick={() => setEditing(true)}>Edit</button>
        </div>
      ) : (
        <form onSubmit={saveProfile}>
          <label>Name: <input value={name} onChange={e => setName(e.target.value)} /></label>
          <button type="submit">Save</button>
          <button type="button" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      )}

      <h4>Your Appointments</h4>
      <ul>
        {appointments.length === 0 && <li>No appointments</li>}
        {appointments.map((a, idx) => (
          <li key={a.appointmentId || idx}>
            {a.start ? new Date(a.start).toLocaleString() : JSON.stringify(a)}
            <button style={{ marginLeft: 8 }} onClick={() => cancelAppointment(a)}>Cancel</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
