import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 跨浏览器 Fullscreen API 兼容 hook
 * - 处理 webkit / moz / ms 前缀差异
 * - 监听 fullscreenchange 事件同步状态
 * - 暴露 enter / exit / toggle / isFullscreen / supported
 */

const REQUEST = ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen', 'msRequestFullscreen']
const EXIT    = ['exitFullscreen', 'webkitExitFullscreen', 'mozCancelFullScreen', 'msExitFullscreen']
const ELEMENT = ['fullscreenElement', 'webkitFullscreenElement', 'mozFullScreenElement', 'msFullscreenElement']
const ENABLED = ['fullscreenEnabled', 'webkitFullscreenEnabled', 'mozFullScreenEnabled', 'msFullscreenEnabled']
const EVENT   = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
const ERR_EVENT = ['fullscreenerror', 'webkitfullscreenerror', 'mozfullscreenerror', 'MSFullscreenError']

function pickFn(host, list) {
  for (const m of list) if (host && typeof host[m] === 'function') return m
  return null
}
function pickProp(list) {
  for (const p of list) if (p in document) return p
  return null
}

// 检测 API 支持（模块加载时计算一次）
function detectSupport() {
  const fn = pickFn(document.documentElement, REQUEST)
  if (!fn) return false
  const enabledProp = pickProp(ENABLED)
  if (enabledProp && document[enabledProp] === false) return false
  return true
}

const IS_SUPPORTED = detectSupport()

export default function useFullscreen() {
  const elProp = pickProp(ELEMENT)
  const evName = pickProp(EVENT)
  const errEvName = pickProp(ERR_EVENT)

  const [isFullscreen, setIsFullscreen] = useState(() => {
    return !!(elProp && document[elProp])
  })

  // 同步 fullscreenchange 事件
  useEffect(() => {
    if (!evName) return
    const handler = () => {
      const prop = pickProp(ELEMENT)
      setIsFullscreen(!!(prop && document[prop]))
    }
    document.addEventListener(evName, handler)
    return () => document.removeEventListener(evName, handler)
  }, [evName])

  // 错误事件（如权限拒绝）
  useEffect(() => {
    if (!errEvName) return
    const handler = (e) => console.warn('[Fullscreen] 进入全屏失败:', e)
    document.addEventListener(errEvName, handler)
    return () => document.removeEventListener(errEvName, handler)
  }, [errEvName])

  const enter = useCallback(async (el) => {
    const target = el || document.documentElement
    const method = pickFn(target, REQUEST)
    if (!method) throw new Error('当前浏览器不支持全屏 API')
    try {
      const result = target[method]()
      return result instanceof Promise ? await result : result
    } catch (e) {
      throw new Error('进入全屏失败：' + (e.message || '权限被拒绝'))
    }
  }, [])

  const exit = useCallback(async () => {
    const method = pickFn(document, EXIT)
    if (!method) throw new Error('当前浏览器不支持退出全屏 API')
    try {
      const result = document[method]()
      return result instanceof Promise ? await result : result
    } catch (e) {
      throw new Error('退出全屏失败：' + (e.message || '未知错误'))
    }
  }, [])

  const toggle = useCallback(async (el) => {
    const prop = pickProp(ELEMENT)
    if (prop && document[prop]) return exit()
    return enter(el)
  }, [enter, exit])

  return {
    isFullscreen,
    supported: IS_SUPPORTED,
    enter,
    exit,
    toggle
  }
}