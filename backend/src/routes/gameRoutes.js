const express = require('express');
const { db } = require('../config/db');

const router = express.Router();

/**
 * GET /v1/games/recent
 * Get latest completed games
 */
router.get('/recent', async (req, res) => {
  try {
    const games = await db.game.findMany({
      take: 20,
      orderBy: { startAt: 'desc' },
      include: {
        whitePlayer: { select: { id: true, name: true, rating: true, provider: true } },
        blackPlayer: { select: { id: true, name: true, rating: true, provider: true } },
        moves: { take: 1, orderBy: { moveNumber: 'desc' } },
      },
    });

    return res.json({ success: true, games });
  } catch (err) {
    console.error('Error fetching recent games:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /v1/games/leaderboard
 * Top ranked players
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const topPlayers = await db.user.findMany({
      take: 50,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        rating: true,
        createdAt: true,
      },
    });

    return res.json({ success: true, leaderboard: topPlayers });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /v1/games/:id
 * Get details and all moves of a specific game
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const game = await db.game.findUnique({
      where: { id },
      include: {
        whitePlayer: { select: { id: true, name: true, rating: true, provider: true } },
        blackPlayer: { select: { id: true, name: true, rating: true, provider: true } },
        moves: { orderBy: { moveNumber: 'asc' } },
      },
    });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    return res.json({ success: true, game });
  } catch (err) {
    console.error(`Error fetching game ${req.params.id}:`, err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /v1/games/user/:userId
 * Get game history for a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const games = await db.game.findMany({
      where: {
        OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
      },
      orderBy: { startAt: 'desc' },
      include: {
        whitePlayer: { select: { id: true, name: true, rating: true } },
        blackPlayer: { select: { id: true, name: true, rating: true } },
      },
    });

    return res.json({ success: true, games });
  } catch (err) {
    console.error(`Error fetching user games for ${req.params.userId}:`, err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
