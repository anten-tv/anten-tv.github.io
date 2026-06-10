import { useEffect, useMemo, useState } from 'react'
import { loadTowers } from '../lib/data'
import { haversineKm, initialBearingDeg } from '../lib/geo'
import type { Tower, TowersFile } from '../types'
import type { LatLon } from './useGeolocation'

export interface RankedTower extends Tower {
  distanceKm: number | null
  bearingDeg: number | null
}

export function useTowers(position: LatLon | null) {
  const [file, setFile] = useState<TowersFile | null>(null)

  useEffect(() => {
    let cancelled = false
    loadTowers().then((f) => {
      if (!cancelled) setFile(f)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const ranked: RankedTower[] = useMemo(() => {
    const towers = (file?.towers ?? []).filter((t) => t.status !== 'inactive')
    const withDist = towers.map((t) => ({
      ...t,
      distanceKm: position
        ? haversineKm(position.lat, position.lon, t.lat, t.lon)
        : null,
      bearingDeg: position
        ? initialBearingDeg(position.lat, position.lon, t.lat, t.lon)
        : null,
    }))
    // nearest first; de-rank non-active sites so a dead-but-near mast
    // doesn't outrank a live one slightly farther. Verified status is shown
    // as a label, not a ranking factor — distorting distance order would
    // mislead more than it helps while most records are unverified.
    return withDist.sort((a, b) => {
      const rank = (t: RankedTower) =>
        (t.distanceKm ?? 99999) + (t.status !== 'active' ? 500 : 0)
      return rank(a) - rank(b)
    })
  }, [file, position])

  return { meta: file, towers: ranked }
}
