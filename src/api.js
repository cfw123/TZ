/**
 * @api.js — HTTP client for the Vite dev middleware (db-json-api-plugin.js)
 * that persists JSON CRUD to /<root>/db.json on disk.
 *
 * Base URL: /api  (proxied by db-json-api-plugin in vite.config.js)
 * Each row's flat camelCase payload is sent verbatim, so every field on the
 * record is preserved.
 */

const BASE = '/api/operation_record_rows'

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  /** GET /api/operation_record_rows */
  list() {
    return request(BASE)
  },

  /** POST /api/operation_record_rows — body is the full row payload */
  createRow(payload) {
    return request(BASE, { method: 'POST', body: JSON.stringify(payload) })
  },

  /** PUT /api/operation_record_rows/:id — body is the full row payload */
  updateRow(id, payload) {
    return request(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  /** DELETE /api/operation_record_rows/:id */
  deleteRow(id) {
    return request(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}

export default api
