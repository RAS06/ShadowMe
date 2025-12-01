import React, { useEffect, useState } from 'react'
import api from './api'
import ChatRoom from './ChatRoom'

export default function DoctorBookings() {
  const [booked, setBooked] = useState([])
  const [activeChatRoom, setActiveChatRoom] = useState(null)

  useEffect(() => {
    async function load() {
      const userRaw = localStorage.getItem('sm_user')
      if (!userRaw) return
      const user = JSON.parse(userRaw)
      const doctorId = user.profileId
      const res = await api(`/api/appointments/doctor/${doctorId}`)
      if (!res.ok) return
      const j = await res.json()
      const all = j.appointments || []
      setBooked(all.filter(a => a.isBooked))
    }
    load()
  }, [])

  async function markCompleted(start, appointmentId) {
    const userRaw = localStorage.getItem('sm_user')
    if (!userRaw) return alert('Missing user')
    const user = JSON.parse(userRaw)
    const doctorId = user.profileId
    const payload = appointmentId ? { appointmentId } : { start }
    const res = await api(`/api/appointments/doctor/${doctorId}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      return alert(e.error || 'Failed to mark completed')
    }
    const j = await res.json()
    alert('Marked completed')
    setBooked(prev => prev.map(b => (new Date(b.start).toISOString() === new Date(start).toISOString() ? j.appointment : b)))
  }

  return (
    <div>
      <h3>Booked Appointments</h3>
      <ul>
        {booked.length === 0 && <li>No booked appointments</li>}
        {booked.map((b, idx) => (
          <li key={b._id || idx}>
            {b.start ? `${new Date(b.start).toLocaleString()} - ${b.end ? new Date(b.end).toLocaleString() : ''}` : JSON.stringify(b)}
            <small style={{ marginLeft: 8, color: '#666' }}> (id: {b.appointmentId})</small>
            {b.isCompleted ? <span style={{ marginLeft: 8 }}> (completed)</span> : (
              <button style={{ marginLeft: 8 }} onClick={() => markCompleted(b.start, b.appointmentId)}>Mark completed</button>
            )}
            {b.bookedByName && <small style={{ marginLeft: 8 }}> (booked by {b.bookedByName})</small>}
            <button 
              style={{ marginLeft: 8, backgroundColor: '#3b82f6', color: 'white', padding: '4px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }} 
              onClick={() => setActiveChatRoom({ 
                appointmentId: b.appointmentId || b._id,
                studentName: b.bookedByName || 'Student'
              })}
            >
              💬 Chat
            </button>
          </li>
        ))}
      </ul>

      {activeChatRoom && (
        <ChatRoom
          appointmentId={activeChatRoom.appointmentId}
          otherPartyName={activeChatRoom.studentName}
          onClose={() => setActiveChatRoom(null)}
        />
      )}
    </div>
  )
}
