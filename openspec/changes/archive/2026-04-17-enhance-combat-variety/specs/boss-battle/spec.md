## ADDED Requirements

### Requirement: Boss roster spans the extended attack pattern library

The system SHALL support the extended Boss attack pattern library consisting of: `MELEE`, `CHARGE`, `PROJECTILE`, `AREA`, `DASH_LINE`, `RING_BURST`, `SUMMON`, and `BEAM`. Each Boss SHALL be configured with a phase 1 pattern set and a phase 2 pattern set, where phase 2 contains at least one pattern not present in phase 1. The Boss pattern registry SHALL assign patterns as follows:

- GOLEM phase 1: `MELEE`, `CHARGE`, `RING_BURST`; phase 2 adds `SUMMON`.
- WRAITH phase 1: `PROJECTILE`, `AREA`, `BEAM`; phase 2 adds `RING_BURST`.
- DRAGON phase 1: `MELEE`, `PROJECTILE`, `AREA`, `DASH_LINE`; phase 2 adds `BEAM`.

#### Scenario: GOLEM phase 2 uses SUMMON pattern

- **WHEN** GOLEM HP drops to 50% and phase 2 begins
- **THEN** the Boss pattern scheduler includes `SUMMON` in the selectable pattern pool for subsequent attacks

#### Scenario: WRAITH phase 1 does not use RING_BURST

- **WHEN** WRAITH is in phase 1
- **THEN** the Boss pattern scheduler SHALL NOT select `RING_BURST`

### Requirement: Every damaging Boss pattern emits a telegraph before resolving

The system SHALL, for every Boss pattern in `{MELEE, CHARGE, PROJECTILE, AREA, DASH_LINE, RING_BURST, SUMMON, BEAM}` that applies damage to a spatial region, emit at least one telegraph entry through the telegraph system before the damage resolves. The telegraph shape SHALL match the pattern semantics:

- `MELEE`, `AREA`, `RING_BURST`, `SUMMON` spawn region: `CIRCLE`
- `CHARGE`, `DASH_LINE`, `BEAM`: `LINE`
- `PROJECTILE` with area burst on impact: `CIRCLE` at impact point (projectiles themselves do not require a telegraph)

Damage from these patterns SHALL NOT apply before the associated telegraph's `fireAt`.

#### Scenario: BEAM emits a LINE telegraph before firing

- **WHEN** WRAITH begins casting `BEAM` aimed at a target point
- **THEN** the server emits a `LINE` telegraph from WRAITH position to the target point with `fireAt` at least 300 ms after `startAt`, and no damage is applied to entities along the line before `fireAt`

#### Scenario: RING_BURST emits concentric circular telegraphs

- **WHEN** GOLEM casts `RING_BURST`
- **THEN** the server emits one or more `CIRCLE` telegraphs centered on GOLEM whose resolution order matches the ring sequence

## MODIFIED Requirements

### Requirement: Boss enters a frenzied second phase at 50% HP

The system SHALL trigger a phase transition when Boss HP drops to 50% or below. In phase 2 the Boss SHALL switch to its phase 2 pattern set (which contains at least one pattern not used in phase 1) and its movement speed SHALL increase.

#### Scenario: Phase 2 triggers at 50% HP

- **WHEN** Boss HP reaches 50% of its scaled maximum
- **THEN** the server fires a phase-change event, switches the Boss pattern scheduler to the phase 2 pattern set, updates movement speed, and all clients play the phase transition visual effect

#### Scenario: Phase 2 introduces a previously unused pattern

- **WHEN** phase 2 begins
- **THEN** the phase 2 pattern set contains at least one pattern identifier that was not in the phase 1 pattern set for the same Boss
