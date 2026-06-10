// Hand-written mirror of data/schema/towers.schema.json — the schema +
// validator in CI are the enforcement point, this is for the app only.

export type Operator =
  | 'SDTV'
  | 'VTV'
  | 'VTC'
  | 'DTV'
  | 'RTB'
  | 'AVG'
  | 'THVL'
  | 'unknown'

export type Status = 'active' | 'inactive' | 'unknown'

export interface Mux {
  channel: number // UHF 21–48; frequency derived, never stored
  operator: Operator
  status: Status
}

export interface Tower {
  id: string
  name: string
  lat: number
  lon: number
  province: string // slug into data/aux/provinces.json
  addressOld: string | null
  muxes: Mux[]
  polarization: 'H' | 'V' | null
  heightM: number | null
  erpKw: number | null
  status: Status // site-level; inactive only if ALL muxes inactive
  source: string
  sourceUrl: string | null
  sourceDate: string | null
  verified: boolean
  notes: string | null
}

export interface TowersFile {
  version: number
  updated: string
  towers: Tower[]
}

export interface Province {
  slug: string
  name: string
  oldNames: string[]
  lat: number
  lon: number
}
