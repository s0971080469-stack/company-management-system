import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
const bundle=await build({entryPoints:[fileURLToPath(new URL('../src/CompanyFilterButton.jsx',import.meta.url))],bundle:true,platform:'node',format:'cjs',write:false,packages:'external',loader:{'.css':'empty'}});
const mod={exports:{}};
new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),mod,mod.exports);
const {default:Button,companyFilterColor,COMPANY_FILTER_COLORS}=mod.exports;
test('所有公司沿用人員配色，未選取白底、選取淡底並顯示勾號',()=>{
  for(const name of Object.keys(COMPANY_FILTER_COLORS)){
    const on=Button({name,selected:true,onSelect:()=>{}}),off=Button({name,selected:false,onSelect:()=>{}});
    assert.equal(on.props.style.background,COMPANY_FILTER_COLORS[name].bg);
    assert.equal(off.props.style.background,'#fff');
    assert.equal(off.props.style.color,COMPANY_FILTER_COLORS[name].fg);
    assert.equal(on.props.style.borderRadius,6);
    assert.equal(on.props.style.minHeight,30);
    assert.ok(on.props.children[2]); assert.equal(off.props.children[2],false);
  }
});
test('公司全名與縮寫配色一致，但篩選仍傳完整原值',()=>{
  for(const name of ['綠石環保股份有限公司',' 綠石環保另一公司 ']){
    let result; const button=Button({name,label:name.trim().slice(0,4),selected:false,onSelect:v=>result=v});
    button.props.onClick(); assert.equal(result,name);
    assert.equal(companyFilterColor(name).fg,'#1B6B63');
  }
  assert.equal(companyFilterColor('未填公司').fg,COMPANY_FILTER_COLORS.其他.fg);
  assert.equal(companyFilterColor('__proto__').fg,COMPANY_FILTER_COLORS.其他.fg);
});
test('所有公司篩選入口共用按鈕，不改廠商類型與收入支出分類',async()=>{
  for(const file of ['WorkforceOverview.jsx','SalesOverview.jsx','OperationsOverview.jsx','App.jsx']){
    const src=await readFile(new URL(`../src/${file}`,import.meta.url),'utf8');
    assert.match(src,/import CompanyFilterButton/); assert.match(src,/<CompanyFilterButton/);
  }
  const css=await readFile(new URL('../src/CompanyFilterButton.css',import.meta.url),'utf8');
  assert.match(css,/min-height:38px!important/);
});
