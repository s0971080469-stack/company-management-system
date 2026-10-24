import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import CompanyFilterButton from "./CompanyFilterButton.jsx";
import "./WorkforceOverview.css";
import "./ContractFilters.css";

export default function ContractFilters({count,company,companies,onCompanyChange,year,years,onYearChange,formatYear,query,onQueryChange}) {
  return <div className="workforce-overview workforce-overview--personnel contract-filters">
    <section className="workforce-filters" aria-label="契約清單篩選">
      <div className="workforce-filter-heading"><h3><SlidersHorizontal size={15} aria-hidden="true"/>清單篩選</h3><span role="status" aria-live="polite">目前顯示 <b>{count}</b> 份契約</span></div>
      <div className="workforce-personnel-controls">
        <div className="workforce-company-filters"><span>承攬公司</span><div role="group" aria-label="承攬公司篩選" tabIndex={0} title="公司選項可左右捲動，或使用 Tab 鍵選取">{companies.map(name=><CompanyFilterButton key={name} name={name} selected={company===name} onSelect={onCompanyChange}/>)}</div></div>
        <label className="workforce-field"><span>契約年度</span><select aria-label="契約年度" value={year} onChange={e=>onYearChange(e.target.value)}>{years.map(value=><option key={value} value={value}>{value === "全部" ? "全部年度" : `${formatYear(value)} 年`}</option>)}</select></label>
        <label className="workforce-field workforce-search"><span>關鍵字搜尋</span><div><Search size={16} aria-hidden="true"/><input type="search" aria-label="搜尋契約" placeholder="搜尋契約編號／名稱／對方單位" title="搜尋契約編號、名稱或對方單位" value={query} onChange={e=>onQueryChange(e.target.value)}/></div></label>
      </div>
      <div className="workforce-filter-footer"><span>公司、年度與關鍵字可交叉篩選</span><span>起訖日期涵蓋該年度即列入</span></div>
    </section>
  </div>;
}
