// Generates public/vn-boundary.json — simplified Vietnam land polygon used by
// MapView to hide all basemap labels outside Vietnamese territory.
//
// Source: Natural Earth 10m admin_0 countries, Vietnam point-of-view variant
// (public domain). The POV file's VNM geometry includes the Hoàng Sa and
// Trường Sa archipelagos, which the default worldview file assigns elsewhere.
// Re-run only if the boundary file needs regenerating:
//   node scripts/generate-vn-boundary.mjs

import { writeFile } from 'node:fs/promises'
import * as turf from '@turf/turf'

const NE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_vnm.geojson'

// ~500 m tolerance: small enough that border-town labels resolve to the right
// side, large enough to keep the polygon cheap to evaluate per map feature
const TOLERANCE = 0.005
// below this area (~5 km²) an islet is too small to simplify meaningfully —
// it becomes a buffer octagon instead of being dropped, so labels anchored
// on small islands (Hoàng Sa / Trường Sa islets) still render
const MIN_RING_AREA = 5e-4
const ISLET_BUFFER_DEG = 0.03

function perpDist(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2
  const cx = a[0] + Math.max(0, Math.min(1, t)) * dx
  const cy = a[1] + Math.max(0, Math.min(1, t)) * dy
  return Math.hypot(p[0] - cx, p[1] - cy)
}

function douglasPeucker(points, tol) {
  if (points.length <= 2) return points
  let maxDist = 0
  let maxIdx = 0
  const a = points[0]
  const b = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], a, b)
    if (d > maxDist) {
      maxDist = d
      maxIdx = i
    }
  }
  if (maxDist <= tol) return [a, b]
  const left = douglasPeucker(points.slice(0, maxIdx + 1), tol)
  const right = douglasPeucker(points.slice(maxIdx), tol)
  return left.slice(0, -1).concat(right)
}

function ringArea(ring) {
  let sum = 0
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(sum / 2)
}

function round4(ring) {
  return ring.map(([x, y]) => [
    Math.round(x * 1e4) / 1e4,
    Math.round(y * 1e4) / 1e4,
  ])
}

function simplifyRing(ring) {
  const closed = round4(douglasPeucker(ring, TOLERANCE))
  // DP keeps endpoints, so the ring stays closed; need ≥4 points to be valid
  return closed.length >= 4 ? closed : null
}

// closed octagon of radius r (deg) around an islet's centroid — generous
// enough that the islet's label anchor falls inside despite tile quantization
function octagon([cx, cy], r) {
  const pts = []
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * 2 * Math.PI
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return round4(pts)
}

function centroid(ring) {
  let sx = 0
  let sy = 0
  for (const [x, y] of ring) {
    sx += x
    sy += y
  }
  return [sx / ring.length, sy / ring.length]
}

console.log('downloading Natural Earth countries (Vietnam POV)…')
const res = await fetch(NE_URL)
if (!res.ok) throw new Error(`download failed: ${res.status}`)
const world = await res.json()

const vn = world.features.find((f) => f.properties.ADM0_A3 === 'VNM')
if (!vn) throw new Error('VNM feature not found')

const polygons =
  vn.geometry.type === 'MultiPolygon'
    ? vn.geometry.coordinates
    : [vn.geometry.coordinates]

const kept = []
let islets = 0
for (const poly of polygons) {
  if (ringArea(poly[0]) < MIN_RING_AREA) {
    kept.push([octagon(centroid(poly[0]), ISLET_BUFFER_DEG)])
    islets++
    continue
  }
  const rings = poly
    .map(simplifyRing)
    .filter((r) => r && ringArea(r) >= MIN_RING_AREA)
  if (rings.length > 0) kept.push(rings)
}

// Bounding boxes around the two archipelago clusters so their group labels
// ("Quần đảo Hoàng Sa", "Quần đảo Trường Sa") — anchored in open water
// between the islets — also render. Kept tight so open-sea names stay out.
const CLUSTER_BOXES = [
  // Hoàng Sa (Paracel)
  [110.9, 15.6, 113.1, 17.2],
  // Trường Sa (Spratly) — around the NE-provided islets
  [113.7, 9.4, 116.1, 11.4],
]
for (const [w, s, e, n] of CLUSTER_BOXES) {
  kept.push([
    [
      [w, s],
      [e, s],
      [e, n],
      [w, n],
      [w, s],
    ],
  ])
}

// Natural Earth 10m omits most nearshore islands (Hạ Long / Bái Tử Long
// islets, Cù Lao Chàm, Hòn Tre, …), so their labels would be masked. A sea
// band buffered off the mainland coast covers them. The band must not reach
// foreign territory: neighbor countries (plus a small sea margin off their
// coasts) are subtracted, while the original land polygons — pushed
// separately — keep VN border towns labeled. Overlapping polygons are fine:
// MapLibre's ["within"] treats a MultiPolygon as point-in-any.
const SEA_BAND_KM = 10
// wide enough to exclude foreign nearshore islets missing from Natural Earth
// (e.g. Cambodian Koh Ses north of Phú Quốc)
const NEIGHBOR_MARGIN_KM = 8
const ARCHIPELAGO_MIN_LON = 109.6

const mainlandRaw = turf.multiPolygon(
  polygons.filter((p) => p[0][0][0] <= ARCHIPELAGO_MIN_LON),
)
let band = turf.buffer(mainlandRaw, SEA_BAND_KM, { units: 'kilometers' })
for (const adm of ['CHN', 'LAO', 'KHM']) {
  const nb = world.features.find((f) => f.properties.ADM0_A3 === adm)
  if (!nb) throw new Error(`${adm} feature not found`)
  const nbBuf = turf.buffer(nb, NEIGHBOR_MARGIN_KM, { units: 'kilometers' })
  band = turf.difference(turf.featureCollection([band, nbBuf]))
  if (!band) throw new Error(`sea band vanished subtracting ${adm}`)
}
band = turf.simplify(band, { tolerance: TOLERANCE, highQuality: false })
const bandPolys = (
  band.geometry.type === 'MultiPolygon'
    ? band.geometry.coordinates
    : [band.geometry.coordinates]
)
  .map((poly) => poly.map(round4).filter((r) => ringArea(r) >= MIN_RING_AREA))
  .filter((rings) => rings.length > 0)
kept.push(...bandPolys)

// Inhabited VN offshore islands absent from Natural Earth and beyond the sea
// band — curated [lon, lat, radius°] octagons. All west of the archipelago
// split, so they get the full mainland label policy.
const EXTRA_ISLANDS = [
  [107.97, 21.33, 0.04], // Vĩnh Thực (Quảng Ninh) — inside neighbor margin gap
  [107.96, 21.245, 0.04], // Đảo Trần (Quảng Ninh)
  [107.72, 20.13, 0.04], // Bạch Long Vĩ (Hải Phòng)
  [105.93, 19.36, 0.04], // Hòn Mê (Thanh Hóa)
  [105.97, 18.8, 0.03], // Hòn Mắt (Nghệ An)
  [107.34, 17.16, 0.03], // Cồn Cỏ (Quảng Trị)
  [108.51, 15.95, 0.07], // Cù Lao Chàm (Đà Nẵng)
  [109.11, 15.4, 0.07], // Lý Sơn (Quảng Ngãi)
  [104.83, 8.43, 0.04], // Hòn Khoai (Cà Mau)
  [104.52, 8.95, 0.03], // Hòn Chuối (Cà Mau)
  [104.37, 9.68, 0.08], // Nam Du (An Giang)
  [104.63, 9.8, 0.04], // Hòn Sơn / Lại Sơn (An Giang)
  [104.84, 9.97, 0.03], // Hòn Tre, Kiên Hải (An Giang)
  [104.33, 10.18, 0.04], // Quần đảo Hải Tặc (An Giang)
  [103.475, 9.3, 0.05], // Thổ Chu (An Giang)
]
for (const [lon, lat, r] of EXTRA_ISLANDS) {
  kept.push([octagon([lon, lat], r)])
}

// Two parts with different label policies in MapView: the mainland (plus
// nearshore islands) shows every label, the offshore archipelagos show only
// features that carry a Vietnamese name tag — OSM data there is dense with
// foreign-only-named reefs that must not surface in any language.
const mainland = kept.filter((p) => p[0][0][0] <= ARCHIPELAGO_MIN_LON)
const islands = kept.filter((p) => p[0][0][0] > ARCHIPELAGO_MIN_LON)

const out = {
  type: 'FeatureCollection',
  properties: {
    name: 'Vietnam territory boundary',
    source:
      'Natural Earth 10m admin_0, Vietnam POV (public domain), simplified; small islands buffered',
  },
  features: [
    {
      type: 'Feature',
      properties: { part: 'mainland' },
      geometry: { type: 'MultiPolygon', coordinates: mainland },
    },
    {
      type: 'Feature',
      properties: { part: 'islands' },
      geometry: { type: 'MultiPolygon', coordinates: islands },
    },
  ],
}

const json = JSON.stringify(out)
await writeFile(new URL('../public/vn-boundary.json', import.meta.url), json)
const points = kept.flat().reduce((n, ring) => n + ring.length, 0)
console.log(
  `wrote public/vn-boundary.json: ${mainland.length} mainland + ${islands.length} island polygons (${islets} buffered islets), ${points} points, ${(json.length / 1024).toFixed(1)} kB`,
)
