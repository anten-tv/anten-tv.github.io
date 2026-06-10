import { useEffect, useRef, useState } from 'react'

export interface LatLon {
  lat: number
  lon: number
  accuracyM?: number
  /** where this fix came from — manual pin, live GPS, or stored last fix */
  kind: 'live' | 'last-known' | 'manual'
}

export type GeoStatus = 'idle' | 'locating' | 'ok' | 'denied' | 'unavailable'

const LS_KEY = 'antenvn-last-fix'

function readLastFix(): LatLon | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as { lat: number; lon: number }
    if (typeof p.lat !== 'number' || typeof p.lon !== 'number') return null
    return { ...p, kind: 'last-known' }
  } catch {
    return null
  }
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [live, setLive] = useState<LatLon | null>(null)
  const [manual, setManual] = useState<LatLon | null>(null)
  const lastKnown = useRef<LatLon | null>(readLastFix())
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }
    setStatus('locating')
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const fix: LatLon = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          kind: 'live',
        }
        setLive(fix)
        setStatus('ok')
        try {
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({ lat: fix.lat, lon: fix.lon }),
          )
        } catch {
          /* storage full/blocked — fine */
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 120000 },
    )
    return () => {
      if (watchId.current !== null)
        navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  // manual pin wins (user said so), then live GPS, then stored last fix
  const position = manual ?? live ?? lastKnown.current

  return { position, live, status, manual, setManual }
}
