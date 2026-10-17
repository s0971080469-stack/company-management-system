import { createClient } from '@supabase/supabase-js';

const PROJECT = 'oak-environment-website';
const TEAM = 'team_dJ9x9mzVYxAOnXv49AAs3zzN';
const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Authorization' };
class AnalyticsError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function monthRange(month, now = new Date()) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) throw new AnalyticsError(400, '請選擇有效的統計月份。');
  const [year, number] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, number - 1, 1));
  const earliest = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  if (start < earliest || start > now) throw new AnalyticsError(400, '流量統計可查詢本月與前 11 個月；更早或未來月份不提供數字。');
  return {since:start.toISOString(), until:new Date(Math.min(Date.UTC(year, number, 1) - 1, +now)).toISOString()};
}
function count(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new AnalyticsError(502, '統計來源格式不符，請稍後再試。');
  return value;
}
export function normalizeAnalytics(month, total, trend, now = new Date()) {
  if (!Array.isArray(total?.data) || !Array.isArray(trend?.data)) throw new AnalyticsError(502, '統計來源格式不符，請稍後再試。');
  if (total.data.length > 1 || total.data.some(row => row.environment !== 'production')) throw new AnalyticsError(502, '統計來源範圍不符，請稍後再試。');
  const totals = total.data[0];
  const days = new Map();
  for (const row of trend.data) {
    if (typeof row.timestamp !== 'string' || !Number.isFinite(Date.parse(row.timestamp))) throw new AnalyticsError(502, '統計日期格式不符，請稍後再試。');
    const date = new Date(row.timestamp).toISOString().slice(0,10);
    if (!date.startsWith(month + '-') || days.has(date)) throw new AnalyticsError(502, '統計日期範圍不符，請稍後再試。');
    days.set(date, count(row.pageviews));
  }
  const range = monthRange(month, now);
  const last = new Date(range.until); last.setUTCHours(0,0,0,0);
  const first = Math.max(Date.parse(range.since), +last - 6 * 86400000);
  const daily = [];
  for (let time=first; time<=+last; time+=86400000) {
    const date = new Date(time).toISOString().slice(0,10);
    daily.push({label:date.slice(5).replace('-','/'),date,views:days.get(date) || 0});
  }
  // Visitor totals come from the whole-period aggregate, not a sum of daily counts.
  return {month, views:totals ? count(totals.pageviews) : 0, visitors:totals ? count(totals.visitors) : 0,
    daily, source:'Vercel Web Analytics', timezone:'UTC', fetchedAt:now.toISOString()};
}
async function authorize(token, env) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new AnalyticsError(503, '統計服務的登入驗證尚未設定。');
  const client = createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{headers:{Authorization:`Bearer ${token}`}, fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(8000)})}});
  const {data,error} = await client.auth.getUser(token);
  if (error || !data?.user) throw new AnalyticsError(401, '請重新登入後查看流量統計。');
  const member = await client.from('website_form_members').select('user_id').eq('user_id',data.user.id);
  if (member.error) throw new AnalyticsError(503, '無法確認網站管理權限，請稍後重試。');
  if (!member.data?.length) throw new AnalyticsError(403, '此登入帳號尚未取得網站管理權限。');
}
export async function handleAnalytics(request, {env=process.env, fetcher=fetch, authorizeUser=authorize, now=new Date()}={}) {
  const respond = (body,status=200)=>Response.json(body,{status,headers});
  try {
    if (request.method !== 'GET') return new Response(null,{status:405,headers:{...headers,Allow:'GET'}});
    const token = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if (!token) throw new AnalyticsError(401, '請登入後查看流量統計。');
    const month = new URL(request.url).searchParams.get('month');
    const range = monthRange(month, now);
    await authorizeUser(token, env);
    if (!env.OAK_ANALYTICS_TOKEN) throw new AnalyticsError(503, '官網統計讀取尚未完成設定，請管理員設定 OAK_ANALYTICS_TOKEN。');
    async function query(by) {
      const url = new URL('https://api.vercel.com/v1/query/web-analytics/visits/aggregate');
      url.search = new URLSearchParams({projectId:PROJECT,teamId:TEAM,by,...range,filter:"environment eq 'production'",limit:'100'});
      const result = await fetcher(url, {headers:{Authorization:`Bearer ${env.OAK_ANALYTICS_TOKEN}`},signal:AbortSignal.timeout(12000)});
      if (!result.ok) {
        console.warn('website-analytics upstream status', result.status);
        throw new AnalyticsError(502, result.status===401 || result.status===403 ? '統計讀取授權失效或權限不足，請管理員檢查專用金鑰。' : 'Vercel 流量統計暫時無法讀取，請稍後再試。');
      }
      return result.json();
    }
    const [total,trend] = await Promise.all([query('environment'),query('day')]);
    return respond(normalizeAnalytics(month,total,trend,now));
  } catch(error) {
    // Never log tokens, request headers, or third-party response bodies.
    if (!(error instanceof AnalyticsError)) console.error('website-analytics request failed');
    return respond({error:error instanceof AnalyticsError ? error.message : '流量統計讀取失敗，請稍後再試。'},error.status || 502);
  }
}
