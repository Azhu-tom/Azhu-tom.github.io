import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { reportVisit, fetchVisitStats, fetchModelOverview } from '../services/statsService'
import StatsDrawer from '../components/StatsDrawer'
import './HomePage.css'

/* ============ 描边 SVG 图标体系（团队 P0：统一 1.7px 线性图标） ============ */
function SvgIcon({ children, sw = 1.7, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}
const CubeIcon    = (p) => <SvgIcon {...p}><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8z" /></SvgIcon>
const FolderIcon  = (p) => <SvgIcon {...p}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></SvgIcon>
const UsersIcon   = (p) => <SvgIcon {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c.6-3.4 2.8-5 5.5-5s4.9 1.6 5.5 5M16 5.5a3.2 3.2 0 010 5.4M20.5 20c-.4-2.4-1.6-3.8-3.3-4.5" /></SvgIcon>
const ToolIcon    = (p) => <SvgIcon {...p}><path d="M14.7 6.3a4 4 0 105.1 5.1L21 21H9l4.7-4.7" /></SvgIcon>
const SearchIcon  = (p) => <SvgIcon {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></SvgIcon>
const UploadIcon  = (p) => <SvgIcon {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></SvgIcon>
const CoinIcon    = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="9" /><path d="M8.5 6.5L12 12l3.5-5.5M12 12v6.5M8.8 13h6.4M8.8 16h6.4" /></SvgIcon>
const BotIcon     = (p) => <SvgIcon {...p}><rect x="4" y="7" width="16" height="12" rx="2.5" /><path d="M12 7V3.5M8.5 3.5h7M9 12.2h.01M15 12.2h.01M9.5 15.8h5" /></SvgIcon>
const ArrowUpIcon = (p) => <SvgIcon sw={2.2} {...p}><path d="M12 19V5M6 11l6-6 6 6" /></SvgIcon>
const ArrowRightIcon = (p) => <SvgIcon sw={2} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></SvgIcon>
const InfoIcon    = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M12 11.5V17" /></SvgIcon>
const DropIcon    = (p) => <SvgIcon sw={1.4} {...p}><path d="M12 3c3.5 4.2 6 7.3 6 10a6 6 0 11-12 0c0-2.7 2.5-5.8 6-10z" /><path d="M9.5 14.5a2.5 2.5 0 005 0" /></SvgIcon>
const GearIcon    = (p) => <SvgIcon sw={1.4} {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" /></SvgIcon>

function HomePage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const [visitData, setVisitData] = useState(null)     // 访问统计（真实数据，失败为 null）
  const [modelData, setModelData] = useState(null)     // 模型库概览（真实数据，失败为 null）
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  /* 挂载即上报一次访问（会话级去重在 service 内），随后拉取真实统计 */
  useEffect(() => {
    let cancelled = false
    reportVisit()
    Promise.all([fetchVisitStats(), fetchModelOverview()])
      .then(([visit, model]) => {
        if (cancelled) return
        if (visit) setVisitData(visit)
        else setStatsError(true)
        if (model) setModelData(model)
      })
      .finally(() => { if (!cancelled) setStatsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const stats = [
    {
      label: '模型总数',
      value: modelData ? modelData.total : '1,234',
      Icon: CubeIcon, theme: 'models',
      trend: modelData ? '已接入真实统计' : '+12 本周',
      trendType: modelData ? 'flat' : 'up',
      sample: !modelData, link: '/model-library'
    },
    {
      label: '分类数量',
      value: modelData ? modelData.categoryCount : '28',
      Icon: FolderIcon, theme: 'models',
      trend: modelData ? '已接入真实统计' : '6 大类',
      trendType: 'flat',
      sample: !modelData, link: '/model-library'
    },
    {
      label: '今日访问',
      value: visitData ? visitData.today.pv : '--',
      Icon: UsersIcon, theme: 'home',
      trend: visitData
        ? `较昨日 ${visitData.trendPct === null ? '—' : `${visitData.trendPct >= 0 ? '+' : ''}${visitData.trendPct}%`}`
        : '+23%',
      trendType: visitData && visitData.trendPct !== null && visitData.trendPct < 0 ? 'down' : (visitData ? 'up' : 'up'),
      sample: !visitData, link: '#stats'
    },
    {
      label: '工具使用',
      value: '89',
      Icon: ToolIcon, theme: 'toolbox',
      trend: '4 个工具',
      trendType: 'flat',
      sample: true, link: '/toolbox'
    }
  ]

  const features = [
    {
      title: '通用件模型库',
      description: '海量结构模型 · STP 3D 预览 · 关键词搜索 · 批量上传下载',
      Icon: CubeIcon,
      path: '/model-library',
      theme: 'models',
      tags: ['3D 预览', '94 配件', '6 分类']
    },
    {
      title: '设计百宝箱',
      description: 'DFM 初评 · BOM 成本 · 包装设计 · 水家电设计选型 · AI 助手',
      Icon: ToolIcon,
      path: '/toolbox',
      theme: 'toolbox',
      tags: ['BOM 导入', 'AI 助手', 'DFM']
    }
  ]

  const quickActions = [
    { id: 'search',  Icon: SearchIcon, label: '快速搜索', theme: 'models',   desc: '跳转模型库' },
    { id: 'upload',  Icon: UploadIcon, label: '上传模型', theme: 'home',     desc: '批量上传' },
    { id: 'bom',     Icon: CoinIcon,   label: 'BOM 导入', theme: 'products', desc: '成本预估' },
    { id: 'ai',      Icon: BotIcon,    label: 'AI 助手',  theme: 'toolbox',  desc: '系统设计' }
  ]

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleQuickAction = (action) => {
    switch (action) {
      case 'search':
      case 'upload':
        navigate('/model-library')
        if (action === 'upload') {
          setTimeout(() => window.dispatchEvent(new CustomEvent('trigger-upload')), 500)
        }
        break
      case 'bom':
        navigate('/toolbox')
        break
      case 'ai':
        navigate('/toolbox')
        setTimeout(() => window.dispatchEvent(new CustomEvent('open-ai-assistant')), 500)
        break
      default:
        break
    }
  }

  return (
    <div className="homepage animate-fadeIn">
      {/* Hero */}
      <section className="hero-section card hero-card">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            AI 智能引擎 · 多模块集成
          </div>
          <h2 className="hero-title">
            智能辅助，<span className="gradient-text">精准设计</span>
          </h2>
          <p className="hero-subtitle">
            水家电产品开发 AI 助手 · 您的专业智能工作伙伴
          </p>
        </div>
        <div className="hero-decoration" aria-hidden="true">
          <DropIcon className="deco-icon deco-a" />
          <GearIcon className="deco-icon deco-b" />
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-note">
          <InfoIcon className="note-icon" />
          {visitData || modelData
            ? '模型与访问数据为真实统计 · 点击「今日访问」查看趋势详情'
            : '以下为示例数据 · 统计服务连接后将自动切换为真实数据'}
        </div>
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`stat-card card theme-${stat.theme} stat-clickable`}
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => (stat.link === '#stats' ? setDrawerOpen(true) : navigate(stat.link))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (stat.link === '#stats') setDrawerOpen(true)
                  else navigate(stat.link)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="stat-icon"><stat.Icon /></div>
              <div className="stat-info">
                <div className="stat-value">
                  {stat.value}
                  {stat.sample && <span className="stat-sample-tag" title="该数值为示例数据">示例</span>}
                </div>
                <div className="stat-label">{stat.label}</div>
                <div className={`stat-trend ${stat.trendType}`}>
                  {stat.trendType === 'up' && <ArrowUpIcon className="trend-arrow" />}
                  {stat.trendType === 'down' && <ArrowUpIcon className="trend-arrow trend-arrow-down" />}
                  {stat.trend}
                </div>
              </div>
              <span className="stat-arrow">→</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h3 className="section-title">核心功能模块</h3>
        <div className="features-grid">
          {features.map((f, i) => (
            <Link key={i} to={f.path} className={`feature-card card theme-${f.theme}`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon-wrapper">
                <f.Icon />
              </div>
              <h4 className="feature-title">{f.title}</h4>
              <p className="feature-description">{f.description}</p>
              <div className="feature-tags">
                {f.tags.map(t => <span key={t} className="feature-tag">{t}</span>)}
              </div>
              <span className="feature-link">
                进入模块 <ArrowRightIcon className="arrow" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h3 className="section-title">快速操作</h3>
        <div className="actions-grid">
          {quickActions.map((a, i) => (
            <button
              key={a.id}
              className={`action-card card theme-${a.theme}`}
              onClick={() => handleQuickAction(a.id)}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className="action-icon"><a.Icon /></span>
              <span className="action-label">{a.label}</span>
              <span className="action-desc">{a.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {toast && (
        <div className={`hp-toast hp-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <StatsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data={visitData}
        loading={statsLoading}
        error={statsError}
      />
    </div>
  )
}

export default HomePage
