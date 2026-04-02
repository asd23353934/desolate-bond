CREATE TABLE IF NOT EXISTS player_results (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID        NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
  display_name  VARCHAR(32) NOT NULL,
  is_guest      BOOLEAN     NOT NULL DEFAULT FALSE,
  class         VARCHAR(16) NOT NULL,
  total_damage  INTEGER     NOT NULL DEFAULT 0,
  survival_time INTEGER     NOT NULL DEFAULT 0,
  cleared       BOOLEAN     NOT NULL DEFAULT FALSE,
  clear_time    INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaderboard: fastest clear time (cleared runs only, ascending)
CREATE INDEX IF NOT EXISTS idx_player_results_clear_time
  ON player_results (clear_time ASC)
  WHERE cleared = TRUE;

-- Leaderboard: highest damage (descending)
CREATE INDEX IF NOT EXISTS idx_player_results_total_damage
  ON player_results (total_damage DESC);

-- Leaderboard: highest survival time (descending)
CREATE INDEX IF NOT EXISTS idx_player_results_survival_time
  ON player_results (survival_time DESC);
