const validMonth = (month) => typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && Number(month.slice(0, 4)) > 0;

// 以畫面選取的薪資月份計算，避免受月底日期、時區及每月 17 日的預設切換影響。
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
