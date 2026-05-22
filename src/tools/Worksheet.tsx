import { useParams } from 'react-router-dom'
import ToolShell from '../components/ToolShell'
import ExportButton from '../components/ExportButton'
import { usePersistentDoc, clearDoc } from '../lib/storage'
import { getDeliverable } from '../framework'
import { toolById } from './registry'
import type { ExportBlock, ExportDocument } from '../lib/exportModel'

interface WorksheetDoc {
  responses: Record<number, string>
  notes: string
}

// A generic tool for the book's reflective Monday Morning Deliverables —
// the chapters whose exercise is a set of prompts or immediate actions
// rather than a grid or scorecard.
export default function Worksheet() {
  const { id = '' } = useParams()
  const deliverable = getDeliverable(id) as unknown as
    | {
        title: string
        intro: string
        prompts?: string[]
        actions?: string[]
        followUp?: string
      }
    | undefined
  const tool = toolById(id)

  const [doc, setDoc, savedAt] = usePersistentDoc<WorksheetDoc>(id, {
    responses: {},
    notes: '',
  })

  if (!deliverable || !tool) {
    return (
      <div className="content">
        <h1>Worksheet not found</h1>
      </div>
    )
  }

  const items = deliverable.prompts ?? deliverable.actions ?? []
  const isActions = !deliverable.prompts && !!deliverable.actions
  const answered = items.filter((_, i) => (doc.responses[i] ?? '').trim()).length

  function setResponse(i: number, value: string) {
    setDoc((d) => ({ ...d, responses: { ...d.responses, [i]: value } }))
  }

  function buildDocument(): ExportDocument {
    const blocks: ExportBlock[] = [
      { type: 'paragraph', text: deliverable!.intro },
      {
        type: 'score',
        label: 'Worksheet progress',
        value: answered,
        max: items.length,
        detail: `${answered} of ${items.length} ${
          isActions ? 'actions' : 'questions'
        } responded to.`,
      },
    ]
    items.forEach((item, i) => {
      blocks.push({ type: 'subheading', text: `${i + 1}. ${item}` })
      blocks.push({
        type: 'paragraph',
        text: (doc.responses[i] ?? '').trim() || '(not yet answered)',
      })
    })
    if (deliverable!.followUp) {
      blocks.push({ type: 'subheading', text: 'Next step' })
      blocks.push({ type: 'paragraph', text: deliverable!.followUp })
    }
    if (doc.notes.trim()) {
      blocks.push({ type: 'subheading', text: 'Notes' })
      blocks.push({ type: 'paragraph', text: doc.notes.trim() })
    }
    return {
      toolId: id,
      toolName: deliverable!.title,
      title: deliverable!.title,
      blocks,
    }
  }

  return (
    <ToolShell
      chapter={tool.chapter}
      title={deliverable.title}
      lede={deliverable.intro}
      savedAt={savedAt}
      onReset={() => {
        clearDoc(id)
        setDoc({ responses: {}, notes: '' })
      }}
      exportSlot={
        <ExportButton
          buildDocument={buildDocument}
          gateCopy={`Want a clean PDF of your "${deliverable.title}" worksheet to bring to your Monday morning meeting? Enter your email and we'll generate and send it to you.`}
        />
      }
    >
      <div className="panel">
        <div className="row" style={{ marginBottom: 4 }}>
          <h2 style={{ margin: 0 }}>
            {isActions ? 'Immediate actions' : 'Work through these'}
          </h2>
          <span className="spacer" />
          <span className="save-pill" style={{ background: 'transparent' }}>
            {answered}/{items.length} done
          </span>
        </div>
        {items.map((item, i) => (
          <div className="check-item" key={i}>
            <p className="ci-name" style={{ margin: '0 0 8px' }}>
              {i + 1}. {item}
            </p>
            <textarea
              value={doc.responses[i] ?? ''}
              placeholder={
                isActions
                  ? 'Notes, owner, target date, status…'
                  : 'Your answer…'
              }
              onChange={(e) => setResponse(i, e.target.value)}
            />
          </div>
        ))}
      </div>

      {deliverable.followUp && (
        <div className="callout">
          <strong>Next step.</strong> {deliverable.followUp}
        </div>
      )}

      <div className="panel">
        <label className="field" style={{ marginBottom: 0 }}>
          <span>
            Notes{' '}
            <span className="hint">
              — anything else this exercise surfaced
            </span>
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
