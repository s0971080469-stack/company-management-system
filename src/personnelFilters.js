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
