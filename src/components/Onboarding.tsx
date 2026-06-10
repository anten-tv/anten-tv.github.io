import { useState } from 'react'
import { vi } from '../lib/i18n/vi'

const LS_KEY = 'antenvn-onboarded'

export function shouldShowOnboarding(): boolean {
  try {
    return localStorage.getItem(LS_KEY) !== '1'
  } catch {
    return false
  }
}

const CARDS = [
  { title: vi.onboarding1Title, body: vi.onboarding1Body, icon: '📡' },
  { title: vi.onboarding2Title, body: vi.onboarding2Body, icon: '🧭' },
  { title: vi.onboarding3Title, body: vi.onboarding3Body, icon: '📴' },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)

  const finish = () => {
    try {
      localStorage.setItem(LS_KEY, '1')
    } catch {
      /* private mode */
    }
    onDone()
  }

  const card = CARDS[step]
  const last = step === CARDS.length - 1

  return (
    <div className="onboarding" role="dialog">
      <div className="onboarding-card">
        <div className="onboarding-icon" aria-hidden="true">
          {card.icon}
        </div>
        <h2>{card.title}</h2>
        <p>{card.body}</p>
        <div className="onboarding-dots">
          {CARDS.map((_, i) => (
            <span key={i} className={i === step ? 'dot active' : 'dot'} />
          ))}
        </div>
        <div className="onboarding-actions">
          <button className="btn-secondary" onClick={finish}>
            {vi.onboardingSkip}
          </button>
          <button
            className="btn-primary"
            onClick={() => (last ? finish() : setStep(step + 1))}
          >
            {last ? vi.onboardingDone : vi.onboardingNext}
          </button>
        </div>
      </div>
    </div>
  )
}
