#!/usr/bin/env node
// Validates data/towers.json against the schema plus project rules.
// All messages in Vietnamese — output is shown to contributors in PR comments.
// Exit 0 = OK, exit 1 = errors found.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Ajv2020 } from 'ajv/dist/2020.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))

const errors = []
const warnings = []

let data, schema, provinces
try {
  data = read('data/towers.json')
  schema = read('data/schema/towers.schema.json')
  provinces = read('data/aux/provinces.json')
} catch (e) {
  console.error(`❌ Không đọc được file dữ liệu: ${e.message}`)
  console.error(
    'Kiểm tra cú pháp JSON (dấu phẩy thừa/thiếu, dấu ngoặc) tại vị trí báo trong thông báo trên.',
  )
  process.exit(1)
}

// --- 1. JSON Schema ---
const ajv = new Ajv2020({ allErrors: true, strict: true })
// "format": "uri" — keep schema portable; light check here instead of ajv-formats
ajv.addFormat('uri', /^https?:\/\/\S+$/)
const validate = ajv.compile(schema)
if (!validate(data)) {
  for (const err of validate.errors) {
    const where = err.instancePath || '(gốc file)'
    let msg = err.message
    if (err.keyword === 'additionalProperties')
      msg = `có trường lạ "${err.params.additionalProperty}" — xóa đi hoặc kiểm tra chính tả`
    if (err.keyword === 'required')
      msg = `thiếu trường bắt buộc "${err.params.missingProperty}"`
    if (err.keyword === 'enum')
      msg = `giá trị không hợp lệ — chỉ chấp nhận: ${JSON.stringify(err.params.allowedValues)}`
    errors.push(`${where}: ${msg}`)
  }
}

const towers = Array.isArray(data.towers) ? data.towers : []
const provinceSlugs = new Set(provinces.map((p) => p.slug))
const today = new Date().toISOString().slice(0, 10)

// --- 2. Project rules ---
const ids = new Map()
towers.forEach((t, i) => {
  const label = `trạm "${t.id ?? `#${i}`}"`

  // unique ids
  if (ids.has(t.id))
    errors.push(
      `${label}: id trùng với trạm #${ids.get(t.id)} — mỗi id chỉ dùng một lần`,
    )
  ids.set(t.id, i)

  // province slug exists
  if (t.province && !provinceSlugs.has(t.province))
    errors.push(
      `${label}: tỉnh "${t.province}" không có trong data/aux/provinces.json — dùng tên tỉnh MỚI sau sáp nhập 2025 (slug không dấu, ví dụ "tp-ho-chi-minh")`,
    )

  // plausible coords hint (schema catches hard bounds; hint for swapped lat/lon)
  if (typeof t.lat === 'number' && t.lat > 100)
    errors.push(`${label}: lat=${t.lat} — có vẻ lat/lon bị đảo chỗ?`)

  // duplicate (channel, operator) within a site
  const seen = new Set()
  for (const m of t.muxes ?? []) {
    const key = `${m.channel}/${m.operator}`
    if (seen.has(key))
      errors.push(`${label}: mux K${m.channel}/${m.operator} bị lặp lại`)
    seen.add(key)
  }

  // site status consistency
  if (t.status === 'inactive' && (t.muxes ?? []).some((m) => m.status === 'active'))
    errors.push(
      `${label}: status "inactive" nhưng vẫn có mux đang "active" — trạm chỉ "inactive" khi TẤT CẢ mux ngừng phát`,
    )

  // sourceDate: real calendar date, not in the future
  if (typeof t.sourceDate === 'string') {
    if (Number.isNaN(Date.parse(t.sourceDate)))
      errors.push(`${label}: sourceDate "${t.sourceDate}" không phải ngày hợp lệ`)
    else if (t.sourceDate > today)
      errors.push(`${label}: sourceDate "${t.sourceDate}" ở tương lai`)
  }

  // verified requires evidence
  if (t.verified === true && !t.sourceUrl && !t.notes)
    errors.push(
      `${label}: verified=true nhưng không có sourceUrl hoặc notes — cần dẫn chứng (ảnh, tài liệu, hoặc báo cáo thu sóng)`,
    )
})

if (typeof data.updated === 'string') {
  if (Number.isNaN(Date.parse(data.updated)))
    errors.push(`updated "${data.updated}" không phải ngày hợp lệ`)
  else if (data.updated > today)
    errors.push(`updated "${data.updated}" ở tương lai`)
}

// proximity rule: <150m error (unless notes explains), <500m warning
const distM = (a, b) => {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return 2 * 6371000 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
for (let i = 0; i < towers.length; i++) {
  for (let j = i + 1; j < towers.length; j++) {
    const a = towers[i]
    const b = towers[j]
    if (typeof a.lat !== 'number' || typeof b.lat !== 'number') continue
    const d = distM(a, b)
    if (d < 150) {
      if (a.notes || b.notes)
        warnings.push(
          `"${a.id}" và "${b.id}" cách nhau ${Math.round(d)}m — đã có notes giải thích, bỏ qua`,
        )
      else
        errors.push(
          `"${a.id}" và "${b.id}" cách nhau ${Math.round(d)}m — có thể là một trạm? Gộp mux vào một trạm, hoặc thêm "notes" giải thích vì sao là hai trạm riêng`,
        )
    } else if (d < 500) {
      warnings.push(
        `"${a.id}" và "${b.id}" cách nhau ${Math.round(d)}m — kiểm tra xem có phải một trạm không`,
      )
    }
  }
}

// sorted by id for minimal PR diffs
const sortedIds = towers.map((t) => t.id).slice()
const inOrder = sortedIds.every(
  (id, i) => i === 0 || String(sortedIds[i - 1]) <= String(id),
)
if (!inOrder)
  errors.push(
    'Danh sách towers chưa sắp xếp theo id (a→z) — sắp xếp lại để diff PR gọn',
  )

// --- Report ---
for (const w of warnings) console.log(`⚠️  ${w}`)
if (errors.length === 0) {
  console.log(
    `✅ Dữ liệu hợp lệ: ${towers.length} trạm, ${towers.reduce((n, t) => n + (t.muxes?.length ?? 0), 0)} mux, cập nhật ${data.updated}`,
  )
  process.exit(0)
}
console.error(`\n❌ ${errors.length} lỗi:\n`)
for (const e of errors) console.error(`  • ${e}`)
console.error(
  '\nXem hướng dẫn tại CONTRIBUTING.md. Chạy lại: node scripts/validate-data.mjs',
)
process.exit(1)
