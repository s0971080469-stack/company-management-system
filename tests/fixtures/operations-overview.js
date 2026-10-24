// Fictional preview-only data. No production reads or persistence.
export const operationCompanies=["全部","綠石環保","歐克環境","上藝除蟲","維娜科技","其他"];
export const operationColor=name=>({綠石環保:"#EAF5F1",歐克環境:"#ECF2FB",上藝除蟲:"#F5EFF9",維娜科技:"#FBF1E9",其他:"#F0F1F5",收入:"#EAF5F1",支出:"#FBEFF0"})[name]||"#f3f3ef";
export const money=value=>`NT$ ${Number(value||0).toLocaleString("zh-TW")}`;
export const monthLabel=value=>value?`${Number(value.slice(0,4))-1911}年${Number(value.slice(5))}月`:"全部月份";
export const dateLabel=value=>value?`${Number(value.slice(0,4))-1911}/${value.slice(5).replaceAll("-","/")}`:"—";
export const daysUntil=date=>date?Math.round((new Date(`${date}T00:00:00+08:00`)-new Date("2026-10-21T00:00:00+08:00"))/86400000):NaN;
export const isExpiringSoon=date=>!!date&&daysUntil(date)>=0&&daysUntil(date)<=30;
export const isOverdue=date=>!!date&&daysUntil(date)<0;
export function operationsFixture(mode="normal") {
  if(mode==="empty") return {contracts:[],vehicles:[],ledger:[],employees:[],attendance:[]};
  const contracts=Array.from({length:mode==="many"?30:5},(_,i)=>({id:`c${i}`,no:`C-115-${String(i+1).padStart(3,"0")}`,title:["示範園區清潔維護","示範中心病媒防治","示範校園環境維護"][i%3],company:operationCompanies[1+i%5],startDate:i===4?"2026-11-01":"2026-01-01",endDate:"2026-12-31",amount:mode==="many"?123456789:360000+i*20000,owner:"示範負責人",billed:i%3===0,billingMonth:"2026-10"}));
  contracts[0].title="示範園區公共環境清潔維護暨病媒防治年度服務契約";
  const vehicles=Array.from({length:mode==="many"?24:4},(_,i)=>({id:`v${i}`,plate:`DEMO-${100+i}`,model:["示範工作車","示範貨車"][i%2],driver:"示範員工",status:i===3?"保養中":"使用中",insuranceExpiry:i%3===0?"2026-10-18":i%3===1?"2026-10-26":"2027-01-20",inspectionExpiry:i%3===0?"2026-11-02":i%3===1?"2026-10-21":"2027-02-20"}));
  const ledger=[{id:"l1",date:"2026-10-21",type:"收入",desc:"示範銀行入帳",amount:520000},{id:"l2",date:"2026-10-20",type:"支出",desc:"示範薪資支出",amount:mode==="many"?1234567890:186000},{id:"l3",date:"2026-09-30",type:"收入",desc:"示範服務款項",amount:320000},{id:"l4",date:"2026-09-25",type:"支出",desc:"示範辦公耗材",amount:8600}];
  const employees=[{id:"e1",name:"示範員工甲"},{id:"e2",name:"示範員工乙"}];
  const attendance=[{id:"a1",employeeId:"e1",date:"2026-10-21",clockIn:"08:01:23",clockOut:""},{id:"a2",employeeId:"e2",date:"2026-10-20",clockIn:"08:00:00",clockOut:"17:03:18"}];
  return {contracts,vehicles,ledger,employees,attendance};
}
