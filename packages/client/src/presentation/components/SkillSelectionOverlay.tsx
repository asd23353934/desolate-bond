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
}

export function SkillSelectionOverlay({ level, options, onSelect, isPreBoss, preBossTimeLeft, ownedLevels = {}, weaponId = '', weaponLevel = 0, weapon2Id = '', weapon2Level = 0, weapon3Id = '', weapon3Level = 0 }: SkillSelectionOverlayProps) {
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
            // Slot-1 weapon upgrade
            if (id === 'WEAPON_LEVEL') {
              const weaponDef = ITEM_DEFS[weaponId];
              if (!weaponDef) return null;
              const nextWLv = weaponLevel + 1;
              const desc = weaponDef.levelDesc?.[nextWLv] ?? weaponDef.description;
              return (
                <button
                  key="WEAPON_LEVEL"
                  onClick={() => onSelect('WEAPON_LEVEL')}
                  className="text-left border border-orange-500 hover:border-orange-300 bg-orange-950/40 rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-orange-300">強化{weaponDef.name}</span>
                    <span className="text-xs bg-orange-700 text-white px-1.5 py-0.5 rounded">槽1 Lv.{weaponLevel} → Lv.{nextWLv}</span>
                  </div>
                  <div className="text-sm text-gray-300">{desc}</div>
                </button>
              );
            }
            // Slot-2 weapon upgrade
            if (id === 'WEAPON2_LEVEL') {
              const weaponDef = ITEM_DEFS[weapon2Id];
              if (!weaponDef) return null;
              const nextWLv = weapon2Level + 1;
              const desc = weaponDef.levelDesc?.[nextWLv] ?? weaponDef.description;
              return (
                <button
                  key="WEAPON2_LEVEL"
                  onClick={() => onSelect('WEAPON2_LEVEL')}
                  className="text-left border border-orange-500 hover:border-orange-300 bg-orange-950/40 rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-orange-300">強化{weaponDef.name}</span>
                    <span className="text-xs bg-orange-700 text-white px-1.5 py-0.5 rounded">槽2 Lv.{weapon2Level} → Lv.{nextWLv}</span>
                  </div>
                  <div className="text-sm text-gray-300">{desc}</div>
                </button>
              );
            }
            // Slot-3 weapon upgrade
            if (id === 'WEAPON3_LEVEL') {
              const weaponDef = ITEM_DEFS[weapon3Id];
              if (!weaponDef) return null;
              const nextWLv = weapon3Level + 1;
              const desc = weaponDef.levelDesc?.[nextWLv] ?? weaponDef.description;
              return (
                <button
                  key="WEAPON3_LEVEL"
                  onClick={() => onSelect('WEAPON3_LEVEL')}
                  className="text-left border border-orange-500 hover:border-orange-300 bg-orange-950/40 rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-orange-300">強化{weaponDef.name}</span>
                    <span className="text-xs bg-orange-700 text-white px-1.5 py-0.5 rounded">槽3 Lv.{weapon3Level} → Lv.{nextWLv}</span>
                  </div>
                  <div className="text-sm text-gray-300">{desc}</div>
                </button>
              );
            }
            // Slot-2 weapon acquisition (W2:SWORD etc.)
            if (id.startsWith('W2:')) {
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
                    <span className="text-xs bg-orange-800 text-orange-200 px-1.5 py-0.5 rounded">武器槽2</span>
                  </div>
                  <div className="text-sm text-gray-300">{weaponDef.levelDesc?.[0] ?? weaponDef.description}</div>
                </button>
              );
            }
            // Slot-3 weapon acquisition (W3:SWORD etc.)
            if (id.startsWith('W3:')) {
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
                    <span className="text-xs bg-orange-800 text-orange-200 px-1.5 py-0.5 rounded">武器槽3</span>
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
