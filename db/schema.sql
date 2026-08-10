-- Global leaderboard for Flappy Birdy.
-- One row per player name; high_score is only raised on a new personal best.

CREATE TABLE IF NOT EXISTS leaderboard (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    high_score  INTEGER NOT NULL CHECK (high_score >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leaderboard_high_score_idx
    ON leaderboard (high_score DESC);
