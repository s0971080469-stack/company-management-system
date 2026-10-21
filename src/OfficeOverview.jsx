import React from "react";
import { Truck, Building2, Stamp, CalendarDays, FileText, Plus, Printer } from "lucide-react";
import "./ContractOverview.css";
import "./CompactOverview.css";
import "./OfficeOverview.css";

// Reuse the contract overview's actual styles, not a separately estimated height.
// Counts and action callbacks come from the existing views; this component never saves data.
function OfficeOverview({ title, eyebrow, description, metrics, children }) {
  return <div className="contract-overview office-overview">
    <header className="contract-overview-header">
      <div className="office-overview-copy"><div className="contract-overview-eyebrow"><span />{eyebrow}</div><h2>{title}</h2><p>{description}</p></div>
      <div className="office-overview-actions">{children}</div>
    </header>
    <div className="contract-overview-section-label"><h3>{title === "廠商管理" ? "廠商概況" : "公文概況"}</h3><span>統計範圍依各卡片標示</span></div>
    <section className={`contract-overview-metrics office-overview-metrics office-overview-metrics--${metrics.length}`} aria-label={`${title === "廠商管理" ? "廠商" : "公文"}統計`}>
      {metrics.map(({ label, value, unit, icon: Icon, tone, caption, scope }) => <article className={`contract-overview-metric contract-overview-tone--${tone}`} key={label}>
        <div className="contract-overview-metric-heading"><h4>{label}</h4><span className="contract-overview-icon"><Icon size={19} aria-hidden="true" /></span></div>
        <div className="contract-overview-value"><strong>{value}</strong><span>{unit}</span></div>
        <div className="contract-overview-metric-foot"><span>{caption}</span><span className="contract-overview-scope">{scope}</span></div>
      </article>)}
    </section>
  </div>;
}

function Action({ icon: Icon, children, secondary, onClick }) {
  return <button type="button" className={`contract-overview-new${secondary ? " office-overview-secondary" : ""}`} onClick={onClick}><Icon size={17} aria-hidden="true" />{children}</button>;
}

export function VendorsOverview({ supplierCount, ownerCount, onNew, onPrint }) {
  return <OfficeOverview title="廠商管理" eyebrow="PARTNER CENTER · 往來管理" description="整合供應商與業主資料，讓聯繫與往來更清楚。" metrics={[
    { label: "供應商家數", value: supplierCount, unit: "家", icon: Truck, tone: "blue", caption: "供應商完整紀錄", scope: "全部廠商" },
    { label: "業主家數", value: ownerCount, unit: "家", icon: Building2, tone: "violet", caption: "業主完整紀錄", scope: "全部廠商" },
  ]}><Action icon={Printer} secondary onClick={onPrint}>列印</Action><Action icon={Plus} onClick={onNew}>新增廠商</Action></OfficeOverview>;
}

export function DocumentsOverview({ totalCount, monthCount, templatedCount, onNew, onPrint, onTemplates }) {
  return <OfficeOverview title="公文管理" eyebrow="DOCUMENT CENTER · 公文作業" description="掌握公文紀錄與範本使用，讓發文作業更有條理。" metrics={[
    { label: "公文總數", value: totalCount, unit: "份", icon: Stamp, tone: "blue", caption: "完整公文紀錄", scope: "全部公文" },
    { label: "本月新增", value: monthCount, unit: "份", icon: CalendarDays, tone: "amber", caption: "依發文日期統計", scope: "本月" },
    { label: "已套用範本", value: templatedCount, unit: "份", icon: FileText, tone: "teal", caption: "已指定範本的公文", scope: "全部公文" },
  ]}><Action icon={FileText} secondary onClick={onTemplates}>管理公文範本</Action><Action icon={Printer} secondary onClick={onPrint}>列印</Action><Action icon={Plus} onClick={onNew}>新增公文</Action></OfficeOverview>;
}
