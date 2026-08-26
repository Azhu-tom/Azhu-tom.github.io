import { Router } from 'express'
import multer from 'multer'

const router = Router()

// DFM 专业引擎微服务地址（可用环境变量覆盖）
const DFM_SERVICE_URL = process.env.DFM_SERVICE_URL || 'http://127.0.0.1:8090'

// 允许上传的 CAD 格式（与微服务端保持一致）
const ALLOWED_EXTENSIONS = ['.stp', '.step', '.stpz']

// multer 使用内存存储，直接转发给微服务，不落盘
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB 限制
  }
})

// 包装 upload.single('file')，把 multer 错误转换为统一 JSON 格式
function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ status: 'error', error: '文件大小超过限制（最大50MB）' })
    }
    return res.status(400).json({ status: 'error', error: `文件上传错误: ${err.message}` })
  })
}

// POST /api/dfm/pro - 上传 STP 并调用专业引擎分析（转发到 FastAPI 微服务）
router.post('/pro', uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', error: '请选择要上传的 STEP 文件（字段名: file）' })
    }

    const ext = req.file.originalname.substring(req.file.originalname.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        status: 'error',
        error: `不支持的文件格式: ${ext}，允许: ${ALLOWED_EXTENSIONS.join(', ')}`
      })
    }

    const material = req.body.material || 'Default'

    // 构造 FormData 转发到微服务（保持文件字段名为 file）
    const form = new FormData()
    form.append(
      'file',
      new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' }),
      req.file.originalname
    )
    form.append('material', material)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 320000) // 高面数模型分析约 2-4 分钟，留足余量
    let upstream
    try {
      upstream = await fetch(`${DFM_SERVICE_URL}/dfm/analyze`, {
        method: 'POST',
        body: form,
        signal: controller.signal
      })
    } finally {
      clearTimeout(timer)
    }

    const data = await upstream.json()
    res.status(upstream.status).json(data)
  } catch (err) {
    console.error('[DFM] 转发分析请求失败:', err.message)
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return res.status(504).json({ status: 'error', error: 'DFM 专业引擎分析超时' })
    }
    res.status(503).json({ status: 'error', error: 'DFM 专业引擎未启动' })
  }
})

// GET /api/dfm/pro/health - 探测微服务健康状态
router.get('/pro/health', async (req, res) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const upstream = await fetch(`${DFM_SERVICE_URL}/dfm/health`, {
      method: 'GET',
      signal: controller.signal
    })
    const data = await upstream.json()
    res.json({
      available: upstream.ok && data.status === 'ok',
      engine_ready: data.engine_ready === true
    })
  } catch (err) {
    // 微服务不可达时返回明确结果，不抛错
    res.json({ available: false, engine_ready: false })
  } finally {
    clearTimeout(timer)
  }
})

export default router
