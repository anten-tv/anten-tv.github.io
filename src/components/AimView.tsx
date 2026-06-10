import { useEffect, useRef, useState } from 'react'
import { angleDiffDeg, cardinalIndex16 } from '../lib/geo'
import { channelChip } from '../lib/freq'
import { vi } from '../lib/i18n/vi'
import { CompassDial } from './CompassDial'
import { CalibrationPrompt } from './CalibrationPrompt'
import { ManualLocationPicker } from './ManualLocationPicker'
import type { HeadingHook } from '../hooks/useHeading'
import type { GeoStatus, LatLon } from '../hooks/useGeolocation'
import type { RankedTower } from '../hooks/useTowers'

interface Props {
  tower: RankedTower | null
  heading: HeadingHook
  position: LatLon | null
  geoStatus: GeoStatus
  onManualPosition: (p: LatLon) => void
  onStartMapPick: () => void
  onClearManual: () => void
}

export function AimView({
  tower,
  heading,
  position,
  geoStatus,
  onManualPosition,
  onStartMapPick,
  onClearManual,
}: Props) {
  const [inArc, setInArc] = useState(false)
  const inArcRef = useRef(false)
  const [calibrationDismissed, setCalibrationDismissed] = useState(false)

  const bearing = tower?.bearingDeg ?? null
  // clamp: never narrower than sensor honesty (10°), never so wide the arc
  // is meaningless on a badly calibrated compass (30°)
  const toleranceDeg = Math.min(Math.max(heading.accuracyDeg ?? 0, 10), 30)
  const HYSTERESIS_DEG = 4

  // in-arc boolean flips via setState (rare), heavy per-event work stays out
  // of React; exit threshold is wider than entry so the dial doesn't flicker
  // and vibrate-spam at the arc edge
  useEffect(() => {
    if (bearing === null) return
    return heading.subscribe((h) => {
      const diff = Math.abs(angleDiffDeg(h, bearing))
      const within = inArcRef.current
        ? diff <= toleranceDeg + HYSTERESIS_DEG
        : diff <= toleranceDeg
      if (within !== inArcRef.current) {
        inArcRef.current = within
        setInArc(within)
        if (within && 'vibrate' in navigator) navigator.vibrate(50)
      }
    })
  }, [heading, bearing, toleranceDeg])

  // Tier 3: no position at all → manual picker
  if (!position) {
    return (
      <div className="aim-view">
        <p className="aim-status">
          {geoStatus === 'locating' ? vi.locating : vi.locationDenied}
        </p>
        <ManualLocationPicker
          onPick={onManualPosition}
          onStartMapPick={onStartMapPick}
        />
      </div>
    )
  }

  if (!tower || bearing === null) {
    return (
      <div className="aim-view">
        <p className="aim-status">{vi.noDataRegion}</p>
      </div>
    )
  }

  const cardinal = vi.cardinals[cardinalIndex16(bearing)]
  const dist =
    tower.distanceKm !== null ? `${tower.distanceKm.toFixed(1)} km` : ''

  return (
    <div className="aim-view">
      <div className="aim-tower-info">
        <h2>{tower.name}</h2>
        <p>
          {dist} · {Math.round(bearing)}° — {cardinal}
        </p>
        <div className="chips">
          {tower.muxes.map((m) => (
            <span
              key={`${m.channel}-${m.operator}`}
              className={`chip${m.status !== 'active' ? ' chip-inactive' : ''}`}
            >
              {channelChip(m.channel)}
            </span>
          ))}
        </div>
      </div>

      {heading.state === 'active' && (
        <>
          <CompassDial
            heading={heading}
            targetBearing={bearing}
            toleranceDeg={toleranceDeg}
            inArc={inArc}
          />
          <p className="aim-hint">{vi.aimTolerance}</p>
          {heading.needsCalibration && !calibrationDismissed && (
            <CalibrationPrompt onDismiss={() => setCalibrationDismissed(true)} />
          )}
        </>
      )}

      {heading.state === 'needs-permission' && (
        <div className="permission-card">
          <p>{vi.compassExplainer}</p>
          <button
            className="btn-primary"
            onClick={() => void heading.requestPermission()}
          >
            {vi.enableCompass}
          </button>
        </div>
      )}

      {heading.state === 'denied' && (
        <div className="aim-tier2">
          <p className="permission-denied-note">{vi.compassDenied}</p>
          <Tier2Bearing bearing={bearing} cardinal={cardinal} />
        </div>
      )}

      {heading.state === 'unsupported' && (
        <div className="aim-tier2">
          <p className="aim-hint">{vi.aimNoCompass}</p>
          <Tier2Bearing bearing={bearing} cardinal={cardinal} />
        </div>
      )}

      {tower.polarization === null && (
        <p className="polarization-note">
          {vi.polarization}: {vi.polarizationUnknown}
        </p>
      )}
      {position.kind !== 'live' && (
        <p className="position-note">
          {position.kind === 'manual' ? vi.manualLocation : vi.lastKnownFix}
          {position.kind === 'manual' && (
            <>
              {' · '}
              <button className="link-button" onClick={onClearManual}>
                {vi.useGps}
              </button>
              {' · '}
              <button className="link-button" onClick={onStartMapPick}>
                {vi.pickOnMap}
              </button>
            </>
          )}
        </p>
      )}
    </div>
  )
}

/** Tier 2: no live compass — static rose + huge number + Vietnamese cardinal. */
function Tier2Bearing({ bearing, cardinal }: { bearing: number; cardinal: string }) {
  return (
    <div className="tier2-bearing">
      <div className="tier2-number">{Math.round(bearing)}°</div>
      <div className="tier2-cardinal">{cardinal}</div>
      <svg viewBox="0 0 120 120" className="tier2-rose" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--dial-tick)" strokeWidth="2" />
        <text x="60" y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#dc2626">B</text>
        <text x="60" y="112" textAnchor="middle" fontSize="12" fill="var(--dial-text)">N</text>
        <text x="110" y="64" textAnchor="middle" fontSize="12" fill="var(--dial-text)">Đ</text>
        <text x="10" y="64" textAnchor="middle" fontSize="12" fill="var(--dial-text)">T</text>
        <g transform={`rotate(${bearing} 60 60)`}>
          <path d="M 60 18 L 53 60 L 67 60 Z" fill="var(--accent)" />
        </g>
      </svg>
    </div>
  )
}
