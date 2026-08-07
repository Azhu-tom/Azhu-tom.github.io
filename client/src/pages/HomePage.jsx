import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './HomePage.css'

function HomePage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  const stats = [
    { label: '模型总数', value: '1,234', icon: '📦', theme: 'models',   trend: '+12 本周', link: '/model-library' },
    { label: '分类数量', value: '28', icon: '📂', theme: 'products', trend: '6 大类',    link: '/product-management' },
    { label: '今日访问', value: '567', icon: '👥', theme: 'home',     trend: '+23%',      link: '/' },
    { label: '工具使用', value: '89', icon: '🛠️', theme: 'toolbox',  trend: '4 个工具',  link: '/toolbox' }
  ]

  const features = [
    {
      title: '通用件模型库',
      description: '海量结构模型 · STP 3D 预览 · 关键词搜索 · 批量上传下载',
      icon: '📦',
      path: '/model-library',
      theme: 'models',
      color: '#06b6d4',
      tags: ['3D 预览', '94 配件', '6 分类']
    },
    {
      title: '设计百宝箱',
      description: 'DFM 初评 · BOM 成本 · 包装设计 · 水家电设计选型 · AI 助手',
      icon: '🛠️',
      path: '/toolbox',
      theme: 'toolbox',
      color: '#8b5cf6',
      tags: ['BOM 导入', 'AI 助手', 'DFM']
    },
    {
      title: '产品线管理',
      description: '净水/饮水/台净三线产品 · BOM CRUD · 设计规范文档',
      icon: '📋',
      path: '/products',
      theme: 'products',
      color: '#10b981',
      tags: ['净水机', '饮水机', '台净']
    }
  ]

  const quickActions = [
    { id: 'search',   icon: '🔍', label: '快速搜索',  theme: 'models',   desc: '跳转模型库' },
    { id: 'upload',   icon: '⬆️', label: '上传模型',  theme: 'models',   desc: '批量上传' },
    { id: 'bom',      icon: '💰', label: 'BOM 导入',  theme: 'products', desc: '成本预估' },
    { id: 'ai',       icon: '🤖', label: 'AI 助手',  theme: 'toolbox',  desc: '系统设计' }
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
            水家电产品开发AI助手 - 您的专业智能工作伙伴
          </p>
        </div>
        <div className="hero-decoration" aria-hidden="true">
          <span className="deco-icon">💧</span>
          <span className="deco-icon">⚙️</span>
          <span className="deco-icon">🔬</span>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-note">ⓘ 以下为示例数据 · 后续接入真实统计</div>
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className={`stat-card card theme-${stat.theme} stat-clickable`} style={{ animationDelay: `${i * 0.08}s` }} onClick={() => navigate(stat.link)} role="button" tabIndex={0}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-trend">{stat.trend}</div>
              </div>
              <span className="stat-arrow">→</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h3 className="section-title">
          <span className="title-icon">⭐</span> 核心功能模块
        </h3>
        <div className="features-grid">
          {features.map((f, i) => (
            <Link key={i} to={f.path} className={`feature-card card theme-${f.theme}`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon-wrapper" style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}cc)` }}>
                <span className="feature-icon">{f.icon}</span>
              </div>
              <h4 className="feature-title">{f.title}</h4>
              <p className="feature-description">{f.description}</p>
              <div className="feature-tags">
                {f.tags.map(t => <span key={t} className="feature-tag">{t}</span>)}
              </div>
              <span className="feature-link">
                进入模块 <span className="arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h3 className="section-title">
          <span className="title-icon">⚡</span> 快速操作
        </h3>
        <div className="actions-grid">
          {quickActions.map((a, i) => (
            <button
              key={a.id}
              className={`action-card card theme-${a.theme}`}
              onClick={() => handleQuickAction(a.id)}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className="action-icon">{a.icon}</span>
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
    </div>
  )
}

export default HomePage