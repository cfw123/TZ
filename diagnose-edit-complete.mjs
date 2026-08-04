/**
 * diagnose-edit-complete.mjs
 *
 * Reproduces the "完成" click failure in OperationRecordView.vue.
 *
 * What it does:
 *   1. Launch system Chrome headlessly (puppeteer-core, no download needed)
 *   2. Intercept ALL console messages, errors, and network requests
 *   3. Click "编辑" on the first saved row
 *   4. Type in the boiler_bins field
 *   5. Click "完成"
 *   6. Collect and print a full diagnostic dump
 *
 * Usage: node diagnose-edit-complete.mjs
 */

import puppeteer from 'puppeteer-core'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// ── State ──────────────────────────────────────────────────────────────────
const consoleLogs   = []   // { type, text }
const networkEvents = []  // { url, method, status, ok, bodySnippet }
let   pageErrors    = []  // [ Error string ]
let   toastVisible  = null  // { type, message } | null  (captured via page.evaluate)
let   clickResult   = null  // raw return value of handleRowAction evaluated on page
let   editingIdAfter = null  // editingId.value after the click

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Launch ──────────────────────────────────────────────────────────────────
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1440,900',
  ],
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

// Intercept console
page.on('console', msg => {
  consoleLogs.push({ type: msg.type(), text: msg.text() })
})

// Intercept page errors
page.on('pageerror', err => {
  pageErrors.push(String(err))
})

// Intercept ALL requests/responses (ignore favicon)
page.on('response', resp => {
  const url = resp.url()
  if (url.includes('favicon')) return
  let bodySnippet = ''
  try { bodySnippet = resp.buffer().then(b => b.toString('utf8').slice(0, 200)).catch(() => '') }
  catch { /* ignore */ }
  networkEvents.push({
    url: url.replace('http://localhost:5174', ''),
    method: resp.request().method(),
    status: resp.status(),
    ok: resp.ok(),
    bodySnippet,
  })
})

// ── Navigate ────────────────────────────────────────────────────────────────
console.log('→ Navigating to http://localhost:5174/record ...')
await page.goto('http://localhost:5174/record', { waitUntil: 'networkidle0', timeout: 30000 })
await sleep(1000)  // let Vue hydrate

// ── Find first row with "编辑" button ───────────────────────────────────────
console.log('→ Looking for first row with "编辑" button ...')

const editButton = await page.$('td.td-action button:not(:has-text("保存"))')
if (!editButton) {
  console.error('❌ Could not find any "编辑" button. Dumping page text:')
  const text = await page.evaluate(() => document.body.innerText.slice(0, 2000))
  console.error(text)
  await browser.close()
  process.exit(1)
}

// Get the row's id by traversing up
const rowId = await page.evaluate(el => {
  const tr = el.closest('tr')
  return tr ? tr.dataset.recId || tr.querySelector('.td-sticky--1')?.innerText?.trim() : null
}, editButton)

// Click "编辑"
console.log(`→ Clicking "编辑" ...`)
await editButton.click()
await page.waitForTimeout(500)

// Confirm we're in edit mode
const editingIdBefore = await page.evaluate(() => {
  // Try to read editingId from the Vue component (via __vueapp__ or element refs)
  const el = document.querySelector('.record-row--editing')
  return el ? el.dataset.recId || el.querySelector('.td-sticky--1')?.innerText?.trim() : 'UNKNOWN'
})
console.log(`  editingId set to: ${editingIdBefore}`)

// ── Read the boiler_bins input ──────────────────────────────────────────────
const boilerInput = await page.$('.record-row--editing input[disabled=""]')
const allInputs = await page.$$('.record-row--editing input')

let targetInput = null
for (const inp of allInputs) {
  const disabled = await inp.evaluate(el => el.disabled)
  const placeholder = await inp.evaluate(el => el.placeholder || el.id || '')
  if (!disabled) {
    targetInput = inp
    console.log(`  Found editable input: "${placeholder}"`)
    break
  }
}

if (!targetInput) {
  // fallback: first non-disabled input in the editing row
  targetInput = allInputs[0]
}

const boilerCellInput = await page.$('.record-row--editing input.cell-input:not([disabled])')
if (boilerCellInput) targetInput = boilerCellInput

// Type in it
const existingVal = await targetInput.evaluate(el => el.value)
console.log(`  Current value: "${existingVal}"`)
await targetInput.click({ clickCount: 3 })  // select all
await targetInput.type('TEST-' + Date.now())
console.log('  Typed: TEST-XXXX')

await page.waitForTimeout(300)

// ── Capture state BEFORE clicking "完成" ─────────────────────────────────────
const stateBefore = await page.evaluate(() => {
  // Read savingIds from Vue app — try __vueapp__
  const els = document.querySelectorAll('[class*="record-row"]')
  return {
    savingIds_hasFirst: null,  // will try via global
    editingRowExists: !!document.querySelector('.record-row--editing'),
    editingRowId: document.querySelector('.record-row--editing')
      ? (document.querySelector('.record-row--editing .td-sticky--1')?.innerText?.trim() || '?') : null,
    buttonText: document.querySelector('.record-row--editing td.td-action button')?.innerText?.trim(),
  }
})
console.log('\n── State BEFORE clicking "完成" ──────────────────────')
console.log(JSON.stringify(stateBefore, null, 2))

// ── Intercept the click: add a JS override so we can capture return value ──
await page.evaluate(() => {
  // Monkey-patch window.fetch to capture request details
  window.__origFetch = window.fetch.bind(window)
  window.__fetchLog = []
  window.fetch = function(url, opts) {
    window.__fetchLog.push({ url: String(url), method: opts?.method || 'GET' })
    return window.__origFetch(url, opts)
  }
})

// ── Click "完成" ─────────────────────────────────────────────────────────────
const doneButton = await page.$('.record-row--editing td.td-action button')
const doneButtonText = await doneButton.evaluate(el => el.innerText.trim())
console.log(`\n→ Clicking "完成" (current text: "${doneButtonText}") ...`)

const clickTime = Date.now()
await doneButton.click()

// Wait up to 3 seconds for state changes
await page.waitForTimeout(3000)

// ── Capture state AFTER clicking "完成" ───────────────────────────────────────
const stateAfter = await page.evaluate(() => {
  return {
    editingRowExists: !!document.querySelector('.record-row--editing'),
    editingRowId: document.querySelector('.record-row--editing')
      ? (document.querySelector('.record-row--editing .td-sticky--1')?.innerText?.trim() || '?') : null,
    buttonText: document.querySelector('.td-action button')?.innerText?.trim(),
    allButtonTexts: Array.from(document.querySelectorAll('.td-action button')).map(b => b.innerText.trim()),
    // Check for toast
    toastMsg: document.querySelector('.el-message, [class*="toast"], .toast, [class*="message"]')?.innerText?.trim() || null,
    // Check Vue app internals via __vueapp__
    // Try to read internal state by querying element data attributes
    rowsWithClass: Array.from(document.querySelectorAll('.record-row--editing, .record-row--saved')).map(el => ({
      classes: el.className,
      firstCell: el.querySelector('.td-sticky--1')?.innerText?.trim(),
    })),
    // Attempt to read savingIds by checking button states
    savingButtons: Array.from(document.querySelectorAll('.td-action button')).map(b => ({
      text: b.innerText.trim(),
      disabled: b.disabled,
    })),
  }
})

// Get fetch log
const fetchLog = await page.evaluate(() => window.__fetchLog || [])

// ── Print full diagnostic dump ────────────────────────────────────────────────
console.log('\n' + '═'.repeat(70))
console.log('DIAGNOSTIC DUMP — click "完成" failure reproduction')
console.log('═'.repeat(70))

console.log('\n── Console Logs ──────────────────────────────────────')
for (const { type, text } of consoleLogs) {
  const marker = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '  '
  console.log(`${marker} [${type}] ${text}`)
}

console.log('\n── Network Events ────────────────────────────────────')
for (const { url, method, status, ok, bodySnippet } of networkEvents) {
  const marker = ok ? '  ' : '❌'
  console.log(`${marker} ${method} ${url} → HTTP ${status}`)
  if (bodySnippet) console.log(`    Body: ${bodySnippet}`)
}

console.log('\n── Page Errors (uncaught JS) ─────────────────────────')
if (pageErrors.length === 0) {
  console.log('  (none)')
} else {
  for (const e of pageErrors) console.log(`  ❌ ${e}`)
}

console.log('\n── Fetch calls made during click ────────────────────')
for (const { url, method } of fetchLog) {
  console.log(`  ${method} ${url}`)
}

console.log('\n── Toast popup? ──────────────────────────────────────')
console.log(`  ${stateAfter.toastMsg ? `✅ "${stateAfter.toastMsg}"` : '❌ NO toast visible'}`)

console.log('\n── editingId after click ────────────────────────────')
console.log(`  editingRowExists: ${stateAfter.editingRowExists}`)
console.log(`  editingRowId:     ${stateAfter.editingRowId}`)
console.log(`  row is still in edit mode: ${stateAfter.editingRowExists ? '❌ YES (bug!)' : '✅ No'}`)

console.log('\n── Button text(s) after click ────────────────────────')
for (const btn of stateAfter.savingButtons) {
  console.log(`  "${btn.text}" disabled=${btn.disabled}`)
}

console.log('\n── State diff ────────────────────────────────────────')
console.log('  Before: editing row =', stateBefore.editingRowId)
console.log('  After:  editing row =', stateAfter.editingRowId)
const stillEditing = stateAfter.editingRowExists && stateAfter.editingRowId === stateBefore.editingRowId
console.log(`\n  Verdict: ${stillEditing ? '❌ Still in edit mode — BUG CONFIRMED' : '✅ Exited edit mode — no bug'}`)
console.log(`  Toast:   ${stateAfter.toastMsg ? '✅ appeared — no bug' : '❌ did not appear'}`)

console.log('\n── Most likely root cause ────────────────────────────')
const putRequest = networkEvents.find(e => e.url.includes('/operation_record_rows') && e.method === 'PUT')
const postRequest = networkEvents.find(e => e.url.includes('/operation_record_rows') && e.method === 'POST')

if (!putRequest && !postRequest) {
  console.log('  🔍 No PUT or POST request was made at all.')
  console.log('     → The click handler returned early before any async call.')
  console.log('     → Likely: isSaved() returned false but saveRecord() failed synchronously')
  console.log('       OR a validation error blocked the save (runGroupErrors, cellErrors, etc.)')
  console.log('     → Check console logs above for "请先修正" (validation error toast).')
} else if (putRequest && !putRequest.ok) {
  console.log('  🔍 PUT returned HTTP ' + putRequest.status + ' but was NOT caught as 404.')
  console.log('     → The 404 fallback may have been triggered but saveRecord failed.')
  console.log('     → Network body: ' + putRequest.bodySnippet)
} else if (putRequest && putRequest.ok) {
  console.log('  🔍 PUT succeeded (HTTP 200).')
  console.log('     → The save likely succeeded but editingId was NOT cleared.')
  console.log('     → Possible: the async handler resolved but the UI did not update.')
  console.log('     → Check: did handleRowAction\'s `if (ok) editingId.value = null` run?')
  console.log('     → Check: is there a Vue reactivity issue with editingId?')
} else if (postRequest && postRequest.ok) {
  console.log('  🔍 POST succeeded (fallback path).')
  console.log('     → PUT 404 triggered the saveRecord fallback.')
  console.log('     → Check: why was the PUT id composite (date-shift) instead of real db id?')
}

console.log('\n' + '═'.repeat(70))

await browser.close()
process.exit(0)
