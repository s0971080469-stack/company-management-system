import React from "react";
import { Users, Receipt, HandCoins, Clock, Truck, FileSignature, ArrowUpRight, ChevronRight, AlertCircle, Check, CalendarDays, Activity, ListChecks, CircleDollarSign, ShieldCheck, FileText } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ReferenceLine } from "recharts";
import "./DashboardOverview.css";
import InvoiceOverdueReminder from "./InvoiceOverdueReminder.jsx";

const COLORS = { income: "#148c8b", expense: "#829bbb", net: "#b5873e" };
const CATEGORY_COLORS = ["#29465e", "#148c8b", "#7c70a7", "#c29a56", "#719bb4", "#af7e83", "#7d967c", "#a5b1bf"];
function Money({ value, formatMoney }) {
  return <><span className="overview-currency">NT$</span><span>{formatMoney(value).replace(/^NT\$\s*/, "")}</span></>;
}
function PanelHeading({ title, caption, eyebrow, icon: Icon, children }) {
  return <div className="overview-panel-heading"><div><div className="overview-kicker">{eyebrow}</div><h3>{title}</h3>{caption && <p>{caption}</p>}</div>{children || (Icon && <span className="overview-panel-symbol"><Icon size={19} aria-hidden="true" /></span>)}</div>;
}
function activityAppearance(item) {
  if (item.text.startsWith("估價單")) return { icon: FileText, tone: "violet" };
  if (item.text.startsWith("發票")) return { icon: Receipt, tone: "blue" };
  if (item.text.startsWith("銀行入帳")) return { icon: CircleDollarSign, tone: "teal" };
  return { icon: ArrowUpRight, tone: "amber" };
}

// Presentation only: App.jsx retains the existing calculations and permissions.
export default function DashboardOverview({ summary: s, alerts = [], invoiceReminders = [], trend = [], categories = [], todoItems = [], recentActivity = [], navigate, formats, StatusBadge }) {
  const { money, date, dateTime, month: monthLabel } = formats;
  const billingRate = s.contractCount ? Math.round(s.billedCount / s.contractCount * 100) : 0;
  const progress = Math.min(100, Math.max(0, billingRate));
  const categoryTotal = categories.reduce((total, item) => total + item.value, 0);
  const canChartCategories = categoryTotal > 0 && categories.every(item => item.value >= 0);
  const operations = [
    { label: "在職員工", value: s.activeEmp, unit: "人", caption: `共登錄 ${s.employeeCount} 位`, icon: Users, tone: "blue" },
    { label: "今日已打卡", value: s.clockedInCount, unit: `/ ${s.activeEmp} 人`, caption: "今日出勤紀錄", icon: Clock, tone: "teal" },
    { label: "生效中契約", value: s.activeContracts, unit: "份", caption: `共 ${s.totalContracts} 份契約`, icon: FileSignature, tone: "violet" },
    { label: "供應商", value: s.supplierCount, unit: "家", caption: `往來廠商共 ${s.vendorCount} 家`, icon: Truck, tone: "amber" },
  ];
  const finance = [
    { label: "發票金額", value: s.monthInvoiceTotal, icon: Receipt, tone: "teal", caption: monthLabel(s.billingMonth), period: "作業月份", english: "INVOICED AMOUNT" },
    { label: "發票待入帳金額", value: s.pendingDepositAmount, icon: CircleDollarSign, tone: "blue", caption: "尚未填寫入帳日", period: "全部月份", english: "AWAITING DEPOSIT" },
    { label: "待付款金額", value: s.pendingBilling, icon: HandCoins, tone: "amber", caption: "公司應付款項・未付款", period: "全部月份", english: "ACCOUNTS PAYABLE" },
  ];
  return <div className="overview-dashboard">
    <header className="overview-header"><div><div className="overview-eyebrow"><span />COMPANY OPERATIONS · 營運中心</div><h2>總覽儀錶板</h2><p>財務、進度與團隊動態，一目瞭然。</p></div><div className="overview-header-meta"><div className="overview-date"><CalendarDays size={16} /><span>{date(s.today)}</span></div><span>發票與請款作業月份</span><strong>{monthLabel(s.billingMonth)}</strong></div></header>
    {(alerts.length > 0 || invoiceReminders.length > 0) && <div className="overview-attention">
      {alerts.length > 0 && <section className="overview-alerts" aria-label="到期與逾期提醒"><div className="overview-alert-title"><AlertCircle size={16} />重點提醒</div><div className="overview-alert-list">{alerts.map(alert => <button type="button" key={alert.key} className={`overview-alert overview-alert--${alert.tone}`} onClick={() => navigate(alert.target)}><span className="overview-alert-dot" /><span>{alert.label}</span><ChevronRight size={14} /></button>)}</div></section>}
      <InvoiceOverdueReminder reminders={invoiceReminders} formatMoney={money} formatDate={date} />
    </div>}
    <div className="overview-section-label"><h3>財務與營運概況</h3><span>統計期間依各卡片標示</span></div>
    <section className="overview-finance" aria-label="財務重點">{finance.map(({ label, value, icon: Icon, tone, caption, period, english }) => <article className={`overview-metric overview-tone--${tone}`} key={label}><div className="overview-metric-label"><span>{label}</span><span className="overview-icon"><Icon size={20} aria-hidden="true" /></span></div><div className="overview-money"><Money value={value} formatMoney={money} /></div><div className="overview-metric-foot"><span>{caption}</span><span className="overview-period-tag">{period}</span></div><div className="overview-metric-english">{english}</div></article>)}</section>
    <section className="overview-operations" aria-label="營運概況">{operations.map(({ label, value, unit, caption, icon: Icon, tone }) => <article key={label} className={`overview-operation overview-tone--${tone}`}><span className="overview-icon"><Icon size={19} aria-hidden="true" /></span><div className="overview-operation-copy"><h4>{label}</h4><div className="overview-operation-value">{value}<span>{unit}</span></div><p>{caption}</p></div></article>)}</section>
    <div className="overview-primary-grid">
      <section className="overview-panel overview-trend">
        <PanelHeading title="收支趨勢" eyebrow="CASH FLOW" caption="近 6 個月 · 依帳務紀錄統計"><div className="overview-chart-legend">{Object.entries({ 收入: COLORS.income, 支出: COLORS.expense, 淨額: COLORS.net }).map(([label, color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div></PanelHeading>
        <div className="overview-trend-chart" role="img" aria-label={`近六個月收支趨勢。${trend.map(item => `${item.month}，收入${money(item.收入)}，支出${money(item.支出)}，淨額${money(item.淨額)}`).join("；")}`}>
          {trend.length > 0 ? <ResponsiveContainer width="100%" height="100%"><ComposedChart data={trend} margin={{ top: 10, right: 8, left: -8, bottom: 0 }} barGap={5}>
            <CartesianGrid strokeDasharray="3 5" stroke="#e4ebef" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6c8092" }} axisLine={false} tickLine={false} dy={6} /><YAxis tick={{ fontSize: 10, fill: "#6c8092" }} axisLine={false} tickLine={false} width={58} tickFormatter={v => Math.abs(v) >= 10000 ? `${+(v / 10000).toFixed(1)}萬` : v} /><ReferenceLine y={0} stroke="#cdd8e1" /><Tooltip formatter={value => money(value)} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e1e7ed" }} cursor={{ fill: "#f1f6f9" }} /><Bar dataKey="收入" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={23} isAnimationActive={false} /><Bar dataKey="支出" fill={COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={23} isAnimationActive={false} /><Line type="monotone" dataKey="淨額" stroke={COLORS.net} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} isAnimationActive={false} />
          </ComposedChart></ResponsiveContainer> : <div className="overview-empty">尚無收支趨勢資料</div>}
        </div>
        <div className="overview-cumulative">{[{ label: "總累計收入", value: s.income, tone: "teal" }, { label: "總累計支出", value: s.expense, tone: "blue" }, { label: "累計淨額", value: s.income - s.expense, tone: s.income - s.expense < 0 ? "red" : "teal" }].map(item => <div key={item.label} className={`overview-tone--${item.tone}`}><span><i />{item.label}</span><strong>{money(item.value)}</strong></div>)}</div>
      </section>
      <section className="overview-panel overview-billing">
        <PanelHeading title="每月請款進度" eyebrow="BILLING PROGRESS" caption={monthLabel(s.billingMonth)} icon={FileSignature} />
        <div className="overview-billing-gauge"><svg viewBox="0 0 120 120" role="progressbar" aria-label="契約請款進度" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><circle cx="60" cy="60" r="50" fill="none" stroke="#e7eff1" strokeWidth="9" /><circle cx="60" cy="60" r="50" fill="none" stroke="#148c8b" strokeWidth="9" pathLength="100" strokeDasharray={`${progress} 100`} strokeLinecap={progress ? "round" : "butt"} transform="rotate(-90 60 60)" /></svg><div><strong>{billingRate}<small>%</small></strong><span>{s.contractCount ? "請款完成率" : "本期無適用契約"}</span></div></div>
        <div className="overview-billing-counts"><div><span><i />已請款</span><strong>{s.billedCount}<small>份</small></strong></div><div><span><i />未請款</span><strong>{s.unbilledCount}<small>份</small></strong></div></div><div className="overview-panel-footer"><ShieldCheck size={14} /><span>本期共 {s.contractCount} 份契約 · 依每月請款追蹤</span></div>
      </section>
    </div>
    <div className="overview-secondary-grid">
      <section className="overview-panel overview-expenses">
        <PanelHeading title="本月支出分類" eyebrow="EXPENSE BREAKDOWN" caption={monthLabel(s.thisMonth)} icon={CircleDollarSign} />
        {categories.length === 0 ? <div className="overview-empty overview-expense-empty"><Receipt size={27} /><p>本月尚無支出紀錄</p></div> : <>
          {canChartCategories ? <div className="overview-donut" role="img" aria-label={`本月支出合計${money(categoryTotal)}。${categories.map(item => `${item.name}：${money(item.value)}`).join("；")}`}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={51} outerRadius={67} paddingAngle={2} stroke="none" isAnimationActive={false}>{categories.map((item, i) => <Cell key={item.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}</Pie><Tooltip formatter={value => money(value)} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e1e7ed" }} /></PieChart></ResponsiveContainer><div className="overview-donut-center"><strong>{categories.length}</strong><span>支出類別</span></div></div> : <p className="overview-category-note">含零額或負額調整，請依下方明細檢視。</p>}
          <div className="overview-expense-total"><span>本月支出合計</span><strong>{money(categoryTotal)}</strong></div><div className="overview-category-list" tabIndex={0} aria-label="本月支出類別明細">{categories.map((item, i) => { const share = categoryTotal ? item.value / categoryTotal * 100 : 0; return <div className="overview-category" key={item.name}><i style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} /><span>{item.name}</span><strong>{money(item.value)}</strong><small>{canChartCategories ? share > 0 && share < 1 ? "<1%" : `${Math.round(share)}%` : "—"}</small></div>; })}</div>
        </>}
      </section>
      <section className="overview-panel overview-tasks">
        <PanelHeading title="待辦事項" eyebrow="WORK PRIORITIES" caption="今日需要關注的工作" icon={ListChecks} />
        {s.isAdmin && <div className="overview-approval"><span className="overview-approval-icon"><AlertCircle size={18} /></span><div><strong>公司應付款項待核准</strong><small>本月＋下月</small></div><b>{s.pendingApprovalCount}<small>筆</small></b></div>}
        <div className="overview-todo-list">{todoItems.length === 0 ? <p className="overview-empty"><Check size={22} />目前沒有待處理事項</p> : todoItems.map((item, i) => <div className="overview-todo" key={item.label}><span className="overview-todo-number">{String(i + 1).padStart(2, "0")}</span><span>{item.label}</span><strong>{item.count}</strong></div>)}</div><div className="overview-panel-footer"><ListChecks size={14} /><span>各項目分別統計，不重複加總為待辦總數</span></div>
      </section>
      <section className="overview-panel overview-activity">
        <PanelHeading title="最近動態" eyebrow="RECENT ACTIVITY" caption="最新異動優先顯示"><span className="overview-section-note"><Activity size={13} />{recentActivity.length} 筆</span></PanelHeading>
        {recentActivity.length === 0 ? <p className="overview-empty">建立估價單、發票或收支紀錄後，最新動態將顯示於此。</p> : <div className="overview-activity-list" tabIndex={0} aria-label="最近動態清單">{recentActivity.map((item, index) => { const { icon: Icon, tone } = activityAppearance(item); return <div className={`overview-activity-item overview-tone--${tone}`} key={index}><span className="overview-activity-marker"><Icon size={15} /></span><div className="overview-activity-copy"><div title={item.text}>{item.text}</div><p>{item.dt ? dateTime(item.dt) : date(item.t)}{item.by ? ` · ${item.byLabel ? `${item.byLabel}：` : ""}${item.by === "—" ? "夏碩亞" : item.by}` : ""}</p><div className="overview-activity-status"><StatusBadge status={item.tag} /></div></div></div>; })}</div>}
        <div className="overview-panel-footer"><Clock size={13} /><span>保留異動人員與時間 · 捲動查看更多</span></div>
      </section>
    </div>
    <footer className="overview-footer"><span>COMPANY OS · 營運總覽</span><span>金額單位：新臺幣（NT$） · 各項統計期間依卡片標示</span></footer>
  </div>;
}
