// Pure heading math — no DOM/event wiring here (that lives in useHeading).
// Magnetic declination in Vietnam is −1.75°…−0.96°, below compass sensor
// noise (±10°), so headings are used as-is.

export interface IOSOrientationLike {
  webkitCompassHeading?: number
  webkitCompassAccuracy?: number
}

export interface AndroidOrientationLike {
  alpha: number | null
  absolute?: boolean
}

/**
 * iOS Safari: webkitCompassHeading is degrees clockwise from magnetic north
 * of the device's PHYSICAL top in portrait frame — WebKit passes
 * CLHeading.magneticHeading through with the default portrait
 * headingOrientation and does NOT compensate for UI rotation. Apply the
 * screen angle, same as the Android path, or landscape is off by 90°/270°.
 */
export function normalizeIOS(
  e: IOSOrientationLike,
  screenAngleDeg: number,
): number | null {
  const h = e.webkitCompassHeading
  if (typeof h !== 'number' || Number.isNaN(h) || h < 0) return null
  return (h + screenAngleDeg + 360) % 360
}

/**
 * Android (deviceorientationabsolute): alpha is degrees counterclockwise
 * from north of the device's own frame — convert to compass heading and
 * compensate for the screen rotation (portrait/landscape).
 * Rejects relative frames (absolute === false, e.g. plain deviceorientation
 * from a game rotation vector): an arbitrary-origin alpha must not become a
 * confident compass heading — returning null lets the tier system degrade.
 */
export function normalizeAndroid(
  e: AndroidOrientationLike,
  screenAngleDeg: number,
): number | null {
  if (e.absolute === false) return null
  if (e.alpha === null || Number.isNaN(e.alpha)) return null
  return (360 - e.alpha + screenAngleDeg + 360) % 360
}

/**
 * Circular exponential moving average. Smooths in sin/cos space so
 * 359° → 1° interpolates through 0°, not backwards through 180°.
 */
export class CircularEMA {
  private sin = 0
  private cos = 0
  private initialized = false

  constructor(private alpha = 0.15) {}

  update(deg: number): number {
    const rad = (deg * Math.PI) / 180
    const s = Math.sin(rad)
    const c = Math.cos(rad)
    if (!this.initialized) {
      this.sin = s
      this.cos = c
      this.initialized = true
    } else {
      this.sin += this.alpha * (s - this.sin)
      this.cos += this.alpha * (c - this.cos)
    }
    return this.value()
  }

  value(): number {
    return (Math.atan2(this.sin, this.cos) * (180 / Math.PI) + 360) % 360
  }

  reset(): void {
    this.initialized = false
    this.sin = 0
    this.cos = 0
  }
}

/** Rolling variance heuristic for Android calibration detection. */
export class HeadingJitter {
  private samples: number[] = []

  constructor(private size = 30) {}

  /** Push a heading sample; returns spread (max angular deviation from mean, deg). */
  push(deg: number): number {
    this.samples.push(deg)
    if (this.samples.length > this.size) this.samples.shift()
    if (this.samples.length < 5) return 0
    // circular mean
    let sin = 0
    let cos = 0
    for (const d of this.samples) {
      sin += Math.sin((d * Math.PI) / 180)
      cos += Math.cos((d * Math.PI) / 180)
    }
    const mean = (Math.atan2(sin, cos) * 180) / Math.PI
    let maxDev = 0
    for (const d of this.samples) {
      let dev = Math.abs(d - mean) % 360
      if (dev > 180) dev = 360 - dev
      maxDev = Math.max(maxDev, dev)
    }
    return maxDev
  }
}
