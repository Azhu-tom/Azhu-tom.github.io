/**
 * 原生 Three.js 3D 预览组件（零依赖，绝对稳定）
 *
 * 特点：
 * - 使用原生 Three.js API，不依赖 @react-three/fiber 或 drei
 * - 根据零件类型渲染不同的几何体占位
 * - 支持鼠标拖拽旋转、滚轮缩放
 * - 自动旋转动画
 * - PBR材质 + 环境光 + 投影
 */

import React, { useRef, useEffect, useState } from 'react'

// 几何体配置映射
const GEOMETRY_CONFIG = {
  pump: {
    name: '增压泵',
    geometry: () => [
      { type: 'cylinder', args: [0.4, 0.5, 1.2, 16], pos: [0, 0, 0], color: '#2563eb', metalness: 0.7 },
      { type: 'cylinder', args: [0.52, 0.52, 0.15, 24], pos: [0, 0.6, 0], color: '#1e40af', metalness: 0.8 },  // 上法兰
      { type: 'cylinder', args: [0.52, 0.52, 0.15, 24], pos: [0, -0.6, 0], color: '#1e40af', metalness: 0.8 }, // 下法兰
      { type: 'box', args: [0.3, 0.25, 0.35], pos: [0.38, 0, 0], color: '#16a34a', metalness: 0.65 },  // 电机
    ],
    scale: 1.2,
  },
  filter: {
    name: '滤芯',
    geometry: () => [
      { type: 'cylinder', args: [0.45, 0.45, 1.8, 20], pos: [0, 0, 0], color: '#e2e8f0', metalness: 0.15 },
      { type: 'cylinder', args: [0.48, 0.48, 0.12, 24], pos: [0, 0.9, 0], color: '#94a3b8', metalness: 0.6 },
      { type: 'cylinder', args: [0.36, 0.42, 0.25, 12], pos: [0, -0.85, 0], color: '#15803d', metalness: 0.72 },
    ],
    scale: 1.0,
  },
  valve: {
    name: '阀门',
    geometry: () => [
      { type: 'box', args: [0.7, 0.55, 0.55], pos: [0, 0, 0], color: '#15803d', metalness: 0.75 },
      { type: 'sphere', args: [0.22, 12, 10], pos: [0, 0.42, 0], color: '#dc2626', metalness: 0.4 },   // 手轮
      { type: 'cylinder', args: [0.08, 0.08, 0.28], pos: [0, 0.58, 0], color: '#737373', metalness: 0.85 }, // 手柄轴
      { type: 'cylinder', args: [0.13, 0.13, 0.18], pos: [-0.44, 0, 0], color: '#94a3b8', metalness: 0.7 },  // 接口左
      { type: 'cylinder', args: [0.13, 0.13, 0.18], pos: [0.44, 0, 0], color: '#94a3b8', metalness: 0.7 },   // 接口右
    ],
    scale: 1.1,
  },
  fitting: {
    name: '管接件',
    geometry: () => [
      { type: 'cylinder', args: [0.14, 0.14, 0.85, 6], pos: [0, 0, 0], color: '#c2410c', metalness: 0.78 },
      { type: 'cylinder', args: [0.19, 0.17, 0.12, 6], pos: [0, 0.42, 0], color: '#ea580c', metalness: 0.75 },
      { type: 'cylinder', args: [0.17, 0.19, 0.12, 6], pos: [0, -0.42, 0], color: '#ea580c', metalness: 0.75 },
    ],
    scale: 1.3,
  },
  adapter: {
    name: '堵头/管塞',
    geometry: () => [
      { type: 'cylinder', args: [0.18, 0.01, 0.55, 16], pos: [0, 0, 0], color: '#7e22ce', metalness: 0.7 },
      { type: 'cylinder', args: [0.26, 0.26, 0.1, 20], pos: [0, 0.27, 0], color: '#a855f7', metalness: 0.65 },
      { type: 'box', args: [0.34, 0.08, 0.34], pos: [0, -0.32, 0], color: '#6b21a8', metalness: 0.75 },
    ],
    scale: 1.4,
  },
  screw: {
    name: '卡环/紧固件',
    geometry: () => [
      { type: 'torus', args: [0.32, 0.06, 10, 24], pos: [0, 0, 0], color: '#64748b', metalness: 0.88 },
      { type: 'box', args: [0.46, 0.05, 0.06], pos: [0, 0.04, 0], color: '#334155', metalness: 0.9 },
    ],
    scale: 1.5,
  },
  default: {
    name: '通用件',
    geometry: () => [
      { type: 'box', args: [0.55, 0.55, 0.55], pos: [0, 0, 0], color: '#0891b2', metalness: 0.6 },
      { type: 'cylinder', args: [0.09, 0.09, 0.9, 12], pos: [0, 0, 0], color: '#00d4ff', metalness: 0.5, opacity: 0.4 },
    ],
    scale: 1.2,
  },
}

export default function MiniViewer3D({ modelType = 'default', width = 320, height = 280 }) {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const frameIdRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isDragging = useRef(false)
  const prevMousePos = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ x: 0.3, y: 0.5 })
  const zoomRef = useRef(4.5)
  const autoRotateRef = useRef(true)

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    const initScene = async () => {
      try {
        // 动态导入 Three.js（减少主包体积）
        const THREE = await import('three')

        if (!mounted || !containerRef.current) return

        const container = containerRef.current
        const w = width || container.clientWidth || 320
        const h = height || container.clientHeight || 280

        // 创建场景
        const scene = new THREE.Scene()
        scene.background = new THREE.Color('#0a0f1e')
        sceneRef.current = scene

        // 创建相机
        const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100)
        camera.position.set(0, 1.5, zoomRef.current)
        camera.lookAt(0, 0, 0)
        cameraRef.current = camera

        // 创建渲染器
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

        // 添加灯光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        scene.add(ambientLight)

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
        mainLight.position.set(5, 8, 5)
        mainLight.castShadow = true
        mainLight.shadow.mapSize.width = 1024
        mainLight.shadow.mapSize.height = 1024
        scene.add(mainLight)

        const fillLight = new THREE.DirectionalLight(0x88ccff, 0.4)
        fillLight.position.set(-4, 2, -4)
        scene.add(fillLight)

        const rimLight = new THREE.DirectionalLight(0xffaa44, 0.25)
        rimLight.position.set(0, -3, -5)
        scene.add(rimLight)

        // 添加网格地面
        const gridHelper = new THREE.GridHelper(8, 16, 0x1a2744, 0x0f1729)
        gridHelper.position.y = -1.2
        scene.add(gridHelper)

        // 获取几何体配置
        const config = GEOMETRY_CONFIG[modelType] || GEOMETRY_CONFIG.default
        const parts = typeof config.geometry === 'function' ? config.geometry() : config.geometry

        // 创建模型组
        const modelGroup = new THREE.Group()

        parts.forEach(part => {
          let geometry

          switch (part.type) {
            case 'cylinder':
              geometry = new THREE.CylinderGeometry(...part.args)
              break
            case 'sphere':
              geometry = new THREE.SphereGeometry(...part.args)
              break
            case 'torus':
              geometry = new THREE.TorusGeometry(...part.args)
              break
            case 'cone':
              geometry = new THREE.ConeGeometry(...part.args)
              break
            case 'box':
            default:
              geometry = new THREE.BoxGeometry(...part.args)
              break
          }

          if (!geometry) return

          const material = new THREE.MeshStandardMaterial({
            color: part.color || '#0891b2',
            metalness: part.metalness !== undefined ? part.metalness : 0.6,
            roughness: 0.25,
            envMapIntensity: 0.8,
            transparent: part.opacity !== undefined,
            opacity: part.opacity !== undefined ? part.opacity : 1,
          })

          const mesh = new THREE.Mesh(geometry, material)
          mesh.position.set(...part.pos)
          mesh.castShadow = true
          mesh.receiveShadow = true
          modelGroup.add(mesh)
        })

        modelGroup.scale.setScalar(config.scale || 1)
        scene.add(modelGroup)

        // 鼠标交互
        const canvas = renderer.domElement

        const onMouseDown = (e) => {
          isDragging.current = true
          autoRotateRef.current = false
          prevMousePos.current = { x: e.clientX, y: e.clientY }
        }

        const onMouseMove = (e) => {
          if (!isDragging.current) return
          const dx = e.clientX - prevMousePos.current.x
          const dy = e.clientY - prevMousePos.current.y
          rotationRef.current.y += dx * 0.008
          rotationRef.current.x += dy * 0.008
          rotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.x))
          prevMousePos.current = { x: e.clientX, y: e.clientY }
        }

        const onMouseUp = () => {
          isDragging.current = false
        }

        const onWheel = (e) => {
          e.preventDefault()
          zoomRef.current += e.deltaY * 0.008
          zoomRef.current = Math.max(2.5, Math.min(10, zoomRef.current))
        }

        canvas.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        canvas.addEventListener('wheel', onWheel, { passive: false })

        // 触摸支持
        const onTouchStart = (e) => {
          if (e.touches.length === 1) {
            isDragging.current = true
            autoRotateRef.current = false
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

        const onTouchEnd = () => {
          isDragging.current = false
        }

        canvas.addEventListener('touchstart', onTouchStart, { passive: true })
        canvas.addEventListener('touchmove', onTouchMove, { passive: true })
        canvas.addEventListener('touchend', onTouchEnd)

        // 动画循环
        let lastTime = performance.now()
        const animate = () => {
          if (!mounted) return
          frameIdRef.current = requestAnimationFrame(animate)

          const now = performance.now()
          const delta = (now - lastTime) / 1000
          lastTime = now

          // 自动旋转
          if (autoRotateRef.current && !isDragging.current) {
            rotationRef.current.y += delta * 0.5
          }

          // 应用旋转到模型组
          if (modelGroup) {
            modelGroup.rotation.x = rotationRef.current.x
            modelGroup.rotation.y = rotationRef.current.y
          }

          // 更新相机距离
          if (cameraRef.current) {
            cameraRef.current.position.z = zoomRef.current
          }

          renderer.render(scene, camera)
        }

        animate()

        if (mounted) {
          setLoading(false)
        }

        // 清理函数存储
        rendererRef.current._cleanup = () => {
          canvas.removeEventListener('mousedown', onMouseDown)
          window.removeEventListener('mousemove', onMouseMove)
          window.removeEventListener('mouseup', onMouseUp)
          canvas.removeEventListener('wheel', onWheel)
          canvas.removeEventListener('touchstart', onTouchStart)
          canvas.removeEventListener('touchmove', onTouchMove)
          canvas.removeEventListener('touchend', onTouchEnd)

          geometry?.dispose()
          scene.traverse((child) => {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose())
              } else {
                child.material.dispose()
              }
            }
          })
          renderer.dispose()
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement)
          }
        }
      } catch (err) {
        console.error('MiniViewer3D 初始化失败:', err)
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    initScene()

    return () => {
      mounted = false
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current)
      if (rendererRef.current?._cleanup) {
        rendererRef.current._cleanup()
      }
    }
  }, [modelType, width, height])

  // 错误状态
  if (error) {
    return (
      <div style={{
        width, height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #0a0f1e, #141a33)',
        borderRadius: '10px',
        color: '#ef4444',
        fontSize: '13px',
        gap: '8px',
      }}>
        <span style={{ fontSize: '36px' }}>⚠️</span>
        <span>3D加载失败</span>
        <span style={{ fontSize: '11px', color: '#64748b' }}>{error}</span>
      </div>
    )
  }

  // 加载状态
  if (loading) {
    return (
      <div style={{
        width, height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #0a0f1e, #141a33)',
        borderRadius: '10px',
        color: '#94a3b8',
        gap: '10px',
      }}>
        <div className="spinner-3d" />
        <span style={{ fontSize: '13px' }}>加载3D引擎...</span>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Canvas 容器 */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '10px',
          overflow: 'hidden',
          cursor: isDragging.current ? 'grabbing' : 'grab',
        }}
      />

      {/* 操作提示覆盖层 */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '0',
        right: '0',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '20px',
          color: '#94a3b8',
          fontSize: '11px',
          backdropFilter: 'blur(8px)',
        }}>
          🖱️ 拖拽旋转 · 🔄 滚轮缩放
        </span>
      </div>

      {/* 类型标签 */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        pointerEvents: 'none',
      }}>
        <span style={{
          display: 'inline-block',
          padding: '3px 10px',
          background: 'rgba(59, 130, 246, 0.85)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '11px',
          fontWeight: '600',
          backdropFilter: 'blur(8px)',
        }}>
          {(GEOMETRY_CONFIG[modelType] || GEOMETRY_CONFIG.default).name}
        </span>
      </div>
    </div>
  )
}
