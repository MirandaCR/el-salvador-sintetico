// serve.mjs - servidor estatico minimo (sin dependencias) para ver el dashboard.
// Uso: npm run serve  ->  abre http://localhost:5173
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { extname, join, normalize } from 'path'

const ROOT = 'dashboard'
const PORT = 5173
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.geojson': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' }

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0])
    if (p === '/') p = '/index.html'
    const file = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''))
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('404')
  }
}).listen(PORT, () => console.log(`\n  Dashboard en:  http://localhost:${PORT}\n  (Ctrl+C para detener)\n`))
