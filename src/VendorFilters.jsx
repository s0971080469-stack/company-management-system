import React from "react";
import { Check, Search, SlidersHorizontal } from "lucide-react";
import "./SalesOverview.css";
import "./VendorFilters.css";

// Presentation only; VendorsView owns filtering and all data operations.
export default function VendorFilters({ count, type, onTypeChange, query, onQueryChange }) {
  const options = [{ label: "全部", color: "#edf2f7" }, { label: "供應商", color: "#E4E9F0" }, { label: "業主", color: "#F5E9EE" }];
  return <section className="sales-filters vendor-filters" aria-label="廠商清單篩選">
    <div className="sales-filter-heading"><h3><SlidersHorizontal size={16} aria-hidden="true" />清單篩選</h3><span role="status" aria-live="polite">目前顯示 <b>{count}</b> 家</span></div>
    <div className="sales-filter-controls vendor-filter-row">
      <div className="sales-company-row"><span>廠商類型</span><div role="group" aria-label="廠商類型篩選">{options.map(({ label, color }) => <button type="button" key={label} aria-pressed={type === label} onClick={() => onTypeChange(label)} style={{ "--sales-company-bg": color }}><i aria-hidden="true" />{label}{type === label && <Check size={13} aria-hidden="true" />}</button>)}</div></div>
      <label className="sales-search vendor-search"><span>關鍵字搜尋</span><div><Search size={16} aria-hidden="true" /><input type="search" aria-label="搜尋廠商" placeholder="搜尋名稱／業務類別／往來公司" title="可依名稱、業務類別或往來公司搜尋" value={query} onChange={event => onQueryChange(event.target.value)} /></div></label>
    </div>
  </section>;
}
