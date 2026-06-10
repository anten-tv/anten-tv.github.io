import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { TowerList } from './components/TowerList'
import { TowerDetailSheet } from './components/TowerDetailSheet'
import { AimView } from './components/AimView'
import { OfflineBadge } from './components/OfflineBadge'
import { Onboarding, shouldShowOnboarding } from './components/Onboarding'
import { useGeolocation } from './hooks/useGeolocation'
import { useHeading } from './hooks/useHeading'
import { useTowers } from './hooks/useTowers'
import { vi } from './lib/i18n/vi'
import { OPERATOR_COLORS } from './lib/operators'
import { REPO_URL } from './config'

// maplibre-gl is ~80% of the bundle — keep it out of the entry chunk
const MapView = lazy(() =>
  import('./components/MapView').then((m) => ({ default: m.MapView })),
)

type View = 'map' | 'list' | 'aim'

// currentColor strokes so the active tab tints the icon along with the label
const NAV_ICON_PATHS: Record<View, ReactNode> = {
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  list: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" />
    </>
  ),
  aim: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.3 4.7-4.7 2.3 2.3-4.7z" />
    </>
  ),
}

function NavIcon({ name }: { name: View }) {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {NAV_ICON_PATHS[name]}
    </svg>
  )
}

export default function App() {
  const [view, setView] = useState<View>('map')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCoverage, setShowCoverage] = useState(true)
  const [pickMode, setPickMode] = useState(false)
  const [onboarding, setOnboarding] = useState(shouldShowOnboarding)

  const geo = useGeolocation()
  const { meta, towers } = useTowers(geo.position)
  const heading = useHeading(view === 'aim')

  const selected = useMemo(
    () => towers.find((t) => t.id === selectedId) ?? null,
    [towers, selectedId],
  )
  // aim target: explicit selection, else nearest active tower
  const aimTarget =
    selected ?? towers.find((t) => t.status === 'active') ?? towers[0] ?? null

  return (
    <div className="app">
      {onboarding && <Onboarding onDone={() => setOnboarding(false)} />}

      <header className="app-header">
        <h1>{vi.appName}</h1>
        <OfflineBadge meta={meta} />
        <a
          className="contribute-link"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
        >
          {vi.contribute}
        </a>
      </header>

      <main className="app-main">
        {view === 'map' && (
          <>
            <Suspense fallback={<p className="map-loading">{vi.loadingMap}</p>}>
              <MapView
                towers={towers}
                selectedId={selectedId}
                position={geo.position}
                showCoverage={showCoverage}
                pickMode={pickMode}
                onSelect={setSelectedId}
                onPick={(lat, lon) => {
                  geo.setManual({ lat, lon, kind: 'manual' })
                  setPickMode(false)
                  setView('aim') // pick is only started from the aim flow
                }}
              />
            </Suspense>
            <label className="coverage-toggle toggle">
              <input
                type="checkbox"
                checked={showCoverage}
                onChange={(e) => setShowCoverage(e.target.checked)}
              />
              {vi.coverageToggle}
            </label>
            <div className="map-legend" aria-hidden="true">
              {Object.entries(OPERATOR_COLORS).map(([op, color]) => (
                <span key={op} className="map-legend-item">
                  <i style={{ background: color }} />
                  {op}
                </span>
              ))}
            </div>
            {pickMode && <p className="pick-banner">{vi.pickBanner}</p>}
            {selected && (
              <TowerDetailSheet
                tower={selected}
                onAim={() => setView('aim')}
                onClose={() => setSelectedId(null)}
              />
            )}
          </>
        )}

        {view === 'list' && (
          <TowerList
            towers={towers}
            hasPosition={geo.position !== null}
            geoStatus={geo.status}
            onSelect={(id) => {
              setSelectedId(id)
              setView('map')
            }}
          />
        )}

        {view === 'aim' && (
          <AimView
            tower={aimTarget}
            heading={heading}
            position={geo.position}
            geoStatus={geo.status}
            onManualPosition={(p) => geo.setManual(p)}
            onStartMapPick={() => {
              setPickMode(true)
              setView('map')
            }}
            onClearManual={() => geo.setManual(null)}
          />
        )}
      </main>

      <nav className="app-nav">
        <button
          className={view === 'map' ? 'active' : ''}
          onClick={() => setView('map')}
          aria-current={view === 'map' ? 'page' : undefined}
        >
          <NavIcon name="map" />
          <span className="nav-label">{vi.navMap}</span>
        </button>
        <button
          className={view === 'list' ? 'active' : ''}
          onClick={() => setView('list')}
          aria-current={view === 'list' ? 'page' : undefined}
        >
          <NavIcon name="list" />
          <span className="nav-label">{vi.navList}</span>
        </button>
        <button
          className={view === 'aim' ? 'active' : ''}
          onClick={() => setView('aim')}
          aria-current={view === 'aim' ? 'page' : undefined}
        >
          <NavIcon name="aim" />
          <span className="nav-label">{vi.navAim}</span>
        </button>
      </nav>
    </div>
  )
}
