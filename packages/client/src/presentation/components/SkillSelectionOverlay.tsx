import { SKILL_DEFS } from '@/domain/skillDefs';
import { ITEM_DEFS } from '@/domain/itemDefs';

interface SkillSelectionOverlayProps {
  level: number;
  options: string[];
  onSelect: (skillId: string) => void;
  isPreBoss?: boolean;
  preBossTimeLeft?: number;  // countdown seconds shown in pre-boss selection
  ownedLevels?: Record<string, number>;  // skillId → current level (for upgrade display)
  weaponId?: string;
  weaponLevel?: number;
  weapon2Id?: string;
  weapon2Level?: number;
  weapon3Id?: string;
  weapon3Level?: number;
  weapon4Id?: string;
  weapon4Level?: number;
  weapon5Id?: string;
  weapon5Level?: number;
}

export function SkillSelectionOverlay({
  level, options, onSelect, isPreBoss, preBossTimeLeft, ownedLevels = {},
  weaponId = '',  weaponLevel = 0,
  weapon2Id = '', weapon2Level = 0,
  weapon3Id = '', weapon3Level = 0,
  weapon4Id = '', weapon4Level = 0,
  weapon5Id = '', weapon5Level = 0,
}: SkillSelectionOverlayProps) {
  // Per-slot descriptors — used to match both upgrade (WEAPONn_LEVEL) and acquisition (Wn:ID) options
  const slots: Array<{ slotNum: number; upgradeId: string; acquirePrefix: string; id: string; lv: number; label: string }> = [
    { slotNum: 1, upgradeId: 'WEAPON_LEVEL',  acquirePrefix: '',    id: weaponId,  lv: weaponLevel,  label: '武器槽1' },
    { slotNum: 2, upgradeId: 'WEAPON2_LEVEL', acquirePrefix: 'W2:', id: weapon2Id, lv: weapon2Level, label: '武器槽2' },
    { slotNum: 3, upgradeId: 'WEAPON3_LEVEL', acquirePrefix: 'W3:', id: weapon3Id, lv: weapon3Level, label: '武器槽3' },
    { slotNum: 4, upgradeId: 'WEAPON4_LEVEL', acquirePrefix: 'W4:', id: weapon4Id, lv: weapon4Level, label: '武器槽4' },
    { slotNum: 5, upgradeId: 'WEAPON5_LEVEL', acquirePrefix: 'W5:', id: weapon5Id, lv: weapon5Level, label: '武器槽5' },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-black/80 border border-yellow-500 rounded-xl p-6 w-[480px] text-white">
        {isPreBoss
          ? <h2 className="text-xl font-bold text-red-400 mb-1 text-center">Boss 即將出現！</h2>
          : <h2 className="text-xl font-bold text-yellow-400 mb-1 text-center">升等！Level {level}</h2>
        }
        {isPreBoss && preBossTimeLeft !== undefined ? (
          <p className="text-sm text-center mb-4">
            <span className="text-gray-400">選擇一個技能｜</span>
            <span className={preBossTimeLeft <= 5 ? 'text-red-400 font-bold' : 'text-yellow-300'}>
              {preBossTimeLeft}秒
            </span>
            <span className="text-gray-400"> 後自動選擇</span>
          </p>
        ) : (
          <p className="text-sm text-gray-400 mb-4 text-center">選擇一個技能強化自己</p>
        )}
        <div className="flex flex-col gap-3">
          {options.map((id) => {
            // Weapon upgrade option (WEAPON_LEVEL / WEAPON2..5_LEVEL)
            const upgradeSlot = slots.find(s => s.upgradeId === id);
            if (upgradeSlot) {
              const weaponDef = ITEM_DEFS[upgradeSlot.id];
              if (!weaponDef) return null;
              const nextWLv = upgradeSlot.lv + 1;
              const desc = weaponDef.levelDesc?.[nextWLv] ?? weaponDef.description;
              return (
                <button
                  key={id}
                  onClick={() => onSelect(id)}
                  className="text-left border border-orange-500 hover:border-orange-300 bg-orange-950/40 rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-orange-300">強化{weaponDef.name}</span>
                    <span className="text-xs bg-orange-700 text-white px-1.5 py-0.5 rounded">槽{upgradeSlot.slotNum} Lv.{upgradeSlot.lv} → Lv.{nextWLv}</span>
                  </div>
                  <div className="text-sm text-gray-300">{desc}</div>
                </button>
              );
            }

            // Weapon acquisition for slots 2–5 (W2:/W3:/W4:/W5: prefix)
            const acquireSlot = slots.find(s => s.acquirePrefix && id.startsWith(s.acquirePrefix));
            if (acquireSlot) {
              const wid = id.slice(3);
              const weaponDef = ITEM_DEFS[wid];
              if (!weaponDef) return null;
              return (
                <button
                  key={id}
                  onClick={() => onSelect(id)}
                  className="text-left border border-orange-400 hover:border-orange-200 bg-orange-950/30 rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-orange-200">獲得{weaponDef.name}</span>
                    <span className="text-xs bg-orange-800 text-orange-200 px-1.5 py-0.5 rounded">{acquireSlot.label}</span>
                  </div>
                  <div className="text-sm text-gray-300">{weaponDef.levelDesc?.[0] ?? weaponDef.description}</div>
                </button>
              );
            }

            // Weapon acquisition option (picking up for slot 1)
            const itemDef = ITEM_DEFS[id];
            if (itemDef?.type === 'WEAPON') {
              const desc = itemDef.levelDesc?.[0] ?? itemDef.description;
              return (
                <button
                  key={id}
                  onClick={() => onSelect(id)}
                  className="text-left border border-orange-400 hover:border-orange-200 bg-orange-950/30 rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-orange-200">獲得{itemDef.name}</span>
                    <span className="text-xs bg-orange-800 text-orange-200 px-1.5 py-0.5 rounded">武器槽1</span>
                  </div>
                  <div className="text-sm text-gray-300">{desc}</div>
                </button>
              );
            }

            // Skill option
            const def = SKILL_DEFS[id];
            if (!def) return null;
            const curLevel  = ownedLevels[id] ?? 0;
            const isUpgrade = curLevel > 0;
            const nextLevel = curLevel + 1;
            const desc = def.levelDesc?.[nextLevel] ?? def.description;
            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className={`text-left border rounded-lg px-4 py-3 transition-colors ${
                  isUpgrade
                    ? 'border-blue-500 hover:border-blue-300 bg-blue-950/40'
                    : 'border-gray-600 hover:border-yellow-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-yellow-300">{def.name}</span>
                  {isUpgrade
                    ? <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Lv.{curLevel} → Lv.{nextLevel}</span>
                    : <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">新技能</span>
                  }
                </div>
                <div className="text-sm text-gray-300">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
