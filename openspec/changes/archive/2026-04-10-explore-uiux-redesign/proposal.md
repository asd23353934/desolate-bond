## Why

現有 React 頁面（主選單、登入、大廳、排行榜、設定）採用預設 shadcn/ui 樣式，缺乏遊戲視覺風格，玩家第一印象差。需透過 v0.dev 工具探索並產出符合 Roguelite 遊戲氛圍的 UI 設計，再逐頁整合進代碼庫。

## What Changed（實際執行結果）

> 風格決策：探索期間評估了 Dark Fantasy、Eldritch、Pixel RPG、賽博奇幻四種方向，最終選定 **Pixel Art RPG**（Press Start 2P + VT323 字體、硬邊框、像素陰影、Framer Motion 動畫）。

- 使用 v0.dev 生成 pixel art 風格設計稿，修正遊戲設定不符之處後整合
- 確立 Pixel RPG 設計 token：`--pixel-bg / --pixel-amber / --pixel-teal / --pixel-red` 等
- 重寫 `index.css`：像素色彩 token、scanline overlay、dither pattern、cursor-blink 動畫
- 新建 `components/pixel-ui.tsx`：PixelPanel、PixelButton、PixelInput、PixelBadge、PixelProgressBar、PixelToggle、PixelTabs、PixelDivider、PixelSlider、PixelRadioGroup、FloatingParticles
- 逐頁替換全部 6 個頁面：保留原有業務邏輯 hooks，替換視覺層
- 加入 Google Fonts（Press Start 2P、VT323）至 `index.html`
- 安裝 `framer-motion@11`（v12 與 Vite 8/rolldown 不相容）

## Non-Goals

- 不修改 Phaser 3 遊戲場景內的 HUD（GameScene.ts 範疇另立提案）
- 不調整路由邏輯或頁面功能行為
- 不引入新的後端 API

## Capabilities

### New Capabilities

- `game-ui-theme`：Pixel RPG 視覺主題，涵蓋設計 token、全域動畫、pixel-ui 元件庫

### Modified Capabilities

（無既有 spec，本次為全新能力）

## Impact

- Affected specs: `game-ui-theme`（新建）
- Affected code:
  - `packages/client/index.html`（Google Fonts）
  - `packages/client/vite.config.ts`（無額外修改）
  - `packages/client/src/index.css`（全面重寫為 pixel token）
  - `packages/client/src/components/pixel-ui.tsx`（新建）
  - `packages/client/src/presentation/pages/AuthPage.tsx`
  - `packages/client/src/presentation/pages/MainMenuPage.tsx`
  - `packages/client/src/presentation/pages/LobbyPage.tsx`
  - `packages/client/src/presentation/pages/LeaderboardPage.tsx`
  - `packages/client/src/presentation/pages/SettingsPage.tsx`
  - `packages/client/src/presentation/pages/HelpPage.tsx`
