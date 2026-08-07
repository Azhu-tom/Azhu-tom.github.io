import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import modelRoutes from './routes/models.js'
import toolboxRoutes from './routes/toolbox.js'
import modelsApiRoutes from './routes/models-api.js'  // 新增：STP文件API
import waDocRoutes from './routes/wa-documents.js'     // 水家电文档上传API
import stpParseRoutes from './routes/stp-parse.js'     // STP解析API（OCCT内核）
import handbookRoutes from './routes/handbook.js'      // 结构高频数据库-手册管理

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8080

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 静态文件服务（上传的模型文件）
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// GLB缓存文件静态服务
app.use('/cache/glbs', express.static(join(__dirname, 'cache/glbs')))

// API路由
app.use('/api/models', modelsApiRoutes)  // STP文件API（包含stp-files, convert, glb等）
app.use('/api/models', modelRoutes)      // 通用模型API（列表、上传等）
app.use('/api/toolbox', toolboxRoutes)
app.use('/api/wa-documents', waDocRoutes) // 水家电设计文档上传/下载/删除
app.use('/api', stpParseRoutes)        // STP文件解析（OCCT WASM内核）
app.use('/api/handbook', handbookRoutes) // 结构高频数据库（手册管理）

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '结构工程师AI助手',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用结构工程师AI助手 API',
    endpoints: {
      health: '/api/health',
      models: '/api/models',
      toolbox: '/api/toolbox'
    }
  })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `接口不存在: ${req.method} ${req.originalUrl}`
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║   结构工程师AI助手 - 服务已启动       ║
║   http://localhost:${PORT}              ║
╚══════════════════════════════════════╝

📦 API端点:
   - GET  /api/health           健康检查
   - GET  /api/models           模型列表
   - POST /api/models/upload     上传模型
   - GET  /api/toolbox          工具箱数据
   - GET  /api/models/stp-files STP文件列表
   - POST /api/models/convert    STP转GLB
   - GET  /api/models/glb/:name 获取GLB文件
`)
})

export default app
