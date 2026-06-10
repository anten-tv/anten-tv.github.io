#!/usr/bin/env node
// One-time seed tool: extracts tower Point placemarks from a KMZ and emits
// draft tower JSON to stdout for HUMAN CURATION — never run in CI, output is
// not committed as-is. GroundOverlay nodes (copyrighted coverage imagery)
// are ignored entirely; only point facts are extracted.
//
// Usage: node scripts/ingest-kmz.mjs scripts/sources/file.kmz [--channel 33] [--operator SDTV] [--source "sdtv.vn file.kmz"] [--source-date 2023-09-20]

import { readFileSync } from 'node:fs'
import JSZip from 'jszip'
import { DOMParser } from '@xmldom/xmldom'

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
if (!file) {
  console.error('Usage: node scripts/ingest-kmz.mjs <file.kmz> [--channel N] [--operator OP] [--source S] [--source-date D]')
  process.exit(1)
}
const opt = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : null
}
const defaultChannel = opt('channel') ? Number(opt('channel')) : null
const defaultOperator = opt('operator') ?? 'unknown'
const source = opt('source') ?? file.split('/').pop()
const sourceDate = opt('source-date')

const zip = await JSZip.loadAsync(readFileSync(file))
const kmlName = Object.keys(zip.files).find((n) => n.endsWith('.kml'))
if (!kmlName) {
  console.error('No .kml inside KMZ')
  process.exit(1)
}
let kml = await zip.files[kmlName].async('string')
// Google-Earth KMZs often use gx:/atom: prefixes without declaring them —
// declare common ones so the strict parser accepts the file
kml = kml.replace(/<kml\b([^>]*)>/, (m, attrs) => {
  const add = [
    ['xmlns:gx', 'http://www.google.com/kml/ext/2.2'],
    ['xmlns:atom', 'http://www.w3.org/2005/Atom'],
    ['xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance'],
  ]
    .filter(([k]) => !attrs.includes(k))
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('')
  return `<kml${attrs}${add}>`
})
const doc = new DOMParser({
  onError: (level, msg) => {
    if (level === 'fatalError') console.error(`KML parse: ${msg}`)
  },
}).parseFromString(kml, 'text/xml')

const text = (el, tag) => {
  const n = el.getElementsByTagName(tag)[0]
  return n ? n.textContent.trim() : null
}

// strip tags from description HTML, keep readable text
const stripHtml = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const placemarks = doc.getElementsByTagName('Placemark')
const drafts = []
for (let i = 0; i < placemarks.length; i++) {
  const pm = placemarks[i]
  const coordsNode = pm.getElementsByTagName('Point')[0]
  if (!coordsNode) continue // skip non-Point placemarks (lines, polygons)
  const coords = text(coordsNode, 'coordinates')
  if (!coords) continue
  const [lon, lat] = coords.split(',').map(Number)

  const name = text(pm, 'name') ?? `tram-${i}`
  const descHtml = text(pm, 'description') ?? ''
  const desc = stripHtml(descHtml)

  // Tên Trạm / Địa Chỉ from the description table when present
  const tenTram = /Tên Trạm:?\s*([^|]+?)(?=Địa Chỉ|Anten|$)/i.exec(desc)?.[1]?.trim()
  const diaChi = /Địa Chỉ:?\s*(.+?)(?=Anten|Độ cao|Tọa độ|$)/i.exec(desc)?.[1]?.trim()
  const heightMatch = /(\d{2,3})\s*m\b/i.exec(desc)
  const chMatch =
    /Kênh\s*(\d{2})\b/i.exec(`${name} ${desc}`) ??
    /K\.?\s?(\d{2})\b/.exec(`${name} ${desc}`)

  drafts.push({
    id: slugify(tenTram ?? name),
    name: (tenTram ?? name).replace(/^Trạm\s+/i, 'Trạm '),
    lat,
    lon,
    province: 'FIXME',
    addressOld: diaChi ?? null,
    muxes: [
      {
        channel: chMatch ? Number(chMatch[1]) : defaultChannel,
        operator: defaultOperator,
        status: 'active',
      },
    ],
    polarization: null,
    heightM: heightMatch ? Number(heightMatch[1]) : null,
    erpKw: null,
    status: 'active',
    source,
    sourceUrl: null,
    sourceDate,
    verified: false,
    notes: null,
    _rawName: name,
    _rawDesc: desc.slice(0, 200),
  })
}

console.log(JSON.stringify(drafts, null, 2))
console.error(`# ${drafts.length} point placemarks from ${file}`)
