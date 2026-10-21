import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const contracts = app.slice(app.indexOf('export function ContractsView('), app.indexOf('export function ContractBillingView('));
const billing = app.slice(app.indexOf('export function ContractBillingView('), app.indexOf('function ContractForm('));
const colors = app.slice(app.indexOf('const companyRowColor ='), app.indexOf('export function QuotesView('));
const colorOf = new Function('THEME', `${colors}; return companyRowColor;`)({ surface: '#FFFFFF' });

test('契約沿用既有公司配色，不改動其他畫面色碼', () => {
  for (const [name, color] of Object.entries({ 綠石環保: '#EAF5F1', 歐克環境: '#ECF2FB', 上藝除蟲: '#F5EFF9', 維娜科技: '#FBF1E9', 禾豐國際: '#F1F5E9', 其他: '#F0F1F5' })) {
    assert.equal(colorOf(name), color);
    assert.equal(colorOf(` ${name}有限公司 `), color);
  }
  assert.equal(colorOf(''), '#FFFFFF');
  assert.equal(colorOf(undefined), '#FFFFFF');
});
test('兩頁清單和篩選均使用共享配色，選取狀態不覆蓋公司底色', () => {
  for (const view of [contracts, billing]) {
    assert.match(view, /<tr key=\{c.id\} style=\{\{ background: companyRowColor\(c.contractorCompany\) \}\}>/);
  }
  assert.match(contracts, /background: c === "全部" \? THEME.canvas : companyRowColor\(c\)/);
  assert.match(contracts, /aria-pressed=\{companyFilter === c\}/);
  assert.match(contracts, /boxShadow: companyFilter === c/);
  assert.match(billing, /selected=\{companyFilter\} onSelect=\{setCompanyFilter\} colorOf=\{c => c === "全部" \? THEME.canvas : companyRowColor\(c\)\}/);
  const component = readFileSync(new URL('../src/OperationsOverview.jsx', import.meta.url), 'utf8');
  assert.match(component, /aria-pressed=\{selected===value\} style=\{\{background:colorOf\(value\)\}\}/);
  const css = readFileSync(new URL('../src/OperationsOverview.css', import.meta.url), 'utf8');
  const selectedRule=css.match(/\.operations-options button\[aria-pressed="true"\] \{([^}]+)\}/)?.[1];
  assert.ok(selectedRule); assert.doesNotMatch(selectedRule, /background/);
});
test('到期提醒保留在日期下方，不再覆蓋整列公司色', () => {
  assert.match(contracts, /isExpiringSoon\(c\) && <span[\s\S]*?30 天內到期/);
  assert.doesNotMatch(contracts, /background: THEME.warnSoft/);
});
test('測試頁使用正式元件與記憶體資料，停用掃描檔上傳', () => {
  const preview = readFileSync(new URL('./previews/contract-colors.jsx', import.meta.url), 'utf8');
  assert.match(preview, /import \{ ContractsView, ContractBillingView \} from/);
  assert.match(preview, /<ContractBillingView ctx=\{ctx\} previewOnly/);
  assert.match(preview, /persist: \{ contracts: setContracts, contractBilling: setContractBilling \}/);
  assert.match(preview, /import.meta.env.DEV/);
  assert.match(billing, /disabled=\{!month \|\| previewOnly\}/);
  assert.match(billing, /month && !previewOnly && setAttachModal/);
});
