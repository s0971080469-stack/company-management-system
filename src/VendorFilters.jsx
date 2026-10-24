import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import CompanyFilterButton from "./CompanyFilterButton.jsx";
import "./SalesOverview.css";
import "./VendorFilters.css";

// Presentation only; VendorsView owns filtering and all data operations.
export default function VendorFilters({ count, type, onTypeChange, query, onQueryChange }) {
  const options = [{ label: "全部" }, { label: "供應商", tone: { bg: "#E4E9F0", fg: "#3E5872" } }, { label: "業主", tone: { bg: "#F5E9EE", fg: "#8B3A5C" } }];
  return <section className="sales-filters vendor-filters" aria-label="廠商清單篩選">
    <div className="sales-filter-heading"><h3><SlidersHorizontal size={16} aria-hidden="true" />清單篩選</h3><span role="status" aria-live="polite">目前顯示 <b>{count}</b> 家</span></div>
    <div className="sales-filter-controls vendor-filter-row">
      <div className="sales-company-row"><span>廠商類型</span><div role="group" aria-label="廠商類型篩選">{options.map(({ label, tone }) => <CompanyFilterButton key={label} name={label} tone={tone} selected={type === label} onSelect={onTypeChange}/>)}</div></div>
      <label className="sales-search vendor-search"><span>關鍵字搜尋</span><div><Search size={16} aria-hidden="true" /><input type="search" aria-label="搜尋廠商" placeholder="搜尋名稱／業務類別／往來公司" title="可依名稱、業務類別或往來公司搜尋" value={query} onChange={event => onQueryChange(event.target.value)} /></div></label>
    </div>
  </section>;
}
