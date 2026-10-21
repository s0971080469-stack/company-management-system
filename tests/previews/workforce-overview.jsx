import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, Menu, Users, Wallet, ShieldCheck, X } from "lucide-react";
import { EmployeesOverview, PayrollOverview, WORKFORCE_COMPANY_COLORS } from "../../src/WorkforceOverview.jsx";
import PayrollApprovalButton from "../../src/PayrollApprovalButton.jsx";
import { filterPersonnel } from "../../src/personnelFilters.js";
import { payrollSiteOf, payrollNetAmount, payrollReleaseStatus, approvePayrollSite } from "../../src/payrollApproval.js";
import { nextPayrollMonth, payrollGenerationLocked } from "../../src/payrollGeneration.js";
import { workforceEmployees, workforcePayroll, workforceCompanies, workforceSites, workforceMoney as money, workforceMonth as monthLabel } from "../fixtures/workforce-overview.js";
import "./website-management.css";
import "./workforce-overview.css";

const nav = ["總覽儀錶板","人員管理","薪資表管理","廠商管理","公文管理","估價單","發票","收支管理","契約管理","每月請款追蹤","車輛管理","網站資訊管理","打卡上下班","帳務入口","公司報表","權限設定"];
function Badge({ company }) { const tone=WORKFORCE_COMPANY_COLORS[company]; return company ? <span className="workforce-preview-badge" style={{background:tone.bg,color:tone.fg}}>{company}</span> : "—"; }
function Preview() {
  const [page,setPage]=useState("employees"), [navOpen,setNavOpen]=useState(false), [mode,setMode]=useState("normal"), [isAdmin,setIsAdmin]=useState(true);
  const [query,setQuery]=useState(""), [employeeSite,setEmployeeSite]=useState("全部"), [company,setCompany]=useState("全部");
  const [month,setMonth]=useState("2026-10"), [boss,setBoss]=useState("全部"), [site,setSite]=useState("全部"), [payroll,setPayroll]=useState(workforcePayroll);
  const [message,setMessage]=useState(""), [messages,setMessages]=useState([]);
  const employees=mode === "empty" ? [] : workforceEmployees;
  const currentPayroll=mode === "empty" ? [] : payroll;
  const filtered=filterPersonnel(employees,{query,company,site:employeeSite,knownCompanies:workforceCompanies.filter(c => !["全部","其他"].includes(c))});
  const siteOf=row=>payrollSiteOf(row,employees);
  const bossOf=row=>siteOf(row) === workforceSites[3] ? "夏壽松" : "夏碩亞";
  const bossRows=currentPayroll.filter(row=>row.month === month && (boss === "全部" || bossOf(row) === boss));
  const sites=["全部",...new Set(bossRows.map(siteOf).filter(Boolean))];
  const rows=bossRows.filter(row=>site === "全部" || siteOf(row) === site);
  const sum=list=>list.reduce((total,row)=>total+payrollNetAmount(row),0);
  const totalNet=sum(rows.filter(row=>row.status !== "暫時不發")), paidNet=sum(rows.filter(row=>row.status === "已發放")), held=rows.filter(row=>row.status === "暫時不發");
  const changePage=value=>{setPage(value);setNavOpen(false);setMessage("");};
  const approve=selection=>approvePayrollSite({...selection,payroll:currentPayroll,employees,users:[{id:"demo-finance",role:"財務",status:"啟用"}],isAdmin,actor:"夏碩亞（示範）",senderId:"demo-admin",save:async next=>{setPayroll(next);return true;},send:async next=>{setMessages(previous=>[...next,...previous]);return {error:null};}});
  const employeeColumns=["姓名","部門","職位","投保公司","到職日","底薪","聯絡方式","銀行帳號","投保級距","狀態","所屬案場"];
  const payrollColumns=["員工","部門","所屬案場","底薪","加項","減項／保費","借支","實發淨額","保險狀態","加保公司","銀行帳號","付款日","狀態"];
  return <div className="wm-preview-shell workforce-preview-shell">
    {navOpen && <button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={()=>setNavOpen(false)} />}
    <aside className={`wm-preview-sidebar ${navOpen ? "open" : ""}`}><div className="wm-preview-brand"><Building2 size={26}/><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="側邊欄位置預覽">{nav.map((label,i)=>[1,2].includes(i) ? <button key={label} className={page === (i === 1 ? "employees" : "payroll") ? "active" : ""} onClick={()=>changePage(i === 1 ? "employees" : "payroll")}><span>{String(i+1).padStart(2,"0")}</span>{label}</button> : <div key={label}><span>{String(i+1).padStart(2,"0")}</span>{label}</div>)}</nav><footer>人員與薪資可切換預覽<br/>僅示範資料 · 不讀寫正式系統</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={()=>setNavOpen(v=>!v)}><Menu size={20}/></button>{page === "employees" ? <Users size={19}/> : <Wallet size={19}/>}<strong>{page === "employees" ? "人員管理" : "薪資表管理"}</strong><small>測試環境 · 尚未上傳正式版</small></header><main className="wm-preview-content">
      <section className="workforce-preview-tools" aria-label="測試工具"><p><ShieldCheck size={15}/>純示範資料，不讀寫正式人員、薪資或傳送真實通知。</p><div className="workforce-preview-settings"><label>資料<select aria-label="測試資料" value={mode} onChange={e=>{setMode(e.target.value);setSite("全部");}}><option value="normal">示範資料</option><option value="empty">空資料</option></select></label><label>身分<select aria-label="預覽身分" value={isAdmin ? "admin" : "staff"} onChange={e=>setIsAdmin(e.target.value === "admin")}><option value="admin">夏碩亞（管理員）</option><option value="staff">一般人員</option></select></label></div></section>
      <div className="workforce-preview-switch" role="group" aria-label="選擇預覽頁面"><button aria-pressed={page === "employees"} onClick={()=>changePage("employees")}><Users size={16}/>人員管理預覽</button><button aria-pressed={page === "payroll"} onClick={()=>changePage("payroll")}><Wallet size={16}/>薪資表管理預覽</button></div>
      {message && <div className="workforce-preview-message" role="status">{message}<button aria-label="關閉提示" onClick={()=>setMessage("")}><X size={15}/></button></div>}
      {page === "employees" ? <EmployeesOverview employeeCount={employees.length} activeCount={employees.filter(e=>e.status === "在職").length} filteredCount={filtered.length} query={query} onQueryChange={setQuery} site={employeeSite} sites={workforceSites} onSiteChange={setEmployeeSite} company={company} companies={workforceCompanies} onCompanyChange={setCompany} onPrint={()=>window.print()} onNew={()=>setMessage("新增員工入口已保留。此頁只預覽版面，不新增正式人員資料。")}/> : <PayrollOverview rowCount={rows.length} totalNet={totalNet} paidNet={paidNet} unpaidNet={totalNet-paidNet} paidCount={rows.filter(r=>r.status === "已發放").length} heldNet={sum(held)} heldCount={held.length} month={month} nextMonth={nextPayrollMonth(month)} boss={boss} site={site} sites={sites} onBossChange={value=>{setBoss(value);setSite("全部");}} onSiteChange={setSite} monthControl={<input type="month" aria-label="薪資月份" value={month} onChange={e=>setMonth(e.target.value)}/>} approvalControl={<PayrollApprovalButton key={`${month}:${boss}:${site}:${isAdmin}:${mode}`} rows={rows} employees={employees} month={month} site={site} isAdmin={isAdmin} onApprove={approve} formatMoney={money} formatMonth={monthLabel}/>} generateLocked={payrollGenerationLocked(currentPayroll,month,isAdmin)} nextGenerateLocked={payrollGenerationLocked(currentPayroll,nextPayrollMonth(month),isAdmin)} generating={false} generationNotice="" onGenerate={target=>setMessage(`測試入口：正式系統將產生 ${monthLabel(target)} 的薪資。此預覽不會新增或更動正式薪資。`)} onPrint={()=>window.print()} formatMoney={money} formatMonth={monthLabel}/>}
      <div className="workforce-preview-table" tabIndex={0} aria-label="示範清單，可橫向捲動"><table><thead><tr>{(page === "employees" ? employeeColumns : payrollColumns).map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{page === "employees" ? filtered.map(e=><tr key={e.id} style={{background:e.siteName === "公司總部" ? "#f3f7fa" : e.siteName === "機動組" ? "#f7f1fa" : "#f4f8f1"}}><td><strong>{e.name}</strong></td><td>{e.dept}</td><td>{e.title}</td><td><Badge company={e.company}/></td><td>115/03/02</td><td>{money(e.baseSalary)}</td><td>—</td><td>—</td><td>—</td><td>{e.status}</td><td className="workforce-preview-site">{e.siteName}</td></tr>) : rows.map(r=><tr key={r.id} style={{background:r.status === "已發放" ? "#EEF7F2" : r.status === "暫時不發" ? "#FCEEEF" : "#FFF8E5"}}><td><strong>{r.employeeName}</strong></td><td>{employees.find(e=>e.id === r.employeeId)?.dept}</td><td className="workforce-preview-site">{r.siteName}</td><td>{money(r.baseSalary)}</td><td>+{money(1500)}</td><td>−{money(1300)}</td><td>—</td><td>{money(payrollNetAmount(r))}</td><td>加保</td><td><Badge company={r.company}/></td><td>—</td><td>{r.paymentDate ? `115/${r.paymentDate.slice(5).replace("-","/")}` : "—"}</td><td>{payrollReleaseStatus(r,siteOf(r))}</td></tr>)}</tbody></table>{!(page === "employees" ? filtered : rows).length && <p className="workforce-preview-empty">沒有符合目前條件的{page === "employees" ? "人員" : "薪資"}資料，可切換篩選條件。</p>}</div>
      <p className="workforce-preview-footnote">清單為模擬資料，沿用原有欄位與底色；此次只調整清單上方區域。</p>
      {page === "payroll" && <details className="workforce-preview-inbox"><summary>財務通知測試紀錄（僅此頁模擬） · {messages.length} 則</summary>{messages.length ? messages.map((item,i)=><p key={i}>{item.content}</p>) : <p>選個別案場並批准後，可在此查看模擬通知。</p>}</details>}
    </main></div>
  </div>;
}
if (import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview/>);
