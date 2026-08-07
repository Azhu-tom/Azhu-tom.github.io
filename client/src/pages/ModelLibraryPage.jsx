import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import modelData, { categories } from '../data/modelData'
import DetailPanel from '../components/ModelLibrary/DetailPanel'
import AISearchAssistant from '../components/ModelLibrary/AISearchAssistant'
import { toast } from '../utils/toast'
import './ModelLibraryPage.css'

/**
 * 静态缩略图图标（不依赖Three.js）
 */
function StaticThumbnail({ modelType = 'default', size = 48 }) {
  const typeConfig = {
    pump: { icon: '💧', bg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' },
    filter: { icon: '🛡️', bg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' },
    valve: { icon: '🔄', bg: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)' },
    fitting: { icon: '🔧', bg: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)' },
    adapter: { icon: '🔌', bg: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)' },
    screw: { icon: '⚙️', bg: 'linear-gradient(135deg, #334155 0%, #64748b 100%)' },
    default: { icon: '🔷', bg: 'linear-gradient(135deg, #0891b2 0%, #00d4ff 100%)' },
  }
  const cfg = typeConfig[modelType] || typeConfig.default

  return (
    <div style={{
      width: size, height: size, borderRadius: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: cfg.bg, fontSize: size * 0.45,
      cursor: 'pointer', transition: 'all 0.25s ease',
      border: '1px solid rgba(255,255,255,0.08)',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >{cfg.icon}</div>
  )
}

/**
 * 上传对话框组件
 */
function UploadDialog({ show, onClose, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [formData, setFormData] = useState({
    category: '未分类',
    description: '',
    code: ''
  })
  const fileInputRef = useRef(null)
  const dragRef = useRef(null)

  if (!show) return null

  // 处理文件选择
  const handleFileSelect = (files) => {
      const validFiles = Array.from(files).filter(file => {
        const ext = '.' + file.name.split('.').pop().toLowerCase()
        const allowed = ['.stp', '.step', '.prt', '.asm', '.glb', '.gltf', '.obj', '.iges', '.igs']
        if (!allowed.includes(ext)) {
          toast.warn(`不支持的格式: ${file.name}\n允许: STP, STEP, PRT, ASM, GLB, GLTF, OBJ, IGES`)
          return false
        }
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`文件过大: ${file.name} (最大50MB)`)
          return false
        }
        return true
      })
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  // 处理表单提交
  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.warn('请先选择要上传的文件')
      return
    }

    setUploading(true)
    try {
      for (const file of selectedFiles) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('name', file.name.replace(/\.[^/.]+$/, ''))
        uploadFormData.append('category', formData.category)
        uploadFormData.append('description', formData.description)
        uploadFormData.append('code', formData.code || file.name.replace(/\.[^/.]+$/, ''))

        // 获取当前会话信息用于认证
        const sessionStr = localStorage.getItem('auth_session_v2')
        let headers = {}
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr)
            headers['X-User-ID'] = String(session.id || '')
            headers['X-Username'] = String(session.username || '')
          } catch (e) { /* 忽略解析错误 */ }
        }

        const response = await fetch('/api/models/upload', {
          method: 'POST',
          body: uploadFormData,
          headers
        })

        const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || `上传 ${file.name} 失败`)
      }
    }

    toast.success(`成功上传 ${selectedFiles.length} 个文件`)
      setSelectedFiles([])
      setFormData({ category: '未分类', description: '', code: '' })
      onUploadSuccess?.()
      onClose()
    } catch (error) {
      toast.error(`上传失败: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()} ref={dragRef}>
        <div className="dialog-header">
          <h3>📤 上传模型文件</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="dialog-body">
          {/* 拖拽上传区域 */}
          <div
            className={`drop-zone ${dragOver ? 'active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".stp,.step,.prt,.asm,.glb,.gltf,.obj,.iges,.igs"
              style={{ display: 'none' }}
              onChange={e => handleFileSelect(e.target.files)}
            />
            <div className="drop-icon">📁</div>
            <p>拖放文件到此处，或点击选择文件</p>
            <p className="drop-hint">支持 STP / STEP / PRT / ASM / GLB 等格式（单文件≤50MB）</p>
          </div>

          {/* 已选文件列表 */}
          {selectedFiles.length > 0 && (
            <div className="selected-files-list">
              <h4>已选择 {selectedFiles.length} 个文件：</h4>
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="selected-file-item">
                  <span>📄</span>
                  <span>{file.name}</span>
                  <span>({(file.size / 1024).toFixed(1)} KB)</span>
                  <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 元数据表单 */}
          <div className="metadata-form">
            <div className="form-group">
              <label>分类 *</label>
              <select value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}>
                {categories.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>物料编码（可选）</label>
              <input
                type="text"
                placeholder="如：2CH01018006"
                value={formData.code}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>描述（可选）</label>
              <textarea
                placeholder="输入模型描述信息..."
                rows="2"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary-action" onClick={onClose} disabled={uploading}>
            取消
          </button>
          <button
            className="btn-primary-action"
            onClick={handleSubmit}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? '⏳ 上传中...' : `📤 上传${selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==================== 主页面 ==================== */

function ModelLibraryPage() {
  const { hasPermission, isAdmin, user } = useAuth()
  const [models] = useState(modelData)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModel, setSelectedModel] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(Date.now())

  // ===== 删除功能状态 =====
  const [deletedIds, setDeletedIds] = useState(new Set())       // 软删除ID集合（内存级）
  const [deleteConfirm, setDeleteConfirm] = useState(null)      // { model } 确认弹窗
  const [showDeletedPanel, setShowDeletedPanel] = useState(false) // 已删列表面板

  // 权限检查
  const canDelete = hasPermission('model:delete')

  // 软删除：过滤掉已删除的模型
  const activeModels = models.filter(m => !deletedIds.has(m.id))
  // 已删除的模型列表
  const deletedModels = models.filter(m => deletedIds.has(m.id))

  // 过滤（基于活跃模型）
  const filtered = activeModels.filter(m => {
    const catOk = selectedCategory === 'all' || m.category === selectedCategory
    const q = searchQuery.toLowerCase()
    const searchOk = !q || [m.code, m.name, m.specification, m.material].some(f => f?.toLowerCase().includes(q))
    return catOk && searchOk
  })

  // ===== 删除操作 =====

  // 打开删除确认弹窗
  const openDeleteConfirm = (model) => {
    if (!canDelete) {
      toast.error('⚠️ 您没有删除模型的权限')
      return
    }
    setDeleteConfirm({ model })
  }

  // 执行软删除
  const confirmDelete = () => {
    if (!deleteConfirm) return
    const { model } = deleteConfirm

    // 检查是否已删除
    if (deletedIds.has(model.id)) {
      toast.warn('该模型已被删除')
      setDeleteConfirm(null)
      return
    }

    // 执行软删除
    setDeletedIds(prev => new Set([...prev, model.id]))

    // 如果当前正在查看该模型的详情，关闭详情面板
    if (selectedModel && selectedModel.id === model.id) {
      setSelectedModel(null)
    }

    toast.success(`🗑️ 已删除: ${model.name} (${model.code})`)
    setDeleteConfirm(null)
    setLastUpdated(Date.now())
  }

  // 恢复已删除的模型
  const restoreModel = (modelId) => {
    setDeletedIds(prev => {
      const next = new Set(prev)
      next.delete(modelId)
      return next
    })
    const restored = models.find(m => m.id === modelId)
    toast.success(`✅ 已恢复: ${restored?.name || '模型'}`)
    setLastUpdated(Date.now())
  }

  // 批量清空回收站
  const clearTrash = () => {
    if (deletedIds.size === 0) return
    setDeletedIds(new Set())
    setShowDeletedPanel(false)
    toast.success(`🗑️ 已永久清除 ${deletedModels.length} 个已删除模型`)
  }

  return (
    <div className="model-library-page-v2">
      {/* 头部 */}
      <div className="page-header-bar">
        <div>
          <h1 className="page-title-main">📦 通用件模型库</h1>
          <p className="page-subtitle">
            标准配件物料管理系统 | 共 <strong>{activeModels.length}</strong> 条活跃记录
            {deletedIds.size > 0 && <span className="ml-deleted-hint"> | 🗑️ {deletedIds.size} 个已删除</span>}
            {' '}| 支持 STP/STEP/PRT/ASM/GLB 格式 | 基于真实Excel数据
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* 回收站按钮（仅管理员） */}
          {canDelete && (
            <button
              className={`btn-trash-btn ${deletedIds.size > 0 ? 'has-items' : ''}`}
              onClick={() => setShowDeletedPanel(true)}
              title="回收站"
            >
              🗑️ 回收站{deletedIds.size > 0 && ` (${deletedIds.size})`}
            </button>
          )}
          <button
            className="btn-primary-action btn-upload-main"
            onClick={() => setShowUpload(true)}
            title="上传新模型"
          >
            📤 上传模型
          </button>
        </div>
      </div>

      {/* 工具栏 - AI智能搜索 */}
      <div className="toolbar-section">
        <AISearchAssistant
          onSearchChange={setSearchQuery}
          onResultSelect={(model) => setSelectedModel(model)}
        />

        {/* 分类标签（使用真实类别数据） */}
        <div className="category-tags-row">
          {categories.slice(0, 15).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`category-tag-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              title={`${cat.name}: ${cat.count} 个`}
            >
              <span>{cat.icon}</span> {cat.name}
              <span className="count-badge">{cat.count}</span>
            </button>
          ))}
          {categories.length > 15 && (
            <button className="category-tag-btn more-btn" title="更多分类">
              +{categories.length - 15}
            </button>
          )}
        </div>
      </div>

      {/* 表格 */}
      <div className="models-table-container">
        <table className="models-data-table">
          <thead>
            <tr>
              <th width="60">类型</th>
              <th width="115">物料编码</th>
              <th width="110">名称</th>
              <th>规格描述</th>
              <th width="80">材质</th>
              <th width="70">图纸</th>
              <th width="120">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(model => (
              <tr key={model.id} onClick={() => setSelectedModel(model)} className="model-row">
                <td className="cell-thumbnail-3d">
                  <StaticThumbnail modelType={model.modelType} size={36} />
                </td>
                <td><code className="code-highlight">{model.code}</code></td>
                <td><strong>{model.name}</strong></td>
                <td className="spec-text" title={model.specification}>{model.specification?.substring(0, 40)}...</td>
                <td><span className="material-tag">{model.material?.split(' ')[0]}</span></td>
                <td className="cell-drawing-status">
                  {model.hasDrawing || model.has3DModel ? (
                    <span className="has-drawing-badge">✅</span>
                  ) : (
                    <span className="no-drawing-badge">❌</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      className="view-btn"
                      onClick={e => { e.stopPropagation(); setSelectedModel(model) }}
                      title="查看详情"
                    >📋</button>
                    {(model.hasDrawing || model.has3DModel) && (
                      <Link
                        to={`/model-library/viewer/${model.id}`}
                        className="view-btn view-btn-3d"
                        style={{ textDecoration: 'none', fontSize: '13px' }}
                        onClick={e => e.stopPropagation()}
                        title="3D预览"
                      >🎮</Link>
                    )}
                    {canDelete && (
                      <button
                        className="view-btn view-btn-delete"
                        onClick={e => { e.stopPropagation(); openDeleteConfirm(model) }}
                        title="删除模型（管理员）"
                      >🗑️</button>
                    )}
                    <button
                      className="view-btn view-btn-download"
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          const targetFile = model.drawingFile || `${model.code}.stp`
                          let resp = await fetch(`/api/models/download-stp/${encodeURIComponent(targetFile)}`)
                          if (!resp.ok) {
                            resp = await fetch(`/api/models/download/${encodeURIComponent(targetFile)}`)
                          }
                          if (resp.ok && !resp.headers.get('Content-Type')?.includes('json')) {
                            const blob = await resp.blob()
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = targetFile
                            a.click()
                            URL.revokeObjectURL(url)
                          } else {
                            toast.warn(`文件暂不可下载: ${targetFile}`)
                          }
                        } catch(err) {
                          toast.error('下载失败: ' + err.message)
                        }
                      }}
                      title="下载模型文件"
                    >⬇️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 移动端卡片视图 */}
        <div className="model-card-list">
          {filtered.map(model => (
            <div key={model.id} className="model-card-item" onClick={() => setSelectedModel(model)}>
              <div className="mc-thumb">
                <StaticThumbnail modelType={model.modelType} size={48} />
              </div>
              <div className="mc-info">
                <div className="mc-row1">
                  <code className="code-highlight">{model.code}</code>
                  <span className="material-tag">{model.material?.split(' ')[0]}</span>
                </div>
                <div className="mc-name"><strong>{model.name}</strong></div>
                <div className="mc-spec">{model.specification?.substring(0, 50)}</div>
              </div>
              <div className="mc-actions" onClick={e => e.stopPropagation()}>
                {(model.hasDrawing || model.has3DModel) && (
                  <Link to={`/model-library/viewer/${model.id}`} className="view-btn view-btn-3d" title="3D预览">🎮</Link>
                )}
                <button className="view-btn" onClick={() => setSelectedModel(model)} title="详情">📋</button>
                <button
                  className="view-btn view-btn-download"
                  title="下载"
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      const targetFile = model.drawingFile || `${model.code}.stp`
                      let resp = await fetch(`/api/models/download-stp/${encodeURIComponent(targetFile)}`)
                      if (!resp.ok) throw new Error('下载失败')
                      const blob = await resp.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url; a.download = targetFile; document.body.appendChild(a); a.click(); a.remove()
                      window.URL.revokeObjectURL(url)
                    } catch (err) { alert('下载失败: ' + err.message) }
                  }}
                >⬇️</button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>没有找到匹配的模型</p>
            {searchText.trim() && (
              <div className="empty-suggest">
                <span>试试搜索：</span>
                {['泵', '阀', '接头', '堵头', 'PP', 'ABS', '滤芯'].map(t => (
                  <button key={t} className="empty-suggest-tag" onClick={() => setSearchText(t)}>{t}</button>
                ))}
              </div>
            )}
            {!searchText.trim() && (
              <button className="empty-clear-btn" onClick={() => { setSelectedCat('all'); setSearchText('') }}>查看全部模型</button>
            )}
          </div>
        )}
      </div>

      {/* 详情面板 - 传入删除回调 */}
      <DetailPanel
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
        canDelete={canDelete}
        onDelete={(model) => openDeleteConfirm(model)}
      />

      {/* 上传对话框 */}
      <UploadDialog
        show={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadSuccess={() => setLastUpdated(Date.now())}
      />

      {/* ===== 删除确认弹窗 ===== */}
      {deleteConfirm && (
        <div className="ml-delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="ml-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="ml-delete-header">
              <span className="ml-delete-icon">⚠️</span>
              <h3>确认删除模型</h3>
            </div>
            <div className="ml-delete-body">
              <p className="ml-delete-warning">此操作将删除以下通用件模型：</p>
              <div className="ml-delete-target">
                <code>{deleteConfirm.model.code}</code>
                <strong>{deleteConfirm.model.name}</strong>
                <span className="ml-delete-cat">{deleteConfirm.model.category}</span>
              </div>
              <div className="ml-delete-notes">
                <p>✅ 软删除：数据保留在回收站，可随时恢复</p>
                <p>⚠️ 删除后该模型将从列表中隐藏</p>
              </div>
            </div>
            <div className="ml-delete-footer">
              <button className="btn-secondary-action" onClick={() => setDeleteConfirm(null)}>
                取消
              </button>
              <button
                className="btn-danger-action"
                onClick={confirmDelete}
              >
                🗑️ 确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 回收站面板（管理员）===== */}
      {showDeletedPanel && (
        <div className="ml-trash-overlay" onClick={() => setShowDeletedPanel(false)}>
          <div className="ml-trash-panel" onClick={e => e.stopPropagation()}>
            <div className="ml-trash-header">
              <h3>🗑️ 回收站</h3>
              <div className="ml-trash-actions">
                <span className="ml-trash-count">{deletedModels.length} 个已删除项</span>
                {deletedModels.length > 0 && (
                  <button
                    className="btn-danger-action btn-sm"
                    onClick={clearTrash}
                  >
                    清空回收站
                  </button>
                )}
                <button className="close-btn" onClick={() => setShowDeletedPanel(false)}>✕</button>
              </div>
            </div>
            <div className="ml-trash-body">
              {deletedModels.length === 0 ? (
                <div className="ml-trash-empty">
                  <span className="ml-trash-empty-icon">📭</span>
                  <p>回收站为空</p>
                </div>
              ) : (
                <table className="models-data-table ml-trash-table">
                  <thead>
                    <tr>
                      <th width="115">物料编码</th>
                      <th width="110">名称</th>
                      <th>分类</th>
                      <th width="100">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedModels.map(model => (
                      <tr key={model.id} className="ml-trash-row">
                        <td><code>{model.code}</code></td>
                        <td><strong>{model.name}</strong></td>
                        <td><span className="material-tag">{model.category}</span></td>
                        <td>
                          <button
                            className="btn-restore-btn"
                            onClick={() => restoreModel(model.id)}
                          >♻️ 恢复</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 页脚 */}
      <div className="stats-footer-bar">
        <span>共 <strong>{filtered.length}</strong> 条记录</span>
        <span>|</span>
        <span>分类: {categories.length - 1} 个</span>
        <span>|</span>
        <span>筛选: {selectedCategory === 'all' ? '全部' : categories.find(c => c.id === selectedCategory)?.name || selectedCategory}</span>
        {searchQuery && <><span>|</span><span>"{searchQuery}"</span></>}
      </div>
    </div>
  )
}

export default ModelLibraryPage
