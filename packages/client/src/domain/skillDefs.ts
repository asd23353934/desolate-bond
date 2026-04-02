/** Skill definitions for UI display. Mirrors server SkillPools.ts IDs. */
export interface SkillDef {
  id: string;
  name: string;
  description: string;
}

export const SKILL_DEFS: Record<string, SkillDef> = {
  // TANK
  IRON_SKIN:   { id: 'IRON_SKIN',   name: '鐵皮',     description: '最大 HP +50' },
  SHIELD:      { id: 'SHIELD',      name: '護盾',     description: '獲得 30 點護盾值' },
  BARRIER:     { id: 'BARRIER',     name: '壁壘',     description: '受傷時有 20% 機率格擋' },
  TAUNT:       { id: 'TAUNT',       name: '嘲諷',     description: '附近敵人優先攻擊自己' },
  FORTIFY:     { id: 'FORTIFY',     name: '要塞',     description: '靜止時每秒回復 5 HP' },
  // DAMAGE
  POWER_UP:    { id: 'POWER_UP',    name: '強化攻擊', description: '攻擊傷害 +20%' },
  MULTI_STRIKE:{ id: 'MULTI_STRIKE',name: '連擊',     description: '每次攻擊額外打一下' },
  SWIFT_FEET:  { id: 'SWIFT_FEET',  name: '輕步',     description: '移動速度 +25%，攻擊力 -10%' },
  CRITICAL:    { id: 'CRITICAL',    name: '暴擊',     description: '20% 機率造成雙倍傷害' },
  BERSERKER:   { id: 'BERSERKER',   name: '狂戰士',   description: 'HP 越低攻擊越高（最多 +50%）' },
  // SUPPORT
  HEAL:        { id: 'HEAL',        name: '治癒',     description: '立即回復 20 HP' },
  REGEN:       { id: 'REGEN',       name: '再生',     description: '每秒回復 2 HP' },
  TEAM_HEAL:   { id: 'TEAM_HEAL',   name: '團隊治癒', description: '附近隊友每秒回復 1 HP' },
  REVIVE_BOOST:{ id: 'REVIVE_BOOST',name: '強化救援', description: '救援速度 +50%' },
  AURA:        { id: 'AURA',        name: '光環',     description: '附近隊友攻擊力 +10%' },
  // COMMON
  SPEED_UP:    { id: 'SPEED_UP',    name: '加速',     description: '移動速度 +15%' },
  LIFESTEAL:   { id: 'LIFESTEAL',   name: '吸血',     description: '攻擊時回復傷害的 15% HP' },
  DODGE:       { id: 'DODGE',       name: '閃避',     description: '15% 機率完全閃避攻擊' },
  TOUGH:       { id: 'TOUGH',       name: '堅韌',     description: '受到傷害減少 10%' },
};
