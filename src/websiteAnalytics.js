export async function loadWebsiteAnalytics(client, month, {signal, fetcher=fetch}={}) {
  if (!month) return null;
  const {data,error} = await client.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error('請重新登入後查看流量統計。');
  const result = await fetcher(`/api/website-analytics?month=${encodeURIComponent(month)}`, {
    headers:{Authorization:`Bearer ${data.session.access_token}`},cache:'no-store',signal,
  });
  if (!result.headers.get('content-type')?.includes('application/json')) throw new Error('流量統計 API 尚未部署，請使用更新後的正式管理系統。');
  const body = await result.json();
  if (!result.ok) throw new Error(body.error || '流量統計暫時無法讀取。');
  if (body.month !== month || !Number.isSafeInteger(body.views) || body.views<0 || !Number.isSafeInteger(body.visitors) || body.visitors<0 || !Array.isArray(body.daily)) throw new Error('流量統計格式不符，請重新整理。');
  return body;
}
