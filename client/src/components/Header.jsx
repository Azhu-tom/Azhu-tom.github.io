import React, { useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Header.css'

const NAV_ITEMS = [
  { path: '/',                    label: '首页概览',   icon: '🏠', theme: 'home' },
  { path: '/model-library',       label: '模型库',     icon: '📦', theme: 'models' },
  { path: '/toolbox',             label: '设计百宝箱', icon: '🛠️', theme: 'toolbox' },
  { path: '/product-management',  label: '产品线',     icon: '📋', theme: 'products' },
]

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = useCallback((path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    setShowUserMenu(false)
  }

  return (
    <header className="nav-bar" role="banner">
      <div className="nav-bar-inner">
        <div className="nav-left">
          <Link to="/" className="nav-logo" aria-label="水家电产品开发AI助手 - 返回首页">
            <span className="nav-logo-icon">💧</span>
            <div className="nav-logo-text">
              <span className="nav-logo-cn">水家电产品开发</span>
              <span className="nav-logo-sub">AI 设计引擎</span>
            </div>
          </Link>
        </div>

        <nav className="nav-center" role="navigation" aria-label="主导航">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''} theme-${item.theme}`}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="nav-right">
          {isAuthenticated && user ? (
            <div className="nav-user-wrapper">
              <button
                className="nav-user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <span className="nav-avatar">{(user.name || 'U').charAt(0)}</span>
                <span className="nav-user-name">{user.name}</span>
                <span className={`nav-role-tag ${user.role}`}>
                  {user.role === 'admin' ? '管理员' : '用户'}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div className="nav-dropdown" role="menu">
                    <div className="nav-dropdown-info">
                      <span className="nav-dropdown-avatar">{(user.name || 'U').charAt(0)}</span>
                      <div>
                        <strong>{user.name}</strong>
                        <p>{user.department || '未分配部门'}</p>
                      </div>
                    </div>
                    <div className="nav-dropdown-divider" />
                    {isAdmin() && (
                      <>
                        <Link to="/user-management" className="nav-dropdown-link" onClick={() => setShowUserMenu(false)} role="menuitem">
                          <span>👥</span> 用户管理
                        </Link>
                        <Link to="/system-config" className="nav-dropdown-link" onClick={() => setShowUserMenu(false)} role="menuitem">
                          <span>⚙️</span> 系统配置
                        </Link>
                        <div className="nav-dropdown-divider" />
                      </>
                    )}
                    <button className="nav-logout-btn" onClick={handleLogout} role="menuitem">
                      <span>🚪</span> 退出登录
                    </button>
                  </div>
                  <div className="nav-backdrop" onClick={() => setShowUserMenu(false)} />
                </>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-login-link">
              🔐 登录
            </Link>
          )}

          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={mobileOpen}
          >
            <span className={`hamburger ${mobileOpen ? 'open' : ''}`}>
              <em /><em /><em />
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="nav-mobile-dropdown" role="navigation" aria-label="移动端导航">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-mobile-item ${isActive(item.path) ? 'active' : ''} theme-${item.theme}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          {isAdmin() && (
            <>
              <div className="nav-mobile-divider" />
              <Link to="/user-management" className="nav-mobile-item" onClick={() => setMobileOpen(false)}>
                <span>👥</span> 用户管理
              </Link>
              <Link to="/system-config" className="nav-mobile-item" onClick={() => setMobileOpen(false)}>
                <span>⚙️</span> 系统配置
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}

export default Header
