## Why

目前小怪僅 basic/ranged/elite 三種、行為固定（貼身或定速射擊），Boss 攻擊 pattern 只有 MELEE/CHARGE/PROJECTILE/AREA 且完全無 telegraph（預警）系統。玩家體驗退化為 DPS 檢定而非技能閃避，Boss 戰缺乏辨識度與張力。透過新增 telegraph 基礎設施、擴充 Boss pattern 種類、強化小怪行為，能讓戰鬥從「站樁互傷」變成「預判閃避與位置遊戲」。

## What Changes

- **新增 Telegraph 預警系統**：Server 端於 Boss/小怪施放攻擊前廣播 telegraph（形狀：CIRCLE / SECTOR / LINE；位置、半徑/角度、持續時間），Client 端 Phaser 渲染紅色警示，結束後才觸發實際傷害判定。
- **擴充 Boss 攻擊 pattern**：新增 `DASH_LINE`、`RING_BURST`、`SUMMON`、`BEAM` 四種 pattern，並依 Boss 主題重新分配：
  - GOLEM：MELEE + CHARGE + RING_BURST（Phase 2 加 SUMMON）
  - WRAITH：PROJECTILE + AREA + BEAM（Phase 2 加 RING_BURST）
  - DRAGON：MELEE + PROJECTILE + AREA + DASH_LINE（Phase 2 加 BEAM）
- **小怪行為多樣化**：
  - `ranged` 新增「走位射擊」：射擊前短暫停頓並顯示 LINE telegraph，射擊後側向位移
  - `basic` 新增「衝撞預警」：接觸傷害前 0.4s 顯示 LINE telegraph，命中提高傷害
  - 新增 `exploder` 小怪類型：低血量高速，死亡或近身觸發 CIRCLE telegraph 自爆
- Colyseus Schema 新增 `TelegraphSchema` 陣列，delta 同步預警狀態。

## Non-Goals

- 不新增新 Boss 或新關卡
- 不重寫 BotController AI（僅擴充敵對 AI）
- 不做小怪間協同行為（如陣型、掩護）
- 不加入玩家可擊破/反制的 telegraph（純閃避機制）

## Capabilities

### New Capabilities

- `telegraph-system`: Boss 與小怪攻擊的預警廣播、渲染與延遲傷害判定基礎設施

### Modified Capabilities

- `boss-battle`: 擴充 Boss 攻擊 pattern 種類與 phase 組合；Boss 所有傷害性 pattern 須先發 telegraph
- `survival-phase`: 小怪類型與行為擴充（ranged 走位、basic 衝撞預警、新增 exploder）

## Impact

- **Affected specs**: `telegraph-system`（新增）、`boss-battle`（修改）、`survival-phase`（修改）
- **Affected code**:
  - `packages/server/src/infrastructure/colyseus/LobbySchema.ts` — 新增 `TelegraphSchema`，擴充 Boss/Enemy schema
  - `packages/server/src/presentation/rooms/GameRoom.ts` — Boss pattern 執行、小怪 AI、telegraph 生命週期
  - `packages/server/src/domain/entities/BossDefs.ts` — BossAttackPattern 類型定義擴充
  - `packages/server/src/domain/boss/patterns/`（新增）— pattern registry 與各 pattern 實作檔
  - `packages/client/src/infrastructure/phaser/GameScene.ts` — Phaser telegraph 渲染層與小怪動畫狀態（蓄力/位移）
