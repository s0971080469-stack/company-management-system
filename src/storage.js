import { supabase } from "./supabaseClient";

/**
 * 這個檔案取代原本 Claude Artifact 版本裡的 window.storage。
 * 介面（函式名稱、參數、回傳值）刻意保持一致，
 * 所以 App.jsx 裡其餘的程式碼幾乎不需要更動。
 *
 * 資料表：app_storage（見 supabase/schema.sql）
 *   storage_key text primary key
 *   value       jsonb
 */

export async function loadKey(key, fallback) {
  try {
    const { data, error } = await supabase
      .from("app_storage")
      .select("value")
      .eq("storage_key", key)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.value ?? fallback;
  } catch (e) {
    console.error("loadKey failed", key, e);
    return fallback;
  }
}

export async function saveKey(key, value) {
  try {
    const { error } = await supabase
      .from("app_storage")
      .upsert(
        { storage_key: key, value, updated_at: new Date().toISOString() },
        { onConflict: "storage_key" }
      );
    if (error) console.error("saveKey failed", key, error);
  } catch (e) {
    console.error("saveKey failed", key, e);
  }
}
