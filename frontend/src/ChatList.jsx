import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from './api'

export default function ChatList() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [doctorNames, setDoctorNames] = useState({})

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api('/api/chat/rooms')
        if (!res.ok) return
        const j = await res.json()
        const rs = j.rooms || []
        if (!mounted) return
        setRooms(rs)

        // fetch doctor names for rooms that look like appt:doctorId:studentId
        const ids = Array.from(new Set(rs.map(r => r.id).filter(Boolean).filter(id => id.startsWith('appt:')).map(id => id.split(':')[1])))
        const map = {}
        await Promise.all(ids.map(async (docId) => {
          try {
            const dr = await api(`/api/doctors/${docId}`)
            if (dr.ok) {
              const jd = await dr.json()
              map[docId] = jd.doctorName || jd.clinicName || `Dr ${docId}`
            } else {
              map[docId] = `Dr ${docId}`
            }
          } catch (e) { map[docId] = `Dr ${docId}` }
        }))
        if (mounted) setDoctorNames(map)
      } catch (e) {
        console.warn('Failed to load chat rooms', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const labelFor = (id) => {
    if (!id) return id
    if (id.startsWith('appt:')) {
      // try to use the enriched room data if available
      const room = rooms.find(rr => rr.id === id)
      if (room && (room.doctorName || room.studentName)) return `Chat: ${room.studentName} ↔ ${room.doctorName}`
      const parts = id.split(':')
      const doctorId = parts[1]
      return `Chat with ${doctorNames[doctorId] || `Dr ${doctorId}`}`
    }
    return id
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '6px 10px' }}>Back</button>
      </div>
      <h3>Your Chat Rooms</h3>
      {rooms.length === 0 && <div>No chat rooms available</div>}
      <ul>
        {(() => {
          // defensive dedupe: ensure we only render unique room ids
          const displayRooms = Array.from(new Map(rooms.map(r => [r.id, r])).values())
          return displayRooms.map(r => (
            <li key={r.id} style={{ marginBottom: 8 }}>
              <Link to={`/chat/${encodeURIComponent(r.id)}`}>{labelFor(r.id)}</Link>
            </li>
          ))
        })()}
      </ul>
    </div>
  )
}
