## ADDED Requirements

### Requirement: Host can create a room with a unique code

The system SHALL generate a unique 6-character alphanumeric room code when a player creates a room. The room code SHALL be displayed to the host for sharing. The system SHALL also render a QR Code in the waiting lobby that encodes the full join URL for the room.

#### Scenario: Room creation succeeds

- **WHEN** a player submits the create room form
- **THEN** the system creates a new room, generates a unique code, and redirects the host to the waiting lobby

#### Scenario: QR Code is displayed in waiting lobby

- **WHEN** the host is in the waiting lobby after room creation
- **THEN** the client renders a QR Code image encoding the URL `<origin>/?room=<code>` using a client-side QR Code library

#### Scenario: Scanning QR Code navigates to join flow

- **WHEN** a player scans the QR Code with a mobile device
- **THEN** the browser opens the join URL and the room code is pre-filled in the join form

#### Scenario: Room code is unique

- **WHEN** a room is created
- **THEN** the generated code SHALL NOT conflict with any currently active room code

### Requirement: Player can join a room by entering a room code

The system SHALL allow a player to enter a room code and join the corresponding room if it exists and is in the LOBBY state.

#### Scenario: Valid code joins successfully

- **WHEN** a player enters a valid room code for an open room
- **THEN** the player joins the room and appears in the waiting lobby

#### Scenario: Invalid or expired code is rejected

- **WHEN** a player enters a code that does not match any active room
- **THEN** the system SHALL display an error message and NOT navigate away from the join screen

#### Scenario: Full room is rejected

- **WHEN** a player tries to join a room that already has 4 human players
- **THEN** the system SHALL reject the join request with an appropriate error message

### Requirement: Host can add Bot players to fill empty slots

The system SHALL allow the host to add Bot players to fill any of the 4 player slots not occupied by human players, up to a maximum of 3 Bots (at least 1 human player required).

#### Scenario: Host adds a Bot

- **WHEN** the host clicks "Add Bot" and there is an empty slot
- **THEN** a Bot player with a generated name appears in the lobby player list

#### Scenario: Host removes a Bot

- **WHEN** the host clicks remove on a Bot slot
- **THEN** the Bot is removed and the slot becomes empty again

### Requirement: Players select their class in the waiting lobby

The system SHALL display all available classes in the waiting lobby. Each player SHALL select exactly one class before the game can start. The class selection SHALL be locked once the game starts.

#### Scenario: Player selects a class

- **WHEN** a player clicks on a class in the lobby
- **THEN** the player's selected class is updated and visible to all lobby members in real time

#### Scenario: Game cannot start until all players have selected a class

- **WHEN** the host attempts to start the game
- **THEN** the system SHALL prevent the start if any human player has not selected a class, and SHALL display which players are missing a selection

### Requirement: Host can start the game when all players are ready

The system SHALL allow the host to start the game only when all human players have selected a class.

#### Scenario: All players ready, host starts

- **WHEN** all human players have selected a class and the host clicks "Start"
- **THEN** all clients transition to the SURVIVAL_PHASE state for Round 1
