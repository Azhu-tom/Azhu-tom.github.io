/**
 * 导入的沉淀知识库数据（自动生成，勿手改）
 * 来源：开发经验沉淀知识库三年汇总.xlsx
 * 共 287 条经验（288 行，跳过 1 行）
 * 结构对齐 problemSolverData.js 的 PROBLEM_CASES
 */

const IMPORTED_PROBLEM_CASES = [
  {
    "id": "KB001",
    "category": "水温",
    "subCategory": "水温",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "水温",
      "温度",
      "出水"
    ],
    "title": "2024年净水产品线RF621开水档水温不足问题分析与解决",
    "problem": "RF621开水档位出水温度不到90℃",
    "cause": "1、质量履历中异常项未充分闭环\n2、36V抽水泵与24V抽水泵流量特性存在差异，参照24V抽水泵来设定36V抽水泵的占空比不合理；\n3、抽水泵流量在经过一定时间的磨合后会出现一定程度的上升（不超过10%）",
    "solution": "1、下调抽水泵占空比极限为25%，先30%再27%最后25%渐次下调，避免流量骤变影响出水水型",
    "prevention": "1、补充程序版本变更记录表，并纳入测试及试产前的点检范畴；\n2、开发过程质量履历闭环证据充分确认；\n3、最小占空比应该根据抽水泵的流量-电压曲线来设定，同时要考虑到电机渡过磨合期之后的流量变化情况",
    "tags": [
      "净水",
      "水温"
    ]
  },
  {
    "id": "KB002",
    "category": "滤芯",
    "subCategory": "膜前压",
    "productLine": "净水",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "膜前压",
      "泵",
      "膜"
    ],
    "title": "2025年台湾净水机热水膜前压高，调泵压并沉淀规范",
    "problem": "台湾机热水状态下膜前压偏高",
    "cause": "台湾地区功率不超过1500W，造成热水流量低，膜前压高",
    "solution": "取热水状态时，增压泵降压到20V，降低膜前压",
    "prevention": "整机膜前压高的情况下，可以沟通电控预留泵调整功率（电压）的功能，同时通量足够情况下，可以增大废水阀来调整膜前压",
    "tags": [
      "净水",
      "滤芯"
    ]
  },
  {
    "id": "KB003",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净水",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "水形",
      "水嘴"
    ],
    "title": "2025净水台湾机热水水形差，改水嘴内孔优化",
    "problem": "台湾机热水水形差，抖动、歪斜",
    "cause": "热水流速小，0.2-0.3L/min，水嘴内孔偏大5.5mm",
    "solution": "更改水嘴内孔，由5.5-4mm，优化水形",
    "prevention": "热水流量小，需匹配合适内孔水嘴；水嘴设计锥形+直孔",
    "tags": [
      "净水",
      "水形"
    ]
  },
  {
    "id": "KB004",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": true,
    "keywords": [
      "水形",
      "水嘴",
      "出水"
    ],
    "title": "2025年饮水线水形不良因行程不足，调整出水端解决并沉淀规范",
    "problem": "出水嘴水型不良",
    "cause": "出水端行程不足导致水型无法汇聚",
    "solution": "茶吧机出水端长度至少15mm，或者适当缩小出水口直径，最小为4mm",
    "prevention": "茶吧机水型分散变形时，增加茶吧机出水端长度或者缩小出水口直径可以改善，内径5mm左右，长度大于15mm， 长度15以内，内径取4mm",
    "tags": [
      "饮水",
      "水形"
    ]
  },
  {
    "id": "KB005",
    "category": "液位管",
    "subCategory": "浮球",
    "productLine": "净饮",
    "year": "2024",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "浮球",
      "流速",
      "进水",
      "浮子",
      "连通器"
    ],
    "title": "净饮水位连通器浮子过快因纯水壶进水慢，调整设计并规范流速",
    "problem": "台净水位连通器浮子上浮速度快于纯水壶水位",
    "cause": "纯水壶进水速度慢于连通器进水速度导致连通器水位上浮较快",
    "solution": "1.纯水壶进水孔面积要大于连通器进水孔面积\n2.缓冲腔体中的设计要保证水要优先往纯水壶进入，必要时候可以设计挡筋条保证水流优先冲击纯水壶进水口\n3.抽水泵抽水的时候优先保证先抽水壶中的水，将抽水口远离连通器口，必要时候设置挡筋增加抽水泵与连通器进水口的距离",
    "prevention": "1纯水壶底部对接的自然流速至少＞2L/min",
    "tags": [
      "净饮",
      "液位管"
    ]
  },
  {
    "id": "KB006",
    "category": "安规",
    "subCategory": "加热体",
    "productLine": "净饮",
    "year": "2024",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "加热体",
      "漏水",
      "加热",
      "出水",
      "硅胶",
      "防水"
    ],
    "title": "净饮产品加热体出水口漏水无防护，加防水硅胶防触电",
    "problem": "加热体出水口漏水无防护",
    "cause": "水会淋到电控板上强电部分，导致桌面有水会让人触电",
    "solution": "增加防水硅胶，保证水不淋到强电端子上",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "安规"
    ]
  },
  {
    "id": "KB007",
    "category": "水形",
    "subCategory": "起泡器",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": true,
    "keywords": [
      "起泡器",
      "水形",
      "水效"
    ],
    "title": "净饮水形起泡器微气泡效果差，调流道与进气量并沉淀规范",
    "problem": "微气泡水效果不明显",
    "cause": "水气混合不充分",
    "solution": "1、考虑整体塑料件承压性能，减小射流结构的流道截面积，让水流流速增快\n2、减小进气流道面积，更易形成负压吸气",
    "prevention": "流速与进气量需匹配，出水口打散混合的滤网至少四层以上，",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB008",
    "category": "龙头",
    "subCategory": "底座",
    "productLine": "净水",
    "year": "2024",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "底座",
      "龙头",
      "材料",
      "工艺",
      "PP"
    ],
    "title": "净水龙头底座PP改PA66+30%GF后断裂，调整工艺并优化材料",
    "problem": "龙头螺纹底座由PP改为PA66+30%GF，市场出现拆包断裂现象",
    "cause": "尼龙韧性好，虽然尼龙+玻纤材料强度有提升，但是玻纤加太多会导致韧性下降",
    "solution": "尼龙+玻纤材料注塑后进行水煮、泡水等处理工艺吸水软化，增加韧性",
    "prevention": "1、尼龙材料注塑后需进行吸水软化增加韧性\n2、采用PA6/PA66+10%GF即可",
    "tags": [
      "净水",
      "龙头"
    ]
  },
  {
    "id": "KB009",
    "category": "外接设备",
    "subCategory": "管线机",
    "productLine": "净水",
    "year": "2024",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "管线机",
      "压力",
      "进水",
      "回流",
      "水压"
    ],
    "title": "净水器RF997P接管线机低压时可能无法断开，已调整方案并建议慎用回流水路",
    "problem": "RF997P接管线机时，当进水压力偏小时，有概率性无法断开风险",
    "cause": "带回流水路，纯水回流到增压泵前端，导致压力卸掉了，管路压力达不到高压开关断开压力0.26MPa",
    "solution": "1、回流逆止阀改为＞0.1MPa，即热工况膜前压力会升高，所以需结合增压泵降压方案\n2、回流管路增加一个电磁阀\n3、增加管线机连接PE管长度，长度＞5m以上，并且采用2分管",
    "prevention": "带回流水路的净水器不建议管线机功能",
    "tags": [
      "净水",
      "外接设备"
    ]
  },
  {
    "id": "KB010",
    "category": "包装防护",
    "subCategory": "泡沫",
    "productLine": "净水",
    "year": "2024",
    "author": "周天宇",
    "isDesignSpec": false,
    "keywords": [
      "泡沫",
      "跌落",
      "包装"
    ],
    "title": "净水产品RF690跌落不合格，调整泡沫后RF997P系列合格并沉淀规范",
    "problem": "RF690系列跌落不合格，且760mm高度摸底也较大损坏。RF997P系列重新设计包装，跌落合格（高度800mm），整机无任何异常。",
    "cause": "1、泡沫壁厚不足，整机未得到有效保护。\n2、泡沫克重较低，即密度小，在跌角后泡沫已碎裂，跌棱和跌面时无法对整机进行保护。\n3、泡沫和纸箱间隙大，防护效果差。",
    "solution": "1、泡沫壁厚加厚。\n2、物料描述泡沫克重调整，按要求生产，来料称重。\n3、整机纸箱和泡沫匹配。",
    "prevention": "1、针对重量较大产品（＞15kg），建议泡沫壁厚＞45mm。\n2、泡沫理论克重建议20kg/m³\n3、纸箱长度和宽度内档尺寸和泡沫外尺寸的设计间隙建议5mm；高度方向按单层摇盖预留（一般双瓦楞是7mm，使打包后泡沫和纸箱更紧实）",
    "tags": [
      "净水",
      "包装防护"
    ]
  },
  {
    "id": "KB011",
    "category": "安规",
    "subCategory": "加热体",
    "productLine": "净水",
    "year": "2024",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "加热体",
      "加热",
      "温控",
      "电压"
    ],
    "title": "净水产品线RF609s加热体高电压测试温控器跳断，改散热孔解决",
    "problem": "RF609s新款加热体1.15倍253V高电压工作测试，温控器跳断",
    "cause": "加热体发热管外壳镀锌板过于封闭，造成散热效果差，温控器跳断",
    "solution": "外壳前后两侧增加U型散热孔，优化发热管散热，最终温控器正常工作，未跳断；正常干燥与非正常干烧测试正常",
    "prevention": "新导入加热体，要综合外壳散热，温控器距离、温度参数等综合判定，装在整机功能测试",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB012",
    "category": "龙头",
    "subCategory": "喷气",
    "productLine": "净水",
    "year": "2024",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "喷气",
      "龙头"
    ],
    "title": "2024年净水龙头喷气模块边补边出工况喷汽问题及引流解决",
    "problem": "RF609s边补边出工况下，过渡阶段龙头喷汽",
    "cause": "边补边出工况，补水管水流竖直下落于出水口附近，造成水四溅；水、空气混合后被泵吸入，造成最终喷汽",
    "solution": "罐内部增加一定角度引流管，将补水沿着罐内壁流下，出口不会进入大量空气，喷汽现象解决",
    "prevention": "遇边补边出工况，要防止水流直冲出水口附件，通过内壁引流或者挡水板设计分流改善喷汽",
    "tags": [
      "净水",
      "龙头"
    ]
  },
  {
    "id": "KB013",
    "category": "水温",
    "subCategory": "水温",
    "productLine": "净水",
    "year": "2024",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "水温",
      "温度",
      "加热",
      "出水"
    ],
    "title": "净水产品线水温模块45℃档实测55℃，调整NTC加热策略均衡温度",
    "problem": "45℃热水档出水温度偏高烫手，实测55℃",
    "cause": "RF609s热罐较高、较大，上下水温偏差大，NTC装于罐底，造成温度读取偏差大",
    "solution": "NTC到40℃后，加热体改半功率工作，降低温度影响；到49℃（摸索值）停止加热，同步泵循环20s，均衡罐内上下温度",
    "prevention": "NTC读取温度要综合具体工况，储水式要结合罐内位置测试综合评估具体温度",
    "tags": [
      "净水",
      "水温"
    ]
  },
  {
    "id": "KB014",
    "category": "漏水",
    "subCategory": "排气管",
    "productLine": "净水",
    "year": "2024",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "排气管"
    ],
    "title": "2024年净水线中批试产排气管因引流管方向问题蹦水",
    "problem": "中批试产，部分机器补水过程中排气管蹦水",
    "cause": "补水引流管方向问题，当水速过大时，水流直接溅到排气口，随着补水过程气压外排，最终蹦水",
    "solution": "取消罐内部引流管（边补边出功能取消）",
    "prevention": "成熟品，变更内部元器件，包括微小，自认为无影响的改动都要经过充分验证。局部的改动也要保证一致性，如引流管的角度等",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB015",
    "category": "滤芯",
    "subCategory": "串水",
    "productLine": "净水",
    "year": "2024",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "串水",
      "可靠性"
    ],
    "title": "净水产品RF609s测试中冷水管出热水，因取消逆止阀增设止水阀芯并沉淀规范",
    "problem": "RF609s可靠性测试过程中冷水管有热水，取常温水前几秒水流不连续",
    "cause": "RO膜后端取消了逆止阀，造成RO到龙头段水回流；电磁阀泄压后关不死，取热水时部分水渗到冷水管",
    "solution": "RO后端增加止水阀芯",
    "prevention": "水路分析时要充分考虑RO后端泄压影响，预计会产生的结果，最终判定能否取消逆止阀",
    "tags": [
      "净水",
      "滤芯"
    ]
  },
  {
    "id": "KB016",
    "category": "热罐",
    "subCategory": "残余水",
    "productLine": "净水",
    "year": "2024",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "残余水",
      "泵"
    ],
    "title": "609s整机水检后，罐内水通过泵抽出，但存在10-20ml残余水，无法排空",
    "problem": "609s整机水检后，罐内水通过泵抽出，但存在10-20ml残余水，无法排空",
    "cause": "系统采用高温接头与不锈管连接，水检后拆除接头排水吹起，再插回接头，且排水处位于罐下部，无法充分判定接头插回可靠性，存在一定风险",
    "solution": "1、更换拆卸位置，拆除抽水泵处接头，泵硅胶弹性连接，方便拆卸，且可明显判定接头安装可靠性；\n2、罐底增加常见螺纹排水结构（台净成熟结构）",
    "prevention": "整机设计要充分考虑排水方案，能够满足拆装可靠性",
    "tags": [
      "净水",
      "热罐"
    ]
  },
  {
    "id": "KB017",
    "category": "漏水",
    "subCategory": "转接头",
    "productLine": "净饮",
    "year": "2024",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "转接头",
      "漏水",
      "龙头"
    ],
    "title": "机械臂龙头机与家用龙头螺纹连接处漏水渗水",
    "problem": "机械臂龙头机与家用龙头螺纹连接处漏水渗水",
    "cause": "连接处密封垫厚度偏薄，家用龙头螺纹长度不统一，造成拧紧后未有效压缩密封垫",
    "solution": "增加密封垫厚度，根据家用龙头螺纹长度调研数据及原龙头机参数，调整密封垫到端面的距离",
    "prevention": "龙头机接头端面到密封垫高度以4.3为基准，设计密封垫厚度",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB018",
    "category": "安规",
    "subCategory": "电控盒",
    "productLine": "净饮",
    "year": "2024",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "电控盒",
      "继电器"
    ],
    "title": "660继电器750度灼热丝不合格",
    "problem": "660继电器750度灼热丝不合格",
    "cause": "产品开发过程中没有关注安规要求，GB4706.1-2005中要求继电器要过750度灼热丝测试",
    "solution": "更换通认证号相同型号的继电器，能过750度测试的做对应表示，规格书中注明表示意义",
    "prevention": "继电器生产厂家统一型号有专门为适应小家电安规750度灼热丝测试的规格，继电器上有对应符号区分，在选择继电器时要特别要求能过750度灼热丝，同时规格书有做注释",
    "tags": [
      "净饮",
      "安规"
    ]
  },
  {
    "id": "KB019",
    "category": "安规",
    "subCategory": "电控盒",
    "productLine": "净饮",
    "year": "2024",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "电控盒",
      "电控"
    ],
    "title": "660电控盒750度灼热丝不合格",
    "problem": "660电控盒750度灼热丝不合格",
    "cause": "GB4706.1-2005中要求通过电流大于0.2A的接插件，空间距离小于3mm的非金属配件要过750度灼热丝测试",
    "solution": "更换材料，或者避空3mm以上",
    "prevention": "插片连接的大电流附近的非金属器件注意灼热丝测试要求，最好设计较大的避空距离",
    "tags": [
      "净饮",
      "安规"
    ]
  },
  {
    "id": "KB020",
    "category": "材料",
    "subCategory": "尺寸",
    "productLine": "净饮",
    "year": "2024",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "尺寸",
      "注塑"
    ],
    "title": "660更换颜色注塑后配件尺寸变大，顶盖段差变大",
    "problem": "660更换颜色注塑后配件尺寸变大，顶盖段差变大",
    "cause": "更换颜色母粒后，注塑时参数没有更改，导致注塑尺寸偏大",
    "solution": "按照产品设计要求重新调整注塑参数",
    "prevention": "相同模具，更换不同配色注塑时要确认产品尺寸，注塑参数调整",
    "tags": [
      "净饮",
      "材料"
    ]
  },
  {
    "id": "KB021",
    "category": "材料",
    "subCategory": "外观",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "外观",
      "塑料"
    ],
    "title": "浅色塑料件透光",
    "problem": "浅色塑料件透光",
    "cause": "母粒为高亮透明，添加色粉后无法完全阻隔光源",
    "solution": "母粒中再添加钛白粉可以完全阻隔光源，但是钛白粉的价格是普通色粉的一倍",
    "prevention": "浅色系茶吧机，防止透光要增加钛白粉每公斤配比400mg，可以完全阻隔光源",
    "tags": [
      "饮水",
      "材料"
    ]
  },
  {
    "id": "KB022",
    "category": "显示模块",
    "subCategory": "密封",
    "productLine": "净水",
    "year": "2024",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "密封",
      "膜",
      "显示"
    ],
    "title": "RF997P蒸汽进入显示屏内部导致ITO膜和TFT屏失效",
    "problem": "RF997P蒸汽进入显示屏内部导致ITO膜和TFT屏失效",
    "cause": "1、现有龙头密封方案无法满足密封可靠性\n2、TFT屏、ITO膜比现有弹簧方案对水蒸气更敏感，进水汽容易导致故障",
    "solution": "1、PC盖包边设计，与PPO支架包边缝隙内进行点胶密封\n2、采用0.6mm 3M胶牌号5925，用于PC盖与PPO支架贴合\n3、显示板背面再灌胶密封",
    "prevention": "1、显示屏密封结构建议设计成包边结构\n2、加厚3M胶，0.6mm，牌号5925",
    "tags": [
      "净水",
      "显示模块"
    ]
  },
  {
    "id": "KB023",
    "category": "显示模块",
    "subCategory": "变形",
    "productLine": "净水",
    "year": "2024",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "变形",
      "显示"
    ],
    "title": "RF997P高温高湿、双八五、熏蒸试验后，显示屏中间拱起变形",
    "problem": "RF997P高温高湿、双八五、熏蒸试验后，显示屏中间拱起变形",
    "cause": "1、PC盖注塑后有应力残留，高温会释放变形\n2、环氧树脂硬度高，变形后不易恢复\n3、PC盖与PPO支架之间只有两端有定位柱，中间无拉力固定",
    "solution": "1、增加PC盖注塑模温至100℃，减少应力\n2、环氧树脂改为硅胶，硅胶质地软不受力",
    "prevention": "1、PC件注塑需考虑去应力，可增加模温，或是高温环境箱处理\n2、PC盖结构设计时，中间需设计定位柱支撑固定",
    "tags": [
      "净水",
      "显示模块"
    ]
  },
  {
    "id": "KB024",
    "category": "水温",
    "subCategory": "水温",
    "productLine": "净水",
    "year": "2024",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "水温",
      "温度"
    ],
    "title": "R5机器长时间工作后，原水温度探头检测水温偏高",
    "problem": "R5机器长时间工作后，原水温度探头检测水温偏高",
    "cause": "由于原水NTC安装于RO膜后段水路，当增压泵长时间工作时，导致泵后水温升高，可能会影响原水NTC检测判断",
    "solution": "水路设计时，原水温度探头需放于泵前水路",
    "prevention": "原水NTC安装位置设计时需放于泵前",
    "tags": [
      "净水",
      "水温"
    ]
  },
  {
    "id": "KB025",
    "category": "TDS",
    "subCategory": "TDS",
    "productLine": "净水",
    "year": "2024",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "TDS",
      "显示"
    ],
    "title": "R5纯水TDS显示一直为1",
    "problem": "R5纯水TDS显示一直为1",
    "cause": "ROC水路板由于设计问题，将其储水箱朝上安装，导致水箱无法充满水；且内部水流可能是死水无法正常流动，导致检测不准",
    "solution": "纯水TDS探头的安装位置更换到流动水路中",
    "prevention": "ROC水路板安装位置设计时储水箱需倒置",
    "tags": [
      "净水",
      "TDS"
    ]
  },
  {
    "id": "KB026",
    "category": "水形",
    "subCategory": "起泡器",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": true,
    "keywords": [
      "起泡器",
      "模具"
    ],
    "title": "起泡器模具试模组装后效果较差",
    "problem": "起泡器模具试模组装后效果较差",
    "cause": "水经过分水件的射流小孔后不聚集成一束细长水柱，水分散到气道，影响进气混合",
    "solution": "分水件射流小孔上方增加一片300目过滤网，缓冲水流，水流再经过小孔后分散现象改善，微气泡效果提升明显",
    "prevention": "1、经过射流小孔前的流道不建议突变，影响水流动能\n2、射流小孔设计为直孔，进水侧加倒角",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB027",
    "category": "结构",
    "subCategory": "卡扣",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "卡扣",
      "龙头"
    ],
    "title": "龙头机水锤测试卡扣断裂",
    "problem": "龙头机水锤测试卡扣断裂",
    "cause": "1.卡扣钩爪连接部位未倒R角，熔接线在受力部位\n2.卡扣强度不足，扣合面积小，同水压条件下承受力更大，导致卡扣断裂脱出",
    "solution": "1.加胶增加卡扣长度（8*2.8mm→8*5.4mm）,增加卡扣厚度\n2.装配顺序改变，先将机械臂卡入主体，主体外再套不锈钢件，利用不锈钢限制卡扣向外撑开\n3.主体部分的卡扣材料由ABS改为PC/ABS合金料，增强卡扣强度",
    "prevention": "1、环套卡扣避免熔接线在钩爪受力部位，进胶口应远离卡扣\n2、环套卡扣支撑悬臂的横切面积设计为不一样，调整模流汇合位置\n3、有承压要求的卡扣扣合量0.7-1.2mm，基于强度要求甚至更大",
    "tags": [
      "净饮",
      "结构"
    ]
  },
  {
    "id": "KB028",
    "category": "水形",
    "subCategory": "起泡器",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "起泡器",
      "出水"
    ],
    "title": "起泡器出水孔出水水柱偏心往中间聚",
    "problem": "起泡器出水孔出水水柱偏心往中间聚",
    "cause": "脱模时顶针顶出力不平衡，顶针聚集在出水孔内侧，外侧无顶针，导致脱模时孔轻微变形",
    "solution": "减少出水件厚度，减小脱模力，增加顶针",
    "prevention": "1、出水孔初始时可设计为轻微外斜或锥孔+直孔形式\n2、模具设计时考虑顶出平衡问题",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB029",
    "category": "装配",
    "subCategory": "焊接",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "焊接",
      "超声波",
      "塑料"
    ],
    "title": "超声波焊接后塑料件偏位",
    "problem": "超声波焊接后塑料件偏位",
    "cause": "超声波焊接出的定位不足",
    "solution": "改模增加定位筋",
    "prevention": "前期应手板验证定位强度是否够，放置超声波焊接时因震动导致偏位",
    "tags": [
      "净饮",
      "装配"
    ]
  },
  {
    "id": "KB030",
    "category": "可靠性",
    "subCategory": "旋钮",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "旋钮"
    ],
    "title": "旋钮反方向旋转时变形",
    "problem": "旋钮反方向旋转时变形",
    "cause": "旋钮配合限位的筋位太长，抗扭转强度不足",
    "solution": "增加加强筋及激光镭雕文字说明旋钮转动位置",
    "prevention": "设计初期考虑非正常使用情况，旋钮不在限定范围内转动，提前增加其他限位结构或增强抗扭转强度",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB031",
    "category": "液位管",
    "subCategory": "浮球",
    "productLine": "净饮",
    "year": "2024",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "浮球",
      "浮子",
      "连通器"
    ],
    "title": "连通器采用322圆柱浮子不易卡住",
    "problem": "连通器采用322圆柱浮子不易卡住",
    "cause": "重心稳定，密度均匀，接触面积大，不易侧翻",
    "solution": "未记录详细解决方案",
    "prevention": "后面项目开发中建议使用此类似浮子",
    "tags": [
      "净饮",
      "液位管"
    ]
  },
  {
    "id": "KB032",
    "category": "体验",
    "subCategory": "冰胆",
    "productLine": "净饮",
    "year": "2024",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "冰胆",
      "出水"
    ],
    "title": "322首次出冷水需要出一段空气，且出冷水之后需要用户去关闭出水",
    "problem": "322首次出冷水需要出一段空气，且出冷水之后需要用户去关闭出水",
    "cause": "未设置合理方式进行程序优化，造成操作繁琐",
    "solution": "1.水泵空抽与抽水电流不一样，可以检测电流关闭出水\n2.可以增加一个电极去检测出水，有水到管道之后关闭掉持续出水",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "体验"
    ]
  },
  {
    "id": "KB033",
    "category": "漏水",
    "subCategory": "单项阀",
    "productLine": "净饮",
    "year": "2024",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "单项阀"
    ],
    "title": "660台净原水箱取出后，机器废水口渗水；",
    "problem": "660台净原水箱取出后，机器废水口渗水；",
    "cause": "废水口单向阀预压力不够",
    "solution": "零压单向阀更换为10K顶开的单向阀；",
    "prevention": "截止低压水路需要选用弹簧力度较大的逆止阀，预防低压渗漏",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB034",
    "category": "液位管",
    "subCategory": "水位",
    "productLine": "净饮",
    "year": "2024",
    "author": "胡饶峰",
    "isDesignSpec": true,
    "keywords": [
      "水位"
    ],
    "title": "台净550平台纯水壶水制不满和一次不能抽完水",
    "problem": "台净550平台纯水壶水制不满和一次不能抽完水",
    "cause": "水壶只有一个出水口，出水口通过连接座同时连接水泵和连通器，连接座在出水口和水泵口没有做节流面差异，水泵抽吸水时连通器水位升降速度比水壶快；",
    "solution": "连接座把水口孔分成两半，一半连接连通器，一半连接水泵；",
    "prevention": "单出水孔连接水泵和连通器的情况下，要么增大连接座容纳足量的水，确保水泵先抽连接座内的水；要么连通器与水壶出水口更靠近，避免水泵抽连通器的水；",
    "tags": [
      "净饮",
      "液位管"
    ]
  },
  {
    "id": "KB035",
    "category": "异味",
    "subCategory": "硅胶管",
    "productLine": "净饮",
    "year": "2024",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "硅胶管",
      "加热",
      "异味",
      "加热体"
    ],
    "title": "台净550平台异味，水汽分离盒和加热体一端取消不了",
    "problem": "台净550平台异味，水汽分离盒和加热体一端取消不了",
    "cause": "水汽分离盒与加热体连接距离较短，没有预留接头位置；水汽分离盒与加热体装配基准不一样，采用硬连接装配公差较大，容易漏水，同时跌落已损坏；",
    "solution": "更换公司食品接触硅胶材料（新安化工K2800-55Z），采用铂金硫化；，免硅胶设计；",
    "prevention": "设计时加热体与水汽分离盒采用固定连接，水汽分离盒与加热体安装在同一个支架上；",
    "tags": [
      "净饮",
      "异味"
    ]
  },
  {
    "id": "KB036",
    "category": "异味",
    "subCategory": "硅胶管",
    "productLine": "净饮",
    "year": "2024",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "硅胶管",
      "异味"
    ],
    "title": "台净660冰水异味",
    "problem": "台净660冰水异味",
    "cause": "冰胆排水管和排水堵头硅胶异味",
    "solution": "更换公司食品接触硅胶材料（新安化工K2800-55Z），采用铂金硫化；",
    "prevention": "接触冰水的硅胶件也要管控材料和生产工艺，最好是免硅胶设计",
    "tags": [
      "净饮",
      "异味"
    ]
  },
  {
    "id": "KB037",
    "category": "漏水",
    "subCategory": "压力表",
    "productLine": "净饮",
    "year": "2024",
    "author": "章佳奇",
    "isDesignSpec": true,
    "keywords": [
      "压力表",
      "漏水",
      "压力",
      "超滤"
    ],
    "title": "超滤机压力表水锤漏水",
    "problem": "超滤机压力表水锤漏水",
    "cause": "弹性元件强度不足，耐疲劳性差",
    "solution": "1.弹性元件材质铜牌号6-2改为8-02\n2.表盘量程10公斤改为16公斤",
    "prevention": "1.含铜率提高可增强元件耐疲劳性\n2.行业测试标准和九阳标准冲突时，可以从应用场景入手突破，例如压力表（10公斤）水锤九阳水压10公斤，行业8公斤；压力表（16公斤）水锤九阳水压10公斤，行业12公斤；因为九阳10公斤是基于整机水锤10公斤测试要求，而行业是基于量程的75%",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB038",
    "category": "滤芯",
    "subCategory": "流量",
    "productLine": "净饮",
    "year": "2024",
    "author": "章佳奇",
    "isDesignSpec": false,
    "keywords": [
      "流量",
      "流速",
      "超滤"
    ],
    "title": "超滤机流速衰减严重",
    "problem": "超滤机流速衰减严重",
    "cause": "滤芯堵塞",
    "solution": "1.超滤膜膜面积增加到0.5m2\n2.颗粒炭指定厂家浦士达\n3.PP精度增加，克重从40g增加到60g",
    "prevention": "1.超滤膜堵塞为流速衰减的主要原因\n2.造成超滤膜堵塞的原因主要有两点，一是水中杂质，二是前置颗粒炭渗碳\n3.减轻渗碳的方法主要有两种，一是提升颗粒炭品质，二是提升PP精度以阻止渗碳",
    "tags": [
      "净饮",
      "滤芯"
    ]
  },
  {
    "id": "KB039",
    "category": "漏水",
    "subCategory": "水锤",
    "productLine": "净饮",
    "year": "2024",
    "author": "章佳奇",
    "isDesignSpec": false,
    "keywords": [
      "水锤",
      "漏水",
      "超滤"
    ],
    "title": "超滤机整机水锤漏水",
    "problem": "超滤机整机水锤漏水",
    "cause": "密封不足",
    "solution": "1.密封圈硬度由70°改为58°\n2.产线增加扭力扳手二次紧固工序",
    "prevention": "1.径向密封效果好于轴向密封，密封圈硬度不宜过大\n2.密封过程增加限位为最优",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB040",
    "category": "串水",
    "subCategory": "起泡器",
    "productLine": "净饮",
    "year": "2024",
    "author": "章佳奇",
    "isDesignSpec": false,
    "keywords": [
      "起泡器"
    ],
    "title": "起泡器串水",
    "problem": "起泡器串水",
    "cause": "水从微气泡水通道进入进气通道",
    "solution": "1.出水孔为锥孔或待倒角\n2.进气通道设置在喉部",
    "prevention": "1.保持微气泡水在出喉部时不发散\n2.进气通道远离气液混合区",
    "tags": [
      "净饮",
      "串水"
    ]
  },
  {
    "id": "KB041",
    "category": "装配",
    "subCategory": "原水箱",
    "productLine": "净饮",
    "year": "2024",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "原水箱"
    ],
    "title": "1.原水箱磁铁槽内装磁铁崩开\n2.磁铁表面生锈",
    "problem": "1.原水箱磁铁槽内装磁铁崩开\n2.磁铁表面生锈",
    "cause": "1.干涉有点多，造成应力崩开\n2.磁铁吸附铁锈造成",
    "solution": "1.减胶，不产生干涉\n2.UV胶浇灌固定",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "装配"
    ]
  },
  {
    "id": "KB042",
    "category": "水形",
    "subCategory": "水嘴",
    "productLine": "净饮",
    "year": "2024",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "水嘴",
      "出水"
    ],
    "title": "330出水分叉及即饮机出水分叉",
    "problem": "330出水分叉及即饮机出水分叉",
    "cause": "出水嘴出水无法聚拢",
    "solution": "水嘴装饰盖要做收口结构，且与出水嘴边缘的间隙设置在1-2mm之间，保证出水柔和，且不分叉",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB043",
    "category": "水温",
    "subCategory": "热罐",
    "productLine": "净水",
    "year": "2024",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "热罐",
      "保温",
      "不锈钢"
    ],
    "title": "不锈钢保温胆保温性能不足",
    "problem": "不锈钢保温胆保温性能不足",
    "cause": "1、水温过高至90-97℃\n2、保温棉厚度不够",
    "solution": "1、采用高密度发泡保温材料，保温棉厚度至少10mm以上\n2、采用发泡形式保温",
    "prevention": "1、对于高温液体的保温需要预留保温有效保温间隙",
    "tags": [
      "净水",
      "水温"
    ]
  },
  {
    "id": "KB044",
    "category": "可靠性",
    "subCategory": "冰胆",
    "productLine": "净饮",
    "year": "2024",
    "author": "李刚灵",
    "isDesignSpec": true,
    "keywords": [
      "冰胆",
      "制冷",
      "螺丝"
    ],
    "title": "台净660平台冰胆制冷片螺丝，预压不紧失效",
    "problem": "台净660平台冰胆制冷片螺丝，预压不紧失效",
    "cause": "1.止未受力设置在隔热垫上，设计部合理 2.制冷片无定位导致螺丝容易打滑",
    "solution": "1.冰但箱设置止未，隔热垫闭环处理，螺丝过紧也不会破坏制冷片 2.用隔热片增加定位限制制冷片，解决螺丝容易打滑的问题；",
    "prevention": "设计之前通过尺寸链计算，给关键配件设置合理公差；",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB045",
    "category": "滤芯",
    "subCategory": "流量",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": true,
    "keywords": [
      "流量",
      "滤芯",
      "龙头",
      "水压"
    ],
    "title": "龙头机低水压经陶瓷滤芯过滤的净水水型差",
    "problem": "龙头机低水压经陶瓷滤芯过滤的净水水型差",
    "cause": "出水孔面积过大，经陶瓷滤芯过滤后流量减小，无法形成射流水柱",
    "solution": "出水孔孔径由24*Φ1.65mm改为24*Φ1.2mm\n出水孔面积由51mm²改为27mm²",
    "prevention": "花洒水出水孔的孔径0.8-1.2mm水形较好\n过陶瓷滤芯的出水孔面积25mm²-35mm²水形较好",
    "tags": [
      "净饮",
      "滤芯"
    ]
  },
  {
    "id": "KB046",
    "category": "漏水",
    "subCategory": "水嘴",
    "productLine": "净饮",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": true,
    "keywords": [
      "水嘴",
      "出水",
      "茶吧"
    ],
    "title": "茶吧机左侧出水暂停右侧会滴一滴水",
    "problem": "茶吧机左侧出水暂停右侧会滴一滴水",
    "cause": "水锤原理，e=1/2m△v²，进水管管径越小 流速越大产生的动能越大，水泵停止后，对水路惯性越明显，e=1/2m△v²=mgh,水的惯性最终由水路上升做功抵消",
    "solution": "进水管管径由4改为6.5跟管路中的管径增大即可以明显改善管路",
    "prevention": "进水管管径＞6mm",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB047",
    "category": "材料",
    "subCategory": "玻璃",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "玻璃",
      "变色"
    ],
    "title": "珠光白玻璃高温变色",
    "problem": "珠光白玻璃高温变色",
    "cause": "珠光白玻璃里面增加了光油，光油与硅酮胶再60℃以上环境反应会发黄",
    "solution": "硅酮胶需选型（大域厂家目前导入完成）无异常\n使用双面胶粘玻璃",
    "prevention": "带光油的玻璃优选双面胶的方案、或者使用大域厂家的硅酮胶",
    "tags": [
      "饮水",
      "材料"
    ]
  },
  {
    "id": "KB048",
    "category": "装配",
    "subCategory": "丝印",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "丝印"
    ],
    "title": "隔空防溢板子丝印偏位（失败案例）",
    "problem": "隔空防溢板子丝印偏位（失败案例）",
    "cause": "出水嘴的开孔定位、底盘的螺钉柱、NTC的过孔定位都会影响装配的误差，丝印只能参考出水嘴的开孔定位，整个尺寸链有一个误差都会导致丝印偏差",
    "solution": "手柄固定孔、水壶底座的固定孔都要改成腰型孔，防止误差后调整",
    "prevention": "隔空防溢遮丑方案不要使用丝印的方案，生产一致性难控制，改方案暂无解决方案",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB049",
    "category": "显示模块",
    "subCategory": "显示",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "显示"
    ],
    "title": "奶油白色的显示玻璃透光有晕光",
    "problem": "奶油白色的显示玻璃透光有晕光",
    "cause": "白色的玻璃背面都是白底，光线会产生晕光",
    "solution": "控制透光区域的透光度，数码管的亮度要根据实际透光效果来调整，数码管与玻璃有间距会导致显示模糊，要保证贴合",
    "prevention": "白色系的显示玻璃，数码管的支架优选PPO，次选HIPS，保证支架不能变形、凹陷",
    "tags": [
      "饮水",
      "显示模块"
    ]
  },
  {
    "id": "KB050",
    "category": "显示模块",
    "subCategory": "显示",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "显示"
    ],
    "title": "白色系的显示玻璃透光显示效果",
    "problem": "白色系的显示玻璃透光显示效果",
    "cause": "图标四周暗，中间明显亮",
    "solution": "φ20mm左右的图标需要使用两个灯珠，灯珠与显示玻璃距离保证在8-10mm之间才能保证整个透光效果",
    "prevention": "φ20mm左右的图标需要使用两个灯珠，显示板支架与玻璃距离保证在8-10mm之间",
    "tags": [
      "饮水",
      "显示模块"
    ]
  },
  {
    "id": "KB051",
    "category": "装配",
    "subCategory": "手柄",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "手柄"
    ],
    "title": "曲面玻璃配合的手柄与玻璃间隙大，一致性差",
    "problem": "曲面玻璃配合的手柄与玻璃间隙大，一致性差",
    "cause": "玻璃弧面生产时有误差，手柄设计时未增加预变形，曲面的手柄注塑后会回弹",
    "solution": "手柄设计时要增加与变形及玻璃弧面的误差，曲面的手柄设计回弹的筋拉住，与玻璃贴个的面要做倒角，不然强拉还是会产线间隙。",
    "prevention": "手柄设计增加预变形、增加筋防止回弹、贴合玻璃面设计成倒角",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB052",
    "category": "装配",
    "subCategory": "手柄",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "手柄",
      "装配"
    ],
    "title": "手柄与手柄盖装配后手握住会咯吱咯吱响",
    "problem": "手柄与手柄盖装配后手握住会咯吱咯吱响",
    "cause": "手柄壁厚太薄（1.9mm）设计未设计反止口，强度不够且没有反止口，大力握住会导致手柄盖塌陷产生咯吱声",
    "solution": "手柄主壁厚增加至2.2mm，增加反止口",
    "prevention": "手柄壁厚设计2.2mm，手柄与手柄盖需设计反止口",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB053",
    "category": "装配",
    "subCategory": "水嘴",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "水嘴",
      "出水"
    ],
    "title": "水壶出水嘴会旋转，影响高水位电极检测",
    "problem": "水壶出水嘴会旋转，影响高水位电极检测",
    "cause": "玻璃杯体开孔只能是圆形孔，水嘴圆柱形穿过孔位与手柄螺母/卡扣锁定，无法限位",
    "solution": "手柄过孔及水嘴进水端设计成六角或四角，防止转动",
    "prevention": "手柄过孔及水嘴进水端设计成六角或四角",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB054",
    "category": "装配",
    "subCategory": "丝印",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "丝印"
    ],
    "title": "玻璃面板童锁键与橙环不居中，且漏灯珠",
    "problem": "玻璃面板童锁键与橙环不居中，且漏灯珠",
    "cause": "1.玻璃面板上有橙环，童锁图标再膜片上，膜片员工粘贴时会偏，导致偏位 \n2.童锁丝印再玻璃面板上，黑波背面没有印刷白色底漆",
    "solution": "1.橙环与童锁图标丝印再玻璃上，膜片改为全透（全透局域减小），膜片有偏位不会影响童锁偏位\n2.童锁轮廓镂空还是需要丝印白色底漆",
    "prevention": "橙环与童锁图标丝印再玻璃上，童锁轮廓镂空还是需要丝印白色底漆",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB055",
    "category": "装配",
    "subCategory": "侧板",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "侧板"
    ],
    "title": "侧板按压会凹陷回弹、钣金压型会变形",
    "problem": "侧板按压会凹陷回弹、钣金压型会变形",
    "cause": "钣金厚度小（4-5mm）成型后会受应力变形",
    "solution": "增加压型",
    "prevention": "压型深度：1mm以上，压型越多变形量会越小",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB056",
    "category": "装配",
    "subCategory": "结构",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "结构"
    ],
    "title": "上门与下门间隙不均匀",
    "problem": "上门与下门间隙不均匀",
    "cause": "上门下坠",
    "solution": "上门胶片加宽，上下框底部增加筋位，关门时筋位与门铰片挤压会让上门回正",
    "prevention": "上门胶片加宽，上下框底部增加筋位，防止上门下坠",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB057",
    "category": "滤芯",
    "subCategory": "去除率",
    "productLine": "净饮",
    "year": "2025",
    "author": "马明阳/冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "去除率",
      "滤芯",
      "龙头"
    ],
    "title": "龙头机2号陶瓷滤芯浊度去除＞5NTU",
    "problem": "龙头机2号陶瓷滤芯浊度去除＞5NTU",
    "cause": "2号陶瓷过滤精度不足",
    "solution": "增加陶瓷精度或改4号陶瓷",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "滤芯"
    ]
  },
  {
    "id": "KB058",
    "category": "安规",
    "subCategory": "耐电压",
    "productLine": "净水",
    "year": "2025",
    "author": "马明阳",
    "isDesignSpec": true,
    "keywords": [
      "耐电压"
    ],
    "title": "热小净耐压1800V耐压不合格",
    "problem": "热小净耐压1800V耐压不合格",
    "cause": "耐压整机测试不合格",
    "solution": "GB/T 4706.1-2005基本绝缘：\n额定电压 ≤ 130V → 1000V\n130V < 额定电压 ≤ 250V → 1250V\n额定电压 > 250V → 1000V + 2倍额定电压\n加强绝缘或双重绝缘：测试电压为基本绝缘的1.6倍（例如，250V设备需施加2000V）。",
    "prevention": "整机1500V 5mA 3S",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB059",
    "category": "装配",
    "subCategory": "C卡",
    "productLine": "净水",
    "year": "2025",
    "author": "马明阳",
    "isDesignSpec": true,
    "keywords": [
      "C卡",
      "龙头",
      "PE管"
    ],
    "title": "龙头PE管脱落",
    "problem": "龙头PE管脱落",
    "cause": "pe管上下旋转松脱",
    "solution": "改C卡，2分t1.5，3分t1.8",
    "prevention": "改C卡，2分t1.5，3分t1.8",
    "tags": [
      "净水",
      "装配"
    ]
  },
  {
    "id": "KB060",
    "category": "制冷系统",
    "subCategory": "散热",
    "productLine": "饮水",
    "year": "2025",
    "author": "张德知",
    "isDesignSpec": true,
    "keywords": [
      "散热"
    ],
    "title": "以子弹冰9颗为例：制冰量小，系统稳定后克重小于40g",
    "problem": "以子弹冰9颗为例：制冰量小，系统稳定后克重小于40g",
    "cause": "蒸发器温度高，冷凝器散热量不够",
    "solution": "1.优选风扇吹冷凝器散热；\n2.吸风式散热通过提升风扇转速提升散热量；\n3.预留足够风道；",
    "prevention": "1.蒸发器温度控制在在（-15，-20）℃之间；\n2.优选风扇吹冷凝器散热；\n3.吸风式散热通过提升风扇转速提升散热量；\n4.吸风结构冷凝器背部保持10mm风道距离；",
    "tags": [
      "饮水",
      "制冷系统"
    ]
  },
  {
    "id": "KB062",
    "category": "装配",
    "subCategory": "背板",
    "productLine": "饮水",
    "year": "2025",
    "author": "张德知",
    "isDesignSpec": true,
    "keywords": [
      "背板",
      "跌落"
    ],
    "title": "跌落后背板与顶盖配合处脱出",
    "problem": "跌落后背板与顶盖配合处脱出",
    "cause": "后背板与顶盖配合插入深度过浅",
    "solution": "1.贴近插入处做压型增加强度；",
    "prevention": "1.插入深度≥5mm；\n2.增加压型，提升强度；",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB063",
    "category": "装配",
    "subCategory": "靠背",
    "productLine": "饮水",
    "year": "2025",
    "author": "张德知",
    "isDesignSpec": false,
    "keywords": [
      "靠背"
    ],
    "title": "靠背晃动量大",
    "problem": "靠背晃动量大",
    "cause": "1.顶盖与靠背配合过盈量小；\n2.顶盖插槽后部钢性小；",
    "solution": "1.通过配合筋位增加过盈量；\n2.增加顶盖后部壁厚增加钢性；",
    "prevention": "1.靠背与顶盖交叉对插增加插入量提升钢性；\n2.顶盖后部壁厚不小于2.5mm；\n3.插销导向加大，便于插入；",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB064",
    "category": "装配",
    "subCategory": "卡扣",
    "productLine": "净水",
    "year": "2025",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "卡扣"
    ],
    "title": "装饰前盖拆卸手感差",
    "problem": "装饰前盖拆卸手感差",
    "cause": "装配卡扣非活卡结构",
    "solution": "改成导向性卡扣结构",
    "prevention": "可拆卸活动件结构与装配结构不同，需增加弹性导向 结构",
    "tags": [
      "净水",
      "装配"
    ]
  },
  {
    "id": "KB065",
    "category": "装配",
    "subCategory": "硅胶套",
    "productLine": "净水",
    "year": "2025",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "硅胶套",
      "装配",
      "硅胶"
    ],
    "title": "固定硅胶套不好装配",
    "problem": "固定硅胶套不好装配",
    "cause": "1、过盈结构量较大，不易压缩\n2、拉拔的结构不够厚实",
    "solution": "加强拉拔结构，并增加导向性",
    "prevention": "硅胶固定设计需根据硅胶实际特性设计",
    "tags": [
      "净水",
      "装配"
    ]
  },
  {
    "id": "KB066",
    "category": "滤芯",
    "subCategory": "去除率",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "去除率",
      "滤芯"
    ],
    "title": "亚东2号陶瓷滤芯余氯去除率小于40%不合格",
    "problem": "亚东2号陶瓷滤芯余氯去除率小于40%不合格",
    "cause": "滤芯端盖内的颗粒活性炭填充量不足，水流过时吸附率低",
    "solution": "端盖内的颗粒活性炭重量由3.3g增加至4g",
    "prevention": "端盖内的颗粒活性炭在不影响胶粘和超声焊接前提下尽量填满，总颗粒活性炭重量不变，减少陶瓷内装填的颗粒活性炭重量",
    "tags": [
      "净饮",
      "滤芯"
    ]
  },
  {
    "id": "KB067",
    "category": "装配",
    "subCategory": "热罐",
    "productLine": "净水",
    "year": "2025",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "热罐",
      "保温",
      "装配"
    ],
    "title": "R3U保温胆装配塑胶上盖装配困难",
    "problem": "R3U保温胆装配塑胶上盖装配困难",
    "cause": "不锈钢胆的开口变形严重",
    "solution": "1、增压钢印减少变形\n2、增加支撑架，拉回变形尺寸",
    "prevention": "成型的五金件需要加强结构支撑，尽量接近设计尺寸，避免安装装配困难",
    "tags": [
      "净水",
      "装配"
    ]
  },
  {
    "id": "KB068",
    "category": "体验",
    "subCategory": "结构",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "结构"
    ],
    "title": "旋钮手感紧",
    "problem": "旋钮手感紧",
    "cause": "密封圈与塑料件接触面积大，双O设计",
    "solution": "双O改单O",
    "prevention": "密封圈采用动密封的压缩率10-15%，设计时内径应尽可能小，龙头机旋钮处基本不承压，单O设计即可满足",
    "tags": [
      "净饮",
      "体验"
    ]
  },
  {
    "id": "KB069",
    "category": "显示模块",
    "subCategory": "结构",
    "productLine": "饮水",
    "year": "2025",
    "author": "彭旭阳",
    "isDesignSpec": false,
    "keywords": [
      "结构",
      "显示",
      "UV"
    ],
    "title": "UV打印显示模糊",
    "problem": "UV打印显示模糊",
    "cause": "1.UV打印颗粒度过大\n2.数码管距离玻璃距离过大",
    "solution": "1.UV打印喷嘴调整为细颗粒度\n2.改模减少玻璃与数码管的距离",
    "prevention": "设计时要考虑到双面胶厚度，将数码管与玻璃间隙留至0.2mm左右",
    "tags": [
      "饮水",
      "显示模块"
    ]
  },
  {
    "id": "KB070",
    "category": "可靠性",
    "subCategory": "结构",
    "productLine": "净饮",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "结构",
      "漏水"
    ],
    "title": "RC350水锤测试1.8万次时漏水",
    "problem": "RC350水锤测试1.8万次时漏水",
    "cause": "1、支架壁厚不足且根部为尖角\n2、供应商处有2副模具，发错了模具",
    "solution": "1、供应商协调更换模具",
    "prevention": "样品确认时不够细致，新送样品与选品时的样品不一致",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB071",
    "category": "可靠性",
    "subCategory": "密封",
    "productLine": "净饮",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "密封",
      "漏水"
    ],
    "title": "RC350冷热冲击测试后耐压漏水",
    "problem": "RC350冷热冲击测试后耐压漏水",
    "cause": "1、支架密封槽合模线处飞边大; \n2、滤瓶密封面粗糙;\n3、密封圈存在飞边，缺胶",
    "solution": "1、支架模具配模、调工艺；\n2、滤瓶模具修模（抛光）；\n3、密封圈来料依据封样管控飞边及缺胶",
    "prevention": "1、密封面合模线断差不可超过0.04mm（直径上不可超过0.1mm）\n2、密封面模具抛光等级不可低于A2",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB072",
    "category": "体验",
    "subCategory": "水壶",
    "productLine": "净饮",
    "year": "2025",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "水壶",
      "出水"
    ],
    "title": "水壶倒水卡顿，有概率倒不出水",
    "problem": "水壶倒水卡顿，有概率倒不出水",
    "cause": "水壶没有设计大气通口",
    "solution": "水壶盖增加透气口",
    "prevention": "水壶或类似储水容器设计时要考虑大气压平衡",
    "tags": [
      "净饮",
      "体验"
    ]
  },
  {
    "id": "KB073",
    "category": "滤芯",
    "subCategory": "流量",
    "productLine": "净水",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "流量",
      "RO",
      "水效"
    ],
    "title": "JYW-RO1500水效测试不合格",
    "problem": "JYW-RO1500水效测试不合格",
    "cause": "前置滤芯未加阻垢，美硕0.42MPa 1000CC废水阀钢针为U形，结垢堵塞，流量有1000mL/min衰减至500mL/min",
    "solution": "改换科博的0.42MPa 800CC废水阀，钢制为直线型，更短",
    "prevention": "未沉淀规范",
    "tags": [
      "净水",
      "滤芯"
    ]
  },
  {
    "id": "KB074",
    "category": "外接设备",
    "subCategory": "前置",
    "productLine": "净水",
    "year": "2025",
    "author": "马明阳",
    "isDesignSpec": false,
    "keywords": [
      "前置",
      "出水"
    ],
    "title": "R5大前置不出水",
    "problem": "R5大前置不出水",
    "cause": "止水阀芯结构断裂",
    "solution": "增加壁厚0.9-1.5mm，圆角0.3",
    "prevention": "功能件强壮的设计",
    "tags": [
      "净水",
      "外接设备"
    ]
  },
  {
    "id": "KB075",
    "category": "噪音",
    "subCategory": "噪音",
    "productLine": "净水",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "噪音"
    ],
    "title": "台湾机上电冲洗噪音偏大",
    "problem": "台湾机上电冲洗噪音偏大",
    "cause": "增压泵24V全开，进水阀、废水阀打开，水流急，整体噪音偏大；同时废水管脉冲大，管子震动，易从下水道跳出，造成地面淹水",
    "solution": "调整程序，上电冲洗、连续制水20次冲洗、三天无人取水冲洗等，增压泵降压到20V，降低冲洗噪音，已验证，效果明显",
    "prevention": "净水机强制冲洗状态下，增压泵可降压到20V，降低噪音",
    "tags": [
      "净水",
      "噪音"
    ]
  },
  {
    "id": "KB076",
    "category": "工艺",
    "subCategory": "丝印",
    "productLine": "净水",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "丝印",
      "工艺"
    ],
    "title": "台湾机前盖烫印logo有中文九阳，与工艺文件不符合，造成中批备料损失",
    "problem": "台湾机前盖烫印logo有中文九阳，与工艺文件不符合，造成中批备料损失",
    "cause": "内销机logo一直是英文+中文组合，大家惯性思维，过程中都未注意到这个变化点，海外同事前期参与度不够，也未发觉",
    "solution": "前盖用洗网水去除logo与橙环，二次整体喷漆，再烫印logo，按最终工艺文件",
    "prevention": "新品类，新渠道的差异点要全方位重视、审核，要求海外同时前期审核全面，技术资料需一一核对",
    "tags": [
      "净水",
      "工艺"
    ]
  },
  {
    "id": "KB077",
    "category": "漏水",
    "subCategory": "漏水",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "漏水",
      "出水",
      "龙头"
    ],
    "title": "R1U烧水时龙头出水口滴水",
    "problem": "R1U烧水时龙头出水口滴水",
    "cause": "1、热水出水电磁阀膜片卡异物导致漏水\n2、零压电磁阀锥形弹簧装歪\n3、零压电磁阀膜片鼓包\n4、热水电磁阀膜片用错成非耐热款",
    "solution": "1、热水出水电磁阀前端增加滤网\n2、气检0.001-0.003MPa，泄露值<10Pa",
    "prevention": "电磁阀前端若有产生异物的风险源，需加滤网",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB078",
    "category": "漏水",
    "subCategory": "电磁阀",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "电磁阀"
    ],
    "title": "R3U内循环时排气口滴水",
    "problem": "R3U内循环时排气口滴水",
    "cause": "补水泵出水阀片卡异物导致反向止水失效",
    "solution": "1、补水泵进水前端增加滤网\n2、跟泵厂确认，目前在用泵无法确保满足低压反向止水功能",
    "prevention": "普通隔膜泵反向低压有渗水风险，无法当作反向止水功能使用",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB079",
    "category": "异味",
    "subCategory": "异味",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "异味",
      "塑料"
    ],
    "title": "R3U热罐塑料上盖有异味",
    "problem": "R3U热罐塑料上盖有异味",
    "cause": "材质问题",
    "solution": "可选用：\n韩国晓星POK-K990 NC（国内代理商沃德夫）（收缩率约1.5%）\n研一PPS+GF40（收缩率约0.2%）\n塞拉尼斯PPS（异味不稳定）",
    "prevention": "耐高温、无异味、低成本塑料材质优选POK",
    "tags": [
      "净水",
      "异味"
    ]
  },
  {
    "id": "KB080",
    "category": "漏水",
    "subCategory": "接头",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "接头",
      "漏水",
      "泵",
      "出水",
      "PP"
    ],
    "title": "R1U热泵出水口耐热PP三分弯通运输断裂导致漏水",
    "problem": "R1U热泵出水口耐热PP三分弯通运输断裂导致漏水",
    "cause": "1、此接头运输时会受摇摆力，导致断裂\n2、鼎辰PP耐热接头壁厚设计不均，导致注塑多有气孔",
    "solution": "改用中荷耐热接头，材质POK",
    "prevention": "目前中荷耐热POK接头价格与鼎辰相近，鼎辰耐热PP接头气孔无法完全避免，建议后续开发优选中荷接头",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB081",
    "category": "噪音",
    "subCategory": "噪音",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "噪音"
    ],
    "title": "R3U噪音大",
    "problem": "R3U噪音大",
    "cause": "大流速需大泵，且需多泵同出，导致噪音大",
    "solution": "1、按流速需求降低隔膜泵占空比\n2、机器补水、冲洗等后台工作时，降低增压泵占空比至21V",
    "prevention": "机器不使用时，若进行补水、循环、冲洗等工作，需降低占空比低噪音运行",
    "tags": [
      "净水",
      "噪音"
    ]
  },
  {
    "id": "KB082",
    "category": "漏水",
    "subCategory": "密封",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "密封"
    ],
    "title": "R3U热罐上盖密封不良",
    "problem": "R3U热罐上盖密封不良",
    "cause": "水位电极方案，由于不锈钢罐开口大，壁厚薄，变形严重，导致装配密封不良",
    "solution": "1、改用浮球方案\n2、若用电极方案，热罐上盖开口要小，采用径向密封",
    "prevention": "热罐采用水位电极检测方案时，上盖密封设计：需先由不锈钢上盖再转接塑料内衬，水位电极固定在塑料内衬上，密封优选径向密封",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB083",
    "category": "可靠性",
    "subCategory": "焊接",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "焊接",
      "漏水",
      "塑料"
    ],
    "title": "塑料纯水箱超声焊接不良漏水",
    "problem": "塑料纯水箱超声焊接不良漏水",
    "cause": "PP塑料水箱变形严重，而且需焊接面尺寸过大，超声焊接无法保证完全密封",
    "solution": "改为诱导焊接",
    "prevention": "大尺寸塑料水箱若有密封要求，建议优选诱导焊",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB084",
    "category": "材料",
    "subCategory": "水路板",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "水路板",
      "泵",
      "水泵",
      "开裂"
    ],
    "title": "R3U热水泵水路板开裂",
    "problem": "R3U热水泵水路板开裂",
    "cause": "耐高温PP水路板安装时长期受力导致开裂",
    "solution": "材质改POK",
    "prevention": "耐高温无异味塑料材质首选POK",
    "tags": [
      "净水",
      "材料"
    ]
  },
  {
    "id": "KB085",
    "category": "加热体",
    "subCategory": "加热体",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "加热体"
    ],
    "title": "发热管设计选型",
    "problem": "发热管设计选型",
    "cause": "管表负荷、管口绝缘要求、管口封胶要求等",
    "solution": "未记录详细解决方案",
    "prevention": "1.管表面热负荷＜11W/cm²\n2.管口发热丝距离边缘爬电距离需＞4mm，或加瓷珠绝缘\n3.发热管冷态耐压要求1500V/1min/5mA\n4.管口加密封胶避免内部受潮\n5.以水为介质，氧化镁粉建议优选中高温粉\n6.选用高温粉时，管口需用环氧树脂封胶",
    "tags": [
      "净水",
      "加热体"
    ]
  },
  {
    "id": "KB086",
    "category": "液位管",
    "subCategory": "浮球",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "浮球"
    ],
    "title": "浮球设计选型",
    "problem": "浮球设计选型",
    "cause": "PP发泡浮子、PP注塑浮子耐高温要求",
    "solution": "未记录详细解决方案",
    "prevention": "1.水温≤60℃可使用PP发泡浮子\n2.60℃~85℃水温需使用不锈钢中心杆，浮子材质可采用注塑PP\n3.水温＞85℃，浮球需使用全不锈钢材质",
    "tags": [
      "净水",
      "液位管"
    ]
  },
  {
    "id": "KB087",
    "category": "可靠性",
    "subCategory": "C卡",
    "productLine": "净水",
    "year": "2025",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "C卡",
      "龙头",
      "PE管"
    ],
    "title": "龙头PE管脱出",
    "problem": "龙头PE管脱出",
    "cause": "快接口卡爪与免焊端盖间设计安装间隙大、C卡厚度不够",
    "solution": "1、减小卡爪与免焊端盖间间隙\n2、改用更厚的C卡",
    "prevention": "快接插口用于旋转部位时，必须满足以下要求\n1.三分C卡厚度：1.8±0.05；插入PE管后，向外拉紧PE管，卡爪与免焊端盖间隙应≤1.9\n2.2.5分C卡厚度：1.7±0.05；插入PE管后，向外拉紧PE管，卡爪与免焊端盖间隙应≤1.8\n3.2分管C卡厚度：1.5",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB088",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净饮",
    "year": "2025",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "水形"
    ],
    "title": "330出常温水水形有分叉",
    "problem": "330出常温水水形有分叉",
    "cause": "1.水嘴盖孔的锥度与出水嘴中间杆的锥度相反\n2.水嘴内部排气孔的锥度与中间出水杆相反",
    "solution": "方案：\n增加滤网，使水形汇聚",
    "prevention": "1.所有出水相关的锥度都要利于水形汇聚",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB089",
    "category": "漏水",
    "subCategory": "液位管",
    "productLine": "净饮",
    "year": "2025",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "液位管",
      "水嘴",
      "出水"
    ],
    "title": "330纯水壶快满的时候，提起纯水壶，出水嘴出水口出水",
    "problem": "330纯水壶快满的时候，提起纯水壶，出水嘴出水口出水",
    "cause": "连通器高水位太高，且无缓冲区，导致纯水壶提起时候，冲洗渗透过来的水全部进入连通器，导致水位上升，从出水孔流出",
    "solution": "1.连通器与出水嘴连接管路之间增加缓冲腔体，让冲洗渗透过去的水暂存，等水位下降，再倒流回连通器\n2.联通器的高水位上方预留冲洗水量空间，当纯水壶提起时候，液位有上升缓冲余地",
    "prevention": "设计时候注意此现象，根据现象修改图纸",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB090",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净饮",
    "year": "2025",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "水形"
    ],
    "title": "330纯水壶提壶滴水",
    "problem": "330纯水壶提壶滴水",
    "cause": "1.纯水箱材质使用ABS\n2.阀芯底部空隙太大，水的张力撑不住\n3.纯水壶底部阀芯处空腔太大",
    "solution": "1.阀芯底部增加筋，减小缝隙\n2.更换圈数更多的弹簧，减小底部空腔",
    "prevention": "采用新结构，在纯水壶体最底部封水，杜绝漏水",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB091",
    "category": "安规",
    "subCategory": "加热体",
    "productLine": "净饮",
    "year": "2025",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "加热体",
      "加热"
    ],
    "title": "660加热体上方挡水件使用吸塑材质降本",
    "problem": "660加热体上方挡水件使用吸塑材质降本",
    "cause": "未记录详细根因",
    "solution": "硅胶材质更改为PE吸塑",
    "prevention": "后续降本设计可以推广",
    "tags": [
      "净饮",
      "安规"
    ]
  },
  {
    "id": "KB092",
    "category": "漏水",
    "subCategory": "工序",
    "productLine": "净水",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "工序",
      "漏水",
      "保温",
      "不锈钢"
    ],
    "title": "609s保温管底部不锈钢接头处漏水",
    "problem": "609s保温管底部不锈钢接头处漏水",
    "cause": "该漏水处为罐底部，接头是否插到位，很难直观判断",
    "solution": "优化装配工序，罐装配前优先插好接头，同时增加回拉工序，增加C卡，保证接头插到位，卡爪入槽，然后再整个罐整体装配，同时外部增加扎带固定接头，防松脱",
    "prevention": "不易观察的接头装配处，要优先装配好，能直观判断是否插到位，调整装配工序",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB093",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净饮",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "水形",
      "龙头"
    ],
    "title": "RC130/龙头净水器关闭滴水",
    "problem": "RC130/龙头净水器关闭滴水",
    "cause": "过滤腔室的进水口和出水口均在腔室下方，当通水时腔室内部的空气无法完全排出且被压缩，当进水关闭时这些受压空气的压力释放导致腔室内的水流出",
    "solution": "1、增加一个排气阀（结构参考单向阀）\n2、将出水口位置抬高，使腔室内空气能完全排出",
    "prevention": "出水口开放状态下，过滤腔室内不可憋气，否则关闭时会滴水",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB094",
    "category": "流量",
    "subCategory": "流量",
    "productLine": "净水",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "流量",
      "流速"
    ],
    "title": "直播道具流量对比模块最大流速仅3.1Lpm，不满足要求的7Lpm",
    "problem": "直播道具流量对比模块最大流速仅3.1Lpm，不满足要求的7Lpm",
    "cause": "1、叶轮泵出水流量受扬程影响过大\n2、管路限流\n3、龙头阀芯限流",
    "solution": "1、并联小隔膜泵（并未采用此方案）\n2、管路由3分管改为4分管\n3、龙头开孔（阀芯失效）",
    "prevention": "叶轮泵出水流量受出水管路和扬程的影响非常大",
    "tags": [
      "净水",
      "流量"
    ]
  },
  {
    "id": "KB095",
    "category": "装配",
    "subCategory": "",
    "productLine": "净水",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [],
    "title": "直播道具冷热水胆安装困难",
    "problem": "直播道具冷热水胆安装困难",
    "cause": "冷热水胆支架变形，螺钉孔偏位",
    "solution": "水胆安装螺钉孔改为腰型孔",
    "prevention": "钣金件设计时要考虑到其变形导致的安装困难，螺钉孔的形状要做变通",
    "tags": [
      "净水",
      "装配"
    ]
  },
  {
    "id": "KB096",
    "category": "安规",
    "subCategory": "钣金",
    "productLine": "净水",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "钣金"
    ],
    "title": "直播道具钣金尖角存在风险",
    "problem": "直播道具钣金尖角存在风险",
    "cause": "钣金尖角",
    "solution": "1、增加翻边\n2、增加护角",
    "prevention": "钣金设计不仅要考虑到单零件的尖角规避还要考虑到组装后的尖角规避",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB097",
    "category": "安规",
    "subCategory": "散热",
    "productLine": "净水",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "散热",
      "温控"
    ],
    "title": "直播道具预热过程中温控器多次跳断",
    "problem": "直播道具预热过程中温控器多次跳断",
    "cause": "预热时间长（约30min），散热不及时",
    "solution": "1、降低预热温度\n2、降低预热功率\n3、柜体上加热体位置增加散热孔\n4、增加风扇",
    "prevention": "加热系统设计时要考虑到散热问题，条件允许的话增加散热风扇",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB098",
    "category": "可靠性",
    "subCategory": "单向阀",
    "productLine": "净水",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "单向阀"
    ],
    "title": "直播道具净化效果演示模块原水位不下降",
    "problem": "直播道具净化效果演示模块原水位不下降",
    "cause": "单向阀堵塞",
    "solution": "更换单向阀",
    "prevention": "未沉淀规范",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB099",
    "category": "漏水",
    "subCategory": "热罐",
    "productLine": "净水",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "热罐",
      "龙头"
    ],
    "title": "直播道具R3龙头出冷水时冷水胆溢水",
    "problem": "直播道具R3龙头出冷水时冷水胆溢水",
    "cause": "1、电磁阀反向不止水\n2、龙头出水嘴处冷热混水，通过出水阀回窜至储水胆内\n3、增压泵启动条件未与胆内上浮球关联",
    "solution": "1、调整程序，将增压泵启动与胆内上浮球信号变化关联，浮球断开时增压泵才启动\n2、电磁阀反向安装",
    "prevention": "未沉淀规范",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB100",
    "category": "结构",
    "subCategory": "卡扣",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "卡扣"
    ],
    "title": "JYW-RT60微气泡水模式水锤测试卡扣断裂",
    "problem": "JYW-RT60微气泡水模式水锤测试卡扣断裂",
    "cause": "1、起泡器的微气泡模式由于需要高速水流，龙头净水器内部压力高于花洒水模式；\n2、熔接痕位于卡扣中部受力位置，卡扣结构承受循环应力强度不足",
    "solution": "1、结构上增强卡扣强度，\n2、材料上由ABS、ABS/PC改为ABS+20%GF",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "结构"
    ]
  },
  {
    "id": "KB101",
    "category": "材料",
    "subCategory": "底座",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "底座",
      "密封",
      "滤芯",
      "材料",
      "ABS",
      "缩水"
    ],
    "title": "JYW-RT60滤芯座改ABS+20%GF材料在密封面存在缩水",
    "problem": "JYW-RT60滤芯座改ABS+20%GF材料在密封面存在缩水",
    "cause": "ABS+GF为供应商自行拌料，经材料分析为熔融指数较低，流动性不足引起",
    "solution": "改换金发GFABS-20料",
    "prevention": "ABS、ABS/PC料试模均无缩水，ABS+GF试模时存在缩水首先分析排除结构问题，其次考虑分析材料物性，对比差异",
    "tags": [
      "净饮",
      "材料"
    ]
  },
  {
    "id": "KB102",
    "category": "程序",
    "subCategory": "程序逻辑",
    "productLine": "净水",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "程序逻辑",
      "滤芯",
      "程序",
      "RO",
      "寿命"
    ],
    "title": "JYW-RO1500小中批程序一致性测试时滤芯寿命加速断电后RO滤芯寿命重置",
    "problem": "JYW-RO1500小中批程序一致性测试时滤芯寿命加速断电后RO滤芯寿命重置",
    "cause": "程序源码分析为PCB滤芯带有滤芯寿命记忆功能，RO滤芯无记忆功能，断电后会重置寿命",
    "solution": "程序逻辑修改，增加RO滤芯记忆功能",
    "prevention": "未沉淀规范",
    "tags": [
      "净水",
      "程序"
    ]
  },
  {
    "id": "KB103",
    "category": "卫生安全",
    "subCategory": "龙头",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "龙头"
    ],
    "title": "金龙龙头荧光测试时阀芯为粉红色",
    "problem": "金龙龙头荧光测试时阀芯为粉红色",
    "cause": "单独数显荧光测试显示不含荧光，呈粉红色原因为陶瓷片出厂前经品红溶液浸泡（陶瓷片厂家通用检验标准），以此挑选出表面有裂痕等缺陷的陶瓷片，经过浸泡后的陶瓷片在紫外光下会有反射现象，表面呈现粉红色。",
    "solution": "陶瓷片提供rohs，卫生安全报告",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "卫生安全"
    ]
  },
  {
    "id": "KB104",
    "category": "包装防护",
    "subCategory": "纸箱",
    "productLine": "净水",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "纸箱",
      "RO"
    ],
    "title": "JYW-RO1500纸箱胶带起翘",
    "problem": "JYW-RO1500纸箱胶带起翘",
    "cause": "龙头包装盒尺寸不合理，将外箱折页顶起，导致胶带起翘",
    "solution": "临时方案：改为工字型+打包带封箱，增加侧边胶带长度\n长期方案：更改龙头包装盒尺寸",
    "prevention": "包材设计时不影响排版前提下预留胶带封箱距离尽可能长，≥70mm",
    "tags": [
      "净水",
      "包装防护"
    ]
  },
  {
    "id": "KB105",
    "category": "装配",
    "subCategory": "不锈钢外壳",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "不锈钢外壳",
      "滤芯"
    ],
    "title": "JYW-RT60高温存储后滤芯座主体和外壳晃动",
    "problem": "JYW-RT60高温存储后滤芯座主体和外壳晃动",
    "cause": "不锈钢外壳和滤芯座主体为过盈强配，组装时多余材料被不锈钢外壳切割掉，实际过盈量不足，材料受温度影响，尺寸有变化",
    "solution": "1、不锈钢倒角，避免切割塑胶材料\n2、不锈钢外壳组装前增加点胶（胶水型号V300HB）工序",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "装配"
    ]
  },
  {
    "id": "KB106",
    "category": "结构",
    "subCategory": "旋钮",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "旋钮",
      "异响"
    ],
    "title": "JYW-RT60旋钮切换净原水时有异响",
    "problem": "JYW-RT60旋钮切换净原水时有异响",
    "cause": "阀芯浇口有残留，切换水源时与转盘新增加的限位筋摩擦导致",
    "solution": "临时方案：修剪浇口残留料头\n长期方案：浇口改为缺口进胶",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "结构"
    ]
  },
  {
    "id": "KB107",
    "category": "结构",
    "subCategory": "旋钮",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "旋钮"
    ],
    "title": "JYW-RT60切换净原水时阀芯不回弹",
    "problem": "JYW-RT60切换净原水时阀芯不回弹",
    "cause": "旋钮带动转盘切换时，中心位置的阀芯因受力方向缺少限位，导致阀芯偏位无法回弹",
    "solution": "转盘上增加一圈竖筋，用于限制阀芯偏位",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "结构"
    ]
  },
  {
    "id": "KB108",
    "category": "漏水",
    "subCategory": "密封",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "密封"
    ],
    "title": "即饮机JYW-WJ260水箱密封不良",
    "problem": "即饮机JYW-WJ260水箱密封不良",
    "cause": "水箱密封结构采用圆形平垫密封圈密封。当弹簧力过大或者过小，或者密封圈变形都会造成水箱漏水现象",
    "solution": "采用全包半圆形结构，同时采用筋跟水箱密封",
    "prevention": "未沉淀规范",
    "tags": [
      "饮水",
      "漏水"
    ]
  },
  {
    "id": "KB109",
    "category": "显示",
    "subCategory": "显示",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "显示"
    ],
    "title": "即饮机JYW-WJ260显示面板显示发黄",
    "problem": "即饮机JYW-WJ260显示面板显示发黄",
    "cause": "整机外观为奶油白， 显示区域需要全息，白灯透过奶油白字体就会发黄，而且浅色系全息印刷会存在明显套位问题，造型显示效果差",
    "solution": "整机为浅色系，显示窗口简易是黑色才能保证全息效果跟显示效果",
    "prevention": "未沉淀规范",
    "tags": [
      "饮水",
      "显示"
    ]
  },
  {
    "id": "KB110",
    "category": "装配",
    "subCategory": "靠背",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "靠背",
      "茶吧"
    ],
    "title": "茶吧机760靠背安装后靠背晃动",
    "problem": "茶吧机760靠背安装后靠背晃动",
    "cause": "对插处采用面配合，塑件变形导致存在间隙",
    "solution": "用筋配合替代面配合，而且后期调整方便",
    "prevention": "未沉淀规范",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB111",
    "category": "滤芯",
    "subCategory": "TDS",
    "productLine": "净水",
    "year": "2025",
    "author": "胡祥建",
    "isDesignSpec": true,
    "keywords": [
      "TDS"
    ],
    "title": "恶劣水质初始TDS值高",
    "problem": "恶劣水质初始TDS值高",
    "cause": "膜表面渗透作用",
    "solution": "增加强冲洗电控板",
    "prevention": "0陈水沉淀积累，不同系统的不同冲洗程序",
    "tags": [
      "净水",
      "滤芯"
    ]
  },
  {
    "id": "KB112",
    "category": "滤芯",
    "subCategory": "去除率",
    "productLine": "净饮",
    "year": "2025",
    "author": "胡祥建",
    "isDesignSpec": true,
    "keywords": [
      "去除率",
      "龙头"
    ],
    "title": "龙头机余氯去除效果差",
    "problem": "龙头机余氯去除效果差",
    "cause": "炭装填问题，出现偏流情况",
    "solution": "紧密装填颗粒碳、增加底部端盖容积",
    "prevention": "龙头净水器滤芯设计规范",
    "tags": [
      "净饮",
      "滤芯"
    ]
  },
  {
    "id": "KB113",
    "category": "异味",
    "subCategory": "异味",
    "productLine": "净水",
    "year": "2025",
    "author": "胡祥建",
    "isDesignSpec": false,
    "keywords": [
      "异味"
    ],
    "title": "净热产品冷水异味",
    "problem": "净热产品冷水异味",
    "cause": "冷水异味：高温厌氧环境下的代谢产物",
    "solution": "增加冲洗程序、回流程序",
    "prevention": "系统设计积累",
    "tags": [
      "净水",
      "异味"
    ]
  },
  {
    "id": "KB114",
    "category": "异味",
    "subCategory": "异味",
    "productLine": "净水",
    "year": "2025",
    "author": "胡祥建",
    "isDesignSpec": false,
    "keywords": [
      "异味"
    ],
    "title": "净热产品热水异味",
    "problem": "净热产品热水异味",
    "cause": "塑料件释放",
    "solution": "特别恶劣地区增加热水除异味后置组件",
    "prevention": "售后组件",
    "tags": [
      "净水",
      "异味"
    ]
  },
  {
    "id": "KB115",
    "category": "滤芯",
    "subCategory": "堵塞",
    "productLine": "净水",
    "year": "2025",
    "author": "胡祥建",
    "isDesignSpec": false,
    "keywords": [
      "堵塞",
      "膜"
    ],
    "title": "恶劣地区堵膜现象（济宁）",
    "problem": "恶劣地区堵膜现象（济宁）",
    "cause": "水质差、碱度高",
    "solution": "增加阻垢组件、冲洗电控程序",
    "prevention": "售后阻垢组件、冲洗电控板用于指导恶劣地区",
    "tags": [
      "净水",
      "滤芯"
    ]
  },
  {
    "id": "KB116",
    "category": "水形",
    "subCategory": "水嘴",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "水嘴",
      "出水"
    ],
    "title": "水嘴出水偏、水型散",
    "problem": "水嘴出水偏、水型散",
    "cause": "水嘴进出水管径一致，结构及模具设计问题",
    "solution": "1.出水嘴内径4mm≤A≤6mm；出水口管路直径＜进水口直径。\n2.设计时对接的司筒针要成对齐，出水口的司筒针要顶住进水口的司筒针。",
    "prevention": "1.出水嘴内径4mm≤A≤6mm；出水口管路直径＜进水口直径。\n2.设计时对接的司筒针要成对齐，出水口的司筒针要顶住进水口的司筒针。",
    "tags": [
      "饮水",
      "水形"
    ]
  },
  {
    "id": "KB117",
    "category": "水形",
    "subCategory": "水嘴",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": true,
    "keywords": [
      "水嘴",
      "出水"
    ],
    "title": "水壶出水嘴水型分散",
    "problem": "水壶出水嘴水型分散",
    "cause": "出水嘴孔径4mm，大于耦合器管路内径，导致分散",
    "solution": "减小出水嘴管路内径至2.8mm，管径不能过小，会影响流量",
    "prevention": "出水嘴内径4mm≤A≤6mm；2.8mm≤A≤3mm。（影响水型）",
    "tags": [
      "饮水",
      "水形"
    ]
  },
  {
    "id": "KB118",
    "category": "安规",
    "subCategory": "横档",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "横档",
      "安规"
    ],
    "title": "横档锐边割手，安规不符",
    "problem": "横档锐边割手，安规不符",
    "cause": "1、双轨道两边间隙过大＞15mm，测试指插入内部导致划伤\n2、采用剪板机，会导致始终有一边会有毛刺\n3、弯折角度＜90°，设计时90°，会回弹",
    "solution": "1、横档截面设计成双隧道结构，将螺钉隐藏在隧道内，整体宽度≥35mm；双轨道两边间隙＜5mm\n2、优选锐边做砂光抛光处理；次选落料模倒扣朝下不做倒角工艺（毛刺边朝内），杜绝剪板机。\n3、弯折角度＞100°",
    "prevention": "1、横档截面设计成双隧道结构，将螺钉隐藏在隧道内，整体宽度≥35mm；双轨道两边间隙＜5mm\n2、优选锐边做砂光抛光处理；次选落料模倒扣朝下不做倒角工艺（毛刺边朝内），杜绝剪板机。\n3、弯折角度＞100°",
    "tags": [
      "饮水",
      "安规"
    ]
  },
  {
    "id": "KB119",
    "category": "体验",
    "subCategory": "门框",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "门框"
    ],
    "title": "门吸力不够",
    "problem": "门吸力不够",
    "cause": "减震垫与侧板过盈量过大，超过1.0mm，间隙超过越大，吸力越小，间隙与吸力成指数变化",
    "solution": "硅胶减震垫设计不少于2个，减震垫与侧板过盈量1.0mm≤A≤2.0mm；1mm≤A≤0.5mm。",
    "prevention": "硅胶减震垫设计不少于2个，减震垫与侧板过盈量1.0mm≤A≤2.0mm；1mm≤A≤0.5mm。",
    "tags": [
      "饮水",
      "体验"
    ]
  },
  {
    "id": "KB120",
    "category": "显示",
    "subCategory": "显示",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "显示"
    ],
    "title": "灯光透光效果差",
    "problem": "灯光透光效果差",
    "cause": "市场部需要全息效果，需要将玻璃改为半透（采用白底），第一次使用灰色层，然后白底",
    "solution": "覆盖层必须是黑色，中间镂空",
    "prevention": "灰色系的第一次灰色，覆盖层必须为黑色中间镂空",
    "tags": [
      "饮水",
      "显示"
    ]
  },
  {
    "id": "KB121",
    "category": "装配",
    "subCategory": "靠背",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "靠背"
    ],
    "title": "靠背中间部分插接不到位，有间隙",
    "problem": "靠背中间部分插接不到位，有间隙",
    "cause": "中间过盈的筋无固定作用，且易变形，导致插接不进靠背中，导致产生间隙",
    "solution": "将中间筋取消",
    "prevention": "设计时减小筋的过瘾量，加横向筋加强，防止变形",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB122",
    "category": "显示",
    "subCategory": "显示",
    "productLine": "饮水",
    "year": "2025",
    "author": "马明阳/张德知",
    "isDesignSpec": true,
    "keywords": [
      "显示"
    ],
    "title": "制冰即饮5370显示窜光",
    "problem": "制冰即饮5370显示窜光",
    "cause": "888设计壁厚0.5mm导致注塑打不满",
    "solution": "改模加厚为1mm",
    "prevention": "设计审核不足，薄壁最小壁厚≥1mm",
    "tags": [
      "饮水",
      "显示"
    ]
  },
  {
    "id": "KB123",
    "category": "可靠性",
    "subCategory": "遥控",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": true,
    "keywords": [
      "遥控",
      "显示"
    ],
    "title": "显示面板倾斜角度过大的遥控接受不良",
    "problem": "显示面板倾斜角度过大的遥控接受不良",
    "cause": "接收头偏，显示遮光件视窗挡住接收头",
    "solution": "调整接收头视窗尺寸",
    "prevention": "对于倾斜较大的显示，需要将视窗加长",
    "tags": [
      "饮水",
      "可靠性"
    ]
  },
  {
    "id": "KB124",
    "category": "可靠性",
    "subCategory": "遥控",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "遥控"
    ],
    "title": "遥控器接收不良",
    "problem": "遥控器接收不良",
    "cause": "半透黑玻璃影响红外感应",
    "solution": "显示膜片使用感光油墨",
    "prevention": "显示玻璃如果是半透黑的设计，膜片必须使用感光油墨",
    "tags": [
      "饮水",
      "可靠性"
    ]
  },
  {
    "id": "KB125",
    "category": "显示",
    "subCategory": "显示",
    "productLine": "饮水",
    "year": "2025",
    "author": "王启军",
    "isDesignSpec": false,
    "keywords": [
      "显示"
    ],
    "title": "WH780显示图标不够亮",
    "problem": "WH780显示图标不够亮",
    "cause": "图标过大，灯珠设计时功率受限，无法调大功率",
    "solution": "采用PC+扩散白油墨，增加显示亮度",
    "prevention": "图标超过18mm，需要使用PC+扩散白",
    "tags": [
      "饮水",
      "显示"
    ]
  },
  {
    "id": "KB126",
    "category": "装配",
    "subCategory": "玻璃",
    "productLine": "饮水",
    "year": "2025",
    "author": "马明阳/张德知",
    "isDesignSpec": false,
    "keywords": [
      "玻璃"
    ],
    "title": "630玻璃黏贴溢胶",
    "problem": "630玻璃黏贴溢胶",
    "cause": "溢胶至内部",
    "solution": "改3M",
    "prevention": "溢胶槽的设计未按设计规范",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB127",
    "category": "可靠性",
    "subCategory": "C卡",
    "productLine": "净水",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "C卡",
      "龙头",
      "PE管"
    ],
    "title": "R5P龙头PE管脱出，大前置管线机堵头脱出",
    "problem": "R5P龙头PE管脱出，大前置管线机堵头脱出",
    "cause": "水路板接头使用了鼎展的压圈和中荷的卡爪，匹配性不佳",
    "solution": "更换鼎展卡爪，且使用厚度合适的C卡",
    "prevention": "水路板压圈与卡爪需配套，且C卡厚度要合适，两分建议1.3-1.5mm厚，三分建议1.5-1.8mm厚",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB128",
    "category": "体验",
    "subCategory": "体验",
    "productLine": "净饮",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "体验"
    ],
    "title": "台净原水箱提手在内部，接水手提后，脏水落在水箱内",
    "problem": "台净原水箱提手在内部，接水手提后，脏水落在水箱内",
    "cause": "提手在内部，水箱上部没有遮挡",
    "solution": "提手可以设计在外部，水箱顶部增加透明盖，侧面设计可旋转或伸缩的接水口",
    "prevention": "提手不应该与水箱内部直接接触，防止脏污掉落",
    "tags": [
      "净饮",
      "体验"
    ]
  },
  {
    "id": "KB129",
    "category": "材料",
    "subCategory": "材料",
    "productLine": "净水",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "材料"
    ],
    "title": "R7503科博废水阀中心杆断裂",
    "problem": "R7503科博废水阀中心杆断裂",
    "cause": "POM料应力开裂，高浓度水环境影响",
    "solution": "POM料改用PP+20玻纤料",
    "prevention": "1、废水阀中心杆需采用PP料\n2、涉水承压件水路板/电磁阀尽量选用PP料，POM注意退火处理",
    "tags": [
      "净水",
      "材料"
    ]
  },
  {
    "id": "KB130",
    "category": "外观",
    "subCategory": "外观",
    "productLine": "净水",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "外观"
    ],
    "title": "外观件喷漆覆盖缺陷，一致性差",
    "problem": "外观件喷漆覆盖缺陷，一致性差",
    "cause": "漆为油性漆，调漆要求高，易不均匀，覆盖效果差",
    "solution": "改用水性漆，用水稀释配比，覆盖效果好",
    "prevention": "外观件喷漆覆盖缺陷，采用水性漆，一致性高",
    "tags": [
      "净水",
      "外观"
    ]
  },
  {
    "id": "KB131",
    "category": "漏水",
    "subCategory": "耦合器",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "耦合器",
      "漏水"
    ],
    "title": "耦合器漏水",
    "problem": "耦合器漏水",
    "cause": "下耦合器中间顶杆顶钢柱过程中，因为上耦合器孔过大导致封水硅胶受固定支架挤压，出现封水硅胶位置不居中与侧面塑胶产生轻微变形，钢珠偶尔没有完全复位于封水位置，出现漏水",
    "solution": "1、加大弹簧复位力度，弹簧由原 11.5mm 调整为 13mm，包容钢珠偶尔不能复位情况；\n2、同时将 D1 极导电环外露孔径由原 8.4mm 调整为 6.6mm，保护硅胶受外力挤压程度，规避变形漏\n水现象。",
    "prevention": "耦合器设计规范，上耦合器孔要完全保护硅胶防止下耦合器顶杆顶到密封圈",
    "tags": [
      "饮水",
      "漏水"
    ]
  },
  {
    "id": "KB132",
    "category": "漏水",
    "subCategory": "水泵",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "水泵",
      "漏水",
      "泵"
    ],
    "title": "水泵漏水",
    "problem": "水泵漏水",
    "cause": "1.滤芯堵塞导致水泵负压增大2.水壶为水顶结构，背压大",
    "solution": "1.降流量，可以降低水泵负压，2.水壶改成物理顶杆结构可以降低背压",
    "prevention": "水泵选型过中，要考虑实际工况，水泵能否在实际工况中工作",
    "tags": [
      "饮水",
      "漏水"
    ]
  },
  {
    "id": "KB133",
    "category": "可靠性",
    "subCategory": "玻璃",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "玻璃",
      "显示"
    ],
    "title": "冷热冲击显示玻璃拉脱开",
    "problem": "冷热冲击显示玻璃拉脱开",
    "cause": "冷热冲击环境对双面胶抱紧力影响大容易从中间脱开",
    "solution": "四角打胶加固",
    "prevention": "玻璃用双面胶粘贴，四角点胶加固",
    "tags": [
      "饮水",
      "可靠性"
    ]
  },
  {
    "id": "KB134",
    "category": "装配",
    "subCategory": "靠背",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "靠背"
    ],
    "title": "靠背对插安装不到底",
    "problem": "靠背对插安装不到底",
    "cause": "对插结构上的加强筋尺寸过大导致 干涉",
    "solution": "筋位减胶",
    "prevention": "筋位设计上先有间隙，后期加胶容易，开始设计干涉，模具减胶难处理",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB135",
    "category": "显示模块",
    "subCategory": "导电油墨",
    "productLine": "饮水",
    "year": "2025",
    "author": "张德知",
    "isDesignSpec": true,
    "keywords": [
      "导电油墨"
    ],
    "title": "导电油墨触摸不良",
    "problem": "导电油墨触摸不良",
    "cause": "玻璃与面贴存在间隙",
    "solution": "采用0.5mm薄胶",
    "prevention": "1.采用导电油墨方案、面贴与显示玻璃设计0配；\n2.玻璃与显示支架采用双面胶压合，压合量计算进去；",
    "tags": [
      "饮水",
      "显示模块"
    ]
  },
  {
    "id": "KB136",
    "category": "装配",
    "subCategory": "玻璃",
    "productLine": "饮水",
    "year": "2025",
    "author": "张德知",
    "isDesignSpec": true,
    "keywords": [
      "玻璃"
    ],
    "title": "面板玻璃起翘脱落",
    "problem": "面板玻璃起翘脱落",
    "cause": "玻璃与前壳黏贴不到位起翘、前壳变形不平",
    "solution": "1.控制变形量；\n2.工装压合；\n3.0.8-1mm厚度双面胶；",
    "prevention": "1.结构设计时考虑变形量，黏贴双面胶处做加强防止变形不平；\n2.留黏胶宽度不小于12mm、预留打硅酮胶双重结构；",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB137",
    "category": "显示",
    "subCategory": "显示",
    "productLine": "饮水",
    "year": "2025",
    "author": "张德知",
    "isDesignSpec": true,
    "keywords": [
      "显示"
    ],
    "title": "全息8888对位串光",
    "problem": "全息8888对位串光",
    "cause": "面贴88显示与玻璃印刷88偏位、尺寸精准度无法控制",
    "solution": "1.导光件、面贴88筋位间距＞1mm；\n2.玻璃显示88单边小于显示面贴0.5mm以上；",
    "prevention": "1.导光件、面贴88筋位间距＞1mm；\n2.玻璃显示88单边小于显示面贴0.5mm以上；\n3.显示面贴与玻璃做0配；",
    "tags": [
      "饮水",
      "显示"
    ]
  },
  {
    "id": "KB138",
    "category": "结构",
    "subCategory": "耦合器",
    "productLine": "饮水",
    "year": "2025",
    "author": "张德知",
    "isDesignSpec": false,
    "keywords": [
      "耦合器",
      "进水"
    ],
    "title": "下进水耦合不良",
    "problem": "下进水耦合不良",
    "cause": "1.耦合器与底座装配干涉；\n2.拉空距离大；",
    "solution": "1.改模解决干涉；\n2.增加下耦合器垫片补偿轴向耦合量；",
    "prevention": "1.耦合器考虑多品牌装配结构及轴向旋转微调场景；\n2.耦合器拉空距离设置在1.5-2mm之间；",
    "tags": [
      "饮水",
      "结构"
    ]
  },
  {
    "id": "KB139",
    "category": "外接设备",
    "subCategory": "前置",
    "productLine": "净水",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "前置",
      "流量",
      "滤芯",
      "出水"
    ],
    "title": "RF690大前置滤芯出水流量小",
    "problem": "RF690大前置滤芯出水流量小",
    "cause": "滤芯出水口止水阀芯顶开行程偏短",
    "solution": "水路板出水口高度加高1mm",
    "prevention": "滤芯进出水口止水阀芯的顶开行程应≥3mm",
    "tags": [
      "净水",
      "外接设备"
    ]
  },
  {
    "id": "KB140",
    "category": "外接设备",
    "subCategory": "水盒子",
    "productLine": "净水",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": true,
    "keywords": [
      "水盒子",
      "龙头"
    ],
    "title": "水盒子测试时出现整机不停机、龙头水型射流问题",
    "problem": "水盒子测试时出现整机不停机、龙头水型射流问题",
    "cause": "1、冷水泵进出水腔室密封圈挤出漏水，管路压力无法使高压开关跳断\n2、电磁阀打开瞬间管路压力从出水口释放，导致一股水先射出",
    "solution": "1、用电信号替代压力信号控制整机启停，在水盒子、龙头、管线机之间加一条通讯转接线",
    "prevention": "1、达威小隔膜泵反向承压极限：0.7MPa\n2、2分PE管出水口高度每抬高1m，管路内底部背压增加0.01MPa\n3、膜前压与进水压力、通量为正相关关系，与滤芯使用时长为正相关关系；\n4、膜后压与进水压力、通量为正相关关系，与滤芯使用时长为负相关关系；",
    "tags": [
      "净水",
      "外接设备"
    ]
  },
  {
    "id": "KB141",
    "category": "装配",
    "subCategory": "门框",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "门框"
    ],
    "title": "门称与门框配合间隙大",
    "problem": "门称与门框配合间隙大",
    "cause": "PP缩水严重",
    "solution": "PP+20%的碳酸钙，同步热态尺寸敲定",
    "prevention": "1.PP（20%碳酸钙）851mm放置2天后，尺寸变为835.5左右，缩小尺寸5.5，收缩比例0.65%",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB142",
    "category": "外接设备",
    "subCategory": "管线机",
    "productLine": "饮水",
    "year": "2025",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "管线机",
      "RO"
    ],
    "title": "管线机AG3750接RO机补水时，RO机频繁启停",
    "problem": "管线机AG3750接RO机补水时，RO机频繁启停",
    "cause": "机械球阀为小孔结构，补水时管路背压大于RO机高压开关断开值",
    "solution": "机械球阀改为类似先导阀的膜片结构",
    "prevention": "管线机的机械球阀在选型时要考虑到管路背压，最好统一选先导式膜片结构",
    "tags": [
      "饮水",
      "外接设备"
    ]
  },
  {
    "id": "KB143",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净饮",
    "year": "2025",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "水形",
      "龙头",
      "体验"
    ],
    "title": "龙头机原水花洒汇聚，体验较差",
    "problem": "龙头机原水花洒汇聚，体验较差",
    "cause": "阀芯原水水量大，但原水出水口太小，水流冲击力太强，导致中间水流流速高，吸附侧边水流往中间靠拢",
    "solution": "增加一个挡水片，缓冲水流往四周散开，使得水流均匀充满整个腔体，保证水形均匀",
    "prevention": "龙头机阀芯原水出水孔口径至少5mm，且结构上需要设置缓冲结构，保证原水出水孔",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB144",
    "category": "体验",
    "subCategory": "体验",
    "productLine": "净饮",
    "year": "2025",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "体验"
    ],
    "title": "台净可增加冬季模式",
    "problem": "台净可增加冬季模式",
    "cause": "竞品分析优势学习（冬季常温水温度太低，出常温水时，可以适当开启加热体，使得水温达到25℃左右）",
    "solution": "电控逻辑增加此逻辑",
    "prevention": "（冬季常温水温度太低，出常温水时，可以适当开启加热体，使得水温达到25℃左右）",
    "tags": [
      "净饮",
      "体验"
    ]
  },
  {
    "id": "KB145",
    "category": "可靠性",
    "subCategory": "水嘴",
    "productLine": "净饮",
    "year": "2025",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "水嘴"
    ],
    "title": "680整机内部水汽分离盒取消",
    "problem": "680整机内部水汽分离盒取消",
    "cause": "内置水汽分离盒排气口与液位管连接，当水流量变大时候，有往液位管注水的风险，会导致液位管一直处于高水位，纯水壶有空抽干烧风险",
    "solution": "取消内置水汽分离盒，茶仓下部小水汽分离盒前端增加射流器结构，保证小水汽分离盒关水即停",
    "prevention": "采用射流器结构，可有效解决关闭滴水延迟，排气口漏水现象",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB146",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净饮",
    "year": "2025",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "水形"
    ],
    "title": "550平台纯水壶提壶滴水",
    "problem": "550平台纯水壶提壶滴水",
    "cause": "1.阀芯POM材质，疏水性太强\n2.过水通道太长，内部余水太多",
    "solution": "临时方案：阀芯材质更换为PA尼龙亲水性材料\n长期方案：纯水壶阀芯更改为底部封水结构",
    "prevention": "阀芯设计中\n1.过水通道尽量短\n2.阀芯材质更换为亲水性材质\n3.阀芯上部更改为底部封水结构",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB147",
    "category": "装配",
    "subCategory": "把手",
    "productLine": "饮水",
    "year": "2025",
    "author": "张德知",
    "isDesignSpec": true,
    "keywords": [
      "把手"
    ],
    "title": "玻璃水壶手柄匹配壶体",
    "problem": "玻璃水壶手柄匹配壶体",
    "cause": "玻璃尺寸偏差大手柄匹配不良",
    "solution": "1.手柄与玻璃实物匹配加胶调整",
    "prevention": "1.分型面下移2-3mm后期实物匹配防止披风产生外漏；",
    "tags": [
      "饮水",
      "装配"
    ]
  },
  {
    "id": "KB148",
    "category": "漏水",
    "subCategory": "密封",
    "productLine": "饮水",
    "year": "2025",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "密封",
      "茶吧"
    ],
    "title": "茶吧机靠背与头盖对插后水路密封不良",
    "problem": "茶吧机靠背与头盖对插后水路密封不良",
    "cause": "制造公差及配合因素造成上下水路转接头配合同轴度低，密封不良",
    "solution": "转接头可浮动设计，可小范围晃动，弥补误差",
    "prevention": "互插配合结构，具有高密封要求，可单侧设计浮动结构，弥补误差",
    "tags": [
      "饮水",
      "漏水"
    ]
  },
  {
    "id": "KB149",
    "category": "漏水",
    "subCategory": "密封",
    "productLine": "净饮",
    "year": "2025",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "密封",
      "漏水",
      "龙头"
    ],
    "title": "RT1815龙头机适配F22内螺纹接头时，龙头接口处出现漏水现象",
    "problem": "RT1815龙头机适配F22内螺纹接头时，龙头接口处出现漏水现象",
    "cause": "龙头螺纹长度4.3mm左右，实际接头端面到密封垫上表面距离4.8mm左右，密封垫未起作用",
    "solution": "新开一个密封垫，厚度由2.7加至3.2mm",
    "prevention": "龙头机新品开发时确认密封垫上端面与转接头端面距离按4.3±0.1mm管控",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB150",
    "category": "漏水",
    "subCategory": "密封",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "密封",
      "漏水",
      "密封圈"
    ],
    "title": "AJ3610水箱与整机适配密封圈漏水",
    "problem": "AJ3610水箱与整机适配密封圈漏水",
    "cause": "密封圈结构小，成品模成型不良结构",
    "solution": "加大密封结构设计，同时增加纵向密封量",
    "prevention": "水箱密封圈要先保证上方压缩量密封",
    "tags": [
      "饮水",
      "漏水"
    ]
  },
  {
    "id": "KB151",
    "category": "入库",
    "subCategory": "入库",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "入库"
    ],
    "title": "RF621/622入库时间较定义书要求（3/29）提前一天",
    "problem": "RF621/622入库时间较定义书要求（3/29）提前一天",
    "cause": "提前与驻代和PMC沟通送货时间，由PMC发起加急入库申请",
    "solution": "未记录详细解决方案",
    "prevention": "1、月底送货车辆较多（司机排队时间久），入库时间临近月底的话可提前与PMC沟通，由PMC发起加急入库申请",
    "tags": [
      "净水",
      "入库"
    ]
  },
  {
    "id": "KB152",
    "category": "水温",
    "subCategory": "水温",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": true,
    "keywords": [
      "水温",
      "温度",
      "出水"
    ],
    "title": "RF621开水档位出水温度不到90℃",
    "problem": "RF621开水档位出水温度不到90℃",
    "cause": "1、质量履历中异常项未充分闭环\n2、36V抽水泵与24V抽水泵流量特性存在差异，参照24V抽水泵来设定36V抽水泵的占空比不合理；\n3、抽水泵流量在经过一定时间的磨合后会出现一定程度的上升（不超过10%）",
    "solution": "1、下调抽水泵占空比极限为25%，先30%再27%最后25%渐次下调，避免流量骤变影响出水水型",
    "prevention": "1、补充程序版本变更记录表，并纳入测试及试产前的点检范畴；\n2、开发过程质量履历闭环证据充分确认；\n3、最小占空比应该根据抽水泵的流量-电压曲线来设定，同时要考虑到电机渡过磨合期之后的流量变化情况",
    "tags": [
      "净水",
      "水温"
    ]
  },
  {
    "id": "KB153",
    "category": "安规",
    "subCategory": "温控器",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": true,
    "keywords": [
      "温控器",
      "水温",
      "温控",
      "出水",
      "电压"
    ],
    "title": "高水温高电压（242V，30℃）下，RF621开水档位出水时15min内温控器发...",
    "problem": "高水温高电压（242V，30℃）下，RF621开水档位出水时15min内温控器发生跳断，恢复时出现喷气",
    "cause": "1、龙头筒体内空间较小且密闭，高水温高电压下散热效率低\n2、温控器跳断时未退出PID流程，抽水泵以最小占空比工作，流量小，当温控器恢复后出现喷气\n3、加热体工艺稳定性差，温控器的相对位置尺寸离散度高",
    "solution": "1、程序优化，当检测到进水温度高于25℃时，开水档位执行降功率程序（利用可控硅降低加热体的有效功率），减少发热\n2、程序优化，当检测到温控器跳断时立即退出PID流程，抽水泵以大占空比（开水档位正常工作时的占空比+10%）工作，待检测到温控器恢复后再进入PID流程\n3、重新细化加热体检验标准，执行双电全检流程",
    "prevention": "1、程序设计规范中增加PID流程需与温控器状态建立逻辑关联，当温控器跳断时应立即退出PID流程，以恒定大流量供水（防止温控器恢复时喷气），当温控器恢复后重新进入PID流程；\n2、测试大纲中增加高水温高电压下温控器跳断的要求；\n3、加热体安装环境的散热效果应纳入热小净设计规范",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB154",
    "category": "工艺",
    "subCategory": "丝印",
    "productLine": "净饮",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "丝印",
      "外观"
    ],
    "title": "RQ210/211的外观件丝印附着力测试NG",
    "problem": "RQ210/211的外观件丝印附着力测试NG",
    "cause": "丝印厂家为赶货下线后直接送至整机厂，油墨未经过风干",
    "solution": "放置24H后",
    "prevention": "1、美固的丝印件，必须经过24H的风干后方可投线\n2、来料检验丝印附着力并留档",
    "tags": [
      "净饮",
      "工艺"
    ]
  },
  {
    "id": "KB155",
    "category": "漏水",
    "subCategory": "密封",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "密封",
      "漏水"
    ],
    "title": "起泡器花洒水不漏水，切换微气泡水漏水，切换处密封垫改模多次无效果",
    "problem": "起泡器花洒水不漏水，切换微气泡水漏水，切换处密封垫改模多次无效果",
    "cause": "剖开发现切换处因拔模导致壁厚太薄0.5mm，出现了穿孔导致漏水",
    "solution": "薄壁处加筋0.7mm",
    "prevention": "拔模后再次检查壁厚情况",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB156",
    "category": "漏水",
    "subCategory": "接头",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "接头",
      "漏水",
      "龙头"
    ],
    "title": "龙头机螺纹连接处漏水",
    "problem": "龙头机螺纹连接处漏水",
    "cause": "用户龙头螺纹较短，导致不能完全压到密封垫",
    "solution": "密封垫加厚，密封垫表面到螺纹结束的距离控制在4.3mm",
    "prevention": "未沉淀规范",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB157",
    "category": "工艺",
    "subCategory": "电镀",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "电镀"
    ],
    "title": "旋钮电镀件镭雕始终发黑、发黄",
    "problem": "旋钮电镀件镭雕始终发黑、发黄",
    "cause": "镀层较薄，电镀后镭雕会将镀层熔掉，显示出的颜色与塑料件底色有关",
    "solution": "旋钮素色注塑由远航灰改为白色",
    "prevention": "卡扣设计过程中考虑产品测试条件，预留改模空间",
    "tags": [
      "净饮",
      "工艺"
    ]
  },
  {
    "id": "KB158",
    "category": "装配",
    "subCategory": "卡簧",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "卡簧"
    ],
    "title": "卡簧脱落",
    "problem": "卡簧脱落",
    "cause": "员工操作未进行一致管控，为追求效率，卡簧钳撑开过大导致卡簧塑性变形不回弹",
    "solution": "1、导入回弹性更好的65Mn材质卡簧（煮黑氧化防锈）\n2、卡簧钳增加限位块，固定最大撑开距离\n3、参考国标尺寸对卡簧槽进行微调\n4、每批次增加产前培训\n5、卡簧安装后增加内收工序（使用内收卡簧钳）和检验工序",
    "prevention": "1、作业指导书对关键工序的动作进行固化\n2、设计时借鉴国标或行业成熟结构",
    "tags": [
      "净饮",
      "装配"
    ]
  },
  {
    "id": "KB159",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净饮",
    "year": "2024",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "水形"
    ],
    "title": "起泡器花洒水水型不好，有部分孔的水柱外洒，需增加滤网改善水型",
    "problem": "起泡器花洒水水型不好，有部分孔的水柱外洒，需增加滤网改善水型",
    "cause": "起泡器在到出水孔前端的流道设有加强筋，加强筋对水进行分流，汇聚点处的水流不稳定，经过出水孔后出现外洒",
    "solution": "取消加强筋和滤网",
    "prevention": "花洒水前端流道保持稳定性，结构上不设置突变",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB160",
    "category": "漏水",
    "subCategory": "密封圈",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": true,
    "keywords": [
      "密封圈",
      "漏水"
    ],
    "title": "JYW-R200活塞腔体漏水失效",
    "problem": "JYW-R200活塞腔体漏水失效",
    "cause": "动密封配合面表面粗糙且为涂硅油润滑",
    "solution": "1、模具表面做高精抛光\n2、密封圈选用氟橡胶材质\n3、密封槽内涂硅油",
    "prevention": "1、动密封配合面要做高精抛光，SPI-A1级（镜面级）最好\n2、动密封处的密封圈最好选用耐磨性能好的材料，如NBR（丁腈橡胶）、SBR（丁苯橡胶），本案例鉴于产品使用环境的要求，并未选用上述材质\n3、动密封处必须要涂硅油润滑",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB161",
    "category": "漏水",
    "subCategory": "水泵",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "水泵",
      "漏水",
      "泵",
      "寿命"
    ],
    "title": "科博双逆止泵启动寿命测试漏水NG",
    "problem": "科博双逆止泵启动寿命测试漏水NG",
    "cause": "橡胶膜片的模具型腔局部腐蚀，导致膜片出现麻点，长时间运行后麻点处穿孔漏水",
    "solution": "1、橡胶模具型腔表面重新电镀\n2、膜片成型后增加拉伸检验动作\n3、膜片成型前橡胶原料增加筛分动作",
    "prevention": "1、由于橡胶原料具有腐蚀性，橡胶成型模具一定要定期点检保养，可要求厂家提供其橡胶模具的点检保养记录\n2、条件允许的话，橡胶原料在成型前要经过筛分，剔除大颗粒杂质或料粒",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB162",
    "category": "漏水",
    "subCategory": "密封圈",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "密封圈",
      "漏水",
      "密封"
    ],
    "title": "JYW-R200筒体底座密封处漏水",
    "problem": "JYW-R200筒体底座密封处漏水",
    "cause": "1、模具斜顶分型面处飞边明显，割伤密封圈\n2、密封圈拉伸率过低导致挤出漏水",
    "solution": "1、优化斜顶分型面的配模，消除飞边\n2、拉伸率加大至8%",
    "prevention": "1、密封圈安装过程中会经过的部位，一定不能存在飞边或其他尖锐特征\n2、拉伸率必须要在5-10%",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB163",
    "category": "卫生安全",
    "subCategory": "菌落",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "菌落"
    ],
    "title": "JYW-R200存储后菌落总数超标",
    "problem": "JYW-R200存储后菌落总数超标",
    "cause": "存储过程中细菌通过纯水出水口污染到RO膜后端",
    "solution": "1、增加消毒片，二次使用前增加消杀动作\n2、说明书中备注消杀操作的指导说明",
    "prevention": "未沉淀规范",
    "tags": [
      "净水",
      "卫生安全"
    ]
  },
  {
    "id": "KB164",
    "category": "卫生安全",
    "subCategory": "耗氧量",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "耗氧量"
    ],
    "title": "JYW-R200耗氧量测试NG",
    "problem": "JYW-R200耗氧量测试NG",
    "cause": "活性炭纤维（ACF）用量不足",
    "solution": "1、增大ACF用量\n2、降低回收率",
    "prevention": "1、条件允许的情况下可通过增加活性炭的用量来解决耗氧量NG问题\n2、延长原水通过活性炭的时间（降低流速或延长流道）有助于解决过滤性能不足的问题",
    "tags": [
      "净水",
      "卫生安全"
    ]
  },
  {
    "id": "KB165",
    "category": "可靠性",
    "subCategory": "螺纹",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "螺纹"
    ],
    "title": "JYW-R200废水调节功能失效率高",
    "problem": "JYW-R200废水调节功能失效率高",
    "cause": "废水调节轴模具上的螺纹为电火花加工，加工过程中电极损耗导致螺纹牙型偏大，滑牙",
    "solution": "重新做电极放电加工螺纹",
    "prevention": "当火花加工的量大时，要要求模具加工厂多做电极以应对电极损耗问题",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB166",
    "category": "工艺",
    "subCategory": "焊接",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "焊接"
    ],
    "title": "JYW-R200筒体表面在焊接时被压伤",
    "problem": "JYW-R200筒体表面在焊接时被压伤",
    "cause": "焊接工装在设计制作时未考虑到塑件的尺寸公差，当塑件尺寸在上限时出现卡涩拉伤",
    "solution": "调整工装尺寸",
    "prevention": "在设计及制作工装时，必须要考虑到塑件产品的尺寸公差",
    "tags": [
      "净水",
      "工艺"
    ]
  },
  {
    "id": "KB167",
    "category": "模具",
    "subCategory": "注塑",
    "productLine": "净水",
    "year": "2024",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "注塑",
      "结构",
      "模具"
    ],
    "title": "JYW-R200移模后发现模具强拉结构与德晋注塑机不匹配",
    "problem": "JYW-R200移模后发现模具强拉结构与德晋注塑机不匹配",
    "cause": "模具评审及试模过程中德晋生产负责人未能全程参与，导致信息传递不及时",
    "solution": "重新加工强拉杆后上机试模",
    "prevention": "在新品模具评审及试模过程中，一定要保证注塑件供应商的生产相关负责人或清楚自身注塑机台情况的人员在场，提前提出生产方的需求",
    "tags": [
      "净水",
      "模具"
    ]
  },
  {
    "id": "KB168",
    "category": "可靠性",
    "subCategory": "电磁阀",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "电磁阀",
      "漏水",
      "龙头"
    ],
    "title": "660s电磁阀关不严，造成内循环龙头漏水",
    "problem": "660s电磁阀关不严，造成内循环龙头漏水",
    "cause": "滤芯漏炭导致电磁阀卡炭",
    "solution": "纯水出口增加滤网，防止碳粉进入水路板，卡住电磁阀",
    "prevention": "水路板进水口增加滤网滤芯及整机检测做好防护及检验",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB169",
    "category": "滤芯",
    "subCategory": "流量",
    "productLine": "净水",
    "year": "2023",
    "author": "张慧玉",
    "isDesignSpec": false,
    "keywords": [
      "流量",
      "流速"
    ],
    "title": "RF690流速较小",
    "problem": "RF690流速较小",
    "cause": "未记录详细根因",
    "solution": "1.RO滤芯恒压台测试流速，≤流速下线时一般为膜面积问题；\n2.查看增压泵是否工作，若工作增压泵增压泵出水管拆下，接压力表和流速调节阀，调节阀门直至压力表读数与膜前压一致，测试此时流速，是否与规格书一致；\n3.查看供水压力",
    "prevention": "进水压力、增压泵、膜面积都会影响RO膜的制水流速，当初始流速未达到要求时，一般先看供水问题，再分析RO膜，再分析水路系统",
    "tags": [
      "净水",
      "滤芯"
    ]
  },
  {
    "id": "KB170",
    "category": "工艺",
    "subCategory": "电磁阀",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "电磁阀",
      "膜",
      "膜片"
    ],
    "title": "RF690电磁阀膜片翻导致封不住水",
    "problem": "RF690电磁阀膜片翻导致封不住水",
    "cause": "生产时电磁阀反向吹水将膜片吹翻",
    "solution": "生产工艺调整",
    "prevention": "电磁阀不可反向吹水",
    "tags": [
      "净水",
      "工艺"
    ]
  },
  {
    "id": "KB171",
    "category": "安规",
    "subCategory": "散热",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "散热",
      "电源线"
    ],
    "title": "电源线温升超过50K",
    "problem": "电源线温升超过50K",
    "cause": "1、电源线分岔口距离电控盒散热片处开孔位置过近\n2、PVC护套耐温70℃",
    "solution": "1、将电源线固定位置后移5mm，远离散热片\n2、PVC护套改为橡胶护套\n3、热水10分钟保护",
    "prevention": "1、电源线固定位置需考虑远离发热源\n2、温升超50K时，电源线护套材质采用橡胶，耐温可达105度（限值-25℃）",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB172",
    "category": "结构",
    "subCategory": "防呆",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "防呆",
      "出水"
    ],
    "title": "RF690后炭端盖装反导致出水量小",
    "problem": "RF690后炭端盖装反导致出水量小",
    "cause": "结构安装无防呆，导致正反都可安装焊接",
    "solution": "后炭下端盖与壳体做防呆设计",
    "prevention": "产品装配结构若有方向要求，需有防呆设计避免装反",
    "tags": [
      "净水",
      "结构"
    ]
  },
  {
    "id": "KB173",
    "category": "安规",
    "subCategory": "散热",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "散热",
      "温度",
      "加热",
      "程序"
    ],
    "title": "3C机构测试RF690整机温升按照写的适用环境温度40℃测试的，导致温升不合格，...",
    "problem": "3C机构测试RF690整机温升按照写的适用环境温度40℃测试的，导致温升不合格，加热30分钟保护程序未加",
    "cause": "测试环境温度过高，持续加热2小时导致，没有特殊要求按照安规测试环境温度20±5℃（或23±2℃）",
    "solution": "1、铭牌等适用环境温度改为适用水温\n2、加热保护设定10分钟（根据热水最大出水量5L确定出水时间）",
    "prevention": "环境温度与工作时间都会影响整机温升，需有加热时间保护",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB174",
    "category": "安规",
    "subCategory": "加热体",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "加热体",
      "加热"
    ],
    "title": "RF690加热体非正常干烧测试电阻丝烧断",
    "problem": "RF690加热体非正常干烧测试电阻丝烧断",
    "cause": "1、塑料加热体散热差\n2、温控器预留温度不够\n3、加热体装整机后散热差",
    "solution": "1、降低温控器温度\n2、降低温控器到发热丝表面距离\n3、提高温控器跳断灵敏度\n4、增加加热体外壳散热\n5、将温控器距离出水口位置上移\n6、取消扰流件",
    "prevention": "1、解决干烧问题时，需要同时考虑是否会影响高电压误跳\n2、加热体导入需装整机调试，整机散热、水路等对性能有影响\n3、扰流件对发热影响较大",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB175",
    "category": "安规",
    "subCategory": "加热体",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "加热体",
      "加热",
      "电压"
    ],
    "title": "RF690电压253V下，工作30分钟内加热体会误跳",
    "problem": "RF690电压253V下，工作30分钟内加热体会误跳",
    "cause": "1、装整机后，加热体散热不好\n2、加热体自复位温控器预留温度不够",
    "solution": "1、增加温控器温度或距离\n2、程序修订，增加出水10分钟/5L限制\n3、电压监控，高于240V降功率",
    "prevention": "1、加热体导入需装整机调试，整机散热、水路等对性能有影响\n2、温控器选型需预留充分\n3、需增加程序保护",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB176",
    "category": "水温",
    "subCategory": "水温",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "水温",
      "温度",
      "加热",
      "出水",
      "龙头",
      "加热体"
    ],
    "title": "RF690龙头出热水温度偏低，与加热体出水NTC检测温度差异较大",
    "problem": "RF690龙头出热水温度偏低，与加热体出水NTC检测温度差异较大",
    "cause": "取消扰流件，且进出水管设计在偏中心同侧，导致出水水流紊乱，水温不均；并且NTC位置设计在偏离中心位置，且直接插入发热管内，导致与出水口位置水温偏差",
    "solution": "1、NTC布置在进、出水管内\n2、进、出口NTC处增加挡片\n3、增加扰流件\n4、进、出水口对称布置",
    "prevention": "NTC最好布置在进、出水管内检测温度最准",
    "tags": [
      "净水",
      "水温"
    ]
  },
  {
    "id": "KB177",
    "category": "可靠性",
    "subCategory": "电极",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "电极",
      "不锈钢"
    ],
    "title": "RF690内胆内水位电极溢水位与内胆不锈钢顶盖水汽连起来了，导致误触发",
    "problem": "RF690内胆内水位电极溢水位与内胆不锈钢顶盖水汽连起来了，导致误触发",
    "cause": "水位电极直接与不锈钢内胆上盖组装固定，内胆热水蒸汽导致电极与上盖导通",
    "solution": "1、内胆上盖材质采用塑料件\n2、溢水位电极外移至排气管路\n3、修改水位电极导通电阻",
    "prevention": "1、充分考虑内胆热水蒸汽的影响，80℃蒸汽已经很多，上盖都是水汽\n2、水位电极导通电阻范围设计",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB178",
    "category": "可靠性",
    "subCategory": "浮球",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "浮球",
      "浮子"
    ],
    "title": "RF690内胆浮球溢水位浮子吸住掉不下来，导致误报警",
    "problem": "RF690内胆浮球溢水位浮子吸住掉不下来，导致误报警",
    "cause": "1、顶部不锈钢螺头有磁性\n2、螺头底部平面较大，形成水膜、真空吸住",
    "solution": "1、螺头消磁\n2、螺头底部增加小直径台阶",
    "prevention": "浮子上、下需增加挡片或是增加凸点，防止浮子被水膜、磁性吸住",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB179",
    "category": "可靠性",
    "subCategory": "电磁阀",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "电磁阀",
      "龙头"
    ],
    "title": "RF690电磁阀卡异物，导致电磁阀封不住水，出现龙头滴水或内胆溢水的情况",
    "problem": "RF690电磁阀卡异物，导致电磁阀封不住水，出现龙头滴水或内胆溢水的情况",
    "cause": "热水段管路密封件、塑料件等碎屑",
    "solution": "管路进电磁阀前端需增加滤网",
    "prevention": "1、增加滤网不能影响流速\n2、需考虑干烧蒸汽对滤网的影响\n3、不锈钢滤网最好有包边",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB180",
    "category": "串水",
    "subCategory": "热罐",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "热罐",
      "泵",
      "水泵"
    ],
    "title": "RF690热水泵反向汆水，导致内胆溢水",
    "problem": "RF690热水泵反向汆水，导致内胆溢水",
    "cause": "进出水密封垫未安装到位",
    "solution": "出厂增加抽真空检验",
    "prevention": "1、热水泵寿命、环境等测试后，需增加反向汆水检验\n2、热水泵增加反向汆水出厂检验、来料抽检",
    "tags": [
      "净水",
      "串水"
    ]
  },
  {
    "id": "KB181",
    "category": "体验",
    "subCategory": "噪音",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "噪音",
      "加热"
    ],
    "title": "RF690循环加热噪音大",
    "problem": "RF690循环加热噪音大",
    "cause": "循环加热时热水泵功率全开导致噪音大",
    "solution": "降低热水泵占空比，循环加热时间几乎不变",
    "prevention": "1、补水等其他工况，对流量没有要求时，也可以通过降低占空比解决噪音\n2、泵最大流量降低，也可以相应减少各流速下的噪音",
    "tags": [
      "净水",
      "体验"
    ]
  },
  {
    "id": "KB182",
    "category": "水温",
    "subCategory": "水温",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "水温",
      "温度",
      "保温",
      "不锈钢"
    ],
    "title": "RF690首杯水（不锈钢保温杯、300mL）温度低于80℃",
    "problem": "RF690首杯水（不锈钢保温杯、300mL）温度低于80℃",
    "cause": "加热体在整机内，距离龙头太远导致。加热体预热影响温度近10度左右，出水管预热影响温度近5度左右",
    "solution": "1、加热体自预热效果不好，仅能提升2-3℃左右\n2、采用循环预热方案，可以提升8-9℃左右",
    "prevention": "1、需同步考虑出水延迟时间，不得超过3秒\n2、通过提升内胆保温温度也可以提升首杯水温度",
    "tags": [
      "净水",
      "水温"
    ]
  },
  {
    "id": "KB183",
    "category": "可靠性",
    "subCategory": "NTC",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "NTC",
      "TDS"
    ],
    "title": "RF690两分带温感TDS组合件表皮破损，导致NTC失效，感温不准",
    "problem": "RF690两分带温感TDS组合件表皮破损，导致NTC失效，感温不准",
    "cause": "两分组合件空间太小，导致内部线束包裹不够",
    "solution": "1、改为三分带温感TDS\n2、拆分为两个零件TDS、NTC",
    "prevention": "TDS、NTC拆分两个零件相较于组合件更便宜，设计水路时需提前预留接口",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB184",
    "category": "漏水",
    "subCategory": "水路板",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "水路板",
      "漏水",
      "滤芯",
      "结构"
    ],
    "title": "RF690前置滤芯水路板未设计止水结构，有漏水风险",
    "problem": "RF690前置滤芯水路板未设计止水结构，有漏水风险",
    "cause": "水路板为进机器第一过水部件，无电磁阀等防护",
    "solution": "改模增加止水结构",
    "prevention": "水路板均需设计止水结构",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB185",
    "category": "可靠性",
    "subCategory": "流量计",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "流量计",
      "流量",
      "PCB",
      "短路"
    ],
    "title": "RF690流量计PCB腔体内部形成凝露，有短路风险",
    "problem": "RF690流量计PCB腔体内部形成凝露，有短路风险",
    "cause": "受冷、热环境、水流影响，形成水雾",
    "solution": "将PCB一面的三防漆更换为防护力更好的UV漆，同时在焊盘上追加涂环氧树脂进行双重保护，腔体内再放入防潮珠",
    "prevention": "净热产品带电器件需考虑冷、热环境影响会形成水雾的风险",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB186",
    "category": "异味",
    "subCategory": "水泵",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "水泵",
      "异味",
      "泵"
    ],
    "title": "RF690热水泵过热水有异味",
    "problem": "RF690热水泵过热水有异味",
    "cause": "1、尼龙塑料件过热水有异味\n2、EPDM橡胶件过热水有异味",
    "solution": "1、过水塑料件采用PP-CB5108H材质\n2、EPDM膜片工艺改善（助剂采用无异味，膜片增加高温水煮处理）",
    "prevention": "1、过热水塑料件采用PP材质，或无异味尼龙、无异味ABS，且需考虑耐温要求\n2、无味EPDM生产采用二次硫化，注意采用无味硫化剂、无味补强剂、软化油，且需有高温水煮处理",
    "tags": [
      "净水",
      "异味"
    ]
  },
  {
    "id": "KB187",
    "category": "膜前压",
    "subCategory": "增压泵",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "增压泵",
      "膜前压",
      "泵",
      "膜",
      "寿命"
    ],
    "title": "RF690常温水膜前压超8公斤，热水膜前压超9公斤，影响泵的寿命",
    "problem": "RF690常温水膜前压超8公斤，热水膜前压超9公斤，影响泵的寿命",
    "cause": "即热小流量工况，多余纯水会回流到膜前，导致膜前压升高",
    "solution": "限制增压泵的流量上限",
    "prevention": "增压泵需控制流量上限\n800G  2800-3200ml/min\n1000G  3600-4000mL/min\n1200G  4800-5200mL/min\n（需注意不影响常温水流速）",
    "tags": [
      "净水",
      "膜前压"
    ]
  },
  {
    "id": "KB188",
    "category": "可靠性",
    "subCategory": "水路板",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "水路板",
      "PP"
    ],
    "title": "RF690 PP水路板长期过热水后发黄、有斑点",
    "problem": "RF690 PP水路板长期过热水后发黄、有斑点",
    "cause": "PP热氧老化造成的",
    "solution": "加抗氧化剂可解决",
    "prevention": "发黄后进行卫生安全、耐压测试无影响",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB189",
    "category": "漏水",
    "subCategory": "水路板",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "水路板"
    ],
    "title": "RF690 13公斤水锤不合格",
    "problem": "RF690 13公斤水锤不合格",
    "cause": "两分O圈硅胶材质软，导致水锤冲击下密封圈表面破损",
    "solution": "1、材质改为耐热EPDM\n2、改双O",
    "prevention": "需承受高压的过水部件，密封设计首选双O，材质可选EPDM，需同步考虑异味影响",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB190",
    "category": "可靠性",
    "subCategory": "水路板",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "水路板"
    ],
    "title": "RF690水路板匹配转接头后，打3.3MPa爆破、1.3MPa水锤，三分转接头、...",
    "problem": "RF690水路板匹配转接头后，打3.3MPa爆破、1.3MPa水锤，三分转接头、免焊端盖有脱出风险",
    "cause": "1、鼎展免焊端盖内径13mm过大导致卡爪容易脱出\n2、PP水路板材质软，强度不够",
    "solution": "1、临时方案：卡爪改为中荷卡爪\n2、鼎展免焊端盖内径尺寸改为12.6mm\n3、材质由大韩油化PP-CH5108H改为金发PP-91412HM",
    "prevention": "1、免焊端盖内径管控\n2、耐热水路板若也要满足耐压需要时，材质选择PP-91412HM",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB191",
    "category": "流量",
    "subCategory": "滤网",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "滤网",
      "流速",
      "水路板"
    ],
    "title": "RF690水路板加滤网后流速降低，补水段流速衰减0.5L",
    "problem": "RF690水路板加滤网后流速降低，补水段流速衰减0.5L",
    "cause": "滤网目数过大导致限流",
    "solution": "滤网目数改为40目",
    "prevention": "管路增加滤网需匹配流量需求，过滤杂质要求，设计滤网目数或滤网面积，满足两分或三分过水面积",
    "tags": [
      "净水",
      "流量"
    ]
  },
  {
    "id": "KB192",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "水形",
      "即热",
      "流量",
      "出水"
    ],
    "title": "RF690即热高温小流量出水水型较差",
    "problem": "RF690即热高温小流量出水水型较差",
    "cause": "即热模式热水温度＞80℃时出水会有气泡",
    "solution": "1、出水需有水汽分离盒\n2、或采用起跑器水嘴\n3、加热体出水口处需加滤网4-5片，且滤网目数要大，100目（参考RF681）",
    "prevention": "出水嘴增加起跑器可以改善水型",
    "tags": [
      "净水",
      "水形"
    ]
  },
  {
    "id": "KB193",
    "category": "可靠性",
    "subCategory": "水泵",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "水泵",
      "流量",
      "泵",
      "膜",
      "抽水泵",
      "膜片"
    ],
    "title": "RF690补水流量异常过小，导致报警E7\nRF681抽水泵膜片破损",
    "problem": "RF690补水流量异常过小，导致报警E7\nRF681抽水泵膜片破损",
    "cause": "1、电磁减压阀瞬间减压效果失效\n2、由于阀启闭顺序影响，导致双逆止泵进水端压力超1.5公斤，导致双逆止泵打不开，无法出水；超过3公斤导致抽水泵膜片破损。",
    "solution": "修订阀、泵启闭顺序，确保抽水泵前端不积累压力",
    "prevention": "阀最好应晚于泵启动，应早于泵关闭",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB194",
    "category": "可靠性",
    "subCategory": "浮球",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "浮球",
      "水温",
      "浮子"
    ],
    "title": "RF690内胆储水水温过高时，需考虑浮球中心杆、浮子材质",
    "problem": "RF690内胆储水水温过高时，需考虑浮球中心杆、浮子材质",
    "cause": "未记录详细根因",
    "solution": "1、水箱储常温水，可使用PP材质中心杆+发泡PP材质浮子（台净）\n2、水箱储水60℃以下，可使用PP材质中心杆+PP材质浮子（净热二代）\n3、水箱储水80℃以下，可使用不锈钢材质中心杆+PP材质浮子（净热三代）\n4、水箱储水80℃以上，需使用不锈钢材质中心杆+不锈钢材质浮子（净热一代）",
    "prevention": "未沉淀规范",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB195",
    "category": "可靠性",
    "subCategory": "滤网",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "滤网",
      "出水",
      "塑料"
    ],
    "title": "RF690热水出水阀、补水阀前端塑料滤网熔化",
    "problem": "RF690热水出水阀、补水阀前端塑料滤网熔化",
    "cause": "1、加热体干烧蒸汽温度过高、且滤网筋过细，导致塑料滤网熔化\n2、滤网距离加热体过近",
    "solution": "改为不锈钢滤网",
    "prevention": "出水口有电磁阀等压力限制，蒸汽温度可＞100℃",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB196",
    "category": "流量",
    "subCategory": "流量",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "流量",
      "流速"
    ],
    "title": "RF690热水流速限流",
    "problem": "RF690热水流速限流",
    "cause": "2L/min热水泵后端水路有两分管，导致限流",
    "solution": "改为三分管内径",
    "prevention": "1、使用2L大流速热水泵时，热水泵后端水路管径采用三分管\n2、出水限流也会影响抽水泵寿命",
    "tags": [
      "净水",
      "流量"
    ]
  },
  {
    "id": "KB197",
    "category": "可靠性",
    "subCategory": "逆止阀",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": false,
    "keywords": [
      "逆止阀",
      "漏水",
      "出水",
      "硅胶管",
      "硅胶"
    ],
    "title": "RF689s体出水口硅胶管甭管漏水",
    "problem": "RF689s体出水口硅胶管甭管漏水",
    "cause": "逆止阀卡异物，导致反向压力甭管",
    "solution": "逆止阀前端增加滤网",
    "prevention": "逆止阀、电磁阀前端应有滤网保护",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB198",
    "category": "异味",
    "subCategory": "异味",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "异味",
      "电控"
    ],
    "title": "RF689s：1、电控板灌AB胶气味重\n2、电控盒尼龙+玻纤发热会有气味",
    "problem": "RF689s：1、电控板灌AB胶气味重\n2、电控盒尼龙+玻纤发热会有气味",
    "cause": "AB胶、阻燃剂受热有气味",
    "solution": "1、电控板改UV胶\n2、电控盒材质改PBT",
    "prevention": "1、有灼热丝要求的塑料件可采用PBT材料\n2、PBT材质较脆，有强度要求的需考虑风险\n3、过热水、无异味要求也可考虑PBT材料",
    "tags": [
      "净水",
      "异味"
    ]
  },
  {
    "id": "KB199",
    "category": "异味",
    "subCategory": "异味",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "异味",
      "硅胶管",
      "硅胶"
    ],
    "title": "RF689s硅胶管采用沉淀胶过热水会有异味",
    "problem": "RF689s硅胶管采用沉淀胶过热水会有异味",
    "cause": "1、沉淀胶过热水有异味\n2、厨下环境硅胶管会吸附异味",
    "solution": "1、硅胶管采用气相胶\n2、硅胶管外部缠绕PMP胶带",
    "prevention": "过热水硅胶材质需采用气相胶",
    "tags": [
      "净水",
      "异味"
    ]
  },
  {
    "id": "KB200",
    "category": "安规",
    "subCategory": "加热体",
    "productLine": "净水",
    "year": "2023",
    "author": "岳义帅",
    "isDesignSpec": true,
    "keywords": [
      "加热体",
      "加热"
    ],
    "title": "RF689s加热体非正常干烧时，空开跳断",
    "problem": "RF689s加热体非正常干烧时，空开跳断",
    "cause": "1、温控器设计不合理\n2、外壳采用了金属铝壳",
    "solution": "1、外壳背部增加散热孔\n2、手复位温控器向出水口方向上移\n3、降低温控器跳断温度\n4、下移温控器距离发热丝的距离，但需满足电气间隙≥2mm\n5、改用塑料外壳",
    "prevention": "1、温控器选型充分，位置设计合理\n2、采用塑料外壳，壳体可不用接地，温控器位置可以随意调整",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB201",
    "category": "滤芯",
    "subCategory": "流量",
    "productLine": "净饮",
    "year": "2023",
    "author": "张慧玉",
    "isDesignSpec": false,
    "keywords": [
      "流量",
      "滤芯"
    ],
    "title": "B05净水壶滤芯堵塞",
    "problem": "B05净水壶滤芯堵塞",
    "cause": "无纺布结构致密、透气性差",
    "solution": "分别采用120g骨架无纺布和200目尼龙网布验证",
    "prevention": "采用骨架无纺布或者尼龙网布等透气性好的材料应用于净水杯",
    "tags": [
      "净饮",
      "滤芯"
    ]
  },
  {
    "id": "KB202",
    "category": "可靠性",
    "subCategory": "水路板",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "水路板",
      "漏水",
      "滤芯"
    ],
    "title": "滤芯与水路板连接处高压爆破漏水",
    "problem": "滤芯与水路板连接处高压爆破漏水",
    "cause": "高压下水路板变形，滤芯密封柱与密封圈脱离",
    "solution": "1.增加水路板固定座刚度，减小变形量\n2.延长水路板密封柱长度，弥补变形量",
    "prevention": "设计承压件要充分考虑高压带来的变形因素，需要有预留方案",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB203",
    "category": "滤芯",
    "subCategory": "防呆",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "防呆"
    ],
    "title": "大双水系列/净热681",
    "problem": "大双水系列/净热681",
    "cause": "ROC滤芯无结构防呆，易180°装反",
    "solution": "1.水路板固定座设计防呆结构，利用滤芯底座两侧扁位差异，形成结构防呆\n2.水路板与滤芯凹凸配合防呆",
    "prevention": "1.新品功能件设计要充分考虑防呆；\n2.防呆设计要找到结构差异点，尽量在最少的零件上做结构；",
    "tags": [
      "净水",
      "滤芯"
    ]
  },
  {
    "id": "KB204",
    "category": "滤芯",
    "subCategory": "防呆",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "防呆",
      "滤芯"
    ],
    "title": "横置R560系列PC滤芯内部倒装",
    "problem": "横置R560系列PC滤芯内部倒装",
    "cause": "滤材组件上下端盖直径接近，差异小",
    "solution": "上下端盖配合处直径差异明显，倒装无法装配或无法旋熔",
    "prevention": "具有对称，且易装反的结构，要做可防呆的结构差异，实现无法错装，或错装后无法实现下一道工序",
    "tags": [
      "净水",
      "滤芯"
    ]
  },
  {
    "id": "KB205",
    "category": "噪音",
    "subCategory": "噪音",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "噪音"
    ],
    "title": "R560系列，586系列降噪",
    "problem": "R560系列，586系列降噪",
    "cause": "泵与机身连接不当，减震效果不佳",
    "solution": "改善连接方式，例如软连接，吊挂，悬空等",
    "prevention": "横置和大双水的泵与机身通过多孔硅胶环，多支点软连接，有限降噪",
    "tags": [
      "净水",
      "噪音"
    ]
  },
  {
    "id": "KB206",
    "category": "漏水",
    "subCategory": "漏水",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "漏水",
      "滤芯"
    ],
    "title": "横置平台滤芯意外脱出造成用户家被淹泡水",
    "problem": "横置平台滤芯意外脱出造成用户家被淹泡水",
    "cause": "1.滤芯未装到位；2.水路板进水口无止水结构",
    "solution": "水路板进水口增加止水结构",
    "prevention": "滤芯对应的水路板，进水口需设计止水结构，防止滤芯松脱时水外流，造成地面泡水等危机事件",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB207",
    "category": "漏水",
    "subCategory": "漏水",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "漏水",
      "滤芯",
      "水路板"
    ],
    "title": "R586平台PCP滤芯与水路板配合处保压渗水",
    "problem": "R586平台PCP滤芯与水路板配合处保压渗水",
    "cause": "密封圈压缩量不够，加上塑件尺寸偏差造成",
    "solution": "增加水路板配合柱直径，调整压缩量到22%",
    "prevention": "承压密封位置，密封圈设计压缩量在15-25%，需拆装的20-25%合适",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB208",
    "category": "漏水",
    "subCategory": "漏水",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "漏水",
      "水路板",
      "跌落",
      "出水"
    ],
    "title": "双出水R586平台水路板快插杆跌落断裂",
    "problem": "双出水R586平台水路板快插杆跌落断裂",
    "cause": "插杆底部未R角处理，应力集中，强度不足",
    "solution": "插杆底部增加R1圆角，提高强度",
    "prevention": "水路板和滤芯插杆底部需R角或C角设计，必要时插杆外周做护套保护设计，增加强度",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB209",
    "category": "可靠性",
    "subCategory": "跌落",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "跌落",
      "水路板"
    ],
    "title": "R560/586平台水路板与主支架固定处跌落断裂",
    "problem": "R560/586平台水路板与主支架固定处跌落断裂",
    "cause": "水路板与主支架螺钉连接，且滤芯固定于水路板上，跌落螺钉固定处受力大，冲击大，造成断裂",
    "solution": "水路板螺钉孔外周增加加强筋数量，横竖斜排布，提高局部抗冲击性能",
    "prevention": "1.水路板外周翻遍，增加整体强度\n2.与主支架固定螺钉孔周边多加强筋设计，提高局部抗冲击性能，优化跌落",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB210",
    "category": "流量",
    "subCategory": "流量",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "流量"
    ],
    "title": "R732纯水流量小于手搭系统，水校测试需缩短管路勉强满足",
    "problem": "R732纯水流量小于手搭系统，水校测试需缩短管路勉强满足",
    "cause": "水路板及PE管径限流，造成流量偏低",
    "solution": "要求供应商管径加大4.2（满足承压标准），流量达标",
    "prevention": "大通量机型设计时，要充分考虑内部流道：\n1.小于1000G机型水道截面需大于2分管路截面，如直径大于4.5mm，面积大于35mm²，保证流量\n2、大于1000G机型水道截面需大于3分管路截面，如直径大于6.5mm，面积大于72mm²，保证流量，具体根据测试确认",
    "tags": [
      "净水",
      "流量"
    ]
  },
  {
    "id": "KB211",
    "category": "漏水",
    "subCategory": "水路板",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "水路板",
      "漏水",
      "开裂"
    ],
    "title": "R560系列水路板在市场使用一段时间后开裂漏水",
    "problem": "R560系列水路板在市场使用一段时间后开裂漏水",
    "cause": "水路板POM材料，应力集中造成",
    "solution": "水路板回火处理去内应力",
    "prevention": "POM水路板及水路配件需回火处理，去除内应力：125±5℃烘箱4小时后烘箱内自然冷却",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB212",
    "category": "装配",
    "subCategory": "水路板",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "水路板",
      "电磁阀"
    ],
    "title": "净水机易损配件电磁阀、高压开关等更换不便，需整机大部分拆除，才能更换，样机阶段及...",
    "problem": "净水机易损配件电磁阀、高压开关等更换不便，需整机大部分拆除，才能更换，样机阶段及售后维修苦难",
    "cause": "整机设计未充分考虑易损配件的拆装方便行",
    "solution": "需整机大部分拆解后才能更换",
    "prevention": "新品设计时，注重电磁阀，泵，开关等易损配件的可拆卸性，考虑到外壳去除后能直接快速更换，RF960侧板拆除后，可实现所有电磁阀拆装",
    "tags": [
      "净水",
      "装配"
    ]
  },
  {
    "id": "KB213",
    "category": "可靠性",
    "subCategory": "排气",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "排气",
      "振动",
      "滤芯",
      "结构"
    ],
    "title": "整机内部带罐结构（包含滤芯），机器工作振动大，管路抖动大",
    "problem": "整机内部带罐结构（包含滤芯），机器工作振动大，管路抖动大",
    "cause": "排气不充分，空间和管路内存在气体",
    "solution": "按一定方向摆放摇晃机器，出水口位于最高点，充分排除气体",
    "prevention": "1.水路设计时，尽量考虑出水口位于最高位；2.安装机器时，按滤芯处于最高处方向调整机器到排气完成",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB214",
    "category": "结构",
    "subCategory": "",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "装配",
      "电控"
    ],
    "title": "技改后电控板装配，电容被前盖压伤，无法工作",
    "problem": "技改后电控板装配，电容被前盖压伤，无法工作",
    "cause": "厂家对电容位置微调了1mm",
    "solution": "临时对前盖手工处理干涉部分，长期方案电控板电容位置调整",
    "prevention": "1.三维设计时，塑件与电控元器件保持安全距离大于2mm；\n2.厂家变更需及时与研发沟通",
    "tags": [
      "净水",
      "结构"
    ]
  },
  {
    "id": "KB215",
    "category": "可靠性",
    "subCategory": "TDS",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "TDS"
    ],
    "title": "R502原水TDS读取不准确，波动较大",
    "problem": "R502原水TDS读取不准确，波动较大",
    "cause": "原水TDS位于水路板上，通过接杆+接头固定，过程中存在空气，无法准确读取",
    "solution": "更换TDS位置，使探针直接接触水流",
    "prevention": "TDS探针要直接接触水流，确保读取的准确性，不能存在死端，造成空气无法排出，判断不准",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB216",
    "category": "可靠性",
    "subCategory": "密封圈",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "密封圈",
      "密封",
      "可靠性"
    ],
    "title": "止水阀设计低压密封性能可靠性，渗水概率",
    "problem": "止水阀设计低压密封性能可靠性，渗水概率",
    "cause": "（1）非径向密封，密封圈无强行压缩；\n（2）密封圈硬度偏高，斜面失圆；\n（3）弹簧刚度（弹力）偏小",
    "solution": "（1）使用硅胶圈，或者降低密封圈硬度；\n（2）加大弹簧刚度（弹力）",
    "prevention": "止水阀结构，非径向密封，需保证密封圈的变形量，即压缩程度，弥补塑件的表面及圆度缺陷，同时弹簧弹力要合理。",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB217",
    "category": "滤芯",
    "subCategory": "焊接",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "焊接",
      "滤芯"
    ],
    "title": "滤芯超声焊接后，盖子高出平面",
    "problem": "滤芯超声焊接后，盖子高出平面",
    "cause": "设计时未充分考虑溶胶量的影响",
    "solution": "1.适当降低筋平面\n2.设计熔胶槽",
    "prevention": "超声焊接需考虑溶胶量的影响",
    "tags": [
      "净水",
      "滤芯"
    ]
  },
  {
    "id": "KB218",
    "category": "可靠性",
    "subCategory": "滤芯",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "滤芯",
      "压力"
    ],
    "title": "滤瓶爆破压力下（＞3Mpa）破裂",
    "problem": "滤瓶爆破压力下（＞3Mpa）破裂",
    "cause": "1.壁厚不足\n2.材料刚性不够",
    "solution": "1.增压壁厚到合适值\n2.调整材料配比",
    "prevention": "壁厚均匀\n1、直径≤50mm：壁厚3.5~4.5mm\n2、50mm≤直径≤75mm：壁厚5.0~5.5mm\n3、75mm≤直径≤100mm：壁厚6.0~6.5m\n4、100mm≤直径≤120mm：壁厚7.0~7.5mm",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB219",
    "category": "可靠性",
    "subCategory": "滤芯",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "滤芯",
      "密封",
      "密封圈"
    ],
    "title": "PCP滤芯水锤（1.3Mpa）9万多次密封圈割破",
    "problem": "PCP滤芯水锤（1.3Mpa）9万多次密封圈割破",
    "cause": "1.超声盖边缘未倒圆角\n2.材料变更，变硬",
    "solution": "改模，超声盖边缘增加R0.25圆角",
    "prevention": "密封圈槽边缘适当圆角处理，降低疲劳风险",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB220",
    "category": "可靠性",
    "subCategory": "浮球",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": true,
    "keywords": [
      "浮球"
    ],
    "title": "净热一代水位浮球无法正常动作",
    "problem": "净热一代水位浮球无法正常动作",
    "cause": "浮球离泵磁铁太近，受泵磁场影响无法动作",
    "solution": "1.变更水箱位置\n2.泵外侧套阻磁棉",
    "prevention": "水位浮球设计时需考虑外磁场影响",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB221",
    "category": "水温",
    "subCategory": "水温",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "水温",
      "温度"
    ],
    "title": "R5首杯水温度低",
    "problem": "R5首杯水温度低",
    "cause": "即热体位置低于热罐，内残余水无法排出",
    "solution": "设计时提高即热体及其他储水单元位置，高于热罐子，水能完全回流于罐中",
    "prevention": "提高首杯水温度，热罐上方需排空残余水的影响",
    "tags": [
      "净水",
      "水温"
    ]
  },
  {
    "id": "KB222",
    "category": "其他",
    "subCategory": "",
    "productLine": "净水",
    "year": "2023",
    "author": "徐广飞",
    "isDesignSpec": false,
    "keywords": [
      "泵",
      "外观"
    ],
    "title": "R7503项目立项无实物，无法准确判断风险，造成外观、泵壳改模等问题，影响周期",
    "problem": "R7503项目立项无实物，无法准确判断风险，造成外观、泵壳改模等问题，影响周期",
    "cause": "无整机实物，无参考",
    "solution": "1.立项需以实物为参照，充分风险评估；\n2.需准备启动会，多方参与，风险识别与周期确认",
    "prevention": "1.立项需以实物为参照，充分风险评估\n2.需准备启动会，多方参与，风险识别与周期确认",
    "tags": [
      "净水",
      "其他"
    ]
  },
  {
    "id": "KB223",
    "category": "滤芯",
    "subCategory": "成本",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "成本",
      "滤芯"
    ],
    "title": "T28滤芯抑菌碳价格评估超出",
    "problem": "T28滤芯抑菌碳价格评估超出",
    "cause": "1、抑菌碳克数未达标，导致过滤精度偏低\n2、复合抑菌碳加工工艺未提前了解",
    "solution": "不影响产品本身的功能和可靠性前提下，对其他原材料更替降本，弥补成本差",
    "prevention": "新零件开发前务必了解其加工工艺、\n加工的难点和局限点、新物料本身的性能参\n数和成本等，只有全面掌握信息才可预判风险，及时作出反应和解决方案",
    "tags": [
      "净饮",
      "滤芯"
    ]
  },
  {
    "id": "KB224",
    "category": "其他",
    "subCategory": "",
    "productLine": "净饮",
    "year": "2023",
    "author": "李刚灵",
    "isDesignSpec": false,
    "keywords": [],
    "title": "台净项目时间紧张，项目进度把控难度高",
    "problem": "台净项目时间紧张，项目进度把控难度高",
    "cause": "1、市场立项时间规划不合理，项目周期短\n2、造型决策犹豫不不决，变更频繁",
    "solution": "1、ODM项目,C类项目可以提前导入关键配件\n2、水批提前安排",
    "prevention": "1、平台化标准化，尽量不新增加关键配件\n2、A,B,C,D类项目对应适当的开发时间\n3、减少项目变更",
    "tags": [
      "净饮",
      "其他"
    ]
  },
  {
    "id": "KB225",
    "category": "密封圈",
    "subCategory": "密封圈",
    "productLine": "净水",
    "year": "2023",
    "author": "马明阳",
    "isDesignSpec": true,
    "keywords": [
      "密封圈",
      "硅胶"
    ],
    "title": "硅胶圈使用硅油润滑尺寸会膨胀",
    "problem": "硅胶圈使用硅油润滑尺寸会膨胀",
    "cause": "同性物质相融相吸",
    "solution": "密封圈润滑：硅胶圈润滑用甘油，EPDM用甲基硅油，满足食品级",
    "prevention": "RO机产品安全红线手册方案",
    "tags": [
      "净水",
      "密封圈"
    ]
  },
  {
    "id": "KB226",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "水形",
      "出水"
    ],
    "title": "RH550出水水型不好以及水气分离盒排气孔滴水",
    "problem": "RH550出水水型不好以及水气分离盒排气孔滴水",
    "cause": "内部结构不符合水流的特性",
    "solution": "对水气分离盒内部结构新增缓冲挡板和水流导向筋，阻挡热水和蒸汽攀爬，防止从排气孔出水，同时也改善了出水水型",
    "prevention": "采用验证充分的结构导入新产品，以免造成中途改动",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB227",
    "category": "液位管",
    "subCategory": "浮球",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "浮球",
      "液位"
    ],
    "title": "RH550纯水壶低液位感应失效",
    "problem": "RH550纯水壶低液位感应失效",
    "cause": "1、纯水壶底部的光感三角棱镜缩水，光感折射偏移\n2、整机放置倾斜，水壶内余水倾斜一边导致判定依旧未到达低水位",
    "solution": "1、完善纯水壶底部的三角棱镜结构工艺，出厂无缩水\n2、光电感应内置，采用连通器原理重新设计，壶内液位与光电感应的管中液位处于同高度",
    "prevention": "新零部件使用前了解前原理结构及劣势点，进行失效验证，避免出现检测漏洞",
    "tags": [
      "净饮",
      "液位管"
    ]
  },
  {
    "id": "KB228",
    "category": "噪音",
    "subCategory": "加热体",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "加热体",
      "噪音"
    ],
    "title": "RH550取热水噪音大",
    "problem": "RH550取热水噪音大",
    "cause": "扬天加热体内管无水流导向结构",
    "solution": "1、分析佐佑加热体内部构造并测其噪音低于扬天加热提，其内部有一弹簧结进行导流\n2、参照佐佑的结构改善",
    "prevention": "1、选择更优的技术配件，借鉴其优势，消化技术点转换为自身产品的技术点",
    "tags": [
      "净饮",
      "噪音"
    ]
  },
  {
    "id": "KB229",
    "category": "显示模块",
    "subCategory": "显示",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "显示"
    ],
    "title": "RH550显示板漏光",
    "problem": "RH550显示板漏光",
    "cause": "1、显示板与结构件之间存在间隙\n2、弧面结构容易变形，导致漏光\n3、结构件颜色不够深，导致串光漏光",
    "solution": "1、分析剖开结构件测量其最大的配合间隙，改动模具进行结构过瘾配合，也同时改善弧面界面弯曲导致的漏光",
    "prevention": "在非常规的显示界面设计上，需实际把控其配合尺寸，做好防漏光设计，必要时加深注塑件颜色，防止串光",
    "tags": [
      "净饮",
      "显示模块"
    ]
  },
  {
    "id": "KB230",
    "category": "液位管",
    "subCategory": "浮球",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "浮球",
      "液位",
      "浮子"
    ],
    "title": "RH550高液位浮子卡住",
    "problem": "RH550高液位浮子卡住",
    "cause": "1、浮子与装配件之间存在面碰面的结构\n2、浮子底部未设有凸点等特征防止黏连的结构",
    "solution": "1、抛光浮子对应的装配面\n2、增加凸台等尖锐结构顶住浮子，防止黏连卡位",
    "prevention": "1、水位浮子的装配设计面必须未筋位或者是凸出特征，以防止失效造成的溢水",
    "tags": [
      "净饮",
      "液位管"
    ]
  },
  {
    "id": "KB231",
    "category": "其他",
    "subCategory": "",
    "productLine": "净水",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [],
    "title": "智能产品成品PTS码扫码跳转异常",
    "problem": "智能产品成品PTS码扫码跳转异常",
    "cause": "工单申请选择了相应型号的空壳机，三码绑定后无法正常跳转",
    "solution": "更换正确的成品PTS码",
    "prevention": "对于同一型号既有正常产品又有空壳机，生产时需提前和供方相关部门对各项包材进行逐项确认",
    "tags": [
      "净水",
      "其他"
    ]
  },
  {
    "id": "KB232",
    "category": "水形",
    "subCategory": "水形",
    "productLine": "净饮",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "水形",
      "水嘴",
      "出水",
      "龙头"
    ],
    "title": "龙头水嘴出水分叉",
    "problem": "龙头水嘴出水分叉",
    "cause": "1、拔模方向限制，出水向外散开\n2、分流筋设计过长，聚拢段过短\n3、手板与注塑材质、精度不一致，验证效果不同",
    "solution": "流道加长，末端加三张网片",
    "prevention": "1、设计开模时考虑从出水反方向进行出模；\n2、尽量加长出口流道；\n3、末端加网片",
    "tags": [
      "净饮",
      "水形"
    ]
  },
  {
    "id": "KB233",
    "category": "漏水",
    "subCategory": "漏水保护器",
    "productLine": "净水",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "漏水保护器",
      "漏水"
    ],
    "title": "漏水保护器使用过程中出现壳盖分离漏水",
    "problem": "漏水保护器使用过程中出现壳盖分离漏水",
    "cause": "1、固定方式不可靠，上盖连接PE管受力方向与拆卸方向相同",
    "solution": "在原有基础上增加螺钉固定上盖与主体",
    "prevention": "配件导入测试方案需考虑用户实际使用场景，增加安装使用项",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB234",
    "category": "显示模块",
    "subCategory": "显示",
    "productLine": "净水",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "显示",
      "龙头"
    ],
    "title": "龙头显示屏闪屏",
    "problem": "龙头显示屏闪屏",
    "cause": "主控板转化输出电压不稳定，纹波过大",
    "solution": "更换新的电源转化方案",
    "prevention": "主控板导入及来料检验增加纹波测试",
    "tags": [
      "净水",
      "显示模块"
    ]
  },
  {
    "id": "KB235",
    "category": "可靠性",
    "subCategory": "C卡",
    "productLine": "净水",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "C卡"
    ],
    "title": "净热二代产品热罐排气口直通脱出",
    "problem": "净热二代产品热罐排气口直通脱出",
    "cause": "不同厂家的接头卡爪深度、密封尺寸不同，不锈钢管的卡槽尺寸不适配",
    "solution": "增加C形卡环，加强紧固力，测试100N不脱出",
    "prevention": "新品设计时考虑产品使用管接件使用厂家及其关键尺寸，匹配设计",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB236",
    "category": "异味",
    "subCategory": "异味",
    "productLine": "净水",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "异味"
    ],
    "title": "附件包管接件异味",
    "problem": "附件包管接件异味",
    "cause": "附件包由于自封袋密封存储，POM材质气味未散出",
    "solution": "附件包预装前对管接件提前领料并开袋通风",
    "prevention": "加强管接件物料过程管控，增加精致通风散味工序",
    "tags": [
      "净水",
      "异味"
    ]
  },
  {
    "id": "KB237",
    "category": "可靠性",
    "subCategory": "龙头",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "龙头"
    ],
    "title": "RF689C搭配WS860出冷水后再次点按龙头冷水功能键时，龙头会出一股水",
    "problem": "RF689C搭配WS860出冷水后再次点按龙头冷水功能键时，龙头会出一股水",
    "cause": "冷水出水阀在点按冷水功能键时已经打开，胆内压力导致冷水排出",
    "solution": "停止取水后泄压，时序：废水阀打开1min，制冷机进水阀和热罐补水阀同时打开15S，关闭所有阀",
    "prevention": "泄压时可以考虑将残留压力往热罐中释放（可能会有少量水进入热罐）",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB238",
    "category": "可靠性",
    "subCategory": "风扇",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "风扇",
      "可靠性"
    ],
    "title": "WS860可靠性测试样机出现风扇无法启动问题",
    "problem": "WS860可靠性测试样机出现风扇无法启动问题",
    "cause": "风扇定子叠片装反，启动力矩偏大",
    "solution": "更换为耐雅德批量供应商志誉",
    "prevention": "风扇启动失败除了电压电流等电参数的因素之外，风扇本身的结构也是因素之一，比如本例就是由于原供应商（天昕）生产工艺管控不当致使定子叠片装反进而引起的启动失败。定子叠片凸起的一侧应该在风扇转过去的那一侧",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB239",
    "category": "可靠性",
    "subCategory": "冷胆",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "冷胆",
      "温度",
      "显示",
      "制冷",
      "龙头"
    ],
    "title": "RF689C搭配WS860，制冷停机后龙头显示温度低于设定制冷停机温度5℃",
    "problem": "RF689C搭配WS860，制冷停机后龙头显示温度低于设定制冷停机温度5℃",
    "cause": "1、NTC温度感应存在延时\n2、制冷停机后冷胆内壁冰层融化吸热导致温度继续降低",
    "solution": "程序设定龙头可显示的最低温度为5℃",
    "prevention": "压缩机制冷产品制冷停机后冷胆内壁冰层融化会导致水温继续降低1~2℃，程序上需设定最低显示温度",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB240",
    "category": "可靠性",
    "subCategory": "冷胆",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": true,
    "keywords": [
      "冷胆",
      "漏水"
    ],
    "title": "WS860冷胆变形漏水",
    "problem": "WS860冷胆变形漏水",
    "cause": "1、冷胆壁厚较薄（0.5mm）\n2、电磁阀启闭时序不当\n3、出水阀失效导致异常憋压",
    "solution": "1、冷胆壁厚加大至0.8mm\n2、出水时出水阀早于进水阀打开，停水时出水阀晚于进水阀关闭\n3、进水阀与冷胆之间增加高压开关，当出水阀失效时断开进水阀，防止异常憋压\n4、高压开关连续动作2次时显示异常报警代码",
    "prevention": "1、GB 4706.1第22章第47条规定：打算接到水源的器具需能承受进水压力的2倍或1.2MPa压力5min\n2、0.8mm壁厚的不锈钢胆可满足1.2MPa压力5min的承压要求\n3、为避免正常使用时储水容器憋压，取水时出水口要早于进水口打开，停止取水时出水口要晚于进水口关闭",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB241",
    "category": "体验",
    "subCategory": "TDS",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [
      "TDS",
      "显示"
    ],
    "title": "RF689C初始TDS值显示为0",
    "problem": "RF689C初始TDS值显示为0",
    "cause": "程序设定初始值为0",
    "solution": "程序设定初始值改为1",
    "prevention": "TDS值显示的初始值不可设定为0，不符合常理",
    "tags": [
      "净水",
      "体验"
    ]
  },
  {
    "id": "KB242",
    "category": "制冷系统",
    "subCategory": "抽真空",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": true,
    "keywords": [
      "抽真空",
      "制冷"
    ],
    "title": "WS860手板样机首次制冷时长4h",
    "problem": "WS860手板样机首次制冷时长4h",
    "cause": "抽真空不充分，制冷系统管路内部水分导致冰堵",
    "solution": "（单头）抽真空时间固化为5min",
    "prevention": "压缩机制冷系统管路内部不可有水分、杂质，抽真空一定要充分（-0.1MPa，5min）",
    "tags": [
      "净水",
      "制冷系统"
    ]
  },
  {
    "id": "KB243",
    "category": "制冷系统",
    "subCategory": "冷胆",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": true,
    "keywords": [
      "冷胆",
      "出水"
    ],
    "title": "WS860手板样机冷出水量不满足定义书要求",
    "problem": "WS860手板样机冷出水量不满足定义书要求",
    "cause": "进水流速过大且无挡片，进水直接冲到冷胆出水口，胆内混水过快导致水温升高",
    "solution": "冷胆进水口增加挡片，保证进水呈片状从上往下压",
    "prevention": "1、冷胆进水流速不可太快，否则会加速胆内冷热水混合速度进而导致出水温度高\n2、冷胆进水要有限流或导向结构，降低进水流速或引导进水不要直接冲击到冷胆出水口",
    "tags": [
      "净水",
      "制冷系统"
    ]
  },
  {
    "id": "KB244",
    "category": "制冷系统",
    "subCategory": "压缩机",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": true,
    "keywords": [
      "压缩机"
    ],
    "title": "WS860手板样机压缩机频繁启停",
    "problem": "WS860手板样机压缩机频繁启停",
    "cause": "风扇减震棉卡死扇叶导致风扇堵转，制冷系统散热不良，压缩机异常升温导致其热保护器频繁启动",
    "solution": "调整风扇减震棉粘贴位置，保证其不会卡死风扇叶片",
    "prevention": "1、风扇为压缩机制冷系统的重要散热原件，其堵转会导致压缩机频繁启停\n2、风扇减震棉的粘贴位置要保证其不会卡住风扇叶片",
    "tags": [
      "净水",
      "制冷系统"
    ]
  },
  {
    "id": "KB245",
    "category": "包印件",
    "subCategory": "",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [],
    "title": "WS860铭牌错误",
    "problem": "WS860铭牌错误",
    "cause": "无额定电流，气候类型相关内容",
    "solution": "添加气候类型及额定电流参数",
    "prevention": "GB4706.13 要求：\n1、压缩式制冷器具仅要求标有额定电流\n2、制冷器具需标明气候类型、制冷剂编号及用量、绝热发泡材料的化学名称",
    "tags": [
      "净水",
      "包印件"
    ]
  },
  {
    "id": "KB246",
    "category": "包印件",
    "subCategory": "",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": false,
    "keywords": [],
    "title": "RF689C&WS860说明书错误",
    "problem": "RF689C&WS860说明书错误",
    "cause": "缺少国标GB4706.13中规定的内容",
    "solution": "参照国标补充缺失内容",
    "prevention": "制冷器具说明书中应包含一下内容：\n不得在器具中贮存爆炸物，如助燃喷雾剂。",
    "tags": [
      "净水",
      "包印件"
    ]
  },
  {
    "id": "KB247",
    "category": "制冷系统",
    "subCategory": "压缩机",
    "productLine": "净水",
    "year": "2023",
    "author": "赵友玉",
    "isDesignSpec": true,
    "keywords": [
      "压缩机",
      "制冷"
    ],
    "title": "WS860小中批样机制冷时间异常",
    "problem": "WS860小中批样机制冷时间异常",
    "cause": "制冷性能测试前机器发生了倾斜，压缩机油进入制冷系统导致油堵",
    "solution": "说明书及售后安装视频中增加提醒“通电前需静置4小时以上”",
    "prevention": "1、压缩机制冷产品不可侧放或倒置，否则压缩机内润滑油易大量进入制冷系统导致油堵\n2、制冷系统堵塞（油堵、冰堵、脏堵）的表象有：制冷功率降低，制冷时间长，压缩机排气管温度不高",
    "tags": [
      "净水",
      "制冷系统"
    ]
  },
  {
    "id": "KB248",
    "category": "可靠性",
    "subCategory": "",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "滤芯",
      "装配"
    ],
    "title": "复位开关失效，导致小滤芯仓盖无法装配",
    "problem": "复位开关失效，导致小滤芯仓盖无法装配",
    "cause": "复位开关复位特征断裂",
    "solution": "复位特征结构改为金属件",
    "prevention": "运动结构需评估其强度和耐久性",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB249",
    "category": "异味",
    "subCategory": "异味",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "异味"
    ],
    "title": "原水箱异味",
    "problem": "原水箱异味",
    "cause": "与材料无关。本身存在塑料味，疑似废水与原水结合后产生腥味",
    "solution": "设计水废分离彻底解决",
    "prevention": "不同特性的水质应分离，避免造成不明的异味现象",
    "tags": [
      "净饮",
      "异味"
    ]
  },
  {
    "id": "KB250",
    "category": "可靠性",
    "subCategory": "",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "出水"
    ],
    "title": "出水螺纹不匹配",
    "problem": "出水螺纹不匹配",
    "cause": "塑料螺纹本身滑丝",
    "solution": "螺纹上下配合件增加卡扣类设计，出现滑丝也可装配",
    "prevention": "减少塑料螺纹类的设计，尽量采用其他密封结构和装配结构",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB251",
    "category": "体验",
    "subCategory": "",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [],
    "title": "原水箱提动困难",
    "problem": "原水箱提动困难",
    "cause": "与原水箱装配的硅胶件硬度不匹配，导致取水箱力度比较大",
    "solution": "降低硅胶件的邵氏硬度",
    "prevention": "匹配相应的设计标准，设计站在消费者角度体验产品，任何运动件需设计合理",
    "tags": [
      "净饮",
      "体验"
    ]
  },
  {
    "id": "KB252",
    "category": "体验",
    "subCategory": "密封圈",
    "productLine": "净饮",
    "year": "2023",
    "author": "王志阳",
    "isDesignSpec": false,
    "keywords": [
      "密封圈",
      "滤芯"
    ],
    "title": "滤芯旋拧力度大，取出困难",
    "problem": "滤芯旋拧力度大，取出困难",
    "cause": "密封圈压缩率设计过大导致滤芯挤压量过大，旋拧度随之变大",
    "solution": "满足密封性的要求下降低压缩率",
    "prevention": "后续设计满足密封性压缩率的同时，验证其体验效果合理性",
    "tags": [
      "净饮",
      "体验"
    ]
  },
  {
    "id": "KB253",
    "category": "漏水",
    "subCategory": "漏水",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "漏水",
      "龙头"
    ],
    "title": "龙头漏水（批量阶段）\n龙头在左极限位置漏水",
    "problem": "龙头漏水（批量阶段）\n龙头在左极限位置漏水",
    "cause": "1.试产的数量不多，未及早验证出来\n2.龙头不涂抹润滑介质，导致容易被挤出来\n3.密封圈的线径选择较小，密封量欠缺\n4.密封圈安装步骤有问题\n5.未全方位检查，龙头旋转各个位置需要检查",
    "solution": "1、增加涂抹硅油工序\n2、更换线径1.9的密封圈提升至18%，\n3、优化出水组件安装步骤（密封圈的安装顺序调整）\n4、龙头通气保压过程中旋转龙头，保证各个位置都检测到",
    "prevention": "1、密封圈润滑：硅胶圈润滑用甘油，EPDM用甲基硅油，满足食品级\n2、密封圈的密封量要充足，防止漏水\n3、活动部件的密封检测需要全方位检测，确保极限位置密封可靠\n4、密封圈安装规范要讲究，防止装配出现导致密封不良",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB254",
    "category": "体验",
    "subCategory": "龙头",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "龙头",
      "水嘴",
      "出水"
    ],
    "title": "龙头出水嘴出水喷溅",
    "problem": "龙头出水嘴出水喷溅",
    "cause": "插穿结构易造成飞边，且筋位设置不好已造成水形不能充满整个流道",
    "solution": "1.采用完全碰穿结构实现水嘴末端的水道通路\n2.筋位的设置要合理",
    "prevention": "1.出水嘴插穿结构不稳定，如果非要插穿，则芯子一定要有定位结构，防止出现飞边现象。\n2.筋位需设置合理，否则则流道水流可能不能充满",
    "tags": [
      "净水",
      "体验"
    ]
  },
  {
    "id": "KB255",
    "category": "可靠性",
    "subCategory": "电磁阀",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "电磁阀"
    ],
    "title": "电磁阀逆向通水是通的",
    "problem": "电磁阀逆向通水是通的",
    "cause": "电磁阀结构设计导致其逆向通水是常开的",
    "solution": "未记录详细解决方案",
    "prevention": "可以利用该特性进行水路电磁阀的裁剪或者防止水路出现装反漏水的风险",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB256",
    "category": "安规",
    "subCategory": "线束",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "线束",
      "即热"
    ],
    "title": "681即热体上线端盖卡线槽设计较好",
    "problem": "681即热体上线端盖卡线槽设计较好",
    "cause": "线束较乱，不易整理及安装，也不太符合安规要求",
    "solution": "上下端盖上设计适当的卡线结构，将线束规范布置，",
    "prevention": "结构设计时，线束的走向及布置是非常有必要的，对于\n安装及符合规范都是有益的，一定要将线束固定的漂亮",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB257",
    "category": "噪音",
    "subCategory": "水泵",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "水泵",
      "泵",
      "出水"
    ],
    "title": "681水泵出水震动",
    "problem": "681水泵出水震动",
    "cause": "水泵内部震动传到所致",
    "solution": "后边接一个缓冲瓶减缓其震动",
    "prevention": "管路中类似的震动可以采用一个较大的缓冲腔来\n吸收此种震动",
    "tags": [
      "净水",
      "噪音"
    ]
  },
  {
    "id": "KB258",
    "category": "噪音",
    "subCategory": "水泵",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "水泵",
      "噪音",
      "泵"
    ],
    "title": "681双逆置泵噪音大，有震动",
    "problem": "681双逆置泵噪音大，有震动",
    "cause": "1.出水口口径设置不合理\n2.前端水压设置不合理",
    "solution": "1.将水泵出水口口径由4.5mm减小到2.7mm\n2.减压阀压力由原理的0.5-0.8kg减小为0.4-0.5kg",
    "prevention": "1.将水泵出水口口径由4.5mm减小到2.7mm\n2.减压阀压力由原理的0.5-0.8kg减小为0.4-0.5kg",
    "tags": [
      "净水",
      "噪音"
    ]
  },
  {
    "id": "KB259",
    "category": "可靠性",
    "subCategory": "水泵",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "水泵",
      "泵",
      "硅胶"
    ],
    "title": "681水泵内部硅胶爆裂",
    "problem": "681水泵内部硅胶爆裂",
    "cause": "1.水泵本身结构问题（进水水压太大会导致出水出不来）\n2.减压阀会在水压波动中失效",
    "solution": "1.改变减压阀与抽水泵的启动顺序（原来时减压阀先启动1S，抽水泵再动作，改为抽水泵与减压阀同时动作）\n2.改变抽水泵的出水口径，增加水泵的出水压力，能克服水泵进水压力，不至于断流或水泵称爆",
    "prevention": "1.启停顺序很重要，批量前确定好\n2.配件的结构要摸清，了解透彻才能有较好的整改方案",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB260",
    "category": "安规",
    "subCategory": "加热体",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "加热体",
      "即热"
    ],
    "title": "即热体干烧异常（EB前验证出）",
    "problem": "即热体干烧异常（EB前验证出）",
    "cause": "两个温控器位置布置不合理",
    "solution": "1.降低自复位温控器与加热体表面距离，金属外壳不接地\n2.开设散热孔�\n3.减小手动复位温控器与加热体上半段的距离",
    "prevention": "1、电气间隙＜2mm，即热体表面需绝缘\n2、金属外壳即热体不能接地线\n3、充分设计散热孔\n4、需装在整机上进行实际工况测试",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB261",
    "category": "外观",
    "subCategory": "外观",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "外观",
      "缩水"
    ],
    "title": "内螺纹外边面有缩水",
    "problem": "内螺纹外边面有缩水",
    "cause": "内螺纹收尾处未自然衔接到均匀壁厚",
    "solution": "内螺纹收尾自然过渡到均匀处",
    "prevention": "所有的过渡处都要自然过渡处理，不能产生壁厚不均匀的过渡",
    "tags": [
      "净水",
      "外观"
    ]
  },
  {
    "id": "KB262",
    "category": "安规",
    "subCategory": "电控盒",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "电控盒",
      "电控"
    ],
    "title": "681电控盒设计较一代与二代好",
    "problem": "681电控盒设计较一代与二代好",
    "cause": "1.强弱电分离彻底\n2.挡水部分做的较好，充分考虑漏水出现的滋水问题",
    "solution": "1.外部增加挡水“帽檐”\n2.露出的线束不能直接进入电控盒内部，在结构上做重力方向的折弯处理，将水尽量引走\n3.出现的孔都要尽量有格挡，防止水溅入",
    "prevention": "1.尽量布置到水不易接触的地方，如机器的正上方\n2.侧边布置要借助其他部件阻挡泄露水的喷淋\n3.要将接触的水流尽量依靠结构引走\n4.电控盒的开孔尽量避免接头附近，避免不了增加格挡",
    "tags": [
      "净水",
      "安规"
    ]
  },
  {
    "id": "KB263",
    "category": "外观",
    "subCategory": "外观",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "外观"
    ],
    "title": "侧板外观边缘存在厚薄印",
    "problem": "侧板外观边缘存在厚薄印",
    "cause": "壁厚不均匀导致",
    "solution": "1.完全消除需倒角圆角均匀过渡处理\n2.实在完全消除不了，借助工具尽量弱化",
    "prevention": "1.均匀过渡处理壁厚不均匀的衔接处\n2.可以使用消光棉打磨边缘，弱化厚薄印的痕迹",
    "tags": [
      "净水",
      "外观"
    ]
  },
  {
    "id": "KB264",
    "category": "漏水",
    "subCategory": "漏水",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "漏水",
      "龙头",
      "结构",
      "防水"
    ],
    "title": "681龙头脖劲处的防水结构不是最优结构",
    "problem": "681龙头脖劲处的防水结构不是最优结构",
    "cause": "筒体在下面，旋转主体在上面，筒体\n的外边缘包裹旋转主体上的密封圈，淋水测试的话，如果密封圈密封不可靠，水容易灌入",
    "solution": "采用上包下的结构，旋转主体外边缘包裹龙头\n筒体，筒体上设置密封圈，淋水测试肯定合格，\n水在重力作用下不会往上灌入，可节省密封圈，降本",
    "prevention": "密封结构的设计，尽量依靠物理原理采用最优结构",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB265",
    "category": "可靠性",
    "subCategory": "跌落",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "跌落",
      "泵"
    ],
    "title": "681跌落泵的接头断裂",
    "problem": "681跌落泵的接头断裂",
    "cause": "泵在跌落过程中存在前后窜动，管路连接中的三通与主支架发生碰撞，导致泵接头因力臂较长，被折断",
    "solution": "主支架改模避空，避免与接头发生碰撞",
    "prevention": "跌落过程中避免任何配件与主支架产生碰撞",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB266",
    "category": "异味",
    "subCategory": "异味",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "异味",
      "出水"
    ],
    "title": "出水无异味",
    "problem": "出水无异味",
    "cause": "异味源规避",
    "solution": "1、设计规避异味源；\n2、2代基础上增加即热模块水煮工艺；",
    "prevention": "1、热水后端无硅胶\n2、尽量减少热水管路\n3、耐高温PP大韩油化CB5108H 的应用",
    "tags": [
      "净水",
      "异味"
    ]
  },
  {
    "id": "KB267",
    "category": "漏水",
    "subCategory": "漏水",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "漏水",
      "龙头"
    ],
    "title": "681龙头侧边漏气",
    "problem": "681龙头侧边漏气",
    "cause": "1.龙头是曲面，侧边密封胶面积小，易张开\n2.未将侧边密封结构考虑进去，只考虑到采用3M胶粘贴\n3.二代龙头也存在此问题，没有经验沉淀",
    "solution": "1.临时方案，周围一圈再封一圈胶水（不是3M胶）\n2.依靠机构上做密封实现可靠密封",
    "prevention": "面板设计时要将与电控板支架的密封考虑进去，\n防止此种问题再出现",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB268",
    "category": "漏水",
    "subCategory": "漏水",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "漏水",
      "回流"
    ],
    "title": "681回流处生产保压时漏水",
    "problem": "681回流处生产保压时漏水",
    "cause": "1.管接件太多\n2.单LPE管强度不好\n3.管子连接打弯",
    "solution": "1.改变回流管路连接，尽量笔直\n2.采用双L的PE管\n3.采用集成水路板实现，减少管接件",
    "prevention": "1.管路的连接尽量笔直\n2.能采用集成水路板实现的地方尽量使\n用，可以减少配件的数量与难度",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB269",
    "category": "漏水",
    "subCategory": "增压泵",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": true,
    "keywords": [
      "增压泵",
      "漏水",
      "泵"
    ],
    "title": "681增压泵漏水",
    "problem": "681增压泵漏水",
    "cause": "1.NUDD未识别\n2.因为有回路管路，增压泵\n流量3500ml/min导致膜前压上升",
    "solution": "调节泵的流量上限,降低膜前压；",
    "prevention": "增压泵需控制流量上限\n800G 2800-3200ml/min\n1000G 3600-4000mL/min",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB270",
    "category": "可靠性",
    "subCategory": "可靠性",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "可靠性",
      "加热"
    ],
    "title": "681不加热，或者E7，或者喷气",
    "problem": "681不加热，或者E7，或者喷气",
    "cause": "1.进出水NTC异常\n2.水泵堵转或者橡胶件爆裂",
    "solution": "1.更换NTC\n2.更换技改后的水泵与减压阀，刷最新程序",
    "prevention": "未沉淀规范",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB271",
    "category": "结构",
    "subCategory": "",
    "productLine": "净水",
    "year": "2023",
    "author": "吴庆沛",
    "isDesignSpec": false,
    "keywords": [
      "PE管"
    ],
    "title": "681PE管折弯件是一个较好的设计",
    "problem": "681PE管折弯件是一个较好的设计",
    "cause": "1.管子折弯易造成管子夹扁或者变形程度不受控制\n2.增加接头浪费成本",
    "solution": "设计一个小的折弯件，将管子折弯成较为理想的角度",
    "prevention": "管子折弯理想角度可以借鉴此种方法",
    "tags": [
      "净水",
      "结构"
    ]
  },
  {
    "id": "KB272",
    "category": "体验",
    "subCategory": "",
    "productLine": "净水",
    "year": "2023",
    "author": "胡饶峰",
    "isDesignSpec": true,
    "keywords": [
      "龙头",
      "超滤"
    ],
    "title": "龙头机、超滤关闭水龙头后不能立即停水",
    "problem": "龙头机、超滤关闭水龙头后不能立即停水",
    "cause": "滤芯内有空气，空气可被压缩，滤芯内储存压力，当水源被关闭后，滤芯内余压将水压出",
    "solution": "方案一：滤芯首次使用时，让滤芯充满水；\n方案二：设置排气口；\n方案三：原水从下面进入，净水从顶部出来，利用水自然重力将空气压出。",
    "prevention": "方案一针对现有产品，说明书补充内容：滤芯首次使用时，让滤芯充满水；\n方案二：设置排气口；\n方案三滤芯倒置设计：原水从下面进入，净水从顶部出来，利用水自然重力将空气压出。",
    "tags": [
      "净水",
      "体验"
    ]
  },
  {
    "id": "KB273",
    "category": "滤芯",
    "subCategory": "",
    "productLine": "净饮",
    "year": "2023",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "包装",
      "龙头"
    ],
    "title": "多陶瓷芯龙头机包装储运测试失败",
    "problem": "多陶瓷芯龙头机包装储运测试失败",
    "cause": "陶瓷材料不耐冲击，滤芯没有充分减震，跌落过程中受到冲击",
    "solution": "在吸塑盒中增加滤芯放置位置",
    "prevention": "陶瓷滤芯要防止要有单独空间，不能挤压或收到冲击",
    "tags": [
      "净饮",
      "滤芯"
    ]
  },
  {
    "id": "KB274",
    "category": "包印件",
    "subCategory": "",
    "productLine": "净水",
    "year": "2023",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [],
    "title": "透明技术标贴高温存储气泡",
    "problem": "透明技术标贴高温存储气泡",
    "cause": "胶水材料耐温不够，高温存储过程中胶水中物质热分解产生气体",
    "solution": "1.更换热稳定性更强的胶水\n2.使用不透明的标贴基材，有气泡不影响外观",
    "prevention": "标贴的基材和胶水需要最少耐温70℃（高温存储60℃，24小时）",
    "tags": [
      "净水",
      "包印件"
    ]
  },
  {
    "id": "KB275",
    "category": "漏水",
    "subCategory": "漏水",
    "productLine": "净饮",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "漏水",
      "显示",
      "进水"
    ],
    "title": "显示屏侧面及正面漏光，有进水失效风险",
    "problem": "显示屏侧面及正面漏光，有进水失效风险",
    "cause": "侧面漏光原因为亚克力面板背胶为透明1.2mm厚，按键区域灯光从胶粘区域透出\n正面按键边缘漏光原因为彩膜尺寸与支架凹槽尺寸不匹配，彩膜未完全置于凹槽内，一部分翘起，彩膜背胶也为透明，光由翘起边缘处漏出",
    "solution": "背胶改为黑色不透光背胶，亚克力面板背胶使用防水性更好的胶，彩膜与凹槽之间留出设计间隙",
    "prevention": "智能龙头显示屏需关注背胶材质、颜色、厚度、覆盖区域等参数，导入及来料加强漏光检验",
    "tags": [
      "净饮",
      "漏水"
    ]
  },
  {
    "id": "KB276",
    "category": "可靠性",
    "subCategory": "水路板",
    "productLine": "净水",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "水路板"
    ],
    "title": "水路板堵头爆破测试中飞出",
    "problem": "水路板堵头爆破测试中飞出",
    "cause": "堵头完全封堵水流动，所在位置直接承受压强大，使用埋入式堵头的卡入深度和孔径不合适",
    "solution": "卡入深度增加0.5mm，孔径改模取下偏差进行设计",
    "prevention": "埋入式堵头设计时预留0.5mm以上卡入深度",
    "tags": [
      "净水",
      "可靠性"
    ]
  },
  {
    "id": "KB277",
    "category": "包印件",
    "subCategory": "",
    "productLine": "净饮",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "包印件"
    ],
    "title": "包印件信息与水批不一致",
    "problem": "包印件信息与水批不一致",
    "cause": "包印件模板借用同平台旧型号，但整机水批为新申报，申报的部分信息与旧型号不同，导致生产厂家地址及执行标准有误",
    "solution": "修改设计稿内容",
    "prevention": "新品包印件设计时与水批进行一致性核对，包括名称、生产厂家、生产地址、技术参数、执行标准等",
    "tags": [
      "净饮",
      "包印件"
    ]
  },
  {
    "id": "KB278",
    "category": "可靠性",
    "subCategory": "滤芯",
    "productLine": "净饮",
    "year": "2023",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "滤芯"
    ],
    "title": "陶瓷滤芯一掰就断",
    "problem": "陶瓷滤芯一掰就断",
    "cause": "1.陶瓷材料松软，敲击表面掉粉；\n2.陶瓷与端盖粘合面积小，粘胶不充分；",
    "solution": "1.陶瓷材料密度增加；\n2.增加粘合面积，改善打胶工艺；",
    "prevention": "1.陶瓷必须要有一定的硬度；\n2.粘合面积要足够；\n3.对滤芯要有拉拔测试；",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB279",
    "category": "可靠性",
    "subCategory": "卡扣",
    "productLine": "净饮",
    "year": "2023",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "卡扣"
    ],
    "title": "扣位组装断扣",
    "problem": "扣位组装断扣",
    "cause": "扣位没有加强筋",
    "solution": "扣位增加两到三个垂直加强筋",
    "prevention": "对于外观件，扣位需要加强筋，筋厚度不应超过壁厚的0.5-0.6倍，缺少筋职称，安装可能断扣",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB280",
    "category": "包印件",
    "subCategory": "",
    "productLine": "净饮",
    "year": "2023",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [],
    "title": "标贴贴完字体不正",
    "problem": "标贴贴完字体不正",
    "cause": "1.贴标缺少工装；\n2.圆形标贴缺少定位参照；",
    "solution": "1.贴标贴增加工装定位；\n2.圆形标贴设计增加缺口参照；",
    "prevention": "1.贴标贴增加工装定位；\n2.圆形标贴设计增加缺口参照；",
    "tags": [
      "净饮",
      "包印件"
    ]
  },
  {
    "id": "KB281",
    "category": "外观",
    "subCategory": "外观",
    "productLine": "净饮",
    "year": "2023",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "外观"
    ],
    "title": "深色产品外观不良",
    "problem": "深色产品外观不良",
    "cause": "模具表面掉纹，表面生锈，浅色产品不容易发现产品外观不良",
    "solution": "模具抛光，表面重新晒纹",
    "prevention": "针对使用时间过长的模具提前评估模具状态，尤其从浅色产品转向深色产品，对模具表面进行保养；",
    "tags": [
      "净饮",
      "外观"
    ]
  },
  {
    "id": "KB282",
    "category": "其他",
    "subCategory": "",
    "productLine": "净饮",
    "year": "2023",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "模具"
    ],
    "title": "转移供应商模具图纸不全",
    "problem": "转移供应商模具图纸不全",
    "cause": "模具图纸管理不到位，图纸与实物不符",
    "solution": "根据实物更新模具图",
    "prevention": "移模前对模具图纸和模具进行验收，为后期修模排除隐患",
    "tags": [
      "净饮",
      "其他"
    ]
  },
  {
    "id": "KB283",
    "category": "可靠性",
    "subCategory": "龙头",
    "productLine": "净饮",
    "year": "2023",
    "author": "冉杰涛",
    "isDesignSpec": false,
    "keywords": [
      "龙头"
    ],
    "title": "龙头导入弯管拔出力不合格",
    "problem": "龙头导入弯管拔出力不合格",
    "cause": "无限位结构，仅靠密封圈压缩量保证拔出力，涂油量多时拔出力小，涂油量小时弯管旋转磨损严重漏水，影响寿命",
    "solution": "更改龙头弯管结构，改为不可拔出式",
    "prevention": "机械龙头导入时直接使用不可拔出式结构",
    "tags": [
      "净饮",
      "可靠性"
    ]
  },
  {
    "id": "KB284",
    "category": "漏水",
    "subCategory": "密封",
    "productLine": "饮水",
    "year": "2025",
    "author": "郑志鹏",
    "isDesignSpec": false,
    "keywords": [
      "密封",
      "漏水",
      "密封圈"
    ],
    "title": "AJ3610水箱与整机适配密封圈漏水",
    "problem": "AJ3610水箱与整机适配密封圈漏水",
    "cause": "密封圈结构小，成品模成型不良结构",
    "solution": "加大密封结构设计，同时增加纵向密封量",
    "prevention": "水箱密封圈要先保证上方压缩量密封",
    "tags": [
      "饮水",
      "漏水"
    ]
  },
  {
    "id": "KB285",
    "category": "漏水",
    "subCategory": "水箱",
    "productLine": "净水",
    "year": "2025",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "水箱",
      "出水",
      "回流",
      "RO"
    ],
    "title": "RO机RP16回流时水箱出水口溢水",
    "problem": "RO机RP16回流时水箱出水口溢水",
    "cause": "增压泵进水口连接进水电磁阀进口，导致泵抽水时吸入空气，无法从水箱取水，同时泵将滤芯和管路中的水全部补到水箱，导致溢水；",
    "solution": "将增压泵进水口位置调整到进水电磁阀出水口位置",
    "prevention": "进水电磁阀从进口吸气没有逆止功能，从出口位置吸气有逆止功能",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB286",
    "category": "漏水",
    "subCategory": "水箱",
    "productLine": "净水",
    "year": "2025",
    "author": "胡饶峰",
    "isDesignSpec": true,
    "keywords": [
      "水箱",
      "RO"
    ],
    "title": "RO机RP16补倾斜5度放置，机器补水无法停止",
    "problem": "RO机RP16补倾斜5度放置，机器补水无法停止",
    "cause": "水箱为长方形，排气口与高水位浮球设置在长度方向上，且距离较远，机器倾斜时，水位优先没过排气口，导致水位无法达到浮球启动位置，机器补水不停",
    "solution": "排气口与浮球放置在长度方向中间位置",
    "prevention": "针对全密封水箱，将浮球与排气口放置在长度方向中间位置，同时排气口与浮球在短边方向对齐，尽量减小距离；",
    "tags": [
      "净水",
      "漏水"
    ]
  },
  {
    "id": "KB287",
    "category": "检测",
    "subCategory": "水箱",
    "productLine": "净饮",
    "year": "2025",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "水箱",
      "开裂"
    ],
    "title": "550水箱气检时水箱开裂",
    "problem": "550水箱气检时水箱开裂",
    "cause": "水箱体积大，侧面受到较大力，水箱挡水板和四遍角被撕裂；",
    "solution": "减小气检压力，设定为7Kpa，保压15s，泄露0.65kpa",
    "prevention": "针对大容量密封件气检，要预先计算最大面受力，尖锐角需要倒圆",
    "tags": [
      "净饮",
      "检测"
    ]
  },
  {
    "id": "KB288",
    "category": "水型",
    "subCategory": "出水嘴",
    "productLine": "净饮",
    "year": "2025",
    "author": "胡饶峰",
    "isDesignSpec": false,
    "keywords": [
      "出水嘴",
      "出水"
    ],
    "title": "550出水歪斜",
    "problem": "550出水歪斜",
    "cause": "出水口偏大",
    "solution": "出水口偏大，水没有充满出水口，导致水流往一边偏",
    "prevention": "使水充满出水口，保证出水只受重力影响，排除出水嘴结构吸附力",
    "tags": [
      "净饮",
      "水型"
    ]
  }
]

export default IMPORTED_PROBLEM_CASES