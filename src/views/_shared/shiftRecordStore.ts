import { reactive, watch } from 'vue'
import { db } from './dbService'

// ---------------------------------------------------------------------------
// Shape: a single shift's consumption payload, as confirmed from DailyConsumption
// ---------------------------------------------------------------------------

export interface BoilerConsumption {
  subtotal: number
  hl_A: number
  hl_B: number
  jz_A: number
  jz_B: number
  xz_A: number
  xz_B: number
  wn_A: number
  wn_B: number
  yl_A: number
  yl_B: number
  lx_A: number
  lx_B: number
}

export interface GasificationConsumption {
  subtotal: number
  coal_A: number
  coal_B: number
}

export interface ShiftPayload {
  record_date: string
  shift_batch: string
  boiler_consumptions: BoilerConsumption
  gasification_consumptions: GasificationConsumption
}

// ---------------------------------------------------------------------------
// Shape: one confirmed shift row consumed by OperationRecordView.
// `boiler_daily_total` and `gasification_daily_total` are computed from all
// confirmed shifts on the same date, while each consumption object retains
// only the current shift's subtotal and details.
// ---------------------------------------------------------------------------
export interface OperationRecord {
  id: string | number
  record_date: string
  shift_batch: string
  boiler_consumptions: BoilerConsumption
  gasification_consumptions: GasificationConsumption
  boiler_daily_total: number
  gasification_daily_total: number
}

// ---------------------------------------------------------------------------
// Reactive store backed by dbService (localStorage persistence)
// ---------------------------------------------------------------------------
export const shiftRecordStore = reactive<ShiftPayload[]>([])

export function upsertShiftRecord(payload: ShiftPayload): void {
  const idx = shiftRecordStore.findIndex(
    p => p.record_date === payload.record_date && p.shift_batch === payload.shift_batch
  )
  if (idx >= 0) {
    shiftRecordStore[idx] = payload
  } else {
    shiftRecordStore.push(payload)
  }
  // Persist to dbService so changes survive page refresh
  const existing = db.list('operation_record_rows')
  const row = existing.find(r =>
    r.recordDate === payload.record_date && r.shiftBatch === payload.shift_batch
  )
  const dbRow = buildDbRow(payload)
  if (row?.id) {
    db.update('operation_record_rows', row.id, dbRow)
  } else {
    db.create('operation_record_rows', dbRow)
  }
}

export function removeShiftRecord(record_date: string, shift_batch: string): void {
  const idx = shiftRecordStore.findIndex(
    p => p.record_date === record_date && p.shift_batch === shift_batch
  )
  if (idx >= 0) {
    shiftRecordStore.splice(idx, 1)
  }
  const rows = db.list('operation_record_rows')
  const row = rows.find(r => r.recordDate === record_date && r.shiftBatch === shift_batch)
  if (row?.id) db.remove('operation_record_rows', row.id)
}

// ---------------------------------------------------------------------------
// Build one running-record row per confirmed shift. The shift subtotal remains
// the current shift amount; daily totals are the cumulative sum of this shift
// plus all preceding shifts on the same date, ordered by SHIFT_ORDER
// (大夜班 -> 白班 -> 小夜班).
// ---------------------------------------------------------------------------
export function getOperationRecords(): OperationRecord[] {
  const sorted = [...shiftRecordStore].sort((a, b) => {
    const dateCompare = a.record_date.localeCompare(b.record_date)
    if (dateCompare !== 0) return dateCompare
    return (SHIFT_ORDER[a.shift_batch] ?? 99) - (SHIFT_ORDER[b.shift_batch] ?? 99)
  })

  const runningTotals = new Map<string, { boiler: number; gasification: number }>()
  return sorted.map((shift) => {
    const dateKey = shift.record_date
    const subtotalBoiler = shift.boiler_consumptions.subtotal || 0
    const subtotalGas = shift.gasification_consumptions.subtotal || 0
    const running = runningTotals.get(dateKey) ?? { boiler: 0, gasification: 0 }
    running.boiler += subtotalBoiler
    running.gasification += subtotalGas
    runningTotals.set(dateKey, running)
    return {
      id: `${shift.record_date}-${shift.shift_batch}`,
      record_date: shift.record_date,
      shift_batch: shift.shift_batch,
      boiler_consumptions: { ...shift.boiler_consumptions },
      gasification_consumptions: { ...shift.gasification_consumptions },
      boiler_daily_total: running.boiler,
      gasification_daily_total: running.gasification,
    }
  })
}

const SHIFT_ORDER: Record<string, number> = {
  '大夜班': 0,
  '白班': 1,
  '小夜班': 2,
}

// ---------------------------------------------------------------------------
// Build a db row from a ShiftPayload (nested → flat camelCase for db.json)
// ---------------------------------------------------------------------------
function buildDbRow(payload: ShiftPayload): Record<string, unknown> {
  return {
    recordDate: payload.record_date,
    shiftBatch: payload.shift_batch,
    boilerConsumptions: payload.boiler_consumptions,
    gasificationConsumptions: payload.gasification_consumptions,
  }
}

// ---------------------------------------------------------------------------
// Hydrate from dbService on startup
// ---------------------------------------------------------------------------
export function initShiftRecordStore(): void {
  // db.list is synchronous (initSync already ran at module load)
  const rows = db.list<Record<string, unknown>>('operation_record_rows')
  const payloads: ShiftPayload[] = rows.map(row => ({
    record_date: String(row.recordDate ?? ''),
    shift_batch: String(row.shiftBatch ?? ''),
    boiler_consumptions: (row.boilerConsumptions as BoilerConsumption | null) ?? { subtotal: 0, hl_A: 0, hl_B: 0, jz_A: 0, jz_B: 0, xz_A: 0, xz_B: 0, wn_A: 0, wn_B: 0, yl_A: 0, yl_B: 0, lx_A: 0, lx_B: 0 },
    gasification_consumptions: (row.gasificationConsumptions as GasificationConsumption | null) ?? { subtotal: 0, coal_A: 0, coal_B: 0 },
  }))
  shiftRecordStore.splice(0, shiftRecordStore.length, ...payloads)
}

// Call initShiftRecordStore once at module load
initShiftRecordStore()
