import React from 'react';

export default function CompactPreviewNav() {
  return <nav aria-label="三頁版面測試" style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
    {[["dashboard-overview.html","總覽儀錶板"],["website-management.html","網站資訊管理"],["billing-overview.html","收支管理"]].map(([href,label]) => <a key={href} href={`./${href}`} style={{padding:'8px 14px',border:'1px solid #c9d9e2',borderRadius:99,color:'#23566b',background:'#fff',textDecoration:'none',fontSize:14}}>{label}</a>)}
    <span style={{alignSelf:'center',fontSize:13,color:'#65768a'}}>僅模擬資料 · 正式版尚未更新</span>
  </nav>;
}
