import React, { useState, useRef, useMemo } from 'react'
import './DFMProPanel.css'

/**
 * DFM 专业引擎面板（FreeCAD 几何内核）
 * 调用后端 POST /api/dfm/pro（Express 代理 → FastAPI 微服务）
 * 与自研 v2.0 引擎并排对比，择优融合
 *
 * 依赖说明：本组件复用了 DFMPanel.css 中的共享样式（dfm-drop-zone /
 * dfm-model-loaded / btn-evaluate / spinner / empty-result-placeholder 等），
 * 因此必须由 DFMPanel 挂载渲染（DFMPanel.css 已全局加载）。
 *
 * API 返回格式：
 * {
 *   "status": "success", "material": "ABS", "engine": "freecad-dfm",
 *   "defects": [
 *     { "rule_id": "MIN_DRAFT_ANGLE", "severity": "ERROR", "overview": "...",
 *       "message": "...", "value": 0.3, "limit": 1.0, "unit": "°",
 *       "refs": [{ "type": "Face", "index": 5, "label": "Face6" }] }
 *   ],
 *   "timing_ms": 1234
 * }
 */

// 可选材料列表
const MATERIALS = [
  'Default', 'ABS', 'PC', 'PP', 'PA', 'PE', 'PS', 'PVC', 'PMMA',
  'PET/PBT', 'Acetal/POM', 'LCP', 'PUR', 'PSU', 'Long-Fiber Reinforced Plastics', 'PLA',
]

// 规则中文映射
const RULE_NAMES = {
  MIN_DRAFT_ANGLE: '拔模角度',
  MIN_WALL_THICKNESS: '最小壁厚',
  MAX_WALL_THICKNESS: '最大壁厚',
  NO_UNDERCUTS: '倒扣检测',
  SHARP_INTERNAL_CORNERS: '内部尖角',
  SHARP_EXTERNAL_CORNERS: '外部尖角',
}

// 严重度元信息（ERROR > WARNING > INFO > SUCCESS）
const SEVERITY_META = {
  ERROR:   { label: '错误', cls: 'error',   icon: '🔴' },
  WARNING: { label: '警告', cls: 'warning', icon: '🟠' },
  INFO:    { label: '提示', cls: 'info',    icon: '🔵' },
  SUCCESS: { label: '通过', cls: 'success', icon: '🟢' },
}
const SEVERITY_ORDER = { ERROR: 0, WARNING: 1, INFO: 2, SUCCESS: 3 }

function formatTiming(ms) {
  if (ms === null || ms === undefined) return '—'
  const n = Number(ms)
  if (Number.isNaN(n)) return '—'
  if (n < 1000) return `${Math.round(n)} ms`
  return `${(n / 1000).toFixed(2)} s`
}

export default function DFMProPanel({
  selfDefects = [],
  selfResult = null,
  selfTimingMs = null,
  selfFile = null,
  selfFileName = '',
  onSelfNavigate = null,
}) {
  // ==================== 状态管理 ====================
  const [proFile, setProFile] = useState(null)          // 上传的 STP/STEP 文件
  const [material, setMaterial] = useState('Default')   // 材料
  const [proResult, setProResult] = useState(null)      // 专业引擎分析结果
  const [analyzing, setAnalyzing] = useState(false)     // 分析中
  const [inputError, setInputError] = useState(null)    // 输入校验错误（文件格式/大小/未上传）
  const [serviceError, setServiceError] = useState(null) // 后端服务错误（微服务未启动等）
  const [dragOver, setDragOver] = useState(false)       // 拖拽状态
  const [viewMode, setViewMode] = useState('detail')    // 'detail' | 'compare'
  const fileInputRef = useRef(null)

  // ==================== 文件处理 ====================
  const handleProFile = (file) => {
    if (!file) return
    const upper = file.name.toUpperCase()
    if (!upper.endsWith('.STP') && !upper.endsWith('.STEP')) {
      setInputError('专业引擎仅支持 STP/STEP 格式，请选择 .stp / .step 文件')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setInputError('文件超过 50MB 限制，请上传精简模型')
      return
    }
    setProFile(file)
    setInputError(null)
    setServiceError(null)
    setProResult(null)
    setViewMode('detail')
  }

  const handleFileInput = (e) => {
    const f = e.target.files?.[0]
    if (f) handleProFile(f)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) handleProFile(f)
  }

  const useSelfFile = () => {
    if (!selfFile) return
    setProFile(selfFile)
    setInputError(null)
    setServiceError(null)
    setProResult(null)
    setViewMode('detail')
  }

  const clearProFile = () => {
    setProFile(null)
    setProResult(null)
    setInputError(null)
    setServiceError(null)
  }

  // ==================== 调用专业引擎 ====================
  const handleAnalyze = async () => {
    if (!proFile) {
      setInputError('请先上传 STP/STEP 模型')
      return
    }
    setAnalyzing(true)
    setInputError(null)
    setServiceError(null)
    setProResult(null)
    try {
      const fd = new FormData()
      fd.append('file', proFile)
      fd.append('material', material)

      const res = await fetch('/api/dfm/pro', { method: 'POST', body: fd })

      // 微服务未启动 / 代理 404 / 网关错误 → 明确提示
      if (res.status === 404 || res.status === 502 || res.status === 503) {
        setServiceError('专业引擎未启动，请先运行 FastAPI 服务')
        return
      }
      if (!res.ok) {
        let msg = `专业引擎分析失败（HTTP ${res.status}）`
        try {
          const data = await res.json()
          msg = data.message || data.error || msg
        } catch (_) { /* 忽略解析错误 */ }
        setServiceError(msg)
        return
      }

      const data = await res.json()
      if (data && data.status === 'error') {
        setServiceError(data.message || data.error || '专业引擎分析失败')
        return
      }
      if (!data || !Array.isArray(data.defects)) {
        setServiceError('专业引擎返回格式异常，请检查后端服务')
        return
      }

      setProResult(data)
      setViewMode('detail')
    } catch (err) {
      setServiceError('无法连接专业引擎服务：' + (err.message || err))
    } finally {
      setAnalyzing(false)
    }
  }

  // ==================== 派生数据 ====================
  // 缺陷按严重度排序：ERROR > WARNING > INFO > SUCCESS
  const sortedDefects = useMemo(() => {
    const list = proResult?.defects || []
    return [...list].sort((a, b) => {
      const oa = SEVERITY_ORDER[a.severity] ?? 99
      const ob = SEVERITY_ORDER[b.severity] ?? 99
      return oa - ob
    })
  }, [proResult])

  // 统计卡片数据
  const stats = useMemo(() => {
    const list = proResult?.defects || []
    return {
      total: list.length,
      error: list.filter(d => d.severity === 'ERROR').length,
      warning: list.filter(d => d.severity === 'WARNING').length,
      info: list.filter(d => d.severity === 'INFO').length,
      success: list.filter(d => d.severity === 'SUCCESS').length,
    }
  }, [proResult])

  // 自研引擎对比摘要（简化：缺陷数量 + 耗时 + 主要发现）
  const selfSummary = useMemo(() => {
    const high = selfDefects.filter(d => d.severity === 'high').length
    const med = selfDefects.filter(d => d.severity === 'medium').length
    const low = selfDefects.filter(d => d.severity === 'low' || d.severity === 'info').length
    const hasAnalysis = (selfResult && selfResult.success === true) || selfDefects.length > 0
    const main = selfDefects.slice(0, 3).map(d => d.title)
    return { total: selfDefects.length, high, med, low, main, timing: selfTimingMs, hasAnalysis }
  }, [selfDefects, selfResult, selfTimingMs])

  // 专业引擎主要发现（Top 4 规则）
  const proMain = useMemo(() => {
    return sortedDefects.slice(0, 4).map(d => ({
      rule: RULE_NAMES[d.rule_id] || d.rule_id || '未知规则',
      sev: d.severity,
    }))
  }, [sortedDefects])

  // ==================== 渲染辅助 ====================
  const ruleLabel = (ruleId) => RULE_NAMES[ruleId] || ruleId || '未知规则'
  const sevMeta = (sev) => SEVERITY_META[sev] || { label: sev || '未知', cls: 'info', icon: '❔' }

  const renderValue = (d) => {
    const hasValue = d.value !== undefined && d.value !== null
    const hasLimit = d.limit !== undefined && d.limit !== null
    if (!hasValue && !hasLimit) return null
    const unit = d.unit || ''
    return (
      <div className="dfm-pro-defect-metric">
        {hasValue && (
          <span className="dfm-pro-metric-item">
            <span className="dfm-pro-metric-label">实测</span>
            <span className="dfm-pro-metric-value">{d.value} {unit}</span>
          </span>
        )}
        {hasLimit && (
          <span className="dfm-pro-metric-item">
            <span className="dfm-pro-metric-label">限值</span>
            <span className="dfm-pro-metric-value">{d.limit} {unit}</span>
          </span>
        )}
      </div>
    )
  }

  const renderRefs = (refs) => {
    if (!Array.isArray(refs) || refs.length === 0) return null
    return (
      <div className="dfm-pro-defect-refs">
        <span className="dfm-pro-refs-label">📍 涉及面：</span>
        {refs.slice(0, 8).map((r, i) => (
          <span key={i} className="dfm-pro-ref-chip" title={`${r.type || 'Face'} #${r.index ?? ''}`}>
            {r.label || `${r.type || 'Face'}${r.index ?? ''}`}
          </span>
        ))}
        {refs.length > 8 && <span className="dfm-pro-ref-more">+{refs.length - 8}</span>}
      </div>
    )
  }

  // ==================== 渲染 ====================
  return (
    <div className="dfm-pro-panel">
      {/* ---- 左侧: 输入区 ---- */}
      <div className="dfm-pro-input-section">
        <div className="dfm-pro-group">
          <label className="dfm-group-label">
            <span className="label-icon">📁</span> 上传 STP/STEP 模型
            <span className="dfm-badge-new">专业引擎</span>
          </label>

          {!proFile ? (
            <>
              <div
                className={`dfm-drop-zone ${dragOver ? 'drag-over' : ''} ${inputError ? 'error' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="dfm-drop-icon">🧊</div>
                <p className="dfm-drop-title">拖拽 或 点击上传 STEP 模型</p>
                <span className="dfm-drop-hint">支持 STP / STEP · 最大 50MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stp,.step"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>

              {selfFile && (
                <button className="dfm-pro-reuse-btn" onClick={useSelfFile} title="复用自研引擎已导入的同一模型，无需重复上传">
                  📥 复用自研引擎模型：{selfFileName || selfFile.name}
                </button>
              )}
            </>
          ) : (
            <div className="dfm-model-loaded">
              <div className="dfm-model-header">
                <span className="dfm-model-icon">🧊</span>
                <div className="dfm-model-info">
                  <strong className="dfm-model-name">{proFile.name}</strong>
                  <span className="dfm-model-meta">{(proFile.size / 1024).toFixed(1)} KB · STEP 模型</span>
                </div>
                <button className="dfm-model-clear" onClick={clearProFile} title="移除模型">✕</button>
              </div>
            </div>
          )}

          {inputError && (
            <div className="dfm-pro-error">
              <span className="dfm-pro-error-icon">⚠️</span>
              <span>{inputError}</span>
            </div>
          )}
        </div>

        {/* 材料选择 */}
        <div className="dfm-pro-group">
          <label className="dfm-group-label">
            <span className="label-icon">🧪</span> 材料
          </label>
          <select
            className="mold-config-select dfm-pro-material-select"
            value={material}
            onChange={e => setMaterial(e.target.value)}
          >
            {MATERIALS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="dfm-pro-hint">材料参数将影响壁厚 / 拔模角度等规则限值</p>
        </div>

        {/* 操作按钮 */}
        <div className="dfm-action-buttons">
          <button
            className="btn-evaluate"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <span className="spinner"></span>
                专业引擎分析中...
              </>
            ) : (
              <>🛠️ 开始专业分析</>
            )}
          </button>
        </div>

        <div className="dfm-pro-note">
          <span>⚙️ 引擎：FreeCAD DFM Workbench</span>
          <span> · 规则：拔模角度 / 壁厚 / 倒扣 / 尖角</span>
        </div>
      </div>

      {/* ---- 右侧: 结果区 ---- */}
      <div className="dfm-pro-result-section">
        {/* 加载中 */}
        {analyzing && (
          <div className="dfm-pro-loading">
            <div className="dfm-pro-loading-spinner"></div>
            <p>正在调用 FreeCAD 引擎分析模型...</p>
            <span>上传 STEP → 几何解析 → 规则检测 → 生成缺陷报告</span>
          </div>
        )}

        {/* 空状态 */}
        {!analyzing && !proResult && !serviceError && (
          <div className="empty-result-placeholder">
            <div className="placeholder-icon">🛠️</div>
            <p>上传模型并选择材料后点击「开始专业分析」</p>
            <p className="placeholder-sub">专业引擎将调用 FreeCAD 内核进行可制造性规则检测</p>
          </div>
        )}

        {/* 错误状态（微服务未启动等） */}
        {!analyzing && serviceError && !proResult && (
          <div className="dfm-pro-error-state">
            <span className="dfm-pro-error-state-icon">⚠️</span>
            <h4>专业引擎不可用</h4>
            <p>{serviceError}</p>
            <p className="dfm-pro-error-state-sub">
              请确认：① FastAPI 微服务已启动；② Express 后端已配置 /api/dfm/pro 代理；③ 前端 Vite 代理指向 8080
            </p>
          </div>
        )}

        {/* 分析结果 */}
        {!analyzing && proResult && (
          <>
            {/* 结果工具条：材料 + 视图切换 */}
            <div className="dfm-pro-result-toolbar">
              <span className="dfm-pro-material-badge">
                🧪 材料：<strong>{proResult.material || material}</strong>
                {proResult.engine && <em className="dfm-pro-engine-tag">{proResult.engine}</em>}
              </span>
              <div className="dfm-pro-view-toggle">
                <button
                  className={`dfm-pro-view-btn ${viewMode === 'detail' ? 'active' : ''}`}
                  onClick={() => setViewMode('detail')}
                >
                  📋 分析详情
                </button>
                <button
                  className={`dfm-pro-view-btn ${viewMode === 'compare' ? 'active' : ''}`}
                  onClick={() => setViewMode('compare')}
                >
                  ⚖️ 并排对比
                </button>
              </div>
            </div>

            {/* 视图 1：分析详情 */}
            {viewMode === 'detail' && (
              <div className="dfm-pro-detail">
                {/* 统计卡片 */}
                <div className="dfm-pro-stats">
                  <div className="dfm-pro-stat-card total">
                    <span className="dfm-pro-stat-value">{stats.total}</span>
                    <span className="dfm-pro-stat-label">总缺陷</span>
                  </div>
                  <div className="dfm-pro-stat-card error">
                    <span className="dfm-pro-stat-value">{stats.error}</span>
                    <span className="dfm-pro-stat-label">ERROR 错误</span>
                  </div>
                  <div className="dfm-pro-stat-card warning">
                    <span className="dfm-pro-stat-value">{stats.warning}</span>
                    <span className="dfm-pro-stat-label">WARNING 警告</span>
                  </div>
                  <div className="dfm-pro-stat-card info">
                    <span className="dfm-pro-stat-value">{stats.info}</span>
                    <span className="dfm-pro-stat-label">INFO 提示</span>
                  </div>
                  <div className="dfm-pro-stat-card timing">
                    <span className="dfm-pro-stat-value">{formatTiming(proResult.timing_ms)}</span>
                    <span className="dfm-pro-stat-label">分析耗时</span>
                  </div>
                </div>

                {/* 缺陷清单 */}
                <h4 className="dfm-section-title">🔍 专业引擎缺陷清单（按严重度排序）</h4>
                {sortedDefects.length === 0 ? (
                  <div className="dfm-no-defects">
                    <span className="dfm-no-defects-icon">✅</span>
                    <p>未发现制造缺陷</p>
                    <span className="dfm-no-defects-sub">该模型满足所选材料的基础 DFM 规则</span>
                  </div>
                ) : (
                  <div className="dfm-pro-defect-list">
                    {sortedDefects.map((d, i) => {
                      const sm = sevMeta(d.severity)
                      return (
                        <div key={i} className={`dfm-pro-defect-card sev-${sm.cls}`}>
                          <div className="dfm-pro-defect-head">
                            <span className={`dfm-pro-sev-badge ${sm.cls}`}>{sm.icon} {sm.label}</span>
                            <strong className="dfm-pro-defect-title">{ruleLabel(d.rule_id)}</strong>
                            <span className="dfm-pro-defect-id">{d.rule_id}</span>
                          </div>
                          {d.overview && <p className="dfm-pro-defect-overview">{d.overview}</p>}
                          {renderValue(d)}
                          {d.message && <p className="dfm-pro-defect-message">{d.message}</p>}
                          {renderRefs(d.refs)}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 视图 2：与自研引擎并排对比 */}
            {viewMode === 'compare' && (
              <div className="dfm-pro-compare">
                {/* 左列：自研引擎 v2.0 */}
                <div className="dfm-pro-compare-col self">
                  <div className="dfm-pro-compare-head">
                    <span className="dfm-pro-compare-engine-icon">🧠</span>
                    <div>
                      <strong className="dfm-pro-compare-title">自研引擎 v2.0</strong>
                      <span className="dfm-pro-compare-sub">浏览器端 STP 解析 + AI 规则</span>
                    </div>
                  </div>
                  {selfSummary.hasAnalysis ? (
                    <>
                      <div className="dfm-pro-compare-stats">
                        <div className="dfm-pro-compare-stat">
                          <span className="dfm-pro-compare-stat-value">{selfSummary.total}</span>
                          <span className="dfm-pro-compare-stat-label">缺陷总数</span>
                        </div>
                        <div className="dfm-pro-compare-stat">
                          <span className="dfm-pro-compare-stat-value">{selfSummary.high}</span>
                          <span className="dfm-pro-compare-stat-label">高风险</span>
                        </div>
                        <div className="dfm-pro-compare-stat">
                          <span className="dfm-pro-compare-stat-value">{formatTiming(selfSummary.timing)}</span>
                          <span className="dfm-pro-compare-stat-label">分析耗时</span>
                        </div>
                      </div>
                      <div className="dfm-pro-compare-findings">
                        <span className="dfm-pro-compare-findings-label">主要发现：</span>
                        {selfSummary.main.length > 0 ? (
                          <ul className="dfm-pro-compare-findings-list">
                            {selfSummary.main.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        ) : (
                          <span className="dfm-pro-compare-findings-none">未识别明显缺陷</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="dfm-pro-compare-empty">
                      <p>尚未在自研引擎中完成分析</p>
                      {onSelfNavigate && (
                        <button className="dfm-pro-compare-goto" onClick={onSelfNavigate}>前往自研引擎分析 →</button>
                      )}
                    </div>
                  )}
                </div>

                {/* 右列：专业引擎 FreeCAD */}
                <div className="dfm-pro-compare-col pro">
                  <div className="dfm-pro-compare-head">
                    <span className="dfm-pro-compare-engine-icon">🛠️</span>
                    <div>
                      <strong className="dfm-pro-compare-title">专业引擎 FreeCAD</strong>
                      <span className="dfm-pro-compare-sub">FreeCAD DFM Workbench · {proResult.material || material}</span>
                    </div>
                  </div>
                  <div className="dfm-pro-compare-stats">
                    <div className="dfm-pro-compare-stat">
                      <span className="dfm-pro-compare-stat-value">{stats.total}</span>
                      <span className="dfm-pro-compare-stat-label">缺陷总数</span>
                    </div>
                    <div className="dfm-pro-compare-stat">
                      <span className="dfm-pro-compare-stat-value">{stats.error}</span>
                      <span className="dfm-pro-compare-stat-label">ERROR</span>
                    </div>
                    <div className="dfm-pro-compare-stat">
                      <span className="dfm-pro-compare-stat-value">{formatTiming(proResult.timing_ms)}</span>
                      <span className="dfm-pro-compare-stat-label">分析耗时</span>
                    </div>
                  </div>
                  <div className="dfm-pro-compare-findings">
                    <span className="dfm-pro-compare-findings-label">主要发现：</span>
                    {proMain.length > 0 ? (
                      <ul className="dfm-pro-compare-findings-list">
                        {proMain.map((m, i) => (
                          <li key={i}>
                            <span className={`dfm-pro-finding-dot ${m.sev ? m.sev.toLowerCase() : 'info'}`}></span>
                            {m.rule}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="dfm-pro-compare-findings-none">未发现缺陷</span>
                    )}
                  </div>
                </div>

                {/* 底部择优融合建议 */}
                <div className="dfm-pro-compare-footer">
                  💡 择优融合建议：以专业引擎（FreeCAD 几何内核）的定量检测为准，结合自研引擎的工艺经验判断，综合评估后再开模。
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
