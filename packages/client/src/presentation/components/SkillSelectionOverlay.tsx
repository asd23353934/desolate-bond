import { SKILL_DEFS } from '@/domain/skillDefs';

interface SkillSelectionOverlayProps {
  level: number;
  options: string[];
  onSelect: (skillId: string) => void;
}

export function SkillSelectionOverlay({ level, options, onSelect }: SkillSelectionOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-black/80 border border-yellow-500 rounded-xl p-6 w-[480px] text-white">
        <h2 className="text-xl font-bold text-yellow-400 mb-1 text-center">升等！Level {level}</h2>
        <p className="text-sm text-gray-400 mb-4 text-center">選擇一個技能（遊戲繼續進行中）</p>
        <div className="flex flex-col gap-3">
          {options.map((id) => {
            const def = SKILL_DEFS[id];
            if (!def) return null;
            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className="text-left border border-gray-600 hover:border-yellow-400 rounded-lg px-4 py-3 transition-colors"
              >
                <div className="font-semibold text-yellow-300">{def.name}</div>
                <div className="text-sm text-gray-300 mt-0.5">{def.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
