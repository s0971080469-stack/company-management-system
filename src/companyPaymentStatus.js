// 舊版可在核准、填付款日前直接標記已付款；讀取時統一修正這種矛盾狀態。
// 保留入帳旗標，避免既有帳務重複入帳；管理員的新手動調整則保留。
export function normalizeCompanyPaymentStatus(payment) {
  const isCompanyPayment = payment.expenseType === "公司付款"
    || (!payment.expenseType && payment.vendor !== undefined);
  if (isCompanyPayment && !payment.approved && !payment.paymentDate
    && payment.status === "已付款" && !payment.paymentStatusOverride) {
    return { ...payment, status: "未付款" };
  }
  return payment;
}

// Receives the current month/company-filtered rows; suspended payments remain
// in the records but do not contribute to the pending-payment amount.
export function sumPendingPaymentAmount(payments) {
  return payments
    .filter((payment) => payment.status !== "已付款" && !payment.paymentOnHold)
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
}
