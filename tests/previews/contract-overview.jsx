import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, FileSignature, Menu, ShieldCheck, X } from "lucide-react";
import ContractOverview from "../../src/ContractOverview.jsx";
import ContractFilters from "../../src/ContractFilters.jsx";
import { contractOverviewFixture } from "../fixtures/contract-overview.js";
import "./website-management.css";
import "./dashboard-overview.css";

const nav = ["總覽儀錶板", "人員管理", "薪資表管理", "廠商管理", "公文管理", "估價單", "發票", "收支管理", "契約管理", "每月請款追蹤", "車輛管理", "網站資訊管理", "打卡上下班", "帳務入口", "公司報表", "權限設定"];
function Preview() {
  const [year, setYear] = useState("2026");
  const [mode, setMode] = useState("normal");
  const [navOpen, setNavOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [company,setCompany] = useState("全部");
  const [query,setQuery] = useState("");
  const companies = ["全部","綠石環保","歐克環境","上藝除蟲","維娜科技","其他"];
  const samples = companies.slice(1).map((name,i)=>({id:i,no:`CT-DEMO-00${i+1}`,title:`${name}環境清潔示範契約`,company:name,start:i===0?"2025":"2026",end:i===0?"2026":"2027",amount:120000+i*10000}));
  const rows = (mode === "empty" ? [] : samples).filter(r=>(year === "全部" || r.start<=year && r.end>=year) && (company === "全部" || r.company===company) && (r.no+r.title+"示範客戶").toLowerCase().includes(query.toLowerCase()));
  const fixture=contractOverviewFixture(year,mode);
  return <div className="wm-preview-shell dashboard-preview-shell">
    {navOpen && <button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={() => setNavOpen(false)} />}
    <aside className={`wm-preview-sidebar ${navOpen ? "open" : ""}`}><div className="wm-preview-brand"><Building2 size={26} /><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="側邊欄位置預覽">{nav.map((label, i) => <div key={label} className={label === "契約管理" ? "active" : ""}><span>{String(i + 1).padStart(2, "0")}</span>{label}</div>)}</nav><footer>側欄僅示範位置 · 不進入正式資料<br />契約管理上方區塊改版</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={() => setNavOpen(value => !value)}><Menu size={20} /></button><FileSignature size={19} /><strong>契約管理</strong><small>測試環境 · 尚未更新正式版</small></header><main className="wm-preview-content">
      <div className="dashboard-preview-controls"><p><ShieldCheck size={16} />僅供版面預覽 · 全部為模擬資料，不讀寫正式契約</p><label>測試情境 <select aria-label="測試情境" value={mode} onChange={event => setMode(event.target.value)}><option value="normal">一般資料</option><option value="many">多個年度</option><option value="large">大額金額</option><option value="empty">沒有契約</option></select></label></div>
      {message && <div className="dashboard-preview-message" role="status">{message}<button aria-label="關閉提示" onClick={() => setMessage("")}><X size={15} /></button></div>}
      <ContractOverview {...fixture} hideYearFilter totalCount={mode === "empty" ? 0 : samples.length} activeCount={mode === "empty" ? 0 : samples.length} expiringCount={0} filteredCount={rows.length} totalAmount={rows.reduce((s,r)=>s+r.amount,0)} onYearChange={setYear} onNew={() => setMessage("新增按鈕已連接；此頁只示範外觀，不建立正式契約。")} />
      <ContractFilters count={rows.length} company={company} companies={companies} onCompanyChange={setCompany} year={year} years={fixture.yearTabs} onYearChange={setYear} formatYear={fixture.formatYear} query={query} onQueryChange={setQuery}/>
      <div style={{overflowX:"auto",background:"white",border:"1px solid #e1e7ed",borderRadius:12}}><table aria-label="示範契約清單" style={{width:"100%",borderCollapse:"collapse",fontSize:14,textAlign:"left"}}><thead style={{background:"#eef5f8",color:"#4d6677"}}><tr>{["契約編號","契約名稱","承攬公司","起訖日期","契約金額"].map(label=><th key={label} style={{padding:12,whiteSpace:"nowrap"}}>{label}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} style={{borderTop:"1px solid #edf1f5"}}><td style={{padding:12,whiteSpace:"nowrap"}}>{r.no}</td><td style={{padding:12}}>{r.title}</td><td style={{padding:12,whiteSpace:"nowrap"}}>{r.company}</td><td style={{padding:12,whiteSpace:"nowrap"}}>{Number(r.start)-1911}/01/01 — {Number(r.end)-1911}/12/31</td><td style={{padding:12,whiteSpace:"nowrap"}}>{fixture.formatMoney(r.amount)}</td></tr>)}</tbody></table>{!rows.length && <p style={{padding:16,color:"#65768a"}}>沒有符合篩選條件的示範契約</p>}</div>
      <p style={{ margin: "18px 0 0", color: "#65768a", fontSize: 12 }}>篩選順序：承攬公司 → 契約年度 → 關鍵字搜尋。全部為模擬資料，不讀寫正式契約。</p>
    </main></div>
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview />);
