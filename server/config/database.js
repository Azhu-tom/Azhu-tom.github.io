/**
 * CloudBase 数据库配置
 *
 * 使用说明：
 * 1. 在腾讯云 CloudBase 控制台获取环境信息
 * 2. 将配置信息填入下方
 * 3. 确保已安装 @cloudbase/node-sdk
 */

const cloudbaseConfig = {
  // CloudBase 环境ID（必填）
  envId: process.env.TCB_ENV_ID || 'your-env-id',

  // 秘钥（可选，用于服务端调用）
  secretId: process.env.TCB_SECRET_ID || '',
  secretKey: process.env.TCB_SECRET_KEY || '',

  // 数据库集合名称
  collections: {
    models: 'models',           // 模型库集合
    categories: 'categories',   // 分类集合
    users: 'users',             // 用户集合
    operations: 'operations'    // 操作日志集合
  },

  // 数据库字段定义
  schemas: {
    model: {
      name: { type: 'string', required: true },
      category: { type: 'string', required: true },
      format: { type: 'string', default: 'STP' },
      size: { type: 'number' },
      url: { type: 'string' },
      thumbnailUrl: { type: 'string' },
      description: { type: 'string' },
      tags: { type: 'array', default: [] },
      uploadBy: { type: 'string' },
      createdAt: { type: 'date', default: new Date() },
      updatedAt: { type: 'date' }
    }
  }
}

export default cloudbaseConfig
