import React from "react";
import { Users, Wallet, Check, AlertCircle, Plus, Printer, Search, SlidersHorizontal, CalendarDays, ArrowRight, ShieldCheck } from "lucide-react";
import "./WorkforceOverview.css";
import "./CompactOverview.css";
import CompanyFilterButton, { COMPANY_FILTER_COLORS } from "./CompanyFilterButton.jsx";

// Matches the existing company badges; colors identify companies, not payment status.
export const WORKFORCE_COMPANY_COLORS = COMPANY_FILTER_COLORS;

function Action({ icon: Icon, children, primary, ...props }) {
  return <button type="button" className={`workforce-action${primary ? " workforce-action--primary" : ""}`} {...props}>{Icon && <Icon size={15} aria-hidden="true" />}{children}</button>;
}
function Header({ eyebrow, title, description, actions }) {
  return <header className="workforce-header"><div className="workforce-header-copy"><div className="workforce-eyebrow"><i />{eyebrow}</div><h2>{title}</h2><p>{description}</p></div><div className="workforce-header-actions">{actions}</div></header>;
}
function Metric({ label, value, caption, note, tone, icon: Icon, children, className = "" }) {
  return <article className={`workforce-metric workforce-tone--${tone} ${className}`}><div className="workforce-metric-heading"><h3>{label}{note && <small className="workforce-metric-note">{note}</small>}</h3><span><Icon size={18} aria-hidden="true" /></span></div><strong className="workforce-metric-value">{value}</strong>{children || <p>{caption}</p>}</article>;
}
function FilterHeading({ count, unit, children }) {
  return <div className="workforce-filter-heading"><h3><SlidersHorizontal size={15} aria-hidden="true" />清單篩選</h3><span>目前顯示 <b>{count}</b> {unit}{children}</span></div>;
}

// Display-only components: persistence, calculation and approval callbacks stay in App.jsx.
export function EmployeesOverview({ employeeCount, activeCount, filteredCount, query, onQueryChange, site, sites, onSiteChange, company, companies, onCompanyChange, onPrint, onNew }) {
  return <div className="workforce-overview workforce-overview--personnel">
    <Header eyebrow="PEOPLE OPERATIONS · 人員與組織" title="人員管理" description="整合人員資料，清楚掌握案場配置與投保公司。" actions={<><Action icon={Printer} onClick={onPrint}>列印</Action><Action icon={Plus} primary onClick={onNew}>新增員工</Action></>} />
    <section className="workforce-personnel-stats" aria-label="人員統計">
      <Metric label="員工總數" value={<>{employeeCount}<small>位</small></>} caption="所有已建立的人員資料" tone="blue" icon={Users} />
      <Metric label="在職人數" value={<>{activeCount}<small>位</small></>} caption="全部人員中的在職員工" tone="teal" icon={ShieldCheck} />
      <Metric label="目前清單" value={<>{filteredCount}<small>位</small></>} caption="符合下方搜尋與篩選條件" tone="violet" icon={SlidersHorizontal} />
    </section>
    <section className="workforce-filters" aria-label="人員清單篩選">
      <FilterHeading count={filteredCount} unit="位員工" />
      <div className="workforce-personnel-controls">
        <div className="workforce-company-filters"><span>投保公司</span><div role="group" aria-label="投保公司篩選" tabIndex={0} title="公司選項可左右捲動，或使用 Tab 鍵選取">{companies.map(name => <CompanyFilterButton key={name} name={name} selected={company === name} onSelect={onCompanyChange}/>)}</div></div>
        <label className="workforce-field"><span>所屬案場</span><select aria-label="所屬案場" value={site} onChange={e => onSiteChange(e.target.value)}><option value="全部">全部案場</option>{sites.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="workforce-field workforce-search"><span>關鍵字搜尋</span><div><Search size={16} aria-hidden="true" /><input type="search" aria-label="搜尋姓名／部門／職位" placeholder="搜尋姓名、部門或職位" value={query} onChange={e => onQueryChange(e.target.value)} /></div></label>
      </div>
      <div className="workforce-filter-footer"><span>公司與案場可交叉篩選</span><span>人員資料 <ArrowRight size={12} aria-hidden="true" /> 下方清單</span></div>
    </section>
  </div>;
}

export function PayrollOverview({ rowCount, totalNet, paidNet, unpaidNet, paidCount, heldNet, heldCount, month, nextMonth, boss, site, sites, onBossChange, onSiteChange, monthControl, approvalControl, generateLocked, nextGenerateLocked, generating, generationNotice, onGenerate, onPrint, formatMoney, formatMonth }) {
  return <div className="workforce-overview workforce-overview--payroll">
    <Header eyebrow="PAYROLL OPERATIONS · 薪資作業" title="薪資表管理" description="依月份與案場管理薪資，掌握核准及發放進度。" actions={<><Action icon={Printer} onClick={onPrint}>列印</Action><Action primary icon={generateLocked && month ? Check : Plus} onClick={() => onGenerate(month)} disabled={generating || generateLocked}>{generateLocked && month ? "本月薪資表已產生" : "產生本月薪資表"}</Action><Action icon={nextGenerateLocked && nextMonth ? Check : CalendarDays} title={nextMonth ? `產生 ${formatMonth(nextMonth)} 的薪資表；以目前選取月份的下一個月為準。` : "請先選擇月份"} onClick={() => onGenerate(nextMonth)} disabled={generating || nextGenerateLocked}>{nextGenerateLocked && nextMonth ? "下月薪資表已產生" : "產生下月薪資表"}</Action></>} />
    <div className="workforce-section-heading"><h3><CalendarDays size={15} aria-hidden="true" />{month ? formatMonth(month) : "請選擇月份"}<span>薪資概況</span></h3><p>依目前老闆、案場篩選統計</p></div>
    <section className="workforce-payroll-stats" aria-label="薪資統計">
      <Metric label="本月人數" value={<>{rowCount}<small>人</small></>} caption="目前篩選內的薪資筆數" tone="blue" icon={Users} />
      <Metric label="本月薪資總額" note="不含暫時不發金額" value={formatMoney(totalNet)} tone="teal" icon={Wallet} className="workforce-payroll-total"><div className="workforce-paid-split"><div><span>已發放</span><b>{formatMoney(paidNet)}</b></div><div><span>尚未發放</span><b>{formatMoney(unpaidNet)}</b></div></div></Metric>
      <Metric label="已發放" value={<>{paidCount}<small>/ {rowCount} 人</small></>} caption="已完成發放的人員" tone="amber" icon={Check} />
      <Metric label="暫時不發金額" value={formatMoney(heldNet)} caption={`暫時不發人數 ${heldCount} / ${rowCount}`} tone="violet" icon={AlertCircle} />
    </section>
    <section className="workforce-filters" aria-label="薪資清單篩選">
      <FilterHeading count={rowCount} unit="筆薪資" />
      <div className="workforce-payroll-controls">
        <label className="workforce-field"><span>負責老闆</span><select aria-label="負責老闆" value={boss} onChange={e => onBossChange(e.target.value)}>{["全部", "夏碩亞", "夏壽松"].map(name => <option key={name}>{name}</option>)}</select></label>
        <label className="workforce-field workforce-site"><span>所屬案場</span><select aria-label="所屬案場" value={site} onChange={e => onSiteChange(e.target.value)}>{sites.map(name => <option key={name}>{name}</option>)}</select></label>
        <div className="workforce-period-approval"><label className="workforce-field workforce-month"><span>月份</span>{monthControl}</label>{approvalControl}</div>
      </div>
      <div className="workforce-generation-notice" role="status" aria-live="polite"><ShieldCheck size={15} aria-hidden="true" /><span>{generating ? "正在讀取最新人員資料、核對金額並儲存…" : generationNotice || "新增薪資表將套用人員管理最新已儲存的完整薪資數字；既有薪資表不會覆蓋。"}</span></div>
    </section>
  </div>;
}
