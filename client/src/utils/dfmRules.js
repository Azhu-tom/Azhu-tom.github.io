/**
 * DFM 规则配置中心（v2.6 插件化规则系统）
 *
 * 设计目标：
 * - 集中管理 DFM 特征识别规则 + 缺陷补救规则
 * - 支持通过 registerXxxRule() 动态注册自定义规则（无需改核心代码）
 * - 模具工程师可扩展"什么特征 → 什么风险 → 如何补救"
 */

// ==================== 特征关键词规则 ====================
// 每条规则：{ keyword, label, weight(风险权重 -1~1), risk(关联风险类型) }
const defaultFeatureRules = [
  { keyword: 'thin',        label: '薄壁',   weight: 0.8, risk: 'shrink_warp' },
  { keyword: 'rib',         label: '骨位',   weight: 0.7, risk: 'warp' },
  { keyword: 'boss',        label: '凸台',   weight: 0.4, risk: 'sink' },
  { keyword: 'undercut',    label: '倒扣',   weight: 0.9, risk: 'eject' },
  { keyword: 'hole',        label: '孔系',   weight: 0.3, risk: 'core_shift' },
  { keyword: 'hollow',      label: '空腔',   weight: 0.5, risk: 'flow' },
  { keyword: 'boss_in',     label: '内凸台', weight: 0.6, risk: 'sink' },
  { keyword: 'rib_cross',   label: '交叉骨', weight: 0.7, risk: 'weld' },
  { keyword: 'sharp',       label: '尖角',   weight: 0.5, risk: 'stress' },
  { keyword: 'fillet',      label: '圆角',   weight: -0.4, risk: null },  // 圆角是好特征
  { keyword: 'draft',       label: '拔模角', weight: -0.3, risk: null },
  { keyword: 'boss_thin',   label: '凸台薄', weight: 0.8, risk: 'sink' },
  { keyword: 'boss_height', label: '高凸台', weight: 0.7, risk: 'sink' },
  { keyword: 'long_core',   label: '长型芯', weight: 0.6, risk: 'core_shift' },
  { keyword: 'boss_h',      label: '高骨位', weight: 0.7, risk: 'sink' },
  { keyword: 'boss_w',      label: '宽骨位', weight: 0.5, risk: 'weld' },
]

// ==================== 缺陷补救规则 ====================
// key: 风险类型，value: 补救建议文案
const defaultRemedyRules = {
  shrink_warp: '减薄区域壁厚均匀化，控制在 1.5-3mm 之间；增加冷却水路',
  warp: '骨位深度控制在壁厚 0.6 倍以内；增加反向冷却',
  sink: '凸台/骨位根部加 R 角 ≥ R0.5；降低局部壁厚',
  eject: '增加斜顶/滑块机构；考虑油缸抽芯方案',
  flow: '合理布置浇口位置；增加排气槽',
  stress: '尖角处加 R 角 ≥ R0.3；CAE 应力分析',
  core_shift: '增加型芯支撑；考虑镶嵌结构',
  weld: '调整浇口位置远离熔接区域；提高模温',
}

// ==================== 缺陷标题规则 ====================
// key: 特征 keyword，value: { title, desc }
const defaultDefectTitleRules = {
  thin:         { title: '薄壁风险', desc: '文件含' },
  rib:          { title: '骨位风险', desc: '检测到骨位结构' },
  boss:         { title: '凸台缩痕', desc: '壁厚突变' },
  undercut:     { title: '倒扣特征', desc: '需要特殊脱模机构' },
  hole:         { title: '孔系偏心', desc: '多孔结构' },
  hollow:       { title: '空腔填充', desc: '空腔结构' },
  boss_in:      { title: '内凸台缩痕', desc: '背面可见凸台' },
  rib_cross:    { title: '交叉骨位', desc: '多骨位交叉' },
  sharp:        { title: '尖角应力', desc: '尖角位置' },
  boss_thin:    { title: '薄壁凸台', desc: '凸台根部过薄' },
  boss_height:  { title: '高凸台', desc: '凸台过高' },
  long_core:    { title: '长型芯', desc: '长型芯容易偏心' },
  boss_h:       { title: '高骨位', desc: '骨位偏高' },
  boss_w:       { title: '宽骨位', desc: '骨位偏宽' },
}

// ==================== 规则注册表（运行时可变） ====================
let featureRules = [...defaultFeatureRules]
let remedyRules = { ...defaultRemedyRules }
let defectTitleRules = { ...defaultDefectTitleRules }

/**
 * 注册自定义特征规则
 * @param {object} rule { keyword, label, weight, risk }
 */
export function registerFeatureRule(rule) {
  if (!rule || !rule.keyword) {
    console.warn('[DFM规则] 注册失败：规则缺少 keyword 字段')
    return
  }
  const idx = featureRules.findIndex(r => r.keyword === rule.keyword)
  if (idx >= 0) featureRules[idx] = { ...featureRules[idx], ...rule }
  else featureRules.push(rule)
}

/**
 * 注册自定义缺陷补救规则
 * @param {string} riskType 风险类型
 * @param {string} remedy 补救建议
 */
export function registerRemedyRule(riskType, remedy) {
  remedyRules[riskType] = remedy
}

/**
 * 注册自定义缺陷标题规则
 * @param {string} keyword 特征关键词
 * @param {object} titleRule { title, desc }
 */
export function registerDefectTitleRule(keyword, titleRule) {
  defectTitleRules[keyword] = titleRule
}

/**
 * 重置为默认规则
 */
export function resetRules() {
  featureRules = [...defaultFeatureRules]
  remedyRules = { ...defaultRemedyRules }
  defectTitleRules = { ...defaultDefectTitleRules }
}

// 导出当前规则（供解析器读取）
export function getFeatureRules() { return featureRules }
export function getRemedyRules() { return remedyRules }
export function getDefectTitleRules() { return defectTitleRules }
