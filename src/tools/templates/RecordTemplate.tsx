import { useState } from 'react'
import ToolShell from '../../components/ToolShell'
import ExportButton from '../../components/ExportButton'
import { usePersistentDoc, clearDoc } from '../../lib/storage'
import { uid } from '../../lib/uid'
import type { AppendixTemplate, GcfLayer } from '../../framework'
import type { ToolDef } from '../registry'
import type { ExportBlock, ExportDocument } from '../../lib/exportModel'

interface FieldDef {
  id: string
  label: string
  type: string
  help: string
}
interface Rec {
  id: string
  values: Record<string, string | string[]>
}
interface RecordDoc {
  records: Rec[]
}

function emptyRecord(fields: FieldDef[]): Rec {
  const values: Record<string, string | string[]> = {}
  for (const f of fields) values[f.id] = f.type === 'layerMultiSelect' ? [] : ''
  return { id: uid(), values }
}

export default function RecordTemplate({
  template,
  tool,
  layers,
}: {
  template: AppendixTemplate
  tool: ToolDef
  layers: readonly GcfLayer[]
}) {
  const tpl = template as unknown as {
    name: string
    purpose: string
    scope: string
    fields: FieldDef[]
  }
  const fields = tpl.fields
  const [doc, setDoc, savedAt] = usePersistentDoc<RecordDoc>(tool.id, () => ({
    records: [emptyRecord(fields)],
  }))
  const [active, setActive] = useState(0)
  const idx = Math.min(active, doc.records.length - 1)
  const record = doc.records[idx]

  function setValue(fieldId: string, value: string | string[]) {
    setDoc((d) => ({
      ...d,
      records: d.records.map((r, i) =>
        i === idx ? { ...r, values: { ...r.values, [fieldId]: value } } : r,
      ),
    }))
  }
  function addRecord() {
    setDoc((d) => ({ ...d, records: [...d.records, emptyRecord(fields)] }))
    setActive(doc.records.length)
  }
  function removeRecord() {
    setDoc((d) => ({ ...d, records: d.records.filter((_, i) => i !== idx) }))
    setActive(0)
  }

  const recordTitle = (r: Rec) =>
    (typeof r.values[fields[0].id] === 'string'
      ? (r.values[fields[0].id] as string)
      : '') || 'Untitled'

  function buildDocument(): ExportDocument {
    const blocks: ExportBlock[] = [
      { type: 'paragraph', text: tpl.purpose },
    ]
    for (const r of doc.records) {
      blocks.push({ type: 'subheading', text: recordTitle(r) })
      const kv: { label: string; value: string }[] = []
      for (const f of fields) {
        const v = r.values[f.id]
        if (f.type === 'list') {
          const items = String(v ?? '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
          if (items.length) {
            kv.length && blocks.push({ type: 'keyvalue', items: [...kv] })
            kv.length = 0
            blocks.push({ type: 'subheading', text: f.label })
            blocks.push({ type: 'list', items })
          }
        } else if (f.type === 'layerMultiSelect') {
          kv.push({
            label: f.label,
            value: Array.isArray(v) && v.length ? v.join(', ') : '—',
          })
        } else {
          kv.push({ label: f.label, value: String(v ?? '') || '—' })
        }
      }
      if (kv.length) blocks.push({ type: 'keyvalue', items: kv })
    }
    return {
      toolId: tool.id,
      toolName: tpl.name,
      title: tpl.name,
      blocks,
    }
  }

  return (
    <ToolShell
      chapter={tool.chapter}
      title={tpl.name}
      lede={tpl.purpose}
      savedAt={savedAt}
      onReset={() => {
        clearDoc(tool.id)
        setDoc({ records: [emptyRecord(fields)] })
        setActive(0)
      }}
      exportSlot={
        <ExportButton
          buildDocument={buildDocument}
          gateCopy={`Want a clean PDF of your ${tpl.name} to bring to your Monday morning meeting? Enter your email and we'll generate and send it to you.`}
        />
      }
    >
      <div className="callout">
        <strong>Scope.</strong> {tpl.scope}
      </div>

      <div className="panel">
        <div className="tablist">
          {doc.records.map((r, i) => (
            <button
              key={r.id}
              className={i === idx ? 'active' : ''}
              onClick={() => setActive(i)}
            >
              {recordTitle(r)}
            </button>
          ))}
          <button onClick={addRecord}>+ New</button>
        </div>

        {record &&
          fields.map((f) => {
            const v = record.values[f.id]
            return (
              <label className="field" key={f.id}>
                <span>
                  {f.label}{' '}
                  {f.help && <span className="hint">— {f.help}</span>}
                </span>
                {f.type === 'text' && (
                  <input
                    type="text"
                    value={typeof v === 'string' ? v : ''}
                    onChange={(e) => setValue(f.id, e.target.value)}
                  />
                )}
                {(f.type === 'longtext' || f.type === 'list') && (
                  <textarea
                    value={typeof v === 'string' ? v : ''}
                    placeholder={
                      f.type === 'list' ? 'One item per line' : undefined
                    }
                    onChange={(e) => setValue(f.id, e.target.value)}
                  />
                )}
                {f.type === 'layerMultiSelect' && (
                  <div className="row">
                    {layers.map((l) => {
                      const arr = Array.isArray(v) ? v : []
                      const on = arr.includes(l.name)
                      return (
                        <button
                          key={l.id}
                          className="btn small"
                          style={{
                            background: on ? 'var(--accent)' : 'transparent',
                            color: on ? '#fff' : 'var(--accent)',
                          }}
                          onClick={() =>
                            setValue(
                              f.id,
                              on
                                ? arr.filter((x) => x !== l.name)
                                : [...arr, l.name],
                            )
                          }
                        >
                          {l.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </label>
            )
          })}

        <button
          className="btn ghost danger small"
          disabled={doc.records.length <= 1}
          onClick={removeRecord}
        >
          Remove this {tpl.name.toLowerCase()}
        </button>
      </div>
    </ToolShell>
  )
}
