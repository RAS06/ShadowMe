import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from './api'

export default function ChatRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [status, setStatus] = useState('connecting') // connecting | connected | disconnected
  const [participantLabel, setParticipantLabel] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState({})
  const [roomMeta, setRoomMeta] = useState(null)
  const wsRef = useRef(null)
  const containerRef = useRef(null)
  const token = localStorage.getItem('sm_token')
  const localUser = (() => { try { return JSON.parse(localStorage.getItem('sm_user')||'null') } catch (e) { return null } })()
  const localUserId = localUser && localUser.id ? localUser.id : (() => { try { const t = token; if (!t) return null; const p = JSON.parse(atob(t.split('.')[1])); return p.sub } catch (e) { return null } })()
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    let mounted = true
    async function loadHistory() {
      try {
        const res = await api(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`)
        if (!res.ok) return
        const j = await res.json()
        if (!mounted) return
        setMessages(j.messages || [])
      } catch (e) {
        console.warn('history load failed', e)
      }
    }
    loadHistory();

    // Fetch room metadata (doctor + student names)
    (async () => {
      try {
        const res = await api(`/api/chat/rooms/${encodeURIComponent(roomId)}`)
        if (res && res.ok) {
          const j = await res.json()
          if (j && j.room) {
            setRoomMeta(j.room)
            setParticipantLabel(`${j.room.doctorName} ↔ ${j.room.studentName}`)
          }
        }
      } catch (e) {}
    })()

    // connect websocket
    setStatus('connecting')
    const wsUrl = `${(window.location.protocol === 'https:') ? 'wss' : 'ws'}://${window.location.hostname}:4000?token=${encodeURIComponent(token || '')}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onopen = () => { setStatus('connected'); ws.send(JSON.stringify({ type: 'join', room: roomId })) }
    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data)
        if (!d) return
        if (d.type === 'message' && d.room === roomId) {
          setMessages(m => [...m, d])
        }
        if (d.type === 'presence' && d.room === roomId) {
          setOnlineUsers(d.users || [])
        }
        if (d.type === 'typing' && d.room === roomId) {
          const sid = d.sender && (d.sender.id || d.sender.sub)
          setTypingUsers(prev => {
            const next = { ...prev }
            if (d.typing) {
              next[sid] = { name: d.sender && (d.sender.name || sid), ts: Date.now() }
            } else {
              delete next[sid]
            }
            return next
          })
          // clear stale typing states after a bit
          setTimeout(() => {
            setTypingUsers(prev => {
              const now = Date.now()
              const copy = { ...prev }
              for (const k of Object.keys(copy)) {
                if (now - copy[k].ts > 3000) delete copy[k]
              }
              return copy
            })
          }, 3500)
        }
      } catch (e) {}
    }
    ws.onclose = () => setStatus('disconnected')
    ws.onerror = () => setStatus('disconnected')

    return () => { mounted = false; try { ws.close() } catch (e) {} }
  }, [roomId])

  // Auto-scroll on new messages
  useEffect(() => {
    try {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    } catch (e) {}
  }, [messages])

  function send() {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return alert('Not connected')
    ws.send(JSON.stringify({ type: 'message', room: roomId, text }))
    setText('')
  }

  // typing handling
  function handleInputChange(e) {
    const val = e.target.value
    setText(val)
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    try {
      ws.send(JSON.stringify({ type: 'typing', room: roomId, typing: !!val }))
    } catch (e) {}
    // debounce turning typing off
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      try { ws.send(JSON.stringify({ type: 'typing', room: roomId, typing: false })) } catch (e) {}
    }, 1200)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ padding: '6px 10px' }}>Back</button>
          <h3 style={{ margin: 0 }}>Chat: {participantLabel || roomId}</h3>
        </div>
        <div style={{ fontSize: '0.9em', color: status === 'connected' ? 'green' : status === 'connecting' ? 'orange' : 'red' }}>
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && 'Connected'}
          {status === 'disconnected' && 'Disconnected'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ fontSize: '0.9em' }}>
          Online: {onlineUsers.length}
          {onlineUsers.length > 0 && (
            <span style={{ marginLeft: 8 }}>{onlineUsers.map(u => u.name).join(', ')}</span>
          )}
        </div>
        <div style={{ fontSize: '0.9em', color: '#666' }}>
          {Object.keys(typingUsers).filter(k => k !== localUserId).length > 0 && (
            <span>{Object.values(typingUsers).filter(t => t).map(t => t.name).join(', ')} typing...</span>
          )}
        </div>
      </div>

      <div ref={containerRef} style={{ border: '1px solid #ccc', padding: 8, height: 320, overflowY: 'auto', marginTop: 8, background: '#fff' }}>
        {messages.map((m, i) => {
          const senderId = (m.sender && (m.sender.id || m.sender.sub)) || m.senderId
          const senderName = (m.sender && (m.sender.name)) || m.senderName || senderId || 'anon'
          const mine = senderId && localUserId && senderId === localUserId
          const initials = (senderName || '').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              {!mine && <div style={{ width: 40, height: 40, borderRadius: 20, background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{initials}</div>}
              <div style={{ maxWidth: '70%', textAlign: mine ? 'right' : 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ color: mine ? '#0b57d0' : '#333' }}>{senderName}</strong>
                  <small style={{ color: '#666' }}>{m.ts ? new Date(m.ts).toLocaleTimeString() : ''}</small>
                </div>
                <div style={{ marginTop: 6, background: mine ? '#e6f0ff' : '#f6f6f8', padding: 8, borderRadius: 8 }}>{m.text}</div>
              </div>
              {mine && <div style={{ width: 40, height: 40 }} />}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <input value={text} onChange={handleInputChange} style={{ flex: 1, padding: '8px 10px' }} placeholder="Type a message..." />
        <button onClick={send} style={{ padding: '8px 12px' }} disabled={status !== 'connected' || !text}>Send</button>
      </div>
    </div>
  )
}
