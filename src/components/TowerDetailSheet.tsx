import { channelChip } from "../lib/freq";
import { cardinalIndex16 } from "../lib/geo";
import { vi } from "../lib/i18n/vi";
import { ISSUE_URL } from "../config";
import type { RankedTower } from "../hooks/useTowers";

interface Props {
  tower: RankedTower;
  onAim: () => void;
  onClose: () => void;
}

const STATUS_LABEL = {
  active: vi.towerActive,
  inactive: vi.towerInactive,
  unknown: vi.towerUnknown,
} as const;

export function TowerDetailSheet({ tower, onAim, onClose }: Props) {
  const vintage = tower.sourceDate
    ? `${tower.sourceDate.slice(5, 7)}/${tower.sourceDate.slice(0, 4)}`
    : null;

  return (
    <div className="detail-sheet" role="dialog" aria-label={tower.name}>
      <div className="sheet-head">
        <h2>{tower.name}</h2>
        <button className="sheet-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </div>
      {tower.addressOld && <p className="detail-address">{tower.addressOld}</p>}

      <div className="detail-meta">
        <span className={`status-${tower.status}`}>
          {STATUS_LABEL[tower.status]}
          {tower.verified && ` · ${vi.verifiedBadge}`}
        </span>
        {tower.distanceKm !== null && tower.bearingDeg !== null && (
          <span>
            {tower.distanceKm.toFixed(1)} km · {Math.round(tower.bearingDeg)}° (
            {vi.cardinals[cardinalIndex16(tower.bearingDeg)]})
          </span>
        )}
        {tower.heightM !== null && (
          <span>
            {vi.heightShort} {tower.heightM} m
          </span>
        )}
        <span>
          {tower.polarization
            ? `${vi.polarizationShort} ${tower.polarization}`
            : vi.polarizationUnknownShort}
        </span>
      </div>

      <h3>{vi.channels}</h3>
      <table className="mux-table">
        <tbody>
          {tower.muxes.map((m) => (
            <tr
              key={`${m.channel}-${m.operator}`}
              className={m.status !== "active" ? "mux-inactive" : ""}
            >
              <td>{channelChip(m.channel)}</td>
              <td>
                {m.operator}
                {m.status !== "active" && ` — ${STATUS_LABEL[m.status]}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="provenance">
        {vi.sourceLabel}: {tower.source}
        {vintage && `, ${vintage}`}
        {!tower.verified && ` — ${vi.unverified}`}
      </p>

      <div className="sheet-actions">
        <a
          className="btn-secondary"
          href={`${ISSUE_URL}&title=${encodeURIComponent(`[${tower.id}] `)}`}
          target="_blank"
          rel="noreferrer"
        >
          {vi.reportError}
        </a>
        <button className="btn-primary" onClick={onAim}>
          {vi.aimCta}
        </button>
      </div>
    </div>
  );
}
