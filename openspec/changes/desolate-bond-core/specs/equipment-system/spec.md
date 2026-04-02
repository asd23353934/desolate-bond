## ADDED Requirements

### Requirement: Each player can hold one weapon and up to four passive items

The system SHALL enforce a maximum inventory of 1 weapon slot and 4 passive item slots per player. Picking up a weapon when a weapon is already equipped SHALL replace the existing weapon. Picking up a passive item when all 4 slots are full SHALL NOT add the item.

#### Scenario: Weapon pickup replaces existing weapon

- **WHEN** a player picks up a weapon and already has a weapon equipped
- **THEN** the old weapon is removed and the new weapon is equipped

#### Scenario: Passive item pickup blocked when full

- **WHEN** a player walks over a passive item and all 4 passive slots are occupied
- **THEN** the item is NOT picked up and remains on the ground

### Requirement: Equipment is picked up by walking over it

The system SHALL automatically pick up equipment when a player's hitbox overlaps with the item's pickup hitbox on the map. No additional player input is required.

#### Scenario: Auto-pickup on overlap

- **WHEN** a player's position overlaps with an item on the map
- **THEN** the item is added to the player's inventory and removed from the map

### Requirement: Upgrade stones automatically upgrade the player's strongest item

The system SHALL automatically apply an upgrade stone to the highest-level item in the player's inventory when the stone is picked up. If multiple items share the same highest level, the item in the lowest inventory slot index SHALL be upgraded.

#### Scenario: Stone upgrades strongest item automatically

- **WHEN** a player picks up an upgrade stone
- **THEN** the item with the highest current upgrade level in that player's inventory is incremented by 1 with no additional input

### Requirement: Equipped items affect player stats and behavior

The system SHALL apply item stat modifiers to the player's effective stats immediately upon equipping. Removing or replacing an item SHALL revert its modifiers.

#### Scenario: Passive item boosts stats on equip

- **WHEN** a player equips a passive item that provides +10% attack speed
- **THEN** the player's effective attack speed increases by 10% immediately

### Requirement: Items are not shareable between players

The system SHALL NOT provide any mechanism for players to transfer items to other players. Each item belongs solely to the player who picked it up.

#### Scenario: No transfer action exists

- **WHEN** a player attempts any action to give an item to a teammate
- **THEN** no such action is available in the UI or input mapping
