import { supabase } from "./supabaseClient";

/**
 * 清單型資料已改成「一筆資料一列」存放於 app_records。
 * 設定型資料（例如公司座標、角色權限）仍存放於 app_storage。
 *
 * 上線過渡期間如果新資料表尚未建立，這個檔案會自動退回舊的
 * app_storage 讀寫方式，讓程式碼可以先部署、再執行資料庫遷移。
 */
export const RECORD_COLLECTION_KEYS = new Set([
  "employees",
  "attendance",
  "payroll",
  "quotations",
  "invoices",
  "billing",
  "accounting",
  "vendors",
  "official_documents",
  "document_templates",
  "contracts",
  "sys_users",
  "quote_templates",
  "vehicles",
  "contract_billing_tracking",
  "leave_requests",
]);

const collectionVersions = new Map();
const collectionStorageModes = new Map();
const collectionSaveQueues = new Map();
const collectionGenerations = new Map();
const PAGE_SIZE = 1000;

const isMissingDataLayerError = (error) =>
  ["42P01", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(error?.code);

async function loadLegacyKey(key, fallback) {
  const { data, error } = await supabase
    .from("app_storage")
    .select("value")
    .eq("storage_key", key)
    .maybeSingle();
  if (error) throw error;
  if (!data) return fallback;
  return data.value ?? fallback;
}

async function saveLegacyKey(key, value) {
  const { error } = await supabase
    .from("app_storage")
    .upsert(
      { storage_key: key, value, updated_at: new Date().toISOString() },
      { onConflict: "storage_key" }
    );
  if (error) throw error;
  return true;
}

async function loadRecordCollection(key) {
  const { data: meta, error: metaError } = await supabase
    .from("app_collection_versions")
    .select("version")
    .eq("collection_key", key)
    .maybeSingle();

  if (metaError) {
    if (isMissingDataLayerError(metaError)) return { available: false };
    throw metaError;
  }
  if (!meta) return { available: false };

  const values = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("app_records")
      .select("value")
      .eq("collection_key", key)
      .order("sort_order", { ascending: true })
      .order("record_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    values.push(...(data || []).map((row) => row.value));
    if (!data || data.length < PAGE_SIZE) break;
  }

  collectionVersions.set(key, Number(meta.version || 0));
  return { available: true, value: values };
}

function emitStorageEvent(name, detail) {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

async function saveRecordCollectionNow(key, value, generation) {
  if ((collectionGenerations.get(key) || 0) !== generation) return false;

  // 若初次載入因斷線或權限錯誤而失敗，畫面會暫時拿到 fallback（通常是空陣列）。
  // 此時絕不能把 fallback 寫回資料庫，否則會把原本資料誤判成「全部刪除」。
  const storageMode = collectionStorageModes.get(key);
  if (!storageMode) {
    emitStorageEvent("app-storage-save-error", { key });
    return false;
  }
  if (storageMode === "legacy") return saveLegacyKey(key, value);

  const expectedVersion = collectionVersions.get(key);
  const { data, error } = await supabase.rpc("save_app_collection", {
    p_collection_key: key,
    p_expected_version: expectedVersion,
    p_records: value,
  });

  if (error) {
    console.error("逐筆資料儲存失敗", key, error);
    emitStorageEvent("app-storage-save-error", { key });
    return false;
  }

  if (!data?.success) {
    // 另一位使用者已先完成更新：取消同一批尚未送出的舊儲存工作，
    // 並重新載入資料庫最新內容，絕不以舊畫面覆蓋新資料。
    collectionGenerations.set(key, generation + 1);
    const latest = await loadRecordCollection(key);
    emitStorageEvent("app-storage-conflict", {
      key,
      value: latest.available ? latest.value : null,
    });
    return false;
  }

  collectionVersions.set(key, Number(data.version));
  return true;
}

export async function loadKey(key, fallback) {
  try {
    if (RECORD_COLLECTION_KEYS.has(key)) {
      const collection = await loadRecordCollection(key);
      if (collection.available) {
        collectionStorageModes.set(key, "records");
        return collection.value;
      }
      const legacyValue = await loadLegacyKey(key, fallback);
      collectionStorageModes.set(key, "legacy");
      return legacyValue;
    }
    return await loadLegacyKey(key, fallback);
  } catch (error) {
    console.error("loadKey failed", key, error);
    return fallback;
  }
}

export function saveKey(key, value) {
  if (!RECORD_COLLECTION_KEYS.has(key) || !Array.isArray(value)) {
    return saveLegacyKey(key, value).catch((error) => {
      console.error("saveKey failed", key, error);
      emitStorageEvent("app-storage-save-error", { key });
      return false;
    });
  }

  const generation = collectionGenerations.get(key) || 0;
  const previous = collectionSaveQueues.get(key) || Promise.resolve();
  const queued = previous
    .catch(() => false)
    .then(() => saveRecordCollectionNow(key, value, generation))
    .catch((error) => {
      console.error("saveKey failed", key, error);
      emitStorageEvent("app-storage-save-error", { key });
      return false;
    });

  collectionSaveQueues.set(key, queued);
  queued.finally(() => {
    if (collectionSaveQueues.get(key) === queued) collectionSaveQueues.delete(key);
  });
  return queued;
}
