export function matchesInvoiceKeyword(invoice, keyword) {
  const terms = String(keyword || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const text = [
    invoice.no, invoice.companyName, invoice.quoteNo, invoice.client,
    invoice.workName, invoice.paymentMethod, invoice.invoiceType,
    invoice.status, invoice.note,
    ...(invoice.items || []).flatMap((item) => [item.desc, item.unit, item.note]),
  ].filter((value) => value != null).join(" ").toLowerCase();
  return terms.every((term) => text.includes(term));
}
