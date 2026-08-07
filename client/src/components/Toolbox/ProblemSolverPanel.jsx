import React, { useState, useRef, useEffect } from 'react'
import PROBLEM_CASES from '../../data/problemSolverData'
import { searchProblemCases, getCategoryCount, QUICK_SUGGESTIONS } from '../../utils/problemSearch'
import { mergeAllCases, addCase, editCase, deleteCase, restoreCase, getOverrideStats } from '../../utils/userKBStorage'
import { toast } from '../../utils/toast'
import './ProblemSolverPanel.css'

function ProblemSolverPanel({ onClose, canEdit = false }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [loading, setLoading] = useState(false)
  const [kbVersion, setKbVersion] = useState(0)   // 触发列表刷新
  const inputRef = useRef(null)

  // 合并源 + 用户编辑/新增/删除
  const allCases = mergeAllCases(PROBLEM_CASES)
  const categoryCount = getCategoryCount(allCases)
  const overrideStats = getOverrideStats()

  // 检索（使用合并后的知识库 + 模拟异步延迟）
  const handleSearch = (q) => {
    const target = (q ?? query).trim()
    if (!target) return
    setLoading(true)
    setSearched(true)
    setQuery(target)
    setTimeout(() => {
      const res = searchProblemCases(target, allCases, 5)
      setResults(res)
      setSelectedCase(res.length > 0 ? res[0].case.id : null)
      setLoading(false)
    }, 450)
  }

  // ====== 添加 / 编辑 / 删除 ======
  const [editForm, setEditForm] = useState(null)   // null | { mode: 'add'|'edit', case: {...} }
  const openAddForm = () => setEditForm({ mode: 'add', case: {
    title: '', category: '', subCategory: '', productLine: '净水',
    year: String(new Date().getFullYear()), author: '', isDesignSpec: false,
    keywords: '', problem: '', cause: '', solution: '', prevention: ''
  }})
  const openEditForm = (c) => setEditForm({ mode: 'edit', case: {
    id: c.id, title: c.title || '', category: c.category || '', subCategory: c.subCategory || '',
    productLine: c.productLine || '', year: c.year || '', author: c.author || '',
    isDesignSpec: !!c.isDesignSpec,
    keywords: (c.keywords || []).join(', '),
    problem: c.problem || '', cause: c.cause || '', solution: c.solution || '', prevention: c.prevention || ''
  }})
  const closeEditForm = () => setEditForm(null)

  const submitEditForm = () => {
    const f = editForm.case
    if (!f.title || !f.category || !f.problem) {
      toast.error('标题、分类、问题描述为必填项')
      return
    }
    const data = {
      title: f.title.trim(),
      category: f.category.trim(),
      subCategory: f.subCategory.trim(),
      productLine: f.productLine.trim(),
      year: f.year.trim(),
      author: f.author.trim(),
      isDesignSpec: !!f.isDesignSpec,
      keywords: f.keywords.split(/[,,、\s]+/).map(s => s.trim()).filter(Boolean),
      problem: f.problem.trim(),
      cause: f.cause.trim() || '未记录',
      solution: f.solution.trim() || '未记录',
      prevention: f.prevention.trim() || '未沉淀规范',
      tags: [f.productLine.trim(), f.category.trim()].filter(Boolean),
    }
    if (editForm.mode === 'add') {
      const newCase = addCase(data)
      toast.success(`已添加「${newCase.title}」`)
    } else {
      editCase(f.id, data)
      toast.success(`已更新「${f.title}」`)
    }
    closeEditForm()
    setKbVersion(v => v + 1)
    // 如果当前有搜索结果，自动重跑检索
    if (searched && query) {
      handleSearch(query)
    }
  }

  const handleDelete = (c) => {
    if (!window.confirm(`确定删除「${c.title}」吗？此操作可通过"恢复"撤销。`)) return
    deleteCase(c.id)
    toast.success(`已删除「${c.title}」`)
    setKbVersion(v => v + 1)
    if (searched && query) handleSearch(query)
  }

  const handleRestore = (c) => {
    restoreCase(c.id)
    toast.success(`已恢复「${c.title}」`)
    setKbVersion(v => v + 1)
    if (searched && query) handleSearch(query)
  }

  // Enter 快捷键
  const onKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="ps-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ps-container">
        {/* ===== 头部 ===== */}
        <div className="ps-header">
          <div className="ps-header-left">
            <span className="ps-header-icon">🧩</span>
            <div>
              <h2 className="ps-title">开发问题解决助手</h2>
              <p className="ps-subtitle">基于 RAG 知识库 · 历史经验自动检索</p>
            </div>
          </div>
          <div className="ps-header-actions">
            {canEdit && (
              <button className="ps-add-btn" onClick={openAddForm} title="添加新经验">
                + 添加经验
              </button>
            )}
            <button className="ps-close-btn" onClick={onClose} title="关闭">×</button>
          </div>
        </div>

        {/* ===== 搜索区 ===== */}
        <div className="ps-search-area">
          <div className="ps-search-box">
            <span className="ps-search-icon">🔎</span>
            <input
              ref={inputRef}
              className="ps-search-input"
              placeholder="描述你当前遇到的技术问题，如：净水机滤芯接口漏水"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
            {query && (
              <button className="ps-search-clear" onClick={() => { setQuery(''); setResults([]); setSearched(false) }} title="清空">×</button>
            )}
            <button className="ps-search-btn" onClick={() => handleSearch()} disabled={loading}>
              {loading ? '检索中...' : '检索解决方案'}
            </button>
          </div>

          {/* 快速建议 */}
          <div className="ps-suggest-row">
            <span className="ps-suggest-label">常见问题：</span>
            {QUICK_SUGGESTIONS.map(s => (
              <button key={s} className="ps-suggest-tag" onClick={() => handleSearch(s)}>{s}</button>
            ))}
          </div>
        </div>

        {/* ===== 主体：左侧知识库概览 + 右侧检索结果 ===== */}
        <div className="ps-body">
          {/* 左侧：知识库信息 */}
          <div className="ps-sidebar">
            <div className="ps-kb-card">
              <h4 className="ps-kb-title">📚 历史经验库</h4>
              <div className="ps-kb-stat">
                <div className="ps-kb-num">{allCases.length}</div>
                <div className="ps-kb-label">经验案例</div>
              </div>
              <div className="ps-kb-src-hint">
                <span className="ps-kb-src-tag">内置精选 {allCases.filter(c => c.id.startsWith('C')).length}</span>
                <span className="ps-kb-src-tag">三年沉淀 {allCases.filter(c => c.id.startsWith('KB')).length}</span>
                {overrideStats.added > 0 && (
                  <span className="ps-kb-src-tag user-added">用户新增 {overrideStats.added}</span>
                )}
              </div>
              {canEdit && (
                <button className="ps-kb-add-btn" onClick={openAddForm}>
                  + 添加新经验
                </button>
              )}
              <div className="ps-kb-cats">
                {Object.entries(categoryCount).slice(0, 8).map(([cat, n]) => (
                  <div key={cat} className="ps-kb-cat-row">
                    <span className="ps-kb-cat-name">{cat}</span>
                    <span className="ps-kb-cat-count">{n}</span>
                  </div>
                ))}
                {Object.keys(categoryCount).length > 8 && (
                  <div className="ps-kb-more">+ 其他 {Object.keys(categoryCount).length - 8} 类</div>
                )}
              </div>
            </div>
            <div className="ps-kb-hint">
              <div className="ps-kb-hint-title">💡 使用提示</div>
              <ul>
                <li>输入越具体，匹配越精准</li>
                <li>描述关键症状（漏水/异响/缩水）</li>
                <li>可组合关键词：材质+现象</li>
                {canEdit && <li><strong>💡 你是管理员</strong>，可添加/编辑/删除经验</li>}
              </ul>
            </div>
          </div>

          {/* 右侧：结果区 */}
          <div className="ps-results">
            {!searched && (
              <div className="ps-empty-state">
                <div className="ps-empty-icon">🧠</div>
                <p className="ps-empty-title">输入问题，智能检索历史经验</p>
                <p className="ps-empty-sub">在左侧输入框描述你遇到的问题，系统将自动在历史经验库中检索相似案例，输出解决方案</p>
                <div className="ps-empty-demo">
                  <span className="ps-empty-demo-label">试试这些示例：</span>
                  {['滤芯接口漏水怎么办', '外壳卡扣一摔就断', '超声波焊接水箱漏水', '噪音太大怎么解决'].map(s => (
                    <button key={s} className="ps-demo-btn" onClick={() => handleSearch(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {searched && loading && (
              <div className="ps-loading-state">
                <div className="ps-loading-spinner" />
                <p>正在知识库中检索相似案例...</p>
              </div>
            )}

            {searched && !loading && results.length === 0 && (
              <div className="ps-no-result">
                <div className="ps-empty-icon">🔍</div>
                <p className="ps-no-result-title">未找到相似案例</p>
                <p className="ps-no-result-sub">尝试更换关键词，或使用以下建议：</p>
                <div className="ps-no-result-suggest">
                  {QUICK_SUGGESTIONS.map(s => (
                    <button key={s} className="ps-suggest-tag" onClick={() => handleSearch(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {searched && !loading && results.length > 0 && (
              <div className="ps-results-list">
                <div className="ps-results-head">
                  <span>找到 <strong className="ps-results-count">{results.length}</strong> 个相似案例</span>
                  <span className="ps-results-query">「{query}」</span>
                </div>
                {results.map(({ case: c, score, matchedKeywords }, i) => {
                  const isOpen = selectedCase === c.id
                  const isUser = c.id.startsWith('USR')
                  return (
                    <div key={c.id} className={`ps-case-card ${isOpen ? 'open' : ''} ${isUser ? 'user-case' : ''}`}>
                      <div className="ps-case-head" onClick={() => setSelectedCase(isOpen ? null : c.id)}>
                        <div className="ps-case-left">
                          <span className="ps-case-rank">{i + 1}</span>
                          <div>
                            <div className="ps-case-title">
                              {c.title}
                              <span className="ps-case-cat" style={getCatStyle(c.category)}>{c.category}</span>
                              {c.productLine && <span className="ps-case-line">{c.productLine}</span>}
                              {c.isDesignSpec && <span className="ps-case-spec">📐 设计规范</span>}
                              {isUser && <span className="ps-case-user">✚ 用户新增</span>}
                            </div>
                            <div className="ps-case-match-row">
                              <div className="ps-match-bar">
                                <div className="ps-match-fill" style={{ width: `${Math.min(100, Math.round(score * 100))}%` }} />
                              </div>
                              <span className="ps-match-pct">{Math.round(score * 100)}% 匹配</span>
                              {matchedKeywords.length > 0 && (
                                <span className="ps-matched-kws">命中: {matchedKeywords.slice(0, 3).map(k => `#${k}`).join(' ')}</span>
                              )}
                            </div>
                            {canEdit && (
                              <div className="ps-case-admin-actions" onClick={e => e.stopPropagation()}>
                                {isUser && c.id && <button className="ps-mini-btn ghost" onClick={() => handleRestore(c.id)} title="恢复已删除（撤销）">↺ 恢复</button>}
                                <button className="ps-mini-btn" onClick={() => openEditForm(c)} title="编辑案例">✎ 编辑</button>
                                <button className="ps-mini-btn danger" onClick={() => handleDelete(c)} title="删除案例">🗑 删除</button>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`ps-case-toggle ${isOpen ? 'open' : ''}`}>{isOpen ? '▾' : '▸'}</span>
                      </div>

                      {isOpen && (
                        <div className="ps-case-detail">
                          {(c.year || c.author) && (
                            <div className="ps-detail-meta">
                              {c.year && <span className="ps-meta-item">📅 {c.year} 年</span>}
                              {c.author && <span className="ps-meta-item">👤 {c.author}</span>}
                              {c.subCategory && <span className="ps-meta-item">🏷️ {c.subCategory}</span>}
                              {c.productLine && <span className="ps-meta-item">🧊 {c.productLine}</span>}
                            </div>
                          )}
                          <div className="ps-detail-block">
                            <div className="ps-detail-label">📌 问题描述</div>
                            <p className="ps-detail-text">{c.problem}</p>
                          </div>
                          <div className="ps-detail-block">
                            <div className="ps-detail-label">🔍 根因分析</div>
                            <ul className="ps-detail-list">
                              {c.cause.split(/[；\n]/).filter(s => s.trim()).map((s, idx) => <li key={idx}>{s.trim()}</li>)}
                            </ul>
                          </div>
                          <div className="ps-detail-block">
                            <div className="ps-detail-label">💡 解决方案</div>
                            <ul className="ps-detail-list solution">
                              {c.solution.split(/[；\n]/).filter(s => s.trim()).map((s, idx) => <li key={idx}>{s.trim()}</li>)}
                            </ul>
                          </div>
                          <div className="ps-detail-block">
                            <div className="ps-detail-label">🛡️ 预防建议</div>
                            <ul className="ps-detail-list prevention-list">
                              {c.prevention.split(/[；\n]/).filter(s => s.trim()).map((s, idx) => <li key={idx}>{s.trim()}</li>)}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="ps-footer">
          <span>
            📚 经验库已收录 <strong>{allCases.length}</strong> 个案例
            {overrideStats.added > 0 && <> · ✚ 用户新增 <strong>{overrideStats.added}</strong></>}
            {overrideStats.edited > 0 && <> · ✎ 编辑 <strong>{overrideStats.edited}</strong></>}
            {overrideStats.deleted > 0 && <> · 🗑 删除 <strong>{overrideStats.deleted}</strong></>}
          </span>
        </div>
      </div>

      {/* ====== 添加/编辑案例 表单弹窗 ====== */}
      {editForm && (
        <div className="ps-modal-overlay" onClick={closeEditForm}>
          <div className="ps-modal" onClick={e => e.stopPropagation()}>
            <div className="ps-modal-header">
              <h3>{editForm.mode === 'add' ? '✚ 添加新经验' : '✎ 编辑经验'}</h3>
              <button className="ps-close-btn small" onClick={closeEditForm}>✕</button>
            </div>
            <div className="ps-modal-body">
              <div className="ps-form-row">
                <label>标题 *</label>
                <input type="text" value={editForm.case.title}
                  onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, title: e.target.value } })}
                  placeholder="例：2024年净水机过滤水箱密封不良" />
              </div>
              <div className="ps-form-grid">
                <div className="ps-form-row">
                  <label>模块大类 *</label>
                  <input type="text" value={editForm.case.category}
                    onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, category: e.target.value } })}
                    placeholder="例：漏水/装配/可靠性" list="cat-options" />
                  <datalist id="cat-options">
                    {Object.keys(categoryCount).map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="ps-form-row">
                  <label>模块小类</label>
                  <input type="text" value={editForm.case.subCategory}
                    onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, subCategory: e.target.value } })}
                    placeholder="例：水箱/水路板" />
                </div>
                <div className="ps-form-row">
                  <label>产品线</label>
                  <select value={editForm.case.productLine}
                    onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, productLine: e.target.value } })}>
                    <option value="净水">净水</option>
                    <option value="饮水">饮水</option>
                    <option value="净饮">净饮</option>
                    <option value="">（不指定）</option>
                  </select>
                </div>
                <div className="ps-form-row">
                  <label>年份</label>
                  <input type="text" value={editForm.case.year}
                    onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, year: e.target.value } })}
                    placeholder="2026" />
                </div>
              </div>
              <div className="ps-form-row">
                <label>关键词 <span className="ps-hint-text">（逗号/顿号分隔）</span></label>
                <input type="text" value={editForm.case.keywords}
                  onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, keywords: e.target.value } })}
                  placeholder="例：漏水,水箱,密封" />
              </div>
              <div className="ps-form-row">
                <label>问题描述 *</label>
                <textarea value={editForm.case.problem} rows={3}
                  onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, problem: e.target.value } })}
                  placeholder="现象/异常描述" />
              </div>
              <div className="ps-form-row">
                <label>根因分析</label>
                <textarea value={editForm.case.cause} rows={3}
                  onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, cause: e.target.value } })}
                  placeholder="原因分析（可多条用；分隔）" />
              </div>
              <div className="ps-form-row">
                <label>解决方案</label>
                <textarea value={editForm.case.solution} rows={4}
                  onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, solution: e.target.value } })}
                  placeholder="解决方法（可多条用；分隔）" />
              </div>
              <div className="ps-form-row">
                <label>预防建议 / 沉淀规范</label>
                <textarea value={editForm.case.prevention} rows={2}
                  onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, prevention: e.target.value } })}
                  placeholder="今后如何预防/沉淀为设计规范" />
              </div>
              <div className="ps-form-row inline">
                <label>
                  <input type="checkbox" checked={editForm.case.isDesignSpec}
                    onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, isDesignSpec: e.target.checked } })} />
                  <span>沉淀为设计规范</span>
                </label>
                <span className="ps-author-input">
                  <label>提出人</label>
                  <input type="text" value={editForm.case.author} style={{ width: 140 }}
                    onChange={e => setEditForm({ ...editForm, case: { ...editForm.case, author: e.target.value } })}
                    placeholder="姓名" />
                </span>
              </div>
            </div>
            <div className="ps-modal-actions">
              <button onClick={closeEditForm}>取消</button>
              <button className="primary" onClick={submitEditForm}>
                {editForm.mode === 'add' ? '✚ 添加经验' : '💾 保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 分类颜色
function getCatStyle(cat) {
  const map = {
    '结构设计': { background: 'rgba(0,212,255,0.15)', color: '#67e8f9' },
    '模具':     { background: 'rgba(245,158,11,0.15)', color: '#fcd34d' },
    '材料':     { background: 'rgba(168,85,247,0.15)', color: '#d8b4fe' },
    '工艺':     { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
    '测试':     { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' },
    '电子':     { background: 'rgba(59,130,246,0.15)', color: '#93c5fd' },
    '成本':     { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    '认证':     { background: 'rgba(34,197,94,0.15)', color: '#86efac' },
  }
  return map[cat] || { background: 'rgba(148,163,184,0.15)', color: '#cbd5e1' }
}

export default ProblemSolverPanel