import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './SystemConfigPage.css'

// 默认系统配置
const DEFAULT_CONFIG = {
  // 平台基本信息
  platformName: '水家电产品开发AI助手',
  platformVersion: 'v2.1.0',
  companyName: '水家电研发中心',
  logoText: '⚙️',

  // 安全设置
  sessionTimeout: 120,        // 会话超时（分钟）
  passwordMinLength: 6,       // 密码最小长度
  maxLoginAttempts: 5,        // 最大登录尝试次数
  requirePasswordChange: false, // 是否强制定期改密码

  // 功能开关
  enableAIAssistant: true,
  enableModelUpload: true,
  enableDataExport: true,
  enableOperationLog: true,
  enableNotification: true,

  // 模型库设置
  maxModelSize: 50,           // 最大模型文件大小(MB)
  allowedFormats: ['STP', 'STEP', 'IGES', 'STL'],
  defaultPreviewQuality: 'high', // high / medium / low

  // 数据保留策略
  logRetentionDays: 90,
  autoBackupEnabled: true,
  backupFrequency: 'daily',   // daily / weekly / monthly

  // 通知设置
  adminEmail: 'admin@waterai.com',
  smtpServer: '',
  smtpPort: 587,

  // API配置
  apiRateLimit: 1000,         // 每分钟请求限制
  enableCORS: true,
}

function SystemConfigPage() {
  const { hasPermission } = useAuth()
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG })
  const [activeTab, setActiveTab] = useState('basic')
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [notification, setNotification] = useState(null)

  // 权限检查
  const canEdit = hasPermission('system:config')

  // 更新配置项
  const updateConfig = (key, value) => {
    if (!canEdit) return
    setConfig(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // 保存配置
  const handleSave = () => {
    setShowSaveConfirm(false)
    setHasChanges(false)
    showNotif('success', '配置已保存成功！')
  }

  // 重置为默认值
  const handleReset = () => {
    setConfig({ ...DEFAULT_CONFIG })
    setShowResetConfirm(false)
    setHasChanges(true)
    showNotif('info', '已恢复默认配置，请确认后保存')
  }

  // 显示通知
  const showNotif = (type, msg) => {
    setNotification({ type, msg })
    setTimeout(() => setNotification(null), 3000)
  }

  // 配置分组标签页
  const tabs = [
    { id: 'basic', label: '基本设置', icon: '📋' },
    { id: 'security', label: '安全设置', icon: '🔒' },
    { id: 'features', label: '功能开关', icon: '⚡' },
    { id: 'model', label: '模型库设置', icon: '📦' },
    { id: 'data', label: '数据策略', icon: '💾' },
    { id: 'api', label: 'API配置', icon: '🔗' },
  ]

  return (
    <div className="sc-page">
      {/* 页面标题 */}
      <div className="sc-header">
        <div>
          <h2>⚙️ 系统配置</h2>
          <p className="sc-desc">管理平台运行参数、安全策略和功能开关</p>
        </div>
        <div className="sc-actions">
          {canEdit && hasChanges && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowResetConfirm(true)}>
                🔄 恢复默认
              </button>
              <button className="btn btn-primary" onClick={() => setShowSaveConfirm(true)}>
                💾 保存配置
              </button>
            </>
          )}
        </div>
      </div>

      {/* 通知提示 */}
      {notification && (
        <div className={`sc-notification sc-notif-${notification.type}`}>
          <span>{notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* 标签页导航 */}
      <div className="sc-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sc-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 配置内容区 */}
      <div className="sc-content">
        {/* 基本设置 */}
        {activeTab === 'basic' && (
          <div className="config-section">
            <h3 className="section-title">平台基本信息</h3>
            <div className="config-grid">
              <div className="config-field">
                <label>平台名称</label>
                <input
                  value={config.platformName}
                  onChange={(e) => updateConfig('platformName', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="config-field">
                <label>版本号</label>
                <input
                  value={config.platformVersion}
                  onChange={(e) => updateConfig('platformVersion', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="config-field">
                <label>所属公司/部门</label>
                <input
                  value={config.companyName}
                  onChange={(e) => updateConfig('companyName', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="config-field">
                <label>Logo 图标</label>
                <input
                  value={config.logoText}
                  onChange={(e) => updateConfig('logoText', e.target.value)}
                  disabled={!canEdit}
                  style={{ textAlign: 'center', fontSize: '18px' }}
                />
              </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '28px' }}>通知邮箱</h3>
            <div className="config-grid">
              <div className="config-field">
                <label>管理员通知邮箱</label>
                <input
                  type="email"
                  value={config.adminEmail}
                  onChange={(e) => updateConfig('adminEmail', e.target.value)}
                  disabled={!canEdit}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="config-field">
                <label>SMTP 服务器</label>
                <input
                  value={config.smtpServer}
                  onChange={(e) => updateConfig('smtpServer', e.target.value)}
                  disabled={!canEdit}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="config-field">
                <label>SMTP 端口</label>
                <input
                  type="number"
                  value={config.smtpPort}
                  onChange={(e) => updateConfig('smtpPort', parseInt(e.target.value) || 0)}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        )}

        {/* 安全设置 */}
        {activeTab === 'security' && (
          <div className="config-section">
            <h3 className="section-title">会话与密码策略</h3>
            <div className="config-grid">
              <div className="config-field">
                <label>会话超时时间（分钟）</label>
                <input
                  type="number"
                  value={config.sessionTimeout}
                  onChange={(e) => updateConfig('sessionTimeout', parseInt(e.target.value) || 0)}
                  disabled={!canEdit}
                  min="5"
                  max="1440"
                />
                <span className="field-hint">用户无操作自动退出时间</span>
              </div>
              <div className="config-field">
                <label>密码最小长度</label>
                <input
                  type="number"
                  value={config.passwordMinLength}
                  onChange={(e) => updateConfig('passwordMinLength', parseInt(e.target.value) || 0)}
                  disabled={!canEdit}
                  min="4"
                  max="32"
                />
              </div>
              <div className="config-field">
                <label>最大登录尝试次数</label>
                <input
                  type="number"
                  value={config.maxLoginAttempts}
                  onChange={(e) => updateConfig('maxLoginAttempts', parseInt(e.target.value) || 0)}
                  disabled={!canEdit}
                  min="3"
                  max="20"
                />
                <span className="field-hint">超过次数将锁定账号</span>
              </div>
              <div className="config-field config-field-switch">
                <label>强制定期修改密码</label>
                <label className="switch-wrapper">
                  <input
                    type="checkbox"
                    checked={config.requirePasswordChange}
                    onChange={(e) => updateConfig('requirePasswordChange', e.target.checked)}
                    disabled={!canEdit}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>

            <div className="security-notice">
              <span className="notice-icon">🛡️</span>
              <div>
                <strong>安全建议</strong>
                <p>建议会话超时设置为30-120分钟，密码长度不少于8位，每90天强制更换一次密码。</p>
              </div>
            </div>
          </div>
        )}

        {/* 功能开关 */}
        {activeTab === 'features' && (
          <div className="config-section">
            <h3 className="section-title">功能模块控制</h3>
            <div className="toggle-list">
              {[
                { key: 'enableAIAssistant', label: 'AI智能助手', desc: '启用模型库中的AI搜索和智能推荐功能', icon: '🤖' },
                { key: 'enableModelUpload', label: '模型上传', desc: '允许管理员上传新的3D模型文件', icon: '📤' },
                { key: 'enableDataExport', label: '数据导出', desc: '允许导出产品数据、模型列表等报表', icon: '📊' },
                { key: 'enableOperationLog', label: '操作日志记录', desc: '记录所有用户的增删改操作用于审计', icon: '📝' },
                { key: 'enableNotification', label: '系统通知', desc: '启用邮件/站内消息提醒功能', icon: '🔔' },
              ].map(item => (
                <div key={item.key} className="toggle-item">
                  <div className="toggle-info">
                    <span className="toggle-icon">{item.icon}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                  <label className="switch-wrapper">
                    <input
                      type="checkbox"
                      checked={config[item.key]}
                      onChange={(e) => updateConfig(item.key, e.target.checked)}
                      disabled={!canEdit}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模型库设置 */}
        {activeTab === 'model' && (
          <div className="config-section">
            <h3 className="section-title">文件上传规则</h3>
            <div className="config-grid">
              <div className="config-field">
                <label>最大文件大小（MB）</label>
                <input
                  type="number"
                  value={config.maxModelSize}
                  onChange={(e) => updateConfig('maxModelSize', parseInt(e.target.value) || 0)}
                  disabled={!canEdit}
                  min="1"
                  max="500"
                />
              </div>
              <div className="config-field">
                <label>默认预览质量</label>
                <select
                  value={config.defaultPreviewQuality}
                  onChange={(e) => updateConfig('defaultPreviewQuality', e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="high">高质量（推荐）</option>
                  <option value="medium">中等质量</option>
                  <option value="low">低质量（省资源）</option>
                </select>
              </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '24px' }}>支持的文件格式</h3>
            <div className="format-tags">
              {['STP', 'STEP', 'IGES', 'STL', 'OBJ', 'PLY'].map(fmt => {
                const isAllowed = config.allowedFormats.includes(fmt.toUpperCase()) ||
                  config.allowedFormats.includes(fmt)
                return (
                  <span
                    key={fmt}
                    className={`format-tag ${isAllowed ? 'allowed' : 'disabled'}`}
                  >
                    .{fmt} {isAllowed ? '✅' : '❌'}
                  </span>
                )
              })}
            </div>
            <p className="field-hint" style={{ marginTop: '10px' }}>
              格式支持列表可在后端配置文件中修改
            </p>
          </div>
        )}

        {/* 数据策略 */}
        {activeTab === 'data' && (
          <div className="config-section">
            <h3 className="section-title">备份与保留策略</h3>
            <div className="config-grid">
              <div className="config-field">
                <label>操作日志保留天数</label>
                <input
                  type="number"
                  value={config.logRetentionDays}
                  onChange={(e) => updateConfig('logRetentionDays', parseInt(e.target.value) || 0)}
                  disabled={!canEdit}
                  min="7"
                  max="365"
                />
              </div>
              <div className="config-field config-field-switch">
                <label>启用自动备份</label>
                <label className="switch-wrapper">
                  <input
                    type="checkbox"
                    checked={config.autoBackupEnabled}
                    onChange={(e) => updateConfig('autoBackupEnabled', e.target.checked)}
                    disabled={!canEdit}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
              <div className="config-field">
                <label>备份频率</label>
                <select
                  value={config.backupFrequency}
                  onChange={(e) => updateConfig('backupFrequency', e.target.value)}
                  disabled={!canEdit || !config.autoBackupEnabled}
                >
                  <option value="daily">每日备份</option>
                  <option value="weekly">每周备份</option>
                  <option value="monthly">每月备份</option>
                </select>
              </div>
            </div>

            <div className="data-preview">
              <h4>存储预估</h4>
              <div className="storage-bars">
                <div className="storage-bar">
                  <span className="bar-label">操作日志</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: '35%', background: '#00d4ff' }}></div>
                  </div>
                  <span className="bar-value">~{Math.round(config.logRetentionDays * 2.5)} MB</span>
                </div>
                <div className="storage-bar">
                  <span className="bar-label">备份数据</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: '60%', background: '#22c55e' }}></div>
                  </div>
                  <span className="bar-value">~{config.autoBackupEnabled ? (config.backupFrequency === 'daily' ? '500' : config.backupFrequency === 'weekly' ? '200' : '80') : 0} MB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API配置 */}
        {activeTab === 'api' && (
          <div className="config-section">
            <h3 className="section-title">接口访问控制</h3>
            <div className="config-grid">
              <div className="config-field">
                <label>API 请求频率限制（次/分钟）</label>
                <input
                  type="number"
                  value={config.apiRateLimit}
                  onChange={(e) => updateConfig('apiRateLimit', parseInt(e.target.value) || 0)}
                  disabled={!canEdit}
                  min="60"
                  max="10000"
                />
                <span className="field-hint">单个IP或用户每分钟的最大请求次数</span>
              </div>
              <div className="config-field config-field-switch">
                <label>启用 CORS 跨域</label>
                <label className="switch-wrapper">
                  <input
                    type="checkbox"
                    checked={config.enableCORS}
                    onChange={(e) => updateConfig('enableCORS', e.target.checked)}
                    disabled={!canEdit}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>

            <div className="api-status-cards">
              <div className="status-card">
                <span className="status-dot-active"></span>
                <strong>前端服务</strong>
                <span>:3000 运行中</span>
              </div>
              <div className="status-card">
                <span className="status-dot-active"></span>
                <strong>后端API</strong>
                <span>:8080 运行中</span>
              </div>
              <div className="status-card">
                <span className="status-dot-inactive"></span>
                <strong>数据库</strong>
                <span>SQLite 本地</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!canEdit && (
        <div className="sc-readonly-notice">
          🔒 您的账号没有系统配置权限，仅可查看当前配置。如需修改请联系管理员。
        </div>
      )}

      {/* 保存确认弹窗 */}
      {showSaveConfirm && (
        <div className="um-modal-overlay" onClick={(e) => e.target.className === 'um-modal-overlay' && setShowSaveConfirm(false)}>
          <div className="um-modal um-modal-sm">
            <div className="modal-header">
              <h3>💾 确认保存</h3>
              <button className="modal-close" onClick={() => setShowSaveConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                确定要保存当前所有配置更改吗？部分配置项可能需要重启服务才能生效。
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSaveConfirm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>确认保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 重置确认弹窗 */}
      {showResetConfirm && (
        <div className="um-modal-overlay" onClick={(e) => e.target.className === 'um-modal-overlay' && setShowResetConfirm(false)}>
          <div className="um-modal um-modal-sm">
            <div className="modal-header">
              <h3>🔄 恢复默认</h3>
              <button className="modal-close" onClick={() => setShowResetConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#f59e0b', fontSize: '15px', marginBottom: '8px' }}>
                此操作将把所有配置恢复为出厂默认值！
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                当前未保存的修改将会丢失。确定要继续吗？
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleReset}>确认重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemConfigPage
