/**
 * DFM 3D Viewer - 基于 OCCT WASM 高精度渲染
 *
 * v2.6: 从耳切法升级到 OCCT 高精度三角化
 *   - 解析精度：560 面 → 5000+ 面
 *   - 表面平滑度：耳切棱角 → 自然曲面过渡
 *   - 法线计算：computeVertexNormals 圆滑着色
 *
 * 兼容 meta 参数（用耳切法数据 fallback）
 */
import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { registerPlugin } from '../../utils/fileViewerPlugin'

// ==================== 注册为 file-viewer 插件 ====================
registerPlugin({
  id: 'renderer-3d',
  label: 'WebGL 3D 渲染',
  extensions: ['stp', 'step', 'iges', 'igs', 'obj', 'stl'],
  version: '2.7.0',
  component: null,
  defaultOptions: {
    roughness: 0.6,
    metalness: 0.2,
    wireframeOpacity: 0.2,
    ambientLight: 0.45,
    keyLight: 1.2,
    backgroundColor: 0x0a0e1a,
    gridSize: 20,
    showAxes: true,
    showBbox: true,
    doubleSide: true,
  },
})

// ==================== 材质 / 配色 ====================
const COLORS = {
  background: 0x0a0e1a,
  meshFill: 0xe8eaed,
  wireframe: 0x6366f1,
  bboxEdge: 0x8b5cf6,
  grid: 0x1e293b,
}

// ==================== OCCT WASM 加载（正确 API：occtimportjs() 返回 Promise） ====================
let occtModuleCache = null

async function ensureOCCT() {
  if (occtModuleCache && occtModuleCache.ready) return occtModuleCache

  // 15 秒总超时保护（避免无限转圈）
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('OCCT WASM 初始化超时（15秒）')), 15000)
  })

  const initPromise = (async () => {
    try {
      // 1. 预加载 wasm 字节 + Blob URL
      const wasmResp = await fetch('/wasm/occt-import-js.wasm')
      if (!wasmResp.ok) throw new Error(`WASM 预加载失败: HTTP ${wasmResp.status}`)
      const wasmBinary = new Uint8Array(await wasmResp.arrayBuffer())
      console.log(`[DFM3DViewer] WASM 预加载完成: ${wasmBinary.byteLength} bytes`)
      const wasmBlobUrl = URL.createObjectURL(new Blob([wasmBinary], { type: 'application/wasm' }))

      // 2. 加载 UMD（已 patched window.occtimportjs）
      if (!window.occtimportjs) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = '/wasm/occt-import-js.js'
          script.async = false
          script.onload = resolve
          script.onerror = () => reject(new Error('occt-import-js.js 加载失败'))
          document.head.appendChild(script)
        })
      }
      if (!window.occtimportjs) throw new Error('occt-import-js 未暴露到 window.occtimportjs')

      // 3. 关键正确用法：occtimportjs() 返回 Promise（resolve 的是 Module 对象）
      //    locateFile 必须在 moduleArg 里传入，Module 初始化时就会读取
      const occt = await window.occtimportjs({
        locateFile: (path) => {
          if (path.endsWith('.wasm')) return wasmBlobUrl
          return path
        },
      })

      if (!occt || typeof occt.ReadStepFile !== 'function') {
        throw new Error('OCCT 模块初始化异常：缺少 ReadStepFile 方法')
      }

      console.log('[DFM3DViewer] OCCT 初始化完成')
      occtModuleCache = { ...occt, ready: true }
      return occtModuleCache
    } catch (err) {
      console.error('[DFM3DViewer] OCCT init failed:', err)
      throw err
    }
  })()

  return Promise.race([initPromise, timeoutPromise])
}

// ==================== 主组件 ====================
export default function DFM3DViewer({ meta, file }) {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const rafRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [loadingStage, setLoadingStage] = useState('初始化 3D 渲染器...')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  // ==================== 初始化 Three.js + OCCT 解析 ====================
  useEffect(() => {
    if (!containerRef.current || !meta) return
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }

    let aborted = false

    ;(async () => {
      try {
        const W = containerRef.current.clientWidth
        const H = containerRef.current.clientHeight

        // 1. 渲染器
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
        renderer.setSize(W, H)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.1
        renderer.setClearColor(COLORS.background, 1)
        containerRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // 2. 场景
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(COLORS.background)
        sceneRef.current = scene

        // 3. 相机
        const bbox = meta.boundingBox
        const diag = bbox ? Math.sqrt(bbox.dx ** 2 + bbox.dy ** 2 + bbox.dz ** 2) : 100
        const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 1000)
        const dist = diag * 1.5
        const initAngle = Math.PI / 5
        camera.position.set(
          dist * Math.sin(initAngle) * 0.7,
          dist * Math.sin(initAngle),
          dist * Math.cos(initAngle)
        )
        camera.lookAt(0, 0, 0)
        cameraRef.current = camera

        // 4. 三点光照
        scene.add(new THREE.AmbientLight(0xffffff, 0.45))
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
        keyLight.position.set(5, 8, 5)
        keyLight.castShadow = true
        keyLight.shadow.mapSize.set(1024, 1024)
        scene.add(keyLight)
        const fillLight = new THREE.DirectionalLight(0x88ccff, 0.35)
        fillLight.position.set(-4, 2, -4)
        scene.add(fillLight)
        const rimLight = new THREE.DirectionalLight(0xffaa44, 0.2)
        rimLight.position.set(0, -3, -5)
        scene.add(rimLight)

        // 5. OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.1
        controls.rotateSpeed = 0.5
        controls.zoomSpeed = 0.8
        controls.panSpeed = 0.4
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.6
        controls.target.set(0, 0, 0)
        controls.minDistance = 0.05
        controls.maxDistance = 500
        controlsRef.current = controls

        // 6. 网格（已隐藏，专注模型本身，接近 Creo 风格）
        // scene.add(new THREE.GridHelper(diag * 2, 20, 0xcbd5e1, 0x94a3b8))

        // ===== 7. 优先用 OCCT 高精度解析 =====
        let mesh = null
        let renderInfo = ''

        if (file && (file.name.toLowerCase().endsWith('.stp') || file.name.toLowerCase().endsWith('.step'))) {
          try {
            setLoadingStage('加载 OCCT 内核...')
            const occt = await ensureOCCT()
            if (aborted) return

            setLoadingStage('高精度三角化模型...')
            const buffer = await file.arrayBuffer()
            // occt-import-js 正确参数：linearDeflection（包围盒比例，越小越精细）
            // 默认 0.01（1%），此处 0.001（0.1%）= 10 倍精度提升
            const result = occt.ReadStepFile(new Uint8Array(buffer), {
              linearDeflection: 0.001,
              angularDeflection: 0.5,
            })

            if (aborted) return

            if (result && result.meshes && result.meshes.length > 0) {
              // 合并所有 mesh 的几何（OCCT 正确字段：attributes.position.array / attributes.normal.array / index.array）
              let totalVertices = 0
              let totalIndices = 0
              const mergedPositions = []
              const mergedNormals = []
              const mergedIndices = []

              for (const m of result.meshes) {
                const posArr = m.attributes?.position?.array || m.vertices || []
                const nrmArr = m.attributes?.normal?.array || m.normals || []
                // 注意：OCCT 索引字段是 m.index.array（单数，不在 attributes 里）
                const idxArr = m.index?.array || m.indices || m.attributes?.index?.array || []

                // 顶点偏移
                const offset = totalVertices
                for (let i = 0; i < posArr.length; i++) mergedPositions.push(posArr[i])
                for (let i = 0; i < nrmArr.length; i++) mergedNormals.push(nrmArr[i])
                totalVertices += posArr.length / 3

                // 索引偏移
                for (let i = 0; i < idxArr.length; i++) mergedIndices.push(idxArr[i] + offset)
                totalIndices += idxArr.length
              }

              if (totalIndices > 0 && totalVertices > 0) {
                // 构建 Three.js 几何
                const geometry = new THREE.BufferGeometry()
                geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mergedPositions), 3))
                if (mergedNormals.length === mergedPositions.length) {
                  // 使用 OCCT 提供的精确法线（保留硬边 + 圆滑曲面）
                  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(mergedNormals), 3))
                } else {
                  geometry.computeVertexNormals()  // 兜底：重新计算平滑法线
                }
                geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(mergedIndices), 1))

                const meshMat = new THREE.MeshStandardMaterial({
                  color: COLORS.meshFill,
                  roughness: 0.6,
                  metalness: 0.2,
                  side: THREE.DoubleSide,
                  flatShading: false,
                })
                mesh = new THREE.Mesh(geometry, meshMat)
                mesh.castShadow = true
                mesh.receiveShadow = true
                scene.add(mesh)

                renderInfo = `OCCT 高精度 · ${result.meshes.length} mesh · ${totalVertices} 顶点 · ${totalIndices / 3} 三角形`
                console.log(`[DFM3DViewer] OCCT 解析成功: ${renderInfo}`)
              }
            }
          } catch (occtErr) {
            console.warn('[DFM3DViewer] OCCT 解析失败，降级使用耳切法:', occtErr.message)
          }
        }

        // ===== 8. Fallback: 用 stpParser 提取的三角面 =====
        if (!mesh && meta.topology && meta.faces && meta.faces.faces && meta.faces.faces.length > 0) {
          const topology = meta.topology
          const faces = meta.faces
          const vertexArr = []
          const vertexMap = new Map()
          for (const v of topology.vertices) {
            vertexMap.set(v.id, vertexArr.length / 3)
            vertexArr.push(v.x, v.y, v.z)
          }
          const indexArr = []
          for (const tri of faces.faces) {
            const i0 = vertexMap.get(tri[0])
            const i1 = vertexMap.get(tri[1])
            const i2 = vertexMap.get(tri[2])
            if (i0 !== undefined && i1 !== undefined && i2 !== undefined) {
              indexArr.push(i0, i1, i2)
            }
          }
          if (indexArr.length > 0) {
            const geometry = new THREE.BufferGeometry()
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexArr), 3))
            geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indexArr), 1))
            geometry.computeVertexNormals()
            const meshMat = new THREE.MeshStandardMaterial({
              color: COLORS.meshFill,
              roughness: 0.55,
              metalness: 0.15,
              side: THREE.DoubleSide,
              flatShading: false,
            })
            mesh = new THREE.Mesh(geometry, meshMat)
            mesh.castShadow = true
            mesh.receiveShadow = true
            scene.add(mesh)
            renderInfo = `耳切法（fallback）· ${faces.faceCount} 面 / ${faces.triangleCount} 三角形 / ${topology.vertexCount} 顶点`
          }
        }

        if (mesh) {
          setInfo(renderInfo)
        } else {
          setInfo('未提取到面拓扑，仅显示包围盒')
        }

        // ===== 9. 包围盒（已隐藏，专注模型本身） =====
        // if (meta.boundingBox && meta.boundingBox.pointCount >= 3) {
        //   const { minX, maxX, minY, maxY, minZ, maxZ } = meta.boundingBox
        //   const boxGeo = new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ)
        //   boxGeo.translate((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2)
        //   const boxEdges = new THREE.EdgesGeometry(boxGeo)
        //   const boxLine = new THREE.LineSegments(boxEdges, new THREE.LineBasicMaterial({ color: COLORS.bboxEdge, transparent: true, opacity: 0.12 }))
        //   scene.add(boxLine)
        // }

        // ===== 10. autoFitCamera =====
        if (bbox) {
          const cx = (bbox.minX + bbox.maxX) / 2
          const cy = (bbox.minY + bbox.maxY) / 2
          const cz = (bbox.minZ + bbox.maxZ) / 2
          controls.target.set(cx, cy, cz)
          const dir = camera.position.clone().sub(new THREE.Vector3(0, 0, 0)).normalize()
          camera.position.copy(new THREE.Vector3(cx, cy, cz).add(dir.multiplyScalar(diag * 1.5)))
          camera.lookAt(cx, cy, cz)
          controls.update()
        }

        // ===== 11. 渲染循环 =====
        const animate = () => {
          controls.update()
          renderer.render(scene, camera)
          rafRef.current = requestAnimationFrame(animate)
        }
        animate()

        setLoading(false)
        setError(null)
      } catch (err) {
        if (aborted) return
        console.error('[DFM3DViewer] Init error:', err)
        setError(err.message || '初始化 3D 渲染器失败')
        setLoading(false)
      }
    })()

    return () => {
      aborted = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      if (containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas')
        if (canvas) canvas.remove()
      }
    }
  }, [meta, file])

  // ==================== 窗口变化 ====================
  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      const W = containerRef.current.clientWidth
      const H = containerRef.current.clientHeight
      cameraRef.current.aspect = W / H
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(W, H)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ==================== 全屏切换 ====================
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [])

  // ==================== 视图控制按钮 ====================
  const setView = useCallback((view) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const bbox = meta.boundingBox
    const diag = bbox ? Math.sqrt(bbox.dx ** 2 + bbox.dy ** 2 + bbox.dz ** 2) : 100
    const d = diag * 1.5
    const views = {
      iso:   { pos: [d * 0.7, d * 0.5, d], target: [0, 0, 0] },
      front: { pos: [0, 0, d], target: [0, 0, 0] },
      side:  { pos: [d, 0, 0], target: [0, 0, 0] },
      top:   { pos: [0, d, 0.01], target: [0, 0, 0] },
    }
    const v = views[view] || views.iso
    camera.position.set(...v.pos)
    controls.target.set(...v.target)
    controls.update()
  }, [meta])

  const bbox = meta?.boundingBox

  return (
    <div className="dfm-bbox-preview">
      <div className="dfm-bbox-stage" ref={containerRef} style={{ position: 'relative' }}>
        {loading && (
          <div className="dfm-preview-loading">
            <div className="hlib-mini-spinner" />
            <span>{loadingStage}</span>
          </div>
        )}
        {error && (
          <div className="dfm-no-preview">
            <div className="dfm-no-preview-icon">⚠️</div>
            <h4>3D 渲染失败</h4>
            <p>{error}</p>
          </div>
        )}
      </div>

      {!loading && !error && (
        <div className="dfm-bbox-controls">
          <div className="dfm-view-group">
            <button className="dfm-view-btn" onClick={() => setView('iso')}>等距</button>
            <button className="dfm-view-btn" onClick={() => setView('front')}>正</button>
            <button className="dfm-view-btn" onClick={() => setView('side')}>侧</button>
            <button className="dfm-view-btn" onClick={() => setView('top')}>俯</button>
          </div>
          <div className="dfm-view-group" style={{ marginLeft: 'auto' }}>
            <button className="dfm-view-btn" onClick={toggleFullscreen} title="全屏查看">
              {fullscreen ? '↙ 退出全屏' : '🗖 全屏'}
            </button>
          </div>
        </div>
      )}

      <div className="dfm-bbox-meta">
        {bbox && (
          <>
            <span className="dfm-bbox-tag success">✓ WebGL 3D 渲染</span>
            <span className="dfm-bbox-stat">
              X <strong>{bbox.dx.toFixed(1)}</strong> × Y <strong>{bbox.dy.toFixed(1)}</strong> × Z <strong>{bbox.dz.toFixed(1)}</strong> mm
            </span>
            {info && <span className="dfm-bbox-stat-mini">{info} · 拖拽旋转 · 滚轮缩放 · 右键平移</span>}
            {!info && <span className="dfm-bbox-stat-mini">拖拽旋转 · 滚轮缩放 · 右键平移</span>}
          </>
        )}
      </div>
    </div>
  )
}