/**
 * 轻量级 Toast 通知系统
 * 
 * 使用方式：
 *   import { toast } from './toast'
 *   toast.success('操作成功')
 *   toast.error('操作失败')
 *   toast.info('提示信息')
 *   toast.warn('警告信息')
 */

let toastContainer = null
const TOAST_LIMIT = 5
const activeToasts = new Map()

// 确保容器存在
function ensureContainer() {
  if (toastContainer) return
  toastContainer = document.createElement('div')
  toastContainer.id = 'toast-container'
  toastContainer.style.cssText = `
    position: fixed;
    top: 72px;
    right: 20px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
    max-width: 380px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  `
  document.body.appendChild(toastContainer)
}

// Toast 配色方案（浅色主题）
const STYLES = {
  success: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    color: '#166534',
    icon: '✅',
    progress: '#22c55e',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    icon: '❌',
    progress: '#ef4444',
  },
  info: {
    background: '#eff6ff',
    border: '1px solid #93c5fd',
    color: '#1e40af',
    icon: 'ℹ️',
    iconText: '📢',
    progress: '#3b82f6',
  },
  warn: {
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    color: '#92400e',
    icon: '⚠️',
    progress: '#f59e0b',
  },
}

function createToast(message, type = 'info', duration = 3500) {
  ensureContainer()

  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const style = STYLES[type] || STYLES.info

  // 限制数量
  if (activeToasts.size >= TOAST_LIMIT) {
    const oldestId = activeToasts.keys().next().value
    removeToast(oldestId)
  }

  // 创建元素
  const el = document.createElement('div')
  el.id = id
  el.style.cssText = `
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 18px;
    border-radius: 10px;
    background: ${style.background};
    border: ${style.border};
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    font-size: 13.5px;
    line-height: 1.5;
    color: ${style.color};
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 380px;
    overflow: hidden;
    position: relative;
  `

  // 图标
  const iconEl = document.createElement('span')
  iconEl.textContent = style.icon === 'ℹ️' ? style.iconText : style.icon
  iconEl.style.cssText = 'flex-shrink: 0; font-size: 15px; line-height: 1;'
  el.appendChild(iconEl)

  // 消息文本
  const msgEl = document.createElement('div')
  msgEl.textContent = message
  msgEl.style.cssText = 'flex: 1; word-break: break-word; white-space: pre-line;'
  el.appendChild(msgEl)

  // 关闭按钮
  const closeBtn = document.createElement('button')
  closeBtn.innerHTML = '&times;'
  closeBtn.style.cssText = `
    flex-shrink: 0; background: none; border: none; cursor: pointer;
    font-size: 16px; color: inherit; opacity: 0.5; padding: 0 2px;
    line-height: 1; transition: opacity 0.2s;
  `
  closeBtn.onmouseenter = () => closeBtn.style.opacity = '1'
  closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.5'
  closeBtn.onclick = () => removeToast(id)
  el.appendChild(closeBtn)

  // 进度条
  const progressBar = document.createElement('div')
  progressBar.style.cssText = `
    position: absolute; bottom: 0; left: 0; height: 3px;
    background: ${style.progress}; border-radius: 0 0 10px 10px;
    width: 100%; transition: width linear ${duration}ms;
  `
  el.appendChild(progressBar)

  toastContainer.insertBefore(el, toastContainer.firstChild)

  // 入场动画
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = 'translateX(0)'
    })
  })

  // 进度条动画
  requestAnimationFrame(() => {
    progressBar.style.width = '0%'
  })

  // 注册
  activeToasts.set(id, { el, timer: null })

  // 自动移除
  if (duration > 0) {
    const data = activeToasts.get(id)
    data.timer = setTimeout(() => removeToast(id), duration)
  }

  return id
}

function removeToast(id) {
  const data = activeToasts.get(id)
  if (!data) return
  
  if (data.timer) clearTimeout(data.timer)
  
  data.el.style.opacity = '0'
  data.el.style.transform = 'translateX(100%)'
  
  setTimeout(() => {
    if (data.el.parentNode) {
      data.el.parentNode.removeChild(data.el)
    }
    activeToasts.delete(id)
    // 如果没有活跃的 toast 了，移除容器
    if (activeToasts.size === 0 && toastContainer) {
      // 可选：保留容器以便下次使用更快
    }
  }, 300)
}

// 导出 API
export const toast = {
  success: (msg, dur) => createToast(msg, 'success', dur),
  error: (msg, dur) => createToast(msg, 'error', dur),
  info: (msg, dur) => createToast(msg, 'info', dur),
  warn: (msg, dur) => createToast(msg, 'warn', dur),

  /** 手动关闭指定 toast */
  dismiss: removeToast,

  /** 关闭所有 toast */
  clearAll: () => {
    activeToasts.forEach((_, id) => removeToast(id))
  },
}

export default toast
