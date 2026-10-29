// Match Contract Management's calendar-year overlap rule; missing bounds remain open.
export function personnelSiteFilterOptions(contracts, year) {
  const yearStart = `${year}-01-01`, yearEnd = `${year}-12-31`;
  return [...new Set(["公司總部", "機動組", ...contracts
    .filter(contract => (contract.startDate || yearStart) <= yearEnd && (contract.endDate || yearEnd) >= yearStart)
    .map(contract => contract.title).filter(Boolean)])];
}

export const personnelFilterYear = (now = new Date()) => new Intl.DateTimeFormat("en", {
  timeZone: "Asia/Taipei", year: "numeric",
}).format(now);

// Combine all selected filters; selecting a company must not skip the site filter.
export function filterPersonnel(employees, { query = "", company = "全部", site = "全部", knownCompanies = [] } = {}) {
  return employees.filter(employee => {
    const text = `${employee.name || ""}${employee.dept || ""}${employee.title || ""}`.toLowerCase();
    if (!text.includes(query.toLowerCase())) return false;
    if (company !== "全部") {
      if (company === "其他") {
        if (!employee.company || knownCompanies.includes(employee.company)) return false;
      } else if (employee.company !== company) return false;
    }
    return site === "全部" || (employee.siteName || "") === site;
  });
}
