export const ALLOWED_ORIGINS = new Set(['https://www.oak-environment.com.tw', 'https://oak-environment.com.tw', 'https://oak-environment-website.vercel.app']);
const services = ['清潔維護', '園藝與植栽維護', '環境消毒', '人力派遣', '其他 / 尚待討論'];
const times = ['上午', '下午', '時間彈性，可再討論'];
export function validateForm(body, today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date())) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('表單格式錯誤');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId || '')) throw new Error('送件識別碼錯誤，請重新開啟表單');
  if (body.consent !== true || body.consentVersion !== '2026-10-17') throw new Error('請先同意需求處理與聯絡用途');
  if (body.website) throw new Error('無法接受此送件');
  const text = (key, max, required = false) => {
    if (body[key] != null && typeof body[key] !== 'string') throw new Error('欄位格式錯誤');
    const value = (body[key] || '').trim();
    if ((required && !value) || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error('請確認必填欄位與文字長度');
    return value;
  };
  const requestType = text('requestType', 20, true);
  const service = text('service', 40, true);
  const phone = text('phone', 30, true);
  if (!['詢價', '預約服務'].includes(requestType) || !services.includes(service)) throw new Error('請選擇有效的需求類型與服務');
  if (!/^[+\d\s()（）#xX分機轉.-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8) throw new Error('請填寫有效的聯絡電話');
  let preferredDate = '', preferredTime = '';
  if (requestType === '預約服務') {
    preferredDate = text('preferredDate', 10, true); preferredTime = text('preferredTime', 30, true);
    const date = new Date(`${preferredDate}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== preferredDate || preferredDate < today || !times.includes(preferredTime)) throw new Error('請選擇今天或之後的有效日期與時段');
  }
  return { requestType, contactName: text('contactName',60,true), phone, company:text('company',100), service, location:text('location',200,true), details:text('details',1500), preferredDate, preferredTime, consentVersion:'2026-10-17' };
}

export function createIntakeHandler({ save, origins = ALLOWED_ORIGINS }) {
  return async request => {
    const origin = request.headers.get('origin');
    const headers = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'Vary':'Origin' };
    if (!origins.has(origin)) return new Response(JSON.stringify({ error:'不允許的來源' }), { status:403, headers });
    Object.assign(headers, { 'Access-Control-Allow-Origin':origin, 'Access-Control-Allow-Headers':'authorization, apikey, content-type', 'Access-Control-Allow-Methods':'POST, OPTIONS' });
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status:204, headers });
    if (request.method !== 'POST') return reply(405,{error:'僅接受表單送出'});
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return reply(415,{error:'表單格式錯誤'});
    let body;
    try {
      const reader = request.body?.getReader();
      if (!reader) return reply(400,{error:'缺少表單'});
      const decoder = new TextDecoder(); let raw = '', size = 0;
      try { while (true) { const {done,value} = await reader.read(); if(done) break; size += value.byteLength; if(size > 12000) { await reader.cancel(); return reply(413,{error:'表單內容過長'}); } raw += decoder.decode(value,{stream:true}); } }
      finally { reader.releaseLock(); }
      raw += decoder.decode(); body = JSON.parse(raw);
    } catch { return reply(400,{error:'表單格式錯誤'}); }
    let payload;
    try { payload = validateForm(body); } catch(error) { return reply(400,{error:error.message}); }
    try {
      const receipt = await save(body.requestId, payload);
      return reply(200,{ok:true,receipt});
    } catch(error) {
      if (error.message === 'RATE_LIMITED') return reply(429,{error:'送件過於頻繁，請稍後再試，或來電洽詢。'});
      if (error.message === 'REQUEST_CONFLICT') return reply(409,{error:'此識別碼已送出不同內容，請重新開啟表單。'});
      if (error.message === 'INTAKE_DISABLED') return reply(503,{error:'線上收件尚未啟用，請先來電洽詢。'});
      return reply(503,{error:'目前無法確認收件結果，請保留內容並重試；相同送件不會重複建立。'});
    }
  };
}
