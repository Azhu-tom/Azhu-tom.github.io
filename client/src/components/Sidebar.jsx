import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

function Sidebar({ isOpen }) {
  const location = useLocation()
  const { isAdmin, isAuthenticated, user } = useAuth()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // 公共菜单（所有用户可见）
  const publicMenuItems = [
    { path: '/', icon: '🏠', label: '首页概览' },
    { path: '/model-library', icon: '📦', label: '通用件模型库' },
    { path: '/toolbox', icon: '🛠️', label: '设计百宝箱' },
  ]

  // 管理员专属菜单
  const adminMenuItems = [
    { path: '/product-management', icon: '📊', label: '产品线管理' },
    { path: '/user-management', icon: '👥', label: '用户管理' },
    { path: '/system-config', icon: '⚙️', label: '系统配置' },
  ]

  // 普通用户菜单
  const userMenuItems = [
    { path: '/product-management', icon: '📊', label: '产品线管理' },
  ]

  // 根据角色合并菜单
  const menuItems = [...publicMenuItems]
  if (isAuthenticated) {
    if (isAdmin()) {
      menuItems.push(...adminMenuItems)
    } else {
      menuItems.push(...userMenuItems)
    }
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* 用户信息区 */}
      {isAuthenticated && user && (
        <div className="sidebar-user">
          <div className="user-avatar">
            {(user.name || '').charAt(0)}
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className={`user-role ${user.role}`}>
              {user.role === 'admin' ? '🔑 管理员' : '👤 普通用户'}
            </span>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="link-icon">{item.icon}</span>
            <span className="link-label">{item.label}</span>
            {isActive(item.path) && <span className="active-indicator" />}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-info">
          <div className="info-item">
            <span className="info-dot"></span>
            <span>系统运行中</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
