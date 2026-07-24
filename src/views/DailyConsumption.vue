<template>
  <div class="view-container">
    <h2 class="view-title">锅炉/气化当日消耗台账</h2>

    <div class="toolbar">
      <div class="toolbar-actions">
        <button class="btn btn-primary" @click="calculateMatrix">自动核算</button>
        <button class="btn btn-secondary" @click="handleSave">保存</button>
      </div>
    </div>

    <!-- ============================================================
         Table 1: Boiler Daily Consumption — Multi-level Header
         ============================================================ -->
    <div class="section-block">
      <div class="section-header">
        <span class="section-title">锅炉当日消耗</span>
      </div>

      <!-- Requirement 1: Horizontal Card Grid Control Panel — replaces crowded popover -->
      <div class="silo-control-panel">
        <div
          v-for="cat in ALL_CATS"
          :key="cat"
          class="silo-card"
          :class="{ 'silo-card--inactive': !isVisible(cat, '_A') && !isVisible(cat, '_B') }"
        >
          <!-- Card: material name + master indicator -->
          <div class="silo-card__name">{{ CAT_LABELS[cat] }}</div>

          <!-- A/B silo toggle row -->
          <div class="silo-card__toggles">
            <button
              class="silo-btn"
              :class="{ 'silo-btn--active silo-btn--a': isVisible(cat, '_A') }"
              @click="toggleSilo(cat, '_A')"
            >
              <span class="silo-btn__dot silo-btn__dot--a"></span>A仓
            </button>
            <button
              class="silo-btn"
              :class="{ 'silo-btn--active silo-btn--b': isVisible(cat, '_B') }"
              @click="toggleSilo(cat, '_B')"
            >
              <span class="silo-btn__dot silo-btn__dot--b"></span>B仓
            </button>
          </div>
        </div>
      </div>

      <!-- Requirement 2: Table — NO v-if; disabled silos are grayed + forced to "0" -->
      <div class="table-wrapper">
        <table class="coal-table coal-table--multi">
          <thead>
            <!-- Tier-1: material category, safely filtered by v-if -->
            <tr class="tr-level-1">
              <th class="th-fixed-left" rowspan="2">批次</th>
              <th class="th-fixed-left-2" rowspan="2">小计</th>
              <template v-for="cat in ALL_CATS" :key="cat">
                <th
                  v-if="CAT_COLSPANS[cat] > 0"
                  :colspan="CAT_COLSPANS[cat]"
                >{{ CAT_LABELS[cat] }}</th>
              </template>
            </tr>
            <!-- Tier-2: one <th> per entry in ALL_COLS -->
            <tr class="tr-level-2">
              <th
                v-for="col in ALL_COLS"
                :key="col.cat + col.sub"
                :class="[
                  col.disabled ? 'th-disabled' : col.sub === '_A' ? 'th-silo-a' : 'th-silo-b',
                ]"
              >
                <span class="th-silo-dot" :class="col.disabled ? 'silo-dot--muted' : col.sub === '_A' ? 'silo-dot--a' : 'silo-dot--b'"></span>{{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in boilerData"
              :key="row.batch"
              :class="{ 'row-total': row.batch === '总计' }"
            >
              <td class="td-fixed-left td-batch">{{ row.batch }}</td>
              <td class="td-fixed-left-2">
                <input class="cell-input" v-model="row.subtotal" @input="onInput" />
              </td>
              <!-- One <td> per entry in ALL_COLS — exact same array Tier-2 uses -->
              <td
                v-for="col in ALL_COLS"
                :key="col.cat + col.sub"
                :class="col.disabled ? 'td--silo-disabled' : col.sub === '_A' ? 'td-silo-a' : 'td-silo-b'"
              >
                <input
                  class="cell-input"
                  :class="{ 'cell-input--disabled': col.disabled }"
                  :disabled="col.disabled"
                  :value="col.disabled ? forceZero(row, col.cat + col.sub) : (row as Record<string, string>)[col.cat + col.sub]"
                  @input="e => onCellInput(e, row, col)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================
         Table 2: Gasification Daily Consumption — Single-level Header
         ============================================================ -->
    <div class="section-block">
      <div class="section-header">
        <span class="section-title">气化当日消耗</span>
      </div>
      <div class="table-wrapper">
        <table class="coal-table">
          <thead>
            <tr>
              <th class="th-fixed-left">批次</th>
              <th class="th-fixed-left-2">小计</th>
              <th>A仓原料煤</th>
              <th>B仓原料煤</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in gasData"
              :key="row.batch"
              :class="{ 'row-total': row.batch === '总计' }"
            >
              <td class="td-fixed-left td-batch">{{ row.batch }}</td>
              <td class="td-fixed-left-2">
                <input class="cell-input" v-model="row.subtotal" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.coal_A" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.coal_B" @input="onInput" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="toast.visible"
        class="toast-notice"
        :class="`toast-${toast.type}`"
      >
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="toast.visible = false">×</button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// ---------------------------------------------------------------------------
// Requirement 1: Fine-grained visibility — 12 independent boolean keys
//   Each silo (A or B) is toggled independently. Hiding a column does NOT
//   clear its data; the value stays in boilerData for safe backend submission.
// ---------------------------------------------------------------------------

const ALL_CATS = ['hl', 'jz', 'xz', 'wn', 'yl', 'lx']

const CAT_LABELS: Record<string, string> = {
  hl: '黄陵混合煤',
  jz: '建庄大块煤',
  xz: '细渣煤',
  wn: '污泥',
  yl: '原料煤',
  lx: '离心煤',
}

type ColKey = 'hl_A' | 'hl_B' | 'jz_A' | 'jz_B' | 'xz_A' | 'xz_B'
            | 'wn_A' | 'wn_B' | 'yl_A' | 'yl_B' | 'lx_A' | 'lx_B'

// 12 independent visibility flags, all default to visible (true)
const colVisibility = ref<Record<ColKey, boolean>>({
  hl_A: true, hl_B: true,
  jz_A: true, jz_B: true,
  xz_A: true, xz_B: true,
  wn_A: true, wn_B: true,
  yl_A: true, yl_B: true,
  lx_A: true, lx_B: true,
})

// ---------------------------------------------------------------------------
// Tier-2 silo labels — include material name so every column is self-identifying
// e.g. '黄陵 - 207A', '建庄 - 207B', '污泥 - 207A', etc.
// MUST be declared before computeColDef / ALL_COLS (const is not hoisted at runtime).
// ---------------------------------------------------------------------------
const catLabelsA: Record<string, string> = {
  hl: '黄陵 - 207A',
  jz: '建庄 - 207A',
  xz: '细渣 - 207A',
  wn: '污泥 - 207A',
  yl: '原料煤 - 207A',
  lx: '离心 - 207A',
}
const catLabelsB: Record<string, string> = {
  hl: '黄陵 - 207B',
  jz: '建庄 - 207B',
  xz: '细渣 - 207B',
  wn: '污泥 - 207B',
  yl: '原料煤 - 207B',
  lx: '离心 - 207B',
}

// ---------------------------------------------------------------------------
// Requirement 1: Centralized column registry
//   A flat, ordered array of all 12 silo columns. BOTH the Tier-2 <th> and
//   the <td> body loop over this exact same array — eliminating any possibility
//   of header/cell drift under any toggle combination.
// ---------------------------------------------------------------------------

interface ColDef {
  cat: string        // e.g. 'hl'
  sub: '_A' | '_B'  // e.g. '_A'
  label: string     // e.g. '黄陵 - 207A'
  disabled: boolean  // shorthand — true when this silo is toggled off
}

/** All 12 silo columns in guaranteed display order: hl_A, hl_B, jz_A, …
 *  Filtered to exclude any column whose silo is toggled off — keeping the
 *  Tier-2 <th> and <td> loops in perfect sync with the data row. */
const ALL_COLS = computed<ColDef[]>(() =>
  ALL_CATS.flatMap(cat =>
    (['_A', '_B'] as const).map(sub => {
      const key = (cat + sub) as ColKey
      const labels = sub === '_A' ? catLabelsA : catLabelsB
      return {
        cat,
        sub,
        label: labels[cat],
        disabled: !colVisibility.value[key],
      }
    })
  ).filter(col => !col.disabled)
)

/** Per-category visible column counts, derived from ALL_COLS.
 *  Use an explicit computed (NOT a function called from template) so that
 *  Vue 3's reactive tracking correctly invalidates every Tier-1 <th> on any
 *  silo toggle. */
const CAT_COLSPANS = computed<Record<string, number>>(() => {
  const result: Record<string, number> = {}
  for (const cat of ALL_CATS) result[cat] = 0
  for (const col of ALL_COLS.value) {
    result[col.cat] = (result[col.cat] || 0) + 1
  }
  return result
})

// ---------------------------------------------------------------------------
// Cell interaction helpers
// ---------------------------------------------------------------------------

/**
 * Toggle a single silo on/off. When disabled the cell becomes :disabled and
 * its display value is forced to "0" via forceZero(); boilerData is untouched.
 */
function toggleSilo(cat: string, sub: '_A' | '_B') {
  const key = cat + sub as ColKey
  colVisibility.value = { ...colVisibility.value, [key]: !colVisibility.value[key] }
}

/** Check if a given silo (e.g. 'hl_A') is currently visible. */
function isVisible(cat: string, sub: '_A' | '_B'): boolean {
  const key = cat + sub as ColKey
  return colVisibility.value[key]
}

/**
 * Force a disabled cell's displayed value to "0" without mutating boilerData,
 * so the backend always receives a stable string payload and manual parity is
 * preserved for re-enabled silos.
 */
function forceZero(_row: BoilerRow, _key: string): string {
  return '0'
}

/**
 * Handle input for a silo cell. When the silo is enabled, write to boilerData.
 * When disabled, ignore input entirely — forceZero keeps the display at "0".
 */
function onCellInput(e: Event, row: BoilerRow, col: ColDef) {
  if (col.disabled) return
  const key = col.cat + col.sub
  const target = e.target as HTMLInputElement
  ;(row as unknown as Record<string, string>)[key] = target.value
  dirty.value = true
}

// ---------------------------------------------------------------------------
// Tier-1 colspan is sourced from CAT_COLSPANS computed (defined above with
// ALL_COLS) — using a computed rather than a function called inline in the
// template guarantees Vue 3 re-evaluates every Tier-1 <th> on any toggle.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Business-rule 1: ABSOLUTE MANUAL PARITY
//   Subtotals and Totals are plain reactive fields — NO computed properties,
//   NO watchers, NO auto-sums. Operators must enter every value manually.
// ---------------------------------------------------------------------------

interface BoilerRow {
  batch: string
  subtotal: string
  hl_A: string; hl_B: string
  jz_A: string; jz_B: string
  xz_A: string; xz_B: string
  wn_A: string; wn_B: string
  yl_A: string; yl_B: string
  lx_A: string; lx_B: string
}

interface GasRow {
  batch: string
  subtotal: string
  coal_A: string
  coal_B: string
}

const makeBoilerRow = (batch: string): BoilerRow => ({
  batch,
  subtotal: '0',
  hl_A: '0', hl_B: '0',
  jz_A: '0', jz_B: '0',
  xz_A: '0', xz_B: '0',
  wn_A: '0', wn_B: '0',
  yl_A: '0', yl_B: '0',
  lx_A: '0', lx_B: '0',
})

const makeGasRow = (batch: string): GasRow => ({
  batch,
  subtotal: '0',
  coal_A: '0',
  coal_B: '0',
})

const boilerData = ref<BoilerRow[]>([
  makeBoilerRow('第一次'),
  makeBoilerRow('第二次'),
  makeBoilerRow('第三次'),
  makeBoilerRow('总计'),
])

const gasData = ref<GasRow[]>([
  makeGasRow('第一次'),
  makeGasRow('第二次'),
  makeGasRow('第三次'),
  makeGasRow('总计'),
])

const dirty = ref(false)
const toast = reactive({
  visible: false,
  type: 'success' as 'success' | 'error' | 'info',
  message: '',
})

function onInput() {
  dirty.value = true
}

function showToast(type: 'success' | 'error' | 'info', message: string) {
  toast.type = type
  toast.message = message
  toast.visible = true
  setTimeout(() => {
    toast.visible = false
  }, 3000)
}

// ---------------------------------------------------------------------------
// Requirement 2: Matrix Summation — triggered ONLY by user via "自动核算"
// No computed properties, no watchers. Manual overrides always take priority.
// ---------------------------------------------------------------------------

/** Sum all numeric silo fields of a row object. Excludes `batch` AND `subtotal`
 *  so the row's own subtotal is never folded back into itself. */
function sumRowFields(row: Record<string, string | number>, skipKeys: string[]): number {
  return Object.keys(row)
    .filter(k => !skipKeys.includes(k) && k !== 'subtotal')
    .reduce((acc, k) => acc + (parseFloat(String(row[k])) || 0), 0)
}

/** Calculate all subtotals (horizontal) and the 总计 row (vertical). */
function calculateMatrix() {
  // --- Boiler table ---
  const boilerSkip = ['batch']
  const boilerRows = boilerData.value

  // Horizontal: row subtotals for 第一次 / 第二次 / 第三次
  for (let i = 0; i < boilerRows.length - 1; i++) {
    const row = boilerRows[i]
    const sum = sumRowFields(row, boilerSkip)
    row.subtotal = String(sum)
  }

  // Vertical: 总计 row sums all preceding rows column by column
  const boilerTotal = boilerRows[boilerRows.length - 1]
  const numCols = (Object.keys(boilerTotal) as (keyof BoilerRow)[]).filter(
    k => !boilerSkip.includes(k)
  )
  for (const col of numCols) {
    const colSum = boilerRows
      .slice(0, -1)
      .reduce((acc, row) => acc + (parseFloat(row[col] as string) || 0), 0)
    ;(boilerTotal as Record<string, string | number>)[col as string] = String(colSum)
  }

  // --- Gasification table ---
  const gasSkip = ['batch']
  const gasRows = gasData.value

  // Horizontal: row subtotals
  for (let i = 0; i < gasRows.length - 1; i++) {
    const row = gasRows[i]
    const sum = sumRowFields(row, gasSkip)
    row.subtotal = String(sum)
  }

  // Vertical: 总计 row
  const gasTotal = gasRows[gasRows.length - 1]
  const gasNumCols = (Object.keys(gasTotal) as (keyof GasRow)[]).filter(
    k => !gasSkip.includes(k)
  )
  for (const col of gasNumCols) {
    const colSum = gasRows
      .slice(0, -1)
      .reduce((acc, row) => acc + (parseFloat(row[col] as string) || 0), 0)
    ;(gasTotal as Record<string, string | number>)[col as string] = String(colSum)
  }

  dirty.value = true
  showToast('success', '自动核算完成')
}

function handleSave() {
  // ---------------------------------------------------------------------------
  // Business-rule 3: DATA FLATNESS
  //   All fields are flat top-level properties; the payload maps directly to
  //   SQLite columns — no nested objects, no JSON-stringified blobs.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Business-rule 4: SLUDGE DATA ISOLATION
  //   The sludge silo fields (wn_A, wn_B) are siblings of all other coal-type
  //   fields at the same flat level. The backend must treat them as a separate
  //   accounting category and MUST NOT deduct them from any fuel-coal 207
  //   storage limits.
  // ---------------------------------------------------------------------------
  const payload = {
    // Table 1 — Boiler
    boiler: {
      rows: boilerData.value.map(row => ({
        batch:    row.batch,
        subtotal: row.subtotal,
        // 黄陵混合煤
        hl_A: row.hl_A,
        hl_B: row.hl_B,
        // 建庄大块煤
        jz_A: row.jz_A,
        jz_B: row.jz_B,
        // 细渣煤
        xz_A: row.xz_A,
        xz_B: row.xz_B,
        // 污泥 — ISOLATED; must NOT be applied to fuel-coal 207 limits
        wn_A: row.wn_A,
        wn_B: row.wn_B,
        // 原料煤
        yl_A: row.yl_A,
        yl_B: row.yl_B,
        // 离心煤
        lx_A: row.lx_A,
        lx_B: row.lx_B,
      })),
    },
    // Table 2 — Gasification
    gasification: {
      rows: gasData.value.map(row => ({
        batch:    row.batch,
        subtotal: row.subtotal,
        coal_A:   row.coal_A,
        coal_B:   row.coal_B,
      })),
    },
    savedAt: Date.now(),
  }

  console.log('[DailyConsumption] 保存 payload:', payload)

  // TODO: replace with actual API call
  // await fetch('/api/daily-consumption', { method: 'POST', body: JSON.stringify(payload) })

  dirty.value = false
  showToast('success', '保存成功')
}
</script>

<style scoped>
/* -----------------------------------------------------------------------
   Layout
   ----------------------------------------------------------------------- */
.view-container {
  padding: 20px 24px 40px;
  min-height: 100vh;
  box-sizing: border-box;
}

.view-title {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  letter-spacing: -0.01em;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* -----------------------------------------------------------------------
   Requirement 1: Horizontal Card Grid Control Panel
   6 large, spacious material cards above the table
   ----------------------------------------------------------------------- */
.silo-control-panel {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0f4f8 0%, #f8fafc 100%);
  border: 1px solid #d4dde8;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.silo-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px 8px 12px;
  background: #ffffff;
  border: 1.5px solid #dce6f0;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: border-color 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.silo-card--inactive {
  opacity: 0.5;
  border-color: #e2e8f0;
}

.silo-card__name {
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
  text-align: center;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.silo-card__toggles {
  display: flex;
  gap: 6px;
}

/* Individual silo toggle button */
.silo-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 5px;
  border: 1.5px solid #cbd5e1;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
}

.silo-btn:hover {
  border-color: #94a3b8;
  color: #475569;
  background: #f1f5f9;
}

.silo-btn--active {
  border-color: transparent;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}

.silo-btn--active:hover {
  filter: brightness(1.08);
  color: #fff;
}

.silo-btn--active.silo-btn--a {
  background: #4a7ab5;
}

.silo-btn--active.silo-btn--b {
  background: #d97706;
}

.silo-btn__dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.silo-btn__dot--a {
  background: #4a7ab5;
}

.silo-btn--active.silo-btn--a .silo-btn__dot--a {
  background: rgba(255, 255, 255, 0.85);
}

.silo-btn__dot--b {
  background: #d97706;
}

.silo-btn--active.silo-btn--b .silo-btn__dot--b {
  background: rgba(255, 255, 255, 0.85);
}

/* -----------------------------------------------------------------------
   Tier-2 header silo dot — color-coded A/B + muted gray when disabled
   ----------------------------------------------------------------------- */
.th-silo-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}

.silo-dot--a  { background: #4a7ab5; }
.silo-dot--b  { background: #d97706; }
.silo-dot--muted { background: #cbd5e1; }

/* Tier-2 header cell — muted when its silo is disabled */
.th--disabled {
  color: #94a3b8 !important;
}

/* Tier-2: A-column headers get blue tint, B-column headers get amber tint */
.tr-level-2 th:not(.th-disabled) {
  border-top: none;
}
.tr-level-2 th.th-silo-a {
  background: #dbeafe;
  color: #1e40af;
  border-top: 2px solid #3b82f6;
}
.tr-level-2 th.th-silo-b {
  background: #fef3c7;
  color: #92400e;
  border-top: 2px solid #f59e0b;
}
.tr-level-2 th.th-disabled {
  background: #f1f5f9;
  color: #94a3b8;
  border-top: 2px solid #cbd5e1;
}

/* -----------------------------------------------------------------------
   Disabled silo table cell
   ----------------------------------------------------------------------- */
.td--silo-disabled {
  background: #f8fafc;
}

/* A-silo cells: light blue tint; B-silo cells: light amber tint */
td.td-silo-a {
  background: #eff6ff;
}
td.td-silo-b {
  background: #fffbeb;
}

/* Disabled cell input — grayed dashed, clearly non-interactive */
.cell-input--disabled {
  background: #f1f5f9 !important;
  border: 1.5px dashed #cbd5e1 !important;
  color: #94a3b8 !important;
  cursor: not-allowed !important;
  font-weight: 500 !important;
}

.cell-input--disabled:focus {
  box-shadow: none !important;
  border-color: #cbd5e1 !important;
}

/* -----------------------------------------------------------------------
   Table base
   ----------------------------------------------------------------------- */
.table-wrapper {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid #e4e7eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.coal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: #fff;
  white-space: nowrap;
}

.coal-table thead tr {
  background: #f1f5f9;
}

.coal-table th {
  padding: 8px 10px;
  text-align: center;
  font-weight: 600;
  color: #334155;
  border-bottom: 1px solid #cbd5e1;
  border-right: 1px solid #e2e8f0;
  vertical-align: middle;
  font-size: 12px;
  letter-spacing: 0.02em;
}

.coal-table tbody td {
  padding: 6px 8px;
  border-bottom: 1px solid #f0f2f5;
  border-right: 1px solid #f0f2f5;
  text-align: center;
  vertical-align: middle;
}

.coal-table tbody tr:hover td {
  background-color: rgba(241, 245, 249, 0.5);
}
td.td-silo-a:hover {
  background: #dbeafe !important;
}
td.td-silo-b:hover {
  background: #fef3c7 !important;
}
.td--silo-disabled:hover {
  background: #f8fafc !important;
}

.coal-table tbody tr:last-child td {
  border-bottom: none;
}

/* -----------------------------------------------------------------------
   Multi-level header
   ----------------------------------------------------------------------- */
.tr-level-1 th {
  background: #e8edf3;
  font-size: 12px;
}

.tr-level-2 th {
  background: #f1f5f9;
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.coal-table--multi th[colspan] {
  background: #e2eaf5;
  color: #2c5282;
  font-weight: 700;
  font-size: 13px;
}

/* -----------------------------------------------------------------------
   Fixed left columns (shared)
   ----------------------------------------------------------------------- */
.th-fixed-left {
  position: sticky;
  left: 0;
  z-index: 3;
  background: #f8fafc;
  min-width: 72px;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.08);
}

.th-fixed-left-2 {
  position: sticky;
  left: 72px;
  z-index: 3;
  background: #f1f5f9;
  min-width: 80px;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.08);
}

.td-fixed-left {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
  font-weight: 600;
  color: #1e293b;
  min-width: 72px;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.06);
}

.td-fixed-left-2 {
  position: sticky;
  left: 72px;
  z-index: 2;
  background: #fafbfc;
  min-width: 80px;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.06);
}

.td-batch {
  font-size: 13px;
}

/* -----------------------------------------------------------------------
   Total row
   ----------------------------------------------------------------------- */
.row-total td {
  background: #f8fafc !important;
  font-weight: 700;
  color: #1e293b;
}

.row-total .td-fixed-left {
  background: #eef2f7 !important;
}

/* -----------------------------------------------------------------------
   Cell inputs
   ----------------------------------------------------------------------- */
.cell-input {
  width: 80px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #d0d5dd;
  border-radius: 3px;
  font-size: 13px;
  font-family: inherit;
  text-align: center;
  color: #1f2937;
  background: transparent;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.cell-input:focus {
  border-color: #4a7ab5;
  box-shadow: 0 0 0 2px rgba(74, 122, 181, 0.15);
}

/* A-silo input focus: blue ring; B-silo input focus: amber ring */
td.td-silo-a .cell-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
td.td-silo-b .cell-input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.row-total .cell-input {
  background: transparent;
  font-weight: 700;
}

/* -----------------------------------------------------------------------
   Buttons
   ----------------------------------------------------------------------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 32px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.btn-secondary {
  background: #fff;
  color: #334155;
  border-color: #cbd5e1;
}

.btn-secondary:hover {
  background: #f1f5f9;
  border-color: #94a8be;
}

.btn-secondary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-primary {
  background: #4a7ab5;
  color: #fff;
  border-color: #4a7ab5;
}

.btn-primary:hover {
  background: #3d6a9e;
  border-color: #3d6a9e;
}

/* -----------------------------------------------------------------------
   Toast
   ----------------------------------------------------------------------- */
.toast-notice {
  position: fixed;
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%);
  padding: 10px 14px 10px 12px;
  border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  z-index: 1100;
  min-width: 280px;
  max-width: calc(100vw - 32px);
  border: 1px solid transparent;
}

.toast-success {
  background: #f0f9f4;
  color: #166534;
  border-color: #bbf7d0;
}

.toast-error {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.toast-info {
  background: #eff6ff;
  color: #1e40af;
  border-color: #bfdbfe;
}

.toast-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  background: #16a34a;
  color: #fff;
}

.toast-error .toast-icon {
  background: #dc2626;
  color: #fff;
}

.toast-info .toast-icon {
  background: #2563eb;
  color: #fff;
}

.toast-message {
  flex: 1;
  font-weight: 500;
}

.toast-close {
  background: transparent;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  font-family: inherit;
  opacity: 0.55;
  color: inherit;
}

.toast-close:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>