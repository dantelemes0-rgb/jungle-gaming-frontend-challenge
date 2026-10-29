import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Gera arte determinística para os NFTs e avatares.
 * O Figma é somente leitura (sem export), então os assets são recriados localmente
 * e a substituição é documentada em ARCHITECTURE.md.
 */

const OUT = join(process.cwd(), 'public', 'assets')
mkdirSync(join(OUT, 'nfts'), { recursive: true })
mkdirSync(join(OUT, 'avatars'), { recursive: true })

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PALETTES = [
  ['#d28a4c', '#7a3e1d', '#1a0f0b'],
  ['#e89b55', '#8c4a22', '#1e120c'],
  ['#c9a66b', '#6b4a2a', '#17100c'],
  ['#e0b080', '#7a4b2a', '#1a120d'],
  ['#b46a3a', '#5e2f18', '#160d09'],
  ['#d9c3a5', '#7c5a3c', '#1b130e'],
]

function nftSvg(index) {
  const random = mulberry32(1000 + index * 37)
  const palette = PALETTES[index % PALETTES.length]
  const [accent, mid, deep] = palette
  const cx = 220 + random() * 200
  const cy = 220 + random() * 200
  const r1 = 120 + random() * 90
  const r2 = 60 + random() * 70
  const rotation = Math.floor(random() * 360)
  const bars = Array.from({ length: 5 }, (_, bar) => {
    const width = 20 + random() * 40
    const height = 80 + random() * 260
    const x = 40 + bar * 112 + random() * 18
    return `<rect x="${x.toFixed(1)}" y="${(600 - height).toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="8" fill="${accent}" opacity="${(0.06 + random() * 0.12).toFixed(2)}"/>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="640" height="640" role="img" aria-label="Arte generativa ${index}">
  <defs>
    <radialGradient id="g${index}" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="${mid}" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="${deep}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#070907"/>
    </radialGradient>
    <linearGradient id="l${index}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${mid}"/>
    </linearGradient>
    <filter id="blur${index}"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>
  <rect width="640" height="640" fill="url(#g${index})"/>
  ${bars}
  <g opacity="0.5" stroke="${accent}" stroke-width="1" fill="none">
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r1 + 60).toFixed(1)}" opacity="0.25"/>
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r1 + 30).toFixed(1)}" opacity="0.4"/>
  </g>
  <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r1.toFixed(1)}" fill="url(#l${index})" opacity="0.9"/>
  <circle cx="${(cx - 30).toFixed(1)}" cy="${(cy - 40).toFixed(1)}" r="${r2.toFixed(1)}" fill="#070907" opacity="0.55"/>
  <g transform="rotate(${rotation} ${cx.toFixed(1)} ${cy.toFixed(1)})" opacity="0.85">
    <rect x="${(cx - 160).toFixed(1)}" y="${(cy - 4).toFixed(1)}" width="320" height="8" rx="4" fill="${accent}" opacity="0.5"/>
    <rect x="${(cx - 4).toFixed(1)}" y="${(cy - 160).toFixed(1)}" width="8" height="320" rx="4" fill="${accent}" opacity="0.3"/>
  </g>
  <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="220" fill="${accent}" opacity="0.06" filter="url(#blur${index})"/>
  <text x="48" y="596" font-family="monospace" font-size="20" fill="${accent}" opacity="0.7">KURIO · ${String(index).padStart(3, '0')}</text>
</svg>`
}

function avatarSvg(index) {
  const random = mulberry32(500 + index * 13)
  const palette = PALETTES[(index + 2) % PALETTES.length]
  const [accent, mid] = palette
  const shapes = Array.from({ length: 3 }, (_, shape) => {
    const x = 20 + random() * 56
    const y = 20 + random() * 56
    const r = 10 + random() * 18
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${shape % 2 ? accent : mid}" opacity="0.7"/>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Avatar ${index}">
  <rect width="96" height="96" rx="48" fill="#121512"/>
  <circle cx="48" cy="48" r="40" fill="${mid}" opacity="0.25"/>
  ${shapes}
  <circle cx="48" cy="48" r="26" fill="${accent}" opacity="0.15"/>
</svg>`
}

for (let index = 1; index <= 24; index += 1) {
  writeFileSync(join(OUT, 'nfts', `nft-${String(index).padStart(2, '0')}.svg`), nftSvg(index))
}

for (let index = 1; index <= 4; index += 1) {
  writeFileSync(join(OUT, 'avatars', `avatar-${String(index).padStart(2, '0')}.svg`), avatarSvg(index))
}

writeFileSync(
  join(process.cwd(), 'public', 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#140d0a"/><text x="16" y="23" text-anchor="middle" font-family="sans-serif" font-size="21" font-weight="700" fill="#d28a4c">K</text></svg>`,
)

console.log('Arte gerada: 24 NFTs, 4 avatares, favicon.')
