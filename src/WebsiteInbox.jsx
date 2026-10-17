import React, {useEffect, useRef, useState} from 'react';
import {supabase} from './supabaseClient.js';
import WebsiteManagement from './WebsiteManagement.jsx';
import {loadWebsiteInbox,updateWebsiteStatus} from './websiteInbox.js';
import {loadWebsiteAnalytics} from './websiteAnalytics.js';
import {taipeiMonth} from './websiteManagement.js';

export default function WebsiteInbox() {
  const [state,setState] = useState({rows:[],connected:false,enabled:false,error:'',loading:true});
  const [month,setMonth] = useState(()=>taipeiMonth(new Date()));
  const [analytics,setAnalytics] = useState({data:null,error:'',loading:false});
  const [analyticsRefresh,setAnalyticsRefresh] = useState(0);
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
  useEffect(()=>{
    let active=true, controller;
    async function refreshAnalytics() {
      controller?.abort(); controller=new AbortController();
      const thisController=controller;
      if (!month || !state.connected) { setAnalytics({data:null,error:'',loading:false}); return; }
      setAnalytics({data:null,error:'',loading:true});
      try {
        const data=await loadWebsiteAnalytics(supabase,month,{signal:thisController.signal});
        if(active && !thisController.signal.aborted) setAnalytics({data,error:'',loading:false});
      } catch(error) {
        if(active && !thisController.signal.aborted) setAnalytics({data:null,error:error.message,loading:false});
      }
    }
    refreshAnalytics();
    const timer=setInterval(()=>{if(document.visibilityState==='visible') refreshAnalytics();},300000);
    return ()=>{active=false;controller?.abort();clearInterval(timer);};
  },[month,state.connected,analyticsRefresh]);
  async function update(id,status) {
    const row=state.rows.find(r=>r.id===id); if(!row) throw new Error('找不到資料');
    const next=await updateWebsiteStatus(supabase,row,status);
    generation.current++;
    if(alive.current) setState(s=>({...s,loading:false,rows:s.rows.map(r=>r.id===id && r.version<=next.version?next:r)}));
  }
  return <WebsiteManagement rows={state.rows} connected={state.connected} intakeEnabled={state.enabled} error={state.error} onUpdate={state.connected?update:undefined}
    selectedMonth={month} onMonthChange={setMonth} analytics={analytics.data} analyticsError={analytics.error} analyticsLoading={analytics.loading}
    toolbar={<button disabled={state.loading || analytics.loading} onClick={()=>{refresh();setAnalyticsRefresh(n=>n+1);}}>{state.loading || analytics.loading?'讀取中…':'重新整理'}</button>} />;
}
