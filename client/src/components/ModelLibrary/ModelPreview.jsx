import React from 'react'
import ModelViewer3D from './ModelViewer3D'
import './ModelPreview.css'

function ModelPreview({ model, onClose }) {
  if (!model) return null

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="model-preview-panel animate-fadeIn">
      {/* 头部 */}
      <div className="preview-header">
        <h3>📋 模型详情</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {/* 物料编码（突出显示） */}
      <div className="preview-code-section">
        <span className="code-label">物料编码：</span>
        <code className="code-value">{model.code}</code>
        {model.has3DModel && (
          <span className="has-3d-tag">📐 有STP图纸</span>
        )}
      </div>

      {/* 主体内容区 */}
      <div className="preview-body">
        {/* 左侧：3D预览 + 基本信息 */}
        <div className="preview-left">
          {/* 3D预览区域 */}
          <div className="preview-3d-area">
            {model.has3DModel ? (
              <ModelViewer3D
                modelType={model.modelType || 'default'}
                autoRotate={true}
                compact={false}
                drawingFile={model.drawingFile}
              />
            ) : (
              <div className="placeholder-3d no-model">
                <span className="icon-large">📄</span>
                <p className="hint-text">暂无3D模型</p>
              </div>
            )}
          </div>

          {/* 基本信息卡片 */}
          <div className="info-card basic-info">
            <h4 className="card-title">基本信息</h4>

            <div className="info-grid-2col">
              <div className="info-field">
                <label>名称</label>
                <value>{model.name}</value>
              </div>
              <div className="info-field">
                <label>分类</label>
                <value>{model.category}</value>
              </div>
              <div className="info-field">
                <label>子分类</label>
                <value>{model.subcategory || '-'}</value>
              </div>
              <div className="info-field">
                <label>颜色</label>
                <value className="color-value">
                  <span
                    className="color-swatch"
                    style={{ background: getColorHex(model.color) }}
                  ></span>
                  {model.color || '-'}
                </value>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：详细规格参数 */}
        <div className="preview-right">
          {/* 规格描述 */}
          <div className="info-card spec-info">
            <h4 className="card-title">规格描述</h4>
            <p className="spec-text">{model.specification}</p>
          </div>

          {/* 材质与供应商 */}
          <div className="info-card material-supplier">
            <h4 className="card-title">材质与供应</h4>

            <div className="info-grid-2col">
              <div className="info-field">
                <label>主材料</label>
                <value className="highlight">{model.material || '-'}</value>
              </div>
              <div className="info-field">
                <label>供应商</label>
                <value>{model.supplier || '-'}</value>
              </div>
            </div>

            {model.features && model.features.length > 0 && (
              <div className="features-list">
                <label>特性标签</label>
                <div className="feature-tags">
                  {model.features.map((feat, i) => (
                    <span key={i} className="feature-tag">{feat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 文件与时间信息 */}
          <div className="info-card file-info">
            <h4 className="card-title">文件信息</h4>

            <div className="file-details">
              <div className="detail-row">
                <span className="detail-label">文件大小</span>
                <span className="detail-value">{model.size || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">文件名</span>
                <span className="detail-value file-name">{model.drawingFile || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">上传日期</span>
                <span className="detail-value">{formatDate(model.uploadDate)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">备注</span>
                <span className="detail-value remark">{model.remark || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="preview-footer-actions">
        <button
          className={`action-btn-primary ${!model.has3DModel ? 'disabled' : ''}`}
          disabled={!model.has3DModel}
          onClick={() => model.has3DModel && alert(`下载模型: ${model.drawingFile}`)}
        >
          ⬇️ 下载STP模型
        </button>
        <button className="action-btn-secondary" onClick={() => alert('查看技术文档')}>
          📄 查看技术文档
        </button>
        <button className="action-btn-secondary" onClick={() => alert('添加到BOM')}>
          📋 添加到BOM
        </button>
        <button className="action-btn-secondary" onClick={() => window.print()}>
          🖨️ 打印规格单
        </button>
      </div>
    </div>
  )
}

// 辅助函数：颜色名转HEX
function getColorHex(colorName) {
  const colorMap = {
    '白色': '#f5f5f5',
    '蓝色': '#3b82f6',
    '灰色': '#6b7280',
    '透明偏黄色': '#fef3c7',
    '黑色': '#000000'
  }
  return colorMap[colorName] || '#94a3b8'
}

export default ModelPreview
