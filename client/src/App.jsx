import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Header from './components/Header'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ModelLibraryPage from './pages/ModelLibraryPage'
import ModelViewerPage from './pages/ModelViewerPage'
import ToolboxPage from './pages/ToolboxPage'
import ProductManagementPage from './pages/ProductManagementPage'
import UserManagementPage from './pages/UserManagementPage'
import SystemConfigPage from './pages/SystemConfigPage'
import './App.css'

/** 404 兜底页面 */
function NotFoundPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: '40px',
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
      <h2 style={{ color: '#e2e8f0', fontSize: '24px', marginBottom: '8px' }}>页面不存在</h2>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>您访问的页面可能已被移除或路径不正确</p>
      <Link to="/" style={{
        display: 'inline-block', padding: '10px 28px',
        background: 'linear-gradient(135deg, #00d4ff, #0891b2)', color: '#000',
        borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
      }}>返回首页</Link>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main className="content-area">
          <Routes>
              {/* 登录页（无需登录即可访问） */}
              <Route path="/login" element={<LoginPage />} />

              {/* 需要登录的受保护路由 */}
              <Route path="/" element={
                <ProtectedRoute>
                  <ErrorBoundary><HomePage /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/model-library" element={
                <ProtectedRoute>
                  <ErrorBoundary><ModelLibraryPage /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/model-library/viewer/:id" element={
                <ProtectedRoute>
                  <ErrorBoundary><ModelViewerPage /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/toolbox" element={
                <ProtectedRoute>
                  <ErrorBoundary><ToolboxPage /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/product-management" element={
                <ProtectedRoute>
                  <ErrorBoundary><ProductManagementPage /></ErrorBoundary>
                </ProtectedRoute>
              } />

              {/* 管理员专属路由 */}
              <Route path="/user-management" element={
                <AdminRoute>
                  <ErrorBoundary><UserManagementPage /></ErrorBoundary>
                </AdminRoute>
              } />
              <Route path="/system-config" element={
                <AdminRoute>
                  <ErrorBoundary><SystemConfigPage /></ErrorBoundary>
                </AdminRoute>
              } />

              {/* 404兜底路由 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
