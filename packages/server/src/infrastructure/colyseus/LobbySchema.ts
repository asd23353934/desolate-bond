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
  // 12.4: downed player spectating — '' = not spectating, otherwise id of followed player
  @type('string')   spectatingId: string = '';
  // 13.1: per-run stats — accumulated during the session
  @type('int32')    totalDamage: number = 0;
  @type('int32')    totalDamageTaken: number = 0;
  @type('int32')    killCount: number = 0;
  @type('int32')    downCount: number = 0;
  @type('int32')    rescueCount: number = 0;
  // Equipment: 1 weapon slot + up to 4 passive slots (spec 9.1)
  @type('string')   weaponId: string = '';    // '' = no weapon; value is an EquipmentDef id
  @type('int32')    weaponLevel: number = 0;  // upgrade level (0 = base stats)
  @type(['string']) passiveIds    = new ArraySchema<string>();  // max 4 passive def ids
  @type(['int32'])  passiveLevels = new ArraySchema<number>();  // parallel array: level per passive slot
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
  @type('string')  id: string = '';
  @type('string')  type: string = '';   // 'HEALTH_PACK' | 'WEAPON' | 'PASSIVE' | 'UPGRADE_STONE'
  @type('string')  defId: string = '';  // EquipmentDef id for WEAPON/PASSIVE; '' for others
  @type('float32') x: number = 0;
  @type('float32') y: number = 0;
}

/** Boss state — one active boss per session during BOSS_BATTLE. Empty id = no boss. */
export class BossSchema extends Schema {
  @type('string')  id: string = '';     // '' = no active boss
  @type('string')  defId: string = '';  // BossDef id (client looks up name/sprite)
  @type('float32') x: number = 400;
  @type('float32') y: number = 300;
  @type('int32')   hp: number = 0;
  @type('int32')   maxHp: number = 0;
  @type('int32')   phase: number = 1;   // 1 or 2 (phase 2 triggers at ≤50% HP)
}

/** Lightweight projectile — kept separate from PlayerSchema to avoid polluting player delta (6.6). */
export class ProjectileSchema extends Schema {
  @type('string')  id: string = '';
  @type('float32') x: number = 0;
  @type('float32') y: number = 0;
  @type('float32') angle: number = 0;  // radians
  @type('float32') vx: number = 0;     // velocity x (px/s); 0 = boss/non-moving projectile
  @type('float32') vy: number = 0;     // velocity y (px/s)
  @type('int16')   damage: number = 0; // damage on player collision; 0 = handled externally
}

export class LobbyState extends Schema {
  @type('string') roomCode: string = '';
  @type('string') gameState: string = 'LOBBY';
  @type('number') currentRound: number = 0;
  @type('int32')  survivalTimeLeft: number = 0;  // seconds remaining in SURVIVAL_PHASE
  @type(BossSchema) boss = new BossSchema();      // boss.id === '' means no active boss
  @type({ map: PlayerSchema })     players     = new MapSchema<PlayerSchema>();
  @type({ map: EnemySchema })      enemies     = new MapSchema<EnemySchema>();
  @type({ map: ItemSchema })       items       = new MapSchema<ItemSchema>();
  @type({ map: ProjectileSchema }) projectiles = new MapSchema<ProjectileSchema>();
}
