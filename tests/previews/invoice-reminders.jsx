import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import InvoiceOverdueReminder from "../../src/InvoiceOverdueReminder.jsx";
import DashboardOverview from "../../src/DashboardOverview.jsx";
import { getInvoiceReminders } from "../../src/invoiceReminders.js";
import "../../src/index.css";

const sample = [
  { id: "a", no: "測試-001", client: "示範客戶甲公司", date: "2026-08-01", dueDate: "", total: 10500 },
  { id: "b", no: "測試-002", client: "示範客戶乙公司", date: "2026-08-08", dueDate: "", total: 22050 },
  { id: "c", no: "測試-003", client: "示範客戶丙公司（剛好45天）", date: "2026-08-09", dueDate: "", total: 6300 },
];
const money = (value) => `NT$ ${Number(value).toLocaleString("zh-TW")}`;
const date = (value) => value ? `${Number(value.slice(0, 4)) - 1911}/${value.slice(5).replace("-", "/")}` : "—";
const button = { padding: "8px 14px", border: "1px solid #b9b4a8", borderRadius: 8, cursor: "pointer", background: "#fff" };
function Preview() {
  const [rows, setRows] = useState(sample);
  const [tab, setTab] = useState("發票");
  const reminders = getInvoiceReminders(rows, "2026-09-23");
  return <main style={{ padding: "24px clamp(12px, 3vw, 36px)", background: "#F3F3EF", minHeight: "100vh", color: "#21344d" }}>
    <aside style={{ padding: 16, background: "#fff6da", border: "1px solid #d7b85c", borderRadius: 10, marginBottom: 20 }}>
      <strong>本機預覽・全部為模擬資料，不連接資料庫</strong>
      <p style={{ fontSize: 13, lineHeight: 1.7 }}>以民國115年9月23日為測試日期。下方選擇入帳日後，兩個頁面的提醒都會消失；取消日期後會再出現。第45天不提醒，第46天開始提醒。</p>
      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["發票", "總覽儀表板"].map((label) => <button key={label} style={{ ...button, background: tab === label ? "#f4e7c3" : "#fff" }} onClick={() => setTab(label)}>{label}</button>)}
        <button style={button} onClick={() => setRows(sample)}>重設模擬資料</button>
      </nav>
    </aside>
    {tab === "發票" ? <>
      <h2>發票</h2>
      <InvoiceOverdueReminder reminders={reminders} formatMoney={money} formatDate={date} />
      <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12 }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
        <thead><tr>{["發票號碼", "客戶", "含稅金額", "開立日", "入帳日（模擬）"].map((label) => <th style={{ padding: 12, textAlign: "left" }} key={label}>{label}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} style={{ borderTop: "1px solid #ddd" }}>
          <td style={{ padding: 12 }}>{row.no}</td><td style={{ padding: 12 }}>{row.client}</td><td style={{ padding: 12 }}>{money(row.total)}</td><td style={{ padding: 12 }}>{date(row.date)}</td>
          <td style={{ padding: 12 }}><input aria-label={`${row.no}入帳日`} type="date" value={row.dueDate} onChange={(e) => setRows(rows.map((item) => item.id === row.id ? { ...item, dueDate: e.target.value } : item))} />
            {row.dueDate && <button style={{ ...button, marginTop: 6 }} onClick={() => setRows(rows.map((item) => item.id === row.id ? { ...item, dueDate: "" } : item))}>取消選擇日期</button>}
          </td>
        </tr>)}</tbody>
      </table></div>
    </> : <DashboardOverview
      summary={{ today: "2026-09-23", billingMonth: "2026-09", thisMonth: "2026-09", monthInvoiceTotal: 38850, pendingDepositAmount: rows.filter((r) => !r.dueDate).reduce((s, r) => s + r.total, 0), pendingBilling: 0, activeEmp: 0, employeeCount: 0, clockedInCount: 0, activeContracts: 0, totalContracts: 0, supplierCount: 0, vendorCount: 0, billedCount: 0, unbilledCount: 0, contractCount: 0, isAdmin: true, pendingApprovalCount: 0, income: 0, expense: 0 }}
      alerts={[]} invoiceReminders={reminders} trend={[]} categories={[]} todoItems={[]} recentActivity={[]}
      navigate={() => setTab("發票")} formats={{ money, date, dateTime: date, month: () => "115年9月" }} StatusBadge={({ status }) => <span>{status}</span>}
    />}
  </main>;
}
if (import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview />);
