import React, { useEffect, useState } from 'react'
import api from './api'
import StudentSearchControls from './StudentSearchControls'
import StudentAppointmentSelector from './StudentAppointmentSelector'

export default function StudentNearby() {
  const [lat, setLat] = useState('37.7749')
  const [lng, setLng] = useState('-122.4194')
  // radius is kept in kilometers in the UI; default 5 km
  const [radius, setRadius] = useState(5)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)

  // params: either event or an object { lat, lng, radius }
  async function findNearby(params) {
    if (params && params.preventDefault) params = null
    setLoading(true)
    try {
      const useLat = params && params.lat !== undefined ? params.lat : lat
      const useLng = params && params.lng !== undefined ? params.lng : lng
  // backend expects radius in meters, UI works in kilometers
  const useRadiusKm = params && params.radius !== undefined ? params.radius : radius
  const useRadiusMeters = Math.round(Number(useRadiusKm) * 1000)
  const res = await api(`/api/appointments/nearby?lat=${encodeURIComponent(useLat)}&lng=${encodeURIComponent(useLng)}&radius=${encodeURIComponent(useRadiusMeters)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch nearby')
      }
      const j = await res.json()
      setDoctors(j || [])
      // reflect used coords back to state
      if (params && params.lat !== undefined) setLat(String(params.lat))
      if (params && params.lng !== undefined) setLng(String(params.lng))
  if (params && params.radius !== undefined) setRadius(params.radius)
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function bookSlot(doctorId, appointment) {
    try {
      let userRaw = localStorage.getItem('sm_user')
      // If sm_user missing or stale, try to fetch current user from server
      if (!userRaw) {
        try {
          const meRes = await api('/api/me')
          if (meRes.ok) {
            const mj = await meRes.json()
            if (mj && mj.user) {
              localStorage.setItem('sm_user', JSON.stringify(mj.user))
              userRaw = localStorage.getItem('sm_user')
            }
          }
        } catch (e) {
          // ignore — we'll handle missing user below
        }
      }
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
      // trigger search with new coords (high accuracy)
      findNearby({ lat: latitude, lng: longitude, radius })
    }, (err) => {
      console.warn('Geolocation error', err)
      alert('Unable to get location: ' + (err.message || 'permission denied'))
    }, { enableHighAccuracy: true, timeout: 10000 })
  }

  useEffect(() => {
    // auto-run initial search
    findNearby()
  }, [])

  return (
    <div>
      <h3>Find Nearby Doctors</h3>
      <StudentSearchControls onSearch={findNearby} initial={{ address: '', lat, lng, radius }} />
      <div style={{ marginBottom: 12 }}>
        <button onClick={useMyLocation}>Use my location</button>
      </div>

      {loading && <div>Loading...</div>}

      <ul>
        {doctors.length === 0 && !loading && <li>No doctors found</li>}
        {doctors.map(d => (
          <li key={d.id} style={{ marginBottom: 12 }}>
            <strong>{d.clinicName || d.doctorName || 'Clinic'}</strong> — {d.address}
            <div>Openings:</div>
            <StudentAppointmentSelector doctor={d} onBook={async (doctorId, appointment) => {
              await bookSlot(doctorId, appointment)
            }} />
          </li>
        ))}
      </ul>
    </div>
  )
}
