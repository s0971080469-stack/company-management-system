import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const bundle = await build({
  entryPoints: [fileURLToPath(new URL("../src/InvoiceOverdueReminder.jsx", import.meta.url))],
  bundle: true, platform: "node", format: "cjs", write: false,
  packages: "external", loader: { ".css": "empty" }, logLevel: "silent",
});
const module = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const render = (reminders) => renderToStaticMarkup(React.createElement(module.exports.default, {
  reminders, formatMoney: (amount) => `NT$ ${amount}`, formatDate: () => "115/08/08",
}));
test("提醒逐筆顯示客戶、含稅金額、號碼、民國日期與等待天數", () => {
  const html = render([{ id: "one", client: "甲公司", no: "AB123", amount: 1050, days: 46 }, { id: "two", client: "乙公司", no: "AB456", amount: 2200, days: 60 }]);
  for (const text of ["甲公司", "乙公司", "NT$ 1050", "NT$ 2200", "AB123", "AB456", "115/08/08", "46", "60", "尚未入帳金額（含稅）"]) assert.ok(html.includes(text));
  assert.equal((html.match(/<li>/g) || []).length, 2);
});
test("無符合發票時整個提醒區隱藏", () => assert.equal(render([]), ""));
test("等待天數緊接客戶名稱，且只顯示一次", () => {
  const html = render([{ id: "one", client: "甲公司", no: "AB123", amount: 1050, days: 46 }]);
  assert.match(html, /<strong>甲公司<\/strong><span class="invoice-overdue__days">（已等待 46 天）<\/span>/);
  assert.equal((html.match(/已等待/g) || []).length, 1);
});
test("多筆提醒全部保留供捲動閱讀，客戶文字安全轉義", () => {
  const html = render(Array.from({ length: 30 }, (_, id) => ({ id, client: "<script>客戶</script>", no: `NO-${id}`, amount: id, days: 46 + id })));
  assert.equal((html.match(/<li>/g) || []).length, 30);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes('tabindex="0"'));
});
