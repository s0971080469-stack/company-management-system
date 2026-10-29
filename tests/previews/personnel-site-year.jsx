import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import {EmployeesView} from "../../src/App.jsx";
import "../../src/index.css";
const contracts=[
  {title:"115年度文化中心清潔案",startDate:"2026-01-01",endDate:"2026-12-31"},
  {title:"116年度文化中心清潔案",startDate:"2027-01-01",endDate:"2027-12-31"},
  {title:"115至116年度跨年維護案",startDate:"2026-06-01",endDate:"2027-05-31"},
];
function Preview(){
  const [year,setYear]=useState("2027");
  const [employees,setEmployees]=useState(()=>["示範員工甲","示範員工乙","示範員工丙"].map((name,i)=>({id:`demo-${i}`,name,siteName:contracts[i].title,status:"在職",company:"綠石環保",insuranceStatus:"加保",hireDate:"2026-01-01",baseSalary:32000,additions:[],deductions:[],advances:[]})));
  return <main style={{padding:24,background:"#f3f3ef",minHeight:"100vh"}}>
    <section style={{padding:16,background:"#eaf3f8",color:"#244858",borderRadius:10,marginBottom:18}}>
      <strong>人員管理・跨年度案場測試</strong><p>模擬資料，不讀寫正式資料。116年篩選不列出115年結束的契約，員工原本的案名仍保留。</p>
      <label>模擬目前年度 <select aria-label="模擬目前年度" value={year} onChange={e=>setYear(e.target.value)}><option value="2026">115年度</option><option value="2027">116年度</option></select></label>
      <p>篩選及編輯皆只提供當年度契約；跨年有效契約、公司總部、機動組保留。舊案場員工不另選案場直接儲存，仍保留原設定。</p>
    </section>
    <EmployeesView ctx={{employees,contracts,now:new Date(`${year}-01-01T00:00:00+08:00`),persist:{employees:setEmployees},askDelete:()=>{}}}/>
  </main>;
}
if(import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview/>);
