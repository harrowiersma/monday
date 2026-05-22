interface Point {
  label: string
  value: number
}

/** A minimal dependency-free SVG line chart for quarterly trends. */
export default function TrendChart({
  points,
  min,
  max,
}: {
  points: Point[]
  min: number
  max: number
}) {
  const W = 640
  const H = 200
  const padL = 38
  const padR = 16
  const padT = 16
  const padB = 34
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const n = points.length
  const x = (i: number) =>
    padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v: number) =>
    padT + plotH - ((v - min) / (max - min)) * plotH

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')
  const gridVals = [min, Math.round((min + max) / 2), max]

  return (
    <svg
      className="trend"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Quarterly trend chart"
    >
      {gridVals.map((g) => (
        <g key={g}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(g)}
            y2={y(g)}
            style={{ stroke: 'var(--line)' }}
          />
          <text
            x={4}
            y={y(g) + 4}
            fontSize={11}
            style={{ fill: 'var(--muted)' }}
          >
            {g}
          </text>
        </g>
      ))}
      {n > 1 && (
        <polyline
          points={line}
          fill="none"
          strokeWidth={2.5}
          style={{ stroke: 'var(--accent)' }}
        />
      )}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={x(i)}
            cy={y(p.value)}
            r={4.5}
            style={{ fill: 'var(--accent-bright)' }}
          />
          <text
            x={x(i)}
            y={y(p.value) - 10}
            fontSize={11}
            textAnchor="middle"
            fontWeight={700}
            style={{ fill: 'var(--accent-bright)' }}
          >
            {p.value}
          </text>
          <text
            x={x(i)}
            y={H - 12}
            fontSize={10}
            textAnchor="middle"
            style={{ fill: 'var(--muted)' }}
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
