import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ContractsView, ContractBillingView } from "../../src/App.jsx";
import "../../src/index.css";

const now = new Date();
const year = now.getFullYear();
const nearExpiry = new Date(year, now.getMonth(), now.getDate() + 20);
const dateText = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const companies = ["綠石環保", "歐克環境", "上藝除蟲", "維娜科技", "其他", ""];
const samples = companies.map((company, index) => ({
  id: `contract-color-demo-${index}`, no: `CT-DEMO-${String(index + 1).padStart(3, "0")}`,
  title: `${company || "未填公司"}示範契約`, party: "示範客戶", contractorCompany: company,
  type: "服務", startDate: `${year - 1}-01-01`, endDate: index === 1 ? dateText(nearExpiry) : `${year + 1}-12-31`,
  amount: 120000 + index * 20000, owner: "示範負責人", status: "生效中",
  hasPerformanceBond: "無", hasInsurance: "無", note: "配色預覽用模擬資料",
}));

function Preview() {
  const [tab, setTab] = useState("contracts");
  const [contracts, setContracts] = useState(samples);
  const [contractBilling, setContractBilling] = useState([]);
  const ctx = {
    contracts, contractBilling, vendors: [], sysUsers: [], isAdmin: false,
    persist: { contracts: setContracts, contractBilling: setContractBilling },
    askDelete: (message, action) => { if (window.confirm(`${message}（僅影響測試資料）`)) action(); },
  };
  return <main style={{ padding: "24px clamp(12px,3vw,36px)", minHeight: "100vh", background: "#F3F3EF", color: "#1B2333" }}>
    <style>{`@media(max-width:700px){.stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}`}</style>
    <aside style={{ padding: "14px 18px", background: "#fff6da", border: "1px solid #d7b85c", borderRadius: 10, marginBottom: 20 }}>
      <strong>公司配色測試頁・模擬資料</strong>
      <p style={{ fontSize: 13, lineHeight: 1.7 }}>沿用發票及收支管理的公司配色：綠石綠、歐克藍、上藝紫、維娜橘、其他灰。可切換頁面並點選公司篩選。操作僅保留在本頁，掃描檔上傳已停用，不修改正式資料。</p>
      <nav aria-label="切換測試頁" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[["contracts", "契約管理"], ["billing", "每月請款追蹤"]].map(([key, label]) =>
          <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #B8912B", cursor: "pointer", background: tab === key ? "#1B2333" : "white", color: tab === key ? "white" : "#1B2333" }}>{label}</button>)}
      </nav>
    </aside>
    {tab === "contracts" ? <ContractsView ctx={ctx} /> : <ContractBillingView ctx={ctx} previewOnly />}
  </main>;
}

if (import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview />);
