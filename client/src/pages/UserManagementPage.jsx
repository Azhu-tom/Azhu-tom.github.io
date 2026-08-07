import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import './UserManagementPage.css'

// 角色选项
const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员', color: '#ef4444' },
  { value: 'user', label: '普通用户', color: '#3b82f6' },
]

// 状态选项
const STATUS_OPTIONS = [
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '禁用' },
]

// 部门列表（白名单）
const DEPARTMENTS = ['信息技术部', '结构设计部', '净水研发组', '饮水研发组', '台净研发组', '测试部']

// ==================== 输入验证工具 ====================

/**
 * 安全截断字符串
 */
function safeTruncate(str, maxLen) {
  if (typeof str !== 'string') return ''
  return str.length > maxLen ? str.slice(0, maxLen) : str
}

/**
 * 验证用户名格式
 */
function validateUsername(val) {
  const v = String(val || '').trim()
  if (!v) return { ok: false, msg: '用户名不能为空' }
  if (v.length < 3) return { ok: false, msg: '用户名至少3个字符' }
  if (v.length > 30) return { ok: false, msg: '用户名最多30个字符' }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(v)) return { ok: false, msg: '含非法字符' }
  return { ok: true, value: v }
}

/**
 * 验证姓名
 */
function validateName(val) {
  const v = String(val || '').trim()
  if (!v) return { ok: false, msg: '姓名不能为空' }
  if (v.length > 20) return { ok: false, msg: '姓名最多20个字符' }
  return { ok: true, value: v }
}

/**
 * 验证邮箱格式
 */
function validateEmail(val) {
  const v = String(val || '').trim()
  if (!v) return { ok: true, value: '' } // 可选字段
  if (v.length > 50) return { ok: false, msg: '邮箱过长' }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(v)) return { ok: false, msg: '邮箱格式不正确' }
  return { ok: true, value: v.toLowerCase() }
}

/**
 * XSS安全转义（用于操作日志等需要显示用户输入的场景）
 */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function UserManagementPage() {
  const { MOCK_USERS, hasPermission, user: currentUser } = useAuth()
  const [users, setUsers] = useState([...MOCK_USERS])
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [operationLog, setOperationLog] = useState([])
  const [formError, setFormError] = useState('')

  // 表单状态
  const [form, setForm] = useState({
    username: '', name: '', password: '', role: 'user',
    department: '', email: '', status: 'active',
  })

  // 权限检查
  const canCreate = hasPermission('user:create')
  const canEdit = hasPermission('user:edit')
  const canDelete = hasPermission('user:delete')
  const canAssignRole = hasPermission('user:assign_role')

  // 搜索时对输入进行安全处理
  const safeSearchText = useMemo(() => safeTruncate(searchText, 50), [searchText])

  // 过滤用户
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = safeSearchText.toLowerCase()
      const matchSearch = !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [users, safeSearchText, roleFilter, statusFilter])

  // 统计数据
  const stats = useMemo(() => ({
    total: users.length,
    adminCount: users.filter(u => u.role === 'admin').length,
    userCount: users.filter(u => u.role === 'user').length,
    activeCount: users.filter(u => u.status === 'active').length,
  }), [users])

  // 添加操作日志（内容已转义）
  const addLog = (action, target) => {
    const now = new Date()
    setOperationLog(prev => [{
      time: now.toLocaleString('zh-CN'),
      action: escapeHtml(action),
      target: escapeHtml(target),
    }, ...prev].slice(0, 50))
  }

  // 打开新增弹窗
  const handleAdd = () => {
    if (!canCreate) return
    setEditingUser(null)
    setForm({ username: '', name: '', password: '', role: 'user', department: '', email: '', status: 'active' })
    setFormError('')
    setShowModal(true)
  }

  // 打开编辑弹窗
  const handleEdit = (user) => {
    if (!canEdit) return
    setEditingUser(user)
    setForm({
      username: user.username,
      name: user.name,
      password: '',
      role: user.role,
      department: user.department || '',
      email: user.email || '',
      status: user.status,
    })
    setFormError('')
    setShowModal(true)
  }

  // 保存用户（带完整表单验证）
  const handleSave = () => {
    setFormError('')

    // 验证用户名
    const unameCheck = validateUsername(form.username)
    if (!unameCheck.ok) { setFormError(unameCheck.msg); return }

    // 验证姓名
    const nameCheck = validateName(form.name)
    if (!nameCheck.ok) { setFormError(nameCheck.msg); return }

    // 新增时必须填密码
    if (!editingUser && (!form.password || form.password.length < 4)) {
      setFormError('密码至少4个字符'); return
    }

    // 编辑时如果填写了密码，检查长度
    if (editingUser && form.password && form.password.length > 128) {
      setFormError('密码最多128个字符'); return
    }

    // 验证邮箱
    const emailCheck = validateEmail(form.email)
    if (!emailCheck.ok) { setFormError(emailCheck.msg); return }

    // 验证角色值合法性
    if (!['admin', 'user'].includes(form.role)) {
      setFormError('无效的角色值'); return
    }

    // 验证部门白名单
    if (form.department && !DEPARTMENTS.includes(form.department)) {
      setFormError('请选择有效部门'); return
    }

    if (editingUser) {
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? { ...u, ...form, password: form.password || u.password }
          : u
      ))
      addLog(`编辑用户 [${escapeHtml(form.name)}]`, `ID: ${editingUser.id}`)
    } else {
      if (users.find(u => u.username.toLowerCase() === unameCheck.value.toLowerCase())) {
        setFormError('用户名已存在')
        return
      }
      const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        ...form,
        avatar: null,
        lastLogin: '-',
        createdAt: new Date().toLocaleDateString('zh-CN'),
      }
      setUsers(prev => [...prev, newUser])
      addLog(`新增用户 [${escapeHtml(form.name)}]`, `ID: ${newUser.id}`)
    }
    setShowModal(false)
  }

  // 删除确认（带保护逻辑）
  const confirmDelete = (targetUser) => {
    if (!canDelete) return

    // 不允许删除自己
    if (currentUser && targetUser.id === currentUser.id) {
      alert('不能删除当前登录的账号')
      return
    }

    // 保护最后一个管理员不被删除
    if (targetUser.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin' && u.status === 'active').length
      if (adminCount <= 1) {
        alert('至少需要保留一个活跃的管理员账号，无法删除')
        return
      }
    }

    setDeleteTarget(targetUser)
    setShowDeleteModal(true)
  }

  // 执行删除
  const executeDelete = () => {
    if (!deleteTarget) return

    // 二次校验：防止并发删除自己或最后管理员
    if (currentUser && deleteTarget.id === currentUser.id) {
      setShowDeleteModal(false); return
    }

    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
    addLog(`删除用户 [${escapeHtml(deleteTarget.name)}]`, `ID: ${deleteTarget.id}`)
    setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
    setShowDeleteModal(false)
    setDeleteTarget(null)
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (!canDelete || selectedIds.length === 0) return

    // 检查是否包含自己
    if (currentUser && selectedIds.includes(currentUser.id)) {
      alert('批量删除列表中包含当前登录账号，请先取消选择')
      return
    }

    // 检查是否会删除最后一个管理员
    const adminsToDelete = selectedIds.filter(id => {
      const u = users.find(x => x.id === id)
      return u && u.role === 'admin' && u.status === 'active'
    })
    const totalActiveAdmins = users.filter(u => u.role === 'admin' && u.status === 'active').length
    if (adminsToDelete.length >= totalActiveAdmins) {
      alert('该操作会删除所有管理员账号，至少需保留一个管理员')
      return
    }

    setDeleteTarget({ name: `${selectedIds.length}个用户`, isBatch: true })
    setShowDeleteModal(true)
  }

  const executeBatchDelete = () => {
    setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)))
    addLog(`批量删除 ${selectedIds.length} 个用户`, selectedIds.join(','))
    setSelectedIds([])
    setShowDeleteModal(false)
    setDeleteTarget(null)
  }

  // 切换用户状态（不允许禁用自己）
  const toggleStatus = (targetUser) => {
    if (!canEdit) return
    if (currentUser && targetUser.id === currentUser.id) {
      alert('不能修改自己的账号状态')
      return
    }
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active'
    setUsers(prev => prev.map(u =>
      u.id === targetUser.id ? { ...u, status: newStatus } : u
    ))
    addLog(`${newStatus === 'active' ? '启用' : '禁用'}用户 [${escapeHtml(targetUser.name)}]`, `ID: ${targetUser.id}`)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredUsers.map(u => u.id))
    }
  }

  // 切换单个选择
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const getRoleBadge = (role) => {
    const opt = ROLE_OPTIONS.find(o => o.value === role)
    return opt || { label: role, color: '#6b7280' }
  }

  return (
    <div className="um-page">
      {/* 统计卡片 */}
      <div className="um-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 212, 255, 0.12)' }}>👥</div>
          <div className="stat-info"><span className="stat-value">{stats.total}</span><span className="stat-label">总用户数</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)' }}>🔑</div>
          <div className="stat-info"><span className="stat-value">{stats.adminCount}</span><span className="stat-label">管理员</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)' }}>👤</div>
          <div className="stat-info"><span className="stat-value">{stats.userCount}</span><span className="stat-label">普通用户</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)' }}>✅</div>
          <div className="stat-info"><span className="stat-value">{stats.activeCount}</span><span className="stat-label">活跃用户</span></div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="um-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span>🔍</span>
            <input
              placeholder="搜索用户名、姓名、部门..."
              value={searchText}
              onChange={(e) => setSearchText(safeTruncate(e.target.value, 50))}
              maxLength={50}
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">全部角色</option>
            {ROLE_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">全部状态</option>
            {STATUS_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
        </div>
        <div className="toolbar-right">
          {selectedIds.length > 0 && canDelete && (
            <button className="btn btn-danger" onClick={handleBatchDelete}>🗑️ 批量删除 ({selectedIds.length})</button>
          )}
          {canCreate && (
            <button className="btn btn-primary" onClick={handleAdd}>➕ 新增用户</button>
          )}
        </div>
      </div>

      {/* 用户表格 */}
      <div className="um-table-wrapper">
        <table className="um-table">
          <thead>
            <tr>
              <th className="col-check"><input type="checkbox" checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0} onChange={toggleSelectAll} /></th>
              <th>ID</th><th>用户名</th><th>姓名</th><th>角色</th><th>部门</th><th>邮箱</th><th>状态</th><th>最后登录</th><th className="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="10" className="empty-row"><div className="empty-content"><span className="empty-icon">📭</span><span>暂无用户数据</span></div></td></tr>
            ) : (
              filteredUsers.map(user => {
                const badge = getRoleBadge(user.role)
                const isSelf = currentUser?.id === user.id
                return (
                  <tr key={user.id} className={selectedIds.includes(user.id) ? 'row-selected' : ''}>
                    <td className="col-check"><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} /></td>
                    <td>{user.id}</td>
                    <td><strong>{escapeHtml(user.username)}</strong></td>
                    <td>{escapeHtml(user.name)}{isSelf ? <span style={{color:'#f59e0b',fontSize:'11px',marginLeft:'4px'}}>(我)</span> : null}</td>
                    <td><span className="role-badge" style={{ background: `${badge.color}18`, color: badge.color, border: `1px solid ${badge.color}35` }}>{badge.label}</span></td>
                    <td>{user.department || '-'}</td>
                    <td className="cell-email">{user.email || '-'}</td>
                    <td><span className={`status-dot ${user.status}`}>{user.status === 'active' ? '正常' : '禁用'}</span></td>
                    <td className="cell-time">{user.lastLogin || '-'}</td>
                    <td className="col-actions">
                      <div className="action-btns">
                        {canEdit && (
                          <button className="btn-sm btn-edit" onClick={() => handleEdit(user)} title="编辑">✏️</button>
                        )}
                        {canAssignRole && !isSelf && (
                          <button className="btn-sm" onClick={() => toggleStatus(user)} title={user.status === 'active' ? '禁用' : '启用'} style={{ color: user.status === 'active' ? '#f59e0b' : '#22c55e' }}>
                            {user.status === 'active' ? '⏸️' : '▶️'}
                          </button>
                        )}
                        {canDelete && user.role !== 'admin' && !isSelf && (
                          <button className="btn-sm btn-delete" onClick={() => confirmDelete(user)} title="删除">🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 操作日志面板 */}
      {operationLog.length > 0 && (
        <div className="um-log-panel">
          <div className="log-header"><span>📋 操作日志</span><span className="log-count">{operationLog.length} 条记录</span></div>
          <div className="log-list">
            {operationLog.slice(0, 10).map((log, idx) => (
              <div key={idx} className="log-item">
                <span className="log-time">{log.time}</span>
                <span className="log-action">{log.action}</span>
                <span className="log-target">{log.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 新增/编辑弹窗（含表单错误提示） */}
      {showModal && (
        <div className="um-modal-overlay" onClick={(e) => e.target.className === 'um-modal-overlay' && setShowModal(false)}>
          <div className="um-modal">
            <div className="modal-header">
              <h3>{editingUser ? '✏️ 编辑用户' : '➕ 新增用户'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {formError && (
                <div style={{ padding: '8px 12px', marginBottom: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#fca5a5', fontSize: '13px' }}>
                  ⚠️ {formError}
                </div>
              )}
              <div className="form-grid">
                <div className="field">
                  <label>用户名 *</label>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: safeTruncate(e.target.value, 30) })} disabled={!!editingUser} placeholder="3-30位，字母数字下划线中文" maxLength={30} />
                </div>
                <div className="field">
                  <label>姓名 *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: safeTruncate(e.target.value, 20) })} placeholder="真实姓名" maxLength={20} />
                </div>
                <div className="field">
                  <label>{editingUser ? '密码（留空不修改）' : '密码 *'}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingUser ? '留空则不修改密码' : '至少4位'} maxLength={128} />
                </div>
                <div className="field">
                  <label>角色</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={!canAssignRole}>
                    {ROLE_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                </div>
                <div className="field">
                  <label>部门</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    <option value="">请选择部门</option>
                    {DEPARTMENTS.map(d => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <div className="field">
                  <label>邮箱</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: safeTruncate(e.target.value, 50) })} placeholder="email@example.com" maxLength={50} />
                </div>
                <div className="field">
                  <label>账号状态</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUS_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>{editingUser ? '保存修改' : '确认新增'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteModal && deleteTarget && (
        <div className="um-modal-overlay" onClick={(e) => e.target.className === 'um-modal-overlay' && setShowDeleteModal(false)}>
          <div className="um-modal um-modal-sm">
            <div className="modal-header"><h3>⚠️ 确认删除</h3><button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button></div>
            <div className="modal-body">
              <p style={{ color: '#f87171', fontSize: '15px', marginBottom: '8px' }}>此操作不可撤销！</p>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>确定要{deleteTarget.isBatch ? '批量删除' : '删除用户'} <strong style={{ color: '#e2e8f0' }}>{escapeHtml(deleteTarget.name)}</strong> 吗？</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={deleteTarget.isBatch ? executeBatchDelete : executeDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementPage
