<template>
  <div class="view-container">
    <h2 class="view-title">原料煤卸输煤台账</h2>

    <div class="toolbar">
      <input
        v-model="searchKeyword"
        type="text"
        class="search-input"
        placeholder="搜索任意字段..."
      />
      <div class="toolbar-actions">
        <button class="btn btn-primary" @click="handleAdd">新增</button>
        <button
          class="btn btn-secondary"
          :disabled="!dirty || rows.length === 0"
          :title="saveButtonTitle"
          @click="handleSave"
        >保存</button>
        <button class="btn btn-secondary" @click="handleExport">导出CSV</button>
        <button class="btn btn-danger-ghost" @click="handleClearAll" v-if="rows.length">清空全部</button>
      </div>
    </div>

    <div class="table-wrapper">
      <div v-if="editingId" class="edit-hint" :class="{ 'edit-hint-new': editingRowIsNew }">
        <span class="edit-hint-dot"></span>
        <template v-if="editingRowIsNew">
          新增记录 · 正在录入第 {{ editingRowSeq }} 条 · 填写每列后按 <kbd>Enter</kbd> 保存这条记录 · <kbd>Esc</kbd> 放弃新增 · 点击「完成」保存
        </template>
        <template v-else>
          正在编辑第 {{ editingRowSeq }} 条记录 · 修改后按 <kbd>Enter</kbd> 立即保存并退出编辑 · <kbd>Esc</kbd> 撤销修改并退出 · 点击「完成」保存
        </template>
      </div>
      <table class="coal-table">
        <thead>
          <tr>
            <th style="width: 60px">序号</th>
            <th
              style="width: 110px; cursor: pointer; user-select: none;"
              :title="sortDir === 'asc' ? '当前按日期升序,点击改为降序' : '当前按日期降序,点击改为升序'"
              @click="toggleSortDir"
            >
              日期 <span class="sort-arrow">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th>运行煤仓</th>
            <th>气化当日上煤量</th>
            <th>气化当月上煤量</th>
            <th>气化当年上煤量</th>
            <th>原料煤来煤量</th>
            <th>207A存煤量</th>
            <th>207B存煤量</th>
            <th>原料煤总存煤量</th>
            <th>气化掺烧原料煤量</th>
            <th style="width: 130px">操作</th>
          </tr>
        </thead>
<tbody v-if="pagedRows.length">
          <tr
            v-for="(row, index) in pagedRows"
            :key="row.__id"
          :data-row-id="row.__id"
          :class="{
            'row-editing': editingId === row.__id,
            'row-editing-new': editingId === row.__id && row.__isNew,
            'row-locked': editingId && editingId !== row.__id,
            'row-just-added': row.__isNew,
            'row-just-edited': !row.__isNew && row.__modified
          }"
          @focusout="onRowFocusOut($event, row.__id)"
        >
          <td>{{ row.__seq }}</td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.date"
              class="cell-input"
              @input="onCellInput(row.__id, 'date', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'date')"
            />
            <span v-else v-html="highlightCell(row.date, 'date', row.__id)"></span>
          </td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.bin"
              class="cell-input"
              @input="onCellInput(row.__id, 'bin', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'bin')"
            />
            <span v-else v-html="highlightCell(row.bin, 'bin', row.__id)"></span>
          </td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.boilerDay"
              class="cell-input"
              @input="onCellInput(row.__id, 'boilerDay', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'boilerDay')"
            />
            <span v-else v-html="highlightCell(row.boilerDay, 'boilerDay', row.__id)"></span>
          </td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.boilerYear"
              class="cell-input"
              @input="onCellInput(row.__id, 'boilerYear', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'boilerYear')"
            />
            <span v-else v-html="highlightCell(row.boilerYear, 'boilerYear', row.__id)"></span>
          </td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.boilerMonth"
              class="cell-input"
              @input="onCellInput(row.__id, 'boilerMonth', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'boilerMonth')"
            />
            <span v-else v-html="highlightCell(row.boilerMonth, 'boilerMonth', row.__id)"></span>
          </td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.inbound"
              class="cell-input"
              @input="onCellInput(row.__id, 'inbound', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'inbound')"
            />
            <span v-else v-html="highlightCell(row.inbound, 'inbound', row.__id)"></span>
          </td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.stockA"
              class="cell-input"
              @input="onCellInput(row.__id, 'stockA', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'stockA')"
            />
            <span v-else v-html="highlightCell(row.stockA, 'stockA', row.__id)"></span>
          </td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.stockB"
              class="cell-input"
              @input="onCellInput(row.__id, 'stockB', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'stockB')"
            />
            <span v-else v-html="highlightCell(row.stockB, 'stockB', row.__id)"></span>
          </td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.stockTotal"
              class="cell-input"
              @input="onCellInput(row.__id, 'stockTotal', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'stockTotal')"
            />
            <span v-else v-html="highlightCell(row.stockTotal, 'stockTotal', row.__id)"></span>
          </td>
          <td :class="['editable', { 'editable-active': editingId === row.__id }]">
            <input
              v-if="editingId === row.__id"
              :value="row.blendBurn"
              class="cell-input"
              @input="onCellInput(row.__id, 'blendBurn', $event.target.value)"
              @keydown="onCellKeydown($event, row.__id, 'blendBurn')"
            />
            <span v-else v-html="highlightCell(row.blendBurn, 'blendBurn', row.__id)"></span>
          </td>
          <td class="actions-cell">
            <button
              v-if="editingId === row.__id"
              class="row-btn row-btn-done"
              @click="exitEditMode"
            >完成</button>
            <button
              v-else
              class="row-btn row-btn-edit"
              :disabled="!!editingId && editingId !== row.__id"
              :title="editingId && editingId !== row.__id ? '请先完成当前编辑' : '编辑此行'"
              @click="enterEditMode(row.__id)"
            >编辑</button>
            <button class="row-btn row-btn-del" @click="handleDelete(row.__id)">删除</button>
          </td>
        </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="12" class="empty-cell">
              {{ rows.length === 0 ? '暂无数据,点击「新增」开始录入' : '未找到匹配的记录' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="monthBuckets.length > 1 || rows.length" class="pager">
      <div class="pager-info">
        <span class="pager-info-label">按月份分页:</span>
        <span class="pager-info-current">
          第 {{ activePageIndex + 1 }} / {{ monthBuckets.length }} 页
          <template v-if="activeBucket">· {{ activeBucket.label }} <span class="pager-info-count">({{ pagedRows.length }}{{ searchKeyword ? `/${activeBucket.originalIndexes.length}` : '' }} 条)</span></template>
        </span>
      </div>
      <div class="pager-controls">
        <button
          class="pager-btn"
          :disabled="activePageIndex === 0"
          title="上一页(更早的月份)"
          @click="goToPage(activePageIndex - 1)"
        >‹ 上一页</button>
        <select
          class="pager-select"
          :value="activePageIndex"
          title="跳转到指定月份"
          @change="goToPage(Number($event.target.value))"
        >
          <option
            v-for="(bucket, idx) in monthBuckets"
            :key="bucket.key"
            :value="idx"
          >
            {{ bucket.label }} ({{ bucket.originalIndexes.length }} 条)
          </option>
        </select>
        <button
          class="pager-btn"
          :disabled="activePageIndex >= monthBuckets.length - 1"
          title="下一页(更新的月份)"
          @click="goToPage(activePageIndex + 1)"
        >下一页 ›</button>
      </div>
    </div>

    <div class="status-bar">
      共 {{ rows.length }} 条记录
      <template v-if="activeBucket">
        · 当前页 {{ activeBucket.label }}{{ pagedRows.length !== activeBucket.originalIndexes.length ? ` · 筛选 ${pagedRows.length} / ${activeBucket.originalIndexes.length}` : ` · ${activeBucket.originalIndexes.length} 条` }}
      </template>
      <span v-if="dirty" class="dirty-flag">· 有未保存修改</span>
      <span v-else-if="rows.length" class="saved-flag">· 已是最新已保存状态</span>
    </div>

    <Teleport to="body">
      <div v-if="confirmDialog" class="modal-overlay" @click.self="dismissDialog">
        <div class="modal" role="alertdialog" aria-modal="true">
          <div class="modal-header">
            <span class="modal-icon" :class="{ danger: confirmDialog.requireType || confirmDialog.kind === 'deleteRow' }">!</span>
            <h3 class="modal-title">{{ confirmDialog.title }}</h3>
          </div>
          <div class="modal-body">
            <div class="modal-detail-grid">
              <div v-for="r in confirmDialog.bodyRows" :key="r.label" class="modal-detail-row">
                <span class="modal-detail-label">{{ r.label }}</span>
                <span class="modal-detail-value">{{ r.value }}</span>
              </div>
            </div>
            <p v-if="confirmDialog.warning" class="modal-warning">{{ confirmDialog.warning }}</p>
            <div v-if="confirmDialog.requireType" class="modal-type-guard">
              <label class="modal-type-label">
                请输入 <code>{{ confirmDialog.requiredKeyword }}</code> 以确认操作
              </label>
              <input
                v-model="confirmDialog.typedKeyword"
                type="text"
                class="modal-type-input"
                :placeholder="confirmDialog.requiredKeyword"
                @keyup.enter="commitDialog"
                @keyup.escape="dismissDialog"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="dismissDialog" @keyup.escape="dismissDialog">
              {{ confirmDialog.cancelText }}
            </button>
            <button
              class="btn btn-danger"
              :disabled="confirmDialog.requireType && confirmDialog.typedKeyword !== confirmDialog.requiredKeyword"
              @click="commitDialog"
            >
              {{ confirmDialog.confirmText }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="undoTop" class="undo-toast" role="status" aria-live="polite">
        <span class="undo-message">
          {{ undoTop.message }}
          <template v-if="undoStack.length > 1">
            · 还有 {{ undoStack.length - 1 }} 条可撤销
          </template>
        </span>
        <button class="undo-btn" @click="triggerUndo">撤销</button>
        <button class="undo-close" @click="dismissUndo" aria-label="关闭">×</button>
      </div>

      <div
        v-if="toastEntry"
        class="toast-notice"
        :class="['toast-' + toastEntry.kind]"
        role="alert"
        aria-live="assertive"
      >
        <span class="toast-icon" aria-hidden="true">{{
          toastEntry.kind === 'success' ? '✓' : toastEntry.kind === 'error' ? '✕' : 'ℹ'
        }}</span>
        <span class="toast-message">{{ toastEntry.message }}</span>
        <button class="toast-close" @click="dismissToast" aria-label="关闭">×</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import api from '@/api'

const columns = ['date', 'bin', 'boilerDay', 'boilerMonth', 'boilerYear', 'inbound', 'stockA', 'stockB', 'stockTotal', 'blendBurn']

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightCell(value, field, rowId) {
  const text = String(value ?? '')
  const kw = searchKeyword.value.trim()
  if (!kw || editingId.value === rowId) return escapeHtml(text)
  const re = new RegExp(escapeRegex(kw), 'gi')
  const escaped = escapeHtml(text)
  return escaped.replace(re, (match) => `<mark class="kw-hl">${match}</mark>`)
}
function todayString() {
  const t = new Date()
  const yyyy = t.getFullYear()
  const mm = String(t.getMonth() + 1).padStart(2, '0')
  const dd = String(t.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
const blankRow = () => ({
  __id: crypto.randomUUID(),
  __isNew: true,
  __modified: false,
  date: todayString(),
  bin: '',
  boilerDay: '',
  boilerMonth: '',
  boilerYear: '',
  inbound: '',
  stockA: '',
  stockB: '',
  stockTotal: '',
  blendBurn: '',
})

// 响应式 rows
const rows = ref([])

const searchKeyword = ref('')
const dirty = ref(false)
const sortDir = ref('asc')

function toggleSortDir() {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}

const confirmDialog = ref(null)
const undoStack = ref([])
const toastEntry = ref(null)
let undoTimer = null
let toastTimer = null

const lastSavedSignature = ref('')
const editingId = ref(null)
const editingRowSnapshot = ref(null)

const editingRowSeq = computed(() => {
  if (!editingId.value) return 0
  const row = pagedRows.value.find((r) => r.__id === editingId.value)
  return row?.__seq ?? 0
})

const editingRowIsNew = computed(() => {
  if (!editingId.value) return false
  const row = rows.value.find((r) => r.__id === editingId.value)
  return !!row?.__isNew
})


function extractMonthKey(rawDate) {
  if (rawDate === null || rawDate === undefined) return null
  const text = String(rawDate).trim()
  if (!text) return null

  const cnMatch = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/)
  if (cnMatch) {
    const year = Number(cnMatch[1])
    const month = Number(cnMatch[2])
    if (month >= 1 && month <= 12) {
      return { year, month, sortKey: year * 100 + month, label: `${year}年${month}月` }
    }
  }

  const cnShortMatch = text.match(/(\d{1,2})\s*月\s*(\d{1,2})/)
  if (cnShortMatch) {
    const month = Number(cnShortMatch[1])
    const day = Number(cnShortMatch[2])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year: null, month, sortKey: month, label: `${month}月` }
    }
  }

  const isoMatch = text.match(/^(\d{4})[\-\/\.](\d{1,2})[\-\/\.](\d{1,3})/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    if (month >= 1 && month <= 12) {
      return { year, month, sortKey: year * 100 + month, label: `${year}年${month}月` }
    }
  }

  const shortMatch = text.match(/^(\d{1,2})[\-\/\.](\d{1,2})/)
  if (shortMatch) {
    const month = Number(shortMatch[1])
    const day = Number(shortMatch[2])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year: null, month, sortKey: month, label: `${month}月` }
    }
  }

  return null
}

const activePageIndex = ref(0)

const monthBuckets = computed(() => {
  const map = new Map()
  rows.value.forEach((row, idx) => {
    const key = extractMonthKey(row.date)
    const bucketKey = key?.sortKey ?? '__unparsed__'
    if (!map.has(bucketKey)) {
      map.set(bucketKey, {
        key: bucketKey,
        label: key?.label ?? '未分类',
        isUnparsed: !key,
        originalIndexes: [],
      })
    }
    map.get(bucketKey).originalIndexes.push(idx)
  })
  const buckets = [...map.values()]
  buckets.sort((a, b) => {
    if (a.isUnparsed) return 1
    if (b.isUnparsed) return -1
    return b.key - a.key
  })
  return buckets
})

watch(monthBuckets, (buckets) => {
  if (!buckets.length) {
    activePageIndex.value = 0
    return
  }
  if (activePageIndex.value >= buckets.length) {
    activePageIndex.value = buckets.length - 1
  }
}, { immediate: true })

const activeBucket = computed(() => {
  const buckets = monthBuckets.value
  if (!buckets.length) return null
  const idx = Math.min(Math.max(activePageIndex.value, 0), buckets.length - 1)
  return buckets[idx]
})

function goToPage(idx) {
  const buckets = monthBuckets.value
  if (!buckets.length) {
    activePageIndex.value = 0
    return
  }
  activePageIndex.value = Math.min(Math.max(idx, 0), buckets.length - 1)
}

function pageIndexOfRow(rowId) {
  const buckets = monthBuckets.value
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i].originalIndexes.some((origIdx) => rows.value[origIdx]?.__id === rowId)) {
      return i
    }
  }
  return -1
}

function jumpToRowPage(rowId) {
  const idx = pageIndexOfRow(rowId)
  if (idx >= 0) goToPage(idx)
}

const pagedRows = computed(() => {
  const bucket = activeBucket.value
  if (!bucket) return []
  const kw = searchKeyword.value.trim()
  const lower = kw.toLowerCase()
  const numbered = rows.value.map((row, i) => ({ ...row, __seq: i + 1 }))

  const rawPage = bucket.originalIndexes
    .map((i) => numbered[i])
    .filter(Boolean)

  const filtered = kw
    ? rawPage.filter((row) => columns.some((col) => String(row[col] ?? '').toLowerCase().includes(lower)))
    : rawPage

  // 如果正在编辑新增行，保持原有顺序（不重新排序）
  if (editingId.value && editingRowIsNew.value) {
    return filtered.map((row, i) => ({ ...row, __seq: i + 1 }))
  }

  const dir = sortDir.value === 'asc' ? 1 : -1
  const sorted = [...filtered].sort((a, b) => {
    const ka = extractMonthKey(a.date)?.sortKey ?? null
    const kb = extractMonthKey(b.date)?.sortKey ?? null
    if (ka !== null && kb !== null) {
      if (ka !== kb) return (ka - kb) * dir
      const da = Date.parse(String(a.date).replace(/\//g, '-'))
      const db = Date.parse(String(b.date).replace(/\//g, '-'))
      const va = isNaN(da) ? Infinity : da
      const vb = isNaN(db) ? Infinity : db
      return (va - vb) * dir
    }
    if (ka !== null) return -1
    if (kb !== null) return 1
    return 0
  })
  return sorted.map((row, i) => ({ ...row, __seq: i + 1 }))
})

function computeCurrentSignature() {
  const payload = rows.value.map(({ __seq, __id, __modified, ...rest }) => rest)
  return JSON.stringify(payload)
}

const saveButtonTitle = computed(() => {
  if (rows.value.length === 0) return '当前没有可保存的数据'
  if (!dirty.value) return '当前数据已是最新保存状态,无需重复保存'
  return '保存当前所有记录到本地存储'
})

function reindex() {
  rows.value.forEach((r, i) => {
    r.__seq = i + 1
  })
}

// 根据日期将新记录插入到正确位置
function insertRowByDate(newRow) {
  const dir = sortDir.value === 'asc' ? 1 : -1
  let insertIdx = rows.value.length
  for (let i = 0; i < rows.value.length; i++) {
    const existing = rows.value[i]
    if (existing.__id === newRow.__id) continue
    const ea = extractMonthKey(newRow.date)?.sortKey ?? null
    const eb = extractMonthKey(existing.date)?.sortKey ?? null
    if (ea !== null && eb !== null) {
      if (ea !== eb) {
        if ((ea - eb) * dir < 0) {
          insertIdx = i
          break
        }
      } else {
        const da = Date.parse(String(newRow.date).replace(/\//g, '-'))
        const db = Date.parse(String(existing.date).replace(/\//g, '-'))
        const va = isNaN(da) ? Infinity : da
        const vb = isNaN(db) ? Infinity : db
        if ((va - vb) * dir < 0) {
          insertIdx = i
          break
        }
      }
    } else if (ea !== null) {
      insertIdx = i
      break
    }
  }
  const oldIdx = rows.value.findIndex((r) => r.__id === newRow.__id)
  const filtered = rows.value.filter((r) => r.__id !== newRow.__id)
  filtered.splice(insertIdx < oldIdx ? insertIdx : insertIdx - 1, 0, newRow)
  rows.value = filtered
}

// ————————————————————————————————————————
// 初始化：从 API 加载数据
// ————————————————————————————————————————
async function initData() {
  try {
    const data = await api.list('raw_coal_rows')
    rows.value = (data || []).map((r) => ({
      ...r,
      __id: r.__id || crypto.randomUUID(),
      __isNew: false,
      __modified: false,
    }))
    lastSavedSignature.value = computeCurrentSignature()
    dirty.value = false
  } catch (e) {
    console.error('[RawCoal] Failed to load data:', e)
    rows.value = []
  }
}

// 全量持久化（手动点「保存」时触发）
async function persist() {
  try {
    const payload = rows.value.map(({ __seq, __isNew, __modified, ...rest }) => {
      const clean = { ...rest }
      delete clean.id
      return { ...clean, updatedAt: Date.now() }
    })
    await api.clear('raw_coal_rows')
    await api.bulkPut('raw_coal_rows', payload)
    dirty.value = false
    lastSavedSignature.value = computeCurrentSignature()
    return true
  } catch (e) {
    console.error('Failed to save rows:', e)
    return false
  }
}

function handleSave() {
  const count = rows.value.length
  if (count === 0) {
    showToast('info', '当前没有数据可保存')
    return
  }
  const currentSig = computeCurrentSignature()
  if (!dirty.value && currentSig === lastSavedSignature.value) {
    showToast('info', `当前 ${count} 条记录已是最新已保存状态,无需重复保存`)
    return
  }
  if (!dirty.value && currentSig !== lastSavedSignature.value) {
    dirty.value = true
  }
  persist().then((ok) => {
    if (ok) {
      showToast('success', `已保存 ${count} 条记录`)
    } else {
      showToast('error', '保存失败，请检查存储空间或浏览器权限')
    }
  })
}

function handleAdd() {
  const newRow = blankRow()
  // 新增记录直接追加到末尾，完成后会在 exitEditMode 中按日期排序
  rows.value.push(newRow)
  reindex()
  goToPage(monthBuckets.value.length - 1)
  nextTick(() => {
    enterEditMode(newRow.__id, { skipPageJump: true })
  })
}

async function dbUpsertRow(row) {
  const clean = { ...row }
  delete clean.__seq; delete clean.__isNew; delete clean.__modified; delete clean.__dbId
  clean.updatedAt = Date.now()
  if (row.id) {
    await api.update('raw_coal_rows', row.id, clean)
  } else {
    const newItem = await api.create('raw_coal_rows', clean)
    row.id = Array.isArray(newItem) ? newItem[newItem.length - 1].id : newItem.id
  }
}

async function dbDeleteRow(row) {
  if (row.id) await api.remove('raw_coal_rows', row.id)
}

function handleDelete(id) {
  const row = rows.value.find((r) => r.__id === id)
  if (!row) return
  if (editingId.value === id) exitEditMode({ skipCommit: true, showToast: false })
  confirmDialog.value = {
    kind: 'deleteRow',
    rowId: id,
    rowSnapshot: { ...row },
    title: '删除这条记录?',
    bodyRows: [
      { label: '日期', value: row.date || '—' },
      { label: '运行煤仓', value: row.bin || '—' },
      { label: '原料煤来煤量', value: row.inbound || '—' },
      { label: '原料煤总存煤量', value: row.stockTotal || '—' },
    ],
    warning: '删除后可以通过「撤销」在 5 分钟内恢复。',
    confirmText: '确认删除',
    cancelText: '取消',
    requireType: false,
  }
}

async function handleClearAll() {
  if (!rows.value.length) return
  confirmDialog.value = {
    kind: 'clearAll',
    title: '清空全部记录?',
    bodyRows: [
      { label: '当前记录数', value: `${rows.value.length} 条` },
      { label: '最早日期', value: rows.value.map((r) => r.date).filter(Boolean).sort()[0] || '—' },
      { label: '最晚日期', value: rows.value.map((r) => r.date).filter(Boolean).sort().slice(-1)[0] || '—' },
    ],
    warning: '此操作影响全部记录,无法撤销(关闭后只能重新录入)。',
    confirmText: '我已确认,清空全部',
    cancelText: '取消',
    requireType: true,
    typedKeyword: '',
    requiredKeyword: '确认删除',
  }
}

function dismissDialog() {
  confirmDialog.value = null
}

async function commitDialog() {
  const d = confirmDialog.value
  if (!d) return
  if (d.kind === 'deleteRow') {
    const snapshot = d.rowSnapshot
    const targetId = d.rowId
    rows.value = rows.value.filter((r) => r.__id !== targetId)
    await dbDeleteRow(snapshot)
    reindex()
    dirty.value = true
    showUndo(`已删除 ${snapshot.date || '该记录'}`, async () => {
      await dbUpsertRow(snapshot)
      rows.value.push({ ...snapshot })
      reindex()
      dirty.value = true
    })
  } else if (d.kind === 'clearAll') {
    if (d.requireType && d.typedKeyword !== d.requiredKeyword) return
    const snapshot = [...rows.value]
    rows.value = []
    editingId.value = null
    editingRowSnapshot.value = null
    try {
      await api.clear('raw_coal_rows')
    } catch (_) {}
    dirty.value = false
    lastSavedSignature.value = computeCurrentSignature()
    showUndo(`已清空 ${snapshot.length} 条记录`, async () => {
      rows.value = snapshot
      await persist()
      reindex()
    })
  }
  confirmDialog.value = null
}

function purgeExpired() {
  const now = Date.now()
  undoStack.value = undoStack.value.filter((e) => e.expireAt > now)
  if (undoStack.value.length === 0 && undoTimer) {
    clearTimeout(undoTimer)
    undoTimer = null
  }
}

const undoTop = computed(() => undoStack.value[undoStack.value.length - 1] || null)

function showUndo(message, onUndo) {
  const expireAt = Date.now() + 5 * 60 * 1000
  undoStack.value.push({ message, onUndo, expireAt })
  if (undoTimer) clearTimeout(undoTimer)
  undoTimer = setInterval(() => {
    purgeExpired()
    if (undoStack.value.length === 0 && undoTimer) {
      clearInterval(undoTimer)
      undoTimer = null
    }
  }, 1000)
}

function triggerUndo() {
  purgeExpired()
  const entry = undoStack.value.pop()
  if (!entry) return
  entry.onUndo().catch((e) => console.error('Undo failed:', e)).finally(() => {
    if (undoStack.value.length === 0 && undoTimer) {
      clearTimeout(undoTimer)
      undoTimer = null
    }
  })
}

function dismissUndo() {
  if (undoTimer) {
    clearInterval(undoTimer)
    undoTimer = null
  }
  undoStack.value = []
}

function showToast(kind, message) {
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
  toastEntry.value = { kind, message }
  const ms = kind === 'error' ? 4000 : 2500
  toastTimer = setTimeout(() => {
    toastEntry.value = null
    toastTimer = null
  }, ms)
}

function dismissToast() {
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
  toastEntry.value = null
}

function handleExport() {
  if (!rows.value.length) {
    showToast('info', '暂无数据可导出')
    return
  }
  const header = ['序号', '日期', '运行煤仓', '气化当日上煤量', '气化当月上煤量', '气化当年上煤量', '原料煤来煤量', '207A存煤量', '207B存煤量', '原料煤总存煤量', '气化掺烧原料煤量']
  const dataLines = rows.value.map((r, i) => [
    i + 1,
    r.date,
    r.bin,
    r.boilerDay,
    r.boilerYear,
    r.boilerMonth,
    r.inbound,
    r.stockA,
    r.stockB,
    r.stockTotal,
    r.blendBurn,
  ])
  const csv = [header, ...dataLines]
    .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const today = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `原料煤卸输煤台账_${today}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function hasRowChanged(row, baseline) {
  if (!baseline) return true
  for (const key of columns) {
    if (String(row[key] ?? '') !== String(baseline[key] ?? '')) return true
  }
  return false
}

function revertRow(row, baseline) {
  if (!baseline) return
  for (const key of columns) {
    row[key] = baseline[key]
  }
}

async function commitRowSave(id) {
  const row = rows.value.find((r) => r.__id === id)
  if (!row) return { ok: false, skipped: true }
  if (!hasRowChanged(row, editingRowSnapshot.value)) {
    return { ok: true, skipped: true }
  }
  try {
    await dbUpsertRow(row)
    if (row.__isNew) {
      row.__isNew = false
      row.__modified = false
    } else {
      row.__modified = true
    }
    lastSavedSignature.value = computeCurrentSignature()
    if (computeCurrentSignature() === lastSavedSignature.value) dirty.value = false
    return { ok: true, skipped: false }
  } catch (e) {
    console.error('Failed to save row:', e)
    return { ok: false, skipped: false, error: e }
  }
}

function onCellInput(id, field, value) {
  if (editingId.value !== id) return
  const row = rows.value.find((r) => r.__id === id)
  if (!row) return
  if (row[field] === value) return
  row[field] = value
  dirty.value = true
  if (field === 'stockA' || field === 'stockB') {
    const a = parseFloat(row.stockA) || 0
    const b = parseFloat(row.stockB) || 0
    const expected = (a + b).toFixed(2).replace(/\.00$/, '')
    if (parseFloat(row.stockTotal) !== a + b) {
      row.stockTotal = expected
    }
  }
}

function onRowFocusOut(event, id) {
  if (editingId.value !== id) return
  const row = rows.value.find((r) => r.__id === id)
  if (row && row.__isNew) return
  const next = event.relatedTarget
  if (next && next.closest && next.closest(`tr[data-row-id="${id}"]`)) return
  if (next && next.classList && next.classList.contains('cell-input')) return
  setTimeout(async () => {
    if (editingId.value !== id) return
    const stillInside = document.activeElement && document.activeElement.closest && document.activeElement.closest(`tr[data-row-id="${id}"]`)
    if (stillInside) return
    await exitEditMode()
  }, 0)
}

async function onCellKeydown(event, id, field) {
  if (editingId.value !== id) return
  if (event.key === 'Escape') {
    event.preventDefault()
    const row = rows.value.find((r) => r.__id === id)
    const original = String(row?.[field] ?? '')
    const target = event.target
    if (target && 'value' in target) target.value = original
    if (row && editingRowSnapshot.value) {
      for (const key of columns) {
        if (row[key] !== editingRowSnapshot.value[key]) {
          row[key] = editingRowSnapshot.value[key]
        }
      }
    }
    await exitEditMode({ skipCommit: true, showToast: false })
  } else if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    await exitEditMode()
  }
}

async function enterEditMode(id, options = {}) {
  if (!id) {
    console.warn('[enterEditMode] missing id')
    return
  }
  if (editingId.value && editingId.value !== id) {
    await exitEditMode()
  }
  const row = rows.value.find((r) => r.__id === id)
  if (!row) {
    console.warn('[enterEditMode] row not found:', id, 'rows count:', rows.value.length)
    return
  }
  if (!options.skipPageJump) {
    jumpToRowPage(id)
  }
  editingRowSnapshot.value = { ...row }
  editingId.value = id
  if (row.__isNew) {
    nextTick(() => {
      const tr = document.querySelector(`tr[data-row-id="${id}"]`)
      if (tr) tr.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
  focusFirstInput(id)
}

function focusFirstInput(id) {
  const tryFocus = () => {
    const tr = document.querySelector(`tr[data-row-id="${id}"]`)
    if (!tr) return false
    const firstInput = tr.querySelector('input.cell-input')
    if (!firstInput) return false
    firstInput.focus()
    return document.activeElement === firstInput
  }
  if (tryFocus()) return
  nextTick(() => {
    if (tryFocus()) return
    requestAnimationFrame(() => {
      if (tryFocus()) return
      setTimeout(() => tryFocus(), 50)
    })
  })
}

async function exitEditMode({ skipCommit = false, showToast: show = true } = {}) {
  const active = document.activeElement
  if (active && active.classList && (active.classList.contains('editable') || active.classList.contains('cell-input'))) {
    active.blur()
  }
  const id = editingId.value
  const snapshot = editingRowSnapshot.value
  editingId.value = null

  if (!id) {
    editingRowSnapshot.value = null
    return
  }

  const row = rows.value.find((r) => r.__id === id)

  if (skipCommit) {
    if (row && row.__isNew && !hasRowChanged(row, snapshot)) {
      const idx = rows.value.findIndex((r) => r.__id === id)
      if (idx >= 0) rows.value.splice(idx, 1)
      reindex()
      editingRowSnapshot.value = null
      return
    }
    editingRowSnapshot.value = null
    return
  }

  if (row && row.__isNew && !hasRowChanged(row, snapshot)) {
    const idx = rows.value.findIndex((r) => r.__id === id)
    if (idx >= 0) rows.value.splice(idx, 1)
    reindex()
    editingRowSnapshot.value = null
    return
  }

  if (row) row.__isNew = false

  const wasNewRow = snapshot && snapshot.__isNew

  const result = await commitRowSave(id)
  if (!result.ok) {
    if (row && snapshot) revertRow(row, snapshot)
    editingRowSnapshot.value = null
    if (show) showToast('error', '保存失败,请检查浏览器存储权限或容量')
    return
  }
  editingRowSnapshot.value = null
  const dateChanged = snapshot && extractMonthKey(snapshot.date)?.sortKey !== extractMonthKey(row?.date)?.sortKey
  if (dateChanged) {
    jumpToRowPage(id)
  }
  // 新增记录点击「完成」后，按日期排序到正确位置
  if (wasNewRow) {
    insertRowByDate(row)
    jumpToRowPage(id)
  }
  if (show && !result.skipped) {
    showToast('success', `已保存第 ${pagedRows.value.find((r) => r.__id === id)?.__seq ?? ''} 条记录`)
  }
}

watch(pagedRows, async (rows) => {
  if (!editingId.value) return
  if (rows.some((r) => r.__id === editingId.value)) return
  const idx = pageIndexOfRow(editingId.value)
  if (idx >= 0) {
    goToPage(idx)
    return
  }
  const stillExists = rows.value.some((r) => r.__id === editingId.value)
  if (!stillExists) {
    editingId.value = null
    editingRowSnapshot.value = null
    return
  }
  await exitEditMode({ skipCommit: true, showToast: false })
})

onMounted(async () => {
  await initData()
})

window.addEventListener('beforeunload', (e) => {
  if (dirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
})
</script>

<style scoped>
.view-container {
  padding: 20px;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.view-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.search-input {
  flex: 0 0 280px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d0d5dd;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #4a7ab5;
  box-shadow: 0 0 0 2px rgba(74, 122, 181, 0.15);
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn-primary {
  background: #4a7ab5;
  color: #fff;
  border-color: #4a7ab5;
}

.btn-primary:hover {
  background: #3d6aa3;
  border-color: #3d6aa3;
}

.btn-secondary {
  background: #fff;
  color: #2c3e50;
  border-color: #d0d5dd;
}

.btn-secondary:hover {
  background: #f4f7fb;
  border-color: #4a7ab5;
  color: #4a7ab5;
}

.btn-secondary:disabled,
.btn-secondary[disabled] {
  background: #f4f7fb;
  color: #b0bac6;
  border-color: #e4e7eb;
  cursor: not-allowed;
}

.btn-secondary:disabled:hover,
.btn-secondary[disabled]:hover {
  background: #f4f7fb;
  color: #b0bac6;
  border-color: #e4e7eb;
}

.btn-danger-ghost {
  background: #fff;
  color: #c0392b;
  border-color: #f5d6d2;
}

.btn-danger-ghost:hover {
  background: #fdf2f0;
  border-color: #c0392b;
}

.table-wrapper {
  overflow: auto;
  flex: 1;
  border: 1px solid #e4e7eb;
  border-radius: 4px;
}

.coal-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  table-layout: fixed;
}

.coal-table th,
.coal-table td {
  border: 1px solid #d0d5dd;
  padding: 8px 6px;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 36px;
}

.coal-table th {
  background: #f4f7fb;
  font-weight: bold;
  color: #2c3e50;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1;
}

.coal-table th:hover .sort-arrow {
  color: #4a7ab5;
}

.sort-arrow {
  display: inline-block;
  margin-left: 4px;
  font-size: 11px;
  color: #6b7280;
  vertical-align: middle;
}

.coal-table td {
  text-align: center;
}

.coal-table tbody tr:hover {
  background: #f0f7ff;
}

.coal-table tbody tr:nth-child(even) {
  background: #fafbfc;
}

.coal-table tbody tr:hover:nth-child(even) {
  background: #f0f7ff;
}

.editable {
  cursor: default;
  outline: none;
  min-height: 20px;
  transition: background 0.15s;
  user-select: none;
}

.cell-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  color: inherit;
  padding: 8px 10px;
  margin: 0;
  box-sizing: border-box;
  display: block;
  font-weight: inherit;
}

.cell-input:focus {
  outline: none;
}

.editable.editable-active {
  cursor: text;
  user-select: text;
  background: #fffbe6;
}

.editable.editable-active:hover {
  background: #fff8d6;
}

.editable.editable-active:focus {
  background: #fffbe6;
  box-shadow: inset 0 0 0 2px #4a7ab5;
}

.row-locked .editable {
  color: #6b7280;
}

.row-editing {
  background: #fffef5;
  box-shadow: inset 3px 0 0 #f59e0b;
}

.row-editing .editable {
  color: #1f2937;
  font-weight: 500;
}

.row-editing.row-editing-new {
  background: #f0fdf4;
  box-shadow: inset 3px 0 0 #16a34a;
}

.row-editing.row-editing-new .editable {
  background: transparent;
  color: #14532d;
  font-weight: 600;
}

.row-editing.row-editing-new .editable.editable-active {
  background: #f7fee7;
}

.coal-table tbody tr.row-just-added {
  background: #f0fdf4;
}

.coal-table tbody tr.row-just-added:nth-child(even) {
  background: #ecfdf5;
}

.coal-table tbody tr.row-just-added:hover,
.coal-table tbody tr.row-just-added:hover:nth-child(even) {
  background: #dcfce7;
}

.coal-table tbody tr.row-just-edited {
  background: #fefce8;
}

.coal-table tbody tr.row-just-edited:nth-child(even) {
  background: #fef9c3;
}

.coal-table tbody tr.row-just-edited:hover,
.coal-table tbody tr.row-just-edited:hover:nth-child(even) {
  background: #fef08a;
}

.coal-table tbody tr.row-just-added.row-editing,
.coal-table tbody tr.row-just-edited.row-editing {
  background: #fffef5;
}

mark.kw-hl {
  background: #fde68a;
  color: #78350f;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}

.actions-cell {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
}

.row-btn {
  height: 24px;
  padding: 0 10px;
  border-radius: 3px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.row-btn-edit {
  background: #fff;
  color: #4a7ab5;
  border-color: #c8d8eb;
}

.row-btn-edit:hover:not(:disabled) {
  background: #4a7ab5;
  color: #fff;
  border-color: #4a7ab5;
}

.row-btn-edit:disabled {
  background: #f4f7fb;
  color: #b0bac6;
  border-color: #e4e7eb;
  cursor: not-allowed;
}

.row-btn-done {
  background: #16a34a;
  color: #fff;
  border-color: #16a34a;
}

.row-btn-done:hover {
  background: #15803d;
  border-color: #15803d;
}

.row-btn-del {
  background: #fff;
  color: #c0392b;
  border-color: #f5d6d2;
}

.row-btn-del:hover {
  background: #c0392b;
  color: #fff;
  border-color: #c0392b;
}

.edit-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef9e7;
  border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b;
  color: #78350f;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 3px;
  margin-bottom: 6px;
  line-height: 1.6;
}

.edit-hint-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
  animation: pulse 1.4s ease-in-out infinite;
}

.edit-hint-new {
  background: #f0fdf4;
  border-color: #bbf7d0;
  border-left-color: #16a34a;
  color: #14532d;
}

.edit-hint-new .edit-hint-dot {
  background: #16a34a;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(1.3); }
}

.edit-hint kbd {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  font-family: 'Consolas', 'Monaco', monospace;
  background: #fff;
  border: 1px solid #d4a574;
  border-radius: 3px;
  color: #78350f;
  margin: 0 1px;
}

.empty-cell {
  padding: 40px 16px;
  color: #909399;
  font-size: 13px;
  text-align: center;
}

.status-bar {
  margin-top: 12px;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  flex-wrap: wrap;
}

.pager-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
}

.pager-info-label {
  color: #94a3b8;
  font-size: 12px;
}

.pager-info-current {
  font-weight: 600;
  color: #1e293b;
}

.pager-info-count {
  font-weight: 400;
  color: #64748b;
  font-size: 12px;
}

.pager-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pager-btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.pager-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pager-select {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  min-width: 160px;
}

.pager-select:hover {
  border-color: #94a3b8;
}

.dirty-flag {
  color: #e67e22;
  font-weight: bold;
}

.saved-flag {
  color: #16a34a;
  font-weight: 500;
}

.btn-danger {
  background: #c0392b;
  color: #fff;
  border-color: #c0392b;
}

.btn-danger:hover:not(:disabled) {
  background: #a93226;
  border-color: #a93226;
}

.btn-danger:disabled {
  background: #e6b8b2;
  border-color: #e6b8b2;
  cursor: not-allowed;
  opacity: 0.7;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.18s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 440px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: slideUp 0.22s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 12px;
  border-bottom: 1px solid #f0f2f5;
}

.modal-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4a7ab5;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
}

.modal-icon.danger {
  background: #c0392b;
}

.modal-title {
  font-size: 15px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.modal-body {
  padding: 16px 20px;
}

.modal-detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e4e7eb;
  border-radius: 4px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.modal-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.modal-detail-label {
  color: #6b7280;
}

.modal-detail-value {
  color: #1f2937;
  font-weight: 500;
  text-align: right;
}

.modal-warning {
  font-size: 12px;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 4px;
  padding: 8px 10px;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.modal-type-guard {
  margin-top: 8px;
}

.modal-type-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.modal-type-label code {
  background: #f4f7fb;
  border: 1px solid #d0d5dd;
  border-radius: 3px;
  padding: 1px 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #c0392b;
  font-weight: bold;
}

.modal-type-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.modal-type-input:focus {
  border-color: #c0392b;
  box-shadow: 0 0 0 2px rgba(192, 57, 43, 0.12);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 18px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
}

.undo-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: #fff;
  padding: 10px 16px;
  border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  z-index: 1100;
  animation: slideUp 0.2s ease;
  min-width: 280px;
  max-width: calc(100vw - 32px);
}

.undo-message {
  flex: 1;
}

.undo-btn {
  background: transparent;
  color: #7eb8e8;
  border: none;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  padding: 2px 6px;
  font-family: inherit;
}

.undo-btn:hover {
  color: #a8cce8;
}

.undo-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  font-family: inherit;
}

.undo-close:hover {
  color: #fff;
}

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
  animation: slideUp 0.2s ease;
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
}

.toast-close:hover {
  opacity: 1;
}
</style>