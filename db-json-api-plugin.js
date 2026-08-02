import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(process.cwd(), 'db.json')

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

function tableKey(table) {
  return table
}

export default function dbJsonApiPlugin() {
  return {
    name: 'db-json-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        const apiPath = '/api/'
        if (!url.startsWith(apiPath)) return next()

        const segments = url.slice(apiPath.length).split('/')
        if (segments.length < 1 || !segments[0]) return next()

        const table = segments[0]
        const idSegment = segments[1]
        const method = req.method

        let body = ''
        await new Promise(resolve => {
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', () => resolve(undefined))
        })

        res.setHeader('Content-Type', 'application/json')

        try {
          const db = readDb()
          const key = tableKey(table)
          if (!(key in db)) db[key] = []

          if (method === 'GET') {
            if (idSegment) {
              const item = db[key].find(r => String(r.id || r.__id) === idSegment)
              res.statusCode = item ? 200 : 404
              res.end(JSON.stringify(item || { error: 'Not found' }))
            } else {
              res.statusCode = 200
              res.end(JSON.stringify(db[key]))
            }
            return
          }

          if (method === 'POST') {
            const payload = JSON.parse(body || '{}')
            const __id = crypto.randomUUID()
            const id = __id.replace(/-/g, '').slice(0, 12)
            const record = { __id, ...payload, updatedAt: Date.now(), id }
            db[key] = [...db[key], record]
            writeDb(db)
            res.statusCode = 200
            res.end(JSON.stringify(record))
            return
          }

          if (method === 'PUT' || method === 'PATCH') {
            if (!idSegment) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing id' })); return }
            const idx = db[key].findIndex(r => String(r.id || r.__id) === idSegment)
            if (idx < 0) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return }
            const merged = { ...db[key][idx], ...JSON.parse(body || '{}'), id: db[key][idx].id, __id: db[key][idx].__id }
            db[key][idx] = merged
            writeDb(db)
            res.statusCode = 200
            res.end(JSON.stringify(merged))
            return
          }

          if (method === 'DELETE') {
            if (!idSegment) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing id' })); return }
            db[key] = db[key].filter(r => String(r.id || r.__id) !== idSegment)
            writeDb(db)
            res.statusCode = 200
            res.end(JSON.stringify({ success: true }))
            return
          }

          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}
