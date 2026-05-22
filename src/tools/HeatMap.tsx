import { useMemo, useState } from 'react'
import ToolShell from '../components/ToolShell'
import ExportButton from '../components/ExportButton'
import { usePersistentDoc, clearDoc } from '../lib/storage'
import { uid } from '../lib/uid'
import { getTemplate } from '../framework'
import type { ExportDocument } from '../lib/exportModel'

const TOOL_ID = 'heat-map'

interface CellStateDef {
  id: string
  label: string
  description: string
  color: string
  scoreWeight: number
}
interface HeatMapStructure {
  defaultColumns: string[]
  defaultRows: string[]
  cellStates: CellStateDef[]
  scoreRule: string
  readingGuidance: string
}

const template = getTemplate('fragmentation-heat-map')!
const struct = (template as unknown as { structure: HeatMapStructure })
  .structure
const CELL_STATES = struct.cellStates // none / green / yellow / red

type StateId = 'none' | 'green' | 'yellow' | 'red'
const ORDER: StateId[] = ['none', 'green', 'yellow', 'red']

interface Axis {
  id: string
  label: string
}
interface HeatMapDoc {
  name: string
  columns: Axis[]
  rows: Axis[]
  cells: Record<string, StateId> // key `${rowId}|${colId}`
  notes: string
}

function initialDoc(): HeatMapDoc {
  return {
    name: 'Our Fragmentation Heat Map',
    columns: struct.defaultColumns.map((label) => ({ id: uid(), label })),
    rows: struct.defaultRows.map((label) => ({ id: uid(), label })),
    cells: {},
    notes: '',
  }
}

const stateMeta = (id: StateId) =>
  CELL_STATES.find((s) => s.id === id) ?? CELL_STATES[0]

export default function HeatMap() {
  const [doc, setDoc, savedAt] = usePersistentDoc<HeatMapDoc>(
    TOOL_ID,
    initialDoc,
  )
  const [editAxes, setEditAxes] = useState(false)

  const cellKey = (r: string, c: string) => `${r}|${c}`
  const cellState = (r: string, c: string): StateId =>
    doc.cells[cellKey(r, c)] ?? 'none'

  function cycleCell(r: string, c: string) {
    setDoc((d) => {
      const cur = d.cells[cellKey(r, c)] ?? 'none'
      const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]
      return { ...d, cells: { ...d.cells, [cellKey(r, c)]: next } }
    })
  }

  // ----- scoring (book: fragmentation score = yellow + red cells) -----
  const stats = useMemo(() => {
    let green = 0,
      yellow = 0,
      red = 0,
      touched = 0
    const colCounts: Record<string, number> = {}
    for (const row of doc.rows) {
      for (const col of doc.columns) {
        const s = cellState(row.id, col.id)
        if (s === 'none') continue
        touched++
        if (s === 'green') green++
        if (s === 'yellow') yellow++
        if (s === 'red') red++
        if (s === 'yellow' || s === 'red')
          colCounts[col.id] = (colCounts[col.id] ?? 0) + 1
      }
    }
    const priorityColumns = doc.columns
      .map((c) => ({ col: c, count: colCounts[c.id] ?? 0 }))
      .filter((x) => x.count >= 2)
      .sort((a, b) => b.count - a.count)
    return { green, yellow, red, touched, score: yellow + red, priorityColumns }
  }, [doc])

  // ----- axis editing -----
  function addAxis(kind: 'rows' | 'columns') {
    setDoc((d) => ({
      ...d,
      [kind]: [...d[kind], { id: uid(), label: 'New' }],
    }))
  }
  function renameAxis(kind: 'rows' | 'columns', id: string, label: string) {
    setDoc((d) => ({
      ...d,
      [kind]: d[kind].map((a) => (a.id === id ? { ...a, label } : a)),
    }))
  }
  function removeAxis(kind: 'rows' | 'columns', id: string) {
    setDoc((d) => {
      const cells = { ...d.cells }
      for (const k of Object.keys(cells))
        if (k.startsWith(id + '|') || k.endsWith('|' + id)) delete cells[k]
      return { ...d, [kind]: d[kind].filter((a) => a.id !== id), cells }
    })
  }

  // ----- export -----
  function buildDocument(): ExportDocument {
    return {
      toolId: TOOL_ID,
      toolName: 'Fragmentation Heat Map',
      title: doc.name || 'Fragmentation Heat Map',
      blocks: [
        {
          type: 'paragraph',
          text: 'A diagnostic for the coordination cost of governance silos. Each coloured cell marks a governance function with a touch point on a data domain; yellow and red cells are the fragmentation score.',
        },
        {
          type: 'grid',
          caption: 'Governance functions × data domains',
          columns: doc.columns.map((c) => c.label),
          rows: doc.rows.map((row) => ({
            label: row.label,
            cells: doc.columns.map((col) => {
              const m = stateMeta(cellState(row.id, col.id))
              return { label: m.label, color: m.color }
            }),
          })),
        },
        {
          type: 'score',
          label: 'Fragmentation score (yellow + red cells)',
          value: stats.score,
          max: doc.rows.length * doc.columns.length,
          detail: `${stats.green} green · ${stats.yellow} yellow · ${stats.red} red · ${stats.touched} touch points in total`,
        },
        {
          type: 'subheading',
          text: 'Priority integration targets',
        },
        {
          type: stats.priorityColumns.length ? 'list' : 'paragraph',
          ...(stats.priorityColumns.length
            ? {
                items: stats.priorityColumns.map(
                  (p) =>
                    `${p.col.label} — ${p.count} functions in ambiguity or conflict`,
                ),
              }
            : {
                text: 'No data domain yet has two or more yellow/red cells. As you mark more touch points, columns with multiple coloured cells will surface here as coordination nightmares.',
              }),
        } as ExportDocument['blocks'][number],
        ...(doc.notes.trim()
          ? ([
              { type: 'subheading', text: 'Notes' },
              { type: 'paragraph', text: doc.notes.trim() },
            ] as ExportDocument['blocks'])
          : []),
      ],
    }
  }

  return (
    <ToolShell
      chapter="Chapter 1"
      title="Fragmentation Heat Map"
      lede="Map which governance functions touch which data domains. Tap each cell to mark the health of that touch point. The count of yellow and red cells is your fragmentation score — and your starting point for integration."
      savedAt={savedAt}
      onReset={() => {
        clearDoc(TOOL_ID)
        setDoc(initialDoc())
      }}
      exportSlot={
        <ExportButton
          buildDocument={buildDocument}
          gateCopy="Want a clean PDF of your Fragmentation Heat Map to bring to your Monday morning meeting? Enter your email and we'll generate and send it to you."
        />
      }
    >
      <div className="callout book">
        “Map which governance functions touch which data domains. This reveals
        coordination burden… Count yellow and red cells. That's your
        fragmentation score.” — Chapter 1, Monday Morning Deliverable
      </div>

      <div className="panel">
        <label className="field" style={{ maxWidth: 460 }}>
          <span>Name this heat map</span>
          <input
            type="text"
            value={doc.name}
            onChange={(e) => setDoc((d) => ({ ...d, name: e.target.value }))}
          />
        </label>

        <div className="legend">
          {CELL_STATES.map((s) => (
            <span key={s.id}>
              <span className="sw" style={{ background: s.color }} />
              {s.label} — {s.description}
            </span>
          ))}
        </div>

        <div className="heatmap-wrap">
          <table className="heatmap">
            <thead>
              <tr>
                <th>Governance function ╲ Data domain</th>
                {doc.columns.map((c) => (
                  <th key={c.id}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  {doc.columns.map((col) => {
                    const s = cellState(row.id, col.id)
                    const m = stateMeta(s)
                    return (
                      <td key={col.id}>
                        <button
                          className={
                            s === 'none' ? 'cell-btn cell-none' : 'cell-btn'
                          }
                          style={
                            s === 'none' ? undefined : { background: m.color }
                          }
                          title={`${row.label} × ${col.label}: ${m.label}. Tap to change.`}
                          onClick={() => cycleCell(row.id, col.id)}
                        >
                          {s === 'none'
                            ? ''
                            : s === 'green'
                              ? '✓'
                              : s === 'yellow'
                                ? '!'
                                : '✕'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          Tap a cell to cycle: empty → green → yellow → red. Be generous —
          mark every cell where a function has responsibility, influence, or a
          touch point.
        </p>

        <button
          className="btn ghost small"
          onClick={() => setEditAxes((v) => !v)}
        >
          {editAxes ? '▲ Hide' : '▾ Customise'} functions &amp; domains
        </button>

        {editAxes && (
          <div style={{ marginTop: 14 }}>
            <h3>Data domains (columns)</h3>
            <AxisEditor
              items={doc.columns}
              onRename={(id, l) => renameAxis('columns', id, l)}
              onRemove={(id) => removeAxis('columns', id)}
              onAdd={() => addAxis('columns')}
            />
            <h3 style={{ marginTop: 14 }}>Governance functions (rows)</h3>
            <AxisEditor
              items={doc.rows}
              onRename={(id, l) => renameAxis('rows', id, l)}
              onRemove={(id) => removeAxis('rows', id)}
              onAdd={() => addAxis('rows')}
            />
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Your fragmentation score</h2>
        <div className="scorebox">
          <div className="score-num">
            <div className="n">{stats.score}</div>
            <div className="lbl">yellow + red cells</div>
          </div>
          <div className="score-band">
            <strong>
              {stats.green} green · {stats.yellow} yellow · {stats.red} red
            </strong>
            <p className="small muted" style={{ margin: '6px 0 0' }}>
              {struct.scoreRule}
            </p>
          </div>
        </div>

        <h3 style={{ marginTop: 18 }}>Priority integration targets</h3>
        {stats.priorityColumns.length ? (
          <ul>
            {stats.priorityColumns.map((p) => (
              <li key={p.col.id}>
                <strong>{p.col.label}</strong> — {p.count} functions in
                ambiguity or conflict.
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted">
            {struct.readingGuidance} As soon as a domain collects two or more
            yellow/red cells it will appear here.
          </p>
        )}
      </div>

      <div className="panel">
        <label className="field" style={{ marginBottom: 0 }}>
          <span>
            Notes <span className="hint">— name conflicting definitions, who believes which is correct, where escalations start</span>
          </span>
          <textarea
            value={doc.notes}
            placeholder="e.g. 'Customer' is defined three ways across Quality, Compliance and MDM…"
            onChange={(e) => setDoc((d) => ({ ...d, notes: e.target.value }))}
          />
        </label>
      </div>
    </ToolShell>
  )
}

function AxisEditor({
  items,
  onRename,
  onRemove,
  onAdd,
}: {
  items: Axis[]
  onRename: (id: string, label: string) => void
  onRemove: (id: string) => void
  onAdd: () => void
}) {
  return (
    <div className="tag-edit">
      {items.map((a) => (
        <span className="tag" key={a.id}>
          <input
            type="text"
            value={a.label}
            style={{ width: 130, padding: '2px 6px', fontSize: 13 }}
            onChange={(e) => onRename(a.id, e.target.value)}
          />
          <button
            title="Remove"
            onClick={() => onRemove(a.id)}
            disabled={items.length <= 1}
          >
            ×
          </button>
        </span>
      ))}
      <button className="btn ghost small" onClick={onAdd}>
        + Add
      </button>
    </div>
  )
}
