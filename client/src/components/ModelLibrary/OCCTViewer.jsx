/**
 * CADModelViewer - 真实STP模型3D查看器（前端WASM版）
 *
 * 双模式渲染：
 * 1. **真实STP模式**：用 occt-import-js (WASM) 在浏览器端直接解析 STP → Three.js精确渲染
 * 2. **占位模式**：无STP文件或解析失败时，显示按类别生成的几何体占位
 *
 * 技术架构：
 * - 解析: occt-import-js (OpenCASCADE WASM) 纯前端运行，无需后端
 * - 渲染: Three.js 根据几何数据重建BufferGeometry → PBR材质渲染
 * - 兼容: 仍支持旧版后端 API（向后兼容）
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import './OCCTViewer.css'

// ==================== 几何体占位配置 ====================
const GEO_CONFIG = {
  pump:    { name: '增压泵', parts: [
    { type: 'cylinder', args: [0.4, 0.5, 1.2, 16], pos: [0,0,0], color: '#2563eb', metalness: 0.7 },
    { type: 'cylinder', args: [0.52, 0.52, 0.15, 24], pos: [0,0.6,0], color: '#1e40af', metalness: 0.8 },
    { type: 'cylinder', args: [0.52, 0.52, 0.15, 24], pos: [0,-0.6,0], color: '#1e40af', metalness: 0.8 },
    { type: 'box', args: [0.3, 0.25, 0.35], pos: [0.38,0,0], color: '#16a34a', metalness: 0.65 },
  ], scale: 1.2 },
  filter:  { name: '滤芯', parts: [
    { type: 'cylinder', args: [0.45, 0.45, 1.8, 20], pos: [0,0,0], color: '#e2e8f0', metalness: 0.15 },
    { type: 'cylinder', args: [0.48, 0.48, 0.12, 24], pos: [0,0.9,0], color: '#94a3b8', metalness: 0.6 },
    { type: 'cylinder', args: [0.36, 0.42, 0.25, 12], pos: [0,-0.85,0], color: '#15803d', metalness: 0.72 },
  ], scale: 1.0 },
  valve:   { name: '电磁阀', parts: [
    { type: 'box', args: [0.7, 0.55, 0.55], pos: [0,0,0], color: '#15803d', metalness: 0.75 },
    { type: 'sphere', args: [0.22, 12, 10], pos: [0,0.42,0], color: '#dc2626', metalness: 0.4 },
    { type: 'cylinder', args: [0.08, 0.08, 0.28], pos: [0,0.58,0], color: '#737373', metalness: 0.85 },
    { type: 'cylinder', args: [0.13, 0.13, 0.18], pos: [-0.44,0,0], color: '#94a3b8', metalness: 0.7 },
    { type: 'cylinder', args: [0.13, 0.13, 0.18], pos: [0.44,0,0], color: '#94a3b8', metalness: 0.7 },
  ], scale: 1.1 },
  fitting: { name: '管接件', parts: [
    { type: 'cylinder', args: [0.14, 0.14, 0.85, 6], pos: [0,0,0], color: '#c2410c', metalness: 0.78 },
    { type: 'cylinder', args: [0.19, 0.17, 0.12, 6], pos: [0,0.42,0], color: '#ea580c', metalness: 0.75 },
    { type: 'cylinder', args: [0.17, 0.19, 0.12, 6], pos: [0,-0.42,0], color: '#ea580c', metalness: 0.75 },
  ], scale: 1.3 },
  adapter: { name: '适配器', parts: [
    { type: 'cylinder', args: [0.18, 0.01, 0.55, 16], pos: [0,0,0], color: '#7e22ce', metalness: 0.7 },
    { type: 'cylinder', args: [0.26, 0.26, 0.1, 20], pos: [0,0.27,0], color: '#a855f7', metalness: 0.65 },
    { type: 'box', args: [0.34, 0.08, 0.34], pos: [0,-0.32,0], color: '#6b21a8', metalness: 0.75 },
  ], scale: 1.4 },
  screw:   { name: '螺钉/紧固件', parts: [
    { type: 'torus', args: [0.32, 0.06, 10, 24], pos: [0,0,0], color: '#64748b', metalness: 0.88 },
    { type: 'box', args: [0.46, 0.05, 0.06], pos: [0,0.04,0], color: '#334155', metalness: 0.9 },
  ], scale: 1.5 },
  default: { name: '通用零件', parts: [
    { type: 'box', args: [0.55, 0.55, 0.55], pos: [0,0,0], color: '#0891b2', metalness: 0.6 },
    { type: 'cylinder', args: [0.09, 0.09, 0.9, 12], pos: [0,0,0], color: '#00d4ff', metalness: 0.5, opacity: 0.4 },
  ], scale: 1.2 },
}

// ==================== 主组件 ====================
export default function CADModelViewer({
  fileId = null,
  fileName = '',
  modelType = 'default',
  width = '100%',
  height = '500px',
  showControls = true,
  autoRotate = true,
  backgroundColor = '#f8fafc',
  onLoaded = null,
  onError = null,
}) {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const frameIdRef = useRef(null)
  const modelGroupRef = useRef(null)
  const resizeObserverRef = useRef(null)

  // 交互 refs
  const isDragging = useRef(false)
  const isPanning = useRef(false)
  const prevMousePos = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ x: 0.4, y: 0.6 })
  const zoomRef = useRef(5)
  const defaultZoomRef = useRef(5)
  const panOffsetRef = useRef({ x: 0, y: 0 })
  const autoRotateRef = useRef(autoRotate)

  // 平滑动画相关refs（新增）
  const animTargetZoomRef = useRef(null)
  const animTargetRotRef = useRef(null)
  const animTargetPanRef = useRef(null)
  const isAnimatingRef = useRef(false)

  // ---- State ----
  const [phase, setPhase] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [wireframe, setWireframe] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate)
  const [modelInfo, setModelInfo] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const geoConfig = GEO_CONFIG[modelType] || GEO_CONFIG.default

  // ==================== 加载STP数据（纯前端 WASM）====================
  const occtRef = useRef(null)  // occt-import-js 单例
  const occtReadyRef = useRef(false)  // WASM 已加载

  // 初始化 occt-import-js：用 <script> 加载 UMD 版本（解决 ESM 动态加载的 wasm 路径问题）
  const ensureOCCT = useCallback(async () => {
    if (occtRef.current && occtReadyRef.current) return occtRef.current
    try {
      // 1. 预加载 wasm 字节
      let wasmBinary = null
      try {
        const wasmResp = await fetch('/wasm/occt-import-js.wasm')
        if (wasmResp.ok) {
          wasmBinary = new Uint8Array(await wasmResp.arrayBuffer())
          console.log(`[CADModelViewer] WASM 预加载完成: ${wasmBinary.byteLength} bytes`)
        }
      } catch (wasmErr) {
        console.warn('[CADModelViewer] WASM 预加载失败:', wasmErr.message)
      }

      // 2. 通过 <script> 标签加载 occt-import-js.js（UMD）
      //    这样 document.currentScript 能正确设置，wasm 路径才能解析
      if (!window.occtimportjs) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = '/wasm/occt-import-js.js'
          script.async = false
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('occt-import-js.js 加载失败'))
          document.head.appendChild(script)
        })
      }

      if (!window.occtimportjs) {
        throw new Error('occt-import-js 未暴露到 window.occtimportjs')
      }

      // 3. 调用工厂函数创建 Module 实例（传入 wasmBinary）
      const occtModule = window.occtimportjs({ wasmBinary })

      // 4. 设置 locateFile（备用）
      occtModule.locateFile = (path) => {
        if (path.endsWith('.wasm')) return `/wasm/${path}`
        return path
      }

      // 5. 等待运行时初始化
      if (!occtModule.calledRun) {
        await new Promise((resolve, reject) => {
          let resolved = false
          occtModule.onRuntimeInitialized = () => {
            if (!resolved) { resolved = true; resolve() }
          }
          // 兜底：3 秒内还没初始化就主动 resolve
          setTimeout(() => {
            if (!resolved && occtModule.calledRun) {
              resolved = true
              resolve()
            }
          }, 3000)
          occtModule.onAbort = (reason) => {
            if (!resolved) {
              resolved = true
              reject(new Error('OCCT WASM abort: ' + reason))
            }
          }
        })
      }

      occtRef.current = occtModule
      occtReadyRef.current = true
      console.log('[CADModelViewer] occt-import-js 初始化完成 (calledRun=' + occtModule.calledRun + ')')
      return occtModule
    } catch (err) {
      console.error('[CADModelViewer] OCCT init failed:', err)
      throw err
    }
  }, [])

  // 加载真实模型：先尝试后端 API，失败则回退到前端 WASM
  const loadRealMeshData = useCallback(async (onProgress) => {
    if (!fileName) return null

    // 路径 1: 尝试后端 API（开发环境兼容）
    try {
      const apiUrl = `/api/stp-parse/${encodeURIComponent(fileName)}`
      const response = await fetch(apiUrl, { signal: AbortSignal.timeout(3000) })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.meshes && data.meshes.length > 0) {
          if (onProgress) onProgress(90)
          return data
        }
      }
    } catch (_) { /* 继续 fallback */ }

    // 路径 2: 浏览器端 occt-import-js 直接解析（GitHub Pages 部署关键）
    try {
      if (onProgress) onProgress(15)
      const occt = await ensureOCCT()
      if (onProgress) onProgress(40)

      // 构造 STP 文件 URL（前端 public 目录或模型下载 API）
      const stpUrls = [
        `/models/${encodeURIComponent(fileName)}`,
        `/api/models/download-stp/${encodeURIComponent(fileName)}`,
        `/api/models/download/${encodeURIComponent(fileName)}`,
      ]

      let stpBuffer = null
      let lastErr = null
      for (const url of stpUrls) {
        try {
          const resp = await fetch(url)
          if (resp.ok) {
            stpBuffer = await resp.arrayBuffer()
            break
          }
        } catch (e) {
          lastErr = e
        }
      }
      if (!stpBuffer) {
        throw new Error(`STP 文件下载失败: ${lastErr?.message || '所有 URL 都不可用'}`)
      }

      if (onProgress) onProgress(70)
      // 解析 STP 文件
      const result = occt.ReadStepFile(new Uint8Array(stpBuffer), {
        linearPrecision: 0.01,    // 几何精度
        angularPrecision: 0.5,
        linearTolerance: 0.1,
        angularTolerance: 0.5,
      })

      if (!result || !result.meshes || result.meshes.length === 0) {
        throw new Error('STP 解析结果为空（无 mesh 数据）')
      }

      if (onProgress) onProgress(95)
      console.log(`[CADModelViewer] WASM 解析成功: ${result.meshes.length} 个 mesh`)

      // 转换格式：occt-import-js 格式 → Three.js BufferGeometry 格式
      //   WASM:  { vertices: Float32Array, normals: Float32Array, indices: Uint32Array }
      //   TJS:   { attributes: { position: {array}, normal: {array} }, index: {...} }
      const convertedMeshes = result.meshes.map(m => ({
        attributes: {
          position: { array: m.vertices || m.attributes?.position?.array || [] },
          normal: { array: m.normals || m.attributes?.normal?.array || [] },
        },
        index: { array: m.indices || m.attributes?.index?.array || [] },
      }))

      return {
        success: true,
        meshes: convertedMeshes,
        source: 'wasm',
      }
    } catch (err) {
      console.warn('[CADModelViewer] WASM 解析失败:', err.message)
      return null
    }
  }, [fileName, ensureOCCT])

  // ==================== 构建真实模型 ====================
  // CAD导出的STP常包含离群顶点（辅助几何/坐标标记），需要IQR检测清理
  const buildRealModel = useCallback((THREE, meshData) => {
    const group = new THREE.Group()

    const meshes = meshData.meshes || []
    // 安全过滤：排除null/undefined以及没有有效position数据的条目
    const validMeshes = meshes.filter(m => {
      if (m == null) return false
      if (!m.attributes) return false
      if (!m.attributes.position) return false
      if (!m.attributes.position.array) return false
      if (!Array.isArray(m.attributes.position.array) && !(m.attributes.position.array instanceof Float32Array)) return false
      return true
    })

    console.log(`[CADModelViewer] Filtered meshes: ${validMeshes.length}/${meshes.length} valid`)

    if (validMeshes.length === 0) {
      return group
    }

    // 收集所有顶点用于离群检测
    const allPositions = []

    for (let i = 0; i < validMeshes.length; i++) {
      try {
        const meshInfo = validMeshes[i]
        const attrs = meshInfo.attributes

        const positions = new Float32Array(attrs.position.array)
        allPositions.push(positions)

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

        if (attrs.normal?.array) {
          geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(attrs.normal.array), 3))
        } else {
          geometry.computeVertexNormals()
        }

        if (meshInfo.index?.array) {
          geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(meshInfo.index.array), 1))
        }

        const material = new THREE.MeshStandardMaterial({
          color: 0xe8eaed,
          metalness: 0.15,
          roughness: 0.55,
          side: THREE.DoubleSide,
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.name = (meshInfo != null && typeof meshInfo.name === 'string') ? meshInfo.name : `mesh_${i}`
        mesh.castShadow = true
        mesh.receiveShadow = true
        group.add(mesh)
      } catch (meshErr) {
        console.warn(`[CADModelViewer] Skip mesh[${i}]:`, meshErr.message)
      }
    }

    // ====== IQR离群检测：计算鲁棒包围盒 ======
    // CAD文件常含远处的坐标原点、辅助几何或文本标注点
    // 用IQR法排除这些离群点，只保留实际模型主体的包围盒
    try {
      const totalVerts = allPositions.reduce((sum, arr) => sum + arr.length / 3, 0)
      // 只对超过2000顶点的模型做离群检测（小零件不需要）
      if (totalVerts > 2000 && allPositions.length > 0) {
        // 合并所有位置数据
        const merged = new Float32Array(totalVerts * 3)
        let offset = 0
        for (const arr of allPositions) {
          merged.set(arr, offset)
          offset += arr.length
        }

        // 按X/Y/Z分别做IQR统计
        const axes = ['x', 'y', 'z']
        const ranges = {}  // 每轴的 [q1-1.5*iqr, q3+1.5*iqr]

        for (let axisIdx = 0; axisIdx < 3; axisIdx++) {
          const vals = []
          for (let i = axisIdx; i < merged.length; i += 3) {
            vals.push(merged[i])
          }
          vals.sort((a, b) => a - b)
          const n = vals.length
          const q1Idx = Math.floor(n * 0.25)
          const q3Idx = Math.floor(n * 0.75)
          const q1 = vals[q1Idx]
          const q3 = vals[q3Idx]
          const iqr = q3 - q1
          ranges[axes[axisIdx]] = [
            q1 - 1.5 * iqr,
            q3 + 1.5 * iqr
          ]
        }

        // 计算鲁棒包围盒
        let robustMin = [Infinity, Infinity, Infinity]
        let robustMax = [-Infinity, -Infinity, -Infinity]
        let inlierCount = 0

        for (let i = 0; i < merged.length; i += 3) {
          const x = merged[i], y = merged[i+1], z = merged[i+2]
          if (x >= ranges.x[0] && x <= ranges.x[1] &&
              y >= ranges.y[0] && y <= ranges.y[1] &&
              z >= ranges.z[0] && z <= ranges.z[1]) {
            inlierCount++
            robustMin[0] = Math.min(robustMin[0], x)
            robustMin[1] = Math.min(robustMin[1], y)
            robustMin[2] = Math.min(robustMin[2], z)
            robustMax[0] = Math.max(robustMax[0], x)
            robustMax[1] = Math.max(robustMax[1], y)
            robustMax[2] = Math.max(robustMax[2], z)
          }
        }

        const outlierRatio = 1 - inlierCount / (totalVerts)
        // 如果离群点占比>10%，说明确实有离群污染，使用鲁棒box
        if (outlierRatio > 0.10) {
          const rawBox = new THREE.Box3().setFromObject(group)
          const rawSize = rawBox.getSize(new THREE.Vector3())
          const robustSize = new THREE.Vector3(
            robustMax[0] - robustMin[0],
            robustMax[1] - robustMin[1],
            robustMax[2] - robustMin[2]
          )
          const shrinkRatio = rawSize.length() / Math.max(robustSize.length(), 0.001)

          console.log(`[CADModelViewer] 🔧 IQR离群检测: ${Math.round(outlierRatio*100)}%离群点, 包围盒缩小${shrinkRatio.toFixed(1)}x` +
                      `(raw=${rawSize.length().toFixed(1)}, robust=${robustSize.length().toFixed(1)})`)

          // 将鲁棒包围盒存到group.userData供autoFitCamera使用
          group.userData.robustBBox = {
            min: new THREE.Vector3(...robustMin),
            max: new THREE.Vector3(...robustMax),
            center: new THREE.Vector3(
              (robustMin[0] + robustMax[0]) / 2,
              (robustMin[1] + robustMax[1]) / 2,
              (robustMin[2] + robustMax[2]) / 2
            )
          }
        }
      }
    } catch (iqErr) {
      // IQR失败不影响正常渲染，静默降级
      console.warn('[CADModelViewer] IQR检测跳过:', iqErr.message)
    }

    return group
  }, [])

  // ==================== 构建占位模型 ====================
  const buildPlaceholderModel = useCallback((THREE) => {
    const group = new THREE.Group()
    
    geoConfig.parts.forEach(part => {
      try {
        let geometry
        switch (part.type) {
          case 'cylinder': geometry = new THREE.CylinderGeometry(...part.args); break
          case 'sphere':   geometry = new THREE.SphereGeometry(...part.args); break
          case 'torus':    geometry = new THREE.TorusGeometry(...part.args); break
          case 'cone':     geometry = new THREE.ConeGeometry(...part.args); break
          default:         geometry = new THREE.BoxGeometry(...part.args); break
        }
        if (!geometry) return

        const material = new THREE.MeshStandardMaterial({
          color: part.color || '#0891b2',
          metalness: part.metalness !== undefined ? part.metalness : 0.6,
          roughness: 0.25,
          transparent: part.opacity !== undefined,
          opacity: part.opacity !== undefined ? part.opacity : 1,
          wireframe: false,
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(...part.pos)
        mesh.castShadow = true
        mesh.receiveShadow = true
        group.add(mesh)
      } catch (partErr) {
        console.warn('[CADModelViewer] Skip placeholder part:', partErr.message)
      }
    })

    group.scale.setScalar(geoConfig.scale || 1)
    return group
  }, [geoConfig])

  // ==================== 相机自动适配（完整版）====================
  // 核心算法：基于包围盒 + 视口宽高比 + 模型形状 → 精确计算相机距离
  // 保证模型在宽度和高度方向上均完整可见，支持平滑过渡动画
  //
  // 算法原理：
  //   相机从斜角观察时，模型的"屏幕投影尺寸"由3个维度共同决定
  //   分别计算水平方向和垂直方向的投影跨度，取较大者作为约束
  //   这样无论细长型(管件)还是扁平型(垫片)都能完整显示

  const autoFitCamera = useCallback((modelGroup, options = {}) => {
    if (!modelGroup || !cameraRef.current) return

    const { smooth = true, duration = 0.6 } = options

    // ====== Step 1: 获取包围盒（优先使用IQR鲁棒盒）======
    let box, center
    const robustBBox = modelGroup.userData && modelGroup.userData.robustBBox

    if (robustBBox) {
      box = new THREE.Box3().set(robustBBox.min, robustBBox.max)
      center = robustBBox.center.clone()
      console.log(`[CADModelViewer] 使用鲁棒包围盒(IQR清理后): size=[${box.getSize(new THREE.Vector3()).toArray().map(v=>v.toFixed(1)).join(',')}]`)
    } else {
      box = new THREE.Box3().setFromObject(modelGroup)
      if (box.isEmpty()) {
        console.warn('[CADModelViewer] autoFit: 包围盒为空')
        return
      }
      center = box.getCenter(new THREE.Vector3())
    }

    const size = box.getSize(new THREE.Vector3())
    const sx = size.x, sy = size.y, sz = size.z
    console.log(`[CADModelViewer] 模型包围盒: ${sx.toFixed(2)} × ${sy.toFixed(2)} × ${sz.toFixed(2)}`)

    // ====== Step 2: 将模型居中到原点 ======
    modelGroup.position.sub(center)
    panOffsetRef.current = { x: 0, y: 0 }

    // ====== Step 3: 获取视口参数 ======
    const camera = cameraRef.current
    const fovRad = (camera.fov * Math.PI) / 180
    const container = containerRef.current
    const viewW = container ? container.clientWidth : (parseInt(width) || 420)
    const viewH = container ? container.clientHeight : (parseInt(height) || 360)
    const viewAspect = viewW / viewH  // 画布宽高比 >1横屏, <1竖屏

    // ====== Step 4: 计算视角参数 ======
    // 固定俯角36° + 侧偏角，呈现立体感
    // 这个角度决定了3个轴在屏幕上的投影权重
    const pitchAngle = Math.PI / 5        // 俯角 36°
    const yawOffset = 0.7                   // 侧偏系数 (0=正前方, 1=纯侧面)
    const sinPitch = Math.sin(pitchAngle)
    const cosPitch = Math.cos(pitchAngle)

    // ====== Step 5: 计算模型在视平面上的投影尺寸 ======
    // 从斜上方观察时，每个世界坐标轴在屏幕上的投影分量：
    //
    //   屏幕水平方向 ≈ X轴*cos(yaw) + Z轴*sin(yaw)  [绕Y旋转的影响]
    //   屏幕垂直方向 ≈ Y轴*cos(pitch) + Z轴*sin(pitch)  [俯仰的影响]
    //
    // 注意：这是保守估计——考虑最坏情况下的投影跨度

    // 水平投影跨度（X和Z轴的贡献）
    const projH = sx * cosPitch + sz * yawOffset * 0.8
    // 垂直投影跨度（Y和Z轴的贡献）
    const projV = sy * cosPitch + sz * sinPitch * 0.6

    // 取较大的投影维度
    const projMax = Math.max(projH, projV)
    const projMin = Math.min(projH, projV)

    // 形状比例：1.0=正方体, >1=细长型, <1=扁平型
    const shapeRatio = projMax / Math.max(projMin, 0.001)

    console.log(`[CADModelViewer] 投影尺寸: H=${projH.toFixed(2)}, V=${projV.toFixed(2)}, 形状比=${shapeRatio.toFixed(2)}, 视口比=${viewAspect.toFixed(2)}`)

    // ====== Step 6: 基于视口+模型形状计算精确距离 ======
    // 关键改进：分别计算水平和垂直方向的所需距离，取较大值确保完全容纳

    // 方法A：按垂直方向算距离（对应FOV的竖直张角）
    const distV = (projV / 2 * 1.65) / Math.tan(fovRad / 2)

    // 方法B：按水平方向算距离（需要换算成等效的水平FOV）
    // 水平FOV = 2 * arctan(tan(fov/2) * aspectRatio)
    const hFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * viewAspect)
    const distH = (projH / 2 * 1.65) / Math.tan(hFovRad / 2)

    // 取较大值确保两个方向都装得下
    let targetDistance = Math.max(distV, distH)

    // 安全边界
    targetDistance = Math.max(targetDistance, Math.max(sx, sy, sz) * 0.8)
    targetDistance = Math.max(targetDistance, 0.05)
    targetDistance = Math.min(targetDistance, 500)

    // 边距系数：根据形状微调
    // 细长零件需要稍大边距避免贴边感
    const marginFactor = shapeRatio > 2.5 ? 1.15 : (shapeRatio < 0.4 ? 1.12 : 1.08)
    targetDistance *= marginFactor

    console.log(`[CADModelViewer] 距离计算: distH=${distH.toFixed(2)}, distV=${distV.toFixed(2)}, 目标=${targetDistance.toFixed(2)} (margin=${marginFactor.toFixed(2)})`)

    // ====== Step 7: 设置目标相机位置 ======
    const tx = targetDistance * sinPitch * yawOffset
    const ty = targetDistance * sinPitch
    const tz = targetDistance * cosPitch

    // 更新基准缩放值
    zoomRef.current = targetDistance
    defaultZoomRef.current = targetDistance

    // ====== Step 8: 平滑过渡或直接设置 ======
    if (smooth && !options.instant) {
      // 启动平滑动画
      animTargetZoomRef.current = targetDistance
      animTargetRotRef.current = { x: rotationRef.current.x, y: rotationRef.current.y }
      animTargetPanRef.current = { x: 0, y: 0 }
      isAnimatingRef.current = true

      // 记录起始状态用于插值
      const startZoom = zoomRef.current
      const startPos = camera.position.clone()
      const startTime = performance.now()
      const animDur = duration * 1000  // ms

      const animateToTarget = () => {
        const elapsed = performance.now() - startTime
        const t = Math.min(elapsed / animDur, 1)
        // easeOutCubic 缓动曲线：快→慢，自然减速
        const ease = 1 - Math.pow(1 - t, 3)

        const curZ = startZoom + (targetDistance - startZoom) * ease
        zoomRef.current = curZ

        if (cameraRef.current) {
          cameraRef.current.position.set(
            panOffsetRef.current.x + curZ * sinPitch * yawOffset,
            panOffsetRef.current.y + curZ * sinPitch,
            curZ * cosPitch
          )
          cameraRef.current.lookAt(panOffsetRef.current.x, panOffsetRef.current.y, 0)
        }

        if (t < 1 && isAnimatingRef.current) {
          requestAnimationFrame(animateToTarget)
        } else {
          isAnimatingRef.current = false
          // 最终精确定位
          if (cameraRef.current) {
            cameraRef.current.position.set(tx, ty, tz)
            cameraRef.current.lookAt(0, 0, 0)
          }
        }
      }

      requestAnimationFrame(animateToTarget)
    } else {
      // 直接跳转（无动画）
      camera.position.set(tx, ty, tz)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
      isAnimatingRef.current = false
    }
  }, [])

  // ==================== 初始化3D场景（核心）====================
  useEffect(() => {
    if (!containerRef.current) return
    
    let mounted = true
    const container = containerRef.current
    
    // 清理之前的canvas（防止重复挂载）
    container.innerHTML = ''

    const init = async () => {
      // 使用局部变量收集结果，避免React闭包陷阱
      let finalMode = 'placeholder'
      let finalInfo = null
      let modelGroup = null
      
      try {
        setPhase('loading')
        setProgress(5)

        // 1. 动态导入 Three.js
        let THREE
        try {
          THREE = await import('three')
        } catch (importErr) {
          throw new Error(`Three.js加载失败: ${importErr.message}`)
        }
        
        if (!mounted || !containerRef.current) {
          console.log('[CADModelViewer] 组件已卸载，取消初始化')
          return
        }

        setProgress(15)
        // 从容器实际尺寸取宽高（CSS 已保证容器填满父级）
        const w = container.clientWidth || 420
        const h = container.clientHeight || 360

        // 2. 创建场景
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(backgroundColor)
        sceneRef.current = scene

        // 3. 创建相机
        const camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 1000)
        const initAngle = Math.PI / 5
        camera.position.set(
          zoomRef.current * Math.sin(initAngle) * 0.7,
          zoomRef.current * Math.sin(initAngle),
          zoomRef.current * Math.cos(initAngle)
        )
        camera.lookAt(0, 0, 0)
        cameraRef.current = camera

        // 4. 创建渲染器
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
        })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.1
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // 响应容器尺寸变化（窗口缩放/面板展开）
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const cw = entry.contentRect.width
            const ch = entry.contentRect.height
            if (cw > 0 && ch > 0 && rendererRef.current && cameraRef.current) {
              rendererRef.current.setSize(cw, ch)
              cameraRef.current.aspect = cw / ch
              cameraRef.current.updateProjectionMatrix()
            }
          }
        })
        resizeObserver.observe(container)
        resizeObserverRef.current = resizeObserver

        // 容器尺寸稳定后再 fit 一次（覆盖父级布局完成/异步加载场景）
        setTimeout(() => {
          if (mounted && cameraRef.current && modelGroupRef.current) {
            autoFitCamera(modelGroupRef.current)
          }
        }, 60)

        setProgress(30)

        // 5. 灯光
        scene.add(new THREE.AmbientLight(0xffffff, 0.45))
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
        mainLight.position.set(5, 8, 5)
        mainLight.castShadow = true
        mainLight.shadow.mapSize.set(1024, 1024)
        scene.add(mainLight)

        const fillLight = new THREE.DirectionalLight(0x88ccff, 0.35)
        fillLight.position.set(-4, 2, -4)
        scene.add(fillLight)

        const rimLight = new THREE.DirectionalLight(0xffaa44, 0.2)
        rimLight.position.set(0, -3, -5)
        scene.add(rimLight)

        setProgress(50)

        // 6. 网格地面（已隐藏，保持干净预览）
        // const gridHelper = new THREE.GridHelper(10, 20, 0xcbd5e1, 0xe2e8f0)
        // gridHelper.position.y = -1.3
        // scene.add(gridHelper)

        setProgress(65)

        // 7. ====== 创建模型（核心逻辑）======
        if (fileName && fileName.trim() !== '') {
          // 尝试加载真实STP
          setProgress(70)
          console.log(`[CADModelViewer] Loading STP: "${fileName}"`)
          
          const meshData = await loadRealMeshData((p) => {
            if (mounted) setProgress(p)
          })
          
          if (meshData && meshData.success) {
            modelGroup = buildRealModel(THREE, meshData)
            
            if (modelGroup && modelGroup.children.length > 0) {
              // ✅ 真实STP加载成功
              finalMode = 'real'
              const stats = meshData.stats || {}
              finalInfo = {
                name: fileName || 'STP Model',
                mode: 'real-stp',
                vertices: stats.totalVertices || 0,
                triangles: Math.round(stats.totalTriangles || 0),
                meshes: modelGroup.children.length,
                parseTime: meshData.parseTime || 0,
                cached: meshData.cached || false,
              }
              console.log(`[CADModelViewer] ✅ Real STP OK: ${modelGroup.children.length} meshes`)
            } else {
              // 有数据但构建失败 → 降级占位
              console.warn('[CADModelViewer] STP data valid but no meshes built, using placeholder')
              modelGroup = buildPlaceholderModel(THREE)
              finalInfo = { name: geoConfig.name, mode: 'placeholder' }
            }
          } else {
            // STP加载失败 → 占位
            console.log('[CADModelViewer] STP load failed, using placeholder')
            modelGroup = buildPlaceholderModel(THREE)
            finalInfo = { name: geoConfig.name, mode: 'placeholder' }
          }
        } else {
          // 无文件名 → 直接占位
          modelGroup = buildPlaceholderModel(THREE)
          finalInfo = { name: geoConfig.name, mode: 'placeholder' }
        }

        // 安全检查：确保modelGroup不为空
        if (!modelGroup) {
          console.warn('[CADModelViewer] modelGroup is null, creating fallback')
          modelGroup = new THREE.Group()
          finalInfo = { name: 'Empty', mode: 'placeholder' }
        }

        setRenderModeState(finalMode) // 用函数式更新避免闭包问题
        modelGroupRef.current = modelGroup
        scene.add(modelGroup)
        
        setProgress(90)

        // 8. 自动适配相机
        // 模型加载后立即尝试 fit；OCCT 解析过程中几何体可能仍在变化，
        // 用 5 帧重试确保最终包围盒稳定，避免初次 fit 误判
        let fitFrame = 0
        const tryFit = () => {
          if (!mounted) return
          fitFrame++
          if (cameraRef.current && modelGroupRef.current) {
            autoFitCamera(modelGroupRef.current)
          }
          // 最多重试 5 帧（80ms），AO/OCC 增量构建中后停止
          if (fitFrame < 5) {
            requestAnimationFrame(tryFit)
          }
        }
        requestAnimationFrame(tryFit)

        // 9. 交互事件
        setupInteraction(renderer, container)

        // 10. 动画循环
        startAnimation(scene, camera, renderer, mounted)

        // 11. 完成
        if (mounted) {
          setPhase('ready')
          setProgress(100)
          setModelInfo(finalInfo) // 更新state用于UI显示
          
          // 🔑 关键修复：用局部变量finalInfo回调，而非依赖state（解决闭包null陷阱）
          if (onLoaded && finalInfo) {
            try {
              onLoaded(finalInfo)
            } catch (cbErr) {
              console.warn('[CADModelViewer] onLoaded callback error:', cbErr.message)
            }
          }
        }

      } catch (err) {
        console.error('[CADModelViewer] Init ERROR:', err)
        if (mounted) {
          setPhase('error')
          setErrorMsg(err.message || '3D引擎初始化失败')
          if (onError) {
            try { onError(err) } catch(e) { /* ignore */ }
          }
        }
      }
    }

    init()

    // 清理函数
    return () => {
      mounted = false
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current)
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
      cleanupRenderer(container)
    }
  }, [retryKey, width, height, backgroundColor, fileName, loadRealMeshData, buildRealModel, buildPlaceholderModel, autoFitCamera, onLoaded, onError])

  // 用函数包装setState避免在useEffect依赖中直接引用setRenderMode
  const [, setRenderModeState] = useState('placeholder') // 内部使用不暴露

  // ==================== 交互系统 ====================
  const setupInteraction = useCallback((renderer, container) => {
    const canvas = renderer.domElement

    const onMouseDown = (e) => {
      if (e.button === 2) isPanning.current = true
      else isDragging.current = true
      autoRotateRef.current = false
      setIsAutoRotating(false)
      prevMousePos.current = { x: e.clientX, y: e.clientY }
    }
    
    const onMouseMove = (e) => {
      if (isDragging.current) {
        const dx = e.clientX - prevMousePos.current.x
        const dy = e.clientY - prevMousePos.current.y
        rotationRef.current.y += dx * 0.008
        rotationRef.current.x += dy * 0.008
        rotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.x))
        prevMousePos.current = { x: e.clientX, y: e.clientY }
      }
      if (isPanning.current) {
        panOffsetRef.current.x += (e.clientX - prevMousePos.current.x) * 0.002
        panOffsetRef.current.y -= (e.clientY - prevMousePos.current.y) * 0.002
        prevMousePos.current = { x: e.clientX, y: e.clientY }
      }
    }
    
    const onMouseUp = () => { isDragging.current = false; isPanning.current = false }
    const onWheel = (e) => { 
      e.preventDefault() 
      zoomRef.current = Math.max(1, Math.min(100, zoomRef.current + e.deltaY * 0.008)) 
    }
    const onContextMenu = (e) => e.preventDefault()

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)

    // 触摸支持
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging.current = true
        autoRotateRef.current = false
        setIsAutoRotating(false)
        prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
    const onTouchMove = (e) => {
      if (!isDragging.current || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - prevMousePos.current.x
      const dy = e.touches[0].clientY - prevMousePos.current.y
      rotationRef.current.y += dx * 0.008
      rotationRef.current.x += dy * 0.008
      rotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.x))
      prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onTouchEnd = () => { isDragging.current = false }

    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)

    // 存储清理引用
    renderer._cleanup = () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  // ==================== 动画循环 ====================
  const startAnimation = useCallback((scene, camera, renderer, mountedFlag) => {
    let lastTime = performance.now()

    const animate = () => {
      if (!mountedFlag) return
      frameIdRef.current = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now

      // 自动旋转（平滑过渡期间也允许，但不改变zoom）
      if (autoRotateRef.current && !isDragging.current && !isAnimatingRef.current) {
        rotationRef.current.y += delta * 0.6
      }

      // 更新模型变换
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.x = rotationRef.current.x
        modelGroupRef.current.rotation.y = rotationRef.current.y
        modelGroupRef.current.position.x = panOffsetRef.current.x
        modelGroupRef.current.position.y = panOffsetRef.current.y
      }

      // 更新相机位置
      // 注意：平滑过渡期间由autoFitCamera独立控制相机位置，此处跳过
      if (cameraRef.current && !isAnimatingRef.current) {
        const z = zoomRef.current
        const angle = Math.PI / 5   // 36度，与autoFitCamera一致
        cameraRef.current.position.set(
          panOffsetRef.current.x + z * Math.sin(angle) * 0.7,
          panOffsetRef.current.y + z * Math.sin(angle),
          z * Math.cos(angle)
        )
      }

      renderer.render(scene, camera)
    }
    animate()
  }, [])

  // ==================== 渲染器清理 ====================
  const cleanupRenderer = useCallback((container) => {
    if (rendererRef.current?._cleanup) {
      rendererRef.current._cleanup()
    }
    if (rendererRef.current) {
      try {
        rendererRef.current.dispose()
      } catch(e) { /* ignore */ }
    }
    if (sceneRef.current) {
      sceneRef.current.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          Array.isArray(child.material) 
            ? child.material.forEach(m => m.dispose()) 
            : child.material.dispose()
        }
      })
    }
    // 移除canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
  }, [])

  // ==================== 控制回调 ====================
  useEffect(() => {
    if (!modelGroupRef.current || phase !== 'ready') return
    modelGroupRef.current.traverse(child => {
      if (child.material?.wireframe !== undefined) {
        child.material.wireframe = wireframe
      }
    })
  }, [wireframe, phase])

  const toggleAutoRotate = useCallback(() => {
    autoRotateRef.current = !autoRotateRef.current
    setIsAutoRotating(autoRotateRef.current)
  }, [])
  
  const resetCamera = useCallback(() => {
    // 复位旋转角度
    rotationRef.current = { x: 0.4, y: 0.6 }
    const targetZoom = defaultZoomRef.current || 5
    zoomRef.current = targetZoom
    panOffsetRef.current = { x: 0, y: 0 }

    if (cameraRef.current) {
      const angle = Math.PI / 5
      cameraRef.current.position.set(
        targetZoom * Math.sin(angle) * 0.7,
        targetZoom * Math.sin(angle),
        targetZoom * Math.cos(angle)
      )
    }
    isAnimatingRef.current = false
  }, [])
  
  const handleRetry = useCallback(() => {
    // 重置所有状态
    setPhase('idle')
    setErrorMsg('')
    setProgress(0)
    setModelInfo(null)
    setWireframe(false)
    setIsAutoRotating(autoRotate)
    // 改变key触发完整重新挂载
    setRetryKey(k => k + 1)
  }, [autoRotate])

  // ==================== 渲染输出 ====================

  // 错误状态
  if (phase === 'error') {
    return (
      <div className="cmv-container" style={{ width, height }}>
        <div className="cmv-error-overlay">
          <div className="cmv-error-icon">&#9888;&#xFE0E;</div>
          <div className="cmv-error-title">3D 加载失败</div>
          <div className="cmv-error-msg">{errorMsg}</div>
          <button className="cmv-retry-btn" onClick={handleRetry}>&#128260; 重新加载</button>
        </div>
      </div>
    )
  }

  return (
    <div className="cmv-wrapper" key={`occt-v-${retryKey}`}>
      <div ref={containerRef} className="cmv-canvas-container" style={{
        width: '100%',
        height: '100%',
        backgroundColor: phase === 'idle' ? backgroundColor : undefined,
      }}>
        {/* 加载进度 */}
        {phase === 'loading' && (
          <div className="cmv-loading-overlay">
            <div className="cmv-spinner" />
            <div className="cmv-progress-bar">
              <div className="cmv-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="cmv-loading-text">
              {progress < 15   ? '初始化3D引擎...' :
               progress < 30   ? '创建场景...' :
               progress < 50   ? '配置灯光...' :
               progress < 70   ? '正在加载STP数据...' :
               progress < 90   ? '构建3D模型...' :
                               '渲染完成...'}
            </span>
          </div>
        )}

        {/* 控制栏 */}
        {showControls && phase === 'ready' && (
          <div className="cmv-controls-bar">
            <button className={`cmv-ctrl-btn ${wireframe ? 'active' : ''}`} onClick={() => setWireframe(!wireframe)} title="线框模式">
              &#9634; 线框
            </button>
            <button className={`cmv-ctrl-btn ${isAutoRotating ? 'active' : ''}`} onClick={toggleAutoRotate} title="自动旋转">
              &#8635; 旋转
            </button>
            <button className="cmv-ctrl-btn" onClick={resetCamera} title="重置视角">
              &#8999; 复位
            </button>
          </div>
        )}

        {/* 模型信息栏 */}
        {phase === 'ready' && modelInfo && (
          <div className="cmv-info-bar">
            <span className="cmv-info-type">
              {modelInfo.mode === 'real-stp' ? '&#128202;' : '&#128450;'} {(modelInfo.name || 'Model')}
            </span>
            {modelInfo.mode === 'real-stp' ? (
              <span className="cmv-info-detail cmv-real-badge">
                &#9989; 真实STP &middot; {(modelInfo.vertices||0).toLocaleString()}v &middot; 
                {(modelInfo.triangles||0).toLocaleString()}tris &middot; 
                {modelInfo.cached ? '缓存' : `${modelInfo.parseTime||0}ms`}
              </span>
            ) : (
              <span className="cmv-info-detail">{geoConfig.name} · 几何占位预览</span>
            )}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      {phase === 'ready' && (
        <div className="cmv-hint-bar">
          &#128270; 左键拖拽旋转 &middot; 滚轮缩放 &middot; 右键平移
          {modelInfo?.mode === 'real-stp' && ' &middot; OpenCASCADE 内核'}
        </div>
      )}
    </div>
  )
}
