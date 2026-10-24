import React from "react";
import { FileSignature, Landmark, Check, Clock, CalendarDays, Plus, ArrowUpRight, Layers3 } from "lucide-react";
import "./ContractOverview.css";
import "./CompactOverview.css";

// Display only: contract filtering, dates, amounts and persistence stay in ContractsView.
export default function ContractOverview({ totalCount, totalAmount, activeCount, expiringCount, filteredCount, year, yearTabs, onYearChange, onNew, formatMoney, formatYear, hideYearFilter = false }) {
  const period = year === "全部" ? "全部年度" : `${formatYear(year)} 年度`;
  const metrics = [
    { label: "契約總數", value: totalCount, icon: FileSignature, tone: "blue", caption: "完整契約紀錄", scope: "全部契約" },
    { label: year === "全部" ? "承攬總金額" : `${period}承攬總金額`, value: totalAmount, icon: Landmark, tone: "teal", caption: `目前篩選 ${filteredCount} 份 · 契約整筆金額合計`, scope: period, money: true },
    { label: "生效中", value: activeCount, icon: Check, tone: "violet", caption: "狀態為生效中的契約", scope: "全部契約" },
    { label: "30 天內到期", value: expiringCount, icon: Clock, tone: "amber", caption: "生效中且近期到期", scope: "全部契約" },
  ];

  return <div className="contract-overview">
    <header className="contract-overview-header">
      <div><div className="contract-overview-eyebrow"><span />CONTRACT CENTER · 契約管理</div><h2>契約管理</h2><p>掌握契約全貌，從承攬金額到履約期限，一目了然。</p></div>
      <button type="button" className="contract-overview-new" onClick={onNew}><Plus size={17} aria-hidden="true" />新增契約<ArrowUpRight size={16} aria-hidden="true" /></button>
    </header>

    {!hideYearFilter && totalCount > 0 && <section className="contract-year-panel" aria-label="契約年度篩選">
      <div className="contract-year-label"><span className="contract-year-symbol"><CalendarDays size={18} aria-hidden="true" /></span><div><h3>契約年度</h3><p>起訖日期涵蓋該年度即列入</p></div></div>
      <nav className="contract-year-options" aria-label="選擇契約年度">{yearTabs.map(value => <button type="button" key={value} className={year === value ? "is-active" : ""} aria-pressed={year === value} onClick={() => onYearChange(value)}>{value === "全部" ? <Layers3 size={14} aria-hidden="true" /> : null}{value === "全部" ? "全部" : `${formatYear(value)} 年`}{year === value && <Check size={13} aria-hidden="true" />}</button>)}</nav>
    </section>}

    <div className="contract-overview-section-label"><h3>契約概況</h3><span>金額依年度、公司與搜尋條件統計 · 件數為全部契約</span></div>
    <section className="contract-overview-metrics" aria-label="契約統計">{metrics.map(({ label, value, icon: Icon, tone, caption, scope, money }) => <article className={`contract-overview-metric contract-overview-tone--${tone}${money ? " contract-overview-metric--amount" : ""}`} key={tone}>
      <div className="contract-overview-metric-heading"><h4>{label}</h4><span className="contract-overview-icon"><Icon size={19} aria-hidden="true" /></span></div>
      <div className="contract-overview-value">{money && <span>NT$</span>}<strong>{money ? formatMoney(value).replace(/^NT\$\s*/, "") : value}</strong>{!money && <span>份</span>}</div>
      <div className="contract-overview-metric-foot"><span>{caption}</span><span className="contract-overview-scope">{scope}</span></div>
    </article>)}</section>
  </div>;
}
