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
  BOW: {
    id: 'BOW', type: 'WEAPON', name: '長弓',
    description: '發射高速直線箭矢',
    levelDesc: {
      0: '射出 1 枝箭（射程 360px，500 px/s）',
      1: '射出 1 枝箭，攻速 +8%',
      2: '射出 2 枝箭（扇形），攻速 +16%',
      3: '射出 2 枝箭，攻速 +24%',
      4: '射出 3 枝箭，攻速 +32%',
      5: '射出 3 枝箭，攻速 +40%',
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
  HAMMER: {
    id: 'HAMMER', type: 'WEAPON', name: '戰鎚',
    description: '全向衝擊波，推開周圍敵人',
    levelDesc: {
      0: '衝擊波 180px，擊退 80px',
      1: '衝擊波 200px，擊退 90px',
      2: '衝擊波 220px，擊退 100px',
      3: '衝擊波 240px，擊退 110px',
      4: '衝擊波 260px，擊退 120px',
      5: '衝擊波 280px，擊退 130px',
    },
  },
  SHIELD_THROW: {
    id: 'SHIELD_THROW', type: 'WEAPON', name: '回力盾',
    description: '投擲後回旋返回，往返皆造成傷害',
    levelDesc: {
      0: '射程 300px，回返雙段打擊',
      1: '射程 320px',
      2: '射程 340px',
      3: '射程 360px',
      4: '射程 380px',
      5: '射程 400px',
    },
  },
  DAGGER: {
    id: 'DAGGER', type: 'WEAPON', name: '匕首',
    description: '短距快速連刺，命中多目標',
    levelDesc: {
      0: '範圍 140px，最多命中 2 目標',
      1: '範圍 150px，最多命中 3 目標',
      2: '範圍 160px，最多命中 3 目標',
      3: '範圍 170px，最多命中 4 目標',
      4: '範圍 180px，最多命中 4 目標',
      5: '範圍 190px，最多命中 5 目標',
    },
  },
  CANNON: {
    id: 'CANNON', type: 'WEAPON', name: '加農砲',
    description: '緩速砲彈，擊中後範圍爆炸',
    levelDesc: {
      0: '爆炸半徑 70px',
      1: '爆炸半徑 80px',
      2: '爆炸半徑 90px',
      3: '爆炸半徑 100px',
      4: '爆炸半徑 110px',
      5: '爆炸半徑 120px',
    },
  },
  STAFF: {
    id: 'STAFF', type: 'WEAPON', name: '權杖',
    description: '範圍治療脈衝，同時減速附近敵人',
    levelDesc: {
      0: '光環 220px，治療隊友並減速敵人 40%',
      1: '光環 240px',
      2: '光環 260px',
      3: '光環 280px',
      4: '光環 300px',
      5: '光環 320px',
    },
  },
  ORB_WEAPON: {
    id: 'ORB_WEAPON', type: 'WEAPON', name: '環繞聖球',
    description: '召喚環繞玩家的聖球，持續接觸傷害',
    levelDesc: {
      0: '1 顆聖球環繞，持續 2 秒',
      1: '1 顆聖球，冷卻 -8%',
      2: '2 顆聖球',
      3: '2 顆聖球，冷卻 -16%',
      4: '3 顆聖球',
      5: '3 顆聖球，冷卻 -24%',
    },
  },

  // Passives
  SHIELD_CHARM: { id: 'SHIELD_CHARM', type: 'PASSIVE', name: '護盾符', description: '最大 HP +40' },
  BOOTS:        { id: 'BOOTS',        type: 'PASSIVE', name: '疾風靴', description: '移動速度 +30' },
  POWER_RING:   { id: 'POWER_RING',   type: 'PASSIVE', name: '力量戒', description: '攻擊傷害 +6' },
  AMULET:       { id: 'AMULET',       type: 'PASSIVE', name: '護身符', description: '最大 HP +20，移動速度 +10' },
};
