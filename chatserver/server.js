const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const jwt = require('jsonwebtoken')
const fetch = global.fetch || require('node-fetch')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000
// Default to localhost so the chatserver persists messages to a locally-running backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000'
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string'

app.get('/health', (req, res) => res.json({ ok: true }))

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// Simple room management: map roomId -> Set of ws connections
const rooms = new Map()

function joinRoom(ws, roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set())
  rooms.get(roomId).add(ws)
  ws._rooms = ws._rooms || new Set()
  ws._rooms.add(roomId)
}

function leaveAllRooms(ws) {
  if (!ws._rooms) return
  for (const r of ws._rooms) {
    const s = rooms.get(r)
    if (s) s.delete(ws)
    if (s && s.size === 0) rooms.delete(r)
  }
  ws._rooms.clear()
}

function getRoomUsers(roomId) {
  const s = rooms.get(roomId)
  if (!s) return []
  const users = []
  for (const client of s) {
    if (client && client._auth) users.push({ id: client._auth.sub || client._auth.sub, name: client._auth.email || client._auth.sub, role: client._auth.role })
  }
  return users
}

function broadcastToRoom(roomId, messageObj) {
  const s = rooms.get(roomId)
  if (!s) return
  const data = JSON.stringify(messageObj)
  for (const client of s) {
    if (client.readyState === WebSocket.OPEN) client.send(data)
  }
}

wss.on('connection', (ws, req) => {
  // verify token from query param: ?token=...
  let url
  let rawToken
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    rawToken = url.searchParams.get('token')
    if (!rawToken) {
      ws.send(JSON.stringify({ type: 'error', message: 'missing token' }))
      return ws.close()
    }
    let payload
    try {
      payload = jwt.verify(rawToken, JWT_SECRET)
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'invalid token' }))
      return ws.close()
    }
    ws._auth = payload
    // store raw token for future backend POSTs
    ws._rawToken = rawToken
  } catch (e) {
    ws.send(JSON.stringify({ type: 'error', message: 'auth failure' }))
    return ws.close()
  }

  // Accept messages as JSON with shape { type: 'join'|'message', room: string, text?: '' }
  ws.on('message', async (msg) => {
    let data
    try { data = JSON.parse(msg) } catch (e) { return }
    if (data.type === 'join' && data.room) {
      joinRoom(ws, data.room)
      // ack
      ws.send(JSON.stringify({ type: 'joined', room: data.room }))
      // broadcast presence update for this room
      try {
        const users = getRoomUsers(data.room)
        broadcastToRoom(data.room, { type: 'presence', room: data.room, users })
      } catch (e) {}
      return
    }
    if (data.type === 'message' && data.room && data.text) {
      // Broadcast to the room
      const out = {
        type: 'message',
        room: data.room,
        sender: { id: ws._auth.sub || ws._auth.sub, name: ws._auth.email || ws._auth.sub, role: ws._auth.role },
        text: String(data.text),
        ts: new Date().toISOString()
      }
      broadcastToRoom(data.room, out)

      // Persist via backend API (POST /api/chat/messages)
      try {
        await fetch(`${BACKEND_URL}/api/chat/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ws._rawToken}` },
          body: JSON.stringify({ roomId: data.room, text: data.text, ts: out.ts })
        })
      } catch (e) {
        console.warn('Failed to persist message to backend', e && e.message)
      }
      return
    }
    if (data.type === 'typing' && data.room) {
      // broadcast typing status to other clients in room
      const ty = { type: 'typing', room: data.room, sender: { id: ws._auth.sub || ws._auth.sub, name: ws._auth.email || ws._auth.sub, role: ws._auth.role }, typing: !!data.typing }
      broadcastToRoom(data.room, ty)
      return
    }
  })

  ws.on('close', () => {
    // notify presence change for rooms this client was in
    const impacted = ws._rooms ? Array.from(ws._rooms) : []
    leaveAllRooms(ws)
    for (const r of impacted) {
      try {
        const users = getRoomUsers(r)
        broadcastToRoom(r, { type: 'presence', room: r, users })
      } catch (e) {}
    }
  })
})

server.listen(PORT, () => {
  console.log(`Chat server listening on ${PORT}`)
})
