## Context

絕境同盟是全新網頁多人 Roguelite 倖存者遊戲，從零開始建立。核心挑戰在於：
- 即時多人同步（WebSocket，2–4 人）需要 Server-Authoritative 架構避免作弊與狀態不一致
- 遊戲狀態複雜（強化期 + Boss 戰 + 多個子系統並行），需要清晰的狀態機設計
- Bot AI 需具備完整能力（閃避、救援、協作技能），與真人行為一致
- 網頁平台需兼顧效能（Phaser 3 Canvas 渲染）與跨瀏覽器相容性

## Goals / Non-Goals

**Goals:**

- 建立可運作的 MVP：房間系統、強化期、Boss 戰、結算排行榜
- Server-Authoritative 多人同步，客戶端僅負責輸入與渲染
- 清晰的遊戲狀態機，各階段（等待/強化期/選技能/Boss 戰/選獎勵/結算）明確分離
- Bot AI 與真人玩家共用相同的輸入介面，行為可測試
- 資料庫設計支援多分項排行榜查詢效能

**Non-Goals:**

- 手機版（MVP 不做，v1.1 再加觸控層）
- 反作弊進階機制（Server-Authoritative 已提供基本保護）
- 水平擴展 / 多伺服器負載均衡（MVP 單一 Railway 實例）
- 離線模式

## Decisions

### 前端框架：Phaser 3 + React 分層架構

遊戲畫布（Canvas）由 Phaser 3 管理，大廳/排行榜等非遊戲 UI 由 React + Tailwind CSS + shadcn/ui 管理。兩者共用同一個網頁應用，路由切換：大廳頁面 → 遊戲頁面（掛載 Phaser canvas）→ 結算頁面。

替代方案考量：純 Phaser（UI 複雜度高，難維護）→ 棄用；純 React canvas（效能差，生態弱）→ 棄用。

### 後端框架：Colyseus（Node.js）

Colyseus 的 Room 模型天然對應「一局遊戲」的生命週期，內建狀態同步（`@colyseus/schema`）與房間管理。

替代方案考量：Socket.IO 手刻（需自行管理狀態同步，複雜度高）→ 棄用；Nakama（功能過重，學習成本高）→ 棄用。

### 同步架構：Server-Authoritative + 客戶端插值

伺服器持有唯一遊戲狀態，每個 Tick（60ms）廣播給所有客戶端。客戶端送輸入指令（移動方向、無操作）而非位置。客戶端對其他玩家做線性插值（Lerp）平滑移動。

自動攻擊邏輯在伺服器計算，客戶端播放特效。

### 遊戲狀態機

每個 Colyseus Room 維護一個狀態機：

```
LOBBY → SURVIVAL_PHASE → PRE_BOSS_SELECTION → BOSS_BATTLE → POST_BOSS_SELECTION → [下一關 or GAME_OVER] → RESULT
```

- `PRE_BOSS_SELECTION`：全員選技能，30 秒倒數，時間到自動隨機
- `POST_BOSS_SELECTION`：全員選 Boss 獎勵（3 選 1），30 秒倒數
- 狀態轉換只由伺服器觸發，客戶端監聽狀態變化更新 UI

### Bot AI 架構

Bot 與真人玩家共用相同的輸入介面（`PlayerInput`）。伺服器端每個 Bot 有獨立的 `BotController`，每個 Tick 根據遊戲狀態產生輸入：

- **移動**：狀態機（閒置/追怪/閃避/救援）
- **閃避**：偵測 Boss 技能投射物，計算逃脫方向
- **救援**：偵測倒地隊友，靠近後觸發救援動作
- **技能選擇**：隨機選擇（可後期改為啟發式算法）

### 資料庫 Schema

```
users (id, username, password_hash, is_guest, created_at)
game_sessions (id, room_id, started_at, ended_at, boss_count, player_count)
player_results (id, session_id, user_id, class, total_damage, survival_time, cleared, rank_score)
```

排行榜查詢透過 `player_results` 的索引（`cleared`、`total_damage`、`survival_time`）實現，Neon 的 serverless PostgreSQL 適合此查詢模式。

### 難度線性縮放公式

```
Boss 血量 = 基礎血量 × (1 + (玩家數 - 1) × 0.6)
Boss 傷害 = 基礎傷害 × (1 + (玩家數 - 1) × 0.4)
```

1 人時為基礎值，4 人時 Boss 血量 ×2.8、傷害 ×2.2。數值在測試後可調整。

### 資源點隨機化

地圖 Tilemap 固定（Kenney Tileset），但血包、裝備、強化石的生成位置每局從預定義的「可生成節點池」隨機挑選，保留探索感同時避免隨機生成的實作複雜度。

### 整潔架構（Clean Architecture）

前後端均採用 Clean Architecture 分層，遊戲邏輯與框架完全解耦：

```
Presentation  ← Phaser 3 Scene / React Component（只處理渲染與輸入）
Application   ← Use Cases / Game Commands（協調 domain 物件）
Domain        ← 純 TypeScript：Player, Boss, Skill, Room（無任何框架依賴）
Infrastructure ← Colyseus Room adapter / Neon DB / QRCode lib（實作介面）
```

- Domain 層不 import 任何 Phaser / Colyseus / Express 模組
- 依賴反轉（DI）：Infrastructure 實作 Domain 定義的 interface，由 Application 層注入
- 優點：domain 邏輯可用純 Jest 測試，不需啟動遊戲引擎

替代方案考量：平鋪式架構（快速但難維護擴充）→ 棄用；Monolithic service（難以測試 game logic）→ 棄用。

### QR Code 進房機制

建房成功後，伺服器回傳房間碼，前端用 `qrcode` 套件（client-side）生成指向 `?room=<code>` 的 QR Code 圖片，顯示於等待大廳。玩家用手機掃描後直接開啟網頁並自動帶入房間碼加入。

- QR Code 內容為完整 URL：`https://<domain>/?room=<6-char-code>`
- 生成在客戶端，不需後端額外 API
- 手機掃描後走現有「Player can join a room by entering a room code」流程，無需新增邏輯

### WebSocket 傳輸效率（Token 節省）

Colyseus `@colyseus/schema` 原生支援 delta 同步，只廣播變化的欄位。需確保 Schema 設計不引入不必要的廣播：

- 靜態資料（地圖、技能定義）**不放入** Schema，改為客戶端本地查表
- 高頻變化欄位（position x/y）使用 `float32` 而非 `float64`，減少 payload 大小
- 低頻資料（裝備、技能列表）使用 `ArraySchema`，只在變更時觸發同步
- Boss 技能投射物使用獨立的輕量 Schema，不與玩家狀態混合廣播

## Risks / Trade-offs

- **Bot AI 複雜度高** → 先實作基本移動與攻擊，閃避與救援在 v1 後期迭代加入
- **Colyseus Schema 同步效能** → 限制每個 Room 最多 4 人，廣播頻率 60ms，預期不成問題
- **Neon 冷啟動延遲** → 排行榜查詢加 connection pool，遊戲中不直接查詢 DB（只在結算時寫入）
- **Phaser 3 + React 整合** → Phaser canvas 掛載於 React ref，生命週期需小心管理（unmount 時 destroy Phaser instance）
- **選技能介面在遊戲不暫停時的 UX** → 升級 UI 覆蓋在 canvas 上，玩家需邊閃避邊選技能，保留壓力感但需確保 UI 不遮擋關鍵視野

## Open Questions

- 強化期每關倒數計時長度（建議 3 分鐘，待測試確認）
- 菁英怪定時刷新間隔（建議每 90 秒一次）
- Bot AI 閃避半徑與反應時間的具體數值
