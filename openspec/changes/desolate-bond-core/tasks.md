## 1. 專案初始化與架構設定

- [x] 1.1 建立前端專案（Vite + React + TypeScript），安裝 Phaser 3、Tailwind CSS、shadcn/ui、qrcode
- [x] 1.2 建立後端專案（Node.js + TypeScript），安裝 Colyseus、pg（Neon PostgreSQL 驅動）
- [x] 1.3 設定前後端 monorepo 結構（packages/client、packages/server），依整潔架構（Clean Architecture）建立目錄：domain/、application/、infrastructure/、presentation/
- [x] 1.4 設定 Cloudflare Pages 部署前端、Railway 部署後端的 CI/CD 流程
- [x] 1.5 建立 Neon 資料庫並設定連線字串；依前端框架：Phaser 3 + React 分層架構與後端框架：Colyseus（Node.js）建立初始目錄結構
- [x] 1.6 定義 Domain 層介面（IPlayerRepository、IRoomRepository、IGameSession）確保 Infrastructure 對 Domain 的依賴反轉（DI）；驗證 domain 層不 import 任何 Phaser/Colyseus 模組

## 2. 資料庫 Schema

- [x] 2.1 建立 users 資料表（id, username, password_hash, is_guest, created_at）
- [x] 2.2 建立 game_sessions 資料表（id, room_id, started_at, ended_at, boss_count, player_count）
- [x] 2.3 建立 player_results 資料表（id, session_id, user_id, class, total_damage, survival_time, cleared, clear_time）並建立排行榜查詢所需索引

## 3. 帳號系統（player-auth）

- [x] 3.1 實作 Player can register a lightweight account API（POST /auth/register），username + password，不需 Email，重複 username 回傳錯誤
- [x] 3.2 實作 Registered player can log in API（POST /auth/login），驗證後回傳 JWT session token，錯誤時回傳通用錯誤訊息
- [x] 3.3 實作 Player can play as a guest without registration：只需 display name，建立臨時 session，不寫入 users 表，關閉瀏覽器後不保留
- [x] 3.4 實作 Guest can appear on the leaderboard：訪客結果提交至排行榜時附加 guest indicator 標記
- [x] 3.5 建立登入/註冊/訪客選擇 UI 頁面（React + shadcn/ui）

## 4. 房間管理系統（room-management）

- [x] 4.1 實作 Host can create a room with a unique code：建立房間時產生唯一 6 碼英數房間碼，顯示給 Host
- [x] 4.1a 實作 QR Code 進房機制（QR Code is displayed in waiting lobby）：客戶端用 `qrcode` 生成指向 `<origin>/?room=<code>` 的 QR Code 圖片，顯示於等待大廳；掃描後自動帶入房間碼觸發加入流程
- [x] 4.2 實作 Player can join a room by entering a room code：驗證房間碼有效性、狀態為 LOBBY、人數未滿 4 人，無效時顯示錯誤；支援 URL query parameter `?room=<code>` 自動帶入
- [x] 4.3 實作 Host can add Bot players to fill empty slots：Host 可新增/移除 Bot（最多 3 個 Bot，至少 1 個真人）
- [x] 4.4 實作 Players select their class in the waiting lobby：職業選擇即時同步給所有大廳成員
- [x] 4.5 實作 Host can start the game when all players are ready：所有真人玩家選好職業後 Host 才可按開始，否則顯示哪位玩家未選
- [x] 4.6 開始後所有客戶端轉換至 SURVIVAL_PHASE

## 5. 遊戲 Session 狀態機（game-session）

- [x] 5.1 實作遊戲狀態機（A game session progresses through defined states）：LOBBY → SURVIVAL_PHASE → PRE_BOSS_SELECTION → BOSS_BATTLE → POST_BOSS_SELECTION → (下一關 or GAME_OVER) → RESULT，狀態轉換只由伺服器觸發
- [x] 5.2 實作 A complete run consists of exactly 3 rounds：回合計數器，第 3 回合 Boss 結束後進入 RESULT 而非新回合
- [x] 5.3 實作 All players downed simultaneously triggers game over：所有玩家同時進入 DOWNED 時伺服器在 1 tick 內轉換至 GAME_OVER
- [x] 5.4 實作 Session result is recorded on completion：RESULT 狀態時每位玩家寫入一筆 player_results，成功失敗皆記錄

## 6. 多人同步架構（multiplayer-sync）

- [x] 6.1 實作同步架構：Server-Authoritative + 客戶端插值；Server is the authoritative source of all game state，客戶端只送 PlayerInput 指令
- [x] 6.2 實作 Server broadcasts game state to all clients on each tick：Colyseus Schema 每 60ms 廣播 delta 給所有客戶端
- [x] 6.3 實作 Clients interpolate remote player positions for smooth rendering：客戶端對遠端玩家做線性插值（Lerp）平滑渲染
- [x] 6.4 實作 Disconnected players are replaced by a Bot：玩家斷線後 3 秒內 Bot 繼承其完整狀態（位置、HP、技能、裝備）
- [x] 6.5 實作難度線性縮放公式（Difficulty scales linearly with active player count）：每次進入 Boss 戰前依當前玩家數重新計算 HP 與傷害，公式 HP = base × (1 + (count−1) × 0.6)
- [x] 6.6 設計 WebSocket 傳輸效率（Token 節省）：靜態資料（技能定義、地圖）不放入 Colyseus Schema 改為客戶端本地查表；position 欄位使用 float32；裝備/技能列表用 ArraySchema；Boss 投射物用獨立輕量 Schema

## 7. 強化期玩法（survival-phase）

- [x] 7.1 實作 Phaser 3 場景：載入 Kenney Tileset 固定地圖，設定碰撞層，Players move freely on the fixed map
- [x] 7.2 實作 WASD 移動輸入：客戶端送出 PlayerInput，伺服器更新位置並廣播
- [x] 7.3 實作 Players attack automatically targeting the nearest enemy：伺服器每 tick 計算最近目標應用傷害，客戶端播放特效
- [x] 7.4 實作 Players gain experience from killing enemies and level up：擊殺給予經驗，累積達門檻觸發 level up，遊戲不暫停
- [x] 7.5 實作技能選擇 UI（遊戲不暫停）：level up 時彈出 3 個選項，Skill selection UI presents 3 options on level up，最多 6 個技能
- [x] 7.6 實作資源點隨機化（Items and resources spawn at randomized positions each run）：每局從預定義節點池隨機選取血包、裝備、強化石生成位置
- [x] 7.7 實作 Elite enemies spawn on a fixed interval during survival phase：定時刷新菁英怪，掉落增強獎勵
- [x] 7.8 實作 Killing enemies restores a small amount of HP：擊殺後 HP 增加固定值，上限為最大 HP
- [x] 7.9 實作 Survival phase runs for a fixed countdown duration：倒數計時器，時間到自動觸發 PRE_BOSS_SELECTION

## 8. 職業系統（class-system）

- [x] 8.1 定義 Three distinct classes are available with different base stats：坦克（高 HP）、輸出（高攻擊）、輔助（均衡+治療加成）基礎數值
- [x] 8.2 實作 Each class has a dedicated skill pool 與 A shared common skill pool is accessible by all classes：職業專屬池 + 共通池資料結構
- [x] 8.3 實作 level up 技能抽選邏輯：從職業池 + 共通池組合抽出 3 個選項
- [ ] 8.4 實作 Cooperative skills enable class interactions：輔助協作技能可觸發對附近隊友（含 Bot）的效果
- [ ] 8.5 實作 Class is locked for the entire run after game start：遊戲開始後拒絕任何職業更換請求

## 9. 裝備系統（equipment-system）

- [ ] 9.1 定義 Each player can hold one weapon and up to four passive items 資料結構：武器 1 格、被動道具 4 格
- [ ] 9.2 實作 Equipment is picked up by walking over it：玩家碰撞到物品 hitbox 自動拾取，武器替換舊武器，被動道具滿則不拾取
- [ ] 9.3 實作 Upgrade stones automatically upgrade the player's strongest item：撿到強化石時自動提升最高等級裝備，同等級取最低 index
- [ ] 9.4 實作 Equipped items affect player stats and behavior：裝備/替換時即時更新玩家有效屬性
- [ ] 9.5 確認 Items are not shareable between players：UI 與輸入映射中不提供任何轉移物品操作

## 10. Boss 戰系統（boss-battle）

- [ ] 10.1 定義 Each round features a unique Boss with distinct behavior：3 個 Boss 的攻擊模式、移動行為、外觀素材資料
- [ ] 10.2 實作 Boss enters a frenzied second phase at 50% HP：HP 降至 50% 觸發 phase-change 事件，更新至 phase 2 行為
- [ ] 10.3 實作 Pre-boss selection pauses progression for skill selection：PRE_BOSS_SELECTION UI，全員選技能，30 秒倒數自動隨機選
- [ ] 10.4 實作 Post-boss reward selection pauses progression：POST_BOSS_SELECTION UI（3 選 1），30 秒倒數自動隨機選
- [ ] 10.5 實作 Boss HP and damage scale linearly with player count（依 multiplayer-sync 規格公式計算）
- [ ] 10.6 實作 Players attack the Boss automatically：玩家自動攻擊 Boss，無友傷

## 11. Bot AI（bot-ai）

- [ ] 11.1 實作 Bot AI 架構 BotController，Bot uses the same input interface as human players：每 tick 產生 PlayerInput，遊戲邏輯不區分 Bot 與真人
- [ ] 11.2 實作 Bot navigates toward enemies and avoids obstacles：CHASE_ENEMY 狀態，移動至最近敵人並繞過障礙物
- [ ] 11.3 實作 Bot dodges Boss projectiles and area attacks：DODGE 狀態，偵測投射物進入閾值半徑時移動至垂直逃脫方向
- [ ] 11.4 實作 Bot rescues downed teammates：RESCUE 狀態，導航至倒地玩家並在到達時觸發救援動作
- [ ] 11.5 實作 Bot activates cooperative skills when conditions are met：條件達成時（隊友在範圍內）自動觸發協作技能
- [ ] 11.6 實作 Bot selects skills and rewards automatically：選擇事件觸發時立即隨機選擇一個選項

## 12. 玩家生命週期（player-lifecycle）

- [ ] 12.1 實作 Player enters downed state when HP reaches zero：HP 歸零時伺服器轉換至 DOWNED，停止移動與攻擊
- [ ] 12.2 實作 Downed player can send a rescue ping：倒地玩家發送求救信號，所有隊友螢幕顯示 3 秒位置指示器
- [ ] 12.3 實作 Active teammate can rescue a downed player：重疊 hitbox 並持續按住救援鍵後復活，受傷則取消
- [ ] 12.4 實作 Downed player can observe teammates' views while waiting：倒地玩家可按鍵切換跟隨不同隊友視角
- [ ] 12.5 確認 No friendly fire between players：攻擊 hitbox 對隊友不計算傷害

## 13. 統計與排行榜（stats-leaderboard）

- [ ] 13.1 實作 Player stats are tracked throughout each run：追蹤總傷害、承傷、擊殺數、倒地次數、救援次數、存活時間
- [ ] 13.2 實作 Run result is persisted to the database after each session：RESULT 狀態時批次寫入 player_results
- [ ] 13.3 實作 Multiple leaderboard categories are available：最快通關時間、最高傷害、最高存活時間三個獨立排行榜 API
- [ ] 13.4 實作 Guest entries appear on leaderboards with a guest marker：訪客條目顯示 guest indicator
- [ ] 13.5 實作 Results screen displays per-player stats after each run：結算畫面顯示所有玩家本局數據與最終回合數
- [ ] 13.6 建立排行榜 UI（React + shadcn/ui）

## 14. 遊戲設定（game-settings）

- [ ] 14.1 實作 Player can adjust master volume：主音量 slider 即時影響輸出，設定持久化（帳號/session）
- [ ] 14.2 實作 Player can toggle floating damage numbers：預設 ON，切換後立即生效，設定持久化
- [ ] 14.3 實作 Player can select a graphics quality preset（高/中/低）：低畫質減少粒子特效並停用陰影
- [ ] 14.4 實作 Player can remap keyboard keys：可重新指定移動鍵與救援鍵，重複 binding 時顯示衝突警告並拒絕儲存

## 15. 視覺與音效整合

- [ ] 15.1 匯入 Kenney.nl Tiny Dungeon 素材（角色、怪物 Sprite）至 Phaser 資源管理
- [ ] 15.2 匯入 Kenney.nl Tiny Town Tileset 並設定強化期地圖
- [ ] 15.3 匯入 Kenney.nl UI Pack 並套用至遊戲內 HUD（血條、技能欄、計時器）
- [ ] 15.4 整合 OpenGameArt 攻擊特效與升級特效至對應遊戲事件
- [ ] 15.5 整合 Freesound 音效（攻擊、受傷、升級、救援）至對應遊戲事件
- [ ] 15.6 整合 OpenGameArt BGM：強化期一首、Boss 戰一首，循環播放

## 16. 操作說明頁面

- [ ] 16.1 建立靜態操作說明頁面（React），涵蓋移動、自動攻擊、技能選擇、救援、設定說明
- [ ] 16.2 在主選單加入「操作說明」入口連結
