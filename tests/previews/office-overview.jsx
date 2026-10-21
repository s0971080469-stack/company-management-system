import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, Menu } from "lucide-react";
import { VendorsOverview, DocumentsOverview } from "../../src/OfficeOverview.jsx";
import ContractOverview from "../../src/ContractOverview.jsx";
import { contractOverviewFixture } from "../fixtures/contract-overview.js";
import "./website-management.css";
import "./workforce-overview.css";
import "./office-overview.css";

const vendorRows = [
  { name:"示範環境設備有限公司", type:"供應商", category:"清潔設備", company:"綠石環保" },
  { name:"示範材料企業社", type:"供應商", category:"工程材料", company:"歐克環境" },
  { name:"示範文化中心", type:"業主", category:"環境維護", company:"上藝除蟲" },
  { name:"示範科技園區", type:"業主", category:"定期清潔", company:"維娜科技" },
];
const documentRows = [
  { no:"DOC-115-003", overview:"環境清潔維護成果提報（示範）", party:"示範公司", date:"115/10/20", template:true },
  { no:"DOC-115-002", overview:"例行工作進度通知（示範）", party:"示範公司", date:"115/10/15", template:false },
  { no:"DOC-115-001", overview:"清潔維護作業計畫（示範）", party:"示範公司", date:"115/09/10", template:true },
];
const pages = { vendors:"廠商管理", documents:"公文管理", contracts:"契約管理（高度參考）" };
function Preview() {
  const [page,setPage]=useState("vendors"); const [empty,setEmpty]=useState(false);
  const [message,setMessage]=useState(""); const [navOpen,setNavOpen]=useState(false);
  const [query,setQuery]=useState(""); const [type,setType]=useState("全部"); const [year,setYear]=useState("2026");
  const vendors=empty?[]:vendorRows; const documents=empty?[]:documentRows;
  const filtered=vendors.filter(v=>(type==="全部"||v.type===type)&&(v.name+v.category+v.company).includes(query));
  const docs=documents.filter(d=>(d.no+d.overview+d.party).includes(query));
  const select=key=>{setPage(key);setQuery("");setType("全部");setMessage("");};
  const previewAction=name=>()=>setMessage(`${name}按鈕已連接。此頁只預覽，不建立正式資料或下載檔案。`);
  return <div className="wm-preview-shell workforce-preview-shell office-preview">
    {navOpen&&<button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={()=>setNavOpen(false)} />}
    <aside className={`wm-preview-sidebar ${navOpen?"open":""}`}><div className="wm-preview-brand"><Building2 size={26}/><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="預覽導覽">{Object.entries(pages).map(([key,label])=><button key={key} className={page===key?"active":""} onClick={()=>{select(key);setNavOpen(false);}}>{label}</button>)}</nav><footer>全部為示範資料<br/>不連接正式資料庫</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={()=>setNavOpen(true)}><Menu size={20}/></button><strong>{pages[page]}</strong><small>測試環境 · 尚未正式上傳</small></header><main className="wm-preview-content">
      <div className="workforce-preview-tools"><p>僅調整標題與統計區；契約分頁可直接比對高度、字級。</p><label>測試資料 <select aria-label="測試資料" value={empty?"empty":"normal"} onChange={e=>setEmpty(e.target.value==="empty")}><option value="normal">示範資料</option><option value="empty">空資料</option></select></label></div>
      <nav className="workforce-preview-switch" aria-label="切換預覽">{Object.entries(pages).map(([key,label])=><button key={key} aria-pressed={page===key} onClick={()=>select(key)}>{label}</button>)}</nav>
      {message&&<div className="workforce-preview-message" role="status">{message}<button aria-label="關閉提示" onClick={()=>setMessage("")}>×</button></div>}
      {page==="vendors"?<VendorsOverview supplierCount={vendors.filter(v=>v.type==="供應商").length} ownerCount={vendors.filter(v=>v.type==="業主").length} onPrint={previewAction("列印")} onNew={previewAction("新增廠商")}/>:
       page==="documents"?<DocumentsOverview totalCount={documents.length} monthCount={documents.filter(d=>d.date.startsWith("115/10")).length} templatedCount={documents.filter(d=>d.template).length} onPrint={previewAction("列印")} onNew={previewAction("新增公文")} onTemplates={previewAction("管理公文範本")}/>:
       <ContractOverview {...contractOverviewFixture(year,empty?"empty":"normal")} onYearChange={setYear} onNew={previewAction("新增契約")}/>}
      {page!=="contracts"&&<><div className="office-preview-filters">
        {page==="vendors"&&["全部","供應商","業主"].map(label=><button key={label} aria-pressed={type===label} onClick={()=>setType(label)}>{label}</button>)}
        <input aria-label="搜尋示範清單" placeholder={page==="vendors"?"搜尋名稱／業務類別／往來公司":"搜尋文號／公文概述／發文機關"} value={query} onChange={e=>setQuery(e.target.value)}/>
      </div><div className="office-preview-table"><table><thead><tr>{(page==="vendors"?["名稱","類型","業務類別","往來公司"]:["發文字號","公文概述","發文機關","發文日期","範本"]).map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{page==="vendors"?filtered.map(v=><tr key={v.name} style={{background:v.type==="供應商"?"#E4E9F0":"#F5E9EE"}}><td>{v.name}</td><td>{v.type}</td><td>{v.category}</td><td>{v.company}</td></tr>):docs.map(d=><tr key={d.no}><td>{d.no}</td><td>{d.overview}</td><td>{d.party}</td><td>{d.date}</td><td>{d.template?"已套用":"未套用"}</td></tr>)}</tbody></table>{(page==="vendors"?filtered:docs).length===0&&<p className="workforce-preview-empty">沒有符合條件的示範資料</p>}</div><p className="workforce-preview-footnote">下方為簡化示範清單；正式版原有欄位、搜尋篩選、編輯與預覽下載流程維持原樣。</p></>}
    </main></div>
  </div>;
}
if(import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview/>);
