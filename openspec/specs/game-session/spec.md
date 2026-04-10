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

### Requirement: A complete run consists of exactly 3 rounds

The system SHALL structure each run as 3 sequential rounds. Each round consists of one SURVIVAL_PHASE followed by one BOSS_BATTLE. After Round 3 the session ends.

#### Scenario: Round counter increments correctly

- **WHEN** POST_BOSS_SELECTION completes for a round
- **THEN** the round counter increments by 1 and SURVIVAL_PHASE begins for the next round, unless the current round is Round 3


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

### Requirement: Session result is recorded on completion

The system SHALL persist the session result including each player's stats when the session reaches the RESULT state, regardless of whether the run was cleared or failed.

#### Scenario: Result is saved after game over

- **WHEN** the session reaches RESULT state
- **THEN** the system writes one player_results record per player to the database before displaying the results screen

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

---
### Requirement: A complete run consists of exactly 3 rounds

The system SHALL structure each run as 3 sequential rounds. Each round consists of one SURVIVAL_PHASE followed by one BOSS_BATTLE. After Round 3 the session ends.

#### Scenario: Round counter increments correctly

- **WHEN** POST_BOSS_SELECTION completes for a round
- **THEN** the round counter increments by 1 and SURVIVAL_PHASE begins for the next round, unless the current round is Round 3

---
### Requirement: Session result is recorded on completion

The system SHALL persist the session result including each player's stats when the session reaches the RESULT state, regardless of whether the run was cleared or failed.

#### Scenario: Result is saved after game over

- **WHEN** the session reaches RESULT state
- **THEN** the system writes one player_results record per player to the database before displaying the results screen