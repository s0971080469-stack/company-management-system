import { generatePayrollForMonth, createEmployeePayroll, assertSalaryMatches } from "./payrollGeneration.js";

async function versionOf(client, key) {
  const { data, error } = await client.from("app_collection_versions").select("version").eq("collection_key", key).single();
  if (error || data?.version == null || !Number.isSafeInteger(Number(data.version))) throw new Error("無法讀取最新資料，請確認網路後重試。");
  return Number(data.version);
}

async function snapshot(client, key) {
  const version = await versionOf(client, key);
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from("app_records").select("value").eq("collection_key", key)
      .order("sort_order", { ascending: true }).order("record_id", { ascending: true }).range(from, from + 999);
    if (error || !Array.isArray(data)) throw new Error("無法完整讀取最新資料，已停止產生薪資表。");
    rows.push(...data.map((record) => record.value));
    if (data.length < 1000) break;
  }
  if (await versionOf(client, key) !== version) throw new Error("讀取期間資料有異動，請重新產生薪資表。");
  return { rows, version };
}

// 不使用畫面快取／fallback；寫入綁定此次快照版本，不受 Realtime 更新影響。
export async function createPayrollFromLatest(client, { month, isAdmin, makeId }) {
  const employees = await snapshot(client, "employees");
  const payroll = await snapshot(client, "payroll");
  const result = generatePayrollForMonth({
    employees: employees.rows, payroll: payroll.rows, month, isAdmin,
    createRow: (employee, targetMonth) => {
      const row = createEmployeePayroll(employee, targetMonth, makeId);
      assertSalaryMatches(employee, row);
      return row;
    },
  });
  if (!result.addedCount) return { ...result, employees: employees.rows };
  if (await versionOf(client, "employees") !== employees.version) throw new Error("人員資料剛有異動，請重新產生以套用最新金額。");
  const { data, error } = await client.rpc("save_app_collection", {
    p_collection_key: "payroll", p_expected_version: payroll.version, p_records: result.rows,
  });
  if (error) throw new Error("薪資表儲存未確認成功，請重新整理確認後再試。");
  if (!data?.success) throw new Error("薪資表已被其他人更新，本次未寫入，請重新操作。");
  return { ...result, employees: employees.rows, version: Number(data.version) };
}
