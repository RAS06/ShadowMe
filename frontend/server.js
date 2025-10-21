const http = require('http')
const fs = require('fs')
const path = require('path')

const port = process.env.PORT || 3001
const distDir = path.join(__dirname, 'dist')

function sendFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase()
  const map = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  }
  const contentType = map[ext] || 'application/octet-stream'
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0]
  if (urlPath === '/') urlPath = '/index.html'
  const filePath = path.join(distDir, decodeURIComponent(urlPath))
  // prevent directory traversal
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  sendFile(filePath, res)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend static server listening on port ${port}`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
