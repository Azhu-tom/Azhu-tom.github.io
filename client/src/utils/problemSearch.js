/**
 * 开发问题解决助手 - RAG 检索引擎
 *
 * 轻量级本地检索（无需后端）：
 *   1. 关键词权重匹配：用户输入命中案例 keywords 的个数比例（高权重）
 *   2. 字符 n-gram Jaccard 相似度：兜底语义相似（对未命中关键词的表述也能匹配）
 *   3. 综合评分 = 关键词命中 70% + n-gram 相似 30%，返回 Top-K
 */

// ---- 中文分词（轻量 n-gram + 停用词） ----
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也',
  '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那',
  '什么', '怎么', '为什么', '如何', '请问', '帮忙', '帮', '一下', '问题', '情况', '出现',
  '我们', '咱们', '这个', '那个', '应该', '需要', '可以', '请问一下', '现在'
])

// 生成字符 n-gram 集合（bigram + trigram）
function ngrams(text, n = 2) {
  const set = new Set()
  const clean = text.replace(/\s+/g, '').toLowerCase()
  for (let i = 0; i <= clean.length - n; i++) {
    set.add(clean.slice(i, i + n))
  }
  return set
}

// Jaccard 相似度
function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const item of a) {
    if (b.has(item)) inter++
  }
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

// ---- 检索主函数 ----
/**
 * @param {string} query 用户输入的问题描述
 * @param {Array} cases  知识库案例（默认导入 PROBLEM_CASES）
 * @param {number} topK  返回条数（默认 5）
 * @returns [{ case, score, matchedKeywords, reason }]
 */
export function searchProblemCases(query, cases, topK = 5) {
  const q = (query || '').trim()
  if (!q || q.length < 2) return []

  const qNgrams = ngrams(q, 2)
  const qWords = q.toLowerCase()

  const results = cases.map((c) => {
    // 1. 关键词权重匹配（70%）
    let matched = []
    for (const kw of c.keywords || []) {
      if (qWords.includes(kw.toLowerCase())) matched.push(kw)
    }
    // 也匹配 title + tags
    for (const tag of c.tags || []) {
      if (qWords.includes(tag.toLowerCase()) && !matched.includes(tag)) matched.push(tag)
    }
    const keywordScore = matched.length / Math.max(1, (c.keywords || []).length)

    // 2. n-gram 语义相似（30%）
    const corpusNgrams = ngrams(`${c.title} ${c.problem} ${(c.keywords || []).join(' ')}`)
    const ngramScore = jaccard(qNgrams, corpusNgrams)

    // 3. 综合评分
    const score = keywordScore * 0.7 + ngramScore * 0.3

    return { case: c, score, matchedKeywords: matched, keywordScore, ngramScore }
  })

  // 过滤：分数过低的去掉（避免无关结果）
  const filtered = results
    .filter(r => r.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return filtered
}

// ---- 分类统计（供面板展示） ----
export function getCategoryCount(cases) {
  const map = {}
  cases.forEach(c => {
    map[c.category] = (map[c.category] || 0) + 1
  })
  return map
}

// ---- 常用搜索建议 ----
export const QUICK_SUGGESTIONS = [
  '漏水', '异响', '卡扣断裂', '缩水', '超声波焊接', '盐雾测试', '废水比', '成本超标'
]
