# telegraph-system Specification

## Purpose

TBD - created by archiving change 'enhance-combat-variety'. Update Purpose after archive.

## Requirements

### Requirement: Server broadcasts attack telegraphs before damaging pattern resolves

The system SHALL, before resolving any damaging attack that targets a spatial region (Boss pattern, small enemy area attack, explosion), publish a telegraph entry into shared room state containing: unique id, shape (`CIRCLE`, `SECTOR`, or `LINE`), anchor position (x, y), shape-specific geometry (radius for `CIRCLE`; radius and facing angle plus arc span for `SECTOR`; endpoint offset and width for `LINE`), `startAt` server timestamp, and `fireAt` server timestamp. The telegraph entry SHALL remain in room state until `fireAt` is reached. The minimum lead time between `startAt` and `fireAt` SHALL be at least 300 milliseconds.

#### Scenario: Telegraph precedes every damaging area pattern

- **WHEN** the server schedules a Boss or enemy attack that will deal damage to positions (not a direct melee contact tick)
- **THEN** the server inserts a telegraph entry into room state with `fireAt` at least 300 ms after `startAt`, and the damage SHALL NOT apply before `fireAt`

#### Scenario: Late-joining client sees in-progress telegraphs

- **WHEN** a client connects or reconnects while a telegraph is active in room state
- **THEN** the client receives the telegraph entry through Colyseus state sync and renders it immediately


<!-- @trace
source: enhance-combat-variety
updated: 2026-04-17
code:
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/server/src/domain/boss/patterns/beamPattern.ts
  - packages/server/src/domain/enemy/basicBehavior.ts
  - packages/server/src/domain/boss/patterns/areaPattern.ts
  - packages/server/src/domain/enemy/eliteBehavior.ts
  - packages/server/src/domain/enemy/exploderBehavior.ts
  - packages/server/src/domain/boss/patterns/projectilePattern.ts
  - packages/server/src/domain/boss/patterns/registry.ts
  - packages/server/src/domain/boss/patterns/dashLinePattern.ts
  - packages/server/src/domain/enemy/rangedBehavior.ts
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/domain/boss/patterns/meleePattern.ts
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/enemy/registry.ts
  - packages/server/src/domain/boss/patterns/types.ts
  - CLAUDE.md
  - packages/server/src/domain/boss/patterns/summonPattern.ts
  - packages/server/src/domain/boss/patterns/ringBurstPattern.ts
  - packages/server/src/domain/enemy/types.ts
-->

---
### Requirement: Server resolves telegraphed damage exactly at fireAt and then removes the telegraph

The system SHALL, on the first server tick whose timestamp is greater than or equal to `fireAt`, compute damage for the telegraph's affected entities using the telegraph's geometry, apply that damage server-side, and remove the telegraph entry from room state within the same tick. The telegraph entry MUST NOT persist past its `fireAt` tick.

#### Scenario: Telegraph resolves on the fireAt tick

- **WHEN** the server tick timestamp reaches or exceeds a telegraph's `fireAt`
- **THEN** the server applies damage to all entities inside the telegraph shape and removes the telegraph entry in the same tick

#### Scenario: Entity leaves the telegraph area before fireAt

- **WHEN** an entity exits the telegraph shape between `startAt` and `fireAt`
- **THEN** the server SHALL NOT apply damage to that entity when the telegraph resolves


<!-- @trace
source: enhance-combat-variety
updated: 2026-04-17
code:
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/server/src/domain/boss/patterns/beamPattern.ts
  - packages/server/src/domain/enemy/basicBehavior.ts
  - packages/server/src/domain/boss/patterns/areaPattern.ts
  - packages/server/src/domain/enemy/eliteBehavior.ts
  - packages/server/src/domain/enemy/exploderBehavior.ts
  - packages/server/src/domain/boss/patterns/projectilePattern.ts
  - packages/server/src/domain/boss/patterns/registry.ts
  - packages/server/src/domain/boss/patterns/dashLinePattern.ts
  - packages/server/src/domain/enemy/rangedBehavior.ts
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/domain/boss/patterns/meleePattern.ts
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/enemy/registry.ts
  - packages/server/src/domain/boss/patterns/types.ts
  - CLAUDE.md
  - packages/server/src/domain/boss/patterns/summonPattern.ts
  - packages/server/src/domain/boss/patterns/ringBurstPattern.ts
  - packages/server/src/domain/enemy/types.ts
-->

---
### Requirement: Client renders telegraphs using geometry from room state

The system SHALL render each telegraph entry in the Phaser scene as a red warning overlay whose shape, position, and size match the telegraph geometry. The overlay SHALL animate (e.g., fill intensity increasing) between `startAt` and `fireAt` and SHALL disappear when the telegraph entry is removed from room state. Client rendering MUST NOT perform damage calculation or apply damage locally.

#### Scenario: Telegraph overlay matches server geometry

- **WHEN** a telegraph entry appears in room state with shape `CIRCLE`, radius 120, at position (500, 300)
- **THEN** the client draws a red circular warning at (500, 300) with visual radius 120

#### Scenario: Telegraph overlay disappears when server removes it

- **WHEN** the server removes a telegraph entry from room state
- **THEN** the client stops rendering that overlay within one frame of receiving the state change


<!-- @trace
source: enhance-combat-variety
updated: 2026-04-17
code:
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/server/src/domain/boss/patterns/beamPattern.ts
  - packages/server/src/domain/enemy/basicBehavior.ts
  - packages/server/src/domain/boss/patterns/areaPattern.ts
  - packages/server/src/domain/enemy/eliteBehavior.ts
  - packages/server/src/domain/enemy/exploderBehavior.ts
  - packages/server/src/domain/boss/patterns/projectilePattern.ts
  - packages/server/src/domain/boss/patterns/registry.ts
  - packages/server/src/domain/boss/patterns/dashLinePattern.ts
  - packages/server/src/domain/enemy/rangedBehavior.ts
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/domain/boss/patterns/meleePattern.ts
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/enemy/registry.ts
  - packages/server/src/domain/boss/patterns/types.ts
  - CLAUDE.md
  - packages/server/src/domain/boss/patterns/summonPattern.ts
  - packages/server/src/domain/boss/patterns/ringBurstPattern.ts
  - packages/server/src/domain/enemy/types.ts
-->

---
### Requirement: Telegraph capacity is bounded to protect state sync

The system SHALL enforce an upper bound of 32 simultaneously active telegraph entries in room state. When a new telegraph would exceed the bound, the system SHALL drop the oldest active telegraph (by `startAt`) before inserting the new one.

#### Scenario: Telegraph overflow drops oldest entry

- **WHEN** the 33rd telegraph is scheduled while 32 are already active
- **THEN** the server removes the telegraph with the smallest `startAt` and inserts the new telegraph, leaving 32 active

<!-- @trace
source: enhance-combat-variety
updated: 2026-04-17
code:
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/server/src/domain/boss/patterns/beamPattern.ts
  - packages/server/src/domain/enemy/basicBehavior.ts
  - packages/server/src/domain/boss/patterns/areaPattern.ts
  - packages/server/src/domain/enemy/eliteBehavior.ts
  - packages/server/src/domain/enemy/exploderBehavior.ts
  - packages/server/src/domain/boss/patterns/projectilePattern.ts
  - packages/server/src/domain/boss/patterns/registry.ts
  - packages/server/src/domain/boss/patterns/dashLinePattern.ts
  - packages/server/src/domain/enemy/rangedBehavior.ts
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/domain/boss/patterns/meleePattern.ts
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/enemy/registry.ts
  - packages/server/src/domain/boss/patterns/types.ts
  - CLAUDE.md
  - packages/server/src/domain/boss/patterns/summonPattern.ts
  - packages/server/src/domain/boss/patterns/ringBurstPattern.ts
  - packages/server/src/domain/enemy/types.ts
-->