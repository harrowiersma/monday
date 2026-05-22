import { useMemo, useState } from 'react'
import ToolShell from '../components/ToolShell'
import ExportButton from '../components/ExportButton'
import { usePersistentDoc, clearDoc } from '../lib/storage'
import { uid } from '../lib/uid'
import { gcfLayers, getDeliverable } from '../framework'
import type { ExportDocument } from '../lib/exportModel'

const TOOL_ID = 'context-audit'
const deliverable = getDeliverable('ch4-governance-context-audit')! as unknown as {
  layerChecklist: { layer: string; question: string }[]
}
const layerQuestion: Record<string, string> = {}
for (const c of deliverable.layerChecklist)
  layerQuestion[c.layer] = c.question

type Status = 'clear' | 'partial' | 'gap'
const STATUS_META: Record<Status, { label: string; color: string }> = {
  clear: { label: 'Clear', color: '#2e7d32' },
  partial: { label: 'Vague', color: '#f9a825' },
  gap: { label: 'Gap', color: '#c62828' },
}

interface Cell {
  status: Status
  note: string
}
interface EntityRow {
  id: string
  name: string
  cells: Record<string, Cell>
}
interface AuditDoc {
  entities: EntityRow[]
}

function newEntity(name: string): EntityRow {
  const cells: Record<string, Cell> = {}
  for (const l of gcfLayers) cells[l.id] = { status: 'gap', note: '' }
  return { id: uid(), name, cells }
}
function initialDoc(): AuditDoc {
  return {
    entities: ['Customer', 'Product', 'Account', 'Order', 'Supplier', 'Employee'].map(
      newEntity,
    ),
  }
}

export default function ContextAudit() {
  const [doc, setDoc, savedAt] = usePersistentDoc<AuditDoc>(
    TOOL_ID,
    initialDoc,
  )
  const [active, setActive] = useState(0)
  const entity = doc.entities[Math.min(active, doc.entities.length - 1)]

  const roadmap = useMemo(() => {
    const items: { entity: string; layer: string; status: Status; note: string }[] =
      []
    for (const e of doc.entities)
      for (const l of gcfLayers) {
        const c = e.cells[l.id]
        if (c && c.status !== 'clear')
          items.push({
            entity: e.name,
            layer: l.name,
            status: c.status,
            note: c.note,
          })
      }
    return items
  }, [doc])

  function setCell(entityId: string, layerId: string, patch: Partial<Cell>) {
    setDoc((d) => ({
      ...d,
      entities: d.entities.map((e) =>
        e.id === entityId
          ? {
              ...e,
              cells: {
                ...e.cells,
                [layerId]: { ...e.cells[layerId], ...patch },
              },
            }
          : e,
      ),
    }))
  }
  function renameEntity(entityId: string, name: string) {
    setDoc((d) => ({
      ...d,
      entities: d.entities.map((e) =>
        e.id === entityId ? { ...e, name } : e,
      ),
    }))
  }
  function addEntity() {
    setDoc((d) => ({ ...d, entities: [...d.entities, newEntity('New entity')] }))
    setActive(doc.entities.length)
  }
  function removeEntity(entityId: string) {
    setDoc((d) => ({
      ...d,
      entities: d.entities.filter((e) => e.id !== entityId),
    }))
    setActive(0)
  }

  function buildDocument(): ExportDocument {
    const blocks: ExportDocument['blocks'] = [
      {
        type: 'paragraph',
        text: 'Each core business entity is run through the six GCF layers. Every layer answered vaguely or with a gap is an item on your governance foundation roadmap.',
      },
      {
        type: 'score',
        label: 'Roadmap items (vague or gap answers)',
        value: roadmap.length,
        max: doc.entities.length * gcfLayers.length,
        detail: `${doc.entities.length} entities audited across ${gcfLayers.length} layers.`,
      },
    ]
    for (const e of doc.entities) {
      blocks.push({ type: 'subheading', text: e.name })
      blocks.push({
        type: 'table',
        headers: ['GCF layer', 'Status', 'Note'],
        rows: gcfLayers.map((l) => [
          l.name,
          STATUS_META[e.cells[l.id].status].label,
          e.cells[l.id].note || '—',
        ]),
      })
    }
    return {
      toolId: TOOL_ID,
      toolName: 'Governance Context Audit',
      title: 'Governance Context Audit',
      blocks,
    }
  }

  return (
    <ToolShell
      chapter="Chapter 4"
      title="Governance Context Audit"
      lede="Run each core business entity through the six GCF layers. For every answer that is vague, speculative, or needs a phone call, mark a gap — those gaps are your governance foundation roadmap."
      savedAt={savedAt}
      onReset={() => {
        clearDoc(TOOL_ID)
        setDoc(initialDoc())
        setActive(0)
      }}
      exportSlot={
        <ExportButton
          buildDocument={buildDocument}
          gateCopy="Want a clean PDF of your Governance Context Audit to bring to your Monday morning meeting? Enter your email and we'll generate and send it to you."
        />
      }
    >
      <div className="callout book">
        “For each answer that was vague, speculative, or required you to phone
        someone, you've found a gap. Write it down. Those gaps are your
        governance foundation roadmap.” — Chapter 4
      </div>

      <div className="panel">
        <div className="tablist">
          {doc.entities.map((e, i) => (
            <button
              key={e.id}
              className={i === active ? 'active' : ''}
              onClick={() => setActive(i)}
            >
              {e.name}
            </button>
          ))}
          <button onClick={addEntity}>+ Entity</button>
        </div>

        {entity && (
          <>
            <div className="row" style={{ marginBottom: 14 }}>
              <label className="field" style={{ marginBottom: 0, flex: 1 }}>
                <span>Entity name</span>
                <input
                  type="text"
                  value={entity.name}
                  onChange={(e) => renameEntity(entity.id, e.target.value)}
                />
              </label>
              <button
                className="btn ghost danger small"
                disabled={doc.entities.length <= 1}
                onClick={() => removeEntity(entity.id)}
              >
                Remove entity
              </button>
            </div>

            {gcfLayers.map((l) => {
              const cell = entity.cells[l.id]
              return (
                <div className="check-item" key={l.id}>
                  <strong className="ci-name">
                    Layer {l.number}: {l.name}
                  </strong>
                  <p className="small muted" style={{ margin: '4px 0 8px' }}>
                    {layerQuestion[l.id]}
                  </p>
                  <div className="row" style={{ marginBottom: 8 }}>
                    {(['clear', 'partial', 'gap'] as Status[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setCell(entity.id, l.id, { status: s })}
                        className="btn small"
                        style={{
                          background:
                            cell.status === s
                              ? STATUS_META[s].color
                              : 'transparent',
                          color:
                            cell.status === s ? '#fff' : STATUS_META[s].color,
                          borderColor: STATUS_META[s].color,
                        }}
                      >
                        {STATUS_META[s].label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="What did you find? Name the gap, or the conflicting answer."
                    value={cell.note}
                    onChange={(e) =>
                      setCell(entity.id, l.id, { note: e.target.value })
                    }
                  />
                </div>
              )
            })}
          </>
        )}
      </div>

      <div className="panel">
        <h2>Your governance foundation roadmap</h2>
        <div className="scorebox" style={{ marginBottom: 14 }}>
          <div className="score-num">
            <div className="n">{roadmap.length}</div>
            <div className="lbl">roadmap items</div>
          </div>
          <div className="score-band">
            <strong>
              {roadmap.filter((r) => r.status === 'gap').length} gaps ·{' '}
              {roadmap.filter((r) => r.status === 'partial').length} vague
            </strong>
            <p className="small muted" style={{ margin: '6px 0 0' }}>
              Every layer not yet answered clearly is a gap to close. Start
              with the entities and layers that block the most decisions.
            </p>
          </div>
        </div>
        {roadmap.length ? (
          <ul>
            {roadmap.map((r, i) => (
              <li key={i} className="small">
                <strong>
                  {r.entity} · {r.layer}
                </strong>{' '}
                <span style={{ color: STATUS_META[r.status].color }}>
                  ({STATUS_META[r.status].label})
                </span>
                {r.note ? ` — ${r.note}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted">
            Every layer for every entity is marked clear. Either you have an
            unusually mature foundation — or it is worth a more sceptical pass.
          </p>
        )}
      </div>
    </ToolShell>
  )
}
