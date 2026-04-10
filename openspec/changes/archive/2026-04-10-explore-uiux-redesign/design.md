## Context

目前 React 頁面使用 @base-ui/react + Tailwind CSS v4 的預設樣式，視覺上接近一般管理後台，與「Roguelite 生存遊戲」的定位不符。探索流程分兩階段：先用 v0.dev 生成設計稿並確認風格，再逐頁整合代碼。

現有技術限制：
- Tailwind CSS v4（無 `tailwind.config.ts`，改用 CSS 變數 `@theme` 宣告於 `index.css`）
- shadcn/ui 元件架構（CVA 變體、`cn()` 工具）
- @base-ui/react 提供 Headless 元件基礎，樣式完全由 Tailwind class 控制
- 不可更換框架或元件庫基礎結構

## Goals / Non-Goals

**Goals:**

- 確立遊戲視覺風格指南（色彩 token、字體、邊框、陰影、按鈕樣式）
- 用 v0.dev 逐頁生成設計稿，評估可用性
- 將 v0.dev 輸出整合進現有 `.tsx` 頁面與 `components/ui/`
- 確保每頁在本機開發環境可正常渲染（無 console error、版型不破版）
- 保留現有功能邏輯，只替換視覺層

**Non-Goals:**

- 不處理 Phaser 3 遊戲內 HUD 視覺
- 不修改任何 API 呼叫或狀態管理邏輯
- 不為行動裝置做 RWD 優化（本次聚焦桌面版）
- 不引入動畫庫（framer-motion 等）

## Decisions

### 視覺風格：黑暗奇幻（Dark Fantasy）

選擇黑暗奇幻風格作為基準，理由：
- 符合「絕境同盟」遊戲名稱與 Roguelite 類型定位
- Hades / Dead Cells 已驗證此風格受玩家認可
- 深色背景可減少眼睛疲勞（長時間遊玩）
- 相較賽博龐克，深色+金色的配色更易在 Tailwind CSS 中實現並保持一致性

色彩方向（Tailwind CSS v4 OKLCH token）：
- 背景：極深灰黑（`oklch(8% 0.01 260)`）
- 主強調色：暗金（`oklch(72% 0.15 85)`）
- 次強調色：深紅（`oklch(45% 0.18 25)`）
- 文字：米白（`oklch(92% 0.01 85)`）
- 邊框：帶金屬感深灰（`oklch(25% 0.02 260)`）

字體方向：
- 保留 Geist Variable 作為 UI 文字（可讀性優先）
- 考慮引入一套 Google Fonts 中免費的奇幻風標題字體（如 Cinzel 或 MedievalSharp），僅用於大標題

### v0.dev 整合策略：逐頁複製代碼

v0.dev 輸出 React + Tailwind JSX，整合方式：
1. 以對話描述目標頁面功能與風格，取得設計稿
2. 複製 v0.dev 輸出的 JSX 結構
3. 手動對照現有頁面的 props/state/handler，將邏輯接回
4. 若 v0.dev 引入了新元件，評估是否納入 `components/ui/`

**不採用**「全頁直接替換」，原因：v0.dev 輸出的 JSX 不含業務邏輯，直接覆蓋會斷開 Colyseus 狀態連線與路由跳轉。

### 設計令牌更新：修改 index.css

Tailwind v4 使用 `@theme { --color-* }` 語法宣告 CSS 變數，元件透過 `bg-background`、`text-foreground` 等語義化 class 引用。

更新步驟：
1. 修改 `index.css` 的 `:root` 與 `.dark` 區塊，替換 OKLCH 顏色值
2. 驗證現有元件（Button、Card 等）顏色是否正確反映
3. 必要時更新 CVA 變體 class（如 `border-border` 改為 `border-gold`）

## Risks / Trade-offs

- **v0.dev 輸出與現有元件結構不符** → 需手動對齊 CVA 變體與 data-* 屬性，預期每頁需 30–60 分鐘整合時間
- **標題字體載入失敗** → 回退為 Geist Variable，不影響功能
- **設計令牌改動影響範圍廣** → 先改 token 後，所有頁面需目視確認，特別是 Input 的 focus/invalid 狀態與 Button 的 disabled 狀態
- **v0.dev 可能生成 Tailwind v3 語法**（如 `bg-zinc-900`）而非 v4 語義 class → 整合時需手動替換為 `bg-background` 等語義 class，或直接保留具體色值（兩者在 v4 均可運作）
