export function normalizeWebsiteSubmission(row) {
  const p = row.payload || {};
  return { id:row.id, version:row.version, name:p.contactName, company:p.company, phone:p.phone,
    type:p.requestType === '詢價' ? '服務詢價' : p.requestType, service:p.service,
    subject:`${p.service} · ${p.requestType}`, message:p.details, location:p.location,
    preferredDate:p.preferredDate, preferredTime:p.preferredTime, status:row.status,
    receivedAt:row.received_at, source:'歐克官網' };
}
export async function loadWebsiteInbox(client) {
  const {data:auth,error:authError} = await client.auth.getUser();
  if(authError || !auth?.user) throw new Error('請重新登入後查看網站收件。');
  const {data:members,error:memberError} = await client.from('website_form_members').select('user_id').eq('user_id',auth.user.id);
  if(memberError) throw new Error('收件資料庫尚未設定完成，請聯絡管理員。');
  if(!members?.length) throw new Error('此登入帳號尚未取得網站收件權限。');
  const {data:settings,error:settingsError} = await client.from('website_form_settings').select('intake_enabled').eq('id',true).single();
  if(settingsError) throw new Error('無法讀取收件設定，請重試。');
  const rows = [];
  for(let start=0;;start+=500) {
    const {data,error} = await client.from('website_form_submissions').select('*').order('received_at',{ascending:false}).order('id').range(start,start+499);
    if(error) throw new Error('無法更新收件清單，請重試。');
    rows.push(...data.map(normalizeWebsiteSubmission));
    if(data.length < 500) break;
  }
  // Concurrent arrivals may shift offset pages; don't show the same receipt twice.
  return { rows:[...new Map(rows.map(row=>[row.id,row])).values()], enabled:settings.intake_enabled };
}
export async function updateWebsiteStatus(client, row, status) {
  if(!['待處理','處理中','已完成'].includes(status)) throw new Error('無效狀態');
  const {data,error} = await client.from('website_form_submissions').update({status}).eq('id',row.id).eq('version',row.version).select('*');
  if(error || data?.length !== 1) throw new Error('儲存失敗或資料已被其他人更新，請重新整理後再試。');
  return normalizeWebsiteSubmission(data[0]);
}
