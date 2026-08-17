import React, { useState, useEffect, useRef } from 'react'
import './PackagingPanel.css'

/**
 * 包装工程AI工具面板（v2.2 - 本地备用 + iframe 优先）
 *
 * 策略：
 * 1. 先尝试 iframe 嵌入盒创（http://121.43.232.218/...）
 * 2. 8秒超时或加载失败 → 切换到本地备用工具
 * 3. 提供"访问完整盒创"链接（用户可手动去原始网站）
 *
 * 注：HTTPS 页面嵌入 HTTP iframe 会触发 mixed-content 拦截，
 * 所以本地备用工具是核心可用保障。
 */
const TABS = [
  { key: 'recommend',  label: '选材推荐', icon: '📦' },
  { key: 'pallet',     label: '码托装柜', icon: '🚛' },
  { key: 'cost',       label: '成本预估', icon: '📊' },
]

const PAGES = {
  recommend: 'http://121.43.232.218/recommend',
  pallet:    'http://121.43.232.218/palletization',
  cost:      'http://121.43.232.218/learn',
}

// ==================== 预设行业规则库 ====================

// 缓冲材料推荐
const CUSHION_RULES = {
  fragile_heavy: { material: '蜂窝纸板 + EPE 珍珠棉', weight: 5, desc: '重型易碎品需多层复合缓冲' },
  fragile_light: { material: '气柱袋 + 气泡膜', weight: 1.5, desc: '轻量易碎品推荐充气缓冲' },
  normal_heavy: { material: '瓦楞纸板 + 护角', weight: 3, desc: '重型普通件用瓦楞 + 护角' },
  normal_light: { material: '双瓦楞纸箱', weight: 2, desc: '标准瓦楞即可' },
}

// 纸箱楞型推荐（按重量和尺寸）
const FLUTE_RULES = (weightKg, dimMm) => {
  const vol = (dimMm?.length || 0) * (dimMm?.width || 0) * (dimMm?.height || 0) / 1e9 // m³
  if (weightKg <= 3 && vol < 0.05) return { flute: 'B 楞', layers: '3 层', thickness: '3mm', desc: '轻小件' }
  if (weightKg <= 10 && vol < 0.1) return { flute: 'C 楞', layers: '3 层', thickness: '4mm', desc: '中小件' }
  if (weightKg <= 25) return { flute: 'BC 双瓦楞', layers: '5 层', thickness: '6mm', desc: '中件' }
  return { flute: 'BC + 加强', layers: '7 层', thickness: '9mm', desc: '重型件' }
}

// 托盘装载方案
function calcPallet(product, box, qtyPerBox, palletMm) {
  const palletArea = (palletMm.length / 1000) * (palletMm.width / 1000) // m²
  const boxArea = (box.length / 1000) * (box.width / 1000)
  const perLayer = Math.floor(palletMm.length / box.length) * Math.floor(palletMm.width / box.width)
  const layerHeight = box.height * 2 // 双层堆码
  const maxLayers = Math.floor(1800 / box.height) // 托盘限高 1.8m
  const layers = Math.min(maxLayers, 2)
  const perPallet = perLayer * layers
  const palletsNeeded = Math.ceil(qtyPerBox / perPallet)
  return { perLayer, layers, perPallet, palletsNeeded, palletArea, boxArea, layerHeight }
}

// ==================== 主组件 ====================
function PackagingPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('recommend')
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeFailed, setIframeFailed] = useState(false)
  const timerRef = useRef(null)

  // 切换 Tab 时重置超时检测
  useEffect(() => {
    setIframeLoaded(false)
    setIframeFailed(false)
    clearTimeout(timerRef.current)
    // 8 秒超时：iframe 没加载成功就放弃
    timerRef.current = setTimeout(() => {
      setIframeFailed((prevFailed) => {
        if (!iframeLoaded) return true
        return prevFailed
      })
    }, 8000)
    return () => clearTimeout(timerRef.current)
  }, [activeTab, iframeLoaded])

  const useLocalFallback = iframeFailed

  return (
    <div className="packaging-overlay" onClick={onClose}>
      <div className="packaging-panel" onClick={e => e.stopPropagation()}>
        {/* 顶栏 */}
        <div className="packaging-header">
          <div className="packaging-title-row">
            <span className="packaging-icon">📦</span>
            <h3>包装工程AI工具</h3>
            <span className="packaging-badge">
              {useLocalFallback ? '本地备用' : '盒创 HeChuang'}
            </span>
          </div>
          <button className="packaging-close" onClick={onClose} title="关闭">×</button>
        </div>

        {/* Tab 切换 */}
        <div className="packaging-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`packaging-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 内容区：iframe 或本地备用 */}
        <div className="packaging-iframe-wrapper">
          {/* iframe 层（被本地备用覆盖时隐藏） */}
          {!useLocalFallback && (
            <>
              {!iframeLoaded && (
                <div className="packaging-loading">
                  <div className="packaging-spinner" />
                  <p>加载盒创 AI 工作台...</p>
                  <span className="packaging-loading-hint">
                    HTTPS 页面嵌入 HTTP 资源可能被拦截，8 秒后自动切换备用工具
                  </span>
                </div>
              )}
              <iframe
                key={activeTab}
                src={PAGES[activeTab]}
                className={`packaging-iframe ${iframeLoaded ? 'loaded' : 'loading'}`}
                title="盒创包装工程AI工具"
                onLoad={() => { setIframeLoaded(true); clearTimeout(timerRef.current) }}
                onError={() => setIframeFailed(true)}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </>
          )}

          {/* 本地备用工具 */}
          {useLocalFallback && <LocalFallback activeTab={activeTab} />}
        </div>

        {/* 底部 */}
        <div className="packaging-footer">
          <span>
            {useLocalFallback
              ? '⚠️ 盒创服务不可达，已启用本地备用工具'
              : '由 盒创 HeChuang 提供 · 包装全链路AI工作台'}
          </span>
          <button
            className="packaging-external-link"
            onClick={() => window.open(`http://121.43.232.218/${activeTab === 'cost' ? 'learn' : activeTab === 'pallet' ? 'palletization' : 'recommend'}`, '_blank')}
          >
            在新窗口打开 ↗
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== 本地备用工具 ====================
function LocalFallback({ activeTab }) {
  return (
    <div className="pkg-local-fallback">
      <div className="pkg-fallback-notice">
        <span className="pkg-fallback-icon">💡</span>
        <div>
          <strong>盒创服务暂不可达</strong>
          <p>HTTPS 安全策略阻止嵌入 HTTP 资源，已切换到本地备用工具（基于行业经验的规则计算）。</p>
        </div>
      </div>

      {activeTab === 'recommend' && <MaterialRecommend />}
      {activeTab === 'pallet' && <PalletCalc />}
      {activeTab === 'cost' && <CostEstimate />}
    </div>
  )
}

// ----- 选材推荐 -----
function MaterialRecommend() {
  const [weight, setWeight] = useState(5)
  const [fragile, setFragile] = useState(false)
  const [transport, setTransport] = useState('land')
  const [dim, setDim] = useState({ length: 300, width: 200, height: 150 })

  const flute = FLUTE_RULES(weight, dim)
  const cushionKey = fragile ? (weight > 10 ? 'fragile_heavy' : 'fragile_light') : (weight > 10 ? 'normal_heavy' : 'normal_light')
  const cushion = CUSHION_RULES[cushionKey]

  return (
    <div className="pkg-form">
      <h4 className="pkg-form-title">📦 包装选材推荐</h4>
      <div className="pkg-form-row">
        <label>产品重量 (kg)</label>
        <input type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>产品尺寸 L×W×H (mm)</label>
        <div className="pkg-form-row-inline">
          <input type="number" placeholder="长" value={dim.length} onChange={e => setDim({ ...dim, length: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="宽" value={dim.width} onChange={e => setDim({ ...dim, width: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="高" value={dim.height} onChange={e => setDim({ ...dim, height: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="pkg-form-row">
        <label>运输方式</label>
        <select value={transport} onChange={e => setTransport(e.target.value)}>
          <option value="land">陆运（公路/铁路）</option>
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
          <span className="pkg-result-value">{flute.desc} · {transport === 'air' ? '空运' : transport === 'sea' ? '海运' : '陆运'}</span>
        </div>
        <div className="pkg-result-item">
          <span className="pkg-result-label">缓冲材料用量（估）</span>
          <span className="pkg-result-value">≈ {cushion.weight} kg / 件</span>
        </div>
      </div>
    </div>
  )
}

// ----- 码托装柜 -----
function PalletCalc() {
  const [product, setProduct] = useState({ length: 300, width: 200, height: 100 })
  const [box, setBox] = useState({ length: 400, width: 300, height: 250 })
  const [qtyPerBox, setQtyPerBox] = useState(100)
  const [pallet, setPallet] = useState({ length: 1200, width: 1000 })

  const result = calcPallet(product, box, qtyPerBox, pallet)

  return (
    <div className="pkg-form">
      <h4 className="pkg-form-title">🚛 码托装柜计算</h4>
      <div className="pkg-form-row">
        <label>单产品 L×W×H (mm)</label>
        <div className="pkg-form-row-inline">
          <input type="number" placeholder="长" value={product.length} onChange={e => setProduct({ ...product, length: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="宽" value={product.width} onChange={e => setProduct({ ...product, width: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="高" value={product.height} onChange={e => setProduct({ ...product, height: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="pkg-form-row">
        <label>包装箱 L×W×H (mm)</label>
        <div className="pkg-form-row-inline">
          <input type="number" placeholder="长" value={box.length} onChange={e => setBox({ ...box, length: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="宽" value={box.width} onChange={e => setBox({ ...box, width: parseFloat(e.target.value) || 0 })} />
          <input type="number" placeholder="高" value={box.height} onChange={e => setBox({ ...box, height: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="pkg-form-row">
        <label>整箱数量（件）</label>
        <input type="number" value={qtyPerBox} onChange={e => setQtyPerBox(parseInt(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>托盘 L×W (mm)</label>
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
          <span className="pkg-result-value">{result.layers} 层（{result.layerHeight}mm 高）</span>
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
          <span className="pkg-result-label">📦 装柜参考</span>
          <span className="pkg-result-value">
            40HQ ≈ 20-22 托盘 · 40GP ≈ 20 托盘 · 20GP ≈ 10 托盘
          </span>
        </div>
      </div>
    </div>
  )
}

// ----- 成本预估 -----
function CostEstimate() {
  const [boxPrice, setBoxPrice] = useState(3.5)
  const [cushionPrice, setCushionPrice] = useState(1.2)
  const [laborPrice, setLaborPrice] = useState(0.5)
  const [qty, setQty] = useState(1000)
  const [transportFee, setTransportFee] = useState(5000)

  const boxTotal = boxPrice * qty
  const cushionTotal = cushionPrice * qty
  const laborTotal = laborPrice * qty
  const perItem = boxPrice + cushionPrice + laborPrice
  const perItemWithTransport = (boxTotal + cushionTotal + laborTotal + transportFee) / qty

  return (
    <div className="pkg-form">
      <h4 className="pkg-form-title">📊 包装成本预估</h4>
      <div className="pkg-form-row">
        <label>纸箱单价 (元)</label>
        <input type="number" step="0.01" value={boxPrice} onChange={e => setBoxPrice(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>缓冲材料单价 (元)</label>
        <input type="number" step="0.01" value={cushionPrice} onChange={e => setCushionPrice(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="pkg-form-row">
        <label>人工/包装单价 (元)</label>
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