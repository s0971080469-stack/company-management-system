import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import {Building2,Menu,AlertCircle} from "lucide-react";
import {OperationsOverview,OperationsFilters,OperationsSearch,VehicleReminders,AttendanceControls} from "../../src/OperationsOverview.jsx";
import BillingOverview from "../../src/BillingOverview.jsx";
import {billingFixture} from "../fixtures/billing-overview.js";
import {operationsFixture,operationCompanies,operationColor,money,monthLabel,dateLabel,daysUntil,isExpiringSoon,isOverdue} from "../fixtures/operations-overview.js";
import "./website-management.css";
import "./workforce-overview.css";
import "./office-overview.css";
import "./operations-overview.css";

const pages={tracking:"每月請款追蹤",vehicles:"車輛管理",attendance:"打卡上下班",ledger:"帳務入口",billing:"收支管理（風格參考）"};
function MonthControl({month,setMonth,label}) {
  return <div className="month-filter-bar operations-demo-month"><span>{label}</span><select aria-label={`${label}年份`} value={month.slice(0,4)} onChange={e=>setMonth(e.target.value?`${e.target.value}-${month.slice(5)||"10"}`:"")}><option value="">年</option><option value="2026">115 年</option><option value="2025">114 年</option></select><select aria-label={`${label}月份`} value={month.slice(5)} onChange={e=>setMonth(e.target.value?`${month.slice(0,4)||"2026"}-${e.target.value}`:"")}><option value="">月</option>{Array.from({length:12},(_,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{i+1} 月</option>)}</select><button onClick={()=>setMonth("")}>顯示全部</button></div>;
}
function DemoTable({columns,rows}) {return <div className="office-preview-table"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((value,j)=><td key={j}>{value}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="workforce-preview-empty">沒有符合條件的示範資料</p>}</div>;}
function Preview(){
  const [page,setPage]=useState("tracking"),[mode,setMode]=useState("normal"),[nav,setNav]=useState(false),[message,setMessage]=useState("");
  const [month,setMonth]=useState("2026-10"),[company,setCompany]=useState("全部"),[query,setQuery]=useState(""),[type,setType]=useState("全部");
  const [employee,setEmployee]=useState(""),[restricted,setRestricted]=useState(false),[billingTab,setBillingTab]=useState("銀行入帳");
  const data=operationsFixture(mode), myEmployee="e1", effectiveEmployee=restricted?myEmployee:employee;
  const action=name=>()=>setMessage(`${name}：此頁僅測試版面，不會儲存、打卡、取得定位或發送通知。`);
  const pick=key=>{setPage(key);setCompany("全部");setQuery("");setMessage("");setNav(false);};
  // Mirror existing filters; do not invoke business write handlers in a design preview.
  const contracts=data.contracts.filter(c=>(!month||(c.startDate<=`${month}-31`&&c.endDate>=`${month}-01`))&&(company==="全部"?(c.no+c.title).includes(query):company===c.company));
  const vehicles=data.vehicles.filter(v=>(v.plate+v.model+v.driver).toLowerCase().includes(query.toLowerCase()));
  const ledger=data.ledger.filter(r=>(!month||r.date.startsWith(month))&&(type==="全部"||r.type===type));
  const attendance=data.attendance.filter(r=>(!restricted||r.employeeId===myEmployee)&&(!month||r.date.startsWith(month)));
  const record=data.attendance.find(r=>r.employeeId===effectiveEmployee&&r.date==="2026-10-21");
  const income=data.ledger.filter(r=>r.type==="收入").reduce((s,r)=>s+r.amount,0),expense=data.ledger.filter(r=>r.type==="支出").reduce((s,r)=>s+r.amount,0);
  const due=data.vehicles.filter(v=>isExpiringSoon(v.insuranceExpiry)||isExpiringSoon(v.inspectionExpiry)),late=data.vehicles.filter(v=>isOverdue(v.insuranceExpiry)||isOverdue(v.inspectionExpiry));
  const billed=contracts.filter(c=>c.billed&&c.billingMonth===month).length;
  return <div className="wm-preview-shell workforce-preview-shell office-preview operations-preview">
    {nav&&<button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={()=>setNav(false)}/>}
    <aside className={`wm-preview-sidebar ${nav?"open":""}`}><div className="wm-preview-brand"><Building2 size={26}/><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="預覽導覽">{Object.entries(pages).map(([key,label])=><button key={key} className={page===key?"active":""} onClick={()=>pick(key)}>{label}</button>)}</nav><footer>示範資料・不連接正式資料庫<br/>操作不會寫入或發送通知</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={()=>setNav(true)}><Menu size={20}/></button><strong>{pages[page]}</strong><small>測試環境 · 尚未正式上傳</small></header><main className="wm-preview-content">
      <div className="workforce-preview-tools"><p>四頁新版・可切換收支管理比對風格</p><div className="workforce-preview-settings"><label>測試資料<select aria-label="測試資料" value={mode} onChange={e=>setMode(e.target.value)}><option value="normal">示範資料</option><option value="empty">空資料</option><option value="many">多筆／大額資料</option></select></label>{page==="attendance"&&<label>預覽身分<select aria-label="預覽身分" value={restricted?"employee":"admin"} onChange={e=>setRestricted(e.target.value==="employee")}><option value="admin">管理員</option><option value="employee">一般員工</option></select></label>}</div></div>
      <nav className="workforce-preview-switch" aria-label="切換預覽">{Object.entries(pages).map(([key,label])=><button key={key} aria-pressed={page===key} onClick={()=>pick(key)}>{label}</button>)}</nav>
      {message&&<div className="workforce-preview-message" role="status">{message}<button aria-label="關閉提示" onClick={()=>setMessage("")}>×</button></div>}
      {page==="tracking"&&<><OperationsOverview kind="tracking" stats={{count:contracts.length,billed,unbilled:contracts.length-billed}} period={month?monthLabel(month):"未指定請款月"}/><OperationsFilters title="請款清單篩選" count={contracts.length} unit="份" options={operationCompanies} optionLabel="承攬公司" selected={company} onSelect={setCompany} colorOf={operationColor}><MonthControl month={month} setMonth={setMonth} label="請款月份"/><OperationsSearch label="搜尋契約編號／名稱／對方單位" query={query} onChange={setQuery}/></OperationsFilters><DemoTable columns={["契約編號","契約名稱","承攬公司","契約金額","負責人員","本月請款"]} rows={contracts.map(c=>[c.no,c.title,c.company,money(c.amount),c.owner,c.billed&&c.billingMonth===month?"已請款":"未請款"])}/></>}
      {page==="vehicles"&&<><OperationsOverview kind="vehicles" stats={{count:data.vehicles.length,active:data.vehicles.filter(v=>v.status==="使用中").length,expiring:due.length,overdue:late.length}} onNew={action("新增車輛")}><VehicleReminders overdue={late} expiring={due} isOverdue={isOverdue} isExpiringSoon={isExpiringSoon} daysUntil={daysUntil}/></OperationsOverview><OperationsFilters title="車輛清單篩選" count={vehicles.length} unit="輛"><OperationsSearch label="搜尋車牌／車型／使用人" query={query} onChange={setQuery}/></OperationsFilters><DemoTable columns={["車牌號碼","廠牌型號","使用人","保險到期日","驗車到期日","狀態"]} rows={vehicles.map(v=>[v.plate,v.model,v.driver,dateLabel(v.insuranceExpiry),dateLabel(v.inspectionExpiry),v.status])}/></>}
      {page==="ledger"&&<><OperationsOverview kind="ledger" stats={{income,expense,net:income-expense}} formatMoney={money} onNew={action("新增帳務紀錄")}><div className="operations-ledger-note"><AlertCircle size={16}/>收支管理內的紀錄（含發票加入的銀行入帳）與已發放薪資會自動登錄於此帳冊，亦可手動新增其他收支項目。</div></OperationsOverview><OperationsFilters title="帳務清單篩選" count={ledger.length} options={["全部","收入","支出"]} selected={type} onSelect={setType} colorOf={operationColor}><MonthControl month={month} setMonth={setMonth} label="日期月份"/></OperationsFilters><DemoTable columns={["日期","類型","說明","金額"]} rows={ledger.map(r=>[dateLabel(r.date),r.type,r.desc,money(r.amount)])}/></>}
      {page==="attendance"&&<><OperationsOverview kind="attendance"/><div className="operations-attendance-layout"><AttendanceControls time="08:30:25" date="115/10/21" employeeControl={restricted?<strong className="operations-demo-self">示範員工甲</strong>:<select aria-label="打卡員工" value={employee} onChange={e=>setEmployee(e.target.value)}><option value="">選擇員工…</option>{data.employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>} actions={<><button className="operations-demo-in" disabled={!effectiveEmployee||!!record?.clockIn} onClick={action("上班打卡")}>上班打卡</button><button className="operations-demo-out" disabled={!effectiveEmployee||!record?.clockIn||!!record?.clockOut} onClick={action("下班打卡")}>下班打卡</button></>} locationControl={<><p>此處僅展示原有公司座標設定區，不測試定位或打卡範圍。</p><p>示範座標：22.700000, 120.300000</p><button onClick={action("使用目前位置")}>使用目前位置</button></>}/><div><OperationsFilters title={restricted?"我的月份出勤":"月份出勤"} count={attendance.length}><MonthControl month={month} setMonth={setMonth} label="出勤月份"/></OperationsFilters><DemoTable columns={["日期","員工","上班","下班"]} rows={attendance.map(r=>[dateLabel(r.date),data.employees.find(e=>e.id===r.employeeId)?.name,r.clockIn||"—",r.clockOut||"—"])}/></div><section className="operations-demo-calendar"><h3>月曆・{monthLabel(month)}</h3><p>下方為示意月曆；正式版原有出勤、請假及員工檢視功能保留。</p><div>{Array.from({length:31},(_,i)=><span key={i} className={i===20?"is-today":""}>{i+1}</span>)}</div></section></div></>}
      {page==="billing"&&<BillingOverview {...billingFixture(mode)} expenseTab={billingTab} onTabChange={setBillingTab} newLabel="新增紀錄" onNew={action("新增紀錄")}/>}
      <p className="workforce-preview-footnote">本頁採用正式版上方顯示元件及虛構資料；下方為簡化唯讀示範清單。請款勾選、附件、車輛編輯、打卡、請假及帳務新增不會在這裡執行。</p>
    </main></div>
  </div>;
}
if(import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview/>);
