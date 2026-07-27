import { reactive, watch } from 'vue'

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
// Reactive store
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
  persistShiftRecordStore()
}

export function removeShiftRecord(record_date: string, shift_batch: string): void {
  const idx = shiftRecordStore.findIndex(
    p => p.record_date === record_date && p.shift_batch === shift_batch
  )
  if (idx >= 0) {
    shiftRecordStore.splice(idx, 1)
    persistShiftRecordStore()
  }
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
// localStorage persistence — survives a route change so a user can confirm a
// shift in DailyConsumption and immediately see it in OperationRecordView
// (and vice versa) without losing data on F5.
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'tz_shift_record_store_v1'

function persistShiftRecordStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shiftRecordStore))
  } catch (e) {
    console.warn('[shiftRecordStore] failed to persist:', e)
  }
}

function hydrateShiftRecordStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as ShiftPayload[]
    if (!Array.isArray(parsed)) return
    shiftRecordStore.splice(0, shiftRecordStore.length, ...parsed)
  } catch (e) {
    console.warn('[shiftRecordStore] failed to hydrate:', e)
  }
}

hydrateShiftRecordStore()

// External mutations to the array (push/splice/length assignment) won't trigger
// the watcher unless we deep-watch. Persist on any change to the array itself.
watch(
  () => shiftRecordStore.length,
  () => persistShiftRecordStore()
)
// Also persist when any nested field changes (deep).
watch(shiftRecordStore, () => persistShiftRecordStore(), { deep: true })