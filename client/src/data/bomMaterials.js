/**
 * BOM成本秒算 - 材质参数库
 *
 * 数据来源: 采购专家经验值 + 市场行情
 * 单位: 元/kg (材料单价), g/cm³ (密度)
 */

// ==================== 材质分类配置 ====================
export const materialCategories = [
  { id: 'plastic', name: '塑料件', icon: '🔵', color: '#3b82f6' },
  { id: 'metal', name: '金属件', icon: '⚪', color: '#94a3b8' },
  { id: 'silicone', name: '硅胶件', icon: '🟢', color: '#10b981' },
  { id: 'package', name: '包装材料', icon: '📦', color: '#f59e0b' }
]

// ==================== 完整材质数据 ====================
export const materials = {
  // ========== 塑料件 ==========
  plastic: [
    {
      id: 'abs',
      name: 'ABS',
      nameCn: '丙烯腈-丁二烯-苯乙烯',
      unitPrice: 12.5,        // 元/kg
      density: 1.05,           // g/cm³
      wasteRate: 0.03,         // 损耗率 3%
      processes: ['注塑', '喷油', '电镀'],
      processPrices: {
        注塑: { min: 25, max: 45, unit: '元/模穴', note: '按产品大小浮动' },
        喷油: { min: 2.5, max: 6, unit: '元/件', note: '按面积和颜色数量' },
        电镀: { min: 8, max: 20, unit: '元/dm²', note: 'ABS电镀效果佳' }
      },
      features: ['机械强度好', '易加工', '表面可电镀']
    },
    {
      id: 'pc',
      name: 'PC',
      nameCn: '聚碳酸酯',
      unitPrice: 18.5,
      density: 1.20,
      wasteRate: 0.04,
      processes: ['注塑', '喷涂'],
      processPrices: {
        注塑: { min: 30, max: 55, unit: '元/模穴', note: '需干燥处理' },
        喷涂: { min: 3, max: 7, unit: '元/件', note: 'PC附着力较好' }
      },
      features: ['透明度高', '耐冲击', '阻燃V0可选']
    },
    {
      id: 'pp',
      name: 'PP',
      nameCn: '聚丙烯',
      unitPrice: 8.5,
      density: 0.91,
      wasteRate: 0.03,
      processes: ['注塑'],
      processPrices: {
        注塑: { min: 18, max: 35, unit: '元/模穴', note: '收缩率大，注意尺寸控制' }
      },
      features: ['密度最低', '耐化学性好', '成本低', '可焊接/铰链设计']
    },
    {
      id: 'pa66',
      name: 'PA66',
      nameCn: '尼龙66（增强型）',
      unitPrice: 22.0,
      density: 1.14,
      wasteRate: 0.04,
      processes: ['注塑', '玻纤增强'],
      processPrices: {
        注塑: { min: 32, max: 58, unit: '元/模穴', note: '吸湿性强需充分干燥' }
      },
      features: ['高强度', '耐磨', '耐高温', '常加玻纤增强']
    },
    {
      id: 'pom',
      name: 'POM',
      nameCn: '聚甲醛（赛钢）',
      unitPrice: 24.0,
      density: 1.42,
      wasteRate: 0.035,
      processes: ['注塑', 'CNC精加工'],
      processPrices: {
        注塑: { min: 35, max: 60, unit: '元/模穴', note: '结晶性塑料，收缩大' },
        CNC: { min: 80, max: 200, unit: '元/小时', note: 'POM切削性极佳' }
      },
      features: ['自润滑', '耐磨', '尺寸稳定', '适合齿轮/轴承']
    },
    {
      id: 'pmma',
      name: 'PMMA',
      nameCn: '亚克力',
      unitPrice: 16.0,
      density: 1.19,
      wasteRate: 0.05,
      processes: ['注塑', '挤出', 'CNC雕刻'],
      processPrices: {
        注塑: { min: 28, max: 50, unit: '元/模穴', note: '流动性差需高温高压' }
      },
      features: ['高透光率(92%)', '耐候性好', '易刮花']
    },
    {
      id: 'pet',
      name: 'PET',
      nameCn: '聚对苯二甲酸乙二醇酯',
      unitPrice: 11.0,
      density: 1.35,
      wasteRate: 0.03,
      processes: ['注塑', '吹塑'],
      processPrices: {
        注塑: { min: 26, max: 45, unit: '元/模穴' }
      },
      features: ['食品级', '阻隔性好', '可回收']
    },
    {
      id: 'pvc',
      name: 'PVC',
      nameCn: '聚氯乙烯',
      unitPrice: 7.5,
      density: 1.40,
      wasteRate: 0.03,
      processes: ['注塑', '挤出'],
      processPrices: {
        注塑: { min: 20, max: 38, unit: '元/模穴' }
      },
      features: ['阻燃', '耐化学腐蚀', '成本低', '环保型增塑剂可选']
    }
  ],

  // ========== 金属件 ==========
  metal: [
    {
      id: 'al_6061',
      name: '铝合金 6061-T6',
      nameCn: '6061铝合金',
      unitPrice: 22.0,
      density: 2.70,
      wasteRate: 0.08,
      processes: ['CNC加工', '压铸', '阳极氧化', '喷砂'],
      processPrices: {
        CNC加工: { min: 60, max: 150, unit: '元/小时', note: '切削性能优异' },
        压铸: { min: 15, max: 35, unit: '元/kg', note: '适合大批量生产' },
        阳极氧化: { min: 3, max: 8, unit: '元/件', note: '硬度/颜色可选' },
        喷砂: { min: 1.5, max: 4, unit: '元/件', note: '表面哑光质感' }
      },
      features: ['轻量化', '强度适中', '耐腐蚀', '可阳极处理']
    },
    {
      id: 'al_7075',
      name: '铝合金 7075-T6',
      nameCn: '航空铝7075',
      unitPrice: 35.0,
     密度: 2.81,
      wasteRate: 0.10,
      processes: ['CNC加工', '阳极氧化'],
      processPrices: {
        CNC加工: { min: 80, max: 200, unit: '元/小时', note: '高硬度，刀具磨损快' }
      },
      features: ['超高强度', '航空航天级', '价格较高']
    },
    {
      id: 'ss_304',
      name: '不锈钢 304',
      nameCn: '304不锈钢',
      unitPrice: 28.0,
      密度: 7.93,
      wasteRate: 0.10,
      processes: ['冲压', 'CNC加工', '激光切割', '焊接', '抛光'],
      processPrices: {
        冲压: { min: 0.8, max: 2.5, unit: '元/次', note: '按模具复杂度计' },
        CNC加工: { min: 80, max: 220, unit: '元/小时', note: '粘刀，需专用刀具' },
        激光切割: { min: 0.5, max: 2, unit: '元/cm', note: '薄板效率高' },
        抛光: { min: 5, max: 20, unit: '元/dm²', note: '镜面/拉丝可选' }
      },
      features: ['耐腐蚀', '食品级', '外观好', '无磁性(304L)']
    },
    {
      id: 'ss_316',
      name: '不锈钢 316L',
      nameCn: '316L不锈钢（医用级）',
      unitPrice: 42.0,
      density: 7.98,
      wasteRate: 0.10,
      processes: ['CNC加工', '精密铸造'],
      processPrices: {
        CNC加工: { min: 100, max: 280, unit: '元/小时', note: '更难加工，刀具消耗大' }
      },
      features: ['耐海水腐蚀', '医疗器械适用', '钼含量2-3%']
    },
    {
      id: 'steel_q235',
      name: '碳钢 Q235',
      nameCn: '普碳钢板材',
      unitPrice: 6.5,
      density: 7.85,
      wasteRate: 0.06,
      processes: ['冲压', '折弯', '激光切割', '焊接', '电镀锌'],
      processPrices: {
        冲压: { min: 0.5, max: 1.5, unit: '元/次', note: '最经济的金属工艺' },
        折弯: { min: 2, max: 8, unit: '元/道', note: '按长度+厚度计' },
        电镀锌: { min: 3, max: 10, unit: '元/kg', note: '防锈处理' }
      },
      features: ['成本最低', '易焊接', '需防锈处理', '结构用钢']
    },
    {
      id: 'copper_c1100',
      name: '紫铜 C1100',
      nameCn: '纯铜T2',
      unitPrice: 72.0,
      density: 8.96,
      wasteRate: 0.12,
      processes: ['CNC加工', '冲压', '拉伸'],
      processPrices: {
        CNC加工: { min: 90, max: 250, unit: '元/小时', note: '软粘，排屑难' },
        冲压: { min: 1, max: 3, unit: '元/次' }
      },
      features: ['导电导热极佳', '抑菌', '外观高档', '成本高']
    },
    {
      id: 'brass_h59',
      name: '黄铜 H59',
      nameCn: '黄铜板/棒',
      unitPrice: 48.0,
      density: 8.50,
      wasteRate: 0.10,
      processes: ['CNC加工', '车削', '抛光'],
      processPrices: {
        CNC加工: { min: 75, max: 200, unit: '元/小时', note: '切屑呈粉末状' }
      },
      features: ['易切削', '外观金黄亮丽', '耐蚀', '装饰件首选']
    },
    {
      id: 'mg_alloy',
      name: '镁合金 AZ91D',
      nameCn: '镁合金压铸',
      unitPrice: 38.0,
      density: 1.81,
      wasteRate: 0.09,
      processes: ['压铸', 'CNC精加工'],
      processPrices: {
        压铸: { min: 20, max: 45, unit: '元/kg', note: '比铝更轻，但需防爆' }
      },
      features: ['最轻的金属结构材', '散热好', '电磁屏蔽', '3C产品常用']
    }
  ],

  // ========== 硅胶件 ==========
  silicone: [
    {
      id: 'solid_silicone',
      name: '固体硅胶',
      nameCn: '固态硅胶(HCR)',
      unitPrice: 32.0,
      density: 1.15,
      wasteRate: 0.06,
      processes: ['硫化成型', '油压成型'],
      processPrices: {
        硫化成型: { min: 0.15, max: 0.8, unit: '元/g', note: '按单重计算，含飞边' },
        油压成型: { min: 0.12, max: 0.6, unit: '元/g' }
      },
      features: ['耐高温(-60~250°C)', '食品级', '手感柔软', '密封性好']
    },
    {
      id: 'liquid_silicone',
      name: '液体硅胶(LSR)',
      nameCn: '液态硅胶注射成型',
      unitPrice: 55.0,
      density: 1.10,
      wasteRate: 0.05,
      processes: ['LSR注塑'],
      processPrices: {
        LSR注塑: { min: 0.2, max: 1.0, unit: '元/g', note: '自动化程度高，精度好' }
      },
      features: ['无需修边', '精度高', '医疗/母婴用品', '成本较高']
    }
  ],

  // ========== 包装材料 ==========
  package: [
    {
      id: 'paper_box',
      name: '瓦楞纸盒',
      nameCn: '彩盒/飞机盒',
      unitPrice: 3.5,
      density: 0.00065,     // g/cm³（表观密度）
      wasteRate: 0.02,
      processes: ['印刷', '啤机', '糊盒'],
      processPrices: {
        印刷: { min: 0.02, max: 0.15, unit: '元/cm²', note: '四色印刷，含版费摊销' },
        啤机: { min: 0.01, max: 0.05, unit: '元/个' },
        糊盒: { min: 0.02, max: 0.08, unit: '元/个' }
      },
      features: ['环保', '可定制', '保护性好', '成本低']
    },
    {
      id: 'foam_epe',
      name: 'EPE珍珠棉',
      nameCn: 'EPE发泡棉',
      unitPrice: 9.0,
      density: 0.025,
      wasteRate: 0.05,
      processes: ['裁切', '热熔成型'],
      processPrices: {
        裁切: { min: 0.005, max: 0.03, unit: '元/cm²' },
        热熔成型: { min: 0.02, max: 0.15, unit: '元/个' }
      },
      features: ['缓冲抗震', '环保可回收', '白色/黑色可选']
    },
    {
      id: 'foam_sponge',
      name: '海绵/泡棉',
      nameCn: 'PU泡棉/EVA泡棉',
      unitPrice: 15.0,
      density: 0.03,
      wasteRate: 0.08,
      processes: ['模切', '背胶', '冲型'],
      processPrices: {
        模切: { min: 0.01, max: 0.08, unit: '元/个' },
        背胶: { min: 0.005, max: 0.03, unit: '元/cm²' }
      },
      features: ['防震', '填充/贴合', '多孔径可选', '可带背胶']
    },
    {
      id: 'pe_bag',
      name: 'PE袋/OPP袋',
      nameCn: '塑料包装袋',
      unitPrice: 0.012,
      density: 0.00092,
      wasteRate: 0.01,
      processes: ['制袋印刷', '封口'],
      processPrices: {
        制袋印刷: { min: 0.002, max: 0.015, unit: '元/个', note: '按尺寸+印刷色数' }
      },
      features: ['防尘防水', '成本低', '可印LOGO', '自封/贴骨可选']
    },
    {
      id: 'blister_pack',
      name: '吸塑/PVC罩',
      nameCn: '吸塑包装/PET罩',
      unitPrice: 0.014,
      density: 0.00135,
      wasteRate: 0.06,
      processes: ['吸塑成型', '高频热合'],
      processPrices: {
        吸塑成型: { min: 0.01, max: 0.12, unit: '元/个', note: '按展开面积+深度' },
        高频热合: { min: 0.01, max: 0.06, unit: '元/个' }
      },
      features: ['透明展示', '固定产品', '挂孔可选', '超市货架常用']
    },
    {
      id: 'carton_outer',
      name: '外箱(五层瓦楞)',
      nameCn: '运输外包装箱',
      unitPrice: 4.5,
      density: 0.0012,
      wasteRate: 0.01,
      processes: ['啤机', '打钉/胶水'],
      processPrices: {
        啤机: { min: 0.3, max: 3, unit: '元/个', note: '按尺寸计费' }
      },
      features: ['堆码承重', '物流运输', '可印唛头', '标准尺寸优惠']
    }
  ]
}

// ==================== 工艺类型总览 ====================
export const processTypes = {
  injection: { name: '注塑', category: 'plastic', basePriceRange: [18, 60], unit: '元/模穴' },
  cnc: { name: 'CNC加工', category: 'metal', basePriceRange: [60, 280], unit: '元/小时' },
  diecasting: { name: '压铸', category: 'metal', basePriceRange: [15, 45], unit: '元/kg' },
  stamping: { name: '冲压', category: 'metal', basePriceRange: [0.5, 3], unit: '元/次' },
  silkscreen: { name: '丝印/移印', category: 'universal', basePriceRange: [0.3, 3], unit: '元/次' },
  anodize: { name: '阳极氧化', category: 'metal', basePriceRange: [3, 10], unit: '元/件' },
  plating: { name: '电镀', category: 'universal', basePriceRange: [5, 25], unit: '元/dm²' },
  vulcanize: { name: '硫化成型', category: 'silicone', basePriceRange: [0.12, 0.8], unit: '元/g' }
}

// ==================== 辅助函数 ====================

/**
 * 根据材质ID获取完整信息
 */
export function getMaterialById(categoryId, materialId) {
  return materials[categoryId]?.find(m => m.id === materialId) || null
}

/**
 * 获取某分类下所有材质列表
 */
export function getMaterialsByCategory(categoryId) {
  return materials[categoryId] || []
}
