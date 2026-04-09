import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface HelpPageProps {
  onBack: () => void;
}

const DEFAULT_KEY_BINDINGS = { up: 'W', down: 'S', left: 'A', right: 'D', rescue: 'F' };

export function HelpPage({ onBack }: HelpPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-xl bg-gray-900 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">操作說明</CardTitle>
          <Button variant="outline" onClick={onBack} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            返回
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 text-sm">

          <section>
            <h3 className="mb-2 font-semibold text-base text-gray-100">移動</h3>
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-800">
                <tr><td className="py-1.5 text-gray-400">向上移動</td><td className="py-1.5 font-mono">{DEFAULT_KEY_BINDINGS.up} / ↑</td></tr>
                <tr><td className="py-1.5 text-gray-400">向下移動</td><td className="py-1.5 font-mono">{DEFAULT_KEY_BINDINGS.down} / ↓</td></tr>
                <tr><td className="py-1.5 text-gray-400">向左移動</td><td className="py-1.5 font-mono">{DEFAULT_KEY_BINDINGS.left} / ←</td></tr>
                <tr><td className="py-1.5 text-gray-400">向右移動</td><td className="py-1.5 font-mono">{DEFAULT_KEY_BINDINGS.right} / →</td></tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-base text-gray-100">自動攻擊</h3>
            <p className="text-gray-400">角色會自動攻擊攻擊範圍內最近的敵人與 Boss，不需任何按鍵操作。</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-base text-gray-100">技能選擇</h3>
            <p className="text-gray-400">
              升級或進入 Boss 戰前會彈出技能選擇畫面（3 選 1）。遊戲不暫停，30 秒倒數結束後自動隨機選擇。
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-base text-gray-100">救援</h3>
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-800">
                <tr><td className="py-1.5 text-gray-400">救援隊友</td><td className="py-1.5 font-mono">{DEFAULT_KEY_BINDINGS.rescue}（持續按住）</td></tr>
                <tr><td className="py-1.5 text-gray-400">發送求救信號</td><td className="py-1.5 font-mono">{DEFAULT_KEY_BINDINGS.rescue}（倒地時）</td></tr>
                <tr><td className="py-1.5 text-gray-400">切換觀戰視角</td><td className="py-1.5 font-mono">{DEFAULT_KEY_BINDINGS.rescue}（倒地時重複按）</td></tr>
              </tbody>
            </table>
            <p className="mt-2 text-gray-400">接近倒地隊友並持續按住救援鍵 2 秒即可完成救援。受傷會中斷進度。</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-base text-gray-100">設定</h3>
            <p className="text-gray-400">
              可在主選單「設定」中調整音量、浮動傷害數字、畫質，以及自訂按鍵配置。
            </p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
