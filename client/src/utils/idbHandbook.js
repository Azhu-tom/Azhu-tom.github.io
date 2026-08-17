/**
 * 浏览器 IndexedDB 手册存储（GitHub Pages 静态站 fallback）
 *
 * 数据结构：
 *   books: { id, title, fileName, fileType, category, tags, size,
 *           blob, uploadedAt, description, favorite, favoriteCount }
 *
 * 在 GitHub Pages 等纯静态站环境使用：
 * - 数据仅保存在浏览器本地，不跨设备
 * - 适合单机使用 + 数据导出备份
 */

const DB_NAME = 'HandbookLibraryDB'
const DB_VERSION = 1
const STORE_NAME = 'books'

let _dbPromise = null

function openDB() {
  if (_dbPromise) return _dbPromise
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('category', 'category', { unique: false })
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return _dbPromise
}

function tx(mode) {
  return openDB().then((db) => db.transaction(STORE_NAME, mode).objectStore(STORE_NAME))
}

/**
 * 保存手册（含文件 Blob）
 */
export async function saveBook(book) {
  const store = await tx('readwrite')
  return new Promise((resolve, reject) => {
    const req = store.put(book)
    req.onsuccess = () => resolve(book)
    req.onerror = () => reject(req.error)
  })
}

/**
 * 列出所有手册（不含 Blob，按 uploadedAt 倒序）
 */
export async function listBooks({ category, search, sort = 'uploadedAt' } = {}) {
  const store = await tx('readonly')
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => {
      let list = req.result || []
      if (category && category !== 'all') {
        list = list.filter((b) => b.category === category)
      }
      if (search) {
        const kw = String(search).toLowerCase()
        list = list.filter(
          (b) =>
            (b.title || '').toLowerCase().includes(kw) ||
            (b.fileName || '').toLowerCase().includes(kw) ||
            (b.tags || []).some((t) => String(t).toLowerCase().includes(kw))
        )
      }
      // 排序
      if (sort === 'uploadedAt') list.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))
      else if (sort === 'size') list.sort((a, b) => (b.size || 0) - (a.size || 0))
      // 转 JSON 返回（blob 不能 JSON 化，所以列表不带 blob）
      return resolve(list.map(({ blob, ...rest }) => rest))
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * 获取单本手册（含 Blob，用于下载/预览）
 */
export async function getBook(id) {
  const store = await tx('readonly')
  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

/**
 * 删除手册
 */
export async function deleteBook(id) {
  const store = await tx('readwrite')
  return new Promise((resolve, reject) => {
    const req = store.delete(id)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

/**
 * 切换收藏
 */
export async function toggleFavorite(id) {
  const store = await tx('readwrite')
  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => {
      const book = req.result
      if (!book) return resolve(null)
      book.favorite = !book.favorite
      const upd = store.put(book)
      upd.onsuccess = () => resolve(book.favorite)
      upd.onerror = () => reject(upd.error)
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * 获取所有收藏
 */
export async function listFavorites() {
  const list = await listBooks()
  return list.filter((b) => b.favorite).map((b) => ({ bookId: b.id, addedAt: b.uploadedAt }))
}

/**
 * 统计信息
 */
export async function getStats() {
  const list = await listBooks()
  const byCategory = {}
  let totalSize = 0
  for (const b of list) {
    byCategory[b.category] = (byCategory[b.category] || 0) + 1
    totalSize += b.size || 0
  }
  return {
    total: list.length,
    totalSize,
    byCategory,
  }
}

/**
 * 导出所有手册为 JSON（不含 blob，blob 单独导出）
 */
export async function exportAll() {
  const store = await tx('readonly')
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => {
      const all = req.result || []
      // 导出 metadata 列表 + 提示用户 blob 单独导出
      const meta = all.map(({ blob, ...rest }) => rest)
      const blobs = all.map((b) => ({ id: b.id, fileName: b.fileName, blob: b.blob }))
      const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), books: meta, blobs }, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `handbook-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      resolve(meta.length)
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * 清空所有手册
 */
export async function clearAll() {
  const store = await tx('readwrite')
  return new Promise((resolve, reject) => {
    const req = store.clear()
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

/**
 * 检测是否在 GitHub Pages 环境（无后端）
 */
export function isStaticOnlyMode() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h.includes('github.io') || h === 'localhost' && !window.__HAS_LOCAL_BACKEND__
}