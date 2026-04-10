## ADDED Requirements

### Requirement: Player stats are tracked throughout each run

The system SHALL record per-player statistics during each run, including: total damage dealt, total damage taken, number of enemies killed, number of times downed, number of times rescued, and survival time (seconds alive while active).

#### Scenario: Damage dealt is accumulated

- **WHEN** a player deals damage to any enemy or Boss
- **THEN** the server increments that player's total_damage counter for the current session

### Requirement: Run result is persisted to the database after each session

The system SHALL write one `player_results` record per player to the database when the session reaches RESULT state. The record SHALL include all tracked stats, the final round reached, and whether the run was cleared.

#### Scenario: Results saved on run completion

- **WHEN** the session transitions to RESULT state
- **THEN** one player_results record per player is inserted into the database before the results screen is shown

### Requirement: Multiple leaderboard categories are available

The system SHALL maintain separate leaderboard rankings for at least: fastest clear time (seconds from game start to Boss 3 defeat), highest total damage in a single run, and highest survival time in a single run. Each category ranks individual players.

#### Scenario: Fastest clear time leaderboard shows top entries

- **WHEN** a user opens the fastest clear time leaderboard
- **THEN** the system displays the top entries ranked ascending by clear_time for runs where cleared = true

#### Scenario: Highest damage leaderboard shows top entries

- **WHEN** a user opens the highest damage leaderboard
- **THEN** the system displays the top entries ranked descending by total_damage

### Requirement: Guest entries appear on leaderboards with a guest marker

The system SHALL include guest player results in all leaderboard queries. Guest entries SHALL display a visual marker distinguishing them from registered account entries.

#### Scenario: Guest entry visible on leaderboard

- **WHEN** a guest player's result qualifies for a leaderboard
- **THEN** the entry appears with the guest player's display name and a guest indicator label

### Requirement: Results screen displays per-player stats after each run

The system SHALL display the RESULT screen to all players after the session ends showing each player's individual stats for the completed run and the final round reached.

#### Scenario: Results screen shows all player stats

- **WHEN** the session transitions to RESULT state
- **THEN** all connected clients render a results screen listing each player's stats for that run
