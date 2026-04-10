## ADDED Requirements

### Requirement: Player enters downed state when HP reaches zero

The system SHALL transition a player to DOWNED state when their HP reaches 0. A downed player SHALL stop dealing damage and stop moving under player input. The downed player's character SHALL remain visible on the map at their position.

#### Scenario: HP reaches zero triggers downed state

- **WHEN** a player receives damage that reduces HP to 0 or below
- **THEN** the server transitions that player to DOWNED state and broadcasts the state change to all clients

### Requirement: Downed player can send a rescue ping

The system SHALL allow a player in DOWNED state to send a rescue ping signal. The ping SHALL display a visual indicator on all teammates' screens at the downed player's map position.

#### Scenario: Downed player sends rescue ping

- **WHEN** a downed player activates the rescue ping input
- **THEN** all active teammates see a rescue indicator at the downed player's position for 3 seconds

### Requirement: Active teammate can rescue a downed player

The system SHALL allow any active player (human or Bot) to rescue a downed teammate by overlapping with their rescue hitbox and holding the rescue input for a fixed duration. Upon successful rescue, the downed player returns to active state with a partial HP restoration.

#### Scenario: Rescue completes successfully

- **WHEN** an active player holds the rescue input while overlapping a downed player's hitbox for the required duration
- **THEN** the downed player transitions to ACTIVE state with partial HP restored

#### Scenario: Rescue is interrupted by damage

- **WHEN** the rescuing player receives damage during the rescue action
- **THEN** the rescue action is cancelled and the rescuing player must restart the hold input

### Requirement: All players downed simultaneously triggers game over

The system SHALL monitor the DOWNED state count. When all players are simultaneously in DOWNED state, the server SHALL transition the session to GAME_OVER.

#### Scenario: Last active player goes down

- **WHEN** the final active player transitions to DOWNED state
- **THEN** the server transitions the session to GAME_OVER within 1 tick

### Requirement: Downed player can observe teammates' views while waiting

The system SHALL allow a downed player to cycle through the viewpoints of active teammates using a designated input. The downed player's camera SHALL follow the selected teammate.

#### Scenario: Downed player switches view to teammate

- **WHEN** a downed player presses the cycle-view input
- **THEN** the camera follows the next active teammate in the rotation order

### Requirement: No friendly fire between players

The system SHALL ensure that player attack actions do not apply damage to other players or Bots. Player attacks SHALL only damage enemies and Boss entities.

#### Scenario: Player attack does not hit teammate

- **WHEN** a player's attack hitbox overlaps with a teammate's hitbox
- **THEN** no damage is applied to the teammate
