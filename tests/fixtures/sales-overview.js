// Fictional, isolated preview rows; never fetched from the production system.
export const salesCompanies = ["綠石環保", "歐克環境", "上藝除蟲", "維娜科技", "其他"];
export const salesCompanyColor = name => ({ 綠石環保:"#E1F0EE", 歐克環境:"#E5EDF9", 上藝除蟲:"#F1E7F5", 維娜科技:"#FBEADB", 其他:"#E9EBF0" })[name.slice(0,4)] || "#edf2f7";
export const salesMoney = value => `NT$ ${Number(value || 0).toLocaleString("zh-TW")}`;
export const salesDate = value => value ? `${Number(value.slice(0,4))-1911}/${value.slice(5).replaceAll("-","/")}` : "—";
export const salesMonth = value => value ? `${Number(value.slice(0,4))-1911}年${Number(value.slice(5))}月` : "全部月份";
export const quoteAmount = row => (row.items || []).reduce((sum,it)=>sum+(Number(it.qty)||0)*(Number(it.price)||0),0);
export const invoiceAmount = row => row.total ?? quoteAmount(row)*(1+Number(row.taxRate)/100);
export function salesFixture(mode="normal") {
  if(mode==="empty") return { quotes:[], invoices:[] };
  const quotes=Array.from({length:mode==="many"?30:6},(_,i)=>({
    id:`q${i}`, no:`Q-115-${String(i+1).padStart(3,"0")}`, client:["示範科技園區","示範文化中心","示範社區管理委員會"][i%3],
    companyName:i===5?"":salesCompanies[i%5], date:i%3===0?"2026-09-15":"2026-10-15", status:["已核准","已送出","草擬"][i%3],
    items:[{qty:1,price:mode==="many"?123456789:18000+i*2300}]
  }));
  const invoices=quotes.map((q,i)=>({...q,id:`i${i}`,no:`AB${String(10000001+i)}`,taxRate:5,
    date:i===0?"2026-08-01":q.date, dueDate:i===2?"2026-10-20":"", status:i===4?"已作廢":i===2?"已付款":"未付款"
  }));
  return {quotes,invoices};
}
