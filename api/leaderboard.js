// GET /api/leaderboard
// Returns the top 10 scores, descending.
import { getTopScores } from './db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const scores = await getTopScores(10);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ scores });
    } catch (err) {
        console.error('GET /api/leaderboard failed:', err);
        return res.status(500).json({ error: 'Failed to load leaderboard' });
    }
}
