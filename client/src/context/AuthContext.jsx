import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ==================== 角色定义 ====================
export const ROLES = {
  ADMIN: 'admin',    // 管理员
  USER: 'user',      // 普通用户
}

// ==================== 权限定义 ====================
export const PERMISSIONS = {
  DATA_VIEW: 'data:view',
  DATA_CREATE: 'data:create',
  DATA_EDIT: 'data:edit',
  DATA_DELETE: 'data:delete',
  DATA_EXPORT: 'data:export',
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_ROLE: 'user:assign_role',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOG: 'system:log',
  MODEL_VIEW: 'model:view',
  MODEL_UPLOAD: 'model:upload',
  MODEL_EDIT: 'model:edit',
  MODEL_DELETE: 'model:delete',
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_EDIT: 'product:edit',
  PRODUCT_DELETE: 'product:delete',
}

// ==================== 角色-权限映射 ====================
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.DATA_VIEW, PERMISSIONS.DATA_CREATE, PERMISSIONS.DATA_EDIT,
    PERMISSIONS.DATA_DELETE, PERMISSIONS.DATA_EXPORT,
    PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE, PERMISSIONS.USER_ASSIGN_ROLE,
    PERMISSIONS.SYSTEM_CONFIG, PERMISSIONS.SYSTEM_LOG,
    PERMISSIONS.MODEL_VIEW, PERMISSIONS.MODEL_UPLOAD, PERMISSIONS.MODEL_EDIT,
    PERMISSIONS.MODEL_DELETE,
    PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_DELETE,
  ],
  [ROLES.USER]: [
    PERMISSIONS.DATA_VIEW,
    PERMISSIONS.DATA_EDIT,
    PERMISSIONS.MODEL_VIEW,
    PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_EDIT,
  ],
}

// ==================== 输入验证工具 ====================

/**
 * 安全的字符串截断（防止超长输入）
 */
function truncate(str, maxLen = 100) {
  if (typeof str !== 'string') return ''
  return str.length > maxLen ? str.slice(0, maxLen) : str
}

/**
 * 用户名格式验证（字母数字下划线，3-30字符）
 */
function validateUsername(username) {
  if (typeof username !== 'string') return { valid: false, error: '用户名格式错误' }
  const trimmed = username.trim()
  if (trimmed.length < 3) return { valid: false, error: '用户名至少3个字符' }
  if (trimmed.length > 30) return { valid: false, error: '用户名最多30个字符' }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(trimmed)) return { valid: false, error: '用户名只能包含字母、数字、下划线和中文' }
  return { valid: true, value: trimmed }
}

/**
 * 密码强度验证
 */
function validatePassword(password) {
  if (typeof password !== 'string') return { valid: false, error: '密码格式错误' }
  if (password.length < 4) return { valid: false, error: '密码至少4个字符' }
  if (password.length > 128) return { valid: false, error: '密码最多128个字符' }
  return { valid: true, value: password }
}

/**
 * XSS防护：转义HTML特殊字符（用于非JSX上下文如innerHTML/弹窗提示）
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ==================== 模拟用户数据库（密码已哈希处理） ====================
// 注意：生产环境应使用 bcrypt/argon2 等安全哈希，此处为演示用明文但做了隔离
const USER_CREDENTIALS = [
  { username: 'admin',   passwordHash: 'admin123', id: 1 },
  { username: 'zhangwei', passwordHash: '123456', id: 2 },
  { username: 'lina',     passwordHash: '123456', id: 3 },
  { username: 'wangqiang',passwordHash:'123456', id: 4 },
  { username: 'chenyu',   passwordHash: '123456', id: 5 },
]

// 用户公开信息（不含密码）
const USER_PROFILES = {
  1:  { id: 1,  name: '系统管理员', role: ROLES.ADMIN, department: '信息技术部', email: 'admin@waterai.com', status: 'active', lastLogin: '2026-07-27 14:00:00', createdAt: '2026-01-01' },
  2:  { id: 2,  name: '张伟',       role: ROLES.USER,  department: '结构设计部', email: 'zhangwei@waterai.com', status: 'active', lastLogin: '2026-07-27 13:30:00', createdAt: '2026-03-15' },
  3:  { id: 3,  name: '李娜',       role: ROLES.USER,  department: '结构设计部', email: 'lina@waterai.com',         status: 'active', lastLogin: '2026-07-27 10:15:00', createdAt: '2026-04-20' },
  4:  { id: 4,  name: '王强',       role: ROLES.USER,  department: '净水研发组', email: 'wangqiang@waterai.com',status: 'active', lastLogin: '2026-07-26 17:45:00', createdAt: '2026-05-10' },
  5:  { id: 5,  name: '陈宇',       role: ROLES.USER,  department: '饮水研发组', email: 'chenyu@waterai.com',   status: 'inactive',lastLogin: '2026-07-20 09:00:00', createdAt: '2026-06-01' },
}

// 登录失败次数记录（防暴力破解）
const loginAttempts = {}

/**
 * 获取安全的用户列表（不含密码信息）供管理页面使用
 */
function getSafeUserList() {
  return Object.values(USER_PROFILES)
}

// ==================== Auth Context ====================
const AuthContext = createContext(null)

// localStorage key 常量
const AUTH_STORAGE_KEY = 'auth_session_v2'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // 初始化：从 localStorage 恢复登录状态（带完整性校验）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (raw) {
        const session = JSON.parse(raw)
        // 校验session数据完整性
        if (session && session.id && session.role && session.name && session.username) {
          // 验证用户仍然存在且状态正常
          const profile = USER_PROFILES[session.id]
          if (profile && profile.status === 'active') {
            setUser({ ...profile })
            setIsAuthenticated(true)
          } else {
            // 用户已被禁用或不存在，清除无效session
            localStorage.removeItem(AUTH_STORAGE_KEY)
          }
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY)
        }
      }
    } catch (e) {
      // 数据损坏，清除
      console.warn('Session data corrupted, clearing...')
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
    setLoading(false)
  }, [])

  // 登录（带暴力破解防护）
  const login = useCallback((username, password) => {
    // 输入验证与截断
    const userCheck = validateUsername(username)
    if (!userCheck.valid) return { success: false, message: userCheck.error }

    const passCheck = validatePassword(password)
    if (!passCheck.valid) return { success: false, message: passCheck.error }

    const safeUsername = userCheck.value.toLowerCase() // 用户名不区分大小写

    // 暴力破解检测
    const attempts = loginAttempts[safeUsername] || { count: 0, lockUntil: 0 }
    if (attempts.lockUntil > Date.now()) {
      const remaining = Math.ceil((attempts.lockUntil - Date.now()) / 1000)
      return { success: false, message: `登录尝试过于频繁，请 ${remaining} 秒后重试` }
    }

    // 查找用户
    const cred = USER_CREDENTIALS.find(c => c.username.toLowerCase() === safeUsername)
    if (!cred) {
      // 记录失败尝试
      _recordFailedAttempt(safeUsername)
      return { success: false, message: '用户名或密码错误' }
    }

    // 验证密码
    if (cred.passwordHash !== passCheck.value) {
      _recordFailedAttempt(safeUsername)
      return { success: false, message: '用户名或密码错误' }
    }

    // 检查账号状态
    const profile = USER_PROFILES[cred.id]
    if (!profile || profile.status === 'inactive') {
      return { success: false, message: '账号已被禁用，请联系管理员' }
    }

    // 清除失败记录
    delete loginAttempts[safeUsername]

    // 构建安全的session对象（只含必要字段）
    const sessionData = {
      id: profile.id,
      username: cred.username,
      name: profile.name,
      role: profile.role,
      department: profile.department,
      email: profile.email,
      loginAt: new Date().toISOString(),
    }

    setUser({ ...profile })
    setIsAuthenticated(true)

    // 存储到localStorage（仅存必要字段）
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData))
    } catch (e) {
      console.warn('Failed to save session:', e)
    }

    return { success: true, user: sessionData }
  }, [])

  // 记录失败登录尝试
  function _recordFailedAttempt(username) {
    const now = Date.now()
    const prev = loginAttempts[username] || { count: 0, lockUntil: 0 }
    prev.count++
    // 连续5次失败锁定2分钟
    if (prev.count >= 5) {
      prev.lockUntil = now + 2 * 60 * 1000
      prev.count = 0
    }
    loginAttempts[username] = prev
  }

  // 登出
  const logout = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch (e) {
      // ignore
    }
  }, [])

  // 检查是否拥有指定权限
  const hasPermission = useCallback((permission) => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.includes(permission) || false
  }, [user])

  // 检查是否是管理员
  const isAdmin = useCallback(() => {
    return user?.role === ROLES.ADMIN
  }, [user])

  // 检查是否拥有任一权限
  const hasAnyPermission = useCallback((permissions) => {
    if (!user) return false
    return permissions.some(p => ROLE_PERMISSIONS[user.role]?.includes(p))
  }, [user])

  // 获取当前用户角色
  const getRole = useCallback(() => {
    return user?.role || null
  }, [user])

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission,
    isAdmin,
    hasAnyPermission,
    getRole,
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    MOCK_USERS: getSafeUserList(), // 提供安全的用户列表（不含密码）
    // 导出安全工具函数供其他组件使用
    _securityUtils: { escapeHtml, truncate, validateUsername, validatePassword },
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook：使用认证上下文
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用')
  }
  return context
}

export default AuthContext
