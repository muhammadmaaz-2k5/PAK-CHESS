const express = require('express');
const { db } = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

/**
 * GET /v1/users/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rating: true,
        provider: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const gamesCount = await db.game.count({
      where: {
        OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
      },
    });

    return res.json({
      success: true,
      user: {
        ...user,
        totalGames: gamesCount,
      },
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
