import { vi } from '../lib/i18n/vi'

export function CalibrationPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="calibration-prompt" role="alert">
      <div className="figure8" aria-hidden="true">
        ∞
      </div>
      <h3>{vi.calibrationTitle}</h3>
      <p>{vi.calibrationBody}</p>
      <button className="btn-secondary" onClick={onDismiss}>
        {vi.calibrationDismiss}
      </button>
    </div>
  )
}
