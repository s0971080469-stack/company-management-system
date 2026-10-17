import { createIntakeHandler } from './handler.js';
const url = Deno.env.get('SUPABASE_URL')!;
const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Legacy server key stays inside the managed Edge runtime, never in public assets.
const bytes = new TextEncoder();
const hex = (data: ArrayBuffer) => Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2,'0')).join('');
const key = await crypto.subtle.importKey('raw', bytes.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
Deno.serve(createIntakeHandler({ save: async (id: string, payload: Record<string,string>) => {
  const requestHash = hex(await crypto.subtle.digest('SHA-256',bytes.encode(JSON.stringify(payload))));
  const phoneHash = hex(await crypto.subtle.sign('HMAC',key,bytes.encode(payload.phone.replace(/\D/g,''))));
  const response = await fetch(`${url}/rest/v1/rpc/receive_website_form`, {
    method:'POST', headers:{'Content-Type':'application/json', apikey:secret, Authorization:`Bearer ${secret}`},
    body:JSON.stringify({p_id:id,p_payload:payload,p_request_hash:requestHash,p_phone_hash:phoneHash}),
    signal:AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(['INTAKE_DISABLED','RATE_LIMITED','REQUEST_CONFLICT'].includes(result.message) ? result.message : 'SAVE_FAILED');
  return result;
}}));
