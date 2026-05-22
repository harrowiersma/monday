import 'dotenv/config'
// Local development export bridge for App A — the Monday Morning Companion.
// In production this same logic runs as a Netlify Function
// (netlify/functions/export.js); both call the shared processExport().
import express from 'express'
import cors from 'cors'
import { processExport } from './exportBridge.js'

const PORT = process.env.PORT || 8787
const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/export', async (req, res) => {
  const result = await processExport(req.body)
  res.status(result.statusCode).json(result.json)
})

app.listen(PORT, () => {
  console.log(`[export-bridge] listening on http://localhost:${PORT}`)
})
