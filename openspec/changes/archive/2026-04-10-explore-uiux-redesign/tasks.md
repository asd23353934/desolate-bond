## 1. 確立視覺風格與設計令牌

- [x] 1.1 探索視覺風格方向：評估 Dark Fantasy、Eldritch、Pixel RPG、賽博奇幻，選定 Pixel Art RPG
- [x] 1.2 確認色彩值：`--pixel-bg: #0d0d1a`、`--pixel-amber: #f4a834`、`--pixel-teal: #4ecdc4`、`--pixel-red: #e84855` 等
- [x] 1.3 重寫 `index.css`：pixel token、scanline、dither-bg、cursor-blink、amber-blink、flicker keyframe
- [x] 1.4 加入 Google Fonts（Press Start 2P、VT323）至 `index.html`
- [x] 1.5 驗證：`vite build` 成功，TypeScript 無新增錯誤

## 2. 建立 Pixel UI 元件庫

- [x] 2.1 新建 `packages/client/src/components/pixel-ui.tsx`
- [x] 2.2 實作：PixelPanel、PixelButton（primary/secondary/danger）、PixelInput、PixelBadge、PixelProgressBar、PixelToggle、PixelTabs、PixelDivider、PixelSlider、PixelRadioGroup、FloatingParticles
- [x] 2.3 安裝 `framer-motion@11`（v12 不相容 Vite 8/rolldown）
- [x] 2.4 驗證：TypeScript 編譯無錯誤

## 3. 頁面整合（v0.dev 生成 → 修正內容錯誤 → 整合業務邏輯）

- [x] 3.1 使用 prompt 在 v0.dev 生成全部 6 頁 pixel art 設計稿
- [x] 3.2 修正內容錯誤：DPS→DAMAGE、按鍵設定（只保留移動鍵）、職業數值改用 ClassDefs.ts 真實值、Boss Mechanics 移除虛構內容、救援機制改為自動靠近觸發
- [x] 3.3 AuthPage：pixel 外觀 + 原本 register/login/guest props 邏輯
- [x] 3.4 MainMenuPage：pixel 外觀 + useRoom/useGameSettings/子頁面路由
- [x] 3.5 LobbyPage：pixel 外觀 + Colyseus room state、職業選擇、Bot 管理
- [x] 3.6 LeaderboardPage：pixel 外觀 + API fetch、AnimatePresence 切換
- [x] 3.7 SettingsPage：pixel 外觀 + key rebinding 邏輯、單一 volume slider
- [x] 3.8 HelpPage：pixel 外觀 + 正確遊戲說明

## 4. 全域驗證

- [x] 4.1 `npx tsc --noEmit` 零新增錯誤（GameScene.ts 既有錯誤除外）
- [x] 4.2 `vite build` 成功（2130 modules，約 1.07s）
- [x] 4.3 dev server `http://localhost:5173` 回應 200
