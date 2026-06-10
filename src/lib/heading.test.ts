import { describe, expect, it } from 'vitest'
import {
  CircularEMA,
  HeadingJitter,
  normalizeAndroid,
  normalizeIOS,
} from './heading'

describe('normalizeIOS — compensation matrix', () => {
  it.each([
    // [webkitCompassHeading, screenAngle, expected heading]
    [123.4, 0, 123.4],
    [270, 90, 0],
    [300, 90, 30],
    [10, 270, 280],
    [0, 180, 180],
  ])('heading=%d° screen=%d° → %d°', (h, angle, expected) => {
    expect(normalizeIOS({ webkitCompassHeading: h }, angle)).toBeCloseTo(
      expected,
    )
  })
  it('null when missing', () => {
    expect(normalizeIOS({}, 0)).toBeNull()
  })
  it('null on negative (sensor unavailable marker)', () => {
    expect(normalizeIOS({ webkitCompassHeading: -1 }, 0)).toBeNull()
  })
})

describe('normalizeAndroid — compensation matrix', () => {
  // alpha = 360 − heading when portrait (screen angle 0)
  it.each([
    // [alpha, screenAngle, expected heading]
    [350, 0, 10],
    [350, 90, 100],
    [350, 180, 190],
    [350, 270, 280],
    [0, 0, 0],
    [90, 0, 270],
    [90, 90, 0],
  ])('alpha=%d° screen=%d° → %d°', (alpha, angle, expected) => {
    expect(normalizeAndroid({ alpha }, angle)).toBeCloseTo(expected)
  })

  it('null when alpha is null', () => {
    expect(normalizeAndroid({ alpha: null }, 0)).toBeNull()
  })

  it('rejects relative frame (absolute === false) — arbitrary origin is not a compass', () => {
    expect(normalizeAndroid({ alpha: 120, absolute: false }, 0)).toBeNull()
  })

  it('accepts absolute === true and undefined (deviceorientationabsolute)', () => {
    expect(normalizeAndroid({ alpha: 350, absolute: true }, 0)).toBeCloseTo(10)
    expect(normalizeAndroid({ alpha: 350 }, 0)).toBeCloseTo(10)
  })
})

describe('CircularEMA — 359→1 wraparound', () => {
  it('smooths across north without swinging through 180', () => {
    const ema = new CircularEMA(0.5)
    ema.update(359)
    const v = ema.update(1)
    // Must land between 359 and 1 going through 0 — i.e. within [359,360)∪[0,1]
    expect(v > 358 || v < 2).toBe(true)
  })

  it('converges to a steady input', () => {
    const ema = new CircularEMA(0.3)
    for (let i = 0; i < 50; i++) ema.update(200)
    expect(ema.value()).toBeCloseTo(200, 1)
  })

  it('first sample initializes directly (no pull from 0)', () => {
    const ema = new CircularEMA(0.1)
    expect(ema.update(270)).toBeCloseTo(270, 5)
  })
})

describe('HeadingJitter', () => {
  it('low spread for steady heading', () => {
    const j = new HeadingJitter()
    let spread = 0
    for (let i = 0; i < 20; i++) spread = j.push(100 + (i % 3))
    expect(spread).toBeLessThan(5)
  })

  it('high spread for wild swings', () => {
    const j = new HeadingJitter()
    let spread = 0
    for (let i = 0; i < 20; i++) spread = j.push((i * 73) % 360)
    expect(spread).toBeGreaterThan(45)
  })

  it('spread is wrap-aware: samples around north stay tight', () => {
    const j = new HeadingJitter()
    let spread = 0
    for (const d of [358, 359, 0, 1, 2, 358, 1, 0, 359, 2]) spread = j.push(d)
    expect(spread).toBeLessThan(5)
  })
})
