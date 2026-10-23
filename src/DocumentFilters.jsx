import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import "./SalesOverview.css";
import "./DocumentFilters.css";

// Display only: DocumentsView retains all filtering, sorting and data operations.
export default function DocumentFilters({ count, month, onMonthChange, handler, handlers, onHandlerChange, contract, contracts, onContractChange, query, onQueryChange }) {
  return <section className="sales-filters document-filters" aria-label="公文清單篩選">
    <div className="sales-filter-heading"><h3><SlidersHorizontal size={16} aria-hidden="true" />清單篩選</h3><span role="status" aria-live="polite">目前顯示 <b>{count}</b> 份</span></div>
    <div className="sales-filter-controls document-filter-row">
      {handlers.length > 0 && <label className="document-filter-field document-handler"><span>編輯人</span><select aria-label="編輯人" value={handler} onChange={e => onHandlerChange(e.target.value)}><option value="全部">全部</option>{handlers.map(name => <option key={name} value={name}>{name}</option>)}</select></label>}
      {contracts.length > 0 && <label className="document-filter-field document-contract"><span>契約案名</span><select aria-label="契約案名" title={contract} value={contract} onChange={e => onContractChange(e.target.value)}><option value="全部">全部</option>{contracts.map(name => <option key={name} value={name}>{name}</option>)}</select></label>}
      <div className="document-month-group"><label className="document-filter-field"><span>發文日期</span><input aria-label="發文日期月份" type="month" value={month} onChange={e => onMonthChange(e.target.value)} /></label>{month && <button type="button" className="document-month-clear" aria-label="顯示全部" title="清除發文月份，顯示全部月份" onClick={() => onMonthChange("")}><X size={15} aria-hidden="true" /></button>}</div>
      <label className="sales-search document-search"><span>關鍵字搜尋</span><div><Search size={16} aria-hidden="true" /><input aria-label="搜尋公文" type="search" placeholder="搜尋文號／公文概述／發文機關" title="可搜尋文號、主旨、公文概述或發文機關" value={query} onChange={e => onQueryChange(e.target.value)} /></div></label>
    </div>
  </section>;
}
