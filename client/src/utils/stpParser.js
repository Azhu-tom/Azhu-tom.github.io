/**
 * STP/STEP 文件轻量级解析器
 * 提取：单位、文件描述、实体统计、特征关键词
 * 用途：辅助 DFM 评估（无完整几何引擎时的启发式判断）
 */

import { getFeatureRules, getRemedyRules, getDefectTitleRules } from './dfmRules'

// 特征关键词规则（从 dfmRules 规则中心读取，支持插件化扩展）
// 转换为 { keyword: { label, weight, risk } } 结构（向后兼容）
function buildFeatureKeywordMap() {
  const map = {}
  for (const rule of getFeatureRules()) {
    map[rule.keyword] = { label: rule.label, weight: rule.weight, risk: rule.risk }
  }
  return map
}

const FEATURE_KEYWORDS = buildFeatureKeywordMap()

/**
 * 解析 STP/STEP 文件
 * @param {File} file
 * @returns {Promise<{ units: string, headers: object, stats: object, features: string[], complexity: number, content: string, name: string }>}
 */
export async function parseStpFile(file) {
  if (!file) return null

  const text = await file.text()
  const name = file.name
  const size = file.size
  const upper = name.toUpperCase()

  // 1. 提取单位（解析 UNIT 段）
  let units = 'mm'
  const unitMatch = text.match(/UNIT\s*\(\s*(.*?)\s*\)/i)
  if (unitMatch) {
    const unitBody = unitMatch[1].toUpperCase()
    if (unitBody.includes('METRE') || unitBody.includes('.M.')) units = 'm'
    else if (unitBody.includes('CENTI') || unitBody.includes('.CENTI.')) units = 'cm'
    else if (unitBody.includes('INCH') || unitBody.includes('.INCH.')) units = 'in'
    else if (unitBody.includes('MILLI') || unitBody.includes('.MILLI.')) units = 'mm'
  }

  // 2. 提取文件描述
  const descMatch = text.match(/FILE_DESCRIPTION\s*\(\s*\(\s*['"]([^'"]+)['"]/i)
  const nameMatch = text.match(/FILE_NAME\s*\(\s*['"]([^'"]+)['"]/i)
  const schemaMatch = text.match(/FILE_SCHEMA\s*\(\s*\(\s*['"]([^'"]+)['"]/i)

  // 3. 实体统计
  const stats = {
    solidCount: (text.match(/MANIFOLD_SOLID_BREP/g) || []).length,
    advancedBRep: (text.match(/ADVANCED_BREP_SHAPE_REPRESENTATION/g) || []).length,
    shellCount: (text.match(/CLOSED_SHELL/g) || []).length,
    faceCount: (text.match(/ADVANCED_FACE/g) || []).length,
    edgeCount: (text.match(/EDGE_CURVE/g) || []).length,
    vertexCount: (text.match(/VERTEX_POINT/g) || []).length,
    circleCount: (text.match(/CIRCLE/g) || []).length,
    lineCount: (text.match(/LINE\s*\(/g) || []).length,
  }

  // 4. 复杂度估算（基于实体数 + 拓扑结构）
  const complexity = Math.min(1, (
    Math.min(stats.solidCount * 0.15, 0.5) +
    Math.min(stats.faceCount * 0.005, 0.3) +
    Math.min(stats.edgeCount * 0.001, 0.2)
  ))

  // 5. 特征识别（基于文件名 + 内容关键词）
  const contentUpper = text.toUpperCase()
  const features = []
  for (const [kw, info] of Object.entries(FEATURE_KEYWORDS)) {
    const inName = upper.includes(kw.toUpperCase())
    const inContent = contentUpper.includes(kw.toUpperCase())
    if (inName || inContent) {
      features.push({ keyword: kw, label: info.label, weight: info.weight, risk: info.risk, source: inName ? 'filename' : 'content' })
    }
  }

  // 6. 提取可能的长度尺寸（解析 LENGTH_UNIT 段或 B_SPLINE 等）
  let detectedSize = null
  const sizeMatch = text.match(/(?:LENGTH|BOUNDING|SIZE)\s*[UNIT]*\s*\(\s*([0-9.]+)/i)
  if (sizeMatch) detectedSize = parseFloat(sizeMatch[1])

  // 7. 计算几何包围盒 + 提取点云（用于 3D 预览）
  const { boundingBox, points } = extractPointsAndBbox(text)

  // 7.5 提取拓扑结构（顶点 ID + 边线）用于线框渲染
  const topology = extractTopology(text, points)

  // 7.6 提取面拓扑（FACE → 顶点列表）用于实体三角面渲染
  const faces = extractFaces(text, topology)

  // 8. 提取精度描述（PROJECT、RELATED 等元数据）
  const projectMatch = text.match(/PROJECT\s*\(\s*['"]([^'"]+)['"]/i)
  const relatedMatch = text.match(/RELATED\s*\(\s*['"]([^'"]+)['"]/i)

  return {
    name,
    size,
    units,
    title: nameMatch ? nameMatch[1] : name,
    description: descMatch ? descMatch[1] : '',
    schema: schemaMatch ? schemaMatch[1] : 'AUTOMOTIVE_DESIGN',
    project: projectMatch ? projectMatch[1] : '',
    stats,
    complexity: Math.round(complexity * 100),  // 0-100 百分比
    complexityLevel: complexity < 0.3 ? 'simple' : complexity < 0.6 ? 'medium' : 'complex',
    features,
    detectedSize,
    boundingBox,
    points,
    topology,
    faces,
    contentLength: text.length,
    isStp: upper.endsWith('.STP') || upper.endsWith('.STEP'),
    isCadFile: upper.endsWith('.STP') || upper.endsWith('.STEP') || upper.endsWith('.IGES') || upper.endsWith('.IGS'),
  }
}

/**
 * 从 STP 文本提取所有 CARTESIAN_POINT 坐标 + 几何包围盒
 * CARTESIAN_POINT('',(x,y,z)) 格式
 * @param {string} text
 * @returns {{ boundingBox, points }}
 */
function extractPointsAndBbox(text) {
  // 匹配所有 CARTESIAN_POINT('',(x,y,z))
  const pointRegex = /CARTESIAN_POINT\s*\(\s*['"]?[^'"]*['"]?\s*,\s*\(\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*\)/g
  const points = []
  let match
  while ((match = pointRegex.exec(text)) !== null) {
    const x = parseFloat(match[1])
    const y = parseFloat(match[2])
    const z = parseFloat(match[3])
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      points.push({ x, y, z })
    }
    // 限定上限：2000 点（3D 渲染性能考虑）
    if (points.length >= 2000) break
  }
  if (points.length < 3) return { boundingBox: null, points: [] }

  const xs = points.map(p => p.x), ys = points.map(p => p.y), zs = points.map(p => p.z)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const minZ = Math.min(...zs), maxZ = Math.max(...zs)
  return {
    boundingBox: {
      minX, maxX, minY, maxY, minZ, maxZ,
      dx: maxX - minX,
      dy: maxY - minY,
      dz: maxZ - minZ,
      pointCount: points.length,
    },
    points,
  }
}

/**
 * 基于 bounding box 推断"长度/宽度/高度"
 * 默认：X→长(dx最大), Y→宽, Z→高
 * @param {object} bbox
 * @returns { length: number, width: number, height: number } (mm)
 */
export function bboxToDimensions(bbox) {
  if (!bbox) return null
  const dims = [bbox.dx, bbox.dy, bbox.dz]
  const max = Math.max(...dims)
  const min = Math.min(...dims)
  const mid = dims.reduce((a, b) => a + b, 0) - max - min
  return {
    length: max,   // 最长
    width: mid,    // 中间
    height: min,   // 最短
  }
}

/**
 * 提取 STP 拓扑结构（顶点 ID + 边线）用于线框预览
 * 解析：VERTEX_POINT → CARTESIAN_POINT; EDGE_CURVE → 端点
 * @param {string} text
 * @param {Array} points 已提取的坐标点
 * @returns { vertices: [{id, x, y, z}], edges: [{v1, v2}], curves: [] }
 */
function extractTopology(text, points) {
  // 1. 解析 VERTEX_POINT → 引用哪个 CARTESIAN_POINT
  //     VERTEX_POINT('',(#332))  → 顶点 → 坐标点
  const vertexMap = new Map()  // VERTEX_ID → {x, y, z}
  const vpRegex = /#(\d+)\s*=\s*VERTEX_POINT\s*\(\s*['"]?[^'"]*['"]?\s*,\s*#(\d+)\s*\)/g
  let m
  while ((m = vpRegex.exec(text)) !== null) {
    const vertexId = parseInt(m[1])
    const pointRefId = m[2]
    // 找到对应 CARTESIAN_POINT
    const cpRegex = new RegExp(`#${pointRefId}\\s*=\\s*CARTESIAN_POINT\\s*\\(\\s*['"]?[^'"]*['"]?\\s*,\\s*\\(\\s*([-\\d.eE+]+)\\s*,\\s*([-\\d.eE+]+)\\s*,\\s*([-\\d.eE+]+)\\s*\\)`)
    const cpMatch = text.match(cpRegex)
    if (cpMatch) {
      vertexMap.set(vertexId, {
        x: parseFloat(cpMatch[1]),
        y: parseFloat(cpMatch[2]),
        z: parseFloat(cpMatch[3]),
      })
    }
  }

  // 2. 解析 EDGE_CURVE → 两端顶点
  //     EDGE_CURVE('',#100,#101,#102,.T.)  → 端点 v1, v2
  const edges = []
  const edgeSeen = new Set()
  const ecRegex = /#(\d+)\s*=\s*EDGE_CURVE\s*\(\s*['"]?[^'"]*['"]?\s*,\s*#(\d+)\s*,\s*#(\d+)\s*,/g
  while ((m = ecRegex.exec(text)) !== null) {
    const v1Id = parseInt(m[2])
    const v2Id = parseInt(m[3])
    if (vertexMap.has(v1Id) && vertexMap.has(v2Id)) {
      // 去重（边无向）
      const key = v1Id < v2Id ? `${v1Id}-${v2Id}` : `${v2Id}-${v1Id}`
      if (!edgeSeen.has(key)) {
        edgeSeen.add(key)
        edges.push({ v1: v1Id, v2: v2Id })
      }
    }
  }

  // 3. 提取 VERTEX 数组（带坐标）
  const vertices = []
  for (const [id, pt] of vertexMap) {
    vertices.push({ id, x: pt.x, y: pt.y, z: pt.z })
  }

  // 4. 提取其他曲线类型（CIRCLE、LINE 等）但这些是曲线定义不是直接的边
  //    仅供将来扩展

  return {
    vertices,
    edges,
    vertexCount: vertices.length,
    edgeCount: edges.length,
  }
}

/**
 * 基于解析结果生成特征识别建议（启发式）
 * @param {object} parsed parseStpFile 结果
 * @returns [{ key, label, autoChecked, confidence }]
 */
export function suggestFeaturesFromParse(parsed) {
  if (!parsed) return []
  const suggestions = []
  const labelMap = {
    shrink_warp: { key: 'deepRib', label: '深骨位/壁厚不均', confidence: 0.9 },
    warp:        { key: 'deepRib', label: '深骨位', confidence: 0.8 },
    sink:        { key: 'deepRib', label: '骨位/凸台风险', confidence: 0.7 },
    eject:       { key: 'undercut', label: '倒扣', confidence: 0.95 },
    flow:        { key: 'deepRib', label: '空腔结构', confidence: 0.6 },
    stress:      { key: 'deepRib', label: '尖角应力', confidence: 0.6 },
    core_shift:  { key: 'undercut', label: '长型芯', confidence: 0.5 },
    weld:        { key: 'deepRib', label: '熔接线', confidence: 0.5 },
  }
  const seenKeys = new Set()
  for (const f of parsed.features) {
    if (!f.risk) continue
    const sug = labelMap[f.risk]
    if (!sug || seenKeys.has(sug.key)) continue
    seenKeys.add(sug.key)
    suggestions.push({
      key: sug.key,
      label: sug.label,
      confidence: sug.confidence,
      fromFeature: f.label,
    })
  }
  return suggestions
}

/**
 * 基于复杂度生成 DFM 缺陷识别清单
 */
export function generateDefectList(parsed) {
  if (!parsed) return []
  const list = []
  const { features, stats, complexity, complexityLevel } = parsed

  // 1. 基于复杂度
  if (complexityLevel === 'complex') {
    list.push({
      type: 'complexity',
      severity: 'medium',
      title: '几何复杂度偏高',
      desc: `实体数 ${stats.solidCount}、面数 ${stats.faceCount}，复杂度评分 ${complexity}/100`,
      location: '整体',
      remedy: '建议分模时细化分型面设计，必要时考虑多板模或热流道方案',
    })
  }

  // 2. 特征识别
  for (const f of features) {
    if (f.weight <= 0) continue
    const remedies = getRemedyRules()
    const t = getDefectTitleRules()[f.keyword]
    if (!t) continue
    list.push({
      type: f.keyword,
      severity: f.weight > 0.7 ? 'high' : f.weight > 0.4 ? 'medium' : 'low',
      title: t.title,
      desc: `${t.desc}（识别置信度 ${Math.round(f.weight * 100)}%）`,
      location: '基于文件内容/命名识别',
      remedy: remedies[f.risk] || '需人工复核',
    })
  }

  // 3. 拓扑检查
  if (stats.solidCount > 1) {
    list.push({
      type: 'multi_body',
      severity: 'info',
      title: '多实体模型',
      desc: `检测到 ${stats.solidCount} 个独立实体`,
      location: '整体',
      remedy: '确认是否为多件组合，分析各实体分型可行性',
    })
  }
  if (stats.faceCount === 0 && stats.advancedBRep === 0) {
    list.push({
      type: 'topology_error',
      severity: 'high',
      title: '拓扑异常',
      desc: '未检测到有效的实体拓扑',
      location: '整体',
      remedy: '检查 STEP 文件完整性，建议重新导出',
    })
  }

  return list
}

/**
 * 提取 STP 面拓扑（FACE → 顶点序列）用于实体渲染
 * 解析链：
 *   ADVANCED_FACE('',#FACE_BOUND)
 *     FACE_OUTER_BOUND/FACE_BOUND('',#EDGE_LOOP)
 *       EDGE_LOOP('',(#OE1,#OE2,...))
 *         ORIENTED_EDGE('',#EDGE_CURVE,#V_START,#V_END)
 * @param {string} text
 * @param {object} topology 已提取的拓扑（含 vertices）
 * @returns { faces: [{vertices: [vId, vId, ...], vertexCount}], faceCount }
 */
function extractFaces(text, topology) {
  if (!topology || topology.vertices.length === 0) {
    return { faces: [], faceCount: 0 }
  }

  // 0. EDGE_CURVE → 起点/终点 VERTEX_ID
  //    EDGE_CURVE('',#V_START,#V_END,#CURVE_GEOMETRY)
  //    兼容 * 占位符
  const edgeMap = new Map()  // EDGE_CURVE_ID → {start, end}
  const edgeRegex = /#(\d+)\s*=\s*EDGE_CURVE\s*\(([^)]+)\)/g
  let m
  while ((m = edgeRegex.exec(text)) !== null) {
    const edgeId = parseInt(m[1])
    const body = m[2]
    // 提取前两个 #xxx（START_VERTEX, END_VERTEX）
    const refs = body.match(/#(\d+)/g) || []
    if (refs.length >= 2) {
      edgeMap.set(edgeId, {
        start: parseInt(refs[0].slice(1)),
        end: parseInt(refs[1].slice(1)),
      })
    }
  }

  // 1. ORIENTED_EDGE → 引用 EDGE_CURVE → 取两端顶点
  //    ORIENTED_EDGE('',#EDGE_CURVE_ID,*,*) 或 ORIENTED_EDGE('',*,*,#END,.F.)
  //    兼容两种格式
  const oeMap = new Map()
  const oeRegex = /#(\d+)\s*=\s*ORIENTED_EDGE\s*\(([^)]+)\)/g
  while ((m = oeRegex.exec(text)) !== null) {
    const oeId = parseInt(m[1])
    const body = m[2]
    // 提取所有 #xxx 引用
    const refs = body.match(/#(\d+)/g) || []
    let endVertex = null
    // 找 EDGE_CURVE 的引用（不是 VERTEX 引用）
    // 通常 ORIENTED_EDGE 格式: ORIENTED_EDGE('',#EDGE,#START,#END) 或 (_,*,*,#X,.F.)
    // 简化：第一个 #xxx 是 EDGE_CURVE
    if (refs.length > 0) {
      const firstRef = parseInt(refs[0].slice(1))
      // 检查 firstRef 是否在 edgeMap 中
      if (edgeMap.has(firstRef)) {
        const edge = edgeMap.get(firstRef)
        // 反向边（.F.）交换 start/end
        if (body.includes('.F.')) {
          endVertex = edge.start
        } else {
          endVertex = edge.end
        }
      }
    }
    if (endVertex !== null) {
      oeMap.set(oeId, endVertex)
    }
  }

  // 2. EDGE_LOOP → 一组 ORIENTED_EDGE
  //    EDGE_LOOP('',(#OE1,#OE2,...))
  const loops = new Map()  // LOOP_ID → [OE_ID]
  const loopRegex = /#(\d+)\s*=\s*EDGE_LOOP\s*\(\s*['"]?[^'"]*['"]?\s*,\s*\(([^)]+)\)/g
  while ((m = loopRegex.exec(text)) !== null) {
    const loopId = parseInt(m[1])
    // 解析 OE 引用 #xx
    const oeIds = (m[2].match(/#(\d+)/g) || []).map(s => parseInt(s.slice(1)))
    loops.set(loopId, oeIds)
  }

  // 3. FACE_BOUND/FACE_OUTER_BOUND → EDGE_LOOP_ID
  //    FACE_OUTER_BOUND('',#LOOP_ID)
  const boundRegex = /#(\d+)\s*=\s*FACE_(?:OUTER_)?BOUND\s*\(\s*['"]?[^'"]*['"]?\s*,\s*#(\d+)/g
  const faceBounds = []  // [{boundId, loopId}]
  while ((m = boundRegex.exec(text)) !== null) {
    faceBounds.push({ boundId: parseInt(m[1]), loopId: parseInt(m[2]) })
  }

  // 4. ADVANCED_FACE → FACE_BOUND（一个面可能多个环：外环 + 内孔）
  //    ADVANCED_FACE('',(#BOUND1,#BOUND2,...))
  const faceRegex = /#(\d+)\s*=\s*ADVANCED_FACE\s*\(\s*['"]?[^'"]*['"]?\s*,\s*\(([^)]+)\)/g
  const facesList = []  // [{faceId, boundIds}]
  while ((m = faceRegex.exec(text)) !== null) {
    const faceId = parseInt(m[1])
    const boundIds = (m[2].match(/#(\d+)/g) || []).map(s => parseInt(s.slice(1)))
    facesList.push({ faceId, boundIds })
  }

  // 5. 组装：每个面 → 顶点序列（按外环 + 内环）
  const faceResult = []
  for (const { faceId, boundIds } of facesList) {
    const vertices = []
    for (const boundId of boundIds) {
      const bound = faceBounds.find(b => b.boundId === boundId)
      if (!bound) continue
      const oeIds = loops.get(bound.loopId) || []
      // 取出外环顶点（oeMap 值就是 VERTEX ID）
      const loopVerts = []
      for (const oeId of oeIds) {
        const vertexId = oeMap.get(oeId)
        if (vertexId) loopVerts.push(vertexId)
      }
      vertices.push(...loopVerts)
    }
    if (vertices.length >= 3) {
      faceResult.push({ faceId, vertices })
    }
  }

  // 6. 三角化（耳切法 Ear Clipping：消除扇形三角化的"漏斗"变形）
  const triangles = []
  const vertexCoordMap = new Map()
  for (const v of topology.vertices) {
    vertexCoordMap.set(v.id, { x: v.x, y: v.y, z: v.z })
  }
  for (const f of faceResult) {
    if (f.vertices.length === 3) {
      triangles.push(f.vertices.slice())
    } else if (f.vertices.length > 3) {
      const tris = earClipPolygon(f.vertices, vertexCoordMap)
      triangles.push(...tris)
    }
  }

  return {
    faceCount: faceResult.length,
    triangleCount: triangles.length,
    faces: triangles,  // 每个三角形含 3 个顶点 ID
    polygons: faceResult, // 原始多边形（调试用）
  }
}

// ==================== 耳切法三角化 ====================

/**
 * 选择多边形的主投影平面（取跨度最大的 2 个轴）
 */
function selectMainPlane(verts) {
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity
  for (const v of verts) {
    if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x
    if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y
    if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z
  }
  const dx = maxX - minX, dy = maxY - minY, dz = maxZ - minZ
  if (dz >= dx && dz >= dy) return ['x', 'y']     // 主平面 XY
  if (dy >= dx && dy >= dz) return ['x', 'z']     // 主平面 XZ
  return ['y', 'z']                              // 主平面 YZ
}

/**
 * 2D 叉积 (a, b) × (b, c)
 */
function cross2D(prev, curr, next, ax, ay) {
  return (curr[ax] - prev[ax]) * (next[ay] - prev[ay]) -
         (curr[ay] - prev[ay]) * (next[ax] - prev[ax])
}

/**
 * 点 P 是否在三角形 (a, b, c) 内（2D）
 */
function pointInTriangle2D(p, a, b, c, ax, ay) {
  const d1 = cross2D(a, b, p, ax, ay)
  const d2 = cross2D(b, c, p, ax, ay)
  const d3 = cross2D(c, a, p, ax, ay)
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0)
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0)
  return !(hasNeg && hasPos)
}

/**
 * 耳切法三角化多边形（消除扇形漏斗）
 * @param {Array<number>} vertexIds  多边形顶点 ID 序列
 * @param {Map} coordMap  id → {x, y, z}
 * @returns {Array<[id,id,id]>}
 */
function earClipPolygon(vertexIds, coordMap) {
  const triangles = []
  // 转带坐标的顶点列表
  let poly = vertexIds.map(id => {
    const c = coordMap.get(id)
    return c ? { id, ...c } : null
  }).filter(Boolean)

  if (poly.length < 3) return []
  if (poly.length === 3) return [[poly[0].id, poly[1].id, poly[2].id]]

  // 主投影平面（取跨度最大的 2 个轴）
  const [ax, ay] = selectMainPlane(poly)
  // 多边形方向（确保 CCW / 凸性 cross > 0）
  let areaSum = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length]
    areaSum += (b[ax] - a[ax]) * (b[ay] + a[ay])
  }
  // 顺时针（areaSum > 0）则反转顶点使 CCW
  if (areaSum > 0) poly.reverse()

  let guard = 0
  while (poly.length > 3 && guard++ < poly.length * 4) {
    let earIdx = -1

    // 寻找"耳"
    for (let i = 0; i < poly.length; i++) {
      const prev = poly[(i - 1 + poly.length) % poly.length]
      const curr = poly[i]
      const next = poly[(i + 1) % poly.length]

      // 1. 三角形必须是凸的（cross > 0，CCW）
      const cross = cross2D(prev, curr, next, ax, ay)
      if (cross <= 1e-9) continue

      // 2. 多边形其他顶点不能在该三角形内
      let valid = true
      for (let j = 0; j < poly.length; j++) {
        if (j === i || j === (i - 1 + poly.length) % poly.length ||
            j === (i + 1) % poly.length) continue
        if (pointInTriangle2D(poly[j], prev, curr, next, ax, ay)) {
          valid = false
          break
        }
      }
      if (valid) { earIdx = i; break }
    }

    // 找不到耳（多边形退化/自相交）→ 退化用扇形三角化（避免无限递归）
    if (earIdx === -1) {
      // 防止无限递归：限制递归次数
      earClipPolygon._depth = (earClipPolygon._depth || 0) + 1
      if (earClipPolygon._depth > 3) {
        // 强制扇形（放弃质量）
        for (let i = 1; i < poly.length - 1; i++) {
          triangles.push([poly[0].id, poly[i].id, poly[i + 1].id])
        }
        return triangles
      }
      // 用最短边对角线分割（有限递归）
      let bestLen = Infinity, splitA = 0, splitB = 0
      for (let i = 0; i < poly.length; i++) {
        for (let j = i + 2; j < poly.length; j++) {
          if (i === 0 && j === poly.length - 1) continue
          const a = poly[i], b = poly[j]
          const len = (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
          if (len < bestLen) { bestLen = len; splitA = i; splitB = j }
        }
      }
      const part1 = poly.slice(0, splitB + 1)
      const part2 = poly.slice(splitB).concat(poly.slice(0, splitA + 1))
      triangles.push(...earClipPolygon(part1.map(p => p.id), coordMap))
      triangles.push(...earClipPolygon(part2.map(p => p.id), coordMap))
      earClipPolygon._depth -= 1
      return triangles
    }

    // 切耳
    const prev = poly[(earIdx - 1 + poly.length) % poly.length]
    const curr = poly[earIdx]
    const next = poly[(earIdx + 1) % poly.length]
    triangles.push([prev.id, curr.id, next.id])
    poly.splice(earIdx, 1)
  }

  // 最后 3 个顶点
  if (poly.length === 3) {
    triangles.push([poly[0].id, poly[1].id, poly[2].id])
  }

  return triangles
}

/**
 * 基于三角面片法线分析识别倒扣特征（v2.6）
 * 原理：倒扣面 = 法线指向开模方向负方向的面（需要斜顶/滑块脱模）
 * 开模方向假设为 +Z（模型默认 Z 轴朝上，法线朝 -Z 即朝下的面）
 *
 * @param {object} parsed parseStpFile 的返回结果
 * @returns {object|null} { hasUndercut, undercutFaceCount, totalFaceCount, undercutRatio, confidence }
 */
export function detectUndercuts(parsed) {
  if (!parsed || !parsed.faces || !parsed.faces.faces || parsed.faces.faces.length === 0) {
    return null
  }
  if (!parsed.topology || !parsed.topology.vertices || parsed.topology.vertices.length === 0) {
    return null
  }

  // 构建顶点坐标映射
  const coordMap = new Map()
  for (const v of parsed.topology.vertices) {
    coordMap.set(v.id, { x: v.x, y: v.y, z: v.z })
  }

  const triangles = parsed.faces.faces
  const undercutFaces = []
  const totalFaces = triangles.length
  let minZ = Infinity
  let maxZ = -Infinity
  // v2.6: 记录倒扣面中心坐标（用于 3D 标注）
  const undercutPositions = []

  for (const tri of triangles) {
    if (!Array.isArray(tri) || tri.length < 3) continue
    const p0 = coordMap.get(tri[0])
    const p1 = coordMap.get(tri[1])
    const p2 = coordMap.get(tri[2])
    if (!p0 || !p1 || !p2) continue

    for (const p of [p0, p1, p2]) {
      if (p.z < minZ) minZ = p.z
      if (p.z > maxZ) maxZ = p.z
    }

    // 计算面法线（叉积）
    const v1 = { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z }
    const v2 = { x: p2.x - p0.x, y: p2.y - p0.y, z: p2.z - p0.z }
    const nx = v1.y * v2.z - v1.z * v2.y
    const ny = v1.z * v2.x - v1.x * v2.z
    const nz = v1.x * v2.y - v1.y * v2.x
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
    if (len < 1e-12) continue

    // 归一化后的法线 Z 分量
    const nzNorm = nz / len

    // 倒扣判断：法线指向 -Z（朝下），z 分量 < -0.5
    if (nzNorm < -0.5) {
      const avgZ = (p0.z + p1.z + p2.z) / 3
      const cx = (p0.x + p1.x + p2.x) / 3
      const cy = (p0.y + p1.y + p2.y) / 3
      undercutFaces.push({ avgZ, nzNorm })
      // 采样记录位置（最多 20 个，避免标注点过多）
      if (undercutPositions.length < 20) {
        undercutPositions.push({ x: cx, y: cy, z: avgZ })
      }
    }
  }

  const undercutRatio = undercutFaces.length / Math.max(1, totalFaces)
  const hasUndercut = undercutRatio > 0.05  // 超过 5% 的面朝下 → 判定有倒扣

  return {
    hasUndercut,
    undercutFaceCount: undercutFaces.length,
    totalFaceCount: totalFaces,
    undercutRatio: Math.round(undercutRatio * 100) / 100,
    minZ: Math.round(minZ * 100) / 100,
    maxZ: Math.round(maxZ * 100) / 100,
    undercutPositions,
    confidence: hasUndercut ? Math.min(0.95, 0.6 + undercutRatio * 2) : 0.3,
  }
}