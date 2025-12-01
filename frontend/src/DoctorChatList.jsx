import React, { useEffect, useState } from 'react'
import api from './api'
import ChatRoom from './ChatRoom'

export default function DoctorChatList() {
  const [chatRooms, setChatRooms] = useState([])
  const [activeChatRoom, setActiveChatRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChatRooms()
  }, [])

  async function loadChatRooms() {
    try {
      const res = await api('/api/chat/rooms')
      if (!res.ok) {
        console.error('Failed to load chat rooms')
        return
      }
      const data = await res.json()
      setChatRooms(data.rooms || [])
    } catch (err) {
      console.error('Error loading chat rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading chats...</div>
  }

  return (
    <div>
      <h3>Patient Chats</h3>
      {chatRooms.length === 0 ? (
        <p style={{ color: '#666' }}>No active chats yet. Chats will appear here when students book appointments.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
          {chatRooms.map((room, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9',
                transition: 'background-color 0.2s'
              }}
              onClick={() => setActiveChatRoom({
                appointmentId: room.appointmentId,
                studentName: room.studentName || 'Student'
              })}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>
                    💬 Chat with {room.studentName || 'Student'}
                  </strong>
                  {room.appointmentDate && (
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                      Appointment: {new Date(room.appointmentDate).toLocaleString()}
                    </div>
                  )}
                </div>
                <button
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveChatRoom({
                      appointmentId: room.appointmentId,
                      studentName: room.studentName || 'Student'
                    })
                  }}
                >
                  Open Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
