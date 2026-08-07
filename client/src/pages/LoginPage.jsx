import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  // 防止重复提交
  const [submitting, setSubmitting] = useState(false)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // 已登录则跳转首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 清除错误信息当用户开始输入
  const handleUsernameChange = useCallback((e) => {
    const val = e.target.value
    // 限制长度且只允许安全字符
    if (val.length <= 30 && /^[a-zA-Z0-9_\u4e00-\u9fa5]*$/.test(val)) {
      setUsername(val)
      if (error) setError('')
    }
  }, [error])

  const handlePasswordChange = useCallback((e) => {
    const val = e.target.value
    // 密码最大128字符
    if (val.length <= 128) {
      setPassword(val)
      if (error) setError('')
    }
  }, [error])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    // 防止重复提交
    if (submitting || loading) return
    setSubmitting(true)
    setLoading(true)

    try {
      // 模拟网络延迟（固定500ms，防止时序攻击）
      await new Promise(resolve => setTimeout(resolve, 500))

      const result = login(username, password)

      if (result.success) {
        // 登录成功后清除表单
        setUsername('')
        setPassword('')
        setError('')
        navigate('/', { replace: true })
      } else {
        setError(result.message)
        // 失败后清空密码字段（安全最佳实践）
        setPassword('')
      }
    } catch (err) {
      setError('登录过程发生异常，请重试')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
      setSubmitting(false)
    }
  }

  const handleDemoLogin = (user) => {
    setUsername(user.username)
    setPassword(user.password)
    setShowDemo(false)
    // 自动聚焦到登录按钮或密码框
    setError('')
  }

  const demoAccounts = [
    { username: 'admin', password: 'admin123', name: '系统管理员', role: '管理员', icon: '🔑' },
    { username: 'zhangwei', password: '123456', name: '张伟', role: '普通用户', icon: '👤' },
    { username: 'lina', password: '123456', name: '李娜', role: '普通用户', icon: '👤' },
  ]

  return (
    <div className="login-page">
      {/* 背景装饰 */}
      <div className="login-bg">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
      </div>

      <div className="login-container">
        {/* 左侧品牌信息 */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="brand-icon">⚙️</div>
            <h1 className="brand-title">水家电产品开发AI助手</h1>
            <p className="brand-subtitle">Water Appliance AI Assistant</p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">📦</span>
                <span>通用件模型库管理</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>产品线全生命周期管理</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛠️</span>
                <span>智能设计工具箱</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>角色权限安全控制</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div className="login-form-wrapper">
          <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
            <h2 className="form-title">账号登录</h2>
            <p className="form-desc">请输入您的账号信息以访问系统</p>

            {error && (
              <div className="login-error" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="login-username">用户名</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="请输入用户名"
                  autoComplete="username"
                  disabled={loading}
                  maxLength={30}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">密码</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  disabled={loading}
                  maxLength={128}
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading || submitting}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </button>

            {/* 演示账号切换 */}
            <div className="demo-section">
              <button
                type="button"
                className="demo-toggle"
                onClick={() => setShowDemo(!showDemo)}
              >
                {showDemo ? '收起演示账号 ▲' : '使用演示账号登录 ▼'}
              </button>

              {showDemo && (
                <div className="demo-accounts">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      className="demo-account-btn"
                      onClick={() => handleDemoLogin(account)}
                    >
                      <span className="demo-icon">{account.icon}</span>
                      <span className="demo-info">
                        <span className="demo-name">{account.name}</span>
                        <span className="demo-role">{account.role}</span>
                      </span>
                      <span className="demo-arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          <div className="login-footer">
            <p>© 2026 水家电产品开发AI助手 · 角色权限系统演示</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
