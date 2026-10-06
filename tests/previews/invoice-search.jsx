import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { InvoicesView, QuotesView, VendorsView } from "../../src/App.jsx";
import "../../src/index.css";

const now = new Date();
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const earlier = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const previousMonth = `${earlier.getFullYear()}-${String(earlier.getMonth() + 1).padStart(2, "0")}`;
const sample = [
  { id: "demo-1", no: "INV-DEMO-001", companyName: "綠石環保", client: "示範甲方工程行", quoteNo: "Q-DEMO-001", workName: "廠區清運", note: "月底請款", items: [{ id: "item-1", desc: "廢棄物清運", qty: 1, price: 10000, note: "夜間施工" }] },
  { id: "demo-2", no: "INV-DEMO-002", companyName: "歐克環境", client: "示範乙方社區", quoteNo: "Q-DEMO-002", workName: "環境清潔", note: "每週清潔", items: [{ id: "item-2", desc: "公共區域清潔", qty: 1, price: 20000 }] },
  { id: "demo-3", no: "INV-DEMO-003", companyName: "示範其他公司", client: "示範甲方工程行", note: "特殊清運", items: [{ id: "item-3", desc: "大型廢棄物", qty: 1, price: 3000 }] },
  { id: "demo-4", no: "INV-DEMO-004", companyName: "綠石環保", client: "示範上月客戶", date: `${previousMonth}-01`, note: "跨月查詢", items: [{ id: "item-4", desc: "清運服務", qty: 1, price: 4000 }] },
].map((row) => ({ date: `${month}-01`, dueDate: "", status: "未付款", paymentMethod: "匯款", invoiceType: "三聯式", taxRate: 5, ...row }));

const sampleQuotes = sample.slice(0, 2).map((row, index) => ({ ...row, id: `quote-demo-${index}`, no: row.quoteNo, status: "草擬", createdBy: "測試使用者" }));
const sampleVendors = [
  { id: "vendor-demo-1", name: "示範甲方工程行", vendorType: "業主", category: "營造", tradingCompany: "綠石環保" },
  { id: "vendor-demo-2", name: "示範乙方社區", vendorType: "業主", category: "物業", tradingCompany: "歐克環境" },
  { id: "vendor-demo-3", name: "示範清潔供應商", vendorType: "供應商", category: "清潔", tradingCompany: "綠石環保" },
];
const previewTabs = [{ key: "invoices", label: "發票" }, { key: "quotes", label: "估價單" }, { key: "vendors", label: "廠商／業主管理" }];

function Preview() {
  const [invoices, setInvoices] = useState(sample);
  const [billing, setBilling] = useState([]);
  const [quotes, setQuotes] = useState(sampleQuotes);
  const [vendors, setVendors] = useState(sampleVendors);
  const [quoteTemplates, setQuoteTemplates] = useState([]);
  const [tab, setTab] = useState("invoices");
  const [revision, setRevision] = useState(0);
  const ctx = {
    invoices, billing, quotes, vendors, quoteTemplates, now,
    currentUser: { name: "測試使用者" },
    persist: { invoices: setInvoices, billing: setBilling, quotes: setQuotes, vendors: setVendors, quoteTemplates: setQuoteTemplates },
    addAccountingEntry: () => {}, removeAccountingBySource: () => {},
    askDelete: (message, action) => { if (window.confirm(message)) action(); },
  };
  return <main style={{ padding: "24px clamp(12px, 3vw, 36px)", background: "#F3F3EF", minHeight: "100vh" }}>
    <aside style={{ padding: 16, background: "#fff6da", border: "1px solid #d7b85c", borderRadius: 10, marginBottom: 20 }}>
      <strong>搜尋欄位測試頁・模擬資料</strong>
      <p style={{ fontSize: 13, lineHeight: 1.7 }}>切換下方頁面確認搜尋框位置：發票位於「其他」後方；估價單及廠商／業主管理緊接篩選按鈕。可輸入「甲方」測試搜尋。此頁操作只保留在本次預覽。</p>
      <nav aria-label="切換測試頁" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {previewTabs.map((item) => <button key={item.key} aria-pressed={tab === item.key} onClick={() => setTab(item.key)} style={{ padding: "7px 12px", border: "1px solid #b9b4a8", borderRadius: 7, cursor: "pointer", background: tab === item.key ? "#f4e7c3" : "#fff" }}>{item.label}</button>)}
        <button onClick={() => { setInvoices(sample); setBilling([]); setQuotes(sampleQuotes); setVendors(sampleVendors); setQuoteTemplates([]); setRevision((value) => value + 1); }}>重設測試資料</button>
      </nav>
    </aside>
    {tab === "invoices" && <InvoicesView key={revision} ctx={ctx} />}
    {tab === "quotes" && <QuotesView key={revision} ctx={ctx} setTab={setTab} />}
    {tab === "vendors" && <VendorsView key={revision} ctx={ctx} />}
  </main>;
}

if (import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview />);
