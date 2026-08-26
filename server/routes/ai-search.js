import express from 'express'

const router = express.Router()

// ==================== DeepSeek 配置（与 ai-chat.js 保持一致） ====================
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-3be25bcbaccf426f878c1607a7fbbe24'
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
const SEARCH_TIMEOUT_MS = 15000 // LLM 调用超时：15s

// ==================== 内置数据摘要（来自前端 modelData.js / waterApplianceData.js / toolbox.js） ====================
// 说明：摘要数据为精简版，聚焦"分类 + 典型型号 + 材质/规格 + 真实编码"，
// 供 LLM 基于真实数据回答（避免幻觉），同时作为本地快速兜底的匹配语料。
// 完整 94 条模型数据仍由前端 modelData.js 持有，前端按 type/name/category 二次匹配。

const KNOWLEDGE_BASE = [
  // ==================== 模型库（model）====================
  { type: 'model', category: '管接件', name: '堵头/管塞',
    keywords: ['堵头', '管塞', '堵', '塞', '快插杆'],
    meta: { material: 'PP', spec: '1/4"(2分)/3/8"(3分)快插杆，耐热款', code: '2CH01018006', count: 3 } },
  { type: 'model', category: '管接件', name: 'L型逆止阀',
    keywords: ['逆止阀', '止回', '单向', '逆止'],
    meta: { material: 'POM', spec: '白色，1/4英寸，大头机通用', code: '23601203003' } },
  { type: 'model', category: '管接件', name: '直通/弯通/L型弯通',
    keywords: ['直通', '弯通', '弯接', '弯管', 'L型', '穿板直接'],
    meta: { material: 'POM/POK/高温PP', spec: '1/4"~3/8"，部分含滤网、耐高温（灰色耐热款）', code: '2CH01002016' } },
  { type: 'model', category: '管接件', name: 'T型/Y型三通、四通',
    keywords: ['三通', '四通', 'T型', 'Y型', '分流', '快接'],
    meta: { material: 'POM', spec: '1/4"~3/8"快接组合（如两侧3/8+中间1/4）', code: '2CH01002018' } },
  { type: 'model', category: '管接件', name: '快插外牙弯接/硬插弯接',
    keywords: ['快插', '外牙', '硬插', '螺纹', '弯接', '双O', '密封圈'],
    meta: { material: 'POM', spec: '1/4"~3/8"，双O密封圈结构，1000G机型泵用', code: '23601004122' } },
  { type: 'model', category: '管接件', name: 'C型卡环',
    keywords: ['卡环', 'C型', '卡扣'],
    meta: { material: 'PVC', spec: '蓝色，1/4"~3/8"', code: '2CH01003008' } },
  { type: 'model', category: '管接件', name: 'PE管',
    keywords: ['PE管', '管路', '管子', '水管', 'LDPE', '抗菌管'],
    meta: { material: 'LDPE', spec: '2分/3分，抗菌管(蓝)/普通(白/灰)，耐压≥0.8MPa', code: '23601214028' } },
  { type: 'model', category: '螺钉', name: '自攻螺钉(盘头/沉头)',
    keywords: ['螺钉', '螺丝', '自攻', '盘头', '沉头', '十字槽'],
    meta: { material: 'SUS304/SUS430/Q235镀镍/镀白锌', spec: 'ST2.9~ST4×12~16，GB/T845/846，平尾/尖尾', code: '28806002012' } },
  { type: 'model', category: '螺钉', name: '机牙螺钉(盘头)',
    keywords: ['机牙', '螺钉', 'M5', '增压泵固定'],
    meta: { material: 'SUS304', spec: 'M5×16/25，GB/T818，增压泵固定用', code: '28806001187' } },
  { type: 'model', category: '螺钉', name: '六角螺母',
    keywords: ['螺母', '六角', 'M5', '螺母'],
    meta: { material: 'Q235镀镍', spec: 'M5，GB/T6170，增压泵固定用', code: '28806006013' } },
  { type: 'model', category: '滤芯', name: 'ROC复合滤芯',
    keywords: ['ROC', '复合滤芯', '滤芯', 'RO', '滤瓶'],
    meta: { spec: '586平台368×110mm / 560平台338×96mm', code: '23609205040' } },
  { type: 'model', category: '滤芯', name: 'PC/PCP复合滤芯',
    keywords: ['PC', 'PCP', '复合滤芯', '滤芯', '滤瓶'],
    meta: { spec: '586平台368×110mm / 560平台203×96mm', code: '23609200073' } },
  { type: 'model', category: '滤芯', name: '后炭滤芯',
    keywords: ['后炭', '活性炭', '滤芯', 'T33'],
    meta: { spec: 'R3U平台184×64mm', code: '2CH09003006' } },
  { type: 'model', category: '适配器', name: '适配器(电源)',
    keywords: ['适配器', '电源', '变压器', '24V', '36V', 'DC'],
    meta: { spec: '内置接插/灌胶防水，220V/AC-24V/DC 2A~7A、36V5A，VH-2/VH3.96端子', code: '23603101053' } },
  { type: 'model', category: '增压泵', name: '电磁增压泵',
    keywords: ['增压泵', '水泵', '泵', 'RO泵', '电磁泵'],
    meta: { spec: 'DC24V/36V，50G~1200G，快接/螺纹口，带/不带钣金支架；75G流量≥800mL/min、自吸≥2米', code: '23603105030' } },
  { type: 'model', category: '电磁阀', name: '进水电磁阀',
    keywords: ['电磁阀', '进水阀', '阀', '电磁'],
    meta: { spec: 'DC24V 5.6W，压力0-0.8MPa，1/4"~3/8"快接/插杆', code: '23603104037' } },
  { type: 'model', category: '电磁阀', name: '抗堵/可调废水阀',
    keywords: ['废水阀', '废水', '抗堵', '可调'],
    meta: { spec: 'DC24V，1/4"快接，550cc，侧安装，JYW-R3000', code: '2CH03003021' } },

  // ==================== 水家电三产品线（water_appliance）====================
  { type: 'water_appliance', category: '净水机', name: 'RO反渗透纯水机',
    keywords: ['净水器', '净水机', 'RO', '反渗透', '纯水机', '通量', '无桶', '大通量'],
    meta: { spec: '75G无桶/400G~1000G+大通量/双出水/厨下/壁挂；进水压力0.1~0.4MPa；废水比1:1~3:1(一级水效≥2:1)' } },
  { type: 'water_appliance', category: '净水机', name: '超滤/复合型净水机',
    keywords: ['超滤', 'UF', '复合', '纳滤', '软水', '矿物质'],
    meta: { spec: '中空纤维超滤保留矿物质；RO+UF/RO+UV/纳滤/软水+RO组合' } },
  { type: 'water_appliance', category: '净水机', name: '滤芯配置(四段)',
    keywords: ['PP棉', '活性炭', 'RO膜', 'T33', '滤芯', '滤瓶', '前置', '后置'],
    meta: { spec: '1级PP棉(5μm/1μm,3~6月)→2级前置活性炭(CTO,6~12月)→3级RO膜(18~36月)→4级后置活性炭T33(12月)' } },
  { type: 'water_appliance', category: '净水机', name: '材料选用规范',
    keywords: ['材料', '材质', '食品级', 'PP', 'POM', '304', 'ABS', 'PC', '密封件', '硅胶', 'NBR', 'EPDM', '滤瓶', 'PAS', 'PPSU'],
    meta: { spec: '接触水路食品级PP/POM/304(GB/T17219)；外壳ABS/PC/PP合金(UL94-V0)；密封件食品级硅胶/NBR/EPDM(耐氯>500ppm·h)；滤瓶透明PAS/PPSU' } },
  { type: 'water_appliance', category: '净水机', name: '结构设计要点',
    keywords: ['结构', '布局', '漏水', '防水', '减震', '噪声', '密封', '水路', '滤芯间距', '集水槽'],
    meta: { spec: '滤芯间距≥50mm；底部留≥150mm拔出空间；漏水探头+底盘集水槽≥500ml；泵体减震噪声≤45dB(A)；包装EPE珍珠棉≥20mm、GB/T4857跌落600mm' } },
  { type: 'water_appliance', category: '净水机', name: '认证合规清单',
    keywords: ['认证', '标准', '水效', 'CCC', '涉水', 'GB4706', 'GB34914', 'NSF', '30307'],
    meta: { spec: 'GB4706.1、GB/T30307、GB34914水效、卫生部涉水许可、CCC；出口NSF/ANSI 58' } },
  { type: 'water_appliance', category: '饮水机', name: '饮水机(框架)',
    keywords: ['饮水机', '管线机', '即热', '厚膜', '速热', '立式', '台式', '无胆'],
    meta: { spec: '台式(温热/冷热)/立式(单双门)/管线机(壁挂/嵌入)/无胆速热(即热式/稀土厚膜加热)；设计规范整理中' } },
  { type: 'water_appliance', category: '台净', name: '台式净水器(框架)',
    keywords: ['台净', '台式净水', '龙头净水器', '滤水壶', '便携', '直饮'],
    meta: { spec: '便携台净(手持/杯式/壶式)/台式RO(迷你/一体式)/龙头净水器(直饮/粗滤)/滤水壶(活性炭/离子交换/复合)；设计规范整理中' } },

  // ==================== 工具箱（tool，对应 scope=toolbox）====================
  { type: 'tool', category: '工具箱', name: 'DFM模具初评',
    keywords: ['DFM', '模具', '可制造性', '壁厚分析', '拔模', '分型面', '浇口'],
    meta: { spec: 'AI模具可制造性分析：壁厚均匀性/拔模斜度/分型面/浇口位置' } },
  { type: 'tool', category: '工具箱', name: 'BOM成本秒算',
    keywords: ['BOM', '成本', '物料清单', '核算', '供应商比价', '版本'],
    meta: { spec: 'BOM自动提取/成本核算/供应商比价/版本管理' } },
  { type: 'tool', category: '工具箱', name: '包装规格设计',
    keywords: ['包装', '运输', '海运', '空运', '环保', '包装规格'],
    meta: { spec: '尺寸优化/运输方案/合规检查/环保评估' } },
  { type: 'tool', category: '工具箱', name: '结构高频数据库',
    keywords: ['数据库', '标准件', '材料数据库', '公差', '表面处理', '高频'],
    meta: { spec: 'GB/ISO/DIN标准件/工程材料性能/公差配合/表面工艺' } },
]

// ==================== 工具函数 ====================

/** 归一化搜索范围 */
function normalizeScope(scope) {
  return ['all', 'model', 'water_appliance', 'toolbox'].includes(scope) ? scope : 'all'
}

/** 按范围过滤知识库 */
function filterByScope(scope) {
  if (scope === 'model') return KNOWLEDGE_BASE.filter(e => e.type === 'model')
  if (scope === 'water_appliance') return KNOWLEDGE_BASE.filter(e => e.type === 'water_appliance')
  if (scope === 'toolbox') return KNOWLEDGE_BASE.filter(e => e.type === 'tool')
  return KNOWLEDGE_BASE
}

/** 范围中文描述（用于提示词） */
function scopeLabel(scope) {
  return {
    all: '全部范围（模型库 + 水家电规范 + 工具箱）',
    model: '仅模型库（标准件/物料，6大类94条）',
    water_appliance: '仅水家电三产品线规范',
    toolbox: '仅工具箱功能模块',
  }[scope] || '全部范围'
}

/** 类型中文标签（用于提示词） */
function typeLabel(type) {
  return { model: '模型库', water_appliance: '水家电规范', tool: '工具箱' }[type] || '通用'
}

/** 从知识库生成注入提示词的摘要文本 */
function buildKnowledgeText(scope) {
  const kb = filterByScope(scope)
  if (kb.length === 0) return '（当前范围暂无内置数据）'
  return kb.map((e) => {
    const parts = []
    if (e.meta?.code) parts.push(`编号:${e.meta.code}`)
    if (e.meta?.material) parts.push(`材质:${e.meta.material}`)
    if (e.meta?.spec) parts.push(`规格:${e.meta.spec}`)
    if (e.meta?.count) parts.push(`数量:${e.meta.count}条`)
    const metaStr = parts.length ? `｜${parts.join('｜')}` : ''
    return `- [${typeLabel(e.type)}] ${e.name}（分类:${e.category}）${metaStr}`
  }).join('\n')
}

// ==================== 系统提示词 ====================

/** 构造智能搜索系统提示词（要求 LLM 严格输出 JSON） */
function buildSystemPrompt(query, history, scope) {
  const kbText = buildKnowledgeText(scope)
  const historyText = (Array.isArray(history) ? history.slice(-6) : [])
    .filter(m => m && typeof m.content === 'string' && m.content.trim())
    .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content.trim().slice(0, 300)}`)
    .join('\n')

  return `你是"水家电产品开发AI助手"的智能搜索引擎，负责把用户的自然语言查询解析为结构化JSON。你只能输出一个合法JSON对象，不要输出任何JSON以外的文字、注释或markdown代码块。

## 任务
1. intent：意图分类，取值只能是 search(查找检索) / recommend(推荐选型) / compare(对比分析) / stats(统计数量) / spec(规格参数/结构设计咨询) / chat(闲聊寒暄) 之一。
2. keywords：从本次查询提取的2~6个关键词（去掉语气词，保留产品/材质/规格/场景词）。
3. suggestions：2~3条联想/改写建议，必须使用下面内置数据中出现过的真实名称。
4. correction：若查询有明显错别字或需规范化的口语表达，返回 {"original":"原文","corrected":"纠正后"}；否则为 null。
5. results：0~6条结构化搜索结果，每项 {"type":"","name":"","category":"","reason":"","confidence":0,"meta":{}}。type 只能取 model / water_appliance / tool / general 之一；name 和 category 必须来自内置数据，禁止编造；reason 结合查询与数据要点写1~2句匹配原因；confidence 为0~1；meta 可包含 code/material/specification/scope 等真实字段。
6. recommendations：0~4条相关推荐，结构与 results 相同，用于补充相近产品/资料。
7. summary：2~4句中文回答，面向水家电结构工程师，必须引用内置数据中的真实参数（如通量、材质、尺寸、认证标准），不要编造。

## 当前搜索范围
${scopeLabel(scope)}

## 内置数据（必须以此为准，禁止凭空捏造）
${kbText}

## 多轮上下文（可参考）
${historyText || '（无）'}

## 用户查询
${query}

## 输出JSON结构（严格按此字段）
{"intent":"","keywords":[],"suggestions":[],"correction":null,"results":[],"recommendations":[],"summary":""}`
}

// ==================== DeepSeek 调用 ====================

/** 解析 LLM 输出为 JSON（先直接 parse，失败则提取最外层花括号） */
function parseLlmJson(content) {
  const text = String(content).trim()
  try {
    return JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch { /* 继续走异常 */ }
    }
  }
  throw new Error('LLM 输出不是合法 JSON')
}

/** 调用 DeepSeek（15s 超时，强制 json_object 输出） */
async function callDeepSeek(systemPrompt, userQuery) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: false,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })
    const data = await resp.json()
    if (!resp.ok) {
      throw new Error(`DeepSeek API ${resp.status}: ${data?.error?.message || '未知错误'}`)
    }
    const content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('DeepSeek 未返回内容')
    return parseLlmJson(content)
  } finally {
    clearTimeout(timer)
  }
}

// ==================== 结构化校验（禁止前端依赖 LLM 不稳定输出） ====================

const VALID_TYPES = ['model', 'water_appliance', 'tool', 'general']
const VALID_INTENTS = ['search', 'recommend', 'compare', 'stats', 'spec', 'chat']

/** 单条结果清洗 */
function sanitizeResultItem(r) {
  const type = VALID_TYPES.includes(r.type) ? r.type : 'general'
  const conf = Number(r.confidence)
  const confidence = Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0.5
  return {
    type,
    name: String(r.name ?? '').slice(0, 100),
    category: typeof r.category === 'string' ? r.category.slice(0, 50) : '',
    reason: typeof r.reason === 'string' ? r.reason.slice(0, 300) : '',
    confidence,
    meta: r.meta && typeof r.meta === 'object' ? r.meta : {},
  }
}

/** LLM 结果整体清洗：字段缺失给默认值 */
function sanitizeLlmResult(raw, ctx) {
  const out = {
    query: ctx.query,
    intent: 'search',
    keywords: [],
    suggestions: [],
    correction: null,
    results: [],
    recommendations: [],
    summary: '',
    source: 'llm',
  }
  if (!raw || typeof raw !== 'object') return out

  if (VALID_INTENTS.includes(raw.intent)) out.intent = raw.intent
  if (Array.isArray(raw.keywords)) {
    out.keywords = raw.keywords.filter(k => typeof k === 'string' && k.trim()).slice(0, 8).map(k => k.trim())
  }
  if (Array.isArray(raw.suggestions)) {
    out.suggestions = raw.suggestions.filter(s => typeof s === 'string' && s.trim()).slice(0, 5).map(s => s.trim())
  }
  if (raw.correction && typeof raw.correction === 'object'
    && typeof raw.correction.original === 'string' && typeof raw.correction.corrected === 'string') {
    out.correction = { original: raw.correction.original, corrected: raw.correction.corrected }
  }
  if (Array.isArray(raw.results)) {
    out.results = raw.results
      .filter(r => r && typeof r === 'object' && typeof r.name === 'string' && r.name.trim())
      .slice(0, 8)
      .map(sanitizeResultItem)
  }
  if (Array.isArray(raw.recommendations)) {
    out.recommendations = raw.recommendations
      .filter(r => r && typeof r === 'object' && typeof r.name === 'string' && r.name.trim())
      .slice(0, 6)
      .map(sanitizeResultItem)
  }
  if (typeof raw.summary === 'string' && raw.summary.trim()) out.summary = raw.summary.trim().slice(0, 1000)
  return out
}

// ==================== 本地快速兜底（LLM 失败/超时时降级） ====================

/** 本地意图启发式判断 */
function detectLocalIntent(q) {
  if (/对比|区别|差异|vs|与.*相比|有什么区别/.test(q)) return 'compare'
  if (/多少|几个|几类|统计|数量|共|总共有/.test(q)) return 'stats'
  if (/规格|尺寸|材质|参数|材料|怎么设计|标准|认证|壁厚|防水|结构|耐压/.test(q)) return 'spec'
  if (/推荐|建议|用什么|哪个好|哪个更适合|比较好|适合|选|挑/.test(q)) return 'recommend'
  if (/你好|您好|谢谢|在吗|嗨|哈喽/.test(q)) return 'chat'
  return 'search'
}

/** 本地关键词匹配检索（思路参考 ai-chat.js 的 searchLocalDocs：对内置摘要做 includes 匹配） */
function localSearch(query, scope) {
  const q = query.toLowerCase()
  const kb = filterByScope(scope)

  const scored = []
  for (const entry of kb) {
    const nameLower = entry.name.toLowerCase()
    const catLower = entry.category.toLowerCase()
    const kwMatches = []
    for (const kw of (entry.keywords || [])) {
      if (q.includes(kw.toLowerCase())) kwMatches.push(kw)
    }
    let score = kwMatches.length
    if (q.includes(nameLower)) { score += 3; if (!kwMatches.includes(entry.name)) kwMatches.push(entry.name) }
    if (q.includes(catLower)) { score += 1 }
    if (score > 0) scored.push({ entry, score, kwMatches })
  }
  scored.sort((a, b) => b.score - a.score)

  const buildItem = ({ entry, score, kwMatches }, recommend = false) => {
    const kwText = kwMatches.length ? `「${kwMatches.slice(0, 4).join('」「')}」` : `「${entry.category}」`
    const specText = entry.meta?.spec ? `（${entry.meta.spec.slice(0, 80)}）` : ''
    return {
      type: entry.type,
      name: entry.name,
      category: entry.category,
      reason: recommend
        ? `相关推荐：${kwText} ${specText}`
        : `匹配到关键词${kwText} ${specText}`,
      confidence: Math.min(0.95, 0.35 + score * 0.15),
      meta: entry.meta || {},
    }
  }

  const top = scored.slice(0, 6)
  const results = top.map(s => buildItem(s, false))

  // 推荐：优先取排名 6 名之后的条目，不足则复用前几名
  let recommendations = scored.slice(6, 10).map(s => buildItem(s, true))
  if (recommendations.length < 2) {
    const used = new Set(results.map(r => r.name))
    for (const s of scored) {
      if (!used.has(s.entry.name)) recommendations.push(buildItem(s, true))
      if (recommendations.length >= 4) break
    }
  }

  // 关键词：去重取匹配词；无匹配则返回空数组
  const seen = new Set()
  const keywords = []
  for (const { kwMatches } of scored) {
    for (const kw of kwMatches) {
      if (!seen.has(kw) && kw.length >= 2) { seen.add(kw); keywords.push(kw) }
      if (keywords.length >= 6) break
    }
    if (keywords.length >= 6) break
  }

  // 联想/改写建议
  const suggestions = []
  const sugSeen = new Set()
  for (const { entry } of top) {
    for (const s of [`${entry.name} 规格参数`, `${entry.name} 选型建议`, `${entry.category} 相关条目`]) {
      if (!sugSeen.has(s) && suggestions.length < 3) { sugSeen.add(s); suggestions.push(s) }
    }
  }

  const intent = detectLocalIntent(q)

  // 摘要
  let summary
  if (results.length === 0) {
    summary = `没有在内置数据中找到与「${query}」直接匹配的内容，建议换个说法，或缩小搜索范围（模型库/水家电规范/工具箱）后重试。`
  } else {
    const names = results.slice(0, 3).map(r => r.name).join('、')
    const intentText = { recommend: '推荐', compare: '对比', stats: '统计', spec: '规格', search: '检索', chat: '回答' }[intent] || '检索'
    summary = `已为您${intentText}到 ${results.length} 条相关内容：${names}。${results[0]?.reason || ''}`
  }

  return {
    query,
    intent,
    keywords,
    suggestions,
    correction: null,
    results,
    recommendations,
    summary,
    source: 'local',
  }
}

// ==================== 主流程 ====================

/** 智能搜索编排：优先 LLM，失败降级本地 */
async function analyzeQuery(query, history, scope) {
  const normScope = normalizeScope(scope)
  const local = localSearch(query, normScope)

  // 没有配置 key 或为空时直接本地兜底（避免无效调用）
  if (!DEEPSEEK_API_KEY) {
    return local
  }

  try {
    const systemPrompt = buildSystemPrompt(query, history, normScope)
    const raw = await callDeepSeek(systemPrompt, query)
    const llmResult = sanitizeLlmResult(raw, { query, scope: normScope })

    // LLM 未产出有效结果时，用本地结果补底，避免前端拿到空列表
    if (llmResult.results.length === 0 && local.results.length > 0) {
      llmResult.results = local.results
      llmResult.recommendations = local.recommendations
      if (!llmResult.summary) llmResult.summary = local.summary
      llmResult.source = 'local'
    }
    return llmResult
  } catch (err) {
    console.warn('[ai-search] LLM 调用失败，降级本地检索:', err.message)
    return local
  }
}

// ==================== 路由 ====================

/** 健康检查：POST /api/search/smart/health */
router.get('/smart/health', (req, res) => {
  res.json({
    success: true,
    configured: !!DEEPSEEK_API_KEY,
    envKeyConfigured: !!process.env.DEEPSEEK_API_KEY,
    model: DEEPSEEK_MODEL,
    endpoint: DEEPSEEK_URL,
    kbSize: KNOWLEDGE_BASE.length,
    timeoutMs: SEARCH_TIMEOUT_MS,
  })
})

/** 智能搜索：POST /api/search/smart */
router.post('/smart', async (req, res) => {
  try {
    const body = req.body || {}
    const { history = [], scope = 'all' } = body
    const query = typeof body.query === 'string' ? body.query.trim() : ''

    if (!query) {
      return res.json({ success: false, message: '请输入搜索内容' })
    }

    const result = await analyzeQuery(query, history, scope)
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('[ai-search] 智能搜索失败:', err)
    res.status(500).json({
      success: false,
      message: err.name === 'AbortError' ? '搜索超时，请稍后重试' : `搜索失败：${err.message}`,
    })
  }
})

export default router
