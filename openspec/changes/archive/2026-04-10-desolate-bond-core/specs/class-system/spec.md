## ADDED Requirements

### Requirement: Three distinct classes are available with different base stats

The system SHALL provide exactly 3 playable classes: Tank, Damage Dealer, and Support. Each class SHALL have different base HP, attack, and movement speed values. Tank SHALL have the highest HP, Damage Dealer SHALL have the highest attack, Support SHALL have balanced stats with healing bonuses.

#### Scenario: Class base stats differ

- **WHEN** a player selects a class in the lobby
- **THEN** the server initializes that player with the base stats defined for their class

### Requirement: Each class has a dedicated skill pool

The system SHALL maintain a separate skill pool for each class. Skills in a class pool SHALL be specific to that class's role. When a player levels up, skill options SHALL be drawn from their class pool and the shared common pool.

#### Scenario: Skill options match player class

- **WHEN** a Tank player levels up
- **THEN** the 3 presented skill options are drawn exclusively from the Tank skill pool and the common pool, not from other class pools

### Requirement: A shared common skill pool is accessible by all classes

The system SHALL maintain a common skill pool containing skills available to all classes regardless of class selection.

#### Scenario: Common skills appear for any class

- **WHEN** any player levels up
- **THEN** the skill selection MAY include skills from the common pool alongside class-specific skills

### Requirement: Cooperative skills enable class interactions

The system SHALL implement cooperative skills that trigger an effect on one or more nearby teammates. Support class cooperative skills SHALL affect both human players and Bot players within range.

#### Scenario: Support applies healing to nearby teammate

- **WHEN** a Support player has a healing cooperative skill active and a teammate is within range
- **THEN** the server applies the healing effect to that teammate's HP

#### Scenario: Cooperative skill affects Bot teammate

- **WHEN** a Support player's cooperative skill triggers
- **THEN** Bot players within range receive the same effect as human players

### Requirement: Class is locked for the entire run after game start

The system SHALL NOT allow a player to change their class once the game session has transitioned out of LOBBY state.

#### Scenario: Class change is blocked during game

- **WHEN** a player attempts to change class after the game has started
- **THEN** the system SHALL reject the request and the player's class remains unchanged
