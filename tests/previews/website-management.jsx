import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, Globe, Menu, Plus, X } from "lucide-react";
import WebsiteManagement from "../../src/WebsiteManagement.jsx";
import { taipeiMonth, FORM_STATUSES } from "../../src/websiteManagement.js";
import "./website-management.css";
import CompactPreviewNav from './CompactPreviewNav.jsx';

const now = new Date();
const month = taipeiMonth(now);
const names = ["林小姐（示範）", "陳先生（示範）", "黃小姐（示範）", "王先生（示範）", "蔡主任（示範）", "李小姐（示範）", "張先生（示範）", "吳經理（示範）"];
const services = ["清潔維護", "園藝與植栽維護", "環境消毒", "人力派遣", "其他 / 尚待討論"];
const sample = names.map((name, i) => ({ id: `demo-${i}`, name, company: ["示範社區管理委員會", "示範科技有限公司", "示範商務中心", "示範環境企業", "示範學校總務處", "示範大樓管理中心", "示範物流有限公司", "示範飯店管理部"][i], type: i === 6 ? "聯絡我們" : i % 2 ? "預約服務" : "服務詢價", service: services[i % services.length], location: "高雄市（示範服務地點）", preferredDate: i % 2 ? `${month}-28` : "", preferredTime: "上午", subject: ["社區環境清潔報價", "預約植栽修剪服務", "辦公大樓環境消毒", "人力支援預約", "校園病媒防治年度服務詢價", "公共空間清潔維護預約", "物流倉儲環境維護合作洽詢", "飯店周邊植栽定期養護"][i], message: "這是測試需求內容：希望了解服務範圍、施作時間及報價方式，請安排人員聯繫。\n\n場域預計安排定期維護，請提供合適的服務方案與作業建議。", email: `contact${i + 1}@example.com`, phone: "0900-000-000", receivedAt: new Date(now.getTime() - i * 3600000).toISOString(), status: FORM_STATUSES[i % 3], source: "歐克官網（模擬）" }));
const analytics = { month, views: 2486, visitors: 1032, daily: [186, 243, 210, 368, 295, 424, 381].map((views, i) => ({ views, label: new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit" }).format(new Date(now.getTime() - (6-i) * 86400000)) })) };
const nav = ["總覽儀表板", "人員管理", "薪資表管理", "廠商管理", "公文管理", "估價單", "發票", "收支管理", "契約管理", "每月請款追蹤", "車輛管理", "網站資訊管理", "打卡上下班", "帳務入口", "公司報表", "權限設定"];

function Preview() {
  const [rows, setRows] = useState(sample);
  const [showForm, setShowForm] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [message, setMessage] = useState("");
  const [reset, setReset] = useState(0);
  const [formType, setFormType] = useState("服務詢價");
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    if (!values.name.trim() || !values.phone.trim() || !values.location.trim()) return;
    setRows(previous => [{ ...values, subject: `${values.service} · ${values.type}`, id: crypto.randomUUID(), receivedAt: new Date().toISOString(), status: "待處理", source: "模擬歐克官網表單" }, ...previous]);
    setMessage("模擬表單已送入收件清單，狀態為「待處理」。");
    setReset(value => value + 1); // Reset filters so the newly received item is visible.
    setShowForm(false);
  }
  return <div className="wm-preview-shell">
    {mobileNav && <button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={() => setMobileNav(false)} />}
    <aside className={`wm-preview-sidebar ${mobileNav ? "open" : ""}`}><div className="wm-preview-brand"><Building2 size={26} /><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="側邊欄位置預覽">{nav.map((label, i) => <div key={label} className={label === "網站資訊管理" ? "active" : ""}><span>{String(i + 1).padStart(2, "0")}</span>{label}</div>)}</nav><footer>測試頁側欄僅示範排列位置<br />不連接正式系統資料</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={() => setMobileNav(value => !value)}><Menu size={20} /></button><Globe size={19} /><strong>網站資訊管理</strong><small>測試環境 · 尚未上傳正式版</small></header><main className="wm-preview-content">
      <CompactPreviewNav />
      {message && <div role="status" className="wm-preview-success">{message}<button aria-label="關閉提示" onClick={() => setMessage("")}><X size={14} /></button></div>}
      {showForm && <section className="website-management wm-panel wm-preview-form">
        <div className="wm-list-heading"><h2>模擬客戶填寫網站表單</h2><button aria-label="關閉模擬表單" onClick={() => setShowForm(false)}><X size={16} /></button></div>
        <p className="wm-muted">對照歐克官網詢價／預約欄位；請勿輸入真實個資。資料只保留在此測試頁記憶體中。</p>
        <form onSubmit={submit}><div className="wm-form-grid">
          <label>聯絡姓名<input name="name" required maxLength={80} defaultValue="測試客戶" /></label>
          <label>公司／單位名稱<input name="company" maxLength={120} defaultValue="測試公司" /></label>
          <label>聯絡電話<input name="phone" required maxLength={30} defaultValue="0900-000-000" /></label>
          <label>服務地點<input name="location" required maxLength={200} defaultValue="高雄市（測試地點）" /></label>
          <label>需求類型<select name="type" value={formType} onChange={e => setFormType(e.target.value)}><option>服務詢價</option><option>預約服務</option></select></label>
          <label>服務項目<select name="service">{services.map(s => <option key={s}>{s}</option>)}</select></label>
          {formType === "預約服務" && <><label>希望服務日期<input type="date" name="preferredDate" required /></label><label>希望時段<select name="preferredTime"><option>上午</option><option>下午</option><option>時間彈性，可再討論</option></select></label></>}
        </div><label>需求說明<textarea name="message" rows={3} maxLength={4000} defaultValue="希望了解定期環境維護的方案與報價，請與我聯繫。" /></label><button className="wm-primary" type="submit">送出模擬表單</button></form>
      </section>}
      <WebsiteManagement key={reset} preview rows={rows} analytics={analytics} initialMonth={month} onUpdate={async (id, status) => { setRows(previous => previous.map(row => row.id === id ? { ...row, status } : row)); }} toolbar={<button className="wm-primary" onClick={() => setShowForm(true)}><Plus size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />模擬表單送出</button>} />
    </main></div>
  </div>;
}
if (import.meta.env.DEV || import.meta.env.MODE === 'design-preview') createRoot(document.getElementById("root")).render(<Preview />);
