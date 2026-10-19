// Synthetic data only; shared by isolated UI preview and presentation tests.
export const dashboardFormats = {
  money: value => `NT$ ${Number(value).toLocaleString('zh-TW')}`,
  date: value => value ? `${Number(value.slice(0, 4)) - 1911}/${value.slice(5, 7)}/${value.slice(8, 10)}` : '—',
  dateTime: value => new Intl.DateTimeFormat('zh-TW-u-ca-roc', { timeZone:'Asia/Taipei', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(new Date(value)),
  month: value => `民國 ${Number(value.slice(0, 4)) - 1911} 年 ${Number(value.slice(5))} 月`,
};
export function dashboardFixture(mode = 'normal', isAdmin = true) {
  const empty = mode === 'empty';
  const activityTypes = ['估價單', '發票', '銀行入帳', '公司付款', '薪資發放'];
  const states = ['已送出', '未付款', '已入帳', '已付款', '已發放'];
  return {
    summary: {
      today:'2026-10-19', billingMonth:'2026-09', thisMonth:'2026-10', isAdmin,
      monthInvoiceTotal:empty ? 0 : 1299778, pendingDepositAmount:empty ? 0 : 658400, pendingBilling:empty ? 0 : 86750,
      activeEmp:empty ? 0 : 58, employeeCount:empty ? 0 : 62, clockedInCount:empty ? 0 : 46,
      activeContracts:empty ? 0 : 26, totalContracts:empty ? 0 : 29, supplierCount:empty ? 0 : 24, vendorCount:empty ? 0 : 51,
      billedCount:empty ? 0 : 17, unbilledCount:empty ? 0 : 9, contractCount:empty ? 0 : 26, pendingApprovalCount:empty ? 0 : 4,
      income:empty ? 0 : 8628000, expense:empty ? 0 : 5876400,
    },
    alerts:empty ? [] : [
      {key:'vehicles',target:'vehicles',tone:'warn',label:'2 輛車保險／驗車 30 天內到期'},
      {key:'payments',target:'billing',tone:'danger',label:'1 筆已核准款項逾期未付款'},
      {key:'contracts',target:'contracts',tone:'warn',label:'3 份契約 30 天內到期'},
    ],
    invoiceReminders:empty ? [] : [
      {id:'demo-invoice-1',no:'I-115-018',client:'示範科技有限公司',days:62,amount:126000,date:'2026-08-18'},
      {id:'demo-invoice-2',no:'I-115-021',client:'示範社區管理委員會',days:48,amount:84000,date:'2026-09-01'},
    ],
    trend:Array.from({length:6}, (_, i) => ({month:`${String(i + 5).padStart(2, '0')}月`,收入:empty ? 0 : [682000,794000,1020000,862000,1180000,934000][i],支出:empty ? 0 : [430000,526000,1250000,571000,665000,498000][i],淨額:empty ? 0 : [252000,268000,-230000,291000,515000,436000][i]})),
    categories:empty ? [] : [{name:'人事費用',value:328000},{name:'清潔耗材',value:72000},{name:'車輛維護',value:48000},{name:'行政雜支',value:32000},{name:'設備租賃',value:18000}],
    todoItems:empty ? [] : [{label:'未付款發票',count:8},{label:'公司應付款項未付款',count:6},{label:'估價單待審核（已送出）',count:5},{label:'今日員工尚未打卡',count:12}],
    recentActivity:empty ? [] : Array.from({length:mode === 'many' ? 50 : 20}, (_, i) => ({
      text:`${activityTypes[i % 5]} ${i % 5 === 0 ? 'Q' : 'I'}-115-${String(58 - i).padStart(3, '0')} — ${['示範環境維護案場','示範科技園區定期清潔服務','示範社區公共空間養護','示範辦公大樓環境消毒作業','示範員工'][i % 5]}`,
      t:'2026-10-19',dt:new Date(Date.UTC(2026, 9, 19, 8, 35, 24) - i * 1234000).toISOString(),tag:states[i % 5],by:['行政同仁（示範）','財務同仁（示範）','管理員（示範）'][i % 3],
    })),
    formats:dashboardFormats,
  };
}
