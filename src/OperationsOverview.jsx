import React from "react";
import { FileSignature, Check, Clock, Car, AlertCircle, TrendingUp, TrendingDown, Landmark, Plus, Search, SlidersHorizontal, MapPin } from "lucide-react";
import "./BillingOverview.css";
import "./OperationsOverview.css";

const PAGES = {
  tracking: { title:"每月請款追蹤", eyebrow:"BILLING TRACKER · 請款作業", description:"依月份追蹤契約請款，集中管理本期金額與掃描文件。", section:"請款概況" },
  vehicles: { title:"車輛管理", eyebrow:"FLEET CENTER · 車輛管理", description:"整合車輛與使用人資訊，掌握保險、驗車及到期時程。", section:"車輛概況", action:"新增車輛" },
  attendance: { title:"打卡上下班", eyebrow:"ATTENDANCE CENTER · 出勤管理", description:"每日打卡、出勤與請假紀錄，集中查看更清楚。" },
  ledger: { title:"帳務入口", eyebrow:"LEDGER CENTER · 帳務管理", description:"彙整各項收入與支出，讓每一筆帳務都有清楚紀錄。", section:"帳務概況", action:"新增帳務紀錄" },
};

// Pure presentation: metrics are passed by the existing views, never saved or recomputed here.
export function OperationsOverview({ kind, stats = {}, period = "", formatMoney, onNew, children }) {
  const page=PAGES[kind];
  const metrics=kind==="tracking"?[
    {label:"本月契約數",value:stats.count,icon:FileSignature,tone:"blue",caption:"依目前月份、公司與搜尋條件",scope:period,unit:"份"},
    {label:"已請款",value:stats.billed,icon:Check,tone:"teal",caption:"目前清單已勾選請款的契約",scope:period,unit:"份"},
    {label:"未請款",value:stats.unbilled,icon:Clock,tone:"amber",caption:"目前清單尚未勾選請款的契約",scope:period,unit:"份"},
  ]:kind==="vehicles"?[
    {label:"車輛總數",value:stats.count,icon:Car,tone:"blue",caption:"所有已建立的車輛資料",scope:"全部車輛",unit:"輛"},
    {label:"使用中",value:stats.active,icon:Check,tone:"teal",caption:"目前狀態為使用中",scope:"全部車輛",unit:"輛"},
    {label:"保險／驗車 30 天內到期",value:stats.expiring,icon:Clock,tone:"amber",caption:"任一項即將到期・含今日",scope:"全部車輛",unit:"輛"},
    {label:"保險／驗車已逾期",value:stats.overdue,icon:AlertCircle,tone:"red",caption:"任一項已超過有效日期",scope:"全部車輛",unit:"輛"},
  ]:kind==="ledger"?[
    {label:"總收入",value:stats.income,icon:TrendingUp,tone:"teal",caption:"全部帳務收入合計",scope:"全部月份",money:true},
    {label:"總支出",value:stats.expense,icon:TrendingDown,tone:"red",caption:"全部帳務支出合計",scope:"全部月份",money:true},
    {label:"淨額",value:stats.net,icon:Landmark,tone:stats.net<0?"red":"blue",caption:"總收入 − 總支出",scope:"全部月份",money:true},
  ]:[];
  return <div className="billing-overview operations-overview">
    <header className="billing-header"><div><div className="billing-eyebrow"><span/>{page.eyebrow}</div><h2>{page.title}</h2><p>{page.description}</p></div>{page.action&&<button type="button" className="billing-new" onClick={onNew}><Plus size={17} aria-hidden="true"/>{page.action}</button>}</header>
    {metrics.length>0&&<><div className="billing-section-label"><h3>{page.section}</h3><span>{kind==="tracking"?"依目前清單統計":kind==="ledger"?"全部月份・不受下方清單篩選影響":"全部車輛・不受搜尋條件影響"}</span></div>
      <section className={`billing-metrics billing-metrics--${metrics.length}`} aria-label={`${page.title}統計`}>{metrics.map(({label,value,icon:Icon,tone,caption,scope,money,unit})=><article key={label} className={`billing-metric billing-tone--${tone}`}><div className="billing-metric-heading"><h4>{label}</h4><span className="billing-icon"><Icon size={19} aria-hidden="true"/></span></div><div className="billing-value">{money&&<span className="billing-currency">NT$</span>}<strong>{money?formatMoney(value).replace(/^NT\$\s*/,""):value}</strong>{unit&&<span className="billing-unit">{unit}</span>}</div><div className="billing-metric-foot"><span>{caption}</span><span className="billing-period">{scope}</span></div></article>)}</section></>}
    {children}
  </div>;
}

export function OperationsFilters({ title="清單篩選", count, unit="筆", children, options=[], selected, onSelect, optionLabel="分類", colorOf=()=>"#edf2f7" }) {
  return <section className="operations-filters" aria-label={title}><div className="operations-filter-heading"><h3><SlidersHorizontal size={16} aria-hidden="true"/>{title}</h3>{count!==undefined&&<span>目前顯示 <b>{count}</b> {unit}</span>}</div><div className="operations-filter-controls">{children}</div>
    {options.length>0&&<div className="operations-options"><span>{optionLabel}</span><div role="group" aria-label={optionLabel}>{options.map(option=>{const value=typeof option==="string"?option:option.value;const label=typeof option==="string"?option:option.label;return <button type="button" key={value} aria-pressed={selected===value} style={{background:colorOf(value)}} onClick={()=>onSelect(value)}>{label}{selected===value&&<Check size={13} aria-hidden="true"/>}</button>;})}</div></div>}
  </section>;
}
export function OperationsSearch({label,query,onChange}) {
  return <label className="operations-search"><Search size={16} aria-hidden="true"/><input type="search" aria-label={label} placeholder={label} value={query} onChange={e=>onChange(e.target.value)}/></label>;
}
export function VehicleReminders({overdue=[],expiring=[],isOverdue,isExpiringSoon,daysUntil}) {
  return <div className="operations-vehicle-reminders">{[{rows:overdue,late:true},{rows:expiring,late:false}].filter(group=>group.rows.length).map(({rows,late})=><section key={String(late)} className={`operations-reminder ${late?"is-late":""}`} aria-label={late?"車輛逾期提醒":"車輛到期提醒"}><div className="operations-reminder-heading"><AlertCircle size={18} aria-hidden="true"/><h3>{late?"保險／驗車已逾期":"保險／驗車 30 天內到期"}</h3><span>{rows.length} 輛</span></div><ul tabIndex={0} aria-label={late?"逾期車輛明細":"即將到期車輛明細"}>{rows.map(v=><li key={v.id}><strong>{v.plate}<small>{v.model||"未填車型"}</small></strong><div>{[["保險",v.insuranceExpiry],["驗車",v.inspectionExpiry]].filter(([,date])=>late?isOverdue(date):isExpiringSoon(date)).map(([label,date])=><span key={label}>{label}{late?`已逾期 ${-daysUntil(date)} 天`:daysUntil(date)===0?"今日到期":`剩 ${daysUntil(date)} 天`}</span>)}</div></li>)}</ul></section>)}</div>;
}
export function AttendanceControls({time,date,employeeControl,actions,locationControl}) {
  return <section className="operations-attendance-controls" aria-label="打卡操作區"><div className="operations-clock"><div className="operations-clock-time"><span><Clock size={16} aria-hidden="true"/>打卡鐘 · PUNCH CLOCK</span><strong>{time}</strong><p>{date}</p></div><div className="operations-clock-actions">{employeeControl}<div>{actions}</div></div></div><div className="operations-location"><div className="operations-location-heading"><MapPin size={18} aria-hidden="true"/><h3>打卡地點設定</h3></div>{locationControl}</div></section>;
}
