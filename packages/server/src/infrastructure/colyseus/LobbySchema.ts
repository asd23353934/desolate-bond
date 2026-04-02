import { Schema, MapSchema, type, ArraySchema } from '@colyseus/schema';

// DESIGN RULE (6.6): Static data (skill definitions, map tiles, item stats) must NOT
// be placed in Schema. Clients look up static data from local tables by ID.
// Only mutable, per-player/per-session runtime state belongs here.

export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') displayName: string = '';
  @type('boolean') isGuest: boolean = false;
  @type('boolean') isHost: boolean = false;
  @type('boolean') isBot: boolean = false;
  @type('string') selectedClass: string = '';  // '' | 'TANK' | 'DAMAGE' | 'SUPPORT'
  @type('boolean') isReady: boolean = false;
  @type('boolean') isDown: boolean = false;
  @type('boolean') isDisconnected: boolean = false;
  @type('float32') x: number = 0;             // float32 keeps payload small (6.6)
  @type('float32') y: number = 0;
  @type('int32')   hp: number = 0;
  @type('int32')   maxHp: number = 0;
  @type('int32')   xp: number = 0;
  @type('int32')   level: number = 1;
  // Skill and equipment IDs only — clients resolve display/stats from local tables (6.6)
  @type(['string']) skillIds = new ArraySchema<string>();
  @type(['string']) equipmentIds = new ArraySchema<string>();  // max 5: 1 weapon + 4 passive
}

export class EnemySchema extends Schema {
  @type('string')  id: string = '';
  @type('string')  type: string = 'basic';   // 'basic' | 'elite' — clients look up sprite/stats by type
  @type('float32') x: number = 0;
  @type('float32') y: number = 0;
  @type('int32')   hp: number = 0;
  @type('int32')   maxHp: number = 0;
}

export class ItemSchema extends Schema {
  @type('string') id: string = '';
  @type('string') type: string = '';  // 'HEALTH_PACK' | 'WEAPON' | 'PASSIVE' | 'UPGRADE_STONE'
  @type('float32') x: number = 0;
  @type('float32') y: number = 0;
}

/** Lightweight projectile — kept separate from PlayerSchema to avoid polluting player delta (6.6). */
export class ProjectileSchema extends Schema {
  @type('string')  id: string = '';
  @type('float32') x: number = 0;
  @type('float32') y: number = 0;
  @type('float32') angle: number = 0;  // radians
}

export class LobbyState extends Schema {
  @type('string') roomCode: string = '';
  @type('string') gameState: string = 'LOBBY';
  @type('number') currentRound: number = 0;
  @type('int32')  survivalTimeLeft: number = 0;  // seconds remaining in SURVIVAL_PHASE
  @type({ map: PlayerSchema })     players     = new MapSchema<PlayerSchema>();
  @type({ map: EnemySchema })      enemies     = new MapSchema<EnemySchema>();
  @type({ map: ItemSchema })       items       = new MapSchema<ItemSchema>();
  @type({ map: ProjectileSchema }) projectiles = new MapSchema<ProjectileSchema>();
}
