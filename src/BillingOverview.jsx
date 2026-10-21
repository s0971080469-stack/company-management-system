import React from "react";
import { Landmark, HandCoins, Wallet, Plus, Check, AlertCircle, CalendarDays, TrendingUp, ArrowUpRight, Receipt, Clock } from "lucide-react";
import "./BillingOverview.css";

const TABS = [
  { key: "銀行入帳", label: "銀行入帳紀錄", caption: "掌握每一筆收入", icon: Landmark, tone: "teal" },
  { key: "公司付款", label: "公司應付款項", caption: "追蹤核准與付款", icon: HandCoins, tone: "blue" },
  { key: "零用金", label: "零用金紀錄", caption: "管理日常收支", icon: Wallet, tone: "violet" },
];

function PaymentReminder({ payments, overdue = false, days, formats }) {
  if (!payments.length) return null;
  const title = overdue ? "已核准逾期未付" : "近期付款提醒";
  return <section className={`billing-reminder${overdue ? " billing-reminder--overdue" : ""}`} aria-label={title}>
    <div className="billing-reminder-summary">
      <span className="billing-reminder-symbol"><AlertCircle size={20} aria-hidden="true" /></span>
      <div><h3>{title}<span>{payments.length} 筆</span></h3><p>{overdue ? "以下款項已過預訂付款日，請優先確認。" : "未付款項將於 5 天內到期，請提前安排。"}</p></div>
    </div>
    <ul className="billing-reminder-list" tabIndex={0} aria-label={`${title}明細`}>
      {payments.map(payment => <li key={payment.id}>
        <div className="billing-reminder-copy"><strong>{payment.vendor || "未填寫廠商"}</strong><span><CalendarDays size={12} aria-hidden="true" />預訂付款 {formats.date(payment.plannedPaymentDate)}</span></div>
        <div className="billing-reminder-amount"><strong>{formats.money(payment.amount)}</strong><span>{overdue ? `已逾期 ${days(payment.plannedPaymentDate)} 天` : days(payment.plannedPaymentDate) === 0 ? "今日到期" : `剩 ${days(payment.plannedPaymentDate)} 天`}</span></div>
      </li>)}
    </ul>
  </section>;
}

// Presentation only. All financial calculations and permission checks stay in BillingView.
export default function BillingOverview({ expenseTab, onTabChange, onNew, newLabel, busy = false, notice = "", stats, duePayments = [], overdueApproved = [], daysUntil, daysOverdue, currentMonthLabel, filterPeriodLabel, companyFilter, formats }) {
  const tab = TABS.find(item => item.key === expenseTab) || TABS[0];
  const allTime = "全部月份";
  const metrics = expenseTab === "零用金" ? [
    { label: "本月零用金支出", value: stats.pettyCashMonthTotal, icon: Wallet, tone: "violet", caption: "僅計入支出紀錄", period: currentMonthLabel, money: true },
    { label: "累計零用金支出", value: stats.pettyCashTotal, icon: Receipt, tone: "blue", caption: "歷次支出合計", period: allTime, money: true },
    { label: "紀錄筆數", value: stats.pettyCashCount, icon: Check, tone: "teal", caption: "包含收入與支出", period: allTime, unit: "筆" },
    { label: "零用金餘額", value: stats.pettyCashBalance, icon: Wallet, tone: stats.pettyCashBalance < 0 ? "red" : "amber", caption: "累計收入 − 累計支出", period: allTime, money: true },
  ] : expenseTab === "公司付款" ? [
    { label: "公司應付款項總數", value: stats.companyPaymentCount, icon: HandCoins, tone: "blue", caption: "全部公司款項", period: allTime, unit: "筆" },
    { label: "已付款件數", value: stats.paidCount, icon: Check, tone: "teal", caption: "付款狀態為已付款", period: allTime, unit: "筆" },
    { label: "核准金額", value: stats.approvedTotal, icon: Receipt, tone: "violet", caption: companyFilter === "全部" ? "全部公司 · 依目前篩選" : `${companyFilter} · 依目前篩選`, period: filterPeriodLabel, money: true },
    { label: "未付款金額", value: stats.pendingTotal, icon: Clock, tone: "amber", caption: companyFilter === "全部" ? "全部公司 · 依目前篩選" : `${companyFilter} · 依目前篩選`, period: filterPeriodLabel, money: true },
    { label: "已核准逾期未付", value: overdueApproved.length, icon: AlertCircle, tone: "red", caption: "已過預訂付款日", period: allTime, unit: "筆" },
  ] : [
    { label: "本月入帳金額", value: stats.bankDepositMonthTotal, icon: Landmark, tone: "teal", caption: "依入帳日期統計", period: currentMonthLabel, money: true },
    { label: "累計入帳金額", value: stats.bankDepositTotal, icon: TrendingUp, tone: "blue", caption: "全部銀行入帳紀錄", period: allTime, money: true },
    { label: "紀錄筆數", value: stats.bankDepositCount, icon: Check, tone: "violet", caption: "銀行入帳紀錄總數", period: allTime, unit: "筆" },
  ];

  return <div className="billing-overview">
    <header className="billing-header">
      <div><div className="billing-eyebrow"><span />FINANCE CENTER · 財務管理</div><h2>收支管理</h2><p>入帳有紀錄，付款有安排，日常收支更清楚。</p></div>
      <button type="button" className="billing-new" disabled={busy} onClick={onNew}><Plus size={17} aria-hidden="true" />{newLabel}<ArrowUpRight size={16} aria-hidden="true" /></button>
    </header>
    {notice && <div className="billing-notice" role="status">{notice}</div>}
    <div className="billing-reminders">
      <PaymentReminder payments={overdueApproved} overdue days={daysOverdue} formats={formats} />
      <PaymentReminder payments={duePayments} days={daysUntil} formats={formats} />
    </div>
    <nav className="billing-tabs" aria-label="收支紀錄分類">{TABS.map(({ key, label, caption, icon: Icon, tone }) => <button type="button" className={`billing-tab billing-tone--${tone}${expenseTab === key ? " is-active" : ""}`} key={key} disabled={busy} aria-pressed={expenseTab === key} onClick={() => onTabChange(key)}>
      <span className="billing-icon"><Icon size={19} aria-hidden="true" /></span><span className="billing-tab-copy"><strong>{label}</strong><small>{caption}</small></span><span className="billing-tab-indicator" aria-hidden="true" />
    </button>)}</nav>
    <div className="billing-section-label"><h3>{tab.key === "公司付款" ? "公司付款概況" : tab.key === "零用金" ? "零用金概況" : "銀行入帳概況"}</h3><span>金額單位 NT$ · 統計期間依卡片標示</span></div>
    <section className={`billing-metrics billing-metrics--${metrics.length}`} aria-label={`${tab.label}統計`}>
      {metrics.map(({ label, value, icon: Icon, tone, caption, period, money, unit }) => <article className={`billing-metric billing-tone--${tone}`} key={label}>
        <div className="billing-metric-heading"><h4>{label}</h4><span className="billing-icon"><Icon size={19} aria-hidden="true" /></span></div>
        <div className="billing-value">{money && <span className="billing-currency">NT$</span>}<strong>{money ? formats.money(value).replace(/^NT\$\s*/, "") : value}</strong>{unit && <span className="billing-unit">{unit}</span>}</div>
        <div className="billing-metric-foot"><span>{caption}</span><span className="billing-period">{period}</span></div>
      </article>)}
    </section>
  </div>;
}
