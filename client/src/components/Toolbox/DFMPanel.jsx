import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import './DFMPanel.css'
import { parseStpFile, suggestFeaturesFromParse, generateDefectList, bboxToDimensions, detectUndercuts } from '../../utils/stpParser'
import { resolvePlugin } from '../../utils/fileViewerPlugin'
import DFM3DViewer from './DFM3DViewer'

/**
 * DFM模具初评面板
 * 知识来源: 专业模具工程师
 * 功能: 基于产品尺寸和特征快速估算模具费用 + 工艺风险预警
 * v2.0: 支持 STP/STEP 模型导入 → 自动识别缺陷 → 输出 DFM 报告 → 成本预估
 */
// ==================== v2.5: Canvas 3D 预览（实体三角面 + 缩放 + 平移） ====================
function BboxPreview({ meta }) {
  const canvasRef = useRef(null)
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0, mode: 'rotate' })
  const [rotation, setRotation] = useState({ x: 0.7, y: 0.7 })
  const [autoSpin, setAutoSpin] = useState(false)
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [renderMode, setRenderMode] = useState('solid')           // 'solid' | 'wireframe' | 'points' | 'hybrid'

  const project = useCallback((p, ax, ay, fov, viewerZ, W, H, panX, panY, zMul) => {
    let y = p.y * Math.cos(ax) - p.z * Math.sin(ax)
    let z = p.y * Math.sin(ax) + p.z * Math.cos(ax)
    let x = p.x * Math.cos(ay) + z * Math.sin(ay)
    z = -p.x * Math.sin(ay) + z * Math.cos(ay)
    const depth = z + viewerZ
    const scale = fov / depth * zMul
    return { x: W / 2 + x * scale + panX, y: H / 2 - y * scale + panY, z, scale }
  }, [])

  useEffect(() => {
    let rafId = null
    let lastTimestamp = 0

    const render = (timestamp) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const H = canvas.height

      if (autoSpin && !dragRef.current.dragging) {
        const delta = (timestamp - lastTimestamp) / 1000
        setRotation(_r => ({ x: _r.x, y: _r.y + delta * 0.4 }))
      }
      lastTimestamp = timestamp

      // 渐变深色背景（专业感）
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, '#0a0e1a')
      bgGrad.addColorStop(1, '#060914')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      // 网格背景
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)'
      ctx.lineWidth = 1
      for (let i = 0; i < W; i += 16) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke()
      }
      for (let j = 0; j < H; j += 16) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke()
      }

      const bbox = meta?.boundingBox
      const points = meta?.points || []
      const topology = meta?.topology
      const faces = meta?.faces
      const ax = rotation.x
      const ay = rotation.y
      // 自适应 fov：根据 bbox 对角线长度计算，让模型初始就占 ~80% 画布
      const bboxDiag = bbox ? Math.sqrt(bbox.dx ** 2 + bbox.dy ** 2 + bbox.dz ** 2) : 60
      const adaptiveFov = bboxDiag > 0 ? (Math.min(W, H) * 0.7 / bboxDiag) * 100 : 400
      const fov = adaptiveFov * zoom
      const viewerZ = 500
      const panX = pan.x
      const panY = pan.y
      const zMul = zoom

      // ===== 1. 实体三角面渲染（核心：填充 + 描边 + 光照） =====
      if ((renderMode === 'solid' || renderMode === 'hybrid') && faces && faces.faces && faces.faces.length > 0 && topology && topology.vertices.length > 0) {
        // 投影所有顶点（按 ID 映射）
        const vertexProj = new Map()
        const vertexMap3D = new Map()  // 3D 坐标（用于计算法线）
        for (const v of topology.vertices) {
          vertexProj.set(v.id, project(v, ax, ay, fov, viewerZ, W, H, panX, panY, zMul))
          vertexMap3D.set(v.id, v)
        }
        // 准备三角形数据 + 平均深度 + 3D 法线
        const triangles = faces.faces.map((tri, idx) => {
          const p1 = vertexProj.get(tri[0])
          const p2 = vertexProj.get(tri[1])
          const p3 = vertexProj.get(tri[2])
          const v1 = vertexMap3D.get(tri[0])
          const v2 = vertexMap3D.get(tri[1])
          const v3 = vertexMap3D.get(tri[2])
          if (!p1 || !p2 || !p3 || !v1 || !v2 || !v3) return null
          // 3D 法线（基于三角形顶点）
          const ax_ = v2.x - v1.x, ay_ = v2.y - v1.y, az_ = v2.z - v1.z
          const bx_ = v3.x - v1.x, by_ = v3.y - v1.y, bz_ = v3.z - v1.z
          let nx = ay_ * bz_ - az_ * by_
          let ny = az_ * bx_ - ax_ * bz_
          let nz = ax_ * by_ - ay_ * bx_
          // 旋转法线到当前视角
          const nxR = nx * Math.cos(ay) + nz * Math.sin(ay)
          const nzR = -nx * Math.sin(ay) + nz * Math.cos(ay)
          const nyR = ny * Math.cos(ax) - nzR * Math.sin(ax)
          const nzRot = ny * Math.sin(ax) + nzR * Math.cos(ax)
          // 光照：固定光源方向 (1, 1, 1)，漫反射 = max(0, n·L) / |n|
          const lightStrength = Math.max(0, (nxR + nyR + nzRot) / Math.sqrt(nx * nx + ny * ny + nz * nz || 1))
          return { p1, p2, p3, avgZ: (p1.z + p2.z + p3.z) / 3, light: 0.3 + 0.7 * lightStrength }
        }).filter(Boolean)

        // 按 z 深度排序（远→近）
        triangles.sort((a, b) => b.avgZ - a.avgZ)

        // 渲染：填充 + 描边（含光照）
        ctx.lineJoin = 'round'
        triangles.forEach(({ p1, p2, p3, avgZ, light }) => {
          // 紫色填充 + 光照影响
          // 基础色 RGB 紫蓝
          const r = Math.round(140 + light * 50)
          const g = Math.round(120 + light * 60)
          const b = Math.round(230 + light * 25)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.88)`
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.lineTo(p3.x, p3.y)
          ctx.closePath()
          ctx.fill()
          // 描边（细紫蓝线）
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.4 + light * 0.5})`
          ctx.lineWidth = 0.7
          ctx.stroke()
        })
      }

      // ===== 2. 线框渲染 =====
      if ((renderMode === 'wireframe' || renderMode === 'hybrid') && topology && topology.edges.length > 0) {
        const vertexProj = new Map()
        for (const v of topology.vertices) {
          vertexProj.set(v.id, project(v, ax, ay, fov, viewerZ, W, H, panX, panY, zMul))
        }
        const edgesWithDepth = topology.edges.map(e => {
          const p1 = vertexProj.get(e.v1)
          const p2 = vertexProj.get(e.v2)
          if (!p1 || !p2) return null
          return { p1, p2, avgZ: (p1.z + p2.z) / 2 }
        }).filter(Boolean)
        edgesWithDepth.sort((a, b) => a.avgZ - b.avgZ)

        ctx.lineCap = 'round'
        edgesWithDepth.forEach(({ p1, p2, avgZ }) => {
          const depth = Math.max(0, Math.min(1, (avgZ + 200) / 400))
          const alpha = 0.35 + depth * 0.65
          ctx.strokeStyle = `rgba(160, 145, 230, ${alpha})`
          ctx.lineWidth = (0.8 + depth * 0.7) * zoom
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        })
      }

      // ===== 3. 点云 =====
      if (renderMode === 'points' && points.length > 0) {
        const projected = points.map(p => ({
          ...project(p, ax, ay, fov, viewerZ, W, H, panX, panY, zMul),
          original: p,
        }))
        projected.sort((a, b) => a.z - b.z)
        projected.forEach(({ x, y, z, scale }) => {
          const size = Math.max(1, Math.min(2.5, scale * 2.5)) * zoom
          const alpha = Math.max(0.2, Math.min(0.85, scale * 1.5))
          const depth = Math.max(0, Math.min(1, (z + 200) / 400))
          const r = Math.round(99 + depth * 67)
          const g = Math.round(102 + depth * 49)
          const b = Math.round(241 - depth * 100)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
          ctx.fillRect(x - size / 2, y - size / 2, size, size)
        })
      }

      // ===== 4. 包围盒参考 =====
      if (bbox && bbox.pointCount >= 3) {
        const c = [
          { x: bbox.minX, y: bbox.minY, z: bbox.minZ },
          { x: bbox.maxX, y: bbox.minY, z: bbox.minZ },
          { x: bbox.maxX, y: bbox.maxY, z: bbox.minZ },
          { x: bbox.minX, y: bbox.maxY, z: bbox.minZ },
          { x: bbox.minX, y: bbox.minY, z: bbox.maxZ },
          { x: bbox.maxX, y: bbox.minY, z: bbox.maxZ },
          { x: bbox.maxX, y: bbox.maxY, z: bbox.maxZ },
          { x: bbox.minX, y: bbox.maxY, z: bbox.maxZ },
        ]
        const p = c.map(v => project(v, ax, ay, fov, viewerZ, W, H, panX, panY, zMul))
        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7],
        ]
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        edges.forEach(([a, b]) => {
          ctx.beginPath(); ctx.moveTo(p[a].x, p[a].y); ctx.lineTo(p[b].x, p[b].y); ctx.stroke()
        })
        ctx.setLineDash([])
      }

      // ===== 5. 坐标轴 =====
      const axisLen = 40
      const axisOrigin = project({ x: 0, y: 0, z: 0 }, ax, ay, fov, viewerZ, W, H, panX, panY, zMul)
      const axX = project({ x: axisLen, y: 0, z: 0 }, ax, ay, fov, viewerZ, W, H, panX, panY, zMul)
      const axY = project({ x: 0, y: axisLen, z: 0 }, ax, ay, fov, viewerZ, W, H, panX, panY, zMul)
      const axZ = project({ x: 0, y: 0, z: axisLen }, ax, ay, fov, viewerZ, W, H, panX, panY, zMul)
      ctx.lineWidth = 1.5
      ctx.font = 'bold 10px monospace'
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; ctx.beginPath(); ctx.moveTo(axisOrigin.x, axisOrigin.y); ctx.lineTo(axX.x, axX.y); ctx.stroke()
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; ctx.fillText('X', axX.x + 4, axX.y + 4)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)'; ctx.beginPath(); ctx.moveTo(axisOrigin.x, axisOrigin.y); ctx.lineTo(axY.x, axY.y); ctx.stroke()
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)'; ctx.fillText('Y', axY.x + 4, axY.y + 4)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; ctx.beginPath(); ctx.moveTo(axisOrigin.x, axisOrigin.y); ctx.lineTo(axZ.x, axZ.y); ctx.stroke()
      ctx.fillStyle = 'rgba(59, 130, 246, 0.9)'; ctx.fillText('Z', axZ.x + 4, axZ.y + 4)

      // ===== 6. 状态信息（角标）=====
      ctx.fillStyle = 'rgba(196, 181, 253, 0.65)'
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      const modeLabel = { solid: '实体', wireframe: '线框', points: '点云', hybrid: '混合' }[renderMode]
      const facesInfo = faces ? `${faces.faceCount} 面 / ${faces.triangleCount} 三角形` : ''
      const lines = [
        `缩放 ${zoom.toFixed(1)}× | ${modeLabel}模式`,
        facesInfo,
      ]
      lines.forEach((line, i) => {
        if (line) ctx.fillText(line, 8, H - 22 + i * 14)
      })

      ctx.textAlign = 'right'
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
      ctx.fillText('🖱拖拽旋转 · 滚轮缩放 · Shift+拖拽平移 · 双击复位', W - 8, H - 8)

      rafId = requestAnimationFrame(render)
    }
    rafId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafId)
  }, [meta, rotation, autoSpin, renderMode, zoom, pan, project])

  const handleMouseDown = (e) => {
    dragRef.current = {
      dragging: true,
      lastX: e.clientX,
      lastY: e.clientY,
      mode: e.shiftKey ? 'pan' : 'rotate',
    }
  }
  const handleMouseMove = (e) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
    if (dragRef.current.mode === 'pan') {
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    } else {
      setRotation(prev => ({ x: prev.x + dy * 0.015, y: prev.y + dx * 0.015 }))
    }
  }
  const handleMouseUp = () => { dragRef.current.dragging = false }
  const handleWheel = (e) => {
    e.preventDefault(); e.stopPropagation()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.2, Math.min(5.0, prev * factor)))
  }
  const handleDoubleClick = () => {
    setRotation({ x: 0.7, y: 0.7 }); setZoom(1.0); setPan({ x: 0, y: 0 })
  }
  const setView = (view) => {
    const views = {
      iso:   { x: 0.7, y: 0.7 },
      front: { x: 0, y: 0 },
      side:  { x: 0, y: Math.PI / 2 },
      top:   { x: Math.PI / 2 - 0.05, y: 0 },
    }
    setRotation(views[view] || views.iso)
  }
  const resetView = () => {
    setRotation({ x: 0.7, y: 0.7 }); setZoom(1.0); setPan({ x: 0, y: 0 })
  }

  const bbox = meta?.boundingBox
  const topology = meta?.topology
  const faces = meta?.faces
  const hasModel = bbox && bbox.pointCount >= 3
  const hasWireframe = topology && topology.edges && topology.edges.length > 0
  const hasSolid = faces && faces.faces && faces.faces.length > 0

  return (
    <div className="dfm-bbox-preview">
      <div className="dfm-bbox-stage">
        {hasModel ? (
          <canvas
            ref={canvasRef}
            width={500}
            height={260}
            className="dfm-bbox-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
          />
        ) : (
          <div className="dfm-bbox-fallback">
            <span className="dfm-bbox-fallback-icon">📦</span>
            <span className="dfm-bbox-fallback-text">
              {meta?.stats?.solidCount > 0 ? `实体数 ${meta.stats.solidCount}` : `${(meta?.size / 1024 || 0).toFixed(1)} KB 模型`}
            </span>
            <span className="dfm-bbox-fallback-sub">未检测到顶点坐标，无法渲染 3D 预览</span>
          </div>
        )}
      </div>

      {hasModel && (
        <div className="dfm-bbox-controls">
          <div className="dfm-view-group">
            <button className="dfm-view-btn" onClick={() => setZoom(z => Math.min(5.0, z * 1.2))} title="放大">🔍+</button>
            <span className="dfm-zoom-text">{zoom.toFixed(1)}×</span>
            <button className="dfm-view-btn" onClick={() => setZoom(z => Math.max(0.2, z / 1.2))} title="缩小">🔍-</button>
            <button className="dfm-view-btn" onClick={resetView} title="复位视图">↺ 复位</button>
          </div>
          <div className="dfm-view-group">
            {hasSolid && (
              <button className={`dfm-view-btn ${renderMode === 'solid' ? 'active' : ''}`} onClick={() => setRenderMode('solid')} title="实体渲染">🎲 实体</button>
            )}
            {hasWireframe && (
              <button className={`dfm-view-btn ${renderMode === 'wireframe' ? 'active' : ''}`} onClick={() => setRenderMode('wireframe')} title="线框模型">线框</button>
            )}
            <button className={`dfm-view-btn ${renderMode === 'points' ? 'active' : ''}`} onClick={() => setRenderMode('points')} title="点云">点云</button>
            {hasSolid && hasWireframe && (
              <button className={`dfm-view-btn ${renderMode === 'hybrid' ? 'active' : ''}`} onClick={() => setRenderMode('hybrid')} title="实体+线框">混合</button>
            )}
          </div>
          <div className="dfm-view-group">
            <button className={`dfm-view-btn ${autoSpin ? 'active' : ''}`} onClick={() => setAutoSpin(!autoSpin)} title="自动旋转">
              {autoSpin ? '⏸ 停止' : '▶ 自动'}
            </button>
          </div>
          <div className="dfm-view-group" style={{ marginLeft: 'auto' }}>
            <button className="dfm-view-btn" onClick={() => setView('iso')}>等距</button>
            <button className="dfm-view-btn" onClick={() => setView('front')}>正</button>
            <button className="dfm-view-btn" onClick={() => setView('side')}>侧</button>
            <button className="dfm-view-btn" onClick={() => setView('top')}>俯</button>
          </div>
        </div>
      )}

      <div className="dfm-bbox-meta">
        {hasModel ? (
          <>
            <span className="dfm-bbox-tag success">✓ 3D 预览已就绪</span>
            <span className="dfm-bbox-stat">
              X <strong>{bbox.dx.toFixed(1)}</strong> × Y <strong>{bbox.dy.toFixed(1)}</strong> × Z <strong>{bbox.dz.toFixed(1)}</strong> {meta.units || 'mm'}
            </span>
            <span className="dfm-bbox-stat-mini">
              {hasSolid
                ? `实体 ${faces.faceCount} 面 / ${faces.triangleCount} 三角形 · 顶点 ${topology.vertexCount} 个 · 滚轮缩放 · Shift+拖拽平移`
                : hasWireframe
                ? `线框 ${topology.edgeCount} 条边 · 顶点 ${topology.vertexCount} 个 · 滚轮缩放 · Shift+拖拽平移`
                : `基于 ${bbox.pointCount} 个坐标点 · 拖拽旋转`}
            </span>
          </>
        ) : (
          <span className="dfm-bbox-tag warn">⚠️ 未识别尺寸（请手动填写）</span>
        )}
      </div>
    </div>
  )
}

// ==================== 主组件 ====================
// 修正：closePreview 是为其他模块保留，本文件未使用
export default function DFMPanel({ onClose }) {
  // ==================== 状态管理 ====================
  const [dimensions, setDimensions] = useState({
    length: '',    // 产品长度 mm
    width: '',     // 产品宽度 mm
    height: ''     // 产品高度 mm
  })

  const [surfaceReq, setSurfaceReq] = useState({
    highGloss: false,   // 高光面
    texture: false      // 皮纹面
  })

  const [structuralFeat, setStructuralFeat] = useState({
    undercut: false,    // 倒扣
    deepRib: false      // 深骨位
  })

  // v2.6: 模具配置（成本多维度扩展）
  const [moldConfig, setMoldConfig] = useState({
    steel: 'P20',           // 钢料牌号：P20 / NAK80 / S136 / H13
    cavity: 1,              // 模腔数：1 / 2 / 4 / 8
    hotRunner: false,       // 热流道
    cooling: 'standard',    // 冷却：standard / deep / conformal
    precision: 'standard',  // 精度：standard / high
  })

  const [result, setResult] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [evaluating, setEvaluating] = useState(false)
  const [evalStage, setEvalStage] = useState('')   // 评估进度阶段文本

  // ===== v2.0 模型导入状态 =====
  const [modelFile, setModelFile] = useState(null)        // 上传的文件
  const [modelMeta, setModelMeta] = useState(null)        // 解析出的元信息
  const [modelParsing, setModelParsing] = useState(false) // 解析中
  const [modelError, setModelError] = useState(null)
  const [autoFeatures, setAutoFeatures] = useState([])    // 自动识别的特征建议
  const [defects, setDefects] = useState([])              // 缺陷识别清单
  const [undercutPositions, setUndercutPositions] = useState([])  // 倒扣面坐标（3D标注用）
  const [activeReportTab, setActiveReportTab] = useState('overview') // overview|defects|report
  const fileInputRef = useRef(null)

  // 拖拽状态
  const [dragOver, setDragOver] = useState(false)

  // ==================== 风险检测逻辑 ====================
  useEffect(() => {
    const newWarnings = []

    // 规则1: 高光 + 倒扣 → 易产生段差
    if (surfaceReq.highGloss && structuralFeat.undercut) {
      newWarnings.push({
        id: 'step_diff',
        level: 'danger',
        icon: '⚠️',
        title: '段差风险',
        message: '易产生段差，建议优化分型面',
        advice: '考虑采用滑块结构或调整产品分型位置，避免高光区域出现夹线'
      })
    }

    // 规则2: 高光 + 深骨位 → 表面光泽不均
    if (surfaceReq.highGloss && structuralFeat.deepRib) {
      newWarnings.push({
        id: 'gloss_uneven',
        level: 'warning',
        icon: '🔶',
        title: '光泽均匀性风险',
        message: '深骨位可能导致高光面光泽不均',
        advice: '建议骨位深度与产品厚度比控制在1:3以内，或增加顶出机构'
      })
    }

    // 规则3: 倒扣 + 深骨位 → 脱模困难
    if (structuralFeat.undercut && structuralFeat.deepRib) {
      newWarnings.push({
        id: 'eject_issue',
        level: 'warning',
        icon: '🔧',
        title: '脱模风险',
        message: '倒扣+深骨位组合增加脱模难度',
        advice: '建议增加斜顶/滑块数量，或考虑采用油缸抽芯方案'
      })
    }

    // 规则4: 皮纹 + 倒扣 → 皮纹损坏风险
    if (surfaceReq.texture && structuralFeat.undercut) {
      newWarnings.push({
        id: 'texture_damage',
        level: 'info',
        icon: '📋',
        title: '皮纹保护建议',
        message: '倒扣区域的皮纹容易在脱模时受损',
        advice: '建议倒扣区域预留2-3mm无纹区，或采用二次蚀纹工艺'
      })
    }

    setWarnings(newWarnings)
  }, [surfaceReq, structuralFeat])

  // ==================== 输入处理 ====================
  const handleDimensionChange = (field, value) => {
    // 只允许数字和小数点
    const numValue = value.replace(/[^\d.]/g, '')
    setDimensions(prev => ({ ...prev, [field]: numValue }))
  }

  // ==================== v2.0 模型导入与解析 ====================
  const handleModelFile = async (file) => {
    if (!file) return
    // 校验扩展名
    const upper = file.name.toUpperCase()
    const supported = upper.endsWith('.STP') || upper.endsWith('.STEP') || upper.endsWith('.IGES') || upper.endsWith('.IGS') || upper.endsWith('.OBJ') || upper.endsWith('.STL')
    if (!supported) {
      setModelError(`不支持的文件格式 .${file.name.split('.').pop()}，请上传 STP/STEP/IGES/OBJ/STL`)
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setModelError('文件超过 50MB 限制，请上传精简模型')
      return
    }

    setModelParsing(true)
    setModelError(null)
    try {
      const parsed = await parseStpFile(file)
      setModelFile(file)
      setModelMeta(parsed)

      // 自动识别特征 → 自动勾选
      const suggestions = suggestFeaturesFromParse(parsed)
      setAutoFeatures(suggestions)
      const autoUndercut = suggestions.some(s => s.key === 'undercut')
      const autoDeepRib = suggestions.some(s => s.key === 'deepRib')
      setStructuralFeat(prev => ({
        undercut: prev.undercut || autoUndercut,
        deepRib: prev.deepRib || autoDeepRib,
      }))

      // 生成缺陷识别清单
      const baseDefects = generateDefectList(parsed)

      // v2.6: 面法线倒扣识别（几何级检测，比关键词匹配更准确）
      const undercutResult = detectUndercuts(parsed)
      if (undercutResult && undercutResult.hasUndercut) {
        // 检测到几何倒扣 → 追加缺陷 + 自动勾选倒扣
        setStructuralFeat(prev => ({ ...prev, undercut: true }))
        setUndercutPositions(undercutResult.undercutPositions || [])
        baseDefects.push({
          type: 'undercut_geometry',
          severity: 'high',
          title: '几何倒扣特征',
          desc: `检测到 ${undercutResult.undercutFaceCount}/${undercutResult.totalFaceCount} 个面法线朝下（倒扣），占 ${(undercutResult.undercutRatio * 100).toFixed(1)}%（识别置信度 ${Math.round(undercutResult.confidence * 100)}%）`,
          location: '需斜顶/滑块脱模区域',
          remedy: '增加斜顶/滑块机构，或调整分型面位置避开倒扣面',
          positions: undercutResult.undercutPositions || [],
        })
      }
      setDefects(baseDefects)

      // 尝试从文件名提取尺寸（如 "100x50x30.stp" 模式）
      const dimMatch = file.name.match(/(\d{2,4})\s*[xX×*]\s*(\d{2,4})\s*[xX×*]\s*(\d{2,4})/)
      if (dimMatch) {
        setDimensions({
          length: dimMatch[1],
          width: dimMatch[2],
          height: dimMatch[3],
        })
      } else if (parsed.boundingBox) {
        // 从 STP 几何包围盒自动提取尺寸（X=长 Y=宽 Z=高）
        const dims = bboxToDimensions(parsed.boundingBox)
        if (dims) {
          setDimensions({
            length: dims.length.toFixed(1),
            width: dims.width.toFixed(1),
            height: dims.height.toFixed(1),
          })
        }
      } else {
        // 无尺寸信息时，根据复杂度提示手动填写
        setModelError(null)
      }
    } catch (err) {
      setModelError('模型解析失败: ' + err.message)
    }
    setModelParsing(false)
  }

  const handleFileInput = (e) => {
    const f = e.target.files?.[0]
    if (f) handleModelFile(f)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) handleModelFile(f)
  }

  const clearModel = () => {
    setModelFile(null)
    setModelMeta(null)
    setAutoFeatures([])
    setDefects([])
    setModelError(null)
  }

  // ==================== 核心评估算法 ====================
  /**
   * 模具费用估算公式（基于行业经验）:
   *
   * basePrice = 长(mm) × 宽(mm) × 高(mm) × 基础系数
   * complexityFactor = 复杂度系数 (外观要求 + 结构特征)
   * finalPrice = basePrice × complexityFactor
   *
   * 基础系数: 0.08 ~ 0.15 (元/mm³)
   * 复杂度加成:
   *   高光面: +25%
   *   皮纹面: +10%
   *   倒扣: +20%~40% (按数量)
   *   深骨位: +15%
   */
  const handleEvaluate = () => {
    const L = parseFloat(dimensions.length) || 0
    const W = parseFloat(dimensions.width) || 0
    const H = parseFloat(dimensions.height) || 0

    // 输入验证
    if (L <= 0 || W <= 0 || H <= 0) {
      setResult({
        success: false,
        error: '请输入有效的产品尺寸（必须大于0）'
      })
      return
    }

    setEvaluating(true)

    // v2.6: 多阶段评估进度展示
    const stages = ['解析几何特征', '计算基础成本', '评估工艺复杂度', '识别制造缺陷', '生成 DFM 报告']
    let stageIdx = 0
    setEvalStage(stages[0])
    const stageTimer = setInterval(() => {
      stageIdx++
      if (stageIdx < stages.length) setEvalStage(stages[stageIdx])
    }, 150)

    // 模拟计算延迟（提升用户体验）
    setTimeout(() => {
      clearInterval(stageTimer)
      setEvalStage('')
      // ====== 第一步: 计算基础价格 ======
      const volume = L * W * H  // mm³

      // 基础系数: 根据体积大小动态调整
      let baseCoefficient = 0.10  // 默认 0.10元/mm³
      if (volume < 10000) baseCoefficient = 0.15       // 小件: 系数较高
      else if (volume < 100000) baseCoefficient = 0.12  // 中件
      else if (volume < 1000000) baseCoefficient = 0.10 // 大件
      else baseCoefficient = 0.08                       // 超大件: 系数较低

      let basePrice = volume * baseCoefficient

      // ====== 第二步: 复杂度系数 ======
      let complexityMultiplier = 1.0

      // 外观要求加成
      if (surfaceReq.highGloss) complexityMultiplier += 0.25
      if (surfaceReq.texture) complexityMultiplier += 0.10

      // 结构特征加成
      if (structuralFeat.undercut) complexityMultiplier += 0.30
      if (structuralFeat.deepRib) complexityMultiplier += 0.15

      // ====== v2.0: 模型解析复杂度加成 ======
      let modelComplexityFactor = 0
      if (modelMeta) {
        // 几何复杂度 (0-100) → 加成 0-20%
        modelComplexityFactor += modelMeta.complexity / 100 * 0.20
        // 高缺陷数 → 加成
        const highDefects = defects.filter(d => d.severity === 'high').length
        const medDefects = defects.filter(d => d.severity === 'medium').length
        modelComplexityFactor += highDefects * 0.05 + medDefects * 0.02
        complexityMultiplier += modelComplexityFactor
      }

      // ====== 第三步: 尺寸修正因子 ======
      let sizeFactor = 1.0
      if (L > 500 || W > 500) sizeFactor += 0.20   // 大尺寸加成
      if (H > 150) sizeFactor += 0.15              // 高度较大
      if (H > 300) sizeFactor += 0.20              // 超高产品
      if (L / W > 3 || W / L > 3) sizeFactor += 0.10  // 长宽比过大

      // ====== v2.6: 模具配置维度（钢料/多腔/热流道/冷却/精度）======
      // 钢料牌号系数（镜面钢/耐腐蚀钢价格显著更高）
      const steelFactors = { P20: 1.0, NAK80: 1.5, S136: 1.8, H13: 1.3 }
      const steelFactor = steelFactors[moldConfig.steel] || 1.0

      // 多腔系数（模腔越多模具费越高，但单件成本摊薄——此处仅计模具费）
      const cavityFactors = { 1: 1.0, 2: 1.5, 4: 2.2, 8: 3.5 }
      const cavityFactor = cavityFactors[moldConfig.cavity] || 1.0

      // 热流道（热流道系统成本高，但减少料柄浪费）
      const hotRunnerFactor = moldConfig.hotRunner ? 1.4 : 1.0

      // 冷却水路
      const coolingFactors = { standard: 1.0, deep: 1.15, conformal: 1.35 }
      const coolingFactor = coolingFactors[moldConfig.cooling] || 1.0

      // 精度等级
      const precisionFactors = { standard: 1.0, high: 1.3 }
      const precisionFactor = precisionFactors[moldConfig.precision] || 1.0

      // 综合模具配置系数
      const moldConfigFactor = steelFactor * cavityFactor * hotRunnerFactor * coolingFactor * precisionFactor

      // ====== 第四步: 计算最终价格区间 ======
      const estimatedPrice = basePrice * complexityMultiplier * sizeFactor * moldConfigFactor

      // 价格区间: ±10% 浮动（引入多维度后模型更精确，区间收窄）
      const priceLow = Math.round(estimatedPrice * 0.9)
      const priceHigh = Math.round(estimatedPrice * 1.1)
      const priceMid = Math.round(estimatedPrice)

      // 格式化显示（万元以下显示元，以上显示万元）
      const formatPrice = (price) => {
        if (price >= 10000) {
          return `¥${(price / 10000).toFixed(1)}万`
        }
        return `¥${price.toLocaleString()}`
      }

      // ====== v2.0: 成本影响因素说明 ======
      const costFactors = []
      costFactors.push({ name: '产品体积', impact: `${(volume / 1000).toFixed(1)} cm³`, note: volume < 100000 ? '中小型件，模具钢料成本低' : '较大型件，钢料成本上升' })
      // v2.6: 模具配置维度
      const steelNames = { P20: 'P20 预硬钢', NAK80: 'NAK80 镜面钢', S136: 'S136 耐腐蚀钢', H13: 'H13 热作钢' }
      costFactors.push({ name: '钢料牌号', impact: steelNames[moldConfig.steel] || moldConfig.steel, note: `钢料系数 ×${steelFactor}` })
      if (moldConfig.cavity > 1) costFactors.push({ name: '模腔数', impact: `${moldConfig.cavity} 腔`, note: `多腔模费用 ×${cavityFactor}，单件成本摊薄` })
      if (moldConfig.hotRunner) costFactors.push({ name: '热流道', impact: '+40%', note: '热流道系统，减少料柄浪费但模具成本上升' })
      if (moldConfig.cooling !== 'standard') costFactors.push({ name: '冷却水路', impact: moldConfig.cooling === 'conformal' ? '+35%' : '+15%', note: moldConfig.cooling === 'conformal' ? '随形冷却，3D打印水路' : '深孔钻冷却水路' })
      if (moldConfig.precision === 'high') costFactors.push({ name: '精度等级', impact: '+30%', note: '高精度模具（公差 ±0.02）需更高加工精度' })
      if (surfaceReq.highGloss) costFactors.push({ name: '高光面', impact: '+25%', note: '需镜面级抛光，模具钢等级提升' })
      if (surfaceReq.texture) costFactors.push({ name: '皮纹面', impact: '+10%', note: '蚀纹工艺费用' })
      if (structuralFeat.undercut) costFactors.push({ name: '倒扣特征', impact: '+30%', note: '需斜顶/滑块机构，增加零件与装配工时' })
      if (structuralFeat.deepRib) costFactors.push({ name: '深骨位', impact: '+15%', note: '增加排气槽与冷却设计难度' })
      if (modelMeta) costFactors.push({ name: '几何复杂度', impact: `+${Math.round(modelComplexityFactor * 100)}%`, note: `模型解析复杂度 ${modelMeta.complexity}/100` })
      if (defects.length > 0) costFactors.push({ name: '缺陷修正', impact: `${defects.filter(d => d.severity === 'high').length}项高风险`, note: '高风险缺陷需方案调整增加成本' })

      // ====== v2.0: 完整 DFM 报告 ======
      const dfmReport = buildDfmReport({
        L, W, H, volume,
        surfaceReq, structuralFeat,
        modelMeta, defects, warnings,
        priceLow, priceHigh, priceMid,
      })

      setResult({
        success: true,
        dimensions: { L, W, H, volume },
        priceRange: { low: priceLow, mid: priceMid, high: priceHigh },
        formattedRange: `${formatPrice(priceLow)} - ${formatPrice(priceHigh)}`,
        baseCoefficient,
        complexityMultiplier: complexityMultiplier.toFixed(2),
        sizeFactor: sizeFactor.toFixed(2),
        moldConfigFactor: moldConfigFactor.toFixed(2),
        modelComplexityFactor,
        riskLevel: (defects.filter(d => d.severity === 'high').length > 1 || warnings.length > 2) ? 'HIGH' : (defects.length > 0 || warnings.length > 0) ? 'MEDIUM' : 'LOW',
        recommendations: generateRecommendations({ L, W, H, volume }, surfaceReq, structuralFeat),
        costFactors,
        dfmReport,
      })

      setEvaluating(false)
    }, 800)
  }

  // ==================== 专业建议生成 ====================
  function generateRecommendations(dims, surface, structure) {
    const recs = []

    // 基于尺寸的建议
    if (dims.volume > 500000) {
      recs.push('产品体积较大，建议采用热流道系统以缩短成型周期')
    }
    if (dims.H > 200) {
      recs.push('产品高度较大，需关注注塑压力损失和填充平衡')
    }

    // 基于外观的建议
    if (surface.highGloss) {
      recs.push('高光面要求建议模具抛光至镜面等级（A0-A1），选用S136或NAK80钢材')
    }
    if (surface.texture) {
      recs.push('皮纹面建议在试模确认后进行蚀纹，避免修改导致的纹理不一致')
    }

    // 基于结构的建议
    if (structure.undercut) {
      recs.push('存在倒扣特征，模具需配置斜顶或滑块机构，预计增加15%-30%成本')
    }
    if (structure.deepRib) {
      recs.push('深骨位区域注意排气槽设计，避免困气导致烧焦或短射')
    }

    // 默认建议
    if (recs.length === 0) {
      recs.push('产品结构相对简单，常规两板模即可满足生产需求')
      recs.push('建议模具寿命设定为50-80万模次，选用P20或718H钢材')
    }

    return recs
  }

  // ==================== v2.0: 构建 DFM 分析报告 ====================
  function buildDfmReport({ L, W, H, volume, surfaceReq, structuralFeat, modelMeta, defects, warnings, priceLow, priceHigh, priceMid }) {
    // ---- 1. 可制造性评估 ----
    const manufacturability = []
    let score = 80  // 基础分
    const scoreItems = []

    if (L > 0 && W > 0 && H > 0) {
      const aspect = Math.max(L, W) / Math.min(L, W)
      if (aspect > 3) { score -= 8; scoreItems.push({ factor: '长宽比过大', impact: '-8' }) }
      if (volume > 1000000) { score -= 5; scoreItems.push({ factor: '体积偏大', impact: '-5' }) }
      if (H > 200) { score -= 4; scoreItems.push({ factor: '高度较大', impact: '-4' }) }
    }
    if (surfaceReq.highGloss) { score -= 3; scoreItems.push({ factor: '高光要求', impact: '-3' }) }
    if (surfaceReq.texture) { score -= 2; scoreItems.push({ factor: '皮纹要求', impact: '-2' }) }
    if (structuralFeat.undercut) { score -= 10; scoreItems.push({ factor: '倒扣特征', impact: '-10' }) }
    if (structuralFeat.deepRib) { score -= 5; scoreItems.push({ factor: '深骨位', impact: '-5' }) }
    if (modelMeta) {
      score -= Math.round(modelMeta.complexity / 100 * 8)
      scoreItems.push({ factor: `几何复杂度(${modelMeta.complexity}/100)`, impact: `-${Math.round(modelMeta.complexity / 100 * 8)}` })
    }
    const highCount = defects.filter(d => d.severity === 'high').length
    const medCount = defects.filter(d => d.severity === 'medium').length
    if (highCount > 0) { score -= highCount * 4; scoreItems.push({ factor: `高风险缺陷×${highCount}`, impact: `-${highCount * 4}` }) }
    if (medCount > 0) { score -= medCount * 1.5; scoreItems.push({ factor: `中风险缺陷×${medCount}`, impact: `-${Math.round(medCount * 1.5)}` }) }

    score = Math.max(30, Math.min(98, score))

    let level
    if (score >= 85) level = { text: '优秀', color: 'green', desc: '可制造性良好，建议进入模具设计阶段' }
    else if (score >= 70) level = { text: '良好', color: 'blue', desc: '基本可制造，建议优化部分特征后开模' }
    else if (score >= 55) level = { text: '一般', color: 'orange', desc: '存在一定风险，需针对性改进后再开模' }
    else level = { text: '较差', color: 'red', desc: '风险较高，建议大幅修改结构后重新评估' }

    // ---- 2. 工艺可行性 ----
    const processFeasibility = []
    processFeasibility.push({
      process: '注塑成型',
      verdict: volume > 1000000 ? '可行（注意保压与冷却）' : '可行',
      desc: volume > 1000000 ? '大件注塑需关注充填平衡，建议模流分析' : '常规注塑工艺可满足'
    })
    if (structuralFeat.undercut) {
      processFeasibility.push({
        process: '脱模机构',
        verdict: '需特殊机构',
        desc: '倒扣特征需要斜顶/滑块，增加模具复杂度和成本'
      })
    }
    if (surfaceReq.texture) {
      processFeasibility.push({
        process: '表面蚀纹',
        verdict: '可行（二次工序）',
        desc: '皮纹面需试模后蚀纹，注意纹理一致性'
      })
    }
    if (modelMeta?.stats?.solidCount > 1) {
      processFeasibility.push({
        process: '多件组装',
        verdict: '考虑组合模',
        desc: '多实体模型，可评估是否组合在一套模内'
      })
    }
    if (processFeasibility.length === 0) {
      processFeasibility.push({ process: '常规工艺', verdict: '可行', desc: '无需特殊工艺' })
    }

    // ---- 3. 风险点汇总 ----
    const risks = [...defects.map(d => ({
      type: d.type,
      severity: d.severity,
      title: d.title,
      desc: d.desc,
      remedy: d.remedy,
    }))]
    if (risks.length === 0) {
      risks.push({ type: 'none', severity: 'low', title: '未识别明显风险', desc: '模型结构相对简单，暂未发现明显制造风险', remedy: '建议结合具体使用场景人工复核' })
    }

    // ---- 4. 改进建议汇总 ----
    const improvements = []
    const improvementMap = {
      shrink_warp: '减薄区域壁厚均匀化，控制壁厚比 ≤ 1.5:1',
      warp: '骨位深度控制在壁厚 0.6 倍以内',
      sink: '凸台/骨位根部加 R 角 ≥ R0.5，降低壁厚突变',
      eject: '增加斜顶/滑块机构或调整分型面',
      flow: '合理布置浇口，增加排气槽',
      stress: '尖角处加 R 角 ≥ R0.3',
      core_shift: '增加型芯支撑，考虑镶嵌结构',
      weld: '调整浇口位置远离熔接区域',
      multi_body: '确认多实体分型方案',
      topology_error: '重新导出 STEP 文件',
      none: '无需额外改进',
    }
    const seenRemedy = new Set()
    for (const d of defects) {
      if (d.remedy && !seenRemedy.has(d.remedy)) {
        seenRemedy.add(d.remedy)
        improvements.push({ target: d.title, suggestion: d.remedy })
      }
    }
    if (improvements.length === 0) {
      improvements.push({ target: '整体', suggestion: improvementMap.none })
    }

    return {
      score,
      level,
      scoreItems,
      manufacturability: {
        summary: `可制造性评分 ${score}/100（${level.text}）`,
        level,
        items: scoreItems,
      },
      processFeasibility,
      risks,
      improvements,
      costEstimate: {
        low: priceLow,
        mid: priceMid,
        high: priceHigh,
        note: '成本区间基于体积/复杂度/特征自动估算，实际以供应商报价为准',
      },
    }
  }

  // ==================== 导出报告（打印为 PDF） ====================
  const exportReport = () => {
    if (!result || !result.success) return

    const d = result.dimensions
    const r = result.dfmReport
    const now = new Date()
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const modelName = modelMeta?.title || modelMeta?.name || '未导入模型'

    const esc = (s) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

    const severityColor = { high: '#dc2626', medium: '#d97706', low: '#16a34a', info: '#2563eb' }
    const levelColor = { green: '#16a34a', blue: '#2563eb', orange: '#d97706', red: '#dc2626' }

    // 风险点表格
    const riskRows = (r?.risks || []).map(rk => `
      <tr>
        <td style="color:${severityColor[rk.severity] || '#333'}">${['high', 'medium', 'low', 'info'].indexOf(rk.severity) >= 0 ? { high: '高', medium: '中', low: '低', info: '提示' }[rk.severity] : esc(rk.severity)}</td>
        <td>${esc(rk.title)}</td>
        <td>${esc(rk.desc)}</td>
        <td>${esc(rk.remedy)}</td>
      </tr>`).join('')

    // 成本因素
    const costFactorRows = (result.costFactors || []).map(cf => `
      <tr><td>${esc(cf.name)}</td><td>${esc(cf.impact)}</td><td>${esc(cf.note)}</td></tr>`).join('')

    // 工艺可行性
    const processRows = (r?.processFeasibility || []).map(pf => `
      <tr><td>${esc(pf.process)}</td><td>${esc(pf.verdict)}</td><td>${esc(pf.desc)}</td></tr>`).join('')

    // 改进建议
    const improvementItems = (r?.improvements || []).map(im => `
      <li><strong>${esc(im.target)}</strong>：${esc(im.suggestion)}</li>`).join('')

    // 工程师建议
    const recItems = (result.recommendations || []).map(rec => `<li>${esc(rec)}</li>`).join('')

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>DFM 评估报告 - ${esc(modelName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #1f2937; padding: 40px; max-width: 900px; margin: 0 auto; font-size: 13px; line-height: 1.6; }
  .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 24px; color: #0f172a; }
  .header .sub { color: #64748b; font-size: 12px; margin-top: 4px; }
  .meta-grid { display: flex; gap: 24px; flex-wrap: wrap; margin: 16px 0; }
  .meta-item { font-size: 12px; color: #475569; }
  .meta-item b { color: #1f2937; }
  .score-banner { display: flex; align-items: center; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
  .score-num { font-size: 48px; font-weight: 700; color: ${levelColor[r?.level?.color] || '#0ea5e9'}; }
  .score-info b { font-size: 16px; }
  .score-info p { color: #64748b; font-size: 12px; margin-top: 4px; }
  h2 { font-size: 16px; color: #0f172a; margin: 24px 0 12px; padding-left: 10px; border-left: 4px solid #0ea5e9; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 600; color: #334155; }
  ul { padding-left: 20px; margin: 8px 0; }
  li { margin: 6px 0; }
  .price-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px 20px; margin: 12px 0; }
  .price-box .range { font-size: 20px; font-weight: 700; color: #0369a1; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-align: center; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
  .toolbar { position: fixed; top: 16px; right: 16px; display: flex; gap: 8px; }
  .toolbar button { padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .btn-print { background: #0ea5e9; color: #fff; }
  .btn-close { background: #e2e8f0; color: #475569; }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ 打印 / 另存为 PDF</button>
    <button class="btn-close" onclick="window.close()">关闭</button>
  </div>

  <div class="header">
    <h1>DFM 可制造性评估报告</h1>
    <div class="sub">结构工程师AI助手 · 模具初评模块</div>
    <div class="meta-grid">
      <span class="meta-item">产品名称：<b>${esc(modelName)}</b></span>
      <span class="meta-item">评估时间：<b>${ts}</b></span>
      <span class="meta-item">尺寸：<b>${d.L} × ${d.W} × ${d.H} mm</b></span>
      <span class="meta-item">体积：<b>${(d.volume / 1000).toFixed(1)} cm³</b></span>
    </div>
  </div>

  ${r?.level ? `
  <div class="score-banner">
    <div class="score-num">${r.score}</div>
    <div class="score-info">
      <b>可制造性评分：${esc(r.level.text)}</b>
      <p>${esc(r.level.desc)}</p>
    </div>
  </div>` : ''}

  <div class="price-box">
    <div>预估模具费用</div>
    <div class="range">¥${result.priceRange.low.toLocaleString()} ~ ¥${result.priceRange.high.toLocaleString()}</div>
    <div style="color:#0369a1;font-size:12px;margin-top:4px;">中值 ¥${result.priceRange.mid.toLocaleString()}（复杂度倍率 ×${result.complexityMultiplier}）</div>
  </div>

  <h2>一、缺陷识别清单</h2>
  ${(r?.risks || []).length ? `<table><thead><tr><th style="width:60px">等级</th><th style="width:120px">风险点</th><th>说明</th><th>改进建议</th></tr></thead><tbody>${riskRows}</tbody></table>` : '<p>未识别到明显制造缺陷</p>'}

  <h2>二、工艺可行性</h2>
  <table><thead><tr><th style="width:120px">工艺</th><th style="width:160px">结论</th><th>说明</th></tr></thead><tbody>${processRows}</tbody></table>

  <h2>三、改进建议</h2>
  <ul>${improvementItems || '<li>无需额外改进</li>'}</ul>

  <h2>四、成本明细</h2>
  <table><thead><tr><th style="width:140px">因素</th><th style="width:120px">影响</th><th>说明</th></tr></thead><tbody>${costFactorRows}</tbody></table>

  <h2>五、工程师建议</h2>
  <ul>${recItems}</ul>

  <div class="footer">本报告由 AI 自动生成，仅供参考，实际以模具供应商正式报价为准</div>

  <script>setTimeout(() => window.print(), 300);</script>
</body>
</html>`

    const w = window.open('', '_blank')
    if (!w) {
      console.warn('[DFM] 导出报告失败：浏览器拦截了弹窗')
      window.alert('请允许浏览器弹出窗口以导出报告')
      return
    }
    w.document.write(html)
    w.document.close()
  }

  // ==================== 重置功能 ====================
  const handleReset = () => {
    setDimensions({ length: '', width: '', height: '' })
    setSurfaceReq({ highGloss: false, texture: false })
    setStructuralFeat({ undercut: false, deepRib: false })
    setMoldConfig({ steel: 'P20', cavity: 1, hotRunner: false, cooling: 'standard', precision: 'standard' })
    setResult(null)
    setWarnings([])
    setModelFile(null)
    setModelMeta(null)
    setAutoFeatures([])
    setDefects([])
    setModelError(null)
    setActiveReportTab('overview')
  }

  // ==================== 渲染 ====================
  return (
    <div className="dfm-panel-overlay" onClick={onClose}>
      <div className="dfm-panel-container" onClick={e => e.stopPropagation()}>
        {/* ========== 面板头部 ========== */}
        <div className="dfm-panel-header">
          <div className="dfm-header-left">
            <span className="dfm-header-icon">🔍</span>
            <div>
              <h2 className="dfm-panel-title">DFM 模具初评</h2>
              <p className="dfm-panel-subtitle">
                Design for Manufacturing — 基于专业模具工程师经验
              </p>
            </div>
          </div>
          <button className="dfm-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ========== 主内容区 ========== */}
        <div className="dfm-panel-body">
          {/* ---- 左侧: 输入区 ---- */}
          <div className="dfm-input-section">
            {/* v2.0: 模型导入区 */}
            <div className="dfm-input-group">
              <label className="dfm-group-label">
                <span className="label-icon">📁</span> 导入模型（可选）
                <span className="dfm-badge-new">v2.0 自动分析</span>
              </label>

              {!modelFile ? (
                <div
                  className={`dfm-drop-zone ${dragOver ? 'drag-over' : ''} ${modelError ? 'error' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="dfm-drop-icon">{modelParsing ? '⏳' : '📦'}</div>
                  <p className="dfm-drop-title">
                    {modelParsing ? '正在解析模型...' : '拖拽 或 点击上传 3D 模型'}
                  </p>
                  <span className="dfm-drop-hint">支持 STP / STEP / IGES / OBJ / STL · 最大 50MB</span>
                  <span className="dfm-drop-prt-hint">💡 .prt (Creo) 文件请先在 Creo 中导出 STP 格式</span>
                  {modelError && <span className="dfm-drop-error">⚠️ {modelError}</span>}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".stp,.step,.iges,.igs,.obj,.stl"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div className="dfm-model-loaded">
                  <div className="dfm-model-header">
                    <span className="dfm-model-icon">📦</span>
                    <div className="dfm-model-info">
                      <strong className="dfm-model-name">{modelMeta?.title || modelFile.name}</strong>
                      <span className="dfm-model-meta">
                        {(modelFile.size / 1024).toFixed(1)} KB
                        {modelMeta?.units && ` · 单位 ${modelMeta.units}`}
                        {modelMeta?.stats?.solidCount > 0 && ` · 实体 ${modelMeta.stats.solidCount}`}
                        {modelMeta?.complexity && ` · 复杂度 ${modelMeta.complexity}/100`}
                      </span>
                    </div>
                    <button className="dfm-model-clear" onClick={clearModel} title="移除模型">✕</button>
                  </div>

                  {/* file-viewer 插件路由：自动选择最合适的渲染器 */}
                  {(() => {
                    const ext = modelFile?.name?.split('.').pop() || ''
                    const { pluginId } = resolvePlugin(ext, modelMeta)
                    if (pluginId === 'renderer-3d') return <DFM3DViewer meta={modelMeta} file={modelFile} />
                    if (pluginId === 'renderer-canvas') return <BboxPreview meta={modelMeta} />
                    // 降级
                    if (modelMeta?.faces?.faces?.length > 0) return <DFM3DViewer meta={modelMeta} file={modelFile} />
                    return <BboxPreview meta={modelMeta} />
                  })()}

                  {autoFeatures.length > 0 && (
                    <div className="dfm-auto-features">
                      <span className="dfm-auto-label">自动识别特征：</span>
                      {autoFeatures.map((f, i) => (
                        <span key={i} className="dfm-auto-tag" title={`置信度 ${Math.round(f.confidence * 100)}%`}>
                          {f.label} · {Math.round(f.confidence * 100)}%
                        </span>
                      ))}
                    </div>
                  )}
                  {defects.length > 0 && (
                    <div className="dfm-auto-summary">
                      <span className={`dfm-auto-count high`}>⚠️ 高风险 {defects.filter(d => d.severity === 'high').length}</span>
                      <span className="dfm-auto-count med">🔶 中风险 {defects.filter(d => d.severity === 'medium').length}</span>
                      <span className="dfm-auto-count low">ℹ️ 提示 {defects.filter(d => d.severity === 'low' || d.severity === 'info').length}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 产品尺寸输入 */}
            <div className="dfm-input-group">
              <label className="dfm-group-label">
                <span className="label-icon">📐</span> 产品尺寸
              </label>
              <div className="dimension-inputs-grid">
                <div className="dim-input-wrapper">
                  <label htmlFor="dfm-length">长度</label>
                  <input
                    id="dfm-length"
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={dimensions.length}
                    onChange={e => handleDimensionChange('length', e.target.value)}
                    className="dfm-dim-input"
                  />
                  <span className="dim-unit">mm</span>
                </div>

                <div className="dim-input-wrapper">
                  <label htmlFor="dfm-width">宽度</label>
                  <input
                    id="dfm-width"
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={dimensions.width}
                    onChange={e => handleDimensionChange('width', e.target.value)}
                    className="dfm-dim-input"
                  />
                  <span className="dim-unit">mm</span>
                </div>

                <div className="dim-input-wrapper">
                  <label htmlFor="dfm-height">高度</label>
                  <input
                    id="dfm-height"
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={dimensions.height}
                    onChange={e => handleDimensionChange('height', e.target.value)}
                    className="dfm-dim-input"
                  />
                  <span className="dim-unit">mm</span>
                </div>
              </div>
            </div>

            {/* 外观面要求 */}
            <div className="dfm-input-group">
              <label className="dfm-group-label">
                <span className="label-icon">✨</span> 外观面要求
              </label>
              <div className="checkbox-group">
                <label className={`checkbox-item ${surfaceReq.highGloss ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={surfaceReq.highGloss}
                    onChange={e => setSurfaceReq(prev => ({ ...prev, highGloss: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label-text">高光面</span>
                  <span className="checkbox-hint">镜面/A0级抛光</span>
                </label>

                <label className={`checkbox-item ${surfaceReq.texture ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={surfaceReq.texture}
                    onChange={e => setSurfaceReq(prev => ({ ...prev, texture: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label-text">皮纹面</span>
                  <span className="checkbox-hint">蚀纹/晒纹处理</span>
                </label>
              </div>
            </div>

            {/* 结构特征 */}
            <div className="dfm-input-group">
              <label className="dfm-group-label">
                <span className="label-icon">🔩</span> 结构特征
              </label>
              <div className="checkbox-group">
                <label className={`checkbox-item ${structuralFeat.undercut ? 'checked danger' : ''}`}>
                  <input
                    type="checkbox"
                    checked={structuralFeat.undercut}
                    onChange={e => setStructuralFeat(prev => ({ ...prev, undercut: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label-text">存在倒扣</span>
                  <span className="checkbox-hint">需要斜顶/滑块</span>
                </label>

                <label className={`checkbox-item ${structuralFeat.deepRib ? 'checked warning' : ''}`}>
                  <input
                    type="checkbox"
                    checked={structuralFeat.deepRib}
                    onChange={e => setStructuralFeat(prev => ({ ...prev, deepRib: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label-text">深骨位</span>
                  <span className="checkbox-hint">深度 &gt; 厚度2倍</span>
                </label>
              </div>
            </div>

            {/* 模具配置（v2.6 成本多维度） */}
            <div className="dfm-input-group">
              <label className="dfm-group-label">
                <span className="label-icon">⚙️</span> 模具配置
              </label>

              <div className="mold-config-grid">
                <div className="mold-config-item">
                  <span className="mold-config-label">钢料牌号</span>
                  <select
                    className="mold-config-select"
                    value={moldConfig.steel}
                    onChange={e => setMoldConfig(prev => ({ ...prev, steel: e.target.value }))}
                  >
                    <option value="P20">P20 预硬钢</option>
                    <option value="NAK80">NAK80 镜面钢</option>
                    <option value="S136">S136 耐腐蚀钢</option>
                    <option value="H13">H13 热作钢</option>
                  </select>
                </div>

                <div className="mold-config-item">
                  <span className="mold-config-label">模腔数</span>
                  <select
                    className="mold-config-select"
                    value={moldConfig.cavity}
                    onChange={e => setMoldConfig(prev => ({ ...prev, cavity: parseInt(e.target.value) }))}
                  >
                    <option value="1">1 腔</option>
                    <option value="2">2 腔</option>
                    <option value="4">4 腔</option>
                    <option value="8">8 腔</option>
                  </select>
                </div>

                <div className="mold-config-item">
                  <span className="mold-config-label">冷却水路</span>
                  <select
                    className="mold-config-select"
                    value={moldConfig.cooling}
                    onChange={e => setMoldConfig(prev => ({ ...prev, cooling: e.target.value }))}
                  >
                    <option value="standard">普通冷却</option>
                    <option value="deep">深孔钻冷却</option>
                    <option value="conformal">随形冷却(3D打印)</option>
                  </select>
                </div>

                <div className="mold-config-item">
                  <span className="mold-config-label">精度等级</span>
                  <select
                    className="mold-config-select"
                    value={moldConfig.precision}
                    onChange={e => setMoldConfig(prev => ({ ...prev, precision: e.target.value }))}
                  >
                    <option value="standard">普通（±0.05）</option>
                    <option value="high">精密（±0.02）</option>
                  </select>
                </div>
              </div>

              <div className="checkbox-group">
                <label className={`checkbox-item ${moldConfig.hotRunner ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={moldConfig.hotRunner}
                    onChange={e => setMoldConfig(prev => ({ ...prev, hotRunner: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label-text">热流道</span>
                  <span className="checkbox-hint">减少料柄浪费，模具成本+40%</span>
                </label>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="dfm-action-buttons">
              <button
                className="btn-evaluate"
                onClick={handleEvaluate}
                disabled={evaluating}
              >
                {evaluating ? (
                  <>
                    <span className="spinner"></span>
                    {evalStage || '评估中...'}
                  </>
                ) : (
                  <>🚀 开始评估</>
                )}
              </button>
              <button className="btn-reset" onClick={handleReset}>
                🔄 重置
              </button>
            </div>
          </div>

          {/* ---- 右侧: 结果展示区 ---- */}
          <div className="dfm-result-section">
            {/* 实时警告 */}
            {warnings.length > 0 && (
              <div className="warnings-container">
                <h4 className="warnings-title">
                  ⚡ 实时风险预警 ({warnings.length})
                </h4>
                {warnings.map(w => (
                  <div key={w.id} className={`warning-card warn-${w.level}`}>
                    <div className="warning-header">
                      <span className="warn-icon">{w.icon}</span>
                      <strong className="warn-title">{w.title}</strong>
                    </div>
                    <p className="warn-message">{w.message}</p>
                    <p className="warn-advice">{w.advice}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 评估结果 */}
            {result && (
              <div className={`evaluation-result ${result.success ? 'success' : 'error'}`}>
                {!result.success ? (
                  /* 错误状态 */
                  <div className="error-display">
                    <span className="error-icon">❌</span>
                    <p>{result.error}</p>
                  </div>
                ) : (
                  /* 成功结果 */
                  <>
                    {/* 价格区间 - 最醒目 */}
                    <div className="result-price-block">
                      <span className="price-label">预估模具费用</span>
                      <div className="price-range-display">
                        <span className="price-value">{result.formattedRange}</span>
                      </div>
                      <div className="price-detail-bar">
                        <span>低: ¥{result.priceRange.low.toLocaleString()}</span>
                        <div className="price-bar-track">
                          <div
                            className="price-bar-fill"
                            style={{
                              left: `${Math.max(5, Math.min(45, (result.priceRange.low / (result.priceRange.high * 1.2)) * 100))}%`,
                              width: `${Math.max(10, Math.min(80, ((result.priceRange.high - result.priceRange.low) / (result.priceRange.high * 1.2)) * 100))}%`
                            }}
                          >
                            <span className="price-bar-mid">¥{(result.priceRange.mid / 10000).toFixed(1)}万</span>
                          </div>
                        </div>
                        <span>高: ¥{result.priceRange.high.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* 导出报告按钮 */}
                    <div className="dfm-export-row">
                      <button className="btn-export-report" onClick={exportReport}>
                        📄 导出报告（PDF）
                      </button>
                    </div>

                    {/* v2.0: Tab 导航 */}
                    <div className="dfm-tabs">
                      <button
                        className={`dfm-tab ${activeReportTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveReportTab('overview')}
                      >📊 总览</button>
                      <button
                        className={`dfm-tab ${activeReportTab === 'defects' ? 'active' : ''}`}
                        onClick={() => setActiveReportTab('defects')}
                      >
                        🔍 缺陷识别{defects.length > 0 && <span className="dfm-tab-badge">{defects.length}</span>}
                      </button>
                      <button
                        className={`dfm-tab ${activeReportTab === 'report' ? 'active' : ''}`}
                        onClick={() => setActiveReportTab('report')}
                      >📋 DFM 报告</button>
                      <button
                        className={`dfm-tab ${activeReportTab === 'cost' ? 'active' : ''}`}
                        onClick={() => setActiveReportTab('cost')}
                      >💰 成本明细</button>
                    </div>

                    {/* Tab 1: 总览 */}
                    {activeReportTab === 'overview' && (
                      <div className="dfm-tab-content">
                        {/* 可制造性评分 */}
                        {result.dfmReport && (
                          <div className="dfm-score-card">
                            <div className="dfm-score-left">
                              <span className={`dfm-score-num ${result.dfmReport.level?.color}`}>{result.dfmReport.score}</span>
                              <span className="dfm-score-label">可制造性评分</span>
                            </div>
                            <div className="dfm-score-right">
                              <span className={`dfm-score-level ${result.dfmReport.level?.color}`}>{result.dfmReport.level?.text}</span>
                              <p className="dfm-score-desc">{result.dfmReport.level?.desc}</p>
                              <div className="dfm-score-bar">
                                <div className={`dfm-score-bar-fill ${result.dfmReport.level?.color}`} style={{ width: `${result.dfmReport.score}%` }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 详细参数 */}
                        <div className="result-details-grid">
                          <div className="detail-item">
                            <span className="detail-label">产品体积</span>
                            <span className="detail-value">{result.dimensions.volume.toLocaleString()} mm³</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">基础系数</span>
                            <span className="detail-value">{result.baseCoefficient.toFixed(2)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">复杂度倍率</span>
                            <span className="detail-value">×{result.complexityMultiplier}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">风险等级</span>
                            <span className={`detail-value risk-${result.riskLevel.toLowerCase()}`}>{result.riskLevel}</span>
                          </div>
                        </div>

                        {/* 实时警告 */}
                        {warnings.length > 0 && (
                          <div className="dfm-inline-warnings">
                            {warnings.map(w => (
                              <div key={w.id} className={`dfm-inline-warn warn-${w.level}`}>
                                <span>{w.icon}</span>
                                <div>
                                  <strong>{w.title}</strong>
                                  <p>{w.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 专业建议 */}
                        <div className="recommendations-box">
                          <h4 className="rec-title">💡 工程师建议</h4>
                          <ul className="rec-list">
                            {result.recommendations.map((rec, i) => (
                              <li key={i} className="rec-item">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: 缺陷识别 */}
                    {activeReportTab === 'defects' && (
                      <div className="dfm-tab-content">
                        <h4 className="dfm-section-title">🔍 AI 缺陷识别清单</h4>
                        {defects.length === 0 ? (
                          <div className="dfm-no-defects">
                            <span className="dfm-no-defects-icon">✅</span>
                            <p>未识别到明显制造缺陷</p>
                            <span className="dfm-no-defects-sub">模型结构较简单，可进入模具设计阶段</span>
                          </div>
                        ) : (
                          <div className="dfm-defect-list">
                            {defects.map((d, i) => (
                              <div key={i} className={`dfm-defect-card sev-${d.severity}`}>
                                <div className="dfm-defect-head">
                                  <span className={`dfm-defect-sev ${d.severity}`}>
                                    {d.severity === 'high' ? '🔴 高' : d.severity === 'medium' ? '🟠 中' : d.severity === 'info' ? '🔵 提示' : '🟢 低'}
                                  </span>
                                  <strong className="dfm-defect-title">{d.title}</strong>
                                  <span className="dfm-defect-location">{d.location}</span>
                                </div>
                                <p className="dfm-defect-desc">{d.desc}</p>
                                {d.positions && d.positions.length > 0 && (
                                  <div className="dfm-defect-positions">
                                    <span className="dfm-pos-label">📍 倒扣位置（共 {d.positions.length} 处采样）：</span>
                                    <div className="dfm-pos-chips">
                                      {d.positions.slice(0, 8).map((p, pi) => (
                                        <span key={pi} className="dfm-pos-chip" title={`坐标 (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`}>
                                          ({p.x.toFixed(0)}, {p.y.toFixed(0)}, {p.z.toFixed(0)})
                                        </span>
                                      ))}
                                      {d.positions.length > 8 && <span className="dfm-pos-more">+{d.positions.length - 8}</span>}
                                    </div>
                                  </div>
                                )}
                                <div className="dfm-defect-remedy">
                                  <span className="dfm-remedy-label">改进建议：</span>
                                  <span className="dfm-remedy-text">{d.remedy}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: DFM 报告 */}
                    {activeReportTab === 'report' && result.dfmReport && (
                      <div className="dfm-tab-content dfm-report-content">
                        {/* 报告头 */}
                        <div className="dfm-report-header">
                          <h4 className="dfm-report-title">📋 DFM 分析报告</h4>
                          <span className="dfm-report-id">报告编号: DFM-{String(Date.now()).slice(-6)}</span>
                        </div>

                        {/* 1. 可制造性评估 */}
                        <div className="dfm-report-section">
                          <h5 className="dfm-report-section-title">1️⃣ 可制造性评估</h5>
                          <p className="dfm-report-summary">{result.dfmReport.manufacturability.summary}</p>
                          <div className="dfm-report-score-items">
                            {result.dfmReport.scoreItems.map((item, i) => (
                              <div key={i} className="dfm-report-score-item">
                                <span className="dfm-rsi-name">{item.factor}</span>
                                <span className="dfm-rsi-impact">{item.impact}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. 工艺可行性 */}
                        <div className="dfm-report-section">
                          <h5 className="dfm-report-section-title">2️⃣ 工艺可行性分析</h5>
                          <div className="dfm-process-list">
                            {result.dfmReport.processFeasibility.map((p, i) => (
                              <div key={i} className="dfm-process-item">
                                <span className="dfm-process-name">{p.process}</span>
                                <span className="dfm-process-verdict">{p.verdict}</span>
                                <span className="dfm-process-desc">{p.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. 风险点 */}
                        <div className="dfm-report-section">
                          <h5 className="dfm-report-section-title">3️⃣ 风险点提示</h5>
                          <div className="dfm-report-risks">
                            {result.dfmReport.risks.map((r, i) => (
                              <div key={i} className="dfm-report-risk">
                                <span className={`dfm-risk-dot ${r.severity}`} />
                                <div className="dfm-risk-body">
                                  <strong>{r.title}</strong>
                                  <p>{r.desc}</p>
                                  <span className="dfm-risk-remedy">→ {r.remedy}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4. 改进建议 */}
                        <div className="dfm-report-section">
                          <h5 className="dfm-report-section-title">4️⃣ 改进建议</h5>
                          <ul className="dfm-report-improvements">
                            {result.dfmReport.improvements.map((imp, i) => (
                              <li key={i}>
                                <strong>{imp.target}：</strong>{imp.suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 5. 成本预估 */}
                        <div className="dfm-report-section">
                          <h5 className="dfm-report-section-title">5️⃣ 模具成本预估</h5>
                          <div className="dfm-report-cost">
                            <span className="dfm-report-cost-range">{result.formattedRange}</span>
                            <span className="dfm-report-cost-note">{result.dfmReport.costEstimate.note}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: 成本明细 */}
                    {activeReportTab === 'cost' && (
                      <div className="dfm-tab-content">
                        <h4 className="dfm-section-title">💰 成本影响因素</h4>
                        <div className="dfm-cost-factors">
                          {result.costFactors.map((f, i) => (
                            <div key={i} className="dfm-cost-factor">
                              <span className="dfm-cost-factor-name">{f.name}</span>
                              <span className="dfm-cost-factor-impact">{f.impact}</span>
                              <span className="dfm-cost-factor-note">{f.note}</span>
                            </div>
                          ))}
                        </div>
                        <div className="dfm-cost-formula">
                          <h5>📐 估算公式</h5>
                          <p className="dfm-formula-text">
                            预估费用 = 体积({(result.dimensions.volume / 1000).toFixed(0)} cm³) × 基础系数({result.baseCoefficient.toFixed(2)}) × 复杂度倍率(×{result.complexityMultiplier}) × 尺寸因子(×{result.sizeFactor})
                          </p>
                          <p className="dfm-formula-result">= <strong>{result.formattedRange}</strong></p>
                        </div>
                        <div className="dfm-cost-note">
                          ⚠️ 以上成本为智能估算值，实际模具费用受钢材、精度等级、供应商产能等因素影响，建议结合 2-3 家供应商报价综合确定。
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 空状态提示 */}
            {!result && warnings.length === 0 && (
              <div className="empty-result-placeholder">
                <div className="placeholder-icon">🎯</div>
                <p>输入产品参数后点击「开始评估」</p>
                <p className="placeholder-sub">系统将基于行业经验快速给出模具费用预估</p>
              </div>
            )}
          </div>
        </div>

        {/* ========== 底部信息栏 ========== */}
        <div className="dfm-panel-footer">
          <span className="footer-note">
            📌 本评估结果仅供参考，实际费用需结合具体产品结构和供应商报价确定
          </span>
          <span className="footer-version">v2.0 · 支持模型导入 + AI 缺陷识别</span>
        </div>
      </div>
    </div>
  )
}
