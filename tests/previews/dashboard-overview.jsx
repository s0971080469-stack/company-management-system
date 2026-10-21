import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Building2, LayoutDashboard, Menu, X, ShieldCheck } from 'lucide-react';
import DashboardOverview from '../../src/DashboardOverview.jsx';
import { dashboardFixture } from '../fixtures/dashboard-overview.js';
import './website-management.css';
import './dashboard-overview.css';
import CompactPreviewNav from './CompactPreviewNav.jsx';

const nav = ['總覽儀錶板','人員管理','薪資表管理','廠商管理','公文管理','估價單','發票','收支管理','契約管理','每月請款追蹤','車輛管理','網站資訊管理','打卡上下班','帳務入口','公司報表','權限設定'];
function PreviewStatus({status}) {
  const tone = ['已付款','已入帳','已發放'].includes(status) ? 'teal' : status === '未付款' ? 'red' : 'amber';
  return <span className={`dashboard-preview-status overview-tone--${tone}`}>{status}</span>;
}
function Preview() {
  const [mode, setMode] = useState('normal');
  const [isAdmin, setIsAdmin] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [message, setMessage] = useState('');
  const targets = {vehicles:'車輛管理',billing:'收支管理',contracts:'契約管理'};
  return <div className="wm-preview-shell dashboard-preview-shell">
    {navOpen && <button className="wm-preview-backdrop" aria-label="關閉側邊欄" onClick={() => setNavOpen(false)} />}
    <aside className={`wm-preview-sidebar ${navOpen ? 'open' : ''}`}><div className="wm-preview-brand"><Building2 size={26} /><div>公司管理系統<small>COMPANY OS · 測試預覽</small></div></div><nav aria-label="側邊欄位置預覽">{nav.map((label, i) => <div key={label} className={i === 0 ? 'active' : ''}><span>{String(i + 1).padStart(2,'0')}</span>{label}</div>)}</nav><footer>側欄僅示範位置 · 不進入正式資料<br />總覽改版測試環境</footer></aside>
    <div className="wm-preview-main"><header className="wm-preview-topbar"><button aria-label="開啟側邊欄" onClick={() => setNavOpen(value => !value)}><Menu size={20} /></button><LayoutDashboard size={19} /><strong>總覽儀錶板</strong><small>測試環境 · 尚未上傳正式版</small></header><main className="wm-preview-content">
      <CompactPreviewNav />
      <div className="dashboard-preview-controls"><p><ShieldCheck size={16} />僅供版面預覽 · 全部為模擬資料，不讀寫正式系統</p><div><label>測試資料<select aria-label="測試資料" value={mode} onChange={event => setMode(event.target.value)}><option value="normal">示範資料</option><option value="many">50 筆動態</option><option value="empty">空資料</option></select></label><label>預覽身分<select aria-label="預覽身分" value={isAdmin ? 'admin' : 'staff'} onChange={event => setIsAdmin(event.target.value === 'admin')}><option value="admin">管理員</option><option value="staff">一般人員</option></select></label></div></div>
      {message && <div className="dashboard-preview-message" role="status">{message}<button aria-label="關閉提示" onClick={() => setMessage('')}><X size={15} /></button></div>}
      <DashboardOverview {...dashboardFixture(mode, isAdmin)} StatusBadge={PreviewStatus} navigate={target => setMessage(`提醒連結測試：正式系統會開啟「${targets[target] || target}」。此預覽不會開啟或更動正式資料。`)} />
    </main></div>
  </div>;
}
if (import.meta.env.DEV || import.meta.env.MODE === 'design-preview') createRoot(document.getElementById('root')).render(<Preview />);
