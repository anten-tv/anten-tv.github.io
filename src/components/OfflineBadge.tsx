import { useEffect, useState } from 'react'
import { vi } from '../lib/i18n/vi'
import type { TowersFile } from '../types'

export function OfflineBadge({ meta }: { meta: TowersFile | null }) {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return (
    <div className="offline-badge">
      {!online && <span className="offline-pill">{vi.offline}</span>}
      {meta && (
        <span className="data-info">
          {vi.dataInfo(meta.towers.length, meta.updated)}
        </span>
      )}
    </div>
  )
}
