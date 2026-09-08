// 把 Supabase 上的所有資料（設定、逐筆資料、異動歷史、聊天 + 掃描檔）
// 備份一份到公司 NAS。用法：
//   1. 複製 scripts/backup.config.example.json 為 scripts/backup.config.json，
//      填入 Supabase service_role key（後台 Project Settings → API）跟 NAS 的網路路徑。
//   2. 手動執行：node scripts/backup-to-nas.mjs
//   3. 要自動排程的話，用 scripts/run-backup.bat 讓 Windows 工作排程器定期執行。
//
// service_role key 權限等同資料庫最高權限，backup.config.json 絕對不能提交進 git
// （已加進 .gitignore），也不能放進部署到 Vercel 的任何檔案。

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "backup.config.json");

async function loadConfig() {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`找不到設定檔：${configPath}`);
    console.error("請先複製 scripts/backup.config.example.json 為 scripts/backup.config.json 並填好內容。");
    process.exit(1);
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function readAllRows(supabase, table, orderBy) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from(table)
      .select("*");
    for (const column of orderBy) query = query.order(column, { ascending: true });
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(`讀取 ${table} 失敗：${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function backupDatabaseTables(supabase, destDir) {
  const tables = [
    { name: "app_storage", orderBy: ["storage_key"] },
    { name: "app_collection_versions", orderBy: ["collection_key"] },
    { name: "app_records", orderBy: ["collection_key", "record_id"] },
    { name: "app_record_history", orderBy: ["history_id"] },
    { name: "chat_messages", orderBy: ["created_at", "id"] },
  ];
  let total = 0;
  for (const table of tables) {
    const rows = await readAllRows(supabase, table.name, table.orderBy);
    const outFile = path.join(destDir, `${table.name}.json`);
    await fs.writeFile(outFile, JSON.stringify(rows, null, 2), "utf-8");
    console.log(`${table.name}：已備份 ${rows.length} 筆資料 → ${outFile}`);
    total += rows.length;
  }
  return total;
}

async function listAllFiles(supabase, bucket, prefix = "") {
  const files = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(`列出儲存桶 ${bucket}/${prefix} 失敗：${error.message}`);
  for (const item of data) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      // 資料夾：往下遞迴
      files.push(...(await listAllFiles(supabase, bucket, itemPath)));
    } else {
      files.push(itemPath);
    }
  }
  return files;
}

async function backupScans(supabase, destDir) {
  const bucket = "quote-scans";
  const filePaths = await listAllFiles(supabase, bucket);
  let ok = 0;
  for (const filePath of filePaths) {
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) {
      console.error(`下載失敗：${filePath} — ${error.message}`);
      continue;
    }
    const localPath = path.join(destDir, "quote-scans", filePath);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    const buffer = Buffer.from(await data.arrayBuffer());
    await fs.writeFile(localPath, buffer);
    ok++;
  }
  console.log(`quote-scans：已備份 ${ok} / ${filePaths.length} 個檔案`);
  return ok;
}

async function cleanupOldBackups(nasBackupPath, keepDays) {
  if (!keepDays || keepDays <= 0) return;
  const entries = await fs.readdir(nasBackupPath, { withFileTypes: true }).catch(() => []);
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("backup-")) continue;
    const full = path.join(nasBackupPath, entry.name);
    const stat = await fs.stat(full).catch(() => null);
    if (stat && stat.mtimeMs < cutoff) {
      await fs.rm(full, { recursive: true, force: true });
      console.log(`已清除過期備份：${entry.name}`);
    }
  }
}

async function main() {
  const config = await loadConfig();
  const { supabaseUrl, serviceRoleKey, nasBackupPath, keepDays } = config;
  if (!supabaseUrl || !serviceRoleKey || !nasBackupPath) {
    console.error("設定檔缺少 supabaseUrl / serviceRoleKey / nasBackupPath，請確認 backup.config.json 內容完整。");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const destDir = path.join(nasBackupPath, `backup-${timestamp()}`);
  await fs.mkdir(destDir, { recursive: true });

  console.log(`開始備份 → ${destDir}`);
  const rowCount = await backupDatabaseTables(supabase, destDir);
  const fileCount = await backupScans(supabase, destDir);
  await cleanupOldBackups(nasBackupPath, keepDays);

  console.log(`備份完成：${rowCount} 筆資料、${fileCount} 個檔案。`);
}

main().catch((err) => {
  console.error("備份失敗：", err);
  process.exit(1);
});
