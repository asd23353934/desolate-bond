import { ITEM_DEFS } from '@/domain/itemDefs';

interface RewardSelectionOverlayProps {
  options: string[];                     // e.g. ["WEAPON:SWORD", "PASSIVE:BOOTS"]
  ownedWeaponIds?: string[];             // already-equipped weapon IDs (up to 3)
  onSelect: (rewardId: string) => void;
}

export function RewardSelectionOverlay({ options, ownedWeaponIds = [], onSelect }: RewardSelectionOverlayProps) {
  const weaponSlotsFull = ownedWeaponIds.length >= 3;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-black/80 border border-green-500 rounded-xl p-6 w-[480px] text-white">
        <h2 className="text-xl font-bold text-green-400 mb-1 text-center">Boss 擊敗！選擇獎勵</h2>
        <p className="text-sm text-gray-400 mb-4 text-center">選擇一件裝備帶入下一關</p>
        <div className="flex flex-col gap-3">
          {options.map((rewardId) => {
            const [type, defId] = rewardId.split(':') as [string, string];
            if (!type || !defId) return null;
            const def = ITEM_DEFS[defId];
            if (!def) return null;

            const isWeapon = type === 'WEAPON';
            const isDuplicate = isWeapon && ownedWeaponIds.includes(defId);
            // 武器若重複或武器槽已滿則不可選；伺服器也會拒絕，此處僅防誤觸
            const disabled = isWeapon && (isDuplicate || weaponSlotsFull);

            return (
              <button
                key={rewardId}
                onClick={() => { if (!disabled) onSelect(rewardId); }}
                disabled={disabled}
                className={`text-left border rounded-lg px-4 py-3 transition-colors ${
                  disabled
                    ? 'border-gray-600 bg-gray-900/40 opacity-50 cursor-not-allowed'
                    : isWeapon
                      ? 'border-orange-500 hover:border-orange-300 bg-orange-950/40'
                      : 'border-purple-500 hover:border-purple-300 bg-purple-950/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-semibold ${isWeapon ? 'text-orange-300' : 'text-purple-300'}`}>
                    {def.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isWeapon ? 'bg-orange-800 text-orange-200' : 'bg-purple-800 text-purple-200'
                  }`}>
                    {isWeapon ? '武器' : '被動'}
                  </span>
                  {isWeapon && !isDuplicate && !weaponSlotsFull && (
                    <span className="text-xs bg-green-800 text-green-200 px-1.5 py-0.5 rounded">空槽</span>
                  )}
                  {isWeapon && !isDuplicate && weaponSlotsFull && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">武器槽已滿</span>
                  )}
                  {isDuplicate && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">已裝備</span>
                  )}
                </div>
                <div className="text-sm text-gray-300">{def.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
