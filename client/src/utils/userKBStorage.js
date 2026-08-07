/**
 * 用户经验库覆盖层 - localStorage 持久化
 *
 * 数据模型：
 *   {
 *     added:   [{...newCase}],    // 新增案例
 *     edited:  {caseId: {...patch}},  // 编辑覆盖（不影响源）
 *     deleted: [caseId, ...],     // 删除标记
 *   }
 *
 * 应用规则（mergeAllCases）：
 *   - deleted 列表的案例被排除
 *   - edited 列表覆盖原案例的对应字段
 *   - added 列表追加到末尾（自动生成新 id）
 */

const STORAGE_KEY = 'user_kb_overrides_v1'

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { added: [], edited: {}, deleted: [] }
    const parsed = JSON.parse(raw)
    return {
      added: Array.isArray(parsed.added) ? parsed.added : [],
      edited: typeof parsed.edited === 'object' && parsed.edited ? parsed.edited : {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
    }
  } catch (err) {
    console.warn('[userKBStorage] read failed:', err)
    return { added: [], edited: {}, deleted: [] }
  }
}

function write(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (err) {
    console.error('[userKBStorage] write failed:', err)
    return false
  }
}

// ---- 操作 ----

export function getOverrides() {
  return read()
}

// 新增案例（自动分配 id）
export function addCase(caseData) {
  const data = read()
  const newId = `USR${String(Date.now()).slice(-6)}`
  const now = new Date().toISOString().slice(0, 10)
  const userCase = {
    id: newId,
    ...caseData,
    isUserAdded: true,
    author: caseData.author || '当前用户',
    year: caseData.year || String(new Date().getFullYear()),
    tags: caseData.tags || [caseData.productLine, caseData.category].filter(Boolean),
    isDesignSpec: caseData.isDesignSpec || false,
  }
  data.added.unshift(userCase)
  write(data)
  return userCase
}

// 编辑案例（不改变原 case 对象，存 patch）
export function editCase(caseId, patch) {
  const data = read()
  data.edited[caseId] = { ...data.edited[caseId], ...patch, editedAt: new Date().toISOString() }
  write(data)
  return true
}

// 删除案例
export function deleteCase(caseId) {
  const data = read()
  if (!data.deleted.includes(caseId)) {
    data.deleted.push(caseId)
    write(data)
  }
  return true
}

// 恢复已删除
export function restoreCase(caseId) {
  const data = read()
  data.deleted = data.deleted.filter(id => id !== caseId)
  write(data)
  return true
}

// 重置所有覆盖（清空 localStorage）
export function resetAll() {
  localStorage.removeItem(STORAGE_KEY)
  return true
}

// ---- 合并数据 ----

/**
 * 把源案例 + 用户覆盖合并为最终列表
 * @param {Array} sourceCases  原始 PROBLEM_CASES
 * @returns {Array} 合并后案例列表
 */
export function mergeAllCases(sourceCases) {
  const data = read()
  const deletedSet = new Set(data.deleted)

  // 1. 处理原案例：排除已删除的，应用编辑覆盖
  const mergedSource = sourceCases
    .filter(c => !deletedSet.has(c.id))
    .map(c => data.edited[c.id] ? { ...c, ...data.edited[c.id] } : c)

  // 2. 追加用户新增
  const addedIds = new Set(data.added.map(c => c.id))
  const newAdded = data.added.filter(c => !deletedSet.has(c.id))

  return [...mergedSource, ...newAdded]
}

// ---- 统计 ----

export function getOverrideStats() {
  const data = read()
  return {
    added: data.added.length,
    edited: Object.keys(data.edited).length,
    deleted: data.deleted.length,
  }
}