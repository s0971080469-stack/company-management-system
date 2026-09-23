const DAY_MS = 86400000;

// 用台灣日曆日期計算，避免 UTC 午夜及時分秒影響 45 天的界線。
function dayNumber(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.getTime() / DAY_MS;
}

export function getInvoiceReminders(invoices = [], now = new Date()) {
  const today = typeof now === "string" && /^\d{4}-\d{2}-\d{2}$/.test(now)
    ? now
    : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const todayDay = dayNumber(today);
  if (todayDay === null) return [];
  return invoices.flatMap((invoice) => {
    if (invoice.dueDate || invoice.status === "已作廢") return [];
    const issuedDay = dayNumber(invoice.date);
    if (issuedDay === null || todayDay - issuedDay <= 45) return [];
    const subtotal = (invoice.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);
    const amount = invoice.total ?? subtotal * (1 + (Number(invoice.taxRate) || 0) / 100);
    return [{ id: invoice.id, no: invoice.no, client: invoice.client, date: invoice.date,
      amount: Number(amount) || 0, days: todayDay - issuedDay }];
  }).sort((a, b) => b.days - a.days || String(a.no || "").localeCompare(String(b.no || "")));
}
