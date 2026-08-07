/**
 * STP Model Service - 真实STP文件数据服务
 *
 * 从后端API获取真实的STP文件信息，并与本地Mock数据合并
 */

const API_BASE = 'http://localhost:8080/api/models';

/**
 * 获取所有STP文件列表
 */
export async function fetchStpFiles(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE}/stp-files${queryString ? `?${queryString}` : ''}`;

    console.log('📡 正在获取STP文件列表:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '获取失败');
    }

    console.log(`✅ 获取到 ${result.data.total} 个STP文件`);

    return result.data;
  } catch (error) {
    console.error('❌ 获取STP文件列表失败:', error);
    throw error;
  }
}

/**
 * 获取分类统计（基于文件夹）
 */
export async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE}/categories`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '获取失败');
    }

    return result.data;
  } catch (error) {
    console.error('❌ 获取分类失败:', error);
    throw error;
  }
}

/**
 * 获取模型库统计信息
 */
export async function fetchStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '获取失败');
    }

    return result.data;
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error);
    throw error;
  }
}

/**
 * 请求转换STP为GLB格式
 */
export async function convertStpToGlb(filename) {
  try {
    const response = await fetch(`${API_BASE}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '转换失败');
    }

    return result.data;
  } catch (error) {
    console.error('❌ STP转GLB失败:', error);
    throw error;
  }
}

/**
 * 获取GLB文件的URL（用于3D查看器）
 */
export function getGlbUrl(filename) {
  // 将.stp扩展名改为.glb
  const baseName = filename.replace(/\.(stp|step)$/i, '');
  return `http://localhost:8080/cache/glbs/${baseName}.glb`;
}

/**
 * 获取原始STP文件的下载链接
 */
export function getStpDownloadUrl(category, filename) {
  return `${API_BASE}/download-stp/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;
}

/**
 * 将STP文件数据转换为前端ModelList组件可用的格式
 */
export function transformStpToModelData(stpFile) {
  // 从文件名提取物料编码（假设文件名就是编码，如 23603105030.stp）
  const code = stpFile.filename.replace(/\.(stp|step)$/i, '');

  // 根据分类和文件名推测一些基本信息
  const categoryMap = {
    '增压泵': { name: '增压泵组件', material: 'PP/POM', subcategory: '泵体' },
    '滤芯': { name: '滤芯组件', material: 'PP/活性炭', subcategory: '过滤' },
    '电磁阀': { name: '电磁阀', material: 'POM/铜', subcategory: '阀门' },
    '管接件': { name: '管接件', material: 'POM/PP', subcategory: '接头' },
    '螺钉': { name: '紧固螺钉', material: '不锈钢/PE', subcategory: '紧固件' },
    '适配器': { name: '适配器', material: 'ABS/POM', subcategory: '连接件' },
  };

  const categoryInfo = categoryMap[stpFile.category] || {
    name: stpFile.category,
    material: '未知',
    subcategory: '其他'
  };

  return {
    id: code,  // 使用编码作为ID
    code: code,  // 物料编码
    name: categoryInfo.name,  // 名称基于分类
    category: stpFile.category,  // 分类来自文件夹名
    subcategory: categoryInfo.subcategory,  // 子分类
    material: categoryInfo.material,  // 材质（推测）
    specification: `${code} - ${stpFile.category}组件`,  // 规格
    color: '根据材质',  // 颜色标记
    features: ['有3D图纸'],  // 特性标签
    supplier: '标准配件库',  // 供应商
    drawingFile: stpFile.filename,  // 原始STP文件名
    has3DModel: true,  // 有3D模型（真实STP文件）
    size: stpFile.sizeFormatted,  // 文件大小
    sizeBytes: stpFile.size,  // 字节数
    uploadDate: new Date(stpFile.modifiedTime).toLocaleDateString('zh-CN'),  // 上传日期
    glbUrl: getGlbUrl(stpFile.filename),  // GLB缓存URL（可能还不存在）
    hasGlbCache: stpFile.hasGlbCache,  // 是否已有GLB缓存
    downloadUrl: getStpDownloadUrl(stpFile.category, stpFile.filename),  // STP下载地址
    remark: '',  // 备注
  };
}

/**
 * 合并Mock数据和真实STP数据
 *
 * @param {Array} mockData - 本地Mock数据（来自modelData.js）
 * @param {Array} stpData - 来自API的真实STP文件列表
 * @param {boolean} preferRealData - 是否优先使用真实数据
 * @returns {Array} 合并后的数据集
 */
export async function mergeModelData(mockData, preferRealData = true) {
  if (preferRealData) {
    try {
      // 尝试从API获取真实数据
      const stpFiles = await fetchStpFiles({ limit: 100 });

      // 将STP数据转换为模型格式
      const realModels = stpFiles.files.map(transformStpToModelData);

      console.log(`🔄 数据合并完成: ${realModels.length} 个真实模型`);

      // 返回真实数据（如果有的话），否则返回mock数据
      return realModels.length > 0 ? realModels : mockData;
    } catch (error) {
      console.warn('⚠️ 无法获取真实数据，使用Mock数据:', error.message);
      return mockData;
    }
  }

  // 不优先使用真实数据时，直接返回mock数据
  return mockData;
}
