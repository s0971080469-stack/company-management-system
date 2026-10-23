import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, Menu } from "lucide-react";
import VendorFilters from "../../src/VendorFilters.jsx";
import { VendorsOverview } from "../../src/OfficeOverview.jsx";
import "./website-management.css";
import "./dashboard-overview.css";
import "./office-overview.css";

const samples = [
  {id:1,name:"示範環境設備有限公司",vendorType:"供應商",category:"清潔設備",tradingCompany:"綠石環保"},
  {id:2,name:"示範材料企業社",vendorType:"供應商",category:"工程材料",tradingCompany:"歐克環境"},
  {id:3,name:"示範文化中心",vendorType:"業主",category:"環境維護",tradingCompany:"上藝除蟲"},
  {id:4,name:"示範科技園區",vendorType:"業主",category:"定期清潔",tradingCompany:"維娜科技"},
  {id:5,name:"ABC 示範五金公司",vendorType:"供應商",category:"五金耗材",tradingCompany:"歐克環境"},
];
function Preview() {
  const [type,setType]=useState("全部"), [query,setQuery]=useState(""), [empty,setEmpty]=useState(false), [navOpen,setNavOpen]=useState(false), [message,setMessage]=useState("");
  const rows=empty?[]:samples;
  const filtered=rows.filter(v=>type==="全部"||v.vendorType===type).filter(v=>(v.name+(v.category||"")+(v.tradingCompany||"")).toLowerCase().includes(query.toLowerCase()));
  return <div className="wm-preview-shell dashboard-preview-shell">
    {navOpen&&<button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={()=>setNavOpen(false)}/>}
    <aside className={`wm-preview-sidebar ${navOpen?"open":""}`}><div className="wm-preview-brand"><Building2 size={26}/><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="側邊欄位置預覽">{["總覽儀錶板","人員管理","薪資表管理","廠商管理","公文管理","估價單"].map((name,i)=><div key={name} className={name==="廠商管理"?"active":""}><span>{String(i+1).padStart(2,"0")}</span>{name}</div>)}</nav><footer>僅供篩選版面預覽<br/>不讀寫正式資料</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={()=>setNavOpen(true)}><Menu size={20}/></button><strong>廠商管理</strong><small>測試環境 · 尚未更新正式版</small></header><main className="wm-preview-content">
      <div className="dashboard-preview-controls"><p>參考估價單清單篩選樣式 · 以下全部為模擬資料</p><label>測試資料 <select aria-label="測試資料" value={empty?"empty":"normal"} onChange={e=>setEmpty(e.target.value==="empty")}><option value="normal">示範資料</option><option value="empty">空資料</option></select></label></div>
      {message&&<p role="status">{message}</p>}
      <VendorsOverview supplierCount={rows.filter(v=>v.vendorType==="供應商").length} ownerCount={rows.filter(v=>v.vendorType==="業主").length} onNew={()=>setMessage("此頁僅測試篩選，不新增正式廠商。")} onPrint={()=>setMessage("此頁僅測試篩選，不列印正式資料。")}/>
      <VendorFilters count={filtered.length} type={type} onTypeChange={setType} query={query} onQueryChange={setQuery}/>
      <div className="office-preview-table"><table aria-label="示範廠商清單"><thead><tr>{["名稱","類型","業務類別","往來公司"].map(name=><th key={name}>{name}</th>)}</tr></thead><tbody>{filtered.map(v=><tr key={v.id} style={{background:v.vendorType==="供應商"?"#E4E9F0":"#F5E9EE"}}><td>{v.name}</td><td>{v.vendorType}</td><td>{v.category}</td><td>{v.tradingCompany}</td></tr>)}</tbody></table>{!filtered.length&&<p style={{padding:20,color:'#65768a'}}>沒有符合條件的示範資料</p>}</div>
      <p style={{fontSize:13,color:'#65768a',lineHeight:1.8}}>本次僅調整清單篩選區；正式廠商欄位、資料、編輯與新增功能不變。</p>
    </main></div>
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview/>);
