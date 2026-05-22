import { useState } from 'react'
import type { ExportDocument } from '../lib/exportModel'
import { requestExport } from '../lib/export'
import { recalledEmail } from '../lib/storage'

interface Props {
  /** Built lazily so the PDF always reflects the latest saved state. */
  buildDocument: () => ExportDocument
  /** The email-gate prompt. The book specifies bespoke copy per tool. */
  gateCopy: string
  label?: string
  disabled?: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ExportButton({
  buildDocument,
  gateCopy,
  label = 'Export to PDF',
  disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(recalledEmail())
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>(
    'idle',
  )
  const [message, setMessage] = useState('')

  const valid = EMAIL_RE.test(email.trim())

  async function submit() {
    if (!valid) return
    setStatus('sending')
    const result = await requestExport(email.trim(), buildDocument())
    setMessage(result.message)
    setStatus(result.ok ? 'done' : 'error')
  }

  function close() {
    setOpen(false)
    setStatus('idle')
    setMessage('')
  }

  return (
    <>
      <button
        className="btn"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        ⤓ {label}
      </button>

      {open && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="modal" role="dialog" aria-modal="true">
            {status === 'done' ? (
              <>
                <h2>Check your inbox</h2>
                <p className="muted">{message}</p>
                <div className="row">
                  <span className="spacer" />
                  <button className="btn" onClick={close}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Email me the PDF</h2>
                <p className="muted" style={{ marginTop: 0 }}>
                  {gateCopy}
                </p>
                <label className="field">
                  <span>Email address</span>
                  <input
                    type="email"
                    value={email}
                    autoFocus
                    placeholder="you@company.com"
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                  />
                </label>
                {status === 'error' && (
                  <p
                    className="small"
                    style={{ color: 'var(--red)', marginTop: 0 }}
                  >
                    {message}
                  </p>
                )}
                <p className="small muted">
                  Your work stays saved on this device either way — the
                  email is only used to send the PDF.
                </p>
                <div className="row">
                  <button className="btn ghost" onClick={close}>
                    Cancel
                  </button>
                  <span className="spacer" />
                  <button
                    className="btn"
                    disabled={!valid || status === 'sending'}
                    onClick={submit}
                  >
                    {status === 'sending'
                      ? 'Generating…'
                      : 'Generate & send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
