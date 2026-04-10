## ADDED Requirements

### Requirement: Player enters downed state when HP reaches zero

The system SHALL transition a player to DOWNED state when their HP reaches 0. A downed player SHALL stop dealing damage and stop moving under player input. The downed player's character SHALL remain visible on the map at their position.

#### Scenario: HP reaches zero triggers downed state

- **WHEN** a player receives damage that reduces HP to 0 or below
- **THEN** the server transitions that player to DOWNED state and broadcasts the state change to all clients


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

### Requirement: Downed player can send a rescue ping

The system SHALL allow a player in DOWNED state to send a rescue ping signal. The ping SHALL display a visual indicator on all teammates' screens at the downed player's map position.

#### Scenario: Downed player sends rescue ping

- **WHEN** a downed player activates the rescue ping input
- **THEN** all active teammates see a rescue indicator at the downed player's position for 3 seconds


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

### Requirement: Active teammate can rescue a downed player

The system SHALL allow any active player (human or Bot) to rescue a downed teammate by overlapping with their rescue hitbox and holding the rescue input for a fixed duration. Upon successful rescue, the downed player returns to active state with a partial HP restoration.

#### Scenario: Rescue completes successfully

- **WHEN** an active player holds the rescue input while overlapping a downed player's hitbox for the required duration
- **THEN** the downed player transitions to ACTIVE state with partial HP restored

#### Scenario: Rescue is interrupted by damage

- **WHEN** the rescuing player receives damage during the rescue action
- **THEN** the rescue action is cancelled and the rescuing player must restart the hold input


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

### Requirement: All players downed simultaneously triggers game over

The system SHALL monitor the DOWNED state count. When all players are simultaneously in DOWNED state, the server SHALL transition the session to GAME_OVER.

#### Scenario: Last active player goes down

- **WHEN** the final active player transitions to DOWNED state
- **THEN** the server transitions the session to GAME_OVER within 1 tick


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

### Requirement: Downed player can observe teammates' views while waiting

The system SHALL allow a downed player to cycle through the viewpoints of active teammates using a designated input. The downed player's camera SHALL follow the selected teammate.

#### Scenario: Downed player switches view to teammate

- **WHEN** a downed player presses the cycle-view input
- **THEN** the camera follows the next active teammate in the rotation order


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

### Requirement: No friendly fire between players

The system SHALL ensure that player attack actions do not apply damage to other players or Bots. Player attacks SHALL only damage enemies and Boss entities.

#### Scenario: Player attack does not hit teammate

- **WHEN** a player's attack hitbox overlaps with a teammate's hitbox
- **THEN** no damage is applied to the teammate

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

### Requirement: Player enters downed state when HP reaches zero

The system SHALL transition a player to DOWNED state when their HP reaches 0. A downed player SHALL stop dealing damage and stop moving under player input. The downed player's character SHALL remain visible on the map at their position.

#### Scenario: HP reaches zero triggers downed state

- **WHEN** a player receives damage that reduces HP to 0 or below
- **THEN** the server transitions that player to DOWNED state and broadcasts the state change to all clients

---
### Requirement: Downed player can send a rescue ping

The system SHALL allow a player in DOWNED state to send a rescue ping signal. The ping SHALL display a visual indicator on all teammates' screens at the downed player's map position.

#### Scenario: Downed player sends rescue ping

- **WHEN** a downed player activates the rescue ping input
- **THEN** all active teammates see a rescue indicator at the downed player's position for 3 seconds

---
### Requirement: Active teammate can rescue a downed player

The system SHALL allow any active player (human or Bot) to rescue a downed teammate by overlapping with their rescue hitbox and holding the rescue input for a fixed duration. Upon successful rescue, the downed player returns to active state with a partial HP restoration.

#### Scenario: Rescue completes successfully

- **WHEN** an active player holds the rescue input while overlapping a downed player's hitbox for the required duration
- **THEN** the downed player transitions to ACTIVE state with partial HP restored

#### Scenario: Rescue is interrupted by damage

- **WHEN** the rescuing player receives damage during the rescue action
- **THEN** the rescue action is cancelled and the rescuing player must restart the hold input

---
### Requirement: All players downed simultaneously triggers game over

The system SHALL monitor the DOWNED state count. When all players are simultaneously in DOWNED state, the server SHALL transition the session to GAME_OVER.

#### Scenario: Last active player goes down

- **WHEN** the final active player transitions to DOWNED state
- **THEN** the server transitions the session to GAME_OVER within 1 tick

---
### Requirement: Downed player can observe teammates' views while waiting

The system SHALL allow a downed player to cycle through the viewpoints of active teammates using a designated input. The downed player's camera SHALL follow the selected teammate.

#### Scenario: Downed player switches view to teammate

- **WHEN** a downed player presses the cycle-view input
- **THEN** the camera follows the next active teammate in the rotation order

---
### Requirement: No friendly fire between players

The system SHALL ensure that player attack actions do not apply damage to other players or Bots. Player attacks SHALL only damage enemies and Boss entities.

#### Scenario: Player attack does not hit teammate

- **WHEN** a player's attack hitbox overlaps with a teammate's hitbox
- **THEN** no damage is applied to the teammate