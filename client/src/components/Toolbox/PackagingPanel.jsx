import React, { useState, useEffect, useRef } from 'react'
import './PackagingPanel.css'

/**
 * 包装工程工具面板（v3.1 - 盒创完整版 iframe + 本地离线降级）
 *
 * 策略：
 * 1. 默认用 iframe 嵌入盒创完整功能（https://hechuangpack.cn/...），与第三方网站完全一致
 * 2. iframe 加载失败或超时（如盒创服务关闭）→ 自动降级到本地离线工具
 * 3. 顶部提供手动切换，用户可随时在「完整版」与「本地版」之间切换
 *
 * 注：本地 dev（http://localhost）嵌入 HTTP 盒创不会触发 mixed-content 拦截，iframe 可正常显示。
 */

// ==================== SVG 图标（统一描边） ====================
const ICONS = {
  package: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  ),
  pallet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="9" width="18" height="7" rx="1" />
      <path d="M6 16v5M10 16v5M14 16v5M18 16v5" />
      <path d="M3 9l2.2-4.5h13.6L21 9" />
    </svg>
  ),
  cost: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 9a3.5 3.5 0 1 0-3.5 3.5 3.5 3.5 0 1 1-3.5 3.5" />
    </svg>
  ),
  shield: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  external: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  ),
}

const TABS = [
  { key: 'recommend', label: '选材推荐', icon: ICONS.package, url: 'https://hechuangpack.cn/recommend' },
  { key: 'pallet',    label: '码托装柜', icon: ICONS.pallet,  url: 'https://hechuangpack.cn/palletization' },
  { key: 'cost',      label: '成本预估', icon: ICONS.cost,    url: 'https://hechuangpack.cn/learn' },
]

// ==================== 预设行业规则库 ====================

const CUSHION_RULES = {
  fragile_heavy: { material: '蜂窝纸板 + EPE 珍珠棉', weight: 5, desc: '重型易碎品需多层复合缓冲' },
  fragile_light: { material: '气柱袋 + 气泡膜', weight: 1.5, desc: '轻量易碎品推荐充气缓冲' },
  normal_heavy: { material: '瓦楞纸板 + 护角', weight: 3, desc: '重型普通件用瓦楞 + 护角' },
  normal_light: { material: '双瓦楞纸箱', weight: 2, desc: '标准瓦楞即可' },
}

const FLUTE_RULES = (weightKg, dimMm) => {
  const vol = (dimMm?.length || 0) * (dimMm?.width || 0) * (dimMm?.height || 0) / 1e9
  if (weightKg <= 3 && vol < 0.05) return { flute: 'B 楞', layers: '3 层', thickness: '3mm', desc: '轻小件' }
  if (weightKg <= 10 && vol < 0.1) return { flute: 'C 楞', layers: '3 层', thickness: '4mm', desc: '中小件' }
  if (weightKg <= 25) return { flute: 'BC 双瓦楞', layers: '5 层', thickness: '6mm', desc: '中件' }
  return { flute: 'BC + 加强', layers: '7 层', thickness: '9mm', desc: '重型件' }
}

function calcPallet(box, qtyPerBox, palletMm) {
  const boxLen = Math.max(1, box.length)
  const boxWid = Math.max(1, box.width)
  const palletLen = Math.max(1, palletMm.length)
  const palletWid = Math.max(1, palletMm.width)

  const perLayerA = Math.floor(palletLen / boxLen) * Math.floor(palletWid / boxWid)
  const perLayerB = Math.floor(palletLen / boxWid) * Math.floor(palletWid / boxLen)
  const perLayer = Math.max(perLayerA, perLayerB)

  const boxHeight = Math.max(1, box.height)
  const maxLayers = Math.floor(1800 / boxHeight)
  const layers = Math.max(1, Math.min(maxLayers, 8))
  const perPallet = perLayer * layers
  const palletsNeeded = Math.max(1, Math.ceil(qtyPerBox / perPallet))
  const layerHeight = boxHeight * layers

  return { perLayer, layers, perPallet, palletsNeeded, layerHeight }
}

// ==================== 主组件 ====================
function PackagingPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('recommend')
  const [mode, setMode] = useState('iframe') // 'iframe' 完整版 | 'local' 本地版
  const [iframeFailed, setIframeFailed] = useState(false)
  const timerRef = useRef(null)

  const activeUrl = TABS.find(t => t.key === activeTab)?.url

  // 进入 iframe 模式 / 切换 Tab 时，重置失败状态并设置超时检测
  useEffect(() => {
    if (mode !== 'iframe') return
    setIframeFailed(false)
    clearTimeout(timerRef.current)
    // 8 秒内 iframe 未 onLoad，判定失败（盒创关闭/被拦截），降级本地版
    timerRef.current = setTimeout(() => {
      setIframeFailed(true)
    }, 8000)
    return () => clearTimeout(timerRef.current)
  }, [activeTab, mode])

  const showIframe = mode === 'iframe' && !iframeFailed
  const showLocal = mode === 'local' || iframeFailed

  const switchMode = (m) => {
    setMode(m)
    setIframeFailed(false)
    clearTimeout(timerRef.current)
  }

  return (
    <div className="packaging-overlay" onClick={onClose}>
      <div className="packaging-panel" onClick={e => e.stopPropagation()}>
        {/* 顶栏 */}
        <div className="packaging-header">
          <div className="packaging-title-row">
            <span className="packaging-icon">{ICONS.package}</span>
            <h3>包装工程工具</h3>
            <span className={`packaging-badge ${showLocal ? 'local' : ''}`}>
              <span className="packaging-badge-dot" />
              {showLocal ? '本地离线版' : '盒创完整版'}
            </span>
          </div>

          {/* 模式切换 */}
          <div className="packaging-mode-switch">
            <button
              className={`packaging-mode-btn ${mode === 'iframe' ? 'active' : ''}`}
              onClick={() => switchMode('iframe')}
            >
              完整版
            </button>
            <button
              className={`packaging-mode-btn ${mode === 'local' ? 'active' : ''}`}
              onClick={() => switchMode('local')}
            >
              本地版
            </button>
          </div>

          <button className="packaging-close" onClick={onClose} title="关闭" aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="packaging-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`packaging-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="packaging-tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 自动降级提示条 */}
        {iframeFailed && mode === 'iframe' && (
          <div className="packaging-fallback-banner">
            <span>盒创服务暂不可达，已自动切换到本地离线版。</span>
            <button onClick={() => switchMode('iframe')} className="packaging-banner-retry">重试加载</button>
          </div>
        )}

        {/* 内容区 */}
        <div className="packaging-content">
          {showIframe && (
            <iframe
              key={activeTab}
              src={activeUrl}
              className="packaging-iframe"
              title="盒创包装工程AI工作台"
              onLoad={() => { setIframeFailed(false); clearTimeout(timerRef.current) }}
              onError={() => setIframeFailed(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}

          {showLocal && (
            <>
              {activeTab === 'recommend' && <MaterialRecommend />}
              {activeTab === 'pallet' && <PalletCalc />}
              {activeTab === 'cost' && <CostEstimate />}
            </>
          )}
        </div>

        {/* 底部 */}
        <div className="packaging-footer">
          {showLocal ? (
            <span className="packaging-footer-note">
              <span className="packaging-footer-icon">{ICONS.shield}</span>
              当前为本地离线计算，可在右上角切换回「完整版」
            </span>
          ) : (
            <button
              className="packaging-footer-note packaging-footer-link"
              onClick={() => window.open(activeUrl, '_blank')}
            >
              <span className="packaging-footer-icon">{ICONS.external}</span>
              在新窗口打开盒创完整版
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== 本地离线工具 ====================

function MaterialRecommend() {
  const [weight, setWeight] = useState(5)
  const [fragile, setFragile] = useState(false)
  const [transport, setTransport] = useState('land')
  const [dim, setDim] = useState({ length: 300, width: 200, height: 150 })

  const flute = FLUTE_RULES(weight, dim)
  const cushionKey = fragile ? (weight > 10 ? 'fragile_heavy' : 'fragile_light') : (weight > 10 ? 'normal_heavy' : 'normal_light')
  const cushion = CUSHION_RULES[cushionKey]
  const transportLabel = transport === 'air' ? '空运' : transport === 'sea' ? '海运' : '陆运'

  return (
    <div className="pkg-form">
      <h4 className="pkg-form-title">包装选材推荐（本地）</h4>
      <div className="pkg-form-row">
        <label>产品重量 (kg)</label>
        <input type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>产品尺寸 长×宽×高 (mm)</label>
        <div className="pkg-form-row-inline">
          <input type="number" placeholder="长" value={dim.length} onChange={e => setDim({ ...dim, length: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="宽" value={dim.width} onChange={e => setDim({ ...dim, width: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="高" value={dim.height} onChange={e => setDim({ ...dim, height: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="pkg-form-row">
        <label>运输方式</label>
        <select value={transport} onChange={e => setTransport(e.target.value)}>
          <option value="land">陆运（公路 / 铁路）</option>
          <option value="sea">海运</option>
          <option value="air">空运</option>
        </select>
      </div>
      <div className="pkg-form-row">
        <label className="pkg-checkbox-row">
          <input type="checkbox" checked={fragile} onChange={e => setFragile(e.target.checked)} />
          <span>易碎品（需增强缓冲）</span>
        </label>
      </div>

      <div className="pkg-result-card">
        <div className="pkg-result-item">
          <span className="pkg-result-label">推荐瓦楞纸箱</span>
          <span className="pkg-result-value">{flute.flute} · {flute.layers}（{flute.thickness}）</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">缓冲方案</span>
          <span className="pkg-result-value">{cushion.material}</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">适用场景</span>
          <span className="pkg-result-value">{flute.desc} · {transportLabel}</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">缓冲材料用量（估）</span>
          <span className="pkg-result-value">≈ {cushion.weight} kg / 件</span>
        </div>
        <div className="pkg-result-item pkg-result-hint">
          <span className="pkg-result-label">说明</span>
          <span className="pkg-result-value">{cushion.desc}</span>
        </div>
      </div>
    </div>
  )
}

function PalletCalc() {
  const [box, setBox] = useState({ length: 400, width: 300, height: 250 })
  const [qtyPerBox, setQtyPerBox] = useState(100)
  const [pallet, setPallet] = useState({ length: 1200, width: 1000 })

  const result = calcPallet(box, qtyPerBox, pallet)

  return (
    <div className="pkg-form">
      <h4 className="pkg-form-title">码托装柜计算（本地）</h4>
      <div className="pkg-form-row">
        <label>包装箱 长×宽×高 (mm)</label>
        <div className="pkg-form-row-inline">
          <input type="number" placeholder="长" value={box.length} onChange={e => setBox({ ...box, length: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="宽" value={box.width} onChange={e => setBox({ ...box, width: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="高" value={box.height} onChange={e => setBox({ ...box, height: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="pkg-form-row">
        <label>装箱总数（件）</label>
        <input type="number" value={qtyPerBox} onChange={e => setQtyPerBox(parseInt(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>托盘 长×宽 (mm)</label>
        <div className="pkg-form-row-inline">
          <input type="number" placeholder="长" value={pallet.length} onChange={e => setPallet({ ...pallet, length: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="宽" value={pallet.width} onChange={e => setPallet({ ...pallet, width: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>

      <div className="pkg-result-card">
        <div className="pkg-result-item">
          <span className="pkg-result-label">每层摆放</span>
          <span className="pkg-result-value">{result.perLayer} 箱 / 层</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">堆码层数</span>
          <span className="pkg-result-value">{result.layers} 层（约 {result.layerHeight}mm 高）</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">每托总箱数</span>
          <span className="pkg-result-value">{result.perPallet} 箱</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">需要托盘数</span>
          <span className="pkg-result-value pkg-result-highlight">{result.palletsNeeded} 托盘</span>
        </div>
        <div className="pkg-result-item pkg-result-hint">
          <span className="pkg-result-label">装柜参考</span>
          <span className="pkg-result-value">
            40HQ ≈ 20-22 托盘 · 40GP ≈ 20 托盘 · 20GP ≈ 10 托盘
          </span>
        </div>
      </div>
    </div>
  )
}

function CostEstimate() {
  const [boxPrice, setBoxPrice] = useState(3.5)
  const [cushionPrice, setCushionPrice] = useState(1.2)
  const [laborPrice, setLaborPrice] = useState(0.5)
  const [qty, setQty] = useState(1000)
  const [transportFee, setTransportFee] = useState(5000)

  const safeQty = Math.max(1, qty)
  const boxTotal = boxPrice * safeQty
  const cushionTotal = cushionPrice * safeQty
  const laborTotal = laborPrice * safeQty
  const perItem = boxPrice + cushionPrice + laborPrice
  const perItemWithTransport = (boxTotal + cushionTotal + laborTotal + transportFee) / safeQty

  return (
    <div className="pkg-form">
      <h4 className="pkg-form-title">包装成本预估（本地）</h4>
      <div className="pkg-form-row">
        <label>纸箱单价 (元)</label>
        <input type="number" step="0.01" value={boxPrice} onChange={e => setBoxPrice(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>缓冲材料单价 (元)</label>
        <input type="number" step="0.01" value={cushionPrice} onChange={e => setCushionPrice(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>人工 / 包装单价 (元)</label>
        <input type="number" step="0.01" value={laborPrice} onChange={e => setLaborPrice(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>包装数量 (件)</label>
        <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>运输总费用 (元，含分摊)</label>
        <input type="number" value={transportFee} onChange={e => setTransportFee(parseFloat(e.target.value) || 0)} />
      </div>

      <div className="pkg-result-card">
        <div className="pkg-result-item">
          <span className="pkg-result-label">纸箱总成本</span>
          <span className="pkg-result-value">¥ {boxTotal.toLocaleString()}</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">缓冲材料总成本</span>
          <span className="pkg-result-value">¥ {cushionTotal.toLocaleString()}</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">人工包装总成本</span>
          <span className="pkg-result-value">¥ {laborTotal.toLocaleString()}</span>
        </div>
        <div className="pkg-result-item pkg-result-divider">
          <span className="pkg-result-label">单件包装成本（不含运输）</span>
          <span className="pkg-result-value">¥ {perItem.toFixed(2)} / 件</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">单件总成本（含运输分摊）</span>
          <span className="pkg-result-value pkg-result-highlight">¥ {perItemWithTransport.toFixed(2)} / 件</span>
        </div>
      </div>
    </div>
  )
}

export default PackagingPanel
