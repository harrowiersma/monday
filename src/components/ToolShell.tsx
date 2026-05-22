import type { ReactNode } from 'react'

interface Props {
  chapter: string
  title: string
  lede: string
  savedAt: number | null
  onReset?: () => void
  exportSlot?: ReactNode
  children: ReactNode
}

export default function ToolShell({
  chapter,
  title,
  lede,
  savedAt,
  onReset,
  exportSlot,
  children,
}: Props) {
  return (
    <div className="content">
      <div className="page-head">
        <div className="eyebrow">{chapter} · Monday Morning Deliverable</div>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
      </div>

      <div className="row" style={{ marginBottom: 18 }}>
        {savedAt && (
          <span className="save-pill" title="Saved locally in this browser">
            ✓ Saved on this device
          </span>
        )}
        <span className="spacer" />
        {onReset && (
          <button
            className="btn ghost danger small"
            onClick={() => {
              if (
                confirm('Clear this tool and start over? This cannot be undone.')
              )
                onReset()
            }}
          >
            Reset
          </button>
        )}
        {exportSlot}
      </div>

      {children}
    </div>
  )
}
