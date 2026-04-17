## ADDED Requirements

### Requirement: Pre-boss selection pauses progression for skill selection

When the session enters PRE_BOSS_SELECTION, the system SHALL display a skill selection UI to every player simultaneously. Each player selects one skill from 3 options. A 30-second countdown SHALL be shown. When the countdown expires, any player who has not selected SHALL have a skill chosen randomly on their behalf. The boss battle SHALL NOT begin until all players have completed selection or the timer expires.

#### Scenario: All players select before timer expires

- **WHEN** every player has confirmed a skill selection
- **THEN** the session immediately transitions to BOSS_BATTLE without waiting for the timer

#### Scenario: Timer expires before all players select

- **WHEN** the 30-second timer reaches 0 and one or more players have not selected
- **THEN** the system assigns a random skill to each non-selecting player and transitions to BOSS_BATTLE


<!-- @trace
source: desolate-bond-core
updated: 2026-04-10
code:
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/infrastructure/repositories/GameSessionRepository.ts
  - docker-compose.yml
  - .gitattributes
  - packages/client/src/application/.gitkeep
  - packages/client/src/infrastructure/colyseus/client.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/entities/DifficultyScaling.ts
  - packages/server/src/presentation/.gitkeep
  - packages/client/src/presentation/.gitkeep
  - packages/client/src/infrastructure/.gitkeep
  - packages/client/src/lib/utils.ts
  - packages/server/src/domain/entities/RoomCode.ts
  - packages/server/src/infrastructure/auth/jwt.ts
  - packages/client/src/main.tsx
  - packages/client/index.html
  - packages/client/src/presentation/components/RoomQRCode.tsx
  - packages/client/src/application/useGameSettings.ts
  - packages/client/src/domain/RemotePlayerInterpolator.ts
  - packages/server/railway.json
  - packages/client/src/domain/.gitkeep
  - packages/server/src/infrastructure/db.ts
  - packages/server/src/domain/entities/Room.ts
  - packages/client/src/components/pixel-ui.tsx
  - packages/server/src/domain/entities/BotController.ts
  - packages/server/src/index.ts
  - packages/client/public/favicon.svg
  - packages/client/src/assets/react.svg
  - packages/server/src/infrastructure/migrations/001_create_users.sql
  - packages/server/package.json
  - CLAUDE.md
  - packages/client/src/components/ui/tabs.tsx
  - packages/server/src/presentation/routes/leaderboardRouter.ts
  - packages/server/src/application/.gitkeep
  - packages/client/tsconfig.json
  - packages/server/src/infrastructure/auth/jwtRoom.ts
  - packages/server/src/application/use-cases/GuestLoginUseCase.ts
  - packages/client/src/infrastructure/api.ts
  - packages/client/src/components/ui/label.tsx
  - .github/workflows/deploy-server.yml
  - packages/client/src/index.css
  - packages/client/src/presentation/pages/LeaderboardPage.tsx
  - packages/server/src/infrastructure/.gitkeep
  - package.json
  - packages/client/src/assets/vite.svg
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/infrastructure/migrations/002_create_game_sessions.sql
  - packages/client/components.json
  - packages/client/package.json
  - packages/client/README.md
  - packages/client/src/App.tsx
  - packages/client/src/presentation/pages/HelpPage.tsx
  - packages/server/src/domain/entities/Player.ts
  - packages/client/src/application/useLobbyState.ts
  - packages/client/src/presentation/components/SkillSelectionOverlay.tsx
  - packages/client/src/application/useRoom.ts
  - packages/server/src/domain/entities/GameSession.ts
  - packages/server/src/domain/interfaces/IPlayerRepository.ts
  - packages/server/src/domain/interfaces/IRoomRepository.ts
  - packages/server/src/infrastructure/migrate.ts
  - packages/server/src/domain/entities/SkillDraw.ts
  - .github/workflows/deploy-client.yml
  - packages/client/src/domain/itemDefs.ts
  - packages/client/src/domain/skillDefs.ts
  - packages/server/src/infrastructure/repositories/PlayerRepository.ts
  - packages/server/src/domain/interfaces/IGameSession.ts
  - packages/server/src/presentation/routes/roomsRouter.ts
  - packages/server/src/presentation/routes/authRouter.ts
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/client/tsconfig.node.json
  - packages/client/src/presentation/pages/MainMenuPage.tsx
  - packages/server/src/domain/entities/ClassDefs.ts
  - packages/client/src/components/ui/button.tsx
  - packages/client/public/icons.svg
  - packages/server/src/infrastructure/migrations/003_create_player_results.sql
  - packages/client/eslint.config.js
  - packages/server/src/domain/entities/EquipmentDefs.ts
  - packages/server/tsconfig.json
  - packages/client/src/presentation/components/RewardSelectionOverlay.tsx
  - packages/server/src/domain/.gitkeep
  - packages/client/src/application/useAuth.ts
  - packages/client/src/application/useRoomCodeFromURL.ts
  - packages/server/src/domain/entities/PlayerInput.ts
  - packages/server/src/application/use-cases/LoginUseCase.ts
  - packages/server/src/domain/entities/SkillPools.ts
  - packages/client/tsconfig.app.json
  - README.md
  - packages/client/src/presentation/pages/SettingsPage.tsx
  - packages/client/src/components/ui/card.tsx
  - packages/client/src/infrastructure/qrcode.ts
  - packages/client/src/assets/hero.png
  - packages/server/src/application/use-cases/RegisterUseCase.ts
  - packages/client/src/presentation/pages/LobbyPage.tsx
  - packages/client/src/presentation/pages/GamePage.tsx
  - .env.example
  - packages/client/src/components/ui/input.tsx
  - packages/client/src/App.css
  - packages/client/src/presentation/pages/AuthPage.tsx
  - packages/client/vite.config.ts
-->

### Requirement: Each round features a unique Boss with distinct behavior

The system SHALL assign a specific Boss to each of the 3 rounds. Each Boss SHALL have a unique set of attack patterns, movement behavior, and visual appearance.

#### Scenario: Correct boss spawns for each round

- **WHEN** the session enters BOSS_BATTLE for round N
- **THEN** the Boss assigned to round N is spawned at the designated spawn point


<!-- @trace
source: desolate-bond-core
updated: 2026-04-10
code:
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/infrastructure/repositories/GameSessionRepository.ts
  - docker-compose.yml
  - .gitattributes
  - packages/client/src/application/.gitkeep
  - packages/client/src/infrastructure/colyseus/client.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/entities/DifficultyScaling.ts
  - packages/server/src/presentation/.gitkeep
  - packages/client/src/presentation/.gitkeep
  - packages/client/src/infrastructure/.gitkeep
  - packages/client/src/lib/utils.ts
  - packages/server/src/domain/entities/RoomCode.ts
  - packages/server/src/infrastructure/auth/jwt.ts
  - packages/client/src/main.tsx
  - packages/client/index.html
  - packages/client/src/presentation/components/RoomQRCode.tsx
  - packages/client/src/application/useGameSettings.ts
  - packages/client/src/domain/RemotePlayerInterpolator.ts
  - packages/server/railway.json
  - packages/client/src/domain/.gitkeep
  - packages/server/src/infrastructure/db.ts
  - packages/server/src/domain/entities/Room.ts
  - packages/client/src/components/pixel-ui.tsx
  - packages/server/src/domain/entities/BotController.ts
  - packages/server/src/index.ts
  - packages/client/public/favicon.svg
  - packages/client/src/assets/react.svg
  - packages/server/src/infrastructure/migrations/001_create_users.sql
  - packages/server/package.json
  - CLAUDE.md
  - packages/client/src/components/ui/tabs.tsx
  - packages/server/src/presentation/routes/leaderboardRouter.ts
  - packages/server/src/application/.gitkeep
  - packages/client/tsconfig.json
  - packages/server/src/infrastructure/auth/jwtRoom.ts
  - packages/server/src/application/use-cases/GuestLoginUseCase.ts
  - packages/client/src/infrastructure/api.ts
  - packages/client/src/components/ui/label.tsx
  - .github/workflows/deploy-server.yml
  - packages/client/src/index.css
  - packages/client/src/presentation/pages/LeaderboardPage.tsx
  - packages/server/src/infrastructure/.gitkeep
  - package.json
  - packages/client/src/assets/vite.svg
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/infrastructure/migrations/002_create_game_sessions.sql
  - packages/client/components.json
  - packages/client/package.json
  - packages/client/README.md
  - packages/client/src/App.tsx
  - packages/client/src/presentation/pages/HelpPage.tsx
  - packages/server/src/domain/entities/Player.ts
  - packages/client/src/application/useLobbyState.ts
  - packages/client/src/presentation/components/SkillSelectionOverlay.tsx
  - packages/client/src/application/useRoom.ts
  - packages/server/src/domain/entities/GameSession.ts
  - packages/server/src/domain/interfaces/IPlayerRepository.ts
  - packages/server/src/domain/interfaces/IRoomRepository.ts
  - packages/server/src/infrastructure/migrate.ts
  - packages/server/src/domain/entities/SkillDraw.ts
  - .github/workflows/deploy-client.yml
  - packages/client/src/domain/itemDefs.ts
  - packages/client/src/domain/skillDefs.ts
  - packages/server/src/infrastructure/repositories/PlayerRepository.ts
  - packages/server/src/domain/interfaces/IGameSession.ts
  - packages/server/src/presentation/routes/roomsRouter.ts
  - packages/server/src/presentation/routes/authRouter.ts
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/client/tsconfig.node.json
  - packages/client/src/presentation/pages/MainMenuPage.tsx
  - packages/server/src/domain/entities/ClassDefs.ts
  - packages/client/src/components/ui/button.tsx
  - packages/client/public/icons.svg
  - packages/server/src/infrastructure/migrations/003_create_player_results.sql
  - packages/client/eslint.config.js
  - packages/server/src/domain/entities/EquipmentDefs.ts
  - packages/server/tsconfig.json
  - packages/client/src/presentation/components/RewardSelectionOverlay.tsx
  - packages/server/src/domain/.gitkeep
  - packages/client/src/application/useAuth.ts
  - packages/client/src/application/useRoomCodeFromURL.ts
  - packages/server/src/domain/entities/PlayerInput.ts
  - packages/server/src/application/use-cases/LoginUseCase.ts
  - packages/server/src/domain/entities/SkillPools.ts
  - packages/client/tsconfig.app.json
  - README.md
  - packages/client/src/presentation/pages/SettingsPage.tsx
  - packages/client/src/components/ui/card.tsx
  - packages/client/src/infrastructure/qrcode.ts
  - packages/client/src/assets/hero.png
  - packages/server/src/application/use-cases/RegisterUseCase.ts
  - packages/client/src/presentation/pages/LobbyPage.tsx
  - packages/client/src/presentation/pages/GamePage.tsx
  - .env.example
  - packages/client/src/components/ui/input.tsx
  - packages/client/src/App.css
  - packages/client/src/presentation/pages/AuthPage.tsx
  - packages/client/vite.config.ts
-->

### Requirement: Boss HP and damage scale linearly with player count

The system SHALL scale Boss HP and damage output based on the number of active players (human + Bot) at the start of the boss battle using the formula: HP = base × (1 + (count − 1) × 0.6), damage = base × (1 + (count − 1) × 0.4).

#### Scenario: Solo player faces base difficulty

- **WHEN** the boss battle starts with 1 active player
- **THEN** Boss HP and damage equal the base values

#### Scenario: Four players face scaled difficulty

- **WHEN** the boss battle starts with 4 active players
- **THEN** Boss HP equals base × 2.8 and Boss damage equals base × 2.2


<!-- @trace
source: desolate-bond-core
updated: 2026-04-10
code:
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/infrastructure/repositories/GameSessionRepository.ts
  - docker-compose.yml
  - .gitattributes
  - packages/client/src/application/.gitkeep
  - packages/client/src/infrastructure/colyseus/client.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/entities/DifficultyScaling.ts
  - packages/server/src/presentation/.gitkeep
  - packages/client/src/presentation/.gitkeep
  - packages/client/src/infrastructure/.gitkeep
  - packages/client/src/lib/utils.ts
  - packages/server/src/domain/entities/RoomCode.ts
  - packages/server/src/infrastructure/auth/jwt.ts
  - packages/client/src/main.tsx
  - packages/client/index.html
  - packages/client/src/presentation/components/RoomQRCode.tsx
  - packages/client/src/application/useGameSettings.ts
  - packages/client/src/domain/RemotePlayerInterpolator.ts
  - packages/server/railway.json
  - packages/client/src/domain/.gitkeep
  - packages/server/src/infrastructure/db.ts
  - packages/server/src/domain/entities/Room.ts
  - packages/client/src/components/pixel-ui.tsx
  - packages/server/src/domain/entities/BotController.ts
  - packages/server/src/index.ts
  - packages/client/public/favicon.svg
  - packages/client/src/assets/react.svg
  - packages/server/src/infrastructure/migrations/001_create_users.sql
  - packages/server/package.json
  - CLAUDE.md
  - packages/client/src/components/ui/tabs.tsx
  - packages/server/src/presentation/routes/leaderboardRouter.ts
  - packages/server/src/application/.gitkeep
  - packages/client/tsconfig.json
  - packages/server/src/infrastructure/auth/jwtRoom.ts
  - packages/server/src/application/use-cases/GuestLoginUseCase.ts
  - packages/client/src/infrastructure/api.ts
  - packages/client/src/components/ui/label.tsx
  - .github/workflows/deploy-server.yml
  - packages/client/src/index.css
  - packages/client/src/presentation/pages/LeaderboardPage.tsx
  - packages/server/src/infrastructure/.gitkeep
  - package.json
  - packages/client/src/assets/vite.svg
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/infrastructure/migrations/002_create_game_sessions.sql
  - packages/client/components.json
  - packages/client/package.json
  - packages/client/README.md
  - packages/client/src/App.tsx
  - packages/client/src/presentation/pages/HelpPage.tsx
  - packages/server/src/domain/entities/Player.ts
  - packages/client/src/application/useLobbyState.ts
  - packages/client/src/presentation/components/SkillSelectionOverlay.tsx
  - packages/client/src/application/useRoom.ts
  - packages/server/src/domain/entities/GameSession.ts
  - packages/server/src/domain/interfaces/IPlayerRepository.ts
  - packages/server/src/domain/interfaces/IRoomRepository.ts
  - packages/server/src/infrastructure/migrate.ts
  - packages/server/src/domain/entities/SkillDraw.ts
  - .github/workflows/deploy-client.yml
  - packages/client/src/domain/itemDefs.ts
  - packages/client/src/domain/skillDefs.ts
  - packages/server/src/infrastructure/repositories/PlayerRepository.ts
  - packages/server/src/domain/interfaces/IGameSession.ts
  - packages/server/src/presentation/routes/roomsRouter.ts
  - packages/server/src/presentation/routes/authRouter.ts
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/client/tsconfig.node.json
  - packages/client/src/presentation/pages/MainMenuPage.tsx
  - packages/server/src/domain/entities/ClassDefs.ts
  - packages/client/src/components/ui/button.tsx
  - packages/client/public/icons.svg
  - packages/server/src/infrastructure/migrations/003_create_player_results.sql
  - packages/client/eslint.config.js
  - packages/server/src/domain/entities/EquipmentDefs.ts
  - packages/server/tsconfig.json
  - packages/client/src/presentation/components/RewardSelectionOverlay.tsx
  - packages/server/src/domain/.gitkeep
  - packages/client/src/application/useAuth.ts
  - packages/client/src/application/useRoomCodeFromURL.ts
  - packages/server/src/domain/entities/PlayerInput.ts
  - packages/server/src/application/use-cases/LoginUseCase.ts
  - packages/server/src/domain/entities/SkillPools.ts
  - packages/client/tsconfig.app.json
  - README.md
  - packages/client/src/presentation/pages/SettingsPage.tsx
  - packages/client/src/components/ui/card.tsx
  - packages/client/src/infrastructure/qrcode.ts
  - packages/client/src/assets/hero.png
  - packages/server/src/application/use-cases/RegisterUseCase.ts
  - packages/client/src/presentation/pages/LobbyPage.tsx
  - packages/client/src/presentation/pages/GamePage.tsx
  - .env.example
  - packages/client/src/components/ui/input.tsx
  - packages/client/src/App.css
  - packages/client/src/presentation/pages/AuthPage.tsx
  - packages/client/vite.config.ts
-->

### Requirement: Boss enters a frenzied second phase at 50% HP

The system SHALL trigger a phase transition when Boss HP drops to 50% or below. In phase 2 the Boss SHALL use at least one new or enhanced attack pattern and its movement speed SHALL increase.

#### Scenario: Phase 2 triggers at 50% HP

- **WHEN** Boss HP reaches 50% of its scaled maximum
- **THEN** the server fires a phase-change event, updates the Boss behavior profile to phase 2, and all clients play the phase transition visual effect


<!-- @trace
source: desolate-bond-core
updated: 2026-04-10
code:
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/infrastructure/repositories/GameSessionRepository.ts
  - docker-compose.yml
  - .gitattributes
  - packages/client/src/application/.gitkeep
  - packages/client/src/infrastructure/colyseus/client.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/entities/DifficultyScaling.ts
  - packages/server/src/presentation/.gitkeep
  - packages/client/src/presentation/.gitkeep
  - packages/client/src/infrastructure/.gitkeep
  - packages/client/src/lib/utils.ts
  - packages/server/src/domain/entities/RoomCode.ts
  - packages/server/src/infrastructure/auth/jwt.ts
  - packages/client/src/main.tsx
  - packages/client/index.html
  - packages/client/src/presentation/components/RoomQRCode.tsx
  - packages/client/src/application/useGameSettings.ts
  - packages/client/src/domain/RemotePlayerInterpolator.ts
  - packages/server/railway.json
  - packages/client/src/domain/.gitkeep
  - packages/server/src/infrastructure/db.ts
  - packages/server/src/domain/entities/Room.ts
  - packages/client/src/components/pixel-ui.tsx
  - packages/server/src/domain/entities/BotController.ts
  - packages/server/src/index.ts
  - packages/client/public/favicon.svg
  - packages/client/src/assets/react.svg
  - packages/server/src/infrastructure/migrations/001_create_users.sql
  - packages/server/package.json
  - CLAUDE.md
  - packages/client/src/components/ui/tabs.tsx
  - packages/server/src/presentation/routes/leaderboardRouter.ts
  - packages/server/src/application/.gitkeep
  - packages/client/tsconfig.json
  - packages/server/src/infrastructure/auth/jwtRoom.ts
  - packages/server/src/application/use-cases/GuestLoginUseCase.ts
  - packages/client/src/infrastructure/api.ts
  - packages/client/src/components/ui/label.tsx
  - .github/workflows/deploy-server.yml
  - packages/client/src/index.css
  - packages/client/src/presentation/pages/LeaderboardPage.tsx
  - packages/server/src/infrastructure/.gitkeep
  - package.json
  - packages/client/src/assets/vite.svg
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/infrastructure/migrations/002_create_game_sessions.sql
  - packages/client/components.json
  - packages/client/package.json
  - packages/client/README.md
  - packages/client/src/App.tsx
  - packages/client/src/presentation/pages/HelpPage.tsx
  - packages/server/src/domain/entities/Player.ts
  - packages/client/src/application/useLobbyState.ts
  - packages/client/src/presentation/components/SkillSelectionOverlay.tsx
  - packages/client/src/application/useRoom.ts
  - packages/server/src/domain/entities/GameSession.ts
  - packages/server/src/domain/interfaces/IPlayerRepository.ts
  - packages/server/src/domain/interfaces/IRoomRepository.ts
  - packages/server/src/infrastructure/migrate.ts
  - packages/server/src/domain/entities/SkillDraw.ts
  - .github/workflows/deploy-client.yml
  - packages/client/src/domain/itemDefs.ts
  - packages/client/src/domain/skillDefs.ts
  - packages/server/src/infrastructure/repositories/PlayerRepository.ts
  - packages/server/src/domain/interfaces/IGameSession.ts
  - packages/server/src/presentation/routes/roomsRouter.ts
  - packages/server/src/presentation/routes/authRouter.ts
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/client/tsconfig.node.json
  - packages/client/src/presentation/pages/MainMenuPage.tsx
  - packages/server/src/domain/entities/ClassDefs.ts
  - packages/client/src/components/ui/button.tsx
  - packages/client/public/icons.svg
  - packages/server/src/infrastructure/migrations/003_create_player_results.sql
  - packages/client/eslint.config.js
  - packages/server/src/domain/entities/EquipmentDefs.ts
  - packages/server/tsconfig.json
  - packages/client/src/presentation/components/RewardSelectionOverlay.tsx
  - packages/server/src/domain/.gitkeep
  - packages/client/src/application/useAuth.ts
  - packages/client/src/application/useRoomCodeFromURL.ts
  - packages/server/src/domain/entities/PlayerInput.ts
  - packages/server/src/application/use-cases/LoginUseCase.ts
  - packages/server/src/domain/entities/SkillPools.ts
  - packages/client/tsconfig.app.json
  - README.md
  - packages/client/src/presentation/pages/SettingsPage.tsx
  - packages/client/src/components/ui/card.tsx
  - packages/client/src/infrastructure/qrcode.ts
  - packages/client/src/assets/hero.png
  - packages/server/src/application/use-cases/RegisterUseCase.ts
  - packages/client/src/presentation/pages/LobbyPage.tsx
  - packages/client/src/presentation/pages/GamePage.tsx
  - .env.example
  - packages/client/src/components/ui/input.tsx
  - packages/client/src/App.css
  - packages/client/src/presentation/pages/AuthPage.tsx
  - packages/client/vite.config.ts
-->


<!-- @trace
source: enhance-combat-variety
updated: 2026-04-17
code:
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/server/src/domain/boss/patterns/beamPattern.ts
  - packages/server/src/domain/enemy/basicBehavior.ts
  - packages/server/src/domain/boss/patterns/areaPattern.ts
  - packages/server/src/domain/enemy/eliteBehavior.ts
  - packages/server/src/domain/enemy/exploderBehavior.ts
  - packages/server/src/domain/boss/patterns/projectilePattern.ts
  - packages/server/src/domain/boss/patterns/registry.ts
  - packages/server/src/domain/boss/patterns/dashLinePattern.ts
  - packages/server/src/domain/enemy/rangedBehavior.ts
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/domain/boss/patterns/meleePattern.ts
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/enemy/registry.ts
  - packages/server/src/domain/boss/patterns/types.ts
  - CLAUDE.md
  - packages/server/src/domain/boss/patterns/summonPattern.ts
  - packages/server/src/domain/boss/patterns/ringBurstPattern.ts
  - packages/server/src/domain/enemy/types.ts
-->

### Requirement: Post-boss reward selection pauses progression

When the session enters POST_BOSS_SELECTION, the system SHALL display a reward selection UI to every player. Each player chooses one of 3 reward options (items or skill upgrades). A 30-second countdown is shown. When the countdown expires any player who has not selected receives a random reward.

#### Scenario: All players select reward before timer

- **WHEN** every player confirms a reward selection
- **THEN** rewards are applied and the session proceeds (next round or RESULT)

#### Scenario: Timer expires for non-selecting players

- **WHEN** the 30-second timer reaches 0 and some players have not selected
- **THEN** the system assigns random rewards to those players and proceeds


<!-- @trace
source: desolate-bond-core
updated: 2026-04-10
code:
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/infrastructure/repositories/GameSessionRepository.ts
  - docker-compose.yml
  - .gitattributes
  - packages/client/src/application/.gitkeep
  - packages/client/src/infrastructure/colyseus/client.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/entities/DifficultyScaling.ts
  - packages/server/src/presentation/.gitkeep
  - packages/client/src/presentation/.gitkeep
  - packages/client/src/infrastructure/.gitkeep
  - packages/client/src/lib/utils.ts
  - packages/server/src/domain/entities/RoomCode.ts
  - packages/server/src/infrastructure/auth/jwt.ts
  - packages/client/src/main.tsx
  - packages/client/index.html
  - packages/client/src/presentation/components/RoomQRCode.tsx
  - packages/client/src/application/useGameSettings.ts
  - packages/client/src/domain/RemotePlayerInterpolator.ts
  - packages/server/railway.json
  - packages/client/src/domain/.gitkeep
  - packages/server/src/infrastructure/db.ts
  - packages/server/src/domain/entities/Room.ts
  - packages/client/src/components/pixel-ui.tsx
  - packages/server/src/domain/entities/BotController.ts
  - packages/server/src/index.ts
  - packages/client/public/favicon.svg
  - packages/client/src/assets/react.svg
  - packages/server/src/infrastructure/migrations/001_create_users.sql
  - packages/server/package.json
  - CLAUDE.md
  - packages/client/src/components/ui/tabs.tsx
  - packages/server/src/presentation/routes/leaderboardRouter.ts
  - packages/server/src/application/.gitkeep
  - packages/client/tsconfig.json
  - packages/server/src/infrastructure/auth/jwtRoom.ts
  - packages/server/src/application/use-cases/GuestLoginUseCase.ts
  - packages/client/src/infrastructure/api.ts
  - packages/client/src/components/ui/label.tsx
  - .github/workflows/deploy-server.yml
  - packages/client/src/index.css
  - packages/client/src/presentation/pages/LeaderboardPage.tsx
  - packages/server/src/infrastructure/.gitkeep
  - package.json
  - packages/client/src/assets/vite.svg
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/infrastructure/migrations/002_create_game_sessions.sql
  - packages/client/components.json
  - packages/client/package.json
  - packages/client/README.md
  - packages/client/src/App.tsx
  - packages/client/src/presentation/pages/HelpPage.tsx
  - packages/server/src/domain/entities/Player.ts
  - packages/client/src/application/useLobbyState.ts
  - packages/client/src/presentation/components/SkillSelectionOverlay.tsx
  - packages/client/src/application/useRoom.ts
  - packages/server/src/domain/entities/GameSession.ts
  - packages/server/src/domain/interfaces/IPlayerRepository.ts
  - packages/server/src/domain/interfaces/IRoomRepository.ts
  - packages/server/src/infrastructure/migrate.ts
  - packages/server/src/domain/entities/SkillDraw.ts
  - .github/workflows/deploy-client.yml
  - packages/client/src/domain/itemDefs.ts
  - packages/client/src/domain/skillDefs.ts
  - packages/server/src/infrastructure/repositories/PlayerRepository.ts
  - packages/server/src/domain/interfaces/IGameSession.ts
  - packages/server/src/presentation/routes/roomsRouter.ts
  - packages/server/src/presentation/routes/authRouter.ts
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/client/tsconfig.node.json
  - packages/client/src/presentation/pages/MainMenuPage.tsx
  - packages/server/src/domain/entities/ClassDefs.ts
  - packages/client/src/components/ui/button.tsx
  - packages/client/public/icons.svg
  - packages/server/src/infrastructure/migrations/003_create_player_results.sql
  - packages/client/eslint.config.js
  - packages/server/src/domain/entities/EquipmentDefs.ts
  - packages/server/tsconfig.json
  - packages/client/src/presentation/components/RewardSelectionOverlay.tsx
  - packages/server/src/domain/.gitkeep
  - packages/client/src/application/useAuth.ts
  - packages/client/src/application/useRoomCodeFromURL.ts
  - packages/server/src/domain/entities/PlayerInput.ts
  - packages/server/src/application/use-cases/LoginUseCase.ts
  - packages/server/src/domain/entities/SkillPools.ts
  - packages/client/tsconfig.app.json
  - README.md
  - packages/client/src/presentation/pages/SettingsPage.tsx
  - packages/client/src/components/ui/card.tsx
  - packages/client/src/infrastructure/qrcode.ts
  - packages/client/src/assets/hero.png
  - packages/server/src/application/use-cases/RegisterUseCase.ts
  - packages/client/src/presentation/pages/LobbyPage.tsx
  - packages/client/src/presentation/pages/GamePage.tsx
  - .env.example
  - packages/client/src/components/ui/input.tsx
  - packages/client/src/App.css
  - packages/client/src/presentation/pages/AuthPage.tsx
  - packages/client/vite.config.ts
-->

### Requirement: Players attack the Boss automatically

The system SHALL apply the same auto-attack logic used in survival phase to the Boss. Players SHALL focus movement on dodging Boss attacks. Friendly fire SHALL NOT occur.

#### Scenario: Auto-attack damages Boss

- **WHEN** a player is within attack range of the Boss
- **THEN** the server applies the player's damage to Boss HP at the player's attack rate

## Requirements

<!-- @trace
source: desolate-bond-core
updated: 2026-04-10
code:
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/infrastructure/repositories/GameSessionRepository.ts
  - docker-compose.yml
  - .gitattributes
  - packages/client/src/application/.gitkeep
  - packages/client/src/infrastructure/colyseus/client.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/entities/DifficultyScaling.ts
  - packages/server/src/presentation/.gitkeep
  - packages/client/src/presentation/.gitkeep
  - packages/client/src/infrastructure/.gitkeep
  - packages/client/src/lib/utils.ts
  - packages/server/src/domain/entities/RoomCode.ts
  - packages/server/src/infrastructure/auth/jwt.ts
  - packages/client/src/main.tsx
  - packages/client/index.html
  - packages/client/src/presentation/components/RoomQRCode.tsx
  - packages/client/src/application/useGameSettings.ts
  - packages/client/src/domain/RemotePlayerInterpolator.ts
  - packages/server/railway.json
  - packages/client/src/domain/.gitkeep
  - packages/server/src/infrastructure/db.ts
  - packages/server/src/domain/entities/Room.ts
  - packages/client/src/components/pixel-ui.tsx
  - packages/server/src/domain/entities/BotController.ts
  - packages/server/src/index.ts
  - packages/client/public/favicon.svg
  - packages/client/src/assets/react.svg
  - packages/server/src/infrastructure/migrations/001_create_users.sql
  - packages/server/package.json
  - CLAUDE.md
  - packages/client/src/components/ui/tabs.tsx
  - packages/server/src/presentation/routes/leaderboardRouter.ts
  - packages/server/src/application/.gitkeep
  - packages/client/tsconfig.json
  - packages/server/src/infrastructure/auth/jwtRoom.ts
  - packages/server/src/application/use-cases/GuestLoginUseCase.ts
  - packages/client/src/infrastructure/api.ts
  - packages/client/src/components/ui/label.tsx
  - .github/workflows/deploy-server.yml
  - packages/client/src/index.css
  - packages/client/src/presentation/pages/LeaderboardPage.tsx
  - packages/server/src/infrastructure/.gitkeep
  - package.json
  - packages/client/src/assets/vite.svg
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/infrastructure/migrations/002_create_game_sessions.sql
  - packages/client/components.json
  - packages/client/package.json
  - packages/client/README.md
  - packages/client/src/App.tsx
  - packages/client/src/presentation/pages/HelpPage.tsx
  - packages/server/src/domain/entities/Player.ts
  - packages/client/src/application/useLobbyState.ts
  - packages/client/src/presentation/components/SkillSelectionOverlay.tsx
  - packages/client/src/application/useRoom.ts
  - packages/server/src/domain/entities/GameSession.ts
  - packages/server/src/domain/interfaces/IPlayerRepository.ts
  - packages/server/src/domain/interfaces/IRoomRepository.ts
  - packages/server/src/infrastructure/migrate.ts
  - packages/server/src/domain/entities/SkillDraw.ts
  - .github/workflows/deploy-client.yml
  - packages/client/src/domain/itemDefs.ts
  - packages/client/src/domain/skillDefs.ts
  - packages/server/src/infrastructure/repositories/PlayerRepository.ts
  - packages/server/src/domain/interfaces/IGameSession.ts
  - packages/server/src/presentation/routes/roomsRouter.ts
  - packages/server/src/presentation/routes/authRouter.ts
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/client/tsconfig.node.json
  - packages/client/src/presentation/pages/MainMenuPage.tsx
  - packages/server/src/domain/entities/ClassDefs.ts
  - packages/client/src/components/ui/button.tsx
  - packages/client/public/icons.svg
  - packages/server/src/infrastructure/migrations/003_create_player_results.sql
  - packages/client/eslint.config.js
  - packages/server/src/domain/entities/EquipmentDefs.ts
  - packages/server/tsconfig.json
  - packages/client/src/presentation/components/RewardSelectionOverlay.tsx
  - packages/server/src/domain/.gitkeep
  - packages/client/src/application/useAuth.ts
  - packages/client/src/application/useRoomCodeFromURL.ts
  - packages/server/src/domain/entities/PlayerInput.ts
  - packages/server/src/application/use-cases/LoginUseCase.ts
  - packages/server/src/domain/entities/SkillPools.ts
  - packages/client/tsconfig.app.json
  - README.md
  - packages/client/src/presentation/pages/SettingsPage.tsx
  - packages/client/src/components/ui/card.tsx
  - packages/client/src/infrastructure/qrcode.ts
  - packages/client/src/assets/hero.png
  - packages/server/src/application/use-cases/RegisterUseCase.ts
  - packages/client/src/presentation/pages/LobbyPage.tsx
  - packages/client/src/presentation/pages/GamePage.tsx
  - .env.example
  - packages/client/src/components/ui/input.tsx
  - packages/client/src/App.css
  - packages/client/src/presentation/pages/AuthPage.tsx
  - packages/client/vite.config.ts
-->

### Requirement: Pre-boss selection pauses progression for skill selection

When the session enters PRE_BOSS_SELECTION, the system SHALL display a skill selection UI to every player simultaneously. Each player selects one skill from 3 options. A 30-second countdown SHALL be shown. When the countdown expires, any player who has not selected SHALL have a skill chosen randomly on their behalf. The boss battle SHALL NOT begin until all players have completed selection or the timer expires.

#### Scenario: All players select before timer expires

- **WHEN** every player has confirmed a skill selection
- **THEN** the session immediately transitions to BOSS_BATTLE without waiting for the timer

#### Scenario: Timer expires before all players select

- **WHEN** the 30-second timer reaches 0 and one or more players have not selected
- **THEN** the system assigns a random skill to each non-selecting player and transitions to BOSS_BATTLE

---
### Requirement: Each round features a unique Boss with distinct behavior

The system SHALL assign a specific Boss to each of the 3 rounds. Each Boss SHALL have a unique set of attack patterns, movement behavior, and visual appearance.

#### Scenario: Correct boss spawns for each round

- **WHEN** the session enters BOSS_BATTLE for round N
- **THEN** the Boss assigned to round N is spawned at the designated spawn point

---
### Requirement: Boss HP and damage scale linearly with player count

The system SHALL scale Boss HP and damage output based on the number of active players (human + Bot) at the start of the boss battle using the formula: HP = base × (1 + (count − 1) × 0.6), damage = base × (1 + (count − 1) × 0.4).

#### Scenario: Solo player faces base difficulty

- **WHEN** the boss battle starts with 1 active player
- **THEN** Boss HP and damage equal the base values

#### Scenario: Four players face scaled difficulty

- **WHEN** the boss battle starts with 4 active players
- **THEN** Boss HP equals base × 2.8 and Boss damage equals base × 2.2

---
### Requirement: Boss enters a frenzied second phase at 50% HP

The system SHALL trigger a phase transition when Boss HP drops to 50% or below. In phase 2 the Boss SHALL switch to its phase 2 pattern set (which contains at least one pattern not used in phase 1) and its movement speed SHALL increase.

#### Scenario: Phase 2 triggers at 50% HP

- **WHEN** Boss HP reaches 50% of its scaled maximum
- **THEN** the server fires a phase-change event, switches the Boss pattern scheduler to the phase 2 pattern set, updates movement speed, and all clients play the phase transition visual effect

#### Scenario: Phase 2 introduces a previously unused pattern

- **WHEN** phase 2 begins
- **THEN** the phase 2 pattern set contains at least one pattern identifier that was not in the phase 1 pattern set for the same Boss

---
### Requirement: Post-boss reward selection pauses progression

When the session enters POST_BOSS_SELECTION, the system SHALL display a reward selection UI to every player. Each player chooses one of 3 reward options (items or skill upgrades). A 30-second countdown is shown. When the countdown expires any player who has not selected receives a random reward.

#### Scenario: All players select reward before timer

- **WHEN** every player confirms a reward selection
- **THEN** rewards are applied and the session proceeds (next round or RESULT)

#### Scenario: Timer expires for non-selecting players

- **WHEN** the 30-second timer reaches 0 and some players have not selected
- **THEN** the system assigns random rewards to those players and proceeds

---
### Requirement: Players attack the Boss automatically

The system SHALL apply the same auto-attack logic used in survival phase to the Boss. Players SHALL focus movement on dodging Boss attacks. Friendly fire SHALL NOT occur.

#### Scenario: Auto-attack damages Boss

- **WHEN** a player is within attack range of the Boss
- **THEN** the server applies the player's damage to Boss HP at the player's attack rate

---
### Requirement: Boss roster spans the extended attack pattern library

The system SHALL support the extended Boss attack pattern library consisting of: `MELEE`, `CHARGE`, `PROJECTILE`, `AREA`, `DASH_LINE`, `RING_BURST`, `SUMMON`, and `BEAM`. Each Boss SHALL be configured with a phase 1 pattern set and a phase 2 pattern set, where phase 2 contains at least one pattern not present in phase 1. The Boss pattern registry SHALL assign patterns as follows:

- GOLEM phase 1: `MELEE`, `CHARGE`, `RING_BURST`; phase 2 adds `SUMMON`.
- WRAITH phase 1: `PROJECTILE`, `AREA`, `BEAM`; phase 2 adds `RING_BURST`.
- DRAGON phase 1: `MELEE`, `PROJECTILE`, `AREA`, `DASH_LINE`; phase 2 adds `BEAM`.

#### Scenario: GOLEM phase 2 uses SUMMON pattern

- **WHEN** GOLEM HP drops to 50% and phase 2 begins
- **THEN** the Boss pattern scheduler includes `SUMMON` in the selectable pattern pool for subsequent attacks

#### Scenario: WRAITH phase 1 does not use RING_BURST

- **WHEN** WRAITH is in phase 1
- **THEN** the Boss pattern scheduler SHALL NOT select `RING_BURST`


<!-- @trace
source: enhance-combat-variety
updated: 2026-04-17
code:
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/server/src/domain/boss/patterns/beamPattern.ts
  - packages/server/src/domain/enemy/basicBehavior.ts
  - packages/server/src/domain/boss/patterns/areaPattern.ts
  - packages/server/src/domain/enemy/eliteBehavior.ts
  - packages/server/src/domain/enemy/exploderBehavior.ts
  - packages/server/src/domain/boss/patterns/projectilePattern.ts
  - packages/server/src/domain/boss/patterns/registry.ts
  - packages/server/src/domain/boss/patterns/dashLinePattern.ts
  - packages/server/src/domain/enemy/rangedBehavior.ts
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/domain/boss/patterns/meleePattern.ts
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/enemy/registry.ts
  - packages/server/src/domain/boss/patterns/types.ts
  - CLAUDE.md
  - packages/server/src/domain/boss/patterns/summonPattern.ts
  - packages/server/src/domain/boss/patterns/ringBurstPattern.ts
  - packages/server/src/domain/enemy/types.ts
-->

---
### Requirement: Every damaging Boss pattern emits a telegraph before resolving

The system SHALL, for every Boss pattern in `{MELEE, CHARGE, PROJECTILE, AREA, DASH_LINE, RING_BURST, SUMMON, BEAM}` that applies damage to a spatial region, emit at least one telegraph entry through the telegraph system before the damage resolves. The telegraph shape SHALL match the pattern semantics:

- `MELEE`, `AREA`, `RING_BURST`, `SUMMON` spawn region: `CIRCLE`
- `CHARGE`, `DASH_LINE`, `BEAM`: `LINE`
- `PROJECTILE` with area burst on impact: `CIRCLE` at impact point (projectiles themselves do not require a telegraph)

Damage from these patterns SHALL NOT apply before the associated telegraph's `fireAt`.

#### Scenario: BEAM emits a LINE telegraph before firing

- **WHEN** WRAITH begins casting `BEAM` aimed at a target point
- **THEN** the server emits a `LINE` telegraph from WRAITH position to the target point with `fireAt` at least 300 ms after `startAt`, and no damage is applied to entities along the line before `fireAt`

#### Scenario: RING_BURST emits concentric circular telegraphs

- **WHEN** GOLEM casts `RING_BURST`
- **THEN** the server emits one or more `CIRCLE` telegraphs centered on GOLEM whose resolution order matches the ring sequence

<!-- @trace
source: enhance-combat-variety
updated: 2026-04-17
code:
  - packages/client/src/infrastructure/phaser/GameScene.ts
  - packages/server/src/domain/boss/patterns/beamPattern.ts
  - packages/server/src/domain/enemy/basicBehavior.ts
  - packages/server/src/domain/boss/patterns/areaPattern.ts
  - packages/server/src/domain/enemy/eliteBehavior.ts
  - packages/server/src/domain/enemy/exploderBehavior.ts
  - packages/server/src/domain/boss/patterns/projectilePattern.ts
  - packages/server/src/domain/boss/patterns/registry.ts
  - packages/server/src/domain/boss/patterns/dashLinePattern.ts
  - packages/server/src/domain/enemy/rangedBehavior.ts
  - packages/server/src/infrastructure/colyseus/LobbySchema.ts
  - packages/server/src/domain/boss/patterns/meleePattern.ts
  - packages/server/src/domain/entities/BossDefs.ts
  - packages/server/src/presentation/rooms/GameRoom.ts
  - packages/server/src/domain/enemy/registry.ts
  - packages/server/src/domain/boss/patterns/types.ts
  - CLAUDE.md
  - packages/server/src/domain/boss/patterns/summonPattern.ts
  - packages/server/src/domain/boss/patterns/ringBurstPattern.ts
  - packages/server/src/domain/enemy/types.ts
-->