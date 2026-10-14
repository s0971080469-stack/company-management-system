import { snapshot, versionOf } from "./payrollCreation.js";

export const payrollSiteOf = (row, employees) => employees.find((e) => e.id === row.employeeId)?.siteName || row.siteName || "";
const sum = (items = []) => items.reduce((total, item) => total + (Number(item.amount) || 0), 0);
export const payrollNetAmount = (row) => Number(row.baseSalary || 0) + sum(row.additions) - sum(row.deductions)
  - Number(row.laborInsurance || 0) - Number(row.healthInsurance || 0) - Number(row.pensionSelf || 0) - sum(row.advances);

// 核准綁定當時的月份、案場及薪資明細；之後改金額或調案場需重新批准。
export function payrollApprovalSignature(row, site) {
  return JSON.stringify([row.id, row.employeeId, row.employeeName, row.month, site, row.baseSalary || 0,
    row.additions || [], row.deductions || [], row.laborInsurance || 0, row.healthInsurance || 0,
    row.pensionSelf || 0, row.advances || []]);
}
export const hasPayrollApproval = (row, site) => Boolean(row.releaseApproval?.at
  && row.releaseApproval.signature === payrollApprovalSignature(row, site));
export function payrollReleaseStatus(row, site) {
  if (row.status === "已發放" || row.status === "暫時不發") return row.status;
  return hasPayrollApproval(row, site) ? "已批准，待發放" : "待批准";
}
const pending = (row, site) => row.status !== "已發放" && row.status !== "暫時不發" && !hasPayrollApproval(row, site);

export function payrollSiteGroups(rows, employees) {
  const groups = new Map();
  rows.forEach((row) => {
    const site = payrollSiteOf(row, employees);
    if (!groups.has(site)) groups.set(site, { site, rows: [] });
    groups.get(site).rows.push(row);
  });
  return [...groups.values()].map((group) => {
    const targets = group.rows.filter((row) => pending(row, group.site));
    return { ...group, targets, amount: targets.reduce((total, row) => total + payrollNetAmount(row), 0),
      approved: group.rows.filter((row) => hasPayrollApproval(row, group.site)).length,
      held: group.rows.filter((row) => row.status === "暫時不發").length,
      fingerprint: JSON.stringify(targets.map((row) => payrollApprovalSignature(row, group.site)).sort()) };
  });
}

export async function approvePayrollSite({ payroll, employees, users, month, site, fingerprint,
  isAdmin, actor, senderId, save, send, at = new Date().toISOString() }) {
  if (!isAdmin) throw new Error("只有管理員可以批准發放。");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("請先選擇薪資月份。");
  if (!site) throw new Error("請先在人員管理設定所屬案場，再批准發放。");
  const group = payrollSiteGroups(payroll.filter((row) => row.month === month), employees).find((g) => g.site === site);
  if (!group || !group.targets.length) return { notice: "此案場沒有待批准的薪資，不會重複通知。", changed: false };
  if (group.fingerprint !== fingerprint) throw new Error("案場人員或薪資已異動，請重新整理並確認金額後再批准。");
  if (group.targets.some((row) => !Number.isFinite(payrollNetAmount(row)))) throw new Error("薪資金額有誤，請先修正後再批准。");
  const ids = new Set(group.targets.map((row) => row.id));
  const next = payroll.map((row) => ids.has(row.id) ? { ...row,
    status: "已批准，待發放",
    releaseApproval: { at, by: actor, site, signature: payrollApprovalSignature(row, site) },
    updatedAt: at, updatedBy: actor,
  } : row);
  if (!await save(next)) throw new Error("批准尚未儲存成功，未傳送通知；請重新整理確認後再試。");
  const recipients = [...new Map(users.filter((u) => u.id && u.role === "財務" && u.status !== "停用" && u.id !== senderId).map((u) => [u.id, u])).values()];
  if (!recipients.length) return { changed: true, notice: "已批准發放，但目前沒有可通知的財務人員，請另行通知。" };
  const [year, mon] = month.split("-");
  const money = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 }).format(group.amount);
  const content = `系統通知：薪資已批准發放\n薪資月份：民國 ${Number(year) - 1911} 年 ${Number(mon)} 月\n案場：${site}\n本次批准：${group.targets.length} 人，實發總額 NT$ ${money}\n核准人：${actor}\n請財務人員依薪資表安排發放；暫時不發及已發放的薪資不包含在本次批准內。`;
  try {
    const result = await send(recipients.map((u) => ({ sender_id: senderId, recipient_id: u.id, content })));
    if (result?.error) throw result.error;
  } catch {
    return { changed: true, notice: "已批准發放，但財務通知傳送失敗，請另行通知財務人員。" };
  }
  return { changed: true, notice: `「${site}」已批准 ${group.targets.length} 人發放，並已通知 ${recipients.length} 位財務人員。` };
}

// 和新增薪資一樣讀取最新快照，使用版本條件儲存，不以舊頁面覆蓋他人修改。
export async function approvePayrollFromLatest(client, options, onSaved = () => {}) {
  if (!options.isAdmin) throw new Error("只有管理員可以批准發放。");
  const employees = await snapshot(client, "employees");
  const payroll = await snapshot(client, "payroll");
  const users = await snapshot(client, "sys_users");
  return approvePayrollSite({ ...options, employees: employees.rows, payroll: payroll.rows, users: users.rows,
    save: async (rows) => {
      if (await versionOf(client, "employees") !== employees.version) throw new Error("人員案場剛有異動，請重新整理後再批准。");
      const { data, error } = await client.rpc("save_app_collection", {
        p_collection_key: "payroll", p_expected_version: payroll.version, p_records: rows,
      });
      if (error || !data?.success) return false;
      onSaved({ rows, version: Number(data.version), employees: employees.rows });
      return true;
    },
    send: (messages) => client.from("chat_messages").insert(messages),
  });
}
