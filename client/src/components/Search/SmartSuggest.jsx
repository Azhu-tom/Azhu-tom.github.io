import React from 'react'
import { resultTypeIcon, resultTypeLabel } from '../../utils/smartSearch'
import './SmartSuggest.css'

/**
 * 智能联想下拉面板（Header 全局搜索 / 搜索结果页 / 模型库 AI 搜索 共用）
 *
 * props:
 *  - query:        当前输入关键词（用于底部「搜索 xxx」操作）
 *  - data:         后端 POST /api/search/smart 返回结构
 *  - loading / error: 请求状态
 *  - activeIndex:  键盘上下键高亮索引（可选，配合 flat 列表）
 *  - onSelect(item): 点击联想词或结果（item.type: 'suggestion' | 'result'）
 *  - onSearch(text): 提交完整搜索
 *
 * 面板内 flat 索引顺序：联想词（前5）→ 结果摘要（前3），与父组件键盘导航保持一致。
 */
export default function SmartSuggest({ query, data, loading, error, activeIndex = -1, onSelect, onSearch }) {
  const suggestions = (data?.suggestions || []).slice(0, 5).map((s, i) => ({ type: 'suggestion', text: s, _i: i }))
  const results = (data?.results || []).slice(0, 3).map((r, i) => ({
    type: 'result',
    result: r,
    _i: i + suggestions.length,
  }))

  return (
    <div className="ss-panel" onMouseDown={(e) => e.preventDefault()}>
      {/* 加载中 */}
      {loading && !data && (
        <div className="ss-loading">
          <span className="ss-loading-dot" />
          <span className="ss-loading-dot" />
          <span className="ss-loading-dot" />
          <em>智能检索中…</em>
        </div>
      )}

      {/* 后端不可用 */}
      {error && !loading && (
        <div className="ss-error">
          <span className="ss-error-icon">⚠️</span>
          <div>
            <p>智能搜索暂不可用</p>
            <p className="ss-error-sub">未能连接后端检索服务，请稍后重试</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* 纠错提示 */}
          {data.correction && (
            <div className="ss-correction">
              <span>您是不是想搜：</span>
              <button
                className="ss-correction-link"
                onClick={() => onSelect && onSelect({ type: 'suggestion', text: data.correction.corrected })}
              >
                {data.correction.corrected}
              </button>
            </div>
          )}

          {/* 联想词 */}
          {suggestions.length > 0 && (
            <div className="ss-group">
              <div className="ss-group-title">联想搜索</div>
              {suggestions.map(item => (
                <button
                  key={item.text}
                  className={`ss-row ${activeIndex === item._i ? 'active' : ''}`}
                  onClick={() => onSelect && onSelect(item)}
                >
                  <span className="ss-row-icon">🔍</span>
                  <span className="ss-row-text">{item.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* 结果摘要（按 type 分组展示图标/名称/分类） */}
          {results.length > 0 && (
            <div className="ss-group">
              <div className="ss-group-title">相关结果</div>
              {results.map(item => (
                <button
                  key={`${item.result.type}-${item.result.name}-${item._i}`}
                  className={`ss-row ss-result-row ${activeIndex === item._i ? 'active' : ''}`}
                  onClick={() => onSelect && onSelect(item)}
                >
                  <span className="ss-row-icon">
                    {resultTypeIcon(item.result.type, item.result.category)}
                  </span>
                  <span className="ss-row-main">
                    <span className="ss-row-text">{item.result.name}</span>
                    <span className="ss-row-sub">
                      {item.result.category || resultTypeLabel(item.result.type)}
                    </span>
                  </span>
                  <span className="ss-row-arrow">→</span>
                </button>
              ))}
            </div>
          )}

          {/* 底部完整搜索入口 */}
          {query && (
            <div className="ss-footer">
              <button className="ss-search-all" onClick={() => onSearch && onSearch(query)}>
                搜索「{query}」<span className="ss-search-arrow">→</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
