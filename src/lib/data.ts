import { COVERAGE_URL_BASE, DATA_URL } from '../config'
import { primaryOperator } from './operators'
import type { Tower, TowersFile } from '../types'
import snapshot from '../../data/towers.json'

// Build-time-baked snapshot: the app is fully functional on first offline
// launch; the live fetch only freshens it.
const BUNDLED = snapshot as unknown as TowersFile

// Deep enough that a malformed remote file can never crash installed
// clients (there is no redeploy path to fix them) — any bad tower record
// rejects the whole file and the bundled snapshot is used instead.
function towerValid(t: unknown): boolean {
  if (typeof t !== 'object' || t === null) return false
  const x = t as Record<string, unknown>
  return (
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    typeof x.lat === 'number' &&
    x.lat >= 8 &&
    x.lat <= 24 &&
    typeof x.lon === 'number' &&
    x.lon >= 101 &&
    x.lon <= 111 &&
    Array.isArray(x.muxes) &&
    x.muxes.length > 0 &&
    x.muxes.every(
      (m) =>
        typeof m === 'object' &&
        m !== null &&
        typeof (m as Record<string, unknown>).channel === 'number' &&
        typeof (m as Record<string, unknown>).operator === 'string' &&
        typeof (m as Record<string, unknown>).status === 'string',
    ) &&
    typeof x.status === 'string' &&
    typeof x.verified === 'boolean'
  )
}

function looksValid(d: unknown): d is TowersFile {
  if (typeof d !== 'object' || d === null) return false
  const f = d as TowersFile
  return (
    f.version === 1 &&
    typeof f.updated === 'string' &&
    Array.isArray(f.towers) &&
    f.towers.length > 0 &&
    f.towers.every(towerValid)
  )
}

export async function loadTowers(): Promise<TowersFile> {
  try {
    const res = await fetch(DATA_URL)
    if (res.ok) {
      const data: unknown = await res.json()
      if (looksValid(data)) return data
    }
  } catch {
    // offline or blocked — snapshot below
  }
  return BUNDLED
}

// Coverage polygons, remote-first like loadTowers(): merged data PRs go live
// without redeploy, and the build-time-baked copies keep coverage working
// offline or before the remote data branch exists. Lazy-imported per tower so
// none of the ~43 polygons land in the entry bundle.
const BUNDLED_COVERAGE = import.meta.glob('../../data/coverage/*.geojson', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

export async function loadCoverage(
  id: string,
): Promise<GeoJSON.FeatureCollection | null> {
  try {
    const res = await fetch(`${COVERAGE_URL_BASE}${id}.geojson`)
    if (res.ok) return (await res.json()) as GeoJSON.FeatureCollection
  } catch {
    // offline or blocked — bundled fallback below
  }
  const bundled = BUNDLED_COVERAGE[`../../data/coverage/${id}.geojson`]
  if (!bundled) return null
  try {
    return JSON.parse(await bundled()) as GeoJSON.FeatureCollection
  } catch {
    return null
  }
}

export function towersToGeoJSON(towers: Tower[]) {
  return {
    type: 'FeatureCollection' as const,
    features: towers.map((t) => ({
      type: 'Feature' as const,
      id: t.id,
      geometry: { type: 'Point' as const, coordinates: [t.lon, t.lat] },
      properties: {
        id: t.id,
        name: t.name,
        status: t.status,
        operator: primaryOperator(t),
        verified: t.verified,
        channels: t.muxes.map((m) => `K${m.channel}`).join(' '),
      },
    })),
  }
}
