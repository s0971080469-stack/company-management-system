import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const THEME = {
  ink: "#1B2333",
  brass: "#B8912B",
  brassDeep: "#8F6E1C",
  canvas: "#F3F3EF",
  line: "#E6E4DA",
  danger: "#B23A2E",
  dangerSoft: "#FBEAE7",
  muted: "#767B8A",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message?.includes("Email not confirmed")) {
        setError("登入失敗：這個帳號的 Email 尚未完成驗證，請到信箱（含垃圾郵件）找 Supabase 寄的驗證信，點擊連結後再試一次。");
      } else {
        setError("登入失敗：帳號或密碼錯誤，請確認後再試一次。");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: THEME.canvas,
        fontFamily: "'PingFang TC','Microsoft JhengHei',system-ui,sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
          maxWidth: "90vw",
          background: "#fff",
          borderRadius: 16,
          border: `1px solid ${THEME.line}`,
          padding: "36px 32px",
          boxShadow: "0 20px 50px rgba(27,35,51,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: THEME.brass,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            公
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: THEME.ink }}>公司管理系統</div>
            <div style={{ fontSize: 11.5, color: THEME.muted }}>請使用公司配發的帳號登入</div>
          </div>
        </div>

        <label style={{ display: "block", fontSize: 12.5, color: THEME.muted, marginBottom: 6 }}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          style={inputStyle}
        />

        <label style={{ display: "block", fontSize: 12.5, color: THEME.muted, margin: "16px 0 6px" }}>密碼</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />

        {error && (
          <div
            style={{
              marginTop: 14,
              background: THEME.dangerSoft,
              color: THEME.danger,
              fontSize: 12.5,
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 22,
            padding: "11px 0",
            borderRadius: 9,
            border: "none",
            background: THEME.ink,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "登入中…" : "登入"}
        </button>

        <p style={{ fontSize: 11.5, color: THEME.muted, marginTop: 18, lineHeight: 1.6 }}>
          還沒有帳號嗎？帳號由管理員在 Supabase 後台建立，請聯絡系統管理員新增你的帳號。
        </p>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${THEME.line}`,
  fontSize: 14,
  outline: "none",
};
