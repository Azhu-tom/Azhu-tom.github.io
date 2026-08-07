import express from 'express'
import multer from 'multer'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { dirname, join, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// ==================== 配置 ====================

// 允许的文件类型
const ALLOWED_EXTENSIONS = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.stp': null,
  '.step': null,
  '.igs': null,
  '.iges': null
}

// 文件大小限制：50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

// 存储根目录
const STORAGE_ROOT = join(__dirname, '..', 'uploads', 'wa-documents')

// 确保各产品线目录存在
function ensureDirs() {
  const productLines = ['purifier', 'dispenser', 'countertop']
  productLines.forEach(line => {
    const dir = join(STORAGE_ROOT, line)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  })
}

// 启动时初始化目录
ensureDirs()

// ==================== Multer 存储 ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productLine = req.params?.productLine || req.body?.productLine || 'purifier'
    // 安全检查：只允许预定义的产品线
    const allowedLines = ['purifier', 'dispenser', 'countertop']
    const safeLine = allowedLines.includes(productLine) ? productLine : 'purifier'
    const dir = join(STORAGE_ROOT, safeLine)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    // 文件名格式：时间戳_原始名（保留扩展名）
    const timestamp = Date.now()
    const originalName = Buffer.from(file.originalName || file.originalname, 'latin1').toString('utf8')
    const ext = extname(originalName)
    const baseName = basename(originalName, ext)
    // 清理文件名中的特殊字符
    const safeBase = baseName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 80)
    cb(null, `${timestamp}_${safeBase}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // 单次最多10个文件
  },
  fileFilter: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase()
    if (ALLOWED_EXTENSIONS.hasOwnProperty(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${ext}。允许的类型: ${Object.keys(ALLOWED_EXTENSIONS).join(', ')}`))
    }
  }
})

// ==================== 辅助函数 ====================

/**
 * 获取某产品线的所有文档列表
 */
function getDocumentList(productLine) {
  const allowedLines = ['purifier', 'dispenser', 'countertop']
  const safeLine = allowedLines.includes(productLine) ? productLine : 'purifier'
  const dir = join(STORAGE_ROOT, safeLine)

  if (!existsSync(dir)) return []

  try {
    const files = readdirSync(dir)
    return files.map(filename => {
      const filePath = join(dir, filename)
      const stats = statSync(filePath)
      const ext = extname(filename).toLowerCase()

      // 解析原始文件名（去掉时间戳前缀）
      let displayName = filename
      const match = filename.match(/^\d+_(.+)$/)
      if (match) {
        displayName = match[1]
      }

      return {
        id: filename,                    // 唯一标识（含时间戳）
        name: displayName,               // 显示用原始名称
        filename: filename,              // 存储文件名
        size: stats.size,                 // 字节
        sizeFormatted: formatFileSize(stats.size),
        uploadTime: stats.birthtime.toISOString(),
        uploadTimeFormatted: formatTime(stats.birthtime),
        extension: ext.replace('.', '').toUpperCase(),
        mimeType: ALLOWED_EXTENSIONS[ext] || 'application/octet-stream',
        downloadUrl: `/api/wa-documents/${safeLine}/download/${encodeURIComponent(filename)}`
      }
    }).sort((a, b) => b.uploadTime.localeCompare(a.uploadTime)) // 按上传时间倒序
  } catch (err) {
    console.error('读取文档列表失败:', err)
    return []
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatTime(date) {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ==================== API 路由 ====================

/**
 * POST /api/wa-documents/:productLine/upload
 * 上传文档到指定产品线
 * 支持多文件上传
 */
router.post('/:productLine/upload', upload.array('files', 10), (req, res) => {
  try {
    const { productLine } = req.params
    const allowedLines = ['purifier', 'dispenser', 'countertop']

    if (!allowedLines.includes(productLine)) {
      return res.status(400).json({
        success: false,
        message: `无效的产品线: ${productLine}，允许的值: ${allowedLines.join('/')}`
      })
    }

    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未检测到上传文件'
      })
    }

    const uploadedFiles = files.map(file => ({
      id: file.filename,
      name: (() => {
        const match = file.filename.match(/^\d+_(.+)$/)
        return match ? match[1] : file.originalname
      })(),
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      extension: extname(file.originalname).replace('.', '').toUpperCase()
    }))

    res.json({
      success: true,
      message: `成功上传 ${uploadedFiles.length} 个文档到【${getProductLineName(productLine)}】`,
      data: {
        productLine,
        count: uploadedFiles.length,
        files: uploadedFiles
      },
      timestamp: new Date().toISOString()
    })

  } catch (err) {
    console.error('文档上传失败:', err)

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `文件超过大小限制 (${MAX_FILE_SIZE / 1024 / 1024}MB)`
      })
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '单次最多上传10个文件'
      })
    }

    res.status(500).json({
      success: false,
      message: `上传失败: ${err.message}`
    })
  }
})

/**
 * GET /api/wa-documents/:productLine/list
 * 获取指定产品线的文档列表
 */
router.get('/:productLine/list', (req, res) => {
  try {
    const { productLine } = req.params
    const allowedLines = ['purifier', 'dispenser', 'countertop']

    if (!allowedLines.includes(productLine)) {
      return res.status(400).json({
        success: false,
        message: `无效的产品线: ${productLine}`
      })
    }

    const docs = getDocumentList(productLine)

    res.json({
      success: true,
      data: {
        productLine,
        productName: getProductLineName(productLine),
        total: docs.length,
        totalSizeFormatted: formatFileSize(docs.reduce((sum, d) => sum + d.size, 0)),
        documents: docs
      },
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('获取文档列表失败:', err)
    res.status(500).json({ success: false, message: '获取文档列表失败' })
  }
})

/**
 * GET /api/wa-documents/:productLine/download/:filename
 * 下载指定文档
 */
router.get('/:productLine/download/:filename', (req, res) => {
  try {
    const { productLine, filename } = req.params
    const allowedLines = ['purifier', 'dispenser', 'countertop']

    if (!allowedLines.includes(productLine)) {
      return res.status(400).json({ success: false, message: '无效的产品线' })
    }

    // 安全校验文件名（防止路径穿越）
    const safeName = decodeURIComponent(filename).replace(/\.\./g, '')
    const filePath = join(STORAGE_ROOT, productLine, safeName)

    if (!existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '文件不存在' })
    }

    // 提取显示名称
    const match = safeName.match(/^\d+_(.+)$/)
    const displayName = match ? match[1] : safeName

    res.download(filePath, displayName, (err) => {
      if (err) {
        console.error('下载失败:', err)
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: '文件下载失败' })
        }
      }
    })
  } catch (err) {
    console.error('下载接口异常:', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * DELETE /api/wa-documents/:productLine/delete/:filename
 * 删除指定文档
 */
router.delete('/:productLine/delete/:filename', (req, res) => {
  try {
    const { productLine, filename } = req.params
    const allowedLines = ['purifier', 'dispenser', 'countertop']

    if (!allowedLines.includes(productLine)) {
      return res.status(400).json({ success: false, message: '无效的产品线' })
    }

    // 安全校验文件名
    const safeName = decodeURIComponent(filename).replace(/\.\./g, '')
    const filePath = join(STORAGE_ROOT, productLine, safeName)

    if (!existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '文件不存在' })
    }

    unlinkSync(filePath)

    // 返回删除后的列表
    const remainingDocs = getDocumentList(productLine)

    res.json({
      success: true,
      message: '文档删除成功',
      data: {
        deletedFile: filename,
        remainingCount: remainingDocs.length,
        documents: remainingDocs
      },
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('删除文档失败:', err)
    res.status(500).json({ success: false, message: `删除失败: ${err.message}` })
  }
})

/**
 * 获取所有产品线文档统计概览
 * GET /api/wa-documents/overview
 */
router.get('/overview', (req, res) => {
  try {
    const lines = ['purifier', 'dispenser', 'countertop']
    const overview = lines.map(line => ({
      id: line,
      name: getProductLineName(line),
      count: getDocumentList(line).length
    }))

    const totalDocs = overview.reduce((s, o) => s + o.count, 0)

    res.json({
      success: true,
      data: {
        totalDocuments: totalDocs,
        productLines: overview
      },
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('获取概览失败:', err)
    res.status(500).json({ success: false, message: '获取概览失败' })
  }
})

/**
 * 获取允许的文件类型和大小限制
 * GET /api/wa-documents/config
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      allowedExtensions: Object.keys(ALLOWED_EXTENSIONS),
      maxFileSize: MAX_FILE_SIZE,
      maxFileSizeFormatted: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
      maxFileCount: 10,
      productLines: [
        { id: 'purifier', name: '净水机' },
        { id: 'dispenser', name: '饮水机' },
        { id: 'countertop', name: '台净' }
      ]
    }
  })
})

// ==================== 工具函数 ====================

function getProductLineName(id) {
  const names = {
    purifier: '净水机',
    dispenser: '饮水机',
    countertop: '台净（台式净水器）'
  }
  return names[id] || id
}

export default router
