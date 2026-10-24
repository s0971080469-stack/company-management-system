import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, HandCoins, Menu, ShieldCheck, X } from "lucide-react";
import BillingOverview from "../../src/BillingOverview.jsx";
import BillingFilters from "../../src/BillingFilters.jsx";
import { billingFixture } from "../fixtures/billing-overview.js";
import "./website-management.css";
import "./dashboard-overview.css";
import CompactPreviewNav from './CompactPreviewNav.jsx';

const nav = ["總覽儀錶板", "人員管理", "薪資表管理", "廠商管理", "公文管理", "估價單", "發票", "收支管理", "契約管理", "每月請款追蹤", "車輛管理", "網站資訊管理", "打卡上下班", "帳務入口", "公司報表", "權限設定"];
const companies = ["全部", "綠石環保", "歐克環境", "上藝除蟲", "維娜科技", "其他"];
const sampleRows = [
  {id:1,company:"綠石環保",date:"2026-10-05",planned:"2026-11-05",name:"示範清潔服務",amount:32000},
  {id:2,company:"歐克環境",date:"2026-10-12",planned:"2026-10-25",name:"示範設備項目",amount:18600},
  {id:3,company:"上藝除蟲",date:"2026-09-20",planned:"2026-10-20",name:"示範環境維護",amount:8500},
];
function PreviewMonth({month,onChange,payment}) {
  const [year,part] = (month || "2026-10").split("-");
  const controlStyle = {border:"1px solid #d4dfe8",borderRadius:8,background:"#fff",color:"#203047",font:"inherit",cursor:"pointer"};
  return <div className="month-filter-bar" style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:13,color:"#65768a"}}>{payment ? "預訂付款月份" : "日期月份"}</span>
    <select style={controlStyle} aria-label="篩選年份" value={month ? year : ""} onChange={e=>onChange(e.target.value ? `${e.target.value}-${part}` : "")}><option value="">全部年</option>{[2025,2026,2027].map(y=><option key={y} value={y}>{y-1911} 年</option>)}</select>
    <select style={controlStyle} aria-label="篩選月份" value={month ? part : ""} onChange={e=>onChange(e.target.value ? `${year}-${e.target.value}` : "")}><option value="">全部月</option>{Array.from({length:12},(_,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{i+1} 月</option>)}</select>
    <button style={controlStyle} type="button" onClick={()=>onChange("")}>顯示全部</button>
  </div>;
}
function Preview() {
  const [expenseTab, setExpenseTab] = useState("銀行入帳");
  const [month,setMonth] = useState("2026-10");
  const [company,setCompany] = useState("全部");
  const [mode, setMode] = useState("normal");
  const [navOpen, setNavOpen] = useState(false);
  const [message, setMessage] = useState("");
  const rows = (mode === "empty" ? [] : sampleRows).filter(row => (!month || (expenseTab === "公司付款" ? row.planned : row.date).startsWith(month)) && (expenseTab === "零用金" || company === "全部" || row.company === company));
  const newLabel = expenseTab === "零用金" ? "新增零用金紀錄" : expenseTab === "銀行入帳" ? "新增銀行入帳紀錄" : "新增公司應付款項";
  return <div className="wm-preview-shell dashboard-preview-shell">
    {navOpen && <button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={() => setNavOpen(false)} />}
    <aside className={`wm-preview-sidebar ${navOpen ? "open" : ""}`}><div className="wm-preview-brand"><Building2 size={26} /><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="側邊欄位置預覽">{nav.map((label, i) => <div key={label} className={label === "收支管理" ? "active" : ""}><span>{String(i + 1).padStart(2, "0")}</span>{label}</div>)}</nav><footer>側欄僅示範位置 · 不進入正式資料<br />收支管理上方區塊改版</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={() => setNavOpen(value => !value)}><Menu size={20} /></button><HandCoins size={19} /><strong>收支管理</strong><small>測試環境 · 尚未更新正式版</small></header><main className="wm-preview-content">
      <CompactPreviewNav />
      <div className="dashboard-preview-controls"><p><ShieldCheck size={16} />僅供版面預覽 · 全部為模擬資料，不讀寫正式帳務</p><label>測試情境 <select aria-label="測試情境" value={mode} onChange={event => setMode(event.target.value)}><option value="normal">一般資料</option><option value="overdue">逾期提醒／負餘額</option><option value="many">多筆付款提醒</option><option value="empty">沒有紀錄</option></select></label></div>
      {message && <div className="dashboard-preview-message" role="status">{message}<button aria-label="關閉提示" onClick={() => setMessage("")}><X size={15} /></button></div>}
      <BillingOverview {...billingFixture(mode)} expenseTab={expenseTab} onTabChange={setExpenseTab} newLabel={newLabel} onNew={() => setMessage(`「${newLabel}」按鈕已連接；此頁只示範外觀，不新增正式紀錄。`)} />
      <BillingFilters expenseTab={expenseTab} count={rows.length} company={company} companies={companies} onCompanyChange={setCompany} monthControl={<PreviewMonth month={month} onChange={setMonth} payment={expenseTab === "公司付款"}/>}/>
      <div style={{overflowX:"auto",background:"white",border:"1px solid #e1e7ed",borderRadius:12}}><table aria-label="示範收支清單" style={{width:"100%",borderCollapse:"collapse",fontSize:14,textAlign:"left"}}><thead style={{background:"#eef5f8",color:"#4d6677"}}><tr>{["日期","項目／說明",...(expenseTab === "零用金" ? [] : [expenseTab === "公司付款" ? "付款公司" : "入帳公司"]),"金額"].map(label=><th key={label} style={{padding:12,whiteSpace:"nowrap"}}>{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} style={{borderTop:"1px solid #edf1f5"}}><td style={{padding:12,whiteSpace:"nowrap"}}>115/{(expenseTab === "公司付款" ? row.planned : row.date).slice(5).replace("-","/")}</td><td style={{padding:12}}>{row.name}</td>{expenseTab !== "零用金" && <td style={{padding:12,whiteSpace:"nowrap"}}>{row.company}</td>}<td style={{padding:12,whiteSpace:"nowrap"}}>NT$ {row.amount.toLocaleString("zh-TW")}</td></tr>)}</tbody></table>{!rows.length && <p style={{padding:16,color:"#65768a"}}>沒有符合篩選條件的示範紀錄</p>}</div>
      <p style={{ margin: "18px 0 0", color: "#65768a", fontSize: 12 }}>本次調整下方篩選區；上方概況使用固定示範數值。正式系統的核准、付款與帳務計算不變。</p>
    </main></div>
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview />);
