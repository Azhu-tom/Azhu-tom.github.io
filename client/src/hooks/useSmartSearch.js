/**
 * useSmartSearch — 智能搜索 Hook
 *
 * 职责：
 *  - 管理查询词 query 与下拉面板 open 状态
 *  - 输入防抖（默认 300ms）后调用 POST /api/search/smart
 *  - 处理 loading / error 与过期请求（seq 竞态保护）
 *
 * 返回：
 *  - query / setQuery / open / setOpen
 *  - data / loading / error
 *  - scheduleSearch(text, history)   防抖搜索（用于输入联想）
 *  - immediateSearch(text, history)  立即搜索（用于回车 / 页面加载）
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { fetchSmartSearch } from '../utils/smartSearch'

export default function useSmartSearch({ scope = 'all', debounceMs = 300 } = {}) {
  const [query, setQuery] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)

  const timerRef = useRef(null)
  const seqRef = useRef(0)
  const scopeRef = useRef(scope)
  scopeRef.current = scope

  const runSearch = useCallback(async (text, history = []) => {
    const q = String(text || '').trim()
    if (!q) {
      seqRef.current += 1
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    const seq = ++seqRef.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetchSmartSearch({ query: q, scope: scopeRef.current, history })
      if (seq !== seqRef.current) return // 过期响应丢弃
      setData(res)
    } catch (e) {
      if (seq !== seqRef.current) return
      setError(e)
      setData(null)
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [])

  const scheduleSearch = useCallback((text, history = []) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runSearch(text, history), debounceMs)
  }, [runSearch, debounceMs])

  const immediateSearch = useCallback((text, history = []) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    runSearch(text, history)
  }, [runSearch])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return {
    query,
    setQuery,
    data,
    loading,
    error,
    open,
    setOpen,
    scheduleSearch,
    immediateSearch,
  }
}
