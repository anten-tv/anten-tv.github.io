import { describe, expect, it } from 'vitest'
import {
  angleDiffDeg,
  cardinalIndex16,
  haversineKm,
  initialBearingDeg,
} from './geo'

// Reference fixtures computed with standard great-circle formulas
const HANOI = { lat: 21.0285, lon: 105.8542 }
const HCMC = { lat: 10.7769, lon: 106.7009 }
const DANANG = { lat: 16.0544, lon: 108.2022 }

describe('haversineKm', () => {
  it('Hà Nội → TP.HCM ≈ 1143 km', () => {
    const d = haversineKm(HANOI.lat, HANOI.lon, HCMC.lat, HCMC.lon)
    expect(d).toBeGreaterThan(1130)
    expect(d).toBeLessThan(1155)
  })

  it('zero distance for identical points', () => {
    expect(haversineKm(16, 108, 16, 108)).toBe(0)
  })

  it('short distance accurate to metres: 0.01° lat ≈ 1.11 km', () => {
    expect(haversineKm(10, 106, 10.01, 106)).toBeCloseTo(1.112, 2)
  })
})

describe('initialBearingDeg', () => {
  it('due north = 0°', () => {
    expect(initialBearingDeg(10, 106, 11, 106)).toBeCloseTo(0, 5)
  })

  it('due east ≈ 90°', () => {
    expect(initialBearingDeg(10, 106, 10, 107)).toBeCloseTo(90, 0)
  })

  it('Hà Nội → TP.HCM heads south-southeast (~175°)', () => {
    const b = initialBearingDeg(HANOI.lat, HANOI.lon, HCMC.lat, HCMC.lon)
    expect(b).toBeGreaterThan(170)
    expect(b).toBeLessThan(180)
  })

  it('Đà Nẵng → Hà Nội heads northwest (~336°)', () => {
    const b = initialBearingDeg(DANANG.lat, DANANG.lon, HANOI.lat, HANOI.lon)
    expect(b).toBeGreaterThan(330)
    expect(b).toBeLessThan(342)
  })
})

describe('cardinalIndex16', () => {
  it('0° → Bắc (0)', () => expect(cardinalIndex16(0)).toBe(0))
  it('90° → Đông (4)', () => expect(cardinalIndex16(90)).toBe(4))
  it('237° → Tây Tây Nam (11)', () => expect(cardinalIndex16(237)).toBe(11))
  it('354° wraps to Bắc (0)', () => expect(cardinalIndex16(354)).toBe(0))
})

describe('angleDiffDeg', () => {
  it('wraps across 0: 359 vs 1 = −2', () => {
    expect(angleDiffDeg(359, 1)).toBe(-2)
  })
  it('symmetric: 1 vs 359 = +2', () => {
    expect(angleDiffDeg(1, 359)).toBe(2)
  })
  it('no wrap needed: 100 vs 90 = 10', () => {
    expect(angleDiffDeg(100, 90)).toBe(10)
  })
})
