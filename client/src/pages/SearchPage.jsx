import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useSmartSearch from '../hooks/useSmartSearch'
import SmartSuggest from '../components/Search/SmartSuggest'
import {
  fetchSmartSearch,
  enrichResult,
  getResultTarget,
  resultTypeIcon,
  resultTypeLabel,
  intentLabel,
} from '../utils/smartSearch'
import './SearchPage.css'

/* ==================== 内部渲染组件 ==================== */

/** 聊天式回答卡片（intent === 'chat'） */
function ChatCard({ result }) {
  const results = result.results || []
  return (
    <div className="sp-chat-card">
      <div className="sp-chat-avatar">🤖</div>
      <div className="sp-chat-body">
        <div className="sp-chat-name">AI 助手</div>
        <div className="sp-chat-bubble">
          <p>{result.summary || '根据您的问题，为您整理了以下相关信息：'}</p>
          {results.length > 0 && (
            <div className="sp-chat-chips">
              {results.slice(0, 6).map((r, i) => (
                <span key={i} className="sp-chip">{r.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** 双列对比卡片（intent === 'compare'） */
function CompareCards({ results, onOpen }) {
  const pair = results.slice(0, 2)
  return (
    <div className="sp-compare-block">
      <div className="sp-compare-head">
        <span className="sp-compare-badge">⚖️ 参数对比</span>
        {pair.length === 2 && <span className="sp-vs">VS</span>}
      </div>
      <div className="sp-compare-grid">
        {pair.map((r, i) => (
          <div key={i} className="sp-compare-card" onClick={() => onOpen(r)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(r) }}>
            <div className="sp-cmp-icon">{resultTypeIcon(r.type, r.category)}</div>
            <div className="sp-cmp-name">{r.name}</div>
            <span className={`sp-rc-badge sp-rc-${r.type}`}>{r.category || resultTypeLabel(r.type)}</span>
            {r.reason && <p className="sp-cmp-reason">{r.reason}</p>}
            <div className="sp-cmp-meta">
              {r._localModel && (
                <>
                  {r._localModel.code && (
                    <div className="sp-cmp-meta-row"><span>编码</span><code>{r._localModel.code}</code></div>
                  )}
                  {r._localModel.material && (
                    <div className="sp-cmp-meta-row"><span>材质</span><b>{r._localModel.material}</b></div>
                  )}
                  {r._localModel.specification && (
                    <div className="sp-cmp-meta-row"><span>规格</span><span>{r._localModel.specification.substring(0, 40)}</span></div>
                  )}
                  {r._localModel.has3DModel && (
                    <div className="sp-cmp-meta-row"><span>3D模型</span><b className="sp-has3d">✅ 有</b></div>
                  )}
                </>
              )}
              {!r._localModel && r.meta && Object.keys(r.meta).length > 0 &&
                Object.entries(r.meta).slice(0, 4).map(([k, v]) => (
                  <div className="sp-cmp-meta-row" key={k}><span>{k}</span><b>{String(v)}</b></div>
                ))}
            </div>
            <span className="sp-rc-action">查看详情 →</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 统计数字卡片（intent === 'stats'） */
function StatsCards({ result, results }) {
  return (
    <div className="sp-stats-block">
      {result.summary && (
        <div className="sp-stats-head">
          <span className="sp-stats-head-icon">📊</span>
          <p>{result.summary}</p>
        </div>
      )}
      <div className="sp-stats-grid">
        {results.map((r, i) => {
          const num = r.meta?.count ?? r.meta?.total ?? (typeof r.confidence === 'number' ? `${Math.round(r.confidence * 100)}%` : null)
          return (
            <div key={i} className="sp-stat-card">
              <div className="sp-stat-num">{num ?? '—'}</div>
              <div className="sp-stat-label">{r.name}</div>
              {r.reason && <div className="sp-stat-sub">{r.reason}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 单条结果卡片（默认列表） */
function ResultCard({ r, onOpen }) {
  const local = r._localModel
  const showMeta = local || (r.meta && (r.meta.code || r.meta.material || r.meta.specification || r.meta.spec))
  return (
    <div className="sp-result-card" onClick={() => onOpen(r)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(r) }}>
      <div className="sp-rc-icon">{resultTypeIcon(r.type, r.category)}</div>
      <div className="sp-rc-body">
        <div className="sp-rc-top">
          <span className="sp-rc-name">{r.name}</span>
          <span className={`sp-rc-badge sp-rc-${r.type}`}>{r.category || resultTypeLabel(r.type)}</span>
        </div>
        {r.reason && <p className="sp-rc-reason">{r.reason}</p>}
        {showMeta && (
          <div className="sp-rc-meta">
            {(local?.code || r.meta?.code) && <code>{local?.code || r.meta.code}</code>}
            {(local?.material || r.meta?.material) && <span className="sp-tag">{local?.material || r.meta.material}</span>}
            {(local?.specification || r.meta?.specification || r.meta?.spec) && (
              <span className="sp-tag spec">{(local?.specification || r.meta?.specification || r.meta?.spec).substring(0, 24)}</span>
            )}
            {(local?.has3DModel || r.meta?.has3DModel) && <span className="sp-tag has3d">🎮 3D</span>}
          </div>
        )}
        {typeof r.confidence === 'number' && (
          <div className="sp-rc-conf">
            <div className="sp-conf-track">
              <div className="sp-conf-fill" style={{ width: `${Math.min(100, Math.round(r.confidence * 100))}%` }} />
            </div>
            <span className="sp-conf-label">{Math.round(r.confidence * 100)}% 匹配</span>
          </div>
        )}
        <span className="sp-rc-action">查看详情 →</span>
      </div>
    </div>
  )
}

/* ==================== 主页面 ==================== */

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = (searchParams.get('q') || '').trim()

  // 顶部搜索框：输入联想（防抖 300ms）
  const {
    query: input,
    setQuery: setInput,
    data: suggestData,
    loading: suggestLoading,
    error: suggestError,
    open: suggestOpen,
    setOpen: setSuggestOpen,
    scheduleSearch,
  } = useSmartSearch({ scope: 'all', debounceMs: 300 })

  // 完整搜索结果（由 URL ?q= 驱动）
  const [result, setResult] = useState(null)
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)

  // URL q 变化 → 同步输入框并立即完整搜索
  useEffect(() => {
    setInput(q)
    if (!q) {
      setResult(null)
      setResultLoading(false)
      setResultError(null)
      return
    }
    let cancelled = false
    setResultLoading(true)
    setResultError(null)
    fetchSmartSearch({ query: q, scope: 'all' })
      .then(res => { if (!cancelled) setResult(res) })
      .catch(e => { if (!cancelled) setResultError(e) })
      .finally(() => { if (!cancelled) setResultLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const enrichedResults = useMemo(() => (result?.results || []).map(enrichResult), [result])
  const enrichedRecs = useMemo(() => (result?.recommendations || []).map(enrichResult), [result])

  // 顶部联想 flat 列表（键盘导航）
  const flat = useMemo(() => {
    const sugs = (suggestData?.suggestions || []).slice(0, 5)
    const res = (suggestData?.results || []).slice(0, 3).map(enrichResult)
    return [
      ...sugs.map((s, i) => ({ type: 'suggestion', text: s, _i: i })),
      ...res.map((r, i) => ({ type: 'result', result: r, _i: i + sugs.length })),
    ]
  }, [suggestData])

  useEffect(() => {
    if (suggestData && activeIndex >= flat.length) {
      setActiveIndex(flat.length ? flat.length - 1 : -1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestData])

  const handleInputChange = (val) => {
    setInput(val)
    setActiveIndex(-1)
    if (val.trim()) {
      setSuggestOpen(true)
      scheduleSearch(val)
    } else {
      setSuggestOpen(false)
    }
  }

  const submitSearch = (term) => {
    const t = (term || input).trim()
    if (!t) return
    setSuggestOpen(false)
    setActiveIndex(-1)
    setSearchParams({ q: t }, { replace: true })
  }

  const openResult = (r) => {
    const target = getResultTarget(r)
    if (target) navigate(target.path, { state: target.state })
  }

  const handleSelect = (item) => {
    if (item.type === 'suggestion') {
      submitSearch(item.text)
    } else {
      openResult(item.result)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && flat[activeIndex]) {
        handleSelect(flat[activeIndex])
      } else {
        submitSearch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (flat.length ? (i + 1) % flat.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (flat.length ? (i - 1 + flat.length) % flat.length : -1))
    } else if (e.key === 'Escape') {
      setSuggestOpen(false)
    }
  }

  const renderSuggestTags = (suggestions) => (
    <div className="sp-tag-cloud">
      {suggestions.map((s, i) => (
        <button key={i} className="sp-tag-cloud-btn" onClick={() => submitSearch(s)}>{s}</button>
      ))}
    </div>
  )

  return (
    <div className="search-page animate-fadeIn">
      {/* 顶部大搜索框 */}
      <div className="sp-header">
        <h1 className="sp-title">🔍 智能搜索</h1>
        <p className="sp-subtitle">搜索水家电、模型库、设计工具，支持自然语言提问</p>
      </div>

      <div className="sp-searchbox-wrap">
        <div className="sp-searchbox">
          <span className="sp-search-icon">🔍</span>
          <input
            ref={inputRef}
            className="sp-search-input"
            type="text"
            placeholder="输入问题，如：夏天用什么净水器比较好？"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (input.trim()) setSuggestOpen(true) }}
            autoFocus
            aria-label="智能搜索关键词"
          />
          {input && (
            <button
              className="sp-clear"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setInput(''); setSuggestOpen(false); inputRef.current && inputRef.current.focus() }}
              title="清除"
            >✕</button>
          )}
          <button className="sp-submit-btn" onClick={() => submitSearch()}>搜索</button>
        </div>

        {suggestOpen && (
          <SmartSuggest
            query={input}
            data={suggestData}
            loading={suggestLoading}
            error={suggestError}
            activeIndex={activeIndex}
            onSelect={handleSelect}
            onSearch={submitSearch}
          />
        )}
      </div>

      {/* 结果区 */}
      {!q && !resultLoading && (
        <div className="sp-empty">
          <div className="sp-empty-icon">💡</div>
          <h3>输入关键词开始智能搜索</h3>
          <p>支持自然语言提问，如「RO反渗透纯水机参数」「推荐适合净水器的配件」</p>
          <div className="sp-hot-tags">
            {['RO反渗透纯水机', '增压泵', '滤芯', '管接件', '净水机设计规范'].map(t => (
              <button key={t} onClick={() => submitSearch(t)}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* 加载中：骨架屏 */}
      {resultLoading && (
        <div className="sp-skeleton">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="sp-skel-card">
              <div className="sp-skel-icon shimmer" />
              <div className="sp-skel-body">
                <div className="sp-skel-line shimmer" style={{ width: '55%' }} />
                <div className="sp-skel-line shimmer" style={{ width: '88%' }} />
                <div className="sp-skel-line shimmer" style={{ width: '35%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 后端不可用 */}
      {!resultLoading && resultError && (
        <div className="sp-empty">
          <div className="sp-empty-icon">⚠️</div>
          <h3>智能搜索暂不可用</h3>
          <p>{resultError.message || '未能连接后端检索服务，请稍后重试'}</p>
        </div>
      )}

      {/* 有结果 */}
      {!resultLoading && !resultError && result && (
        <div className="sp-results">
          {/* 查询元信息 */}
          <div className="sp-meta-line">
            <span>关键词：<strong>{result.keywords?.join('、') || q}</strong></span>
            {result.intent && <span className="sp-meta-intent">意图：{intentLabel(result.intent)}</span>}
            <span className="sp-source">
              {result.source === 'llm' ? '✨ AI 智能回答' : '📦 本地匹配'}
            </span>
          </div>

          {/* 纠错提示 */}
          {result.correction && (
            <div className="sp-correction">
              <span>您是不是想搜：</span>
              <button onClick={() => submitSearch(result.correction.corrected)}>{result.correction.corrected}</button>
              <span className="sp-correction-arrow">点击切换 →</span>
            </div>
          )}

          {/* 按意图渲染 */}
          {result.intent === 'chat' && <ChatCard result={result} />}
          {result.intent === 'compare' && <CompareCards results={enrichedResults} onOpen={openResult} />}
          {result.intent === 'stats' && <StatsCards result={result} results={enrichedResults} />}

          {/* 默认结果列表 */}
          {result.intent !== 'chat' && result.intent !== 'compare' && result.intent !== 'stats' && (
            <>
              {enrichedResults.length > 0 ? (
                <div className="sp-result-list">
                  {enrichedResults.map((r, i) => (
                    <ResultCard key={`${r.type}-${r.name}-${i}`} r={r} onOpen={openResult} />
                  ))}
                </div>
              ) : (
                <div className="sp-empty">
                  <div className="sp-empty-icon">🔍</div>
                  <h3>没有找到「{q}」的相关结果</h3>
                  <p>试试换个关键词，或点击下方联想</p>
                  {result.suggestions?.length > 0 && renderSuggestTags(result.suggestions)}
                </div>
              )}
            </>
          )}

          {/* 为您推荐（横滑卡片） */}
          {enrichedRecs.length > 0 && (
            <section className="sp-section">
              <h3 className="sp-section-title">💡 为您推荐</h3>
              <div className="sp-reco-scroll">
                {enrichedRecs.map((r, i) => (
                  <div key={i} className="sp-reco-card" onClick={() => openResult(r)} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') openResult(r) }}>
                    <span className="sp-reco-icon">{resultTypeIcon(r.type, r.category)}</span>
                    <span className="sp-reco-name">{r.name}</span>
                    <span className="sp-reco-sub">{r.category || resultTypeLabel(r.type)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 相关搜索标签云 */}
          {result.suggestions?.length > 0 && (
            <section className="sp-section">
              <h3 className="sp-section-title">🔗 相关搜索</h3>
              {renderSuggestTags(result.suggestions)}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
