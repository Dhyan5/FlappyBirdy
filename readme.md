### ⚠️ DISCLAIMER

This project was made for fun.
I don't support or criticise any political party through my content.
This is made purely for entertainment and timepass.

---

# Flappy Birdy

A Flappy Bird clone with a global leaderboard backed by Neon PostgreSQL.

## Setup

1. **Install deps**
   ```bash
   npm install
   ```

2. **Create the table** in Neon (run once, e.g. from the Neon SQL console):
   ```sql
   -- see db/schema.sql
   CREATE TABLE IF NOT EXISTS leaderboard (
       id          BIGSERIAL PRIMARY KEY,
       name        TEXT NOT NULL UNIQUE,
       high_score  INTEGER NOT NULL CHECK (high_score >= 0),
       created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE INDEX IF NOT EXISTS leaderboard_high_score_idx
       ON leaderboard (high_score DESC);
   ```

3. **Configure the env var** `NEON_DATABASE_URL` with your Neon connection string.
   - Locally: copy `.env.example` to `.env`.
   - On Vercel: Project Settings → Environment Variables.

## Run locally

```bash
npm run dev
```

## Deploy

The repo is set up for both Vercel (serverless `/api/*`) and GitHub Pages (static).
For the live leaderboard, deploy to Vercel so the `api/` routes run.

## How the leaderboard works

- The player must enter a pilot name before the game starts. The name is stored in `localStorage`.
- On game over, the frontend POSTs `{ name, score }` to `/api/score`.
- The server upserts the row, raising `high_score` only if the new score is greater, and returns the refreshed top 10.
- The frontend renders the list in descending order.
