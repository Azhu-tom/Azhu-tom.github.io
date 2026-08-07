import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  materials,
  materialCategories,
  getMaterialById,
  getMaterialsByCategory
} from '../../data/bomMaterials'
import * as XLSX from 'xlsx'
import './BOMPanel.css'

/**
 * BOM成本秒算面板 v3
 * 模式1: 单物料计算（原有）
 * 模式2: BOM导入 + 成本预估报告（四字段：物料编码/名称/数量/描述）
 */

// ==================== 常量 ====================
const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_BOM_ROWS = 500

// 四字段别名：编码 / 名称 / 数量 / 描述
const FIELD_ALIASES = {
  code: [
    '物料编码','编码','料号','零件号','图号','代号','物料号','件号','编号',
    'item code','part number','material code','mcode','no.','序号','no','line no'
  ],
  name: [
    '物料名称','名称','品名','零件名称','物料名','零部件名称','配件名称',
    '产品名称','组件名称','item name','part name','material name','品名规格'
  ],
  quantity: [
    '数量','用量','qty','quantity','数量/台','单机用量','定额','消耗量',
    '需求数量','采购数量','件数','台用量','用量/台','用量(pcs)'
  ],
  description: [
    '物料描述','描述','规格','规格型号','规格描述','技术参数','物料说明',
    'description','spec','specification','desc','详细描述','参数','备注'
  ]
}

// 非数据行的关键词（页脚/说明/签名等）
const NON_DATA_KEYWORDS = [
  '制表','编制','审核','批准','复核','审定',
  '文件版本规则','文件有效性规则','文件特殊内容说明',
  '版本规则','有效性规则','特殊内容说明',
  '备注','说明','注意事项','注意事项说明',
  'BOM','bom','清单','汇总',
  '共','合计','小计',
  '日期','时间','签名','盖章',
  '总计'
]

// 数字列探测：判断某列是否"看起来是序号列"（含连续 1,2,3 模式）
function looksLikeSerialColumn(rows, colIdx, maxRows = 30) {
  const limit = Math.min(rows.length, maxRows)
  const nums = []
  for (let i = 0; i < limit; i++) {
    const v = rows[i]?.[colIdx]
    if (v == null || v === '') continue
    const num = parseFloat(String(v).trim())
    if (Number.isFinite(num) && num === Math.floor(num) && num >= 0 && num < 100000) {
      nums.push(num)
    }
  }
  if (nums.length < 3) return false
  // 找连续 1,2,3 模式（允许前面有标题/后面有页脚干扰）
  for (let i = 0; i <= nums.length - 3; i++) {
    if (nums[i] === 1 && nums[i + 1] === 2 && nums[i + 2] === 3) return true
  }
  return false
}

// 成本信息提取关键词库
const MATERIAL_KEYWORDS = [
  { keys: ['ABS'], name: 'ABS', category: '塑料', unitPrice: 12.5, density: 1.05 },
  { keys: ['PP'], name: 'PP', category: '塑料', unitPrice: 8.5, density: 0.91 },
  { keys: ['POM'], name: 'POM', category: '塑料', unitPrice: 24, density: 1.42 },
  { keys: ['PC'], name: 'PC', category: '塑料', unitPrice: 18.5, density: 1.20 },
  { keys: ['PVC'], name: 'PVC', category: '塑料', unitPrice: 7.5, density: 1.40 },
  { keys: ['PET'], name: 'PET', category: '塑料', unitPrice: 11, density: 1.35 },
  { keys: ['PMMA', '亚克力'], name: 'PMMA', category: '塑料', unitPrice: 16, density: 1.19 },
  { keys: ['PA66'], name: 'PA66', category: '塑料', unitPrice: 22, density: 1.14 },
  { keys: ['PE'], name: 'PE', category: '塑料', unitPrice: 9, density: 0.95 },
  { keys: ['PS'], name: 'PS', category: '塑料', unitPrice: 10, density: 1.05 },
  { keys: ['CEM-1', 'CEM1'], name: 'CEM-1', category: '板材', unitPrice: 35, density: 1.50 },
  { keys: ['FR-4', 'FR4'], name: 'FR-4', category: '板材', unitPrice: 55, density: 1.85 },
  { keys: ['硅胶', '硅橡胶'], name: '硅胶', category: '硅胶', unitPrice: 32, density: 1.15 },
  { keys: ['不锈钢', '304', '316', 'SUS304', 'SUS316'], name: '不锈钢', category: '金属', unitPrice: 28, density: 7.93 },
  { keys: ['铝合金', '铝', '6061', '6063', '7075'], name: '铝合金', category: '金属', unitPrice: 22, density: 2.70 },
  { keys: ['铜'], name: '铜', category: '金属', unitPrice: 72, density: 8.96 },
  { keys: ['黄铜', 'H59', 'H62'], name: '黄铜', category: '金属', unitPrice: 48, density: 8.50 },
  { keys: ['铁', 'Q235', '冷轧板', '镀锌板', '钢板'], name: '钢/铁', category: '金属', unitPrice: 6.5, density: 7.85 },
  { keys: ['镁合金'], name: '镁合金', category: '金属', unitPrice: 38, density: 1.81 },
  { keys: ['铜版纸', '不干胶', '哑银龙', '特龙', '龙特龙'], name: '纸/标签', category: '包装', unitPrice: 3.5, density: 0.00065 },
  { keys: ['EPE', '珍珠棉'], name: 'EPE', category: '包装', unitPrice: 9, density: 0.025 },
  { keys: ['海绵', '泡棉', 'EVA'], name: '泡棉', category: '包装', unitPrice: 15, density: 0.03 },
  { keys: ['陶瓷'], name: '陶瓷', category: '其他', unitPrice: 40, density: 2.5 },
  { keys: ['玻璃'], name: '玻璃', category: '其他', unitPrice: 20, density: 2.5 },
  { keys: ['尼龙'], name: '尼龙', category: '塑料', unitPrice: 22, density: 1.14 }
]

const PROCESS_KEYWORDS = [
  '喷涂','喷漆','喷粉','电镀','镀锌','镀铬','镀镍','镀金','阳极氧化','氧化','发黑','磷化',
  '抛光','拉丝','喷砂','丝印','移印','印刷','激光','镭雕','模塑','注塑','吸塑','吹塑',
  '挤出','冲压','压铸','铸造','焊接','折弯','钣金','CNC','车削','铣削','磨削','线切割',
  '攻牙','压铆','铆接','贴装','组装','包胶','包塑','覆膜','贴膜','裱糊','烫金','凹凸',
  'UV','哑光','亮光','高光','磨砂','晒纹','布纹','咬花','蚀纹'
]

const COLOR_KEYWORDS = [
  '白色','黑色','灰色','红色','蓝色','绿色','黄色','紫色','橙色','棕色','粉色','透明',
  '银色','金色','本色','原色','远航灰','椰子灰','星空灰','钛金灰','曜石黑','象牙白',
  '珍珠白','玫瑰金','香槟金','古铜色','古铜'
]

// 模糊匹配：计算两个字符串的相似度（0~1）
function similarity(a, b) {
  if (!a || !b) return 0
  const s1 = a.toLowerCase().trim(), s2 = b.toLowerCase().trim()
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.9
  if (s1.length > 50 || s2.length > 50) {
    const shorter = s1.length < s2.length ? s1 : s2
    const longer = s1.length < s2.length ? s2 : s1
    if (longer.includes(shorter)) return 0.85
    return 0
  }
  const m = s1.length, n = s2.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = s1[i - 1] === s2[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  const maxLen = Math.max(m, n)
  return maxLen === 0 ? 1 : 1 - dp[m][n] / maxLen
}

// 寻找最佳表头行（扫描前 10 行，跳过明显是非表头的内容）
function detectHeaderRow(rows) {
  if (!rows || rows.length === 0) return 0
  let bestRow = 0, bestScore = -1
  const limit = Math.min(rows.length, 10)
  for (let i = 0; i < limit; i++) {
    const row = rows[i] || []
    let score = 0
    const seenFields = new Set()
    for (const cell of row) {
      if (cell == null) continue
      const v = String(cell).trim()
      if (!v) continue
      // 明显非表头：制表/审核/日期等关键词
      if (NON_DATA_KEYWORDS.some(k => v === k || v.startsWith(k))) { score -= 10; continue }
      for (const field of Object.keys(FIELD_ALIASES)) {
        for (const alias of FIELD_ALIASES[field]) {
          if (v === alias) { score += 4; seenFields.add(field); break }
          if (similarity(v, alias) >= 0.78) { score += 3; seenFields.add(field); break }
          if (v.includes(alias) || alias.includes(v)) { score += 1; if (v.includes(alias)) seenFields.add(field); break }
        }
      }
    }
    // 多样性加分：覆盖的字段越多越好
    score += seenFields.size * 5
    if (score > bestScore) { bestScore = score; bestRow = i }
  }
  return bestRow
}

// 根据表头自动匹配字段列；遇到序号列（纯整数且从1开始）自动跳过
function autoMapFields(headers, allRows = []) {
  const mapping = {}
  for (const field of Object.keys(FIELD_ALIASES)) {
    let bestCol = -1, bestScore = 0
    for (let c = 0; c < headers.length; c++) {
      const hv = String(headers[c] || '').trim()
      if (!hv) continue
      // 跳过看起来是序号列的列，避免误映射（编码通常是字母数字混合）
      if (allRows.length > 0 && looksLikeSerialColumn(allRows, c)) continue
      for (const alias of FIELD_ALIASES[field]) {
        const score = similarity(hv, alias)
        if (score > bestScore) { bestScore = score; bestCol = c }
      }
    }
    if (bestScore >= 0.5) mapping[field] = bestCol
  }
  return mapping
}

// ========== 物料描述 -> 成本信息提取 ==========
function normalizeDesc(desc) {
  return String(desc || '').replace(/[\s]+/g, ' ').trim()
}

function extractWeightKg(desc) {
  const m = desc.match(/(\d+(?:\.\d+)?)\s*(g|kg|mg)(?![a-zA-Z0-9])/)
  if (!m) return null
  const val = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  return unit === 'kg' ? val : unit === 'mg' ? val / 1000000 : val / 1000
}

function extractDimensions(desc) {
  const dims = []
  const regex = /(\d+(?:\.\d+)?)(?:\s*[×xX*]\s*(\d+(?:\.\d+)?))(?:\s*[×xX*]\s*(\d+(?:\.\d+)?))?\s*(mm|cm|m|μm|um|英寸|寸)?/gi
  let m
  while ((m = regex.exec(desc)) !== null) {
    const parts = [m[1], m[2], m[3]].filter(Boolean).map(parseFloat)
    const unit = m[4] || 'mm'
    const maxValM = unit === 'm' ? parts[0] : unit === 'cm' ? parts[0] / 100 : unit === '英寸' ? parts[0] * 0.0254 : unit === '寸' ? parts[0] * 0.0333 : parts[0] / 1000
    if (maxValM > 2) continue
    const before = desc.charAt(m.index - 1)
    if (before && /[a-zA-Z]/.test(before) && !/[×xX]/.test(before)) continue
    dims.push({ values: parts, unit, text: m[0] })
  }
  return dims
}

function estimateWeightFromDims(dims, densityGPerCm3) {
  if (!dims.length || !densityGPerCm3) return null
  const d = dims.find(x => x.values.length >= 3) || dims[0]
  const unitFactor = d.unit === 'cm' ? 10 : d.unit === 'm' ? 1000 : 1
  const valuesMm = d.values.map(v => v * unitFactor)
  const volumeMm3 = valuesMm.length >= 3
    ? valuesMm[0] * valuesMm[1] * valuesMm[2]
    : valuesMm[0] * valuesMm[1] * 1
  return (volumeMm3 / 1000) * densityGPerCm3 / 1000
}

function extractMaterial(desc) {
  const d = desc.toUpperCase()
  let best = null
  for (const mk of MATERIAL_KEYWORDS) {
    for (const k of mk.keys) {
      const ku = k.toUpperCase()
      const idx = d.indexOf(ku)
      if (idx !== -1) {
        if (!best || k.length > best.key.length || (k.length === best.key.length && idx < best.index)) {
          best = { ...mk, key: k, index: idx }
        }
      }
    }
  }
  return best ? { name: best.name, category: best.category, unitPrice: best.unitPrice, density: best.density } : null
}

function extractProcesses(desc) {
  const found = []
  const lower = desc.toLowerCase()
  for (const p of PROCESS_KEYWORDS) {
    if (lower.includes(p.toLowerCase())) found.push(p)
  }
  return [...new Set(found)]
}

function extractColors(desc) {
  const found = []
  for (const c of COLOR_KEYWORDS) {
    if (desc.includes(c)) found.push(c)
  }
  return [...new Set(found)]
}

function extractSpecs(desc) {
  let specs = []
  let cleaned = desc.replace(/(\d+)\s*\/\s*(\d+(?:\.\d+)?)\s*(英寸|寸)/g, (match) => {
    if (!specs.includes(match)) specs.push(match)
    return ' '
  })
  const patterns = [
    /\d+(?:\.\d+)?\s*[×xX*]\s*\d+(?:\.\d+)?(?:\s*[×xX*]\s*\d+(?:\.\d+)?)?\s*(?:mm|cm|m|μm|um|英寸|寸)?/gi,
    /\d+(?:\.\d+)?\s*(?:mm|cm|m|μm|um|英寸|寸)/gi,
    /\d+(?:\.\d+)?\s*(?:g|kg|mg)(?![a-zA-Z0-9])/g,
    /\d+(?:\.\d+)?\s*(?:V|A|W|MPa|Bar|°C|度)\b/gi,
    /\d+(?:\.\d+)?\s*(?:L|l|ml)\b/gi,
    /\d+(?:\.\d+)?\s*G\b/g
  ]
  for (const re of patterns) {
    const ms = cleaned.match(re) || []
    ms.forEach(m => {
      const numMatch = m.match(/(\d+(?:\.\d+)?)/)
      if (numMatch) {
        const num = parseFloat(numMatch[1])
        const unit = m.match(/(mm|cm|m|μm|um|英寸|寸)/i)?.[1]
        if (unit) {
          const mVal = unit === 'm' ? num : unit === 'cm' ? num / 100 : unit === '英寸' ? num * 0.0254 : unit === '寸' ? num * 0.0333 : num / 1000
          if (mVal > 2) return
        }
      }
      if (!specs.includes(m)) specs.push(m)
    })
  }
  const fullDims = specs.filter(s => /[×xX*]/.test(s))
  specs = specs.filter(s => {
    if (/[×xX*]/.test(s)) return true
    for (const fd of fullDims) {
      const fdNorm = fd.replace(/\s/g, '').toLowerCase()
      const sNorm = s.replace(/\s/g, '').toLowerCase()
      if (fdNorm.includes(sNorm)) return false
    }
    return true
  })
  return specs
}

export function extractCostInfo(description) {
  const desc = normalizeDesc(description)
  if (!desc) {
    return { material: '', materialCategory: '', unitPrice: 0, density: 0, specs: [], processes: [], colors: [], features: [], weightKg: null, dimensions: [] }
  }
  const material = extractMaterial(desc)
  const processes = extractProcesses(desc)
  const colors = extractColors(desc)
  const specs = extractSpecs(desc)
  const weightKg = extractWeightKg(desc)
  const dims = extractDimensions(desc)

  let finalMaterial = material
  if (material && (material.name === 'PET' || material.name === 'PE')) {
    const isPackage = /(贴纸|标签|包装袋|袋|罩|盒|箱|不干胶|铜版纸|覆膜|贴膜)/.test(desc)
    if (isPackage) {
      finalMaterial = { ...material, category: '包装', unitPrice: material.name === 'PET' ? 0.014 : 0.012, density: material.name === 'PET' ? 0.00135 : 0.00092 }
    }
  }

  let estimatedWeightKg = weightKg
  if (estimatedWeightKg == null && dims.length && finalMaterial && finalMaterial.category !== '包装') {
    estimatedWeightKg = estimateWeightFromDims(dims, finalMaterial.density)
  }

  const featureKeywords = ['防水', '阻燃', '耐热', '耐寒', '耐高温', '食品级', '医用级', '带锁扣', '镀金', '内置', '外置', '插墙式', '接插式', '冷热分开']
  const features = []
  for (const fk of featureKeywords) {
    if (desc.includes(fk)) features.push(fk)
  }

  return {
    material: finalMaterial ? finalMaterial.name : '',
    materialCategory: finalMaterial ? finalMaterial.category : '',
    unitPrice: finalMaterial ? finalMaterial.unitPrice : 0,
    density: finalMaterial ? finalMaterial.density : 0,
    specs,
    processes,
    colors,
    features,
    weightKg: estimatedWeightKg,
    dimensions: dims.map(d => d.text)
  }
}

function formatMoney(n) {
  if (n == null || isNaN(n)) return '-'
  return '¥' + n.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
}

function formatNumber(n, digits = 2) {
  if (n == null || isNaN(n)) return '-'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: digits })
}

function calculateRowCost(row) {
  // 用户手动设置的成本：保留不动，不参与自动重算
  if (row && row.manualCost && typeof row.lineCost === 'number') {
    return row.lineCost
  }
  const qty = parseFloat(row.quantity) || 0
  const extracted = row.extracted || {}
  const unitPrice = parseFloat(extracted.unitPrice) || 0
  const weightKg = extracted.weightKg != null ? parseFloat(extracted.weightKg) : null
  if (qty <= 0 || unitPrice <= 0) return 0
  // 有明确重量时直接计算
  if (weightKg != null && weightKg > 0) {
    return qty * weightKg * unitPrice
  }
  // 包装/标签类无法从尺寸可靠估算，无重量时不估算
  if (extracted.materialCategory === '包装') return 0
  // 其他材质无重量时，按件给一个保守默认参考重量
  const defaultWeight = extracted.materialCategory === '金属' ? 0.1 : 0.05
  return qty * defaultWeight * unitPrice
}

// ==================== 组件 ====================
export default function BOMPanel({ onClose }) {
  // ---- 面板显示 ----
  const [mode, setMode] = useState('single') // 'single' | 'import'

  // ---- 单物料模式 ----
  const [activeCategory, setActiveCategory] = useState('plastic')
  const [selectedMaterialId, setSelectedMaterialId] = useState('abs')
  const [weight, setWeight] = useState('')
  const [weightUnit, setWeightUnit] = useState('g')
  // 切换单位时同步换算显示值（避免 200g 切 kg 变成 200kg 的巨额）
  const handleUnitSwitch = useCallback((newUnit) => {
    if (!weight || !weight.trim()) { setWeightUnit(newUnit); return }
    const v = parseFloat(weight)
    if (isNaN(v) || v === 0) { setWeightUnit(newUnit); return }
    let converted = v
    if (weightUnit === 'g' && newUnit === 'kg') converted = +(v / 1000).toFixed(4)
    else if (weightUnit === 'kg' && newUnit === 'g') converted = +(v * 1000).toFixed(2)
    setWeight(String(converted))
    setWeightUnit(newUnit)
  }, [weight, weightUnit])
  const [quantitySingle, setQuantitySingle] = useState(1)
  const [processType, setProcessType] = useState('none')
  const [processCustomPrice, setProcessCustomPrice] = useState('')
  const [wasteRate, setWasteRate] = useState(5)
  const [managementRate, setManagementRate] = useState(8)
  const [profitRate, setProfitRate] = useState(15)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // ---- 导入模式 ----
  const [importStep, setImportStep] = useState('upload') // upload | preview | report
  const [parsedFile, setParsedFile] = useState(null)
  const [rawRows, setRawRows] = useState([])
  const [headerRowIndex, setHeaderRowIndex] = useState(0)
  const [fieldMapping, setFieldMapping] = useState({})
  const [manualMappingOpen, setManualMappingOpen] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importRates, setImportRates] = useState({ waste: 5, management: 8, profit: 15 })
  const [parseError, setParseError] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [editingCell, setEditingCell] = useState(null)
  const fileInputRef = useRef(null)

  const selectedMaterial = useMemo(() => {
    return getMaterialById(activeCategory, selectedMaterialId)
  }, [activeCategory, selectedMaterialId])

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ---- 单物料成本计算 ----
  const singleCost = useMemo(() => {
    const w = parseFloat(weight) || 0
    if (!selectedMaterial || w <= 0) return null
    const weightKg = weightUnit === 'g' ? w / 1000 : w
    const qty = Math.max(1, parseFloat(quantitySingle) || 1)
    const materialCost = weightKg * selectedMaterial.unitPrice * qty
    const wasteCost = materialCost * (wasteRate / 100)
    let processCost = 0
    if (processType !== 'none') {
      const price = processCustomPrice ? parseFloat(processCustomPrice) : 0
      processCost = price * qty
    }
    const subtotal = materialCost + wasteCost + processCost
    const managementCost = subtotal * (managementRate / 100)
    const profit = subtotal * (profitRate / 100)
    const total = subtotal + managementCost + profit
    return { materialCost, wasteCost, processCost, subtotal, managementCost, profit, total, qty }
  }, [weight, weightUnit, selectedMaterial, quantitySingle, processType, processCustomPrice, wasteRate, managementRate, profitRate])

  // ---- 导入：文件解析 ----
  function handleFileSelect(file) {
    setParseError('')
    setIsParsing(true)
    if (!file) { setIsParsing(false); return }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setParseError(`不支持的文件格式：${ext}，请上传 ${SUPPORTED_EXTENSIONS.join('/')}`)
      setIsParsing(false)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setParseError(`文件过大（${(file.size / 1024 / 1024).toFixed(2)}MB），请控制在 ${MAX_FILE_SIZE / 1024 / 1024}MB 以内`)
      setIsParsing(false)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellFormula: false, cellHTML: false })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
        const rows = json.filter(r => r.some(c => c !== '' && c != null))
        if (rows.length === 0) throw new Error('未读取到有效数据，请检查文件是否为空')
        if (rows.length > MAX_BOM_ROWS) throw new Error(`BOM 行数超过 ${MAX_BOM_ROWS} 行限制`)
        const detectedHeader = detectHeaderRow(rows)
        setRawRows(rows)
        setHeaderRowIndex(detectedHeader)
        const headers = rows[detectedHeader].map(h => String(h || '').trim())
        const mapping = autoMapFields(headers, rows)
        setFieldMapping(mapping)
        setParsedFile({ name: file.name, size: file.size, rowCount: rows.length })
        applyMappingToRows(rows, detectedHeader, mapping)
        setImportStep('preview')
      } catch (err) {
        console.error(err)
        setParseError(err.message || '文件解析失败，请检查格式')
      } finally {
        setIsParsing(false)
      }
    }
    reader.onerror = () => { setParseError('文件读取失败'); setIsParsing(false) }
    reader.readAsArrayBuffer(file)
  }

  function applyMappingToRows(rows, headerIdx, mapping) {
    const headers = rows[headerIdx].map(h => String(h || '').trim())
    const dataRows = rows.slice(headerIdx + 1)
    const newRows = dataRows.map((row, idx) => {
      const code = mapping.code >= 0 ? String(row[mapping.code] ?? '') : ''
      const name = mapping.name >= 0 ? String(row[mapping.name] ?? '') : ''
      const qtyRaw = mapping.quantity >= 0 ? row[mapping.quantity] : ''
      const description = mapping.description >= 0 ? String(row[mapping.description] ?? '') : ''
      const qtyNum = parseFloat(qtyRaw)
      const quantity = isNaN(qtyNum) ? 0 : qtyNum
      const extracted = extractCostInfo(description)
      // 若 name 为空但 description 以非顿号开头，取 description 第一段作为 name 的回退
      let finalName = name
      if (!finalName.trim() && description.trim()) {
        const seg = description.split(/[、,，\/;；]/)[0]?.trim()
        if (seg && seg.length <= 30 && !NON_DATA_KEYWORDS.some(k => seg === k || seg.startsWith(k))) {
          finalName = seg
        }
      }
      return {
        id: `row-${idx}`,
        code: code.trim(),
        name: finalName.trim(),
        quantity,
        quantityStr: String(qtyRaw ?? ''),
        description: description.trim(),
        extracted,
        extractedAuto: {
          material: true, specs: true, processes: true, colors: true, features: true, weightKg: true
        },
        lineCost: 0
      }
    }).filter(r => {
      // 过滤明显无效的行
      const allFields = `${r.code} ${r.name} ${r.description}`.trim()
      if (!allFields) return false
      // 三个核心字段都为空 → 过滤
      if (!r.code && !r.name && !r.description) return false
      // 关键词命中 → 过滤（页脚/说明/制表人等）
      const fieldHits = [r.code, r.name, r.description].some(v => v && NON_DATA_KEYWORDS.some(k => v === k || v.startsWith(k)))
      if (fieldHits) return false
      // 整行只是标点/数字/单字符 → 过滤
      if (allFields.length <= 2 && /^[0-9.\-/、，,\s]+$/.test(allFields)) return false
      // 数量为 0 且两个文本字段都为空（仅编码有内容但描述名称空）→ 多半是页脚
      if (r.quantity === 0 && !r.description && !r.name) return false
      return true
    })
    // 计算行成本
    newRows.forEach(r => { r.lineCost = calculateRowCost(r) })
    setImportRows(newRows)
  }

  function reapplyExtract(rowId, description) {
    setImportRows(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const fresh = extractCostInfo(description)
      const next = { ...r, description }
      const auto = r.extractedAuto || {}
      if (auto.material) next.extracted = { ...next.extracted, material: fresh.material, materialCategory: fresh.materialCategory, unitPrice: fresh.unitPrice, density: fresh.density }
      if (auto.specs) next.extracted = { ...next.extracted, specs: fresh.specs }
      if (auto.processes) next.extracted = { ...next.extracted, processes: fresh.processes }
      if (auto.colors) next.extracted = { ...next.extracted, colors: fresh.colors }
      if (auto.features) next.extracted = { ...next.extracted, features: fresh.features }
      if (auto.weightKg) next.extracted = { ...next.extracted, weightKg: fresh.weightKg }
      next.lineCost = calculateRowCost(next)
      return next
    }))
  }

  function updateExtractedField(rowId, field, value) {
    setImportRows(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const next = { ...r, extracted: { ...r.extracted, [field]: value }, extractedAuto: { ...r.extractedAuto, [field]: false } }
      next.lineCost = calculateRowCost(next)
      return next
    }))
  }

  function updateRowField(rowId, field, value) {
    setImportRows(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const next = { ...r, [field]: value }
      if (field === 'quantity') {
        const n = parseFloat(value)
        next.quantity = isNaN(n) ? 0 : n
      }
      if (field === 'description') {
        return reapplyExtractWithValue(r, value)
      }
      // 用户手动编辑行成本：标记 manualCost，自动重算将被跳过
      if (field === 'lineCost') {
        const n = parseFloat(value)
        next.lineCost = isNaN(n) ? 0 : Math.max(0, n)
        next.manualCost = true
        return next
      }
      next.lineCost = calculateRowCost(next)
      return next
    }))
  }

  function reapplyExtractWithValue(row, description) {
    const fresh = extractCostInfo(description)
    const next = { ...row, description }
    const auto = row.extractedAuto || {}
    if (auto.material) next.extracted = { ...next.extracted, material: fresh.material, materialCategory: fresh.materialCategory, unitPrice: fresh.unitPrice, density: fresh.density }
    if (auto.specs) next.extracted = { ...next.extracted, specs: fresh.specs }
    if (auto.processes) next.extracted = { ...next.extracted, processes: fresh.processes }
    if (auto.colors) next.extracted = { ...next.extracted, colors: fresh.colors }
    if (auto.features) next.extracted = { ...next.extracted, features: fresh.features }
    if (auto.weightKg) next.extracted = { ...next.extracted, weightKg: fresh.weightKg }
    next.lineCost = calculateRowCost(next)
    return next
  }

  function deleteRow(rowId) {
    setImportRows(prev => prev.filter(r => r.id !== rowId))
  }

  function handleManualMappingChange(field, colIndex) {
    const idx = parseInt(colIndex, 10)
    const nextMapping = { ...fieldMapping, [field]: isNaN(idx) ? -1 : idx }
    setFieldMapping(nextMapping)
    applyMappingToRows(rawRows, headerRowIndex, nextMapping)
  }

  function handleHeaderRowChange(rowIdx) {
    const idx = parseInt(rowIdx, 10)
    if (isNaN(idx) || idx < 0 || idx >= rawRows.length) return
    setHeaderRowIndex(idx)
    const headers = rawRows[idx].map(h => String(h || '').trim())
    const mapping = autoMapFields(headers)
    setFieldMapping(mapping)
    applyMappingToRows(rawRows, idx, mapping)
  }

  function resetImport() {
    setImportStep('upload')
    setParsedFile(null)
    setRawRows([])
    setFieldMapping({})
    setImportRows([])
    setParseError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ---- 导入报告 ----
  // 全部成本和 = 材料费小计 × (1 + 损耗率) × (1 + 管理费率 + 利润率)
// 与 importReport / final-summary 一致；用户可见的"最终估算"金额
// 含逐项明细：损耗/管理/利润合计（与行成本手动修改实时联动）
const importSummary = useMemo(() => {
    const total = importRows.reduce((sum, r) => sum + (r.lineCost || 0), 0)
    const matched = importRows.filter(r => r.extracted?.material).length
    const withCost = importRows.filter(r => r.lineCost > 0).length
    const manualCount = importRows.filter(r => r.manualCost === true).length
    const w = parseFloat(importRates.waste) || 0
    const m = parseFloat(importRates.management) || 0
    const p = parseFloat(importRates.profit) || 0
    const wasteSum = total * (w / 100)
    const subtotal = total + wasteSum
    const managementSum = subtotal * (m / 100)
    const profitSum = subtotal * (p / 100)
    const grandTotal = subtotal + managementSum + profitSum
    return {
      total, matched, withCost, manualCount, count: importRows.length,
      subtotal, wasteSum, managementSum, profitSum, grandTotal,
      wasteRate: w, managementRate: m, profitRate: p
    }
  }, [importRows, importRates])

  function generateReport() {
    setImportStep('report')
  }

  // ---- 渲染辅助 ----
  function renderEditableCell(row, field, value, type = 'text', widthClass = '') {
    const key = `${row.id}-${field}`
    const isEditing = editingCell === key
    // 行成本用货币格式展示
    let displayValue = value == null || value === '' ? <span className="empty-hint">-</span> : value
    if (field === 'lineCost' && !isEditing && typeof value === 'number') {
      displayValue = formatMoney(value)
    }
    if (isEditing) {
      return (
        <input
          key={key}
          autoFocus
          className={`cell-edit-input ${type === 'number' ? 'cell-edit-number' : 'cell-edit-name'} ${widthClass}`}
          type={type === 'number' ? 'text' : 'text'}
          defaultValue={value}
          onBlur={(e) => {
            const v = e.target.value
            if (field.startsWith('extracted.')) {
              updateExtractedField(row.id, field.replace('extracted.', ''), type === 'number' ? parseFloat(v) || 0 : v)
            } else {
              updateRowField(row.id, field, type === 'number' ? parseFloat(v) || 0 : v)
            }
            setEditingCell(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur()
            if (e.key === 'Escape') setEditingCell(null)
          }}
        />
      )
    }
    return (
      <span
        className={`editable-cell ${field === 'name' ? 'editable-name' : ''} ${widthClass}`}
        onClick={() => setEditingCell(key)}
        title="点击编辑"
      >
        {displayValue}
      </span>
    )
  }

  // ==================== 单物料模式：左侧 ====================
  function renderSingleInput() {
    return (
      <div className="bom-input-section">
        <div className="bom-input-group">
          <label className="bom-group-label"><span className="label-icon">🔵</span>材质分类</label>
          <div className="category-tabs">
            {materialCategories.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                style={{ '--cat-color': cat.color }}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setSelectedMaterialId(materials[cat.id][0]?.id || '')
                }}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span className="tab-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bom-input-group" ref={dropdownRef}>
          <label className="bom-group-label"><span className="label-icon">⚙️</span>选择材质</label>
          <div className="material-dropdown-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div>
              <div className="selected-material-name">{selectedMaterial ? selectedMaterial.name : '请选择'}</div>
              {selectedMaterial && (
                <div className="selected-material-price">{selectedMaterial.unitPrice} 元/kg · {selectedMaterial.density} g/cm³</div>
              )}
            </div>
            <span className="dropdown-arrow">▼</span>
          </div>
          {dropdownOpen && (
            <div className="material-dropdown-list" style={{ position: 'absolute', left: 0, right: 0 }}>
              {getMaterialsByCategory(activeCategory).map(m => (
                <div
                  key={m.id}
                  className={`material-option ${selectedMaterialId === m.id ? 'selected' : ''}`}
                  onClick={() => { setSelectedMaterialId(m.id); setDropdownOpen(false) }}
                >
                  <div className="option-main"><strong>{m.name}</strong><span className="option-cname">{m.nameCn}</span></div>
                  <div className="option-meta">
                    <span className="meta-price">{m.unitPrice} 元/kg</span>
                    <span className="meta-density">{m.density} g/cm³</span>
                    <span className="meta-waste">损耗 {Math.round(m.wasteRate * 100)}%</span>
                  </div>
                  <div className="option-features">{m.features.map(f => <span key={f} className="feature-tag-mini">{f}</span>)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bom-input-group">
          <label className="bom-group-label"><span className="label-icon">⚖️</span>净重</label>
          <div className="weight-input-row">
            <div className="weight-field-wrapper">
              <input type="text" className="bom-weight-input" value={weight} onChange={e => setWeight(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" />
            </div>
            <div className="unit-toggle-group">
              <button className={`unit-btn ${weightUnit === 'g' ? 'active' : ''}`} onClick={() => handleUnitSwitch('g')}>g</button>
              <button className={`unit-btn ${weightUnit === 'kg' ? 'active' : ''}`} onClick={() => handleUnitSwitch('kg')}>kg</button>
            </div>
          </div>
          {selectedMaterial && weight && (
            <div className="weight-convert-hint">
              <span className="hint-label">材料费：</span>
              <span className="hint-value">{formatMoney((parseFloat(weight) || 0) * (weightUnit === 'g' ? 1 : 1000) / 1000 * selectedMaterial.unitPrice)}</span>
            </div>
          )}
          <div className="quantity-row">
            <label>数量</label>
            <input type="text" className="bom-qty-input" value={quantitySingle} onChange={e => setQuantitySingle(e.target.value.replace(/[^0-9.]/g, ''))} />
            <span className="qty-unit">件</span>
          </div>
        </div>

        <div className="bom-input-group">
          <label className="bom-group-label"><span className="label-icon">🔧</span>主要工艺</label>
          <div className="process-select-wrapper">
            <select className="bom-process-select" value={processType} onChange={e => setProcessType(e.target.value)}>
              <option value="none">无 / 不计工艺费</option>
              <option value="injection">注塑</option>
              <option value="cnc">CNC加工</option>
              <option value="stamping">冲压</option>
              <option value="diecasting">压铸</option>
              <option value="anodize">阳极氧化</option>
              <option value="plating">电镀</option>
              <option value="silkscreen">丝印/移印</option>
              <option value="vulcanize">硫化成型</option>
            </select>
          </div>
          {processType !== 'none' && (
            <div className="process-custom-price-row">
              <span>工艺单价</span>
              <input type="text" className="bom-process-price-input" value={processCustomPrice} onChange={e => setProcessCustomPrice(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" />
              <span className="price-unit-hint">元/件</span>
            </div>
          )}
        </div>

        <div className="bom-input-group rate-settings">
          <label className="bom-group-label"><span className="label-icon">📊</span>费率设置</label>
          <div className="rate-inputs-grid">
            <div className="rate-item"><label>损耗率 {wasteRate}%</label><div className="rate-input-wrap"><input type="range" min="0" max="30" value={wasteRate} onChange={e => setWasteRate(parseInt(e.target.value))} /><span className="rate-value">{wasteRate}%</span></div></div>
            <div className="rate-item"><label>管理费 {managementRate}%</label><div className="rate-input-wrap"><input type="range" min="0" max="30" value={managementRate} onChange={e => setManagementRate(parseInt(e.target.value))} /><span className="rate-value">{managementRate}%</span></div></div>
            <div className="rate-item"><label>利润率 {profitRate}%</label><div className="rate-input-wrap"><input type="range" min="0" max="50" value={profitRate} onChange={e => setProfitRate(parseInt(e.target.value))} /><span className="rate-value">{profitRate}%</span></div></div>
          </div>
        </div>

        <div className="bom-action-buttons">
          <button className="btn-reset-bom" onClick={() => { setWeight(''); setProcessType('none'); setProcessCustomPrice(''); setQuantitySingle(1) }}>重置</button>
        </div>
      </div>
    )
  }

  function renderSingleResult() {
    if (!selectedMaterial || !singleCost) return (
      <div className="bom-result-section">
        <div className="empty-result-placeholder">
          <div className="placeholder-icon">🧮</div>
          <p>输入重量与数量，秒算物料成本</p>
          <p className="placeholder-sub">支持 g / kg 切换，可叠加工艺费</p>
        </div>
      </div>
    )
    const rows = [
      { icon: '🔵', label: '材料费', cls: 'row-material', amount: singleCost.materialCost, formula: `${selectedMaterial.unitPrice} 元/kg × ${formatNumber(singleCost.qty * (weightUnit === 'g' ? (parseFloat(weight) || 0) / 1000 : (parseFloat(weight) || 0)), 4)} kg` },
      { icon: '♻️', label: '损耗', cls: 'row-waste', amount: singleCost.wasteCost, formula: `材料费 × ${wasteRate}%` },
      { icon: '🔧', label: '工艺费', cls: 'row-processing', amount: singleCost.processCost, formula: processType === 'none' ? '未计' : `${processCustomPrice || 0} 元/件 × ${singleCost.qty}` },
      { icon: '📦', label: '小计', cls: 'row-package', amount: singleCost.subtotal, formula: '材料+损耗+工艺' },
      { icon: '⚙️', label: '管理费', cls: 'row-management', amount: singleCost.managementCost, formula: `小计 × ${managementRate}%` },
      { icon: '💰', label: '利润', cls: 'row-profit', amount: singleCost.profit, formula: `小计 × ${profitRate}%` }
    ]
    return (
      <div className="bom-result-section">
        <div className="cost-table-container">
          <h3 className="table-title"><span>📋</span>成本明细</h3>
          <table className="cost-table">
            <thead><tr><th>项目</th><th>计算公式</th><th className="amount-col">金额</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.label} className={r.cls}>
                  <td><span className="row-icon">{r.icon}</span>{r.label}</td>
                  <td className="formula-cell">{r.formula}</td>
                  <td className="amount-cell">{formatMoney(r.amount)}</td>
                </tr>
              ))}
              <tr className="row-subtotal"><td><span className="row-icon">💵</span>合计</td><td className="formula-cell">小计+管理费+利润</td><td className="amount-cell">{formatMoney(singleCost.total)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="grand-total-block">
          <span className="total-label">预估总成本</span>
          <div className="total-amount-display"><span className="total-big-number">{formatMoney(singleCost.total)}</span></div>
          <div className="total-meta-row">
            <div className="meta-card"><span className="meta-label">材质</span><span className="meta-value">{selectedMaterial.name}</span></div>
            <div className="meta-card"><span className="meta-label">单价</span><span className="meta-value">{selectedMaterial.unitPrice} 元/kg</span></div>
            <div className="meta-card"><span className="meta-label">数量</span><span className="meta-value">{singleCost.qty} 件</span></div>
          </div>
        </div>
        <div className="cost-breakdown-bar">
          {[{ v: singleCost.materialCost + singleCost.wasteCost, c: '#3b82f6', t: '材料' }, { v: singleCost.processCost, c: '#f59e0b', t: '工艺' }, { v: singleCost.managementCost, c: '#8b5cf6', t: '管理' }, { v: singleCost.profit, c: '#ec4899', t: '利润' }]
            .filter(s => s.v > 0)
            .map(s => (
              <div key={s.t} className="breakdown-segment" style={{ width: `${(s.v / singleCost.total) * 100}%`, background: s.c }} data-tooltip={`${s.t}: ${formatMoney(s.v)}`}></div>
            ))}
        </div>
      </div>
    )
  }

  // ==================== 导入模式 ====================
  function renderImportUpload() {
    return (
      <div className="bom-import-layout">
        <div className="bom-import-sidebar">
          <div className="bom-upload-area">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept={SUPPORTED_EXTENSIONS.join(',')} onChange={e => handleFileSelect(e.target.files[0])} />
            <div className={`upload-dropzone ${isParsing ? 'parsing' : ''}`} onClick={() => fileInputRef.current?.click()} onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]) }} onDragOver={e => e.preventDefault()}>
              {isParsing ? (
                <div className="upload-parsing-state"><div className="parsing-spinner"></div><div className="upload-title">正在解析文件...</div></div>
              ) : (
                <>
                  <div className="upload-icon">📤</div>
                  <div className="upload-title">点击或拖拽上传 BOM 文件</div>
                  <div className="upload-hint">支持 Excel / CSV 格式</div>
                  <div className="upload-formats">{SUPPORTED_EXTENSIONS.join(' ')}</div>
                  <div className="upload-size-limit">文件大小 ≤ {(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB，行数 ≤ {MAX_BOM_ROWS}</div>
                </>
              )}
            </div>
            {parseError && <div className="parse-error-box"><span className="error-icon">⚠️</span>{parseError}</div>}
            <div className="bom-import-guide">
              <h4>📋 导入说明</h4>
              <ul>
                <li>只需识别 4 个字段：物料编码、物料名称、数量、物料描述</li>
                <li>系统会从“物料描述”自动提取材质、规格、工艺、颜色等</li>
                <li>提取结果支持手动修改；修改描述后会重新提取未手动改过的字段</li>
                <li>支持 .xlsx / .xls / .csv，兼容表头不在第一行</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="bom-import-main">
          <div className="import-empty-state">
            <div className="import-empty-icon">📊</div>
            <p>上传 BOM 文件后自动生成预览与成本预估</p>
            <p className="import-empty-sub">请先选择左侧文件</p>
          </div>
        </div>
      </div>
    )
  }

  function renderImportPreview() {
    const headers = rawRows[headerRowIndex]?.map(h => String(h || '').trim()) || []
    return (
      <div className="bom-import-layout">
        <div className="bom-import-sidebar">
          <div className="bom-import-config">
            <div className="config-file-info">
              <span className="file-icon">📄</span>
              <span className="file-name">{parsedFile?.name}</span>
              <span className="file-rows">{importRows.length} 行</span>
              <button className="btn-reselect" onClick={resetImport} title="重新选择">×</button>
            </div>

            <div className="field-mapping-display">
              <h5>自动识别字段</h5>
              <div className="mapping-tags">
                {Object.keys(FIELD_ALIASES).map(field => {
                  const col = fieldMapping[field]
                  const label = { code: '物料编码', name: '物料名称', quantity: '数量', description: '物料描述' }[field]
                  return col >= 0 ? (
                    <span key={field} className="mapping-tag">
                      <span className="mapping-field">{label}</span>
                      <span className="mapping-arrow">→</span>
                      <span className="mapping-col">{headers[col] || `列${col + 1}`}</span>
                    </span>
                  ) : (
                    <span key={field} className="mapping-tag" style={{ opacity: 0.5 }}>
                      <span className="mapping-field">{label}</span>
                      <span className="mapping-arrow">→</span>
                      <span className="mapping-col">未识别</span>
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="manual-mapping-section">
              <div className="manual-mapping-header" onClick={() => setManualMappingOpen(!manualMappingOpen)}>
                <h5>⚙️ 手动调整表头与映射</h5>
                <span className={`mapping-toggle-icon ${manualMappingOpen ? 'open' : ''}`}>▶</span>
              </div>
              {manualMappingOpen && (
                <div className="manual-mapping-body">
                  <p className="mapping-hint">若自动识别不准确，可手动指定表头行与字段列。</p>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, color: '#94a3b8', marginRight: 8 }}>表头行</label>
                    <select className="mapping-select" value={headerRowIndex} onChange={e => handleHeaderRowChange(e.target.value)}>
                      {rawRows.slice(0, 10).map((_, i) => (
                        <option key={i} value={i}>第 {i + 1} 行</option>
                      ))}
                    </select>
                  </div>
                  <table className="mapping-config-table">
                    <thead><tr><th>目标字段</th><th>对应列</th></tr></thead>
                    <tbody>
                      {[
                        { key: 'code', label: '物料编码' },
                        { key: 'name', label: '物料名称' },
                        { key: 'quantity', label: '数量' },
                        { key: 'description', label: '物料描述' }
                      ].map(({ key, label }) => (
                        <tr key={key}>
                          <td className="mct-field">{label}{key !== 'description' && <span className="required-star">*</span>}</td>
                          <td className="mct-select">
                            <select className="mapping-select" value={fieldMapping[key] ?? ''} onChange={e => handleManualMappingChange(key, e.target.value)}>
                              <option value="">-- 不映射 --</option>
                              {headers.map((h, i) => (
                                <option key={i} value={i}>{h || `列${i + 1}`}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="import-rate-settings">
              <h5>费率设置</h5>
              <div className="import-rate-row"><label>损耗</label><input className="import-rate-input" value={importRates.waste} onChange={e => setImportRates({ ...importRates, waste: e.target.value.replace(/[^0-9.]/g, '') })} /><span>%</span></div>
              <div className="import-rate-row"><label>管理</label><input className="import-rate-input" value={importRates.management} onChange={e => setImportRates({ ...importRates, management: e.target.value.replace(/[^0-9.]/g, '') })} /><span>%</span></div>
              <div className="import-rate-row"><label>利润</label><input className="import-rate-input" value={importRates.profit} onChange={e => setImportRates({ ...importRates, profit: e.target.value.replace(/[^0-9.]/g, '') })} /><span>%</span></div>
            </div>

            <div className="import-actions">
              <button className="btn-generate-report" onClick={generateReport} disabled={importRows.length === 0}>
                生成成本预估报告
              </button>
            </div>
          </div>
        </div>

        <div className="bom-import-main">
          {importRows.length === 0 ? (
            <div className="import-empty-state">
              <div className="import-empty-icon">📝</div>
              <p>未解析到有效数据行</p>
              <p className="import-empty-sub">请检查表头映射是否正确</p>
            </div>
          ) : (
            <div className="bom-preview-section">
              <div className="preview-header">
                <h3><span>📋</span>导入预览与编辑</h3>
                <span className="preview-count">共 {importRows.length} 行</span>
              </div>

              {/* 顶部汇总 Hero 横幅：所有物料成本之和（实时联动） */}
              <div className="bom-total-hero">
                <div className="bth-main">
                  <div className="bth-label">
                    <span className="bth-icon">💰</span>
                    所有物料成本之和
                    <span className="bth-info-tip" tabIndex={0} data-tip-cn={`所有物料成本之和 = BOM 中所有"行成本"的总和（不含任何费率附加）。

公式：所有物料成本之和 = Σ 各行成本（即 BOM 中每行最终录入的行成本累加）

与底部"全部成本和"区别：
  • 所有物料成本之和 → 纯材料费基础（不含损耗/管理费/利润）
  • 全部成本和 → 材料费 + 损耗 + 管理费 + 利润（含三层费率）

当前数据：
  • 共 ${importRows.length} 行
  • ${importSummary.withCost} 行有成本数据（手动改 ${importSummary.manualCount} 行）
  • 含损耗/管理费/利润后『全部成本和』= ${formatMoney(importSummary.grandTotal)}`}>
                      ⓘ
                    </span>
                  </div>
                  <div className="bth-value">{formatMoney(importSummary.total)}</div>
                  <div className="bth-sub">
                    {importSummary.withCost}/{importRows.length} 行有成本数据
                    {importSummary.manualCount > 0 && (
                      <span className="bth-manual-hint"> · <span className="bth-manual-mark">✎</span> {importSummary.manualCount} 行手动改</span>
                    )}
                  </div>
                </div>
                <div className="bth-divider"></div>
                <div className="bth-breakdown">
                  <div className="bth-bd-head">应用费率后</div>
                  <div className="bth-bd-grid">
                    <div className="bth-bd-item">
                      <span className="bth-bd-label">损耗 {importSummary.wasteRate}%</span>
                      <span className="bth-bd-value warning">{formatMoney(importSummary.wasteSum)}</span>
                    </div>
                    <div className="bth-bd-item">
                      <span className="bth-bd-label">管理费 {importSummary.managementRate}%</span>
                      <span className="bth-bd-value">{formatMoney(importSummary.managementSum)}</span>
                    </div>
                    <div className="bth-bd-item">
                      <span className="bth-bd-label">利润 {importSummary.profitRate}%</span>
                      <span className="bth-bd-value matched">{formatMoney(importSummary.profitSum)}</span>
                    </div>
                    <div className="bth-bd-item bth-bd-grand">
                      <span className="bth-bd-label">全部成本和</span>
                      <span className="bth-bd-value grand">{formatMoney(importSummary.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="preview-table-wrapper">
                <table className="bom-preview-table">
                  <thead>
                    <tr>
                      <th className="col-num">#</th>
                      <th className="col-code">物料编码</th>
                      <th className="col-name">物料名称</th>
                      <th className="col-qty">数量</th>
                      <th className="col-desc">物料描述</th>
                      <th className="col-material">材质</th>
                      <th className="col-spec">规格</th>
                      <th className="col-process">工艺</th>
                      <th className="col-color">颜色</th>
                      <th className="col-cost">行成本</th>
                      <th className="col-action"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="col-num">{idx + 1}</td>
                        <td className="col-code">{renderEditableCell(row, 'code', row.code)}</td>
                        <td className="col-name">{renderEditableCell(row, 'name', row.name)}</td>
                        <td className="col-qty">{renderEditableCell(row, 'quantity', row.quantityStr || String(row.quantity), 'number')}</td>
                        <td className="col-desc" title={row.description}>{renderEditableCell(row, 'description', row.description)}</td>
                        <td className="col-material">{renderEditableCell(row, 'extracted.material', row.extracted?.material || '')}</td>
                        <td className="col-spec" title={(row.extracted?.specs || []).join('、')}>{renderEditableCell(row, 'extracted.specs', (row.extracted?.specs || []).join('、'))}</td>
                        <td className="col-process" title={(row.extracted?.processes || []).join('、')}>{renderEditableCell(row, 'extracted.processes', (row.extracted?.processes || []).join('、'))}</td>
                        <td className="col-color">{renderEditableCell(row, 'extracted.colors', (row.extracted?.colors || []).join('、'))}</td>
                        <td className={`col-cost ${row.lineCost > 0 ? 'has-cost' : 'zero-cost'} ${row.manualCost ? 'manual-cost' : ''}`}>
                          {renderEditableCell(row, 'lineCost', row.lineCost, 'number', 'cost-edit-input')}
                        </td>
                        <td className="col-action"><button className="btn-delete-row" onClick={() => deleteRow(row.id)}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="preview-summary-bar">
                <div className="summary-stat">
                  <span className="stat-label">总行数</span>
                  <span className="stat-value">{importSummary.count}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">识别材质</span>
                  <span className="stat-value matched">{importSummary.matched}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">可估算成本</span>
                  <span className="stat-value warning">{importSummary.withCost}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">材料费小计</span>
                  <span className="stat-value">{formatMoney(importSummary.total)}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">损耗 ({importSummary.wasteRate}%)</span>
                  <span className="stat-value warning">{formatMoney(importSummary.wasteSum)}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">管理费 ({importSummary.managementRate}%)</span>
                  <span className="stat-value">{formatMoney(importSummary.managementSum)}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">利润 ({importSummary.profitRate}%)</span>
                  <span className="stat-value matched">{formatMoney(importSummary.profitSum)}</span>
                </div>
                <div className="summary-stat summary-stat-grand">
                  <span className="stat-label stat-label-with-tip">
                    全部成本和
                    <span
                      className="stat-info-tip"
                      tabIndex={0}
                      role="tooltip"
                      aria-label="全部成本和说明"
                      data-tip-cn={`全部成本和 = BOM 中所有物料最终估算成本的总和（含材料费、损耗、管理费、利润）。

计算公式：
  小计 = 材料费合计 × (1 + 损耗率)
  全部成本和 = 小计 + 管理费 + 利润
  其中：管理费 = 小计 × 管理费率；利润 = 小计 × 利润率

与其他字段关系：
  • 材料费小计 → 全部成本和的基础
  • 损耗率 / 管理费率 / 利润率 → 在材料费基础上累加
  • 当前应用费率：损耗 ${importSummary.wasteRate}% + 管理 ${importSummary.managementRate}% + 利润 ${importSummary.profitRate}%

分解示例：
  材料费 ${formatMoney(importSummary.total)} + 损耗 ${formatMoney(importSummary.wasteSum)} + 管理 ${formatMoney(importSummary.managementSum)} + 利润 ${formatMoney(importSummary.profitSum)} = 全部成本和 ${formatMoney(importSummary.grandTotal)}`}
                      data-tip-en={`Grand Total = the sum of all material final estimated costs in the BOM (material + waste + management + profit).

Formula:
  Subtotal = Material × (1 + Waste Rate)
  Grand Total = Subtotal + Management + Profit
  where: Management = Subtotal × Management Rate; Profit = Subtotal × Profit Rate

Relationship with other fields:
  • Material Subtotal → base of Grand Total
  • Waste / Management / Profit Rates → added on top of Material
  • Current rates: W ${importSummary.wasteRate}% + M ${importSummary.managementRate}% + P ${importSummary.profitRate}%

Breakdown:
  Material ${formatMoney(importSummary.total)} + Waste ${formatMoney(importSummary.wasteSum)} + Management ${formatMoney(importSummary.managementSum)} + Profit ${formatMoney(importSummary.profitSum)} = Grand Total ${formatMoney(importSummary.grandTotal)}`}
                    >ⓘ</span>
                  </span>
                  <span className="stat-value grand">{formatMoney(importSummary.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderImportReport() {
    const totalMaterial = importSummary.total
    const totalWaste = totalMaterial * (parseFloat(importRates.waste) || 0) / 100
    const subtotal = totalMaterial + totalWaste
    const totalManagement = subtotal * (parseFloat(importRates.management) || 0) / 100
    const totalProfit = subtotal * (parseFloat(importRates.profit) || 0) / 100
    const grandTotal = subtotal + totalManagement + totalProfit

    const categoryMap = {}
    importRows.forEach(r => {
      const cat = r.extracted?.materialCategory || '未识别'
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, cost: 0 }
      categoryMap[cat].count += 1
      categoryMap[cat].cost += r.lineCost || 0
    })
    const categories = Object.entries(categoryMap).sort((a, b) => b[1].cost - a[1].cost)

    return (
      <div className="bom-import-layout">
        <div className="bom-import-sidebar">
          <div className="bom-import-config">
            <div className="config-file-info">
              <span className="file-icon">📊</span>
              <span className="file-name">成本预估报告</span>
              <span className="file-rows">{importRows.length} 行</span>
            </div>
            <div className="import-actions">
              <button className="btn-generate-report" style={{ background: 'rgba(148,163,184,0.15)' }} onClick={() => setImportStep('preview')}>
                ← 返回预览
              </button>
            </div>
          </div>
        </div>
        <div className="bom-import-main">
          <div className="cost-report-section">
            <div className="report-header">
              <h3><span>📈</span>BOM 成本预估报告</h3>
              <span className="report-time">生成时间：{new Date().toLocaleString('zh-CN')}</span>
            </div>

            <div className="report-overview-cards">
              <div className="overview-card grand-total-card">
                <span className="overview-label">预估总成本</span>
                <span className="overview-big-value">{formatMoney(grandTotal)}</span>
              </div>
              <div className="overview-card"><span className="overview-label">材料费</span><span className="overview-value">{formatMoney(totalMaterial)}</span></div>
              <div className="overview-card"><span className="overview-label">损耗</span><span className="overview-value">{formatMoney(totalWaste)}</span></div>
              <div className="overview-card"><span className="overview-label">管理费</span><span className="overview-value">{formatMoney(totalManagement)}</span></div>
            </div>

            <div className="report-detail-table-wrap">
              <h4>明细表</h4>
              <div className="preview-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>物料编码</th>
                      <th>物料名称</th>
                      <th>数量</th>
                      <th>材质</th>
                      <th>规格/工艺</th>
                      <th>行成本</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((r, i) => (
                      <tr key={r.id}>
                        <td>{i + 1}</td>
                        <td>{r.code || '-'}</td>
                        <td className="report-name-cell" title={r.name}>{r.name || '-'}</td>
                        <td className="num-cell">{formatNumber(r.quantity)}</td>
                        <td>{r.extracted?.material || '-'}</td>
                        <td title={[...(r.extracted?.specs || []), ...(r.extracted?.processes || [])].join('、')}>
                          {[...(r.extracted?.specs || []), ...(r.extracted?.processes || [])].slice(0, 3).join('、') || '-'}
                        </td>
                        <td className="money-cell">{formatMoney(r.lineCost)}</td>
                      </tr>
                    ))}
                    <tr className="report-footer-row">
                      <td colSpan="6">合计</td>
                      <td className="money-cell subtotal-cell">{formatMoney(totalMaterial)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="report-category-breakdown">
                <h4>分类占比</h4>
                <div className="category-bars">
                  {categories.map(([cat, info]) => (
                    <div key={cat} className="category-bar-item">
                      <div className="cat-bar-info"><span className="cat-bar-name">{cat}</span><span className="cat-bar-count">{info.count} 项</span></div>
                      <div className="cat-bar-track"><div className="cat-bar-fill" style={{ width: `${totalMaterial > 0 ? (info.cost / totalMaterial) * 100 : 0}%` }}></div></div>
                      <div className="cat-bar-values"><span>{formatMoney(info.cost)}</span><span className="cat-bar-pct">{totalMaterial > 0 ? ((info.cost / totalMaterial) * 100).toFixed(1) : 0}%</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="report-final-summary">
              <table className="final-summary-table">
                <tbody>
                  <tr><td>材料费合计</td><td className="fs-money">{formatMoney(totalMaterial)}</td></tr>
                  <tr><td>损耗（{importRates.waste}%）</td><td className="fs-money">{formatMoney(totalWaste)}</td></tr>
                  <tr><td>管理费（{importRates.management}%）</td><td className="fs-money">{formatMoney(totalManagement)}</td></tr>
                  <tr><td>利润（{importRates.profit}%）</td><td className="fs-money">{formatMoney(totalProfit)}</td></tr>
                  <tr className="fs-grand-total"><td>预估总成本</td><td className="fs-money fs-grand-value">{formatMoney(grandTotal)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== 主渲染 ====================
  return (
    <div className="bom-panel-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bom-panel-container">
        <div className="bom-panel-header">
          <div className="bom-header-left">
            <span className="bom-header-icon">🧮</span>
            <div>
              <h2 className="bom-panel-title">BOM 成本秒算</h2>
              <p className="bom-panel-subtitle">单物料估算 · BOM 导入 · 成本预估</p>
            </div>
          </div>
          <div className="mode-switch-group">
            <button className={`mode-btn ${mode === 'single' ? 'active' : ''}`} onClick={() => setMode('single')}>单物料</button>
            <button className={`mode-btn ${mode === 'import' ? 'active' : ''}`} onClick={() => setMode('import')}>BOM导入</button>
          </div>
          <button className="bom-close-btn" onClick={onClose}>×</button>
        </div>

        <div className={`bom-panel-body ${mode === 'import' ? 'import-mode' : ''}`}>
          {mode === 'single' ? (
            <>
              {renderSingleInput()}
              {renderSingleResult()}
            </>
          ) : importStep === 'upload' ? (
            renderImportUpload()
          ) : importStep === 'preview' ? (
            renderImportPreview()
          ) : (
            renderImportReport()
          )}
        </div>

        <div className="bom-panel-footer">
          <span className="footer-note">* 成本估算仅供参考，实际采购价格以供应商报价为准</span>
        </div>
      </div>
    </div>
  )
}
