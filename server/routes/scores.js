import express from 'express';
import auth from '../middleware/auth.js';
import { createScore, getLeaderboard, getScoresByUser } from '../storage.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { points, moves, seconds, difficulty } = req.body;
    const score = createScore({
      userId: req.userId,
      points,
      moves,
      seconds,
      difficulty
    });
    res.json(score);
  } catch (error) {
    res.status(500).json({ message: 'Unable to save score' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    res.json(getScoresByUser(req.userId));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load history' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    res.json(getLeaderboard());
  } catch (error) {
    res.status(500).json({ message: 'Unable to load leaderboard' });
  }
});

export default router;
