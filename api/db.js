// Shared Neon client + query helpers for the leaderboard API routes.
// Uses @neondatabase/serverless so it works inside Vercel serverless functions
// (no long-lived TCP connections).

import { neon } from '@neondatabase/serverless';

function getClient() {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
        throw new Error('NEON_DATABASE_URL env var is not configured');
    }
    return neon(url);
}

export async function getTopScores(limit = 10) {
    const sql = getClient();
    const rows = await sql`
        SELECT name, high_score
        FROM leaderboard
        ORDER BY high_score DESC, updated_at ASC
        LIMIT ${limit}
    `;
    return rows.map(r => ({ name: r.name, score: r.high_score }));
}

// Inserts (or updates if higher) the player's score.
// Returns the resulting top-10 leaderboard after the write.
export async function submitScore(name, score) {
    const sql = getClient();
    const safeName = String(name).trim().slice(0, 24);
    const safeScore = Math.max(0, Math.min(1_000_000, Math.floor(Number(score) || 0)));

    if (!safeName) {
        throw new Error('Name is required');
    }

    // Upsert: if the new score beats the existing high_score, raise it.
    // GREATEST() handles the "only if higher" rule atomically.
    await sql`
        INSERT INTO leaderboard (name, high_score)
        VALUES (${safeName}, ${safeScore})
        ON CONFLICT (name) DO UPDATE
        SET high_score = GREATEST(leaderboard.high_score, EXCLUDED.high_score),
            updated_at = CASE
                WHEN EXCLUDED.high_score > leaderboard.high_score THEN NOW()
                ELSE leaderboard.updated_at
            END
    `;

    return getTopScores(10);
}
