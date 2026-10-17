# 官網表單串接

## 專案邊界

- 管理系統：本專案 / oak.boats；實際綁定網域的 Vercel 專案為 `company-management-system-6582`，另一個 `company-management-system` 亦接同一儲存庫但不是 oak.boats 網域目標。
- 官網：獨立 GitHub 儲存庫 `s0971080469-stack/oak-environment-website`；本機 `C:/Users/MyronH/Desktop/oak-environment-website`。
- Supabase：`udcasyazdrwytnntptev`。不得使用兩個 recovery 專案。
- 官網在其他對話可能有尚未合併的設計分支；發布前須核對目前正式部署的 commit，保留最新設計，不可直接覆蓋。
- 本次已快轉同步官網 `ebdeea7`（新增服務與詢價版面調整），未覆蓋新的設計；發布時仍須再次 fetch。

## 正式啟用狀態（2026-10-17）

- Migration `20261017020542_website_form_intake.sql`：獨立收件、會員 ACL、設定、重試識別與頻率限制表。
- Edge Function `website-intake`，`verify_jwt=true`。公用 anon JWT 僅作平台通道識別，不代表使用者身分；RLS 和 service-only RPC 保護資料。
- `website_form_settings.intake_enabled=true`。已於使用者明確要求發布後啟用。
- 管理系統功能提交 `fed5784`；官網串接提交 `1187154`（基於最新正式設計 `ebdeea7`），皆已推送 main 並部署。
- 官網 Vercel 正式環境已設定 `OAK_FORM_ENABLED=true` 與公用 anon JWT；預覽環境未啟用。legacy JWT 是 Edge verify_jwt 的相容通道，絕非 service-role key。
- 已於正式官網瀏覽器送出測試、在 oak.boats 登入帳號內收到，並將狀態從待處理改為處理中、已完成。測試收件 ID：`7c2e7ec3-bc56-41a3-84f1-84bb12a54148`，名稱「串接測試（請忽略）」；保留供驗證，不需派工或聯絡。
- 同一 ID／相同內容重試回傳原收件 ID；匿名讀取收件清單回覆 401。
- 與既有系統共用 Supabase 專案及資料庫，但使用獨立 `website_form_*` 資料表與權限；不寫入原本 app_records/app_storage，不是另一套實體資料庫或獨立備份。
- 管理帳號以已驗證的 `s0971080469@gmail.com` 對應 auth UUID 加入 `website_form_members`，不依前端可切換的角色判斷。
- 流量統計使用 Vercel Web Analytics；讀取未成功時顯示錯誤，不以假數據或 0 取代。

## 安全與限制

- anon 無讀取、更新、刪除或直接 INSERT 權限；只有獨立 Edge Function 可寫入收件 RPC。
- 會員只能讀取及更改 status，不能修改客戶原始內容；版本比對防止舊狀態覆蓋。
- 服務端限制 12 KB、欄位白名單、有效日期、同意版本、honeypot。CORS 僅接受三個已確認官網來源，不是身分驗證。
- 交易鎖使頻率與重試檢查為原子操作：每個正規化電話 10 分鐘 3 筆；全站 1 分鐘 20 筆、24 小時 200 筆。
- 電話的 HMAC 雜湊僅用於頻率限制，不儲存 IP。原始電話依聯絡需求保存在受 RLS 保護的收件資料中。
- 這是基本防垃圾機制，不能完全阻止機器人；若遭濫用可暫停收件，再加入 CAPTCHA 或調整限流。
- `website_form_receipts` 的 RLS 無公開 policy 為刻意 deny-all；僅 service role 使用。既有 `pg_net`、`save_app_collection`、密碼外洩防護警示不在本次修改範圍。
- 資料保留期限尚未由公司訂定，不自動刪除收件。

## 後續重新發布／啟用順序

1. 確認官網正式分支／commit（不能用舊 main 蓋掉新設計）；測試、提交兩個專案。
2. 先發布管理系統，使用管理帳號確認收件清單顯示「待啟用」、沒有權限錯誤。
3. 在官網 Vercel 設定 `OAK_FORM_ENABLED=true` 和 `OAK_FORM_ANON_KEY`（只能是 public anon key，不是 service-role / secret key）。不在對話輸出金鑰。
4. 發布官網；啟用時以正式同意文字替代預覽告知，確認按鈕需要使用者再次確認才送出。
5. 將獨立設定表 intake_enabled 改為 true。兩邊都成功後才宣布正式收件。
6. 用清楚標示的測試資料做一次真實端到端測試並核對清單／重試／狀態。測試資料清理需限定確切測試 ID，不可清空表格。

注意：Vercel 顯示官網網域聯絡資訊仍待 email 驗證，期限 2026-10-30。這不是程式錯誤，需網域持有人處理以免中斷。

停用：將獨立設定表 intake_enabled 設回 false；既有紀錄保留。正式停用時同步關閉官網表單設定並重新部署。

## 驗證

- `node --test tests/*.test.mjs`、`npm run build`。
- 官網 `npm run build`（含表單客戶端測試）。
- `supabase/tests/website_form_intake.sql` 在單一交易內測試後 rollback，不保留測試資料。
- Edge 關閉狀態回覆 503，錯誤來源回覆 403；正式啟用前不宣稱已完整驗證真實網站到收件頁的流程。

Supabase advisor 說明： https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## 官網瀏覽次數與訪客數（2026-10-17）

- 官網專案 `oak-environment-website` 使用基本 Web Analytics；不加購 Plus、不送出 custom events。
- 官網 build 只在 `VERCEL_ENV=production` 加入收集程式，並限制官網三個正式 hostname；本機與 preview 不收集。送出前移除 URL 的查詢參數與 hash，不送出表單內容。
- 管理系統新增 `GET /api/website-analytics?month=YYYY-MM`。伺服器以 `auth.getUser(token)` 驗證登入，並在使用者 RLS 下查詢 `website_form_members`；不使用前端角色、不使用 service-role key。
- Vercel 來源固定為 team `team_dJ9x9mzVYxAOnXv49AAs3zzN` / `oak-environment-website` / production，呼叫 visits/aggregate，不允許客戶端指定其他專案或查詢。
- `OAK_ANALYTICS_TOKEN` 僅在 **company-management-system-6582 → Production → Secret**；不可加 VITE_ 前綴、不可放入程式、瀏覽器或 Git。
- 專用 Token `oak-website-analytics` 僅限官網專案，使用者明確同意其非唯讀權限；期限 2027-01-15。到期需更新 Secret 並重新部署，不會影響表單收件。
- 月報依 Vercel UTC 日期，保留最近 12 個月份；表單月份仍依台灣時間。訪客數採全期間 aggregate，不將每日訪客相加。圖表為所選月份最後七個有涵蓋的日曆日（本月截至今天）。訪客是 Vercel 隱私估計值，不是實名、跨日可能重複。
- 管理頁可見時每五分鐘更新統計，月分切換會取消舊請求；API 回應 private/no-store，不使用公開 CDN 或 PWA 快取。
- 統計資料留在 Vercel，管理系統只讀取報表；不新增或寫入任何公司帳務／人員資料表。
- 測試：`node --test tests/*.test.mjs`；官網 `npm run build`。正式部署後另驗證收集出現、管理頁數字一致與匿名 API 拒絕存取。

參考：https://vercel.com/docs/analytics/web-analytics-api 、 https://vercel.com/docs/analytics/quickstart
