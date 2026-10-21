import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Globe, Users, Inbox, Clock, Search, X, ArrowUpRight, ArrowRight, CalendarDays, CheckCircle2, CircleDot, FileText, Mail, Phone, MapPin, Activity, ShieldCheck, SlidersHorizontal, AlertCircle } from "lucide-react";
import { FORM_STATUSES, filterWebsiteForms, taipeiMonth, websiteSummary, websiteDate } from "./websiteManagement.js";
import "./WebsiteManagement.css";
import "./CompactOverview.css";

const STATUS_ICONS = [Clock, CircleDot, CheckCircle2];
function StatusBadge({ status }) {
  const index = FORM_STATUSES.indexOf(status);
  const Icon = STATUS_ICONS[index] || CircleDot;
  return <span className={`wm-status status-${index}`}><Icon size={12} aria-hidden="true" />{status}</span>;
}

function TrafficChart({ daily }) {
  const gradientId = useId();
  if (!daily.length) return <div className="wm-empty"><Activity size={28} /><strong>這段期間尚無每日流量資料</strong><span>有統計資料後，趨勢會顯示在這裡。</span></div>;
  const max = Math.max(...daily.map(day => day.views), 1);
  const points = daily.map((day, i) => ({ x: daily.length === 1 ? 350 : 35 + i * 630 / (daily.length - 1), y: 148 - day.views / max * 112 }));
  const line = points.map((point, i) => `${i ? "L" : "M"}${point.x},${point.y}`).join(" ");
  return <div className="wm-chart">
    <svg viewBox="0 0 700 180" role="img" aria-label="最近七日網頁瀏覽次數">
      <title>每日瀏覽次數</title><desc>{daily.map(day => `${day.label}：${day.views} 次`).join("；")}</desc>
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#148c8b" stopOpacity=".2" /><stop offset="100%" stopColor="#148c8b" stopOpacity=".01" /></linearGradient></defs>
      {[36, 73, 111, 148].map(y => <line key={y} x1="15" x2="685" y1={y} y2={y} stroke="#e4ebef" strokeDasharray="4 5" />)}
      <path d={`${line} L${points.at(-1).x},148 L${points[0].x},148 Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="#148c8b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {daily.map((day, i) => <g key={day.label}>
        <circle cx={points[i].x} cy={points[i].y} r="4.5" fill="white" stroke="#148c8b" strokeWidth="2.5" />
        <text x={points[i].x} y={points[i].y - 14} textAnchor="middle" className="wm-chart-value">{day.views.toLocaleString("zh-TW")}</text>
        <text x={points[i].x} y="174" textAnchor="middle" className="wm-chart-date">{day.label}</text>
      </g>)}
    </svg>
  </div>;
}

function FormDetail({ row, saving, notice, onClose, onUpdate, canUpdate }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog.querySelector("button")?.focus();
    function onKey(event) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const targets = [...dialog.querySelectorAll('button:not(:disabled), a[href], select:not(:disabled), [tabindex="0"]')];
      const first = targets[0], last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    dialog.addEventListener("keydown", onKey);
    return () => { dialog.removeEventListener("keydown", onKey); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return createPortal(<div className="website-management wm-detail-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="wm-detail" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="wm-detail-header"><div><div className="wm-eyebrow">FORM DETAILS · 收件詳情</div><h2 id={titleId}>表單詳情 · {row.name}</h2></div><button className="wm-icon-button" aria-label="關閉表單詳情" onClick={onClose}><X size={20} /></button></header>
      <div className="wm-detail-body">
        <div className="wm-detail-topline"><span className={`wm-type ${row.type === "預約服務" ? "is-booking" : ""}`}>{row.type}</span><StatusBadge status={row.status} /></div>
        <h3 className="wm-detail-subject">{row.subject}</h3>
        <div className="wm-contact-card"><span className="wm-avatar">{Array.from(row.name || "客")[0]}</span><div><strong>{row.name}</strong><p>{row.company || "個人客戶"}</p></div></div>
        <dl className="wm-detail-grid">
          <div><dt><Phone size={14} />聯絡電話</dt><dd>{row.phone || "未提供"}</dd></div>
          <div><dt><Mail size={14} />電子信箱</dt><dd>{row.email || "未提供"}</dd></div>
          <div><dt><FileText size={14} />服務項目</dt><dd>{row.service || "未指定"}</dd></div>
          <div><dt><MapPin size={14} />服務地點</dt><dd>{row.location || "未提供"}</dd></div>
        </dl>
        {row.type === "預約服務" && <div className="wm-booking-note"><CalendarDays size={18} /><div><strong>希望服務日期與時段</strong><p>{row.preferredDate ? new Intl.DateTimeFormat("zh-TW-u-ca-roc", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${row.preferredDate}T12:00:00`)) : "未指定日期"} · {row.preferredTime || "未指定時段"}</p><small>此為客戶希望的時間，實際安排須另行確認。</small></div></div>}
        <section className="wm-message-section"><h3>需求說明</h3><p className="wm-message">{row.message || "未填寫需求說明"}</p></section>
        <div className="wm-detail-meta"><span>送出時間：{websiteDate(row.receivedAt)}</span><span>來源：{row.source || "網站表單"}</span></div>
      </div>
      <footer className="wm-detail-footer"><label>處理狀態<select aria-label="處理狀態" disabled={saving || !canUpdate} value={row.status} onChange={e => onUpdate(e.target.value)}>{FORM_STATUSES.map(s => <option key={s}>{s}</option>)}</select></label><span role="status" className="wm-save-notice">{saving ? "儲存中…" : notice || (canUpdate ? "選擇狀態後自動儲存" : "目前無法變更狀態")}</span></footer>
    </section>
  </div>, document.body);
}

// Keep presentation shared with the isolated preview; live data stays in WebsiteInbox.
export default function WebsiteManagement({ rows = [], analytics = null, analyticsError = '', analyticsLoading = false, selectedMonth, onMonthChange, preview = false, connected = false, intakeEnabled = false, error = '', onUpdate, initialMonth = taipeiMonth(new Date()), toolbar }) {
  const [localMonth, setLocalMonth] = useState(initialMonth);
  const month = selectedMonth ?? localMonth;
  function setMonth(value) { setLocalMonth(value); onMonthChange?.(value); }
  const [status, setStatus] = useState("全部");
  const [type, setType] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const inboxRef = useRef(null);
  const activeId = useRef(selectedId);
  activeId.current = selectedId;
  const selected = rows.find(row => row.id === selectedId);
  const filtered = filterWebsiteForms(rows, { month, status, type, keyword });
  const monthRows = filterWebsiteForms(rows, { month });
  const summary = websiteSummary(rows, month);
  const metrics = analytics?.month === month ? analytics : null;
  const types = [...new Set(rows.map(row => row.type).filter(Boolean))];
  const hasInbox = preview || connected;
  const counts = FORM_STATUSES.map(s => monthRows.filter(row => row.status === s).length);
  const currentYear = Number(taipeiMonth(new Date()).slice(0, 4));
  const years = [...new Set([...Array.from({ length: 7 }, (_, i) => currentYear + 1 - i), ...rows.map(row => Number(taipeiMonth(row.receivedAt).slice(0, 4))), Number(month.slice(0, 4))])].filter(year => year > 1911).sort((a, b) => b - a);
  const periodLabel = month ? `民國 ${Number(month.slice(0,4)) - 1911} 年 ${Number(month.slice(5))} 月` : "全部月份";
  const connectionLabel = preview ? "模擬模式" : connected ? intakeEnabled ? "自動收件中" : "公開送件待啟用" : "尚未串接網站";
  function focusInbox(nextStatus = "全部") {
    setStatus(nextStatus); setType("全部"); setKeyword("");
    inboxRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    inboxRef.current?.focus({ preventScroll: true });
  }
  async function update(nextStatus) {
    if (!selected || !onUpdate) return;
    const id = selected.id;
    setSaving(true); setNotice("");
    try {
      await onUpdate(id, nextStatus);
      if (activeId.current === id) setNotice(preview ? "已更新測試狀態（不影響正式資料）" : "已更新處理狀態");
    } catch(error) { if (activeId.current === id) setNotice(error.message || "儲存失敗，請稍後重試。"); }
    finally { setSaving(false); }
  }
  return <section className="website-management">
    <header className="wm-heading">
      <div className="wm-heading-copy"><div className="wm-eyebrow"><span />WEBSITE OPERATIONS · 網站營運</div><h1>網站資訊管理</h1><p>從網站流量到客戶需求，每一個接觸都清楚掌握。</p></div>
      <div className="wm-heading-side"><div className={`wm-connection-pill ${preview ? "is-preview" : connected && intakeEnabled ? "is-connected" : "is-offline"}`}><i />{connectionLabel}</div><button className="wm-hero-link" onClick={() => focusInbox("待處理")}>前往處理收件 <ArrowRight size={15} /></button></div>
    </header>
    {preview && <div className="wm-preview-notice"><ShieldCheck size={15} /><span>測試預覽｜所有數字與表單皆為模擬資料；重新整理會重設。</span></div>}
    {error && <div role="alert" className="wm-error"><AlertCircle size={17} /><span>{error}</span></div>}
    {analyticsError && <div role="alert" className="wm-error"><AlertCircle size={17} /><span>流量統計：{analyticsError}（不影響表單收件）</span></div>}
    <div className="wm-period-bar"><div className="wm-period-control"><CalendarDays size={17} /><span>統計月份</span><div className="wm-month-selects"><select aria-label="統計年份" value={month.slice(0, 4)} onChange={e => setMonth(e.target.value ? `${e.target.value}-${month.slice(5) || taipeiMonth(new Date()).slice(5)}` : "")}><option value="">全部年份</option>{years.map(year => <option key={year} value={year}>民國 {year - 1911} 年</option>)}</select><select aria-label="統計月份" value={month.slice(5)} onChange={e => setMonth(e.target.value ? `${month.slice(0, 4) || currentYear}-${e.target.value}` : "")}><option value="">全部月份</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, "0")}>{i + 1} 月</option>)}</select></div><button className="wm-clear-month" onClick={() => setMonth("")}>顯示全部</button></div><div className="wm-page-actions">{toolbar}</div></div>
    <div className="wm-stats">{[
      ["網頁瀏覽次數", metrics?.views, Globe, "頁面開啟次數", "teal", "PAGE VIEWS"],
      ["網站訪客數", metrics?.visitors, Users, "Vercel 訪客估計值，非實名人數", "blue", "VISITORS"],
      ["收到表單", hasInbox ? summary.total : null, Inbox, "所選期間收到的客戶需求", "violet", "FORM SUBMISSIONS"],
      ["待處理表單", hasInbox ? summary.pending : null, Clock, "尚未開始處理，請安排聯繫", "amber", "AWAITING RESPONSE"],
    ].map(([label, value, Icon, caption, color, english]) => <article className={`wm-stat ${color}`} key={label}><div className="wm-stat-top"><span>{label}</span><span className="wm-stat-icon"><Icon size={19} /></span></div><div className="wm-stat-value"><strong>{value == null ? "—" : value.toLocaleString("zh-TW")}</strong><span>{label === "網頁瀏覽次數" ? "次" : label === "網站訪客數" ? "人次" : "筆"}</span></div><small>{value == null ? analyticsLoading && color !== "violet" && color !== "amber" ? "正在讀取流量…" : "尚無統計資料" : caption}</small><div className="wm-stat-label">{english}</div></article>)}</div>
    <div className="wm-overview">
      <article className="wm-panel wm-traffic"><div className="wm-panel-heading"><div><div className="wm-section-kicker">TRAFFIC OVERVIEW</div><h2>網站瀏覽趨勢</h2></div><span className="wm-legend"><i />瀏覽次數</span></div><div className="wm-chart-caption">{metrics ? preview ? "最近 7 日 · 模擬" : "所選月份最後 7 日 · UTC" : analyticsLoading ? "讀取中…" : "尚無流量統計"}</div>
        {metrics ? <TrafficChart daily={metrics.daily} /> : <div className="wm-empty wm-chart-empty"><Activity size={30} /><strong>{analyticsLoading ? "正在取得網站流量" : month ? "尚無可顯示的流量資料" : "請先選擇統計月份"}</strong><span>{month ? "取得真實流量後顯示趨勢；讀取失敗不會以 0 取代。" : "表單可查看全部月份，流量統計需指定月份。"}</span></div>}
        <div className="wm-panel-footnote"><Activity size={14} /><span>{preview ? "流量為示範數據，僅供版面預覽。" : "來源：Vercel · 流量日期依 UTC 計算，每 5 分鐘更新；啟用前無法回補，訪客可能跨日重複計算。"}</span></div>
      </article>
      <article className="wm-panel wm-progress"><div className="wm-panel-heading"><div><div className="wm-section-kicker">FOLLOW-UP STATUS</div><h2>收件處理進度</h2></div><span className="wm-panel-symbol"><Inbox size={19} /></span></div><p className="wm-progress-caption">{periodLabel} · 掌握需求處理狀況</p>
        <div className="wm-progress-list">{FORM_STATUSES.map((s, i) => <button key={s} className={`wm-progress-item status-${i}`} onClick={() => focusInbox(s)}><span className="wm-progress-label"><span><i />{s}</span><strong>{hasInbox ? counts[i] : "—"}<small> 筆</small><ArrowUpRight size={14} /></strong></span><span className="wm-progress-track"><span style={{width:`${summary.total ? counts[i] / summary.total * 100 : 0}%`}} /></span></button>)}</div>
        <div className="wm-progress-note"><ShieldCheck size={14} />狀態由處理人員更新，保留每一筆需求。</div>
      </article>
    </div>
    <article className="wm-panel wm-inbox" ref={inboxRef} tabIndex={-1} aria-label="表單收件清單">
      <div className="wm-inbox-heading"><div><div className="wm-section-kicker">CUSTOMER INBOX</div><h2>表單收件 <span className="wm-count">{filtered.length} 筆</span></h2><p>集中檢視詢價與預約，追蹤客戶需求的下一步。</p></div><label className="wm-search"><Search size={17} /><input aria-label="搜尋表單" placeholder="搜尋姓名、公司、電話或內容" value={keyword} onChange={e => setKeyword(e.target.value)} />{keyword && <button className="wm-icon-button" aria-label="清除搜尋" onClick={() => setKeyword("")}><X size={14} /></button>}</label></div>
      <div className="wm-inbox-filters"><div className="wm-tabs" aria-label="依處理狀態篩選">{["全部", ...FORM_STATUSES].map((s, i) => <button aria-pressed={status === s} key={s} onClick={() => setStatus(s)}>{s}<span>{hasInbox ? i === 0 ? summary.total : counts[i - 1] : "—"}</span></button>)}</div><label className="wm-type-filter"><SlidersHorizontal size={15} />表單類型<select aria-label="表單類型" value={type} onChange={e => setType(e.target.value)}><option>全部</option>{types.map(t => <option key={t}>{t}</option>)}</select></label></div>
      <div className="wm-table-wrap"><table><thead><tr>{["送出時間", "客戶／公司", "表單類型", "需求內容", "聯絡方式", "狀態", "操作"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{filtered.map(row => <tr key={row.id} className={row.status === "待處理" ? "wm-unread" : ""}>
        <td data-label="送出時間" className="wm-date-cell">{websiteDate(row.receivedAt)}</td><td data-label="客戶／公司" className="wm-customer"><strong>{row.name}</strong><small>{row.company || "個人客戶"}</small></td><td data-label="表單類型"><span className={`wm-type ${row.type === "預約服務" ? "is-booking" : ""}`}>{row.type}</span></td><td data-label="需求內容" className="wm-subject">{row.subject}</td><td data-label="聯絡方式" className="wm-contact">{row.phone || "—"}<small>{row.email}</small></td><td data-label="狀態"><StatusBadge status={row.status} /></td><td data-label="操作"><button className="wm-view-button" aria-label={`查看 ${row.name} 的表單`} onClick={() => { setSelectedId(row.id); setNotice(""); }}>查看<ArrowUpRight size={14} /></button></td>
      </tr>)}</tbody></table></div>
      {!filtered.length && <div className="wm-empty"><Inbox size={30} /><strong>{connected || preview ? "目前沒有符合條件的表單" : "尚未接收任何表單"}</strong><span>{preview ? "沒有符合條件的表單。可調整篩選或模擬送出一筆。" : connected ? "試著切換月份、處理狀態或搜尋條件。" : "待網站串接完成後，送件將顯示在這裡。"}</span>{(keyword || type !== "全部" || status !== "全部") && <button onClick={() => {setKeyword("");setType("全部");setStatus("全部");}}>清除搜尋與分類</button>}</div>}
      <footer className="wm-inbox-footer"><span><span className={`wm-live-dot ${!hasInbox ? "is-muted" : ""}`} />{preview ? "模擬收件 · 不影響正式資料" : connected ? intakeEnabled ? "自動收件已開啟 · 清單每 30 秒更新" : "收件資料庫已連接 · 公開送件尚未啟用" : "等待網站串接"}</span><span>顯示 {filtered.length} 筆／所選期間 {hasInbox ? summary.total : "—"} 筆</span></footer>
    </article>
    <section className="wm-workflow" aria-label="表單接收流程"><div className="wm-workflow-title"><ShieldCheck size={19} /><div><strong>表單接收流程</strong><span>需求集中管理，服務持續跟進</span></div></div><ol><li><span>01</span>客戶填寫網站表單</li><li><ArrowRight size={14} /><span>02</span>送入系統收件清單</li><li><ArrowRight size={14} /><span>03</span>追蹤處理與完成狀態</li></ol><p>{preview ? "可按「模擬表單送出」體驗完整收件流程。" : intakeEnabled ? "送件成功後自動收件；預約日期須由公司另行確認。" : "目前尚未啟用自動接收，不會收到正式網站送件。"}</p></section>
    {selected && <FormDetail key={selected.id} row={selected} saving={saving} notice={notice} canUpdate={!!onUpdate} onUpdate={update} onClose={() => setSelectedId(null)} />}
  </section>;
}
