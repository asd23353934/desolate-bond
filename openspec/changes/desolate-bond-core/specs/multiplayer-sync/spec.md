## ADDED Requirements

### Requirement: Server is the authoritative source of all game state

The system SHALL run all game logic (movement resolution, damage calculation, enemy AI, spawn logic) on the server. Clients SHALL send input commands only. Clients SHALL NOT modify authoritative game state directly.

#### Scenario: Client input is processed server-side

- **WHEN** a client sends a movement input command
- **THEN** the server updates the player's position and broadcasts the new state to all clients in the room

### Requirement: Server broadcasts game state to all clients on each tick

The system SHALL broadcast the full relevant game state delta to all connected clients at a fixed tick rate of approximately 60ms. Clients SHALL apply the received state update to their local render state.

#### Scenario: State broadcast reaches all clients

- **WHEN** the server completes a game tick
- **THEN** all connected clients in the room receive the updated state within the tick interval

### Requirement: Clients interpolate remote player positions for smooth rendering

The system SHALL render remote players using linear interpolation between the last two received state snapshots to compensate for network jitter.

#### Scenario: Remote player moves smoothly despite tick gaps

- **WHEN** a client receives two consecutive position updates for a remote player
- **THEN** the client renders the remote player moving smoothly between the two positions rather than jumping

### Requirement: Difficulty scales linearly with active player count

The system SHALL recalculate Boss HP and damage at the start of each boss battle based on the number of active players. The formula is defined in the boss-battle spec.

#### Scenario: Player count changes affect next boss difficulty

- **WHEN** a player disconnects before a boss battle begins
- **THEN** the boss difficulty is recalculated using the updated active player count

### Requirement: Disconnected players are replaced by a Bot

The system SHALL detect when a human player's connection is lost and replace that player slot with a Bot controller. The Bot SHALL inherit the disconnected player's current stats, position, HP, skills, and inventory.

#### Scenario: Disconnected player is replaced mid-game

- **WHEN** a human player's WebSocket connection drops during an active game session
- **THEN** the server assigns a Bot controller to that player slot within 3 seconds, preserving all player state
