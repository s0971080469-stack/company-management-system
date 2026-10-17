import React, {useEffect, useRef, useState} from 'react';
import {supabase} from './supabaseClient.js';
import WebsiteManagement from './WebsiteManagement.jsx';
import {loadWebsiteInbox,updateWebsiteStatus} from './websiteInbox.js';

export default function WebsiteInbox() {
  const [state,setState] = useState({rows:[],connected:false,enabled:false,error:'',loading:true});
  const alive = useRef(false), busy = useRef(false), generation = useRef(0);
  async function refresh() {
    if(busy.current) return;
    busy.current = true; const ticket=++generation.current;
    setState(s=>({...s,loading:true}));
    try { const result = await loadWebsiteInbox(supabase); if(alive.current && ticket===generation.current) setState({...result,connected:true,error:'',loading:false}); }
    catch(error) { if(alive.current && ticket===generation.current) setState({rows:[],connected:false,enabled:false,error:error.message,loading:false}); }
    finally { busy.current=false; }
  }
  useEffect(()=>{
    alive.current=true; refresh();
    const timer=setInterval(()=>{ if(document.visibilityState==='visible') refresh(); },30000);
    const focus=()=>refresh(); window.addEventListener('focus',focus);
    return ()=>{ alive.current=false; generation.current++; clearInterval(timer); window.removeEventListener('focus',focus); };
  },[]);
  async function update(id,status) {
    const row=state.rows.find(r=>r.id===id); if(!row) throw new Error('找不到資料');
    const next=await updateWebsiteStatus(supabase,row,status);
    generation.current++;
    if(alive.current) setState(s=>({...s,loading:false,rows:s.rows.map(r=>r.id===id && r.version<=next.version?next:r)}));
  }
  return <WebsiteManagement rows={state.rows} connected={state.connected} intakeEnabled={state.enabled} error={state.error} onUpdate={state.connected?update:undefined}
    toolbar={<button disabled={state.loading} onClick={refresh}>{state.loading?'讀取中…':'重新整理收件'}</button>} />;
}
