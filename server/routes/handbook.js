/**
 * 结构高频数据库 - 手册管理API
 *
 * 功能：
 * - PDF手册上传（支持多格式：PDF/DOC/XLS/PPT等）
 * - 分类存储（按国标/材料/机械设计/模具等分类）
 * - 手册列表、搜索、删除
 * - 收藏与书签功能
 * - PDF预览/下载
 */

import express from 'express'
import multer from 'multer'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, readFileSync, writeFileSync } from 'fs'
import { join, extname, basename, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// ==================== 配置 ====================
const HANDBOOK_ROOT = join(__dirname, '../../uploads/handbooks')
const DATA_FILE = join(__dirname, '../data/handbook-db.json')
const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB

// 支持的文件格式
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.ppt', '.pptx', '.txt', '.zip', '.rar',
  '.stp', '.step', '.dwg', '.dxf', '.igs', '.iges'
]

// 手册分类体系
const CATEGORIES = {
  'gb': { name: '国家标准', icon: '🏛️', description: 'GB/T 国标规范' },
  'material': { name: '材料手册', icon: '📗', description: '金属材料、塑料、橡胶等材料参数' },
  'mechanical': { name: '机械设计', icon: '⚙️', description: '机械设计基础、传动、连接等' },
  'mold': { name: '模具设计', icon: '🔧', description: '注塑模、冲压模设计指南' },
  'tolerance': { name: '公差配合', icon: '📐', description: '尺寸公差、形位公差标准' },
  'surface': { name: '表面处理', icon: '✨', description: '电镀、喷涂、阳极氧化等工艺' },
  'fastener': { name: '紧固件', icon: '🔩', description: '螺钉、螺栓、螺母规格表' },
  'water-appliance': { name: '水家电设计', icon: '💧', description: '净水器/饮水机行业设计参考' },
  'electrical': { name: '电气安全', icon: '⚡', description: '电气安规、EMC、CCC认证资料' },
  'other': { name: '其他资料', icon: '📁', description: '其他工程参考资料' }
}

// Multer 配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const cat = req.body.category || 'other'
    const dir = join(HANDBOOK_ROOT, cat)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    // 保持原文件名，避免覆盖
    const original = Buffer.from(file.originalname, 'latin1').toString('utf8')
    let filename = original
    const filepath = join(req.body.category || 'other', filename)
    const fullpath = join(HANDBOOK_ROOT, filepath)
    
    if (existsSync(fullpath)) {
      const ext = extname(original)
      const base = basename(original, ext)
      const ts = Date.now()
      filename = `${base}_${ts}${ext}`
    }
    cb(null, filename)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase()
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件格式: ${ext}，允许: ${ALLOWED_EXTENSIONS.join(', ')}`))
    }
  }
})

// ==================== 数据持久化 ====================

let dbData = { books: [], bookmarks: {}, favorites: [] }

function loadDB() {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8')
      dbData = JSON.parse(raw)
    }
  } catch (e) {
    console.warn('[Handbook] DB load error:', e.message)
    dbData = { books: [], bookmarks: {}, favorites: [] }
  }
}

function saveDB() {
  try {
    const dir = dirname(DATA_FILE)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(DATA_FILE, JSON.stringify(dbData, null, 2), 'utf-8')
  } catch (e) {
    console.error('[Handbook] DB save error:', e.message)
  }
}

// 启动时加载数据库并扫描文件
loadDB()
scanFiles()

// 扫描文件目录，同步到数据库
function scanFiles() {
  const existingPaths = new Set(dbData.books.map(b => b.filePath))
  
  function scanDir(catId, dir) {
    if (!existsSync(dir)) return []
    const results = []
    try {
      const files = readdirSync(dir)
      for (const f of files) {
        const fp = join(dir, f)
        const stat = statSync(fp)
        if (!stat.isFile()) continue
        
        const relPath = `${catId}/${f}`
        if (!existingPaths.has(relPath)) {
          results.push(createBookEntry(catId, f, fp, stat))
        }
      }
    } catch (e) {}
    return results
  }

  const newBooks = []
  for (const [catId] of Object.entries(CATEGORIES)) {
    newBooks.push(...scanDir(catId, join(HANDBOOK_ROOT, catId)))
  }

  if (newBooks.length > 0) {
    dbData.books.push(...newBooks)
    saveDB()
    console.log(`[Handbook] Scanned ${newBooks.length} new files`)
  }
}

function createBookEntry(category, filename, filePath, stat) {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: filename.replace(/\.[^.]+$/, ''),
    fileName: filename,
    category,
    filePath: `${category}/${filename}`,
    fileSize: stat.size,
    uploadedAt: new Date(stat.mtime).toISOString(),
    fileType: extname(filename).toLowerCase().slice(1),
    favoriteCount: 0,
    tags: [],
    description: ''
  }
}

// ==================== API 路由 ====================

// 获取配置信息（分类列表）
router.get('/config', (req, res) => {
  res.json({ success: true, categories: CATEGORIES })
})

// 获取所有手册列表（支持分类筛选和搜索）
router.get('/list', (req, res) => {
  const { category, search, sort = 'uploadedAt', order = 'desc', page = '1', limit = '50' } = req.query
  
  let list = [...dbData.books]
  
  // 分类筛选
  if (category && category !== 'all') {
    list = list.filter(b => b.category === category)
  }
  
  // 搜索（标题+标签+描述）
  if (search) {
    const kw = search.toLowerCase()
    list = list.filter(b =>
      b.title.toLowerCase().includes(kw) ||
      b.fileName.toLowerCase().includes(kw) ||
      b.tags?.some(t => t.toLowerCase().includes(kw)) ||
      b.description?.toLowerCase().includes(kw)
    )
  }
  
  // 排序
  list.sort((a, b) => {
    let cmp = 0
    switch (sort) {
      case 'title': cmp = a.title.localeCompare(b.title); break
      case 'fileSize': cmp = a.fileSize - b.fileSize; break
      case 'favoriteCount': cmp = (b.favoriteCount || 0) - (a.favoriteCount || 0); break
      default: cmp = new Date(a.uploadedAt) - new Date(b.uploadedAt); break
    }
    return order === 'desc' ? -cmp : cmp
  })
  
  // 分页
  const p = parseInt(page) || 1
  const l = parseInt(limit) || 50
  const total = list.length
  const pages = Math.ceil(total / l)
  const items = list.slice((p - 1) * l, p * l)
  
  res.json({
    success: true,
    data: items,
    pagination: { page: p, limit: l, total, pages },
    stats: {
      totalBooks: dbData.books.length,
      byCategory: Object.fromEntries(
        Object.keys(CATEGORIES).map(cat => [cat, dbData.books.filter(b => b.category === cat).length])
      ),
      favorites: dbData.favorites.length
    }
  })
})

// 上传手册文件
router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: `文件过大，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB` })
      }
      return res.status(400).json({ success: false, error: err.message })
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请选择要上传的文件' })
    }
    
    const category = req.body.category || 'other'
    const title = req.body.title || ''
    const desc = req.body.description || ''
    const tags = req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title || req.file.originalname.replace(/\.[^.]+$/, ''),
      fileName: req.file.originalname,
      category,
      filePath: `${category}/${req.file.filename}`,
      fileSize: req.file.size,
      uploadedAt: new Date().toISOString(),
      fileType: extname(req.file.originalname).toLowerCase().slice(1),
      favoriteCount: 0,
      tags,
      description: desc
    }
    
    dbData.books.push(entry)
    saveDB()
    
    console.log(`[Handbook] Uploaded: ${entry.title} (${formatSize(entry.fileSize)}) → ${category}`)
    
    res.json({
      success: true,
      book: entry,
      message: '上传成功'
    })
  })
})

// 下载手册文件
router.get('/download/:id', (req, res) => {
  const book = dbData.books.find(b => b.id === req.params.id)
  if (!book) {
    return res.status(404).json({ success: false, error: '文件不存在' })
  }
  
  const filePath = join(HANDBOOK_ROOT, book.filePath)
  if (!existsSync(filePath)) {
    return res.status(404).json({ success: false, error: '源文件已丢失' })
  }
  
  // 记录下载次数（可选）
  book.downloadCount = (book.downloadCount || 0) + 1
  saveDB()
  
  res.download(filePath, encodeURI(book.fileName))
})

// 删除手册
router.delete('/:id', (req, res) => {
  const idx = dbData.books.findIndex(b => b.id === req.params.id)
  if (idx === -1) {
    return res.status(404).json({ success: false, error: '记录不存在' })
  }
  
  const book = dbData.books[idx]
  const filePath = join(HANDBOOK_ROOT, book.filePath)
  
  try {
    if (existsSync(filePath)) unlinkSync(filePath)
  } catch (e) {
    console.warn('[Handbook] Delete file failed:', e.message)
  }
  
  // 清除相关书签和收藏
  delete dbData.bookmarks[book.id]
  dbData.favorites = dbData.favorites.filter(f => f.bookId !== book.id)
  
  dbData.books.splice(idx, 1)
  saveDB()
  
  res.json({ success: true, message: '已删除' })
})

// 更新手册信息（标题、描述、标签）
router.put('/:id', (req, res) => {
  const book = dbData.books.find(b => b.id === req.params.id)
  if (!book) {
    return res.status(404).json({ success: false, error: '记录不存在' })
  }
  
  if (req.body.title !== undefined) book.title = req.body.title
  if (req.body.description !== undefined) book.description = req.body.description
  if (req.body.tags !== undefined) book.tags = req.body.tags
  if (req.body.category !== undefined) book.category = req.body.category
  
  saveDB()
  res.json({ success: true, book })
})

// ========== 收藏功能 ==========

// 添加收藏
router.post('/:id/favorite', (req, res) => {
  const book = dbData.books.find(b => b.id === req.params.id)
  if (!book) return res.status(404).json({ success: false, error: '记录不存在' })
  
  const exists = dbData.favorites.find(f => f.bookId === book.id)
  if (!exists) {
    dbData.favorites.push({ bookId: book.id, addedAt: new Date().toISOString() })
    book.favoriteCount = (book.favoriteCount || 0) + 1
    saveDB()
  }
  
  res.json({ success: true, favorited: true })
})

// 取消收藏
router.delete('/:id/favorite', (req, res) => {
  const idx = dbData.favorites.findIndex(f => f.bookId === req.params.id)
  if (idx !== -1) {
    dbData.favorites.splice(idx, 1)
    const book = dbData.books.find(b => b.id === req.params.id)
    if (book && book.favoriteCount > 0) book.favoriteCount--
    saveDB()
  }
  res.json({ success: true, favorited: false })
})

// 获取收藏列表
router.get('/favorites/list', (req, res) => {
  const favIds = dbData.favorites.map(f => f.bookId)
  const books = dbData.books.filter(b => favIds.includes(b.id))
  // 按收藏时间倒序
  books.sort((a, b) => {
    const fa = dbData.favorites.find(f => f.bookId === a.id)?.addedAt || ''
    const fb = dbData.favorites.find(f => f.bookId === b.id)?.addedAt || ''
    return fb.localeCompare(fa)
  })
  res.json({ success: true, data: books, count: books.length })
})

// ========== 书签功能 ==========

// 添加书签（页码/位置标记）
router.post('/:id/bookmark', (req, res) => {
  const { page, note, position } = req.body
  if (!page) return res.status(400).json({ success: false, error: '缺少页码信息' })
  
  if (!dbData.bookmarks[req.params.id]) dbData.bookmarks[req.params.id] = []
  
  const bookmark = {
    id: Date.now().toString(36),
    page: parseInt(page),
    note: note || '',
    position: position || '',
    createdAt: new Date().toISOString()
  }
  
  dbData.bookmarks[req.params.id].push(bookmark)
  saveDB()
  res.json({ success: true, bookmark })
})

// 获取某本书的书签列表
router.get('/:id/bookmarks', (req, res) => {
  const marks = dbData.bookmarks[req.params.id] || []
  res.json({ success: true, data: marks, count: marks.length })
})

// 删除书签
router.delete('/:id/bookmark/:bookmarkId', (req, res) => {
  const marks = dbData.bookmarks[req.params.id]
  if (marks) {
    const idx = marks.findIndex(m => m.id === req.params.bookmarkId)
    if (idx !== -1) {
      marks.splice(idx, 1)
      saveDB()
    }
  }
  res.json({ success: true })
})

// ========== 工具函数 ==========
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

export default router
