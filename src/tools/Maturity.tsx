import { useMemo } from 'react'
import ToolShell from '../components/ToolShell'
import ExportButton from '../components/ExportButton'
import TrendChart from '../components/TrendChart'
import { usePersistentDoc, clearDoc } from '../lib/storage'
import { uid } from '../lib/uid'
import { gcfLayers, maturityModel } from '../framework'
import type { ExportDocument } from '../lib/exportModel'

const TOOL_ID = 'maturity'

interface Snapshot {
  id: string
  date: string
  scores: Record<string, number>
  total: number
}
interface MaturityDoc {
  scores: Record<string, number>
  snapshots: Snapshot[]
}

function initialDoc(): MaturityDoc {
  const scores: Record<string, number> = {}
  for (const l of gcfLayers) scores[l.id] = 1
  return { scores, snapshots: [] }
}

function bandFor(total: number) {
  return maturityModel.interpretationBands.find(
    (b) => total >= b.min && total <= b.max,
  )
}
function levelName(score: number) {
  return maturityModel.levels.find((l) => l.level === score)?.name ?? ''
}

export default function Maturity() {
  const [doc, setDoc, savedAt] = usePersistentDoc<MaturityDoc>(
    TOOL_ID,
    initialDoc,
  )

  const total = useMemo(
    () => gcfLayers.reduce((s, l) => s + (doc.scores[l.id] ?? 1), 0),
    [doc.scores],
  )
  const band = bandFor(total)

  function setScore(layerId: string, value: number) {
    setDoc((d) => ({ ...d, scores: { ...d.scores, [layerId]: value } }))
  }

  function saveSnapshot() {
    const snap: Snapshot = {
      id: uid(),
      date: new Date().toISOString().slice(0, 10),
      scores: { ...doc.scores },
      total,
    }
    setDoc((d) => ({
      ...d,
      snapshots: [...d.snapshots, snap].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }))
  }
  function removeSnapshot(id: string) {
    setDoc((d) => ({
      ...d,
      snapshots: d.snapshots.filter((s) => s.id !== id),
    }))
  }

  function buildDocument(): ExportDocument {
    return {
      toolId: TOOL_ID,
      toolName: 'GCF Maturity Assessment',
      title: 'GCF Maturity Assessment',
      blocks: [
        {
          type: 'paragraph',
          text: 'Each of the six Governance Context Foundation layers is scored 1–5 against the maturity model. The six layer scores sum to a total between 6 and 30.',
        },
        {
          type: 'score',
          label: 'Total maturity score',
          value: total,
          max: 30,
          band: band?.label,
          detail: band?.interpretation,
        },
        {
          type: 'table',
          headers: ['GCF layer', 'Score (1–5)', 'Maturity level'],
          rows: gcfLayers.map((l) => [
            l.name,
            String(doc.scores[l.id] ?? 1),
            levelName(doc.scores[l.id] ?? 1),
          ]),
        },
        ...(doc.snapshots.length
          ? ([
              { type: 'subheading', text: 'Quarterly trend' },
              {
                type: 'table',
                headers: ['Date', 'Total score', 'Band'],
                rows: doc.snapshots.map((s) => [
                  s.date,
                  `${s.total} / 30`,
                  bandFor(s.total)?.label ?? '',
                ]),
              },
            ] as ExportDocument['blocks'])
          : []),
      ],
    }
  }

  return (
    <ToolShell
      chapter="Appendix B"
      title="GCF Maturity Assessment"
      lede="Score each of the six GCF layers from 1 (Ad Hoc) to 5 (Intelligent). The six scores sum to a 6–30 maturity total. Re-assess each quarter — the trend matters more than the absolute number."
      savedAt={savedAt}
      onReset={() => {
        clearDoc(TOOL_ID)
        setDoc(initialDoc())
      }}
      exportSlot={
        <ExportButton
          buildDocument={buildDocument}
          gateCopy="Want a clean PDF of your GCF Maturity Assessment, with the layer scores and quarterly trend? Enter your email and we'll generate and send it to you."
        />
      }
    >
      <div className="callout book">
        “Assess each of the six layers independently… Total score range: 6
        (fully ad hoc) to 30 (fully intelligent). Document your scores, date the
        assessment, and repeat quarterly. The trend matters more than the
        absolute number.” — Appendix B
      </div>

      <div className="panel">
        <h2>Score the six layers</h2>
        {gcfLayers.map((l) => {
          const v = doc.scores[l.id] ?? 1
          return (
            <div className="layer-row" key={l.id}>
              <div>
                <div className="lr-name">
                  {l.number}. {l.name}
                </div>
                <div className="lr-q">{l.governanceQuestion}</div>
              </div>
              <div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={v}
                  onChange={(e) => setScore(l.id, Number(e.target.value))}
                />
                <div className="small muted">
                  {v} — {levelName(v)}
                </div>
              </div>
              <div className="lvl-badge">{v}</div>
            </div>
          )
        })}
      </div>

      <div className="panel">
        <h2>Result</h2>
        <div className="scorebox">
          <div className="score-num">
            <div className="n">{total}</div>
            <div className="lbl">of 30</div>
          </div>
          <div
            className="score-band"
            style={{
              borderLeft: '4px solid var(--accent)',
            }}
          >
            <strong>{band?.label}</strong>
            <p className="small" style={{ margin: '6px 0 0' }}>
              {band?.interpretation}
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="row">
          <h2 style={{ margin: 0 }}>Quarterly trend</h2>
          <span className="spacer" />
          <button className="btn small" onClick={saveSnapshot}>
            + Save snapshot ({new Date().toISOString().slice(0, 10)})
          </button>
        </div>
        {doc.snapshots.length >= 1 ? (
          <>
            <TrendChart
              points={doc.snapshots.map((s) => ({
                label: s.date,
                value: s.total,
              }))}
              min={6}
              max={30}
            />
            <table className="heatmap" style={{ minWidth: 0, marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Date</th>
                  <th>Total</th>
                  <th>Band</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {doc.snapshots.map((s) => (
                  <tr key={s.id}>
                    <th style={{ textAlign: 'left' }}>{s.date}</th>
                    <td style={{ padding: '6px 10px' }}>{s.total} / 30</td>
                    <td style={{ padding: '6px 10px' }}>
                      {bandFor(s.total)?.label}
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <button
                        className="btn ghost danger small"
                        onClick={() => removeSnapshot(s.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="small muted">
            Save a snapshot to start your quarterly trend line. Come back next
            quarter, re-score the layers, and save again to see the trajectory.
          </p>
        )}
      </div>
    </ToolShell>
  )
}
