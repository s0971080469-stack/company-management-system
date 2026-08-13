# 公司管理系統 — 部署到 Supabase + Vercel

這份文件是給「沒有工程背景」的你，一步一步照著做就能把系統正式上線。
如果卡住了，把錯誤訊息截圖直接問我（Claude）就可以。

---

## 你會用到的三個免費帳號

1. **Supabase**（資料庫＋登入）→ https://supabase.com
2. **Vercel**（讓網站有真正網址）→ https://vercel.com
3. **GitHub**（放程式碼，給 Vercel 抓）→ https://github.com

三個都可以直接用 Google 帳號註冊，不需要信用卡。

---

## 步驟一：建立 Supabase 專案

1. 登入 https://supabase.com → 點「New Project」
2. 專案名稱隨意（例如 `company-management-system`），資料庫密碼隨便設一組記下來
3. 地區建議選離台灣近的（如 Singapore / Tokyo）
4. 建立完成後，進入專案 → 左側選單「**SQL Editor**」→ 新增查詢
5. 打開這個專案裡的 `supabase/schema.sql`，把整份內容複製貼上 → 按「**Run**」
   - 這一步會建立好資料表跟權限設定
6. 左側選單「**Settings → API**」，把這兩個值記下來，等一下會用到：
   - `Project URL`
   - `anon public` 金鑰

---

## 步驟二：在 Supabase 建立員工帳號（登入用）

1. 左側選單「**Authentication → Users**」→ 「Add user」
2. 幫每一位會用系統的同事，用他們的 Email 建立一個帳號（可以先設一組共同的初始密碼，之後請他們自己到系統裡改密碼，或用「傳送邀請信」的方式讓他們自己設定）
3. 這一步建立的帳號，就是之後大家登入系統用的帳號密碼

> 提醒：這裡建立的「登入帳號」跟系統裡「權限設定 → 系統帳號」是兩件事。
> 登入帳號負責「能不能打開這個系統」；
> 系統裡的「權限設定」負責「打開之後你是哪個角色、能看到哪些功能」。
> 建議兩邊用同一個 Email 對照，方便管理。

---

## 步驟三：把程式碼準備好

如果你是用 VS Code：

1. 打開 VS Code → 「檔案」→「開啟資料夾」→ 建立一個新的空資料夾（例如桌面上的 `company-management-system`）並開啟它
2. 把我提供的專案檔案全部放進這個資料夾裡（維持原本的資料夾結構：`src/`、`supabase/` 等）
3. 打開 VS Code 的終端機（選單「檢視 → 終端機」），依序執行：

```bash
npm install
```

4. 複製 `.env.example`，改名成 `.env.local`，把裡面兩個值換成步驟一記下來的 Supabase 網址跟金鑰：

```
VITE_SUPABASE_URL=你的 Project URL
VITE_SUPABASE_ANON_KEY=你的 anon public 金鑰
```

5. 本機測試看看：

```bash
npm run dev
```

終端機會顯示一個網址（通常是 `http://localhost:5173`），打開瀏覽器貼上網址，應該會看到登入畫面，用步驟二建立的帳號登入試試看。

---

## 步驟四：把程式碼放上 GitHub

1. 到 GitHub 建立一個新的 repository（可以設為 Private，只有你們公司看得到）
2. 在 VS Code 終端機依序執行（`your-repo-url` 換成 GitHub 給你的網址）：

```bash
git init
git add .
git commit -m "初始版本"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```

> 如果沒裝過 Git，Windows 到 https://git-scm.com 下載安裝即可，Mac 通常已內建。

---

## 步驟五：部署到 Vercel

1. 登入 https://vercel.com → 「Add New → Project」
2. 選擇剛剛推上去的 GitHub repository → 「Import」
3. Vercel 會自動偵測是 Vite 專案，設定通常不用改
4. 在「Environment Variables」這一步，加入跟 `.env.local` 一樣的兩個變數：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. 按「Deploy」，等 1–2 分鐘

部署完成後，Vercel 會給你一個網址（例如 `company-management-system.vercel.app`），
之後同事只要打開這個網址、用自己的帳號密碼登入，就能一起使用同一份公司資料了。

---

## 步驟六（選用）：換成公司自己的網域

如果你有自己的網域（例如 `company.com`）：

1. Vercel 專案裡「Settings → Domains」→ 輸入你的網域
2. Vercel 會給你一組 DNS 設定值，拿去你買網域的地方（GoDaddy／Cloudflare／台灣的網域商）設定一下
3. 等待生效（通常幾分鐘到幾小時），之後就能用 `https://company.com` 打開系統

---

## 之後資料存在哪？可以匯出嗎？

所有資料都存在 Supabase 的 Postgres 資料庫裡（`app_storage` 這張表）。
Supabase 後台「Table Editor」可以直接看到、也能匯出成 CSV 備份。

---

## 遇到問題怎麼辦？

把錯誤訊息或截圖直接貼給我，我可以幫你判斷是哪一步出問題、該怎麼修正。
