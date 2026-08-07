/**
 * 水家电设计选型参考数据
 * 三条产品线：净水机 / 饮水机 / 台净（台式净水器）
 *
 * 净水机模块包含完整设计规范内容
 * 饮水机和台净模块预留结构框架，待后续填充
 */

// ==================== 净水机设计规范 ====================
export const purifierDesignSpecs = {
  id: 'purifier',
  name: '净水机',
  icon: '💧',
  color: '#0ea5e9',
  description: '家用/商用净水系统结构设计参考标准',

  // 产品分类体系
  categories: [
    {
      id: 'ro',
      name: 'RO反渗透纯水机',
      description: '主流家用净水产品，多级过滤+反渗透膜技术',
      subTypes: ['75G无桶机', '400G大通量', '600G/800G大通量', '1000G以上超大通量', '双出水机型', '厨下式', '壁挂式']
    },
    {
      id: 'uf',
      name: '超滤净水器',
      description: '保留矿物质的中空纤维超滤技术，适合水质较好地区',
      subTypes: ['中空纤维超滤', '陶瓷超滤复合']
    },
    {
      id: 'composite',
      name: '复合型净水机',
      description: '多种过滤技术组合，满足不同用水场景需求',
      subTypes: ['RO+UF复合', 'RO+UV杀菌', '纳滤机', '软水+RO组合']
    }
  ],

  // 核心设计参数
  coreParameters: [
    {
      category: '整机尺寸规格',
      items: [
        { param: '机身高度', range: '380~520mm', note: '厨下安装需考虑橱柜深度≥450mm' },
        { param: '机身宽度', range: '180~350mm', note: '标准柜体宽度400~600mm，需留接线空间' },
        { param: '机身深度', range: '280~420mm', note: '含滤芯突出部分' },
        { param: '重量限制', range: '≤12kg(空载)', note: '安装承重支架需≥3倍机重' },
        { param: '进出水管中心距', range: '60~120mm', note: '推荐80mm±5mm标准化' },
      ]
    },
    {
      category: '水路系统设计',
      items: [
        { param: '进水压力范围', range: '0.1~0.4MPa', note: '超出需加装减压阀/增压泵' },
        { param: '额定通量', range: '75G/400G/600G/800G/1000G', note: '1G≈3.785L/d，对应流速1.0~2.5L/min' },
        { param: '废水比', range: '1:1 ~ 3:1', note: '新国标要求一级水效≥2:1' },
        { param: '管路接头规格', range: '2分/3分/4分快插', note: '进水2分，浓水2分，纯水3-4分' },
        { param: '储水桶容量(有桶)', range: '3.2G/6G', note: 'NSF认证食品级PE材质' },
      ]
    },
    {
      category: '电气安全参数',
      items: [
        { param: '额定电压', range: 'AC220V 50Hz', note: '波动范围187~242V' },
        { param: '额定功率', range: '30~80W', note: '主要为水泵功率，增压泵另计' },
        { param: '防水等级', range: 'IPX4(机身) / IPX7(电气盒)', note: 'GB4706.1要求' },
        { param: '绝缘等级', range: 'Class I 接地保护', note: '必须有可靠接地端子' },
        { param: '电磁兼容', range: 'GB/T 17626 EMC测试', note: '需通过EMC认证' },
      ]
    },
    {
      category: '材料选用规范',
      items: [
        { param: '接触水路材质', range: '食品级PP/POM/304不锈钢', note: 'GB/T 17219卫生许可' },
        { param: '外壳材料', range: 'ABS/PC/PP合金', note: 'UL94-V0阻燃等级' },
        { param: '密封件材质', range: '食品级硅胶/NBR/EPDM', note: '耐氯性要求>500ppm·h' },
        { param: '管路材料', range: 'PE/PU编织管', note: '耐压≥0.8MPa，爆破压≥2.5MPa' },
        { param: '滤瓶材质', range: '透明PAS/PPSU', note: 'PAS透明可观察滤芯状态' },
      ]
    }
  ],

  // 滤芯配置参考
  filterConfigurations: [
    {
      stage: 1,
      name: 'PP棉滤芯',
      function: '拦截泥沙铁锈颗粒物',
      spec: '5μm/1μm 熔喷PP',
      lifespan: '3~6个月',
      replacementTip: '视当地水质浊度调整'
    },
    {
      stage: 2,
      name: '前置活性炭',
      function: '吸附余氯异色异味有机物',
      spec: 'CTO烧结炭/压缩炭块',
      lifespan: '6~12个月',
      replacementTip: '余氯高的地区缩短更换周期'
    },
    {
      stage: 3,
      name: 'RO反渗透膜',
      function: '去除重金属细菌病毒等',
      spec: '75G~1000G 卷式复合膜',
      lifespan: '18~36个月',
      replacementTip: '制水TDS>50ppm时更换'
    },
    {
      stage: 4,
      name: '后置活性炭(T33)',
      function: '改善口感吸附挥发性有机物',
      spec: '颗粒活性炭柱',
      lifespan: '12个月',
      replacementTip: '出水有异味时提前更换'
    }
  ],

  // 结构设计要点
  structuralGuidelines: [
    {
      title: '滤芯布局与维护空间',
      content: `• 滤芯更换方向：优先竖直向下拔出或侧向抽拉，避免上方遮挡\n• 滤芯间距：相邻滤芯中心距≥50mm（含扳手操作空间）\n• 前置滤芯高度方向：底部留≥150mm拔出空间\n• RO膜滤芯：侧向抽出式需侧面留≥200mm空间`,
      priority: 'high'
    },
    {
      title: '水路与漏水防护',
      content: `• 进水三通球阀：标配2分快接，带泄压孔防虹吸\n• 低压开关：≤0.05MPa停机保护RO膜\n• 高压开关：≥0.3~0.35MPa停泵满桶自停\n• 漏水检测：电器盒底部必装漏水探头，联动电磁阀关断\n• 底盘集水槽：最低点设置，容积≥500ml`,
      priority: 'high'
    },
    {
      title: '电气布置规范',
      content: `• 电源线出口位置：建议底部或背面，远离水源\n• 变压器/电源板：独立密封腔体，IPX7以上\n• 低压直流走线：24V以下，与高压交流分区布线\n• 接地端子：裸露金属螺柱，标识清晰⏚\n• 泵体减震：橡胶垫圈+弹性吊装，噪声≤45dB(A)`,
      priority: 'medium'
    },
    {
      title: '外观与人机工程',
      content: `• 显示面板：LED指示灯/数码屏，位置视线平齐\n• 滤芯到期提醒：每级独立指示，颜色编码（绿→黄→红）\n• 更换操作：免工具旋拧/快拆卡扣，单手可完成\n• 标识标签：水流箭头、滤芯序号、警告语、铭牌信息齐全`,
      priority: 'medium'
    },
    {
      title: '包装运输要求',
      content: `• 包装尺寸：外箱长宽高各加缓冲≥40mm\n• 缓冲材料：EPE珍珠棉≥20mm厚度\n• 滤芯预装：出厂不装滤芯，单独密封包装附入\n• 运输试验：GB/T 4857跌落测试（棱角面600mm）\n• 堆码强度：外箱承重≥50kg`,
      priority: 'low'
    }
  ],

  // 常用接口标准
  interfaceStandards: [
    { name: '进水口', type: '2分(1/4")快插', material: '食品级尼龙', pressure: '0.8MPa' },
    { name: '浓水口(废水)', type: '2分(1/4")快插', material: '食品级尼龙', flow: '连续排放' },
    { name: '纯水口', type: '3分(3/8")或4分(1/2")快插', material: '食品级尼龙', flow: '按通量定' },
    { name: '电源接口', type: '两孔八字尾(C7)', rating: '250V 2.5A' },
    { name: '低压开关', type: '2分螺纹接头', trigger: '≤0.05MPa常开' },
    { name: '高压开关', type: '3分管路串联', trigger: '0.3~0.35MPa常闭' },
    { name: '电磁阀', type: '2分进水控制', voltage: 'DC24V', power: '≤4W' },
    { name: '增压泵进水', type: '2分快速接头', pressure: '0~0.6MPa提升' },
    { name: '增压泵出水', type: '2分至RO膜进水', pressure: '0.6~0.8MPa输出' },
  ],

  // 认证与合规清单
  certifications: [
    { standard: 'GB 4706.1', scope: '家用电器安全通用要求', required: true },
    { standard: 'GB/T 30307', scope: '家用反渗透净水机性能要求', required: true },
    { standard: 'GB 34914', scope: '净水机水效限定值及水效等级', required: true },
    { standard: '卫生部涉水许可', scope: '饮用水卫生安全产品检验', required: true },
    { standard: 'CCC认证', scope: '强制性产品认证（含变压器类）', required: true },
    { standard: 'NSF/ANSI 58', scope: 'RO膜性能标准（出口必备）', required: false },
    { standard: 'ISO 9001', scope: '质量管理体系认证', required: false },
  ]
}

// ==================== 饮水机设计规范（框架预留）====================
export const dispenserDesignSpecs = {
  id: 'dispenser',
  name: '饮水机',
  icon: '🥤',
  color: '#10b981',
  description: '台式/立式饮水设备设计选型参考（内容完善中...）',

  // 分类体系（预留）
  categories: [
    { id: 'desktop', name: '台式饮水机', subTypes: ['温热型', '冷热型', '制冷制热型'] },
    { id: 'floor-standing', name: '立式饮水机', subTypes: ['单门', '双门', '智能触控'] },
    { id: 'pipeline', name: '管线机', subTypes: ['壁挂式', '嵌入式', '台下式'] },
    { id: 'bottleless', name: '无胆速热型', subTypes: ['即热式', '稀土厚膜加热'] }
  ],

  // 设计参数（预留框架）
  coreParameters: [],

  structuralGuidelines: [],
  certifications: [],

  placeholderContent: {
    title: '模块建设中 🚧',
    message: '饮水机设计选型参考内容正在整理中，即将上线。',
    plannedSections: [
      '加热系统设计（内胆/即热/厚膜方案对比）',
      '制冷系统设计（压缩机/电子制冷选择）',
      '水胆材质与保温设计',
      '龙头/出水口结构规范',
      '智能控制与显示方案',
      '能效标准与节能设计要点',
      '安全防护设计（干烧保护/童锁/倾倒断电）'
    ]
  }
}

// ==================== 台净设计规范（框架预留）====================
export const countertopDesignSpecs = {
  id: 'countertop',
  name: '台净（台式净水器）',
  icon: '✨',
  color: '#f59e0b',
  description: '桌面/台面放置的便携净水设备设计参考（内容完善中...）',

  // 分类体系（预留）
  categories: [
    { id: 'portable', name: '便携台净', subTypes: ['手持式', '杯式', '壶式'] },
    { id: 'countertop-ro', name: '台式RO净水器', subTypes: ['迷你RO', '一体式RO'] },
    { id: 'faucet-mount', name: '龙头净水器', subTypes: ['直饮型', '粗滤型'] },
    { id: 'pitcher', name: '滤水壶', subTypes: ['活性炭型', '离子交换型', '多功能复合型'] }
  ],

  // 设计参数（预留框架）
  coreParameters: [],

  structuralGuidelines: [],
  certifications: [],

  placeholderContent: {
    title: '模块建设中 🚧',
    message: '台净设计选型参考内容正在整理中，即将上线。',
    plannedSections: [
      '体积与便携性设计约束',
      '滤芯小型化方案（集成式/复合滤芯）',
      '水箱结构与密封设计',
      '供电方式选择（USB-C/电池/充电宝）',
      '人机交互简化设计',
      '旅行/户外使用场景特殊考量',
      '耗材成本与用户换芯体验优化'
    ]
  }
}

// ==================== 导出汇总 ====================
export const productLines = [purifierDesignSpecs, dispenserDesignSpecs, countertopDesignSpecs]

export default productLines
