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

// 管理員在「權限設定」新增系統帳號並設定密碼時，需要呼叫 supabase.auth.signUp
// 建立真正的登入帳號。若直接用上面的主要 client 呼叫，Supabase 會把目前瀏覽器
// session 換成「新建立的那個人」，等於把管理員自己登出。這裡另外開一個不會
// persist session、也不會 auto refresh 的獨立 client，用完即丟，
// 才不會影響目前登入中的管理員身分。
export function createAuthActionClient() {
  return createClient(rawUrl || "https://placeholder.supabase.co", rawKey || "public-anon-placeholder-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}