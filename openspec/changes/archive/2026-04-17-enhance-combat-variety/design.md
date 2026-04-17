## Context

目前 Boss 與小怪攻擊在 `GameRoom.ts` tick 中直接執行傷害判定，沒有預警階段，玩家看到的第一個訊號就是扣血。Boss pattern 以字串 enum 分流（MELEE / CHARGE / PROJECTILE / AREA），擴充時需同步改多處 switch；小怪 AI 是無狀態的每 tick 計算距離。新機制必須在 Server-Authoritative 架構下運作（Client 不得自行判定命中），並透過 Colyseus Schema delta 同步預警。

## Goals / Non-Goals

**Goals:**

- 提供可復用的 telegraph 基礎設施：所有現有與未來 pattern 皆能共用 CIRCLE/SECTOR/LINE 三種形狀
- 解耦 pattern 定義與執行邏輯，新增 pattern 不需動核心 tick
- 小怪行為多樣化不破壞現有生成曲線（HP/數量/精英間隔維持現有公式）
- Client 端 telegraph 渲染容錯：晚到或遺失訊息不得導致無預警傷害（伺服器延遲傷害必與 telegraph 生命週期綁定）

**Non-Goals:**

- 不引入完整行為樹或 GOAP 等 AI 框架
- Telegraph 不支援動態追蹤（發出後位置固定；追蹤型 pattern 以多次短 telegraph 實作）
- 不新增 Boss/關卡；不改動 BotController（盟友 AI）
- 不設計可被玩家反制（格擋/反射）的 telegraph

## Decisions

### Telegraph 以 Schema 陣列廣播，伺服器持有到期時間

新增 `TelegraphSchema { id, shape: 'CIRCLE'|'SECTOR'|'LINE', x, y, radius, angle, length, width, startAt, fireAt }`，放在 `GameRoom` state 的 `telegraphs: MapSchema<TelegraphSchema>`。伺服器在排定攻擊時先 put telegraph，於 `fireAt` tick 執行傷害判定並移除；判定必定在伺服器端，Client 只做渲染。

**Alternatives**：
- 透過 Colyseus message 廣播（非 state）：較輕量但新加入房間的 Client 看不到進行中 telegraph，且 reconnect 會遺失。駁回。
- Telegraph 與 pattern 合併在 BossSchema：耦合度高、無法給小怪復用。駁回。

### Pattern 定義改為資料驅動（pattern registry）

新增 `packages/server/src/domain/boss/patterns/` 目錄，每個 pattern 輸出 `{ id, cooldownMs, execute(ctx) }`，由 registry 以 id 查表。`BossConfig` 的 phase attack list 改為持有 pattern id。小怪行為同樣 registry 化。

**Alternatives**：
- 保留 switch：每加一個 pattern 要動核心 tick，不符 open-closed。駁回。

### 傷害延遲以 scheduled events 而非每個 pattern 自管 timer

`GameRoom` 維護 `scheduledHits: Array<{ fireAt, resolve }>`，每 tick 掃描到期項目並解析。Telegraph 生成時同時 push scheduled hit。保證 telegraph 消失的 tick 就是傷害判定的 tick，永遠一致。

### 小怪類型擴充為 registry 結構

`EnemyType` 從 union 字串擴為 `EnemyBehaviorConfig { type, spawnWeight, hp, speed, onTick, onContact, onDeath }`。新 `exploder` 類型透過 onDeath/onContact hook 產生 CIRCLE telegraph 並延遲爆炸傷害。

## Risks / Trade-offs

- **Schema 陣列大小**：多 Boss pattern + 多小怪同時放 telegraph 可能讓 state 變大 → 限制同時存活 telegraph 上限（建議 32），超過時丟棄最舊者
- **Tick 對齊精度**：60ms tick 下 `fireAt` 只能取整；玩家看到的 telegraph 實際提前 0–60ms 消失 → 文件說明 telegraph 至少 300ms，不因單 tick 抖動產生不公平
- **Client 渲染延遲**：網路抖動會讓玩家看到的預警時間短於伺服器設定值 → telegraph 持續時間設計上保留 200ms 緩衝（實際傷害判定採伺服器時間，玩家若掉包會吃虧但不致命）
- **小怪 exploder 濫用**：死亡觸發爆炸可能造成連鎖 → 限制 exploder spawn weight 低，並對爆炸傷害設上限
- **現有存檔/session 相容性**：state schema 新增欄位，Colyseus 允許但需驗證 client/server 版本一致 → 前後端同步部署即可，無 migration
