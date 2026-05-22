// Shared export-bridge logic, used by BOTH the local Express dev server
// (server/index.js) and the Netlify Function (netlify/functions/export.js).
// It generates the artifact PDF in memory, emails it, and pushes the lead
// to a CRM. No filesystem use — so it runs unchanged in a serverless runtime.
import nodemailer from 'nodemailer'
import PDFDocument from 'pdfkit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const slug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ---------------------------------------------------------------------------
// Orchestration — validate, render, email, push lead. Returns a plain result.
// ---------------------------------------------------------------------------
export async function processExport(payload) {
  const { email, document } = payload || {}
  if (!email || !EMAIL_RE.test(String(email))) {
    return { statusCode: 400, json: { message: 'A valid email address is required.' } }
  }
  if (!document || !Array.isArray(document.blocks)) {
    return { statusCode: 400, json: { message: 'No artifact document was provided.' } }
  }

  try {
    const pdf = await renderPdfBuffer(document)
    const emailResult = await sendEmail(email, document, pdf)

    // Awaited (not fire-and-forget) so it completes before a serverless
    // function freezes — but a CRM failure must not fail the export.
    try {
      await pushLeadToCrm(email, document)
    } catch (err) {
      console.error('[CRM] lead push failed:', err.message)
    }

    return {
      statusCode: 200,
      json: {
        message: emailResult.delivered
          ? 'Your PDF is on its way — check your inbox shortly.'
          : 'Your PDF was generated. (Email delivery is not configured in this environment.)',
      },
    }
  } catch (err) {
    console.error('[export] failed:', err)
    return {
      statusCode: 500,
      json: { message: 'Sorry — the PDF could not be generated. Please try again.' },
    }
  }
}

// ---------------------------------------------------------------------------
// PDF rendering — one code path for every tool, driven by the block model.
// Renders to an in-memory Buffer.
// ---------------------------------------------------------------------------
const NAVY = '#1f3a5f'
const INK = '#1c2530'
const MUTED = '#64748b'
const LINE = '#d9dee5'

export function renderPdfBuffer(docModel) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks = []
    pdf.on('data', (c) => chunks.push(c))
    pdf.on('end', () => resolve(Buffer.concat(chunks)))
    pdf.on('error', reject)

    const left = pdf.page.margins.left
    const right = pdf.page.width - pdf.page.margins.right
    const width = right - left

    // header band
    pdf.rect(0, 0, pdf.page.width, 96).fill(NAVY)
    pdf.fillColor('#9fb3c8').fontSize(9)
    pdf.text('THE MONDAY MORNING COMPANION', left, 30, { characterSpacing: 1 })
    pdf.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
    pdf.text(docModel.title || 'Governance Artifact', left, 46, { width })
    pdf.fillColor('#9fb3c8').fontSize(9).font('Helvetica')
    pdf.text(
      `${docModel.toolName || ''}  ·  generated ${new Date().toLocaleDateString(
        'en-GB',
        { day: 'numeric', month: 'long', year: 'numeric' },
      )}`,
      left,
      72,
      { width },
    )
    pdf.y = 120
    pdf.fillColor(INK)

    const ensureSpace = (h) => {
      if (pdf.y + h > pdf.page.height - pdf.page.margins.bottom) pdf.addPage()
    }

    for (const block of docModel.blocks) {
      // Reset the horizontal cursor — score/grid/table blocks leave pdf.x
      // offset, which would indent and clip the next text block.
      pdf.x = left
      switch (block.type) {
        case 'heading':
          ensureSpace(40)
          pdf.moveDown(0.5)
          pdf.fillColor(NAVY).font('Helvetica-Bold').fontSize(16)
          pdf.text(block.text, { width })
          pdf.moveDown(0.3)
          break
        case 'subheading':
          ensureSpace(34)
          pdf.moveDown(0.6)
          pdf.fillColor(NAVY).font('Helvetica-Bold').fontSize(12)
          pdf.text(block.text, { width })
          pdf.moveDown(0.2)
          break
        case 'paragraph':
          ensureSpace(40)
          pdf.fillColor(INK).font('Helvetica').fontSize(10.5)
          pdf.text(block.text, { width, align: 'left' })
          pdf.moveDown(0.4)
          break
        case 'list':
          pdf.fillColor(INK).font('Helvetica').fontSize(10.5)
          block.items.forEach((it, i) => {
            ensureSpace(20)
            const prefix = block.ordered ? `${i + 1}. ` : '•  '
            pdf.text(prefix + it, left + 6, pdf.y, { width: width - 6 })
            pdf.moveDown(0.15)
          })
          pdf.moveDown(0.3)
          break
        case 'keyvalue':
          pdf.fontSize(10.5)
          for (const item of block.items) {
            ensureSpace(22)
            const y0 = pdf.y
            pdf.font('Helvetica-Bold').fillColor(NAVY)
            pdf.text(item.label, left, y0, { width: 150, continued: false })
            pdf.font('Helvetica').fillColor(INK)
            pdf.text(item.value || '—', left + 160, y0, { width: width - 160 })
            pdf.y = Math.max(pdf.y, y0) + 4
          }
          pdf.moveDown(0.3)
          break
        case 'score':
          renderScore(pdf, block, left, width, ensureSpace)
          break
        case 'grid':
          renderGrid(pdf, block, left, width, ensureSpace)
          break
        case 'table':
          renderTable(pdf, block, left, width, ensureSpace)
          break
        case 'spacer':
          pdf.moveDown(1)
          break
        default:
          break
      }
    }

    // footer — kept well inside the printable area so pdfkit never paginates it
    pdf
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        "From the companion app to 'Don't Screw Up Your Data Governance' by Harro M. Wiersma.",
        left,
        pdf.page.height - pdf.page.margins.bottom - 18,
        { width, lineBreak: false },
      )
    pdf.end()
  })
}

function renderScore(pdf, block, left, width, ensureSpace) {
  ensureSpace(88)
  const y0 = pdf.y + 4
  const boxW = 120
  pdf.roundedRect(left, y0, boxW, 70, 6).fill(NAVY)
  pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(30)
  pdf.text(String(block.value), left, y0 + 12, { width: boxW, align: 'center' })
  pdf.fillColor('#9fb3c8').font('Helvetica').fontSize(9)
  pdf.text(`of ${block.max}`, left, y0 + 46, { width: boxW, align: 'center' })

  const tx = left + boxW + 16
  const tw = width - boxW - 16
  pdf.fillColor(NAVY).font('Helvetica-Bold').fontSize(11)
  pdf.text(block.label, tx, y0 + 4, { width: tw })
  if (block.band) {
    pdf.fillColor('#2f6db0').fontSize(10)
    pdf.text(block.band, tx, pdf.y + 2, { width: tw })
  }
  if (block.detail) {
    pdf.fillColor(MUTED).font('Helvetica').fontSize(9)
    pdf.text(block.detail, tx, pdf.y + 2, { width: tw })
  }
  pdf.y = Math.max(pdf.y, y0 + 70) + 10
  pdf.fillColor(INK)
}

function renderGrid(pdf, block, left, width, ensureSpace) {
  const cols = block.columns
  if (block.caption) {
    ensureSpace(20)
    pdf.fillColor(MUTED).font('Helvetica-Oblique').fontSize(9)
    pdf.text(block.caption, left, pdf.y, { width })
    pdf.moveDown(0.2)
  }
  const labelW = Math.min(150, width * 0.32)
  const cellW = (width - labelW) / Math.max(cols.length, 1)
  const rowH = 22

  ensureSpace(rowH * (block.rows.length + 1) + 10)
  let y = pdf.y + 2

  pdf.rect(left, y, labelW, rowH).fill(NAVY)
  cols.forEach((c, i) => {
    pdf.rect(left + labelW + i * cellW, y, cellW, rowH).fill(NAVY)
    pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5)
    pdf.text(c, left + labelW + i * cellW + 2, y + 7, {
      width: cellW - 4,
      align: 'center',
    })
  })
  y += rowH

  for (const row of block.rows) {
    pdf.rect(left, y, labelW, rowH).fillAndStroke('#eef1f5', LINE)
    pdf.fillColor(NAVY).font('Helvetica-Bold').fontSize(7.5)
    pdf.text(row.label, left + 4, y + 7, { width: labelW - 8 })
    row.cells.forEach((cell, i) => {
      const cx = left + labelW + i * cellW
      pdf.rect(cx, y, cellW, rowH).fillAndStroke(cell.color, '#ffffff')
      if (cell.text) {
        pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7)
        pdf.text(cell.text, cx + 2, y + 7, { width: cellW - 4, align: 'center' })
      }
    })
    y += rowH
  }
  pdf.y = y + 10
  pdf.fillColor(INK)
}

function renderTable(pdf, block, left, width, ensureSpace) {
  const headers = block.headers
  const n = headers.length
  const colW = width / n
  const pad = 4

  const rowHeight = (cells, font, size) => {
    pdf.font(font).fontSize(size)
    let h = 16
    cells.forEach((c) => {
      h = Math.max(
        h,
        pdf.heightOfString(String(c ?? ''), { width: colW - pad * 2 }) + 8,
      )
    })
    return h
  }

  ensureSpace(40)
  let y = pdf.y + 2

  const hh = rowHeight(headers, 'Helvetica-Bold', 8.5)
  pdf.rect(left, y, width, hh).fill(NAVY)
  headers.forEach((h, i) => {
    pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
    pdf.text(String(h), left + i * colW + pad, y + 4, { width: colW - pad * 2 })
  })
  y += hh

  block.rows.forEach((row, ri) => {
    const rh = rowHeight(row, 'Helvetica', 8.5)
    if (y + rh > pdf.page.height - pdf.page.margins.bottom) {
      pdf.addPage()
      y = pdf.y
    }
    if (ri % 2 === 1) pdf.rect(left, y, width, rh).fill('#f4f5f7')
    row.forEach((c, i) => {
      pdf.fillColor(INK).font('Helvetica').fontSize(8.5)
      pdf.text(String(c ?? ''), left + i * colW + pad, y + 4, {
        width: colW - pad * 2,
      })
    })
    pdf
      .moveTo(left, y + rh)
      .lineTo(left + width, y + rh)
      .strokeColor(LINE)
      .stroke()
    y += rh
  })
  pdf.y = y + 10
  pdf.fillColor(INK)
}

// ---------------------------------------------------------------------------
// Email delivery — uses SMTP if configured, otherwise degrades gracefully.
// ---------------------------------------------------------------------------
async function sendEmail(to, docModel, pdfBuffer) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log(`[mail] SMTP not configured — would email ${to}`)
    return { delivered: false }
  }
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  await transport.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject: `Your ${docModel.toolName || 'governance artifact'} — Monday Morning Companion`,
    text: `Attached is the PDF of your "${docModel.title}", generated with the Monday Morning Companion, the companion app to "Don't Screw Up Your Data Governance" by Harro M. Wiersma.`,
    attachments: [
      { filename: `${slug(docModel.toolName || 'artifact')}.pdf`, content: pdfBuffer },
    ],
  })
  console.log(`[mail] sent ${docModel.toolName} PDF to ${to}`)
  return { delivered: true }
}

// ---------------------------------------------------------------------------
// CRM lead bridge — a swappable webhook. Point CRM_WEBHOOK_URL at any CRM.
// ---------------------------------------------------------------------------
async function pushLeadToCrm(email, docModel) {
  const url = process.env.CRM_WEBHOOK_URL
  const lead = {
    email,
    source: 'monday-morning-companion',
    tool: docModel.toolName,
    artifactTitle: docModel.title,
    capturedAt: new Date().toISOString(),
  }
  if (!url) {
    console.log('[CRM] no CRM_WEBHOOK_URL set — would push lead:', lead)
    return
  }
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  })
  console.log(`[CRM] lead pushed for ${email} — status ${resp.status}`)
}
