import React, { useState } from 'react'
import { Thumbnail3D } from './ModelViewer3D'
import './ModelList.css'

function ModelList({ models = [], loading = false, onSelect, selectedId }) {
  const [viewMode, setViewMode] = useState('table') // 'table' or 'card'
  const [sortBy, setSortBy] = useState('code') // 'code' | 'name' | 'date'

  if (loading) {
    return (
      <div className="model-list-container">
        <div className="list-header skeleton-shimmer"></div>
        <div className="skeleton-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-item"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!models || models.length === 0) {
    return (
      <div className="model-list-container empty-state-wrapper">
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>未找到匹配的模型</h3>
          <p>请尝试调整搜索条件或选择其他分类</p>
        </div>
      </div>
    )
  }

  return (
    <div className="model-list-container">
      {/* 工具栏 */}
      <div className="list-toolbar">
        <div className="toolbar-left">
          <span className="result-count">
            共找到 <strong>{models.length}</strong> 条记录
          </span>
        </div>

        <div className="toolbar-right">
          {/* 排序选项 */}
          <div className="sort-group">
            <label className="sort-label">排序：</label>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="code">物料编码</option>
              <option value="name">名称</option>
              <option value="date">上传时间</option>
            </select>
          </div>

          {/* 视图切换 */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="表格视图"
            >
              ☰
            </button>
            <button
              className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title="卡片视图"
            >
              ▦
            </button>
          </div>
        </div>
      </div>

      {/* 表格视图 */}
      {viewMode === 'table' && (
        <div className="table-view">
          <table className="engineering-table">
            <thead>
              <tr>
                <th className="col-select">选择</th>
                <th className="col-preview">缩略图</th>
                <th className="col-code">物料编码</th>
                <th className="col-name">名称</th>
                <th className="col-spec">规格描述</th>
                <th className="col-material">材质</th>
                <th className="col-category">分类</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model, index) => (
                <tr
                  key={model.id}
                  className={selectedId === model.id ? 'selected-row' : ''}
                  onClick={() => onSelect && onSelect(model)}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <td className="cell-select">
                    <input
                      type="radio"
                      name="model-select"
                      checked={selectedId === model.id}
                      onChange={() => {}}
                    />
                  </td>
                  <td className="cell-preview">
                    {model.has3DModel ? (
                      <div className="thumbnail-3d-wrapper">
                        <Thumbnail3D
                          modelType={model.modelType || 'default'}
                          size={64}
                          drawingFile={model.drawingFile}
                        />
                      </div>
                    ) : (
                      <div className="thumbnail-badge no-3d">
                        📄
                      </div>
                    )}
                  </td>
                  <td className="cell-code">
                    <code>{model.code}</code>
                  </td>
                  <td className="cell-name">
                    <span className="model-name-text">{model.name}</span>
                  </td>
                  <td className="cell-spec">
                    <span className="spec-text" title={model.specification}>
                      {model.specification?.substring(0, 30)}
                      {model.specification && model.specification.length > 30 ? '...' : ''}
                    </span>
                  </td>
                  <td className="cell-material">
                    <span className="material-tag">{model.material?.split('(')[0]}</span>
                  </td>
                  <td className="cell-category">
                    <span className={`category-badge category-${model.category}`}>
                      {model.category}
                    </span>
                  </td>
                  <td className="cell-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(model)
                      }}
                      title="查看详情"
                    >
                      👁️
                    </button>
                    {model.has3DModel && (
                      <button
                        className="action-btn download-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          alert(`下载3D模型: ${model.drawingFile}`)
                        }}
                        title="下载STP文件"
                      >
                        ⬇️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 卡片视图 */}
      {viewMode === 'card' && (
        <div className="card-view">
          {models.map((model, index) => (
            <div
              key={model.id}
              className={`model-card-engineering ${selectedId === model.id ? 'selected' : ''}`}
              onClick={() => onSelect && onSelect(model)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* 卡片头部 - 颜色标识和3D标记 */}
              <div className="card-header" style={{
                background: `linear-gradient(135deg,
                  ${getColorForCategory(model.category)}22 0%,
                  transparent 100%)`
              }}>
                <div className="header-left">
                  {model.has3DModel ? (
                    <div className="card-thumbnail-3d">
                      <Thumbnail3D
                        modelType={model.modelType || 'default'}
                        size={56}
                        drawingFile={model.drawingFile}
                      />
                    </div>
                  ) : (
                    <div className="color-dot" style={{ background: getColorHex(model.color) }}></div>
                  )}
                  {model.has3DModel && (
                    <span className="has-3d-badge" title="有3D图纸">📐 STP</span>
                  )}
                </div>
                <span className="category-label">{model.category}</span>
              </div>

              {/* 物料编码（突出显示） */}
              <div className="card-code-section">
                <code className="material-code">{model.code}</code>
              </div>

              {/* 名称和规格 */}
              <div className="card-body">
                <h4 className="card-title">{model.name}</h4>
                <p className="card-spec">{model.specification}</p>

                {/* 材质标签 */}
                <div className="card-tags">
                  <span className="tag material">{model.material}</span>
                  {model.color && (
                    <span className="tag color">{model.color}</span>
                  )}
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className="card-footer">
                <span className="update-time">{model.uploadDate}</span>
                <div className="footer-actions">
                  <button
                    className="mini-btn detail-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(model)
                    }}
                  >
                    详情
                  </button>
                  {model.has3DModel && (
                    <button
                      className="mini-btn download-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        alert(`下载: ${model.drawingFile}`)
                      }}
                    >
                      下载
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页信息（模拟） */}
      <div className="pagination-info">
        <span>显示第 1-{models.length} 条，共 {models.length} 条记录</span>
      </div>
    </div>
  )
}

// 辅助函数：根据分类获取颜色
function getColorForCategory(category) {
  const colors = {
    '管接件': '#00d4ff',
    '阀门类': '#10b981',
    '管材类': '#f59e0b',
    '紧固件': '#7c3aed',
    '密封件': '#ef4444'
  }
  return colors[category] || '#64748b'
}

// 辅助函数：颜色名转HEX
function getColorHex(colorName) {
  const colorMap = {
    '白色': '#f5f5f5',
    '蓝色': '#3b82f6',
    '灰色': '#6b7280',
    '透明偏黄色': '#fef3c7',
    '黑色': '#000000',
    '红色': '#ef4444',
    '绿色': '#10b981'
  }
  return colorMap[colorName] || '#94a3b8'
}

export default ModelList
