export const formats = { money: value => `NT$ ${Number(value).toLocaleString("zh-TW")}`, rocYear: year => Number(year) - 1911 };
export function reportFixture(mode = "normal", year = "2026") {
  const scale = mode === "empty" ? 0 : mode === "large" ? 1000 : year === "2025" ? 0.7 : 1;
  const revenueTrend = Array.from({ length: 12 }, (_, i) => ({ month: `${String(i + 1).padStart(2,"0")}月`, 營收: Math.round((240000 + i * 15000) * scale) }));
  const payrollTrend = Array.from({ length: 12 }, (_, i) => ({ month: `${String(i + 1).padStart(2,"0")}月`, 薪資成本: Math.round((100000 + i * 5000) * scale) }));
  const expenseByCategory = mode === "empty" ? [] : [{name:"薪資",value:1530000*scale},{name:"用品採購",value:360000*scale},{name:"設備維護",value:120000*scale}];
  return { year, years: ["2026","2025"], revenueTrend, payrollTrend, expenseByCategory, headcountByDept:mode === "empty" ? [] : [{dept:"現場服務",count:12},{dept:"行政支援",count:4}], totals:{revenue:revenueTrend.reduce((s,r)=>s+r.營收,0),expense:expenseByCategory.reduce((s,r)=>s+r.value,0),payroll:payrollTrend.reduce((s,r)=>s+r.薪資成本,0)}, formats };
}
export function accessFixture(mode = "normal") {
  const roles = mode === "empty" ? [] : ["管理員", "財務", "行政", ...(mode === "large" ? Array.from({length:8},(_,i)=>`示範自訂角色 ${i+1}`) : [])];
  const users = mode === "empty" ? [] : Array.from({length:mode === "large" ? 20 : 4},(_,i)=>({id:`demo-${i}`,name:`示範人員 ${i+1}`,email:`demo${i+1}@example.com`,role:roles[i%roles.length],employee:i===3?"未綁定":`示範員工 ${i+1}`,status:i%4===3?"停用":"啟用"}));
  return { roles, users };
}
