## ADDED Requirements

### Requirement: Pre-boss selection pauses progression for skill selection

When the session enters PRE_BOSS_SELECTION, the system SHALL display a skill selection UI to every player simultaneously. Each player selects one skill from 3 options. A 30-second countdown SHALL be shown. When the countdown expires, any player who has not selected SHALL have a skill chosen randomly on their behalf. The boss battle SHALL NOT begin until all players have completed selection or the timer expires.

#### Scenario: All players select before timer expires

- **WHEN** every player has confirmed a skill selection
- **THEN** the session immediately transitions to BOSS_BATTLE without waiting for the timer

#### Scenario: Timer expires before all players select

- **WHEN** the 30-second timer reaches 0 and one or more players have not selected
- **THEN** the system assigns a random skill to each non-selecting player and transitions to BOSS_BATTLE

### Requirement: Each round features a unique Boss with distinct behavior

The system SHALL assign a specific Boss to each of the 3 rounds. Each Boss SHALL have a unique set of attack patterns, movement behavior, and visual appearance.

#### Scenario: Correct boss spawns for each round

- **WHEN** the session enters BOSS_BATTLE for round N
- **THEN** the Boss assigned to round N is spawned at the designated spawn point

### Requirement: Boss HP and damage scale linearly with player count

The system SHALL scale Boss HP and damage output based on the number of active players (human + Bot) at the start of the boss battle using the formula: HP = base × (1 + (count − 1) × 0.6), damage = base × (1 + (count − 1) × 0.4).

#### Scenario: Solo player faces base difficulty

- **WHEN** the boss battle starts with 1 active player
- **THEN** Boss HP and damage equal the base values

#### Scenario: Four players face scaled difficulty

- **WHEN** the boss battle starts with 4 active players
- **THEN** Boss HP equals base × 2.8 and Boss damage equals base × 2.2

### Requirement: Boss enters a frenzied second phase at 50% HP

The system SHALL trigger a phase transition when Boss HP drops to 50% or below. In phase 2 the Boss SHALL use at least one new or enhanced attack pattern and its movement speed SHALL increase.

#### Scenario: Phase 2 triggers at 50% HP

- **WHEN** Boss HP reaches 50% of its scaled maximum
- **THEN** the server fires a phase-change event, updates the Boss behavior profile to phase 2, and all clients play the phase transition visual effect

### Requirement: Post-boss reward selection pauses progression

When the session enters POST_BOSS_SELECTION, the system SHALL display a reward selection UI to every player. Each player chooses one of 3 reward options (items or skill upgrades). A 30-second countdown is shown. When the countdown expires any player who has not selected receives a random reward.

#### Scenario: All players select reward before timer

- **WHEN** every player confirms a reward selection
- **THEN** rewards are applied and the session proceeds (next round or RESULT)

#### Scenario: Timer expires for non-selecting players

- **WHEN** the 30-second timer reaches 0 and some players have not selected
- **THEN** the system assigns random rewards to those players and proceeds

### Requirement: Players attack the Boss automatically

The system SHALL apply the same auto-attack logic used in survival phase to the Boss. Players SHALL focus movement on dodging Boss attacks. Friendly fire SHALL NOT occur.

#### Scenario: Auto-attack damages Boss

- **WHEN** a player is within attack range of the Boss
- **THEN** the server applies the player's damage to Boss HP at the player's attack rate
