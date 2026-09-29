import React from "react";
import { AlertCircle } from "lucide-react";
import "./InvoiceOverdueReminder.css";

export default function InvoiceOverdueReminder({ reminders = [], formatMoney, formatDate }) {
  if (!reminders.length) return null;
  return (
    <section className="invoice-overdue" aria-label="發票超過45天未入帳提醒">
      <div className="invoice-overdue__heading">
        <AlertCircle size={16} aria-hidden="true" />
        <h3>發票超過 45 天尚未入帳（{reminders.length} 筆）</h3>
        <span className="invoice-overdue__hint">全部月份・選擇入帳日後移除</span>
      </div>
      <ul tabIndex={0} aria-label="尚未入帳發票明細">
        {reminders.map((item) => (
          <li key={item.id || item.no}>
            <div className="invoice-overdue__main">
              <span className="invoice-overdue__client"><strong>{item.client || "未填客戶"}</strong><span className="invoice-overdue__days">（已等待 {item.days} 天）</span></span>
              <span>尚未入帳金額（含稅）：<b>{formatMoney(item.amount)}</b></span>
            </div>
            <div className="invoice-overdue__detail">
              <span>發票：{item.no || "未填號碼"}</span>
              <span>開立日：{formatDate(item.date)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
