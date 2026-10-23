import React from "react";
import { FileText, Receipt, Check, Clock, Plus, FileSignature, Search, SlidersHorizontal } from "lucide-react";
import "./BillingOverview.css";
import "./CompactOverview.css";
import "./SalesOverview.css";

// Display only: callers retain filtering, financial calculations and all write actions.
export function SalesOverview({ kind, stats, period, formatMoney, onNew, onTemplates, children }) {
  const invoice = kind === "invoices";
  const title = invoice ? "發票" : "估價單";
  const metrics = invoice ? [
    { label: "目前發票筆數", value: stats.count, icon: Receipt, tone: "blue", caption: "含作廢發票的清單筆數", unit: "張" },
    { label: "有效發票金額", value: stats.total, icon: FileText, tone: "teal", caption: "含稅金額合計・不含已作廢", money: true },
    { label: "尚未入帳金額", value: stats.pending, icon: Clock, tone: "amber", caption: "未填入帳日・不含已作廢", money: true },
  ] : [];
  return <div className="billing-overview sales-overview">
    <header className="billing-header">
      <div className="sales-header-copy"><div className="billing-eyebrow"><span />{invoice ? "INVOICE CENTER · 發票與入帳" : "QUOTATION CENTER · 報價作業"}</div><h2>{title}</h2><p>{invoice ? "掌握開立與入帳進度，讓每一筆應收款清楚可查。" : "整合報價、公司與客戶資訊，掌握每一份估價進度。"}</p></div>
      <div className="sales-actions">{!invoice && <button type="button" className="billing-new sales-secondary" onClick={onTemplates}><FileSignature size={17} aria-hidden="true" />管理估價範本</button>}<button type="button" className="billing-new" onClick={onNew}><Plus size={17} aria-hidden="true" />{invoice ? "開立發票" : "新增估價單"}</button></div>
    </header>
    {children}
    {invoice && <><div className="billing-section-label"><h3>{title}概況</h3><span>{period} · 依目前公司與搜尋條件統計</span></div>
    <section className="billing-metrics billing-metrics--3" aria-label={`${title}統計`}>
      {metrics.map(({ label, value, icon: Icon, tone, caption, money, unit }) => <article className={`billing-metric billing-tone--${tone}`} key={label}>
        <div className="billing-metric-heading"><h4>{label}</h4><span className="billing-icon"><Icon size={19} aria-hidden="true" /></span></div>
        <div className="billing-value">{money && <span className="billing-currency">NT$</span>}<strong>{money ? formatMoney(value).replace(/^NT\$\s*/, "") : value}</strong>{unit && <span className="billing-unit">{unit}</span>}</div>
        <div className="billing-metric-foot"><span>{caption}</span><span className="billing-period">目前篩選</span></div>
      </article>)}
    </section></>}
  </div>;
}

export function SalesFilters({ kind, count, company, companies, onCompanyChange, companyColor, query, onQueryChange, monthControl }) {
  const invoice = kind === "invoices";
  return <section className={`sales-filters sales-filters--inline${invoice ? " sales-filters--invoice" : ""}`} aria-label={`${invoice ? "發票" : "估價單"}清單篩選`}>
    <div className="sales-filter-heading"><h3><SlidersHorizontal size={16} aria-hidden="true" />清單篩選</h3>{!invoice && <p className="sales-group-hint">依開立月份分組・各月份筆數與小計保留於清單</p>}<span role="status" aria-live="polite">目前顯示 <b>{count}</b> 張</span></div>
    <div className="sales-filter-controls sales-inline-row">
      {monthControl && <div className="sales-month-control">{monthControl}</div>}
      <div className="sales-company-row"><span>{invoice ? "開票公司" : "報價公司"}</span><div role="group" aria-label={`${invoice ? "開票" : "報價"}公司篩選`} tabIndex={0} title="公司選項較多時可左右捲動，或使用 Tab 鍵選取">
        {companies.map(name => <button type="button" key={name} title={name} aria-label={name} aria-pressed={company === name} onClick={() => onCompanyChange(name)} style={{ "--sales-company-bg": companyColor(name) }}><i aria-hidden="true" />{invoice || name === "全部" || name === "未填公司" ? name : name.slice(0, 4)}{company === name && <Check size={13} aria-hidden="true" />}</button>)}
      </div></div>
      <label className="sales-search"><span>{invoice ? "關鍵字搜尋" : "客戶搜尋"}</span><div><Search size={16} aria-hidden="true" /><input type="search" aria-label={invoice ? "搜尋發票關鍵字" : "搜尋客戶名稱"} placeholder={invoice ? "搜尋發票、客戶或工程名稱" : "搜尋客戶名稱"} title={invoice ? "可搜尋發票號碼、開票公司、估價單號碼、客戶、工程名稱、付款方式、類別、狀態、備註及品項；多個關鍵字以空白分隔" : "依客戶名稱搜尋"} value={query} onChange={e => onQueryChange(e.target.value)} /></div></label>
    </div>
  </section>;
}
