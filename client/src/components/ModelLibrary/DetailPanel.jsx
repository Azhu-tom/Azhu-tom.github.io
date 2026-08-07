import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import OCCTViewer from './OCCTViewer'
import { toast } from '../../utils/toast'

/**
 * 详情面板（专业工程版 - 内嵌3D预览 + 完整属性卡片）
 */
function DetailPanel({ model, onClose, canDelete = false, onDelete }) {
  const [downloading, setDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState('info') // info | preview | files

  if (!model) return null

  // 下载处理函数（使用文件名直接从真实STP目录下载）
  const handleDownload = async () => {
    try {
      setDownloading(true)

      // 获取目标文件名
      const targetFile = model.drawingFile || `${model.code}.stp`

      // 优先使用专用STP下载接口
      let response = await fetch(`/api/models/download-stp/${encodeURIComponent(targetFile)}`, {
        method: 'GET'
      })

      // 如果专用接口失败，尝试通用接口
      if (!response.ok) {
        response = await fetch(`/api/models/download/${encodeURIComponent(targetFile)}`, {
          method: 'GET'
        })
      }

      if (response.ok) {
        const contentType = response.headers.get('Content-Type') || ''
        
        // 检查是否返回了JSON错误信息
        if (contentType.includes('application/json')) {
          const errorData = await response.json()
          
          // 如果文件不存在但有索引信息，显示可用的文件列表提示
          if (errorData.availableSamples && errorData.availableSamples.length > 0) {
            toast.warn(`文件暂不可下载: ${targetFile}\n系统已索引 ${errorData.totalIndexed || 0} 个STP文件`)
            return
          }
          
          throw new Error(errorData.message || '下载失败')
        }

        // 触发浏览器下载
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = targetFile
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        const errorText = await response.text()
        console.error('下载API响应:', errorText)
        throw new Error(`服务器返回 ${response.status}`)
      }
    } catch (error) {
      console.error('下载失败:', error)
      
      // 友好的错误提示
      if (error.message.includes('404') || error.message.includes('不存在') || error.message.includes('未找到')) {
        toast.warn(`该模型的STP文件暂不可下载\n文件: ${model.drawingFile || `${model.code}.stp`}\n可能原因：文件名与实际图纸库不匹配`)
      } else {
        toast.error(`下载失败: ${error.message}`)
      }
    } finally {
      setDownloading(false)
    }
  }

  // 复制文本到剪贴板
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} 已复制到剪贴板`)
    }).catch(() => {
      // 降级方案
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      toast.info(`${label} 已复制`)
    })
  }

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel-content detail-panel-enhanced" onClick={e => e.stopPropagation()}>
        {/* ===== 头部栏 ===== */}
        <div className="panel-header">
          <div className="header-left">
            <span className="panel-icon">📋</span>
            <div>
              <h3>模型详细信息</h3>
              <span className="header-code">{model.code}</span>
            </div>
          </div>
          <div className="header-actions">
            {canDelete && (
              <button
                className="btn-delete-model"
                onClick={e => { e.stopPropagation(); onDelete?.(model) }}
                title="删除此模型（管理员）"
              >
                🗑️ 删除模型
              </button>
            )}
            {model.hasDrawing && (
              <Link to={`/model-library/viewer/${model.id}`} className="btn-3d-view" onClick={e => e.stopPropagation()}>
                🎮 全屏3D
              </Link>
            )}
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ===== 标签页切换 ===== */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📄 属性信息
          </button>
          <button
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            🎲 3D预览
          </button>
          <button
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            📂 文件操作
          </button>
        </div>

        {/* ===== 内容区域 ===== */}
        <div className="panel-body-enhanced">
          {/* === 属性信息标签页 === */}
          {activeTab === 'info' && (
            <div className="info-tab-content">
              {/* 基本属性卡片组 */}
              <div className="attribute-cards-grid">
                {/* 主信息卡片 */}
                <div className="attr-card attr-card-primary">
                  <div className="attr-card-header">
                    <span className="card-icon">🏷️</span>
                    <h4>基本信息</h4>
                  </div>
                  <div className="attr-card-body">
                    <div className="attr-row">
                      <label>物料名称</label>
                      <value>{model.name}</value>
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(model.name, '名称')}
                        title="复制"
                      >📋</button>
                    </div>
                    <div className="attr-row">
                      <label>物料编码</label>
                      <value><code className="code-value">{model.code}</code></value>
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(model.code, '物料编码')}
                        title="复制"
                      >📋</button>
                    </div>
                    <div className="attr-row">
                      <label>分类类别</label>
                      <value><span className="category-badge">{model.category}</span></value>
                    </div>
                    <div className="attr-row">
                      <label>模型类型</label>
                      <value><span className="type-badge">{model.modelType || 'default'}</span></value>
                    </div>
                  </div>
                </div>

                {/* 规格参数卡片 */}
                <div className="attr-card">
                  <div className="attr-card-header">
                    <span className="card-icon">📐</span>
                    <h4>规格参数</h4>
                  </div>
                  <div className="attr-card-body">
                    <div className="attr-row">
                      <label>材质</label>
                      <value>{model.material || '-'}</value>
                    </div>
                    <div className="attr-row">
                      <label>颜色</label>
                      <value>
                        {model.color ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              className="color-swatch"
                              style={{ background: getColorHex(model.color) }}
                            />
                            {model.color}
                          </span>
                        ) : '-'}
                      </value>
                    </div>
                    <div className="attr-row attr-row-full">
                      <label>规格描述</label>
                      <value className="spec-value">{model.specification || '-'}</value>
                    </div>
                  </div>
                </div>

                {/* 文件信息卡片 */}
                <div className="attr-card">
                  <div className="attr-card-header">
                    <span className="card-icon">💾</span>
                    <h4>文件信息</h4>
                  </div>
                  <div className="attr-card-body">
                    <div className="attr-row">
                      <label>图纸状态</label>
                      <value>
                        {model.hasDrawing || model.has3DModel ? (
                          <span className="status-badge status-yes">✅ 有STP图纸</span>
                        ) : (
                          <span className="status-badge status-no">❌ 无图纸</span>
                        )}
                      </value>
                    </div>
                    <div className="attr-row">
                      <label>STP文件名</label>
                      <value>
                        <code className="filename-code">{model.drawingFile || '无'}</code>
                      </value>
                    </div>
                    <div className="attr-row">
                      <label>文件大小</label>
                      <value>{model.size || '-'}</value>
                    </div>
                    <div className="attr-row">
                      <label>上传日期</label>
                      <value>{model.uploadDate || '-'}</value>
                    </div>
                  </div>
                </div>

                {/* 备注/说明卡片 */}
                {(model.remark) && (
                  <div className="attr-card attr-card-full-width">
                    <div className="attr-card-header">
                      <span className="card-icon">📝</span>
                      <h4>备注与说明</h4>
                    </div>
                    <div className="attr-card-body">
                      <p className="remark-text">{model.remark}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === 3D预览标签页 === */}
          {activeTab === 'preview' && (
            <div className="preview-tab-content">
              <div className="preview-container">
                {/* 3D预览 - 使用增强版CAD查看器（稳定架构） */}
                <div className="preview-container-inner">
                  <OCCTViewer
                    modelType={model.modelType || 'default'}
                    fileName={model.drawingFile}
                    width="100%"
                    height="100%"
                    showControls={true}
                    autoRotate={true}
                    backgroundColor="#f8fafc"
                    onLoaded={(info) => {
                      console.log(`[3D] 模型加载完成: ${info.name}`)
                    }}
                    onError={(err) => {
                      console.warn('[3D] 加载失败:', err.message)
                    }}
                  />
                </div>
              </div>
              <div className="preview-info-bar">
                <span className="preview-label">
                  🔷 当前预览: <strong>{model.name}</strong> ({model.code})
                </span>
                <span className="preview-hint">
                  Three.js 3D渲染 · 交互式预览
                </span>
              </div>
              {model.hasDrawing && (
                <div className="full-preview-link">
                  <Link to={`/model-library/viewer/${model.id}`} className="btn-goto-full-3d">
                    🎮 进入全屏3D查看器 →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* === 文件操作标签页 === */}
          {activeTab === 'files' && (
            <div className="files-tab-content">
              <div className="file-action-section">
                <div className="action-header">
                  <span className="action-icon">⬇️</span>
                  <h4>下载模型文件</h4>
                </div>
                <p className="action-desc">
                  下载该模型的原始 CAD 图纸文件（STP 格式），可用于导入 SolidWorks、Pro/E 等工程设计软件。
                </p>
                <div className="download-file-info">
                  <div className="file-info-item">
                    <span className="file-label">目标文件</span>
                    <span className="file-value">{model.drawingFile || `${model.code}.stp`}</span>
                  </div>
                  <div className="file-info-item">
                    <span className="file-label">文件格式</span>
                    <span className="file-value">STEP (.stp)</span>
                  </div>
                  <div className="file-info-item">
                    <span className="file-label">兼容软件</span>
                    <span className="file-value">SolidWorks / Pro-E / UG / CATIA</span>
                  </div>
                </div>
                <button
                  className={`btn-download-large ${downloading ? 'downloading' : ''}`}
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>⏳ 正在准备下载...</>
                  ) : (
                    <>⬇️ 下载 STP 模型文件</>
                  )}
                </button>
              </div>

              <div className="file-divider" />

              <div className="other-actions-grid">
                <button className="action-card-btn" onClick={() => {
                  const bomText = `${model.code}\t${model.name}\t${model.material || '-'}\t${model.specification || '-'}\t${model.category}`
                  navigator.clipboard.writeText(bomText).then(() => {
                    alert(`📋 已复制到剪贴板：\n${bomText}`)
                  }).catch(() => {
                    alert('⚠️ 复制失败，请手动复制')
                  })
                }}>
                  <span className="action-card-icon">📋</span>
                  <span className="action-card-label">加入 BOM 清单</span>
                </button>
                <button className="action-card-btn" onClick={() => {
                  const printContent = `物料编码：${model.code}\n名称：${model.name}\n材质：${model.material || '-'}\n规格：${model.specification || '-'}\n分类：${model.category}\n图纸：${model.drawingFile || '-'}`
                  const win = window.open('', '_blank')
                  win.document.write(`<pre style="font-family:monospace;padding:20px">${printContent}</pre>`)
                  win.document.close()
                  win.print()
                }}>
                  <span className="action-card-icon">🖨️</span>
                  <span className="action-card-label">打印规格单</span>
                </button>
                <button className="action-card-btn" onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${model.code} - ${model.name}`,
                      text: `查看 ${model.name} (${model.code}) 的模型详情`,
                      url: window.location.origin + `/model-library/viewer/${model.id}`
                    }).catch(() => { /* 用户取消分享 */ })
                  } else {
                    navigator.clipboard.writeText(window.location.origin + `/model-library/viewer/${model.id}`)
                      .then(() => alert('🔗 链接已复制到剪贴板，可通过微信/邮件分享给同事'))
                      .catch(() => alert('⚠️ 分享功能不可用'))
                  }
                }}>
                  <span className="action-card-icon">📤</span>
                  <span className="action-card-label">分享给同事</span>
                </button>
                <button className="action-card-btn" onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + `/model-library/viewer/${model.id}`)
                    .then(() => alert('🔗 链接已复制到剪贴板'))
                    .catch(() => alert('⚠️ 复制失败'))
                }}>
                  <span className="action-card-icon">🔗</span>
                  <span className="action-card-label">复制链接</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== 底部操作栏 ===== */}
        <div className="panel-footer-bar">
          <div className="footer-left">
            <span className="footer-model-name">{model.name}</span>
            <span className="footer-sep">|</span>
            <code className="footer-model-code">{model.code}</code>
          </div>
          <div className="footer-right">
            <button className="footer-btn footer-btn-primary" onClick={handleDownload} disabled={downloading}>
              ⬇️ 下载
            </button>
            <button className="footer-btn" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 辅助函数：获取颜色十六进制值
function getColorHex(colorName) {
  const colorMap = {
    '白色': '#f5f5f5',
    '蓝色': '#3b82f6',
    '红色': '#ef4444',
    '绿色': '#22c55e',
    '黄色': '#eab308',
    '黑色': '#171717',
    '灰色': '#6b7280',
    '透明': '#e5e7eb',
  }
  return colorMap[colorName] || '#94a3b8'
}

export default DetailPanel
