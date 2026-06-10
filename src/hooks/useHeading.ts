import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CircularEMA,
  HeadingJitter,
  normalizeAndroid,
  normalizeIOS,
  type IOSOrientationLike,
} from '../lib/heading'

export type HeadingState =
  | 'unsupported' // no usable sensor → Tier 2
  | 'needs-permission' // iOS: must ask inside a user gesture
  | 'denied'
  | 'active'

interface IOSDeviceOrientationEventCtor {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export interface HeadingHook {
  state: HeadingState
  /** smoothed heading, updated at low rate for text UI; null until first event */
  heading: number | null
  /** sensor-reported accuracy in degrees when known (iOS), else null */
  accuracyDeg: number | null
  /** true when readings look uncalibrated — show figure-8 prompt */
  needsCalibration: boolean
  /** call from a tap handler (iOS requirement) */
  requestPermission: () => Promise<void>
  /** per-event smoothed heading for direct-DOM consumers (compass needle) */
  subscribe: (cb: (heading: number) => void) => () => void
}

/**
 * Compass heading hook. Raw 60Hz sensor events NEVER pass through React
 * state: the handler only writes refs and notifies subscribers (which render
 * via rAF + direct DOM); React state for text UI syncs on a 250ms interval.
 */
export function useHeading(active: boolean): HeadingHook {
  const [state, setState] = useState<HeadingState>(() => {
    if (typeof DeviceOrientationEvent === 'undefined') return 'unsupported'
    const ctor = DeviceOrientationEvent as unknown as IOSDeviceOrientationEventCtor
    return typeof ctor.requestPermission === 'function'
      ? 'needs-permission'
      : 'active'
  })
  const [heading, setHeading] = useState<number | null>(null)
  const [accuracyDeg, setAccuracyDeg] = useState<number | null>(null)
  const [needsCalibration, setNeedsCalibration] = useState(false)

  const ema = useRef(new CircularEMA(0.15))
  const jitter = useRef(new HeadingJitter())
  const headingRef = useRef<number | null>(null)
  const accuracyRef = useRef<number | null>(null)
  const calibrationRef = useRef(false)
  const subscribers = useRef(new Set<(h: number) => void>())
  // "a compass sensor exists" — true even for uncalibrated iOS readings (-1),
  // so a calibrating phone is not permanently demoted to Tier 2
  const sensorSeen = useRef(false)

  const requestPermission = useCallback(async () => {
    const ctor = DeviceOrientationEvent as unknown as IOSDeviceOrientationEventCtor
    if (typeof ctor.requestPermission !== 'function') return
    try {
      const result = await ctor.requestPermission()
      setState(result === 'granted' ? 'active' : 'denied')
    } catch {
      setState('denied')
    }
  }, [])

  useEffect(() => {
    if (!active || state !== 'active') return

    const screenAngle = () => {
      if (typeof screen !== 'undefined' && screen.orientation)
        return screen.orientation.angle
      // iOS < 16.4: no screen.orientation in Safari
      const legacy = (window as { orientation?: unknown }).orientation
      return typeof legacy === 'number' ? (legacy + 360) % 360 : 0
    }

    // hot path: refs + subscriber callbacks only, no React state
    const handle = (e: DeviceOrientationEvent) => {
      const ios = e as DeviceOrientationEvent & IOSOrientationLike
      const isIOS = typeof ios.webkitCompassHeading === 'number'
      let raw: number | null
      if (isIOS) {
        sensorSeen.current = true
        raw = normalizeIOS(ios, screenAngle())
        if (typeof ios.webkitCompassAccuracy === 'number') {
          accuracyRef.current = ios.webkitCompassAccuracy
          calibrationRef.current =
            ios.webkitCompassAccuracy < 0 || ios.webkitCompassAccuracy > 25
        }
        if (raw === null) calibrationRef.current = true
      } else {
        raw = normalizeAndroid(e, screenAngle())
      }
      if (raw === null) return
      sensorSeen.current = true
      const smoothed = ema.current.update(raw)
      headingRef.current = smoothed
      if (!isIOS) {
        // Android has no accuracy field — jitter spread as calibration heuristic
        calibrationRef.current = jitter.current.push(raw) > 40
      }
      for (const cb of subscribers.current) cb(smoothed)
    }

    // deviceorientationabsolute (Android Chrome) gives world-referenced alpha;
    // plain deviceorientation covers iOS (webkitCompassHeading) — relative
    // Android frames are rejected in normalizeAndroid and degrade to Tier 2
    const hasAbsolute = 'ondeviceorientationabsolute' in window
    const eventName = hasAbsolute
      ? 'deviceorientationabsolute'
      : 'deviceorientation'
    window.addEventListener(eventName, handle as EventListener)

    // low-rate sync of refs → React state for text displays
    const interval = setInterval(() => {
      if (headingRef.current !== null) setHeading(headingRef.current)
      setAccuracyDeg(accuracyRef.current)
      setNeedsCalibration(calibrationRef.current)
    }, 250)

    // no usable sensor (desktop, relative-only Android) → Tier 2
    const probe = setTimeout(() => {
      if (!sensorSeen.current) setState('unsupported')
    }, 3000)

    return () => {
      window.removeEventListener(eventName, handle as EventListener)
      clearInterval(interval)
      clearTimeout(probe)
    }
  }, [active, state])

  const subscribe = useCallback((cb: (h: number) => void) => {
    subscribers.current.add(cb)
    if (headingRef.current !== null) cb(headingRef.current)
    return () => {
      subscribers.current.delete(cb)
    }
  }, [])

  return {
    state,
    heading,
    accuracyDeg,
    needsCalibration,
    requestPermission,
    subscribe,
  }
}
