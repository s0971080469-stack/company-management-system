// Illustrative values only; no company records or backend connection.
export function contractOverviewFixture(year = "2026", mode = "normal") {
  const totals = { "全部": [68420000, 32], "2027": [18600000, 9], "2026": [48620000, 27], "2025": [24350000, 14] };
  const [totalAmount, filteredCount] = totals[year] || [0, 0];
  const empty = mode === "empty";
  return {
    year, yearTabs: mode === "many" ? ["全部", ...Array.from({ length: 12 }, (_, i) => String(2027 - i))] : ["全部", "2027", "2026", "2025"],
    totalCount: empty ? 0 : 32, totalAmount: empty ? 0 : mode === "large" ? 123456789012 : totalAmount,
    filteredCount: empty ? 0 : filteredCount, activeCount: empty ? 0 : 26, expiringCount: empty ? 0 : 2,
    formatYear: value => String(Number(value) - 1911), formatMoney: value => `NT$ ${Number(value).toLocaleString("en-US")}`,
  };
}
