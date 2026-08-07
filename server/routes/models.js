import { Router } from 'express'
import { fileURLToPath } from 'url'
import { dirname, join, sep as pathSep } from 'path'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import multer from 'multer'

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ==================== 文件存储配置 ====================
const UPLOAD_DIR = join(__dirname, '..', 'uploads', 'models')
const STP_SOURCE_DIR = join(__dirname, '..', '..', '..', '通用件模型库资料', '图纸')

// 确保上传目录存在
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Multer 配置 - 文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    // 保持原始文件名，添加时间戳防止重名
    const uniqueName = `${Date.now()}_${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件格式
    const allowedTypes = [
      '.stp', '.step', '.STP', '.STEP',  // CAD 格式
      '.prt', '.PRT',                     // Pro/E 格式
      '.asm', '.ASM',                     // 装配体格式
      '.glb', '.gltf',                    // WebGL 格式
      '.obj',                             // Wavefront OBJ
      '.iges', '.igs'                     // IGES 格式
    ]
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'))
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件格式: ${ext}。允许的格式: ${allowedTypes.join(', ')}`))
    }
  }
})

// 模拟数据库数据（实际项目中应使用真实数据库）
let models = []

// ==================== 文件索引（支持快速按文件名查找） ====================
// key: 文件名(小写) -> value: 完整路径
const fileNameIndex = new Map()

/**
 * 递归遍历目录，收集所有STP文件
 */
function scanDirectory(dirPath, baseCategory = '') {
  try {
    if (!existsSync(dirPath)) return

    const items = readdirSync(dirPath)

    for (const item of items) {
      const itemPath = join(dirPath, item)
      const stat = statSync(itemPath)

      if (stat.isDirectory()) {
        // 递归进入子目录（用子目录名作为分类）
        scanDirectory(itemPath, item || baseCategory)
      } else if (stat.isFile()) {
        const ext = item.substring(item.lastIndexOf('.')).toLowerCase()
        if (['.stp', '.step', '.prt', '.asm'].includes(ext)) {
          // 建立文件名索引
          fileNameIndex.set(item.toLowerCase(), itemPath)

          // 提取编码作为ID基础
          const code = item.replace(ext, '').replace(/\.(qs|wl|pz|ls)$/, '')

          models.push({
            id: String(models.length + 1),
            code,
            name: baseCategory || item.replace(ext, ''),
            category: baseCategory || '未分类',
            format: ext.toUpperCase(),
            size: stat.size,
            uploadDate: stat.mtime.toISOString(),
            description: `${baseCategory ? `[${baseCategory}] ` : ''}从图纸库导入`,
            fileName: item,
            filePath: itemPath.replace(/\\/g, '/'),
            source: 'existing',
            tags: [code, baseCategory].filter(Boolean),
            hasFile: true,
          })
        }
      }
    }
  } catch (error) {
    console.error(`⚠️ 扫描目录失败 ${dirPath}:`, error.message)
  }
}

// 尝试从 STP 源目录加载已有文件（递归扫描子目录）
function loadExistingModels() {
  try {
    if (!existsSync(STP_SOURCE_DIR)) return

    console.log(`📁 开始扫描STP源目录: ${STP_SOURCE_DIR}`)
    const startTime = Date.now()

    scanDirectory(STP_SOURCE_DIR)

    const elapsed = Date.now() - startTime
    console.log(`✅ 已加载 ${models.length} 个现有模型文件 (${fileNameIndex.size} 个文件索引), 耗时 ${elapsed}ms`)
  } catch (error) {
    console.error('⚠️ 加载现有模型失败:', error.message)
  }
}

// 启动时加载现有模型
loadExistingModels()

// ==================== API 接口 ====================

// GET /api/models - 获取模型列表（支持分页、搜索、分类过滤）
router.get('/', (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = ''
    } = req.query

    let filteredModels = [...models]

    // 搜索过滤（支持物料编码和名称搜索）
    if (search) {
      const searchLower = search.toLowerCase()
      filteredModels = filteredModels.filter(model =>
        model.name?.toLowerCase().includes(searchLower) ||
        model.code?.toLowerCase().includes(searchLower) ||
        model.description?.toLowerCase().includes(searchLower) ||
        model.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // 分类过滤
    if (category && category !== 'all') {
      filteredModels = filteredModels.filter(model => model.category === category)
    }

    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const paginatedModels = filteredModels.slice(startIndex, endIndex)

    res.json({
      success: true,
      data: paginatedModels.map(m => ({
        ...m,
        size: formatFileSize(m.size),
        uploadDate: new Date(m.uploadDate).toLocaleDateString('zh-CN'),
        hasFile: existsSync(m.filePath || join(UPLOAD_DIR, m.fileName || ''))
      })),
      pagination: {
        total: filteredModels.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredModels.length / limit)
      }
    })
  } catch (error) {
    console.error('获取模型列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取模型列表失败',
      error: error.message
    })
  }
})

// POST /api/models/upload - 上传新模型文件（完整版，支持文件+元数据）
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    // 检查是否有文件
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      })
    }

    // 获取元数据（从表单字段）
    const {
      name = req.file.originalname,
      category = '未分类',
      description = '',
      code = ''
    } = req.body

    // 创建新模型记录
    const newModel = {
      id: String(models.length + 1),
      code: code || req.file.originalname.replace(/\.[^/.]+$/, ''),
      name: name,
      category: category,
      format: req.file.originalname.substring(req.file.originalname.lastIndexOf('.')).toUpperCase(),
      size: req.file.size,
      uploadDate: new Date().toISOString(),
      description: description,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: join(UPLOAD_DIR, req.file.filename).replace(/\\/g, '/'),
      source: 'upload',
      tags: [name, category, code].filter(Boolean)
    }

    models.push(newModel)

    console.log(`✅ 模型上传成功: ${newModel.name} (${formatFileSize(newModel.size)})`)

    res.status(201).json({
      success: true,
      message: '模型上传成功',
      data: {
        ...newModel,
        size: formatFileSize(newModel.size),
        uploadDate: new Date(newModel.uploadDate).toLocaleDateString('zh-CN')
      }
    })
  } catch (error) {
    console.error('上传失败:', error)
    
    // 如果是 Multer 错误，返回特定消息
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: '文件大小超过限制（最大50MB）'
        })
      }
      return res.status(400).json({
        success: false,
        message: `文件上传错误: ${error.message}`
      })
    }
    
    res.status(500).json({
      success: false,
      message: '上传失败',
      error: error.message
    })
  }
})

// GET /api/models/download/:id - 下载模型文件（支持ID或文件名）
router.get('/download/:id', (req, res) => {
  try {
    const { id } = req.params
    let filePath = null
    let downloadName = null

    // 先尝试按ID查找
    const model = models.find(m => m.id === id)
    if (model) {
      filePath = model.filePath
      downloadName = model.originalName || model.fileName || `model_${model.id}.stp`
    }

    // 如果没找到，尝试按文件名查找
    if (!filePath) {
      // 尝试从文件名索引中查找
      const normalizedId = decodeURIComponent(id).toLowerCase()
      if (fileNameIndex.has(normalizedId)) {
        filePath = fileNameIndex.get(normalizedId)
        downloadName = id
      }
      // 再尝试加上.stp后缀
      else if (fileNameIndex.has(normalizedId + '.stp')) {
        filePath = fileNameIndex.get(normalizedId + '.stp')
        downloadName = id + '.stp'
      }
      else if (fileNameIndex.has(normalizedId + '.STP')) {
        filePath = fileNameIndex.get(normalizedId + '.STP')
        downloadName = id + '.STP'
      }
    }

    // 最后尝试在上传目录中查找
    if (!filePath || !existsSync(filePath)) {
      filePath = join(UPLOAD_DIR, id)
      if (!existsSync(filePath)) {
        // 列出可用的文件供调试
        const availableFiles = Array.from(fileNameIndex.keys()).slice(0, 10)

        return res.status(404).json({
          success: false,
          message: '文件不存在或已被删除',
          hint: `请求的ID/文件名: ${id}`,
          availableSamples: availableFiles.length > 0 ? availableFiles : '(无可用文件)',
          totalIndexed: fileNameIndex.size,
          totalModels: models.length,
        })
      }
      downloadName = id
    }

    // 验证文件存在且可读
    try {
      statSync(filePath)
    } catch {
      return res.status(404).json({
        success: false,
        message: '文件无法访问',
        path: filePath
      })
    }

    console.log(`📥 文件下载: ${id} -> ${downloadName} (${filePath})`)

    // 设置响应头并发送文件
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(filePath.split('/').join(pathSep))

  } catch (error) {
    console.error('下载失败:', error)
    res.status(500).json({
      success: false,
      message: '下载失败',
      error: error.message
    })
  }
})

/**
 * 按文件名搜索并下载（更直接的接口）
 * GET /api/models/download-stp/:filename
 */
router.get('/download-stp/:filename', (req, res) => {
  try {
    let filename = decodeURIComponent(req.params.filename)
    const normalizedFilename = filename.toLowerCase()

    // 从索引中查找
    let filePath = fileNameIndex.get(normalizedFilename)

    // 如果没找到，尝试加后缀
    if (!filePath && !normalizedFilename.endsWith('.stp')) {
      filePath = fileNameIndex.get(normalizedFilename + '.stp') ||
                 fileNameIndex.get(normalizedFilename + '.STP')
    }

    if (!filePath || !existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: `STP文件未找到: ${filename}`,
        availableCount: fileNameIndex.size,
        hint: '请检查文件名是否正确'
      })
    }

    console.log(`📥 STP下载: ${filename}`)

    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.sendFile(filePath.split('/').join(pathSep))
  } catch (error) {
    console.error('STP下载失败:', error)
    res.status(500).json({
      success: false,
      message: '下载失败',
      error: error.message
    })
  }
})

// POST /api/models/batch-upload - 批量上传（支持多文件）
router.post('/batch-upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      })
    }

    const {
      category = '未分类',
      description = ''
    } = req.body

    const uploadedModels = []

    for (const file of req.files) {
      const newModel = {
        id: String(models.length + uploadedModels.length + 1),
        code: file.originalname.replace(/\.[^/.]+$/, ''),
        name: file.originalname,
        category: category,
        format: file.originalname.substring(file.originalname.lastIndexOf('.')).toUpperCase(),
        size: file.size,
        uploadDate: new Date().toISOString(),
        description: description,
        fileName: file.filename,
        originalName: file.originalname,
        filePath: join(UPLOAD_DIR, file.filename).replace(/\\/g, '/'),
        source: 'batch_upload',
        tags: [file.originalname, category]
      }

      models.push(newModel)
      uploadedModels.push({
        ...newModel,
        size: formatFileSize(newModel.size)
      })
    }

    console.log(`✅ 批量上传成功: ${uploadedModels.length} 个文件`)

    res.status(201).json({
      success: true,
      message: `成功上传 ${uploadedModels.length} 个文件`,
      data: uploadedModels
    })
  } catch (error) {
    console.error('批量上传失败:', error)
    res.status(500).json({
      success: false,
      message: '批量上传失败',
      error: error.message
    })
  }
})

// DELETE /api/models/:id - 删除模型及关联文件
router.delete('/:id', (req, res) => {
  try {
    const index = models.findIndex(m => m.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '模型不存在'
      })
    }

    const model = models[index]

    // 删除物理文件（仅限用户上传的文件）
    if (model.source === 'upload' || model.source === 'batch_upload') {
      const filePath = model.filePath || join(UPLOAD_DIR, model.fileName || '')
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath)
          console.log(`🗑️ 已删除文件: ${model.fileName}`)
        } catch (err) {
          console.warn(`⚠️ 删除文件失败: ${err.message}`)
        }
      }
    }

    models.splice(index, 1)

    console.log(`✅ 已删除模型: ${model.name}`)

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除失败:', error)
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    })
  }
})

// GET /api/models/stats - 获取统计信息
router.get('/stats', (req, res) => {
  try {
    const stats = {
      total: models.length,
      byCategory: {},
      byFormat: {},
      totalSize: 0
    }

    for (const model of models) {
      // 按分类统计
      stats.byCategory[model.category] = (stats.byCategory[model.category] || 0) + 1
      // 按格式统计
      stats.byFormat[model.format] = (stats.byFormat[model.format] || 0) + 1
      // 总大小
      stats.totalSize += model.size || 0
    }

    stats.totalSize = formatFileSize(stats.totalSize)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    })
  }
})

// GET /api/models/:id - 获取单个模型详情（必须放在最后！避免拦截其他路由）
router.get('/:id', (req, res) => {
  try {
    // 排除已知路径，防止意外匹配
    const excludedPaths = ['stp-files', 'convert', 'glb', 'stats', 'upload', 'download', 'download-stp', 'cache', 'categories', 'batch-upload']
    if (excludedPaths.includes(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: `接口不存在`
      })
    }

    const model = models.find(m => m.id === req.params.id)

    if (!model) {
      return res.status(404).json({
        success: false,
        message: '模型不存在'
      })
    }

    // 检查文件是否存在
    const hasFile = existsSync(model.filePath || join(UPLOAD_DIR, model.fileName || ''))

    res.json({
      success: true,
      data: {
        ...model,
        size: formatFileSize(model.size),
        uploadDate: new Date(model.uploadDate).toLocaleDateString('zh-CN'),
        hasFile
      }
    })
  } catch (error) {
    console.error('获取模型详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取模型详情失败',
      error: error.message
    })
  }
})

// ==================== 辅助函数 ====================

/**
 * 格式化文件大小为人类可读格式
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default router
