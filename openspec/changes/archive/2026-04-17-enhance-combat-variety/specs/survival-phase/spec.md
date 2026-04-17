## ADDED Requirements

### Requirement: Ranged enemies telegraph a line before each shot and reposition after firing

The system SHALL, for the `ranged` enemy type, before firing each projectile, (a) hold position for a windup interval of at least 400 ms, (b) emit a `LINE` telegraph from the enemy position toward the intended target point for the duration of the windup, (c) fire the projectile when the telegraph resolves, and (d) move laterally (perpendicular to the firing line) for a reposition interval of at least 500 ms after firing before the next shot cycle begins.

#### Scenario: Ranged enemy shows LINE telegraph during windup

- **WHEN** a `ranged` enemy enters its firing windup
- **THEN** the server emits a `LINE` telegraph from the enemy position to the target with `fireAt` matching the windup end, and the enemy does not move until the projectile is fired

#### Scenario: Ranged enemy repositions after firing

- **WHEN** a `ranged` enemy has just fired a projectile
- **THEN** the enemy moves perpendicular to its previous firing direction for at least 500 ms before initiating another windup

### Requirement: Basic enemies telegraph a line before applying contact damage

The system SHALL, for the `basic` enemy type, before applying contact damage to a player, emit a `LINE` telegraph from the enemy position to the player position with a lead time of at least 400 ms. Damage SHALL resolve only when the telegraph's `fireAt` is reached and the player remains inside the telegraph shape.

#### Scenario: Basic enemy damage requires completed telegraph

- **WHEN** a `basic` enemy is within contact range of a player and ready to attack
- **THEN** the server emits a `LINE` telegraph with `fireAt` at least 400 ms later, and applies contact damage only if the player is still inside the telegraph shape when it resolves

#### Scenario: Player dodges out of basic enemy telegraph before fireAt

- **WHEN** a player exits the `LINE` telegraph shape before `fireAt`
- **THEN** the server applies no contact damage to that player from that telegraph

### Requirement: Exploder enemies self-destruct with a circular telegraph

The system SHALL support a new enemy type `exploder` with lower maximum HP and higher movement speed than the `basic` type. When an `exploder` reaches contact range of any player, or when its HP reaches zero, the system SHALL emit a `CIRCLE` telegraph centered on the exploder position with a lead time of at least 500 ms and then despawn the exploder and resolve explosion damage to all players inside the circle when `fireAt` is reached.

#### Scenario: Exploder explodes on contact with a player

- **WHEN** an `exploder` reaches contact range of a player
- **THEN** the server emits a `CIRCLE` telegraph at the exploder position, marks the exploder as committed to exploding (it no longer moves), and applies explosion damage to all players inside the circle at `fireAt`

#### Scenario: Exploder explodes on death

- **WHEN** an `exploder` HP reaches zero
- **THEN** the server emits a `CIRCLE` telegraph at the exploder's death position and applies explosion damage when it resolves

### Requirement: Exploder spawn rate is constrained to prevent cascade explosions

The system SHALL limit `exploder` spawn weight such that `exploder` represents no more than 15% of any single spawn wave's enemy count. The system SHALL cap explosion damage per telegraph at a fixed maximum regardless of the number of `exploder` entities that may trigger in proximity.

#### Scenario: Exploder share in a spawn wave is bounded

- **WHEN** the server generates a spawn wave
- **THEN** at most 15% of the wave's enemy count is of type `exploder`

## MODIFIED Requirements

### Requirement: Elite enemies spawn on a fixed interval during survival phase

The system SHALL spawn one elite enemy at a random location on the map at a fixed interval. Elite enemies SHALL have higher HP and deal more damage than normal enemies. Elite enemies SHALL use a telegraph before any area attack they perform (using the telegraph system rules). Defeating an elite enemy SHALL drop a better reward.

#### Scenario: Elite spawns at interval

- **WHEN** the elite spawn timer fires
- **THEN** one elite enemy appears at a random valid map position

#### Scenario: Elite drops enhanced reward on death

- **WHEN** a player kills an elite enemy
- **THEN** the elite drops a higher-tier item or larger experience orb compared to normal enemies

#### Scenario: Elite area attack emits a telegraph

- **WHEN** an elite enemy initiates an area attack
- **THEN** the server emits a telegraph whose shape matches the attack region and applies damage only when the telegraph resolves
