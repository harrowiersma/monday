import { useMemo } from 'react'
import ToolShell from '../../components/ToolShell'
import ExportButton from '../../components/ExportButton'
import { usePersistentDoc, clearDoc } from '../../lib/storage'
import type { AppendixTemplate } from '../../framework'
import type { ToolDef } from '../registry'
import type { ExportDocument } from '../../lib/exportModel'

interface FieldDef {
  id: string
  label: string
  type: string
  help: string
}
type Cell = string | number | boolean
type Row = Record<string, Cell>
interface VelocityDoc {
  rows: Row[]
}

export default function VelocityTemplate({
  template,
  tool,
}: {
  template: AppendixTemplate
  tool: ToolDef
}) {
  const t = template as unknown as {
    name: string
    purpose: string
    scope: string
    fields: FieldDef[]
    rowCount: number
  }
  const fields = t.fields
  const rowCount = t.rowCount

  const [doc, setDoc, savedAt] = usePersistentDoc<VelocityDoc>(tool.id, () => ({
    rows: Array.from({ length: rowCount }, () => ({})),
  }))

  function setCell(rowIdx: number, fieldId: string, value: Cell) {
    setDoc((d) => ({
      ...d,
      rows: d.rows.map((r, i) =>
        i === rowIdx ? { ...r, [fieldId]: value } : r,
      ),
    }))
  }

  const metrics = useMemo(() => {
    const filled = doc.rows.filter(
      (r) => String(r.whatWasDecided ?? '').trim() !== '',
    )
    const nums = (k: string) =>
      filled
        .map((r) => Number(r[k]))
        .filter((n) => Number.isFinite(n) && String(n) !== 'NaN')
    const dur = nums('durationDays')
    const esc = nums('escalations')
    const avg = (a: number[]) =>
      a.length ? a.reduce((s, n) => s + n, 0) / a.length : null
    const docTrue = filled.filter(
      (r) => r.documentedAndCommunicated === true,
    ).length
    return {
      filled: filled.length,
      avgDuration: avg(dur),
      avgEscalations: avg(esc),
      documentedRate: filled.length ? docTrue / filled.length : null,
    }
  }, [doc])

  const fmt = (n: number | null, suffix = '') =>
    n === null ? '—' : `${Math.round(n * 10) / 10}${suffix}`

  function buildDocument(): ExportDocument {
    return {
      toolId: tool.id,
      toolName: t.name,
      title: t.name,
      blocks: [
        { type: 'paragraph', text: t.purpose },
        {
          type: 'table',
          headers: fields.map((f) => f.label),
          rows: doc.rows.map((r) =>
            fields.map((f) => {
              const v = r[f.id]
              if (f.type === 'boolean') return v === true ? 'Yes' : 'No'
              return v === undefined || v === '' ? '—' : String(v)
            }),
          ),
        },
        { type: 'subheading', text: 'Baseline metrics' },
        {
          type: 'keyvalue',
          items: [
            {
              label: 'Decisions tracked',
              value: `${metrics.filled} of ${rowCount}`,
            },
            {
              label: 'Average decision duration',
              value: fmt(metrics.avgDuration, ' days'),
            },
            {
              label: 'Average escalations per decision',
              value: fmt(metrics.avgEscalations),
            },
            {
              label: 'Documented & communicated',
              value:
                metrics.documentedRate === null
                  ? '—'
                  : `${Math.round(metrics.documentedRate * 100)}%`,
            },
          ],
        },
      ],
    }
  }

  return (
    <ToolShell
      chapter={tool.chapter}
      title={t.name}
      lede={t.purpose}
      savedAt={savedAt}
      onReset={() => {
        clearDoc(tool.id)
        setDoc({ rows: Array.from({ length: rowCount }, () => ({})) })
      }}
      exportSlot={
        <ExportButton
          buildDocument={buildDocument}
          gateCopy={`Want a clean PDF of your ${t.name} to bring to your Monday morning meeting? Enter your email and we'll generate and send it to you.`}
        />
      }
    >
      <div className="callout">
        <strong>Scope.</strong> {t.scope}
      </div>

      <div className="panel">
        <h2>Track {rowCount} recent governance decisions</h2>
        <div className="heatmap-wrap">
          <table className="heatmap" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ width: 28 }}>#</th>
                {fields.map((f) => (
                  <th key={f.id} title={f.help}>
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.rows.map((row, i) => (
                <tr key={i}>
                  <th>{i + 1}</th>
                  {fields.map((f) => (
                    <td key={f.id} style={{ padding: 4 }}>
                      {f.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={row[f.id] === true}
                          style={{ width: 'auto' }}
                          onChange={(e) =>
                            setCell(i, f.id, e.target.checked)
                          }
                        />
                      ) : f.type === 'number' ? (
                        <input
                          type="number"
                          min={0}
                          value={
                            row[f.id] === undefined
                              ? ''
                              : String(row[f.id])
                          }
                          style={{ width: 70 }}
                          onChange={(e) =>
                            setCell(i, f.id, e.target.value)
                          }
                        />
                      ) : (
                        <input
                          type="text"
                          value={
                            row[f.id] === undefined
                              ? ''
                              : String(row[f.id])
                          }
                          onChange={(e) =>
                            setCell(i, f.id, e.target.value)
                          }
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          A row counts toward the baseline once it has a decision in the first
          column.
        </p>
      </div>

      <div className="panel">
        <h2>Your baseline</h2>
        <div className="scorebox">
          <div className="score-num">
            <div className="n">{fmt(metrics.avgDuration)}</div>
            <div className="lbl">avg days to decide</div>
          </div>
          <div className="score-band">
            <p style={{ margin: 0 }} className="small">
              <strong>{metrics.filled}</strong> of {rowCount} decisions
              tracked.
            </p>
            <p style={{ margin: '4px 0 0' }} className="small">
              Average escalations: <strong>{fmt(metrics.avgEscalations)}</strong>
            </p>
            <p style={{ margin: '4px 0 0' }} className="small">
              Documented &amp; communicated:{' '}
              <strong>
                {metrics.documentedRate === null
                  ? '—'
                  : `${Math.round(metrics.documentedRate * 100)}%`}
              </strong>
            </p>
            <p className="small muted" style={{ margin: '8px 0 0' }}>
              This baseline tells you where you are and gives you a target to
              beat.
            </p>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
