import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, FileSignature, Menu, ShieldCheck, X } from "lucide-react";
import ContractOverview from "../../src/ContractOverview.jsx";
import { contractOverviewFixture } from "../fixtures/contract-overview.js";
import "./website-management.css";
import "./dashboard-overview.css";

const nav = ["總覽儀錶板", "人員管理", "薪資表管理", "廠商管理", "公文管理", "估價單", "發票", "收支管理", "契約管理", "每月請款追蹤", "車輛管理", "網站資訊管理", "打卡上下班", "帳務入口", "公司報表", "權限設定"];
function Preview() {
  const [year, setYear] = useState("2026");
  const [mode, setMode] = useState("normal");
  const [navOpen, setNavOpen] = useState(false);
  const [message, setMessage] = useState("");
  return <div className="wm-preview-shell dashboard-preview-shell">
    {navOpen && <button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={() => setNavOpen(false)} />}
    <aside className={`wm-preview-sidebar ${navOpen ? "open" : ""}`}><div className="wm-preview-brand"><Building2 size={26} /><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="側邊欄位置預覽">{nav.map((label, i) => <div key={label} className={label === "契約管理" ? "active" : ""}><span>{String(i + 1).padStart(2, "0")}</span>{label}</div>)}</nav><footer>側欄僅示範位置 · 不進入正式資料<br />契約管理上方區塊改版</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={() => setNavOpen(value => !value)}><Menu size={20} /></button><FileSignature size={19} /><strong>契約管理</strong><small>測試環境 · 尚未更新正式版</small></header><main className="wm-preview-content">
      <div className="dashboard-preview-controls"><p><ShieldCheck size={16} />僅供版面預覽 · 全部為模擬資料，不讀寫正式契約</p><label>測試情境 <select aria-label="測試情境" value={mode} onChange={event => setMode(event.target.value)}><option value="normal">一般資料</option><option value="many">多個年度</option><option value="large">大額金額</option><option value="empty">沒有契約</option></select></label></div>
      {message && <div className="dashboard-preview-message" role="status">{message}<button aria-label="關閉提示" onClick={() => setMessage("")}><X size={15} /></button></div>}
      <ContractOverview {...contractOverviewFixture(year, mode)} onYearChange={setYear} onNew={() => setMessage("新增按鈕已連接；此頁只示範外觀，不建立正式契約。")} />
      <p style={{ margin: "22px 0 0", paddingTop: 17, borderTop: "1px dashed #ced8e0", color: "#65768a", fontSize: 12, lineHeight: 1.8 }}>本次調整範圍：頁面標頭、四項統計卡與年度切換。下方公司篩選、搜尋、契約清單及編輯功能維持原樣。</p>
    </main></div>
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview />);
