// Netlify Function — the production export bridge.
// The frontend calls /api/export; netlify.toml redirects that here.
// Reuses the exact same logic as the local dev server.
import { processExport } from '../../server/exportBridge.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method not allowed.' }),
    }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Invalid request body.' }),
    }
  }

  const result = await processExport(payload)
  return {
    statusCode: result.statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.json),
  }
}
