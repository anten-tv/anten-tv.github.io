import { vi } from '../lib/i18n/vi'
import { operatorColor, primaryOperator } from '../lib/operators'
import type { GeoStatus } from '../hooks/useGeolocation'
import type { RankedTower } from '../hooks/useTowers'

interface Props {
  towers: RankedTower[]
  hasPosition: boolean
  geoStatus: GeoStatus
  onSelect: (id: string) => void
}

export function TowerList({ towers, hasPosition, geoStatus, onSelect }: Props) {
  return (
    <div className="tower-list">
      {!hasPosition && (
        <p className="list-note">
          {geoStatus === 'locating' ? vi.locating : vi.locationDeniedList}
        </p>
      )}
      <ul>
        {towers.map((t) => (
          <li key={t.id}>
            <button className="tower-row" onClick={() => onSelect(t.id)}>
              <span
                className={`status-dot status-dot-${t.status}`}
                style={
                  t.status === 'active'
                    ? { background: operatorColor(primaryOperator(t)) }
                    : undefined
                }
              />
              <span className="tower-row-main">
                <span className="tower-row-name">{t.name}</span>
                <span className="tower-row-channels">
                  {t.muxes.map((m) => `K${m.channel}`).join(' · ')}
                  {!t.verified && ` — ${vi.unverified}`}
                </span>
              </span>
              {t.distanceKm !== null && (
                <span className="tower-row-dist">
                  {t.distanceKm < 100
                    ? t.distanceKm.toFixed(1)
                    : Math.round(t.distanceKm)}{' '}
                  km
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
