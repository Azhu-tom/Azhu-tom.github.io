/**
 * DFM 3D Viewer - 基于 Three.js 的真实 WebGL 3D 渲染
 * 
 * 数据源：STP 解析器提取的 338 顶点 + 639 三角形 + EDGE_CURVE 线框
 * 渲染方案：Three.js WebGL + MeshStandardMaterial + OrbitControls
 * 特点：接近 3D 软件的真实显示效果（光照/材质/纹理/抗锯齿）
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
  version: '2.6.0',
  component: null,  // 将在 export default 后被填充
  defaultOptions: {
    roughness: 0.55,
    metalness: 0.15,
    wireframeOpacity: 0.2,
    ambientLight: 1.5,
    keyLight: 2.5,
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
  meshFill: 0xe8eaed,       // 工业灰（对齐 OCCT 标准材质色）
  wireframe: 0x6366f1,      // 蓝紫线框（工业设计感）
  bboxEdge: 0x8b5cf6,       // 包围盒
  grid: 0x1e293b,           // 网格
  axisX: 0xef4444,          // 红
  axisY: 0x10b981,          // 绿
  axisZ: 0x3b82f6,          // 蓝
}

export default function DFM3DViewer({ meta }) {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const rafRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  // ==================== 初始化 Three.js 场景 ====================
  useEffect(() => {
    if (!containerRef.current || !meta) return
    // 清理旧场景
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }

    try {
      const W = containerRef.current.clientWidth
      const H = containerRef.current.clientHeight

      // 1. 渲染器（对齐 OCCTViewer: ACES tone mapping）
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

      // 2. 场景（对齐 OCCT: 无雾，浅灰背景）
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(COLORS.background)
      sceneRef.current = scene

      // 3. 相机（对齐 OCCT: FOV 40°, near 0.01, 等距视角）
      const bbox = meta.boundingBox
      const diag = bbox ? Math.sqrt(bbox.dx ** 2 + bbox.dy ** 2 + bbox.dz ** 2) : 100
      const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 1000)
      const dist = diag * 1.5
      // OCCT 默认视角：36° 俯角 + 0.7 侧偏系数
      const initAngle = Math.PI / 5  // 36°
      camera.position.set(
        dist * Math.sin(initAngle) * 0.7,
        dist * Math.sin(initAngle),
        dist * Math.cos(initAngle)
      )
      camera.lookAt(0, 0, 0)
      cameraRef.current = camera

      // 4. 光照（对齐 OCCT 三点布光方案）
      scene.add(new THREE.AmbientLight(0xffffff, 0.45))  // 环境光 OCCT 0.45
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)  // 主光 OCCT 1.2
      keyLight.position.set(5, 8, 5)
      keyLight.castShadow = true
      keyLight.shadow.mapSize.set(1024, 1024)
      scene.add(keyLight)
      const fillLight = new THREE.DirectionalLight(0x88ccff, 0.35)  // 补光 OCCT 淡蓝
      fillLight.position.set(-4, 2, -4)
      scene.add(fillLight)
      const rimLight = new THREE.DirectionalLight(0xffaa44, 0.2)  // 边缘光 OCCT 暖橙
      rimLight.position.set(0, -3, -5)
      scene.add(rimLight)

      // 5. OrbitControls（完全对齐 OCCT 自建交互系统参数）
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.1
      controls.rotateSpeed = 0.5        // ≈ OCCT 0.008 rad/px × 60fps
      controls.zoomSpeed = 0.8          // OCCT zoom因子
      controls.panSpeed = 0.4
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.6    // OCCT autoRotate
      controls.target.set(0, 0, 0)
      controls.minDistance = 0.05       // OCCT 最小 0.05
      controls.maxDistance = 500        // OCCT 最大 500
      controlsRef.current = controls

      // 6. 网格（OCCT 风格，淡灰色调）
      scene.add(new THREE.GridHelper(diag * 2, 20, 0xcbd5e1, 0x94a3b8))

      // 7. 坐标轴 — 已省略（对齐 OCCT 干净预览）
      //    保持 scene 中无 AxesHelper/ArrowHelper

      // ===== 8. 实体三角面（OCCT 风格：仅实体，无独立线框覆盖） =====
      const topology = meta.topology
      const faces = meta.faces
      let meshObj = null
      if (topology && faces && faces.faces && faces.faces.length > 0) {
        // 构建点坐标数组
        const vertexArr = []
        const vertexMap = new Map()  // id → index
        for (const v of topology.vertices) {
          vertexMap.set(v.id, vertexArr.length / 3)
          vertexArr.push(v.x, v.y, v.z)
        }
        // 三角形索引
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
          // 设置几何体
          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexArr), 3))
          geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indexArr), 1))
          geometry.computeVertexNormals()

          // 实体材质（标准材质 + 金属度）
          const meshMat = new THREE.MeshStandardMaterial({
            color: COLORS.meshFill,
            roughness: 0.55,
            metalness: 0.15,
            side: THREE.DoubleSide,  // 双面渲染（避免面朝向不一致）
            flatShading: false,
          })
          const meshObj = new THREE.Mesh(geometry, meshMat)
          meshObj.castShadow = true
          meshObj.receiveShadow = true
          scene.add(meshObj)

          // OCCT 风格：无独立线框覆盖（纯实体渲染）

          setInfo(`${faces.faceCount} 面 / ${faces.triangleCount} 三角形 / ${topology.vertexCount} 顶点`)
        } else {
          setInfo('三角形索引为空，无法渲染实体')
        }
      } else {
        setInfo('未提取到面拓扑，仅显示包围盒')
      }

      // ===== 9. 包围盒线框 =====
      if (meta.boundingBox && meta.boundingBox.pointCount >= 3) {
        const { minX, maxX, minY, maxY, minZ, maxZ } = meta.boundingBox
        const boxGeo = new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ)
        boxGeo.translate((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2)
        const boxEdges = new THREE.EdgesGeometry(boxGeo)
        const boxLine = new THREE.LineSegments(boxEdges, new THREE.LineBasicMaterial({ color: COLORS.bboxEdge, transparent: true, opacity: 0.12 }))
        scene.add(boxLine)
      }

      // ===== 10. autoFitCamera（对齐 OCCT：模型居中 + 自适应距离） =====
      if (bbox) {
        const cx = (bbox.minX + bbox.maxX) / 2
        const cy = (bbox.minY + bbox.maxY) / 2
        const cz = (bbox.minZ + bbox.maxZ) / 2
        // 设置旋转中心为模型包围盒中心
        controls.target.set(cx, cy, cz)
        // 重新调整相机位置（保持相同的视角向量但偏移到新目标）
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
      console.error('[DFM3DViewer] Init error:', err)
      setError(err.message || '初始化 3D 渲染器失败')
      setLoading(false)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      // 清除 DOM
      if (containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas')
        if (canvas) canvas.remove()
      }
    }
  }, [meta])

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
      {/* 渲染区 */}
      <div className="dfm-bbox-stage" ref={containerRef} style={{ position: 'relative' }}>
        {loading && (
          <div className="dfm-preview-loading">
            <div className="hlib-mini-spinner" />
            <span>正在初始化 3D 渲染器...</span>
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

      {/* 控制按钮 */}
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

      {/* 信息 */}
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
