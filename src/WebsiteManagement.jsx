import React, { useEffect, useRef, useState } from "react";
import { Globe, Users, Inbox, Clock, Search, ArrowDownLeft, X } from "lucide-react";
import { FORM_STATUSES, filterWebsiteForms, taipeiMonth, websiteSummary, websiteDate } from "./websiteManagement.js";
import "./WebsiteManagement.css";

// Public intake and authenticated inbox use separate server permissions.
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
  const detailRef = useRef(null);
  useEffect(() => { detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [selectedId]);
  const selected = rows.find(row => row.id === selectedId);
  const filtered = filterWebsiteForms(rows, { month, status, type, keyword });
  const summary = websiteSummary(rows, month);
  const metrics = analytics?.month === month ? analytics : null;
  const types = [...new Set(rows.map(row => row.type))];
  async function update(nextStatus) {
    if (!selected || !onUpdate) return;
    setSaving(true); setNotice("");
    try {
      await onUpdate(selected.id, nextStatus);
      setNotice(preview ? "已更新測試狀態（不影響正式資料）" : "已更新處理狀態");
    } catch(error) { setNotice(error.message || "儲存失敗，請稍後重試。"); }
    finally { setSaving(false); }
  }
  return <section className="website-management">
    <header className="wm-heading"><div><div className="wm-eyebrow">WEBSITE · 網站營運</div><h1>網站資訊管理</h1><p>掌握網站瀏覽與客戶表單，集中追蹤每一筆需求。</p></div>{toolbar}</header>
    <div className="wm-connection"><Globe size={18} /><span>{preview ? "測試預覽｜所有數字與表單皆為模擬資料；重新整理會重設。" : connected ? `收件資料庫已連接｜${intakeEnabled ? '自動收件已開啟，清單每 30 秒更新。' : '公開送件尚未啟用。'} ${metrics ? '流量來源：Vercel，僅計算正式官網。' : analyticsLoading ? '流量統計讀取中…' : '流量數字尚未取得。'}` : "尚未串接網站｜確認公司網站網址與表單來源後，才能接收真實資料與瀏覽統計。"}</span><span className="wm-connection-tag">{preview ? "模擬模式" : connected ? intakeEnabled ? "收件中" : "待啟用" : "未連接"}</span></div>
    {error && <p role="alert" style={{color:'#b23a2e'}}>{error}</p>}
    {analyticsError && <p role="alert" style={{color:'#b23a2e'}}>流量統計：{analyticsError}（不影響表單收件）</p>}
    <div className="wm-toolbar"><label>統計月份 <input aria-label="統計月份" type="month" value={month} onChange={e => setMonth(e.target.value)} /></label><button onClick={() => setMonth("")}>顯示全部</button><span className="wm-muted">{month ? `民國 ${Number(month.slice(0,4)) - 1911} 年 ${Number(month.slice(5))} 月` : "全部月份（瀏覽統計需選擇月份）"}</span></div>
    <div className="wm-stats">{[
      ["網頁瀏覽次數", metrics?.views, Globe, "頁面開啟次數", "brass"],
      ["網站訪客數", metrics?.visitors, Users, "Vercel 訪客估計值，非實名人數", "blue"],
      ["收到表單", preview || connected ? summary.total : null, Inbox, "所選月份的表單總數", "purple"],
      ["待處理表單", preview || connected ? summary.pending : null, Clock, "尚未開始處理的需求", "orange"],
    ].map(([label, value, Icon, caption, color]) => <article className={`wm-stat ${color}`} key={label}><div><span>{label}</span><Icon size={18} /></div><strong>{value == null ? "—" : value.toLocaleString("zh-TW")}</strong><small>{value == null ? "尚無統計資料" : caption}</small></article>)}</div>
    <div className="wm-overview"><article className="wm-panel"><h2>瀏覽趨勢 <small>{metrics ? preview ? "最近 7 日 · 模擬" : "所選月份最後 7 日 · UTC" : analyticsLoading ? "讀取中…" : "尚無流量統計"}</small></h2>{metrics ? <div className="wm-chart" aria-label="最近七日網頁瀏覽次數">{metrics.daily.map(day => <div key={day.label}><span>{day.views}</span><div style={{ height: `${day.views ? Math.max(4, day.views / Math.max(...metrics.daily.map(d => d.views), 1) * 90) : 0}px` }} /><small>{day.label}</small></div>)}</div> : <p className="wm-empty">{month ? '取得真實流量後顯示趨勢；讀取失敗不會以 0 取代。' : '請先選擇統計月份。'}</p>}{metrics && !preview && <p className="wm-muted">流量日期依 Vercel UTC 計算，每 5 分鐘更新；啟用前的流量無法回補。訪客可能跨日重複計算。</p>}</article>
    <article className="wm-panel"><h2>表單接收流程</h2><div className="wm-flow"><span>客戶填寫網站表單</span><ArrowDownLeft size={16} /><span>送入系統收件清單</span><ArrowDownLeft size={16} /><span>追蹤處理與完成狀態</span></div><p className="wm-muted">{preview ? "可按右上角「模擬表單送出」體驗收件流程。" : intakeEnabled ? "送件成功後自動收件；預約日期須由公司另行確認。" : "目前尚未啟用自動接收，不會收到正式網站送件。"}</p></article></div>
    <article className="wm-panel wm-inbox"><div className="wm-list-heading"><h2>表單收件 <small>{filtered.length} 筆</small></h2><label className="wm-search"><Search size={16} /><input aria-label="搜尋表單" placeholder="搜尋姓名、公司、電話或內容" value={keyword} onChange={e => setKeyword(e.target.value)} /></label></div>
      <div className="wm-toolbar"><div className="wm-tabs">{["全部", ...FORM_STATUSES].map(s => <button aria-pressed={status === s} key={s} onClick={() => setStatus(s)}>{s}</button>)}</div><label>表單類型 <select aria-label="表單類型" value={type} onChange={e => setType(e.target.value)}><option>全部</option>{types.map(t => <option key={t}>{t}</option>)}</select></label></div>
      <div className="wm-table-wrap"><table><thead><tr>{["送出時間", "客戶／公司", "表單類型", "需求內容", "聯絡方式", "狀態", "操作"].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td>{websiteDate(row.receivedAt)}</td><td><strong>{row.name}</strong><small>{row.company || "—"}</small></td><td>{row.type}</td><td className="wm-subject">{row.subject}</td><td>{row.phone || "—"}<small>{row.email}</small></td><td><span className={`wm-status status-${FORM_STATUSES.indexOf(row.status)}`}>{row.status}</span></td><td><button aria-label={`查看 ${row.name} 的表單`} onClick={() => { setSelectedId(row.id); setNotice(""); }}>查看</button></td></tr>)}</tbody></table></div>
      {!filtered.length && <p className="wm-empty">{preview ? "沒有符合條件的表單。可調整篩選或模擬送出一筆。" : connected ? "目前沒有符合篩選條件的表單。" : "尚未接收任何表單。待網站串接完成後，送件將顯示在這裡。"}</p>}
    </article>
    {selected && <article ref={detailRef} className="wm-panel wm-detail" aria-label="表單詳細內容">
      <div className="wm-list-heading"><h2>表單詳情 · {selected.name}</h2><button aria-label="關閉表單詳情" onClick={() => setSelectedId(null)}><X size={16} /></button></div>
      <p><strong>{selected.subject}</strong> · {selected.company || "個人"}</p>
      <p>服務項目：{selected.service || "—"}｜服務地點：{selected.location || "—"}</p>
      {selected.type === "預約服務" && <p>希望服務日期：{selected.preferredDate ? new Intl.DateTimeFormat("zh-TW-u-ca-roc", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${selected.preferredDate}T12:00:00`)) : "未指定"}｜時段：{selected.preferredTime || "未指定"}<small className="wm-muted">（實際安排須另行確認）</small></p>}
      <p className="wm-message">{selected.message || "未填寫需求說明"}</p>
      <p className="wm-muted">送出時間：{websiteDate(selected.receivedAt)}｜來源：{selected.source || "網站表單"}</p>
      <div className="wm-toolbar"><label>處理狀態 <select aria-label="處理狀態" disabled={saving || !onUpdate} value={selected.status} onChange={e => update(e.target.value)}>{FORM_STATUSES.map(s => <option key={s}>{s}</option>)}</select></label><span role="status">{saving ? "儲存中…" : notice}</span></div>
    </article>}
  </section>;
}
