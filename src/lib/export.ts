import type { ExportDocument } from './exportModel'
import { rememberEmail } from './storage'

export interface ExportResult {
  ok: boolean
  message: string
}

/**
 * The lead-capture bridge. The email is captured ONLY here, at export time —
 * it never blocks use of the tools. The backend generates the PDF server-side,
 * emails it, and pushes the lead to the CRM.
 */
export async function requestExport(
  email: string,
  doc: ExportDocument,
): Promise<ExportResult> {
  rememberEmail(email)
  try {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, document: doc }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      message?: string
      downloadUrl?: string
    }
    if (!res.ok) {
      return {
        ok: false,
        message:
          data.message ??
          'The export service could not be reached. Your work is saved on this device — try again later.',
      }
    }
    return {
      ok: true,
      message:
        data.message ??
        "Your PDF is on its way. We'll email it to you shortly.",
    }
  } catch {
    return {
      ok: false,
      message:
        'The export service is offline. Your work is saved on this device — you can export when you reconnect.',
    }
  }
}
