import React, { useEffect, useState } from 'react'
import api from './api'

export default function DoctorOpenings() {
  const [openings, setOpenings] = useState([])
  const [clinicName, setClinicName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const userRaw = localStorage.getItem('sm_user')
        if (!userRaw) return
        const user = JSON.parse(userRaw)
        if (!user.profileId) return
        const res = await api(`/api/appointments/doctor/${user.profileId}`)
        if (!res.ok) throw new Error('Failed to load openings')
        const data = await res.json()
        setOpenings(data.openings || data.appointments || [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  async function createOpening(e) {
    e.preventDefault()
    try {
      const userRaw = localStorage.getItem('sm_user')
      if (!userRaw) return alert('Missing user')
      const user = JSON.parse(userRaw)
      const doctorId = user.profileId
      if (!start) return alert('Please select a start datetime')
      // normalize to ISO strings; if end missing default to 30 minutes after start
      const startIso = new Date(start).toISOString()
      let endIso = end ? new Date(end).toISOString() : null
      if (!endIso) {
        const s = new Date(start)
        s.setMinutes(s.getMinutes() + 30)
        endIso = s.toISOString()
      }
      const body = { start: startIso, end: endIso }
      if (lat && lng) {
        body.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
      }
      const res = await api(`/api/appointments/doctor/${doctorId}/openings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Create failed')
      }
      const data = await res.json()
      alert('Opening created')
      // refresh list from server
      const fresh = await api(`/api/appointments/doctor/${doctorId}`)
      if (fresh.ok) {
        const j = await fresh.json()
        setOpenings(j.appointments || j.openings || [])
      }
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  return (
    <div>
      <h3>Your Openings</h3>
  <ul>
        {openings.length === 0 && <li>No openings yet</li>}
        {openings.map((o, idx) => (
          <li key={o._id || idx}>
            {o.start ? `${new Date(o.start).toLocaleString()} - ${o.end ? new Date(o.end).toLocaleString() : '??'}` : JSON.stringify(o)}
            {o.isBooked ? (
              <span style={{ marginLeft: 8, color: 'red' }}>(BOOKED by {o.bookedByStudentId || 'unknown'})</span>
            ) : (
              <span style={{ marginLeft: 8, color: 'green' }}>(available)</span>
            )}
            {!o.isBooked && (
              <button style={{ marginLeft: 12 }} onClick={async () => {
                // cancel this opening
                const userRaw = localStorage.getItem('sm_user')
                if (!userRaw) return alert('Missing user')
                const user = JSON.parse(userRaw)
                const doctorId = user.profileId
                const payload = o.appointmentId ? { appointmentId: o.appointmentId } : { start: o.start }
                const res = await api(`/api/appointments/doctor/${doctorId}/openings`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                if (!res.ok) {
                  const e = await res.json().catch(() => ({}))
                  return alert(e.error || 'Failed to cancel')
                }
                const j = await res.json()
                setOpenings(j.appointments || [])
              }}>Cancel</button>
            )}
          </li>
        ))}
      </ul>

      <h3>Create Opening</h3>
      <form onSubmit={createOpening}>
        <div>
            <label>Start: <input type="datetime-local" value={start} onChange={e => {
            const v = e.target.value
            setStart(v)
            // if end not provided, auto-fill a 30-minute slot
            if (!end && v) {
              try {
                const s = new Date(v)
                s.setMinutes(s.getMinutes() + 30)
                // convert to datetime-local value (YYYY-MM-DDTHH:MM)
                const tzOffset = s.getTimezoneOffset()
                const local = new Date(s.getTime() - tzOffset * 60000)
                setEnd(local.toISOString().slice(0,16))
              } catch (err) {
                // ignore formatting errors
              }
            }
          }} /></label>
        </div>
        <div>
          <label>Location Lat: <input value={lat} onChange={e => setLat(e.target.value)} /></label>
          <label style={{ marginLeft: 12 }}>Lng: <input value={lng} onChange={e => setLng(e.target.value)} /></label>
        </div>
        <div>
          <label>End (optional): <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} /></label>
        </div>
        <div>
          <small>Note: times are local; the server stores ISO timestamps.</small>
        </div>
        <button type="submit">Create Opening</button>
      </form>
    </div>
  )
}
