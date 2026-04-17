<!-- SPECTRA:START v1.0.1 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `/spectra:*` skills when:

- A discussion needs structure before coding → `/spectra:discuss`
- User wants to plan, propose, or design a change → `/spectra:propose`
- Tasks are ready to implement → `/spectra:apply`
- There's an in-progress change to continue → `/spectra:ingest`
- User asks about specs or how something works → `/spectra:ask`
- Implementation is done → `/spectra:archive`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? Plan mode → `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `/spectra:apply` and `/spectra:ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

---

# Project: 絕境同盟（Desolate Bond）

網頁多人 Roguelite 倖存者遊戲，2–4 人合作通關三個 Boss 關卡。

## Tech Stack

- **Frontend**: React 19 + Phaser 3 + Tailwind CSS v4 + shadcn/ui（Vite）
- **Backend**: Node.js + Express 5 + Colyseus 0.16（WebSocket）
- **Database**: PostgreSQL（本機 Docker；正式環境 Neon）
- **Language**: TypeScript（全端）
- **Monorepo**: npm workspaces（`packages/client`、`packages/server`）

## Dev Commands

```bash
# 啟動全端開發（concurrently）
npm run dev

# 單獨啟動
npm run dev:client   # Vite dev server
npm run dev:server   # tsx watch

# 本機資料庫（Docker）
docker compose up -d       # 啟動 PostgreSQL + pgweb
docker compose down        # 關閉
# pgweb UI: http://localhost:8080

# 建置
npm run build
```

## Architecture

採用 Clean Architecture 分層，遊戲邏輯與框架完全解耦：

```
Presentation  ← Phaser 3 Scene / React Component（渲染與輸入）
Application   ← Use Cases / Game Commands（協調 domain 物件）
Domain        ← 純 TypeScript：Player, Boss, Skill, Room（無框架依賴）
Infrastructure ← Colyseus Room / Neon DB / QRCode（實作介面）
```

## Key Design Decisions

- **Server-Authoritative**：伺服器持有唯一遊戲狀態，客戶端只送輸入
- **Colyseus Schema delta 同步**：每 tick（60ms）只廣播變化欄位
- **Bot AI** 與真人共用 `PlayerInput` 介面，伺服器端 `BotController` 每 tick 產生輸入
- **遊戲狀態機**：`LOBBY → SURVIVAL_PHASE → PRE_BOSS_SELECTION → BOSS_BATTLE → POST_BOSS_SELECTION → RESULT`
- **QR Code 進房**：客戶端生成，掃描後直接帶入房間碼
- **Telegraph System**：所有會造成傷害的 Boss pattern 與小怪特殊攻擊，都先廣播一個 `TelegraphSchema`（CIRCLE/SECTOR/LINE，含 startAt/fireAt）後延遲結算；伺服器 tick 掃 fireAt 到期觸發 resolve callback，客戶端純渲染紅色預警。上限 32 個，強制最小 300ms 預警。相關程式在 `GameRoom.scheduleTelegraph` 與 `resolveTelegraphs`。
- **Pattern / Behavior Registry**：Boss pattern 與小怪行為都是資料驅動 registry（`packages/server/src/domain/boss/patterns/` 與 `domain/enemy/`）。新增攻擊只要在對應目錄加一個 pattern/behavior 檔 + 註冊，不用改 GameRoom 核心 tick loop。每個 behavior 透過 `EnemyBehaviorContext` 與 GameRoom 溝通，local state 放在 `enemyLocalState` map。

## Database Schema

```sql
users (id, username, password_hash, is_guest, created_at)
game_sessions (id, room_id, started_at, ended_at, boss_count, player_count)
player_results (id, session_id, user_id, class, total_damage, survival_time, cleared, rank_score)
```

## Deployment

- **Frontend**: Cloudflare Pages
- **Backend**: Railway
- **Database**: Neon（serverless PostgreSQL）
