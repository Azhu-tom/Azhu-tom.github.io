import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSmartSearch from '../../hooks/useSmartSearch'
import { enrichResult, getResultTarget } from '../../utils/smartSearch'
import SmartSuggest from './SmartSuggest'
import './GlobalSearch.css'

/**
 * 全局智能搜索框（内嵌于 Header 顶部导航）
 *
 * 功能：
 *  - 输入即实时联想：防抖 300ms 调 POST /api/search/smart（scope=all）
 *  - 回车跳转搜索结果页 /search?q=xxx
 *  - 快捷键 / 或 Ctrl+K 聚焦（不与其他输入框冲突）
 *  - 响应式：窄屏（≤860px）隐藏为 🔍 图标按钮，点击展开移动端搜索条
 */
export default function GlobalSearch() {
  const navigate = useNavigate()
  const {
    query,
    setQuery,
    data,
    loading,
    error,
    open,
    setOpen,
    scheduleSearch,
  } = useSmartSearch({ scope: 'all', debounceMs: 300 })

  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const desktopInputRef = useRef(null)
  const mobileInputRef = useRef(null)
  const rootRef = useRef(null)

  // 拉平列表（联想词 + 结果摘要），用于键盘上下键导航，顺序与 SmartSuggest 一致
  const flat = useMemo(() => {
    const sugs = (data?.suggestions || []).slice(0, 5)
    const res = (data?.results || []).slice(0, 3).map(enrichResult)
    return [
      ...sugs.map((s, i) => ({ type: 'suggestion', text: s, _i: i })),
      ...res.map((r, i) => ({ type: 'result', result: r, _i: i + sugs.length })),
    ]
  }, [data])

  // 全局快捷键：/ 或 Ctrl+K 聚焦搜索框
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target.tagName || '').toLowerCase()
      const editable = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable
      const isK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'
      const isSlash = e.key === '/' && !editable && !e.ctrlKey && !e.metaKey && !e.altKey
      if (isK || isSlash) {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 点击面板外部关闭
  useEffect(() => {
    if (!open && !mobileOpen) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, mobileOpen])

  // 数据更新后，若高亮索引越界则修正
  useEffect(() => {
    if (data && activeIndex >= flat.length) {
      setActiveIndex(flat.length ? flat.length - 1 : -1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const openSearch = useCallback(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches
    if (isMobile) {
      setMobileOpen(true)
      requestAnimationFrame(() => mobileInputRef.current && mobileInputRef.current.focus())
    } else {
      setMobileOpen(false)
      requestAnimationFrame(() => desktopInputRef.current && desktopInputRef.current.focus())
    }
  }, [])

  const handleInputChange = (val) => {
    setQuery(val)
    setActiveIndex(-1)
    if (val.trim()) {
      setOpen(true)
      scheduleSearch(val)
    } else {
      setOpen(false)
    }
  }

  const doSearch = (term) => {
    const q = (term || query).trim()
    if (!q) return
    setOpen(false)
    setMobileOpen(false)
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const handleSelect = (item) => {
    if (item.type === 'suggestion') {
      const text = item.text
      setQuery(text)
      setActiveIndex(-1)
      doSearch(text)
    } else {
      const target = getResultTarget(item.result)
      setOpen(false)
      setMobileOpen(false)
      if (target) navigate(target.path, { state: target.state })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && flat[activeIndex]) {
        handleSelect(flat[activeIndex])
      } else {
        doSearch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (flat.length ? (i + 1) % flat.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (flat.length ? (i - 1 + flat.length) % flat.length : -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setMobileOpen(false)
    }
  }

  const renderInput = (ref, isMobile) => (
    <>
      <span className="gs-icon">🔍</span>
      <input
        ref={ref}
        type="text"
        className="gs-input"
        placeholder="搜索水家电、模型、工具…"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (query.trim()) setOpen(true) }}
        aria-label="全局智能搜索"
      />
      {!isMobile && <span className="gs-kbd">Ctrl K</span>}
      {query && (
        <button
          className="gs-clear"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { setQuery(''); setOpen(false); setActiveIndex(-1); ref.current && ref.current.focus() }}
          title="清除"
        >✕</button>
      )}
    </>
  )

  return (
    <div className="gs-root" ref={rootRef}>
      {/* 桌面 / 平板：内联搜索框 */}
      <div className="gs-box">
        {renderInput(desktopInputRef, false)}
      </div>

      {/* 窄屏：🔍 图标按钮 */}
      <button className="gs-toggle" onClick={openSearch} aria-label="搜索" title="搜索（Ctrl K）">🔍</button>

      {/* 窄屏：展开的搜索条 + 联想面板 */}
      {mobileOpen && (
        <div className="gs-mobile-bar">
          <div className="gs-box gs-mobile-box">
            {renderInput(mobileInputRef, true)}
          </div>
          {open && (
            <SmartSuggest
              query={query}
              data={data}
              loading={loading}
              error={error}
              activeIndex={activeIndex}
              onSelect={handleSelect}
              onSearch={doSearch}
            />
          )}
        </div>
      )}

      {/* 桌面：联想下拉 */}
      {open && !mobileOpen && (
        <SmartSuggest
          query={query}
          data={data}
          loading={loading}
          error={error}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          onSearch={doSearch}
        />
      )}
    </div>
  )
}
