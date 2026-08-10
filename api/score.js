// POST /api/score
// Body: { name: string, score: number }
// Upserts the player's high score and returns the refreshed top 10.
import { submitScore } from './db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, score } = req.body || {};
    if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'A player name is required' });
    }

    try {
        const scores = await submitScore(name, score);
        return res.status(200).json({ scores });
    } catch (err) {
        console.error('POST /api/score failed:', err);
        return res.status(500).json({ error: 'Failed to submit score' });
    }
}
