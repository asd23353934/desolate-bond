## ADDED Requirements

### Requirement: Survival phase runs for a fixed countdown duration

The system SHALL start a countdown timer when entering SURVIVAL_PHASE. When the timer reaches zero the session SHALL automatically transition to PRE_BOSS_SELECTION. The timer value SHALL be identical for all players.

#### Scenario: Timer expires and phase ends

- **WHEN** the survival phase timer reaches 0
- **THEN** the server transitions the session to PRE_BOSS_SELECTION and all clients display the skill selection UI

### Requirement: Players move freely on the fixed map

The system SHALL render a fixed tile map. Players SHALL move using WASD (keyboard). Player position SHALL be updated by the server each tick based on received input.

#### Scenario: Player moves in response to input

- **WHEN** a player holds a movement key
- **THEN** the player's character moves in the corresponding direction at the player's current movement speed

### Requirement: Players attack automatically targeting the nearest enemy

The system SHALL cause each player to automatically attack the nearest enemy within attack range each attack cycle. Attack range and attack speed SHALL be determined by the player's weapon and stats.

#### Scenario: Auto-attack fires when enemy is in range

- **WHEN** an enemy is within the player's attack range
- **THEN** the server applies damage to the enemy at the player's attack rate without any player input

#### Scenario: No attack when no enemy is in range

- **WHEN** no enemy is within attack range
- **THEN** no attack action is performed

### Requirement: Players gain experience from killing enemies and level up

The system SHALL award experience points to the player who deals the killing blow. When accumulated experience reaches the threshold the player levels up and the skill selection UI is displayed. Leveling up does NOT pause the game.

#### Scenario: Kill grants experience

- **WHEN** a player kills an enemy
- **THEN** the server awards experience points to that player

#### Scenario: Experience threshold reached triggers level up

- **WHEN** a player's experience reaches the level threshold
- **THEN** the server increments the player's level, resets excess experience, and sends a level-up event to that player's client

### Requirement: Skill selection UI presents 3 options on level up

The system SHALL present exactly 3 skill options drawn from the player's class skill pool and the shared common pool when a player levels up. The player SHALL select one skill. The game SHALL NOT pause during selection. If the player already holds 6 skills, one existing skill SHALL be offered for upgrade instead.

#### Scenario: Player selects a skill

- **WHEN** a player clicks one of the 3 presented skill options
- **THEN** the selected skill is added to the player's active skill list and the selection UI closes

#### Scenario: Selection UI closes automatically if player ignores it

- **WHEN** the player closes the UI without selecting (or the survival phase ends)
- **THEN** the system SHALL auto-select a random skill from the 3 options on the player's behalf

### Requirement: Items and resources spawn at randomized positions each run

The system SHALL spawn health packs, weapons, passive items, and upgrade stones at positions drawn randomly from a predefined node pool each run. The tile map layout SHALL remain fixed.

#### Scenario: Resource positions differ between runs

- **WHEN** a new game session starts
- **THEN** resource spawn positions are randomized from the node pool and differ from the previous run

### Requirement: Elite enemies spawn on a fixed interval during survival phase

The system SHALL spawn one elite enemy at a random location on the map at a fixed interval. Elite enemies SHALL have higher HP and deal more damage than normal enemies. Defeating an elite enemy SHALL drop a better reward.

#### Scenario: Elite spawns at interval

- **WHEN** the elite spawn timer fires
- **THEN** one elite enemy appears at a random valid map position

#### Scenario: Elite drops enhanced reward on death

- **WHEN** a player kills an elite enemy
- **THEN** the elite drops a higher-tier item or larger experience orb compared to normal enemies

### Requirement: Killing enemies restores a small amount of HP

The system SHALL restore a fixed small amount of HP to the killing player each time they defeat an enemy. This amount SHALL stack with skill-based healing effects.

#### Scenario: Kill-on-hit healing triggers

- **WHEN** a player kills an enemy
- **THEN** the player's current HP increases by the kill-heal value, capped at max HP
