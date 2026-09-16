const validMonth = (month) => typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && Number(month.slice(0, 4)) > 0;

// 以畫面選取的薪資月份計算，避免受月底日期、時區及每月 17 日的預設切換影響。
export function employeeSalary(employee, makeId) {
  const number = (value) => {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) throw new Error("人員薪資含有無效數字，請先修正人員管理資料。");
    return amount;
  };
  const items = (key) => {
    const values = employee[key] ?? [];
    if (!Array.isArray(values)) throw new Error("人員薪資項目格式不正確。");
    return values.map((item) => ({ ...item, id: makeId(), amount: number(item.amount) }));
  };
  return {
    baseSalary: number(employee.baseSalary),
    additions: items("additions"), deductions: items("deductions"),
    laborInsurance: number(employee.laborInsurance), healthInsurance: number(employee.healthInsurance),
    pensionSelf: number(employee.pensionSelf),
    advances: employee.advances == null && employee.advance != null
      ? [{ id: makeId(), amount: number(employee.advance), date: employee.advanceDate || "" }]
      : items("advances"),
  };
}

export function createEmployeePayroll(employee, month, makeId) {
  return {
    id: makeId(), month, employeeId: employee.id, employeeName: employee.name,
    department: employee.dept || "", siteName: employee.siteName || "", company: employee.company || "",
    ...employeeSalary(employee, makeId),
    insuranceStatus: employee.insuranceStatus || "無加保", paymentDate: "", note: "",
    status: "待發放", posted: false,
  };
}

export function assertSalaryMatches(employee, row) {
  const normalize = (value) => JSON.stringify(employeeSalary(value, () => ""));
  if (normalize(employee) !== normalize(row)) throw new Error("新增薪資與人員管理金額不一致，已停止產生。");
}

export function nextPayrollMonth(month) {
  if (!validMonth(month)) return "";
  const year = Number(month.slice(0, 4));
  const number = Number(month.slice(5));
  if (number === 12) return year < 9999 ? `${String(year + 1).padStart(4, "0")}-01` : "";
  return `${month.slice(0, 4)}-${String(number + 1).padStart(2, "0")}`;
}

export function payrollGenerationLocked(payroll, month, isAdmin) {
  return !validMonth(month) || (!isAdmin && payroll.some((row) => row.month === month));
}

// 本月與下月共用同一條新增路徑：只補齊在職員工，永遠不重建、刪除或覆寫既有列。
export function generatePayrollForMonth({ payroll, employees, month, isAdmin, createRow }) {
  if (payrollGenerationLocked(payroll, month, isAdmin)) return { rows: payroll, addedCount: 0, locked: true };
  const existingIds = new Set(payroll.filter((row) => row.month === month).map((row) => row.employeeId));
  const additions = [];
  for (const employee of employees) {
    if (employee.status !== "在職" || existingIds.has(employee.id)) continue;
    additions.push(createRow(employee, month));
    existingIds.add(employee.id);
  }
  return { rows: additions.length ? [...payroll, ...additions] : payroll, addedCount: additions.length, locked: false };
}
