import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { personnelFilterYear, personnelSiteFilterOptions, filterPersonnel } from "../src/personnelFilters.js";

const contracts = [
  {title:"115年度案場",startDate:"2026-01-01",endDate:"2026-12-31"},
  {title:"116年度案場",startDate:"2027-01-01",endDate:"2027-12-31"},
  {title:"跨年案場",startDate:"2026-06-01",endDate:"2027-05-31"},
  {title:"117年度案場",startDate:"2028-01-01",endDate:"2028-12-31"},
];
test("116年僅顯示該年契約及固定案場，不顯示115年結束及117年開始者",()=>{
  assert.deepEqual(personnelSiteFilterOptions(contracts,"2027"),["公司總部","機動組","116年度案場","跨年案場"]);
  assert.deepEqual(personnelSiteFilterOptions(contracts,"2026"),["公司總部","機動組","115年度案場","跨年案場"]);
});
test("台灣跨年時切換年度，不受瀏覽器所在地時區影響",()=>{
  assert.equal(personnelFilterYear(new Date("2026-12-31T15:59:59Z")),"2026");
  assert.equal(personnelFilterYear(new Date("2026-12-31T16:00:00Z")),"2027");
});
test("上下界含當年度首末日，空日期沿用契約管理規則且案名去重",()=>{
  assert.deepEqual(personnelSiteFilterOptions([
    {title:"首日",endDate:"2027-01-01"}, {title:"末日",startDate:"2027-12-31"},
    {title:"未填日期"}, {title:"未填日期"}, {title:""},
  ],"2027"),["公司總部","機動組","首日","末日","未填日期"]);
});
test("舊案場員工在全部篩選仍顯示，選新案場才限縮；不改寫輸入",()=>{
  const employees=[{name:"甲",siteName:"115年度案場"},{name:"乙",siteName:"116年度案場"}];
  const before=JSON.stringify({contracts,employees});
  personnelSiteFilterOptions(contracts,"2027");
  assert.equal(filterPersonnel(employees).length,2);
  assert.deepEqual(filterPersonnel(employees,{site:"116年度案場"}),[employees[1]]);
  assert.equal(JSON.stringify({contracts,employees}),before);
});
test("上方篩選與員工編輯共用年度選項，清單名稱仍保留原資料",async()=>{
  const src=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  const view=src.split("export function EmployeesView")[1].split("function EmployeeForm")[0];
  assert.match(view,/sites=\{filterSiteOptions\}/);
  assert.match(view,/<EmployeeForm data=\{modal.data\} siteOptions=\{filterSiteOptions\}/);
  assert.match(view,/\{e.siteName \|\| "—"\}/);
  assert.match(view,/setSiteFilter\(effectiveSiteFilter\)/);
});
test("編輯舊案場不自動清空，提供不可重選的保留提示及原案名說明",async()=>{
  const src=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  const form=src.split("function EmployeeForm")[1].split("const sumAmounts")[0];
  assert.match(form,/Boolean\(f.siteName && !siteOptions.includes\(f.siteName\)\)/);
  assert.match(form,/<option value=\{f.siteName\} disabled>保留原案場（未變更）<\/option>/);
  assert.match(form,/原案場：\{f.siteName\}/);
  assert.match(form,/onSave\(f\)/);
});
