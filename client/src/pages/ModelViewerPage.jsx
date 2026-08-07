/**
 * ModelViewerPage - 独立3D模型查看器页面
 *
 * 路由: /model-library/viewer/:id
 * 设计:
 *   - 优先使用 OCCT CAD 内核渲染真实 STP 模型（occt-import-js + Three.js）
 *   - OCCT 不可用时降级到 SafeViewer3D（react-three/fiber）
 *   - 完全独立于主列表页，即使3D崩溃也不影响其他功能
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import modelData from '../data/modelData'
import OCCTViewer from '../components/ModelLibrary/OCCTViewer'

// 延迟加载3D组件作为降级方案
const Viewer3D = React.lazy(() => import('../components/ModelLibrary/SafeViewer3D').catch(() => ({
  default: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', background: '#0c1225', color: '#94a3b8',
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{ fontSize: '48px' }}>⚠️</div>
      <p>3D引擎加载失败</p>
      <p style={{ fontSize: '12px', opacity: 0.6 }}>请检查浏览器兼容性</p>
    </div>
  )
})))

function ModelViewerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [model, setModel] = useState(null)
  const [viewerError, setViewerError] = useState(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [useOCCT, setUseOCCT] = useState(true)   // OCCT 引擎切换
  const [occtFailed, setOcctFailed] = useState(false)  // OCCT 失败标记

  // 查找模型数据
  useEffect(() => {
    const found = modelData.find(m => m.id === id) || modelData.find(m => m.code === id)
    setModel(found || null)
  }, [id])

  if (!model) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', minHeight: '100vh' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>📭</p>
        <h2 style={{ color: '#1e293b', marginBottom: '12px' }}>未找到模型</h2>
        <p>ID: {id}</p>
        <Link to="/model-library" style={{
          display: 'inline-block', marginTop: '20px', padding: '10px 24px',
          background: '#2563eb', color: '#fff', borderRadius: '6px',
          textDecoration: 'none', fontWeight: 600,
        }}>返回模型库</Link>
      </div>
    )
  }

  return (
    <div className="viewer-page-wrapper" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#f1f5f9', zIndex: 1000, display: 'flex', flexDirection: 'column',
    }}>
      {/* 顶部导航栏 */}
      <header style={{
        height: '56px', background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)',
        borderBottom: '1px solid rgba(148,163,184,0.2)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/model-library')}
            style={{
              background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '6px',
              padding: '8px 14px', color: '#475569', cursor: 'pointer', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            ← 返回列表
          </button>
          <div>
            <span style={{ color: '#1e293b', fontWeight: 600 }}>{model.code}</span>
            <span style={{ color: '#64748b', marginLeft: '12px', fontSize: '13px' }}>{model.name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* CAD 引擎切换（仅在有STP文件时显示） */}
          {(model.hasDrawing || model.drawingFile) && (
            <button
              onClick={() => { setUseOCCT(!useOCCT); setOcctFailed(false) }}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: '1px solid',
                borderColor: useOCCT && !occtFailed ? 'rgba(59,130,246,0.4)' : 'rgba(0,0,0,0.1)',
                background: useOCCT && !occtFailed ? 'rgba(59,130,246,0.06)' : 'transparent',
                color: useOCCT && !occtFailed ? '#2563eb' : '#64748b',
                cursor: 'pointer', fontSize: '12px',
              }}
            >
              {useOCCT && !occtFailed ? '⚙️ OCCT引擎' : '🎮 基础渲染'}
            </button>
          )}

          {/* 自动旋转开关 */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              padding: '6px 14px', borderRadius: '6px', border: '1px solid',
              borderColor: autoRotate ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)',
              background: autoRotate ? 'rgba(0,0,0,0.04)' : 'transparent',
              color: autoRotate ? '#1e293b' : '#64748b', cursor: 'pointer', fontSize: '12px',
            }}
          >
            🔄 自动旋转 {autoRotate ? 'ON' : 'OFF'}
          </button>

          {/* 全屏按钮 */}
          <button onClick={() => {
            const el = document.documentElement
            if (!document.fullscreenElement) el.requestFullscreen?.()
            else document.exitFullscreen?.()
          }} style={{
            padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)',
            background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '12px',
          }}>⛶ 全屏</button>
        </div>
      </header>

      {/* 主体区域：左侧3D + 右侧信息 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧：3D查看器 */}
        <div style={{ flex: 1, position: 'relative', background: '#f8fafc' }}>
          {/* 优先使用 OCCT CAD 查看器（真实STP模型） */}
          {!occtFailed && (model?.hasDrawing || model?.drawingFile) && useOCCT ? (
            <OCCTViewer
              fileName={model.drawingFile}
              width="100%"
              height="100%"
              showControls={true}
              autoRotate={autoRotate}
              backgroundColor="#f8fafc"
              onLoaded={(info) => {
                console.log(`[CAD] 全屏查看器加载完成: ${info.meshCount}个部件`)
              }}
              onError={(err) => {
                console.warn('[CAD] OCCT 失败，切换到降级模式:', err.message)
                setOcctFailed(true)
              }}
            />
          ) : (
          /* 降级方案：react-three/fiber 查看器 */
          <React.Suspense fallback={
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '16px',
              background: '#f8fafc',
            }}>
              <div style={{
                width: '48px', height: '48px', border: '3px solid rgba(148,163,184,0.2)',
                borderTopColor: '#475569', borderRadius: '50%',
                animation: 'spin3D 1s linear infinite',
              }} />
              <span style={{ color: '#64748b', fontSize: '14px' }}>正在加载3D引擎...</span>
            </div>
          }>
            {viewerError ? (
              <div style={{
                width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '16px',
                background: '#f8fafc', color: '#dc2626',
              }}>
                <div style={{ fontSize: '48px' }}>⚠️</div>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>3D渲染出错</p>
                <pre style={{ color: '#fca5a5', fontSize: '12px', maxWidth: '500px', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
                  {viewerError.message || viewerError}
                </pre>
                <button onClick={() => setViewerError(null)} style={{
                  marginTop: '12px', padding: '8px 20px', background: '#475569',
                  border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600,
                }}>重试</button>
                {/* OCCT 失败时提供重新尝试按钮 */}
                {occtFailed && (
                  <button onClick={() => {
                    setOcctFailed(false)
                    setUseOCCT(true)
                  }} style={{
                    marginLeft: '8px', padding: '8px 20px', background: 'transparent',
                    border: '1px solid #475569', borderRadius: '6px', color: '#475569',
                    cursor: 'pointer', fontWeight: 600,
                  }}>重试 CAD 引擎</button>
                )}
              </div>
            ) : (
              <Viewer3D
                modelType={model.modelType || 'default'}
                autoRotate={autoRotate}
                onError={(err) => { console.error('3D Viewer Error:', err); setViewerError(err) }}
              />
            )}
          </React.Suspense>
          )}
        </div>

        {/* 右侧：信息面板 */}
        <aside style={{
          width: '340px', background: '#ffffff', borderLeft: '1px solid rgba(0,0,0,0.06)',
          overflowY: 'auto', padding: '20px', flexShrink: 0,
        }}>
          {/* 模型标题卡片 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
            border: '1px solid rgba(59,130,246,0.12)', borderRadius: '10px', padding: '16px', marginBottom: '20px',
          }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '16px' }}>{model.name}</h2>
            <code style={{ color: '#2563eb', fontSize: '13px', marginTop: '6px', display: 'block' }}>{model.code}</code>
          </div>

          {/* 基本信息 */}
          <section style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>基本信息</h3>
            <InfoRow label="分类" value={`${model.category} / ${model.subcategory || '-'}`} />
            <InfoRow label="供应商" value={model.supplier} />
            <InfoRow label="颜色" value={model.color} highlight />
          </section>

          {/* 规格材质 */}
          <section style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>规格与材质</h3>
            <InfoRow label="规格" value={model.specification} />
            <InfoRow label="材质" value={model.material} />
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(model.features || []).map(f => (
                <span key={f} style={{
                  padding: '3px 10px', background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.15)', borderRadius: '4px',
                  color: '#2563eb', fontSize: '11px',
                }}>{f}</span>
              ))}
            </div>
          </section>

          {/* 文件信息 */}
          <section style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>文件信息</h3>
            <InfoRow label="图纸文件" value={model.drawingFile || '-'} mono />
            <InfoRow label="文件大小" value={model.size || '-'} />
            <InfoRow label="上传日期" value={model.uploadDate || '-'} />
            <InfoRow label="备注" value={model.remark || '-'} />
          </section>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => {
              const targetFile = model.drawingFile || `${model.code}.stp`
              fetch(`/api/models/download-stp/${encodeURIComponent(targetFile)}`).then(r => {
                if (r.ok) return r.blob()
                throw new Error('下载失败')
              }).then(blob => {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = targetFile
                a.click(); URL.revokeObjectURL(url)
              }).catch(() => alert('⚠️ 文件暂不可下载'))
            }} style={{
              padding: '12px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700,
              cursor: 'pointer', fontSize: '14px',
            }}>⬇️ 下载STP模型</button>
            <button onClick={() => alert('📄 技术文档功能开发中，敬请期待')} style={{
              padding: '10px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '8px', color: '#475569', cursor: 'pointer', fontSize: '13px',
            }}>📄 技术文档</button>
            <button onClick={() => {
              navigator.clipboard.writeText(`${model.code} | ${model.name} | ${model.specification || '-'}`)
                .then(() => alert('📋 已复制到剪贴板'))
                .catch(() => alert('复制失败'))
            }} style={{
              padding: '10px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '8px', color: '#475569', cursor: 'pointer', fontSize: '13px',
            }}>📋 加入BOM</button>
          </div>
        </aside>
      </div>
    </div>
  )
}

/** 信息行组件 */
function InfoRow({ label, value, mono, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)',
    }}>
      <span style={{ color: '#94a3b8', fontSize: '13px', flexShrink: 0, marginRight: '12px' }}>{label}</span>
      <span style={{
        color: highlight ? '#2563eb' : '#334155',
        fontSize: '13px', textAlign: 'right',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all',
      }}>{value}</span>
    </div>
  )
}

export default ModelViewerPage
