/**
 * 访问统计路由（/api/stats）
 *
 * 轻量匿名统计：不做任何身份采集，仅记录随机 uid 的 PV/UV。
 * 存储沿用本服务 data/ JSON 文件持久化惯例（data/stats/visits.json），
 * 按天聚合 + 写队列原子落盘，不引入数据库依赖。
 *
 * 接口：
 *   POST /api/stats/visit   埋点上报 { uid }（前端会话级去重，一天一 uid 只计一次 UV）
 *   GET  /api/stats/visits  聚合数据（今日 PV/UV、累计 PV、较昨日趋势、近 14 天明细）
 */
import { Router } from 'express'
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data/stats')
const DATA_FILE = join(DATA_DIR, 'visits.json')
const RETAIN_DAYS = 90          // 明细保留天数（防文件无限膨胀）
const TREND_DAYS = 14           // 趋势明细返回天数

const router = Router()

/* ---------- 存储层 ---------- */

function dateKey(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function emptyDb() {
  return { version: 1, days: {}, totalPv: 0 }
}

function loadDb() {
  try {
    if (!existsSync(DATA_FILE)) return emptyDb()
    const raw = readFileSync(DATA_FILE, 'utf-8')
    const db = JSON.parse(raw)
    if (!db || typeof db !== 'object' || !db.days) return emptyDb()
    return db
  } catch (err) {
    // 文件损坏不抛错：备份坏文件后从零开始，统计缺失优于服务中断
    console.error('[stats] visits.json 读取失败，重置:', err.message)
    try { renameSync(DATA_FILE, `${DATA_FILE}.corrupt-${Date.now()}`) } catch { /* ignore */ }
    return emptyDb()
  }
}

/* 写队列：Express 单进程内串行化落盘，writeFileSync 临时文件 + rename 原子替换 */
let _writeChain = Promise.resolve()

function queueSave(db) {
  _writeChain = _writeChain.then(() => {
    try {
      mkdirSync(DATA_DIR, { recursive: true })
      const tmp = `${DATA_FILE}.tmp`
      writeFileSync(tmp, JSON.stringify(db), 'utf-8')
      renameSync(tmp, DATA_FILE)
    } catch (err) {
      console.error('[stats] 落盘失败:', err.message)
    }
  }).catch(() => { /* 队列不断链 */ })
  return _writeChain
}

function prune(db) {
  const cutoff = dateKey(-RETAIN_DAYS)
  for (const key of Object.keys(db.days)) {
    if (key < cutoff) delete db.days[key]
  }
}

function ensureDay(db, key) {
  if (!db.days[key]) db.days[key] = { pv: 0, uv: [] }
  if (!Array.isArray(db.days[key].uv)) db.days[key].uv = []
  return db.days[key]
}

/* ---------- 路由 ---------- */

// POST /api/stats/visit —— 埋点上报（前端会话级去重，此处每次 POST 计一次 PV）
router.post('/visit', (req, res) => {
  const uid = String((req.body && req.body.uid) || '').slice(0, 64).replace(/[^\w-]/g, '')
  if (!uid) {
    return res.status(400).json({ success: false, message: '缺少有效 uid' })
  }
  const db = loadDb()
  const today = ensureDay(db, dateKey())
  today.pv += 1
  if (!today.uv.includes(uid)) today.uv.push(uid)
  db.totalPv = (db.totalPv || 0) + 1
  prune(db)
  queueSave(db)
  res.json({ success: true, data: { todayPv: today.pv, todayUv: today.uv.length } })
})

// GET /api/stats/visits —— 聚合数据（卡片 + 抽屉共用）
router.get('/visits', (req, res) => {
  const db = loadDb()
  const todayKeyStr = dateKey()
  const yesterdayKey = dateKey(-1)
  const today = ensureDay(db, todayKeyStr)
  const yesterday = db.days[yesterdayKey] || { pv: 0, uv: [] }

  let trendPct = null
  if (yesterday.pv > 0) {
    trendPct = Math.round(((today.pv - yesterday.pv) / yesterday.pv) * 100)
  }

  const days = []
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const key = dateKey(-i)
    const d = db.days[key] || { pv: 0, uv: [] }
    days.push({ date: key, pv: d.pv || 0, uv: Array.isArray(d.uv) ? d.uv.length : 0 })
  }

  res.json({
    success: true,
    data: {
      today: { pv: today.pv, uv: today.uv.length },
      totalPv: db.totalPv || 0,
      trendPct,
      days
    }
  })
})

export default router
