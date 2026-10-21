import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, Menu, Plus } from "lucide-react";
import ReportsOverview from "../../src/ReportsOverview.jsx";
import { PermissionsOverview, PermissionSectionHeading } from "../../src/AdministrationOverview.jsx";
import BillingOverview from "../../src/BillingOverview.jsx";
import { billingFixture } from "../fixtures/billing-overview.js";
import { reportFixture, accessFixture } from "../fixtures/administration-overview.js";
import "./website-management.css";
import "./workforce-overview.css";
import "./office-overview.css";
import "./administration-overview.css";

const pages = { reports:"公司報表", permissions:"權限設定", billing:"收支管理（風格參考）" };
const modules = ["總覽儀表板", "人員管理", "薪資表管理", "廠商管理", "公文管理", "公司報表", "權限設定"];
function Preview() {
  const [page,setPage]=useState("reports"),[mode,setMode]=useState("normal"),[year,setYear]=useState("2026"),[nav,setNav]=useState(false),[message,setMessage]=useState("");
  const [billingTab,setBillingTab]=useState("銀行入帳"),[newRole,setNewRole]=useState("");
  const {users,roles}=accessFixture(mode);
  const action=name=>()=>setMessage(`${name}：此處僅預覽版面，不會建立帳號、修改權限或儲存資料。`);
  const pick=key=>{setPage(key);setNav(false);setMessage("");};
  return <div className="wm-preview-shell workforce-preview-shell office-preview administration-preview">
    {nav&&<button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={()=>setNav(false)}/>}
    <aside className={`wm-preview-sidebar ${nav?"open":""}`}><div className="wm-preview-brand"><Building2 size={26}/><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="預覽導覽">{Object.entries(pages).map(([key,label])=><button key={key} className={page===key?"active":""} onClick={()=>pick(key)}>{label}</button>)}</nav><footer>虛構示範資料・不連接正式資料庫<br/>不修改任何實際帳號及權限</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={()=>setNav(true)}><Menu size={20}/></button><strong>{pages[page]}</strong><small>測試環境 · 尚未正式上傳</small></header><main className="wm-preview-content">
      <div className="workforce-preview-tools"><p>報表與權限新版・可切換收支管理比對風格</p><div className="workforce-preview-settings"><label>測試資料<select aria-label="測試資料" value={mode} onChange={e=>setMode(e.target.value)}><option value="normal">示範資料</option><option value="empty">空資料</option><option value="large">多筆／大額資料</option></select></label></div></div>
      <nav className="workforce-preview-switch" aria-label="切換預覽">{Object.entries(pages).map(([key,label])=><button key={key} aria-pressed={page===key} onClick={()=>pick(key)}>{label}</button>)}</nav>
      {message&&<div className="workforce-preview-message" role="status">{message}<button aria-label="關閉提示" onClick={()=>setMessage("")}>×</button></div>}
      {page==="reports"&&<ReportsOverview {...reportFixture(mode,year)} onYearChange={setYear}/>}
      {page==="permissions"&&<>
        <PermissionsOverview onNew={action("新增系統帳號")}/>
        <PermissionSectionHeading/>
        <div className="office-preview-table"><table><thead><tr>{["姓名","Email","角色","綁定員工","狀態","操作"].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{users.map(u=><tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.role}</td><td>{u.employee}</td><td><span className={`access-demo-status ${u.status==="停用"?"is-inactive":""}`}>{u.status}</span></td><td><button onClick={action("編輯帳號")}>編輯</button></td></tr>)}</tbody></table>{!users.length&&<p className="workforce-preview-empty">尚未建立任何系統帳號（示範）</p>}</div>
        <PermissionSectionHeading matrix><input aria-label="新增角色名稱" placeholder="新增角色名稱" value={newRole} onChange={e=>setNewRole(e.target.value)}/><button onClick={action("新增角色")}><Plus size={15}/>新增角色</button></PermissionSectionHeading>
        <div className="office-preview-table access-demo-matrix" tabIndex={0} role="region" aria-label="示範角色權限矩陣"><table><thead><tr><th>功能模組</th>{roles.map(r=><th key={r}>{r}</th>)}</tr></thead><tbody>{modules.map((name,i)=><tr key={name}><th>{name}</th>{roles.map((r,j)=><td key={r}><input type="checkbox" checked={j===0||i%2===j%2} disabled aria-label={`${r}・${name}（唯讀示範）`}/></td>)}</tr>)}</tbody></table></div>
        <p className="workforce-preview-footnote">權限清單僅為唯讀示範，所有勾選停用。正式版既有帳號編輯、角色新增及權限勾選操作保持不變。</p>
      </>}
      {page==="billing"&&<BillingOverview {...billingFixture(mode==="large"?"many":mode)} expenseTab={billingTab} onTabChange={setBillingTab} newLabel="新增紀錄" onNew={action("新增紀錄")}/>}
      <p className="workforce-preview-footnote">本頁使用正式版顯示元件與虛構資料，不會登入或讀寫公司資料。報表年度可切換，統計與圖表只反映示範資料。</p>
    </main></div>
  </div>;
}
if (import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview/>);
