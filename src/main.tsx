import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'
import { vi } from './lib/i18n/vi'

registerSW({
  onOfflineReady() {
    // lightweight toast — no dependency
    const el = document.createElement('div')
    el.className = 'offline-ready-toast'
    el.textContent = vi.offlineReady
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 4000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
