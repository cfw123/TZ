/**
 * dbService — single source of truth backed by db.json.
 *
 * All data is served from an in-memory cache. Changes are written back to
 * localStorage so they survive a page refresh.
 *
 * Table names match the top-level keys in db.json exactly:
 *   operation_record_rows
 *   dried_sludge_rows
 *   fine_slag_coal_rows
 *   raw_coal_rows
 *   fuel_coal_rows
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DbRow {
  __id?: string
  id?: string
  updatedAt?: number
  [key: string]: unknown
}

type TableName = 'operation_record_rows' | 'dried_sludge_rows' | 'fine_slag_coal_rows' | 'raw_coal_rows' | 'fuel_coal_rows'

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

const tables = new Map<TableName, DbRow[]>()

const ALL_TABLES: TableName[] = [
  'operation_record_rows',
  'dried_sludge_rows',
  'fine_slag_coal_rows',
  'raw_coal_rows',
  'fuel_coal_rows',
]

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

const CACHE_KEY = 'tz_db_cache_v1'

function persist() {
  try {
    const snapshot: Record<string, DbRow[]> = {}
    for (const name of ALL_TABLES) snapshot[name] = tables.get(name) ?? []
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot))
  } catch (e) {
    console.warn('[dbService] persist failed:', e)
  }
}

function loadSnapshot(): Record<string, DbRow[]> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_) {
    return null
  }
}

// ---------------------------------------------------------------------------
// Initialization — always synchronous on first call
// db.json is inlined at build time via import.meta.glob, so no network needed.
// localStorage snapshot (mutations from this session) wins over defaults.
// ---------------------------------------------------------------------------

// Vite inlines db.json at build time — no network request needed.
const _dbGlob = import.meta.glob('../db.json', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const _rawJson: Record<string, unknown> = Object.values(_dbGlob)[0] ? JSON.parse(Object.values(_dbGlob)[0]) : {}
const DB_DEFAULTS: Record<string, DbRow[]> = {}
for (const key of ALL_TABLES) {
  if (Array.isArray(_rawJson[key])) DB_DEFAULTS[key] = _rawJson[key] as DbRow[]
}

let _inited = false

function init() {
  if (_inited) return
  _inited = true

  const snapshot = loadSnapshot()
  for (const name of ALL_TABLES) {
    const cached = snapshot?.[name]
    if (Array.isArray(cached)) {
      tables.set(name, cached)
    } else {
      tables.set(name, DB_DEFAULTS[name] ?? [])
    }
  }
}

// Run init immediately so all synchronous calls work from the start
init()

// ---------------------------------------------------------------------------
// CRUD — all synchronous
// ---------------------------------------------------------------------------

export const db = {
  list<T extends DbRow = DbRow>(table: TableName): T[] {
    return (tables.get(table) ?? []) as T[]
  },

  get<T extends DbRow = DbRow>(table: TableName, id: string): T | undefined {
    return (tables.get(table) ?? []).find(r => r.id === id || r.__id === id) as T | undefined
  },

  create<T extends DbRow = DbRow>(table: TableName, data: Omit<T, 'id'>): T {
    const id = (data as DbRow).id ?? (data as DbRow).__id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const row: DbRow = { ...data, id, updatedAt: Date.now() }
    tables.get(table)?.push(row)
    persist()
    return row as T
  },

  update<T extends DbRow = DbRow>(table: TableName, id: string, data: Partial<Omit<T, 'id'>>): T | null {
    const rows = tables.get(table) ?? []
    const idx = rows.findIndex(r => r.id === id || r.__id === id)
    if (idx < 0) return null
    rows[idx] = { ...rows[idx], ...data, id: rows[idx].id ?? id, updatedAt: Date.now() }
    persist()
    return rows[idx] as T
  },

  remove(table: TableName, id: string): boolean {
    const rows = tables.get(table) ?? []
    const next = rows.filter(r => r.id !== id && r.__id !== id)
    if (next.length === rows.length) return false
    tables.set(table, next)
    persist()
    return true
  },

  clear(table: TableName): void {
    tables.set(table, [])
    persist()
  },

  bulkPut(table: TableName, items: Array<Record<string, unknown>>): void {
    const existing = tables.get(table) ?? []
    const byId = new Map(existing.map(r => [r.id ?? r.__id, r]))
    for (const item of items) {
      const id = item.id ?? (item.__id as string | undefined)
      if (id && byId.has(id)) {
        byId.set(id, { ...byId.get(id)!, ...item, updatedAt: Date.now() })
      } else {
        existing.push({ ...item, updatedAt: Date.now() })
      }
    }
    tables.set(table, existing)
    persist()
  },

  replaceAll(table: TableName, items: DbRow[]): void {
    tables.set(table, items.map(r => ({ ...r, updatedAt: Date.now() })))
    persist()
  },
}

export default db
