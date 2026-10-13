import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { InvoicesView } from "../../src/App.jsx";

const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
function Preview() {
  const [invoices, setInvoices] = useState([{ id: "demo-deposit", no: "TEST0001", companyName: "綠石環保", client: "通知示範客戶", date, dueDate: "", status: "未付款", items: [{ qty: 1, price: 10000 }], taxRate: 5 }]);
  const [billing, setBilling] = useState([]);
  const [messages, setMessages] = useState([]);
  const [failSend, setFailSend] = useState(false);
  const ctx = {
    invoices, billing, quotes: [], vendors: [], now, currentUser: { name: "測試操作人" },
    persist: {
      invoices: setInvoices, billing: setBilling,
      invoicesConfirmed: async (v) => { setInvoices(v); return true; },
      billingConfirmed: async (v) => { setBilling(v); return true; },
    },
    sendInvoiceNotice: async (message) => {
      if (failSend) return { error: { code: "offline" } };
      setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message]);
      return {};
    },
    addAccountingEntry: () => {}, removeAccountingBySource: () => {},
    askDelete: (text, action) => { if (window.confirm(text)) action(); },
  };
  return <main style={{ padding: 24, background: "#F3F3EF", minHeight: "100vh", fontFamily: "sans-serif" }}>
    <h1>發票入帳通知・模擬測試</h1>
    <p>本頁不寫入正式資料、不傳送真實通知。請選擇入帳日，下方會顯示夏碩亞收到的通知內容。</p>
    <label><input type="checkbox" checked={failSend} onChange={(e) => setFailSend(e.target.checked)} />模擬通知失敗</label>
    <InvoicesView ctx={ctx} />
    <section aria-label="通知測試結果" style={{ background: "white", padding: 20, borderRadius: 12, marginTop: 20 }}>
      <h2>夏碩亞的系統通知（{messages.length}）</h2>
      <p>銀行入帳紀錄：{billing.length} 筆</p>
      {messages.map((m) => <div key={m.id} style={{ whiteSpace: "pre-wrap", padding: 12, border: "1px solid #DDD3E6", marginTop: 8 }}>{m.content}</div>)}
    </section>
  </main>;
}
if (import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview />);
