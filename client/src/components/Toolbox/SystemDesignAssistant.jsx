import React, { useState, useRef, useEffect, useMemo } from 'react'
import './SystemDesignAssistant.css'

/**
 * 系统设计助手 v1
 * 多步推理：
 *   1. 意图识别（设计/选型/排查/查询）
 *   2. 参数提取（通量/安装/加热/水质/过滤技术）
 *   3. 澄清追问（关键参数缺失时主动询问）
 *   4. 方案生成（架构/组件/性能/接口/功耗/散热）
 *
 * 基于净水机知识库（复用 waterApplianceData 的设计规范）做规则匹配。
 */

// ========== 规则引擎 ==========

// 通量档位
const FLUX_TIERS = [
  { code: '75G',   gpd: 75,   power: 30,  pump: '24V 隔膜泵',     pressure: '0.4MPa' },
  { code: '200G',  gpd: 200,  power: 60,  pump: '24V 隔膜泵',     pressure: '0.5MPa' },
  { code: '400G',  gpd: 400,  power: 80,  pump: '24V 隔膜泵',     pressure: '0.6MPa' },
  { code: '600G',  gpd: 600,  power: 100, pump: '24V 隔膜泵',     pressure: '0.65MPa' },
  { code: '800G',  gpd: 800,  power: 120, pump: '36V 隔膜泵',     pressure: '0.7MPa' },
  { code: '1000G', gpd: 1000, power: 150, pump: '36V 隔膜泵',     pressure: '0.8MPa' }
]

const FILTRATION_TECH = {
  RO: { name: 'RO反渗透', purity: 'TDS去除率≥95%', wastewaterRatio: '1:1 ~ 2:1' },
  UF: { name: 'UF超滤', purity: '保留矿物质', wastewaterRatio: '无废水' },
  NF: { name: 'NF纳滤', purity: '选择性脱盐', wastewaterRatio: '1:1 ~ 1.5:1' },
  Composite: { name: '复合过滤', purity: '多种技术结合', wastewaterRatio: '依技术组合' }
}

const INSTALL_TYPES = {
  '厨下': { size: '标准型', width: '180~350mm', height: '380~520mm' },
  '壁挂': { size: '紧凑型', width: '140~240mm', height: '300~420mm' },
  '台式': { size: '迷你型', width: '≤200mm', height: '≤380mm' },
  '立式': { size: '大通量型', width: '≥350mm', height: '≥520mm' }
}

const DEFAULT_FILTER_CHAIN = ['PP棉', '前置活性炭', 'RO反渗透膜', '后置活性炭']

/** 意图识别 */
function detectIntent(text) {
  const t = text || ''
  if (/(帮我设计|设计一个|设计方案|帮我做|搭一套|搞一套|加一个|加上|加|增加|改成|改为|升级|换成|需要带|带个)/.test(t)) return 'design'
  if (/(选什么|选型|怎么选|用什么|推荐)/.test(t)) return 'select'
  if (/(为什么|不工作|故障|漏水|报警|出问题|问题)/.test(t)) return 'troubleshoot'
  return 'unknown'
}

/** 提取参数 */
function extractParams(text, prior = {}) {
  const t = text || ''
  const params = { ...prior }
  // 通量
  if (!params.flux) {
    const m = t.match(/(\d{2,4})\s*G(?:PD|加仑)?/i) || t.match(/(\d{2,4})\s*加仑/)
    if (m) {
      const g = parseInt(m[1], 10)
      const tier = FLUX_TIERS.find(f => f.code === `${g}G`) || FLUX_TIERS[Math.min(FLUX_TIERS.length - 1, Math.floor(g / 100))]
      if (tier) params.flux = tier.code
    }
  }
  // 过滤技术
  if (!params.tech) {
    if (/RO|反渗透/.test(t)) params.tech = 'RO'
    else if (/UF|超滤/.test(t)) params.tech = 'UF'
    else if (/纳滤|NF/.test(t)) params.tech = 'NF'
    else if (/(复合|组合|双出水)/.test(t)) params.tech = 'Composite'
  }
  // 安装方式
  if (!params.install) {
    if (/厨下/.test(t)) params.install = '厨下'
    else if (/壁挂/.test(t)) params.install = '壁挂'
    else if (/台式|台净/.test(t)) params.install = '台式'
    else if (/立式/.test(t)) params.install = '立式'
  }
  // 加热/制冷
  if (params.heating == null) {
    if (/(加热|热饮|热水|即热|速热)/.test(t)) params.heating = true
    else if (/(不加热|无加热|不热|仅常温|常温|纯常温|不需要加热|不烧水)/.test(t)) params.heating = false
  }
  if (params.cooling == null) {
    if (/(制冷|冷饮|冷水|冰水|电子制冷|压缩机)/.test(t)) params.cooling = true
    else if (/(不制冷|无制冷|仅常温|常温|纯常温|不需要制冷)/.test(t)) params.cooling = false
  }
  // 应用场景
  if (!params.scene) {
    if (/家用|家庭/.test(t)) params.scene = '家用'
    else if (/商用|办公室|公司|工厂/.test(t)) params.scene = '商用'
  }
  // 水质
  if (!params.waterTDS) {
    const m = t.match(/TDS\s*[:：]?\s*(\d{2,4})/) || t.match(/水质\s*(\d{2,4})/)
    if (m) params.waterTDS = parseInt(m[1], 10)
  }
  // 增量功能：UV 杀菌、加热、制冷、智能屏等
  if (/(UV|紫外|杀菌|消毒)/.test(t)) {
    params.uvSterilize = true
    if (/(不要|取消|去掉).*?(UV|紫外|杀菌|消毒)/.test(t)) params.uvSterilize = false
  }
  if (/(智能屏|触控屏|显示屏|TFT|LCD)/.test(t)) {
    params.smartScreen = true
    if (/(不要|取消|去掉).*?(智能屏|触控屏|显示屏|TFT|LCD)/.test(t)) params.smartScreen = false
  }
  if (/(Wifi|无线|手机|远程|IoT|物联网)/.test(t)) {
    params.wifi = true
  }
  if (/(预过滤|前置过滤)/.test(t)) params.preFilter = true
  return params
}

/** 判断哪些关键参数缺失 */
function findMissing(params) {
  const missing = []
  if (!params.flux) missing.push('flux')
  if (!params.install) missing.push('install')
  if (params.heating == null) missing.push('heating')
  return missing
}

const CLARIFICATION_QUESTIONS = {
  flux: {
    text: '请确认目标通量规格：',
    options: ['75G', '200G', '400G', '600G', '800G', '1000G', '暂未确定，需要推荐']
  },
  install: {
    text: '请确认安装方式：',
    options: ['厨下式', '壁挂式', '台式', '立式（落地）']
  },
  heating: {
    text: '是否需要加热/制冷功能？',
    options: ['仅常温', '需要加热（即热式）', '需要加热+制冷', '需配合管线机加热']
  }
}

/** 生成完整方案 */
function buildPlan(params) {
  const tier = FLUX_TIERS.find(f => f.code === params.flux) || FLUX_TIERS[1]
  const tech = FILTRATION_TECH[params.tech || 'RO']
  const install = INSTALL_TYPES[params.install || '厨下']

  // 滤芯组合
  let filterChain = []
  const techCode = params.tech || 'RO'
  if (techCode === 'RO') {
    filterChain = [
      { stage: 1, name: 'PP棉滤芯', spec: '5μm 熔喷', life: '3~6个月', function: '拦截泥沙铁锈' },
      { stage: 2, name: '前置活性炭', spec: 'CTO压缩炭', life: '6~12个月', function: '吸附余氯/异味' },
      { stage: 3, name: 'RO反渗透膜', spec: `${tier.code} 卷式复合膜`, life: '18~36个月', function: '去除重金属/细菌/病毒' },
      { stage: 4, name: '后置活性炭(T33)', spec: '颗粒活性炭', life: '12个月', function: '改善口感' }
    ]
    if (params.uvSterilize) {
      filterChain.push({ stage: 5, name: 'UV 紫外线杀菌器', spec: '254nm · 6~16W · 流量匹配', life: '8000~12000h', function: '二次杀菌，抑制微生物' })
    }
  } else if (techCode === 'UF') {
    filterChain = [
      { stage: 1, name: 'PP棉滤芯', spec: '5μm', life: '3~6个月', function: '拦截泥沙' },
      { stage: 2, name: '中空纤维超滤膜', spec: '0.01μm', life: '12~24个月', function: '去除细菌/胶体' },
      { stage: 3, name: '后置活性炭', spec: '颗粒活性炭', life: '12个月', function: '改善口感' }
    ]
    if (params.uvSterilize) filterChain.push({ stage: 4, name: 'UV 紫外线杀菌器', spec: '254nm', life: '8000~12000h', function: '二次杀菌' })
  } else if (techCode === 'NF') {
    filterChain = [
      { stage: 1, name: 'PP棉滤芯', spec: '5μm', life: '3~6个月', function: '拦截颗粒' },
      { stage: 2, name: '前置活性炭', spec: 'CTO压缩炭', life: '6~12个月', function: '吸附余氯' },
      { stage: 3, name: 'NF纳滤膜', spec: `${tier.code} 纳滤膜`, life: '18~30个月', function: '选择性脱盐' },
      { stage: 4, name: '后置活性炭', spec: '颗粒活性炭', life: '12个月', function: '改善口感' }
    ]
  } else {
    filterChain = [
      { stage: 1, name: 'PP棉滤芯', spec: '5μm', life: '3~6个月', function: '拦截颗粒' },
      { stage: 2, name: '前置活性炭', spec: 'CTO压缩炭', life: '6~12个月', function: '吸附余氯' },
      { stage: 3, name: 'UF超滤膜 + RO反渗透膜', spec: `${tier.code} 复合`, life: '18~30个月', function: '复合过滤' },
      { stage: 4, name: '后置活性炭', spec: '颗粒活性炭', life: '12个月', function: '改善口感' }
    ]
    if (params.uvSterilize) filterChain.push({ stage: 5, name: 'UV 紫外线杀菌器', spec: '254nm', life: '8000~12000h', function: '二次杀菌' })
  }

  // 关键组件
  const components = [
    { name: '增压泵', spec: `${tier.pump} · ${tier.power}W`, reason: '为RO膜提供稳定工作压力' },
    { name: '高压开关', spec: '0.3~0.35MPa 触发停泵', reason: '满桶自停保护' },
    { name: '低压开关', spec: '≤0.05MPa 触发停机', reason: '缺水/低压保护RO膜' },
    { name: '进水电磁阀', spec: 'DC24V ≤4W', reason: '断电自动关闭水源' },
    { name: '控制板 (PCB)', spec: '主控 MCU + 显示驱动 + 漏水检测联动', reason: '系统逻辑控制' },
    { name: '漏水检测探头', spec: '电极式 / 光电式', reason: '联动电磁阀关断' },
    { name: '变压器', spec: '24V/36V 输出 · 整机功率×1.5 倍冗余', reason: '电源隔离安全' },
    { name: '压力桶', spec: params.flux === '75G' || params.flux === '200G' ? '3.2G 食品级 PE' : '无桶设计（≥400G 大通量）', reason: '缓冲储水' }
  ]
  if (params.heating) components.push({ name: '即热模块', spec: '稀土厚膜 / 304 不锈钢管 · 2200~3300W', reason: '即开即热' })
  if (params.cooling) components.push({ name: '制冷模块', spec: '电子制冷片 / 压缩机制冷（5~10℃）', reason: '冷水输出' })
  if (params.uvSterilize) components.push({ name: 'UV 灯组件', spec: '254nm 紫外线灯管 + 镇流器', reason: '抑制出水端微生物' })
  if (params.smartScreen) components.push({ name: '智能触控屏', spec: 'TFT 4.3寸 + 电容触摸 · 滤芯寿命显示', reason: '人机交互' })
  if (params.wifi) components.push({ name: 'WiFi 模组', spec: '2.4GHz · 远程监控滤芯寿命与水质', reason: '智能联网' })

  // 接口
  const interfaces = [
    { name: '进水口', spec: '2分(1/4")快插 · 食品级尼龙' },
    { name: '浓水口', spec: '2分(1/4")快插 · 连续排放' },
    { name: '纯水口', spec: '3分(3/8")或4分(1/2")快插' },
    { name: '电源接口', spec: '两孔八字尾(C7) · 250V 2.5A' },
    { name: '显示接口', spec: 'I2C / SPI 数码屏 / LED 指示' }
  ]

  // 性能指标
  const performance = [
    { name: '额定通量', value: `${tier.code}（≈${(tier.gpd * 3.785).toFixed(0)}L/d）` },
    { name: '出水速度', value: `${(tier.gpd * 3.785 / 1440).toFixed(2)} L/min` },
    { name: '废水比', value: tech.wastewaterRatio },
    { name: '净水水质', value: tech.purity },
    { name: '适用水压', value: '0.1~0.4MPa（超出需加减压/增压）' },
    { name: '适用水温', value: '5~38℃' },
    { name: '适用环境', value: '5~40℃，避免阳光直射与冰冻' }
  ]

  // 功耗
  const totalPower = tier.power + (params.heating ? 2200 : 0) + (params.cooling ? 80 : 0) + 10
  const power = [
    { name: '主机工作功率', value: `~${tier.power}W（RO 制水）` },
    { name: '整机峰值功率', value: `~${totalPower}W（含加热/制冷）` },
    { name: '待机功率', value: '<5W' },
    { name: '日均耗电', value: `约 ${((tier.power * 2 + 50) / 1000).toFixed(2)} kWh/日（按 2 小时制水计）` },
    { name: '电源', value: 'AC220V 50Hz（波动 187~242V）' }
  ]

  // 散热
  const heat = [
    { name: '主要热源', value: '变压器（约 30%）+ 增压泵（约 50%）+ PCB（约 20%）' },
    { name: '散热方式', value: '自然对流散热（壳体设计散热孔 ≥ 20cm²）' },
    { name: '工作温度', value: '内部关键器件 ≤ 65℃' },
    { name: '布局要点', value: '变压器远离水区；泵体橡胶减震；电气盒独立密封 IPX7' }
  ]

  // 尺寸
  const size = [
    { name: '机身宽度', value: install.width },
    { name: '机身高度', value: install.height },
    { name: '机身深度', value: '280~420mm（含滤芯突出）' },
    { name: '空载重量', value: '≤12kg（壁挂需注意承重 ≥ 3 倍机重）' }
  ]

  // 成本估算（参考）
  const cost = [
    { name: '滤芯成本（首套）', value: '约 ¥180 ~ ¥380' },
    { name: '核心电控 BOM', value: '约 ¥220 ~ ¥480' },
    { name: '结构塑料件', value: '约 ¥120 ~ ¥260' },
    { name: '整机物料成本', value: '约 ¥520 ~ ¥1,120（不含包装/运输）' }
  ]

  // 认证
  const certs = ['GB 4706.1 家用电器安全', 'GB/T 30307 RO 性能', 'GB 34914 水效', '卫生部涉水许可', 'CCC 认证']

  return {
    summary: `${tier.code} ${tech.name}净水系统（${params.install}）`,
    architecture: `${tech.name}多级过滤（${filterChain.length} 级）`,
    filterChain,
    components,
    interfaces,
    performance,
    power,
    heat,
    size,
    cost,
    certs,
    flux: tier,
    tech,
    install
  }
}

// ========== 多步推理主函数 ==========
function processQuery(query, history) {
  // Step 1: 意图识别
  const intent = detectIntent(query)
  if (intent === 'unknown') {
    return {
      type: 'unknown',
      text: '我能帮你做：\n• 净水系统设计（"帮我设计一个200G系统"）\n• 组件选型（"RO膜应该选什么规格"）\n• 故障排查（"出水TDS高怎么办"）\n• 净水知识查询（关键词搜索）\n\n请用更具体的表达告诉我你的需求。'
    }
  }
  if (intent === 'select') {
    return {
      type: 'guidance',
      text: '选型建议：\n• **小通量（75G/200G）家用**：单膜单泵方案，性价比高\n• **大通量（400G+）家用**：无桶大通量，即开即用\n• **商用（800G+）**：考虑双泵串联 + 加大变压器 + 加强散热\n\n请告诉我具体应用场景，我可以给出更详细的选型方案。'
    }
  }
  if (intent === 'troubleshoot') {
    return {
      type: 'guidance',
      text: '常见故障排查：\n• **出水TDS升高** → RO膜接近寿命（18~36个月），建议更换\n• **机器不启动** → 检查低压开关、进水压力、电源\n• **漏水报警** → 检查管路接头、滤瓶密封、压力桶\n• **废水比异常** → 高压开关/电磁阀/RO膜故障\n\n详细排查请描述具体现象或上传现场照片。'
    }
  }

  // Step 2: 累计上下文参数（从历史中提取）
  let mergedParams = {}
  for (const msg of history) {
    if (msg.role === 'user' || msg.role === 'clarify_answer') {
      Object.assign(mergedParams, extractParams(msg.text || msg.value || ''))
    } else if (msg.role === 'assistant' && msg.params) {
      Object.assign(mergedParams, msg.params)
    }
  }
  // Step 3: 加上当前消息
  mergedParams = extractParams(query, mergedParams)

  // Step 4: 检查缺失参数，主动追问
  const missing = findMissing(mergedParams)
  if (missing.length > 0) {
    return {
      type: 'clarify',
      params: mergedParams,
      missing,
      questions: missing.map(k => CLARIFICATION_QUESTIONS[k])
    }
  }

  // Step 5: 全部参数已知，生成方案
  return {
    type: 'plan',
    params: mergedParams,
    plan: buildPlan(mergedParams)
  }
}

// ========== UI 组件 ==========
export default function SystemDesignAssistant({ onClose, productLine = '净水机' }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      kind: 'intro',
      text: `你好，我是「${productLine}系统设计助手」。我可以帮你做多步推理，输出完整的设计参数方案，包括系统架构、关键组件、性能指标、接口规格、功耗预算、散热要求等。

请用自然语言描述你的需求，例如：\n• "帮我设计一个200G系统"\n• "设计一个壁挂式RO净水机，需要加热功能"\n• "1000G厨下式商用净水机，TDS=350"`
    }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [currentParams, setCurrentParams] = useState({})
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    const userMsg = { id: `u-${Date.now()}`, role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const result = processQuery(text, messages)
      handleResult(result, userMsg)
    }, 700)
  }

  function handleResult(result, userMsg) {
    if (result.type === 'clarify') {
      setCurrentParams(result.params)
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        kind: 'clarify',
        params: result.params,
        missing: result.missing,
        questions: result.questions
      }])
    } else if (result.type === 'plan') {
      setCurrentParams(result.params)
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        kind: 'plan',
        params: result.params,
        plan: result.plan
      }])
    } else {
      // unknown / guidance
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        kind: 'text',
        text: result.text
      }])
    }
    setThinking(false)
  }

  function handleClarificationAnswer(questionKey, answer) {
    // 用户回答追问
    setMessages(prev => [...prev, {
      id: `c-${Date.now()}`,
      role: 'clarify_answer',
      questionKey,
      value: answer
    }])
    setThinking(true)
    setTimeout(() => {
      // 合并答案到参数
      const newParams = { ...currentParams }
      if (questionKey === 'flux') {
        if (answer.includes('75')) newParams.flux = '75G'
        else if (answer.includes('200')) newParams.flux = '200G'
        else if (answer.includes('400')) newParams.flux = '400G'
        else if (answer.includes('600')) newParams.flux = '600G'
        else if (answer.includes('800')) newParams.flux = '800G'
        else if (answer.includes('1000')) newParams.flux = '1000G'
        else if (answer.includes('暂未')) newParams.flux = '400G' // 推荐默认值
      } else if (questionKey === 'install') {
        if (answer.includes('厨下')) newParams.install = '厨下'
        else if (answer.includes('壁挂')) newParams.install = '壁挂'
        else if (answer.includes('台式')) newParams.install = '台式'
        else if (answer.includes('立式')) newParams.install = '立式'
      } else if (questionKey === 'heating') {
        if (answer.includes('仅常温')) { newParams.heating = false; newParams.cooling = false }
        else if (answer.includes('需要加热（即热式）')) { newParams.heating = true; newParams.cooling = false }
        else if (answer.includes('需要加热+制冷')) { newParams.heating = true; newParams.cooling = true }
        else if (answer.includes('管线机')) { newParams.heating = true; newParams.cooling = false }
      }
      // 重新检查
      const missing = findMissing(newParams)
      if (missing.length > 0) {
        setCurrentParams(newParams)
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`,
          role: 'assistant',
          kind: 'clarify',
          params: newParams,
          missing,
          questions: missing.map(k => CLARIFICATION_QUESTIONS[k])
        }])
        setThinking(false)
      } else {
        setCurrentParams(newParams)
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`,
          role: 'assistant',
          kind: 'plan',
          params: newParams,
          plan: buildPlan(newParams)
        }])
        setThinking(false)
      }
    }, 500)
  }

  return (
    <div className="sda-panel-overlay" onClick={onClose}>
      <div className="sda-panel-container" onClick={e => e.stopPropagation()}>
        <div className="sda-panel-header">
          <div className="sda-header-left">
            <span className="sda-icon">🤖</span>
            <div>
              <h2 className="sda-title">AI 系统设计助手</h2>
              <p className="sda-subtitle">多步推理 · 完整方案 · 交互式追问</p>
            </div>
          </div>
          <button className="sda-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="sda-messages-area">
          {messages.map(msg => (
            <Message key={msg.id} msg={msg} onClarify={handleClarificationAnswer} />
          ))}
          {thinking && (
            <div className="sda-msg sda-msg-assistant">
              <div className="sda-msg-avatar">🤖</div>
              <div className="sda-msg-bubble thinking">
                <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
                <span className="thinking-text">正在推理分析...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="sda-input-bar">
          <input
            ref={inputRef}
            type="text"
            className="sda-input"
            placeholder='例如：帮我设计一个 200G 厨下式 RO 系统'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          />
          <button className="sda-send-btn" onClick={handleSend} disabled={!input.trim() || thinking}>
            发送 ↵
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== 消息组件 ==========
function Message({ msg, onClarify }) {
  if (msg.role === 'user' || msg.role === 'clarify_answer') {
    const text = msg.text || msg.value || ''
    return (
      <div className="sda-msg sda-msg-user">
        <div className="sda-msg-avatar">👤</div>
        <div className="sda-msg-bubble">{text}</div>
      </div>
    )
  }
  if (msg.kind === 'text' || msg.kind === 'intro') {
    return (
      <div className="sda-msg sda-msg-assistant">
        <div className="sda-msg-avatar">🤖</div>
        <div className="sda-msg-bubble">{formatMultiline(msg.text)}</div>
      </div>
    )
  }
  if (msg.kind === 'clarify') {
    return (
      <div className="sda-msg sda-msg-assistant">
        <div className="sda-msg-avatar">🤖</div>
        <div className="sda-msg-bubble">
          <div className="clarify-header">🤔 我需要再确认几个关键参数：</div>
          {msg.questions.map((q, i) => (
            <div key={i} className="clarify-question">
              <div className="clarify-text">{q.text}</div>
              <div className="clarify-options">
                {q.options.map((opt, j) => (
                  <button
                    key={j}
                    className="clarify-option-btn"
                    onClick={() => onClarify(msg.missing[i], opt)}
                  >{opt}</button>
                ))}
              </div>
            </div>
          ))}
          {msg.params && Object.keys(msg.params).filter(k => msg.params[k]).length > 0 && (
            <div className="clarify-progress">
              <span>已确认：</span>
              {Object.entries(msg.params).filter(([k, v]) => v && !msg.missing.includes(k)).map(([k, v]) => (
                <span key={k} className="progress-tag">{k}: {String(v)}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  if (msg.kind === 'plan') {
    return <PlanCard plan={msg.plan} />
  }
  return null
}

function PlanCard({ plan }) {
  return (
    <div className="sda-msg sda-msg-assistant">
      <div className="sda-msg-avatar">🤖</div>
      <div className="sda-msg-bubble plan-card">
        <div className="plan-title">{plan.summary}</div>
        <div className="plan-subtitle">🏗️ {plan.architecture}</div>

        <PlanSection title="🔩 关键组件选型" rows={plan.components.map(c => ({ label: c.name, value: c.spec, hint: c.reason }))} />
        <PlanSection title="🧪 滤芯配置组合" rows={plan.filterChain.map(f => ({ label: `第${f.stage}级 · ${f.name}`, value: `${f.spec} · 寿命${f.life}`, hint: f.function }))} />
        <PlanSection title="📊 性能指标" rows={plan.performance.map(p => ({ label: p.name, value: p.value }))} />
        <PlanSection title="🔌 接口规格" rows={plan.interfaces.map(i => ({ label: i.name, value: i.spec }))} />
        <PlanSection title="⚡ 功耗预算" rows={plan.power.map(p => ({ label: p.name, value: p.value }))} />
        <PlanSection title="🌡️ 散热要求" rows={plan.heat.map(h => ({ label: h.name, value: h.value }))} />
        <PlanSection title="📐 整机尺寸" rows={plan.size.map(s => ({ label: s.name, value: s.value }))} />
        <PlanSection title="💰 成本估算（参考）" rows={plan.cost.map(c => ({ label: c.name, value: c.value }))} />
        <PlanSection title="🏅 认证要求" rows={plan.certs.map(c => ({ label: '', value: c }))} />

        <div className="plan-footer">
          <div className="plan-footer-tip">
            💡 提示：以上方案为典型参考设计，具体实施时请根据实际水质、用户预算和安规要求做微调。
          </div>
          <div className="plan-footer-cta">
            需要进一步细化某个模块？直接告诉我！
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanSection({ title, rows }) {
  return (
    <div className="plan-section">
      <div className="plan-section-title">{title}</div>
      <div className="plan-section-rows">
        {rows.map((r, i) => (
          <div key={i} className="plan-row">
            <div className="plan-row-label">{r.label}</div>
            <div className="plan-row-value">
              <code className="plan-spec">{r.value}</code>
              {r.hint && <div className="plan-row-hint">{r.hint}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatMultiline(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    // 简单 markdown：**bold** → <strong>
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <div key={i} className="msg-line">
        {parts.map((p, j) => p.startsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : <React.Fragment key={j}>{p}</React.Fragment>)}
      </div>
    )
  })
}
