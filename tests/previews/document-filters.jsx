import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, Menu } from "lucide-react";
import DocumentFilters from "../../src/DocumentFilters.jsx";
import { DocumentsOverview } from "../../src/OfficeOverview.jsx";
import "./website-management.css";
import "./dashboard-overview.css";
import "./office-overview.css";

const samples = [
  {id:1,no:"DOC-115-001",subject:"成果提報",overview:"環境維護成果提報（示範）",party:"示範文化中心",date:"2026-10-20",handler:"示範編輯甲",contractTitle:"文化中心環境維護",templateId:"demo",createdAt:"2026-10-20"},
  {id:2,no:"DOC-115-002",subject:"例行通知",overview:"例行清潔工作通知（示範）",party:"示範科技園區",date:"2026-10-15",handler:"示範編輯乙",contractTitle:"科技園區清潔服務",templateId:"",createdAt:"2026-10-15"},
  {id:3,no:"DOC-115-003",subject:"ABC 作業計畫",overview:"景觀維護作業計畫（示範）",party:"示範文化中心",date:"2026-09-10",handler:"示範編輯甲",contractTitle:"文化中心環境維護",templateId:"demo",createdAt:"2026-09-10"},
  {id:4,no:"DOC-115-004",subject:"履約報告",overview:"公共區域維護報告（示範）",party:"示範管理處",date:"2026-10-05",handler:"示範編輯乙",contractTitle:"示範園區年度公共空間環境清潔與景觀維護整合服務契約",templateId:"demo",createdAt:"2026-10-05"},
];
function Preview() {
  const [handler,setHandler]=useState("全部"),[contract,setContract]=useState("全部"),[month,setMonth]=useState(""),[query,setQuery]=useState("");
  const [scenario,setScenario]=useState("normal"),[navOpen,setNavOpen]=useState(false),[message,setMessage]=useState("");
  const rows=scenario==="empty"?[]:scenario==="unnamed"?samples.map(d=>({...d,handler:"",contractTitle:""})):samples;
  const handlers=Array.from(new Set(rows.map(d=>d.handler).filter(Boolean)));
  const contracts=Array.from(new Set(rows.map(d=>d.contractTitle).filter(Boolean)));
  const filtered=rows.filter(d=>{
    if(handler!=="全部"&&d.handler!==handler)return false;
    if(contract!=="全部"&&d.contractTitle!==contract)return false;
    if(month&&!(d.date||"").startsWith(month))return false;
    if(query&&!(d.no+d.subject+(d.overview||"")+(d.party||"")).toLowerCase().includes(query.toLowerCase()))return false;
    return true;
  }).sort((a,b)=>{const ak=a.updatedAt||a.createdAt||"",bk=b.updatedAt||b.createdAt||"";return ak<bk?1:ak>bk?-1:0;});
  const action=()=>setMessage("本頁僅供篩選設計預覽，不新增、修改或下載正式資料。");
  return <div className="wm-preview-shell dashboard-preview-shell">
    {navOpen&&<button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={()=>setNavOpen(false)}/>}
    <aside className={`wm-preview-sidebar ${navOpen?"open":""}`}><div className="wm-preview-brand"><Building2 size={26}/><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="側邊欄位置預覽">{["總覽儀錶板","人員管理","薪資表管理","廠商管理","公文管理","估價單"].map((name,i)=><div key={name} className={name==="公文管理"?"active":""}><span>{String(i+1).padStart(2,"0")}</span>{name}</div>)}</nav><footer>僅供篩選版面預覽<br/>不讀寫正式資料</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={()=>setNavOpen(true)}><Menu size={20}/></button><strong>公文管理</strong><small>測試環境 · 尚未更新正式版</small></header><main className="wm-preview-content">
      <div className="dashboard-preview-controls"><p>參考估價單清單篩選樣式 · 以下全部為模擬資料</p><label>測試資料 <select aria-label="測試資料" value={scenario} onChange={e=>{setScenario(e.target.value);setHandler("全部");setContract("全部");setMonth("");setQuery("");}}><option value="normal">示範資料</option><option value="empty">空資料</option><option value="unnamed">未填編輯人與案名</option></select></label></div>
      {message&&<p>{message}</p>}
      <DocumentsOverview totalCount={rows.length} monthCount={rows.filter(d=>d.date.startsWith("2026-10")).length} templatedCount={rows.filter(d=>d.templateId).length} onNew={action} onPrint={action} onTemplates={action}/>
      {rows.length===0?<p>尚未建立任何公文紀錄。</p>:<><DocumentFilters count={filtered.length} month={month} onMonthChange={setMonth} handler={handler} handlers={handlers} onHandlerChange={setHandler} contract={contract} contracts={contracts} onContractChange={setContract} query={query} onQueryChange={setQuery}/>
      <div className="office-preview-table"><table aria-label="示範公文清單"><thead><tr>{["發文字號","公文概述","發文機關","契約案名","發文日期","編輯人"].map(name=><th key={name}>{name}</th>)}</tr></thead><tbody>{filtered.map(d=><tr key={d.id}><td>{d.no}</td><td>{d.overview}</td><td>{d.party}</td><td>{d.contractTitle||"—"}</td><td>{d.date.replace("2026","115")}</td><td>{d.handler||"—"}</td></tr>)}</tbody></table>{!filtered.length&&<p style={{padding:20,color:'#65768a'}}>這個篩選條件下沒有公文。</p>}</div></>}
      <p style={{fontSize:13,color:'#65768a',lineHeight:1.8}}>本次僅調整清單篩選區；正式公文內容、排序、統計及預覽下載功能不變。示範資料的「本月」固定為 115 年 10 月。</p>
    </main></div>
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview/>);
