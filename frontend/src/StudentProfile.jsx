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
        // Fetch server-side user/profile info (preferred source of truth)
        const meRes = await api('/api/auth/me')
        let user = null
        if (meRes.ok) {
          const mj = await meRes.json()
          user = mj.user || null
          // if profile contains name, use it; otherwise prefer fullName
          const derivedName = (user && user.profile && user.profile.name) ? user.profile.name : (user && user.fullName ? user.fullName : '')
          setName(derivedName)
          // normalize profile object to include a .name for UI convenience
          if (user) user.name = derivedName
        } else {
          // fallback to localStorage
          const raw = localStorage.getItem('sm_user')
          if (!raw) return
          user = JSON.parse(raw)
          const derivedName = user.name || user.fullName || ''
          setName(derivedName)
          if (user) user.name = derivedName
        }
        setProfile(user)
        // load student's appointments via authenticated endpoint
        const res = await api(`/api/appointments/student`)
        if (!res.ok) return
        const j = await res.json()
        const rawAppts = (j.appointments || [])
        // gather doctorIds that might provide fallback addresses
        const missingDoctorIds = Array.from(new Set(rawAppts.filter(a => !a.address && a.doctorId).map(a => a.doctorId)))
        const doctorAddrMap = {}
        if (missingDoctorIds.length > 0) {
          await Promise.all(missingDoctorIds.map(async did => {
            try {
              const dr = await api(`/api/doctors/${did}`)
              if (dr.ok) {
                const jd = await dr.json()
                doctorAddrMap[did] = jd.doctor && jd.doctor.address ? jd.doctor.address : jd.address || ''
              }
            } catch (e) {}
          }))
        }
        const appts = rawAppts.map(a => ({ ...a, address: a.address || doctorAddrMap[a.doctorId] || null }))
        setAppointments(appts)
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
          <div><strong>Name:</strong> {name || profile.name || profile.fullName || '(not set)'}</div>
          <div><strong>Email:</strong> {profile.email || profile.email || ''}</div>
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
            <div>
              {a.start ? new Date(a.start).toLocaleString() : JSON.stringify(a)}
              <button style={{ marginLeft: 8 }} onClick={() => cancelAppointment(a)}>Cancel</button>
            </div>
            {a.address ? (
              <div style={{ marginTop: 4 }}>
                <small>Address: {a.address} </small>
                <span style={{ marginLeft: 8 }}>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`} target="_blank" rel="noreferrer">Open in Google Maps</a>
                  <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(a.address)}`} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>Open in OSM</a>
                </span>
              </div>
            ) : (a.location && a.location.coordinates && Array.isArray(a.location.coordinates) && a.location.coordinates.length === 2 && (
              <div style={{ marginTop: 4 }}>
                {(() => {
                  const lng = parseFloat(a.location.coordinates[0])
                  const lat = parseFloat(a.location.coordinates[1])
                  const latStr = isNaN(lat) ? 'n/a' : lat.toFixed(7)
                  const lngStr = isNaN(lng) ? 'n/a' : lng.toFixed(7)
                  const gUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`
                  return (
                    <span>
                      <small>Location: {latStr}, {lngStr} </small>
                      <a href={gUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>Open in Google Maps</a>
                      <a href={osmUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>Open in OSM</a>
                    </span>
                  )
                })()}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  )
}
