import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { createPortal } from "react-dom";
import { payrollSiteGroups } from "./payrollApproval.js";
import "./PayrollApprovalButton.css";

export default function PayrollApprovalButton({ rows, employees, month, site, isAdmin, onApprove, formatMoney, formatMonth }) {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!selected || selected.month !== month) return;
    const trigger = document.activeElement;
    dialogRef.current?.focus();
    return () => { if (trigger?.isConnected) trigger.focus(); };
  }, [selected, month]);
  function dialogKeyDown(event) {
    if (event.key === "Escape" && !busy) setSelected(null);
    if (event.key !== "Tab") return;
    const buttons = [...dialogRef.current.querySelectorAll("button:not(:disabled)")];
    if (!buttons.length) { event.preventDefault(); return; }
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  const groups = payrollSiteGroups(rows, employees);
  const group = groups.find((item) => item.site === site);
  async function approve() {
    if (inFlight.current || !selected || !isAdmin) return;
    if (selected.month !== month || selected.site !== site || site === "全部") { setSelected(null); return; }
    inFlight.current = true;
    setBusy(true);
    setNotice("");
    try {
      const result = await onApprove({ month, site: selected.site, fingerprint: selected.fingerprint });
      setNotice(result.notice);
    } catch (error) { setNotice(error.message || "操作失敗，請重新整理後再試。"); }
    finally { inFlight.current = false; setBusy(false); setSelected(null); }
  }
  if (!isAdmin || !site || site === "全部") return null;
  const hasPending = Boolean(group?.targets.length);
  return <div className="payroll-approvals">
    <button type="button" className="payroll-approvals__button" disabled={busy || !hasPending}
      title={!hasPending ? "此案場沒有待批准的薪資" : `批准 ${site} 的薪資發放`}
      onClick={() => { setNotice(""); setSelected({ ...group, month }); }}>
      <Check size={15} />{busy ? "處理中…" : !hasPending && group?.approved ? "已批准" : "批准發放"}
    </button>
    <div role="status" aria-live="polite" className="payroll-approvals__notice">{busy ? "正在儲存批准並通知財務，請稍候…" : notice}</div>
    {selected && selected.month === month && selected.site === site && createPortal(<div className="payroll-approvals__overlay">
      <div ref={dialogRef} tabIndex={-1} onKeyDown={dialogKeyDown} role="dialog" aria-modal="true" aria-labelledby="payroll-approval-title" className="payroll-approvals__dialog">
        <h3 id="payroll-approval-title">確認批准發放</h3>
        <p>{formatMonth(month)}・{selected.site}</p>
        <p>本次批准 <b>{selected.targets.length} 人</b>，實發總額 <b>{formatMoney(selected.amount)}</b>。</p>
        <p>儲存成功後會自動發送內部訊息給財務人員；不包含暫時不發及已發放的薪資。</p>
        <div className="payroll-approvals__actions"><button type="button" disabled={busy} onClick={() => setSelected(null)}>取消</button>
          <button type="button" className="payroll-approvals__button" disabled={busy} onClick={approve}>{busy ? "處理中…" : "確認批准並通知財務"}</button></div>
      </div>
    </div>, document.body)}
  </div>;
}
