import React from "react";
import { Users, Receipt, HandCoins, Clock, Truck, FileSignature, ArrowUpRight, ChevronRight, AlertCircle, Check, CalendarDays, Activity } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ReferenceLine } from "recharts";
import "./DashboardOverview.css";

const COLORS = { income: "#397E75", expense: "#7A8CA6", net: "#B48C45" };
const CATEGORY_COLORS = ["#263D59", "#5B887F", "#C3A165", "#8398B0", "#9C817F", "#79846B", "#A79CB3", "#B6BFC9"];

function Money({ value, formatMoney }) {
  return <><span className="overview-currency">NT$</span><span>{formatMoney(value).replace(/^NT\$\s*/, "")}</span></>;
}

function PanelHeading({ title, caption, children }) {
  return <div className="overview-panel-heading"><div><h3>{title}</h3>{caption && <p>{caption}</p>}</div>{children}</div>;
}

export default function DashboardOverview({ summary: s, alerts, trend, categories, todoItems, recentActivity, navigate, formats, StatusBadge }) {
  const { money, date, dateTime, month: monthLabel } = formats;
  const billingRate = s.contractCount ? Math.round(s.billedCount / s.contractCount * 100) : 0;
  const categoryTotal = categories.reduce((total, item) => total + item.value, 0);
  const operations = [
    { label: "在職員工", value: s.activeEmp, unit: "人", caption: `共登錄 ${s.employeeCount} 位`, icon: Users },
    { label: "今日已打卡", value: s.clockedInCount, unit: `/ ${s.activeEmp} 人`, caption: "今日出勤紀錄", icon: Clock },
    { label: "生效中契約", value: s.activeContracts, unit: "份", caption: `共 ${s.totalContracts} 份契約`, icon: FileSignature },
    { label: "供應商", value: s.supplierCount, unit: "家", caption: `往來廠商共 ${s.vendorCount} 家`, icon: Truck },
  ];
  return (
    <div className="overview-dashboard">
      <header className="overview-header">
        <div><div className="overview-eyebrow">COMPANY OS / OVERVIEW</div><h2>總覽儀表板</h2><p>掌握財務重點，安排今日工作。</p></div>
        <div className="overview-date"><CalendarDays size={15} /><span>{date(s.today)}<small>營運總覽</small></span></div>
      </header>

      {alerts.length > 0 && (
        <section className="overview-alerts" aria-label="到期與逾期提醒">
          <div className="overview-alert-title"><AlertCircle size={15} />重點提醒</div>
          <div className="overview-alert-list">
            {alerts.map((alert) => (
              <button type="button" key={alert.key} className={`overview-alert overview-alert--${alert.tone}`} onClick={() => navigate(alert.target)}>
                <span className="overview-alert-dot" /><span>{alert.label}</span><ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="overview-finance" aria-label="財務重點">
        <article className="overview-metric overview-metric--featured">
          <div className="overview-metric-label"><span>發票金額</span><Receipt size={18} /></div>
          <div className="overview-money"><Money value={s.monthInvoiceTotal} formatMoney={money} /></div>
          <div className="overview-metric-foot"><span>{monthLabel(s.billingMonth)}</span><span className="overview-period-tag">作業月份</span></div>
        </article>
        <article className="overview-metric">
          <div className="overview-metric-label"><span>發票待入帳金額</span><span className="overview-icon overview-icon--blue"><Receipt size={17} /></span></div>
          <div className="overview-money"><Money value={s.pendingDepositAmount} formatMoney={money} /></div>
          <div className="overview-metric-foot"><span>尚未填寫入帳日</span><span>全部月份</span></div>
        </article>
        <article className="overview-metric">
          <div className="overview-metric-label"><span>待付款金額</span><span className="overview-icon overview-icon--gold"><HandCoins size={17} /></span></div>
          <div className="overview-money"><Money value={s.pendingBilling} formatMoney={money} /></div>
          <div className="overview-metric-foot"><span>公司應付款項・未付款</span><span>全部月份</span></div>
        </article>
      </section>

      <section className="overview-operations" aria-label="營運概況">
        {operations.map(({ label, value, unit, caption, icon: Icon }) => (
          <article key={label} className="overview-operation">
            <div className="overview-operation-top"><Icon size={16} /><span>{label}</span></div>
            <div className="overview-operation-value">{value}<span>{unit}</span></div><p>{caption}</p>
          </article>
        ))}
      </section>

      <div className="overview-workspace">
        <section className="overview-panel overview-trend">
          <PanelHeading title="收支趨勢" caption="近 6 個月・依帳務紀錄統計">
            <div className="overview-chart-legend">{Object.entries({ 收入: COLORS.income, 支出: COLORS.expense, 淨額: COLORS.net }).map(([label, color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>
          </PanelHeading>
          <div className="overview-trend-chart" role="img" aria-label={`近六個月收支趨勢。${trend.map((item) => `${item.month}，收入${money(item.收入)}，支出${money(item.支出)}，淨額${money(item.淨額)}`).join("；")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }} barGap={5}>
                <CartesianGrid strokeDasharray="3 5" stroke="#E6EBEF" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 13, fill: "#697889" }} axisLine={false} tickLine={false} dy={5} />
                <YAxis tick={{ fontSize: 12, fill: "#697889" }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => Math.abs(v) >= 10000 ? `${+(v / 10000).toFixed(1)}萬` : v} />
                <ReferenceLine y={0} stroke="#CDD5DF" />
                <Tooltip formatter={(value) => money(value)} contentStyle={{ fontSize: 14, borderRadius: 10, border: "1px solid #E1E6EC" }} cursor={{ fill: "#F4F6F8" }} />
                <Bar dataKey="收入" fill={COLORS.income} radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                <Bar dataKey="支出" fill={COLORS.expense} radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                <Line type="monotone" dataKey="淨額" stroke={COLORS.net} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="overview-cumulative">
            {[{ label: "總累計收入", value: s.income, tone: "green" }, { label: "總累計支出", value: s.expense, tone: "ink" }, { label: "累計淨額", value: s.income - s.expense, tone: s.income - s.expense < 0 ? "red" : "green" }].map((item) => <div key={item.label}><span>{item.label}</span><strong className={`overview-text--${item.tone}`}>{money(item.value)}</strong></div>)}
          </div>
        </section>

        <section className="overview-panel overview-tasks">
          <PanelHeading title="待辦事項" caption="請款進度與待處理工作"><span className="overview-icon overview-icon--gold"><Check size={17} /></span></PanelHeading>
          <div className="overview-billing-progress">
            <div className="overview-progress-title"><span>{monthLabel(s.billingMonth)}請款</span><strong>{billingRate}%</strong></div>
            <div className="overview-progress-track" role="progressbar" aria-label="契約請款進度" aria-valuenow={billingRate} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${billingRate}%` }} /></div>
            <div className="overview-progress-caption"><span>已請款 <b>{s.billedCount}</b> 份</span><span>未請款 <b>{s.unbilledCount}</b> 份</span><span>共 {s.contractCount} 份</span></div>
          </div>
          {s.isAdmin && <div className="overview-approval"><span><AlertCircle size={15} />公司應付款項待核准<small>本月＋下月</small></span><strong>{s.pendingApprovalCount}<small>筆</small></strong></div>}
          <div className="overview-todo-list">
            {todoItems.length === 0 ? <p className="overview-empty"><Check size={18} />目前沒有待處理事項</p> : todoItems.map((item) => <div className="overview-todo" key={item.label}><span>{item.label}</span><strong>{item.count}</strong></div>)}
          </div>
        </section>

        <section className="overview-panel overview-activity">
          <PanelHeading title="最近動態" caption="最新異動優先顯示"><span className="overview-section-note"><Activity size={14} />最近 {recentActivity.length} 筆</span></PanelHeading>
          {recentActivity.length === 0 ? <p className="overview-empty">建立估價單、發票或收支紀錄後，最新動態將顯示於此。</p> : (
            <div className="overview-activity-list" tabIndex={0} aria-label="最近動態清單">
              {recentActivity.map((item, index) => <div className="overview-activity-item" key={index}>
                <span className="overview-activity-marker"><ArrowUpRight size={14} /></span>
                <div className="overview-activity-copy"><div title={item.text}>{item.text}</div><p>{item.dt ? dateTime(item.dt) : date(item.t)}{item.by ? ` · ${item.byLabel ? `${item.byLabel}：` : ""}${item.by === "—" ? "夏碩亞" : item.by}` : ""}</p></div>
                <StatusBadge status={item.tag} />
              </div>)}
            </div>
          )}
        </section>

        <section className="overview-panel overview-expenses">
          <PanelHeading title="本月支出分類" caption={monthLabel(s.thisMonth)} />
          {categories.length === 0 ? <div className="overview-empty overview-expense-empty"><Receipt size={26} /><p>本月尚無支出紀錄</p></div> : <>
            <div className="overview-donut">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={80} paddingAngle={2} stroke="none" isAnimationActive={false}>{categories.map((item, index) => <Cell key={item.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} contentStyle={{ fontSize: 14, borderRadius: 10, border: "1px solid #E1E6EC" }} /></PieChart></ResponsiveContainer>
              <div className="overview-donut-center"><strong>{categories.length}</strong><span>支出類別</span></div>
            </div>
            <div className="overview-expense-total"><span>本月支出合計</span><strong>{money(categoryTotal)}</strong></div>
            <div className="overview-category-list" tabIndex={0} aria-label="本月支出類別明細">
              {categories.map((item, index) => <div className="overview-category" key={item.name}><i style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} /><span>{item.name}</span><strong>{money(item.value)}</strong><small>{categoryTotal ? Math.round(item.value / categoryTotal * 100) : 0}%</small></div>)}
            </div>
          </>}
        </section>
      </div>
      <footer className="overview-footer">金額單位：新臺幣（NT$）<span>各項統計期間標示於卡片內</span></footer>
    </div>
  );
}
