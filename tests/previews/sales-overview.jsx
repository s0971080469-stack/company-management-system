import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import {Building2, Menu} from "lucide-react";
import {SalesOverview, SalesFilters} from "../../src/SalesOverview.jsx";
import {quoteOverviewStats, invoiceOverviewStats} from "../../src/salesOverview.js";
import InvoiceOverdueReminder from "../../src/InvoiceOverdueReminder.jsx";
import {getInvoiceReminders} from "../../src/invoiceReminders.js";
import {matchesInvoiceKeyword} from "../../src/invoiceSearch.js";
import BillingOverview from "../../src/BillingOverview.jsx";
import {billingFixture} from "../fixtures/billing-overview.js";
import {salesFixture, salesCompanies, salesCompanyColor, salesMoney, salesDate, salesMonth, quoteAmount, invoiceAmount} from "../fixtures/sales-overview.js";
import "./website-management.css";
import "./workforce-overview.css";
import "./office-overview.css";
import "./sales-overview.css";

const pages={quotes:"估價單",invoices:"發票",billing:"收支管理（風格參考）"};
function Preview(){
  const [page,setPage]=useState("quotes"), [mode,setMode]=useState("normal"), [nav,setNav]=useState(false), [message,setMessage]=useState("");
  const [company,setCompany]=useState("全部"), [query,setQuery]=useState(""), [month,setMonth]=useState("2026-10"), [billingTab,setBillingTab]=useState("銀行入帳");
  const {quotes,invoices}=salesFixture(mode); const invoice=page==="invoices";
  const companyTabs=invoice?["全部",...salesCompanies]:["全部",...new Set(quotes.map(q=>q.companyName).filter(Boolean)),...(quotes.some(q=>!q.companyName)?["未填公司"]:[])];
  const rows=(invoice?invoices:quotes).filter(row=>{
    if(company==="未填公司"&&row.companyName) return false;
    if(company!=="全部"&&company!=="未填公司"&&row.companyName!==company) return false;
    if(invoice) return (!month||row.date.startsWith(month))&&matchesInvoiceKeyword(row,query);
    return row.client.toLowerCase().includes(query.toLowerCase());
  });
  const grouped=[...new Set(rows.map(r=>r.date.slice(0,7)))].sort().reverse();
  const pick=key=>{setPage(key);setCompany("全部");setQuery("");setMessage("");setNav(false);};
  const action=name=>()=>setMessage(`${name}按鈕已連接。這是示範預覽，不新增、修改正式資料或發送通知。`);
  const monthControl=<div className="month-filter-bar sales-demo-month"><span>開立日期月份</span><select aria-label="開立年份" value={month.slice(0,4)} onChange={e=>setMonth(e.target.value?`${e.target.value}-${month.slice(5)||"10"}`:"")}><option value="">年</option><option value="2026">115 年</option><option value="2025">114 年</option></select><select aria-label="開立月份" value={month.slice(5)} onChange={e=>setMonth(e.target.value?`${month.slice(0,4)||"2026"}-${e.target.value}`:"")}><option value="">月</option>{Array.from({length:12},(_,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{i+1} 月</option>)}</select><button onClick={()=>setMonth("")}>顯示全部</button></div>;
  return <div className="wm-preview-shell workforce-preview-shell office-preview sales-preview">
    {nav&&<button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={()=>setNav(false)}/>}
    <aside className={`wm-preview-sidebar ${nav?"open":""}`}><div className="wm-preview-brand"><Building2 size={26}/><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="預覽導覽">{Object.entries(pages).map(([key,label])=><button key={key} className={page===key?"active":""} onClick={()=>pick(key)}>{label}</button>)}</nav><footer>全部為示範資料<br/>不連接正式資料庫</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={()=>setNav(true)}><Menu size={20}/></button><strong>{pages[page]}</strong><small>測試環境 · 尚未正式上傳</small></header><main className="wm-preview-content">
      <div className="workforce-preview-tools"><p>清單上方改版預覽・可切換收支管理比對風格</p><label>測試資料 <select aria-label="測試資料" value={mode} onChange={e=>setMode(e.target.value)}><option value="normal">示範資料</option><option value="empty">空資料</option><option value="many">多筆／大額資料</option></select></label></div>
      <nav className="workforce-preview-switch" aria-label="切換預覽">{Object.entries(pages).map(([key,label])=><button key={key} aria-pressed={page===key} onClick={()=>pick(key)}>{label}</button>)}</nav>
      {message&&<div className="workforce-preview-message" role="status">{message}<button aria-label="關閉提示" onClick={()=>setMessage("")}>×</button></div>}
      {page==="billing"?<BillingOverview {...billingFixture(mode)} expenseTab={billingTab} onTabChange={setBillingTab} newLabel="新增銀行入帳紀錄" onNew={action("新增紀錄")}/> : <>
        <SalesOverview kind={page} stats={invoice?invoiceOverviewStats(rows,invoiceAmount):quoteOverviewStats(rows,quoteAmount)} period={invoice?salesMonth(month):"全部月份"} formatMoney={salesMoney} onNew={action(invoice?"開立發票":"新增估價單")} onTemplates={action("管理估價範本")}>
          {invoice&&<InvoiceOverdueReminder reminders={getInvoiceReminders(invoices,"2026-10-21")} formatMoney={salesMoney} formatDate={salesDate}/>}
        </SalesOverview>
        <SalesFilters kind={page} count={rows.length} company={company} companies={companyTabs} onCompanyChange={setCompany} companyColor={salesCompanyColor} query={query} onQueryChange={setQuery} monthControl={invoice?monthControl:null}/>
        <div className="office-preview-table"><table><thead><tr>{(invoice?["發票號碼","開票公司","客戶","含稅金額","開立日","入帳日","狀態"]:["單號","客戶","日期","金額","報價公司","狀態"]).map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>
          {grouped.map(m=><React.Fragment key={m}>{!invoice&&<tr className="sales-demo-group"><td colSpan={6}>{salesMonth(m)}　共 {rows.filter(r=>r.date.startsWith(m)).length} 張・小計 {salesMoney(rows.filter(r=>r.date.startsWith(m)).reduce((s,r)=>s+quoteAmount(r),0))}</td></tr>}{rows.filter(r=>r.date.startsWith(m)).map(r=><tr key={r.id} style={{background:salesCompanyColor(r.companyName)}}>{invoice?<><td>{r.no}</td><td>{r.companyName||"—"}</td><td>{r.client}</td><td>{salesMoney(invoiceAmount(r))}</td><td>{salesDate(r.date)}</td><td>{salesDate(r.dueDate)}</td><td>{r.status}</td></>:<><td>{r.no}</td><td>{r.client}</td><td>{salesDate(r.date)}</td><td>{salesMoney(quoteAmount(r))}</td><td>{r.companyName||"—"}</td><td>{r.status}</td></>}</tr>)}</React.Fragment>)}
        </tbody></table>{!rows.length&&<p className="workforce-preview-empty">沒有符合條件的示範資料</p>}</div>
        <p className="workforce-preview-footnote">下方為簡化唯讀示範清單。正式版的掃描檔、編輯、轉發票、入帳日與通知流程維持原樣。提醒依全部發票計算，不受清單篩選影響。</p>
      </>}
    </main></div>
  </div>;
}
if(import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview/>);
