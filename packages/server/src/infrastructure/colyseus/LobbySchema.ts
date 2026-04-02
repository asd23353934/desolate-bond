import { Schema, MapSchema, type, ArraySchema } from '@colyseus/schema';

export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') displayName: string = '';
  @type('boolean') isGuest: boolean = false;
  @type('boolean') isHost: boolean = false;
  @type('boolean') isBot: boolean = false;
  @type('string') selectedClass: string = '';  // '' | 'TANK' | 'DAMAGE' | 'SUPPORT'
  @type('boolean') isReady: boolean = false;
}

export class LobbyState extends Schema {
  @type('string') roomCode: string = '';
  @type('string') gameState: string = 'LOBBY';
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
}
