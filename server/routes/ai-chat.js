import express from 'express'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// ==================== DeepSeek 配置 ====================
// 用户提供的 key（生产环境建议通过环境变量注入）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-3be25bcbaccf426f878c1607a7fbbe24'
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

// 上传文档存储根目录
const DOC_ROOT = join(__dirname, '..', 'uploads', 'wa-documents')
const PRODUCT_LINES = ['purifier', 'dispenser', 'countertop']
const LINE_NAMES = { purifier: '净水机', dispenser: '饮水机', countertop: '台式净水器' }

// ==================== 本地文档解析 ====================

/** 解析 Excel（xlsx/xls）为可检索文本 */
function extractExcelText(filePath) {
  try {
    const wb = XLSX.readFile(filePath)
    const parts = []
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      const lines = rows
        .filter(r => Array.isArray(r) && r.some(c => String(c).trim() !== ''))
        .map(r => r.map(c => String(c ?? '').trim()).filter(Boolean).join(' | '))
      if (lines.length) parts.push(`【工作表：${sheetName}】\n${lines.slice(0, 500).join('\n')}`)
    }
    return parts.join('\n\n').slice(0, 80000)
  } catch (e) {
    return ''
  }
}

/** 解析纯文本（txt/md/csv） */
function extractPlainText(filePath) {
  try {
    return readFileSync(filePath, 'utf8').slice(0, 40000)
  } catch {
    return ''
  }
}

/** 收集指定产品线的本地文档文本 */
function collectLocalDocs(productLine) {
  const dir = join(DOC_ROOT, productLine)
  if (!existsSync(dir)) return []
  const docs = []
  try {
    for (const file of readdirSync(dir)) {
      const ext = extname(file).toLowerCase()
      const fp = join(dir, file)
      let content = ''
      if (['.xlsx', '.xls'].includes(ext)) content = extractExcelText(fp)
      else if (['.txt', '.md', '.csv'].includes(ext)) content = extractPlainText(fp)
      // pdf/docx/ppt 暂不解析（需额外解析库，后续可扩展）
      if (content.trim()) {
        docs.push({ file: file.replace(/^\d+_/, ''), content })
      }
    }
  } catch (e) {
    console.error('[ai-chat] 读取本地文档失败:', e.message)
  }
  return docs
}

/** 从文档中按关键词检索相关片段 */
function searchLocalDocs(docs, query) {
  const tokens = (query || '')
    .toLowerCase()
    .split(/[\s,，。、;；:：/\\|]+/)
    .filter(t => t.length >= 2)
  if (tokens.length === 0) return []

  const hits = []
  for (const doc of docs) {
    const lines = doc.content.split('\n')
    const matched = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const lower = line.toLowerCase()
      // 命中任意关键词即收录
      if (tokens.some(t => lower.includes(t))) {
        matched.push(line.slice(0, 500))
        if (matched.length >= 10) break
      }
    }
    if (matched.length) {
      hits.push({ source: `本地规范：${doc.file}`, snippets: matched })
    }
  }
  return hits
}

// ==================== 联网搜索（尽力而为，失败不影响主流程） ====================

/** DuckDuckGo HTML 搜索（无需 API key） */
async function searchWeb(query) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' 净水机 滤芯 设计 结构')}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000) // 4s 超时（避免拖累整体响应）
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36' },
      signal: controller.signal
    })
    clearTimeout(timer)
    const html = await res.text()
    const results = []
    // 提取标题 + 摘要（HTML 正则）
    const blockRe = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g
    let m
    while ((m = blockRe.exec(html)) !== null && results.length < 5) {
      const title = m[2].replace(/<[^>]+>/g, '').trim()
      const snippet = m[3].replace(/<[^>]+>/g, '').trim()
      if (title && snippet) {
        results.push({ title: title.slice(0, 120), snippet: snippet.slice(0, 300) })
      }
    }
    // 降级：尝试普通链接 + 摘要提取
    if (results.length === 0) {
      const linkRe = /<a[^>]*class="result__a"[^>]*>(.*?)<\/a>/g
      let lm
      let idx = 0
      while ((lm = linkRe.exec(html)) !== null && idx < 5) {
        const title = lm[1].replace(/<[^>]+>/g, '').trim()
        if (title) {
          results.push({ title: title.slice(0, 120), snippet: '（联网检索到相关链接，详情可点击查看）' })
          idx++
        }
      }
    }
    return results
  } catch (e) {
    console.warn('[ai-chat] 联网搜索失败:', e.message)
    return []
  }
}

// ==================== Prompt 组装 ====================

/** 构造系统提示词 */
function buildSystemPrompt(productLine, localHits, webResults, builtinSpecText) {
  const lineName = LINE_NAMES[productLine] || '水家电'

  let localCtx = '（本地规范库中未检索到与问题直接相关的条目）'
  if (localHits.length) {
    localCtx = localHits.map(h =>
      `【${h.source}】\n${h.snippets.map(s => `  · ${s}`).join('\n')}`
    ).join('\n\n')
  }

  let builtinCtx = '（未提供内置规范）'
  if (builtinSpecText && builtinSpecText.trim()) {
    builtinCtx = builtinSpecText.slice(0, 6000)
  }

  let webCtx = '（未获取到联网检索结果）'
  if (webResults.length) {
    webCtx = webResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`).join('\n')
  }

  return `你是资深水家电结构设计工程师（${lineName}方向），精通净水机、饮水机、台式净水器的滤芯、水路、外壳、加热模块的结构设计。

你的回答必须遵循以下规则：
1. 优先引用"本地设计规范"中的参数（这是企业经验，最可靠）；本地规范没有时，参考联网检索的行业资料。
2. 输出必须包含：推荐壁厚、关键尺寸、结构参数（如卡扣、密封圈、螺纹、水路接口等）、设计依据。
3. 每个参数如果无法精确确定，必须给出合理范围（如 壁厚 2.0~2.5mm）并给出建议值。
4. 回答末尾必须标注"数据来源"，区分【本地规范】【联网资料】【行业经验】。
5. 使用 markdown 结构化输出（标题、表格、列表），表格适合参数对比。
6. 若问题不明确，先列出你理解的关键点，再给出方案。

===== 本地设计规范（企业标准，优先级最高）=====
${builtinCtx}

===== 本地上传文档检索结果 =====
${localCtx}

===== 联网检索的行业资料 =====
${webCtx}
`
}

// ==================== 路由 ====================

/** 健康检查：AI 服务状态 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    configured: !!DEEPSEEK_API_KEY,
    model: DEEPSEEK_MODEL,
    endpoint: DEEPSEEK_URL,
    localDocs: PRODUCT_LINES.reduce((acc, line) => {
      const dir = join(DOC_ROOT, line)
      acc[line] = existsSync(dir) ? readdirSync(dir).length : 0
      return acc
    }, {})
  })
})

/** 主对话接口：POST /api/ai/chat */
router.post('/chat', async (req, res) => {
  try {
    const { messages = [], productLine = 'purifier', builtinSpecText = '' } = req.body
    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ success: false, message: 'DeepSeek API Key 未配置' })
    }

    // 提取用户最新问题
    const history = Array.isArray(messages) ? messages.filter(m => m && typeof m.content === 'string').slice(-12) : []
    const lastUserMsg = [...history].reverse().find(m => m.role === 'user')
    const query = lastUserMsg?.content?.trim()
    if (!query) {
      return res.json({ success: false, message: '请输入问题' })
    }

    // 1. 本地 RAG 检索（上传文档）
    const localDocs = collectLocalDocs(productLine)
    const localHits = searchLocalDocs(localDocs, query)

    // 2. 联网搜索
    const webResults = await searchWeb(query)

    // 3. 组装 system prompt + 完整消息序列
    const systemPrompt = buildSystemPrompt(productLine, localHits, webResults, builtinSpecText)
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...history
    ]

    // 4. 调用 DeepSeek
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: apiMessages,
        temperature: 0.5,
        max_tokens: 2500,
        stream: false
      }),
      signal: controller.signal
    })
    clearTimeout(timer)

    const data = await resp.json()
    if (!resp.ok) {
      console.error('[ai-chat] DeepSeek API 错误:', resp.status, data?.error?.message)
      return res.status(502).json({
        success: false,
        message: `AI 服务调用失败（${resp.status}）：${data?.error?.message || '未知错误'}`
      })
    }

    const answer = data?.choices?.[0]?.message?.content || '（AI 未返回内容）'

    // 5. 返回答案 + 数据来源
    const sources = [
      ...localHits.map(h => ({ type: '本地规范', name: h.source })),
      ...webResults.map((r, i) => ({ type: '联网资料', name: r.title }))
    ]

    res.json({
      success: true,
      answer,
      sources,
      model: data?.model || DEEPSEEK_MODEL,
      usage: data?.usage || null
    })
  } catch (err) {
    console.error('[ai-chat] 对话失败:', err)
    res.status(500).json({
      success: false,
      message: err.name === 'AbortError' ? 'AI 响应超时，请稍后重试' : `AI 对话失败：${err.message}`
    })
  }
})

export default router
