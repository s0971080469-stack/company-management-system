import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(rawUrl && rawKey);

if (!isSupabaseConfigured) {
  console.warn(
    "尚未設定 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，請參考 .env.example 建立 .env.local"
  );
}

// 沒設定金鑰時用假網址代替，避免 createClient 直接丟出例外導致整頁空白
export const supabase = createClient(
  rawUrl || "https://placeholder.supabase.co",
  rawKey || "public-anon-placeholder-key"
);