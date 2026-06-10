import { useState } from 'react'
import { vi } from '../lib/i18n/vi'
import provinces from '../../data/aux/provinces.json'
import type { LatLon } from '../hooks/useGeolocation'
import type { Province } from '../types'

const PROVINCES = provinces as Province[]

interface Props {
  onPick: (p: LatLon) => void
  /** when set, the parent offers map-tap picking too */
  onStartMapPick?: () => void
}

/**
 * Tier 3 fallback: no GPS. Province centroids ship in the bundle, so this
 * works fully offline; map-tap picking is offered when the map is available.
 */
export function ManualLocationPicker({ onPick, onStartMapPick }: Props) {
  const [slug, setSlug] = useState('')

  return (
    <div className="manual-picker">
      <p>{vi.manualLocationHint}</p>
      <label>
        {vi.pickProvince}
        <select
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            const p = PROVINCES.find((x) => x.slug === e.target.value)
            if (p) onPick({ lat: p.lat, lon: p.lon, kind: 'manual' })
          }}
        >
          <option value="" disabled>
            —
          </option>
          {PROVINCES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {onStartMapPick && (
        <button className="btn-secondary" onClick={onStartMapPick}>
          {vi.manualLocation}
        </button>
      )}
    </div>
  )
}
