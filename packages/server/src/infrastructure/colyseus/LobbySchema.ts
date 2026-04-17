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
  // Skill IDs + parallel level array (each skill can be leveled 1–3)
  @type(['string']) skillIds    = new ArraySchema<string>();
  @type(['int32'])  skillLevels = new ArraySchema<number>();
  @type('int32')    shieldHp: number = 0;  // absorbed before real HP (SHIELD skill)
  // 12.4: downed player spectating — '' = not spectating, otherwise id of followed player
  @type('string')   spectatingId: string = '';
  // 13.1: per-run stats — accumulated during the session
  @type('int32')    totalDamage: number = 0;
  @type('int32')    totalDamageTaken: number = 0;
  @type('int32')    killCount: number = 0;
  @type('int32')    downCount: number = 0;
  @type('int32')    rescueCount: number = 0;
  // Equipment: up to 5 weapon slots (equal status) + up to 4 passive slots
  @type('string')   weaponId: string = '';    // weapon slot 1 ('' = empty)
  @type('int32')    weaponLevel: number = 0;  // weapon slot 1 upgrade level
  @type('string')   weapon2Id: string = '';   // weapon slot 2 ('' = empty)
  @type('int32')    weapon2Level: number = 0; // weapon slot 2 upgrade level
  @type('string')   weapon3Id: string = '';   // weapon slot 3 ('' = empty)
  @type('int32')    weapon3Level: number = 0; // weapon slot 3 upgrade level
  @type('string')   weapon4Id: string = '';   // weapon slot 4 ('' = empty)
  @type('int32')    weapon4Level: number = 0; // weapon slot 4 upgrade level
  @type('string')   weapon5Id: string = '';   // weapon slot 5 ('' = empty)
  @type('int32')    weapon5Level: number = 0; // weapon slot 5 upgrade level
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
  @type('string')  ownerId: string = '';  // '' = enemy/boss; sessionId = player projectile (WAND)
  @type('float32') x: number = 0;
  @type('float32') y: number = 0;
  @type('float32') angle: number = 0;  // radians
  @type('float32') vx: number = 0;     // velocity x (px/s); 0 = boss/non-moving projectile
  @type('float32') vy: number = 0;     // velocity y (px/s)
  @type('int16')   damage: number = 0; // damage on collision
  @type('string')  kind: string = '';  // '' | 'ORB' (WAND) | 'ARROW' (BOW) | 'CANNON' | 'SHIELD' | 'SATELLITE'
}

/**
 * Attack warning indicator. Server publishes before any damaging area pattern;
 * damage resolves at fireAt and entry is removed the same tick. Clients render only.
 * Shape geometry:
 *  - CIRCLE: uses (x, y, radius)
 *  - SECTOR: uses (x, y, radius, angle=facing radians, arcSpan=radians)
 *  - LINE:   uses (x, y) as origin, (length, angle=direction radians, width)
 */
export class TelegraphSchema extends Schema {
  @type('string')  id: string = '';
  @type('string')  shape: string = 'CIRCLE';  // 'CIRCLE' | 'SECTOR' | 'LINE'
  @type('float32') x: number = 0;
  @type('float32') y: number = 0;
  @type('float32') radius: number = 0;   // CIRCLE, SECTOR
  @type('float32') angle: number = 0;    // SECTOR facing / LINE direction (radians)
  @type('float32') arcSpan: number = 0;  // SECTOR arc span (radians)
  @type('float32') length: number = 0;   // LINE length (px)
  @type('float32') width: number = 0;    // LINE width (px)
  @type('number')  startAt: number = 0;  // server ms timestamp
  @type('number')  fireAt: number = 0;   // server ms timestamp
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
  @type({ map: TelegraphSchema })  telegraphs  = new MapSchema<TelegraphSchema>();
}
