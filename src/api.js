const API_BASE = '/api'

async function request(method, endpoint, data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (data !== null) {
    options.body = JSON.stringify(data)
  }
  const response = await fetch(`${API_BASE}${endpoint}`, options)
  if (!response.ok) {
    throw new Error(`API ${method} ${endpoint} failed: ${response.status}`)
  }
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (_) {
    return text
  }
}

export const api = {
  list: (table) => request('GET', `/${table}`),
  get: (table, id) => request('GET', `/${table}/${id}`),
  create: (table, data) => request('POST', `/${table}`, data),
  update: (table, id, data) => request('PUT', `/${table}/${id}`, data),
  patch: (table, id, data) => request('PATCH', `/${table}/${id}`, data),
  remove: (table, id) => request('DELETE', `/${table}/${String(id)}`),
  bulkPut: async (table, items) => {
    const created = []
    for (const item of items) {
      const result = await api.create(table, item)
      if (Array.isArray(result)) {
        created.push(result[result.length - 1])
      } else {
        created.push(result)
      }
    }
    return created
  },
  clear: async (table) => {
    const items = await api.list(table)
    await Promise.all(items.map(item => api.remove(table, String(item.id || item.__id))))
  },
}

export default api
