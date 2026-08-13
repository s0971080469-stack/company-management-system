import React, { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import Login from "./Login.jsx";
import CompanyManagementSystem from "./App.jsx";

const THEME = { ink: "#1B2333", brass: "#B8912B", canvas: "#F3F3EF", muted: "#767B8A", line: "#E6E4DA" };

function SetupNotice() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: THEME.canvas,
        fontFamily: "system-ui,sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          background: "#fff",
          border: `1px solid ${THEME.line}`,
          borderRadius: 14,
          padding: "32px 30px",
          textAlign: "left",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: THEME.ink, marginBottom: 10 }}>
          ✅ 程式碼執行正常，尚未連接資料庫
        </div>
        <p style={{ fontSize: 13.5, color: THEME.muted, lineHeight: 1.8, margin: 0 }}>
          你看到這個畫面代表 React 專案本身沒有問題。接下來如果要實際登入使用，
          請照 <code>README.md</code> 的步驟：
        </p>
        <ol style={{ fontSize: 13.5, color: THEME.muted, lineHeight: 1.9, paddingLeft: 20 }}>
          <li>到 supabase.com 建立一個免費專案</li>
          <li>在 Supabase「SQL Editor」執行 <code>supabase/schema.sql</code></li>
          <li>把專案的 Project URL 與 anon key，填進根目錄的 <code>.env.local</code>（沒有這個檔案就新建一個，可以複製 <code>.env.example</code> 改名）</li>
          <li>存檔後回到終端機，按 <code>Ctrl+C</code> 停掉，重新執行 <code>npm run dev</code></li>
        </ol>
      </div>
    </div>
  );
}

export default function AuthGate() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  if (session === undefined) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "system-ui,sans-serif",
          color: "#767B8A",
        }}
      >
        載入中…
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <CompanyManagementSystem session={session} />;
}