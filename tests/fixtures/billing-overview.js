// Entirely fictional data; never imports production data, credentials, or storage.
export function billingFixture(mode = "normal") {
  const empty = mode === "empty";
  const names = ["示範環境清潔有限公司", "示範科技有限公司", "示範園藝企業社", "示範設備有限公司", "示範五金企業行", "示範耗材有限公司"];
  const count = empty ? 0 : mode === "many" ? 24 : 6;
  return {
    currentMonthLabel: "115 年 10 月", filterPeriodLabel: "115 年 10 月", companyFilter: "全部",
    daysUntil: date => Number(date.slice(-2)) - 21,
    daysOverdue: date => 21 - Number(date.slice(-2)),
    formats: { money: value => `NT$ ${Number(value || 0).toLocaleString("zh-TW")}`, date: value => value ? `115/${value.slice(5).replace("-", "/")}` : "—" },
    duePayments: Array.from({ length: count }, (_, i) => ({ id: `demo-${i}`, vendor: names[i % names.length], amount: [48000, 32500, 780, 3200, 11600, 12800][i % 6], plannedPaymentDate: `2026-10-${21 + i % 6}` })),
    overdueApproved: mode === "overdue" ? [{ id: "late-1", vendor: "示範逾期廠商（模擬資料）", amount: 26800, plannedPaymentDate: "2026-10-18" }] : [],
    stats: empty ? { pettyCashMonthTotal: 0, pettyCashTotal: 0, pettyCashCount: 0, pettyCashBalance: 0, bankDepositMonthTotal: 0, bankDepositTotal: 0, bankDepositCount: 0, companyPaymentCount: 0, paidCount: 0, approvedTotal: 0, pendingTotal: 0 } : {
      pettyCashMonthTotal: 6280, pettyCashTotal: 14920, pettyCashCount: 28, pettyCashBalance: mode === "overdue" ? -1800 : 5080,
      bankDepositMonthTotal: 865000, bankDepositTotal: 3815000, bankDepositCount: 46,
      companyPaymentCount: 32, paidCount: 21, approvedTotal: 268500, pendingTotal: 108880,
    },
  };
}
