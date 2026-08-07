import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 部署配置：base 路径必须等于仓库名
// 例如仓库名是 structural-engineer-ai，则 base = '/structural-engineer-ai/'
// 自定义域名时改为 '/'
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
