/**
 * 结构高频数据库 - 工程手册库面板
 *
 * 功能：
 * - 分类浏览（10大工程手册分类）
 * - 关键词搜索（标题/标签/描述）
 * - PDF文件上传（拖拽+点击）
 * - 手册列表（网格/列表视图切换）
 * - PDF预览（内嵌查看器）
 * - 收藏功能（快速访问常用手册）
 * - 书签标记（记录重要页码位置）
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import './HandbookLibrary.css'
import { toast } from '../../utils/toast'
import * as XLSX from 'xlsx'

// 自动检测 API URL：GitHub Pages 部署时指向 Render 后端，本地开发用 proxy
const API_BASE = (typeof window !== 'undefined' && window.location.hostname.includes('github.io'))
  ? 'https://structural-engineer-ai-api.onrender.com'
  : ''

// ==================== 手册分类定义 ====================
const HANDBOOK_CATEGORIES = [
  { id: 'gb', name: '国家标准', icon: '🏛️', desc: 'GB/T 国标规范' },
  { id: 'material', name: '材料手册', icon: '📗', desc: '金属、塑料、橡胶等材料参数' },
  { id: 'mechanical', name: '机械设计', icon: '⚙️', desc: '设计基础、传动、连接' },
  { id: 'mold', name: '模具设计', icon: '🔧', desc: '注塑模、冲压模指南' },
  { id: 'tolerance', name: '公差配合', icon: '📐', desc: '尺寸公差、形位公差标准' },
  { id: 'surface', name: '表面处理', icon: '✨', desc: '电镀、喷涂、阳极氧化' },
  { id: 'fastener', name: '紧固件规格', icon: '🔩', desc: '螺钉、螺栓、螺母规格表' },
  { id: 'water-appliance', name: '水家电设计', icon: '💧', desc: '净水器/饮水机行业参考' },
  { id: 'electrical', name: '电气安全', icon: '⚡', desc: '安规、EMC、CCC认证资料' },
  { id: 'other', name: '其他资料', icon: '📁', desc: '其他工程参考资料' }
]

// 文件类型图标映射
const FILE_TYPE_ICONS = {
  pdf: { color: '#e53935', icon: '📄' },
  doc: { color: '#1565c0', icon: '📘' },
  docx: { color: '#1565c0', icon: '📘' },
  xls: { color: '#2e7d32', icon: '📊' },
  xlsx: { color: '#2e7d32', icon: '📊' },
  ppt: { color: '#d84315', icon: '📙' },
  pptx: { color: '#d84315', icon: '📙' },
  stp: { color: '#6a1b9a', icon: '🔷' },
  step: { color: '#6a1b9a', icon: '🔷' },
  dwg: { color: '#00695c', icon: '📐' },
  dxf: { color: '#00695c', icon: '📐' },
  default: { color: '#78909c', icon: '📄' }
}

// ==================== 主组件 ====================
export default function HandbookLibrary({ onClose }) {
  // ---- 状态 ----
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [books, setBooks] = useState([])
  const [favorites, setFavorites] = useState([])
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewBook, setPreviewBook] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)        // iframe/img/video/audio 通用 URL
  const [previewContent, setPreviewContent] = useState('')  // 文本/表格内容
  const [previewType, setPreviewType] = useState(null)      // 当前预览类型分类
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [showFavPanel, setShowFavPanel] = useState(false)
  
  // 上传相关
  const fileInputRef = useRef(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  // ---- 加载手册列表 ----
  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: activeCategory,
        search: searchKeyword,
        sort: 'uploadedAt',
        order: 'desc',
        limit: '100'
      })
      const listUrl = `${API_BASE}/api/handbook/list?${params}`
      const res = await fetch(listUrl)
      const data = await res.json()
      if (data.success) {
        setBooks(data.data || [])
        setStats(data.stats)
      }
    } catch (err) {
      console.error('[Handbook] Load error:', err)
    }
    setLoading(false)
  }, [activeCategory, searchKeyword])

  // ---- Esc 关闭预览弹窗 ----
  useEffect(() => {
    if (!showPreviewModal) return
    const onKey = (e) => { if (e.key === 'Escape') closePreview() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showPreviewModal])

  // ---- 初始化加载 ----
  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  // ---- 加载收藏列表 ----
  useEffect(() => {
    fetch(`${API_BASE}/api/handbook/favorites/list`)
      .then(r => r.json())
      .then(d => { if (d.success) setFavorites(d.data || []) })
      .catch(() => {})
  }, [])

  // ---- 搜索（防抖） ----
  const searchTimerRef = useRef(null)
  const handleSearch = (val) => {
    setSearchKeyword(val)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {}, 300) // 由useEffect触发fetch
  }

  // ---- 文件上传 ----
  const handleFileSelect = async (e) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    setUploadProgress(0)

    for (const file of Array.from(files)) {
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('category', activeCategory !== 'all' ? activeCategory : 'other')
        form.append('title', file.name.replace(/\.[^.]+$/, ''))

        const xhr = new XMLHttpRequest()
        await new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', e => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 90)
              setUploadProgress(pct)
            }
          })
          xhr.onload = () => resolve()
          xhr.onerror = () => reject(new Error('上传失败'))
          xhr.open('POST', `${API_BASE}/api/handbook/upload`)
          xhr.send(form)
        })

        setUploadProgress(100)
      } catch (err) {
        toast.error(`上传失败: ${file.name}\n${err.message}`)
      }
    }

    setUploading(false)
    setUploadProgress(0)
    setShowUploadModal(false)
    
    // 清空 input 以便重复选择同一文件
    if (fileInputRef.current) fileInputRef.current.value = ''
    
    // 刷新列表
    fetchBooks()
  }

  // ---- 收藏操作 ----
  const toggleFavorite = async (bookId) => {
    try {
      const isFav = favorites.some(f => f.bookId === bookId)
      const method = isFav ? 'DELETE' : 'POST'
      await fetch(`${API_BASE}/api/handbook/${bookId}/favorite`, { method })
      
      if (isFav) {
        setFavorites(prev => prev.filter(f => f.bookId !== bookId))
        setBooks(prev => prev.map(b => b.id === bookId ? {...b, favoriteCount: Math.max(0, (b.favoriteCount||0)-1)} : b))
      } else {
        setFavorites(prev => [...prev, { bookId: bookId, addedAt: new Date().toISOString() }])
        setBooks(prev => prev.map(b => b.id === bookId ? {...b, favoriteCount: (b.favoriteCount||0)+1} : b))
      }
    } catch (err) {
      console.error('[Handbook] Favorite error:', err)
    }
  }

  // ---- 预览文件（多格式支持） ----
  const openPreview = async (book) => {
    setPreviewBook(book)
    setPreviewContent('')
    setPreviewError(null)
    setShowPreviewModal(true)
  }

  const closePreview = () => {
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl) } catch {}
    }
    setShowPreviewModal(false)
    setPreviewBook(null)
    setPreviewUrl(null)
    setPreviewContent('')
    setPreviewType(null)
    setPreviewError(null)
  }

  // 加载预览内容（按文件类型分发）
  useEffect(() => {
    if (!previewBook || !showPreviewModal) return

    const ext = String(previewBook.fileType || '').toLowerCase()
    const downloadUrl = `${API_BASE}/api/handbook/download/${previewBook.id}`
    setPreviewUrl(downloadUrl)

    // 文本类：fetch + 文本/表格解析
    const textLike = ['txt', 'md', 'json', 'csv', 'log', 'xml', 'yaml', 'yml', 'js', 'css', 'html', 'ts', 'tsx', 'jsx']
    const tableLike = ['xlsx', 'xls']
    const unsupported = ['doc', 'docx', 'ppt', 'pptx', 'stp', 'step', 'dwg', 'dxf', 'zip', 'rar', '7z', 'tar', 'gz']

    if (textLike.includes(ext)) {
      setPreviewType('text')
      setPreviewLoading(true)
      fetch(downloadUrl).then(r => r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))
        .then(text => { setPreviewContent(text.slice(0, 50000)); setPreviewLoading(false) })
        .catch(err => { setPreviewError(err.message); setPreviewLoading(false) })
    } else if (tableLike.includes(ext)) {
      setPreviewType('table')
      setPreviewLoading(true)
      fetch(downloadUrl).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}`)))
        .then(buf => {
          const wb = XLSX.read(buf, { type: 'array' })
          const sheetName = wb.SheetNames[0]
          const sheet = wb.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
          setPreviewContent({ sheetName, rows: rows.slice(0, 200), totalRows: rows.length })
          setPreviewLoading(false)
        })
        .catch(err => { setPreviewError(err.message); setPreviewLoading(false) })
    } else if (unsupported.includes(ext)) {
      setPreviewType('unsupported')
    } else if (['pdf'].includes(ext)) {
      setPreviewType('pdf')
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      setPreviewType('image')
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
      setPreviewType('video')
    } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
      setPreviewType('audio')
    } else {
      // 其他未知格式：尝试通用预览
      setPreviewType('unsupported')
    }
  }, [previewBook, showPreviewModal])

  // ---- 下载文件 ----
  const handleDownload = async (book) => {
    window.open(`${API_BASE}/api/handbook/download/${book.id}`, '_blank')
  }

  // ---- 删除文件 ----
  const handleDelete = async (book) => {
    if (!window.confirm(`确定要删除「${book.title}」吗？`)) return

    try {
      await fetch(`${API_BASE}/api/handbook/${book.id}`, { method: 'DELETE' })
      setBooks(prev => prev.filter(b => b.id !== book.id))
      setFavorites(prev => prev.filter(f => f.bookId !== book.id))
      toast.success(`已删除「${book.title}」`)
    } catch (err) {
      toast.error('删除失败: ' + err.message)
    }
  }

  // ---- 工具函数 ----
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const getFileTypeInfo = (ext) => {
    return FILE_TYPE_ICONS[ext] || FILE_TYPE_ICONS.default
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const isFavorite = (bookId) => favorites.some(f => f.bookId === bookId)

  // ==================== 渲染 ====================
  return (
    <div className="hlib-overlay" onClick={onClose}>
      <div className="hlib-panel" onClick={e => e.stopPropagation()}>
        
        {/* ====== 头部 ====== */}
        <div className="hlib-header">
          <div className="hlib-header-left">
            <span className="hlib-header-icon">📚</span>
            <div>
              <h2 className="hlib-title">结构高频数据库</h2>
              <span className="hlib-subtitle">工程手册 · 设计规范 · 参考资料</span>
            </div>
          </div>
          <button className="hlib-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ====== 工具栏 ====== */}
        <div className="hlib-toolbar">
          {/* 搜索框 */}
          <div className="hlib-search-box">
            <span className="hlib-search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索手册名称、标签..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchBooks() }}
              className="hlib-search-input"
            />
            {(searchKeyword && (
              <button className="hlib-search-clear" onClick={() => { setSearchKeyword(''); fetchBooks(); }}>✕</button>
            ))}
          </div>

          {/* 操作按钮组 */}
          <div className="hlib-toolbar-actions">
            <button className={`hlib-tbtn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="网格视图">
              ⊞
            </button>
            <button className={`hlib-tbtn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="列表视图">
              ☰
            </button>
            <button className="hlib-tbtn fav-toggle" onClick={() => setShowFavPanel(!showFavPanel)} title="我的收藏">
              ★ 收藏{favorites.length > 0 && `(${favorites.length})`}
            </button>
            <button className="hlib-tbtn primary" onClick={() => setShowUploadModal(true)} title="上传手册">
              📤 上传
            </button>
          </div>
        </div>

        {/* ====== 分类栏 ====== */}
        <div className="hlib-categories-bar">
          <button
            className={`hlib-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            📋 全部
          </button>
          {HANDBOOK_CATEGORIES.map(cat => {
            const count = stats?.byCategory?.[cat.id] || 0
            return (
              <button
                key={cat.id}
                className={`hlib-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
                title={cat.desc}
              >
                {cat.icon} {cat.name}{count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>

        {/* ====== 内容区 ====== */}
        <div className="hlib-content-area">

          {/* 收藏侧边面板 */}
          {showFavPanel && (
            <aside className="hlib-fav-sidebar">
              <h3>⭐ 我的收藏 ({favorites.length})</h3>
              {favorites.length === 0 ? (
                <p className="hlib-empty-tip">暂无收藏，点击手册卡片上的★添加</p>
              ) : (
                <div className="hlib-fav-list">
                  {favorites.map(fav => {
                    const book = books.find(b => b.id === fav.bookId)
                    if (!book) return null
                    const fi = getFileTypeInfo(book.fileType)
                    return (
                      <div key={fav.bookId} className="hlib-fav-item" onClick={() => openPreview(book)}>
                        <span className="hlib-fav-icon">{fi.icon}</span>
                        <span className="hlib-fav-title">{book.title}</span>
                        <span className="hlib-fav-size">{formatSize(book.fileSize)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </aside>
          )}

          {/* 手册列表主体 */}
          <main className={`hlib-main ${showFavPanel ? 'with-sidebar' : ''}`}>
            
            {/* 统计信息 */}
            <div className="hlib-stats-bar">
              共 <strong>{stats?.totalBooks || books.length}</strong> 本手册
              {searchKeyword && ` · 搜索"${searchKeyword}"结果 ${books.length} 条`}
            </div>

            {/* 加载状态 */}
            {loading && (
              <div className="hlib-loading-state">
                <div className="hlib-mini-spinner"></div>
                <span>正在加载...</span>
              </div>
            )}

            {/* 空状态 */}
            {!loading && books.length === 0 && (
              <div className="hlib-empty-state">
                <div className="hlib-empty-icon">📂</div>
                <h3>{searchKeyword ? '未找到匹配的手册' : '暂无手册文件'}</h3>
                <p>{searchKeyword ? '尝试其他关键词或分类筛选' : '点击"上传"按钮添加您的工程手册和设计资料'}</p>
                {!searchKeyword && (
                  <button className="hlib-upload-cta" onClick={() => setShowUploadModal(true)}>
                    📤 上传第一本手册
                  </button>
                )}
              </div>
            )}

            {/* 网格视图 */}
            {!loading && viewMode === 'grid' && books.length > 0 && (
              <div className="hlib-grid">
                {books.map(book => {
                  const fi = getFileTypeInfo(book.fileType)
                  const favorited = isFavorite(book.id)
                  return (
                    <div key={book.id} className="hlib-card" onDoubleClick={() => openPreview(book)}>
                      {/* 卡片封面区域 */}
                      <div className="hlib-card-cover" style={{ borderLeftColor: fi.color }}>
                        <div className="hlib-card-file-icon" style={{ backgroundColor: fi.color + '15', color: fi.color }}>
                          {fi.icon}
                        </div>
                        <span className="hlib-card-ext">{book.fileType.toUpperCase()}</span>
                        <span className="hlib-card-hint">双击预览</span>

                        {/* 快捷操作 */}
                        <div className="hlib-card-actions">
                          <button
                            className={`hlib-action-btn fav ${favorited ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(book.id) }}
                            title={favorited ? '取消收藏' : '收藏'}
                          >
                            {favorited ? '★' : '☆'}
                          </button>
                          <button className="hlib-action-btn" onClick={(e) => { e.stopPropagation(); openPreview(book) }} title="预览">👁</button>
                          <button className="hlib-action-btn" onClick={(e) => { e.stopPropagation(); handleDownload(book) }} title="下载">
                            ⬇
                          </button>
                          <button className="hlib-action-btn danger" onClick={(e) => { e.stopPropagation(); handleDelete(book) }} title="删除">
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* 卡片信息 */}
                      <div className="hlib-card-info">
                        <h4 className="hlib-card-title" title={book.title}>{book.title}</h4>
                        <div className="hlib-card-meta">
                          <span>{formatSize(book.fileSize)}</span>
                          <span>{formatDate(book.uploadedAt)}</span>
                        </div>
                        <div className="hlib-card-tags">
                          {HANDBOOK_CATEGORIES.find(c => c.id === book.category)?.icon}{' '}
                          {HANDBOOK_CATEGORIES.find(c => c.id === book.category)?.name || book.category}
                          {favorited && <span className="hlib-tag-fav">已收藏</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 列表视图 */}
            {!loading && viewMode === 'list' && books.length > 0 && (
              <table className="hlib-table">
                <thead>
                  <tr>
                    <th>文件名</th>
                    <th>分类</th>
                    <th>大小</th>
                    <th>上传时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(book => {
                    const fi = getFileTypeInfo(book.fileType)
                    const favorited = isFavorite(book.id)
                    return (
                      <tr key={book.id}>
                        <td className="hlib-table-name">
                          <span className="hlib-table-icon" style={{color: fi.color}}>{fi.icon}</span>
                          <span className="name-text" title={book.title}>{book.title}</span>
                        </td>
                        <td>
                          <span className="hlib-cat-badge">
                            {HANDBOOK_CATEGORIES.find(c => c.id === book.category)?.icon || ''}{' '}
                            {HANDBOOK_CATEGORIES.find(c => c.id === book.category)?.name || book.category}
                          </span>
                        </td>
                        <td>{formatSize(book.fileSize)}</td>
                        <td>{formatDate(book.uploadedAt)}</td>
                        <td>
                          <div className="hlib-table-actions">
                            <button className="hlink" onClick={() => openPreview(book)}>预览</button>
                            <button className="hlink" onClick={() => toggleFavorite(book.id)}>
                              {favorited ? '★已收' : '☆收藏'}
                            </button>
                            <button className="hlink" onClick={() => handleDownload(book)}>下载</button>
                            <button className="hlink danger" onClick={() => handleDelete(book)}>删除</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </main>
        </div>

        {/* ====== 底部信息栏 ====== */}
        <div className="hlib-footer">
          <span>💡 <strong>双击卡片预览</strong> · 支持 PDF/图片/视频/音频/文本/XLSX · 星标收藏常用资料 · Esc 关闭预览</span>
        </div>
      </div>

      {/* ====== 上传弹窗 ====== */}
      {showUploadModal && (
        <div className="hlib-modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="hlib-modal hlib-upload-modal" onClick={e => e.stopPropagation()}>
            <h3>📤 上传工程手册</h3>
            
            <div className="hlib-drop-zone" onClick={() => fileInputRef.current?.click()}>
              {uploading ? (
                <div className="hlib-uploading-state">
                  <div className="hlib-progress-ring" style={{ background: `conic-gradient(#388bfd ${uploadProgress * 3.6}deg, #eee 0deg)` }}>
                    <span>{uploadProgress}%</span>
                  </div>
                  <p>正在上传中，请勿关闭窗口...</p>
                </div>
              ) : (
                <>
                  <div className="hlib-drop-icon">📁</div>
                  <p>点击选择文件或将文件拖拽到此处</p>
                  <span className="hlib-hint">支持 PDF / DOC / XLS / PPT / STP 等，单文件最大100MB</span>
                </>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.stp,.step,.dwg,.dxf"
                onChange={handleFileSelect}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>

            <div className="hlib-upload-form-row">
              <label>目标分类：</label>
              <select disabled={uploading} defaultValue={activeCategory !== 'all' ? activeCategory : 'other'}>
                {HANDBOOK_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="hlib-modal-actions">
              <button onClick={() => setShowUploadModal(false)} disabled={uploading}>取消</button>
              {!uploading && <button className="primary" onClick={() => fileInputRef.current?.click()}>选择文件</button>}
            </div>
          </div>
        </div>
      )}

      {/* ====== 文件预览弹窗（多格式支持） ====== */}
      {showPreviewModal && previewBook && (
        <div className="hlib-modal-overlay" onClick={closePreview}>
          <div className="hlib-modal hlib-preview-modal large" onClick={e => e.stopPropagation()}>
            <div className="hlib-preview-header">
              <div className="hlib-preview-title">
                <span>{getFileTypeInfo(previewBook.fileType).icon}</span>
                <strong>{previewBook.title}</strong>
                <span className="hlib-preview-ext">.{previewBook.fileType}</span>
                <span className="hlib-preview-size">{formatSize(previewBook.fileSize)}</span>
              </div>
              <div className="hlib-preview-actions">
                <button className="hlib-tbtn" onClick={() => toggleFavorite(previewBook.id)}>
                  {isFavorite(previewBook.id) ? '★ 已收藏' : '☆ 收藏'}
                </button>
                <button className="hlib-tbtn primary" onClick={() => handleDownload(previewBook)}>⬇ 下载</button>
                <button className="hlib-close-btn small" onClick={closePreview} title="关闭（Esc）">✕</button>
              </div>
            </div>

            <div className="hlib-preview-body">
              {previewLoading ? (
                <div className="hlib-preview-loading">
                  <div className="hlib-mini-spinner"></div>
                  <span>正在加载{previewType === 'table' ? '表格' : '文件'}...</span>
                </div>
              ) : previewError ? (
                <div className="hlib-no-preview">
                  <div className="hlib-no-preview-icon">⚠️</div>
                  <h4>加载失败</h4>
                  <p>{previewError}</p>
                  <button className="primary" onClick={() => handleDownload(previewBook)}>⬇ 下载到本地查看</button>
                </div>
              ) : previewType === 'pdf' ? (
                /* PDF 用 iframe */
                <iframe src={`${previewUrl}#toolbar=1`} className="hlib-pdf-viewer" title={previewBook.title} />
              ) : previewType === 'image' ? (
                /* 图片直接显示 */
                <div className="hlib-media-wrap">
                  <img src={previewUrl} alt={previewBook.title} className="hlib-image-viewer" />
                </div>
              ) : previewType === 'video' ? (
                /* 视频播放 */
                <div className="hlib-media-wrap">
                  <video src={previewUrl} controls className="hlib-video-viewer" />
                </div>
              ) : previewType === 'audio' ? (
                /* 音频播放 */
                <div className="hlib-media-wrap">
                  <div className="hlib-audio-info">{getFileTypeInfo(previewBook.fileType).icon}<h4>{previewBook.title}</h4></div>
                  <audio src={previewUrl} controls className="hlib-audio-viewer" />
                </div>
              ) : previewType === 'text' ? (
                /* 文本文件展示 */
                <pre className="hlib-text-viewer">{previewContent}</pre>
              ) : previewType === 'table' ? (
                /* XLSX/XLS 表格展示 */
                <div className="hlib-table-viewer">
                  <div className="hlib-table-meta">
                    <span>📊 {previewContent?.sheetName || 'Sheet1'}</span>
                    <span>共 <strong>{previewContent?.totalRows}</strong> 行（展示前 {previewContent?.rows?.length} 行）</span>
                  </div>
                  <div className="hlib-table-scroll">
                    <table>
                      <tbody>
                        {previewContent?.rows?.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci}>{String(cell ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* unsupported 类型 */
                <div className="hlib-no-preview">
                  <div className="hlib-no-preview-icon">{getFileTypeInfo(previewBook.fileType).icon}</div>
                  <h4>此格式不支持在线预览</h4>
                  <p>文件类型：.{previewBook.fileType.toUpperCase()}</p>
                  <p style={{ fontSize: 12, opacity: 0.7, maxWidth: 480 }}>
                    可下载后用本地软件查看。支持的预览格式：PDF / 图片 / 视频 / 音频 / 文本 / XLSX
                  </p>
                  <button className="primary" onClick={() => handleDownload(previewBook)}>⬇ 下载到本地查看</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
