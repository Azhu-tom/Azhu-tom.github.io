import React, { useState } from 'react'
import './PackagingPanel.css'

/**
 * 包装工程AI工具面板
 * 通过 iframe 嵌入盒创 HeChuang 的核心功能模块
 * 支持的子页面：选材推荐、码托装柜、成本预估
 */
const TABS = [
  { key: 'recommend',  label: '选材推荐', icon: '📦' },
  { key: 'pallet',     label: '码托装柜', icon: '🚛' },
  { key: 'cost',       label: '成本预估', icon: '📊' },
]

// 盒创 HeChuang 各子页面的 iframe URL
const PAGES = {
  recommend: 'http://121.43.232.218/recommend',
  pallet:    'http://121.43.232.218/palletization',
  cost:      'http://121.43.232.218/learn',
}

function PackagingPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('recommend')
  const [loading, setLoading] = useState(true)

  return (
    <div className="packaging-overlay" onClick={onClose}>
      <div className="packaging-panel" onClick={e => e.stopPropagation()}>
        {/* 顶栏 */}
        <div className="packaging-header">
          <div className="packaging-title-row">
            <span className="packaging-icon">📦</span>
            <h3>包装工程AI工具</h3>
            <span className="packaging-badge">盒创 HeChuang</span>
          </div>
          <button className="packaging-close" onClick={onClose} title="关闭">
            ×
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="packaging-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`packaging-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setLoading(true) }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* iframe 容器 */}
        <div className="packaging-iframe-wrapper">
          {loading && (
            <div className="packaging-loading">
              <div className="packaging-spinner" />
              <p>加载中...</p>
            </div>
          )}
          <iframe
            src={PAGES[activeTab]}
            className={`packaging-iframe ${loading ? 'loading' : ''}`}
            title="盒创包装工程AI工具"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>

        {/* 底部提示 */}
        <div className="packaging-footer">
          <span>由 盒创 HeChuang 提供 · 包装全链路AI工作台</span>
          <button
            className="packaging-external-link"
            onClick={() => window.open(`http://121.43.232.218/${activeTab === 'cost' ? 'learn' : activeTab === 'pallet' ? 'palletization' : 'recommend'}`, '_blank')}
          >
            在新窗口打开 ↗
          </button>
        </div>
      </div>
    </div>
  )
}

export default PackagingPanel
