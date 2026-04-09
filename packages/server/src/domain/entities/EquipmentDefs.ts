/** Equipment item definitions. Stat modifiers are additive on top of class base stats.
 *
 * DESIGN RULE (6.6): Only defId/level are stored in Schema.
 * Clients and server both resolve display/stats by looking up these definitions.
 */

export interface EquipmentModifiers {
  maxHp?: number;
  attackDamage?: number;
  speed?: number;
  healBonus?: number;  // additive bonus (e.g. 0.2 = +20%)
  attackRange?: number;  // bonus pixels
}

export interface EquipmentDef {
  id: string;
  type: 'WEAPON' | 'PASSIVE';
  name: string;
  modifiers: EquipmentModifiers;  // base modifiers at level 0 (before upgrade scaling)
}

/** Returns modifiers scaled by upgrade level. Each level adds 50% of the base bonus. */
export function scaleModifiers(mods: EquipmentModifiers, level: number): EquipmentModifiers {
  const scale = 1 + level * 0.5;
  return {
    maxHp:        mods.maxHp        !== undefined ? Math.round(mods.maxHp * scale)          : undefined,
    attackDamage: mods.attackDamage !== undefined ? Math.round(mods.attackDamage * scale)    : undefined,
    speed:        mods.speed        !== undefined ? Math.round(mods.speed * scale)            : undefined,
    healBonus:    mods.healBonus    !== undefined ? Math.round(mods.healBonus * scale * 100) / 100 : undefined,
    attackRange:  mods.attackRange  !== undefined ? Math.round(mods.attackRange * scale)      : undefined,
  };
}

export const EQUIPMENT_DEFS: Record<string, EquipmentDef> = {
  // Weapons — only 1 slot per player; replaces existing weapon on pickup
  SWORD: { id: 'SWORD', type: 'WEAPON', name: '長劍',   modifiers: { attackDamage: 10 } },
  SPEAR: { id: 'SPEAR', type: 'WEAPON', name: '長槍',   modifiers: { attackDamage: 5, attackRange: 25 } },
  WAND:  { id: 'WAND',  type: 'WEAPON', name: '法杖',   modifiers: { attackDamage: 8, healBonus: 0.2 } },

  // Passives — up to 4 slots per player; ignored when slots full
  SHIELD_CHARM: { id: 'SHIELD_CHARM', type: 'PASSIVE', name: '護盾符', modifiers: { maxHp: 40 } },
  BOOTS:        { id: 'BOOTS',        type: 'PASSIVE', name: '疾風靴', modifiers: { speed: 30 } },
  POWER_RING:   { id: 'POWER_RING',   type: 'PASSIVE', name: '力量戒', modifiers: { attackDamage: 6 } },
  AMULET:       { id: 'AMULET',       type: 'PASSIVE', name: '護身符', modifiers: { maxHp: 20, speed: 10 } },
};

export const WEAPON_DEF_IDS  = Object.values(EQUIPMENT_DEFS).filter(d => d.type === 'WEAPON') .map(d => d.id);
export const PASSIVE_DEF_IDS = Object.values(EQUIPMENT_DEFS).filter(d => d.type === 'PASSIVE').map(d => d.id);
