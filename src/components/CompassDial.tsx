import { useEffect, useRef } from 'react'
import { vi } from '../lib/i18n/vi'
import type { HeadingHook } from '../hooks/useHeading'

interface Props {
  heading: HeadingHook
  targetBearing: number
  toleranceDeg: number
  inArc: boolean
}

const CX = 150
const CY = 150
const R = 120

function arcPath(centerDeg: number, halfWidthDeg: number): string {
  const a0 = ((centerDeg - halfWidthDeg - 90) * Math.PI) / 180
  const a1 = ((centerDeg + halfWidthDeg - 90) * Math.PI) / 180
  const r0 = R - 14
  const r1 = R + 6
  const p = (r: number, a: number) =>
    `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`
  const large = halfWidthDeg > 90 ? 1 : 0
  return [
    `M ${p(r0, a0)}`,
    `A ${r0} ${r0} 0 ${large} 1 ${p(r0, a1)}`,
    `L ${p(r1, a1)}`,
    `A ${r1} ${r1} 0 ${large} 0 ${p(r1, a0)}`,
    'Z',
  ].join(' ')
}

/**
 * Compass rose rotates so the target marker sits at the top exactly when the
 * phone faces the tower. The needle is fixed, pointing up (= phone facing).
 * Rotation happens via direct DOM transform from sensor events — never
 * through React state (60Hz).
 */
export function CompassDial({ heading, targetBearing, toleranceDeg, inArc }: Props) {
  const roseRef = useRef<SVGGElement>(null)

  useEffect(() => {
    let raf = 0
    const unsubscribe = heading.subscribe((h) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        roseRef.current?.setAttribute('transform', `rotate(${-h} ${CX} ${CY})`)
      })
    })
    return () => {
      unsubscribe()
      cancelAnimationFrame(raf)
    }
  }, [heading])

  const ticks = []
  for (let d = 0; d < 360; d += 15) {
    const major = d % 90 === 0
    const a = ((d - 90) * Math.PI) / 180
    const r0 = major ? R - 10 : R - 5
    ticks.push(
      <line
        key={d}
        x1={CX + r0 * Math.cos(a)}
        y1={CY + r0 * Math.sin(a)}
        x2={CX + R * Math.cos(a)}
        y2={CY + R * Math.sin(a)}
        stroke="var(--dial-tick)"
        strokeWidth={major ? 3 : 1.5}
      />,
    )
  }

  const cardinalLabels = [
    { d: 0, label: 'B' },
    { d: 90, label: 'Đ' },
    { d: 180, label: 'N' },
    { d: 270, label: 'T' },
  ].map(({ d, label }) => {
    const a = ((d - 90) * Math.PI) / 180
    const r = R - 28
    return (
      <text
        key={d}
        x={CX + r * Math.cos(a)}
        y={CY + r * Math.sin(a)}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="20"
        fontWeight="700"
        fill={d === 0 ? '#dc2626' : 'var(--dial-text)'}
        transform={`rotate(${d} ${CX + r * Math.cos(a)} ${CY + r * Math.sin(a)})`}
      >
        {label}
      </text>
    )
  })

  // target marker: triangle at the bearing on the rose rim
  const ta = ((targetBearing - 90) * Math.PI) / 180
  const tx = CX + (R + 16) * Math.cos(ta)
  const ty = CY + (R + 16) * Math.sin(ta)

  return (
    <svg
      viewBox="0 0 300 300"
      className={`compass-dial${inArc ? ' in-arc' : ''}`}
      role="img"
      aria-label={`La bàn, mục tiêu ${Math.round(targetBearing)} độ`}
    >
      <circle cx={CX} cy={CY} r={R + 24} fill="var(--dial-bg)" />
      <g ref={roseRef}>
        {ticks}
        {cardinalLabels}
        <path
          d={arcPath(targetBearing, toleranceDeg)}
          fill={inArc ? 'var(--ok)' : 'var(--accent-soft)'}
          opacity={0.85}
        />
        <g transform={`rotate(${targetBearing} ${tx} ${ty})`}>
          <path
            d={`M ${tx} ${ty - 12} L ${tx - 9} ${ty + 6} L ${tx + 9} ${ty + 6} Z`}
            fill={inArc ? 'var(--ok)' : 'var(--accent)'}
          />
        </g>
      </g>
      {/* fixed needle = phone facing direction */}
      <path
        d={`M ${CX} ${CY - R + 4} L ${CX - 8} ${CY - 28} L ${CX + 8} ${CY - 28} Z`}
        fill={inArc ? 'var(--ok)' : '#dc2626'}
      />
      <line
        x1={CX}
        y1={CY - 26}
        x2={CX}
        y2={CY}
        stroke={inArc ? 'var(--ok)' : '#dc2626'}
        strokeWidth="3"
      />
      <circle cx={CX} cy={CY} r="6" fill="var(--dial-text)" />
      {inArc && (
        <text
          x={CX}
          y={CY + 60}
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="var(--ok)"
        >
          {vi.aimCorrect}
        </text>
      )}
    </svg>
  )
}
