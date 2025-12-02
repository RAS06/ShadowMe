const WebSocket = require('ws')
const fs = require('fs')
const token = fs.readFileSync('/tmp/ws_token.txt', 'utf8').trim()
const room = process.argv[2] || `debug:ws:${Date.now()}`
const url = `ws://127.0.0.1:4000/?token=${token}`
console.log('Connecting to', url)
const ws = new WebSocket(url)
ws.on('open', () => {
  console.log('open')
  ws.send(JSON.stringify({ type: 'join', room }))
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'message', room, text: 'Hello from WS test ' + new Date().toISOString() }))
  }, 250)
})
ws.on('message', (m) => console.log('recv:', m.toString()))
ws.on('close', () => console.log('closed'))
ws.on('error', (e) => console.error('ws error', e && e.message))
setTimeout(() => ws.close(), 2000)
