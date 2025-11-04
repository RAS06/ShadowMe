import React, { useEffect, useState } from 'react'
import api from './api'

export default function StudentNearby() {
  const [lat, setLat] = useState('37.7749')
  const [lng, setLng] = useState('-122.4194')
  const [radius, setRadius] = useState(5000)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)

  async function findNearby(e) {
    if (e && e.preventDefault) e.preventDefault()
    setLoading(true)
    try {
      const res = await api(`/api/appointments/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${encodeURIComponent(radius)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch nearby')
      }
      const j = await res.json()
      setDoctors(j || [])
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function bookSlot(doctorId, appointment) {
    try {
      const userRaw = localStorage.getItem('sm_user')
      if (!userRaw) return alert('Missing user')
      const user = JSON.parse(userRaw)
      const studentId = user.profileId
      const payload = appointment.appointmentId ? { appointmentId: appointment.appointmentId, studentId } : { start: appointment.start, studentId }
      const res = await api(`/api/appointments/book/${doctorId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to book')
      }
      const j = await res.json()
      alert('Booked!')
      // refresh nearby list
      await findNearby()
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return alert('Geolocation not supported by your browser')
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      setLat(String(latitude))
      setLng(String(longitude))
      // trigger search with new coords
      findNearby()
    }, (err) => {
      console.warn('Geolocation error', err)
      alert('Unable to get location: ' + (err.message || 'permission denied'))
    }, { enableHighAccuracy: false, timeout: 5000 })
  }

  useEffect(() => {
    // auto-run initial search
    findNearby()
  }, [])

  return (
    <div>
      <h3>Find Nearby Doctors</h3>
      <form onSubmit={findNearby} style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Lat: <input value={lat} onChange={e => setLat(e.target.value)} /></label>
        <label style={{ marginRight: 8 }}>Lng: <input value={lng} onChange={e => setLng(e.target.value)} /></label>
        <label style={{ marginRight: 8 }}>Radius(m): <input value={radius} onChange={e => setRadius(e.target.value)} /></label>
        <button type="submit">Find</button>
        <button type="button" style={{ marginLeft: 8 }} onClick={useMyLocation}>Use my location</button>
      </form>

      {loading && <div>Loading...</div>}

      <ul>
        {doctors.length === 0 && !loading && <li>No doctors found</li>}
        {doctors.map(d => (
          <li key={d.id} style={{ marginBottom: 12 }}>
            <strong>{d.clinicName || d.doctorName || 'Clinic'}</strong> — {d.address}
            <div>Openings:</div>
            <ul>
              {(d.openings || []).map((a, idx) => (
                <li key={a.appointmentId || idx}>
                  {a.start ? new Date(a.start).toLocaleString() : JSON.stringify(a)}
                  {a.location && a.location.coordinates && (
                    <span style={{ marginLeft: 8, color: '#555' }}> ({a.location.coordinates[1].toFixed(5)}, {a.location.coordinates[0].toFixed(5)})</span>
                  )}
                  {!a.isBooked && <button style={{ marginLeft: 8 }} onClick={() => bookSlot(d.id, a)}>Book</button>}
                  {a.isBooked && <span style={{ marginLeft: 8, color: 'red' }}>(booked)</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
