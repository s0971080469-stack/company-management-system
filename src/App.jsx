import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard, Users, Wallet, FileText, Receipt, Clock, HandCoins,
  Landmark, BarChart3, Plus, Trash2, Pencil, X, Check, Search,
  LogIn, LogOut, Building2, TrendingUp, TrendingDown, CalendarDays,
  ChevronRight, RotateCcw, ArrowRight, AlertCircle, FileSignature, Truck, ShieldCheck, UserCog, Download, Car,
  Paperclip, Eye, Upload, Image as ImageIcon, Loader2, MapPin
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { loadKey, saveKey } from "./storage.js";
import { supabase, createAuthActionClient } from "./supabaseClient.js";

/* ---------------------------------------------------------
   企業帳冊 Corporate Ledger — 主題設計
   墨藍 ink + 銅金 brass，呼應「帳冊 / 印鑑 / 打卡鐘」的企業後台意象
--------------------------------------------------------- */
const THEME = {
  ink: "#1B2333",
  inkSoft: "#2A3349",
  inkFaint: "#414C67",
  canvas: "#F3F3EF",
  surface: "#FFFFFF",
  brass: "#B8912B",
  brassDeep: "#8F6E1C",
  brassSoft: "#F4ECD8",
  text: "#1B2333",
  muted: "#767B8A",
  line: "#E6E4DA",
  success: "#1F7A52",
  successSoft: "#E4F3EA",
  danger: "#B23A2E",
  dangerSoft: "#FBEAE7",
  warn: "#A8721E",
  warnSoft: "#FBF0DC",
};

const FONT_DISPLAY = "'Noto Serif TC', 'Georgia', serif";
const FONT_BODY = "'PingFang TC','Microsoft JhengHei','Segoe UI',system-ui,sans-serif";
const FONT_NUM = "'JetBrains Mono','SFMono-Regular',Consolas,monospace";

const NAV = [
  { key: "dashboard", label: "總覽儀表板", icon: LayoutDashboard },
  { key: "employees", label: "人員管理", icon: Users },
  { key: "payroll", label: "薪資表管理", icon: Wallet },
  { key: "vendors", label: "廠商管理", icon: Truck },
  { key: "quotes", label: "估價單", icon: FileText },
  { key: "invoices", label: "發票", icon: Receipt },
  { key: "attendance", label: "打卡上下班", icon: Clock },
  { key: "billing", label: "收支管理", icon: HandCoins },
  { key: "contracts", label: "契約管理", icon: FileSignature },
  { key: "vehicles", label: "車輛管理", icon: Car },
  { key: "accounting", label: "帳務入口", icon: Landmark },
  { key: "reports", label: "公司報表", icon: BarChart3 },
  { key: "permissions", label: "權限設定", icon: ShieldCheck },
];

const STORAGE_KEYS = {
  employees: "employees",
  attendance: "attendance",
  payroll: "payroll",
  quotes: "quotations",
  invoices: "invoices",
  billing: "billing",
  accounting: "accounting",
  vendors: "vendors",
  contracts: "contracts",
  sysUsers: "sys_users",
  rolePerms: "role_permissions",
  quoteTemplates: "quote_templates",
  vehicles: "vehicles",
  currentUser: "current_user_id",
  companyLocation: "company_location",
};

const DEFAULT_ROLES = ["管理員", "財務", "人資", "一般員工"];
const DEFAULT_MATRIX = () => {
  const on = (keys) => Object.fromEntries(NAV.map((n) => [n.key, keys.includes(n.key)]));
  return {
    roles: DEFAULT_ROLES,
    matrix: {
      "管理員": on(NAV.map((n) => n.key)),
      "財務": on(["dashboard", "payroll", "vendors", "quotes", "invoices", "billing", "contracts", "accounting", "reports", "attendance"]),
      "人資": on(["dashboard", "employees", "payroll", "attendance", "reports"]),
      "一般員工": on(["dashboard", "attendance"]),
    },
  };
};

const SEED_QUOTE_TEMPLATES = [
  {
    id: "seed-greenstone",
    company: "綠石環保",
    title: "標準估價單",
    validDays: 30,
    companyName: "綠石環保科技有限公司",
    docTitle: "估　　價　　單",
    taxId: "27329647",
    address: "高雄市鼓山區龍德路88巷9號",
    tel: "07-3411275",
    fax: "07-3411691",
    contactName: "夏先生",
    contactPhone: "0929-003-114",
    contactEmail: "s0929003114@gmail.com",
    ownerName: "夏碩亞",
    paymentMethod: "",
    items: [{ id: "seed-greenstone-item-1", desc: "", unit: "", qty: 1, price: 0, note: "" }],
    note: "",
  },
  {
    id: "seed-oak",
    company: "歐克環境",
    title: "標準估價單",
    validDays: 30,
    companyName: "歐克環境有限公司",
    docTitle: "估　　價　　單",
    taxId: "90000620",
    address: "高雄市鼓山區龍德路88巷9號",
    tel: "07-3411275",
    fax: "07-3411691",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    ownerName: "夏碩亞",
    paymentMethod: "",
    items: [{ id: "seed-oak-item-1", desc: "", unit: "", qty: 1, price: 0, note: "" }],
    note: "",
  },
  {
    id: "seed-shangyi",
    company: "上藝除蟲",
    title: "標準估價單",
    validDays: 30,
    companyName: "上藝除蟲環境清潔企業社",
    docTitle: "報　　價　　單",
    taxId: "",
    address: "高雄市三民區遼寧一街143巷26號1樓",
    tel: "",
    fax: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    ownerName: "",
    paymentMethod: "",
    items: [{ id: "seed-shangyi-item-1", desc: "", unit: "", qty: 1, price: 0, note: "" }],
    note: "",
  },
  {
    id: "seed-vena",
    company: "維娜科技",
    title: "標準估價單",
    validDays: 30,
    companyName: "維娜科技有限公司",
    docTitle: "估　　價　　單",
    taxId: "",
    address: "",
    tel: "",
    fax: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    ownerName: "謝琴梅",
    paymentMethod: "",
    items: [{ id: "seed-vena-item-1", desc: "", unit: "", qty: 1, price: 0, note: "" }],
    note: "",
  },
];

/* ---------------- utils ---------------- */
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStr = (d = new Date()) => d.toISOString().slice(0, 7);
const fmtMonthLabel = (key) => {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  return m ? `${m[1]}年${Number(m[2])}月` : key;
};
const fmtMoney = (n) => "NT$ " + Math.round(Number(n) || 0).toLocaleString("zh-TW");
const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};
const fmtDateTime = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return `${fmtDate(s)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};
const nextNo = (prefix, list, dateKey = "date") => {
  const y = new Date().getFullYear();
  const count = list.filter((x) => (x.no || "").startsWith(`${prefix}-${y}`)).length + 1;
  return `${prefix}-${y}-${String(count).padStart(3, "0")}`;
};
const sumItems = (items = []) => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
const actorName = (ctx) => ctx.currentUser?.name || ctx.currentUser?.email || "—";

/* ---------------- 打卡地點限制 ---------------- */
const CLOCK_RADIUS_M = 200;
const DEFAULT_COMPANY_LOCATION = { lat: 22.708703, lng: 120.326208 };

/* ---------------- 估價單附件（掃描檔）— 存到 Supabase Storage ---------------- */
const QUOTE_SCAN_BUCKET = "quote-scans";

async function uploadQuoteScan(quoteId, file) {
  const path = `${quoteId}/${Date.now()}-${uid()}-${file.name}`;
  const { error } = await supabase.storage.from(QUOTE_SCAN_BUCKET).upload(path, file);
  if (error) throw error;
  return { id: uid(), name: file.name, path, uploadedAt: new Date().toISOString() };
}

async function getQuoteScanUrl(path) {
  const { data, error } = await supabase.storage.from(QUOTE_SCAN_BUCKET).createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

async function deleteQuoteScan(path) {
  const { error } = await supabase.storage.from(QUOTE_SCAN_BUCKET).remove([path]);
  if (error) throw error;
}

/* ---------------- 估價單 PDF 下載（純前端組出真正的 PDF 檔） ---------------- */
const CHINESE_DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const chineseIndex = (n) => {
  if (n <= 0) return String(n);
  if (n < 10) return CHINESE_DIGITS[n];
  if (n < 20) return "十" + (n % 10 === 0 ? "" : CHINESE_DIGITS[n % 10]);
  if (n < 100) {
    const tens = Math.floor(n / 10), ones = n % 10;
    return CHINESE_DIGITS[tens] + "十" + (ones === 0 ? "" : CHINESE_DIGITS[ones]);
  }
  return String(n);
};

const PDF_PAGE_W = 1240; // px @ ~150dpi, A4 aspect ratio
const PDF_PAGE_H = 1754;
const PDF_MARGIN = 88;
const CJK_FONT = "'PingFang TC','Microsoft JhengHei','Heiti TC','Noto Sans TC',sans-serif";

function wrapCanvasText(ctx, text, maxWidth) {
  const str = String(text || "");
  if (!str) return [""];
  const chars = Array.from(str);
  const lines = [];
  let line = "";
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function renderQuoteCanvas(q) {
  const canvas = document.createElement("canvas");
  canvas.width = PDF_PAGE_W;
  canvas.height = PDF_PAGE_H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PDF_PAGE_W, PDF_PAGE_H);
  ctx.fillStyle = "#1B2333";
  ctx.textBaseline = "alphabetic";

  const left = PDF_MARGIN, right = PDF_PAGE_W - PDF_MARGIN;
  let y = PDF_MARGIN + 10;

  // top block: company name (left, prominent) + right-aligned company info, side by side
  ctx.font = `21px ${CJK_FONT}`;
  const headerLines = [
    q.taxId && `統一編號：${q.taxId}`,
    q.address && `地址：${q.address}`,
    (q.tel || q.fax) && `TEL：${q.tel || ""}　FAX：${q.fax || ""}`,
  ].filter(Boolean);
  const infoBlockH = headerLines.length * 30;
  const nameBlockH = q.companyName ? 44 : 0;
  const topBlockH = Math.max(infoBlockH, nameBlockH);
  const topBlockStartY = y;

  if (q.companyName) {
    ctx.textAlign = "left";
    ctx.font = `bold 30px ${CJK_FONT}`;
    ctx.fillText(q.companyName, left, topBlockStartY + 26);
  }
  ctx.textAlign = "right";
  ctx.font = `21px ${CJK_FONT}`;
  headerLines.forEach((line, i) => { ctx.fillText(line, right, topBlockStartY + 20 + i * 30); });

  y = topBlockStartY + topBlockH + 22;

  // title
  y += 20;
  ctx.textAlign = "center";
  ctx.font = `bold 52px ${CJK_FONT}`;
  ctx.fillText(q.docTitle || "估　　價　　單", PDF_PAGE_W / 2, y);
  y += 56;

  // info block
  ctx.font = `23px ${CJK_FONT}`;
  ctx.textAlign = "left";
  const colMid = PDF_PAGE_W / 2;
  ctx.fillText(`報價單位：${q.client || ""}`, left, y);
  ctx.fillText(`付款方式：${q.paymentMethod || ""}`, colMid, y);
  y += 40;
  ctx.fillText(`工作名稱：${q.workName || ""}`, left, y);
  ctx.fillText(`報價日期：${fmtDate(q.date)}`, colMid, y);
  y += 40;
  ctx.fillText(`本報價單有效期限至：${fmtDate(q.validUntil)}`, left, y);
  y += 34;

  // items table
  const items = q.items && q.items.length ? q.items : [{ desc: "", unit: "", qty: 0, price: 0, note: "" }];
  const colW = { no: 64, unit: 78, qty: 78, price: 138, total: 148, note: 168 };
  colW.desc = (right - left) - (colW.no + colW.unit + colW.qty + colW.price + colW.total + colW.note);
  const cols = [
    { key: "no", label: "項次", align: "center" },
    { key: "desc", label: "項目", align: "left" },
    { key: "unit", label: "單位", align: "center" },
    { key: "qty", label: "數量", align: "center" },
    { key: "price", label: "單價(元)", align: "right" },
    { key: "total", label: "總價(元)", align: "right" },
    { key: "note", label: "備註", align: "left" },
  ];

  const tableTop = y;
  const headerRowH = 46;
  ctx.font = `bold 19px ${CJK_FONT}`;
  ctx.fillStyle = "#F2F0E8";
  ctx.fillRect(left, tableTop, right - left, headerRowH);
  ctx.fillStyle = "#1B2333";
  let cx = left;
  const colX = {};
  cols.forEach((c) => { colX[c.key] = cx; cx += colW[c.key]; });
  cols.forEach((c) => {
    const w = colW[c.key];
    ctx.textAlign = c.align === "center" ? "center" : c.align === "right" ? "right" : "left";
    const tx = c.align === "center" ? colX[c.key] + w / 2 : c.align === "right" ? colX[c.key] + w - 10 : colX[c.key] + 10;
    ctx.fillText(c.label, tx, tableTop + headerRowH / 2 + 7);
  });

  ctx.font = `18px ${CJK_FONT}`;
  let rowY = tableTop + headerRowH;
  const rowsMeta = items.map((it) => {
    const descLines = wrapCanvasText(ctx, it.desc, colW.desc - 20);
    const noteLines = wrapCanvasText(ctx, it.note, colW.note - 20);
    const lineCount = Math.max(descLines.length, noteLines.length, 1);
    const h = Math.max(40, lineCount * 24 + 14);
    return { it, descLines, noteLines, h };
  });

  rowsMeta.forEach(({ it, descLines, noteLines, h }, i) => {
    cols.forEach((c) => {
      const w = colW[c.key];
      ctx.textAlign = c.align === "center" ? "center" : c.align === "right" ? "right" : "left";
      const tx = c.align === "center" ? colX[c.key] + w / 2 : c.align === "right" ? colX[c.key] + w - 10 : colX[c.key] + 10;
      if (c.key === "no") ctx.fillText(chineseIndex(i + 1), tx, rowY + 26);
      else if (c.key === "desc") descLines.forEach((line, li) => ctx.fillText(line, tx, rowY + 26 + li * 24));
      else if (c.key === "unit") ctx.fillText(it.unit || "", tx, rowY + 26);
      else if (c.key === "qty") ctx.fillText(String(it.qty || 0), tx, rowY + 26);
      else if (c.key === "price") ctx.fillText(Number(it.price || 0).toLocaleString("zh-TW"), tx, rowY + 26);
      else if (c.key === "total") ctx.fillText((Number(it.qty || 0) * Number(it.price || 0)).toLocaleString("zh-TW"), tx, rowY + 26);
      else if (c.key === "note") noteLines.forEach((line, li) => ctx.fillText(line, tx, rowY + 26 + li * 24));
    });
    rowY += h;
  });

  const totalRowH = 46;
  ctx.fillStyle = "#FAF7EE";
  ctx.fillRect(left, rowY, right - left, totalRowH);
  ctx.fillStyle = "#1B2333";
  ctx.font = `bold 19px ${CJK_FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("總　計", colX.total - 10, rowY + totalRowH / 2 + 7);
  ctx.fillText(sumItems(q.items).toLocaleString("zh-TW"), colX.total + colW.total - 10, rowY + totalRowH / 2 + 7);
  rowY += totalRowH;

  // table borders
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(left, tableTop, right - left, rowY - tableTop);
  ctx.beginPath();
  ctx.moveTo(left, tableTop + headerRowH); ctx.lineTo(right, tableTop + headerRowH);
  let sepY = tableTop + headerRowH;
  rowsMeta.forEach(({ h }) => { sepY += h; ctx.moveTo(left, sepY); ctx.lineTo(right, sepY); });
  cols.forEach((c) => { ctx.moveTo(colX[c.key], tableTop); ctx.lineTo(colX[c.key], rowY); });
  ctx.moveTo(right, tableTop); ctx.lineTo(right, rowY);
  ctx.stroke();

  // footer
  y = rowY + 44;
  ctx.font = `20px ${CJK_FONT}`;
  ctx.textAlign = "left";
  if (q.note) { ctx.fillText(`備註：${q.note}`, left, y); y += 32; }
  const contactLine = [q.contactName && `專案聯絡人：${q.contactName}`, q.contactPhone && `連絡電話：${q.contactPhone}`].filter(Boolean).join("　");
  if (contactLine) { ctx.fillText(contactLine, left, y); y += 32; }
  if (q.contactEmail) { ctx.fillText(`連絡信箱：${q.contactEmail}`, left, y); y += 32; }
  y += 20;
  if (q.companyName) { ctx.fillText(`報價廠商：${q.companyName}`, left, y); y += 32; }
  if (q.ownerName) { ctx.fillText(`負責人：${q.ownerName}`, left, y); y += 32; }

  return canvas;
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Builds a minimal valid single-page PDF that embeds one JPEG image filling the page.
// No external libraries needed — this hand-assembles the PDF byte structure directly.
function buildImagePdf(jpegBytes, pxWidth, pxHeight) {
  const A4_W_PT = 595.28, A4_H_PT = 841.89;
  const enc = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const objOffsets = [];
  const push = (data) => {
    const bytes = typeof data === "string" ? enc.encode(data) : data;
    chunks.push(bytes);
    offset += bytes.length;
  };
  const startObj = () => objOffsets.push(offset);

  push("%PDF-1.4\n");

  startObj();
  push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObj();
  push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  startObj();
  push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W_PT} ${A4_H_PT}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);

  startObj();
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pxWidth} /Height ${pxHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  push(jpegBytes);
  push("\nendstream\nendobj\n");

  startObj();
  const content = `q ${A4_W_PT} 0 0 ${A4_H_PT} 0 0 cm /Im0 Do Q`;
  push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

  const xrefStart = offset;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  objOffsets.forEach((off) => { xref += `${String(off).padStart(10, "0")} 00000 n \n`; });
  push(xref);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  chunks.forEach((c) => { out.set(c, pos); pos += c.length; });
  return out;
}

function downloadQuotePdf(q) {
  try {
    const canvas = renderQuoteCanvas(q);
    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const jpegBytes = dataUrlToBytes(jpegDataUrl);
    const pdfBytes = buildImagePdf(jpegBytes, canvas.width, canvas.height);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `估價單_${q.no || "quote"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) {
    console.error("PDF 產生失敗", e);
    alert("估價單 PDF 產生失敗，請稍後再試一次。");
  }
}

// loadKey / saveKey 現在改由 ./storage.js 提供（改存到 Supabase 而非 window.storage）

/* ---------------- shared UI atoms ---------------- */
function IconBadge({ icon: Icon, tone = "brass" }) {
  const tones = {
    brass: { bg: THEME.brassSoft, fg: THEME.brassDeep },
    success: { bg: THEME.successSoft, fg: THEME.success },
    danger: { bg: THEME.dangerSoft, fg: THEME.danger },
    warn: { bg: THEME.warnSoft, fg: THEME.warn },
    ink: { bg: "#EEF0F4", fg: THEME.ink },
  };
  const t = tones[tone];
  return (
    <div style={{ width: 38, height: 38, borderRadius: 9, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={18} color={t.fg} strokeWidth={2} />
    </div>
  );
}

function StatCard({ label, value, sub, icon, tone }) {
  return (
    <div style={{ background: THEME.surface, border: `1px solid ${THEME.line}`, borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, minHeight: 108 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12.5, color: THEME.muted, letterSpacing: 0.3 }}>{label}</span>
        {icon && <IconBadge icon={icon} tone={tone} />}
      </div>
      <div style={{ fontFamily: FONT_NUM, fontSize: 24, fontWeight: 700, color: THEME.text, letterSpacing: -0.3 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: THEME.muted }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "在職": { bg: THEME.successSoft, fg: THEME.success },
    "離職": { bg: "#EEEEEE", fg: THEME.muted },
    "待發放": { bg: THEME.warnSoft, fg: THEME.warn },
    "已發放": { bg: THEME.successSoft, fg: THEME.success },
    "草擬": { bg: "#EEEEEE", fg: THEME.muted },
    "已送出": { bg: THEME.warnSoft, fg: THEME.warn },
    "已核准": { bg: THEME.successSoft, fg: THEME.success },
    "已拒絕": { bg: THEME.dangerSoft, fg: THEME.danger },
    "未付款": { bg: THEME.warnSoft, fg: THEME.warn },
    "已付款": { bg: THEME.successSoft, fg: THEME.success },
    "已作廢": { bg: "#EEEEEE", fg: THEME.muted },
    "逾期": { bg: THEME.dangerSoft, fg: THEME.danger },
    "待審核": { bg: THEME.warnSoft, fg: THEME.warn },
    "供應商": { bg: "#EEF0F4", fg: THEME.ink },
    "業主": { bg: THEME.brassSoft, fg: THEME.brassDeep },
    "有": { bg: THEME.successSoft, fg: THEME.success },
    "無": { bg: "#EEEEEE", fg: THEME.muted },
    "估價中": { bg: THEME.warnSoft, fg: THEME.warn },
    "未購買": { bg: THEME.dangerSoft, fg: THEME.danger },
    "已購買": { bg: THEME.successSoft, fg: THEME.success },
  };
  const t = map[status] || { bg: "#EEEEEE", fg: THEME.muted };
  return (
    <span style={{ background: t.bg, color: t.fg, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function Btn({ children, onClick, variant = "default", icon: Icon, size = "md", type = "button", disabled }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: size === "sm" ? 12.5 : 13.5, fontWeight: 600, border: "1px solid transparent",
    padding: size === "sm" ? "6px 10px" : "9px 16px", transition: "all .15s", opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    default: { background: THEME.surface, border: `1px solid ${THEME.line}`, color: THEME.text },
    primary: { background: THEME.ink, color: "#fff" },
    brass: { background: THEME.brass, color: "#fff" },
    ghost: { background: "transparent", color: THEME.muted },
    danger: { background: THEME.dangerSoft, color: THEME.danger },
    success: { background: THEME.successSoft, color: THEME.success },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.96)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
}

function Field({ label, children, span }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: span ? `span ${span}` : undefined }}>
      <span style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  border: `1px solid ${THEME.line}`, borderRadius: 7, padding: "8px 10px", fontSize: 13.5,
  fontFamily: FONT_BODY, color: THEME.text, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} onFocus={(e) => (e.target.style.borderColor = THEME.brass)} onBlur={(e) => (e.target.style.borderColor = THEME.line)} />;
}
function Select(props) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: 60, ...(props.style || {}) }} />;
}

function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,35,51,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, width, maxWidth: "100%", maxHeight: "88vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: `1px solid ${THEME.line}`, position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: THEME.text }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.muted, padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,35,51,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={onCancel}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: 340, maxWidth: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 18 }}>
          <IconBadge icon={AlertCircle} tone="danger" />
          <p style={{ margin: 0, fontSize: 14, color: THEME.text, lineHeight: 1.6, paddingTop: 6 }}>{message}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn onClick={onCancel}>取消</Btn>
          <Btn variant="danger" onClick={onConfirm}>確認刪除</Btn>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, action }) {
  return (
    <div style={{ padding: "60px 20px", textAlign: "center", color: THEME.muted }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: THEME.brassSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} color={THEME.brassDeep} />
        </div>
      </div>
      <p style={{ fontSize: 13.5, margin: "0 0 14px" }}>{text}</p>
      {action}
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11.5, color: THEME.brassDeep, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>{eyebrow}</div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: THEME.text }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

const th = { textAlign: "left", fontSize: 11.5, color: THEME.muted, fontWeight: 700, letterSpacing: 0.5, padding: "10px 14px", borderBottom: `1px solid ${THEME.line}`, whiteSpace: "nowrap" };
const td = { padding: "12px 14px", fontSize: 13.5, color: THEME.text, borderBottom: `1px solid ${THEME.line}`, verticalAlign: "middle" };

function Table({ columns, children }) {
  return (
    <div style={{ background: THEME.surface, border: `1px solid ${THEME.line}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{columns.map((c) => <th key={c} style={th}>{c}</th>)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function MonthFilterBar({ month, setMonth, label }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
      <span style={{ fontSize: 12.5, color: THEME.muted, fontWeight: 600 }}>{label || "月份"}</span>
      <TextInput type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 160 }} />
      {month && <Btn size="sm" onClick={() => setMonth("")}>顯示全部</Btn>}
    </div>
  );
}

function DatePickerButton({ value, onChange, placeholder = "選擇日期" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [viewYear, setViewYear] = useState(() => (value ? new Date(value) : new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value) : new Date()).getMonth());
  const wrapRef = React.useRef(null);
  const popRef = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const updatePos = () => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 6, left: r.left });
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  const openCalendar = () => {
    const d = value ? new Date(value) : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen((o) => !o);
  };

  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = (d) => `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayIso = todayStr();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); };

  return (
    <div ref={wrapRef} style={{ display: "inline-block" }}>
      <Btn size="sm" icon={CalendarDays} onClick={openCalendar}>{value ? fmtDate(value) : placeholder}</Btn>
      {open && createPortal(
        <div ref={popRef} style={{ position: "fixed", zIndex: 300, top: pos.top, left: pos.left, background: "#fff", border: `1px solid ${THEME.line}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.18)", padding: 12, width: 240 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button type="button" onClick={prevMonth} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.muted, padding: 4, fontSize: 15 }}>‹</button>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text }}>{viewYear}年{viewMonth + 1}月</div>
            <button type="button" onClick={nextMonth} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.muted, padding: 4, fontSize: 15 }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, fontSize: 11, color: THEME.muted, textAlign: "center", marginBottom: 4 }}>
            {["日", "一", "二", "三", "四", "五", "六"].map((w) => <div key={w}>{w}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = dateStr(d);
              const isSelected = value === iso;
              const isToday = todayIso === iso;
              return (
                <button key={i} type="button" onClick={() => { onChange(iso); setOpen(false); }}
                  style={{
                    border: isToday && !isSelected ? `1px solid ${THEME.brass}` : "1px solid transparent",
                    borderRadius: 6, padding: "6px 0", fontSize: 12, cursor: "pointer",
                    background: isSelected ? THEME.brass : "transparent",
                    color: isSelected ? "#fff" : THEME.text,
                    fontWeight: isSelected ? 700 : 400,
                  }}>{d}</button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* =========================================================
   MAIN APP
========================================================= */
export default function CompanyManagementSystem({ session }) {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [billing, setBilling] = useState([]);
  const [accounting, setAccounting] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [sysUsers, setSysUsers] = useState([]);
  const [rolePerms, setRolePerms] = useState(DEFAULT_MATRIX());
  const [quoteTemplates, setQuoteTemplates] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [companyLocation, setCompanyLocation] = useState(null);

  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const [emp, att, pay, qt, inv, bil, acc, ven, con, usr, rp, qtpl, cuid, veh, cloc] = await Promise.all([
        loadKey(STORAGE_KEYS.employees, []),
        loadKey(STORAGE_KEYS.attendance, []),
        loadKey(STORAGE_KEYS.payroll, []),
        loadKey(STORAGE_KEYS.quotes, []),
        loadKey(STORAGE_KEYS.invoices, []),
        loadKey(STORAGE_KEYS.billing, []),
        loadKey(STORAGE_KEYS.accounting, []),
        loadKey(STORAGE_KEYS.vendors, []),
        loadKey(STORAGE_KEYS.contracts, []),
        loadKey(STORAGE_KEYS.sysUsers, []),
        loadKey(STORAGE_KEYS.rolePerms, null),
        loadKey(STORAGE_KEYS.quoteTemplates, []),
        loadKey(STORAGE_KEYS.currentUser, ""),
        loadKey(STORAGE_KEYS.vehicles, []),
        loadKey(STORAGE_KEYS.companyLocation, null),
      ]);
      setEmployees(emp); setAttendance(att); setPayroll(pay); setQuotes(qt);
      setInvoices(inv); setBilling(bil); setAccounting(acc);
      setVendors(ven); setContracts(con); setSysUsers(usr);
      setRolePerms(rp || DEFAULT_MATRIX());
      const missingSeeds = SEED_QUOTE_TEMPLATES.filter((seed) => !qtpl.some((t) => t.company === seed.company));
      const mergedTemplates = missingSeeds.length ? [...missingSeeds, ...qtpl] : qtpl;
      if (missingSeeds.length) saveKey(STORAGE_KEYS.quoteTemplates, mergedTemplates);
      setQuoteTemplates(mergedTemplates);
      setCurrentUserId(cuid || "");
      setVehicles(veh);
      const loc = cloc || DEFAULT_COMPANY_LOCATION;
      if (!cloc) saveKey(STORAGE_KEYS.companyLocation, loc);
      setCompanyLocation(loc);
      setLoading(false);
    })();
  }, []);

  // persist helpers — update state + storage together
  const persist = {
    employees: (v) => { setEmployees(v); saveKey(STORAGE_KEYS.employees, v); },
    attendance: (v) => { setAttendance(v); saveKey(STORAGE_KEYS.attendance, v); },
    payroll: (v) => { setPayroll(v); saveKey(STORAGE_KEYS.payroll, v); },
    quotes: (v) => { setQuotes(v); saveKey(STORAGE_KEYS.quotes, v); },
    invoices: (v) => { setInvoices(v); saveKey(STORAGE_KEYS.invoices, v); },
    billing: (v) => { setBilling(v); saveKey(STORAGE_KEYS.billing, v); },
    accounting: (v) => { setAccounting(v); saveKey(STORAGE_KEYS.accounting, v); },
    vendors: (v) => { setVendors(v); saveKey(STORAGE_KEYS.vendors, v); },
    contracts: (v) => { setContracts(v); saveKey(STORAGE_KEYS.contracts, v); },
    sysUsers: (v) => { setSysUsers(v); saveKey(STORAGE_KEYS.sysUsers, v); },
    rolePerms: (v) => { setRolePerms(v); saveKey(STORAGE_KEYS.rolePerms, v); },
    quoteTemplates: (v) => { setQuoteTemplates(v); saveKey(STORAGE_KEYS.quoteTemplates, v); },
    currentUserId: (v) => { setCurrentUserId(v); saveKey(STORAGE_KEYS.currentUser, v); },
    vehicles: (v) => { setVehicles(v); saveKey(STORAGE_KEYS.vehicles, v); },
    companyLocation: (v) => { setCompanyLocation(v); saveKey(STORAGE_KEYS.companyLocation, v); },
  };

  const addAccountingEntry = useCallback((entry) => {
    setAccounting((prev) => {
      const next = [{ id: uid(), date: todayStr(), ...entry, createdAt: new Date().toISOString() }, ...prev];
      saveKey(STORAGE_KEYS.accounting, next);
      return next;
    });
  }, []);

  const askDelete = (message, onConfirm) => setConfirmState({ message, onConfirm });

  // 「真實身分」以登入帳號的 Email 對應到系統帳號清單為準，不是側邊欄下拉選單
  // 可以自己亂選的——不然任何人都能把自己切成「管理員」。找不到對應的系統帳號時
  // （例如系統剛啟用、還沒建立任何帳號）先當管理員，才能進來把第一批帳號設好。
  const myEmail = (session?.user?.email || "").toLowerCase();
  const matchedUser = sysUsers.find((u) => u.email && u.email.toLowerCase() === myEmail) || null;
  const realIsAdmin = !matchedUser || matchedUser.role === "管理員";
  // 只有真實身分是管理員，才能用側邊欄下拉選單切換要操作的身分（例如共用打卡機情境）；
  // 一般員工的身分固定就是自己登入帳號比對到的那筆系統帳號，不能自己改成別人或改成管理員。
  const currentUser = realIsAdmin ? (sysUsers.find((u) => u.id === currentUserId) || matchedUser) : matchedUser;
  const isAdmin = !currentUser || currentUser.role === "管理員";

  const allowedNav = NAV.filter((n) => {
    if (n.key === "permissions") return isAdmin; // 權限設定一律只有管理員能進，角色矩陣裡的勾選對這頁不生效，避免有人把自己的角色設成能改權限
    return isAdmin || !!rolePerms.matrix[currentUser?.role]?.[n.key];
  });
  const allowedKeys = allowedNav.map((n) => n.key).join(",");

  useEffect(() => {
    if (!loading && !allowedKeys.split(",").includes(tab)) {
      setTab(allowedNav[0]?.key || "dashboard");
    }
  }, [loading, tab, allowedKeys]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 500, fontFamily: FONT_BODY, color: THEME.muted }}>
        載入資料中…
      </div>
    );
  }

  const ctx = {
    employees, attendance, payroll, quotes, invoices, billing, accounting,
    vendors, contracts, sysUsers, rolePerms, quoteTemplates, vehicles, companyLocation,
    currentUser, isAdmin, realIsAdmin,
    persist, addAccountingEntry, askDelete, now,
  };

  return (
    <div style={{ fontFamily: FONT_BODY, background: THEME.canvas, minHeight: 700, display: "flex", borderRadius: 16, overflow: "hidden", border: `1px solid ${THEME.line}` }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #D8D5C8; border-radius: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <Sidebar tab={tab} setTab={setTab} nav={allowedNav} employees={employees} sysUsers={sysUsers} currentUserId={currentUserId} setCurrentUserId={persist.currentUserId} realIsAdmin={realIsAdmin} matchedUser={matchedUser} session={session} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar tab={tab} now={now} />
        <div style={{ padding: "26px 32px", flex: 1, overflow: "auto" }}>
          {tab === "dashboard" && <Dashboard ctx={ctx} />}
          {tab === "employees" && <EmployeesView ctx={ctx} />}
          {tab === "payroll" && <PayrollView ctx={ctx} />}
          {tab === "vendors" && <VendorsView ctx={ctx} />}
          {tab === "quotes" && <QuotesView ctx={ctx} setTab={setTab} />}
          {tab === "invoices" && <InvoicesView ctx={ctx} />}
          {tab === "attendance" && <AttendanceView ctx={ctx} />}
          {tab === "billing" && <BillingView ctx={ctx} />}
          {tab === "contracts" && <ContractsView ctx={ctx} />}
          {tab === "vehicles" && <VehiclesView ctx={ctx} />}
          {tab === "accounting" && <AccountingView ctx={ctx} />}
          {tab === "reports" && <ReportsView ctx={ctx} />}
          {tab === "permissions" && <PermissionsView ctx={ctx} />}
        </div>
      </div>

      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          onCancel={() => setConfirmState(null)}
          onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }}
        />
      )}
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ tab, setTab, nav, employees, sysUsers, currentUserId, setCurrentUserId, realIsAdmin, matchedUser, session }) {
  const active = employees.filter((e) => e.status === "在職").length;
  return (
    <div style={{ width: 232, background: THEME.ink, color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "24px 22px 18px", borderBottom: `1px solid ${THEME.inkSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: THEME.brass, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15.5, letterSpacing: 0.5 }}>公司管理系統</div>
            <div style={{ fontSize: 10.5, color: "#9BA2B5", letterSpacing: 1 }}>COMPANY OS</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "14px 12px", overflow: "auto" }}>
        {nav.map((n, i) => {
          const isActive = tab === n.key;
          return (
            <button key={n.key} onClick={() => setTab(n.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                marginBottom: 3, borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
                background: isActive ? THEME.brass : "transparent",
                color: isActive ? "#fff" : "#C7CBD9", fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                transition: "all .15s",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = THEME.inkSoft; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontFamily: FONT_NUM, fontSize: 10.5, opacity: isActive ? 0.85 : 0.45, width: 16 }}>{String(i + 1).padStart(2, "0")}</span>
              <n.icon size={16} strokeWidth={2} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {isActive && <ChevronRight size={14} />}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "14px 22px 16px", borderTop: `1px solid ${THEME.inkSoft}` }}>
        <div style={{ fontSize: 10.5, color: "#8B93A8", letterSpacing: 0.5, marginBottom: 6 }}>目前身分</div>
        {realIsAdmin ? (
          <Select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(e.target.value)}
            style={{ width: "100%", background: THEME.inkSoft, color: "#fff", border: `1px solid ${THEME.inkFaint}`, marginBottom: 10 }}
          >
            <option value="">管理員（完整權限）</option>
            {sysUsers.map((u) => <option key={u.id} value={u.id}>{u.name}（{u.role}）</option>)}
          </Select>
        ) : (
          <div style={{ width: "100%", background: THEME.inkSoft, border: `1px solid ${THEME.inkFaint}`, borderRadius: 8, padding: "8px 10px", fontSize: 12.5, marginBottom: 10 }}>
            {matchedUser?.name}（{matchedUser?.role}）
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11.5, color: "#8B93A8" }}>
          <span>在職人數</span><span style={{ fontFamily: FONT_NUM, color: "#fff" }}>{active}</span>
        </div>
        {session?.user?.email && (
          <div style={{ color: "#8B93A8", fontSize: 11, marginTop: 8, wordBreak: "break-all" }}>登入帳號：{session.user.email}</div>
        )}
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            marginTop: 10, width: "100%", padding: "8px 0", borderRadius: 7,
            border: `1px solid ${THEME.inkFaint}`, background: "transparent", color: "#C7CBD9",
            fontSize: 12, cursor: "pointer",
          }}
        >
          登出
        </button>
      </div>
    </div>
  );
}

function TopBar({ tab, now }) {
  const current = NAV.find((n) => n.key === tab);
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: `1px solid ${THEME.line}`, background: THEME.surface }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IconBadge icon={current.icon} tone="ink" />
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: THEME.text }}>{current.label}</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: FONT_NUM, fontSize: 18, fontWeight: 700, color: THEME.text, letterSpacing: 1 }}>
          {now.toLocaleTimeString("zh-TW", { hour12: false })}
        </div>
        <div style={{ fontSize: 11.5, color: THEME.muted }}>
          {now.getFullYear()}/{String(now.getMonth() + 1).padStart(2, "0")}/{String(now.getDate()).padStart(2, "0")}（週{weekday}）
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */
function Dashboard({ ctx }) {
  const { employees, invoices, billing, attendance, accounting, contracts, vendors } = ctx;
  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const expiringContracts = (contracts || []).filter((c) => c.status === "生效中" && c.endDate && new Date(c.endDate) <= soon && new Date(c.endDate) >= new Date());
  const activeEmp = employees.filter((e) => e.status === "在職").length;
  const thisMonth = monthStr();
  const monthInvoiceTotal = invoices
    .filter((i) => (i.date || "").startsWith(thisMonth))
    .reduce((s, i) => s + (i.total || sumItems(i.items) * (1 + (i.taxRate || 0) / 100)), 0);
  const pendingBilling = billing.filter((b) => b.status === "未付款").reduce((s, b) => s + Number(b.amount || 0), 0);
  const todayAtt = attendance.filter((a) => a.date === todayStr());
  const clockedInCount = todayAtt.filter((a) => a.clockIn).length;

  const income = accounting.filter((a) => a.type === "收入").reduce((s, a) => s + Number(a.amount || 0), 0);
  const expense = accounting.filter((a) => a.type === "支出").reduce((s, a) => s + Number(a.amount || 0), 0);

  // last 6 months revenue trend
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return monthStr(d);
  });
  const trend = months.map((m) => {
    const inc = accounting.filter((a) => a.type === "收入" && (a.date || "").startsWith(m)).reduce((s, a) => s + Number(a.amount || 0), 0);
    const exp = accounting.filter((a) => a.type === "支出" && (a.date || "").startsWith(m)).reduce((s, a) => s + Number(a.amount || 0), 0);
    return { month: m.slice(5) + "月", 收入: Math.round(inc), 支出: Math.round(exp) };
  });

  const recentActivity = [
    ...invoices.map((i) => ({ t: i.date, dt: i.createdAt, text: `發票 ${i.no} — ${i.client}`, tag: i.status, by: i.createdBy })),
    ...billing.filter((b) => b.status).map((b) => ({ t: b.date, dt: b.createdAt, text: `公司付款 ${b.no} — ${b.vendor}`, tag: b.status, by: b.createdBy })),
    ...quotesActivity(ctx),
  ].filter((x) => x.t).sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 6);

  return (
    <div>
      <SectionHeader eyebrow="OVERVIEW · 01" title="總覽儀表板" />

      {expiringContracts.length > 0 && (
        <div style={{ background: THEME.warnSoft, border: `1px solid #E9D8AE`, borderRadius: 10, padding: "10px 16px", fontSize: 12.5, color: THEME.warn, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={14} />
          有 {expiringContracts.length} 份契約將於 30 天內到期：{expiringContracts.map((c) => c.title).join("、")}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard label="在職員工人數" value={activeEmp} sub={`共登錄 ${employees.length} 位`} icon={Users} tone="ink" />
        <StatCard label="本月發票金額" value={fmtMoney(monthInvoiceTotal)} sub={thisMonth} icon={Receipt} tone="brass" />
        <StatCard label="待付款金額" value={fmtMoney(pendingBilling)} sub="未付款（公司付款）" icon={HandCoins} tone="warn" />
        <StatCard label="今日已打卡" value={`${clockedInCount} / ${activeEmp}`} sub={todayStr()} icon={Clock} tone="success" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard label="供應商家數" value={(vendors || []).filter((v) => v.vendorType === "供應商").length} sub={`共登錄 ${(vendors || []).length} 家往來公司`} icon={Truck} tone="ink" />
        <StatCard label="生效中契約" value={(contracts || []).filter((c) => c.status === "生效中").length} sub={`共登錄 ${(contracts || []).length} 份`} icon={FileSignature} tone="brass" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <div style={{ background: THEME.surface, border: `1px solid ${THEME.line}`, borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: THEME.text }}>近 6 個月收支趨勢</h3>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: THEME.muted }}>
              <span style={{ color: THEME.success }}>● 收入</span><span style={{ color: THEME.danger }}>● 支出</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={trend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.line} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: THEME.muted }} axisLine={{ stroke: THEME.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: THEME.muted }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${THEME.line}` }} />
              <Bar dataKey="收入" fill={THEME.success} radius={[4, 4, 0, 0]} />
              <Bar dataKey="支出" fill={THEME.danger} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: THEME.surface, border: `1px solid ${THEME.line}`, borderRadius: 12, padding: "20px 22px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14.5, fontWeight: 700, color: THEME.text }}>最近動態</h3>
          {recentActivity.length === 0 ? (
            <p style={{ fontSize: 13, color: THEME.muted }}>目前尚無資料，建立估價單、發票或支出紀錄後會顯示於此。</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: THEME.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.text}</div>
                    <div style={{ fontSize: 11, color: THEME.muted }}>{a.dt ? fmtDateTime(a.dt) : fmtDate(a.t)}{a.by ? ` · ${a.by}` : ""}</div>
                  </div>
                  <StatusBadge status={a.tag} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 16 }}>
        <StatCard label="總累計收入" value={fmtMoney(income)} icon={TrendingUp} tone="success" />
        <StatCard label="總累計支出" value={fmtMoney(expense)} icon={TrendingDown} tone="danger" />
        <StatCard label="淨額" value={fmtMoney(income - expense)} icon={Landmark} tone="brass" />
      </div>
    </div>
  );
}
function quotesActivity(ctx) {
  return ctx.quotes.map((q) => ({ t: q.date, dt: q.createdAt, text: `估價單 ${q.no} — ${q.client}`, tag: q.status, by: q.createdBy }));
}

/* =========================================================
   EMPLOYEES
========================================================= */
const emptyEmployee = {
  name: "", dept: "", title: "", phone: "", email: "", hireDate: todayStr(), baseSalary: "", status: "在職",
  additions: [], deductions: [], laborInsurance: 0, healthInsurance: 0, pensionSelf: 0, advance: 0, insuranceStatus: "加保", insuranceGrade: "",
};

function EmployeesView({ ctx }) {
  const { employees, persist, askDelete } = ctx;
  const [modal, setModal] = useState(null); // {mode, data}
  const [query, setQuery] = useState("");

  const filtered = employees.filter((e) => (e.name + e.dept + e.title).toLowerCase().includes(query.toLowerCase()));

  const save = (data) => {
    if (data.id) {
      persist.employees(employees.map((e) => (e.id === data.id ? data : e)));
    } else {
      persist.employees([{ ...data, id: uid() }, ...employees]);
    }
    setModal(null);
  };

  return (
    <div>
      <SectionHeader eyebrow="PERSONNEL · 02" title="人員管理"
        action={<Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: emptyEmployee })}>新增員工</Btn>} />

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: THEME.muted }} />
          <TextInput placeholder="搜尋姓名／部門／職位" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} text="尚未建立任何員工資料。" action={<Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: emptyEmployee })}>新增第一位員工</Btn>} />
      ) : (
        <Table columns={["姓名", "部門", "職位", "到職日", "底薪", "聯絡方式", "投保級距", "狀態", ""]}>
          {filtered.map((e) => (
            <tr key={e.id}>
              <td style={td}><strong>{e.name}</strong></td>
              <td style={td}>{e.dept || "—"}</td>
              <td style={td}>{e.title || "—"}</td>
              <td style={td}>{fmtDate(e.hireDate)}</td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{fmtMoney(e.baseSalary)}</td>
              <td style={td}>
                <div style={{ fontSize: 12.5 }}>{e.phone || "—"}</div>
                <div style={{ fontSize: 11.5, color: THEME.muted }}>{e.email || "—"}</div>
              </td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{e.insuranceGrade || "—"}</td>
              <td style={td}><StatusBadge status={e.status} /></td>
              <td style={{ ...td, textAlign: "right" }}>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Btn size="sm" icon={Pencil} onClick={() => setModal({ mode: "edit", data: e })}>編輯</Btn>
                  <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除員工「${e.name}」嗎？`, () => persist.employees(employees.filter((x) => x.id !== e.id)))} />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {modal && (
        <Modal title={modal.mode === "new" ? "新增員工" : "編輯員工資料"} onClose={() => setModal(null)} width={680}>
          <EmployeeForm data={modal.data} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function EmployeeForm({ data, onSave, onCancel }) {
  const [f, setF] = useState({ additions: [], deductions: [], laborInsurance: 0, healthInsurance: 0, pensionSelf: 0, advance: 0, insuranceStatus: "加保", insuranceGrade: "", ...data });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="姓名"><TextInput value={f.name} onChange={set("name")} placeholder="王小明" /></Field>
        <Field label="部門"><TextInput value={f.dept} onChange={set("dept")} placeholder="業務部" /></Field>
        <Field label="職位"><TextInput value={f.title} onChange={set("title")} placeholder="專案經理" /></Field>
        <Field label="到職日"><TextInput type="date" value={f.hireDate} onChange={set("hireDate")} /></Field>
        <Field label="底薪"><TextInput type="number" value={f.baseSalary} onChange={set("baseSalary")} placeholder="40000" /></Field>
        <Field label="狀態">
          <Select value={f.status} onChange={set("status")}>
            <option value="在職">在職</option>
            <option value="離職">離職</option>
          </Select>
        </Field>
        <Field label="聯絡電話"><TextInput value={f.phone} onChange={set("phone")} placeholder="0912-345-678" /></Field>
        <Field label="Email"><TextInput value={f.email} onChange={set("email")} placeholder="name@company.com" /></Field>
      </div>

      <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 700, margin: "18px 0 8px" }}>薪資表預設項目（產生薪資時自動套入，仍可在薪資表內個別調整）</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 18 }}>
        <AmountListEditor label="加項（獎金、津貼等）" items={f.additions} setItems={(v) => setF({ ...f, additions: v })} tone="success" />
        <AmountListEditor label="減項（遲到扣款等其他項目）" items={f.deductions} setItems={(v) => setF({ ...f, deductions: v })} tone="danger" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
        <Field label="勞保自負額"><TextInput type="number" value={f.laborInsurance} onChange={set("laborInsurance")} /></Field>
        <Field label="健保自付額"><TextInput type="number" value={f.healthInsurance} onChange={set("healthInsurance")} /></Field>
        <Field label="勞退自付額"><TextInput type="number" value={f.pensionSelf} onChange={set("pensionSelf")} /></Field>
        <Field label="借支"><TextInput type="number" value={f.advance} onChange={set("advance")} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="保險狀態">
          <Select value={f.insuranceStatus} onChange={set("insuranceStatus")}>
            <option value="加保">加保</option>
            <option value="在保">在保</option>
            <option value="退保">退保</option>
            <option value="停保">停保</option>
          </Select>
        </Field>
        <Field label="投保級距"><TextInput value={f.insuranceGrade} onChange={set("insuranceGrade")} placeholder="不列入薪資計算，僅供參考" /></Field>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.name && onSave(f)} disabled={!f.name}>儲存</Btn>
      </div>
    </div>
  );
}

/* =========================================================
   PAYROLL
========================================================= */
const sumAmounts = (items = []) => items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
const payrollNet = (r) =>
  Number(r.baseSalary || 0) + sumAmounts(r.additions) - sumAmounts(r.deductions)
  - Number(r.laborInsurance || 0) - Number(r.healthInsurance || 0) - Number(r.pensionSelf || 0) - Number(r.advance || 0);

const emptyPayrollRow = (e, month) => ({
  id: uid(), month, employeeId: e.id, employeeName: e.name, department: e.dept || "",
  baseSalary: Number(e.baseSalary) || 0,
  additions: (e.additions || []).map((it) => ({ ...it, id: uid() })),
  deductions: (e.deductions || []).map((it) => ({ ...it, id: uid() })),
  laborInsurance: Number(e.laborInsurance) || 0, healthInsurance: Number(e.healthInsurance) || 0,
  pensionSelf: Number(e.pensionSelf) || 0, advance: Number(e.advance) || 0, advanceDate: "",
  insuranceStatus: e.insuranceStatus || "加保", paymentDate: "", note: "",
  status: "待發放", posted: false,
});

function PayrollView({ ctx }) {
  const { employees, payroll, persist, addAccountingEntry, askDelete } = ctx;
  const [month, setMonth] = useState(monthStr());
  const [modal, setModal] = useState(null);
  const [deptFilter, setDeptFilter] = useState("全部");

  const deptOf = (r) => r.department || employees.find((e) => e.id === r.employeeId)?.dept || "";
  const allRows = payroll.filter((p) => p.month === month);
  const departments = ["全部", ...Array.from(new Set(allRows.map(deptOf).filter(Boolean)))];
  const rows = allRows.filter((r) => deptFilter === "全部" || deptOf(r) === deptFilter);
  const activeEmployees = employees.filter((e) => e.status === "在職");

  const generate = () => {
    const existingIds = new Set(allRows.map((r) => r.employeeId));
    const news = activeEmployees.filter((e) => !existingIds.has(e.id)).map((e) => emptyPayrollRow(e, month));
    if (news.length) persist.payroll([...payroll, ...news]);
  };

  const saveRow = (data) => {
    persist.payroll(payroll.map((r) => (r.id === data.id ? data : r)));
    setModal(null);
  };

  const markPaid = (r) => {
    const net = payrollNet(r);
    const paymentDate = r.paymentDate || todayStr();
    persist.payroll(payroll.map((x) => (x.id === r.id ? { ...x, status: "已發放", posted: true, paymentDate } : x)));
    if (!r.posted) {
      addAccountingEntry({ type: "支出", category: "薪資", amount: net, desc: `${r.month} 薪資 — ${r.employeeName}`, date: paymentDate });
    }
  };

  const totalNet = rows.reduce((s, r) => s + payrollNet(r), 0);

  return (
    <div>
      <SectionHeader eyebrow="PAYROLL · 03" title="薪資表管理"
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <TextInput type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 150 }} />
            <Btn variant="brass" icon={Plus} onClick={generate}>產生本月薪資表</Btn>
          </div>
        } />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label="本月人數" value={rows.length} icon={Users} tone="ink" />
        <StatCard label="本月薪資總額" value={fmtMoney(totalNet)} icon={Wallet} tone="brass" />
        <StatCard label="已發放" value={rows.filter((r) => r.status === "已發放").length + " / " + rows.length} icon={Check} tone="success" />
      </div>

      {allRows.length > 0 && departments.length > 2 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {departments.map((d) => (
            <button key={d} onClick={() => setDeptFilter(d)}
              style={{
                padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${deptFilter === d ? THEME.brass : THEME.line}`,
                background: deptFilter === d ? THEME.brass : "#fff",
                color: deptFilter === d ? "#fff" : THEME.text,
              }}>{d}</button>
          ))}
        </div>
      )}

      {allRows.length === 0 ? (
        <EmptyState icon={Wallet} text={`尚未建立 ${month} 的薪資表。`} action={<Btn variant="brass" icon={Plus} onClick={generate}>依在職員工產生薪資表</Btn>} />
      ) : (
        <Table columns={["員工", "部門", "底薪", "加項", "減項／保費", "借支", "實發淨額", "保險狀態", "付款日", "狀態", ""]}>
          {rows.map((r) => {
            const net = payrollNet(r);
            const deductTotal = sumAmounts(r.deductions) + Number(r.laborInsurance || 0) + Number(r.healthInsurance || 0) + Number(r.pensionSelf || 0);
            return (
              <tr key={r.id}>
                <td style={td}><strong>{r.employeeName}</strong></td>
                <td style={td}>{deptOf(r) || "—"}</td>
                <td style={{ ...td, fontFamily: FONT_NUM }}>{fmtMoney(r.baseSalary)}</td>
                <td style={{ ...td, fontFamily: FONT_NUM, color: THEME.success }}>{sumAmounts(r.additions) ? "+" + fmtMoney(sumAmounts(r.additions)) : "—"}</td>
                <td style={{ ...td, fontFamily: FONT_NUM, color: THEME.danger }}>{deductTotal ? "−" + fmtMoney(deductTotal) : "—"}</td>
                <td style={td}>
                  {Number(r.advance) ? (
                    <>
                      <div style={{ fontFamily: FONT_NUM, color: THEME.danger }}>−{fmtMoney(r.advance)}</div>
                      <div style={{ fontSize: 11, color: THEME.muted }}>{r.advanceDate ? fmtDate(r.advanceDate) : "未填日期"}</div>
                    </>
                  ) : "—"}
                </td>
                <td style={{ ...td, fontFamily: FONT_NUM, fontWeight: 700 }}>{fmtMoney(net)}</td>
                <td style={td}>{r.insuranceStatus || "—"}</td>
                <td style={td}>{r.paymentDate ? fmtDate(r.paymentDate) : "—"}</td>
                <td style={td}><StatusBadge status={r.status} /></td>
                <td style={{ ...td, textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <Btn size="sm" icon={Pencil} onClick={() => setModal(r)}>編輯</Btn>
                    {r.status !== "已發放" && <Btn size="sm" variant="success" icon={Check} onClick={() => markPaid(r)}>標記已發放</Btn>}
                    <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除 ${r.employeeName} 的薪資紀錄嗎？`, () => persist.payroll(payroll.filter((x) => x.id !== r.id)))} />
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {modal && (
        <Modal title={`編輯薪資明細 — ${modal.employeeName}（${modal.month}）`} onClose={() => setModal(null)} width={680}>
          <PayrollForm data={{ ...modal, department: deptOf(modal) }} onSave={saveRow} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function AmountListEditor({ label, items, setItems, tone }) {
  const update = (idx, key, val) => { const next = items.slice(); next[idx] = { ...next[idx], [key]: val }; setItems(next); };
  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));
  const add = () => setItems([...items, { id: uid(), name: "", amount: 0 }]);
  const total = sumAmounts(items);
  return (
    <div>
      <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {items.length === 0 && <div style={{ fontSize: 12.5, color: THEME.muted, marginBottom: 8 }}>尚無項目</div>}
      {items.map((it, i) => (
        <div key={it.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <TextInput value={it.name} onChange={(e) => update(i, "name", e.target.value)} placeholder="項目名稱" style={{ flex: 1 }} />
          <input type="number" value={it.amount} onChange={(e) => update(i, "amount", e.target.value)} style={{ ...inputStyle, width: 110, fontFamily: FONT_NUM }} />
          <button onClick={() => remove(i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.danger }}><X size={15} /></button>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Btn size="sm" icon={Plus} onClick={add}>新增項目</Btn>
        <span style={{ fontSize: 12.5, color: THEME.muted }}>小計：<span style={{ fontFamily: FONT_NUM, color: tone === "danger" ? THEME.danger : THEME.success, fontWeight: 700 }}>{fmtMoney(total)}</span></span>
      </div>
    </div>
  );
}

function PayrollForm({ data, onSave, onCancel }) {
  const [f, setF] = useState({ advanceDate: "", ...data });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const net = payrollNet(f);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
        <Field label="員工"><TextInput value={f.employeeName} disabled style={{ background: "#F5F5F0" }} /></Field>
        <Field label="部門"><TextInput value={f.department || "—"} disabled style={{ background: "#F5F5F0" }} /></Field>
        <Field label="底薪"><TextInput type="number" value={f.baseSalary} onChange={set("baseSalary")} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 18 }}>
        <AmountListEditor label="加項（獎金、津貼等）" items={f.additions} setItems={(v) => setF({ ...f, additions: v })} tone="success" />
        <AmountListEditor label="減項（遲到扣款等其他項目）" items={f.deductions} setItems={(v) => setF({ ...f, deductions: v })} tone="danger" />
      </div>

      <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 700, marginBottom: 8 }}>保費</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
        <Field label="勞保自負額"><TextInput type="number" value={f.laborInsurance} onChange={set("laborInsurance")} /></Field>
        <Field label="健保自付額"><TextInput type="number" value={f.healthInsurance} onChange={set("healthInsurance")} /></Field>
        <Field label="勞退自付額"><TextInput type="number" value={f.pensionSelf} onChange={set("pensionSelf")} /></Field>
      </div>

      <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 700, marginBottom: 8 }}>借支</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <Field label="借支金額"><TextInput type="number" value={f.advance} onChange={set("advance")} /></Field>
        <Field label="借支日期"><TextInput type="date" value={f.advanceDate} onChange={set("advanceDate")} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <Field label="保險狀態">
          <Select value={f.insuranceStatus} onChange={set("insuranceStatus")}>
            <option value="加保">加保</option>
            <option value="在保">在保</option>
            <option value="退保">退保</option>
            <option value="停保">停保</option>
          </Select>
        </Field>
        <Field label="付款日"><TextInput type="date" value={f.paymentDate} onChange={set("paymentDate")} /></Field>
      </div>

      <Field label="備註"><TextArea value={f.note} onChange={set("note")} placeholder="選填" /></Field>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${THEME.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>實發淨額：<span style={{ fontFamily: FONT_NUM, color: THEME.brassDeep }}>{fmtMoney(net)}</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={onCancel}>取消</Btn>
          <Btn variant="primary" icon={Check} onClick={() => onSave(f)}>儲存</Btn>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   QUOTES & INVOICES (shared line-item form)
========================================================= */
function LineItemsEditor({ items, setItems, withTax, taxRate, setTaxRate }) {
  const update = (idx, key, val) => {
    const next = items.slice();
    next[idx] = { ...next[idx], [key]: val };
    setItems(next);
  };
  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));
  const add = () => setItems([...items, { id: uid(), desc: "", unit: "", qty: 1, price: 0, note: "" }]);
  const subtotal = sumItems(items);
  const total = withTax ? subtotal * (1 + Number(taxRate) / 100) : subtotal;

  return (
    <div>
      <div style={{ border: `1px solid ${THEME.line}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAF9F5" }}>
              <th style={{ ...th, borderBottom: `1px solid ${THEME.line}` }}>項目</th>
              <th style={{ ...th, width: 64 }}>單位</th>
              <th style={{ ...th, width: 70 }}>數量</th>
              <th style={{ ...th, width: 110 }}>單價</th>
              <th style={{ ...th, width: 110 }}>總價</th>
              <th style={{ ...th, width: 110 }}>備註</th>
              <th style={{ ...th, width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id}>
                <td style={{ ...td, padding: 8 }}><TextInput value={it.desc} onChange={(e) => update(i, "desc", e.target.value)} placeholder="項目名稱" /></td>
                <td style={{ ...td, padding: 8 }}><TextInput value={it.unit || ""} onChange={(e) => update(i, "unit", e.target.value)} placeholder="式" /></td>
                <td style={{ ...td, padding: 8 }}><input type="number" value={it.qty} onChange={(e) => update(i, "qty", e.target.value)} style={{ ...inputStyle, fontFamily: FONT_NUM }} /></td>
                <td style={{ ...td, padding: 8 }}><input type="number" value={it.price} onChange={(e) => update(i, "price", e.target.value)} style={{ ...inputStyle, fontFamily: FONT_NUM }} /></td>
                <td style={{ ...td, padding: 8, fontFamily: FONT_NUM }}>{fmtMoney((Number(it.qty) || 0) * (Number(it.price) || 0))}</td>
                <td style={{ ...td, padding: 8 }}><TextInput value={it.note || ""} onChange={(e) => update(i, "note", e.target.value)} placeholder="選填" /></td>
                <td style={{ ...td, padding: 8 }}>
                  <button onClick={() => remove(i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.danger }}><X size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Btn size="sm" icon={Plus} onClick={add}>新增項目</Btn>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <div style={{ fontSize: 13, color: THEME.muted }}>小計：<span style={{ fontFamily: FONT_NUM, color: THEME.text }}>{fmtMoney(subtotal)}</span></div>
        {withTax && (
          <div style={{ fontSize: 13, color: THEME.muted, display: "flex", alignItems: "center", gap: 6 }}>
            稅率 <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} style={{ ...inputStyle, width: 60, fontFamily: FONT_NUM }} />% ＝
            <span style={{ fontFamily: FONT_NUM, color: THEME.text }}>{fmtMoney(subtotal * Number(taxRate) / 100)}</span>
          </div>
        )}
        <div style={{ fontSize: 16, fontWeight: 700 }}>總計：<span style={{ fontFamily: FONT_NUM, color: THEME.brassDeep }}>{fmtMoney(total)}</span></div>
      </div>
    </div>
  );
}

const LETTERHEAD_FIELDS = ["companyName", "docTitle", "taxId", "address", "tel", "fax", "contactName", "contactPhone", "contactEmail", "ownerName"];
const emptyLetterhead = () => ({ companyName: "", docTitle: "", taxId: "", address: "", tel: "", fax: "", contactName: "", contactPhone: "", contactEmail: "", ownerName: "" });

const emptyQuote = () => ({
  no: "", client: "", workName: "", paymentMethod: "", date: todayStr(), validUntil: "",
  items: [{ id: uid(), desc: "", unit: "", qty: 1, price: 0, note: "" }],
  status: "草擬", note: "", attachments: [], ...emptyLetterhead(), docTitle: "估　　價　　單",
});
const addDays = (base, days) => { const d = new Date(base); d.setDate(d.getDate() + Number(days || 0)); return d.toISOString().slice(0, 10); };
const emptyQuoteTemplate = () => ({
  company: VENDOR_COMPANY_OPTIONS[0], title: "", validDays: 30, paymentMethod: "",
  items: [{ id: uid(), desc: "", unit: "", qty: 1, price: 0, note: "" }],
  note: "", ...emptyLetterhead(), docTitle: "估　　價　　單",
});

function QuotesView({ ctx, setTab }) {
  const { quotes, persist, invoices, quoteTemplates, askDelete } = ctx;
  const [modal, setModal] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [templateModal, setTemplateModal] = useState(null);
  const [attachModal, setAttachModal] = useState(null);
  const [companyFilter, setCompanyFilter] = useState("全部");

  // 估價單的報價公司是自由輸入欄位（不像發票鎖定固定公司清單），
  // 所以標籤要直接從實際填過的公司名稱產生，而不是比對固定選項，
  // 否則使用者打的名稱跟固定清單對不起來，篩選永遠是空的。
  const quoteCompanies = Array.from(new Set(quotes.map((q) => q.companyName).filter(Boolean)));
  const hasUnset = quotes.some((q) => !q.companyName);
  const companyTabs = ["全部", ...quoteCompanies, ...(hasUnset ? ["未填公司"] : [])];
  const filteredQuotes = quotes.filter((q) => {
    if (companyFilter === "全部") return true;
    if (companyFilter === "未填公司") return !q.companyName;
    return q.companyName === companyFilter;
  });

  const groupedByMonth = useMemo(() => {
    const map = new Map();
    filteredQuotes.forEach((q) => {
      const key = (q.date || "").slice(0, 7) || "未填日期";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(q);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredQuotes]);

  const save = (data) => {
    if (data.id) {
      persist.quotes(quotes.map((q) => (q.id === data.id ? data : q)));
    } else {
      const no = nextNo("Q", quotes);
      const newQuote = { ...data, id: uid(), no, total: sumItems(data.items), createdBy: actorName(ctx), createdAt: new Date().toISOString() };
      persist.quotes([newQuote, ...quotes]);
      downloadQuotePdf(newQuote);
    }
    setModal(null);
  };

  const saveTemplate = (data) => {
    if (data.id) persist.quoteTemplates(quoteTemplates.map((t) => (t.id === data.id ? data : t)));
    else persist.quoteTemplates([{ ...data, id: uid() }, ...quoteTemplates]);
    setTemplateModal(null);
  };

  const useTemplate = (t) => {
    const letterhead = Object.fromEntries(LETTERHEAD_FIELDS.map((k) => [k, t[k] || ""]));
    const data = {
      ...emptyQuote(),
      ...letterhead,
      paymentMethod: t.paymentMethod || "",
      validUntil: addDays(todayStr(), t.validDays),
      items: (t.items || []).map((it) => ({ ...it, id: uid() })),
      note: t.note || "",
    };
    setPickerOpen(false);
    setModal({ mode: "new", data });
  };

  const convertToInvoice = (q) => {
    const no = nextNo("INV", invoices);
    const letterhead = Object.fromEntries(LETTERHEAD_FIELDS.map((k) => [k, q[k] || ""]));
    const newInv = {
      id: uid(), no, quoteNo: q.no, client: q.client, workName: q.workName || "", paymentMethod: q.paymentMethod || "",
      date: todayStr(), dueDate: "",
      items: q.items, taxRate: 5, status: "未付款", note: `轉自估價單 ${q.no}`, posted: false, createdBy: actorName(ctx), createdAt: new Date().toISOString(), ...letterhead,
    };
    ctx.persist.invoices([newInv, ...invoices]);
    setTab("invoices");
  };

  return (
    <div>
      <SectionHeader eyebrow="QUOTATION · 05" title="估價單"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn icon={FileSignature} onClick={() => setTemplateManagerOpen(true)}>管理估價範本</Btn>
            <Btn variant="brass" icon={Plus} onClick={() => setPickerOpen(true)}>新增估價單</Btn>
          </div>
        } />

      {quotes.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {companyTabs.map((c) => (
            <button key={c} onClick={() => setCompanyFilter(c)}
              style={{
                padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${companyFilter === c ? THEME.brass : THEME.line}`,
                background: companyFilter === c ? THEME.brass : "#fff",
                color: companyFilter === c ? "#fff" : THEME.text,
              }}>{c === "全部" || c === "未填公司" ? c : c.slice(0, 4)}</button>
          ))}
        </div>
      )}

      {quotes.length === 0 ? (
        <EmptyState icon={FileText} text="尚未建立任何估價單。" action={<Btn variant="brass" icon={Plus} onClick={() => setPickerOpen(true)}>建立第一張估價單</Btn>} />
      ) : filteredQuotes.length === 0 ? (
        <EmptyState icon={FileText} text="這個篩選條件下沒有估價單。" />
      ) : (
        groupedByMonth.map(([key, list]) => (
          <div key={key} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: THEME.text }}>{fmtMonthLabel(key)}</span>
              <span style={{ fontSize: 12.5, color: THEME.muted }}>共 {list.length} 張・小計 <span style={{ fontFamily: FONT_NUM, color: THEME.text }}>{fmtMoney(list.reduce((s, q) => s + sumItems(q.items), 0))}</span></span>
            </div>
            <Table columns={["單號", "客戶", "日期", "有效期限", "金額", "報價公司", "狀態", ""]}>
              {list.map((q) => (
                <tr key={q.id}>
                  <td style={{ ...td, fontFamily: FONT_NUM }}>{q.no}</td>
                  <td style={td}><strong>{q.client}</strong></td>
                  <td style={td}>{fmtDate(q.date)}</td>
                  <td style={td}>{fmtDate(q.validUntil)}</td>
                  <td style={{ ...td, fontFamily: FONT_NUM }}>{fmtMoney(sumItems(q.items))}</td>
                  <td style={td}>{q.companyName ? <StatusBadge status={q.companyName.slice(0, 4)} /> : "—"}</td>
                  <td style={td}>
                    <Select value={q.status} onChange={(e) => persist.quotes(quotes.map((x) => x.id === q.id ? { ...x, status: e.target.value } : x))} style={{ padding: "4px 8px", fontSize: 12 }}>
                      <option value="草擬">草擬</option>
                      <option value="已送出">已送出</option>
                      <option value="已核准">已核准</option>
                      <option value="已拒絕">已拒絕</option>
                    </Select>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Btn size="sm" icon={Paperclip} onClick={() => setAttachModal(q)}>附件{(q.attachments || []).length ? ` ${(q.attachments || []).length}` : ""}</Btn>
                      <Btn size="sm" icon={Download} onClick={() => downloadQuotePdf(q)}>下載PDF</Btn>
                      <Btn size="sm" icon={ArrowRight} onClick={() => convertToInvoice(q)}>轉發票</Btn>
                      <Btn size="sm" icon={Pencil} onClick={() => setModal({ mode: "edit", data: q })} />
                      <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除估價單 ${q.no} 嗎？`, () => persist.quotes(quotes.filter((x) => x.id !== q.id)))} />
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        ))
      )}

      {pickerOpen && (
        <Modal title="選擇估價方式" onClose={() => setPickerOpen(false)}>
          <TemplatePicker
            templates={quoteTemplates}
            onPick={useTemplate}
            onBlank={() => { setPickerOpen(false); setModal({ mode: "new", data: emptyQuote() }); }}
            onManage={() => { setPickerOpen(false); setTemplateManagerOpen(true); }}
          />
        </Modal>
      )}

      {modal && (
        <Modal title={modal.mode === "new" ? "新增估價單" : `編輯估價單 ${modal.data.no}`} onClose={() => setModal(null)} width={680}>
          <QuoteForm data={modal.data} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {templateManagerOpen && (
        <Modal title="估價單範本管理" onClose={() => setTemplateManagerOpen(false)} width={680}>
          <TemplateManager
            templates={quoteTemplates}
            onAdd={() => setTemplateModal({ mode: "new", data: emptyQuoteTemplate() })}
            onEdit={(t) => setTemplateModal({ mode: "edit", data: t })}
            onDelete={(t) => askDelete(`確定要刪除範本「${t.title || t.company}」嗎？`, () => persist.quoteTemplates(quoteTemplates.filter((x) => x.id !== t.id)))}
          />
        </Modal>
      )}

      {templateModal && (
        <Modal title={templateModal.mode === "new" ? "新增估價範本" : "編輯估價範本"} onClose={() => setTemplateModal(null)} width={680}>
          <QuoteTemplateForm data={templateModal.data} onSave={saveTemplate} onCancel={() => setTemplateModal(null)} />
        </Modal>
      )}

      {attachModal && (
        <Modal title={`附件 — 估價單 ${attachModal.no}`} onClose={() => setAttachModal(null)} width={640}>
          <QuoteAttachments
            quote={attachModal}
            askDelete={askDelete}
            onChange={(next) => {
              persist.quotes(quotes.map((x) => (x.id === attachModal.id ? next : x)));
              setAttachModal(next);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function QuoteAttachments({ quote, onChange, askDelete }) {
  const attachments = quote.attachments || [];
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null); // { name, url } | { name, loading: true }
  const fileInputRef = React.useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        uploaded.push(await uploadQuoteScan(quote.id, file));
      }
      onChange({ ...quote, attachments: [...attachments, ...uploaded] });
    } catch (err) {
      console.error(err);
      alert("圖片上傳失敗，請稍後再試一次。");
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async (att) => {
    setPreview({ name: att.name, loading: true });
    try {
      const url = await getQuoteScanUrl(att.path);
      setPreview({ name: att.name, url });
    } catch (err) {
      console.error(err);
      setPreview(null);
      alert("圖片預覽失敗，請稍後再試一次。");
    }
  };

  const downloadAttachment = async (att) => {
    try {
      const url = await getQuoteScanUrl(att.path);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = att.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
      alert("圖片下載失敗，請稍後再試一次。");
    }
  };

  const removeAttachment = (att) => {
    askDelete(`確定要刪除附件「${att.name}」嗎？`, async () => {
      try {
        await deleteQuoteScan(att.path);
      } catch (err) {
        console.error(err);
      }
      onChange({ ...quote, attachments: attachments.filter((a) => a.id !== att.id) });
    });
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} disabled={uploading} style={{ display: "none" }} />
      <Btn variant="brass" icon={uploading ? Loader2 : Upload} disabled={uploading} onClick={() => fileInputRef.current?.click()}>
        {uploading ? "上傳中…" : "上傳掃描圖片"}
      </Btn>

      {attachments.length === 0 ? (
        <div style={{ fontSize: 12.5, color: THEME.muted, marginTop: 14 }}>尚未上傳任何附件，開好的估價單掃描檔可以在這裡上傳保存。</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
          {attachments.map((att) => (
            <div key={att.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${THEME.line}` }}>
              <IconBadge icon={ImageIcon} tone="ink" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: THEME.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{att.name}</div>
                <div style={{ fontSize: 11, color: THEME.muted }}>{fmtDate(att.uploadedAt)}</div>
              </div>
              <Btn size="sm" icon={Eye} onClick={() => openPreview(att)}>預覽</Btn>
              <Btn size="sm" icon={Download} onClick={() => downloadAttachment(att)}>下載</Btn>
              <Btn size="sm" variant="danger" icon={Trash2} onClick={() => removeAttachment(att)} />
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(27,35,51,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }} onClick={() => setPreview(null)}>
          {preview.loading ? (
            <Loader2 color="#fff" size={28} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <img src={preview.url} alt={preview.name} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
}

function TemplatePicker({ templates, onPick, onBlank, onManage }) {
  return (
    <div>
      <p style={{ fontSize: 12.5, color: THEME.muted, margin: "0 0 16px" }}>
        點選一間公司的估價範本，會自動帶入預設品項與有效期限；也可以直接建立空白估價單。
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button onClick={onBlank}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `1px dashed ${THEME.line}`, background: "#FAFAF7", cursor: "pointer", textAlign: "left" }}>
          <IconBadge icon={FileText} tone="ink" />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text }}>空白估價單</div>
            <div style={{ fontSize: 11.5, color: THEME.muted }}>不套用任何範本，從頭開始填寫</div>
          </div>
        </button>
        {templates.length === 0 ? (
          <div style={{ fontSize: 12.5, color: THEME.muted, padding: "10px 4px" }}>
            尚未建立任何公司估價範本。
          </div>
        ) : templates.map((t) => (
          <button key={t.id} onClick={() => onPick(t)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `1px solid ${THEME.line}`, background: "#fff", cursor: "pointer", textAlign: "left" }}>
            <IconBadge icon={FileSignature} tone="brass" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text }}>{t.company}{t.title ? ` — ${t.title}` : ""}</div>
              <div style={{ fontSize: 11.5, color: THEME.muted }}>{(t.items || []).length} 個預設品項 · 有效期 {t.validDays} 天</div>
            </div>
            <ChevronRight size={16} color={THEME.muted} />
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn size="sm" icon={Plus} onClick={onManage}>新增／管理範本</Btn>
      </div>
    </div>
  );
}

function TemplateManager({ templates, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <Btn variant="brass" icon={Plus} onClick={onAdd}>新增範本</Btn>
      </div>
      {templates.length === 0 ? (
        <EmptyState icon={FileSignature} text="尚未建立任何估價範本，新增後即可在建立估價單時一鍵套用。" action={<Btn variant="brass" icon={Plus} onClick={onAdd}>新增第一個範本</Btn>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {templates.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `1px solid ${THEME.line}` }}>
              <IconBadge icon={FileSignature} tone="brass" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text }}>{t.company}{t.title ? ` — ${t.title}` : ""}</div>
                <div style={{ fontSize: 11.5, color: THEME.muted }}>{(t.items || []).length} 個預設品項 · 有效期 {t.validDays} 天 · 小計 {fmtMoney(sumItems(t.items))}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn size="sm" icon={Pencil} onClick={() => onEdit(t)} />
                <Btn size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(t)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LetterheadFields({ f, set, companyDropdown }) {
  const [companyChoice, setCompanyChoice] = useState(
    BILLING_COMPANY_OPTIONS.includes(f.companyName) ? f.companyName : (f.companyName ? "其他" : "")
  );
  useEffect(() => {
    if (!companyDropdown) return;
    setCompanyChoice(BILLING_COMPANY_OPTIONS.includes(f.companyName) ? f.companyName : (f.companyName ? "其他" : ""));
  }, [f.companyName, companyDropdown]);

  const onCompanyChoiceChange = (e) => {
    const val = e.target.value;
    setCompanyChoice(val);
    set("companyName")({ target: { value: val !== "其他" ? val : "" } });
  };

  return (
    <div style={{ border: `1px solid ${THEME.line}`, borderRadius: 10, padding: 14, marginBottom: 16, background: "#FAFAF7" }}>
      <div style={{ fontSize: 12, color: THEME.brassDeep, fontWeight: 700, marginBottom: 10 }}>{companyDropdown ? "開票公司抬頭資訊" : "報價廠商抬頭資訊"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {companyDropdown ? (
          <>
            <Field label="開票公司" span={companyChoice === "其他" ? 1 : 2}>
              <Select value={companyChoice} onChange={onCompanyChoiceChange}>
                <option value="">請選擇</option>
                {BILLING_COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </Field>
            {companyChoice === "其他" && (
              <Field label="自訂開票公司名稱"><TextInput value={f.companyName} onChange={set("companyName")} placeholder="輸入公司名稱" /></Field>
            )}
          </>
        ) : (
          <Field label="報價廠商名稱" span={2}><TextInput value={f.companyName} onChange={set("companyName")} placeholder="○○有限公司" /></Field>
        )}
        <Field label="文件標題" span={2}><TextInput value={f.docTitle} onChange={set("docTitle")} placeholder="估　　價　　單" /></Field>
        <Field label="統一編號"><TextInput value={f.taxId} onChange={set("taxId")} placeholder="12345678" /></Field>
        <Field label="負責人"><TextInput value={f.ownerName} onChange={set("ownerName")} placeholder="負責人姓名" /></Field>
        <Field label="地址" span={2}><TextInput value={f.address} onChange={set("address")} placeholder="公司地址" /></Field>
        <Field label="電話"><TextInput value={f.tel} onChange={set("tel")} placeholder="07-1234567" /></Field>
        <Field label="傳真"><TextInput value={f.fax} onChange={set("fax")} placeholder="07-1234568" /></Field>
        <Field label="專案聯絡人"><TextInput value={f.contactName} onChange={set("contactName")} placeholder="聯絡人姓名" /></Field>
        <Field label="聯絡電話"><TextInput value={f.contactPhone} onChange={set("contactPhone")} placeholder="0912-345-678" /></Field>
        <Field label="聯絡信箱" span={2}><TextInput value={f.contactEmail} onChange={set("contactEmail")} placeholder="name@company.com" /></Field>
      </div>
    </div>
  );
}

function QuoteTemplateForm({ data, onSave, onCancel }) {
  const [f, setF] = useState(data);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        <Field label="往來公司">
          <Select value={f.company} onChange={set("company")}>
            {VENDOR_COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </Field>
        <Field label="範本名稱（選填）"><TextInput value={f.title} onChange={set("title")} placeholder="如：標準除蟲方案" /></Field>
        <Field label="有效天數"><TextInput type="number" value={f.validDays} onChange={set("validDays")} /></Field>
      </div>
      <LetterheadFields f={f} set={set} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 16 }}>
        <Field label="預設付款方式">
          <Select value={f.paymentMethod} onChange={set("paymentMethod")}>
            <option value="">未設定</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
      </div>
      <LineItemsEditor items={f.items} setItems={(items) => setF({ ...f, items })} withTax={false} />
      <div style={{ marginTop: 16 }}>
        <Field label="預設備註"><TextArea value={f.note} onChange={set("note")} placeholder="套用範本時會自動帶入此備註" /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => onSave(f)}>儲存範本</Btn>
      </div>
    </div>
  );
}

function QuoteForm({ data, onSave, onCancel }) {
  const [f, setF] = useState(data);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <Field label="報價單位（客戶）"><TextInput value={f.client} onChange={set("client")} placeholder="客戶 / 公司名稱" /></Field>
        <Field label="工作名稱"><TextInput value={f.workName} onChange={set("workName")} placeholder="專案 / 工作名稱" /></Field>
        <Field label="報價日期"><TextInput type="date" value={f.date} onChange={set("date")} /></Field>
        <Field label="有效期限"><TextInput type="date" value={f.validUntil} onChange={set("validUntil")} /></Field>
        <Field label="付款方式">
          <Select value={f.paymentMethod} onChange={set("paymentMethod")}>
            <option value="">未設定</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="備註"><TextInput value={f.note} onChange={set("note")} placeholder="選填" /></Field>
      </div>
      <LetterheadFields f={f} set={set} />
      <LineItemsEditor items={f.items} setItems={(items) => setF({ ...f, items })} withTax={false} />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.client && onSave(f)} disabled={!f.client}>儲存</Btn>
      </div>
    </div>
  );
}

const emptyInvoice = () => ({
  no: "", quoteNo: "", client: "", workName: "", paymentMethod: "", date: todayStr(), dueDate: "",
  items: [{ id: uid(), desc: "", unit: "", qty: 1, price: 0, note: "" }],
  taxRate: 5, status: "未付款", note: "", posted: false, addedToBankDeposit: false, ...emptyLetterhead(),
});

function InvoicesView({ ctx }) {
  const { invoices, quotes, billing, persist, addAccountingEntry, askDelete } = ctx;
  const [modal, setModal] = useState(null);
  const [companyFilter, setCompanyFilter] = useState("全部");
  const [month, setMonth] = useState(monthStr());
  const [checkedIds, setCheckedIds] = useState(new Set());

  const KNOWN_COMPANIES = BILLING_COMPANY_OPTIONS.filter((o) => o !== "其他");
  const companyTabs = ["全部", ...KNOWN_COMPANIES, "其他"];
  const filtered = invoices.filter((inv) => {
    if (month && !(inv.date || "").startsWith(month)) return false;
    if (companyFilter === "全部") return true;
    if (companyFilter === "其他") return !KNOWN_COMPANIES.includes(inv.companyName);
    return inv.companyName === companyFilter;
  });

  const save = (data) => {
    const total = sumItems(data.items) * (1 + Number(data.taxRate) / 100);
    if (data.id) {
      persist.invoices(invoices.map((q) => (q.id === data.id ? { ...data, total } : q)));
    } else {
      persist.invoices([{ ...data, id: uid(), total, createdBy: actorName(ctx), createdAt: new Date().toISOString() }, ...invoices]);
    }
    setModal(null);
  };

  const setStatus = (inv, status) => {
    const total = inv.total ?? sumItems(inv.items) * (1 + Number(inv.taxRate) / 100);
    persist.invoices(invoices.map((x) => x.id === inv.id ? { ...x, status, posted: status === "已付款" } : x));
    if (status === "已付款" && !inv.posted) {
      addAccountingEntry({ type: "收入", category: "發票收款", amount: total, desc: `發票 ${inv.no} — ${inv.client}` });
    }
  };

  const setDueDate = (inv, dueDate) => {
    const total = inv.total ?? sumItems(inv.items) * (1 + Number(inv.taxRate) / 100);
    persist.invoices(invoices.map((x) => x.id === inv.id ? { ...x, dueDate, status: "已付款", posted: true } : x));
    if (!inv.posted) {
      addAccountingEntry({ type: "收入", category: "發票收款", amount: total, desc: `發票 ${inv.no} — ${inv.client}` });
    }
  };

  const toggleChecked = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addSelectedToBankDeposits = () => {
    const selected = invoices.filter((inv) => checkedIds.has(inv.id));
    if (!selected.length) return;
    const year = new Date().getFullYear();
    const existingCount = billing.filter((b) => (b.no || "").startsWith(`BD-${year}`)).length;
    const entries = selected.map((inv, i) => {
      const total = inv.total ?? sumItems(inv.items) * (1 + Number(inv.taxRate) / 100);
      const no = `BD-${year}-${String(existingCount + i + 1).padStart(3, "0")}`;
      return {
        id: uid(), no, expenseType: "銀行入帳", date: todayStr(), source: `發票 ${inv.no} — ${inv.client}`,
        amount: total, note: "", companyName: inv.companyName || "", posted: true,
        createdBy: actorName(ctx), createdAt: new Date().toISOString(),
      };
    });
    persist.billing([...entries, ...billing]);
    entries.forEach((entry) => {
      addAccountingEntry({ type: "收入", category: "銀行入帳", amount: entry.amount, desc: `銀行入帳 — ${entry.source}`, date: entry.date });
    });
    persist.invoices(invoices.map((inv) => checkedIds.has(inv.id) ? { ...inv, addedToBankDeposit: true } : inv));
    setCheckedIds(new Set());
  };

  return (
    <div>
      <SectionHeader eyebrow="INVOICE · 06" title="發票"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn icon={Landmark} disabled={checkedIds.size === 0} onClick={addSelectedToBankDeposits}>新增至銀行入帳紀錄{checkedIds.size ? `（${checkedIds.size}）` : ""}</Btn>
            <Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: { ...emptyInvoice(), no: nextNo("INV", invoices) } })}>開立發票</Btn>
          </div>
        } />

      {invoices.length > 0 && (
        <>
          <MonthFilterBar month={month} setMonth={setMonth} label="開立日期月份" />
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {companyTabs.map((c) => (
              <button key={c} onClick={() => setCompanyFilter(c)}
                style={{
                  padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${companyFilter === c ? THEME.brass : THEME.line}`,
                  background: companyFilter === c ? THEME.brass : "#fff",
                  color: companyFilter === c ? "#fff" : THEME.text,
                }}>{c}</button>
            ))}
          </div>
        </>
      )}

      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} text="尚未開立任何發票。" action={<Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: { ...emptyInvoice(), no: nextNo("INV", invoices) } })}>開立第一張發票</Btn>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} text="這個篩選條件下沒有發票。" />
      ) : (
        <Table columns={["發票號碼", "開票公司", "估價單號碼", "客戶", "含稅金額", "開立日", "入帳日", "等待天數", "狀態", "選取", ""]}>
          {filtered.map((inv) => {
            const total = inv.total ?? sumItems(inv.items) * (1 + Number(inv.taxRate) / 100);
            const waitDays = inv.date && inv.dueDate ? Math.round((new Date(inv.dueDate) - new Date(inv.date)) / (1000 * 60 * 60 * 24)) : null;
            return (
              <tr key={inv.id}>
                <td style={{ ...td, fontFamily: FONT_NUM }}>{inv.no}</td>
                <td style={td}>{inv.companyName ? <StatusBadge status={KNOWN_COMPANIES.includes(inv.companyName) ? inv.companyName : "其他"} /> : "—"}</td>
                <td style={{ ...td, fontFamily: FONT_NUM, color: THEME.muted }}>{inv.quoteNo || "—"}</td>
                <td style={td}><strong>{inv.client}</strong></td>
                <td style={{ ...td, fontFamily: FONT_NUM, fontWeight: 700 }}>{fmtMoney(total)}</td>
                <td style={td}>{fmtDate(inv.date)}</td>
                <td style={td}>
                  <DatePickerButton value={inv.dueDate} onChange={(v) => setDueDate(inv, v)} />
                </td>
                <td style={{ ...td, fontFamily: FONT_NUM }}>{waitDays !== null ? `${waitDays} 天` : "—"}</td>
                <td style={td}>
                  <Select value={inv.status} onChange={(e) => setStatus(inv, e.target.value)} style={{ padding: "4px 8px", fontSize: 12 }}>
                    <option value="未付款">未付款</option>
                    <option value="已付款">已付款</option>
                    <option value="逾期">逾期</option>
                    <option value="已作廢">已作廢</option>
                  </Select>
                </td>
                <td style={{ ...td, textAlign: "center" }}>
                  <input type="checkbox" checked={inv.addedToBankDeposit || checkedIds.has(inv.id)} disabled={inv.addedToBankDeposit} onChange={() => toggleChecked(inv.id)}
                    style={{ width: 16, height: 16, cursor: inv.addedToBankDeposit ? "not-allowed" : "pointer" }}
                    title={inv.addedToBankDeposit ? "已新增至銀行入帳紀錄" : undefined} />
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <Btn size="sm" icon={Pencil} onClick={() => setModal({ mode: "edit", data: inv })} />
                    <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除發票 ${inv.no} 嗎？`, () => persist.invoices(invoices.filter((x) => x.id !== inv.id)))} />
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {modal && (
        <Modal title={modal.mode === "new" ? "開立發票" : `編輯發票 ${modal.data.no}`} onClose={() => setModal(null)} width={680}>
          <InvoiceForm data={modal.data} quotes={quotes} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function InvoiceForm({ data, quotes, onSave, onCancel }) {
  const [f, setF] = useState({ ...emptyLetterhead(), workName: "", paymentMethod: "", quoteNo: "", ...data });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const importFromQuote = (e) => {
    const no = e.target.value;
    if (!no) { setF({ ...f, quoteNo: "" }); return; }
    const q = (quotes || []).find((x) => x.no === no);
    if (!q) return;
    const letterhead = Object.fromEntries(LETTERHEAD_FIELDS.map((k) => [k, q[k] || ""]));
    setF({
      ...f, ...letterhead, quoteNo: q.no, client: q.client, workName: q.workName || "",
      paymentMethod: q.paymentMethod || f.paymentMethod,
      items: (q.items || []).map((it) => ({ ...it, id: uid() })),
      note: f.note || `轉自估價單 ${q.no}`,
    });
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <Field label="發票號碼"><TextInput value={f.no} onChange={set("no")} placeholder="請輸入發票號碼" /></Field>
        <Field label="匯入估價單（選填）">
          <Select value={f.quoteNo} onChange={importFromQuote}>
            <option value="">不匯入</option>
            {(quotes || []).map((q) => <option key={q.id} value={q.no}>{q.no} — {q.client}</option>)}
          </Select>
        </Field>
        <Field label="客戶名稱"><TextInput value={f.client} onChange={set("client")} placeholder="客戶 / 公司名稱" /></Field>
        <Field label="工作名稱"><TextInput value={f.workName} onChange={set("workName")} placeholder="專案 / 工作名稱" /></Field>
        <Field label="開立日期"><TextInput type="date" value={f.date} onChange={set("date")} /></Field>
        <Field label="付款方式">
          <Select value={f.paymentMethod} onChange={set("paymentMethod")}>
            <option value="">未設定</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="備註"><TextInput value={f.note} onChange={set("note")} placeholder="選填" /></Field>
      </div>
      <LetterheadFields f={f} set={set} companyDropdown />
      <LineItemsEditor items={f.items} setItems={(items) => setF({ ...f, items })} withTax taxRate={f.taxRate} setTaxRate={(v) => setF({ ...f, taxRate: v })} />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.client && f.no && onSave(f)} disabled={!f.client || !f.no}>儲存</Btn>
      </div>
    </div>
  );
}

/* =========================================================
   ATTENDANCE
========================================================= */
function AttendanceView({ ctx }) {
  const { employees, attendance, persist, now, isAdmin, currentUser, companyLocation } = ctx;
  const activeEmployees = employees.filter((e) => e.status === "在職");
  const myEmployeeId = currentUser?.employeeId || "";
  const restricted = !isAdmin;

  const [empId, setEmpId] = useState(restricted ? myEmployeeId : "");
  useEffect(() => {
    if (restricted) setEmpId(myEmployeeId);
  }, [restricted, myEmployeeId]);

  const today = todayStr();
  const todayRowsAll = attendance.filter((a) => a.date === today);
  const todayRows = restricted ? todayRowsAll.filter((a) => a.employeeId === myEmployeeId) : todayRowsAll;

  const doClockIn = () => {
    if (!empId) return;
    const existing = todayRowsAll.find((a) => a.employeeId === empId);
    const time = now.toLocaleTimeString("zh-TW", { hour12: false });
    if (existing) {
      persist.attendance(attendance.map((a) => a.id === existing.id ? { ...a, clockIn: a.clockIn || time } : a));
    } else {
      persist.attendance([{ id: uid(), employeeId: empId, date: today, clockIn: time, clockOut: "" }, ...attendance]);
    }
  };
  const doClockOut = () => {
    if (!empId) return;
    const existing = todayRowsAll.find((a) => a.employeeId === empId);
    const time = now.toLocaleTimeString("zh-TW", { hour12: false });
    if (existing) {
      persist.attendance(attendance.map((a) => a.id === existing.id ? { ...a, clockOut: time } : a));
    } else {
      persist.attendance([{ id: uid(), employeeId: empId, date: today, clockIn: "", clockOut: time }, ...attendance]);
    }
  };
  const clockIn = doClockIn;
  const clockOut = doClockOut;

  const useCurrentLocationAsCompany = () => {
    if (!navigator.geolocation) { alert("您的裝置不支援定位功能。"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => persist.companyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("無法取得目前位置，請確認已開啟定位權限。"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const empName = (id) => employees.find((e) => e.id === id)?.name || "（已刪除員工）";
  const hoursWorked = (a) => {
    if (!a.clockIn || !a.clockOut) return "—";
    const [h1, m1] = a.clockIn.split(":").map(Number);
    const [h2, m2] = a.clockOut.split(":").map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins < 0) return "—";
    return (mins / 60).toFixed(1) + " 小時";
  };

  const selfRecord = todayRowsAll.find((a) => a.employeeId === empId);

  const [month, setMonth] = useState(monthStr());
  const [empFilter, setEmpFilter] = useState("全部");
  const monthRowsAll = attendance.filter((a) => (a.date || "").startsWith(month));
  const monthEmpIds = Array.from(new Set(monthRowsAll.map((a) => a.employeeId)));
  const monthRows = (restricted
    ? monthRowsAll.filter((a) => a.employeeId === myEmployeeId)
    : monthRowsAll.filter((a) => empFilter === "全部" || a.employeeId === empFilter))
    .slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  if (restricted && !myEmployeeId) {
    return (
      <div>
        <SectionHeader eyebrow="ATTENDANCE · 07" title="打卡上下班" />
        <div style={{ background: THEME.warnSoft, border: `1px solid #E9D8AE`, borderRadius: 10, padding: "14px 18px", fontSize: 13, color: THEME.warn, display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={16} />
          您目前的帳號尚未綁定員工資料，請聯絡管理員到「權限設定」→「系統帳號」設定綁定的員工後才能打卡。
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader eyebrow="ATTENDANCE · 07" title="打卡上下班" />

      <div style={{ background: THEME.surface, border: `1px solid ${THEME.line}`, borderRadius: 12, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text, marginBottom: 6 }}>打卡地點限制</div>
        <div style={{ fontSize: 12, color: THEME.muted, marginBottom: 10 }}>
          設定公司座標後，管理員以下所有人員只能在公司 {CLOCK_RADIUS_M} 公尺範圍內打卡。
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {companyLocation && (
            <span style={{ fontSize: 12, color: THEME.muted, fontFamily: FONT_NUM }}>
              目前座標：{companyLocation.lat.toFixed(6)}, {companyLocation.lng.toFixed(6)}
            </span>
          )}
          <Btn size="sm" icon={MapPin} onClick={useCurrentLocationAsCompany}>使用目前位置</Btn>
        </div>
      </div>

      <div style={{ background: THEME.ink, borderRadius: 14, padding: "28px 30px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: "#9BA2B5", letterSpacing: 1, marginBottom: 6 }}>打卡鐘 · PUNCH CLOCK</div>
          <div style={{ fontFamily: FONT_NUM, fontSize: 40, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
            {now.toLocaleTimeString("zh-TW", { hour12: false })}
          </div>
          <div style={{ fontSize: 13, color: "#C7CBD9", marginTop: 4 }}>{today}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 260 }}>
          {restricted ? (
            <div style={{ background: "#fff", borderRadius: 7, padding: "9px 12px", fontSize: 13.5, fontWeight: 700, color: THEME.text }}>
              {empName(myEmployeeId)}
            </div>
          ) : (
            <Select value={empId} onChange={(e) => setEmpId(e.target.value)} style={{ background: "#fff" }}>
              <option value="">選擇員工…</option>
              {activeEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}（{e.dept || "未設部門"}）</option>)}
            </Select>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="success" icon={LogIn} onClick={clockIn} disabled={!empId || (selfRecord && selfRecord.clockIn)}>上班打卡</Btn>
            <Btn variant="danger" icon={LogOut} onClick={clockOut} disabled={!empId || !selfRecord || !selfRecord.clockIn || selfRecord.clockOut}>下班打卡</Btn>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 14.5, fontWeight: 700, color: THEME.text, marginBottom: 12 }}>{restricted ? "我的今日出勤紀錄" : "今日出勤紀錄"}</h3>
      {todayRows.length === 0 ? (
        <EmptyState icon={Clock} text="今日尚無打卡紀錄。" />
      ) : (
        <Table columns={["員工", "上班時間", "下班時間", "工時", ""]}>
          {todayRows.map((a) => (
            <tr key={a.id}>
              <td style={td}><strong>{empName(a.employeeId)}</strong></td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{a.clockIn || "—"}</td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{a.clockOut || "—"}</td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{hoursWorked(a)}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {!restricted && <Btn size="sm" variant="danger" icon={Trash2} onClick={() => ctx.askDelete("確定要刪除此筆打卡紀錄嗎？", () => persist.attendance(attendance.filter((x) => x.id !== a.id)))} />}
              </td>
            </tr>
          ))}
        </Table>
      )}

      <h3 style={{ fontSize: 14.5, fontWeight: 700, color: THEME.text, margin: "30px 0 12px" }}>{restricted ? "我的月份出勤紀錄" : "月份出勤紀錄"}</h3>
      <MonthFilterBar month={month} setMonth={setMonth} label="出勤月份" />
      {!restricted && monthEmpIds.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setEmpFilter("全部")}
            style={{
              padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${empFilter === "全部" ? THEME.brass : THEME.line}`,
              background: empFilter === "全部" ? THEME.brass : "#fff",
              color: empFilter === "全部" ? "#fff" : THEME.text,
            }}>全部</button>
          {monthEmpIds.map((id) => (
            <button key={id} onClick={() => setEmpFilter(id)}
              style={{
                padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${empFilter === id ? THEME.brass : THEME.line}`,
                background: empFilter === id ? THEME.brass : "#fff",
                color: empFilter === id ? "#fff" : THEME.text,
              }}>{empName(id)}</button>
          ))}
        </div>
      )}
      {monthRows.length === 0 ? (
        <EmptyState icon={Clock} text="這個月份沒有打卡紀錄。" />
      ) : (
        <Table columns={["日期", "員工", "上班時間", "下班時間", "工時", ""]}>
          {monthRows.map((a) => (
            <tr key={a.id}>
              <td style={td}>{fmtDate(a.date)}</td>
              <td style={td}><strong>{empName(a.employeeId)}</strong></td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{a.clockIn || "—"}</td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{a.clockOut || "—"}</td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{hoursWorked(a)}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {!restricted && <Btn size="sm" variant="danger" icon={Trash2} onClick={() => ctx.askDelete("確定要刪除此筆打卡紀錄嗎？", () => persist.attendance(attendance.filter((x) => x.id !== a.id)))} />}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/* =========================================================
   COMPANY EXPENSES (公司支出) — 零用金紀錄 / 公司付款
========================================================= */
const emptyPettyCash = () => ({ expenseType: "零用金", date: todayStr(), item: "", amount: "", handler: "", note: "" });
const emptyCompanyPayment = () => ({ expenseType: "公司付款", vendor: "", category: "", amount: "", date: todayStr(), plannedPaymentDate: "", status: "未付款", note: "", posted: false, companyName: "", paymentDate: "" });
const emptyBankDeposit = () => ({ expenseType: "銀行入帳", date: todayStr(), source: "", amount: "", note: "", companyName: "" });

function BillingView({ ctx }) {
  const { billing, persist, addAccountingEntry, askDelete } = ctx;
  const [expenseTab, setExpenseTab] = useState("銀行入帳");
  const [modal, setModal] = useState(null);
  const [month, setMonth] = useState(monthStr());
  const [companyFilter, setCompanyFilter] = useState("全部");

  const KNOWN_COMPANIES = BILLING_COMPANY_OPTIONS.filter((o) => o !== "其他");
  const companyTabs = ["全部", ...KNOWN_COMPANIES, "其他"];

  // backward-compatible classification: pre-existing 請款 records have no expenseType but do have a `vendor` field
  const expenseKind = (b) => b.expenseType === "零用金" ? "零用金" : b.expenseType === "銀行入帳" ? "銀行入帳" : b.expenseType === "公司付款" ? "公司付款" : (b.vendor !== undefined ? "公司付款" : "零用金");
  const pettyCash = billing.filter((b) => expenseKind(b) === "零用金");
  const companyPayments = billing.filter((b) => expenseKind(b) === "公司付款");
  const bankDeposits = billing.filter((b) => expenseKind(b) === "銀行入帳");
  const list = expenseTab === "零用金" ? pettyCash : expenseTab === "銀行入帳" ? bankDeposits : companyPayments;
  const filtered = list.filter((b) => {
    if (month && !(b.date || "").startsWith(month)) return false;
    if ((expenseTab === "公司付款" || expenseTab === "銀行入帳") && companyFilter !== "全部") {
      if (companyFilter === "其他") return !KNOWN_COMPANIES.includes(b.companyName);
      return b.companyName === companyFilter;
    }
    return true;
  });

  const savePettyCash = (data) => {
    if (data.id) {
      persist.billing(billing.map((b) => (b.id === data.id ? data : b)));
    } else {
      const no = nextNo("PC", pettyCash);
      const entry = { ...data, id: uid(), no, posted: true, createdBy: actorName(ctx), createdAt: new Date().toISOString() };
      persist.billing([entry, ...billing]);
      addAccountingEntry({ type: "支出", category: "零用金", amount: entry.amount, desc: `零用金 — ${entry.item}`, date: entry.date });
    }
    setModal(null);
  };

  const saveCompanyPayment = (data) => {
    if (data.id) {
      persist.billing(billing.map((b) => (b.id === data.id ? data : b)));
    } else {
      const no = nextNo("PR", companyPayments);
      persist.billing([{ ...data, id: uid(), no, createdBy: actorName(ctx), createdAt: new Date().toISOString() }, ...billing]);
    }
    setModal(null);
  };

  const saveBankDeposit = (data) => {
    if (data.id) {
      persist.billing(billing.map((b) => (b.id === data.id ? data : b)));
    } else {
      const no = nextNo("BD", bankDeposits);
      const entry = { ...data, id: uid(), no, posted: true, createdBy: actorName(ctx), createdAt: new Date().toISOString() };
      persist.billing([entry, ...billing]);
      addAccountingEntry({ type: "收入", category: "銀行入帳", amount: entry.amount, desc: `銀行入帳 — ${entry.source}`, date: entry.date });
    }
    setModal(null);
  };

  const setStatus = (b, status) => {
    persist.billing(billing.map((x) => x.id === b.id ? { ...x, status, posted: status === "已付款" } : x));
    if (status === "已付款" && !b.posted) {
      addAccountingEntry({ type: "支出", category: b.category || "公司付款", amount: b.amount, desc: `公司付款 ${b.no} — ${b.vendor}` });
    }
  };

  const setPaymentDate = (b, paymentDate) => {
    persist.billing(billing.map((x) => x.id === b.id ? { ...x, paymentDate, status: "已付款", posted: true } : x));
    if (!b.posted) {
      addAccountingEntry({ type: "支出", category: b.category || "公司付款", amount: b.amount, desc: `公司付款 ${b.no} — ${b.vendor}` });
    }
  };

  const pendingTotal = companyPayments.filter((b) => b.status !== "已付款").reduce((s, b) => s + Number(b.amount || 0), 0);
  const pettyCashTotal = pettyCash.reduce((s, b) => s + Number(b.amount || 0), 0);
  const pettyCashMonthTotal = pettyCash.filter((b) => (b.date || "").startsWith(monthStr())).reduce((s, b) => s + Number(b.amount || 0), 0);
  const bankDepositTotal = bankDeposits.reduce((s, b) => s + Number(b.amount || 0), 0);
  const bankDepositMonthTotal = bankDeposits.filter((b) => (b.date || "").startsWith(monthStr())).reduce((s, b) => s + Number(b.amount || 0), 0);

  const openNew = () => {
    if (expenseTab === "零用金") setModal({ mode: "new", data: emptyPettyCash() });
    else if (expenseTab === "銀行入帳") setModal({ mode: "new", data: emptyBankDeposit() });
    else setModal({ mode: "new", data: emptyCompanyPayment() });
  };

  const newLabel = expenseTab === "零用金" ? "新增零用金紀錄" : expenseTab === "銀行入帳" ? "新增銀行入帳紀錄" : "新增公司應付款項";
  const emptyIcon = expenseTab === "零用金" ? Wallet : expenseTab === "銀行入帳" ? Landmark : HandCoins;

  const soon = new Date(); soon.setDate(soon.getDate() + 5);
  const isDueSoon = (d) => d && new Date(d) <= soon && new Date(d) >= new Date();
  const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  const duePayments = companyPayments.filter((b) => b.status !== "已付款" && isDueSoon(b.plannedPaymentDate));

  return (
    <div>
      <SectionHeader eyebrow="EXPENSE MANAGEMENT · 08" title="收支管理"
        action={<Btn variant="brass" icon={Plus} onClick={openNew}>{newLabel}</Btn>} />

      {duePayments.length > 0 && (
        <div style={{ background: THEME.warnSoft, border: `1px solid #E9D8AE`, borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={14} color={THEME.warn} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: THEME.warn, lineHeight: 1.8 }}>
            <strong>{duePayments.length} 筆公司應付款項將於 5 天內到期：</strong>
            {duePayments.map((b) => (
              <div key={b.id}>{b.vendor}（{fmtMoney(b.amount)}）— 剩 {daysUntil(b.plannedPaymentDate)} 天</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {[{ key: "銀行入帳", label: "銀行入帳紀錄", icon: Landmark }, { key: "公司付款", label: "公司應付款項", icon: HandCoins }, { key: "零用金", label: "零用金紀錄", icon: Wallet }].map((t) => (
          <button key={t.key} onClick={() => setExpenseTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${expenseTab === t.key ? THEME.brass : THEME.line}`,
              background: expenseTab === t.key ? THEME.brass : "#fff",
              color: expenseTab === t.key ? "#fff" : THEME.text,
            }}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {expenseTab === "零用金" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
          <StatCard label="本月零用金支出" value={fmtMoney(pettyCashMonthTotal)} icon={Wallet} tone="brass" />
          <StatCard label="累計零用金支出" value={fmtMoney(pettyCashTotal)} icon={Landmark} tone="ink" />
          <StatCard label="紀錄筆數" value={pettyCash.length} icon={Check} tone="success" />
        </div>
      ) : expenseTab === "銀行入帳" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
          <StatCard label="本月入帳金額" value={fmtMoney(bankDepositMonthTotal)} icon={Landmark} tone="brass" />
          <StatCard label="累計入帳金額" value={fmtMoney(bankDepositTotal)} icon={TrendingUp} tone="success" />
          <StatCard label="紀錄筆數" value={bankDeposits.length} icon={Check} tone="ink" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
          <StatCard label="公司應付款項總數" value={companyPayments.length} icon={HandCoins} tone="ink" />
          <StatCard label="未付款金額" value={fmtMoney(pendingTotal)} icon={AlertCircle} tone="warn" />
          <StatCard label="已付款件數" value={companyPayments.filter((b) => b.status === "已付款").length} icon={Check} tone="success" />
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState icon={emptyIcon} text={`尚未建立任何${expenseTab === "零用金" ? "零用金紀錄" : expenseTab === "銀行入帳" ? "銀行入帳紀錄" : "公司應付款項"}。`} action={<Btn variant="brass" icon={Plus} onClick={openNew}>{newLabel}</Btn>} />
      ) : (
        <>
          <MonthFilterBar month={month} setMonth={setMonth} label="日期月份" />
          {(expenseTab === "公司付款" || expenseTab === "銀行入帳") && (
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {companyTabs.map((c) => (
                <button key={c} onClick={() => setCompanyFilter(c)}
                  style={{
                    padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${companyFilter === c ? THEME.brass : THEME.line}`,
                    background: companyFilter === c ? THEME.brass : "#fff",
                    color: companyFilter === c ? "#fff" : THEME.text,
                  }}>{c}</button>
              ))}
            </div>
          )}
          {filtered.length === 0 ? (
            <EmptyState icon={emptyIcon} text="這個月份沒有紀錄。" />
          ) : expenseTab === "零用金" ? (
            <Table columns={["單號", "日期", "項目／用途", "金額", "經手人", "備註", ""]}>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td style={{ ...td, fontFamily: FONT_NUM }}>{b.no}</td>
                  <td style={td}>{fmtDate(b.date)}</td>
                  <td style={td}><strong>{b.item}</strong></td>
                  <td style={{ ...td, fontFamily: FONT_NUM, fontWeight: 700 }}>{fmtMoney(b.amount)}</td>
                  <td style={td}>{b.handler || "—"}</td>
                  <td style={td}>{b.note || "—"}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Btn size="sm" icon={Pencil} onClick={() => setModal({ mode: "edit", data: b })} />
                      <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除這筆零用金紀錄嗎？`, () => persist.billing(billing.filter((x) => x.id !== b.id)))} />
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          ) : expenseTab === "銀行入帳" ? (
            <Table columns={["單號", "日期", "來源／說明", "金額", "入帳公司", "備註", ""]}>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td style={{ ...td, fontFamily: FONT_NUM }}>{b.no}</td>
                  <td style={td}>{fmtDate(b.date)}</td>
                  <td style={td}><strong>{b.source}</strong></td>
                  <td style={{ ...td, fontFamily: FONT_NUM, fontWeight: 700, color: THEME.success }}>{fmtMoney(b.amount)}</td>
                  <td style={td}>{b.companyName ? <StatusBadge status={KNOWN_COMPANIES.includes(b.companyName) ? b.companyName : "其他"} /> : "—"}</td>
                  <td style={td}>{b.note || "—"}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Btn size="sm" icon={Pencil} onClick={() => setModal({ mode: "edit", data: b })} />
                      <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除這筆銀行入帳紀錄嗎？`, () => persist.billing(billing.filter((x) => x.id !== b.id)))} />
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Table columns={["單號", "廠商／申請人", "項目類別", "申請日期", "預訂付款日", "金額", "付款公司", "付款日", "狀態", ""]}>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td style={{ ...td, fontFamily: FONT_NUM }}>{b.no}</td>
                  <td style={td}><strong>{b.vendor}</strong></td>
                  <td style={td}>{b.category || "—"}</td>
                  <td style={td}>{fmtDate(b.date)}</td>
                  <td style={td}>{b.plannedPaymentDate ? fmtDate(b.plannedPaymentDate) : "—"}</td>
                  <td style={{ ...td, fontFamily: FONT_NUM, fontWeight: 700 }}>{fmtMoney(b.amount)}</td>
                  <td style={td}>{b.companyName ? <StatusBadge status={KNOWN_COMPANIES.includes(b.companyName) ? b.companyName : "其他"} /> : "—"}</td>
                  <td style={td}>
                    <DatePickerButton value={b.paymentDate} onChange={(v) => setPaymentDate(b, v)} />
                  </td>
                  <td style={td}>
                    <Select value={b.status} onChange={(e) => setStatus(b, e.target.value)} style={{ padding: "4px 8px", fontSize: 12 }}>
                      <option value="未付款">未付款</option>
                      <option value="已付款">已付款</option>
                    </Select>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Btn size="sm" icon={Pencil} onClick={() => setModal({ mode: "edit", data: b })} />
                      <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除公司應付款項 ${b.no} 嗎？`, () => persist.billing(billing.filter((x) => x.id !== b.id)))} />
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}

      {modal && (
        <Modal title={
          modal.mode === "new"
            ? newLabel
            : (expenseKind(modal.data) === "公司付款" ? `編輯公司應付款項 ${modal.data.no}` : expenseKind(modal.data) === "銀行入帳" ? `編輯銀行入帳紀錄 ${modal.data.no}` : `編輯零用金紀錄 ${modal.data.no}`)
        } onClose={() => setModal(null)}>
          {expenseKind(modal.data) === "公司付款"
            ? <CompanyPaymentForm data={modal.data} onSave={saveCompanyPayment} onCancel={() => setModal(null)} />
            : expenseKind(modal.data) === "銀行入帳"
            ? <BankDepositForm data={modal.data} onSave={saveBankDeposit} onCancel={() => setModal(null)} />
            : <PettyCashForm data={modal.data} onSave={savePettyCash} onCancel={() => setModal(null)} />
          }
        </Modal>
      )}
    </div>
  );
}

function PettyCashForm({ data, onSave, onCancel }) {
  const [f, setF] = useState(data);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="項目／用途" span={2}><TextInput value={f.item} onChange={set("item")} placeholder="如：飲水機濾心、計程車資" /></Field>
      <Field label="金額"><TextInput type="number" value={f.amount} onChange={set("amount")} placeholder="0" /></Field>
      <Field label="日期"><TextInput type="date" value={f.date} onChange={set("date")} /></Field>
      <Field label="經手人" span={2}><TextInput value={f.handler} onChange={set("handler")} placeholder="經手人姓名" /></Field>
      <Field label="備註" span={2}><TextArea value={f.note} onChange={set("note")} placeholder="選填" /></Field>
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.item && f.amount && onSave(f)} disabled={!f.item || !f.amount}>儲存</Btn>
      </div>
    </div>
  );
}

function BankDepositForm({ data, onSave, onCancel }) {
  const [f, setF] = useState({ companyName: "", ...data });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="來源／說明" span={2}><TextInput value={f.source} onChange={set("source")} placeholder="如：客戶匯款、銀行利息" /></Field>
      <Field label="入帳公司">
        <Select value={f.companyName} onChange={set("companyName")}>
          <option value="">請選擇</option>
          {BILLING_COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
      </Field>
      <Field label="金額"><TextInput type="number" value={f.amount} onChange={set("amount")} placeholder="0" /></Field>
      <Field label="日期"><TextInput type="date" value={f.date} onChange={set("date")} /></Field>
      <Field label="備註" span={2}><TextArea value={f.note} onChange={set("note")} placeholder="選填" /></Field>
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.source && f.amount && onSave(f)} disabled={!f.source || !f.amount}>儲存</Btn>
      </div>
    </div>
  );
}

function CompanyPaymentForm({ data, onSave, onCancel }) {
  const [f, setF] = useState({ plannedPaymentDate: "", companyName: "", ...data });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="廠商／申請人" span={2}><TextInput value={f.vendor} onChange={set("vendor")} placeholder="廠商名稱或申請人" /></Field>
      <Field label="項目類別"><TextInput value={f.category} onChange={set("category")} placeholder="如：辦公用品、差旅費" /></Field>
      <Field label="付款公司">
        <Select value={f.companyName} onChange={set("companyName")}>
          <option value="">請選擇</option>
          {BILLING_COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
      </Field>
      <Field label="金額"><TextInput type="number" value={f.amount} onChange={set("amount")} placeholder="0" /></Field>
      <Field label="申請日期"><TextInput type="date" value={f.date} onChange={set("date")} /></Field>
      <Field label="預訂付款日"><TextInput type="date" value={f.plannedPaymentDate} onChange={set("plannedPaymentDate")} /></Field>
      <Field label="狀態" span={2}>
        <Select value={f.status} onChange={set("status")}>
          <option value="未付款">未付款</option>
          <option value="已付款">已付款</option>
        </Select>
      </Field>
      <Field label="備註說明" span={2}><TextArea value={f.note} onChange={set("note")} placeholder="說明付款事由" /></Field>
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.vendor && f.amount && onSave(f)} disabled={!f.vendor || !f.amount}>儲存</Btn>
      </div>
    </div>
  );
}

/* =========================================================
   ACCOUNTING (帳務入口)
========================================================= */
const emptyAccounting = () => ({ type: "收入", category: "", amount: "", date: todayStr(), desc: "" });

function AccountingView({ ctx }) {
  const { accounting, persist, askDelete } = ctx;
  const [modal, setModal] = useState(null);
  const [month, setMonth] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");

  const save = (data) => {
    persist.accounting([{ ...data, id: uid(), createdAt: new Date().toISOString() }, ...accounting]);
    setModal(null);
  };

  const filtered = accounting.filter((a) => {
    if (month && !(a.date || "").startsWith(month)) return false;
    if (typeFilter !== "全部" && a.type !== typeFilter) return false;
    return true;
  });

  // 依「新增／更新的時間」排序，而不是紀錄本身的交易日期——
  // 交易日期可能是使用者自己填的過去日期（如零用金補登），
  // 用交易日期排序會讓剛新增的紀錄不一定出現在最上面。
  const sorted = [...filtered].sort((a, b) => {
    const ak = a.createdAt || a.date;
    const bk = b.createdAt || b.date;
    return ak < bk ? 1 : ak > bk ? -1 : 0;
  });
  const income = accounting.filter((a) => a.type === "收入").reduce((s, a) => s + Number(a.amount || 0), 0);
  const expense = accounting.filter((a) => a.type === "支出").reduce((s, a) => s + Number(a.amount || 0), 0);

  return (
    <div>
      <SectionHeader eyebrow="LEDGER · 11" title="帳務入口"
        action={<Btn variant="brass" icon={Plus} onClick={() => setModal(true)}>新增帳務紀錄</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label="總收入" value={fmtMoney(income)} icon={TrendingUp} tone="success" />
        <StatCard label="總支出" value={fmtMoney(expense)} icon={TrendingDown} tone="danger" />
        <StatCard label="淨額" value={fmtMoney(income - expense)} icon={Landmark} tone="brass" />
      </div>

      <div style={{ background: "#FBF7EC", border: `1px solid ${THEME.brassSoft}`, borderRadius: 10, padding: "10px 16px", fontSize: 12.5, color: THEME.brassDeep, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <AlertCircle size={14} />
        發票收款、收支管理內的紀錄與已發放薪資會自動登錄於此帳冊，亦可手動新增其他收支項目。
      </div>

      {accounting.length > 0 && (
        <>
          <MonthFilterBar month={month} setMonth={setMonth} label="日期月份" />
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {["全部", "收入", "支出"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                style={{
                  padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${typeFilter === t ? THEME.brass : THEME.line}`,
                  background: typeFilter === t ? THEME.brass : "#fff",
                  color: typeFilter === t ? "#fff" : THEME.text,
                }}>{t}</button>
            ))}
          </div>
        </>
      )}

      {accounting.length === 0 ? (
        <EmptyState icon={Landmark} text="尚無帳務紀錄。" action={<Btn variant="brass" icon={Plus} onClick={() => setModal(true)}>新增第一筆紀錄</Btn>} />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Landmark} text="這個篩選條件下沒有帳務紀錄。" />
      ) : (
        <Table columns={["日期", "類型", "類別", "說明", "金額", ""]}>
          {sorted.map((a) => (
            <tr key={a.id}>
              <td style={td}>{fmtDate(a.date)}</td>
              <td style={td}>
                <span style={{ color: a.type === "收入" ? THEME.success : THEME.danger, fontWeight: 700, fontSize: 12.5 }}>
                  {a.type === "收入" ? "＋收入" : "－支出"}
                </span>
              </td>
              <td style={td}>{a.category || "—"}</td>
              <td style={td}>{a.desc || "—"}</td>
              <td style={{ ...td, fontFamily: FONT_NUM, fontWeight: 700, color: a.type === "收入" ? THEME.success : THEME.danger }}>{fmtMoney(a.amount)}</td>
              <td style={{ ...td, textAlign: "right" }}>
                <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete("確定要刪除此筆帳務紀錄嗎？", () => persist.accounting(accounting.filter((x) => x.id !== a.id)))} />
              </td>
            </tr>
          ))}
        </Table>
      )}

      {modal && (
        <Modal title="新增帳務紀錄" onClose={() => setModal(null)}>
          <AccountingForm data={emptyAccounting()} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function AccountingForm({ data, onSave, onCancel }) {
  const [f, setF] = useState(data);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="類型">
        <Select value={f.type} onChange={set("type")}>
          <option value="收入">收入</option>
          <option value="支出">支出</option>
        </Select>
      </Field>
      <Field label="日期"><TextInput type="date" value={f.date} onChange={set("date")} /></Field>
      <Field label="類別"><TextInput value={f.category} onChange={set("category")} placeholder="如：業務收入、辦公費用" /></Field>
      <Field label="金額"><TextInput type="number" value={f.amount} onChange={set("amount")} placeholder="0" /></Field>
      <Field label="說明" span={2}><TextArea value={f.desc} onChange={set("desc")} placeholder="項目說明" /></Field>
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.amount && onSave(f)} disabled={!f.amount}>儲存</Btn>
      </div>
    </div>
  );
}

/* =========================================================
   REPORTS
========================================================= */
const PIE_COLORS = [THEME.brass, THEME.ink, "#7A8CA3", THEME.danger, THEME.success, THEME.warn, "#B4A98A"];

function ReportsView({ ctx }) {
  const { employees, payroll, accounting } = ctx;
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const years = Array.from(new Set([
    String(new Date().getFullYear()),
    ...accounting.map((a) => (a.date || "").slice(0, 4)).filter(Boolean),
    ...payroll.map((p) => (p.month || "").slice(0, 4)).filter(Boolean),
  ])).sort((a, b) => b.localeCompare(a));

  const months = Array.from({ length: 12 }).map((_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const revenueTrend = months.map((m) => ({
    month: m.slice(5) + "月",
    營收: Math.round(accounting.filter((a) => a.type === "收入" && (a.date || "").startsWith(m)).reduce((s, a) => s + Number(a.amount || 0), 0)),
  }));
  const payrollTrend = months.map((m) => ({
    month: m.slice(5) + "月",
    薪資成本: Math.round(payroll.filter((p) => p.month === m).reduce((s, p) => s + payrollNet(p), 0)),
  }));

  const expenseByCategory = useMemo(() => {
    const map = {};
    accounting.filter((a) => a.type === "支出" && (a.date || "").startsWith(year)).forEach((a) => {
      const key = a.category || "其他";
      map[key] = (map[key] || 0) + Number(a.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [accounting, year]);

  const headcountByDept = useMemo(() => {
    const map = {};
    employees.filter((e) => e.status === "在職").forEach((e) => {
      const key = e.dept || "未分類";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([dept, count]) => ({ dept, count }));
  }, [employees]);

  const yearRevenueTotal = revenueTrend.reduce((s, m) => s + m.營收, 0);
  const yearExpenseTotal = expenseByCategory.reduce((s, c) => s + c.value, 0);
  const yearPayrollTotal = payrollTrend.reduce((s, m) => s + m.薪資成本, 0);

  return (
    <div>
      <SectionHeader eyebrow="REPORTS · 12" title="公司報表" />

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12.5, color: THEME.muted, fontWeight: 600, marginRight: 4 }}>年度</span>
        {years.map((y) => (
          <button key={y} onClick={() => setYear(y)}
            style={{
              padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${year === y ? THEME.brass : THEME.line}`,
              background: year === y ? THEME.brass : "#fff",
              color: year === y ? "#fff" : THEME.text,
            }}>{y} 年</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label={`${year} 年營收總額`} value={fmtMoney(yearRevenueTotal)} icon={TrendingUp} tone="success" />
        <StatCard label={`${year} 年支出總額`} value={fmtMoney(yearExpenseTotal)} icon={TrendingDown} tone="danger" />
        <StatCard label={`${year} 年薪資成本`} value={fmtMoney(yearPayrollTotal)} icon={Wallet} tone="brass" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title={`營收趨勢（${year} 年，依月份）`}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.line} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: THEME.muted }} axisLine={{ stroke: THEME.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: THEME.muted }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${THEME.line}` }} />
              <Line type="monotone" dataKey="營收" stroke={THEME.brass} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`薪資成本趨勢（${year} 年，依月份）`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={payrollTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.line} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: THEME.muted }} axisLine={{ stroke: THEME.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: THEME.muted }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${THEME.line}` }} />
              <Bar dataKey="薪資成本" fill={THEME.ink} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`支出類別分布（${year} 年）`}>
          {expenseByCategory.length === 0 ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: THEME.muted, fontSize: 13 }}>這個年度尚無支出資料</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${THEME.line}` }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="各部門在職人數（目前）">
          {headcountByDept.length === 0 ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: THEME.muted, fontSize: 13 }}>尚無員工資料</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={headcountByDept} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.line} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: THEME.muted }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 12, fill: THEME.text }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${THEME.line}` }} />
                <Bar dataKey="count" fill={THEME.brass} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: THEME.surface, border: `1px solid ${THEME.line}`, borderRadius: 12, padding: "18px 20px" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: THEME.text }}>{title}</h3>
      {children}
    </div>
  );
}

/* =========================================================
   VENDORS (廠商管理 — 供應商 / 業主)
========================================================= */
const VENDOR_COMPANY_OPTIONS = ["綠石環保", "歐克環境", "上藝除蟲", "維娜科技", "禾豐國際", "其他"];
// 發票開票公司／公司應付款項付款公司只從這幾家挑，「禾豐國際」不列入這兩處的選項
// （廠商管理的往來公司清單維持完整，不受影響）
const BILLING_COMPANY_OPTIONS = VENDOR_COMPANY_OPTIONS.filter((o) => o !== "禾豐國際");
const PAYMENT_METHODS = ["現金", "匯款", "支票", "月結30天", "月結60天", "其他"];
const VENDOR_TYPES = ["供應商", "業主"];

const emptyVendor = { name: "", vendorType: "供應商", contact: "", phone: "", email: "", category: "", taxId: "", paymentMethod: "匯款", tradingCompany: "", note: "" };

function VendorsView({ ctx }) {
  const { vendors, persist, askDelete } = ctx;
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");

  const filtered = vendors
    .filter((v) => typeFilter === "全部" || v.vendorType === typeFilter)
    .filter((v) => (v.name + (v.category || "") + (v.tradingCompany || "")).toLowerCase().includes(query.toLowerCase()));

  const save = (data) => {
    if (data.id) persist.vendors(vendors.map((v) => (v.id === data.id ? data : v)));
    else persist.vendors([{ ...data, id: uid() }, ...vendors]);
    setModal(null);
  };

  const supplierCount = vendors.filter((v) => v.vendorType === "供應商").length;
  const ownerCount = vendors.filter((v) => v.vendorType === "業主").length;

  return (
    <div>
      <SectionHeader eyebrow="VENDOR · 04" title="廠商管理"
        action={<Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: emptyVendor })}>新增廠商</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label="供應商家數" value={supplierCount} icon={Truck} tone="ink" />
        <StatCard label="業主家數" value={ownerCount} icon={Building2} tone="brass" />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["全部", ...VENDOR_TYPES].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{
                padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${typeFilter === t ? THEME.brass : THEME.line}`,
                background: typeFilter === t ? THEME.brass : "#fff",
                color: typeFilter === t ? "#fff" : THEME.text,
              }}>{t}</button>
          ))}
        </div>
        <div style={{ position: "relative", maxWidth: 260 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: THEME.muted }} />
          <TextInput placeholder="搜尋名稱／業務類別／往來公司" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Truck} text="尚未建立任何廠商資料。" action={<Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: emptyVendor })}>新增第一家廠商</Btn>} />
      ) : (
        <Table columns={["名稱", "類型", "業務類別", "聯絡人", "聯絡方式", "統一編號", "付款方式", "往來公司", ""]}>
          {filtered.map((v) => (
            <tr key={v.id}>
              <td style={td}><strong>{v.name}</strong></td>
              <td style={td}><StatusBadge status={v.vendorType} /></td>
              <td style={td}>{v.category || "—"}</td>
              <td style={td}>{v.contact || "—"}</td>
              <td style={td}>
                <div style={{ fontSize: 12.5 }}>{v.phone || "—"}</div>
                <div style={{ fontSize: 11.5, color: THEME.muted }}>{v.email || "—"}</div>
              </td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{v.taxId || "—"}</td>
              <td style={td}>{v.paymentMethod || "—"}</td>
              <td style={td}>{v.tradingCompany || "—"}</td>
              <td style={{ ...td, textAlign: "right" }}>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Btn size="sm" icon={Pencil} onClick={() => setModal({ mode: "edit", data: v })}>編輯</Btn>
                  <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除「${v.name}」嗎？`, () => persist.vendors(vendors.filter((x) => x.id !== v.id)))} />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {modal && (
        <Modal title={modal.mode === "new" ? "新增廠商" : "編輯廠商資料"} onClose={() => setModal(null)}>
          <VendorForm data={modal.data} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function VendorForm({ data, onSave, onCancel }) {
  const [f, setF] = useState(data);
  const [companyChoice, setCompanyChoice] = useState(
    VENDOR_COMPANY_OPTIONS.includes(data.tradingCompany) ? data.tradingCompany : (data.tradingCompany ? "其他" : "")
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const onCompanyChoiceChange = (e) => {
    const val = e.target.value;
    setCompanyChoice(val);
    if (val !== "其他") setF({ ...f, tradingCompany: val });
    else setF({ ...f, tradingCompany: "" });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="名稱" span={2}><TextInput value={f.name} onChange={set("name")} placeholder="○○有限公司或聯絡人姓名" /></Field>
      <Field label="廠商類型">
        <Select value={f.vendorType} onChange={set("vendorType")}>
          {VENDOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <Field label="業務類別"><TextInput value={f.category} onChange={set("category")} placeholder="如：環保工程、除蟲服務" /></Field>
      <Field label="統一編號"><TextInput value={f.taxId} onChange={set("taxId")} placeholder="12345678" /></Field>
      <Field label="聯絡人"><TextInput value={f.contact} onChange={set("contact")} placeholder="窗口姓名" /></Field>
      <Field label="付款方式">
        <Select value={f.paymentMethod} onChange={set("paymentMethod")}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </Field>
      <Field label="往來公司">
        <Select value={companyChoice} onChange={onCompanyChoiceChange}>
          <option value="">請選擇</option>
          {VENDOR_COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
      </Field>
      {companyChoice === "其他" && (
        <Field label="自訂往來公司名稱"><TextInput value={f.tradingCompany} onChange={set("tradingCompany")} placeholder="輸入公司名稱" /></Field>
      )}
      <Field label="聯絡電話"><TextInput value={f.phone} onChange={set("phone")} placeholder="02-1234-5678" /></Field>
      <Field label="Email"><TextInput value={f.email} onChange={set("email")} placeholder="contact@company.com" /></Field>
      <Field label="備註" span={2}><TextArea value={f.note} onChange={set("note")} /></Field>
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.name && onSave(f)} disabled={!f.name}>儲存</Btn>
      </div>
    </div>
  );
}

/* =========================================================
   CONTRACTS (契約管理)
========================================================= */
const emptyContract = (vendors) => ({
  title: "", party: "", type: "服務", startDate: todayStr(), endDate: "", amount: "", status: "生效中", note: "",
  hasPerformanceBond: "無", performanceBondAmount: "", hasInsurance: "無", insurancePurchaseStatus: "估價中", owner: "",
  contractorCompany: "",
});

function ContractsView({ ctx }) {
  const { contracts, vendors, sysUsers, persist, askDelete } = ctx;
  const [modal, setModal] = useState(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [companyFilter, setCompanyFilter] = useState("全部");

  const years = Array.from(new Set([
    String(new Date().getFullYear()),
    ...contracts.map((c) => (c.startDate || "").slice(0, 4)).filter(Boolean),
  ])).sort((a, b) => b.localeCompare(a));
  const yearTabs = ["全部", ...years];
  const KNOWN_COMPANIES = BILLING_COMPANY_OPTIONS.filter((o) => o !== "其他");
  const companyTabs = ["全部", ...KNOWN_COMPANIES, "其他"];
  const filtered = contracts.filter((c) => {
    if (year !== "全部" && !(c.startDate || "").startsWith(year)) return false;
    if (companyFilter !== "全部") {
      if (companyFilter === "其他") return !KNOWN_COMPANIES.includes(c.contractorCompany);
      return c.contractorCompany === companyFilter;
    }
    return true;
  });

  const save = (data) => {
    if (data.id) {
      persist.contracts(contracts.map((c) => (c.id === data.id ? data : c)));
    } else {
      const no = nextNo("CT", contracts);
      persist.contracts([{ ...data, id: uid(), no }, ...contracts]);
    }
    setModal(null);
  };

  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const isExpiringSoon = (c) => c.status === "生效中" && c.endDate && new Date(c.endDate) <= soon && new Date(c.endDate) >= new Date();

  return (
    <div>
      <SectionHeader eyebrow="CONTRACT · 09" title="契約管理"
        action={<Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: emptyContract(vendors) })}>新增契約</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label="契約總數" value={contracts.length} icon={FileSignature} tone="ink" />
        <StatCard label={year === "全部" ? "承攬總金額" : `${year} 年度承攬總金額`} value={fmtMoney(filtered.reduce((s, c) => s + Number(c.amount || 0), 0))} icon={Landmark} tone="brass" />
        <StatCard label="生效中" value={contracts.filter((c) => c.status === "生效中").length} icon={Check} tone="success" />
        <StatCard label="30 天內到期" value={contracts.filter(isExpiringSoon).length} icon={AlertCircle} tone="warn" />
      </div>

      {contracts.length === 0 ? (
        <EmptyState icon={FileSignature} text="尚未建立任何契約。" action={<Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: emptyContract(vendors) })}>建立第一份契約</Btn>} />
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: THEME.muted, fontWeight: 600, marginRight: 4 }}>年度（依起始日期）</span>
            {yearTabs.map((y) => (
              <button key={y} onClick={() => setYear(y)}
                style={{
                  padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${year === y ? THEME.brass : THEME.line}`,
                  background: year === y ? THEME.brass : "#fff",
                  color: year === y ? "#fff" : THEME.text,
                }}>{y === "全部" ? y : `${y} 年`}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: THEME.muted, fontWeight: 600, marginRight: 4 }}>承攬公司</span>
            {companyTabs.map((c) => (
              <button key={c} onClick={() => setCompanyFilter(c)}
                style={{
                  padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${companyFilter === c ? THEME.brass : THEME.line}`,
                  background: companyFilter === c ? THEME.brass : "#fff",
                  color: companyFilter === c ? "#fff" : THEME.text,
                }}>{c}</button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={FileSignature} text="這個篩選條件下沒有契約。" />
          ) : (
        <Table columns={["契約編號", "契約名稱", "對方單位", "承攬公司", "類型", "起訖日期", "金額", "履保金", "保險", "負責人員", "狀態", ""]}>
          {filtered.map((c) => (
            <tr key={c.id} style={isExpiringSoon(c) ? { background: THEME.warnSoft } : undefined}>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{c.no}</td>
              <td style={td}><strong>{c.title}</strong></td>
              <td style={td}>{c.party || "—"}</td>
              <td style={td}>{c.contractorCompany ? <StatusBadge status={BILLING_COMPANY_OPTIONS.includes(c.contractorCompany) ? c.contractorCompany : "其他"} /> : "—"}</td>
              <td style={td}>{c.type}</td>
              <td style={td}>{fmtDate(c.startDate)} — {fmtDate(c.endDate)}</td>
              <td style={{ ...td, fontFamily: FONT_NUM }}>{fmtMoney(c.amount)}</td>
              <td style={td}>
                {c.hasPerformanceBond === "有" ? (
                  <span style={{ fontFamily: FONT_NUM }}>{fmtMoney(c.performanceBondAmount)}</span>
                ) : (
                  <span style={{ color: THEME.muted }}>無</span>
                )}
              </td>
              <td style={td}>
                {c.hasInsurance === "有" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                    <StatusBadge status="有" />
                    <StatusBadge status={c.insurancePurchaseStatus || "估價中"} />
                  </div>
                ) : (
                  <StatusBadge status="無" />
                )}
              </td>
              <td style={td}>
                <Select value={c.owner || ""} onChange={(e) => persist.contracts(contracts.map((x) => x.id === c.id ? { ...x, owner: e.target.value } : x))} style={{ padding: "4px 8px", fontSize: 12 }}>
                  <option value="">未指定</option>
                  {sysUsers.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                </Select>
              </td>
              <td style={td}>
                <Select value={c.status} onChange={(e) => persist.contracts(contracts.map((x) => x.id === c.id ? { ...x, status: e.target.value } : x))} style={{ padding: "4px 8px", fontSize: 12 }}>
                  <option value="草擬">草擬</option>
                  <option value="審核中">審核中</option>
                  <option value="生效中">生效中</option>
                  <option value="已到期">已到期</option>
                  <option value="已終止">已終止</option>
                </Select>
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Btn size="sm" icon={Pencil} onClick={() => setModal({ mode: "edit", data: c })} />
                  <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除契約「${c.title}」嗎？`, () => persist.contracts(contracts.filter((x) => x.id !== c.id)))} />
                </div>
              </td>
            </tr>
          ))}
        </Table>
          )}
        </>
      )}

      {modal && (
        <Modal title={modal.mode === "new" ? "新增契約" : `編輯契約 ${modal.data.no || ""}`} onClose={() => setModal(null)}>
          <ContractForm data={modal.data} vendors={vendors} sysUsers={sysUsers} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function ContractForm({ data, vendors, sysUsers, onSave, onCancel }) {
  const [f, setF] = useState({ hasPerformanceBond: "無", performanceBondAmount: "", hasInsurance: "無", insurancePurchaseStatus: "估價中", owner: "", contractorCompany: "", ...data });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="契約名稱" span={2}><TextInput value={f.title} onChange={set("title")} placeholder="如：辦公室租賃合約" /></Field>
      <Field label="對方單位">
        <TextInput value={f.party} onChange={set("party")} placeholder="客戶或廠商名稱" list="vendor-list" />
        <datalist id="vendor-list">{vendors.map((v) => <option key={v.id} value={v.name} />)}</datalist>
      </Field>
      <Field label="承攬公司">
        <Select value={f.contractorCompany} onChange={set("contractorCompany")}>
          <option value="">請選擇</option>
          {BILLING_COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
      </Field>
      <Field label="契約類型">
        <Select value={f.type} onChange={set("type")}>
          <option value="服務">服務</option>
          <option value="採購">採購</option>
          <option value="租賃">租賃</option>
          <option value="勞務">勞務</option>
          <option value="保密協議">保密協議</option>
          <option value="其他">其他</option>
        </Select>
      </Field>
      <Field label="起始日期"><TextInput type="date" value={f.startDate} onChange={set("startDate")} /></Field>
      <Field label="到期日期"><TextInput type="date" value={f.endDate} onChange={set("endDate")} /></Field>
      <Field label="契約金額"><TextInput type="number" value={f.amount} onChange={set("amount")} placeholder="0" /></Field>
      <Field label="狀態">
        <Select value={f.status} onChange={set("status")}>
          <option value="草擬">草擬</option>
          <option value="審核中">審核中</option>
          <option value="生效中">生效中</option>
          <option value="已到期">已到期</option>
          <option value="已終止">已終止</option>
        </Select>
      </Field>

      <Field label="是否有履保金">
        <Select value={f.hasPerformanceBond} onChange={set("hasPerformanceBond")}>
          <option value="無">無</option>
          <option value="有">有</option>
        </Select>
      </Field>
      {f.hasPerformanceBond === "有" && (
        <Field label="履保金金額"><TextInput type="number" value={f.performanceBondAmount} onChange={set("performanceBondAmount")} placeholder="0" /></Field>
      )}

      <Field label="是否有保險">
        <Select value={f.hasInsurance} onChange={set("hasInsurance")}>
          <option value="無">無</option>
          <option value="有">有</option>
        </Select>
      </Field>
      {f.hasInsurance === "有" && (
        <Field label="保險狀態">
          <Select value={f.insurancePurchaseStatus} onChange={set("insurancePurchaseStatus")}>
            <option value="估價中">估價中</option>
            <option value="未購買">未購買</option>
            <option value="已購買">已購買</option>
          </Select>
        </Field>
      )}

      <Field label="負責人員">
        <Select value={f.owner} onChange={set("owner")}>
          <option value="">未指定</option>
          {(sysUsers || []).map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
        </Select>
      </Field>

      <Field label="備註" span={2}><TextArea value={f.note} onChange={set("note")} /></Field>
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.title && onSave(f)} disabled={!f.title}>儲存</Btn>
      </div>
    </div>
  );
}

/* =========================================================
   VEHICLES (車輛管理)
========================================================= */
const emptyVehicle = { plate: "", model: "", driverId: "", dept: "", purchaseDate: "", insuranceExpiry: "", inspectionExpiry: "", status: "使用中", note: "" };

function VehiclesView({ ctx }) {
  const { vehicles, employees, persist, askDelete } = ctx;
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");

  const empName = (id) => employees.find((e) => e.id === id)?.name || "";
  const filtered = vehicles.filter((v) => (v.plate + v.model + empName(v.driverId)).toLowerCase().includes(query.toLowerCase()));

  const save = (data) => {
    if (data.id) persist.vehicles(vehicles.map((v) => (v.id === data.id ? data : v)));
    else persist.vehicles([{ ...data, id: uid() }, ...vehicles]);
    setModal(null);
  };

  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const isExpiringSoon = (d) => d && new Date(d) <= soon && new Date(d) >= new Date();
  const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  const expiringVehicles = vehicles.filter((v) => isExpiringSoon(v.insuranceExpiry) || isExpiringSoon(v.inspectionExpiry));

  return (
    <div>
      <SectionHeader eyebrow="VEHICLE · 10" title="車輛管理"
        action={<Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: emptyVehicle })}>新增車輛</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label="車輛總數" value={vehicles.length} icon={Car} tone="ink" />
        <StatCard label="使用中" value={vehicles.filter((v) => v.status === "使用中").length} icon={Check} tone="success" />
        <StatCard label="保險／驗車 30 天內到期" value={expiringVehicles.length} icon={AlertCircle} tone="warn" />
      </div>

      {expiringVehicles.length > 0 && (
        <div style={{ background: THEME.warnSoft, border: `1px solid #E9D8AE`, borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={14} color={THEME.warn} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: THEME.warn, lineHeight: 1.8 }}>
            <strong>{expiringVehicles.length} 輛車保險或驗車將於 30 天內到期：</strong>
            {expiringVehicles.map((v) => {
              const parts = [];
              if (isExpiringSoon(v.insuranceExpiry)) parts.push(`保險剩 ${daysUntil(v.insuranceExpiry)} 天`);
              if (isExpiringSoon(v.inspectionExpiry)) parts.push(`驗車剩 ${daysUntil(v.inspectionExpiry)} 天`);
              return <div key={v.id}>{v.plate}（{v.model || "未填車型"}）— {parts.join("、")}</div>;
            })}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16, position: "relative", maxWidth: 280 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: THEME.muted }} />
        <TextInput placeholder="搜尋車牌／車型／使用人" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 30 }} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Car} text="尚未建立任何車輛資料。" action={<Btn variant="brass" icon={Plus} onClick={() => setModal({ mode: "new", data: emptyVehicle })}>新增第一輛車</Btn>} />
      ) : (
        <Table columns={["車牌號碼", "廠牌型號", "使用人", "部門", "保險到期日", "驗車到期日", "狀態", ""]}>
          {filtered.map((v) => {
            const flagged = isExpiringSoon(v.insuranceExpiry) || isExpiringSoon(v.inspectionExpiry);
            return (
              <tr key={v.id} style={flagged ? { background: THEME.warnSoft } : undefined}>
                <td style={{ ...td, fontFamily: FONT_NUM }}><strong>{v.plate}</strong></td>
                <td style={td}>{v.model || "—"}</td>
                <td style={td}>{empName(v.driverId) || "—"}</td>
                <td style={td}>{v.dept || "—"}</td>
                <td style={td}>{v.insuranceExpiry ? fmtDate(v.insuranceExpiry) : "—"}</td>
                <td style={td}>{v.inspectionExpiry ? fmtDate(v.inspectionExpiry) : "—"}</td>
                <td style={td}>
                  <Select value={v.status} onChange={(e) => persist.vehicles(vehicles.map((x) => x.id === v.id ? { ...x, status: e.target.value } : x))} style={{ padding: "4px 8px", fontSize: 12 }}>
                    <option value="使用中">使用中</option>
                    <option value="保養中">保養中</option>
                    <option value="停用">停用</option>
                  </Select>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <Btn size="sm" icon={Pencil} onClick={() => setModal({ mode: "edit", data: v })} />
                    <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除車輛「${v.plate}」嗎？`, () => persist.vehicles(vehicles.filter((x) => x.id !== v.id)))} />
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {modal && (
        <Modal title={modal.mode === "new" ? "新增車輛" : "編輯車輛資料"} onClose={() => setModal(null)}>
          <VehicleForm data={modal.data} employees={employees} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function VehicleForm({ data, employees, onSave, onCancel }) {
  const [f, setF] = useState(data);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="車牌號碼"><TextInput value={f.plate} onChange={set("plate")} placeholder="ABC-1234" /></Field>
      <Field label="廠牌型號"><TextInput value={f.model} onChange={set("model")} placeholder="如：Toyota Hiace" /></Field>
      <Field label="使用人">
        <Select value={f.driverId} onChange={set("driverId")}>
          <option value="">未指派</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </Field>
      <Field label="部門"><TextInput value={f.dept} onChange={set("dept")} placeholder="使用部門" /></Field>
      <Field label="購入日期"><TextInput type="date" value={f.purchaseDate} onChange={set("purchaseDate")} /></Field>
      <Field label="狀態">
        <Select value={f.status} onChange={set("status")}>
          <option value="使用中">使用中</option>
          <option value="保養中">保養中</option>
          <option value="停用">停用</option>
        </Select>
      </Field>
      <Field label="保險到期日"><TextInput type="date" value={f.insuranceExpiry} onChange={set("insuranceExpiry")} /></Field>
      <Field label="驗車到期日"><TextInput type="date" value={f.inspectionExpiry} onChange={set("inspectionExpiry")} /></Field>
      <Field label="備註" span={2}><TextArea value={f.note} onChange={set("note")} /></Field>
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn onClick={onCancel}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={() => f.plate && onSave(f)} disabled={!f.plate}>儲存</Btn>
      </div>
    </div>
  );
}

/* =========================================================
   PERMISSIONS (權限設定)
========================================================= */
const emptySysUser = (roles) => ({ name: "", email: "", role: roles[0] || "", status: "啟用", employeeId: "" });

function PermissionsView({ ctx }) {
  const { sysUsers, rolePerms, employees, persist, askDelete, isAdmin } = ctx;
  const [modal, setModal] = useState(null);
  const [newRole, setNewRole] = useState("");
  const roles = rolePerms.roles;
  const empName = (id) => employees.find((e) => e.id === id)?.name || "";

  if (!isAdmin) {
    return (
      <EmptyState icon={ShieldCheck} text="只有管理員可以開啟權限設定。" />
    );
  }

  const saveUser = (data) => {
    if (data.id) persist.sysUsers(sysUsers.map((u) => (u.id === data.id ? data : u)));
    else persist.sysUsers([{ ...data, id: uid() }, ...sysUsers]);
    setModal(null);
  };

  const toggleCell = (role, moduleKey) => {
    const next = {
      ...rolePerms,
      matrix: {
        ...rolePerms.matrix,
        [role]: { ...rolePerms.matrix[role], [moduleKey]: !rolePerms.matrix[role]?.[moduleKey] },
      },
    };
    persist.rolePerms(next);
  };

  const addRole = () => {
    const name = newRole.trim();
    if (!name || roles.includes(name)) return;
    const blank = Object.fromEntries(NAV.map((n) => [n.key, false]));
    persist.rolePerms({ roles: [...roles, name], matrix: { ...rolePerms.matrix, [name]: blank } });
    setNewRole("");
  };

  const removeRole = (role) => {
    const { [role]: _, ...restMatrix } = rolePerms.matrix;
    persist.rolePerms({ roles: roles.filter((r) => r !== role), matrix: restMatrix });
  };

  return (
    <div>
      <SectionHeader eyebrow="ACCESS · 13" title="權限設定"
        action={<Btn variant="brass" icon={Plus} onClick={() => setModal(true)}>新增系統帳號</Btn>} />

      <div style={{ background: "#FBF7EC", border: `1px solid ${THEME.brassSoft}`, borderRadius: 10, padding: "10px 16px", fontSize: 12.5, color: THEME.brassDeep, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <AlertCircle size={14} />
        側邊欄下方可切換「目前身分」。非管理員角色在打卡上下班頁面，只能選自己綁定的員工打卡，也只能看到自己的出勤紀錄。
      </div>

      <h3 style={{ fontSize: 14.5, fontWeight: 700, color: THEME.text, marginBottom: 12 }}>系統帳號</h3>
      {sysUsers.length === 0 ? (
        <EmptyState icon={UserCog} text="尚未建立任何系統帳號。" action={<Btn variant="brass" icon={Plus} onClick={() => setModal(true)}>新增第一個帳號</Btn>} />
      ) : (
        <Table columns={["姓名", "Email", "角色", "綁定員工", "狀態", ""]}>
          {sysUsers.map((u) => (
            <tr key={u.id}>
              <td style={td}><strong>{u.name}</strong></td>
              <td style={td}>{u.email || "—"}</td>
              <td style={td}>
                <Select value={u.role} onChange={(e) => persist.sysUsers(sysUsers.map((x) => x.id === u.id ? { ...x, role: e.target.value } : x))} style={{ padding: "4px 8px", fontSize: 12 }}>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </td>
              <td style={td}>
                <Select value={u.employeeId || ""} onChange={(e) => persist.sysUsers(sysUsers.map((x) => x.id === u.id ? { ...x, employeeId: e.target.value } : x))} style={{ padding: "4px 8px", fontSize: 12 }}>
                  <option value="">未綁定</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </Select>
              </td>
              <td style={td}>
                <Select value={u.status} onChange={(e) => persist.sysUsers(sysUsers.map((x) => x.id === u.id ? { ...x, status: e.target.value } : x))} style={{ padding: "4px 8px", fontSize: 12 }}>
                  <option value="啟用">啟用</option>
                  <option value="停用">停用</option>
                </Select>
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                <Btn size="sm" variant="danger" icon={Trash2} onClick={() => askDelete(`確定要刪除帳號「${u.name}」嗎？`, () => persist.sysUsers(sysUsers.filter((x) => x.id !== u.id)))} />
              </td>
            </tr>
          ))}
        </Table>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "30px 0 12px" }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: THEME.text, margin: 0 }}>角色權限矩陣</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <TextInput value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="新增角色名稱" style={{ width: 160 }} />
          <Btn size="sm" icon={Plus} onClick={addRole}>新增角色</Btn>
        </div>
      </div>

      <div style={{ background: THEME.surface, border: `1px solid ${THEME.line}`, borderRadius: 12, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>功能模組</th>
              {roles.map((r) => (
                <th key={r} style={{ ...th, textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span>{r}</span>
                    {!DEFAULT_ROLES.includes(r) && (
                      <button onClick={() => removeRole(r)} style={{ border: "none", background: "transparent", color: THEME.danger, cursor: "pointer", fontSize: 10.5 }}>移除</button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NAV.map((n) => (
              <tr key={n.key}>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <n.icon size={14} color={THEME.muted} />
                    {n.label}
                  </div>
                </td>
                {roles.map((r) => (
                  <td key={r} style={{ ...td, textAlign: "center" }}>
                    <input type="checkbox" checked={!!rolePerms.matrix[r]?.[n.key]} onChange={() => toggleCell(r, n.key)} style={{ width: 16, height: 16, accentColor: THEME.brass, cursor: "pointer" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="新增系統帳號" onClose={() => setModal(null)}>
          <SysUserForm data={emptySysUser(roles)} roles={roles} employees={employees} onSave={saveUser} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function SysUserForm({ data, roles, employees, onSave, onCancel }) {
  const isNew = !data.id;
  const [f, setF] = useState(data);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const handleSave = async () => {
    if (!f.name) return;
    setError("");

    // 只有「新增」帳號時才會順便建立可登入的密碼；編輯既有帳號的密碼
    // 需要當事人自己用「忘記密碼」流程重設，前端沒有權限直接改別人密碼。
    if (isNew && password) {
      if (!f.email) { setError("要設定密碼就必須先填 Email，這是登入時要用的帳號。"); return; }
      if (password.length < 6) { setError("密碼至少需要 6 個字元。"); return; }
      if (password !== password2) { setError("兩次輸入的密碼不一致，請再確認一次。"); return; }

      setSaving(true);
      const authClient = createAuthActionClient();
      const { error: signUpError } = await authClient.auth.signUp({ email: f.email, password });
      setSaving(false);
      if (signUpError) {
        let msg = `建立登入帳號失敗：${signUpError.message}`;
        if (signUpError.message?.includes("already registered") || signUpError.status === 422) {
          msg = "這個 Email 已經有登入帳號了，請改用其他 Email，或不要填密碼直接建立資料列。";
        } else if (signUpError.message?.toLowerCase().includes("rate limit")) {
          msg = "短時間內建立太多帳號，觸發 Supabase 寄信的頻率限制了，請等幾分鐘後再試一次（或到 Supabase 後台把 Authentication 的「Confirm email」關掉就不會再卡在寄信這步）。";
        }
        setError(msg);
        return;
      }
    }

    onSave(f);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="姓名" span={2}><TextInput value={f.name} onChange={set("name")} placeholder="使用者姓名" /></Field>
      <Field label="Email" span={2}><TextInput value={f.email} onChange={set("email")} placeholder="name@company.com" /></Field>
      <Field label="角色">
        <Select value={f.role} onChange={set("role")}>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</Select>
      </Field>
      <Field label="狀態">
        <Select value={f.status} onChange={set("status")}>
          <option value="啟用">啟用</option>
          <option value="停用">停用</option>
        </Select>
      </Field>
      <Field label="綁定員工（用於打卡身分）" span={2}>
        <Select value={f.employeeId || ""} onChange={set("employeeId")}>
          <option value="">未綁定</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </Select>
      </Field>

      {isNew && (
        <>
          <Field label="密碼（選填，填了就會建立可登入帳號）">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 個字元" />
          </Field>
          <Field label="確認密碼">
            <TextInput type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="再輸入一次" />
          </Field>
          <div style={{ gridColumn: "span 2", fontSize: 11.5, color: THEME.muted, marginTop: -6 }}>
            若 Supabase 專案的 Authentication 設定開著「Confirm email」，對方要先到信箱點確認信才能登入；小團隊內部工具通常建議把這個選項關掉，設完密碼就能直接登入。
          </div>
        </>
      )}

      {error && (
        <div style={{ gridColumn: "span 2", background: THEME.dangerSoft, color: THEME.danger, fontSize: 12.5, padding: "8px 12px", borderRadius: 8 }}>
          {error}
        </div>
      )}

      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn onClick={onCancel} disabled={saving}>取消</Btn>
        <Btn variant="primary" icon={Check} onClick={handleSave} disabled={!f.name || saving}>{saving ? "建立中…" : "儲存"}</Btn>
      </div>
    </div>
  );
}
