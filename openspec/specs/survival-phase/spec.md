## ADDED Requirements

### Requirement: Survival phase runs for a fixed countdown duration

The system SHALL start a countdown timer when entering SURVIVAL_PHASE. When the timer reaches zero the session SHALL automatically transition to PRE_BOSS_SELECTION. The timer value SHALL be identical for all players.

#### Scenario: Timer expires and phase ends

- **WHEN** the survival phase timer reaches 0
- **THEN** the server transitions the session to PRE_BOSS_SELECTION and all clients display the skill selection UI


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

### Requirement: Players move freely on the fixed map

The system SHALL render a fixed tile map. Players SHALL move using WASD (keyboard). Player position SHALL be updated by the server each tick based on received input.

#### Scenario: Player moves in response to input

- **WHEN** a player holds a movement key
- **THEN** the player's character moves in the corresponding direction at the player's current movement speed


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

### Requirement: Players attack automatically targeting the nearest enemy

The system SHALL cause each player to automatically attack the nearest enemy within attack range each attack cycle. Attack range and attack speed SHALL be determined by the player's weapon and stats.

#### Scenario: Auto-attack fires when enemy is in range

- **WHEN** an enemy is within the player's attack range
- **THEN** the server applies damage to the enemy at the player's attack rate without any player input

#### Scenario: No attack when no enemy is in range

- **WHEN** no enemy is within attack range
- **THEN** no attack action is performed


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

### Requirement: Players gain experience from killing enemies and level up

The system SHALL award experience points to the player who deals the killing blow. When accumulated experience reaches the threshold the player levels up and the skill selection UI is displayed. Leveling up does NOT pause the game.

#### Scenario: Kill grants experience

- **WHEN** a player kills an enemy
- **THEN** the server awards experience points to that player

#### Scenario: Experience threshold reached triggers level up

- **WHEN** a player's experience reaches the level threshold
- **THEN** the server increments the player's level, resets excess experience, and sends a level-up event to that player's client


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

### Requirement: Skill selection UI presents 3 options on level up

The system SHALL present exactly 3 skill options drawn from the player's class skill pool and the shared common pool when a player levels up. The player SHALL select one skill. The game SHALL NOT pause during selection. If the player already holds 6 skills, one existing skill SHALL be offered for upgrade instead.

#### Scenario: Player selects a skill

- **WHEN** a player clicks one of the 3 presented skill options
- **THEN** the selected skill is added to the player's active skill list and the selection UI closes

#### Scenario: Selection UI closes automatically if player ignores it

- **WHEN** the player closes the UI without selecting (or the survival phase ends)
- **THEN** the system SHALL auto-select a random skill from the 3 options on the player's behalf


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

### Requirement: Items and resources spawn at randomized positions each run

The system SHALL spawn health packs, weapons, passive items, and upgrade stones at positions drawn randomly from a predefined node pool each run. The tile map layout SHALL remain fixed.

#### Scenario: Resource positions differ between runs

- **WHEN** a new game session starts
- **THEN** resource spawn positions are randomized from the node pool and differ from the previous run


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

### Requirement: Elite enemies spawn on a fixed interval during survival phase

The system SHALL spawn one elite enemy at a random location on the map at a fixed interval. Elite enemies SHALL have higher HP and deal more damage than normal enemies. Defeating an elite enemy SHALL drop a better reward.

#### Scenario: Elite spawns at interval

- **WHEN** the elite spawn timer fires
- **THEN** one elite enemy appears at a random valid map position

#### Scenario: Elite drops enhanced reward on death

- **WHEN** a player kills an elite enemy
- **THEN** the elite drops a higher-tier item or larger experience orb compared to normal enemies


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

### Requirement: Killing enemies restores a small amount of HP

The system SHALL restore a fixed small amount of HP to the killing player each time they defeat an enemy. This amount SHALL stack with skill-based healing effects.

#### Scenario: Kill-on-hit healing triggers

- **WHEN** a player kills an enemy
- **THEN** the player's current HP increases by the kill-heal value, capped at max HP

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

### Requirement: Survival phase runs for a fixed countdown duration

The system SHALL start a countdown timer when entering SURVIVAL_PHASE. When the timer reaches zero the session SHALL automatically transition to PRE_BOSS_SELECTION. The timer value SHALL be identical for all players.

#### Scenario: Timer expires and phase ends

- **WHEN** the survival phase timer reaches 0
- **THEN** the server transitions the session to PRE_BOSS_SELECTION and all clients display the skill selection UI

---
### Requirement: Players move freely on the fixed map

The system SHALL render a fixed tile map. Players SHALL move using WASD (keyboard). Player position SHALL be updated by the server each tick based on received input.

#### Scenario: Player moves in response to input

- **WHEN** a player holds a movement key
- **THEN** the player's character moves in the corresponding direction at the player's current movement speed

---
### Requirement: Players attack automatically targeting the nearest enemy

The system SHALL cause each player to automatically attack the nearest enemy within attack range each attack cycle. Attack range and attack speed SHALL be determined by the player's weapon and stats.

#### Scenario: Auto-attack fires when enemy is in range

- **WHEN** an enemy is within the player's attack range
- **THEN** the server applies damage to the enemy at the player's attack rate without any player input

#### Scenario: No attack when no enemy is in range

- **WHEN** no enemy is within attack range
- **THEN** no attack action is performed

---
### Requirement: Players gain experience from killing enemies and level up

The system SHALL award experience points to the player who deals the killing blow. When accumulated experience reaches the threshold the player levels up and the skill selection UI is displayed. Leveling up does NOT pause the game.

#### Scenario: Kill grants experience

- **WHEN** a player kills an enemy
- **THEN** the server awards experience points to that player

#### Scenario: Experience threshold reached triggers level up

- **WHEN** a player's experience reaches the level threshold
- **THEN** the server increments the player's level, resets excess experience, and sends a level-up event to that player's client

---
### Requirement: Skill selection UI presents 3 options on level up

The system SHALL present exactly 3 skill options drawn from the player's class skill pool and the shared common pool when a player levels up. The player SHALL select one skill. The game SHALL NOT pause during selection. If the player already holds 6 skills, one existing skill SHALL be offered for upgrade instead.

#### Scenario: Player selects a skill

- **WHEN** a player clicks one of the 3 presented skill options
- **THEN** the selected skill is added to the player's active skill list and the selection UI closes

#### Scenario: Selection UI closes automatically if player ignores it

- **WHEN** the player closes the UI without selecting (or the survival phase ends)
- **THEN** the system SHALL auto-select a random skill from the 3 options on the player's behalf

---
### Requirement: Items and resources spawn at randomized positions each run

The system SHALL spawn health packs, weapons, passive items, and upgrade stones at positions drawn randomly from a predefined node pool each run. The tile map layout SHALL remain fixed.

#### Scenario: Resource positions differ between runs

- **WHEN** a new game session starts
- **THEN** resource spawn positions are randomized from the node pool and differ from the previous run

---
### Requirement: Elite enemies spawn on a fixed interval during survival phase

The system SHALL spawn one elite enemy at a random location on the map at a fixed interval. Elite enemies SHALL have higher HP and deal more damage than normal enemies. Defeating an elite enemy SHALL drop a better reward.

#### Scenario: Elite spawns at interval

- **WHEN** the elite spawn timer fires
- **THEN** one elite enemy appears at a random valid map position

#### Scenario: Elite drops enhanced reward on death

- **WHEN** a player kills an elite enemy
- **THEN** the elite drops a higher-tier item or larger experience orb compared to normal enemies

---
### Requirement: Killing enemies restores a small amount of HP

The system SHALL restore a fixed small amount of HP to the killing player each time they defeat an enemy. This amount SHALL stack with skill-based healing effects.

#### Scenario: Kill-on-hit healing triggers

- **WHEN** a player kills an enemy
- **THEN** the player's current HP increases by the kill-heal value, capped at max HP