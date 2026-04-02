CREATE TABLE IF NOT EXISTS game_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      VARCHAR(16) NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  boss_count   SMALLINT    NOT NULL DEFAULT 0,
  player_count SMALLINT    NOT NULL
);
