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
              <th class="th-num">锅炉掺烧细渣量<br>(铲)</th>
              <th class="th-num">锅炉当班上煤量<br>(吨)</th>
              <th class="th-num">锅炉当日上煤量<br>(吨)</th>
              <th class="th-num">锅炉上煤时长<br>(分)</th>
              <th>掺烧煤种及比例</th>
              <th>气化运行筒仓</th>
              <th>气化上煤时间</th>
              <th class="th-num">气化当班上煤量<br>(吨)</th>
              <th class="th-num">气化当日上煤量<br>(吨)</th>
              <th class="th-num">气化上煤时长<br>(分)</th>
              <th>原因说明</th>
              <th>备注</th>
              <th>汽车卸车时间</th>
              <th class="th-num">汽车卸车时长<br>(分)</th>
              <th class="th-num">汽车卸车数量<br>(辆)</th>
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
              <td class="td-sticky td-sticky--3 run-group-cell">
                <div class="run-group-control">
                  <select
                    v-model="runGroupSelections[rec.id]"
                    class="run-group-select"
                    @change="confirmRunGroup(rec)"
                  >
                    <option v-for="opt in RUN_GROUP_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <span v-if="runGroupErrors[rec.id]" class="run-group-error">{{ runGroupErrors[rec.id] }}</span>
                </div>
              </td>
              <td>
                <input v-model="rec.execution_status" class="cell-input" />
              </td>
              <td>
                <div class="cell-input-wrap">
                  <input
                    v-model="rec.boiler_bins"
                    class="cell-input"
                    :class="{ 'cell-input--error': cellErrors['boiler_bins:' + rec.id] }"
                    @input="validateBoilerBins(rec, ($event.target as HTMLInputElement).value)"
                  />
                  <span v-if="cellErrors['boiler_bins:' + rec.id]" class="cell-error">{{ cellErrors['boiler_bins:' + rec.id] }}</span>
                </div>
              </td>
              <td class="td-time">
                <div class="cell-input-wrap">
                  <textarea
                    :value="rec.boiler_time"
                    class="cell-input cell-textarea"
                    :class="{ 'cell-input--error': timeCellErrors['boiler:' + rec.id] }"
                    @input="onTimeTextareaInput($event, rec, 'boiler')"
                    placeholder="08:00~18:00"
                    rows="1"
                  ></textarea>
                  <span v-if="timeCellErrors['boiler:' + rec.id]" class="cell-error">{{ timeCellErrors['boiler:' + rec.id] }}</span>
                </div>
              </td>
              <td class="td-num td-count">
                <div class="cell-input-wrap">
                  <input
                    v-model.number="rec.boiler_blend_xz"
                    type="number"
                    class="cell-input cell-input--num"
                    min="0"
                    step="1"
                  />
                </div>
              </td>
              <td class="td-clickable td-num" @click="openDetail(rec, 'boiler')">
                <span class="clickable-total">{{ rec.boiler_consumptions?.subtotal || 0 }}</span>
              </td>
              <td class="td-num">{{ rec.boiler_daily_total }}</td>
              <td class="td-num">{{ rec.boiler_duration }}</td>
              <td class="td-note">
                <div class="cell-input-wrap">
                  <input
                    v-model="rec.blend_mix"
                    class="cell-input"
                    placeholder="如：烟煤50%/焦煤30%/无烟煤20%"
                  />
                </div>
              </td>
              <td>
                <div class="cell-input-wrap">
                  <input
                    v-model="rec.gasification_bins"
                    class="cell-input"
                    :class="{ 'cell-input--error': gasCellErrors[rec.id] }"
                    @input="validateGasBins(rec, ($event.target as HTMLInputElement).value)"
                  />
                  <span v-if="gasCellErrors[rec.id]" class="cell-error">{{ gasCellErrors[rec.id] }}</span>
                </div>
              </td>
              <td class="td-time">
                <div class="cell-input-wrap">
                  <textarea
                    :value="rec.gasification_time"
                    class="cell-input cell-textarea"
                    :class="{ 'cell-input--error': timeCellErrors['gasification:' + rec.id] }"
                    @input="onTimeTextareaInput($event, rec, 'gasification')"
                    placeholder="08:00~18:00"
                    rows="1"
                  ></textarea>
                  <span v-if="timeCellErrors['gasification:' + rec.id]" class="cell-error">{{ timeCellErrors['gasification:' + rec.id] }}</span>
                </div>
              </td>
              <td class="td-clickable td-num" @click="openDetail(rec, 'gasification')">
                <span class="clickable-total">{{ rec.gasification_consumptions?.subtotal || 0 }}</span>
              </td>
              <td class="td-num">{{ rec.gasification_daily_total }}</td>
              <td class="td-num">{{ rec.gasification_duration }}</td>
              <td class="td-note">
                <div class="cell-input-wrap">
                  <textarea
                    :value="rec.reason"
                    class="cell-input cell-textarea cell-textarea--note"
                    @input="onNoteInput(rec, 'reason', ($event.target as HTMLTextAreaElement).value)"
                    placeholder="原因说明"
                    rows="1"
                  ></textarea>
                </div>
              </td>
              <td class="td-note">
                <div class="cell-input-wrap">
                  <textarea
                    :value="rec.remarks"
                    class="cell-input cell-textarea cell-textarea--note"
                    @input="onNoteInput(rec, 'remarks', ($event.target as HTMLTextAreaElement).value)"
                    placeholder="备注"
                    rows="1"
                  ></textarea>
                </div>
              </td>
              <td class="td-time">
                <div class="cell-input-wrap">
                  <textarea
                    :value="rec.truck_unload_time"
                    class="cell-input cell-textarea"
                    :class="{ 'cell-input--error': timeCellErrors['truck:' + rec.id] }"
                    @input="onTimeTextareaInput($event, rec, 'truck')"
                    placeholder="09:00~11:00"
                    rows="1"
                  ></textarea>
                  <span v-if="timeCellErrors['truck:' + rec.id]" class="cell-error">{{ timeCellErrors['truck:' + rec.id] }}</span>
                </div>
              </td>
              <td class="td-num">{{ rec.truck_unload_duration }}</td>
              <td class="td-num td-count">
                <div class="cell-input-wrap">
                  <input
                    v-model.number="rec.truck_count"
                    type="number"
                    class="cell-input cell-input--num"
                    min="0"
                    step="1"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="filteredRecords.length === 0">
              <td colspan="21" class="empty-row">暂无匹配数据</td>
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
                <h3 class="modal-title">{{ modalType === 'boiler' ? '锅炉消耗明细' : '气化消耗明细' }}</h3>
                <p v-if="selectedRecord" class="modal-subtitle">
                  {{ selectedRecord.record_date }} · {{ selectedRecord.shift_batch }}
                </p>
              </div>
            </div>
            <button class="modal-close" @click="closeDetail" aria-label="关闭">×</button>
          </div>

          <div class="modal-body" v-if="selectedRecord">
            <!-- Boiler Consumption Section -->
            <section class="detail-section" v-if="modalType === 'boiler'">
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
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.hl_A">
                  <span class="detail-label">黄陵混合煤 - A仓 (hl_A)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.hl_A }}</span>
                </div>
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.hl_B">
                  <span class="detail-label">黄陵混合煤 - B仓 (hl_B)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.hl_B }}</span>
                </div>
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.jz_A">
                  <span class="detail-label">建庄大块煤 - A仓 (jz_A)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.jz_A }}</span>
                </div>
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.jz_B">
                  <span class="detail-label">建庄大块煤 - B仓 (jz_B)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.jz_B }}</span>
                </div>
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.xz_A">
                  <span class="detail-label">细渣煤 - A仓 (xz_A)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.xz_A }}</span>
                </div>
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.xz_B">
                  <span class="detail-label">细渣煤 - B仓 (xz_B)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.xz_B }}</span>
                </div>
                <div class="detail-item detail-item--sludge" v-if="selectedRecord.boiler_consumptions.wn_A">
                  <span class="detail-label detail-label--sludge">
                    ⚠ 污泥 - A仓 (wn_A) · 隔离核算
                  </span>
                  <span class="detail-value detail-value--sludge">
                    {{ selectedRecord.boiler_consumptions.wn_A }}
                  </span>
                </div>
                <div class="detail-item detail-item--sludge" v-if="selectedRecord.boiler_consumptions.wn_B">
                  <span class="detail-label detail-label--sludge">
                    ⚠ 污泥 - B仓 (wn_B) · 隔离核算
                  </span>
                  <span class="detail-value detail-value--sludge">
                    {{ selectedRecord.boiler_consumptions.wn_B }}
                  </span>
                </div>
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.yl_A">
                  <span class="detail-label">原料煤 - A仓 </span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.yl_A }}</span>
                </div>
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.yl_B">
                  <span class="detail-label">原料煤 - B仓 </span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.yl_B }}</span>
                </div>
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.lx_A">
                  <span class="detail-label">离心煤 - A仓 (lx_A)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.lx_A }}</span>
                </div>
                <div class="detail-item" v-if="selectedRecord.boiler_consumptions.lx_B">
                  <span class="detail-label">离心煤 - B仓 (lx_B)</span>
                  <span class="detail-value">{{ selectedRecord.boiler_consumptions.lx_B }}</span>
                </div>
              </div>
              <div v-else class="empty-state">无锅炉消耗数据</div>
            </section>

            <!-- Gasification Consumption Section -->
            <section class="detail-section" v-if="modalType === 'gasification'">
              <div class="detail-section__title">
                <span class="section-icon">💨</span>
                <span>气化消耗明细</span>
              </div>
              <div class="bins-edit-row">
                <div class="bins-edit-cell">
                  <span class="bins-edit-label">气化运行筒仓</span>
                  <input
                    v-model="selectedRecord!.gasification_bins"
                    class="cell-input"
                    :class="{ 'cell-input--error': selectedRecord && gasCellErrors[String(selectedRecord.id)], 'cell-input--success': selectedRecord && !gasCellErrors[String(selectedRecord.id)] && selectedRecord.gasification_bins }"
                    @input="selectedRecord && validateGasBins(selectedRecord, ($event.target as HTMLInputElement).value)"
                  />
                  <span v-if="selectedRecord && gasCellErrors[String(selectedRecord.id)]" class="cell-error">{{ gasCellErrors[String(selectedRecord.id)] }}</span>
                </div>
                <div class="bins-edit-cell">
                  <span class="bins-edit-label">气化上煤时间</span>
                  <input v-model="selectedRecord!.gasification_time" class="cell-input" />
                </div>
              </div>
              <div class="detail-grid" v-if="selectedRecord.gasification_consumptions">
                <div class="detail-item detail-item--highlight">
                  <span class="detail-label">小计</span>
                  <span class="detail-value detail-value--strong">
                    {{ selectedRecord.gasification_consumptions.subtotal }}
                  </span>
                </div>
                <div class="detail-item" v-if="selectedRecord.gasification_consumptions.coal_A">
                  <span class="detail-label">A仓原料煤 (coal_A)</span>
                  <span class="detail-value">{{ selectedRecord.gasification_consumptions.coal_A }}</span>
                </div>
                <div class="detail-item" v-if="selectedRecord.gasification_consumptions.coal_B">
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

    <!-- Inline toast for run-group confirmation -->
    <Transition name="toast-fade">
      <div v-if="toastMessage" class="run-group-toast">✓ {{ toastMessage }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import type { OperationRecord, BoilerConsumption, GasificationConsumption } from './_shared/shiftRecordStore'
import { getOperationRecords, shiftRecordStore } from './_shared/shiftRecordStore'

// Re-export for in-template use so the legacy type names keep working.
export type { BoilerConsumption, GasificationConsumption }

// ---------------------------------------------------------------------------
// Demo seed: when the store is empty (first visit, or no shifts confirmed yet),
// we render a single synthetic row so the table isn't visually empty. The
// instant the user confirms a real shift in DailyConsumption.vue, the live
// store takes over and the demo row disappears (or merges into the real data
// for that date).
// ---------------------------------------------------------------------------
function makeDemoSeed(): OperationRecord[] {
  const boiler: BoilerConsumption = {
    subtotal: 1065.5,
    hl_A: 180, hl_B: 120,
    jz_A: 140, jz_B: 95,
    xz_A: 70.5, xz_B: 50,
    wn_A: 220, wn_B: 180,
    yl_A: 120, yl_B: 90,
    lx_A: 160, lx_B: 60,
  }
  const gas: GasificationConsumption = { subtotal: 430, coal_A: 220, coal_B: 210 }
  const seedDate = toLocalDateString(new Date())
  return [{
    id: 0,
    record_date: seedDate,
    shift_batch: '汇总',
    boiler_consumptions: boiler,
    gasification_consumptions: gas,
    boiler_daily_total: boiler.subtotal,
    gasification_daily_total: gas.subtotal,
  }]
}

// ---------------------------------------------------------------------------
// Metadata fields that live on the run-record report but are NOT derived from
// the consumption ledger (run-group, equipment state, time windows, etc.).
// Real-world: these come from an operator's edits on OperationRecordView and
// get persisted alongside the consumption data. For now they're defaulted.
// ---------------------------------------------------------------------------
type OperationRecordRow = OperationRecord & {
  run_group: string
  execution_status: string
  boiler_bins: string
  boiler_time: string
  boiler_duration: number
  boiler_blend_xz: number
  blend_mix: string
  gasification_bins: string
  gasification_time: string
  gasification_duration: number
  reason: string
  remarks: string
  truck_unload_time: string
  truck_unload_duration: number
  truck_count: number
}

function withMetadata(rec: OperationRecord, idx: number): OperationRecordRow {
  return {
    ...rec,
    run_group: runGroupSelections[String(rec.id)] ?? ['四班', '一班', '二班', '三班'][idx % 4],
    execution_status: '已执行',
    boiler_bins: '1#ABC',
    boiler_time: '08:00~10:30',
    boiler_duration: 150,
    boiler_blend_xz: 0,
    blend_mix: '烟煤60% / 焦煤40%',
    gasification_bins: '1#A',
    gasification_time: '08:00-10:00',
    gasification_duration: 120,
    reason: '正常生产',
    remarks: '由消耗台账同步',
    truck_unload_time: '09:00-11:00',
    truck_unload_duration: 120,
    truck_count: 3,
  }
}

// ---------------------------------------------------------------------------
// Run-group selections: limited to 一班 / 二班 / 三班 / 四班, persisted in
// localStorage so a user-picked team survives navigation and F5.
// ---------------------------------------------------------------------------
const RUN_GROUP_OPTIONS = ['一班', '二班', '三班', '四班'] as const
const RUN_GROUP_STORAGE_KEY = 'tz_run_group_selections_v1'
const runGroupSelections = reactive<Record<string, string>>({})
const runGroupErrors = reactive<Record<string, string>>({})
const cellErrors = reactive<Record<string, string>>({})
const gasCellErrors = reactive<Record<string, string>>({})
const timeCellErrors = reactive<Record<string, string>>({})

function handleTimeInput(rec: OperationRecordRow, field: 'boiler' | 'gasification' | 'truck', value: string) {
  const sanitized = value.replace(/[,、]/g, '\n').replace(/~/g, '-').replace(/[ \t\r]+/g, '\n')
  const targets: Record<typeof field, { time: string; duration: string }> = {
    boiler: { time: 'boiler_time', duration: 'boiler_duration' },
    gasification: { time: 'gasification_time', duration: 'gasification_duration' },
    truck: { time: 'truck_unload_time', duration: 'truck_unload_duration' },
  }
  const t = targets[field]
  ;(rec as any)[t.time] = sanitized
  const key = `${field}:${rec.id}`
  if (!sanitized) {
    delete timeCellErrors[key]
    ;(rec as any)[t.duration] = 0
    return
  }
  const pattern = /^(?:[0-2]?[0-9]:[0-5][0-9]-[0-2]?[0-9]:[0-5][0-9])(?:\n(?:[0-2]?[0-9]:[0-5][0-9]-[0-2]?[0-9]:[0-5][0-9]))*$/
  if (!pattern.test(sanitized)) {
    timeCellErrors[key] = '格式示例:\n08:00~18:00\n19:00~20:00'
    ;(rec as any)[t.duration] = 0
    return
  }
  delete timeCellErrors[key]
  ;(rec as any)[t.duration] = calculateDuration(sanitized)
}

function validateGasBins(rec: OperationRecordRow, value: string) {
  const id = String(rec.id)
  if (!value) {
    delete gasCellErrors[id]
    return
  }
  const sanitized = value.replace(/,/g, '、').replace(/\s+/g, '')
  rec.gasification_bins = sanitized
  if (sanitized === '无') {
    delete gasCellErrors[id]
    return
  }
  const invalidChars = [...sanitized].filter(c => !/[0-9#、]/.test(c))
  if (invalidChars.length > 0) {
    gasCellErrors[id] = `非法字符：${[...new Set(invalidChars)].join(' ')}，仅允许 1# 2# 3# 4# 5# 6#`
    return
  }
  const pattern = /^(?:[1-6]#)(?:、(?:[1-6]#))*$/u
  if (!pattern.test(sanitized)) {
    gasCellErrors[id] = '格式示例：1#、2#、5#'
    return
  }
  const bins = sanitized.split('、')
  if (new Set(bins).size !== bins.length) {
    gasCellErrors[id] = '筒仓不能重复录入'
    return
  }
  delete gasCellErrors[id]
}

function validateBoilerBins(rec: OperationRecordRow, value: string) {
  const key = `boiler_bins:${rec.id}`
  if (!value) {
    delete cellErrors[key]
    return
  }
  const pattern = /^(?:无|(?:[1-4]#)?[A-D]+)(?:、(?:无|(?:[1-4]#)?[A-D]+))*$/u
  if (!pattern.test(value)) {
    cellErrors[key] = '格式示例：1#A、2#AB、4#ABC、1#ABC、3#AB'
  } else {
    delete cellErrors[key]
  }
}

function onNoteInput(rec: OperationRecordRow, field: 'reason' | 'remarks', value: string) {
  rec[field] = value
}

function onTimeTextareaInput(e: Event, rec: OperationRecordRow, field: 'boiler' | 'gasification' | 'truck') {
  const ta = e.target as HTMLTextAreaElement
  ta.style.height = 'auto'
  ta.style.height = `${ta.scrollHeight}px`
  handleTimeInput(rec, field, ta.value)
}

function calculateDuration(timeStr: string): number {
  if (!timeStr) return 0
  const sanitized = timeStr.replace(/[,、]/g, '\n').replace(/[ \t\r]+/g, '')
  const periods = sanitized.split('\n').filter(Boolean)
  let total = 0
  for (const period of periods) {
    const [startRaw, endRaw] = period.split('-')
    if (!startRaw || !endRaw) continue
    const [sh = 0, sm = 0] = startRaw.split(':').map(Number)
    const [eh = 0, em = 0] = endRaw.split(':').map(Number)
    let end = eh * 60 + em
    const start = sh * 60 + sm
    if (end < start) end += 24 * 60
    total += end - start
  }
  return total
}

function loadRunGroupSelections() {
  try {
    const raw = localStorage.getItem(RUN_GROUP_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, string>
    for (const [k, v] of Object.entries(parsed)) {
      if (RUN_GROUP_OPTIONS.includes(v as typeof RUN_GROUP_OPTIONS[number])) {
        runGroupSelections[k] = v
      }
    }
  } catch (e) {
    console.warn('[OperationRecordView] failed to hydrate run-group selections:', e)
  }
}

function persistRunGroupSelections() {
  try {
    localStorage.setItem(RUN_GROUP_STORAGE_KEY, JSON.stringify(runGroupSelections))
  } catch (e) {
    console.warn('[OperationRecordView] failed to persist run-group selections:', e)
  }
}

watch(runGroupSelections, persistRunGroupSelections, { deep: true })
loadRunGroupSelections()

function confirmRunGroup(rec: OperationRecordRow) {
  const id = String(rec.id)
  const picked = runGroupSelections[id]
  if (!picked) {
    alert('请先选择运行班组')
    return
  }
  const duplicate = records.value.find(r =>
    String(r.id) !== id &&
    r.record_date === rec.record_date &&
    r.shift_batch !== rec.shift_batch &&
    r.run_group === picked
  )
  if (duplicate) {
    runGroupErrors[id] = `${rec.record_date} 已有 ${duplicate.shift_batch} 确认为「${picked}」，各班次班组不可重复`
    runGroupSelections[id] = rec.run_group
    return
  }
  delete runGroupErrors[id]
  rec.run_group = picked
  for (const other of records.value) {
    const oid = String(other.id)
    if (oid === id || other.record_date !== rec.record_date) continue
    const stillDup = records.value.some(r =>
      String(r.id) !== oid &&
      r.record_date === other.record_date &&
      r.shift_batch !== other.shift_batch &&
      r.run_group === other.run_group &&
      r.run_group !== ''
    )
    if (stillDup) continue
    delete runGroupErrors[oid]
  }
  persistRunGroupSelections()
  showToast('success', `${rec.record_date} · ${rec.shift_batch} 运行班组已确认为「${picked}」`)
}

// Live records: when the store has confirmed shifts, show them; otherwise show
// the demo seed. Vue's reactivity follows the store's `length` and `deep`
// fields, so navigating back from DailyConsumption immediately reflects new
// confirmations.
const records = computed<OperationRecordRow[]>(() => {
  const live = getOperationRecords()
  if (live.length > 0) return live.map(withMetadata)
  // fallback: demo seed (only when nothing has been confirmed)
  if (shiftRecordStore.length === 0) return makeDemoSeed().map(withMetadata)
  return []
})

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
const filteredRecords = computed<OperationRecordRow[]>(() => {
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

// Initialize validation for all loaded records
filteredRecords.value.forEach(rec => {
  validateGasBins(rec, rec.gasification_bins)
  validateBoilerBins(rec, rec.boiler_bins)
  handleTimeInput(rec, 'boiler', rec.boiler_time)
  handleTimeInput(rec, 'gasification', rec.gasification_time)
  handleTimeInput(rec, 'truck', rec.truck_unload_time)
})

// ---------------------------------------------------------------------------
// Modal State
// ---------------------------------------------------------------------------
const showModal = ref(false)
const selectedRecord = ref<OperationRecordRow | null>(null)
const modalType = ref<'boiler' | 'gasification' | null>(null)

function openDetail(rec: OperationRecordRow, type: 'boiler' | 'gasification') {
  selectedRecord.value = rec
  modalType.value = type
  showModal.value = true
}

function closeDetail() {
  showModal.value = false
  selectedRecord.value = null
  modalType.value = null
}

function onModalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showModal.value) closeDetail()
}
onMounted(() => document.addEventListener('keydown', onModalKeydown))
onUnmounted(() => document.removeEventListener('keydown', onModalKeydown))

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
const toastMessage = ref<string>('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(_type: 'success' | 'error' | 'info', message: string) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2500)
}

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
    '锅炉运行筒仓', '锅炉上煤时间', '锅炉掺烧细渣量(铲)',
    '锅炉当班上煤量(吨)', '锅炉当日上煤量(吨)', '锅炉上煤时长(分)',
    '掺烧煤种及比例',
    '气化运行筒仓', '气化上煤时间',
    '气化当班上煤量(吨)', '气化当日上煤量(吨)', '气化上煤时长(分)',
    '原因说明', '备注', '汽车卸车时间', '汽车卸车时长(分)', '汽车卸车数量(辆)',
    '锅炉小计', 'hl_A', 'hl_B', 'jz_A', 'jz_B', 'xz_A', 'xz_B',
    'wn_A', 'wn_B', 'yl_A', 'yl_B', 'lx_A', 'lx_B',
    '气化小计', 'coal_A', 'coal_B',
  ]
  const rows = filteredRecords.value.map(r => [
    r.record_date, r.shift_batch, r.run_group, r.execution_status,
    r.boiler_bins, r.boiler_time, r.boiler_blend_xz,
    r.boiler_consumptions.subtotal, r.boiler_daily_total, r.boiler_duration,
    r.blend_mix,
    r.gasification_bins, r.gasification_time,
    r.gasification_consumptions.subtotal, r.gasification_daily_total, r.gasification_duration,
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

/* Sleek custom scrollbar */
.table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.table-wrapper::-webkit-scrollbar-track {
  background: transparent;
}
.table-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.record-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
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
  padding: 12px 16px;
  border-bottom: 2px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  white-space: nowrap;
}

.record-table tbody td {
  padding: 10px 16px;
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  vertical-align: middle;
  white-space: nowrap;
}

/* Numeric column alignment */
.th-num,
.td-num {
  text-align: right;
}

.record-row {
  transition: background 0.12s ease;
}

.record-row:hover {
  background: #f1f5f9;
}

.record-row:hover td {
  background: #f1f5f9;
  border-bottom-color: #e2e8f0;
}

.record-row:hover .td-sticky--1 {
  box-shadow: inset 3px 0 0 #3b82f6;
}

/* Sticky first 3 columns */
.th-sticky--1 { position: sticky; left: 0; z-index: 3; background: #f8fafc; min-width: 120px; }
.th-sticky--2 { position: sticky; left: 120px; z-index: 3; background: #f8fafc; min-width: 90px; }
.th-sticky--3 { position: sticky; left: 210px; z-index: 3; background: #f8fafc; box-shadow: 4px 0 8px -2px rgba(0, 0, 0, 0.06); border-right: 1px solid #e2e8f0; min-width: 90px; }

.td-sticky--1 { position: sticky; left: 0; z-index: 2; background: #fff; min-width: 120px; }
.td-sticky--2 { position: sticky; left: 120px; z-index: 2; background: #fff; min-width: 90px; }
.td-sticky--3 { position: sticky; left: 210px; z-index: 2; background: #fff; box-shadow: 4px 0 8px -2px rgba(0, 0, 0, 0.06); border-right: 1px solid #e2e8f0; min-width: 90px; }

.record-row:hover .td-sticky--1,
.record-row:hover .td-sticky--2,
.record-row:hover .td-sticky--3 {
  background: #f8fafc;
}

/* Clickable shift-total cells */
.td-clickable {
  cursor: pointer;
}

/* -------------------------------------------------------------------------
   Run-group inline editor
   ------------------------------------------------------------------------- */
.run-group-cell {
  padding: 6px 8px !important;
}

.run-group-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.run-group-error {
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  cursor: default;
}

.run-group-select {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  color: #1e293b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  min-width: 70px;
  outline: none;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.cell-input-wrap {
  display: flex;
  flex-direction: column;
  width: fit-content;
  min-width: 0;
}

.cell-textarea {
  resize: none;
  overflow: hidden;
  min-height: 28px;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
  padding-top: 4px;
  padding-bottom: 4px;
  width: 100%;
  box-sizing: border-box;
}

.td-time {
  min-width: 150px;
}

.td-count {
  width: 80px;
}

.cell-input--num {
  text-align: right;
  -moz-appearance: textfield;
}

.cell-input--num::-webkit-outer-spin-button,
.cell-input--num::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.td-note {
  min-width: 160px;
}

.cell-textarea--note {
  min-width: 140px;
}

.cell-input {
  field-sizing: content;
  min-width: 4ch;
  max-width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
  color: #1e293b;
  font-size: 13px;
  outline: none;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.cell-input:hover {
  border-color: #cbd5e1;
}

.cell-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.cell-input--error {
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.15);
}

.cell-input--success {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15);
}

.cell-error {
  display: block;
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
  width: 100%;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.bins-edit-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.bins-edit-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
  flex: 1;
}

.bins-edit-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.run-group-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.run-group-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 118, 110, 0.95);
  color: #ecfdf5;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(15, 118, 110, 0.25);
  z-index: 10000;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

.clickable-total {
  display: inline-block;
  padding: 2px 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  color: #2563eb;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-decoration: none;
  transition: background 0.12s ease, color 0.12s ease;
}

.td-clickable:hover .clickable-total {
  background: #dbeafe;
  color: #1d4ed8;
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
  background: #7c3aed;
  color: #ffffff;
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
  overflow: hidden;
  flex-shrink: 0;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.modal-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1e3a5f;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  min-height: 0;
  overscroll-behavior: contain;
}

/* Modal body scrollbar */
.modal-body::-webkit-scrollbar {
  width: 6px;
}
.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}
.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a8be;
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

  .modal-overlay {
    padding: 12px;
    align-items: flex-end;
  }

  .modal-container {
    max-height: 90vh;
    border-radius: 10px 10px 0 0;
    max-width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
