import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("人員案場欄固定窄寬、完整換行，不影響其他表格或裁掉案名",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  const css=await readFile(new URL("../src/WorkforceOverview.css",import.meta.url),"utf8");
  assert.match(app,/<td className="personnel-site-cell" style=\{td\}><span className="personnel-site-name">\{e.siteName \|\| "—"\}<\/span><\/td>/);
  assert.equal(app.match(/className="personnel-site-cell"/g).length,1);
  assert.match(css,/\.personnel-site-cell\s*\{[^}]*width:220px;[^}]*box-sizing:border-box/);
  assert.match(css,/\.personnel-site-name\s*\{[^}]*width:192px;[^}]*white-space:normal;[^}]*overflow-wrap:anywhere/);
});
