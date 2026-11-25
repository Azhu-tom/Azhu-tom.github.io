import React, { useEffect, useMemo } from 'react'
import './StatsDrawer.css'

/* ============ 描边 SVG 图标（与 HomePage 同款 1.7px 体系） ============ */
function SvgIcon({ children, sw = 1.7, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}
const CloseIcon = (p) => <SvgIcon {...p}><path d="M6 6l12 12M18 6L6 18" /></SvgIcon>
const UsersIcon = (p) => <SvgIcon {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c.6-3.4 2.8-5 5.5-5s4.9 1.6 5.5 5M16 5.5a3.2 3.2 0 010 5.4M20.5 20c-.4-2.4-1.6-3.8-3.3-4.5" /></SvgIcon>
const TrendUpIcon = (p) => <SvgIcon sw={2} {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></SvgIcon>

/**
 * 访问统计抽屉：今日 PV/UV、累计 PV、较昨日趋势、近 14 天 PV 柱状图。
 * 数据由 HomePage 拉取后传入；loading / error / 空数据各自有占位态。
 */
export default function StatsDrawer({ open, onClose, data, loading, error }) {
  /* Esc 关闭 */
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const days = (data && data.days) || []
  const maxPv = useMemo(() => Math.max(1, ...days.map(d => d.pv)), [days])
  const todayPv = data ? data.today.pv : null
  const todayUv = data ? data.today.uv : null
  const totalPv = data ? data.totalPv : null
  const trendPct = data ? data.trendPct : null
  const hasAnyData = days.some(d => d.pv > 0)

  return (
    <>
      <div
        className={`stats-drawer-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`stats-drawer ${open ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="访问统计"
      >
        <header className="stats-drawer-head">
          <h3 className="stats-drawer-title"><UsersIcon className="drawer-title-icon" /> 访问统计</h3>
          <button className="stats-drawer-close" onClick={onClose} aria-label="关闭">
            <CloseIcon />
          </button>
        </header>

        <div className="stats-drawer-body">
          {loading && (
            <div className="stats-placeholder">
              <span className="stats-spinner" /> 正在加载统计数据…
            </div>
          )}

          {!loading && error && (
            <div className="stats-placeholder stats-error">
              统计服务暂不可用，请稍后重试。
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className="stats-kpi-grid">
                <div className="stats-kpi theme-blue">
                  <div className="stats-kpi-value">{todayPv}</div>
                  <div className="stats-kpi-label">今日访问 PV</div>
                </div>
                <div className="stats-kpi theme-teal">
                  <div className="stats-kpi-value">{todayUv}</div>
                  <div className="stats-kpi-label">今日访客 UV</div>
                </div>
                <div className="stats-kpi theme-purple">
                  <div className="stats-kpi-value">{totalPv}</div>
                  <div className="stats-kpi-label">累计访问 PV</div>
                </div>
                <div className="stats-kpi theme-amber">
                  <div className="stats-kpi-value">
                    {trendPct === null ? '—' : `${trendPct >= 0 ? '+' : ''}${trendPct}%`}
                  </div>
                  <div className="stats-kpi-label">较昨日趋势</div>
                </div>
              </div>

              <h4 className="stats-sub-title"><TrendUpIcon className="sub-icon" /> 近 14 天访问趋势</h4>
              {hasAnyData ? (
                <div className="stats-chart" role="img" aria-label="近14天访问趋势柱状图">
                  {days.map(d => (
                    <div key={d.date} className="stats-bar-col" title={`${d.date}：PV ${d.pv} / UV ${d.uv}`}>
                      <span className="stats-bar-num">{d.pv > 0 ? d.pv : ''}</span>
                      <div className="stats-bar-track">
                        <div
                          className={`stats-bar ${d.date === days[days.length - 1].date ? 'is-today' : ''}`}
                          style={{ height: `${Math.max(4, Math.round((d.pv / maxPv) * 100))}%` }}
                        />
                      </div>
                      <span className="stats-bar-date">{d.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stats-placeholder">
                  暂无历史数据——统计自接入起开始累计，欢迎明天再来看趋势。
                </div>
              )}

              <p className="stats-footnote">
                匿名统计 · 仅记录访问次数（随机 uid），不采集任何身份信息；同一会话刷新不重复计数。
              </p>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
