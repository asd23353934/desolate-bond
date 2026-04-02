## Why

絕境同盟（Desolate Bond）是一款網頁多人 Roguelite 倖存者遊戲，玩家以 2–4 人小隊合作通過三個 Boss 關卡。目前專案從零開始，需要建立完整的遊戲核心架構與所有子系統。

## What Changes

- 建立前端遊戲引擎（Phaser 3）與後端多人伺服器（Colyseus）的完整專案架構
- 實作房間管理系統（房間碼建房、加入、Bot 填補、QR Code 掃碼進房）
- 實作強化期玩法（自動攻擊、地圖探索、經驗升級、技能選擇、裝備撿取）
- 實作 Boss 戰系統（2 階段 Boss、自動攻擊、走位閃避、全員選技能/獎勵流程）
- 實作職業系統（坦克/輸出/輔助，職業專屬技能 + 通用技能池，協作技能）
- 實作多人同步（Server-Authoritative、玩家移動、傷害、狀態廣播）
- 實作 Bot AI（完整 AI：閃避、救援倒地隊友、使用協作技能）
- 實作玩家生命週期（倒地、求救 Ping、隊友救援、全滅結算）
- 實作帳號系統（輕量帳號：暱稱+密碼，訪客模式）
- 實作統計與排行榜（多分項榜：最快通關、最高傷害、最高存活率）
- 實作遊戲設定（音量、傷害數字開關、畫質、按鍵設定）
- 採用整潔架構（Clean Architecture）：Domain / Application / Infrastructure / Presentation 分層，遊戲邏輯與 Phaser/Colyseus 框架解耦
- 設計 WebSocket 傳輸效率：Colyseus Schema delta 同步，每 tick 只廣播變化欄位，避免全量廣播

## Non-Goals

- 手機版（v1.1 再做，MVP 僅電腦版）
- 成就系統
- 好友系統 / 遊戲內聊天
- 多語言支援（中文唯一）
- 永久進度系統（無帳號等級、永久解鎖）
- 隨機地圖生成（地圖固定，僅資源點位置隨機）
- 裝備交換
- 付費/商城系統

## Capabilities

### New Capabilities

- `room-management`：房間碼建房與加入、QR Code 掃碼進房、Bot 填補空位、等待大廳職業預選
- `player-auth`：輕量帳號（暱稱+密碼）與訪客模式
- `game-session`：單次 Run 的完整生命週期管理（強化期 → Boss 戰 → 結算）
- `survival-phase`：強化期玩法（自動攻擊、地圖探索、經驗/升級/技能選擇、裝備/資源撿取、菁英怪）
- `boss-battle`：Boss 戰系統（2 階段 Boss、全員選技能/獎勵暫停介面、30 秒倒數）
- `class-system`：職業系統（坦克/輸出/輔助、職業專屬技能、通用技能池、協作技能）
- `equipment-system`：裝備系統（武器 1 件 + 被動道具 4 件、強化石自動升級最強裝備）
- `multiplayer-sync`：Server-Authoritative 多人同步（移動、傷害、狀態、難度線性縮放）
- `bot-ai`：完整 Bot AI（閃避 Boss 技能、救援倒地隊友、使用協作技能）
- `player-lifecycle`：玩家倒地/求救 Ping/隊友救援/全滅結算流程
- `stats-leaderboard`：統計與多分項排行榜（最快通關、最高傷害、最高存活率）
- `game-settings`：遊戲設定（音量、傷害數字、畫質、按鍵）

### Modified Capabilities

（無現有 spec）

## Impact

- 受影響的程式碼：全新專案，所有檔案皆為新建
- 前端：Phaser 3 + Tailwind CSS + shadcn/ui
- 後端：Node.js + Colyseus（WebSocket）
- 資料庫：Neon（PostgreSQL）
- 部署：Cloudflare Pages（前端）、Railway（後端）、Neon（資料庫）
- 素材：Kenney.nl（角色/地圖/UI，CC0）、OpenGameArt（特效/BGM）、Freesound（音效）
