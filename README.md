# 结构工程师AI助手 🛠️

一个为结构工程师打造的全栈智能工作平台，提供模型库管理和专业设计工具。

## ✨ 技术栈

### 前端
- **React 18** - 用户界面框架
- **Vite 5** - 构建工具（极速开发体验）
- **React Router 6** - 路由管理
- **Axios** - HTTP 客户端

### 后端
- **Node.js + Express** - 服务端框架
- **CloudBase SDK** - 云数据库集成
- **Multer** - 文件上传处理

### 数据库
- **腾讯云 CloudBase 数据库** - 云原生 NoSQL 数据库

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 启动开发服务器

```bash
# 终端1：启动后端服务 (http://localhost:8080)
cd server
npm run dev

# 终端2：启动前端服务 (http://localhost:3000)
cd client
npm run dev
```

访问 http://localhost:3000 查看应用。

## 📁 项目结构

```
结构工程师AI助手/
├── client/                     # 前端应用
│   ├── src/
│   │   ├── components/         # 公共组件
│   │   │   ├── Header/         # 顶部导航栏
│   │   │   ├── Sidebar/        # 侧边栏
│   │   │   └── ModelLibrary/   # 模型库组件
│   │   │       ├── SearchBar.jsx      # 搜索框
│   │   │       ├── CategoryFilter.jsx # 分类筛选
│   │   │       ├── ModelList.jsx      # 模型列表
│   │   │       └── ModelPreview.jsx   # 模型预览
│   │   ├── pages/              # 页面组件
│   │   │   ├── HomePage.jsx           # 首页
│   │   │   ├── ModelLibraryPage.jsx   # 模型库页
│   │   │   └── ToolboxPage.jsx        # 工具箱页
│   │   ├── styles/             # 全局样式
│   │   ├── App.jsx             # 根组件
│   │   └── main.jsx            # 入口文件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # 后端服务
│   ├── routes/                 # API路由
│   │   ├── models.js           # 模型库API
│   │   └── toolbox.js          # 工具箱API
│   ├── config/                 # 配置文件
│   │   ├── database.js         # 数据库配置
│   │   └── cloudbase.js        # CloudBase连接
│   ├── server.js               # 入口文件
│   ├── .env.example            # 环境变量示例
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🔧 核心功能模块

### 1️⃣ 通用件模型库 `/model-library`
- **模型分类浏览** - 按类别快速筛选
- **搜索功能** - 支持名称、型号、标签搜索
- **模型预览** - 在线预览3D模型（支持STP/STEP格式）
- **批量操作** - 上传、下载、删除模型
- **详细信息** - 尺寸、重量、材料等参数展示

### 2️⃣ 设计百宝箱 `/toolbox`
包含四个专业工具：

| 工具 | 功能描述 |
|------|----------|
| 🔍 DFM模具初评 | 可制造性分析、工艺可行性评估 |
| 💰 BOM成本秒算 | 自动生成BOM清单、实时成本核算 |
| 📦 包装规格设计 | 智能包装方案推荐、合规性检查 |
| 📊 结构高频数据库 | 标准件库、材料参数、公差查询 |

## 🎨 设计特点

- **科技感UI** - 深色主题，霓虹光效，现代感十足
- **响应式设计** - 完美适配桌面和移动设备
- **流畅动画** - 60FPS丝滑过渡效果
- **毛玻璃效果** - backdrop-filter实现高级质感

## 📡 API 接口文档

### 模型库接口
```
GET    /api/models          获取模型列表（支持分页/搜索）
GET    /api/models/:id      获取单个模型详情
POST   /api/models/upload   上传新模型
DELETE /api/models/:id      删除模型
GET    /api/models/categories  获取所有分类
```

### 工具箱接口
```
GET  /api/toolbox                获取所有工具模块
GET  /api/toolbox/:toolId        获取单个工具详情
POST /api/toolbox/:toolId/analyze  执行工具分析
```

### 系统接口
```
GET /api/health  健康检查
```

## 🔗 CloudBase 数据库配置

1. 创建腾讯云 CloudBase 环境
2. 复制环境ID到 `server/.env` 的 `TCB_ENV_ID`
3. 配置密钥（可选，用于管理员权限）
4. 重启后端服务

详细配置说明请参考 [server/.env.example](server/.env.example)

## 🚀 生产环境部署

### 前端构建
```bash
cd client
npm run build
# 生成 dist 目录，可部署到任何静态服务器
```

### 后端部署
```bash
cd server
npm start
# 或使用 PM2 进行进程管理
pm2 start server.js --name "structural-engineer-assistant"
```

## 📝 开发计划

- [ ] 集成真实3D模型渲染器（Three.js）
- [ ] 实现完整的文件上传下载功能
- [ ] 接入CloudBase数据库存储
- [ ] 添加用户认证系统
- [ ] 实现DFM/BOM等工具的核心算法
- [ ] 接入AI能力（结构优化建议）

## 📄 License

MIT License - 自由使用和修改

---

**Made with ❤️ for Structural Engineers**
