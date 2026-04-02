import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { Room } from 'colyseus.js';
import type { AuthUser } from '@/application/useAuth';
import { GameScene } from '@/infrastructure/phaser/GameScene';
import { SkillSelectionOverlay } from '@/presentation/components/SkillSelectionOverlay';

interface GamePageProps {
  room: Room;
  user: AuthUser;
  onLeave: () => void;
}

interface LevelUpState { level: number; options: string[] }

export function GamePage({ room, onLeave }: GamePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [levelUp, setLevelUp] = useState<LevelUpState | null>(null);

  useEffect(() => {
    const unsub = room.onMessage('LEVEL_UP', (msg: LevelUpState) => {
      setLevelUp(msg);
    });
    return () => { unsub(); };
  }, [room]);

  function handleSkillSelect(skillId: string) {
    room.send('SELECT_SKILL', { skillId });
    setLevelUp(null);
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#1a1a1a',
      scene: [GameScene],
    });

    game.scene.start('GameScene', { room, localSessionId: room.sessionId });

    return () => {
      game.destroy(true);
    };
  // room is stable for the lifetime of GamePage
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="relative">
        <div ref={containerRef} />
        {levelUp && (
          <SkillSelectionOverlay
            level={levelUp.level}
            options={levelUp.options}
            onSelect={handleSkillSelect}
          />
        )}
      </div>
      <button onClick={onLeave} className="text-sm underline text-muted-foreground">
        離開遊戲
      </button>
    </div>
  );
}
