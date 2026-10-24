import React from "react";
import { SlidersHorizontal } from "lucide-react";
import CompanyFilterButton from "./CompanyFilterButton.jsx";
import "./SalesOverview.css";

// Display only: BillingView retains month/company state and financial logic.
export default function BillingFilters({ expenseTab, count, monthControl, company, companies, onCompanyChange }) {
  const petty = expenseTab === "零用金";
  const title = petty ? "零用金紀錄" : expenseTab === "公司付款" ? "公司應付款項" : "銀行入帳紀錄";
  const companyLabel = expenseTab === "公司付款" ? "付款公司" : "入帳公司";
  return <section className="sales-filters sales-filters--inline sales-filters--invoice billing-filters" aria-label={`${title}清單篩選`}>
    <div className="sales-filter-heading"><h3><SlidersHorizontal size={16} aria-hidden="true"/>清單篩選</h3><span role="status" aria-live="polite">目前顯示 <b>{count}</b> 筆</span></div>
    <div className="sales-filter-controls sales-inline-row">
      <div className="sales-month-control">{monthControl}</div>
      {!petty && <div className="sales-company-row"><span>{companyLabel}</span><div role="group" aria-label={`${companyLabel}篩選`} tabIndex={0} title="公司選項可左右捲動，或使用 Tab 鍵選取">
        {companies.map(name => <CompanyFilterButton key={name} name={name} selected={company === name} onSelect={onCompanyChange}/>)}
      </div></div>}
    </div>
  </section>;
}
