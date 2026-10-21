export const workforceCompanies = ["全部", "綠石環保", "歐克環境", "上藝除蟲", "維娜科技", "其他"];
export const workforceSites = ["公司總部", "機動組", "市立文化中心環境清潔維護示範案場", "科技園區公共空間清潔維護與病媒防治示範案場"];
export const workforceEmployees = [
  ["示範員工甲", "行政部", "行政專員", "綠石環保", "公司總部", "在職", 36000],
  ["示範員工乙", "行政部", "財務專員", "歐克環境", "公司總部", "在職", 38500],
  ["示範員工丙", "環境維護部", "現場主管", "綠石環保", workforceSites[2], "在職", 42000],
  ["示範員工丁", "環境維護部", "清潔人員", "綠石環保", workforceSites[2], "在職", 32000],
  ["示範員工戊", "機動服務部", "環境維護員", "上藝除蟲", "機動組", "在職", 34500],
  ["示範員工己", "環境維護部", "現場主管", "維娜科技", workforceSites[3], "在職", 41000],
  ["示範員工庚", "環境維護部", "清潔人員", "其他", workforceSites[3], "在職", 32500],
  ["示範員工辛", "行政部", "行政助理", "", "公司總部", "離職", 30000],
].map(([name, dept, title, company, siteName, status, baseSalary], index) => ({ id:`demo-employee-${index}`, name, dept, title, company, siteName, status, baseSalary, hireDate:"2026-03-02", insuranceStatus:company ? "加保" : "無加保" }));
export const workforcePayroll = ["2026-09", "2026-10"].flatMap(month => workforceEmployees.filter(e => e.status === "在職").map((e, index) => ({
  id:`demo-${month}-${e.id}`, employeeId:e.id, employeeName:e.name, month, siteName:e.siteName, company:e.company, baseSalary:e.baseSalary,
  additions:[{name:"津貼",amount:1500}], deductions:[], laborInsurance:800, healthInsurance:500, pensionSelf:0, advances:[],
  status:index === 4 ? "暫時不發" : index < 2 ? "已發放" : "待批准", paymentDate:index < 2 ? `${month}-10` : "",
})));
export const workforceMoney = value => `NT$ ${Number(value).toLocaleString("zh-TW")}`;
export const workforceMonth = value => /^\d{4}-\d{2}$/.test(value) ? `民國 ${Number(value.slice(0,4))-1911} 年 ${Number(value.slice(5))} 月` : "未選擇月份";
