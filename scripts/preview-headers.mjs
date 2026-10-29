import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

/**
 * Preview local com os MESMOS headers de segurança de produção (public/_headers).
 * Usado para validar CSP, frame-ancestors e cache antes do deploy.
 * Uso: npm run build && node scripts/preview-headers.mjs
 */

const ROOT = join(process.cwd(), 'dist')
const PORT = 4180

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; worker-src 'self' blob:; child-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  let path = decodeURIComponent(url.pathname)
  if (path.endsWith('/')) path += 'index.html'

  const target = normalize(join(ROOT, path))
  const file = existsSync(target) && statSync(target).isFile()
    ? target
    : join(ROOT, 'index.html')

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value)
  }
  res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')

  createReadStream(file).pipe(res)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Preview com headers de segurança: http://localhost:${PORT}`)
})
