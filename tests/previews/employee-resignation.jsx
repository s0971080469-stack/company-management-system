import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { EmployeesView } from "../../src/App.jsx";
import { workforceEmployees, workforceSites } from "../fixtures/workforce-overview.js";
import "../../src/index.css";

function Preview() {
  const [employees, setEmployees] = useState(() => workforceEmployees.map(e => ({
    ...e, additions: [], deductions: [], advances: [], phone: "", email: "",
    resignationDate: e.status === "離職" ? "2026-10-25" : "",
  })));
  const [notice, setNotice] = useState("");
  const ctx = {
    employees, contracts: workforceSites.slice(2).map((title, i) => ({ id: `demo-${i}`, title })),
    persist: { employees: rows => { setEmployees(rows); setNotice("測試資料已更新，重新整理即恢復；未修改正式資料。"); } },
    askDelete: () => setNotice("此測試頁不執行刪除，請使用編輯測試離職日。"),
  };
  return <main style={{ padding: "24px", background: "#f3f3ef", minHeight: "100vh" }}>
    <div style={{ marginBottom: 18, padding: 14, borderRadius: 10, background: "#eaf3f8", color: "#244858" }}>
      人員管理・離職日測試｜全部為模擬資料，不讀寫正式人員或薪資。點「編輯」→ 狀態選「離職」→ 選日期 → 儲存。
    </div>
    {notice && <p role="status">{notice}</p>}
    <EmployeesView ctx={ctx} />
  </main>;
}
if (import.meta.env.DEV) createRoot(document.getElementById("root")).render(<Preview />);
