// Generates the PWA icons (gold disc with a soft glow on midnight indigo)
// without any native image dependency: raw RGBA -> PNG via zlib.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y)
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}
const bg = [12, 14, 31], gold = [217, 168, 78]
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
function icon(size) {
  const c = size / 2, r = size * 0.22
  return png(size, (x, y) => {
    const d = Math.hypot(x - c, y - c)
    if (d <= r) return gold
    if (d <= r + 1.5) return mix(gold, bg, d - r)
    const glow = Math.max(0, 1 - (d - r) / (size * 0.34))
    const ring = Math.abs(d - size * 0.42) < size * 0.008 ? 0.35 : 0
    return mix(bg, gold, Math.max(glow * glow * 0.45, ring))
  })
}
mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', icon(192))
writeFileSync('public/icons/icon-512.png', icon(512))
writeFileSync('public/icons/apple-touch-icon.png', icon(180))
console.log('icons written')
