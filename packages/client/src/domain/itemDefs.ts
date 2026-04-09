/** Item definitions for UI display. Mirrors server EquipmentDefs.ts IDs. */
export interface ItemDef {
  id: string;
  type: 'WEAPON' | 'PASSIVE';
  name: string;
  description: string;
  levelDesc?: Record<number, string>;  // per-weapon-level description (0 = base)
}

export const ITEM_DEFS: Record<string, ItemDef> = {
  // Weapons
  SWORD: {
    id: 'SWORD', type: 'WEAPON', name: '長劍',
    description: '弧形揮斬（120° 扇形，150px）',
    levelDesc: {
      0: '弧形揮斬：150px 扇形，120°',
      1: '弧形揮斬：170px 扇形，130°，攻速 +8%',
      2: '弧形揮斬：190px 扇形，140°，攻速 +16%',
      3: '弧形揮斬：210px 扇形，150°，攻速 +24%',
      4: '弧形揮斬：230px 扇形，160°，攻速 +32%',
      5: '弧形揮斬：250px 扇形，170°，攻速 +40%',
    },
  },
  SPEAR: {
    id: 'SPEAR', type: 'WEAPON', name: '長槍',
    description: '直線穿刺（280px，寬 50px）',
    levelDesc: {
      0: '直線穿刺：280px，寬 50px',
      1: '直線穿刺：310px，寬 60px，攻速 +8%',
      2: '直線穿刺：340px，寬 70px，攻速 +16%',
      3: '直線穿刺：370px，寬 80px，攻速 +24%',
      4: '直線穿刺：400px，寬 90px，攻速 +32%',
      5: '直線穿刺：430px，寬 100px，攻速 +40%',
    },
  },
  WAND: {
    id: 'WAND', type: 'WEAPON', name: '法杖',
    description: '發射追蹤彈，飛向最近的敵人',
    levelDesc: {
      0: '發射 1 枚追蹤彈',
      1: '發射 1 枚追蹤彈，攻速 +8%',
      2: '發射 2 枚追蹤彈，攻速 +16%',
      3: '發射 2 枚追蹤彈，攻速 +24%',
      4: '發射 3 枚追蹤彈，攻速 +32%',
      5: '發射 3 枚追蹤彈，攻速 +40%',
    },
  },

  // Passives
  SHIELD_CHARM: { id: 'SHIELD_CHARM', type: 'PASSIVE', name: '護盾符', description: '最大 HP +40' },
  BOOTS:        { id: 'BOOTS',        type: 'PASSIVE', name: '疾風靴', description: '移動速度 +30' },
  POWER_RING:   { id: 'POWER_RING',   type: 'PASSIVE', name: '力量戒', description: '攻擊傷害 +6' },
  AMULET:       { id: 'AMULET',       type: 'PASSIVE', name: '護身符', description: '最大 HP +20，移動速度 +10' },
};
