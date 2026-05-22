import { useMemo } from 'react'
import ToolShell from '../components/ToolShell'
import ExportButton from '../components/ExportButton'
import { usePersistentDoc, clearDoc } from '../lib/storage'
import { phases } from '../framework'
import type { ExportDocument } from '../lib/exportModel'

const TOOL_ID = 'phases'

interface PhaseDoc {
  done: Record<string, boolean>
}

const key = (phaseId: string, i: number) => `${phaseId}:${i}`

export default function PhaseTracker() {
  const [doc, setDoc, savedAt] = usePersistentDoc<PhaseDoc>(TOOL_ID, {
    done: {},
  })

  const progress = useMemo(() => {
    return phases.map((p) => {
      const total = p.checklist.length
      const done = p.checklist.filter((_, i) => doc.done[key(p.id, i)]).length
      return { id: p.id, total, done, complete: total > 0 && done === total }
    })
  }, [doc])

  // A phase is unlocked once the previous phase is complete — the book's
  // 'completed deliverables feed the next' principle.
  function unlocked(index: number): boolean {
    return index === 0 || progress[index - 1].complete
  }

  function toggle(phaseId: string, i: number) {
    setDoc((d) => ({
      ...d,
      done: { ...d.done, [key(phaseId, i)]: !d.done[key(phaseId, i)] },
    }))
  }

  function buildDocument(): ExportDocument {
    const blocks: ExportDocument['blocks'] = [
      {
        type: 'paragraph',
        text: 'Progress against the five-phase implementation roadmap. Each phase unlocks the next once its checklist is complete.',
      },
    ]
    phases.forEach((p, idx) => {
      const pr = progress[idx]
      blocks.push({
        type: 'subheading',
        text: `Phase ${p.number}: ${p.name} — ${pr.done}/${pr.total} complete${
          pr.complete ? ' ✓' : ''
        }`,
      })
      blocks.push({
        type: 'list',
        items: p.checklist.map(
          (c, i) => `${doc.done[key(p.id, i)] ? '[x]' : '[ ]'} ${c}`,
        ),
      })
    })
    return {
      toolId: TOOL_ID,
      toolName: 'Five-Phase Progress Tracker',
      title: 'Implementation Roadmap — Progress',
      blocks,
    }
  }

  return (
    <ToolShell
      chapter="Chapter 15"
      title="Five-Phase Progress Tracker"
      lede="Work the implementation roadmap one phase at a time. Tick off each phase's checklist; a completed phase unlocks the next. The journey is 12–15 months to full operational capability — with value at every phase."
      savedAt={savedAt}
      onReset={() => {
        clearDoc(TOOL_ID)
        setDoc({ done: {} })
      }}
      exportSlot={
        <ExportButton
          buildDocument={buildDocument}
          gateCopy="Want a clean PDF of your implementation roadmap progress to bring to your Monday morning meeting? Enter your email and we'll generate and send it to you."
        />
      }
    >
      {phases.map((p, idx) => {
        const pr = progress[idx]
        const open = unlocked(idx)
        const pct = pr.total ? Math.round((pr.done / pr.total) * 100) : 0
        return (
          <div
            key={p.id}
            className={
              'phase' +
              (pr.complete ? ' done' : '') +
              (open ? '' : ' locked')
            }
          >
            <div className="phase-head">
              <div className="phase-num">
                {pr.complete ? '✓' : p.number}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>
                  Phase {p.number}: {p.name}
                </h3>
                <div className="small muted">
                  {p.duration} ·{' '}
                  {open ? `${pr.done}/${pr.total} done` : 'Locked'}
                </div>
              </div>
            </div>

            <div className="phase-bar">
              <div style={{ width: pct + '%' }} />
            </div>

            <p className="small">{p.description}</p>

            {!open && (
              <p className="small muted">
                Complete Phase {p.number - 1} to unlock this phase.
              </p>
            )}

            {open && (
              <>
                {p.checklist.map((c, i) => (
                  <label className="task-line" key={i}>
                    <input
                      type="checkbox"
                      checked={!!doc.done[key(p.id, i)]}
                      onChange={() => toggle(p.id, i)}
                    />
                    <span>{c}</span>
                  </label>
                ))}
                {p.quickWin && (
                  <div className="callout" style={{ marginTop: 12 }}>
                    <strong>Quick win — {p.quickWin.name}.</strong>{' '}
                    {p.quickWin.description}
                  </div>
                )}
                <p className="small muted">
                  <strong>Phase outcome:</strong> {p.outcome}
                </p>
              </>
            )}
          </div>
        )
      })}
    </ToolShell>
  )
}
