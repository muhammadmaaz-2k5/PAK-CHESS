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
 * Top ranked players with win/loss records
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const topPlayers = await db.user.findMany({
      take: 100,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        rating: true,
        createdAt: true,
        gamesAsWhite: {
          select: { result: true, status: true },
        },
        gamesAsBlack: {
          select: { result: true, status: true },
        },
      },
    });

    const leaderboard = topPlayers.map((player) => {
      const whiteGames = player.gamesAsWhite || [];
      const blackGames = player.gamesAsBlack || [];
      const totalGames = whiteGames.length + blackGames.length;
      const wins =
        whiteGames.filter((g) => g.result === 'WHITE_WINS').length +
        blackGames.filter((g) => g.result === 'BLACK_WINS').length;
      const losses =
        whiteGames.filter((g) => g.result === 'BLACK_WINS').length +
        blackGames.filter((g) => g.result === 'WHITE_WINS').length;
      const draws =
        whiteGames.filter((g) => g.result === 'DRAW').length +
        blackGames.filter((g) => g.result === 'DRAW').length;
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      return {
        id: player.id,
        name: player.name || player.username || 'Chess Master',
        username: player.username,
        rating: player.rating,
        totalGames,
        wins,
        losses,
        draws,
        winRate,
        createdAt: player.createdAt,
      };
    });

    return res.json({ success: true, leaderboard });
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
