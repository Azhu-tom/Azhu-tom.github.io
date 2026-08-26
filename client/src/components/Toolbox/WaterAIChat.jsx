import React, { useState, useEffect, useRef, useCallback } from 'react'
import useFullscreen from '../../utils/useFullscreen'
import './WaterAIChat.css'

/**
 * 水家电 AI 智能问答助手
 * - 接入 deepseek-v4-flash（后端 /api/ai/chat 代理）
 * - 支持本地规范库（内置规范 + 上传文档）+ 联网搜索 综合回答
 * - 多轮上下文对话，保留历史
 * - 回答标注数据来源
 */
const API_URL = '/api/ai/chat'

// 简易 Markdown 渲染（支持标题/表格/加粗/列表/引用/代码块/换行）
function renderMarkdown(md) {
  if (!md) return ''
  let html = md
    // 转义 HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // 代码块
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (m, lang, code) => `<pre class="waai-code-block">${code.trim()}</pre>`)
    // 标题
    .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^## (.*)$/gm, '<h3>$1</h3>')
    .replace(/^# (.*)$/gm, '<h3>$1</h3>')
    // 表格
    .replace(/\n?((\|[^\n]*\|)\n(\|[\s:\-|]*\|)\n((\|[^\n]*\|)\n?)+)/g, (m, tableBlock) => {
      const rows = tableBlock.trim().split('\n').filter(l => l.trim())
      const parseRow = (line) => {
        const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
        return cells.map(c => `<td>${c || '&nbsp;'}</td>`).join('')
      }
      let out = '<div class="waai-table-wrap"><table class="waai-table">'
      rows.forEach((row, i) => {
        // 跳过分隔行
        if (/^[\s:|\-]+$/.test(row)) return
        const tag = i === 0 ? 'th' : 'td'
        const cells = row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
        out += `<tr>${cells.map(c => `<${tag}>${c || '&nbsp;'}</${tag}>`).join('')}</tr>`
      })
      out += '</table></div>'
      return out
    })
    // 引用
    .replace(/^&gt; ?(.*)$/gm, '<blockquote>$1</blockquote>')
    // 无序列表
    .replace(/^[•·\-*] (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)\n?/g, (m, li) => `<ul>${li}</ul>`)
    // 加粗
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 换行（保留段落）
    .replace(/\n{2,}/g, '\n')
  // 简单包装段落
  const lines = html.split('\n')
  html = lines.map(l => {
    const t = l.trim()
    if (!t) return ''
    if (/^<[h|u|p|b|t|p|li|pre|div]/.test(t) || /<\/[h|u|p|b|t|p|li|pre|div]>$/.test(t)) return l
    return `<p>${l}</p>`
  }).join('\n')
  return html
}

export default function WaterAIChat({ onClose, productLine = 'purifier', productLineName = '净水机', initialQuestion = '', builtinSpecText = '' }) {
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      kind: 'intro',
      content: `你好，我是「${productLineName}」AI 设计助手（DeepSeek 智能引擎）。

我可以结合**本地设计规范**（内置规范 + 已上传的文档）与**联网行业资料**，回答你的结构设计问题，例如：
- "400G 滤芯设计，给出壁厚和结构参数"
- "RO 膜壳螺纹规格和密封圈选型"
- "净水机水路接口的标准尺寸"
- "外壳材料 ABS 与 PP 的壁厚推荐"

请直接输入你的设计问题。`
    }
  ])
  const [input, setInput] = useState(initialQuestion || '')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState('')
  // 后端连通状态：'checking' | 'ok' | 'fail'
  const [backendStatus, setBackendStatus] = useState('checking')
  const [backendInfo, setBackendInfo] = useState(null) // {model, localDocs}
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  // 全屏 hook（跨浏览器兼容，自动同步状态）
  const fullscreen = useFullscreen()
  // 全屏错误提示
  const [fsError, setFsError] = useState('')

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking])

  // 聚焦输入框
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  // 浮层打开时检测后端连通状态
  useEffect(() => {
    let cancelled = false
    const t0 = Date.now()
    fetch('/api/ai/health', { method: 'GET' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(d => {
        if (cancelled) return
        if (d && d.success) {
          setBackendStatus('ok')
          setBackendInfo({ model: d.model, localDocs: d.localDocs })
        } else {
          setBackendStatus('fail')
        }
      })
      .catch(() => {
        if (cancelled) return
        setBackendStatus('fail')
      })
    return () => { cancelled = true }
  }, [])

  // 携带初始问题
  useEffect(() => {
    if (initialQuestion && messages.length === 1 && backendStatus === 'ok') {
      handleSend(initialQuestion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendStatus])

  // 全屏切换（含错误处理）
  const handleToggleFullscreen = useCallback(async () => {
    if (!fullscreen.supported) {
      setFsError('当前浏览器不支持全屏 API')
      setTimeout(() => setFsError(''), 3000)
      return
    }
    try {
      await fullscreen.toggle(panelRef.current)
      setFsError('')
    } catch (e) {
      setFsError(e.message || '全屏切换失败')
      setTimeout(() => setFsError(''), 3000)
    }
  }, [fullscreen])

  // F 键快捷切换全屏（焦点不在输入框时）
  useEffect(() => {
    const handler = (e) => {
      // 跳过组合键（F11 / Ctrl+F / 输入框内）
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (e.key !== 'f' && e.key !== 'F') return
      const tag = (e.target?.tagName || '').toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return
      e.preventDefault()
      handleToggleFullscreen()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleToggleFullscreen])

  async function handleSend(text) {
    const q = (text ?? input).trim()
    if (!q || thinking) return
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: q }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setThinking(true)
    setError('')

    try {
      // 传给后端：完整对话历史 + 产品线 + 内置规范文本
      const apiHistory = newHistory
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productLine,
          builtinSpecText,
          messages: apiHistory
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          sources: data.sources || []
        }])
      } else {
        setError(data.message || 'AI 回复失败，请重试')
      }
    } catch (e) {
      // 友好错误提示（Failed to fetch 通常是后端未启动）
      let msg = e.message || '未知错误'
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        msg = '无法连接到后端服务（端口 8080）。请确认后端服务已启动：在 server 目录运行 node server.js'
      }
      setError(`网络错误：${msg}`)
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="waai-overlay" onClick={onClose}>
      <div ref={panelRef} className="waai-panel" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="waai-header">
          <div className="waai-header-left">
            <span className="waai-logo">AI</span>
            <div>
              <h3 className="waai-title">AI 设计助手 · {productLineName}</h3>
              <p className="waai-sub">DeepSeek 智能引擎 · 本地规范 + 联网资料 综合回答</p>
            </div>
          </div>
          <div className="waai-header-actions">
            {/* 全屏切换按钮（也响应 F 键） */}
            <button
              className="waai-fullscreen-btn"
              onClick={handleToggleFullscreen}
              title={
                fullscreen.supported
                  ? (fullscreen.isFullscreen ? '退出全屏（F 键 / Esc）' : '进入全屏（F 键）')
                  : '当前浏览器不支持全屏 API'
              }
              disabled={!fullscreen.supported}
            >
              {fullscreen.isFullscreen ? (
                // 退出全屏图标（四个角向内）
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 3v6H3M21 9h-6V3M15 21v-6h6M3 15h6v6" />
                </svg>
              ) : (
                // 进入全屏图标（四个角向外）
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
                </svg>
              )}
            </button>
            <button className="waai-close" onClick={onClose} title="关闭">×</button>
          </div>
        </div>

        {/* 全屏错误提示（自动消失） */}
        {fsError && (
          <div className="waai-fs-error">{fsError}</div>
        )}

        {/* 后端连通状态横幅 */}
        {backendStatus === 'fail' && (
          <div className="waai-backend-banner error">
            <span className="waai-banner-icon">●</span>
            <div className="waai-banner-text">
              <strong>未连接到 AI 后端服务（端口 8080）</strong>
              <span>请在本机启动后端：打开 PowerShell，cd 到 <code>结构工程师AI助手\server</code> 目录，执行 <code>node server.js</code></span>
            </div>
          </div>
        )}
        {backendStatus === 'ok' && backendInfo && (
          <div className="waai-backend-banner ok">
            <span className="waai-banner-icon">●</span>
            <span>已连接 AI 服务 · 模型 {backendInfo.model} · 本地文档 {Object.values(backendInfo.localDocs || {}).reduce((a, b) => a + b, 0)} 个</span>
          </div>
        )}
        {backendStatus === 'checking' && (
          <div className="waai-backend-banner checking">
            <span className="waai-banner-icon">●</span>
            <span>正在检测 AI 后端服务…</span>
          </div>
        )}

        {/* 消息区 */}
        <div className="waai-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`waai-msg ${msg.role === 'user' ? 'user' : 'assistant'}`}>
              {msg.role === 'assistant' && <span className="waai-avatar">AI</span>}
              <div className="waai-bubble">
                {msg.role === 'assistant' ? (
                  <div className="waai-markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  <div className="waai-user-text">{msg.content}</div>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="waai-sources">
                    <span className="waai-sources-label">数据来源：</span>
                    {msg.sources.map((s, i) => (
                      <span key={i} className={`waai-source-tag ${s.type === '本地规范' ? 'local' : 'web'}`}>
                        {s.type} · {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="waai-msg assistant">
              <span className="waai-avatar">AI</span>
              <div className="waai-bubble waai-thinking">
                <span className="waai-dot" />
                <span className="waai-dot" />
                <span className="waai-dot" />
                <span className="waai-thinking-text">正在检索本地规范与联网资料，综合分析中…</span>
              </div>
            </div>
          )}

          {error && <div className="waai-error">{error}</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div className="waai-input-area">
          <div className="waai-input-row">
            <input
              ref={inputRef}
              type="text"
              className="waai-input"
              placeholder="输入设计问题，如：400G滤芯壁厚多少？"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
              disabled={thinking}
            />
            <button
              className="waai-send"
              onClick={() => handleSend()}
              disabled={thinking || !input.trim() || backendStatus !== 'ok'}
              title={backendStatus !== 'ok' ? '后端服务未连接，请先启动' : ''}
            >
              {thinking ? '分析中…' : '发送'}
            </button>
          </div>
          <div className="waai-hint">
            AI 会先检索本地设计规范（含已上传文档），再结合联网行业资料综合回答，并标注数据来源。
          </div>
        </div>
      </div>
    </div>
  )
}
