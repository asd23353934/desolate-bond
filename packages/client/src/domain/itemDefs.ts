/** Item definitions for UI display. Mirrors server EquipmentDefs.ts IDs. */
export interface ItemDef {
  id: string;
  type: 'WEAPON' | 'PASSIVE';
  name: string;
  description: string;
}

export const ITEM_DEFS: Record<string, ItemDef> = {
  // Weapons
  SWORD: { id: 'SWORD', type: 'WEAPON', name: '長劍',   description: '攻擊傷害 +10' },
  SPEAR: { id: 'SPEAR', type: 'WEAPON', name: '長槍',   description: '攻擊傷害 +5，攻擊範圍 +25' },
  WAND:  { id: 'WAND',  type: 'WEAPON', name: '法杖',   description: '攻擊傷害 +8，治癒效果 +20%' },

  // Passives
  SHIELD_CHARM: { id: 'SHIELD_CHARM', type: 'PASSIVE', name: '護盾符', description: '最大 HP +40' },
  BOOTS:        { id: 'BOOTS',        type: 'PASSIVE', name: '疾風靴', description: '移動速度 +30' },
  POWER_RING:   { id: 'POWER_RING',   type: 'PASSIVE', name: '力量戒', description: '攻擊傷害 +6' },
  AMULET:       { id: 'AMULET',       type: 'PASSIVE', name: '護身符', description: '最大 HP +20，移動速度 +10' },
};
