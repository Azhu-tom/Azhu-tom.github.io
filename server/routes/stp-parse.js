/**
 * STP 文件解析 API（基于 occt-import-js / OpenCASCADE WASM）
 *
 * 功能：
 * 1. 解析 STP/STEP 格式的 CAD 文件，输出 Three.js 可用的网格数据
 * 2. 自动缓存解析结果，避免重复计算（首次慢，后续快）
 * 3. 支持多零件装配结构（多个mesh）
 *
 * API 端点：
 * - GET  /api/stp-parse/:filename     — 获取STP文件的网格数据JSON
 * - GET  /api/stp-parse/status/:filename — 查询缓存状态
 * - DELETE /api/stp-parse/cache/:filename — 清除指定文件缓存
 * - GET  /api/stp-parse/list          — 列出所有已缓存的文件
 *
 * 数据流：
 *   STP文件 → occt-import-js(ReadStepFile) → JSON(网格数据) → 缓存 → 返回前端
 */

import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// ==================== 配置 ====================
// STP 源文件根目录（从 server/routes/ 往上3层到达 07-workbuddy工具创建/）
const STP_SOURCE_ROOT = path.resolve(__dirname, '../../../通用件模型库资料/图纸')

// 缓存目录（相对于 server/）
const CACHE_DIR = path.resolve(__dirname, '../cache/stp-mesh')

// OCCT 实例（全局复用，避免重复初始化WASM）
let occtInstance = null
let occtInitPromise = null

// 三角化参数配置
const DEFAULT_TESSELLATION_PARAMS = {
  linearDeflection: 0.3,        // 线性偏差（越小越精确但越慢）
  linearDeflectionType: 'bounding_box_ratio',  // 偏差类型
  angularDeflection: 0.5,       // 角度偏差（弧度）
  linearUnit: 'millimeter'      // 输出单位：毫米
}

// ==================== 初始化 OCCT ====================
async function getOCCT() {
  if (occtInstance) return occtInstance
  
  if (!occtInitPromise) {
    occtInitPromise = import('occt-import-js').then(async (mod) => {
      const instance = await mod.default()
      occtInstance = instance
      console.log('[STP-Parse] OCCT engine initialized successfully')
      return instance
    }).catch(err => {
      console.error('[STP-Parse] Failed to initialize OCCT:', err.message)
      throw err
    })
  }
  
  return occtInitPromise
}

// ==================== 工具函数 ====================

/**
 * 递归查找STP文件
 */
function findStpFile(filename) {
  const candidates = [filename]
  
  // 尝试不同扩展名
  if (!filename.toLowerCase().endsWith('.stp') && !filename.toLowerCase().endsWith('.step')) {
    candidates.push(filename + '.stp')
    candidates.push(filename + '.step')
  }
  
  // 在所有子目录中搜索
  function searchInDir(dir) {
    try {
      if (!fs.statSync(dir).isDirectory()) return null
      for (const f of fs.readdirSync(dir)) {
        const fp = path.join(dir, f)
        try {
          const stat = fs.statSync(fp)
          if (stat.isFile() && candidates.includes(f)) {
            return fp
          }
          if (stat.isDirectory()) {
            const found = searchInDir(fp)
            if (found) return found
          }
        } catch (e) { /* skip */ }
      }
    } catch (e) { /* skip */ }
    return null
  }

  return searchInDir(STP_SOURCE_ROOT)
}

/**
 * 确保缓存目录存在
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
}

/**
 * 获取缓存文件路径
 */
function getCachePath(filename) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return path.join(CACHE_DIR, safeName + '.json')
}

/**
 * 检查缓存是否存在且有效
 */
function getCachedMeshData(filename) {
  const cachePath = getCachePath(filename)
  try {
    if (fs.existsSync(cachePath)) {
      const raw = fs.readFileSync(cachePath, 'utf-8')
      const data = JSON.parse(raw)
      
      // 验证数据完整性
      if (data.success && data.meshes && Array.isArray(data.meshes) && data.meshes.length > 0) {
        data._cached = true
        data._cacheTime = fs.statSync(cachePath).mtime.toISOString()
        return data
      }
    }
  } catch (e) {
    console.warn('[STP-Parse] Cache read error:', e.message)
  }
  return null
}

/**
 * 将OCCT结果精简为前端渲染需要的格式
 * 移除不必要的字段，减少传输体积
 */
function simplifyForRendering(result) {
  if (!result || !result.meshes) return result
  
  const simplified = {
    success: result.success,
    root: {
      name: result.root?.name || '',
      meshes: result.root?.meshes || [],
      children: []
    },
    meshes: [],
    stats: {
      totalVertices: 0,
      totalTriangles: 0,
      meshCount: result.meshes.length,
      boundingBox: null
    }
  }
  
  let minV = [Infinity, Infinity, Infinity]
  let maxV = [-Infinity, -Infinity, -Infinity]
  
  for (const mesh of result.meshes) {
    const posArray = mesh.attributes?.position?.array
    
    const simpleMesh = {
      name: mesh.name || '',
      color: mesh.color || null,
      attributes: {
        position: {
          count: posArray ? posArray.length : 0
        },
        normal: mesh.attributes?.normal ? { count: mesh.attributes.normal.array.length } : null
      },
      index: mesh.index ? { count: mesh.index.array.length } : null
    }
    
    // 计算边界框
    if (posArray && posArray.length >= 3) {
      for (let i = 0; i < posArray.length; i += 3) {
        for (let j = 0; j < 3; j++) {
          minV[j] = Math.min(minV[j], posArray[i + j])
          maxV[j] = Math.max(maxV[j], posArray[i + j])
        }
      }
      simplified.stats.totalVertices += posArray.length / 3
    }
    
    if (mesh.index?.array) {
      simplified.stats.totalTriangles += mesh.index.array.length / 3
    }
    
    // 保留完整属性数据供前端使用
    simpleMesh.attributes.position.array = posArray
    simpleMesh.attributes.normal = mesh.attributes?.normal || null
    simpleMesh.index = mesh.index || null
    
    // BREP 面信息（用于按面着色）
    simpleMesh.brep_faces = mesh.brep_faces || null
    
    simplified.meshes.push(simpleMesh)
  }
  
  // 计算边界框中心点和尺寸
  if (isFinite(minV[0]) && isFinite(maxV[0])) {
    const center = [
      (minV[0] + maxV[0]) / 2,
      (minV[1] + maxV[1]) / 2,
      (minV[2] + maxV[2]) / 2
    ]
    const size = [
      maxV[0] - minV[0],
      maxV[1] - minV[1],
      maxV[2] - minV[2]
    ]
    simplified.stats.boundingBox = { min: minV, max: maxV, center, size }
    
    // 归一化顶点到中心点（让模型居中显示）
    for (const mesh of simplified.meshes) {
      if (mesh.attributes.position.array) {
        const arr = mesh.attributes.position.array
        for (let i = 0; i < arr.length; i += 3) {
          arr[i] -= center[0]
          arr[i + 1] -= center[1]
          arr[i + 2] -= center[2]
        }
      }
    }
  }
  
  return simplified
}

/**
 * 写入缓存
 */
function writeCache(filename, data) {
  ensureCacheDir()
  const cachePath = getCachePath(filename)
  try {
    fs.writeFileSync(cachePath, JSON.stringify(data), 'utf-8')
    return true
  } catch (e) {
    console.error('[STP-Parse] Cache write error:', e.message)
    return false
  }
}


// ==================== API 路由 ====================

/**
 * GET /api/stp-parse/:filename
 * 
 * 解析STP文件并返回Three.js可用的网格数据
 * 
 * Query params:
 * - force=true  — 强制重新解析（忽略缓存）
 * - precision=0.3 — 线性精度（默认0.3，值越小越精细）
 * 
 * 响应格式:
 * {
 *   success: true,
 *   filename: "xxx.stp",
 *   cached: true/false,
 *   parseTime: 1234,       // ms
 *   fileSize: 567890,       // bytes
 *   stats: { ... },         // 统计信息
 *   meshes: [...],          // 网格数组
 *   root: { ... }           // 层次结构
 * }
 */
router.get('/stp-parse/:filename', async (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const forceRefresh = req.query.force === 'true'
  const customPrecision = parseFloat(req.query.precision)
  const precision = isFinite(customPrecision) ? customPrecision : DEFAULT_TESSELLATION_PARAMS.linearDeflection
  
  console.log(`[STP-Parse] Request: ${filename} (force=${forceRefresh}, precision=${precision})`)
  
  try {
    // 1. 检查缓存
    if (!forceRefresh) {
      const cached = getCachedMeshData(filename)
      if (cached) {
        console.log(`[STP-Parse] Cache hit: ${filename}`)
        return res.json({
          ...cached,
          filename,
          cached: true,
          parseTime: 0
        })
      }
    }
    
    // 2. 查找STP文件
    const filePath = findStpFile(filename)
    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: `STP file not found: ${filename}`,
        hint: 'Check that the file exists in the model library directory'
      })
    }
    
    // 3. 读取文件
    const fileBuffer = fs.readFileSync(filePath)
    const fileSize = fileBuffer.length
    console.log(`[STP-Parse] Found: ${path.basename(filePath)} (${(fileSize/1024).toFixed(1)}KB)`)
    
    // 4. 初始化OCCT引擎
    const occt = await getOCCT()
    
    // 5. 解析STP
    const tessellationParams = {
      ...DEFAULT_TESSELLATION_PARAMS,
      linearDeflection: precision
    }
    
    const startTime = Date.now()
    const rawResult = occt.ReadStepFile(new Uint8Array(fileBuffer), tessellationParams)
    const parseTime = Date.now() - startTime
    console.log(`[STP-Parse] Parsed in ${parseTime}ms: ${rawResult.meshes?.length || 0} meshes`)
    
    if (!rawResult.success) {
      return res.status(422).json({
        success: false,
        error: 'Failed to parse STEP file',
        details: rawResult
      })
    }
    
    // 6. 精简数据
    const simplified = simplifyForRendering(rawResult)
    simplified.filename = filename
    simplified.fileSize = fileSize
    simplified.parseTime = parseTime
    simplified.cached = false
    simplified.tessellationParams = tessellationParams
    
    // 7. 写入缓存
    writeCache(filename, simplified)
    
    // 8. 返回
    res.json(simplified)
    
  } catch (err) {
    console.error('[STP-Parse] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    })
  }
})


/**
 * GET /api/stp-parse/status/:filename
 * 查询某个STP文件的缓存状态（不触发解析）
 */
router.get('/stp-parse/status/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const cached = getCachedMeshData(filename)
  const filePath = findStpFile(filename)
  
  res.json({
    filename,
    hasSource: !!filePath,
    sourceSize: filePath ? fs.statSync(filePath).size : 0,
    hasCache: !!cached,
    cacheInfo: cached ? {
      time: cached._cacheTime,
      meshCount: cached.stats?.meshCount,
      vertices: cached.stats?.totalVertices,
      triangles: cached.stats?.totalTriangles
    } : null
  })
})


/**
 * DELETE /api/stp-parse/cache/:filename
 * 删除指定文件的缓存
 */
router.delete('/stp-parse/cache/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const cachePath = getCachePath(filename)
  
  try {
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath)
      res.json({ success: true, message: `Cache deleted for ${filename}` })
    } else {
      res.json({ success: true, message: 'No cache found' })
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})


/**
 * GET /api/stp-parse/list
 * 列出所有已缓存的STP文件及其统计信息
 */
router.get('/stp-parse/list', (req, res) => {
  ensureCacheDir()
  
  try {
    const files = fs.readdirSync(CACHE_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, f), 'utf-8'))
          const stat = fs.statSync(path.join(CACHE_DIR, f))
          return {
            filename: f.replace('.json', ''),
            cacheTime: stat.mtime.toISOString(),
            cacheSize: stat.size,
            stats: data.stats
          }
        } catch (e) {
          return { filename: f, error: e.message }
        }
      })
    
    res.json({
      count: files.length,
      files
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})


export default router
