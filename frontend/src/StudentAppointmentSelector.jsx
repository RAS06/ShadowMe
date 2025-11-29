import React, { useState } from 'react'

export default function StudentAppointmentSelector({ doctor, onBook }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const openings = (doctor.openings || [])

  async function confirm() {
    if (!selected) return alert('Please select a slot')
    setLoading(true)
    try {
      await onBook(doctor.id, selected)
      // onBook will refresh parent list; we keep selector cleared
      setSelected(null)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  if (!openings || openings.length === 0) return <div style={{ marginTop: 8 }}>No openings</div>

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {openings.map((a, i) => (
          <label key={a.appointmentId || i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name={`slot-${doctor.id}`}
              disabled={a.isBooked}
              checked={selected && (selected.appointmentId || selected.start) === (a.appointmentId || a.start)}
              onChange={() => setSelected(a)}
            />
            <div>
              <div>{a.start ? new Date(a.start).toLocaleString() : JSON.stringify(a)}</div>
              {a.location && a.location.coordinates && (
                <small style={{ color: '#555' }}>{a.location.coordinates[1].toFixed(6)}, {a.location.coordinates[0].toFixed(6)}</small>
              )}
              {a.isBooked && <div style={{ color: 'red' }}>Booked</div>}
            </div>
          </label>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={confirm} disabled={loading} style={{ marginRight: 8 }}>{loading ? 'Booking...' : 'Confirm booking'}</button>
      </div>
    </div>
  )
}
