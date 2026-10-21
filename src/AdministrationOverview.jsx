import React from "react";
import { BarChart3, Plus, ShieldCheck, Users, Layers3, TrendingUp, Wallet, Info } from "lucide-react";
import "./BillingOverview.css";
import "./AdministrationOverview.css";

// Display-only components. Existing views own all calculations and write handlers.
export function AdministrationHeader({ kind, period, onNew }) {
  const reports = kind === "reports";
  return <div className="billing-overview administration-header">
    <header className="billing-header">
      <div><div className="billing-eyebrow"><span />{reports ? "REPORT CENTER · 營運分析" : "ACCESS CENTER · 權限管理"}</div>
        <h2>{reports ? "公司報表" : "權限設定"}</h2>
        <p>{reports ? "掌握年度財務趨勢，清楚看見支出結構與人力配置。" : "集中管理系統帳號、員工綁定與各角色可使用的功能。"}</p>
      </div>
      {reports ? <div className="administration-edition"><BarChart3 size={22} aria-hidden="true" /><div><strong>{period} 年度</strong><span>營運分析報表</span></div></div> :
        <button type="button" className="billing-new" onClick={onNew}><Plus size={17} aria-hidden="true" />新增系統帳號</button>}
    </header>
  </div>;
}

export function AdministrationMetrics({ title, description, items }) {
  return <div className="billing-overview administration-metrics">
    <div className="billing-section-label"><h3>{title}</h3><span>{description}</span></div>
    <section className="billing-metrics billing-metrics--3" aria-label={title}>
      {items.map(({ label, value, icon: Icon, tone, caption, period, money, unit }) =>
        <article key={label} className={`billing-metric billing-tone--${tone}`}>
          <div className="billing-metric-heading"><h4>{label}</h4><span className="billing-icon"><Icon size={19} aria-hidden="true" /></span></div>
          <div className="billing-value">{money && <span className="billing-currency">NT$</span>}<strong>{Number(value).toLocaleString("zh-TW")}</strong>{unit && <span className="billing-unit">{unit}</span>}</div>
          <div className="billing-metric-foot"><span>{caption}</span><span className="billing-period">{period}</span></div>
        </article>)}
    </section>
  </div>;
}

export function ReportMetrics({ totals, year }) {
  return <AdministrationMetrics title="年度財務概況" description="依所選年度統計・金額單位 NT$" items={[
    { label: "年度營收", value: totals.revenue, icon: TrendingUp, tone: "teal", caption: "帳務入口・收入", period: `${year} 年累計`, money: true },
    { label: "年度支出", value: totals.expense, icon: Layers3, tone: "blue", caption: "帳務入口・支出", period: `${year} 年累計`, money: true },
    { label: "年度薪資成本", value: totals.payroll, icon: Wallet, tone: "violet", caption: "薪資表・全部發放狀態", period: `${year} 年累計`, money: true },
  ]} />;
}

export function PermissionsOverview({ onNew }) {
  return <div className="permissions-overview">
    <AdministrationHeader kind="permissions" onNew={onNew} />
    <aside className="administration-notice"><Info size={17} aria-hidden="true" /><p>側邊欄下方可切換「目前身分」。非夏碩亞角色在打卡上下班頁面，只能選自己綁定的員工打卡，也只能看到自己的出勤紀錄。</p></aside>
  </div>;
}

export function PermissionSectionHeading({ matrix = false, children }) {
  const Icon = matrix ? ShieldCheck : Users;
  return <div className={`permission-section-heading ${matrix ? "is-matrix" : ""}`}>
    <div className="permission-section-copy"><span><Icon size={19} aria-hidden="true" /></span><div><h3>{matrix ? "角色權限矩陣" : "系統帳號"}</h3><p>{matrix ? "依角色設定可使用的功能模組" : "管理姓名、角色、員工綁定與啟用狀態"}</p></div></div>
    {children && <div className="permission-section-actions">{children}</div>}
  </div>;
}
