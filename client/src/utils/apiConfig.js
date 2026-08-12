/**
 * API 配置工具
 * 在 GitHub Pages 部署时，指向 Render.io 后端
 * 本地开发时，通过 Vite proxy 转发到 localhost:8080
 */

// Render.io 后端地址（部署后替换为实际 URL）
const RENDER_API_URL = 'https://structural-engineer-ai-api.onrender.com'

// 判断运行环境
const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io')
const isLocalDev = import.meta.env.DEV

// API base URL
export const API_BASE = isLocalDev ? '' : (isGitHubPages ? RENDER_API_URL : '')

/**
 * 获取完整 API URL
 * @param {string} path - 以 / 开头的 API 路径，如 /api/handbook/list
 * @param {object} params - 查询参数对象
 * @returns {string} 完整 URL
 */
export function apiUrl(path, params = {}) {
  const url = new URL(path, API_BASE || window.location.origin)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
  })
  return url.toString()
}

/**
 * 带 CORS 支持的 fetch 封装
 */
export async function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), {
    credentials: 'include',
    mode: 'cors',
    ...options
  })
}
