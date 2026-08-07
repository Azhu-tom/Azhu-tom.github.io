import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * 路由守卫 - 需要登录才能访问
 * 未登录时重定向到登录页，并记录原始路径以便登录后跳回
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: '#64748b',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div className="loading-spinner" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

/**
 * 管理员路由守卫 - 仅管理员可访问
 * 非管理员用户访问时显示无权限提示
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', color: '#64748b',
      }}>
        <div className="loading-spinner" />
        <span style={{ marginLeft: '12px' }}>加载中...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin()) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '40px',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ color: '#e2e8f0', fontSize: '22px', marginBottom: '8px' }}>权限不足</h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px', maxWidth: '400px' }}>
          您的账号没有管理员权限，无法访问此页面。如需帮助请联系系统管理员。
        </p>
        {/* 使用 Link 替代 a 标签，避免整页刷新丢失状态 */}
        <Link to="/" style={{
          display: 'inline-block', padding: '10px 28px',
          background: 'linear-gradient(135deg, #00d4ff, #0891b2)', color: '#000',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
        }}>
          返回首页
        </Link>
      </div>
    )
  }

  return children
}

export { ProtectedRoute, AdminRoute }
export default ProtectedRoute
