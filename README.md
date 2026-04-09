# 絕境同盟（Desolate Bond）

網頁多人 Roguelite 倖存者遊戲。2–4 人合作組隊，通過三個 Boss 關卡。

## 玩法概覽

- **強化期**：自動攻擊怪物、收集裝備、升級選技能
- **Boss 戰**：2 階段 Boss、全員暫停選技能/獎勵
- **職業系統**：坦克 / 輸出 / 輔助，各有專屬技能與協作技能
- **多人支援**：支援 Bot 填補空位，掃 QR Code 快速加入

## Tech Stack

| 層 | 技術 |
|---|---|
| 前端遊戲引擎 | Phaser 3 |
| 前端 UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| 打包工具 | Vite |
| 後端框架 | Node.js + Express 5 |
| 多人同步 | Colyseus 0.16（WebSocket） |
| 資料庫 | PostgreSQL（本機 Docker / 正式 Neon） |
| 語言 | TypeScript（全端） |

## 本機開發

### 前置需求

- Node.js 20+
- Docker（本機資料庫）

### 安裝

```bash
npm install
```

### 啟動資料庫

```bash
docker compose up -d
```

- PostgreSQL：`localhost:5432`（`dev` / `dev` / `desolate_bond`）
- pgweb 管理介面：http://localhost:8080

### 啟動開發伺服器

```bash
npm run dev          # 同時啟動 client + server
npm run dev:client   # 只啟動前端（Vite）
npm run dev:server   # 只啟動後端（tsx watch）
```

### 建置

```bash
npm run build
```

## 專案結構

```
desolate-bond/
├── packages/
│   ├── client/          # 前端（React + Phaser 3）
│   └── server/          # 後端（Express + Colyseus）
├── openspec/
│   ├── changes/         # Spectra 變更提案
│   └── specs/           # 功能規格
├── docker-compose.yml   # 本機 PostgreSQL + pgweb
└── package.json         # Monorepo 根設定
```

## 架構設計

採用 **Clean Architecture** 分層，遊戲邏輯與框架完全解耦：

```
Presentation  ← Phaser 3 Scene / React Component
Application   ← Use Cases / Game Commands
Domain        ← 純 TypeScript：Player, Boss, Skill（無框架依賴）
Infrastructure ← Colyseus Room / Neon DB / QRCode
```

### 多人同步

- **Server-Authoritative**：伺服器持有唯一遊戲狀態
- 客戶端只送輸入指令（移動方向），不送位置
- Colyseus Schema **delta 同步**：每 tick（60ms）只廣播變化欄位
- 客戶端對其他玩家做線性插值（Lerp）平滑移動

### 遊戲狀態機

```
LOBBY → SURVIVAL_PHASE → PRE_BOSS_SELECTION → BOSS_BATTLE → POST_BOSS_SELECTION → RESULT
```

## 部署

| 服務 | 平台 |
|---|---|
| 前端 | Cloudflare Pages |
| 後端 | Railway |
| 資料庫 | Neon（serverless PostgreSQL） |

## Non-Goals（MVP 範圍外）

- 手機版（v1.1 再加觸控層）
- 好友系統 / 遊戲內聊天
- 永久進度系統（無帳號等級、永久解鎖）
- 隨機地圖生成（地圖固定，只有資源點隨機）
- 付費 / 商城系統
