import React, { useState } from 'react'
import DFMPanel from '../components/Toolbox/DFMPanel'
import BOMPanel from '../components/Toolbox/BOMPanel'
import WaterAppliancePanel from '../components/Toolbox/WaterAppliancePanel'
import HandbookLibrary from '../components/Toolbox/HandbookLibrary'
import ProblemSolverPanel from '../components/Toolbox/ProblemSolverPanel'
import PackagingPanel from '../components/Toolbox/PackagingPanel'
import './ToolboxPage.css'

function ToolboxPage() {
  const [showDFM, setShowDFM] = useState(false)
  const [showBOM, setShowBOM] = useState(false)
  const [showWA, setShowWA] = useState(false)   // 水家电设计选型参考
  const [showHandbook, setShowHandbook] = useState(false)   // 结构高频数据库
  const [showSolver, setShowSolver] = useState(false)   // 开发问题解决助手
  const [showPackaging, setShowPackaging] = useState(false)   // 包装工程 AI 工具

  // 读取角色：管理员可编辑知识库
  const [canEdit] = useState(() => {
    try {
      const raw = localStorage.getItem('auth_session_v2')
      const auth = raw ? JSON.parse(raw) : null
      return auth?.role === 'admin'
    } catch { return false }
  })

  const tools = [
    {
      id: 'dfm',
      title: 'DFM模具初评',
      description: '基于AI的模具设计可制造性分析，快速评估结构方案的工艺可行性，降低试模风险和成本。',
      icon: '🔍',
      color: '#00d4ff',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      features: ['可制造性评估', '成本预估', '工艺优化建议'],
      interactive: true,
    },
    {
      id: 'bom',
      title: 'BOM成本秒算',
      description: '智能BOM清单自动生成与成本计算，支持多材质选择、加工工艺配置，精确核算物料总成本。',
      icon: '💰',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      features: ['24种材质', '8种工艺', '成本明细表'],
      interactive: true,
    },
    {
      id: 'water-appliance',
      title: '水家电设计选型参考',
      description: '净水机、饮水机、台式净水器三条产品线的设计规范与选型参数，结构工程师专业参考库。',
      icon: '💧',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      features: ['净水机设计规范', '饮水机选型', '台净参考框架'],
      interactive: true,
    },
    {
      id: 'database',
      title: '结构高频数据库',
      description: '集中管理机械设计师手册PDF、常用结构设计手册等工程参考资料，支持分类存储、全文检索和收藏书签功能。',
      icon: '📚',
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      features: ['PDF手册库', '分类检索', '收藏/书签'],
      interactive: true,
    },
    {
      id: 'problem-solver',
      title: '开发问题解决助手',
      description: '基于RAG知识库，输入当前技术问题，自动在历史经验库中检索相似案例，输出根因分析与解决方案。',
      icon: '🧩',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
      features: ['历史经验检索', 'RAG相似匹配', '根因+方案'],
      interactive: true,
    },
    {
      id: 'packaging',
      title: '包装工程',
      description: '连接盒创 HeChuang 包装全链路AI工作台，支持包装选材推荐、码托装柜优化、纸箱/彩盒成本预估（iframe嵌入）。',
      icon: '📦',
      color: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      features: ['选材推荐', '码托装柜', '成本预估'],
      interactive: true,
    }
  ]

  const handleCardClick = (toolId) => {
    if (toolId === 'dfm') setShowDFM(true)
    if (toolId === 'bom') setShowBOM(true)
    if (toolId === 'water-appliance') setShowWA(true)
    if (toolId === 'database') setShowHandbook(true)
    if (toolId === 'problem-solver') setShowSolver(true)
    if (toolId === 'packaging') setShowPackaging(true)
  }

  return (
    <div className="toolbox-page animate-fadeIn">
      <div className="page-header">
        <h2 className="page-title">🛠️ 设计百宝箱</h2>
        <p className="page-subtitle">
          智能工具集合，提升设计效率
        </p>
      </div>

      <div className="tools-grid">
        {tools.map((tool, index) => (
          <div
            key={tool.id}
            className={`tool-card ${tool.interactive ? 'interactive' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => tool.interactive && handleCardClick(tool.id)}
            role={tool.interactive ? "button" : undefined}
            tabIndex={tool.interactive ? 0 : -1}
            onKeyDown={(e) => {
              if (tool.interactive && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                handleCardClick(tool.id)
              }
            }}
          >
            <div
              className="tool-icon-wrapper"
              style={{ background: tool.gradient }}
            >
              <span className="tool-icon">{tool.icon}</span>
              {/* 交互提示标记 */}
              {tool.interactive && (
                <span className="interactive-badge">点击体验</span>
              )}
            </div>

            <div className="tool-content">
              <h3 className="tool-title">{tool.title}</h3>
              <p className="tool-description">{tool.description}</p>

              <div className="tool-features">
                {tool.features.map((feature, i) => (
                  <span key={i} className="feature-tag" style={{ borderColor: tool.color }}>
                    {feature}
                  </span>
                ))}
              </div>

              <button
                className="tool-btn"
                style={{
                  background: tool.gradient,
                  boxShadow: `0 4px 14px ${tool.color}40`
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCardClick(tool.id)
                }}
              >
                {tool.interactive ? '开始评估 →' : '进入工具 →'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========== 面板（模态框） ========== */}
      {showDFM && <DFMPanel onClose={() => setShowDFM(false)} />}
      {showBOM && <BOMPanel onClose={() => setShowBOM(false)} />}
      {showWA && <WaterAppliancePanel onClose={() => setShowWA(false)} />}
      {showHandbook && <HandbookLibrary onClose={() => setShowHandbook(false)} />}
      {showSolver && <ProblemSolverPanel onClose={() => setShowSolver(false)} canEdit={canEdit} />}
      {showPackaging && <PackagingPanel onClose={() => setShowPackaging(false)} />}
    </div>
  )
}

export default ToolboxPage
