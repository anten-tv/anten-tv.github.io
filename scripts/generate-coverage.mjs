#!/usr/bin/env node
// Terrain-aware ESTIMATED coverage polygons, one GeoJSON per tower.
// Maintainer-run; output committed to data/coverage/ so the app renders
// precomputed polygons offline at zero runtime cost.
//
// Model (deliberately simple, labeled "ước tính" in the UI):
// - max radius from the radio horizon: 4.12·(√h_tx + √h_rx) km, capped
// - 360°/AZ_STEP rays; along each ray, line-of-sight test against SRTM
//   terrain (AWS Terrain Tiles, terrarium encoding) every SAMPLE_M metres,
//   with 4/3-effective-earth-radius curvature (standard radio refraction)
// - per ray the furthest visible sample becomes the polygon vertex
//
// Usage: node scripts/generate-coverage.mjs [tower-id ...]   (default: all)

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PNG } from 'pngjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const TILE_CACHE = join(root, 'scripts/sources/terrain')
const OUT_DIR = join(root, 'data/coverage')
mkdirSync(TILE_CACHE, { recursive: true })
mkdirSync(OUT_DIR, { recursive: true })

const Z = 10 // ~153 m/px at the equator — plenty for 500 m sampling
const AZ_STEP = 2 // degrees between rays → 180 vertices
const SAMPLE_M = 500
const RX_HEIGHT_M = 10 // assumed receiver antenna height
const DEFAULT_TX_HEIGHT_M = 100
const MAX_RADIUS_KM = 100
const MIN_RADIUS_KM = 2 // never emit a degenerate polygon
const R_EFFECTIVE_M = (6371e3 * 4) / 3 // 4/3 earth radius (refraction)

// --- slippy tile math ---
const lon2tx = (lon, z) => ((lon + 180) / 360) * 2 ** z
const lat2ty = (lat, z) => {
  const rad = (lat * Math.PI) / 180
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z
  )
}

const tiles = new Map()
async function getTile(tx, ty) {
  const key = `${Z}-${tx}-${ty}`
  if (tiles.has(key)) return tiles.get(key)
  const file = join(TILE_CACHE, `${key}.png`)
  let buf
  if (existsSync(file)) {
    buf = readFileSync(file)
  } else {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`terrain tile ${key}: HTTP ${res.status}`)
    buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(file, buf)
  }
  const png = PNG.sync.read(buf)
  tiles.set(key, png)
  return png
}

async function elevationM(lat, lon) {
  const fx = lon2tx(lon, Z)
  const fy = lat2ty(lat, Z)
  const tx = Math.floor(fx)
  const ty = Math.floor(fy)
  const png = await getTile(tx, ty)
  const px = Math.min(png.width - 1, Math.floor((fx - tx) * png.width))
  const py = Math.min(png.height - 1, Math.floor((fy - ty) * png.height))
  const i = (py * png.width + px) * 4
  const [r, g, b] = [png.data[i], png.data[i + 1], png.data[i + 2]]
  return r * 256 + g + b / 256 - 32768
}

// destination point given start, bearing, distance (spherical earth)
function destination(lat, lon, bearingDeg, distM) {
  const δ = distM / 6371e3
  const θ = (bearingDeg * Math.PI) / 180
  const φ1 = (lat * Math.PI) / 180
  const λ1 = (lon * Math.PI) / 180
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ),
  )
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
    )
  return [(φ2 * 180) / Math.PI, (((λ2 * 180) / Math.PI + 540) % 360) - 180]
}

async function coverageRay(tower, txElevM, bearingDeg, maxRadiusM) {
  // ray marching with running max elevation angle from the transmitter
  const txH = txElevM + (tower.heightM ?? DEFAULT_TX_HEIGHT_M)
  let maxAngle = -Infinity
  let furthestVisibleM = 0
  for (let d = SAMPLE_M; d <= maxRadiusM; d += SAMPLE_M) {
    const [lat, lon] = destination(tower.lat, tower.lon, bearingDeg, d)
    let ground
    try {
      ground = await elevationM(lat, lon)
    } catch {
      break // tile fetch failed (sea tiles exist, so this is a real error) — stop the ray
    }
    const curveDrop = (d * d) / (2 * R_EFFECTIVE_M)
    // receiver visible if its angle clears every terrain angle before it
    const rxAngle = (ground + RX_HEIGHT_M - curveDrop - txH) / d
    if (rxAngle >= maxAngle) furthestVisibleM = d
    const terrainAngle = (ground - curveDrop - txH) / d
    if (terrainAngle > maxAngle) maxAngle = terrainAngle
  }
  // floor applied at the end so a fully-shadowed ray still yields a sane
  // vertex instead of collapsing to the first sample distance
  return Math.max(furthestVisibleM, MIN_RADIUS_KM * 1000)
}

async function generate(tower) {
  const txElev = await elevationM(tower.lat, tower.lon)
  const hTx = tower.heightM ?? DEFAULT_TX_HEIGHT_M
  // radio horizon from height above sea level — hilltop sites see much
  // further than mast height alone suggests; LOS marching prunes the
  // overestimate for plateau sites surrounded by equally high terrain
  const hAsl = Math.max(txElev, 0) + hTx
  const horizonKm = 4.12 * (Math.sqrt(hAsl) + Math.sqrt(RX_HEIGHT_M))
  const maxRadiusM = Math.min(horizonKm, MAX_RADIUS_KM) * 1000

  const ring = []
  for (let az = 0; az < 360; az += AZ_STEP) {
    const reachM = await coverageRay(tower, txElev, az, maxRadiusM)
    const [lat, lon] = destination(tower.lat, tower.lon, az, reachM)
    ring.push([Number(lon.toFixed(5)), Number(lat.toFixed(5))])
  }
  ring.push(ring[0])

  const geojson = {
    type: 'Feature',
    properties: {
      towerId: tower.id,
      name: tower.name,
      estimated: true,
      model: `horizon+LOS srtm z${Z}, rx ${RX_HEIGHT_M}m, tx ${hTx}m AGL`,
    },
    geometry: { type: 'Polygon', coordinates: [ring] },
  }
  writeFileSync(
    join(OUT_DIR, `${tower.id}.geojson`),
    JSON.stringify(geojson),
  )
  return horizonKm
}

const { towers } = JSON.parse(
  readFileSync(join(root, 'data/towers.json'), 'utf8'),
)
const only = process.argv.slice(2)
const list = only.length ? towers.filter((t) => only.includes(t.id)) : towers

for (const tower of list) {
  const km = await generate(tower)
  console.log(
    `✓ ${tower.id} (h=${tower.heightM ?? `~${DEFAULT_TX_HEIGHT_M}`}m, horizon ${km.toFixed(0)}km)`,
  )
}
console.log(`${list.length} coverage polygons → data/coverage/`)
