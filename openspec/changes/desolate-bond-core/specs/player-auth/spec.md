## ADDED Requirements

### Requirement: Player can register a lightweight account

The system SHALL allow a player to register an account using only a username and password. Email address SHALL NOT be required.

#### Scenario: Successful registration

- **WHEN** a player submits a unique username and a password of at least 6 characters
- **THEN** the system creates the account, logs the player in, and redirects to the main menu

#### Scenario: Duplicate username is rejected

- **WHEN** a player submits a username that already exists
- **THEN** the system SHALL display an error and SHALL NOT create a duplicate account

### Requirement: Registered player can log in

The system SHALL authenticate a player using username and password and issue a session token.

#### Scenario: Correct credentials log in successfully

- **WHEN** a player enters correct username and password
- **THEN** the system issues a session token and navigates to the main menu

#### Scenario: Incorrect credentials are rejected

- **WHEN** a player enters an incorrect username or password
- **THEN** the system SHALL display a generic error message and SHALL NOT issue a session token

### Requirement: Player can play as a guest without registration

The system SHALL allow a player to enter only a display name and start playing immediately without creating a permanent account. The session SHALL be tied to the browser session only.

#### Scenario: Guest enters display name and proceeds

- **WHEN** a player selects "Play as Guest" and enters a display name
- **THEN** the system creates a temporary guest session and navigates to the main menu

#### Scenario: Guest session does not persist across browser sessions

- **WHEN** a guest closes and reopens the browser
- **THEN** the previous guest session SHALL NOT be restored; the player must enter a display name again

### Requirement: Guest can appear on the leaderboard

The system SHALL allow guest players to submit their run results to the leaderboard. Guest entries SHALL be labeled with a guest indicator.

#### Scenario: Guest run result appears on leaderboard

- **WHEN** a guest completes or fails a run
- **THEN** the result is submitted to the leaderboard with the guest's display name and a guest marker visible to all viewers
