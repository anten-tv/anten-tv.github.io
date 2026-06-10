import type { Tower } from '../types'

// Each tower is run by a single operator in practice, so the first mux
// is authoritative for marker colors.
export const OPERATOR_COLORS: Record<string, string> = {
  VTV: '#2563eb',
  SDTV: '#16a34a',
}

// Operator not in the palette (new data) — distinct from status colors.
export const OPERATOR_FALLBACK_COLOR = '#7c3aed'

export function primaryOperator(t: Tower): string {
  return t.muxes[0]?.operator ?? ''
}

export function operatorColor(op: string): string {
  return OPERATOR_COLORS[op] ?? OPERATOR_FALLBACK_COLOR
}
