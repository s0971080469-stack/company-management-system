import React from "react";
import { Check } from "lucide-react";
import "./CompanyFilterButton.css";

export const COMPANY_FILTER_COLORS = {
  全部: { bg: "#edf2f7", fg: "#344e65" },
  綠石環保: { bg: "#E1F0EE", fg: "#1B6B63" },
  歐克環境: { bg: "#E5EDF9", fg: "#2A5199" },
  上藝除蟲: { bg: "#F1E7F5", fg: "#6B3F82" },
  維娜科技: { bg: "#FBEADB", fg: "#B5651D" },
  禾豐國際: { bg: "#EAF0DE", fg: "#5C7A2E" },
  其他: { bg: "#E9EBF0", fg: "#454C5C" },
};
export function companyFilterColor(name) {
  const text = String(name ?? "").trim();
  return Object.entries(COMPANY_FILTER_COLORS).find(([key]) => key === text || (key !== "全部" && key !== "其他" && text.startsWith(key)))?.[1] || COMPANY_FILTER_COLORS.其他;
}

// Keep identity separate from the shortened label. Inline tokens deliberately
// isolate these buttons from legacy page-specific button rules.
export default function CompanyFilterButton({ name, label = name, selected, onSelect, tone }) {
  const color = tone ?? companyFilterColor(name);
  return <button type="button" className="company-filter-button" title={name} aria-label={name} aria-pressed={selected} onClick={() => onSelect(name)}
    style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, flexShrink:0, minWidth:0, maxWidth:"100%", minHeight:30, height:"auto", padding:"4px 10px", borderRadius:6, border:`1px solid ${selected ? color.fg : "#e0e6ec"}`, background:selected ? color.bg : "#fff", color:color.fg, boxShadow:"none", fontFamily:"'PingFang TC','Microsoft JhengHei',system-ui,sans-serif", fontSize:11, fontWeight:selected ? 700 : 500, lineHeight:"normal", whiteSpace:"nowrap", cursor:"pointer" }}>
    <i aria-hidden="true" style={{ display:"block", width:6, height:6, flexShrink:0, borderRadius:"50%", background:color.fg, opacity:1 }}/>{label}{selected && <Check size={13} aria-hidden="true" style={{flexShrink:0}}/>}
  </button>;
}
