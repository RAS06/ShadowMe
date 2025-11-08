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
  // Proxy API requests starting with /api/ to backend (http://localhost:3000)
  if (req.url.startsWith('/api/')) {
    const target = new URL('http://127.0.0.1:3000' + req.url)
    const proxyReq = http.request({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + (target.search || ''),
      method: req.method,
      headers: req.headers
    }, proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res, { end: true })
    })
    proxyReq.on('error', err => {
      console.error('Proxy error', err)
      res.writeHead(502)
      res.end('Bad Gateway')
    })
    // forward request body
    req.pipe(proxyReq, { end: true })
    return
  }

  let urlPath = req.url.split('?')[0]
  if (urlPath === '/') urlPath = '/index.html'
  const filePath = path.join(distDir, decodeURIComponent(urlPath))
  // prevent directory traversal
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  // If the requested file doesn't exist, serve index.html so the SPA router can handle client-side routes
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(distDir, 'index.html')
      return sendFile(indexPath, res)
    }
    sendFile(filePath, res)
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend static server listening on port ${port}`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
