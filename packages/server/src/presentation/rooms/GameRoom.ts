import { Room, Client, matchMaker } from '@colyseus/core';
import { LobbyState, PlayerSchema } from '../../infrastructure/colyseus/LobbySchema.js';
import { generateUniqueCode } from '../../domain/entities/RoomCode.js';
import { verifyToken } from '../../infrastructure/auth/jwtRoom.js';

const BOT_NAMES = ['勇者Bot', '鐵壁Bot', '治癒Bot', '疾風Bot'];

export class GameRoom extends Room<{ state: LobbyState; metadata: { roomCode: string } }> {
  maxClients = 4;

  async onCreate(_options: unknown) {
    this.setState(new LobbyState());

    const code = generateUniqueCode((c) => this.isCodeActive(c));
    this.state.roomCode = code;
    this.setMetadata({ roomCode: code });

    this.onMessage('SELECT_CLASS', (client, message: { playerClass: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
      const valid = ['TANK', 'DAMAGE', 'SUPPORT'];
      if (!valid.includes(message.playerClass)) return;
      player.selectedClass = message.playerClass;
    });

    this.onMessage('ADD_BOT', (client, _message: unknown) => {
      const requester = this.state.players.get(client.sessionId);
      if (!requester?.isHost) return;

      const botCount = this.botCount();
      const humanCount = this.humanCount();
      if (botCount >= 3 || humanCount + botCount >= 4) return;

      const bot = new PlayerSchema();
      bot.id = `bot_${crypto.randomUUID()}`;
      bot.displayName = BOT_NAMES[botCount] ?? `Bot ${botCount + 1}`;
      bot.isBot = true;
      bot.selectedClass = this.randomClass();
      bot.isReady = true;
      this.state.players.set(bot.id, bot);
    });

    this.onMessage('REMOVE_BOT', (client, message: { botId: string }) => {
      const requester = this.state.players.get(client.sessionId);
      if (!requester?.isHost) return;

      const target = this.state.players.get(message.botId);
      if (!target?.isBot) return;
      this.state.players.delete(message.botId);
    });

    this.onMessage('START_GAME', (client, _message: unknown) => {
      const requester = this.state.players.get(client.sessionId);
      if (!requester?.isHost) return;
      if (this.state.gameState !== 'LOBBY') return;

      const notReady = this.unreadyHumans();
      if (notReady.length > 0) {
        this.send(client, 'START_BLOCKED', { notReady });
        return;
      }

      this.state.gameState = 'SURVIVAL_PHASE';
    });
  }

  async onAuth(_client: Client, options: { token?: string }) {
    if (!options.token) throw new Error('UNAUTHORIZED');
    return verifyToken(options.token);
  }

  onJoin(client: Client, _options: unknown, auth: { sub: string; displayName?: string; username?: string; isGuest?: boolean }) {
    const player = new PlayerSchema();
    player.id = auth.sub;
    player.displayName = auth.username ?? auth.displayName ?? auth.sub;
    player.isGuest = auth.isGuest ?? false;
    player.isHost = this.humanCount() === 0;
    player.isBot = false;
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);

    // Reassign host to first remaining human
    if (this.humanCount() > 0) {
      for (const [, p] of this.state.players) {
        if (!p.isBot) { p.isHost = true; break; }
      }
    }
  }

  onDispose() {}

  private unreadyHumans(): string[] {
    const names: string[] = [];
    for (const [, p] of this.state.players) {
      if (!p.isBot && !p.selectedClass) names.push(p.displayName);
    }
    return names;
  }

  private humanCount(): number {
    let count = 0;
    for (const [, p] of this.state.players) { if (!p.isBot) count++; }
    return count;
  }

  private botCount(): number {
    let count = 0;
    for (const [, p] of this.state.players) { if (p.isBot) count++; }
    return count;
  }

  private randomClass(): string {
    const classes = ['TANK', 'DAMAGE', 'SUPPORT'];
    return classes[Math.floor(Math.random() * classes.length)]!;
  }

  private isCodeActive(code: string): boolean {
    const rooms = matchMaker.query({ metadata: { roomCode: code } });
    return Array.isArray(rooms) && rooms.length > 0;
  }
}
