import type { Room } from 'colyseus.js';
import type { AuthUser } from '@/application/useAuth';

interface GamePageProps {
  room: Room;
  user: AuthUser;
  onLeave: () => void;
}

export function GamePage({ onLeave }: GamePageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">強化期（開發中）</h2>
      <p className="text-muted-foreground">遊戲場景即將實裝</p>
      <button onClick={onLeave} className="text-sm underline text-muted-foreground">
        離開遊戲
      </button>
    </div>
  );
}
