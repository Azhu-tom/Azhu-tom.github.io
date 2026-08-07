/**
 * STP Model API - 3D模型文件服务 (ES Module版本)
 *
 * 提供以下功能：
 * 1. GET /api/models/stp-files - 获取所有STP文件列表
 * 2. GET /api/models/convert/:filename - 将STP转换为GLB并返回
 * 3. GET /api/models/glb/:filename - 获取已缓存的GLB文件
 * 4. POST /api/models/batch-convert - 批量转换多个STP文件
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// 配置
const STP_BASE_DIR = path.resolve(__dirname, '../../../通用件模型库资料/图纸');
const GLB_CACHE_DIR = path.join(__dirname, '../cache/glbs');
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const CONVERTER_SCRIPT = path.join(__dirname, 'stp_to_glb_converter.py');

console.log('📁 STP基础目录:', STP_BASE_DIR);
console.log('📦 GLB缓存目录:', GLB_CACHE_DIR);

// 确保缓存目录存在
if (!fs.existsSync(GLB_CACHE_DIR)) {
  fs.mkdirSync(GLB_CACHE_DIR, { recursive: true });
}

/**
 * 递归查找目录下的所有STP文件
 */
function findStpFiles(dir) {
  const results = [];

  function walk(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);

      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          walk(filePath); // 递归子目录
        } else {
          // 检查是否是STP或STEP文件
          const ext = path.extname(file).toLowerCase();
          if (ext === '.stp' || ext === '.step') {
            results.push({
              filename: file,
              relativePath: path.relative(STP_BASE_DIR, filePath),
              absolutePath: filePath,
              size: stat.size,
              modifiedTime: stat.mtime,
              category: path.basename(path.dirname(filePath)), // 使用父文件夹名作为分类
            });
          }
        }
      }
    } catch (err) {
      console.error(`无法读取目录: ${currentDir}`, err);
    }
  }

  walk(dir);
  return results;
}

/**
 * GET /api/models/stp-files
 * 获取所有STP文件列表（带分页和筛选）
 */
router.get('/stp-files', (req, res) => {
  try {
    const { category, page = 1, limit = 50, search } = req.query;

    console.log(`📋 获取STP文件列表: category=${category}, page=${page}, limit=${limit}`);

    let stpFiles = findStpFiles(STP_BASE_DIR);
    console.log(`✅ 找到 ${stpFiles.length} 个STP文件`);

    // 按分类筛选
    if (category && category !== 'all') {
      stpFiles = stpFiles.filter(f =>
        f.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // 按关键词搜索
    if (search) {
      const searchLower = search.toLowerCase();
      stpFiles = stpFiles.filter(f =>
        f.filename.toLowerCase().includes(searchLower)
      );
    }

    // 按修改时间排序（最新的在前）
    stpFiles.sort((a, b) => b.modifiedTime - a.modifiedTime);

    // 分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = stpFiles.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        total: stpFiles.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(stpFiles.length / parseInt(limit)),
        files: paginatedFiles.map(f => ({
          filename: f.filename,
          category: f.category,
          size: f.size,
          sizeFormatted: formatFileSize(f.size),
          modifiedTime: f.modifiedTime.toISOString(),
          hasGlbCache: fs.existsSync(
            path.join(GLB_CACHE_DIR, `${path.parse(f.filename).name}.glb`)
          ),
        })),
      },
    });
  } catch (error) {
    console.error('获取STP文件列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取文件列表失败',
      message: error.message,
    });
  }
});

/**
 * GET /api/models/categories
 * 获取所有分类（基于文件夹结构）
 */
router.get('/categories', (req, res) => {
  try {
    const categories = [];

    function collectCategories(dir) {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
          if (item.isDirectory()) {
            const itemPath = path.join(dir, item.name);
            const files = fs.readdirSync(itemPath).filter(f =>
              f.endsWith('.stp') || f.endsWith('.step')
            );

            if (files.length > 0) {
              categories.push({
                name: item.name,
                count: files.length,
                path: path.relative(STP_BASE_DIR, itemPath),
              });
            }

            collectCategories(itemPath); // 递归子目录
          }
        }
      } catch (err) {
        console.error(`读取分类失败: ${dir}`, err);
      }
    }

    collectCategories(STP_BASE_DIR);

    res.json({
      success: true,
      data: categories.sort((a, b) => b.count - a.count), // 按数量降序
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取分类失败',
      message: error.message,
    });
  }
});

/**
 * POST /api/models/convert
 * 转换单个STP文件为GLB格式
 */
router.post('/convert', async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: '缺少参数: filename',
      });
    }

    // 安全检查：防止路径遍历攻击
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) {
      return res.status(400).json({
        success: false,
        error: '无效的文件名',
      });
    }

    // 查找文件
    const stpFiles = findStpFiles(STP_BASE_DIR);
    const targetFile = stpFiles.find(f => f.filename === safeFilename);

    if (!targetFile) {
      return res.status(404).json({
        success: false,
        error: `未找到文件: ${safeFilename}`,
      });
    }

    const glbFilename = `${path.parse(safeFilename).name}.glb`;
    const glbOutputPath = path.join(GLB_CACHE_DIR, glbFilename);

    // 如果缓存已存在且较新，直接返回
    if (fs.existsSync(glbOutputPath)) {
      const glbStat = fs.statSync(glbOutputPath);
      const stpStat = fs.statSync(targetFile.absolutePath);

      if (glbStat.mtime > stpStat.mtime) {
        return res.json({
          success: true,
          data: {
            message: '使用缓存的GLB文件',
            glbUrl: `/cache/glbs/${glbFilename}`,
            cached: true,
          },
        });
      }
    }

    // 执行Python转换脚本
    console.log(`开始转换: ${safeFilename}`);

    const pythonProcess = spawn(PYTHON_PATH, [
      CONVERTER_SCRIPT,
      '--input', targetFile.absolutePath,
      '--output', glbOutputPath,
    ], {
      cwd: path.dirname(CONVERTER_SCRIPT),
      timeout: 60000, // 60秒超时
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python进程退出码: ${code}, stderr: ${stderr}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });
    });

    // 验证输出文件
    if (!fs.existsSync(glbOutputPath)) {
      throw new Error('转换失败：输出文件未生成');
    }

    const glbSize = fs.statSync(glbOutputPath).size;

    res.json({
      success: true,
      data: {
        message: '转换成功',
        glbUrl: `/cache/glbs/${glbFilename}`,
        sizeBytes: glbSize,
        sizeFormatted: formatFileSize(glbSize),
        cached: false,
        log: stdout.trim(),
      },
    });
  } catch (error) {
    console.error('STP转换失败:', error);
    res.status(500).json({
      success: false,
      error: '转换失败',
      message: error.message,
    });
  }
});

/**
 * GET /api/models/glb/:filename
 * 提供已缓存的GLB文件下载
 */
router.get('/glb/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // 安全检查
    const safeFilename = path.basename(filename);
    if (!safeFilename.endsWith('.glb')) {
      return res.status(400).json({
        success: false,
        error: '仅支持GLB格式文件',
      });
    }

    const filePath = path.join(GLB_CACHE_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'GLB文件不存在，请先调用转换接口',
      });
    }

    const stat = fs.statSync(filePath);

    // 设置响应头
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存1小时

    // 流式传输文件
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    readStream.on('error', (err) => {
      console.error('读取GLB文件失败:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: '读取文件失败',
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: error.message,
    });
  }
});

/**
 * GET /api/models/download-stp/:category?/:filename
 * 提供原始STP文件下载
 */
router.get('/download-stp/:category/:filename(*)', (req, res) => {
  try {
    const { category, filename } = req.params;

    // 构造安全路径
    const safeCategory = path.basename(category);
    const safeFilename = path.basename(filename);

    const filePath = path.join(STP_BASE_DIR, safeCategory, safeFilename);

    // 安全验证
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(STP_BASE_DIR)) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该路径',
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在',
      });
    }

    const stat = fs.statSync(filePath);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    res.setHeader('Content-Length', stat.size);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '下载失败',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/models/cache/clear
 * 清除所有GLB缓存
 */
router.delete('/cache/clear', (req, res) => {
  try {
    const files = fs.readdirSync(GLB_CACHE_DIR);
    let deletedCount = 0;

    for (const file of files) {
      if (file.endsWith('.glb')) {
        fs.unlinkSync(path.join(GLB_CACHE_DIR, file));
        deletedCount++;
      }
    }

    res.json({
      success: true,
      data: {
        message: `已清除 ${deletedCount} 个缓存文件`,
        deletedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '清除缓存失败',
      message: error.message,
    });
  }
});

/**
 * GET /api/models/stats
 * 获取模型库统计信息
 */
router.get('/stats', (req, res) => {
  try {
    const stpFiles = findStpFiles(STP_BASE_DIR);
    const glbFiles = fs.readdirSync(GLB_CACHE_DIR).filter(f => f.endsWith('.glb'));

    const categoryStats = {};
    for (const file of stpFiles) {
      if (!categoryStats[file.category]) {
        categoryStats[file.category] = { count: 0, totalSize: 0 };
      }
      categoryStats[file.category].count++;
      categoryStats[file.category].totalSize += file.size;
    }

    const totalSize = stpFiles.reduce((sum, f) => sum + f.size, 0);
    const glbTotalSize = glbFiles.reduce((sum, f) => {
      try {
        return sum + fs.statSync(path.join(GLB_CACHE_DIR, f)).size;
      } catch {
        return sum;
      }
    }, 0);

    res.json({
      success: true,
      data: {
        totalStpFiles: stpFiles.length,
        totalGlbCached: glbFiles.length,
        totalStpSizeBytes: totalSize,
        totalGlbSizeBytes: glbTotalSize,
        totalStpSizeFormatted: formatFileSize(totalSize),
        totalGlbSizeFormatted: formatFileSize(glbTotalSize),
        cacheRate: ((glbFiles.length / stpFiles.length) * 100).toFixed(1) + '%',
        categories: Object.entries(categoryStats).map(([name, stats]) => ({
          name,
          count: stats.count,
          sizeFormatted: formatFileSize(stats.totalSize),
        })).sort((a, b) => b.count - a.count),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取统计信息失败',
      message: error.message,
    });
  }
});

/**
 * 辅助函数：格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
