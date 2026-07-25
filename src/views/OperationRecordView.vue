<template>
  <div class="view-container">
    <h2 class="view-title">运行记录查询</h2>

    <!-- Top Toolbar -->
    <div class="toolbar">
      <div class="toolbar-filters">
        <div class="filter-group">
          <label class="filter-label">日期</label>
          <input type="date" v-model="filterDate" class="filter-input" />
        </div>

        <div class="filter-group">
          <label class="filter-label">班次</label>
          <select v-model="filterShift" class="filter-input">
            <option value="">全部班次</option>
            <option value="白班">白班</option>
            <option value="小夜班">小夜班</option>
            <option value="大夜班">大夜班</option>
          </select>
        </div>

        <button class="btn btn-primary" @click="handleSearch">查询</button>
        <button class="btn btn-secondary" @click="handleExport">导出</button>
      </div>
    </div>

    <!-- Main Data Table -->
    <div class="section-block">
      <div class="section-header">
        <span class="section-title">运行记录列表</span>
        <span class="section-meta">共 {{ filteredRecords.length }} 条记录</span>
      </div>

      <div class="table-wrapper">
        <table class="record-table">
          <thead>
            <tr>
              <th class="th-sticky th-sticky--1">日期</th>
              <th class="th-sticky th-sticky--2">班次</th>
              <th class="th-sticky th-sticky--3">运行班组</th>
              <th>错峰运行<br>执行情况</th>
              <th>锅炉运行筒仓</th>
              <th>锅炉上煤时间</th>
              <th>锅炉当班上煤量<br>(吨)</th>
              <th>锅炉当日上煤量<br>(吨)</th>
              <th>锅炉上煤时长<br>(分)</th>
              <th>气化运行筒仓</th>
              <th>气化上煤时间</th>
              <th>气化当班上煤量<br>(吨)</th>
              <th>气化当日上煤量<br>(吨)</th>
              <th>气化上煤时长<br>(分)</th>
              <th>原因说明</th>
              <th>备注</th>
              <th>汽车卸车时间</th>
              <th>汽车卸车时长<br>(分)</th>
              <th>汽车卸车数量<br>(辆)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rec in filteredRecords"
              :key="rec.id"
              class="record-row"
            >
              <td class="td-sticky td-sticky--1">{{ rec.record_date }}</td>
              <td class="td-sticky td-sticky--2">
                <span class="shift-badge" :class="`shift-badge--${getShiftKey(rec.shift_batch)}`">
                  {{ rec.shift_batch }}
                </span>
              </td>
              <td class="td-sticky td-sticky--3">{{ rec.run_group }}</td>
              <td>{{ rec.execution_status }}</td>
              <td>{{ rec.boiler_bins }}</td>
              <td>{{ rec.boiler_time }}</td>
              <td class="td-clickable" @click="openDetail(rec)">
                <span class="clickable-total">{{ rec.boiler_shift_total }}</span>
              </td>
              <td>{{ rec.boiler_daily_total }}</td>
              <td>{{ rec.boiler_duration }}</td>
              <td>{{ rec.gasification_bins }}</td>
              <td>{{ rec.gasification_time }}</td>
              <td class="td-clickable" @click="openDetail(rec)">
                <span class="clickable-total">{{ rec.gasification_shift_total }}</span>
              </td>
              <td>{{ rec.gasification_daily_total }}</td>
              <td>{{ rec.gasification_duration }}</td>
              <td>{{ rec.reason }}</td>
              <td>{{ rec.remarks }}</td>
              <td>{{ rec.truck_unload_time }}</td>
              <td>{{ rec.truck_unload_duration }}</td>
              <td>{{ rec.truck_count }}</td>
            </tr>
            <tr v-if="filteredRecords.length === 0">
              <td colspan="20" class="empty-row">暂无匹配数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-icon">📋</span>
              <div>
                <h3 class="modal-title">运行记录详情</h3>
                <p v-if="selectedRecord" class="modal-subtitle">
                  {{ selectedRecord.record_date }} · {{ selectedRecord.shift_batch }}
                </p>
              </div>
            </div>
            <button class="modal-close" @click="closeDetail" aria-label="关闭">×</button>
          </div>

          <div class="modal-body" v-if="selectedRecord">
            <!-- Operation Info Summary -->
            <section class="detail-section">
              <div class="detail-section__title">
                <span class="section-icon">⚙️</span>
                <span>运行信息</span>
              </div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">记录ID</span>
                  <span class="detail-value">{{ selectedRecord.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">记录日期</span>
                  <span class="detail-value">{{ selectedRecord.record_date }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">班次</span>
                  <span class="detail-value">{{ selectedRecord.shift_batch }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">运行班组</span>
                  <span class="detail-value">{{ selectedRecord.run_group }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">错峰执行情况</span>
                  <span class="detail-value">{{ selectedRecord.execution_status }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">锅炉运行筒仓</span>
                  <span class="detail-value">{{ selectedRecord.boiler_bins }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">锅炉上煤时间</span>
                  <span class="detail-value">{{ selectedRecord.boiler_time }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">锅炉上煤时长(分)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_duration }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">气化运行筒仓</span>
                  <span class="detail-value">{{ selectedRecord.gasification_bins }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">气化上煤时间</span>
                  <span class="detail-value">{{ selectedRecord.gasification_time }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">气化上煤时长(分)</span>
                  <span class="detail-value">{{ selectedRecord.gasification_duration }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">原因说明</span>
                  <span class="detail-value">{{ selectedRecord.reason }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">备注</span>
                  <span class="detail-value">{{ selectedRecord.remarks }}</span>
                </div>
              </div>
            </section>

            <!-- Boiler Consumption Section -->
            <section class="detail-section">
              <div class="detail-section__title">
                <span class="section-icon">🔥</span>
                <span>锅炉消耗明细</span>
              </div>
              <div class="detail-grid" v-if="selectedRecord.boiler_consumptions">
                <div class="detail-item detail-item--highlight">
                  <span class="detail-label">小计</span>
                  <span class="detail-value detail-value--strong">
                    {{ selectedRecord.boiler_consumptions.subtotal }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">黄陵混合煤 - A仓 (hl_A)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.hl_A }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">黄陵混合煤 - B仓 (hl_B)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.hl_B }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">建庄大块煤 - A仓 (jz_A)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.jz_A }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">建庄大块煤 - B仓 (jz_B)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.jz_B }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">细渣煤 - A仓 (xz_A)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.xz_A }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">细渣煤 - B仓 (xz_B)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.xz_B }}</span>
                </div>
                <div class="detail-item detail-item--sludge">
                  <span class="detail-label detail-label--sludge">
                    ⚠ 污泥 - A仓 (wn_A) · 隔离核算
                  </span>
                  <span class="detail-value detail-value--sludge">
                    {{ selectedRecord.boiler_consumptions.wn_A }}
                  </span>
                </div>
                <div class="detail-item detail-item--sludge">
                  <span class="detail-label detail-label--sludge">
                    ⚠ 污泥 - B仓 (wn_B) · 隔离核算
                  </span>
                  <span class="detail-value detail-value--sludge">
                    {{ selectedRecord.boiler_consumptions.wn_B }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">原料煤 - A仓 (yl_A)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.yl_A }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">原料煤 - B仓 (yl_B)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.yl_B }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">离心煤 - A仓 (lx_A)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.lx_A }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">离心煤 - B仓 (lx_B)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.lx_B }}</span>
                </div>
              </div>
              <div v-else class="empty-state">无锅炉消耗数据</div>
            </section>

            <!-- Gasification Consumption Section -->
            <section class="detail-section">
              <div class="detail-section__title">
                <span class="section-icon">💨</span>
                <span>气化消耗明细</span>
              </div>
              <div class="detail-grid" v-if="selectedRecord.gasification_consumptions">
                <div class="detail-item detail-item--highlight">
                  <span class="detail-label">小计</span>
                  <span class="detail-value detail-value--strong">
                    {{ selectedRecord.gasification_consumptions.subtotal }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">A仓原料煤 (coal_A)</span>
                  <span class="detail-value">{{ selectedRecord.gasification_consumptions.coal_A }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">B仓原料煤 (coal_B)</span>
                  <span class="detail-value">{{ selectedRecord.gasification_consumptions.coal_B }}</span>
                </div>
              </div>
              <div v-else class="empty-state">无气化消耗数据</div>
            </section>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDetail">关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------
interface BoilerConsumption {
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

interface GasificationConsumption {
  subtotal: number
  coal_A: number
  coal_B: number
}

interface OperationRecord {
  id: number
  record_date: string
  shift_batch: string
  run_group: string
  execution_status: string
  boiler_bins: string
  boiler_time: string
  boiler_shift_total: number
  boiler_daily_total: number
  boiler_duration: number
  gasification_bins: string
  gasification_time: string
  gasification_shift_total: number
  gasification_daily_total: number
  gasification_duration: number
  reason: string
  remarks: string
  truck_unload_time: string
  truck_unload_duration: number
  truck_count: number
  boiler_consumptions: BoilerConsumption
  gasification_consumptions: GasificationConsumption
}

// ---------------------------------------------------------------------------
// Mock Data — In production, this would come from a `json-server` REST API.
// The embedded detail objects simulate the `_embed` query response.
// ---------------------------------------------------------------------------
const records = ref<OperationRecord[]>([
  {
    id: 1,
    record_date: '2026-07-25',
    shift_batch: '白班',
    run_group: '四班',
    execution_status: '已执行',
    boiler_bins: '1#ABC',
    boiler_time: '08:00-10:30',
    boiler_shift_total: 705,
    boiler_daily_total: 1385,
    boiler_duration: 150,
    gasification_bins: '1#A',
    gasification_time: '08:00-11:00',
    gasification_shift_total: 285,
    gasification_daily_total: 560,
    gasification_duration: 180,
    reason: '正常生产',
    remarks: '无异常',
    truck_unload_time: '09:00-11:00',
    truck_unload_duration: 120,
    truck_count: 3,
    boiler_consumptions: {
      subtotal: 705,
      hl_A: 120.5, hl_B: 85,
      jz_A: 95, jz_B: 70,
      xz_A: 45.5, xz_B: 30,
      wn_A: 150, wn_B: 120,
      yl_A: 80, yl_B: 60,
      lx_A: 110, lx_B: 40,
    },
    gasification_consumptions: {
      subtotal: 285,
      coal_A: 150.5,
      coal_B: 134.5,
    },
  },
  {
    id: 2,
    record_date: '2026-07-25',
    shift_batch: '小夜班',
    run_group: '一班',
    execution_status: '已执行',
    boiler_bins: '2#BC',
    boiler_time: '11:00-13:30',
    boiler_shift_total: 590,
    boiler_daily_total: 1385,
    boiler_duration: 150,
    gasification_bins: '2#B',
    gasification_time: '11:00-14:00',
    gasification_shift_total: 200,
    gasification_daily_total: 560,
    gasification_duration: 180,
    reason: '设备检修',
    remarks: '2#皮带需维护',
    truck_unload_time: '12:00-13:30',
    truck_unload_duration: 90,
    truck_count: 2,
    boiler_consumptions: {
      subtotal: 590,
      hl_A: 100, hl_B: 75,
      jz_A: 80, jz_B: 65,
      xz_A: 35, xz_B: 25,
      wn_A: 130, wn_B: 100,
      yl_A: 70, yl_B: 55,
      lx_A: 85, lx_B: 35,
    },
    gasification_consumptions: {
      subtotal: 200,
      coal_A: 100,
      coal_B: 100,
    },
  },
  {
    id: 3,
    record_date: '2026-07-25',
    shift_batch: '大夜班',
    run_group: '二班',
    execution_status: '已执行',
    boiler_bins: '1#ABC',
    boiler_time: '14:00-17:00',
    boiler_shift_total: 1065.5,
    boiler_daily_total: 2360.5,
    boiler_duration: 180,
    gasification_bins: '1#A',
    gasification_time: '14:00-18:00',
    gasification_shift_total: 430,
    gasification_daily_total: 915,
    gasification_duration: 240,
    reason: '满负荷运行',
    remarks: '加强监控',
    truck_unload_time: '15:00-17:00',
    truck_unload_duration: 120,
    truck_count: 4,
    boiler_consumptions: {
      subtotal: 1065.5,
      hl_A: 180, hl_B: 120,
      jz_A: 140, jz_B: 95,
      xz_A: 70.5, xz_B: 50,
      wn_A: 220, wn_B: 180,
      yl_A: 120, yl_B: 90,
      lx_A: 160, lx_B: 60,
    },
    gasification_consumptions: {
      subtotal: 430,
      coal_A: 220,
      coal_B: 210,
    },
  },
])

// ---------------------------------------------------------------------------
// Filter State
// ---------------------------------------------------------------------------
function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const filterDate = ref<string>(toLocalDateString(new Date()))
const filterShift = ref<string>('')

// Shift order mapping: 大夜班(0) < 白班(1) < 小夜班(2)
const SHIFT_ORDER: Record<string, number> = {
  '大夜班': 0,
  '白班': 1,
  '小夜班': 2,
}

// Apply filter to displayed records (live preview), sorted by shift order
const filteredRecords = computed<OperationRecord[]>(() => {
  return records.value
    .filter(rec => {
      const dateMatch = !filterDate.value || rec.record_date === filterDate.value
      const shiftMatch = !filterShift.value || rec.shift_batch === filterShift.value
      return dateMatch && shiftMatch
    })
    .sort((a, b) => {
      const dateCompare = a.record_date.localeCompare(b.record_date)
      if (dateCompare !== 0) return dateCompare
      const shiftA = SHIFT_ORDER[a.shift_batch] ?? 99
      const shiftB = SHIFT_ORDER[b.shift_batch] ?? 99
      return shiftA - shiftB
    })
})

// ---------------------------------------------------------------------------
// Modal State
// ---------------------------------------------------------------------------
const showModal = ref(false)
const selectedRecord = ref<OperationRecord | null>(null)

function openDetail(rec: OperationRecord) {
  selectedRecord.value = rec
  showModal.value = true
}

function closeDetail() {
  showModal.value = false
  selectedRecord.value = null
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
function handleSearch() {
  // Filtering is reactive; this button provides UX feedback.
  console.log('[Search] date=', filterDate.value, 'shift=', filterShift.value)
}

function handleExport() {
  if (filteredRecords.value.length === 0) {
    alert('当前无可导出的数据')
    return
  }
  const headers = [
    '日期', '班次', '运行班组', '错峰运行执行情况',
    '锅炉运行筒仓', '锅炉上煤时间',
    '锅炉当班上煤量(吨)', '锅炉当日上煤量(吨)', '锅炉上煤时长(分)',
    '气化运行筒仓', '气化上煤时间',
    '气化当班上煤量(吨)', '气化当日上煤量(吨)', '气化上煤时长(分)',
    '原因说明', '备注', '汽车卸车时间', '汽车卸车时长(分)', '汽车卸车数量(辆)',
    '锅炉小计', 'hl_A', 'hl_B', 'jz_A', 'jz_B', 'xz_A', 'xz_B',
    'wn_A', 'wn_B', 'yl_A', 'yl_B', 'lx_A', 'lx_B',
    '气化小计', 'coal_A', 'coal_B',
  ]
  const rows = filteredRecords.value.map(r => [
    r.record_date, r.shift_batch, r.run_group, r.execution_status,
    r.boiler_bins, r.boiler_time,
    r.boiler_shift_total, r.boiler_daily_total, r.boiler_duration,
    r.gasification_bins, r.gasification_time,
    r.gasification_shift_total, r.gasification_daily_total, r.gasification_duration,
    r.reason, r.remarks, r.truck_unload_time, r.truck_unload_duration, r.truck_count,
    r.boiler_consumptions.subtotal,
    r.boiler_consumptions.hl_A, r.boiler_consumptions.hl_B,
    r.boiler_consumptions.jz_A, r.boiler_consumptions.jz_B,
    r.boiler_consumptions.xz_A, r.boiler_consumptions.xz_B,
    r.boiler_consumptions.wn_A, r.boiler_consumptions.wn_B,
    r.boiler_consumptions.yl_A, r.boiler_consumptions.yl_B,
    r.boiler_consumptions.lx_A, r.boiler_consumptions.lx_B,
    r.gasification_consumptions.subtotal,
    r.gasification_consumptions.coal_A, r.gasification_consumptions.coal_B,
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `运行记录_${filterDate.value || '全部'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Map shift label to a CSS modifier key for badge coloring.
function getShiftKey(shift: string): string {
  if (shift.includes('白')) return 'morning'
  if (shift.includes('小夜')) return 'middle'
  if (shift.includes('大夜')) return 'evening'
  return 'other'
}
</script>

<style scoped>
/* -------------------------------------------------------------------------
   Layout
   ------------------------------------------------------------------------- */
.view-container {
  padding: 12px 28px 16px;
  min-height: 100vh;
  box-sizing: border-box;
}

.view-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 14px 0;
  letter-spacing: -0.01em;
}

/* -------------------------------------------------------------------------
   Toolbar
   ------------------------------------------------------------------------- */
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.toolbar-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.filter-input {
  height: 32px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 0 10px;
  color: #1e3a5f;
  font-weight: 600;
  font-size: 14px;
  background: #ffffff;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.filter-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* -------------------------------------------------------------------------
   Buttons
   ------------------------------------------------------------------------- */
.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-secondary {
  background: #ffffff;
  color: #1e3a5f;
  border-color: #cbd5e1;
}

.btn-secondary:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-link {
  background: transparent;
  border: none;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
  transition: background 0.15s ease, color 0.15s ease;
}

.btn-link:hover {
  background: #eff6ff;
  color: #1d4ed8;
}

/* -------------------------------------------------------------------------
   Section & Table
   ------------------------------------------------------------------------- */
.section-block {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e3a5f;
  letter-spacing: 0.01em;
}

.section-meta {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: auto;
  background: #ffffff;
  max-height: calc(100vh - 280px);
}

.record-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #1f2937;
}

.record-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.record-table thead th {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  color: #1e3a5f;
  font-weight: 700;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.record-table tbody td {
  padding: 9px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.record-row {
  transition: background 0.12s ease;
}

.record-row:hover {
  background: #f8fafc;
}

.record-row:hover td {
  border-bottom-color: #e2e8f0;
}

.col-id { width: 60px; }
.col-date { width: 110px; }
.col-shift { width: 90px; }
.col-bins { width: 100px; }
.col-time { width: 130px; }
.col-duration { width: 110px; text-align: right; }
.col-actions { width: 100px; text-align: center; }

/* Sticky first 3 columns */
.th-sticky--1 { position: sticky; left: 0; z-index: 3; background: #f8fafc; }
.th-sticky--2 { position: sticky; left: 120px; z-index: 3; background: #f8fafc; }
.th-sticky--3 { position: sticky; left: 240px; z-index: 3; background: #f8fafc; }

.td-sticky--1 { position: sticky; left: 0; z-index: 2; background: #fff; }
.td-sticky--2 { position: sticky; left: 120px; z-index: 2; background: #fff; }
.td-sticky--3 { position: sticky; left: 240px; z-index: 2; background: #fff; }

.record-row:hover .td-sticky--1,
.record-row:hover .td-sticky--2,
.record-row:hover .td-sticky--3 {
  background: #f8fafc;
}

/* Clickable shift-total cells */
.td-clickable {
  cursor: pointer;
}

.clickable-total {
  color: #2563eb;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-decoration: none;
  transition: color 0.12s ease, text-decoration 0.12s ease;
}

.td-clickable:hover .clickable-total {
  color: #1d4ed8;
  text-decoration: underline;
}

.empty-row {
  text-align: center;
  padding: 40px 0 !important;
  color: #94a3b8;
  font-size: 14px;
}

/* -------------------------------------------------------------------------
   Shift Badge
   ------------------------------------------------------------------------- */
.shift-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
}

.shift-badge--morning {
  background: #fef3c7;
  color: #92400e;
}

.shift-badge--middle {
  background: #dbeafe;
  color: #1e40af;
}

.shift-badge--evening {
  background: #e0e7ff;
  color: #3730a3;
}

.shift-badge--other {
  background: #f1f5f9;
  color: #475569;
}

/* -------------------------------------------------------------------------
   Modal
   ------------------------------------------------------------------------- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.modal-container {
  background: #ffffff;
  border-radius: 10px;
  width: 100%;
  max-width: 820px;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 22px;
}

.modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1e3a5f;
}

.modal-subtitle {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 26px;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
  transition: background 0.15s ease, color 0.15s ease;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e3a5f;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 12px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
}

/* Modal fade transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.96) translateY(8px);
}

/* -------------------------------------------------------------------------
   Detail Sections (inside modal)
   ------------------------------------------------------------------------- */
.detail-section {
  margin-bottom: 22px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1e3a5f;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.section-icon {
  font-size: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 4px;
  font-size: 13px;
}

.detail-label {
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  color: #1e3a5f;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.detail-item--highlight {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #bfdbfe;
}

.detail-value--strong {
  color: #1d4ed8;
  font-size: 14px;
}

/* -------------------------------------------------------------------------
   CRITICAL: Sludge Isolation Highlight
   ------------------------------------------------------------------------- */
.detail-item--sludge {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  position: relative;
}

.detail-item--sludge::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #d97706;
  border-radius: 4px 0 0 4px;
}

.detail-label--sludge {
  color: #92400e;
  font-weight: 600;
}

.detail-value--sludge {
  color: #b45309;
  font-weight: 700;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
}

/* -------------------------------------------------------------------------
   Responsive
   ------------------------------------------------------------------------- */
@media (max-width: 768px) {
  .view-container {
    padding: 12px 14px;
  }

  .toolbar-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
