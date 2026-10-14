import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import PayrollApprovalButton from "../../src/PayrollApprovalButton.jsx";
import { approvePayrollSite, payrollNetAmount, payrollReleaseStatus } from "../../src/payrollApproval.js";
import "../../src/index.css";

const employees = [
  { id: "a", name: "示範員工甲", siteName: "公司總部" },
  { id: "b", name: "示範員工乙", siteName: "公司總部" },
  { id: "c", name: "示範員工丙", siteName: "環境維護示範案場" },
  { id: "d", name: "示範員工丁", siteName: "環境維護示範案場" },
  { id: "e", name: "示範員工戊", siteName: "機動組" },
];
const sample = ["2026-09", "2026-10"].flatMap((month) => employees.map((e, i) => ({
  id: `${month}-${e.id}`, employeeId: e.id, employeeName: e.name, siteName: e.siteName, month,
  baseSalary: 32000 + i * 1000, additions: [{ name: "津貼", amount: 1000 }], deductions: [],
  laborInsurance: 800, healthInsurance: 500, advances: [], status: i === 3 ? "暫時不發" : i === 4 ? "已發放" : "待批准",
})));
const money = (n) => `NT$ ${n.toLocaleString("zh-TW")}`;
const monthLabel = (value) => `民國 ${Number(value.slice(0, 4)) - 1911} 年 ${Number(value.slice(5))} 月`;
const control = { padding: "8px 12px", border: "1px solid #d5d2c7", borderRadius: 8, background: "#fff", font: "inherit" };
function Preview() {
  const [rows, setRows] = useState(sample);
  const [month, setMonth] = useState("2026-09");
  const [site, setSite] = useState("全部");
  const [role, setRole] = useState("夏碩亞");
  const [messages, setMessages] = useState([]);
  const [scenario, setScenario] = useState("正常");
  const [resetKey, setResetKey] = useState(0);
  const filtered = rows.filter((r) => r.month === month && (site === "全部" || r.siteName === site));
  const approve = (selection) => approvePayrollSite({ ...selection, payroll: rows, employees,
    users: [{ id: "finance", name: "示範財務人員", role: "財務", status: "啟用" }],
    isAdmin: role === "夏碩亞", actor: "夏碩亞（測試）", senderId: "demo-admin",
    save: async (next) => { if (scenario === "儲存失敗") return false; setRows(next); return true; },
    send: async (next) => { if (scenario === "通知失敗") return { error: new Error("demo") }; setMessages((prev) => [...next, ...prev]); return { error: null }; },
  });
  return <main style={{ padding: "24px clamp(12px,3vw,36px)", background: "#f3f3ef", minHeight: "100vh", color: "#1b2333" }}>
    <aside style={{ padding: "12px 16px", background: "#fff6da", border: "1px solid #d7b85c", borderRadius: 10 }}>
      <strong>測試預覽・模擬資料，不連接正式資料庫、不傳送真實訊息</strong>
      <p style={{ fontSize: 13, marginBottom: 0 }}>選擇個別案場後，月份旁會出現「批准發放」。選擇「全部」不顯示按鈕。下方可查看模擬財務通知。</p>
    </aside>
    <h2>薪資表管理</h2>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginBottom: 18 }}>
      <label>所屬案場 <select aria-label="所屬案場" value={site} onChange={(e) => setSite(e.target.value)} style={control}>
        {["全部", "公司總部", "環境維護示範案場", "機動組"].map((s) => <option key={s}>{s}</option>)}
      </select></label>
      <label>月份 <select aria-label="月份" value={month} onChange={(e) => setMonth(e.target.value)} style={control}>
        {["2026-09", "2026-10"].map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
      </select></label>
      <PayrollApprovalButton key={`${month}:${site}:${role}:${scenario}:${resetKey}`} rows={filtered} employees={employees} month={month} site={site} isAdmin={role === "夏碩亞"}
        onApprove={approve} formatMoney={money} formatMonth={monthLabel} />
    </div>
    <details style={{ marginBottom: 18, fontSize: 13 }}><summary style={{ cursor: "pointer", color: "#767b8a" }}>模擬測試工具（不會出現在正式版）</summary>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
      <label>測試身分 <select aria-label="測試身分" value={role} onChange={(e) => setRole(e.target.value)} style={control}><option>夏碩亞</option><option>財務</option></select></label>
      <label>測試情境 <select aria-label="測試情境" value={scenario} onChange={(e) => setScenario(e.target.value)} style={control}><option>正常</option><option>儲存失敗</option><option>通知失敗</option></select></label>
      <button style={control} onClick={() => { setRows(sample); setMessages([]); setScenario("正常"); setResetKey((key) => key + 1); }}>重設測試</button>
      </div>
    </details>
    <div style={{ overflowX: "auto", background: "white", borderRadius: 12 }}><table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", fontSize: 14 }}>
      <thead><tr>{["員工", "所屬案場", "底薪", "實發淨額", "狀態"].map((label) => <th key={label} style={{ textAlign: "left", padding: 12 }}>{label}</th>)}</tr></thead>
      <tbody>{filtered.map((r) => <tr key={r.id} style={{ background: r.status === "已發放" ? "#eef7f2" : r.status === "暫時不發" ? "#fceeef" : "#fff8e5", borderTop: "1px solid #e6e4da" }}>
        {[r.employeeName, r.siteName, money(r.baseSalary), money(payrollNetAmount(r)), payrollReleaseStatus(r, r.siteName)].map((text, i) => <td key={i} style={{ padding: 12 }}>{text}</td>)}
      </tr>)}</tbody>
    </table></div>
    <section style={{ padding: "16px 20px", marginTop: 18, background: "#fff", border: "1px solid #e6e4da", borderRadius: 12 }}>
      <h3 style={{ marginTop: 0 }}>財務內部訊息（模擬收件匣）</h3>
      {!messages.length ? <p style={{ color: "#767b8a", fontSize: 14 }}>尚無通知。批准成功後會出現在這裡。</p> : messages.map((m, i) => <article key={i} style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.8, background: "#f7f4eb", borderRadius: 8, padding: 14, marginBottom: 10 }}>{m.content}</article>)}
    </section>
  </main>;
}
if (import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview />);
