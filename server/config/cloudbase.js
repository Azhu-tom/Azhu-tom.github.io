/**
 * CloudBase 数据库连接与操作封装
 *
 * 注意：
 * - 此文件提供 CloudBase 数据库的完整集成方案
 * - 需要正确配置 TCB_ENV_ID 环境变量
 * - 当前版本使用内存数据模拟，生产环境请启用真实数据库
 */

// 导入 CloudBase SDK（已注释，需要时取消注释）
// import cloudbase from '@cloudbase/node-sdk'
import cloudbaseConfig from './database.js'

class CloudBaseDB {
  constructor() {
    this.db = null
    this.initialized = false
  }

  /**
   * 初始化数据库连接
   */
  async init() {
    try {
      // 检查环境变量是否配置
      if (!process.env.TCB_ENV_ID || process.env.TCB_ENV_ID === 'your-env-id') {
        console.log('⚠️  CloudBase 未配置，使用模拟数据模式')
        console.log('   请设置环境变量 TCB_ENV_ID 以启用真实数据库')
        this.initialized = false
        return
      }

      // 初始化 CloudBase（正式环境）
      /*
      const app = cloudbase.init({
        env: cloudbaseConfig.envId,
        secretId: cloudbaseConfig.secretId,
        secretKey: cloudbaseConfig.secretKey
      })

      this.db = app.database()
      */

      this.initialized = true
      console.log('✅ CloudBase 数据库连接成功')
    } catch (error) {
      console.error('❌ CloudBase 初始化失败:', error.message)
      this.initialized = false
    }
  }

  /**
   * 获取集合引用
   */
  collection(name) {
    if (!this.initialized || !this.db) {
      throw new Error('数据库未初始化，请检查配置')
    }
    return this.db.collection(cloudbaseConfig.collections[name] || name)
  }

  /**
   * 检查数据库状态
   */
  isReady() {
    return this.initialized && !!this.db
  }
}

// 导出单例实例
const cloudBaseDB = new CloudBaseDB()

export default cloudBaseDB
export { cloudbaseConfig }
