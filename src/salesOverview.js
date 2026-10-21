// Read-only summaries of the already-filtered rows. Keep row amount semantics in the caller.
export function quoteOverviewStats(rows, amountOf) {
  return { count: rows.length, total: rows.reduce((sum, row) => sum + Number(amountOf(row) || 0), 0), approved: rows.filter(row => row.status === "已核准").length };
}
export function invoiceOverviewStats(rows, amountOf) {
  const valid = rows.filter(row => row.status !== "已作廢");
  return { count: rows.length, total: valid.reduce((sum, row) => sum + Number(amountOf(row) || 0), 0), pending: valid.filter(row => !row.dueDate).reduce((sum, row) => sum + Number(amountOf(row) || 0), 0) };
}
