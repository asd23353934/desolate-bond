## ADDED Requirements

### Requirement: Player can adjust master volume

The system SHALL provide a volume control that scales all game audio output. The setting SHALL persist across browser sessions for registered accounts and within the browser session for guests.

#### Scenario: Volume change takes effect immediately

- **WHEN** a player adjusts the volume slider
- **THEN** all audio output volume changes in real time without requiring a restart

### Requirement: Player can toggle floating damage numbers

The system SHALL provide a toggle to show or hide floating damage numbers above enemies and the Boss. The default state SHALL be ON. The setting SHALL persist across sessions for registered accounts.

#### Scenario: Damage numbers hidden when toggled off

- **WHEN** a player sets the damage number toggle to OFF
- **THEN** no floating numbers appear above entities when they take damage

#### Scenario: Damage numbers shown when toggled on

- **WHEN** a player sets the damage number toggle to ON
- **THEN** floating damage numbers appear above entities when they take damage

### Requirement: Player can select a graphics quality preset

The system SHALL provide three graphics quality presets: High, Medium, Low. Lower presets SHALL reduce particle effect counts and shadow rendering to improve performance on lower-end devices.

#### Scenario: Low quality reduces particle effects

- **WHEN** a player selects the Low quality preset
- **THEN** particle effect counts are reduced and shadow rendering is disabled

### Requirement: Player can remap keyboard keys

The system SHALL allow a player to reassign the keyboard bindings for movement (up/down/left/right) and rescue action. Bindings SHALL persist across sessions for registered accounts.

#### Scenario: Key remapping is saved

- **WHEN** a player assigns a new key to the move-up action and confirms
- **THEN** pressing the new key moves the player upward and the old key no longer triggers move-up

#### Scenario: Duplicate binding is rejected

- **WHEN** a player attempts to assign a key that is already bound to another action
- **THEN** the system SHALL display a conflict warning and SHALL NOT apply the duplicate binding
