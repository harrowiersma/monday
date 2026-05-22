import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import ToolShell from '../components/ToolShell'
import ExportButton from '../components/ExportButton'
import { usePersistentDoc, clearDoc } from '../lib/storage'
import { getChecklist } from '../framework'
import { toolById } from './registry'
import type { ExportDocument } from '../lib/exportModel'

interface ScorecardDoc {
  scores: Record<number, number>
  notes: string
}

export default function Scorecard() {
  const { id = '' } = useParams()
  const checklist = getChecklist(id)
  const tool = toolById(id)

  // The tool id is the storage key — keeps the three scorecards separate.
  const [doc, setDoc, savedAt] = usePersistentDoc<ScorecardDoc>(id, {
    scores: {},
    notes: '',
  })

  const total = useMemo(() => {
    if (!checklist) return 0
    return checklist.items.reduce(
      (s, it) => s + (doc.scores[it.number] ?? 0),
      0,
    )
  }, [doc.scores, checklist])

  if (!checklist || !tool) {
    return (
      <div className="content">
        <h1>Scorecard not found</h1>
      </div>
    )
  }

  const band = checklist.interpretationBands.find(
    (b) => total >= b.min && total <= b.max,
  )

  function setScore(n: number, v: number) {
    setDoc((d) => ({ ...d, scores: { ...d.scores, [n]: v } }))
  }

  function buildDocument(): ExportDocument {
    return {
      toolId: id,
      toolName: checklist!.name,
      title: checklist!.name,
      blocks: [
        {
          type: 'score',
          label: 'Total score',
          value: total,
          max: checklist!.totalRange[1],
          band: band?.label,
          detail: band?.interpretation,
        },
        {
          type: 'table',
          headers: ['#', 'Criterion', 'Score (0–10)'],
          rows: checklist!.items.map((it) => [
            String(it.number),
            `${it.name} — ${it.criterion}`,
            String(doc.scores[it.number] ?? 0),
          ]),
        },
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
      chapter={tool.chapter}
      title={checklist.name}
      lede={`Score each of the ${checklist.itemCount} criteria from 0 (not done) to 10 (fully implemented). The total runs ${checklist.totalRange[0]}–${checklist.totalRange[1]}.`}
      savedAt={savedAt}
      onReset={() => {
        clearDoc(id)
        setDoc({ scores: {}, notes: '' })
      }}
      exportSlot={
        <ExportButton
          buildDocument={buildDocument}
          gateCopy={`Want a clean PDF of your ${checklist.name} to bring to your Monday morning meeting? Enter your email and we'll generate and send it to you.`}
        />
      }
    >
      {checklist.scoringNote && (
        <div className="callout book">{checklist.scoringNote}</div>
      )}

      <div className="panel">
        <h2>Score the {checklist.itemCount} criteria</h2>
        {checklist.items.map((it) => {
          const v = doc.scores[it.number] ?? 0
          return (
            <div className="check-item" key={it.number}>
              <div className="check-head">
                <span className="ci-name">
                  {it.number}. {it.name}
                </span>
                <span className="lvl-badge" style={{ fontSize: 16 }}>
                  {v}/10
                </span>
              </div>
              <p className="small muted" style={{ margin: '4px 0 8px' }}>
                {it.criterion}
              </p>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={v}
                onChange={(e) => setScore(it.number, Number(e.target.value))}
              />
            </div>
          )
        })}
      </div>

      <div className="panel">
        <h2>Result</h2>
        <div className="scorebox">
          <div className="score-num">
            <div className="n">{total}</div>
            <div className="lbl">of {checklist.totalRange[1]}</div>
          </div>
          <div
            className="score-band"
            style={{ borderLeft: '4px solid var(--accent)' }}
          >
            <strong>{band?.label}</strong>
            <p className="small" style={{ margin: '6px 0 0' }}>
              {band?.interpretation}
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <label className="field" style={{ marginBottom: 0 }}>
          <span>
            Notes <span className="hint">— preparation gaps, dates, owners</span>
          </span>
          <textarea
            value={doc.notes}
            onChange={(e) => setDoc((d) => ({ ...d, notes: e.target.value }))}
          />
        </label>
      </div>
    </ToolShell>
  )
}
