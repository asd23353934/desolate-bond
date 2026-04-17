## 1. Telegraph 基礎設施（Server）

- [x] 1.1 依「Telegraph 以 Schema 陣列廣播，伺服器持有到期時間」決策，新增 `TelegraphSchema`（id / shape / 幾何欄位 / startAt / fireAt）並掛到 GameRoom state
- [x] 1.2 實作「Server broadcasts attack telegraphs before damaging pattern resolves」：提供 `scheduleTelegraph(shape, geom, leadMs)` API，強制最小 300ms 延遲
- [x] 1.3 依「傷害延遲以 scheduled events 而非每個 pattern 自管 timer」決策，於 GameRoom tick 實作 fireAt 到期掃描，滿足「Server resolves telegraphed damage exactly at fireAt and then removes the telegraph」
- [x] 1.4 實作「Telegraph capacity is bounded to protect state sync」：陣列上限 32，溢位時丟棄 startAt 最小者

## 2. Telegraph 渲染（Client）

- [x] 2.1 Phaser GameScene 新增 telegraph 渲染層，依 shape（CIRCLE/SECTOR/LINE）畫紅色預警並隨 startAt→fireAt 漸強
- [x] 2.2 監聽 telegraph MapSchema add/remove，滿足「Client renders telegraphs using geometry from room state」（純渲染、無本地傷害判定）

## 3. Boss Pattern Registry

- [x] 3.1 依「Pattern 定義改為資料驅動（pattern registry）」決策，新增 `packages/server/src/domain/boss/patterns/` 目錄與 registry，原 MELEE/CHARGE/PROJECTILE/AREA 改寫為獨立 pattern 檔
- [x] 3.2 新增 `DASH_LINE`、`RING_BURST`、`SUMMON`、`BEAM` 四個 pattern，依「Every damaging Boss pattern emits a telegraph before resolving」在 execute 時先 scheduleTelegraph 再延遲傷害
- [x] 3.3 依「Boss roster spans the extended attack pattern library」更新 BossDefs，GOLEM/WRAITH/DRAGON 分配 phase 1/phase 2 pattern 組合
- [x] 3.4 驗證「Boss enters a frenzied second phase at 50% HP」：phase 切換時 pattern 組合替換、至少一個新 pattern、移速提升

## 4. 小怪行為改寫

- [x] 4.1 依「小怪類型擴充為 registry 結構」決策，把 EnemyType 改為 EnemyBehaviorConfig（onTick / onContact / onDeath hooks）
- [x] 4.2 實作「Ranged enemies telegraph a line before each shot and reposition after firing」：400ms 蓄力 LINE telegraph + 射後 500ms 側向位移
- [x] 4.3 實作「Basic enemies telegraph a line before applying contact damage」：接觸傷害前 400ms LINE telegraph，離開判定區則不受傷
- [x] 4.4 新增 exploder 小怪類型，滿足「Exploder enemies self-destruct with a circular telegraph」（接觸或死亡觸發 CIRCLE telegraph，延遲爆炸）
- [x] 4.5 實作「Exploder spawn rate is constrained to prevent cascade explosions」：spawn weight ≤ 15% 且爆炸傷害設上限
- [x] 4.6 擴充「Elite enemies spawn on a fixed interval during survival phase」：elite 的區域攻擊改走 telegraph 流程

## 5. 整合與驗證

- [x] 5.1 `npm run build` 於 server 與 client 皆通過，無 type error
- [x] 5.2 實機跑完一場 survival → Boss 戰，確認 telegraph 預警可見、pattern 多樣化、小怪新行為觸發正常
- [x] 5.3 更新 CLAUDE.md 的架構章節（加入 telegraph system 與 pattern registry 說明）
