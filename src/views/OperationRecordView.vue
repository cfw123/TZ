<template>
  <div class="view-container">
    <h2 class="view-title">运行记录查询</h2>

    <!-- Top Toolbar -->
    <div class="toolbar">
      <div class="toolbar-filters">
        <div class="filter-group">
          <label class="filter-label">日期</label>
          <input v-model="filterDate" class="filter-input" v-bind="dateInputAttrs" />
        </div>

        <div class="filter-group">
          <label class="filter-label">粒度</label>
          <select v-model="filterGranularity" class="filter-input">
            <option value="day">按日</option>
            <option value="month">按月</option>
            <option value="year">按年</option>
          </select>
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

        <div class="toolbar-actions toolbar-actions--primary">
          <button class="btn btn-accent" @click="handleCreate">+ 新增</button>
          <button class="btn btn-primary" @click="handleSearch">查询</button>
        </div>

        <div class="toolbar-actions toolbar-actions--secondary">
          <button v-if="pendingDelete" class="btn btn-sm btn-warning" @click="undoDelete">撤销删除</button>
          <button v-if="!isDefaultView" class="btn btn-secondary" @click="resetToDefault">恢复默认</button>
          <button class="btn btn-secondary" @click="handleExport">导出</button>
        </div>
      </div>
    </div>

    <!-- Main Data Table -->
    <div class="section-block">
      <div class="section-header">
        <span class="section-title">运行记录列表</span>
        <span class="section-meta">{{ currentPage }} / {{ totalPages }} 页 · 共 {{ filteredRecords.length }} 条</span>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button class="btn btn-secondary" :disabled="currentPage <= 1" @click="currentPage--">上一页</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="btn btn-secondary" :disabled="currentPage >= totalPages" @click="currentPage++">下一页</button>
      </div>

      <div class="table-wrapper">
        <table class="record-table">
          <thead>
            <tr>
              <th class="th-sticky th-sticky--1 sortable-th" @click="dateSortAsc = !dateSortAsc">
                日期 <span class="sort-icon">{{ dateSortAsc ? '▲' : '▼' }}</span>
              </th>
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
              <th class="th-sticky-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rec in pagedRecords"
              :key="rec.id"
              class="record-row"
              :class="{
                'record-row--saved': isSaved(rec.id),
                'record-row--editing': editingId === String(rec.id),
                'record-row--locked': editingId !== null && editingId !== String(rec.id),
              }"
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
                    :disabled="editingId !== String(rec.id)"
                  >
                    <option v-for="opt in RUN_GROUP_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <span v-if="runGroupErrors[rec.id]" class="run-group-error">{{ runGroupErrors[rec.id] }}</span>
                </div>
              </td>
              <td>
                <input
                  v-model="rec.execution_status"
                  class="cell-input"
                  @keydown="handleExecutionKeydown($event, rec)"
                  placeholder="↑↓选择, Enter确认"
                  :disabled="editingId !== String(rec.id)"
                />
              </td>
              <td>
                <div class="cell-input-wrap">
                  <input
                    v-model="rec.boiler_bins"
                    class="cell-input"
                    :class="{ 'cell-input--error': cellErrors['boiler_bins:' + rec.id] }"
                    @input="validateBoilerBins(rec, ($event.target as HTMLInputElement).value)"
                    @keydown="handleBoilerBinsKeydown($event, rec)"
                    placeholder="↑↓选择, Enter确认"
                    :disabled="editingId !== String(rec.id)"
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
                    @keydown="handleBoilerTimeKeydown($event, rec)"
                    placeholder="08:00~18:00"
                    rows="1"
                    :disabled="editingId !== String(rec.id)"
                  ></textarea>
                  <span v-if="timeCellErrors['boiler:' + rec.id]" class="cell-error">{{ timeCellErrors['boiler:' + rec.id] }}</span>
                </div>
              </td>
              <td class="td-num td-count">
                <div class="cell-input-wrap">
                  <input
                    :value="emptyAsZero(rec.boiler_blend_xz)"
                    @input="rec.boiler_blend_xz = zeroAsEmpty($event)"
                    type="number"
                    class="cell-input cell-input--num"
                    min="0"
                    step="1"
                    :disabled="editingId !== String(rec.id)"
                  />
                </div>
              </td>
              <td class="td-clickable td-num" @click="openDetail(rec, 'boiler')">
                <span class="clickable-total">{{ rec.boiler_consumptions?.subtotal || '' }}</span>
              </td>
              <td class="td-num">{{ rec.boiler_daily_total || '' }}</td>
              <td class="td-num">{{ rec.boiler_duration || '' }}</td>
              <td class="td-note">
                <div class="cell-input-wrap">
                  <input
                    v-model="rec.blend_mix"
                    class="cell-input"
                    placeholder="如：烟煤50%/焦煤30%/无烟煤20%"
                    @keydown="handleBlendMixKeydown($event, rec)"
                    :disabled="editingId !== String(rec.id)"
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
                    @keydown="handleGasBinsKeydown($event, rec)"
                    placeholder="↑↓选择, Enter确认"
                    :disabled="editingId !== String(rec.id)"
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
                    @keydown="handleBoilerTimeKeydown($event, rec)"
                    placeholder="↑↓选择, Enter确认"
                    rows="1"
                    :disabled="editingId !== String(rec.id)"
                  ></textarea>
                  <span v-if="timeCellErrors['gasification:' + rec.id]" class="cell-error">{{ timeCellErrors['gasification:' + rec.id] }}</span>
                </div>
              </td>
              <td class="td-clickable td-num" @click="openDetail(rec, 'gasification')">
                <span class="clickable-total">{{ rec.gasification_consumptions?.subtotal || '' }}</span>
              </td>
              <td class="td-num">{{ rec.gasification_daily_total || '' }}</td>
              <td class="td-num">{{ rec.gasification_duration || '' }}</td>
              <td class="td-note">
                <div class="cell-input-wrap">
                  <textarea
                    :value="rec.reason"
                    class="cell-input cell-textarea cell-textarea--note"
                    @input="onNoteInput(rec, 'reason', ($event.target as HTMLTextAreaElement).value)"
                    @keydown="handleReasonKeydown($event, rec)"
                    placeholder="↑↓选择, Enter确认"
                    rows="1"
                    :disabled="editingId !== String(rec.id)"
                  ></textarea>
                </div>
              </td>
              <td class="td-note">
                <div class="cell-input-wrap">
                  <textarea
                    :value="rec.remarks"
                    class="cell-input cell-textarea cell-textarea--note"
                    @input="onNoteInput(rec, 'remarks', ($event.target as HTMLTextAreaElement).value)"
                    @keydown="handleReasonKeydown($event, rec)"
                    placeholder="↑↓选择, Enter确认"
                    rows="1"
                    :disabled="editingId !== String(rec.id)"
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
                    @keydown="handleBoilerTimeKeydown($event, rec)"
                    placeholder="↑↓选择, Enter确认"
                    rows="1"
                    :disabled="editingId !== String(rec.id)"
                  ></textarea>
                  <span v-if="timeCellErrors['truck:' + rec.id]" class="cell-error">{{ timeCellErrors['truck:' + rec.id] }}</span>
                </div>
              </td>
              <td class="td-num">{{ rec.truck_unload_duration || '' }}</td>
              <td class="td-num td-count">
                <div class="cell-input-wrap">
                  <input
                    :value="emptyAsZero(rec.truck_count)"
                    @input="rec.truck_count = zeroAsEmpty($event)"
                    type="number"
                    class="cell-input cell-input--num"
                    min="0"
                    step="1"
                    :disabled="editingId !== String(rec.id)"
                  />
                </div>
              </td>
              <td class="td-action td-sticky-right">
                <button
                  class="btn btn-sm"
                  :class="editingId === String(rec.id) ? 'btn-primary' : (isSaved(rec.id) ? 'btn-secondary' : 'btn-primary')"
                  :disabled="savingIds.has(String(rec.id)) || (editingId !== null && editingId !== String(rec.id))"
                  @click="handleRowAction(rec)"
                >
                  {{ savingIds.has(String(rec.id)) ? '保存中…' : (editingId === String(rec.id) ? '完成' : (isSaved(rec.id) ? '编辑' : '保存')) }}
                </button>
                <button
                  v-if="isSaved(rec.id)"
                  class="btn btn-sm"
                  :class="confirmingDeleteId === String(rec.id) ? 'btn-danger-confirm' : 'btn-danger'"
                  @click="initiateDelete(rec)"
                >
                  {{ confirmingDeleteId === String(rec.id) ? '确认删除?' : '删除' }}
                </button>
              </td>
            </tr>
            <tr v-if="filteredRecords.length === 0">
              <td :colspan="22" class="empty-row">暂无匹配数据</td>
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
import { db } from './_shared/dbService'
import { api } from '@/api.js'

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
  db_id?: string
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
    execution_status: rec.shift_batch === '大夜班' || rec.shift_batch === '白班' ? '已执行' : '',
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

// Coercion helpers for number inputs: display '' when the field value is 0,
// write back 0 when the user clears the field. This keeps blank new-record
// rows from showing "0" as a placeholder in type="number" inputs.
function emptyAsZero(v: number | string) {
  return v === 0 ? '' : v
}
function zeroAsEmpty(e: Event) {
  const v = (e.target as HTMLInputElement).value
  return v === '' ? 0 : Number(v)
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

const EXECUTION_STATUS_STORAGE_KEY = 'tz_execution_status_history_v1'
const REASON_STORAGE_KEY = 'tz_reason_history_v1'
const BOILER_BINS_STORAGE_KEY = 'tz_boiler_bins_history_v1'
const BLEND_MIX_STORAGE_KEY = 'tz_blend_mix_history_v1'
const BOILER_TIME_STORAGE_KEY = 'tz_boiler_time_history_v1'

function getExecutionStatusHistory(): string[] {
  try {
    const raw = localStorage.getItem(EXECUTION_STATUS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveExecutionStatusHistory(values: string[]) {
  try {
    localStorage.setItem(EXECUTION_STATUS_STORAGE_KEY, JSON.stringify(values))
  } catch {}
}

function getReasonHistory(): string[] {
  try {
    const raw = localStorage.getItem(REASON_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveReasonHistory(values: string[]) {
  try {
    localStorage.setItem(REASON_STORAGE_KEY, JSON.stringify(values))
  } catch {}
}

function getUniqueExecutionStatusesFromDB(): string[] {
  try {
    const rows = db.list<Record<string, unknown>>('operation_record_rows')
    const dbValues = rows
      .map(r => String(r.executionStatus ?? r.execution_status ?? '').trim())
      .filter(val => Boolean(val) && val !== 'null' && val !== 'undefined')
    return Array.from(new Set(dbValues))
  } catch (e) {
    console.warn('[OperationRecordView] Failed to fetch unique execution statuses from DB:', e)
    return []
  }
}

function getUniqueReasonsFromDB(): string[] {
  try {
    const rows = db.list<Record<string, unknown>>('operation_record_rows')
    const dbValues = rows
      .map(r => String(r.reason ?? '').trim())
      .filter(val => Boolean(val) && val !== 'null' && val !== 'undefined')
    return Array.from(new Set(dbValues))
  } catch (e) {
    console.warn('[OperationRecordView] Failed to fetch unique reasons from DB:', e)
    return []
  }
}

function getUniqueBoilerBinsFromDB(): string[] {
  try {
    const rows = db.list<Record<string, unknown>>('operation_record_rows')
    const dbValues = rows
      .map(r => String(r.boiler_bins ?? '').trim())
      .filter(val => Boolean(val) && val !== 'null' && val !== 'undefined')
    return Array.from(new Set(dbValues))
  } catch (e) {
    console.warn('[OperationRecordView] Failed to fetch unique boiler_bins from DB:', e)
    return []
  }
}

function getUniqueGasBinsFromDB(): string[] {
  try {
    const rows = db.list<Record<string, unknown>>('operation_record_rows')
    const dbValues = rows
      .map(r => String(r.gasification_bins ?? '').trim())
      .filter(val => Boolean(val) && val !== 'null' && val !== 'undefined')
    return Array.from(new Set(dbValues))
  } catch (e) {
    console.warn('[OperationRecordView] Failed to fetch gasification_bins from DB:', e)
    return []
  }
}

function getUniqueBoilerTimeFromDB(): string[] {
  try {
    const rows = db.list<Record<string, unknown>>('operation_record_rows')
    const dbValues = rows
      .map(r => String(r.boiler_time ?? '').trim())
      .filter(val => Boolean(val) && val !== 'null' && val !== 'undefined')
    return Array.from(new Set(dbValues))
  } catch (e) {
    console.warn('[OperationRecordView] Failed to fetch unique boiler_time from DB:', e)
    return []
  }
}

function getUniqueBlendMixFromDB(): string[] {
  try {
    const rows = db.list<Record<string, unknown>>('operation_record_rows')
    const dbValues = rows
      .map(r => String(r.blendMix ?? r.blend_mix ?? '').trim())
      .filter(val => Boolean(val) && val !== 'null' && val !== 'undefined')
    return Array.from(new Set(dbValues))
  } catch (e) {
    console.warn('[OperationRecordView] Failed to fetch unique blendMix from DB:', e)
    return []
  }
}

function getBlendMixHistory(): string[] {
  try {
    const raw = localStorage.getItem(BLEND_MIX_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveBlendMixHistory(values: string[]) {
  try {
    localStorage.setItem(BLEND_MIX_STORAGE_KEY, JSON.stringify(values))
  } catch {}
}

function handleBlendMixKeydown(e: KeyboardEvent, rec: OperationRecordRow) {
  const allValues = Array.from(new Set([
    ...getBlendMixHistory(),
    ...filteredRecords.value.map(r => r.blend_mix).filter(Boolean),
    ...getUniqueBlendMixFromDB(),
  ]))

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (allValues.length === 0) return
    let currentIndex = allValues.indexOf(rec.blend_mix)
    if (e.key === 'ArrowUp') currentIndex = currentIndex <= 0 ? allValues.length - 1 : currentIndex - 1
    else currentIndex = currentIndex === -1 || currentIndex >= allValues.length - 1 ? 0 : currentIndex + 1
    rec.blend_mix = allValues[currentIndex]
    ;(e.target as HTMLInputElement).value = allValues[currentIndex]
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (rec.blend_mix && !getBlendMixHistory().includes(rec.blend_mix)) {
      saveBlendMixHistory([rec.blend_mix, ...getBlendMixHistory()].slice(0, 20))
    }
    ;(e.target as HTMLInputElement).blur()
  }
}

function handleExecutionKeydown(e: KeyboardEvent, rec: OperationRecordRow) {
  // Get all unique non-empty values from history, table, and DB
  const allValues = Array.from(new Set([
    ...getExecutionStatusHistory(),
    ...filteredRecords.value.map(r => r.execution_status).filter(Boolean),
    ...getUniqueExecutionStatusesFromDB(),
  ]))

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (allValues.length === 0) return

    let currentIndex = allValues.indexOf(rec.execution_status)

    if (e.key === 'ArrowUp') {
      if (currentIndex <= 0) currentIndex = allValues.length - 1
      else currentIndex--
    } else if (e.key === 'ArrowDown') {
      if (currentIndex === -1 || currentIndex >= allValues.length - 1) currentIndex = 0
      else currentIndex++
    }
    rec.execution_status = allValues[currentIndex]
    ;(e.target as HTMLInputElement).value = allValues[currentIndex]
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    // Save to history
    if (rec.execution_status && !getExecutionStatusHistory().includes(rec.execution_status)) {
      saveExecutionStatusHistory([rec.execution_status, ...getExecutionStatusHistory()].slice(0, 20))
    }
    ;(e.target as HTMLInputElement).blur()
  }
}

function handleReasonKeydown(e: KeyboardEvent, rec: OperationRecordRow) {
  const allValues = Array.from(new Set([
    ...getReasonHistory(),
    ...filteredRecords.value.map(r => r.reason).filter(Boolean),
    ...getUniqueReasonsFromDB(),
  ]))

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (allValues.length === 0) return
    let currentIndex = allValues.indexOf(rec.reason)
    if (e.key === 'ArrowUp') currentIndex = currentIndex <= 0 ? allValues.length - 1 : currentIndex - 1
    else currentIndex = currentIndex === -1 || currentIndex >= allValues.length - 1 ? 0 : currentIndex + 1
    rec.reason = allValues[currentIndex]
    ;(e.target as HTMLTextAreaElement).value = allValues[currentIndex]
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (rec.reason && !getReasonHistory().includes(rec.reason)) {
      saveReasonHistory([rec.reason, ...getReasonHistory()].slice(0, 20))
    }
    ;(e.target as HTMLTextAreaElement).blur()
  }
}

function getBoilerBinsHistory(): string[] {
  try {
    const raw = localStorage.getItem(BOILER_BINS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveBoilerBinsHistory(values: string[]) {
  try {
    localStorage.setItem(BOILER_BINS_STORAGE_KEY, JSON.stringify(values))
  } catch {}
}

function handleBoilerBinsKeydown(e: KeyboardEvent, rec: OperationRecordRow) {
  const allValues = Array.from(new Set([
    ...getBoilerBinsHistory(),
    ...filteredRecords.value.map(r => r.boiler_bins).filter(Boolean),
    ...getUniqueBoilerBinsFromDB(),
  ]))

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (allValues.length === 0) return
    let currentIndex = allValues.indexOf(rec.boiler_bins)
    if (e.key === 'ArrowUp') currentIndex = currentIndex <= 0 ? allValues.length - 1 : currentIndex - 1
    else currentIndex = currentIndex === -1 || currentIndex >= allValues.length - 1 ? 0 : currentIndex + 1
    rec.boiler_bins = allValues[currentIndex]
    ;(e.target as HTMLInputElement).value = allValues[currentIndex]
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (rec.boiler_bins && !getBoilerBinsHistory().includes(rec.boiler_bins)) {
      saveBoilerBinsHistory([rec.boiler_bins, ...getBoilerBinsHistory()].slice(0, 20))
    }
    ;(e.target as HTMLInputElement).blur()
  }
}

function handleGasBinsKeydown(e: KeyboardEvent, rec: OperationRecordRow) {
  const allValues = Array.from(new Set([
    ...getBoilerBinsHistory(),
    ...filteredRecords.value.map(r => r.gasification_bins).filter(Boolean),
    ...getUniqueGasBinsFromDB(),
  ]))

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (allValues.length === 0) return
    let currentIndex = allValues.indexOf(rec.gasification_bins)
    if (e.key === 'ArrowUp') currentIndex = currentIndex <= 0 ? allValues.length - 1 : currentIndex - 1
    else currentIndex = currentIndex === -1 || currentIndex >= allValues.length - 1 ? 0 : currentIndex + 1
    rec.gasification_bins = allValues[currentIndex]
    ;(e.target as HTMLInputElement).value = allValues[currentIndex]
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (rec.gasification_bins && !getBoilerBinsHistory().includes(rec.gasification_bins)) {
      saveBoilerBinsHistory([rec.gasification_bins, ...getBoilerBinsHistory()].slice(0, 20))
    }
    ;(e.target as HTMLInputElement).blur()
  }
}

function getBoilerTimeHistory(): string[] {
  try {
    const raw = localStorage.getItem(BOILER_TIME_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveBoilerTimeHistory(values: string[]) {
  try {
    localStorage.setItem(BOILER_TIME_STORAGE_KEY, JSON.stringify(values))
  } catch {}
}

function handleBoilerTimeKeydown(e: KeyboardEvent, rec: OperationRecordRow) {
  const allValues = Array.from(new Set([
    ...getBoilerTimeHistory(),
    ...filteredRecords.value.map(r => r.boiler_time).filter(Boolean),
    ...getUniqueBoilerTimeFromDB(),
  ]))

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (allValues.length === 0) return
    let currentIndex = allValues.indexOf(rec.boiler_time)
    if (e.key === 'ArrowUp') currentIndex = currentIndex <= 0 ? allValues.length - 1 : currentIndex - 1
    else currentIndex = currentIndex === -1 || currentIndex >= allValues.length - 1 ? 0 : currentIndex + 1
    rec.boiler_time = allValues[currentIndex]
    ;(e.target as HTMLTextAreaElement).value = allValues[currentIndex]
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (rec.boiler_time && !getBoilerTimeHistory().includes(rec.boiler_time)) {
      saveBoilerTimeHistory([rec.boiler_time, ...getBoilerTimeHistory()].slice(0, 20))
    }
    ;(e.target as HTMLTextAreaElement).blur()
  }
}

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
// records is directly backed by db.list so saves/updates are immediately visible.
// refreshTrigger bumps on every save/update so records re-reads from db.list
const refreshTrigger = ref(0)

// In-memory drafts created by the 新增 button. They show up in the table
// without being persisted; on 保存 they go through api.createRow and are
// dropped from this list (refreshTrigger re-emits the persisted copy).
const newRowDrafts = ref<OperationRecordRow[]>([])
// Ids that are soft-deleted (hidden during the 5-minute undo window). The
// 5-minute timer eventually removes the id from this set and fires the real
// api.deleteRow + db.remove so the row is gone for good.
const deletedIds = reactive<Set<string>>(new Set())

const records = computed<OperationRecordRow[]>(() => {
  refreshTrigger.value // pull in reactivity
  const rows = db.list<Record<string, unknown>>('operation_record_rows')
  const persisted = rows.length > 0
    ? rows.map(buildRow)
    : makeDemoSeed().map(withMetadata)
  // Hide rows whose localId is in the deletedIds set; drafts always appear
  // on top so the user sees a new blank row immediately.
  const live = [...newRowDrafts.value, ...persisted].filter(
    r => !deletedIds.has(String(r.id))
  )
  return live
})

// Build an OperationRecordRow from a db row (flat camelCase → nested snake_case + metadata)
function buildRow(row: Record<string, unknown>, idx: number): OperationRecordRow {
  const recordDate = String(row.recordDate ?? row.record_date ?? '')
  const shiftBatch = String(row.shiftBatch ?? row.shift_batch ?? '')
  const id = `${recordDate}-${shiftBatch}`
  const db_id = String(row.id ?? row._id ?? id)
  const bc = (row.boilerConsumptions as BoilerConsumption | null) ?? { subtotal: 0, hl_A: 0, hl_B: 0, jz_A: 0, jz_B: 0, xz_A: 0, xz_B: 0, wn_A: 0, wn_B: 0, yl_A: 0, yl_B: 0, lx_A: 0, lx_B: 0 }
  const gc = (row.gasificationConsumptions as GasificationConsumption | null) ?? { subtotal: 0, coal_A: 0, coal_B: 0 }
  return {
    id,
    db_id, // Store real database primary key
    record_date: recordDate,
    shift_batch: shiftBatch,
    run_group: runGroupSelections[id] ?? ['四班', '一班', '二班', '三班'][idx % 4],
    execution_status: String(row.executionStatus ?? row.execution_status ?? ''),
    boiler_bins: String(row.boilerBins ?? row.boiler_bins ?? ''),
    boiler_time: String(row.boilerTime ?? row.boiler_time ?? ''),
    boiler_duration: Number(row.boilerDuration ?? row.boiler_duration ?? 0),
    boiler_blend_xz: Number(row.boilerBlendXz ?? row.boiler_blend_xz ?? 0),
    blend_mix: String(row.blendMix ?? row.blend_mix ?? ''),
    gasification_bins: String(row.gasificationBins ?? row.gasification_bins ?? ''),
    gasification_time: String(row.gasificationTime ?? row.gasification_time ?? ''),
    gasification_duration: Number(row.gasificationDuration ?? row.gasification_duration ?? 0),
    reason: String(row.reason ?? ''),
    remarks: String(row.remarks ?? ''),
    truck_unload_time: String(row.truckUnloadTime ?? row.truck_unload_time ?? ''),
    truck_unload_duration: Number(row.truckUnloadDuration ?? row.truck_unload_duration ?? 0),
    truck_count: Number(row.truckCount ?? row.truck_count ?? 0),
    boiler_consumptions: bc,
    gasification_consumptions: gc,
    boiler_daily_total: Number(row.boilerDayTotal ?? row.boiler_daily_total ?? 0),
    gasification_daily_total: Number(row.gasificationDayTotal ?? row.gasification_daily_total ?? 0),
  } as OperationRecordRow
}

// ---------------------------------------------------------------------------
// Filter State
// ---------------------------------------------------------------------------
function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const dateSortAsc = ref(true)
const filterDate = ref<string>('')
const isDefaultView = ref(true)

function defaultMonthStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const filterGranularity = ref<'day' | 'month' | 'year'>('month')
const dateInputAttrs = computed(() => {
  if (filterGranularity.value === 'day') return { type: 'date', placeholder: '年-月-日' }
  if (filterGranularity.value === 'month') return { type: 'month', placeholder: '年-月' }
  return { type: 'number', placeholder: '年', min: '2020', max: '2099' }
})
const filterShift = ref<string>('')
const currentPage = ref(1)
const PAGE_SIZE = computed(() => isDefaultView.value ? 50 : 50)

// Shift order mapping: 大夜班(0) < 白班(1) < 小夜班(2)
const SHIFT_ORDER: Record<string, number> = {
  '大夜班': 0,
  '白班': 1,
  '小夜班': 2,
}

// Apply filter to displayed records (live preview), sorted by shift order
const filteredRecords = computed<OperationRecordRow[]>(() => {
  currentPage.value = 1
  const defaultDate = isDefaultView.value ? defaultMonthStr() : ''
  const activeDate = filterDate.value || defaultDate
  return records.value
    .filter(rec => {
      if (!activeDate) return true
      const d = rec.record_date
      if (filterGranularity.value === 'day') return d === activeDate
      if (filterGranularity.value === 'month') {
        const prefix = d.slice(0, 7)
        return prefix === activeDate.slice(0, prefix.length)
      }
      return d.slice(0, 4) === activeDate.slice(0, 4)
    })
    .filter(rec => {
      return !filterShift.value || rec.shift_batch === filterShift.value
    })
    .sort((a, b) => {
      const dateCompare = a.record_date.localeCompare(b.record_date) * (dateSortAsc.value ? 1 : -1)
      if (dateCompare !== 0) return dateCompare
      const shiftA = SHIFT_ORDER[a.shift_batch] ?? 99
      const shiftB = SHIFT_ORDER[b.shift_batch] ?? 99
      return shiftA - shiftB
    })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRecords.value.length / PAGE_SIZE.value)))
const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE.value
  return filteredRecords.value.slice(start, start + PAGE_SIZE.value)
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
onMounted(() => {
  document.addEventListener('keydown', onModalKeydown)
  loadSavedIds()
})
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

const savingIds = reactive<Set<string>>(new Set())
const confirmingDeleteId = ref<string | null>(null)
let confirmResetTimer: ReturnType<typeof setTimeout> | null = null

const pendingDelete = ref<{ rec: OperationRecordRow; dbId: string | null; timer: ReturnType<typeof setTimeout> } | null>(null)

function initiateDelete(rec: OperationRecordRow) {
  if (confirmingDeleteId.value === String(rec.id)) {
    // Second click -> execute soft delete
    confirmingDeleteId.value = null
    if (confirmResetTimer) clearTimeout(confirmResetTimer)
    executeSoftDelete(rec)
  } else {
    // First click -> show "确认删除?" warning for 3 seconds
    confirmingDeleteId.value = String(rec.id)
    if (confirmResetTimer) clearTimeout(confirmResetTimer)
    confirmResetTimer = setTimeout(() => {
      confirmingDeleteId.value = null
    }, 3000)
  }
}

async function executeSoftDelete(rec: OperationRecordRow) {
  const localId = String(rec.id)
  const dbId = savedDbIdMap.get(localId)
  // Hide the row from the computed list immediately. We keep it in
  // deletedIds for the 5-minute undo window. If the user undoes, undoDelete
  // re-creates the row in db.json; otherwise the row stays gone for good.
  deletedIds.add(localId)
  if (dbId) {
    try { db.remove('operation_record_rows', dbId) } catch {}
    try { await api.deleteRow(dbId) } catch (e) {
      console.warn('[deleteRow] backend delete failed:', e)
    }
  }
  savedIds.delete(localId)
  savedDbIdMap.delete(localId)
  refreshTrigger.value++
  // Re-sync savedIds so a page reload within the undo window doesn't
  // resurrect the row from db.list() / localStorage cache.
  await loadSavedIds()
  pendingDelete.value = {
    rec,
    dbId: dbId ?? null,
    timer: setTimeout(() => {
      if (pendingDelete.value?.rec.id === rec.id) pendingDelete.value = null
    }, 5 * 60 * 1000),
  }
  showToast('info', `已删除 · 5 分钟内可撤销`)
}
const editingId = ref<string | null>(null)
const savedIds = reactive<Set<string>>(new Set())
const savedDbIdMap = reactive<Map<string, string>>(new Map()) // localId -> db.id

async function loadSavedIds() {
  const rows = db.list<Record<string, unknown>>('operation_record_rows')
  rows.forEach(row => {
    const localId = buildLocalId(String(row.recordDate), String(row.shiftBatch))
    savedIds.add(localId)
    savedDbIdMap.set(localId, String(row.id))
  })
}

function buildLocalId(recordDate: string, shiftBatch: string) {
  return `${recordDate}-${shiftBatch}`
}

function isSaved(id: string | number) {
  return savedIds.has(String(id))
}

function startEdit(id: string) {
  if (editingId.value !== null) {
    const prevId = editingId.value
    exitEditMode()
    if (prevId !== id) editingId.value = id
  } else {
    editingId.value = id
  }
}

function exitEditMode() {
  editingId.value = null
}

async function undoDelete() {
  if (!pendingDelete.value) return
  clearTimeout(pendingDelete.value.timer)
  const rec = pendingDelete.value.rec
  const dbId = pendingDelete.value.dbId
  pendingDelete.value = null
  // The row was already deleted from db.json and dbService when the user
  // first confirmed. To undo, we re-create the row in both stores so it
  // reappears on the next refreshTick / page reload.
  try {
    if (dbId) {
      await api.createRow(rec as unknown as Record<string, unknown>)
    }
  } catch (e) {
    console.warn('[undoDelete] backend recreate failed:', e)
  }
  const localId = String(rec.id)
  const restored = dbId ? { ...rec, id: dbId } : rec
  const saved = db.create('operation_record_rows', restored)
  savedIds.add(localId)
  savedDbIdMap.set(localId, String(saved.id))
  deletedIds.delete(localId)
  refreshTrigger.value++
  showToast('success', `已撤销删除`)
}

async function handleRowAction(rec: OperationRecordRow) {
  if (editingId.value === String(rec.id)) {
    // In edit mode → complete: save and exit
    await (isSaved(rec.id) ? updateRecord(rec) : saveRecord(rec))
    editingId.value = null
  } else {
    // Not in edit mode → enter edit mode
    editingId.value = String(rec.id)
  }
}

async function saveRecord(rec: OperationRecordRow) {
  if (savingIds.has(String(rec.id))) return
  const err = runGroupErrors[rec.id]
    || cellErrors['boiler_bins:' + rec.id]
    || gasCellErrors[rec.id]
    || timeCellErrors['boiler:' + rec.id]
    || timeCellErrors['gasification:' + rec.id]
    || timeCellErrors['truck:' + rec.id]
  if (err) {
    showToast('error', `请先修正红色报错再保存：${err}`)
    return
  }
  savingIds.add(String(rec.id))
  try {
    const payload = {
      recordDate: rec.record_date,
      shiftBatch: rec.shift_batch,
      runGroup: rec.run_group || null,
      executionStatus: rec.execution_status || null,
      boilerBins: rec.boiler_bins || null,
      boilerTime: rec.boiler_time || null,
      boilerDuration: rec.boiler_duration || null,
      boilerBlendXz: rec.boiler_blend_xz || null,
      boilerShiftTotal: rec.boiler_consumptions?.subtotal || null,
      boilerDayTotal: rec.boiler_daily_total || null,
      boilerConsumptions: rec.boiler_consumptions || null,
      blendMix: rec.blend_mix || null,
      gasificationBins: rec.gasification_bins || null,
      gasificationTime: rec.gasification_time || null,
      gasificationDuration: rec.gasification_duration || null,
      gasificationShiftTotal: rec.gasification_consumptions?.subtotal || null,
      gasificationDayTotal: rec.gasification_daily_total || null,
      gasificationConsumptions: rec.gasification_consumptions || null,
      reason: rec.reason || null,
      remarks: rec.remarks || null,
      truckUnloadTime: rec.truck_unload_time || null,
      truckUnloadDuration: rec.truck_unload_duration || null,
      truckCount: rec.truck_count || null,
    }
    const created = await api.createRow(payload)
    // Sync with local dbService so db.list() contains the new record.
    // Pass the record with its server-assigned id so db.create() preserves it.
    const saved = db.create('operation_record_rows', { id: created?.id, ...payload })
    // Promote the row's id from the temporary "new:..." draft to the
    // canonical localId so subsequent isSaved() / savedDbIdMap lookups match
    // the keys built by loadSavedIds() (i.e. `${recordDate}-${shiftBatch}`).
    const localId = buildLocalId(rec.record_date, rec.shift_batch)
    savedIds.add(localId)
    savedDbIdMap.set(localId, String(saved.id))
    // Also index the original draft id so any stale references in savingIds
    // don't get stuck forever, and drop the in-memory draft so we don't
    // double-show the row during the refreshTick window.
    savingIds.delete(String(rec.id))
    newRowDrafts.value = newRowDrafts.value.filter(d => String(d.id) !== String(rec.id))
    refreshTrigger.value++
    showToast('success', `${rec.record_date} · ${rec.shift_batch} 已保存到数据库`)
  } catch (e) {
    showToast('error', `保存失败: ${e instanceof Error ? e.message : e}`)
  } finally {
    savingIds.delete(String(rec.id))
  }
}

async function updateRecord(rec: OperationRecordRow) {
  if (savingIds.has(String(rec.id))) return
  const dbId = savedDbIdMap.get(String(rec.id))
  if (!dbId) {
    showToast('error', '未找到已保存记录，无法修改')
    return
  }
  savingIds.add(String(rec.id))
  try {
    const payload = {
      recordDate: rec.record_date,
      shiftBatch: rec.shift_batch,
      runGroup: rec.run_group || null,
      executionStatus: rec.execution_status || null,
      boilerBins: rec.boiler_bins || null,
      boilerTime: rec.boiler_time || null,
      boilerDuration: rec.boiler_duration || null,
      boilerBlendXz: rec.boiler_blend_xz || null,
      boilerShiftTotal: rec.boiler_consumptions?.subtotal || null,
      boilerDayTotal: rec.boiler_daily_total || null,
      boilerConsumptions: rec.boiler_consumptions || null,
      blendMix: rec.blend_mix || null,
      gasificationBins: rec.gasification_bins || null,
      gasificationTime: rec.gasification_time || null,
      gasificationDuration: rec.gasification_duration || null,
      gasificationShiftTotal: rec.gasification_consumptions?.subtotal || null,
      gasificationDayTotal: rec.gasification_daily_total || null,
      gasificationConsumptions: rec.gasification_consumptions || null,
      reason: rec.reason || null,
      remarks: rec.remarks || null,
      truckUnloadTime: rec.truck_unload_time || null,
      truckUnloadDuration: rec.truck_unload_duration || null,
      truckCount: rec.truck_count || null,
    }
    await api.updateRow(dbId, payload)
    refreshTrigger.value++
    showToast('success', `${rec.record_date} · ${rec.shift_batch} 已更新`)
  } catch (e) {
    showToast('error', `修改失败: ${e instanceof Error ? e.message : e}`)
  } finally {
    savingIds.delete(String(rec.id))
  }
}

function handleSearch() {
  isDefaultView.value = false
  filterDate.value = filterDate.value // force reactivity
  console.log('[Search] date=', filterDate.value, 'shift=', filterShift.value)
}

function handleCreate() {
  // Draft id uses a "new:" prefix so it can't collide with persisted ids
  // (those are `${recordDate}-${shiftBatch}`). The 完成 button on this row
  // will dispatch into saveRecord, which calls api.createRow.
  const draftId = `new:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const emptyBoiler: BoilerConsumption = {
    subtotal: 0, hl_A: 0, hl_B: 0, jz_A: 0, jz_B: 0,
    xz_A: 0, xz_B: 0, wn_A: 0, wn_B: 0,
    yl_A: 0, yl_B: 0, lx_A: 0, lx_B: 0,
  }
  const emptyGas: GasificationConsumption = { subtotal: 0, coal_A: 0, coal_B: 0 }
  const draft: OperationRecordRow = {
    id: draftId,
    record_date: toLocalDateString(new Date()),
    shift_batch: '白班',
    run_group: runGroupSelections[draftId] ?? '一班',
    execution_status: '',
    boiler_bins: '',
    boiler_time: '',
    boiler_duration: 0,
    boiler_blend_xz: 0,
    blend_mix: '',
    gasification_bins: '',
    gasification_time: '',
    gasification_duration: 0,
    reason: '',
    remarks: '',
    truck_unload_time: '',
    truck_unload_duration: 0,
    truck_count: 0,
    boiler_consumptions: emptyBoiler,
    gasification_consumptions: emptyGas,
    boiler_daily_total: 0,
    gasification_daily_total: 0,
  }
  newRowDrafts.value = [draft, ...newRowDrafts.value]
  // Enter edit mode on the draft so the user can immediately start filling it.
  editingId.value = String(draft.id)
  // Reset pagination so the new row is visible without scrolling.
  currentPage.value = 1
  // Clear default-view filter so the new draft isn't hidden behind it.
  isDefaultView.value = false
  refreshTrigger.value++
}

function resetToDefault() {
  isDefaultView.value = true
  filterDate.value = ''
  filterShift.value = ''
  filterGranularity.value = 'month'
  currentPage.value = 1
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-actions--primary {
  padding-left: 4px;
  border-left: 2px solid #e2e8f0;
  margin-left: 4px;
}

.toolbar-actions--secondary {
  margin-left: auto;
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

.btn-accent {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border-color: #059669;
}

.btn-accent:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  border-color: #047857;
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

.btn-danger {
  background: #ffffff;
  color: #dc2626;
  border-color: #fca5a5;
}

.btn-danger:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

.btn-danger-confirm {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
  animation: pulse-danger 0.6s ease-in-out infinite alternate;
}

.btn-danger-confirm:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}

@keyframes pulse-danger {
  from { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
  to { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0); }
}

.btn-warning {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}

.btn-warning:hover {
  background: #fef3c7;
  border-color: #d97706;
}

.btn-sm {
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
}

.td-action {
  text-align: center;
  vertical-align: middle;
  padding: 4px 8px;
  white-space: nowrap;
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

/* Saved row highlight */
.record-row--saved {
  background: #f0fdf4;
}
.record-row--saved:hover {
  background: #dcfce7;
}
.record-row--saved td {
  background: inherit;
}
.record-row--saved .td-sticky--1,
.record-row--saved .td-sticky--2,
.record-row--saved .td-sticky--3 {
  background: #f0fdf4;
}
.record-row--saved:hover .td-sticky--1,
.record-row--saved:hover .td-sticky--2,
.record-row--saved:hover .td-sticky--3 {
  background: #dcfce7;
}
.record-row--saved .td-sticky--1 {
  box-shadow: inset 3px 0 0 #16a34a;
}

/* Edit mode */
.record-row--editing {
  background: #fffbeb;
  box-shadow: inset 0 0 0 2px #f59e0b;
}
.record-row--editing .cell-input:not(:disabled) {
  border-color: #f59e0b;
  background: #fffbeb;
}

/* Locked rows (another row is being edited) */
.record-row--locked td {
  opacity: 0.45;
  pointer-events: none;
}
.record-row--locked .td-sticky--1,
.record-row--locked .td-sticky--2,
.record-row--locked .td-sticky--3 {
  opacity: 0.45;
  pointer-events: auto;
}

/* Sticky first 3 columns */
.th-sticky--1 { position: sticky; left: 0; z-index: 3; background: #f8fafc; min-width: 120px; }
.th-sticky--2 { position: sticky; left: 120px; z-index: 3; background: #f8fafc; min-width: 90px; }
.th-sticky--3 { position: sticky; left: 210px; z-index: 3; background: #f8fafc; box-shadow: 4px 0 8px -2px rgba(0, 0, 0, 0.06); border-right: 1px solid #e2e8f0; min-width: 90px; }
.th-sticky-right { position: sticky; right: 0; z-index: 3; background: #f8fafc; min-width: 70px; }

.td-sticky--1 { position: sticky; left: 0; z-index: 2; background: #fff; min-width: 120px; }
.td-sticky--2 { position: sticky; left: 120px; z-index: 2; background: #fff; min-width: 90px; }
.td-sticky--3 { position: sticky; left: 210px; z-index: 2; background: #fff; box-shadow: 4px 0 8px -2px rgba(0, 0, 0, 0.06); border-right: 1px solid #e2e8f0; min-width: 90px; }

.record-row:hover .td-sticky--1,
.record-row:hover .td-sticky--2,
.record-row:hover .td-sticky--3 {
  background: #f8fafc;
}

.td-sticky-right { position: sticky; right: 0; z-index: 2; background: #fff; box-shadow: -4px 0 8px -2px rgba(0, 0, 0, 0.06); border-left: 1px solid #e2e8f0; }

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

  .toolbar-actions--primary,
  .toolbar-actions--secondary {
    margin-left: 0;
    border-left: 0;
    padding-left: 0;
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
