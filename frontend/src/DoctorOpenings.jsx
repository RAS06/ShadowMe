import React, { useEffect, useState } from 'react'
import api from './api'
import MapPicker from './MapPicker'

export default function DoctorOpenings() {
  const [openings, setOpenings] = useState([])
  const [clinicName, setClinicName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [showMap, setShowMap] = useState(false)
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
        // load doctor profile/clinic info
        const dr = await api(`/api/doctors/${user.profileId}`)
        if (dr.ok) {
          const jd = await dr.json()
          setClinicName(jd.clinicName || '')
          setAddress(jd.address || '')
          if (jd.location && Array.isArray(jd.location.coordinates)) {
            setLat(jd.location.coordinates[1])
            setLng(jd.location.coordinates[0])
          }
        }
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
      // prefer geocoding from provided address; include address in body for server-side storage
      const body = { start: startIso, end: endIso }
      if (address) body.address = address
      let chosenLat = lat
      let chosenLng = lng
      // If an address is provided but lat/lng not set, attempt to geocode via Nominatim
      if (address && (!lat || !lng)) {
        try {
          const q = encodeURIComponent(address)
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`
          const r = await fetch(url, { headers: { 'Accept': 'application/json' } })
          if (r.ok) {
            const arr = await r.json()
            if (arr && arr.length > 0) {
              chosenLat = String(parseFloat(arr[0].lat))
              chosenLng = String(parseFloat(arr[0].lon))
              setLat(chosenLat)
              setLng(chosenLng)
            }
          }
        } catch (e) {
          console.warn('Geocode failed', e)
        }
      }
      if (chosenLat && chosenLng) {
        body.location = { type: 'Point', coordinates: [parseFloat(chosenLng), parseFloat(chosenLat)] }
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

  async function saveClinicInfo() {
    try {
      const userRaw = localStorage.getItem('sm_user')
      if (!userRaw) return alert('Missing user')
      const user = JSON.parse(userRaw)
      const doctorId = user.profileId
      // If address provided but no coordinates, attempt to geocode via Nominatim (OpenStreetMap)
      let chosenLat = lat
      let chosenLng = lng
      if (address && (!lat || !lng)) {
        try {
          const q = encodeURIComponent(address)
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`
          const r = await fetch(url, { headers: { 'Accept': 'application/json' } })
          if (r.ok) {
            const arr = await r.json()
            if (arr && arr.length > 0) {
              const first = arr[0]
              chosenLat = String(parseFloat(first.lat))
              chosenLng = String(parseFloat(first.lon))
              setLat(chosenLat)
              setLng(chosenLng)
            }
          }
        } catch (e) {
          console.warn('Geocode failed', e)
        }
      }

      const body = { clinicName, address }
      if (chosenLat && chosenLng) body.location = { type: 'Point', coordinates: [parseFloat(chosenLng), parseFloat(chosenLat)] }
      const res = await api(`/api/doctors/${doctorId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to save')
      }
      alert('Clinic info saved')
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
            <div>
              <strong>{o.start ? `${new Date(o.start).toLocaleString()} - ${o.end ? new Date(o.end).toLocaleString() : '??'}` : JSON.stringify(o)}</strong>
            </div>
            {o.address ? (
              <div style={{ marginTop: 4 }}>
                <small>Address: {o.address}</small>
                <span style={{ marginLeft: 8 }}>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`} target="_blank" rel="noreferrer">Open in Google Maps</a>
                  <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(o.address)}`} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>Open in OSM</a>
                </span>
              </div>
            ) : (o.location && o.location.coordinates && Array.isArray(o.location.coordinates) && o.location.coordinates.length === 2 && (
              <div style={{ marginTop: 4 }}>
                {(() => {
                  const lng = parseFloat(o.location.coordinates[0])
                  const lat = parseFloat(o.location.coordinates[1])
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
            {o.isBooked ? (
              <span style={{ marginLeft: 8, color: 'red' }}>(BOOKED by {o.bookedByName || o.bookedByStudentId || 'unknown'})</span>
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
          <label>Address: <input value={address} onChange={e => setAddress(e.target.value)} style={{ width: '60%' }} /></label>
          <button type="button" style={{ marginLeft: 12 }} onClick={() => setShowMap(s => !s)}>{showMap ? 'Hide Map' : 'Pick on map'}</button>
        </div>
        {showMap && (
          <div style={{ marginTop: 8 }}>
            <MapPicker value={{ lat: parseFloat(lat) || 37.7749, lng: parseFloat(lng) || -122.4194 }} onChange={(p) => { setLat(String(p.lat)); setLng(String(p.lng)); setAddress('') }} />
            <div style={{ marginTop: 6 }}><small>Picked coordinates will be used if you don't supply an address.</small></div>
          </div>
        )}
        <div>
          <label>End (optional): <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} /></label>
        </div>
        <div>
          <small>Note: times are local; the server stores ISO timestamps.</small>
        </div>
        <button type="submit">Create Opening</button>
      </form>

      <h3>Clinic Info</h3>
      <div>
        <label>Clinic name: <input value={clinicName} onChange={e => setClinicName(e.target.value)} /></label>
      </div>
      <div>
        <label>Address: <input value={address} onChange={e => setAddress(e.target.value)} style={{ width: '60%' }} /></label>
        <button onClick={saveClinicInfo} style={{ marginLeft: 12 }}>Save Clinic Info</button>
      </div>
    </div>
  )
}
