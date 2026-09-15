import React from "react";
import { BarChart3, CalendarDays, ChevronDown, CircleHelp, Layers3, TrendingUp, Users, Wallet } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import "./ReportsOverview.css";

const CATEGORY_COLORS = ["#56758c", "#639086", "#b69962", "#8b819d", "#b67f78", "#809baf", "#a7a078", "#8e9e87", "#ba957f", "#75859f", "#a789a0", "#88aaa8"];
const monthLabel = (value) => `${Number.parseInt(value, 10)}月`;
const axisAmount = (value) => Math.abs(value) >= 10000
  ? `${Number((value / 10000).toFixed(1))}萬`
  : Number(value).toLocaleString("zh-TW");
const percentage = (value, total) => {
  const share = total > 0 ? value / total * 100 : 0;
  return share > 0 && share < 0.1 ? "<0.1%" : `${share.toFixed(1)}%`;
};

function Amount({ value }) {
  return <div className="reports-amount"><span>NT$</span><strong>{Number(value).toLocaleString("zh-TW")}</strong></div>;
}

function ReportTooltip({ active, payload, label, money }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="reports-tooltip">
      {label != null && <div>{label}</div>}
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name}>
          <span>{entry.name}</span><strong>{money(entry.value)}</strong>
        </p>
      ))}
    </div>
  );
}

function TrendPanel({ title, description, data, dataKey, color, type, money, year }) {
  const Chart = type === "area" ? AreaChart : BarChart;
  return (
    <section className="reports-panel">
      <div className="reports-panel-heading">
        <div><h3>{title}</h3><p>{description}</p></div>
        <span className="reports-series"><i style={{ background: color }} />{dataKey}</span>
      </div>
      <div className="reports-chart-unit">單位：新臺幣（元）</div>
      <div className="reports-trend-chart" role="img" aria-label={`${year}年${title}，完整數字可展開下方每月數據查看`}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 12, right: 10, left: 0, bottom: 4 }} accessibilityLayer>
            <CartesianGrid stroke="#e9edf1" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12, fill: "#697889" }} tickMargin={10} axisLine={false} tickLine={false} minTickGap={12} />
            <YAxis tickFormatter={axisAmount} tick={{ fontSize: 12, fill: "#697889" }} axisLine={false} tickLine={false} width={58} />
            <Tooltip content={<ReportTooltip money={money} />} cursor={type === "area" ? { stroke: "#aebdc9", strokeDasharray: "4 4" } : { fill: "#f3f6f9" }} />
            {type === "area"
              ? <Area type="linear" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill="#eef5f2" dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} isAnimationActive={false} />
              : <Bar dataKey={dataKey} fill={color} maxBarSize={28} radius={[4, 4, 0, 0]} isAnimationActive={false} />}
          </Chart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function ReportsOverview({ year, years, onYearChange, revenueTrend, payrollTrend, expenseByCategory, headcountByDept, totals, formats }) {
  const rocYear = formats.rocYear(year);
  // 排序只用於報表呈現，不改動原始帳務或員工資料。
  const categories = [...expenseByCategory].sort((a, b) => b.value - a.value);
  const departments = [...headcountByDept].sort((a, b) => b.count - a.count);
  const headcount = departments.reduce((sum, dept) => sum + dept.count, 0);
  const canShowShares = totals.expense > 0 && categories.every((category) => category.value >= 0);

  return (
    <div className="reports-overview">
      <header className="reports-header">
        <div>
          <div className="reports-eyebrow">COMPANY OS / REPORTS</div>
          <h2>公司報表</h2>
          <p>掌握年度財務趨勢，清楚看見支出結構與人力配置。</p>
        </div>
        <div className="reports-edition"><BarChart3 size={22} aria-hidden="true" /><div><strong>{rocYear} 年度</strong><span>營運分析報表</span></div></div>
      </header>

      <section className="reports-filters" aria-label="報表年度篩選">
        <div className="reports-year-options">
          <span className="reports-filter-label"><CalendarDays size={17} aria-hidden="true" />統計年度</span>
          <div className="reports-year-buttons">
            {years.map((option) => <button type="button" key={option} aria-pressed={year === option} onClick={() => onYearChange(option)}>{formats.rocYear(option)} 年</button>)}
          </div>
        </div>
        <span className="reports-period">統計期間 <b>{rocYear} / 01 — {rocYear} / 12</b></span>
      </section>

      <section className="reports-finance" aria-label="年度重點統計">
        <article className="reports-metric reports-metric--featured">
          <div className="reports-metric-label"><h3>年度營收</h3><TrendingUp size={19} aria-hidden="true" /></div>
          <Amount value={totals.revenue} />
          <div className="reports-metric-foot"><span>帳務入口・收入</span><span>{rocYear} 年累計</span></div>
        </article>
        <article className="reports-metric">
          <div className="reports-metric-label"><h3>年度支出</h3><span className="reports-icon reports-icon--blue"><Layers3 size={18} aria-hidden="true" /></span></div>
          <Amount value={totals.expense} />
          <div className="reports-metric-foot"><span>帳務入口・支出</span><span>{rocYear} 年累計</span></div>
        </article>
        <article className="reports-metric">
          <div className="reports-metric-label"><h3>年度薪資成本</h3><span className="reports-icon reports-icon--gold"><Wallet size={18} aria-hidden="true" /></span></div>
          <Amount value={totals.payroll} />
          <div className="reports-metric-foot"><span>薪資表・全部發放狀態</span><span>{rocYear} 年累計</span></div>
        </article>
      </section>

      <div className="reports-section-label"><span>財務趨勢</span><span>依月份檢視全年變化</span></div>
      <div className="reports-grid reports-trends">
        <TrendPanel title="營收趨勢" description={`${rocYear} 年 1–12 月｜依帳務收入日期`} data={revenueTrend} dataKey="營收" color="#397e75" type="area" money={formats.money} year={rocYear} />
        <TrendPanel title="薪資成本趨勢" description={`${rocYear} 年 1–12 月｜依薪資表月份`} data={payrollTrend} dataKey="薪資成本" color="#6c819e" type="bar" money={formats.money} year={rocYear} />
      </div>

      <details className="reports-monthly">
        <summary><span><BarChart3 size={17} aria-hidden="true" />檢視每月數據 <small>12 個月</small></span><ChevronDown size={18} aria-hidden="true" /></summary>
        <div className="reports-table-scroll" tabIndex={0} role="region" aria-label="每月營收與薪資成本明細">
          <table>
            <caption>{rocYear} 年每月營收與薪資成本（新臺幣元）</caption>
            <thead><tr><th scope="col">月份</th><th scope="col">營收</th><th scope="col">薪資成本</th></tr></thead>
            <tbody>{revenueTrend.map((month) => <tr key={month.month}><th scope="row">{monthLabel(month.month)}</th><td>{formats.money(month.營收)}</td><td>{formats.money(payrollTrend.find((row) => row.month === month.month)?.薪資成本 ?? 0)}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">年度合計</th><td>{formats.money(totals.revenue)}</td><td>{formats.money(totals.payroll)}</td></tr></tfoot>
          </table>
        </div>
      </details>

      <div className="reports-section-label"><span>結構分析</span><span>支出分布與目前人力</span></div>
      <div className="reports-grid reports-breakdowns">
        <section className="reports-panel">
          <div className="reports-panel-heading"><div><h3>支出結構</h3><p>依帳務支出類別，由金額高至低排列</p></div><span className="reports-tag">{rocYear} 年度</span></div>
          {categories.length === 0 ? <div className="reports-empty"><Layers3 size={30} aria-hidden="true" /><strong>這個年度尚無支出資料</strong><span>記錄支出後，會在這裡呈現類別分布。</span></div> : (
            <div className="reports-expense-layout">
              <div className="reports-donut-block">
                {canShowShares ? <div className="reports-donut" role="img" aria-label="年度支出類別占比，數據詳見旁邊的類別明細">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={78} paddingAngle={categories.filter((category) => category.value > 0).length > 1 ? 2 : 0} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
                      {categories.map((category, index) => <Cell key={category.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
                    </Pie><Tooltip content={<ReportTooltip money={formats.money} />} /></PieChart>
                  </ResponsiveContainer>
                  <div className="reports-donut-center"><strong>{categories.length}</strong><span>支出類別</span></div>
                </div> : <div className="reports-share-note">含零額或負額調整<br />請依類別金額檢視</div>}
                <span className="reports-donut-caption">年度支出總額</span><strong className="reports-expense-total">{formats.money(totals.expense)}</strong>
              </div>
              <ul className="reports-category-list" tabIndex={0} aria-label="支出類別明細">
                {categories.map((category, index) => <li key={category.name}>
                  <i style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} aria-hidden="true" />
                  <div><span className="reports-category-name">{category.name}</span><strong>{formats.money(category.value)}</strong></div>
                  {canShowShares && <span className="reports-share">{percentage(category.value, totals.expense)}</span>}
                </li>)}
              </ul>
            </div>
          )}
        </section>

        <section className="reports-panel">
          <div className="reports-panel-heading"><div><h3>人力配置</h3><p>各部門目前在職人數</p></div><span className="reports-tag reports-tag--green">目前資料</span></div>
          <div className="reports-headcount"><span className="reports-headcount-icon"><Users size={22} aria-hidden="true" /></span><div><span>在職員工</span><strong>{headcount.toLocaleString("zh-TW")}<small>人</small></strong></div><p>不受年度篩選影響</p></div>
          {departments.length === 0 ? <div className="reports-empty reports-empty--compact"><strong>目前尚無在職員工</strong><span>新增在職員工後，會顯示部門分布。</span></div> : (
            <ul className="reports-department-list" tabIndex={0} aria-label="各部門在職人數">
              {departments.map((department, index) => <li key={department.dept}>
                <div className="reports-department-label"><span>{department.dept}</span><strong>{department.count} <small>人</small><em>{percentage(department.count, headcount)}</em></strong></div>
                <div className="reports-department-track" aria-hidden="true"><span style={{ width: `${headcount > 0 ? department.count / headcount * 100 : 0}%`, background: index === 0 ? "#6c819e" : "#b79a64" }} /></div>
              </li>)}
            </ul>
          )}
        </section>
      </div>

      <aside className="reports-notes"><CircleHelp size={18} aria-hidden="true" /><div><h3>統計口徑</h3><p>營收與支出依帳務入口日期統計；薪資成本依薪資表月份統計，包含所有發放狀態。薪資成本與帳務支出分別呈現，不應直接相加。人力配置顯示目前在職資料，並非所選年度的歷史人數。</p></div></aside>
    </div>
  );
}
