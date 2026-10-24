import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import CompanyFilterButton from '../../src/CompanyFilterButton.jsx';
// Pure in-memory style preview. No production data or business writes.
const pages=['人員管理・投保公司','估價單・報價公司','發票・開票公司','銀行入帳紀錄・公司','公司應付款項・付款公司','契約管理・承攬公司','每月請款追蹤・承攬公司'];
const names=['全部','綠石環保','歐克環境','上藝除蟲','維娜科技','其他'];
function Preview(){
  const [selection,setSelection]=useState({});
  return <main style={{background:'#f3f5f7',minHeight:'100vh',padding:'24px clamp(12px,3vw,40px)',fontFamily:"'Microsoft JhengHei',sans-serif",color:'#203047',boxSizing:'border-box'}}>
    <header style={{background:'linear-gradient(110deg,#192c43,#25445a)',color:'#fff',padding:'18px 24px',borderRadius:14,marginBottom:20}}><h1 style={{fontSize:24,margin:'0 0 8px'}}>公司篩選・統一樣式</h1><p style={{fontSize:14,margin:0}}>以人員管理為基準：白底、公司色點與文字；選取後顯示淡色底及勾號。</p></header>
    <p style={{fontSize:13,color:'#65768a'}}>僅供版面預覽，不讀寫正式資料。每一列均可點選。</p>
    {pages.map(page=><section key={page} style={{background:'#fff',border:'1px solid #e1e7ed',borderRadius:12,padding:'14px 18px',marginBottom:12}}><h2 style={{fontSize:15,margin:'0 0 12px'}}>{page}</h2><div role="group" aria-label={page} style={{display:'flex',gap:7,flexWrap:'wrap'}}>{names.map(name=><CompanyFilterButton key={name} name={name} selected={(selection[page]||'全部')===name} onSelect={value=>setSelection(old=>({...old,[page]:value}))}/>)}</div></section>)}
    <nav style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:14}}><a href="./workforce-overview.html">人員／薪資測試頁</a><a href="./sales-overview.html">估價單／發票測試頁</a><a href="./operations-overview.html">每月請款測試頁</a><a href="./contract-colors.html">契約管理測試頁</a></nav>
  </main>;
}
if(import.meta.env.DEV) createRoot(document.getElementById('root')).render(<Preview/>);
