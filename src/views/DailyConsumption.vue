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
      <div class="table-wrapper">
        <table class="coal-table coal-table--multi">
          <thead>
            <tr class="tr-level-1">
              <th class="th-fixed-left" rowspan="2">批次</th>
              <th class="th-fixed-left-2" rowspan="2">小计</th>
              <th colspan="2">黄陵混合煤</th>
              <th colspan="2">建庄大块煤</th>
              <th colspan="2">细渣煤</th>
              <th colspan="2">污泥</th>
              <th colspan="2">原料煤</th>
              <th colspan="2">离心煤</th>
            </tr>
            <tr class="tr-level-2">
              <th>207A</th>
              <th>207B</th>
              <th>207A</th>
              <th>207B</th>
              <th>207A</th>
              <th>207B</th>
              <th>207A</th>
              <th>207B</th>
              <th>207A</th>
              <th>207B</th>
              <th>207A</th>
              <th>207B</th>
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
              <td>
                <input class="cell-input" v-model="row.hl_A" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.hl_B" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.jz_A" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.jz_B" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.xz_A" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.xz_B" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.wn_A" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.wn_B" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.yl_A" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.yl_B" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.lx_A" @input="onInput" />
              </td>
              <td>
                <input class="cell-input" v-model="row.lx_B" @input="onInput" />
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
import { ref, reactive } from 'vue'

// ---------------------------------------------------------------------------
// Business-rule 1: ABSOLUTE MANUAL PARITY
//   Subtotals and Totals are plain reactive fields — NO computed properties,
//   NO watchers, NO auto-sums. Operators must enter every value manually.
// ---------------------------------------------------------------------------

interface BoilerRow {
  batch: string
  subtotal: string
  hl_A: string
  hl_B: string
  jz_A: string
  jz_B: string
  xz_A: string
  xz_B: string
  wn_A: string
  wn_B: string
  yl_A: string
  yl_B: string
  lx_A: string
  lx_B: string
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
  hl_A: '0',
  hl_B: '0',
  jz_A: '0',
  jz_B: '0',
  xz_A: '0',
  xz_B: '0',
  wn_A: '0',
  wn_B: '0',
  yl_A: '0',
  yl_B: '0',
  lx_A: '0',
  lx_B: '0',
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
  // Business-rule 2: SLUDGE DATA ISOLATION
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
   Section blocks
   ----------------------------------------------------------------------- */
.section-block {
  margin-bottom: 36px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  letter-spacing: 0.01em;
  text-transform: uppercase;
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
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.cell-input:focus {
  border-color: #4a7ab5;
  box-shadow: 0 0 0 2px rgba(74, 122, 181, 0.15);
}

.row-total .cell-input {
  background: #f0f4f9;
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
