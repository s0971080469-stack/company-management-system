# 官網表單串接

## 專案邊界

- 管理系統：本專案 / oak.boats。
- 官網：獨立 GitHub 儲存庫 `s0971080469-stack/oak-environment-website`；本機 `C:/Users/MyronH/Desktop/oak-environment-website`。
- Supabase：`udcasyazdrwytnntptev`。不得使用兩個 recovery 專案。
- 官網在其他對話可能有尚未合併的設計分支；發布前須核對目前正式部署的 commit，保留最新設計，不可直接覆蓋。
- 本次已快轉同步官網 `ebdeea7`（新增服務與詢價版面調整），未覆蓋新的設計；發布時仍須再次 fetch。

## 已建立但尚未啟用

- Migration `20261017020542_website_form_intake.sql`：獨立收件、會員 ACL、設定、重試識別與頻率限制表。
- Edge Function `website-intake`，`verify_jwt=true`。公用 anon JWT 僅作平台通道識別，不代表使用者身分；RLS 和 service-only RPC 保護資料。
- `website_form_settings.intake_enabled=false`。公開送件會回覆 503，不儲存資料。
- 管理帳號以已驗證的 `s0971080469@gmail.com` 對應 auth UUID 加入 `website_form_members`，不依前端可切換的角色判斷。
- 真實流量統計尚未接入，畫面不得以假數據取代。

## 安全與限制

- anon 無讀取、更新、刪除或直接 INSERT 權限；只有獨立 Edge Function 可寫入收件 RPC。
- 會員只能讀取及更改 status，不能修改客戶原始內容；版本比對防止舊狀態覆蓋。
- 服務端限制 12 KB、欄位白名單、有效日期、同意版本、honeypot。CORS 僅接受三個已確認官網來源，不是身分驗證。
- 交易鎖使頻率與重試檢查為原子操作：每個正規化電話 10 分鐘 3 筆；全站 1 分鐘 20 筆、24 小時 200 筆。
- 電話的 HMAC 雜湊僅用於頻率限制，不儲存 IP。原始電話依聯絡需求保存在受 RLS 保護的收件資料中。
- 這是基本防垃圾機制，不能完全阻止機器人；若遭濫用可暫停收件，再加入 CAPTCHA 或調整限流。
- `website_form_receipts` 的 RLS 無公開 policy 為刻意 deny-all；僅 service role 使用。既有 `pg_net`、`save_app_collection`、密碼外洩防護警示不在本次修改範圍。
- 資料保留期限尚未由公司訂定，不自動刪除收件。

## 啟用順序（需要確認發布兩個網站）

1. 確認官網正式分支／commit（不能用舊 main 蓋掉新設計）；測試、提交兩個專案。
2. 先發布管理系統，使用管理帳號確認收件清單顯示「待啟用」、沒有權限錯誤。
3. 在官網 Vercel 設定 `OAK_FORM_ENABLED=true` 和 `OAK_FORM_ANON_KEY`（只能是 public anon key，不是 service-role / secret key）。不在對話輸出金鑰。
4. 發布官網；啟用時以正式同意文字替代預覽告知，確認按鈕需要使用者再次確認才送出。
5. 將獨立設定表 intake_enabled 改為 true。兩邊都成功後才宣布正式收件。
6. 用清楚標示的測試資料做一次真實端到端測試並核對清單／重試／狀態。測試資料清理需限定確切測試 ID，不可清空表格。

停用：將獨立設定表 intake_enabled 設回 false；既有紀錄保留。正式停用時同步關閉官網表單設定並重新部署。

## 驗證

- `node --test tests/*.test.mjs`、`npm run build`。
- 官網 `npm run build`（含表單客戶端測試）。
- `supabase/tests/website_form_intake.sql` 在單一交易內測試後 rollback，不保留測試資料。
- Edge 關閉狀態回覆 503，錯誤來源回覆 403；正式啟用前不宣稱已完整驗證真實網站到收件頁的流程。

Supabase advisor 說明： https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
