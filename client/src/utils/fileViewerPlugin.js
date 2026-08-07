/**
 * file-viewer 插件管理器
 * 
 * 架构：
 *   registerPlugin({ id, label, extensions, component, defaultOptions, onLoad, onError })
 *   getPlugin(id)       — 按 ID 获取
 *   getPluginByExt(ext) — 按扩展名自动匹配
 *   listPlugins()       — 列出所有已注册插件
 * 
 * 内置：renderer-3d (Three.js WebGL)、renderer-canvas (Canvas 2D)
 */

const plugins = new Map()
const extIndex = new Map()  // 扩展名 → 插件 ID

// ==================== 注册 ====================

export function registerPlugin(plugin) {
  const { id, extensions = [], ...rest } = plugin
  if (plugins.has(id)) {
    console.warn(`[fileViewer] 插件 ${id} 已注册，覆盖旧版本`)
  }
  plugins.set(id, { id, extensions, ...rest })

  // 建立扩展名索引
  for (const ext of extensions) {
    // 允许多个插件注册同一扩展名，但最后一个优先
    extIndex.set(ext.toLowerCase(), id)
  }
}

export function unregisterPlugin(id) {
  const plugin = plugins.get(id)
  if (!plugin) return
  // 从扩展名索引中移除
  for (const [ext, pid] of extIndex.entries()) {
    if (pid === id) extIndex.delete(ext)
  }
  plugins.delete(id)
}

// ==================== 查找 ====================

export function getPlugin(id) {
  return plugins.get(id) || null
}

export function getPluginByExt(ext) {
  const id = extIndex.get((ext || '').toLowerCase())
  return id ? plugins.get(id) : null
}

export function listPlugins() {
  return Array.from(plugins.values()).map(p => ({
    id: p.id,
    label: p.label,
    extensions: p.extensions,
    version: p.version || '1.0.0',
  }))
}

// ==================== 插件冲突检测 ====================

export function checkConflicts() {
  const conflicts = []
  const extMap = new Map()
  for (const [id, p] of plugins) {
    for (const ext of p.extensions) {
      const existing = extMap.get(ext)
      if (existing) {
        conflicts.push({ extension: ext, plugins: [existing, id] })
      } else {
        extMap.set(ext, id)
      }
    }
  }
  return conflicts
}

// ==================== Hook：使用插件渲染文件 ====================

/**
 * 按文件扩展名 + 模型元数据选择最合适的渲染插件
 * @param {string} fileExt  文件扩展名（不含点）
 * @param {object} meta     模型元数据
 * @param {object} options  覆盖默认配置
 * @returns {{ pluginId, pluginLabel, component, options }}
 */
export function resolvePlugin(fileExt, meta, options = {}) {
  // 1. 按扩展名匹配
  let plugin = getPluginByExt(fileExt)
  // 2. 降级：有 faces 数据 → renderer-3d
  if (!plugin && meta?.faces?.faces?.length > 0) {
    plugin = getPlugin('renderer-3d')
  }
  // 3. 最终降级 → renderer-canvas
  if (!plugin) {
    plugin = getPlugin('renderer-canvas')
  }

  if (!plugin) {
    return { pluginId: null, pluginLabel: null, component: null, options }
  }

  return {
    pluginId: plugin.id,
    pluginLabel: plugin.label,
    component: plugin.component,
    options: { ...plugin.defaultOptions, ...options },
  }
}

// ==================== 默认注册（内置插件） ====================

// 插件将在模块初始化时注册（由引用它们的文件负责）
// 这样避免循环依赖问题
