import React, { useState, useMemo, useCallback } from 'react'
import initialProducts, { PRODUCT_LINES, LIFECYCLE_STAGES, STATUS_MAP } from '../data/productData'
import { useAuth } from '../context/AuthContext'
import './ProductManagementPage.css'

// 操作日志存储（内存中，刷新后重置）
let operationLogs = []

function ProductManagementPage() {
  // ===== 权限检查 =====
  const { hasPermission, isAdmin, user } = useAuth()
  const canCreate = hasPermission('product:create')
  const canEdit = hasPermission('product:edit')
  const canDelete = hasPermission('product:delete')

  // ===== 核心状态 =====
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedLine, setSelectedLine] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)

  // ===== 删除功能状态 =====
  const [productList, setProductList] = useState([...initialProducts])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { type:'single'|'batch', products:[], hasAssociation:false }
  const [logs, setLogs] = useState([])
  const [showLogPanel, setShowLogPanel] = useState(false)

  // ===== 新增产品状态 =====
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    code: '', name: '', productLine: 'water-purifier', status: 'concept',
    manager: '', cost: '', price: '', monthlyOutput: '', remark: ''
  })
  const [addFormError, setAddFormError] = useState('')

  /* ===== 筛选 & 统计 ===== */
  const filteredProducts = useMemo(() => {
    return productList.filter(p => {
      if (selectedLine !== 'all' && p.productLine !== selectedLine) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (searchText && !p.name.toLowerCase().includes(searchText.toLowerCase()) &&
          !p.code.toLowerCase().includes(searchText.toLowerCase())) return false
      return true
    })
  }, [productList, selectedLine, statusFilter, searchText])

  const stats = useMemo(() => {
    const lineStats = {}
    PRODUCT_LINES.forEach(line => {
      const lp = productList.filter(p => p.productLine === line.id)
      lineStats[line.id] = {
        count: lp.length,
        inMass: lp.filter(p => p.status === 'mass').length,
        totalOutput: lp.reduce((s, p) => s + (p.monthlyOutput || 0), 0),
      }
    })
    const statusCount = {}
    Object.keys(STATUS_MAP).forEach(k => { statusCount[k] = productList.filter(p => p.status === k).length })
    return {
      total: productList.length,
      inMass: productList.filter(p => p.status === 'mass').length,
      inDevelopment: productList.filter(p => ['concept','design','prototype'].includes(p.status)).length,
      lineStats,
      statusCount,
      totalMonthlyOutput: productList.reduce((s,p) => s + (p.monthlyOutput||0), 0),
    }
  }, [productList])

  const getProductLineInfo = (lineId) => PRODUCT_LINES.find(l => l.id === lineId) || PRODUCT_LINES[0]

  /* ===== 删除功能核心逻辑 ===== */

  // 切换单个选中
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    }
  }, [selectedIds.size, filteredProducts])

  // 打开删除确认弹窗
  const openDeleteConfirm = useCallback((type, targetProducts) => {
    const hasAssoc = targetProducts.some(p =>
      p.associatedProjects && p.associatedProjects.length > 0
    )
    setDeleteConfirm({ type, products: targetProducts, hasAssociation: hasAssoc })
  }, [])

  // 执行删除
  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return

    const { products: toDelete } = deleteConfirm
    const now = new Date()
    const timeStr = now.toLocaleString('zh-CN', { hour12: false })
    const operator = '当前用户'

    // 记录操作日志
    const newLogEntries = toDelete.map(p => ({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      time: timeStr,
      operator,
      action: deleteConfirm.type === 'batch' ? '批量删除' : '单个删除',
      productCode: p.code,
      productName: p.name,
      productLine: getProductLineInfo(p.productLine).name,
      hasAssociation: !!(p.associatedProjects && p.associatedProjects.length > 0),
      associationDetail: p.associatedProjects?.join(', ') || '-',
    }))

    operationLogs = [...newLogEntries, ...operationLogs]
    setLogs(prev => [...newLogEntries, ...prev])

    // 从列表中移除
    const deleteIds = new Set(toDelete.map(p => p.id))
    setProductList(prev => prev.filter(p => !deleteIds.has(p.id)))

    // 清理选中状态
    setSelectedIds(prev => {
      const next = new Set(prev)
      deleteIds.forEach(id => next.delete(id))
      return next
    })

    // 关闭详情面板（如果被删的产品正在展示）
    if (selectedProduct && deleteIds.has(selectedProduct.id)) {
      setShowDetailPanel(false)
      setSelectedProduct(null)
    }

    setDeleteConfirm(null)
  }, [deleteConfirm, selectedProduct])

  // 取消删除
  const cancelDelete = useCallback(() => {
    setDeleteConfirm(null)
  }, [])

  /* ===== 新增产品逻辑 ===== */
  const openAddModal = useCallback(() => {
    setAddForm({ code: '', name: '', productLine: 'water-purifier', status: 'concept', manager: '', cost: '', price: '', monthlyOutput: '', remark: '' })
    setAddFormError('')
    setShowAddModal(true)
  }, [])

  const closeAddModal = useCallback(() => {
    setShowAddModal(false)
    setAddFormError('')
  }, [])

  const handleAddSubmit = useCallback(() => {
    // 校验必填
    if (!addForm.code.trim()) { setAddFormError('请输入产品编码'); return }
    if (!addForm.name.trim()) { setAddFormError('请输入产品名称'); return }
    // 编码重复校验
    if (productList.some(p => p.code.toLowerCase() === addForm.code.trim().toLowerCase())) {
      setAddFormError('产品编码已存在，请更换编码')
      return
    }
    const newProduct = {
      id: `P${String(productList.length + 1).padStart(3, '0')}`,
      code: addForm.code.trim(),
      name: addForm.name.trim(),
      productLine: addForm.productLine,
      status: addForm.status,
      spec: {},
      manager: addForm.manager.trim() || '未分配',
      startDate: new Date().toISOString().slice(0, 10),
      launchDate: null,
      cost: parseFloat(addForm.cost) || 0,
      price: parseFloat(addForm.price) || 0,
      monthlyOutput: parseInt(addForm.monthlyOutput) || 0,
      remark: addForm.remark.trim(),
      associatedProjects: [],
    }
    setProductList(prev => [...prev, newProduct])
    // 记录日志
    const logEntry = { id: Date.now(), time: new Date().toLocaleString('zh-CN'), action: '新增产品', target: newProduct.name, operator: user?.name || '系统' }
    operationLogs = [logEntry, ...operationLogs].slice(0, 50)
    setLogs([logEntry, ...logs].slice(0, 50))
    closeAddModal()
  }, [addForm, productList, logs, user])

  /* ===== 新增产品弹窗 ===== */
  const renderAddModal = () => {
    if (!showAddModal) return null
    const formField = (label, key, placeholder, type = 'text', required = false) => (
      <div className="pm-add-field">
        <label className="pm-add-label">{label}{required && <span className="pm-req">*</span>}</label>
        <input
          className="pm-add-input"
          type={type}
          placeholder={placeholder}
          value={addForm[key]}
          onChange={e => setAddForm(prev => ({ ...prev, [key]: e.target.value }))}
        />
      </div>
    )
    return (
      <div className="pm-delete-overlay" onClick={closeAddModal}>
        <div className="pm-delete-modal pm-add-modal" onClick={e => e.stopPropagation()}>
          <div className="pm-delete-header">
            <span className="pm-delete-icon">➕</span>
            <h3>新增产品立项</h3>
          </div>
          <div className="pm-delete-body">
            {addFormError && <div className="pm-add-error">⚠️ {addFormError}</div>}
            <div className="pm-add-grid">
              {formField('产品编码', 'code', '如 JS-RO-400G-B2', 'text', true)}
              {formField('产品名称', 'name', '如 400G无桶反渗透净水机', 'text', true)}
              <div className="pm-add-field">
                <label className="pm-add-label">产品线<span className="pm-req">*</span></label>
                <select className="pm-add-input" value={addForm.productLine} onChange={e => setAddForm(prev => ({ ...prev, productLine: e.target.value }))}>
                  {PRODUCT_LINES.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
                </select>
              </div>
              <div className="pm-add-field">
                <label className="pm-add-label">生命周期阶段</label>
                <select className="pm-add-input" value={addForm.status} onChange={e => setAddForm(prev => ({ ...prev, status: e.target.value }))}>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              {formField('负责人', 'manager', '如 张工')}
              {formField('物料成本(元)', 'cost', '如 285', 'number')}
              {formField('建议售价(元)', 'price', '如 1299', 'number')}
              {formField('月产量(台)', 'monthlyOutput', '如 5000', 'number')}
              <div className="pm-add-field pm-add-field-full">
                <label className="pm-add-label">备注</label>
                <textarea className="pm-add-input pm-add-textarea" placeholder="产品说明、市场定位等" value={addForm.remark} onChange={e => setAddForm(prev => ({ ...prev, remark: e.target.value }))} rows="2" />
              </div>
            </div>
          </div>
          <div className="pm-delete-footer">
            <button className="pm-btn pm-btn-default-sm" onClick={closeAddModal}>取消</button>
            <button className="pm-btn pm-btn-primary" onClick={handleAddSubmit}>✓ 确认立项</button>
          </div>
        </div>
      </div>
    )
  }

  /* ===== 删除确认弹窗 ===== */
  const renderDeleteModal = () => {
    if (!deleteConfirm) return null
    const { type, products: toDelete, hasAssociation } = deleteConfirm
    const isBatch = type === 'batch'

    return (
      <div className="pm-delete-overlay" onClick={cancelDelete}>
        <div className="pm-delete-modal" onClick={e => e.stopPropagation()}>
          <div className="pm-delete-header">
            <span className="pm-delete-icon">⚠️</span>
            <h3>确认删除</h3>
          </div>

          <div className="pm-delete-body">
            {/* 关联项目警告 */}
            {hasAssociation && (
              <div className="pm-delete-warning">
                <div className="pm-delete-warn-icon">🔗</div>
                <div>
                  <strong>检测到关联项目！</strong>
                  <p>以下产品已关联到项目中，删除可能影响项目数据完整性：</p>
                  <ul>
                    {toDelete.filter(p => p.associatedProjects?.length > 0).map(p => (
                      <li key={p.id}>
                        <strong>{p.name}</strong>
                        <span className="pm-assoc-projects">
                          → 关联项目: {p.associatedProjects.join('、')}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="pm-delete-warn-hint">建议先解除关联或同步处理相关项目数据。</p>
                </div>
              </div>
            )}

            <div className="pm-delete-info">
              <p>
                确定要{isBatch ? '批量' : ''}删除 <strong>{toDelete.length}</strong> 个产品吗？
              </p>
              <div className="pm-delete-list">
                {toDelete.map(p => {
                  const li = getProductLineInfo(p.productLine)
                  return (
                    <div key={p.id} className="pm-delete-item">
                      <code>{p.code}</code>
                      <span>{p.name}</span>
                      <span className="pm-line-badge-sm" style={{ color: li.color }}>{li.shortName}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="pm-delete-irreversible">⚠️ 此操作不可撤销，产品数据将被永久移除。</p>
          </div>

          <div className="pm-delete-footer">
            <button className="pm-btn pm-btn-cancel" onClick={cancelDelete}>取消</button>
            <button className="pm-btn pm-btn-danger" onClick={confirmDelete}>
              🗑️ 确认删除 ({toDelete.length})
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ===== 操作日志面板 ===== */
  const renderLogPanel = () => {
    if (!showLogPanel) return null
    return (
      <div className="pm-log-overlay" onClick={() => setShowLogPanel(false)}>
        <div className="pm-log-panel" onClick={e => e.stopPropagation()}>
          <div className="pm-log-header">
            <h3>📋 操作日志</h3>
            <div className="pm-log-actions">
              <span className="pm-log-count">共 {logs.length} 条记录</span>
              <button className="pm-close-btn" onClick={() => setShowLogPanel(false)}>✕</button>
            </div>
          </div>
          <div className="pm-log-body">
            {logs.length === 0 ? (
              <div className="pm-log-empty">暂无操作记录</div>
            ) : (
              <table className="pm-table pm-log-table">
                <thead>
                  <tr>
                    <th>操作时间</th><th>操作人</th><th>操作类型</th>
                    <th>产品编号</th><th>产品名称</th><th>产品线</th><th>关联项目</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{whiteSpace:'nowrap'}}>{log.time}</td>
                      <td>{log.operator}</td>
                      <td>
                        <span className={`pm-log-type ${log.action === '批量删除' ? 'pm-log-batch' : ''}`}>
                          {log.action}
                        </span>
                      </td>
                      <td><code>{log.productCode}</code></td>
                      <td>{log.productName}</td>
                      <td>{log.productLine}</td>
                      <td>
                        {log.hasAssociation ? (
                          <span className="pm-log-assoc">{log.associationDetail}</span>
                        ) : (
                          <span style={{color:'#64748b'}}>无</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ===== 详情面板 ===== */
  const renderDetailPanel = () => {
    if (!selectedProduct) return null
    const p = selectedProduct
    const li = getProductLineInfo(p.productLine)
    const st = STATUS_MAP[p.status]
    const curIdx = LIFECYCLE_STAGES.findIndex(s => s.key === p.status)
    const hasAssoc = p.associatedProjects && p.associatedProjects.length > 0

    return (
      <div className="pm-detail-overlay" onClick={() => setShowDetailPanel(false)}>
        <div className="pm-detail-panel" onClick={e => e.stopPropagation()}>
          <div className="pm-detail-header">
            <h3>产品详情</h3>
            <div className="pm-detail-actions">
              {canDelete && (
                <button className="pm-btn pm-btn-danger-sm"
                  onClick={(e) => { e.stopPropagation(); openDeleteConfirm('single', [p]); }}>
                  🗑️ 删除产品
                </button>
              )}
              <button className="pm-close-btn" onClick={() => setShowDetailPanel(false)}>✕</button>
            </div>
          </div>
          <div className="pm-detail-body">
            <div className="pm-detail-hero">
              <div className="pm-detail-name">{p.name}</div>
              <div className="pm-detail-meta">
                <span className="pm-line-badge" style={{ color: li.color, background: `${li.color}18` }}>
                  {li.icon} {li.name}
                </span>
                <span className="pm-status-badge" style={{ color: st.color, background: st.bg }}>{st.label}</span>
              </div>
              <code className="pm-detail-code">{p.code}</code>
              {hasAssoc && (
                <div className="pm-detail-assoc">
                  🔗 关联项目：<span>{p.associatedProjects.join('、')}</span>
                </div>
              )}
            </div>

            <div className="pm-detail-sections">
              <div className="pm-detail-section">
                <h4>规格参数</h4>
                <dl className="pm-dl">
                  {Object.entries(p.spec).map(([k, v]) => (
                    <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>
                  ))}
                </dl>
              </div>
              <div className="pm-detail-section">
                <h4>项目信息</h4>
                <dl className="pm-dl">
                  <dt>项目负责人</dt><dd>{p.manager}</dd>
                  <dt>立项日期</dt><dd>{p.startDate}</dd>
                  <dt>上市日期</dt><dd>{p.launchDate || '未上市'}</dd>
                  <dt>BOM成本</dt><dd>¥{p.cost}</dd>
                  <dt>建议零售价</dt><dd>¥{p.price}</dd>
                  <dt>月产能目标</dt><dd>{p.monthlyOutput > 0 ? `${p.monthlyOutput.toLocaleString()} 台` : '未设定'}</dd>
                </dl>
              </div>
              {p.remark && (
                <div className="pm-detail-section">
                  <h4>备注说明</h4>
                  <p className="pm-remark-text">{p.remark}</p>
                </div>
              )}
            </div>

            <div className="pm-lifecycle-mini">
              <h4>生命周期进度</h4>
              <div className="pm-lc-steps">
                {LIFECYCLE_STAGES.map(s => {
                  const isActive = s.key === p.status
                  const isDone = s.order <= curIdx + 1
                  return (
                    <div key={s.key} className={`pm-lc-step ${isActive ? 'pm-lc-active' : ''} ${isDone ? 'pm-lc-done' : ''}`}>
                      <div className="pm-lc-dot">{s.icon}</div>
                      <span className="pm-lc-label">{s.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ===== 总览仪表盘 ===== */
  const renderOverview = () => {
    const renderStatusRow = (stage) => {
      const cnt = stats.statusCount[stage.key] || 0
      const pct = stats.total > 0 ? (cnt / stats.total * 100) : 0
      return (
        <div key={stage.key} className="pm-status-row" onClick={() => { setActiveTab('products'); setStatusFilter(stage.key); }}>
          <div className="pm-status-info">
            <span>{stage.icon} {stage.label}</span>
            <span className="pm-status-count">{cnt}款</span>
          </div>
          <div className="pm-bar-track">
            <div className="pm-bar-fill" style={{ width: `${pct}%`, background: STATUS_MAP[stage.key]?.color || '#666' }} />
          </div>
        </div>
      )
    }

    const renderLineCard = (line) => {
      const ls = stats.lineStats[line.id] || { count: 0, inMass: 0, totalOutput: 0 }
      return (
        <div key={line.id}
             className={`pm-line-card ${selectedLine===line.id ? 'pm-line-active' : ''}`}
             onClick={() => setSelectedLine(selectedLine===line.id ? 'all' : line.id)}>
          <div className="pm-line-header" style={{ background: line.gradient }}>
            <span className="pm-line-icon">{line.icon}</span>
            <span className="pm-line-name">{line.name}</span>
          </div>
          <div className="pm-line-body">
            <div className="pm-line-metrics">
              <div className="pm-metric"><span className="pm-metric-val">{ls.count}</span><span className="pm-metric-label">产品数</span></div>
              <div className="pm-metric"><span className="pm-metric-val">{ls.inMass}</span><span className="pm-metric-label">量产中</span></div>
              <div className="pm-metric"><span className="pm-metric-val">{ls.totalOutput.toLocaleString()}</span><span className="pm-metric-label">月产能</span></div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="pm-overview">
        <div className="pm-stats-grid">
          {[
            { icon: '📦', label: '产品总数', value: stats.total },
            { icon: '🚀', label: '量产上市', value: stats.inMass },
            { icon: '⚙️', label: '研发中', value: stats.inDevelopment },
            { icon: '📊', label: '月产能(台)', value: stats.totalMonthlyOutput.toLocaleString() },
          ].map((s, i) => (
            <div key={i} className={`pm-stat-card pm-stat-${['primary','success','warning','info'][i]}`}>
              <div className="pm-stat-icon">{s.icon}</div>
              <div className="pm-stat-body"><div className="pm-stat-value">{s.value}</div><div className="pm-stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>

        <div className="pm-lines-section">
          <h3 className="pm-section-title">产品线总览</h3>
          <div className="pm-lines-grid">{PRODUCT_LINES.map(renderLineCard)}</div>
        </div>

        <div className="pm-bottom-grid">
          <div className="pm-status-panel">
            <h3 className="pm-section-title">状态分布</h3>
            <div className="pm-status-bars">{LIFECYCLE_STAGES.map(renderStatusRow)}</div>
          </div>
          <div className="pm-quick-panel">
            <h3 className="pm-section-title">快捷操作</h3>
            <div className="pm-quick-actions">
              {[
                { icon: '📋', text: '查看全部产品', tab: 'products' },
                { icon: '🔄', text: '生命周期跟踪', tab: 'lifecycle' },
                { icon: '📈', text: '数据统计分析', tab: 'analytics' },
              ].map(q => (
                <button key={q.tab} className="pm-quick-btn" onClick={() => setActiveTab(q.tab)}>
                  <span>{q.icon}</span> {q.text}
                </button>
              ))}
              <button className="pm-quick-btn pm-quick-add" onClick={openAddModal}><span>➕</span> 新增产品立项</button>
              {logs.length > 0 && (
                <button className="pm-quick-btn pm-quick-log" onClick={() => setShowLogPanel(true)}>
                  <span>📋</span> 查看操作日志 ({logs.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ===== 产品列表（含删除功能）===== */
  const renderProducts = () => {
    const allSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length
    const someSelected = selectedIds.size > 0

    const handleRowDelete = (product, e) => {
      e.stopPropagation()
      openDeleteConfirm('single', [product])
    }

    const handleBatchDelete = () => {
      const selected = filteredProducts.filter(p => selectedIds.has(p.id))
      if (selected.length > 0) {
        openDeleteConfirm('batch', selected)
      }
    }

    const renderTableRow = (product) => {
      const li = getProductLineInfo(product.productLine)
      const st = STATUS_MAP[product.status]
      const isChecked = selectedIds.has(product.id)
      return (
        <tr key={product.id}
            className={`pm-tr-hover ${isChecked ? 'pm-row-selected' : ''}`}
            onClick={() => { setSelectedProduct(product); setShowDetailPanel(true); }}>
          <td className="pm-check-cell" onClick={e => e.stopPropagation()}>
            <input type="checkbox"
              checked={isChecked}
              onChange={() => toggleSelect(product.id)}
              className="pm-checkbox"
            />
          </td>
          <td><code>{product.code}</code></td>
          <td><strong>{product.name}</strong></td>
          <td><span className="pm-line-badge" style={{ color: li.color, background: `${li.color}18` }}>{li.icon} {li.shortName}</span></td>
          <td><span className="pm-status-badge" style={{ color: st.color, background: st.bg }}>{st.label}</span></td>
          <td>{product.manager}</td>
          <td>¥{product.cost}</td>
          <td>¥{product.price}</td>
          <td>{product.monthlyOutput > 0 ? product.monthlyOutput.toLocaleString() : '-'}</td>
          <td className="pm-action-cells" onClick={e => e.stopPropagation()}>
            <button className="pm-action-link" onClick={() => { setSelectedProduct(product); setShowDetailPanel(true); }}>详情</button>
            {canDelete && (
              <button className="pm-action-link pm-action-delete" onClick={e => handleRowDelete(product, e)}>删除</button>
            )}
          </td>
        </tr>
      )
    }

    return (
      <div className="pm-products">
        <div className="pm-toolbar">
          <div className="pm-search-box">
            🔍
            <input type="text" placeholder="搜索产品名称或型号..." value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
          <div className="pm-filter-group">
            <select value={selectedLine} onChange={e => setSelectedLine(e.target.value)} className="pm-select">
              <option value="all">全部产品线</option>
              {PRODUCT_LINES.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pm-select">
              <option value="all">全部状态</option>
              {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {canCreate && (
            <button className="pm-add-btn" onClick={openAddModal}>➕ 新增产品</button>
          )}
        </div>

        {/* 批量操作栏 */}
        <div className="pm-batch-bar">
          <div className="pm-batch-left">
            <label className="pm-select-all">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="pm-checkbox" />
              <span>全选</span>
            </label>
            {someSelected && (
              <span className="pm-selected-info">
                已选 <strong>{selectedIds.size}</strong> 项
              </span>
            )}
          </div>
          <div className="pm-batch-right">
            {someSelected && (
              <>
            {someSelected && canDelete && (
              <button className="pm-btn pm-btn-danger-sm" onClick={handleBatchDelete}>
                🗑️ 批量删除 ({selectedIds.size})
              </button>
            )}
                <button className="pm-btn pm-btn-default-sm" onClick={() => setSelectedIds(new Set())}>
                  取消选择
                </button>
              </>
            )}
            {logs.length > 0 && (
              <button className="pm-btn pm-btn-default-sm" onClick={() => setShowLogPanel(true)}>
                📋 日志 ({logs.length})
              </button>
            )}
          </div>
        </div>

        <div className="pm-product-count">共 <strong>{filteredProducts.length}</strong> 款产品</div>

        <div className="pm-product-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                <th className="pm-check-cell">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="pm-checkbox" />
                </th>
                <th>产品编号</th><th>产品名称</th><th>产品线</th><th>当前阶段</th>
                <th>负责人</th><th>BOM成本</th><th>售价</th><th>月产能</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(renderTableRow)}
              {filteredProducts.length === 0 && (<tr><td colSpan="10" className="pm-empty-row">暂无匹配的产品数据</td></tr>)}
            </tbody>
          </table>
        </div>

        {showDetailPanel && selectedProduct && renderDetailPanel()}
        {renderDeleteModal()}
        {renderAddModal()}
        {renderLogPanel()}
      </div>
    )
  }

  /* ===== 统计分析 ===== */
  const renderAnalytics = () => {
    const lineData = PRODUCT_LINES.map(line => {
      const lp = productList.filter(p => p.productLine === line.id)
      return {
        ...line,
        count: lp.length,
        avgCost: lp.length ? Math.round(lp.reduce((s,p)=>s+p.cost,0)/lp.length) : 0,
        totalRevenue: lp.reduce((s,p) => s + (p.price||0)*(p.monthlyOutput||0), 0),
      }
    })

    const maxCount = Math.max(...lineData.map(d=>d.count), 1)

    return (
      <div className="pm-analytics">
        <div className="pm-chart-grid">
          <div className="pm-chart-card">
            <h3 className="pm-section-title">各线产品数量分布</h3>
            <div className="pm-bar-chart">
              {lineData.map(ld => (
                <div key={ld.id} className="pm-bar-item">
                  <div className="pm-bar-label">{ld.icon} {ld.shortName}</div>
                  <div className="pm-bar-area">
                    <div className="pm-bar-col" style={{ width: `${ld.count/maxCount*100}%`, background: ld.gradient }}>{ld.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pm-chart-card">
            <h3 className="pm-section-title">各线月产值估算</h3>
            <div className="pm-bar-chart">
              {(() => {
                const maxOut = Math.max(...lineData.map(d=>d.totalRevenue), 1)
                return lineData.map(ld => (
                  <div key={ld.id} className="pm-bar-item">
                    <div className="pm-bar-label">{ld.icon} {ld.shortName}</div>
                    <div className="pm-bar-area">
                      <div className="pm-bar-col" style={{ width: `${Math.min(ld.totalRevenue/maxOut*100,100)}%`, background: ld.gradient }}>
                        ¥{(ld.totalRevenue/10000).toFixed(0)}万
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>

          <div className="pm-chart-card pm-full-width">
            <h3 className="pm-section-title">各产品BOM成本 vs 售价</h3>
            <div className="pm-cost-table-wrap">
              <table className="pm-table">
                <thead><tr><th>产品</th><th>产品线</th><th>BOM成本</th><th>售价</th><th>毛利率</th></tr></thead>
                <tbody>
                  {[...productList].sort((a,b)=>b.price-a.price).map(p => {
                    const margin = ((p.price - p.cost) / p.price * 100).toFixed(1)
                    const li = getProductLineInfo(p.productLine)
                    const mColor = parseFloat(margin) > 70 ? '#10b981' : parseFloat(margin) > 50 ? '#f59e0b' : '#ef4444'
                    return (
                      <tr key={p.id}>
                        <td>{p.name}<br/><small style={{color:'#888'}}>{p.code}</small></td>
                        <td>{li.icon} {li.shortName}</td><td>¥{p.cost}</td><td>¥{p.price}</td>
                        <td><strong style={{color:mColor}}>{margin}%</strong></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ===== 生命周期管理 ===== */
  const renderLifecycle = () => {
    const activeStages = LIFECYCLE_STAGES.filter(s => s.key !== 'eol')

    const renderStageGroup = (stage) => {
      const sp = productList.filter(p => p.status === stage.key)
      if (sp.length === 0 && !['eol'].includes(stage.key)) return null

      return (
        <div key={stage.key} className="pm-stage-group">
          <div className="pm-stage-header">
            <span className="pm-stage-icon">{stage.icon}</span>
            <span className="pm-stage-name">{stage.label}</span>
            <span className="pm-stage-count">{sp.length} 款产品</span>
          </div>
          <div className="pm-stage-cards">
            {sp.length > 0 ? sp.map(p => {
              const li = getProductLineInfo(p.productLine)
              const curOrder = LIFECYCLE_STAGES.find(x => x.key === p.status)?.order || 0
              return (
                <div key={p.id} className="pm-stage-card"
                     onClick={() => { setSelectedProduct(p); setShowDetailPanel(true); }}>
                  <div className="pm-sc-top" style={{ borderLeftColor: li.color }}>
                    <div className="pm-sc-name">{p.name}</div>
                    <div className="pm-sc-code">{p.code}</div>
                  </div>
                  <div className="pm-sc-meta">
                    <span className="pm-line-badge-sm" style={{ color: li.color }}>{li.shortName}</span>
                    <span>{p.manager}</span>
                    <span>{p.startDate}</span>
                  </div>
                  <div className="pm-sc-progress">
                    {LIFECYCLE_STAGES.map(s => (
                      <div key={s.key}
                           className={`pm-sc-dot ${s.key === p.status ? 'pm-sc-current' : ''} ${s.order < curOrder ? 'pm-sc-done' : ''}`}
                           title={s.label} />
                    ))}
                  </div>
                </div>
              )
            }) : <div className="pm-stage-empty">该阶段暂无产品</div>}
          </div>
        </div>
      )
    }

    const eolProducts = productList.filter(p => p.status === 'eol')

    return (
      <div className="pm-lifecycle-page">
        <div className="pm-lifecycle-intro">
          <p>产品全生命周期管理：从概念立项到停产退市的完整流程跟踪。点击产品卡片查看详情或变更阶段。</p>
        </div>
        {activeStages.map(renderStageGroup)}
        {eolProducts.length > 0 && (
          <div className="pm-stage-group pm-stage-eol">
            <div className="pm-stage-header">
              <span className="pm-stage-icon">⏹️</span>
              <span className="pm-stage-name">停产退市</span>
              <span className="pm-stage-count">{eolProducts.length} 款产品</span>
            </div>
            <div className="pm-eol-list">
              {eolProducts.map(p => (
                <div key={p.id} className="pm-eol-item" onClick={() => { setSelectedProduct(p); setShowDetailPanel(true); }}>
                  <span>{p.name}</span>
                  <code>{p.code}</code>
                  <span className="pm-eol-remark">{p.remark?.substring(0,40)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {showDetailPanel && selectedProduct && renderDetailPanel()}
        {renderDeleteModal()}
        {renderAddModal()}
        {renderLogPanel()}
      </div>
    )
  }

  /* ===== 主渲染 ===== */
  return (
    <div className="pm-page animate-fadeIn">
      <div className="pm-header">
        <h2>产品线管理</h2>
        <p className="pm-subtitle">净水 · 饮水 · 台净 — 三大产品线综合管理平台</p>
      </div>

      {/* 权限提示：非管理员只读模式 */}
      {!canEdit && !canDelete && !canCreate && (
        <div className="pm-permission-notice">
          🔒 当前为只读模式，仅可查看数据。如需编辑或管理产品请联系管理员。
        </div>
      )}

      <div className="pm-tabs">
        {[
          { id: 'overview', label: '总览仪表盘', icon: '📊' },
          { id: 'products', label: '产品信息管理', icon: '📋' },
          { id: 'analytics', label: '统计分析', icon: '📈' },
          { id: 'lifecycle', label: '生命周期', icon: '🔄' },
        ].map(tab => (
          <button key={tab.id}
                  className={`pm-tab ${activeTab === tab.id ? 'pm-tab-active' : ''}`}
                  onClick={() => { setActiveTab(tab.id); setSearchText(''); setSelectedLine('all'); setStatusFilter('all'); setShowDetailPanel(false); }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="pm-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'lifecycle' && renderLifecycle()}
      </div>
    </div>
  )
}

export default ProductManagementPage
