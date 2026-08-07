import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  purifierDesignSpecs,
  dispenserDesignSpecs,
  countertopDesignSpecs
} from '../../data/waterApplianceData'
import SystemDesignAssistant from './SystemDesignAssistant'
import './WaterAppliancePanel.css'

// API 基地址（使用相对路径，通过 Vite proxy 转发到后端）
const API_BASE = '/api/wa-documents'

/**
 * 水家电设计选型参考面板（含文档管理）
 * 三条产品线：净水机 / 饮水机 / 台净（台式净水器）
 */
export default function WaterAppliancePanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('purifier')

  // 文档状态
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')

  // 拖拽状态
  const [dragOver, setDragOver] = useState(false)

  // AI 系统设计助手
  const [showAssistant, setShowAssistant] = useState(false)

  const fileInputRef = useRef(null)

  const tabs = [
    { id: 'purifier', ...purifierDesignSpecs },
    { id: 'dispenser', ...dispenserDesignSpecs },
    { id: 'countertop', ...countertopDesignSpecs }
  ]

  const currentData = tabs.find(t => t.id === activeTab) || tabs[0]
  const isPlaceholder = activeTab !== 'purifier'

  // ==================== 搜索状态 ====================
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(0)
  const searchInputRef = useRef(null)
  const searchWrapRef = useRef(null)

  // 构建可搜索数据源（按产品线 + 类别 + 文本）
  const searchableItems = useMemo(() => {
    const items = []
    const data = tabs.find(t => t.id === activeTab) || tabs[0]
    if (!data) return items
    // 产品分类
    ;(data.categories || []).forEach(cat => {
      items.push({
        id: `cat-${cat.id}`,
        section: '产品分类',
        sectionAnchor: 'wa-section-categories',
        name: cat.name,
        subName: (cat.subTypes || []).join(' · '),
        reason: cat.description,
        keywords: `${cat.name} ${cat.subTypes?.join(' ') || ''} ${cat.description || ''}`
      })
    })
    // 核心设计参数
    ;(data.coreParameters || []).forEach(group => {
      ;(group.items || []).forEach((item, idx) => {
        items.push({
          id: `param-${group.category}-${idx}`,
          section: '核心设计参数',
          sectionAnchor: 'wa-section-params',
          name: `${group.category} · ${item.param}`,
          subName: item.range,
          reason: item.note,
          keywords: `${item.param} ${item.range} ${item.note} ${group.category}`
        })
      })
    })
    // 滤芯配置（仅净水机）
    ;(data.filterConfigurations || []).forEach(f => {
      items.push({
        id: `filter-${f.stage}`,
        section: '滤芯配置',
        sectionAnchor: 'wa-section-filters',
        name: `第${f.stage}级 · ${f.name}`,
        subName: f.spec,
        reason: `${f.function}（寿命：${f.lifespan}）`,
        keywords: `${f.name} ${f.function} ${f.spec} ${f.replacementTip}`
      })
    })
    // 结构设计要点
    ;(data.structuralGuidelines || []).forEach((g, i) => {
      items.push({
        id: `guide-${i}`,
        section: '结构设计要点',
        sectionAnchor: 'wa-section-guidelines',
        name: g.title,
        subName: g.content.split('\n')[0]?.replace(/^[•\s]+/, '').slice(0, 60) || '',
        reason: g.priority === 'high' ? '重要规范' : g.priority === 'medium' ? '一般参考' : '可作参考',
        keywords: `${g.title} ${g.content}`
      })
    })
    // 接口标准
    ;(data.interfaceStandards || []).forEach((iface, i) => {
      const detail = iface.material || iface.pressure || iface.flow || iface.voltage || iface.rating || iface.trigger || iface.power || ''
      items.push({
        id: `iface-${i}`,
        section: '接口标准',
        sectionAnchor: 'wa-section-interfaces',
        name: iface.name,
        subName: iface.type,
        reason: detail,
        keywords: `${iface.name} ${iface.type} ${detail}`
      })
    })
    // 认证清单
    ;(data.certifications || []).forEach((cert, i) => {
      items.push({
        id: `cert-${i}`,
        section: '认证合规',
        sectionAnchor: 'wa-section-certs',
        name: cert.standard,
        subName: cert.scope,
        reason: cert.required ? '● 必需认证' : '○ 可选认证',
        keywords: `${cert.standard} ${cert.scope}`
      })
    })
    return items
  }, [activeTab, tabs])

  // 搜索匹配（精确 → 模糊），并按相关度排序
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const tokens = q.split(/\s+/).filter(Boolean)
    const scored = []
    for (const item of searchableItems) {
      const name = (item.name || '').toLowerCase()
      const subName = (item.subName || '').toLowerCase()
      const reason = (item.reason || '').toLowerCase()
      const keywords = (item.keywords || '').toLowerCase()
      let score = 0
      let matched = false
      for (const t of tokens) {
        if (name === t) { score += 100; matched = true }
        else if (name.includes(t)) { score += 50; matched = true }
        else if (subName.includes(t)) { score += 30; matched = true }
        else if (reason.includes(t)) { score += 20; matched = true }
        else if (keywords.includes(t)) { score += 10; matched = true }
        else {
          // 字符级模糊匹配（编辑距离 1~2）
          const distance = levenshtein(name, t)
          if (distance <= 2) { score += 5; matched = true }
        }
      }
      if (matched) scored.push({ ...item, score })
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 12)
  }, [searchQuery, searchableItems])

  // 编辑距离（限短字符串）
  function levenshtein(a, b) {
    if (!a || !b) return Math.max((a || '').length, (b || '').length)
    if (a.length > 30 || b.length > 30) return 99
    const m = a.length, n = b.length
    if (Math.abs(m - n) > 3) return 99
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
    return dp[m][n]
  }

  // 高亮匹配关键词
  function highlight(text, query) {
    const q = (query || '').trim()
    if (!q || !text) return text
    const tokens = q.split(/\s+/).filter(Boolean)
    const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(t => t.length >= 1)
    if (escapedTokens.length === 0) return text
    const re = new RegExp(`(${escapedTokens.join('|')})`, 'gi')
    const parts = String(text).split(re)
    return parts.map((p, i) =>
      re.test(p) ? <mark key={i} className="wa-search-highlight">{p}</mark> : <React.Fragment key={i}>{p}</React.Fragment>
    )
  }

  // 跳转到对应章节
  const handleSelectResult = (item) => {
    setSearchOpen(false)
    setSearchQuery('')
    searchInputRef.current?.blur()
    // 滚动到对应 anchor
    setTimeout(() => {
      const el = document.getElementById(item.sectionAnchor)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        el.classList.add('wa-section-flash')
        setTimeout(() => el.classList.remove('wa-section-flash'), 1600)
      }
    }, 100)
  }

  // 搜索框键盘事件
  const handleSearchKeyDown = (e) => {
    if (!searchOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSearchFocused(i => Math.min(i + 1, Math.max(0, searchResults.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSearchFocused(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = searchResults[searchFocused]
      if (target) handleSelectResult(target)
    } else if (e.key === 'Escape') {
      setSearchOpen(false)
      searchInputRef.current?.blur()
    }
  }

  // 点击外部关闭下拉
  useEffect(() => {
    function onDocClick(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // 切换 tab 时重置搜索
  useEffect(() => {
    setSearchQuery('')
    setSearchOpen(false)
    setSearchFocused(0)
  }, [activeTab])

  // ==================== 文档API ====================

  /** 加载文档列表 */
  const fetchDocuments = async (productLine) => {
    setLoadingDocs(true)
    try {
      const res = await fetch(`${API_BASE}/${productLine}/list`)
      const json = await res.json()
      if (json.success) {
        setDocuments(json.data.documents || [])
      } else {
        console.error('获取文档失败:', json.message)
        setDocuments([])
      }
    } catch (err) {
      console.error('请求文档列表异常:', err)
      setDocuments([])
    } finally {
      setLoadingDocs(false)
    }
  }

  /** 切换标签时加载对应文档 */
  useEffect(() => {
    fetchDocuments(activeTab)
  }, [activeTab])

  /** 上传文件 */
  const handleUploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return

    setUploading(true)
    setUploadError('')
    setUploadMessage(`正在上传 ${fileList.length} 个文件...`)

    const formData = new FormData()
    Array.from(fileList).forEach(file => {
      formData.append('files', file)
    })

    try {
      const res = await fetch(`${API_BASE}/${activeTab}/upload`, {
        method: 'POST',
        body: formData
      })

      const json = await res.json()

      if (json.success) {
        setUploadMessage(`✅ ${json.message}`)
        // 刷新文档列表
        fetchDocuments(activeTab)
        // 清空文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setUploadError(json.message || '上传失败')
        setUploadMessage('')
      }
    } catch (err) {
      console.error('上传异常:', err)
      setUploadError(`网络错误: ${err.message}`)
      setUploadMessage('')
    } finally {
      setUploading(false)
      setTimeout(() => { setUploadMessage(''); setUploadError('') }, 4000)
    }
  }

  /** 删除文档 */
  const handleDeleteDoc = async (filename) => {
    if (!window.confirm(`确定要删除「${filename}」吗？此操作不可恢复。`)) return

    try {
      const res = await fetch(`${API_BASE}/${activeTab}/delete/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      const json = await res.json()

      if (json.success) {
        fetchDocuments(activeTab) // 刷新列表
      } else {
        alert(`删除失败: ${json.message}`)
      }
    } catch (err) {
      alert(`删除出错: ${err.message}`)
    }
  }

  /** 获取下载链接 */
  const getDownloadUrl = (filename) => {
    return `${API_BASE}/${activeTab}/download/${encodeURIComponent(filename)}`
  }

  // ==================== 拖拽处理 ====================

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleUploadFiles(files)
    }
  }

  // ==================== 渲染 ====================

  return (
    <div className="wa-panel-overlay" onClick={onClose}>
      <div className="wa-panel-container" onClick={e => e.stopPropagation()}>
        {/* ========== 头部 ========== */}
        <div className="wa-panel-header">
          <div className="wa-header-left">
            <span className="wa-header-icon">💧</span>
            <div>
              <h2 className="wa-panel-title">水家电设计选型参考</h2>
              <p className="wa-panel-subtitle">
                Water Appliance Design Reference — 净水机 / 饮水机 / 台净 产品线设计规范
              </p>
            </div>
          </div>
          <button className="wa-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ========== 产品线标签切换 ========== */}
        <div className="wa-tab-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`wa-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                '--tab-color': tab.color,
                borderColor: activeTab === tab.id ? tab.color : undefined
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-emoji">{tab.icon}</span>
              <span className="tab-label">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* ========== 智能搜索框 ========== */}
        <div className="wa-search-bar">
          <div
            ref={searchWrapRef}
            className={`wa-search-wrap ${searchOpen ? 'open' : ''} ${searchQuery ? 'has-value' : ''}`}
            style={{ '--tab-color': currentData.color }}
          >
            <span className="wa-search-icon">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              className="wa-search-input"
              placeholder={`搜索${currentData.name}设计规范：型号、参数、滤芯、接口、认证…`}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); setSearchFocused(0) }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              aria-label="搜索设计规范"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                className="wa-search-clear"
                onClick={() => { setSearchQuery(''); setSearchFocused(0); searchInputRef.current?.focus() }}
                aria-label="清除搜索"
                title="清除"
              >×</button>
            )}
            <span className="wa-search-shortcut">↑↓ 选择 · Enter 确认 · Esc 关闭</span>
            <button
              className="wa-ai-assistant-btn"
              onClick={() => setShowAssistant(true)}
              title="AI 系统设计助手：多步推理 + 完整方案 + 交互式追问"
            >
              <span className="ai-icon">🤖</span>
              <span className="ai-label">AI 助手</span>
            </button>

            {/* 结果下拉面板 */}
            {searchOpen && (
              <div className="wa-search-dropdown" role="listbox">
                {!searchQuery.trim() && (
                  <div className="wa-search-empty-hint">
                    <span className="hint-icon">💡</span>
                    <div>
                      <div className="hint-title">输入关键词开始搜索</div>
                      <div className="hint-desc">支持型号（如 1000G）、参数（如 废水比 1:1）、组件（如 增压泵）、材料（如 ABS）等</div>
                      <div className="hint-tags">
                        {['1000G', 'RO膜', 'PP棉', '滤芯', 'IPX4', '废水比'].map(tag => (
                          <button
                            key={tag}
                            className="wa-search-suggest-tag"
                            onClick={() => { setSearchQuery(tag); setSearchFocused(0) }}
                          >{tag}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {searchQuery.trim() && searchResults.length === 0 && (
                  <div className="wa-search-no-result">
                    <span className="no-result-icon">🔍</span>
                    <div className="no-result-text">
                      <div className="no-result-title">未找到与「{searchQuery}」匹配的内容</div>
                      <div className="no-result-tip">试试其他关键词，或切换到其他产品线</div>
                    </div>
                  </div>
                )}
                {searchQuery.trim() && searchResults.length > 0 && (
                  <>
                    <div className="wa-search-results-head">
                      共 <strong>{searchResults.length}</strong> 条结果
                      <span className="wa-search-tip">点击或按 Enter 查看详情</span>
                    </div>
                    <ul className="wa-search-results-list">
                      {searchResults.map((item, idx) => (
                        <li
                          key={item.id}
                          className={`wa-search-result-item ${idx === searchFocused ? 'focused' : ''}`}
                          onMouseEnter={() => setSearchFocused(idx)}
                          onClick={() => handleSelectResult(item)}
                          role="option"
                          aria-selected={idx === searchFocused}
                        >
                          <div className="result-line1">
                            <span className="result-section-tag">{item.section}</span>
                            <span className="result-name">{highlight(item.name, searchQuery)}</span>
                          </div>
                          {item.subName && (
                            <div className="result-line2">
                              <code className="result-spec">{highlight(item.subName, searchQuery)}</code>
                            </div>
                          )}
                          {item.reason && (
                            <div className="result-line3">{highlight(item.reason, searchQuery)}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========== 主内容区 ========== */}
        <div className="wa-panel-body"
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}>

          {/* ---- 净水机完整内容 ---- */}
          {!isPlaceholder && (
            <div className="wa-content-full animate-fadeIn">
              {/* 产品分类体系 */}
              <section id="wa-section-categories" className="wa-section">
                <h3 className="section-title"><span className="title-icon">📂</span> 产品分类体系</h3>
                <div className="category-cards-grid">
                  {currentData.categories.map(cat => (
                    <div key={cat.id} className="category-card">
                      <div className="category-card-header">
                        <strong>{cat.name}</strong>
                        <span className="category-desc">{cat.description}</span>
                      </div>
                      <div className="sub-types-list">
                        {cat.subTypes.map((st, i) => (
                          <span key={i} className="sub-type-tag">{st}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 核心设计参数 */}
              <section id="wa-section-params" className="wa-section">
                <h3 className="section-title"><span className="title-icon">⚙️</span> 核心设计参数</h3>
                <div className="params-grid">
                  {currentData.coreParameters.map((group, gi) => (
                    <div key={gi} className="param-group-card">
                      <div className="param-group-header">{group.category}</div>
                      <table className="param-table">
                        <tbody>
                          {group.items.map((item, ii) => (
                            <tr key={ii}>
                              <td className="param-name">{item.param}</td>
                              <td className="param-value"><code>{item.range}</code></td>
                              <td className="param-note">{item.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </section>

              {/* 滤芯配置参考 */}
              <section id="wa-section-filters" className="wa-section">
                <h3 className="section-title"><span className="title-icon">🔧</span> 滤芯配置参考</h3>
                <div className="filter-config-table-wrapper">
                  <table className="filter-table">
                    <thead>
                      <tr><th>级数</th><th>滤芯名称</th><th>功能</th><th>规格</th><th>寿命</th><th>更换提示</th></tr>
                    </thead>
                    <tbody>
                      {currentData.filterConfigurations.map(f => (
                        <tr key={f.stage}>
                          <td className="stage-cell">第{f.stage}级</td>
                          <td><strong>{f.name}</strong></td>
                          <td>{f.function}</td>
                          <td><code>{f.spec}</code></td>
                          <td>{f.lifespan}</td>
                          <td className="tip-cell">{f.replacementTip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 结构设计要点 */}
              <section id="wa-section-guidelines" className="wa-section">
                <h3 className="section-title"><span className="title-icon">📐</span> 结构设计要点</h3>
                <div className="guidelines-list">
                  {currentData.structuralGuidelines.map((g, i) => (
                    <div key={i} className={`guideline-item priority-${g.priority}`}>
                      <div className="guideline-header">
                        <span className="priority-badge">{g.priority === 'high' ? '重要' : g.priority === 'medium' ? '一般' : '参考'}</span>
                        <strong>{g.title}</strong>
                      </div>
                      <pre className="guideline-content">{g.content}</pre>
                    </div>
                  ))}
                </div>
              </section>

              {/* 常用接口标准 */}
              <section id="wa-section-interfaces" className="wa-section">
                <h3 className="section-title"><span className="title-icon">🔌</span> 常用接口标准</h3>
                <div className="interface-grid">
                  {currentData.interfaceStandards.map((iface, i) => (
                    <div key={i} className="interface-item">
                      <span className="iface-name">{iface.name}</span>
                      <span className="iface-type">{iface.type}</span>
                      <span className="iface-detail">{iface.material || iface.pressure || iface.flow || iface.voltage || iface.rating || iface.trigger || iface.power}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 认证与合规清单 */}
              <section id="wa-section-certs" className="wa-section">
                <h3 className="section-title"><span className="title-icon">🏅</span> 认证与合规清单</h3>
                <div className="cert-list">
                  {currentData.certifications.map((cert, i) => (
                    <div key={i} className={`cert-item ${cert.required ? 'required' : 'optional'}`}>
                      <span className="cert-status">{cert.required ? '● 必需' : '○ 可选'}</span>
                      <span className="cert-standard">{cert.standard}</span>
                      <span className="cert-scope">{cert.scope}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ---- 饮水机/台净 占位内容 ---- */}
          {isPlaceholder && currentData.placeholderContent && (
            <div className="wa-content-placeholder animate-fadeIn">
              <div className="placeholder-hero">
                <span className="placeholder-big-icon">{currentData.icon}</span>
                <h3 className="placeholder-title">{currentData.placeholderContent.title}</h3>
                <p className="placeholder-message">{currentData.placeholderContent.message}</p>
              </div>

              <div className="placeholder-planned">
                <h4>📋 即将上线的模块内容：</h4>
                <ul className="planned-list">
                  {currentData.placeholderContent.plannedSections.map((section, i) => (
                    <li key={i}>
                      <span className="planned-index">{String(i + 1).padStart(2, '0')}</span>
                      {section}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="placeholder-categories">
                <h4>已规划产品分类：</h4>
                <div className="mini-cat-grid">
                  {currentData.categories.map(cat => (
                    <div key={cat.id} className="mini-cat-card">
                      <strong>{cat.name}</strong>
                      <div className="mini-subtypes">
                        {cat.subTypes.map((st, j) => (<span key={j}>{st}</span>))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 📎 文档管理区（所有产品线共用）==================== */}
          <div className="doc-management-section animate-fadeIn">
            <h3 className="doc-section-title">
              <span className="title-icon">📎</span>
              结构设计文档管理
              <span className="doc-product-line-badge" style={{ background: currentData.color }}>
                {currentData.name}
              </span>
            </h3>

            {/* ---- 上传区域 ---- */}
            <div
              className={`doc-upload-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar,.7z,.stp,.step,.igs,.iges"
                onChange={(e) => {
                  if (e.target.files.length > 0) handleUploadFiles(e.target.files)
                }}
                style={{ display: 'none' }}
              />

              {uploading ? (
                <div className="uploading-state">
                  <div className="upload-spinner"></div>
                  <span>{uploadMessage || '上传中...'}</span>
                </div>
              ) : dragOver ? (
                <div className="drop-hint">
                  <span className="drop-big-icon">📂</span>
                  <strong>释放以上传文件到【{currentData.name}】</strong>
                </div>
              ) : (
                <div className="upload-prompt">
                  <span className="upload-icon">📤</span>
                  <div className="upload-text-row">
                    <strong>点击或拖拽文件到此区域上传</strong>
                    <span className="upload-hint-text">
                      支持 PDF / Word / Excel / PPT / ZIP / STP 等格式，单文件最大 50MB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 上传反馈消息 */}
            {uploadMessage && !uploading && (
              <div className="upload-feedback success">{uploadMessage}</div>
            )}
            {uploadError && (
              <div className="upload-feedback error">{uploadError}</div>
            )}

            {/* ---- 文档列表 ---- */}
            <div className="doc-list-area">
              {loadingDocs ? (
                <div className="doc-loading">
                  <div className="mini-spinner"></div>
                  加载文档列表...
                </div>
              ) : documents.length === 0 ? (
                <div className="doc-empty">
                  <span className="empty-icon">📁</span>
                  <p>暂无文档</p>
                  <span className="empty-hint">上传结构设计文档后将在此显示</span>
                </div>
              ) : (
                <>
                  <div className="doc-list-header">
                    <span className="doc-count-info">
                      共 <strong>{documents.length}</strong> 个文档
                    </span>
                    <span className="doc-line-label">— 关联至【{currentData.name}】</span>
                  </div>
                  <div className="doc-list-table-wrapper">
                    <table className="doc-list-table">
                      <thead>
                        <tr>
                          <th>文件名</th>
                          <th>类型</th>
                          <th>大小</th>
                          <th>上传时间</th>
                          <th className="actions-col">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map(doc => (
                          <tr key={doc.id}>
                            <td className="doc-name-cell">
                              <span className={`doc-ext-icon ext-${doc.extension.toLowerCase()}`}>
                                {getFileIcon(doc.extension)}
                              </span>
                              <span className="doc-display-name" title={doc.name}>{doc.name}</span>
                            </td>
                            <td>
                              <span className="ext-tag">{doc.extension}</span>
                            </td>
                            <td className="doc-size-cell">{doc.sizeFormatted}</td>
                            <td className="doc-time-cell">{doc.uploadTimeFormatted}</td>
                            <td className="doc-actions-cell">
                              <a
                                href={getDownloadUrl(doc.filename)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="doc-action-btn download-btn"
                                title="下载文件"
                              >
                                ⬇️ 下载
                              </a>
                              <button
                                className="doc-action-btn delete-btn"
                                onClick={() => handleDeleteDoc(doc.filename)}
                                title="删除文件"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* ========== AI 系统设计助手浮层 ========== */}
        {showAssistant && <SystemDesignAssistant productLine={currentData.name} onClose={() => setShowAssistant(false)} />}

        {/* ========== 底部 ========== */}
        <div className="wa-panel-footer">
          <span className="footer-note">
            💡 设计规范基于行业通用标准 + 企业内部经验值整理，具体项目以最新版图纸为准 | 📎 支持上传结构设计文档进行集中管理
          </span>
        </div>
      </div>
    </div>
  )
}

/** 根据扩展名返回图标 */
function getFileIcon(ext) {
  const iconMap = {
    'PDF': '📄', 'DOC': '📝', 'DOCX': '📘',
    'XLS': '📊', 'XLSX': '📈',
    'PPT': '📽️', 'PPTX': '🎞️',
    'TXT': '📃', 'MD': '📋',
    'ZIP': '🗜️', 'RAR': '🗜️', '7Z': '🗜️',
    'STP': '🔧', 'STEP': '🔧', 'IGS': '🔧', 'IGES': '🔧'
  }
  return iconMap[ext.toUpperCase()] || '📎'
}
