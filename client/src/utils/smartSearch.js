/**
 * 智能搜索 API 工具
 *
 * 对接后端已交付接口：
 *   POST /api/search/smart        — 智能搜索（意图识别 + 联想 + 结果）
 *   GET  /api/search/smart/health — 健康检查（是否已配置 AI Gateway）
 *
 * 同时提供「后端 results → 本地 modelData」的模糊映射工具，
 * 用于为后端摘要层返回的结果补充 code / material / specification / has3DModel 等字段。
 */
import modelData from '../data/modelData'

/** 请求超时时间（ms），超时视为服务不可用，走本地降级 */
const API_TIMEOUT = 8000

/**
 * 调用 POST /api/search/smart
 * @param {object} opts
 * @param {string} opts.query   搜索关键词 / 自然语言问题
 * @param {string} opts.scope   检索范围：all | model | water_appliance | tool
 * @param {Array<string>} [opts.history] 多轮对话历史（可选）
 * @returns {Promise<object>} 后端返回结构
 */
export async function fetchSmartSearch({ query, scope = 'all', history = [] }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT)
  try {
    const res = await fetch('/api/search/smart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, scope, history }),
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`搜索服务异常（${res.status}）`)
    }
    const json = await res.json()
    if (!json || json.success === false) {
      throw new Error(json?.message || '搜索服务返回异常')
    }
    return json
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 检查智能搜索后端是否已配置（AI Gateway 是否就绪）
 * @returns {Promise<{success:boolean, configured:boolean}>}
 */
export async function checkSmartSearchHealth() {
  try {
    const res = await fetch('/api/search/smart/health')
    if (!res.ok) return { success: false, configured: false }
    const json = await res.json()
    return { success: true, configured: Boolean(json?.configured) }
  } catch (e) {
    return { success: false, configured: false }
  }
}

/* ==================== 类型展示辅助 ==================== */

const CATEGORY_ICONS = {
  '管接件': '🔧',
  '螺钉': '🔩',
  '滤芯': '🛡️',
  '适配器': '🔌',
  '增压泵': '⚙️',
  '电磁阀': '🔘',
}

/** 结果类型图标（water_appliance / model / tool / general） */
export function resultTypeIcon(type, category) {
  if (type === 'water_appliance') return '💧'
  if (type === 'model') return CATEGORY_ICONS[category] || '📦'
  if (type === 'tool') return '🛠️'
  return '✨'
}

const TYPE_LABELS = {
  water_appliance: '水家电',
  model: '模型',
  tool: '工具',
  general: '通用',
}

/** 结果类型中文标签 */
export function resultTypeLabel(type) {
  return TYPE_LABELS[type] || '结果'
}

const INTENT_LABELS = {
  search: '搜索',
  recommend: '推荐',
  compare: '对比',
  stats: '统计',
  spec: '规格',
  chat: '问答',
}

/** 意图中文标签 */
export function intentLabel(intent) {
  return INTENT_LABELS[intent] || '搜索'
}

/* ==================== 后端结果 → 本地模型 映射 ==================== */

/**
 * 将后端 result 模糊匹配到本地 modelData
 * 匹配优先级：物料编码 → 名称精确 → 名称包含 → 分类 + 名称片段
 * @param {object} result 后端 results[] 中的一项
 * @returns {object|null} 本地模型对象
 */
export function matchModelToLocal(result) {
  const name = String(result?.name || '').trim().toLowerCase()
  const code = String(result?.meta?.code || result?.code || '').trim().toLowerCase()
  const category = String(result?.category || '').trim().toLowerCase()

  if (!name && !code) return null

  // 1. 物料编码精确匹配
  if (code) {
    const byCode = modelData.find(m => m.code.toLowerCase() === code)
    if (byCode) return byCode
  }

  // 2. 名称精确匹配
  if (name) {
    const byName = modelData.find(m => m.name.trim().toLowerCase() === name)
    if (byName) return byName
  }

  // 3. 名称包含匹配（后端摘要层可能返回简称/别名）
  if (name) {
    const byContains = modelData.find(m =>
      name.includes(m.name.trim().toLowerCase()) ||
      m.name.trim().toLowerCase().includes(name)
    )
    if (byContains) return byContains
  }

  // 4. 分类 + 名称片段兜底
  if (category && name) {
    const byCat = modelData.find(m =>
      m.category.toLowerCase() === category &&
      (name.includes(m.name.trim().toLowerCase().slice(0, 2)) ||
        m.name.trim().toLowerCase().includes(name.slice(0, 2)))
    )
    if (byCat) return byCat
  }

  return null
}

/**
 * 将后端 result 富化为本地模型详情（仅 model 类型需要补充本地字段）
 * 返回对象额外挂载 _localModel（匹配到的本地模型，未匹配为 null）
 */
export function enrichResult(result) {
  if (!result) return result
  if (result.type !== 'model') {
    return { ...result, _localModel: null }
  }
  const local = matchModelToLocal(result)
  if (!local) {
    return { ...result, _localModel: null }
  }
  return {
    ...result,
    meta: { ...(result.meta || {}), ...local },
    _localModel: local,
  }
}

/**
 * 计算结果卡片点击跳转目标
 * - model           → /model-library/viewer/:id（优先本地 id，其次后端 code）
 * - water_appliance → /toolbox（自动打开水家电面板）
 * - tool            → /toolbox
 * - general         → 以名称再发起一次搜索
 * @returns {{path:string, state?:object}|null}
 */
export function getResultTarget(result) {
  if (!result) return null
  const type = result.type
  const local = result._localModel

  if (type === 'model') {
    if (local && local.id) return { path: `/model-library/viewer/${local.id}`, state: null }
    const code = result.meta?.code || result.name
    return { path: `/model-library/viewer/${encodeURIComponent(code)}`, state: null }
  }
  if (type === 'water_appliance') {
    return { path: '/toolbox', state: { openPanel: 'water-appliance' } }
  }
  if (type === 'tool') {
    return { path: '/toolbox', state: null }
  }
  return { path: `/search?q=${encodeURIComponent(result.name || '')}`, state: null }
}
