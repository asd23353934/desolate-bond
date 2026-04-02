## ADDED Requirements

### Requirement: Bot uses the same input interface as human players

The system SHALL implement Bot decision-making by producing `PlayerInput` commands each server tick, identical in format to human player input. The game logic SHALL NOT distinguish between Bot-produced and human-produced input.

#### Scenario: Bot input is processed identically to human input

- **WHEN** a Bot controller generates a movement input
- **THEN** the server processes it through the same movement resolution logic as a human player input

### Requirement: Bot navigates toward enemies and avoids obstacles

The system SHALL implement Bot movement using a behavior state machine. Default state is CHASE_ENEMY: move toward the nearest enemy while avoiding map obstacles.

#### Scenario: Bot moves toward nearest enemy

- **WHEN** an enemy is present in the survival phase
- **THEN** the Bot moves in the direction of the nearest enemy each tick

### Requirement: Bot dodges Boss projectiles and area attacks

The system SHALL implement a DODGE state in the Bot behavior machine. When a Boss projectile or area-of-effect attack is detected within a threshold radius, the Bot switches to DODGE state and moves perpendicular to the incoming threat.

#### Scenario: Bot enters dodge state on incoming projectile

- **WHEN** a Boss projectile enters within the Bot's dodge threshold radius
- **THEN** the Bot's state transitions to DODGE and it moves perpendicular to the projectile's trajectory

#### Scenario: Bot returns to default state after dodge

- **WHEN** the detected threat has passed or moved out of range
- **THEN** the Bot returns to CHASE_ENEMY state

### Requirement: Bot rescues downed teammates

The system SHALL implement a RESCUE state. When a teammate is in the downed state and no immediate threat requires dodging, the Bot transitions to RESCUE state and moves toward the downed player. Upon reaching the downed player's position, the Bot triggers the rescue action.

#### Scenario: Bot moves to downed teammate

- **WHEN** a teammate enters the downed state and the Bot is not in DODGE state
- **THEN** the Bot transitions to RESCUE state and navigates toward the downed player

#### Scenario: Bot triggers rescue on arrival

- **WHEN** the Bot's position overlaps with the downed player's rescue hitbox
- **THEN** the Bot triggers the rescue action, restoring the teammate to the active state

### Requirement: Bot activates cooperative skills when conditions are met

The system SHALL implement cooperative skill activation for the Bot. When a Bot has an active cooperative skill and the trigger condition (e.g., ally within range) is met, the Bot SHALL activate the skill.

#### Scenario: Bot uses cooperative skill on nearby ally

- **WHEN** a Bot with a Support cooperative skill has an ally within the skill's activation range
- **THEN** the Bot activates the skill and the ally receives the skill's effect

### Requirement: Bot selects skills and rewards automatically

The system SHALL have the Bot automatically select a skill or reward when a selection UI phase begins. The Bot SHALL make its selection immediately without waiting for human input.

#### Scenario: Bot selects skill at level up

- **WHEN** a Bot player levels up and the skill selection event fires
- **THEN** the Bot immediately selects one of the 3 options without delay
