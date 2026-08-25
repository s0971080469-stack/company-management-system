-- ============================================================
-- 公司管理系統 — Supabase 資料庫初始化腳本
-- 使用方式：登入 Supabase 專案 → 左側選單「SQL Editor」→
--           貼上這整份檔案的內容 → 按「Run」執行一次即可。
-- ============================================================

-- 1) 通用鍵值儲存表
--    App 內每個模組（員工、打卡、薪資、估價單…）都存成一筆
--    storage_key + value(jsonb) 的資料，維持跟原本 Claude Artifact
--    版本一樣的資料結構，方便前端程式碼幾乎不用大改。
create table if not exists app_storage (
  id uuid primary key default gen_random_uuid(),
  storage_key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table app_storage enable row level security;

-- 任何「已登入」的公司帳號都可以讀取全部資料（因為是全公司共用一份帳本）
drop policy if exists "authenticated can read app_storage" on app_storage;
create policy "authenticated can read app_storage"
  on app_storage for select
  to authenticated
  using (true);

-- 任何「已登入」的公司帳號都可以新增／更新資料
drop policy if exists "authenticated can upsert app_storage" on app_storage;
create policy "authenticated can upsert app_storage"
  on app_storage for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update app_storage" on app_storage;
create policy "authenticated can update app_storage"
  on app_storage for update
  to authenticated
  using (true);

-- 2) 估價單附件（掃描檔圖片）Storage bucket
--    每張估價單可以上傳掃描檔圖片保存，實際檔案存在 Supabase Storage，
--    估價單資料裡只存檔案路徑（見 app_storage 的 quotations）。
--    bucket 設為非公開，只有登入的公司帳號能讀取／上傳／刪除，
--    讀取時前端會用 createSignedUrl() 產生一組限時的預覽網址。
insert into storage.buckets (id, name, public)
values ('quote-scans', 'quote-scans', false)
on conflict (id) do nothing;

-- 確保 bucket 允許上傳圖片、PDF 與 Word 公文範本（.doc／.docx）（如果 bucket 已存在、
-- 且之前在 Dashboard 上被設成只允許圖片類型，上面的 insert 不會更新既有設定，
-- 所以這裡另外強制更新一次）
update storage.buckets
set allowed_mime_types = array['image/png','image/jpeg','image/jpg','image/gif','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword']
where id = 'quote-scans';

drop policy if exists "authenticated can read quote-scans" on storage.objects;
create policy "authenticated can read quote-scans"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'quote-scans');

drop policy if exists "authenticated can upload quote-scans" on storage.objects;
create policy "authenticated can upload quote-scans"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'quote-scans');

drop policy if exists "authenticated can delete quote-scans" on storage.objects;
create policy "authenticated can delete quote-scans"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'quote-scans');

-- 3) 內部即時通訊（系統帳號之間一對一聊天，右下角對話框功能）
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  recipient_id text not null,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists chat_messages_sender_idx on chat_messages (sender_id, created_at);
create index if not exists chat_messages_recipient_idx on chat_messages (recipient_id, created_at);

alter table chat_messages enable row level security;

drop policy if exists "authenticated can read chat_messages" on chat_messages;
create policy "authenticated can read chat_messages"
  on chat_messages for select
  to authenticated
  using (true);

drop policy if exists "authenticated can insert chat_messages" on chat_messages;
create policy "authenticated can insert chat_messages"
  on chat_messages for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update chat_messages" on chat_messages;
create policy "authenticated can update chat_messages"
  on chat_messages for update
  to authenticated
  using (true);

-- 把這張表加進 Supabase 的即時推播（Realtime）發布清單，
-- 對話框才能不重新整理就馬上收到新訊息；用 DO 區塊包起來
-- 判斷是否已經加過，這樣整份 SQL 重複執行也不會噴錯。
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table chat_messages;
  end if;
end $$;

-- ============================================================
-- 重要提醒（請務必閱讀）
-- ============================================================
-- 上面的 RLS 規則只做到「必須登入才能讀寫」這一層安全防護，
-- 並沒有做到「一般員工只能改自己的打卡紀錄」這種更細緻的資料庫層級管控——
-- 因為目前每個模組的資料是整包存成一個 JSON（例如所有人的打卡紀錄
-- 全部放在同一個 storage_key = 'attendance' 底下），資料庫沒辦法
-- 針對「陣列裡的某一筆」做權限判斷。
--
-- 現在「非管理員只能打自己的卡、只能看自己的紀錄」這條規則，
-- 是在前端程式碼（App.jsx）裡做判斷與畫面隱藏，屬於「應用層」的
-- 保護，不是資料庫強制擋下來的。對 5–20 人、彼此互相信任的小團隊
-- 內部工具來說，這樣通常已經足夠；但如果你之後在意「就算有人打開
-- 瀏覽器開發者工具，也不能改到別人的資料」這種更高等級的安全性，
-- 需要把各模組拆成真正的資料表（每個員工、每筆打卡各自一列），
-- 再針對每一列設 RLS 規則。這是之後可以再做的進階優化，非必要。
