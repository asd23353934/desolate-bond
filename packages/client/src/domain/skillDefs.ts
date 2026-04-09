/** Skill definitions for UI display. Mirrors server SkillPools.ts IDs. */
export interface SkillDef {
  id: string;
  name: string;
  description: string;              // shown when not yet owned / fallback
  levelDesc?: Record<number, string>; // per-level description (1/2/3)
}

export const SKILL_DEFS: Record<string, SkillDef> = {
  // TANK
  IRON_SKIN: {
    id: 'IRON_SKIN', name: '鐵皮',
    description: '最大 HP +40',
    levelDesc: { 1: '最大 HP +40', 2: '最大 HP +80', 3: '最大 HP +120' },
  },
  SHIELD: {
    id: 'SHIELD', name: '護盾',
    description: '獲得 30 點護盾值（先於 HP 吸收傷害，緩慢回復）',
    levelDesc: {
      1: '護盾值 30，被擊穿後每秒回復 5 點',
      2: '護盾值 60，被擊穿後每秒回復 5 點',
      3: '護盾值 90，被擊穿後每秒回復 5 點',
    },
  },
  BARRIER: {
    id: 'BARRIER', name: '壁壘',
    description: '受傷時有 20% 機率格擋（只受一半傷害）',
    levelDesc: {
      1: '20% 機率格擋，受到一半傷害',
      2: '40% 機率格擋，受到一半傷害',
      3: '60% 機率格擋，受到一半傷害',
    },
  },
  FORTIFY: {
    id: 'FORTIFY', name: '要塞',
    description: '靜止時每秒回復 3 HP',
    levelDesc: {
      1: '靜止時每秒回復 3 HP',
      2: '靜止時每秒回復 6 HP',
      3: '靜止時每秒回復 9 HP',
    },
  },
  // DAMAGE
  POWER_UP: {
    id: 'POWER_UP', name: '強化攻擊',
    description: '攻擊傷害 +5',
    levelDesc: { 1: '攻擊傷害 +5', 2: '攻擊傷害 +10', 3: '攻擊傷害 +15' },
  },
  MULTI_STRIKE: {
    id: 'MULTI_STRIKE', name: '連擊',
    description: '攻擊時額外擊中第二個目標（50% 傷害）',
    levelDesc: {
      1: '攻擊額外擊中一個目標（50% 傷害）',
      2: '連擊傷害提升至 70%，範圍擴大',
      3: '連擊傷害提升至 90%，大幅擴大範圍',
    },
  },
  SWIFT_FEET: {
    id: 'SWIFT_FEET', name: '輕步',
    description: '移動速度 +30，攻擊力 -3',
    levelDesc: {
      1: '移動速度 +30，攻擊力 -3',
      2: '移動速度 +60，攻擊力 -6',
      3: '移動速度 +90，攻擊力 -9',
    },
  },
  CRITICAL: {
    id: 'CRITICAL', name: '暴擊',
    description: '25% 機率造成 1.75 倍傷害',
    levelDesc: {
      1: '25% 機率造成 1.75 倍傷害',
      2: '30% 機率造成 2 倍傷害',
      3: '35% 機率造成 2.25 倍傷害',
    },
  },
  BERSERKER: {
    id: 'BERSERKER', name: '狂戰士',
    description: 'HP 越低攻擊越高（最多 +60%）',
    levelDesc: {
      1: 'HP 越低攻擊越高，最多 +60%',
      2: 'HP 越低攻擊越高，最多 +80%',
      3: 'HP 越低攻擊越高，最多 +100%',
    },
  },
  // SUPPORT
  HEAL: {
    id: 'HEAL', name: '治癒',
    description: '立即回復 20 HP，並提升治療效果 +20%',
    levelDesc: {
      1: '立即回復 20 HP，治療效果 +20%',
      2: '立即回復 40 HP，治療效果 +40%',
      3: '立即回復 60 HP，治療效果 +60%',
    },
  },
  REGEN: {
    id: 'REGEN', name: '再生',
    description: '每秒回復 2 HP',
    levelDesc: { 1: '每秒回復 2 HP', 2: '每秒回復 4 HP', 3: '每秒回復 6 HP' },
  },
  TEAM_HEAL: {
    id: 'TEAM_HEAL', name: '團隊治癒',
    description: '附近隊友每秒回復 1 HP',
    levelDesc: {
      1: '附近隊友每秒回復 1 HP',
      2: '附近隊友每秒回復 2 HP',
      3: '附近隊友每秒回復 3 HP',
    },
  },
  REVIVE_BOOST: {
    id: 'REVIVE_BOOST', name: '強化救援',
    description: '救援速度 +50%',
    levelDesc: {
      1: '救援速度 +50%',
      2: '救援速度 +100%（快兩倍）',
      3: '救援速度 +150%（快三倍）',
    },
  },
  AURA: {
    id: 'AURA', name: '光環',
    description: '附近隊友攻擊力 +10%',
    levelDesc: {
      1: '附近隊友攻擊力 +10%',
      2: '附近隊友攻擊力 +20%',
      3: '附近隊友攻擊力 +30%',
    },
  },
  // COMMON
  SPEED_UP: {
    id: 'SPEED_UP', name: '加速',
    description: '移動速度 +20',
    levelDesc: { 1: '移動速度 +20', 2: '移動速度 +40', 3: '移動速度 +60' },
  },
  LIFESTEAL: {
    id: 'LIFESTEAL', name: '吸血',
    description: '攻擊時回復傷害的 20% HP',
    levelDesc: {
      1: '攻擊時回復傷害的 20% HP',
      2: '攻擊時回復傷害的 20% HP（×2 效率）',
      3: '攻擊時回復傷害的 20% HP（×3 效率）',
    },
  },
  DODGE: {
    id: 'DODGE', name: '閃避',
    description: '15% 機率完全閃避攻擊',
    levelDesc: {
      1: '15% 機率完全閃避攻擊',
      2: '30% 機率完全閃避攻擊',
      3: '45% 機率完全閃避攻擊',
    },
  },
  TOUGH: {
    id: 'TOUGH', name: '堅韌',
    description: '受到傷害減少 10%',
    levelDesc: {
      1: '受到傷害減少 10%',
      2: '受到傷害減少 20%',
      3: '受到傷害減少 30%',
    },
  },

  // Repeatable stat boosts (appear when all skills/weapons are maxed)
  STAT_HP: {
    id: 'STAT_HP', name: '強化體魄',
    description: '最大 HP +15（可疊加）',
    levelDesc: { 1: '最大 HP +15' },
  },
  STAT_ATK: {
    id: 'STAT_ATK', name: '強化攻擊',
    description: '攻擊傷害 +3（可疊加）',
    levelDesc: { 1: '攻擊傷害 +3' },
  },
  STAT_SPD: {
    id: 'STAT_SPD', name: '強化速度',
    description: '移動速度 +10（可疊加）',
    levelDesc: { 1: '移動速度 +10' },
  },
  STAT_REGEN: {
    id: 'STAT_REGEN', name: '強化回復',
    description: '每秒回復 0.5 HP（可疊加）',
    levelDesc: { 1: '每秒回復 0.5 HP' },
  },
};
