import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { runMigrations, MIGRATIONS } from './infrastructure/migrate.js';
import { authRouter } from './presentation/routes/authRouter.js';
import { roomsRouter } from './presentation/routes/roomsRouter.js';
import { GameRoom } from './presentation/rooms/GameRoom.js';

const port = Number(process.env['PORT'] ?? 2567);

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use('/rooms', roomsRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define('game_room', GameRoom);

runMigrations(MIGRATIONS)
  .then(() => gameServer.listen(port))
  .then(() => console.log(`[server] listening on port ${port}`))
  .catch((err) => {
    console.error('[server] startup failed', err);
    process.exit(1);
  });
