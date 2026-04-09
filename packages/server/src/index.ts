import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { runMigrations, MIGRATIONS } from './infrastructure/migrate.js';
import { authRouter } from './presentation/routes/authRouter.js';
import { roomsRouter } from './presentation/routes/roomsRouter.js';
import { leaderboardRouter } from './presentation/routes/leaderboardRouter.js';
import { GameRoom } from './presentation/rooms/GameRoom.js';

const port = Number(process.env['PORT'] ?? 2567);

const app = express();

const allowedOrigins = (process.env['CORS_ORIGINS'] ?? 'http://localhost:5173').split(',');
app.use((req, res, next) => {
  const origin = req.headers['origin'];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

app.use(express.json());
app.use('/auth', authRouter);
app.use('/rooms', roomsRouter);
app.use('/leaderboard', leaderboardRouter);
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
