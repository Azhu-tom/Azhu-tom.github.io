/**
 * 访问统计服务（匿名 PV/UV）
 *
 * - reportVisit()：会话级去重上报（sessionStorage 一天一标记，刷新不重复计数）
 * - fetchVisitStats()：拉取聚合数据（卡片 + 统计抽屉共用）
 * - fetchModelOverview()：复用模型库统计接口（卡片「模型总数 / 分类数量」真实化）
 *
 * API 地址走 utils/apiConfig：本地 dev 走 Vite proxy（相对路径），
 * GitHub Pages 线上自动指向后端服务（Render）。所有请求失败均静默返回 null。
 */

import { API_BASE } from '../utils/apiConfig'

const STATS_API = `${API_BASE}/api/stats`
const MODELS_STATS_API = `${API_BASE || ''}/api/models/stats`
const UID_KEY = 'wa_stats_uid'
const REPORTED_KEY = 'wa_stats_reported_date'

/** 匿名 uid：localStorage 持久随机串，无任何身份信息 */
export function getUid() {
  try {
    let uid = localStorage.getItem(UID_KEY)
    if (!uid) {
      uid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
      localStorage.setItem(UID_KEY, uid)
    }
    return uid
  } catch {
    return 'u-anon'
  }
}

/** 会话内是否已上报（同一天刷新/切页不重复计数） */
function reportedToday() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    return sessionStorage.getItem(REPORTED_KEY) === today
  } catch {
    return false
  }
}

function markReported() {
  try {
    sessionStorage.setItem(REPORTED_KEY, new Date().toISOString().slice(0, 10))
  } catch { /* ignore */ }
}

/**
 * 上报一次访问（火后不理）。失败静默——统计缺失远优于页面报错。
 * @returns {Promise<boolean>} 是否成功
 */
export async function reportVisit() {
  if (reportedToday()) return false
  try {
    const res = await fetch(`${STATS_API}/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: getUid() })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const result = await res.json()
    if (!result.success) throw new Error(result.message || '上报失败')
    markReported()
    return true
  } catch (err) {
    console.warn('[stats] 访问上报失败（已静默）:', err.message)
    return false
  }
}

/**
 * 拉取访问统计聚合数据。失败返回 null。
 * @returns {Promise<{today:{pv,uv}, totalPv:number, trendPct:number|null, days:Array}|null>}
 */
export async function fetchVisitStats() {
  try {
    const res = await fetch(`${STATS_API}/visits`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const result = await res.json()
    if (!result.success) throw new Error(result.message || '获取失败')
    return result.data
  } catch (err) {
    console.warn('[stats] 访问统计拉取失败（已静默）:', err.message)
    return null
  }
}

/**
 * 模型库概览统计（复用既有 /api/models/stats，models-api 通道返回
 * totalStpFiles + categories[]，即真实 STP 文件数与分类数）。失败返回 null。
 * @returns {Promise<{total:number, categoryCount:number}|null>}
 */
export async function fetchModelOverview() {
  try {
    const res = await fetch(MODELS_STATS_API)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const result = await res.json()
    if (!result.success) throw new Error(result.message || '获取失败')
    const d = result.data || {}
    return {
      total: d.totalStpFiles ?? null,
      categoryCount: Array.isArray(d.categories) ? d.categories.length : null
    }
  } catch (err) {
    console.warn('[stats] 模型概览拉取失败（已静默）:', err.message)
    return null
  }
}
