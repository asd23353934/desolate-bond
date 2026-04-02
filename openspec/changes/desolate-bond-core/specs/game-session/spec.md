## ADDED Requirements

### Requirement: A game session progresses through defined states

The system SHALL manage each game session as a state machine with the following states in order: LOBBY → SURVIVAL_PHASE → PRE_BOSS_SELECTION → BOSS_BATTLE → POST_BOSS_SELECTION → (repeat for next round OR) GAME_OVER → RESULT. State transitions SHALL only be triggered by the server.

#### Scenario: Normal round progression

- **WHEN** the survival phase timer expires
- **THEN** the session transitions to PRE_BOSS_SELECTION

#### Scenario: Boss defeated transitions to reward selection

- **WHEN** the Boss HP reaches 0
- **THEN** the session transitions to POST_BOSS_SELECTION

#### Scenario: Final boss defeated ends the game

- **WHEN** the Boss of Round 3 is defeated
- **THEN** after POST_BOSS_SELECTION the session transitions to RESULT instead of starting a new round

#### Scenario: All players downed triggers game over

- **WHEN** all players are simultaneously in the downed state
- **THEN** the session transitions to GAME_OVER and then to RESULT

### Requirement: A complete run consists of exactly 3 rounds

The system SHALL structure each run as 3 sequential rounds. Each round consists of one SURVIVAL_PHASE followed by one BOSS_BATTLE. After Round 3 the session ends.

#### Scenario: Round counter increments correctly

- **WHEN** POST_BOSS_SELECTION completes for a round
- **THEN** the round counter increments by 1 and SURVIVAL_PHASE begins for the next round, unless the current round is Round 3

### Requirement: Session result is recorded on completion

The system SHALL persist the session result including each player's stats when the session reaches the RESULT state, regardless of whether the run was cleared or failed.

#### Scenario: Result is saved after game over

- **WHEN** the session reaches RESULT state
- **THEN** the system writes one player_results record per player to the database before displaying the results screen
