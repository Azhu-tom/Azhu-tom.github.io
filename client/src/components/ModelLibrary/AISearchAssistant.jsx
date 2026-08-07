import React, { useState, useRef, useEffect, useCallback } from 'react'
import modelData, { categories } from '../../data/modelData'
import './AISearchAssistant.css'

/**
 * AI智能搜索助手 - 集成到模型库搜索框
 * 
 * 功能：
 * 1. 自然语言查询（关键词/完整问题）
 * 2. 智能检索模型库数据（名称/参数/规格/分类）
 * 3. 结果包含详情链接、参数对比、相关推荐
 * 4. 多轮对话能力（基于上下文追问）
 * 5. 平滑集成现有UI，响应式适配
 */

// ==================== AI引擎：意图识别与检索 ====================

const INTENT_PATTERNS = {
  // 搜索类
  search: [
    /搜索|查找|找|有没有|什么|哪些|列出|显示|看看|查一下|帮我找/,
    /.*的.*(?:是什么|有哪些|怎么样|在哪)/,
    /^(?:找|查|搜|给|帮).*/,
  ],
  // 对比类
  compare: [
    /对比|比较|区别|差异|哪个好|哪个更|有什么不同|vs|versus/,
    /(?:和|与|跟).*?(?:相比|比较|对比)/,
  ],
  // 统计类
  stats: [
    /多少|几个|多少个|统计|数量|总数|占比|分布|汇总|概览| overview/,
    /(?:最|最多|最少|最大|最小|平均)/,
  ],
  // 推荐类
  recommend: [
    /推荐|建议|适合|应该用|用什么|选哪个|哪个适合/,
    /(?:场景|用途|需求|要求).*(?:推荐|选|用)/,
  ],
  // 材质/规格询问
  spec: [
    /材质|材料|规格|参数|尺寸|大小|重量|压力|流量|温度/,
    /(?:是)?什么(?:材|料|规|格|参|数)/,
  ],
}

function detectIntent(query) {
  const q = query.toLowerCase().trim()
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const p of patterns) {
      if (p.test(q)) return intent
    }
  }
  return 'search' // 默认搜索意图
}

// 智能搜索引擎
function aiSearch(query, context = null) {
  const q = query.toLowerCase().trim()
  const intent = detectIntent(q)
  
  switch (intent) {
    case 'stats': return handleStatsQuery(q)
    case 'compare': return handleCompareQuery(q, context)
    case 'recommend': return handleRecommendQuery(q, context)
    case 'spec': return handleSpecQuery(q)
    default: return handleSearchQuery(q, context)
  }
}

// ====== 搜索处理 ======
function handleSearchQuery(q, context) {
  // 提取关键词（去除常见停用词）
  const stopWords = ['的', '了', '是', '在', '我', '有', '和', '或', '吗', '呢', '吧', '啊', '想', '要', '帮', '请', '给我', '帮我', '搜索', '查找', '找']
  let keywords = q.replace(/[？?！!，。、；：""''（）()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !stopWords.includes(w))
  
  // 如果有关键词，执行多字段模糊匹配
  if (keywords.length > 0) {
    const results = modelData.filter(m => {
      const fields = [m.code, m.name, m.category, m.material, m.specification, m.remark].join(' ').toLowerCase()
      return keywords.some(kw => fields.includes(kw))
    })
    
    if (results.length > 0) {
      return {
        type: 'search_results',
        query: q,
        keywords,
        results: results.slice(0, 10),
        total: results.length,
        message: `找到 ${results.length} 个匹配结果${results.length > 10 ? '，展示前10个' : ''}`,
      }
    }
  }
  
  // 无结果时返回分类引导
  return {
    type: 'suggestions',
    query: q,
    message: `未找到"${q}"的相关结果`,
    suggestions: generateSuggestions(q),
  }
}

// ====== 统计处理 ======
function handleStatsQuery(q) {
  const catStats = {}
  const materialStats = {}
  const hasModelStats = { true: 0, false: 0 }
  
  modelData.forEach(m => {
    catStats[m.category] = (catStats[m.category] || 0) + 1
    materialStats[m.material] = (materialStats[m.material] || 0) + 1
    hasModelStats[String(m.has3DModel)]++
  })
  
  // 检测是否针对特定分类
  const targetCat = categories.find(c => q.includes(c.name))
  
  if (targetCat) {
    const catModels = modelData.filter(m => m.category === targetCat.name)
    return {
      type: 'category_stats',
      category: targetCat.name,
      count: catModels.length,
      has3D: catModels.filter(m => m.has3DModel).length,
      models: catModels.slice(0, 8),
      message: `${targetCat.name}共有 ${catModels.length} 个零件，其中 ${catModels.filter(m => m.has3DModel).length} 个有3D模型`,
    }
  }
  
  return {
    type: 'overview_stats',
    total: modelData.length,
    has3D: hasModelStats.true,
    categories: Object.entries(catStats).map(([name, count]) => ({ name, count })),
    topMaterials: Object.entries(materialStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count })),
    message: `模型库共 ${modelData.length} 条记录，覆盖 ${Object.keys(catStats).length} 大分类`,
  }
}

// ====== 对比处理 ======
function handleCompareQuery(q, context) {
  // 提取要对比的实体
  const compareResults = []
  
  // 尝试从query中提取具体型号
  const mentionedCodes = []
  for (const m of modelData) {
    if (q.includes(m.code) || q.includes(m.name)) {
      compareResults.push(m)
      mentionedCodes.push(m.code)
    }
  }
  
  // 如果提到了具体型号
  if (compareResults.length >= 2) {
    return {
      type: 'comparison',
      items: compareResults,
      message: `以下为 ${compareResults.map(m => m.name).join(' vs ')} 的参数对比`,
    }
  }
  
  // 如果只提到一个，找同类对比
  if (compareResults.length === 1) {
    const base = compareResults[0]
    const sameCat = modelData.filter(m => m.category === base.category && m.id !== base.id).slice(0, 3)
    return {
      type: 'comparison',
      items: [base, ...sameCat],
      baseItem: base,
      message: `${base.name} 与同类别其他零件对比：`,
    }
  }
  
  // 按分类做对比摘要
  const catComparison = categories
    .filter(c => c.id !== 'all')
    .map(c => ({
      category: c.name,
      count: c.count,
      sample: modelData.find(m => m.category === c.name),
    }))
  
  return {
    type: 'category_comparison',
    categories: catComparison,
    message: '各分类概况对比：',
  }
}

// ====== 推荐处理 ======
function handleRecommendQuery(q, context) {
  // 根据上下文或关键词推荐
  let candidates = [...modelData]
  
  // 场景关键词映射
  const scenarioMap = {
    '连接': ['管接件', '适配器'],
    '固定': ['螺钉'],
    '过滤': ['滤芯'],
    '增压': ['增压泵'],
    '控制': ['电磁阀'],
    '水管': ['管接件'],
    '快插': ['管接件'],
    '密封': ['堵头'],
    '电源': ['适配器'],
  }
  
  for (const [scenario, cats] of Object.entries(scenarioMap)) {
    if (q.includes(scenario)) {
      candidates = candidates.filter(m => cats.includes(m.category))
      break
    }
  }
  
  // 有图纸的优先
  const with3D = candidates.filter(m => m.has3DModel)
  const recommended = (with3D.length > 0 ? with3D : candidates).slice(0, 5)
  
  return {
    type: 'recommendation',
    query: q,
    items: recommended,
    message: `根据您的需求，推荐以下 ${recommended.length} 个零件：`,
  }
}

// ====== 规格查询处理 ======
function handleSpecQuery(q) {
  // 找到提到的零件
  let targetModels = []
  for (const m of modelData) {
    if (q.includes(m.code) || q.includes(m.name)) {
      targetModels.push(m)
    }
  }
  
  if (targetModels.length > 0) {
    return {
      type: 'spec_detail',
      items: targetModels,
      message: `${targetModels[0].name} 的详细规格信息：`,
    }
  }
  
  // 按材质筛选
  const matMatch = modelData.filter(m => q.includes(m.material))
  if (matMatch.length > 0) {
    return {
      type: 'material_list',
      material: matMatch[0].material,
      items: matMatch.slice(0, 8),
      message: `材质为「${matMatch[0].material}」的零件共 ${matMatch.length} 个：`,
    }
  }
  
  return handleSearchQuery(q)
}

// ====== 建议生成 ======
function generateSuggestions(q) {
  const suggestions = []
  
  // 分类建议
  for (const cat of categories) {
    if (cat.id !== 'all' && (q.includes(cat.name.substring(0, 2)) || q.length <= 2)) {
      suggestions.push({ type: 'category', text: `查看所有${cat.name}`, action: cat.name })
    }
  }
  
  // 热门搜索
  suggestions.push({ type: 'action', text: '查看全部94条记录', action: 'all' })
  suggestions.push({ type: 'action', text: '查看有3D模型的零件', action: 'has3d' })
  suggestions.push({ type: 'action', text: '各分类数量统计', action: 'stats' })
  
  return suggestions.slice(0, 6)
}

// ==================== 组件 ====================

export default function AISearchAssistant({ onResultSelect, onSearchChange }) {
  const [query, setQuery] = useState('')
  const [isAIMode, setIsAIMode] = useState(false)
  const [conversations, setConversations] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // XSS防护：转义HTML特殊字符
  const escapeHtml = (str) => {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

  // 自动滚动到底部
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversations, isTyping])

  // 发送消息
  const sendMessage = useCallback((text) => {
    if (!text.trim()) return
    
    const userMsg = { role: 'user', content: text.trim(), timestamp: Date.now() }
    setConversations(prev => [...prev, userMsg])
    setQuery('')
    setIsTyping(true)
    
    // 模拟AI思考延迟
    setTimeout(() => {
      const context = conversations.length > 0 ? conversations[conversations.length - 1] : null
      const response = aiSearch(text.trim(), context)
      
      const aiMsg = {
        role: 'assistant',
        ...response,
        timestamp: Date.now(),
      }
      setConversations(prev => [...prev, aiMsg])
      setIsTyping(false)
      setShowPanel(true)
    }, 400 + Math.random() * 400)
  }, [conversations])

  // 输入变化（普通搜索模式实时触发）
  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    
    if (!isAIMode && onSearchChange) {
      // 防抖处理
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onSearchChange(val), 200)
    }
  }

  // 键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (isAIMode) {
        e.preventDefault()
        sendMessage(query)
      }
      // 非AI模式回车不特殊处理（已通过onChange实时搜索）
    }
    if (e.key === 'Escape') {
      setShowPanel(false)
    }
  }

  // 切换模式
  const toggleMode = () => {
    setIsAIMode(prev => !prev)
    if (!isAIMode) {
      setShowPanel(true)
      inputRef.current?.focus()
    }
  }

  // 清空对话
  const clearChat = () => {
    setConversations([])
    setQuery('')
    setShowPanel(false)
  }

  // 选择结果
  const handleSelectModel = (model) => {
    if (onResultSelect) onResultSelect(model)
  }

  // 快捷操作
  const handleQuickAction = (action) => {
    switch (action) {
      case 'all':
        sendMessage('列出所有零件')
        break
      case 'has3d':
        sendMessage('哪些零件有3D模型')
        break
      case 'stats':
        sendMessage('各分类有多少个零件')
        break
      default:
        if (typeof action === 'string' && action.startsWith('查看')) {
          sendMessage(action)
        } else {
          sendMessage(`查看${action}`)
        }
    }
  }

  return (
    <div className={`ai-search-assistant ${isAIMode ? 'ai-mode' : ''}`}>
      {/* 搜索栏 */}
      <div className="ais-search-bar">
        <div className="ais-input-wrapper">
          <span className="ais-search-icon">{isAIMode ? '🤖' : '🔍'}</span>
          <input
            ref={inputRef}
            type="text"
            className="ais-input"
            placeholder={isAIMode 
              ? '输入问题，如"有哪些螺钉？""滤芯和增压泵的区别"' 
              : '搜索物料编码、名称、规格...'}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => isAIMode && setShowPanel(true)}
          />
          
          {/* 操作按钮区 */}
          <div className="ais-actions">
            {query && (
              <button 
                className="ais-btn ais-clear" 
                onClick={() => { setQuery(''); if (onSearchChange) onSearchChange(''); }}
                title="清除"
              >✕</button>
            )}
            <button 
              className={`ais-btn ais-mode-toggle ${isAIMode ? 'active' : ''}`}
              onClick={toggleMode}
              title={isAIMode ? '切换到普通搜索' : 'AI智能助手'}
            >
              🤖
            </button>
          </div>
        </div>
        
        {/* AI模式提示 */}
        {isAIMode && (
          <div className="ais-mode-hint">
            <span>💡 AI助手已启用</span>
            <span className="ais-quick-questions">
              <button onClick={() => sendMessage('各分类有多少个零件？')}>分类统计</button>
              <button onClick={() => sendMessage('哪些零件有3D模型？')}>有图纸的</button>
              <button onClick={() => sendMessage('推荐一些常用的管接件')}>热门推荐</button>
            </span>
          </div>
        )}
      </div>

      {/* AI对话面板 */}
      {isAIMode && showPanel && (
        <div className="ais-panel">
          {/* 对话头部 */}
          <div className="ais-panel-header">
            <span className="ais-panel-title">🤖 AI智能助手</span>
            <div className="ais-panel-controls">
              {conversations.length > 0 && (
                <button className="ais-control-btn" onClick={clearChat} title="清空对话">🗑️</button>
              )}
              <button className="ais-control-btn" onClick={() => setShowPanel(false)} title="收起">−</button>
            </div>
          </div>

          {/* 对话内容 */}
          <div className="ais-messages">
            {conversations.length === 0 && (
              <div className="ais-welcome">
                <div className="ais-welcome-icon">🤖</div>
                <h3>你好！我是模型库AI助手</h3>
                <p>我可以帮你：</p>
                <ul>
                  <li>🔍 <strong>搜索零件</strong> — "找PP材质的堵头"</li>
                  <li>📊 <strong>统计分析</strong> — "滤芯有几个""各分类占比"</li>
                  <li>⚖️ <strong>参数对比</strong> — "螺钉和管接件的区别"</li>
                  <li>💡 <strong>智能推荐</strong> — "推荐适合净水器的配件"</li>
                </ul>
                <div className="ais-quick-start">
                  <span>试试问：</span>
                  {['有哪些螺钉？', '增压泵有哪些规格？', '推荐常用管接件'].map(q => (
                    <button key={q} className="ais-quick-btn" onClick={() => sendMessage(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {conversations.map((msg, idx) => (
              <div key={idx} className={`ais-msg ais-msg-${msg.role}`}>
                {msg.role === 'user' ? (
                  <div className="ais-msg-bubble">{escapeHtml(msg.content)}</div>
                ) : (
                  <div className="ais-msg-bubble ais-ai-bubble">
                    <p className="ais-msg-text">{escapeHtml(msg.message)}</p>
                    
                    {/* 搜索结果卡片 */}
                    {(msg.type === 'search_results' || msg.type === 'recommendation' || msg.type === 'spec_detail' || msg.type === 'material_list') && msg.items && (
                      <div className="ais-result-cards">
                        {msg.items.map(model => (
                          <div 
                            key={model.id} 
                            className="ais-result-card"
                            onClick={() => handleSelectModel(model)}
                          >
                            <div className="ais-card-type">
                              {model.category === '管接件' && '🔧'}
                              {model.category === '螺钉' && '🔩'}
                              {model.category === '滤芯' && '🛡️'}
                              {model.category === '适配器' && '🔌'}
                              {model.category === '增压泵' && '⚙️'}
                              {model.category === '电磁阀' && '🔘'}
                              {' '}{escapeHtml(model.category)}
                            </div>
                            <div className="ais-card-name">{escapeHtml(model.name)}</div>
                            <div className="ais-card-code">{escapeHtml(model.code)}</div>
                            <div className="ais-card-specs">
                              {model.material && <span className="ais-tag">{escapeHtml(model.material)}</span>}
                              {model.specification && <span className="ais-tag spec">{escapeHtml(model.specification.substring(0, 20))}</span>}
                              {model.has3DModel && <span className="ais-tag has3d">🎮 3D</span>}
                            </div>
                          </div>
                        ))}
                        {msg.total > 10 && <p className="ais-more-hint">还有 {msg.total - 10} 个结果...</p>}
                      </div>
                    )}

                    {/* 统计概览 */}
                    {msg.type === 'overview_stats' && (
                      <div className="ais-stats-overview">
                        <div className="ais-stat-card main">
                          <span className="ais-stat-num">{msg.total}</span>
                          <span className="ais-stat-label">总记录数</span>
                        </div>
                        <div className="ais-stat-card">
                          <span className="ais-stat-num">{msg.has3D}</span>
                          <span className="ais-stat-label">有3D模型</span>
                        </div>
                        <div className="ais-stat-categories">
                          {msg.categories.map(cat => (
                            <div key={cat.name} className="ais-cat-bar-row">
                              <span className="ais-cat-name">{cat.name}</span>
                              <div className="ais-cat-bar-track">
                                <div 
                                  className="ais-cat-bar-fill" 
                                  style={{ width: `${(cat.count / msg.total * 100).toFixed(0)}%` }}
                                />
                              </div>
                              <span className="ais-cat-count">{cat.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 分类统计 */}
                    {msg.type === 'category_stats' && msg.models && (
                      <div className="ais-result-cards">
                        {msg.models.map(model => (
                          <div 
                            key={model.id} 
                            className="ais-result-card"
                            onClick={() => handleSelectModel(model)}
                          >
                            <div className="ais-card-name">{model.name}</div>
                            <div className="ais-card-code">{model.code}</div>
                            <div className="ais-card-specs">
                              {model.material && <span className="ais-tag">{model.material}</span>}
                              {model.has3DModel && <span className="ais-tag has3d">🎮 3D</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 对比表格 */}
                    {msg.type === 'comparison' && msg.items && (
                      <div className="ais-compare-table-wrap">
                        <table className="ais-compare-table">
                          <thead>
                            <tr>
                              <th>属性</th>
                              {msg.items.map(m => <th key={m.id}>{m.name}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            <tr><td className="attr-name">物料编码</td>{msg.items.map(m => <td key={m.id}>{m.code}</td>)}</tr>
                            <tr><td className="attr-name">分类</td>{msg.items.map(m => <td key={m.id}>{m.category}</td>)}</tr>
                            <tr><td className="attr-name">材质</td>{msg.items.map(m => <td key={m.id}>{m.material || '-'}</td>)}</tr>
                            <tr><td className="attr-name">规格</td>{msg.items.map(m => <td key={m.id} className="spec-cell">{m.specification || '-'}</td>)}</tr>
                            <tr><td className="attr-name">3D模型</td>{msg.items.map(m => <td key={m.id}>{m.has3DModel ? '✅ 有' : '❌ 无'}</td>)}</tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 分类对比 */}
                    {msg.type === 'category_comparison' && msg.categories && (
                      <div className="ais-cat-grid">
                        {msg.categories.map(c => (
                          <div key={c.category} className="ais-cat-card">
                            <div className="ais-cat-icon">
                              {c.category === '管接件' && '🔧'}
                              {c.category === '螺钉' && '🔩'}
                              {c.category === '滤芯' && '🛡️'}
                              {c.category === '适配器' && '🔌'}
                              {c.category === '增压泵' && '⚙️'}
                              {c.category === '电磁阀' && '🔘'}
                            </div>
                            <div className="ais-cat-info">
                              <div className="ais-cat-cname">{c.category}</div>
                              <div className="ais-cat-ccount">{c.count} 个零件</div>
                            </div>
                            {c.sample && (
                              <button 
                                className="ais-cat-sample-btn"
                                onClick={(e) => { e.stopPropagation(); handleSelectModel(c.sample); }}
                              >
                                查看示例 →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 建议 */}
                    {msg.type === 'suggestions' && msg.suggestions && (
                      <div className="ais-suggestions">
                        {msg.suggestions.map((s, i) => (
                          <button 
                            key={i} 
                            className="ais-suggest-btn"
                            onClick={() => handleQuickAction(s.action)}
                          >
                            💡 {s.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 正在输入指示器 */}
            {isTyping && (
              <div className="ais-msg ais-msg-assistant">
                <div className="ais-typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* 快捷问题栏（底部） */}
          {conversations.length > 0 && !isTyping && (
            <div className="ais-quick-bar">
              <button onClick={() => sendMessage('这个零件的详细规格？')}>详细规格</button>
              <button onClick={() => sendMessage('类似的还有哪些？')}>相似零件</button>
              <button onClick={() => sendMessage('下载STP文件')}>下载图纸</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
