const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/db');
const { socketManager } = require('./SocketManager');
const {
  INIT_GAME,
  MOVE,
  GAME_ENDED,
  GAME_TIME,
  GAME_ALERT,
  OPPONENT_DISCONNECTED,
} = require('./messages');
const { GAME_TIME_MS, ABANDON_TIME_MS } = require('../config/constants');

/**
 * Check if the pawn is attempting a promotion move
 * @param {Chess} chess
 * @param {string} from
 * @param {string} to
 */
function isPromoting(chess, from, to) {
  if (!from || !to) return false;
  try {
    const piece = chess.get(from);
    if (!piece || piece.type !== 'p') return false;
    if (piece.color !== chess.turn()) return false;
    if (!['1', '8'].some((row) => to.endsWith(row))) return false;

    const moves = chess.moves({ square: from, verbose: true });
    return moves.some((m) => m.to === to);
  } catch (err) {
    return false;
  }
}

class Game {
  /**
   * @param {string} player1UserId
   * @param {string|null} player2UserId
   * @param {string} [gameId]
   * @param {Date} [startTime]
   */
  constructor(player1UserId, player2UserId = null, gameId = null, startTime = null) {
    this.gameId = gameId || uuidv4();
    this.player1UserId = player1UserId; // White
    this.player2UserId = player2UserId; // Black
    this.board = new Chess();
    this.moveCount = 0;
    this.abandonTimer = null;
    this.moveTimer = null;
    this.result = null; // "WHITE_WINS" | "BLACK_WINS" | "DRAW"
    this.player1TimeConsumed = 0;
    this.player2TimeConsumed = 0;
    this.startTime = startTime || new Date();
    this.lastMoveTime = this.startTime;
  }

  /**
   * Seed existing moves from DB into chess board
   * @param {Array} moves
   */
  seedMoves(moves = []) {
    moves.forEach((move) => {
      try {
        if (isPromoting(this.board, move.from, move.to)) {
          this.board.move({
            from: move.from,
            to: move.to,
            promotion: move.san?.includes('=') ? move.san.split('=')[1].toLowerCase()[0] : 'q',
          });
        } else {
          this.board.move({
            from: move.from,
            to: move.to,
          });
        }
      } catch (err) {
        console.error(`Error applying seeded move ${move.from}->${move.to}:`, err.message);
      }
    });

    this.moveCount = moves.length;
    if (moves.length > 0) {
      this.lastMoveTime = new Date(moves[moves.length - 1].createdAt);
    }

    moves.forEach((move, index) => {
      if (move.timeTaken) {
        if (index % 2 === 0) {
          this.player1TimeConsumed += move.timeTaken;
        } else {
          this.player2TimeConsumed += move.timeTaken;
        }
      }
    });

    this.resetAbandonTimer();
    this.resetMoveTimer();
  }

  /**
   * Pair the second player and persist the game into the DB
   * @param {string} player2UserId
   */
  async updateSecondPlayer(player2UserId) {
    this.player2UserId = player2UserId;

    // Persist game in DB in background without blocking instant gameplay
    this.createGameInDb().catch((e) => {
      console.warn('[Game] Warning: Failed to persist game in DB:', e.message);
    });

    const u1Obj = socketManager.getUser(this.player1UserId);
    const u2Obj = socketManager.getUser(this.player2UserId);

    console.log(`[Game] Broadcasting INIT_GAME for room ${this.gameId} to ${this.player1UserId} & ${this.player2UserId}`);

    socketManager.broadcast(
      this.gameId,
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId: this.gameId,
          whitePlayer: {
            id: this.player1UserId,
            name: u1Obj?.name || 'White Player',
            isGuest: u1Obj?.isGuest !== false,
            rating: 1200,
          },
          blackPlayer: {
            id: this.player2UserId,
            name: u2Obj?.name || 'Black Player',
            isGuest: u2Obj?.isGuest !== false,
            rating: 1200,
          },
          fen: this.board.fen(),
          moves: [],
        },
      }),
    );

    this.resetMoveTimer();
    this.resetAbandonTimer();
  }

  /**
   * Helper to ensure user exists in database before creating game
   */
  async ensureUserInDb(userId, fallbackName) {
    if (!userId) return null;
    try {
      let user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        const uniqueEmail = `${userId}-${Math.random().toString(36).substring(2, 7)}@pakchess.com`;
        user = await db.user.create({
          data: {
            id: userId,
            username: userId,
            email: uniqueEmail,
            name: fallbackName || 'Chess Player',
            provider: 'GUEST',
            rating: 1200,
          },
        });
      }
      return user;
    } catch (err) {
      console.warn(`[ensureUserInDb] Error ensuring user ${userId}:`, err.message);
      return null;
    }
  }

  /**
   * Insert game record into Neon DB
   */
  async createGameInDb() {
    this.startTime = new Date();
    this.lastMoveTime = this.startTime;

    try {
      await this.ensureUserInDb(this.player1UserId, 'White Player');
      await this.ensureUserInDb(this.player2UserId, 'Black Player');

      const game = await db.game.create({
        data: {
          id: this.gameId,
          timeControl: 'CLASSICAL',
          status: 'IN_PROGRESS',
          startAt: this.startTime,
          startingFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          whitePlayer: {
            connect: { id: this.player1UserId },
          },
          blackPlayer: {
            connect: { id: this.player2UserId },
          },
        },
        include: {
          whitePlayer: true,
          blackPlayer: true,
        },
      });

      this.gameId = game.id;
    } catch (err) {
      console.error('[createGameInDb] Error persisting game:', err.message);
    }
  }

  /**
   * Add a validated move to Neon DB transactionally
   */
  async addMoveToDb(moveResult, moveTimestamp) {
    const timeTaken = Math.max(0, moveTimestamp.getTime() - this.lastMoveTime.getTime());

    await db.$transaction([
      db.move.create({
        data: {
          gameId: this.gameId,
          moveNumber: this.moveCount + 1,
          from: moveResult.from,
          to: moveResult.to,
          before: moveResult.before,
          after: moveResult.after,
          san: moveResult.san,
          createdAt: moveTimestamp,
          timeTaken,
        },
      }),
      db.game.update({
        where: { id: this.gameId },
        data: {
          currentFen: moveResult.after,
        },
      }),
    ]);
  }

  /**
   * Make a chess move
   * @param {Object} user
   * @param {{ from: string, to: string, promotion?: string }} moveData
   */
  async makeMove(user, moveData) {
    // 1. Turn validation
    const turn = this.board.turn();
    if (turn === 'w' && user.userId !== this.player1UserId) {
      user.send({
        type: GAME_ALERT,
        payload: { message: "It's not your turn (White to move)." },
      });
      return;
    }
    if (turn === 'b' && user.userId !== this.player2UserId) {
      user.send({
        type: GAME_ALERT,
        payload: { message: "It's not your turn (Black to move)." },
      });
      return;
    }
    if (this.result) {
      user.send({
        type: GAME_ALERT,
        payload: { message: 'Game has already ended.' },
      });
      return;
    }

    const moveTimestamp = new Date();
    let executedMove = null;

    try {
      if (isPromoting(this.board, moveData.from, moveData.to)) {
        executedMove = this.board.move({
          from: moveData.from,
          to: moveData.to,
          promotion: moveData.promotion || 'q',
        });
      } else {
        executedMove = this.board.move({
          from: moveData.from,
          to: moveData.to,
        });
      }
    } catch (err) {
      console.warn(`Illegal move attempted by ${user.name}:`, moveData, err.message);
      user.send({
        type: GAME_ALERT,
        payload: { message: 'Illegal move.' },
      });
      return;
    }

    if (!executedMove) {
      user.send({
        type: GAME_ALERT,
        payload: { message: 'Illegal move.' },
      });
      return;
    }

    // Time calculations
    const timeDelta = moveTimestamp.getTime() - this.lastMoveTime.getTime();
    if (turn === 'w') {
      this.player1TimeConsumed += timeDelta;
    } else {
      this.player2TimeConsumed += timeDelta;
    }

    // Persist to database
    try {
      await this.addMoveToDb(executedMove, moveTimestamp);
    } catch (err) {
      console.error('Error saving move to database:', err);
    }

    this.lastMoveTime = moveTimestamp;
    this.moveCount++;

    // Broadcast move to players and spectators
    socketManager.broadcast(
      this.gameId,
      JSON.stringify({
        type: MOVE,
        payload: {
          move: executedMove,
          player1TimeConsumed: this.player1TimeConsumed,
          player2TimeConsumed: this.player2TimeConsumed,
          fen: this.board.fen(),
        },
      }),
    );

    // Reset timers
    this.resetAbandonTimer();
    this.resetMoveTimer();

    // Check game over condition
    if (this.board.isGameOver()) {
      let result = 'DRAW';
      let reason = 'Draw';

      if (this.board.isCheckmate()) {
        result = this.board.turn() === 'b' ? 'WHITE_WINS' : 'BLACK_WINS';
        reason = 'Checkmate';
      } else if (this.board.isStalemate()) {
        reason = 'Stalemate';
      } else if (this.board.isThreefoldRepetition()) {
        reason = 'Threefold Repetition';
      } else if (this.board.isInsufficientMaterial()) {
        reason = 'Insufficient Material';
      }

      await this.endGame('COMPLETED', result, reason);
    }
  }

  getPlayer1TimeConsumed() {
    if (this.board.turn() === 'w' && !this.result) {
      return this.player1TimeConsumed + (Date.now() - this.lastMoveTime.getTime());
    }
    return this.player1TimeConsumed;
  }

  getPlayer2TimeConsumed() {
    if (this.board.turn() === 'b' && !this.result) {
      return this.player2TimeConsumed + (Date.now() - this.lastMoveTime.getTime());
    }
    return this.player2TimeConsumed;
  }

  resetAbandonTimer() {
    this.clearAbandonTimer();
    this.abandonTimer = setTimeout(() => {
      const winner = this.board.turn() === 'b' ? 'WHITE_WINS' : 'BLACK_WINS';
      this.endGame('ABANDONED', winner, 'Player abandoned game');
    }, ABANDON_TIME_MS);
  }

  resetMoveTimer() {
    this.clearMoveTimer();
    const turn = this.board.turn();
    const consumed = turn === 'w' ? this.player1TimeConsumed : this.player2TimeConsumed;
    const timeLeft = Math.max(0, GAME_TIME_MS - consumed);

    if (timeLeft <= 0) {
      const winner = turn === 'b' ? 'WHITE_WINS' : 'BLACK_WINS';
      this.endGame('TIME_UP', winner, 'Time out');
      return;
    }

    this.moveTimer = setTimeout(() => {
      const winner = turn === 'b' ? 'WHITE_WINS' : 'BLACK_WINS';
      this.endGame('TIME_UP', winner, 'Time out');
    }, timeLeft);
  }

  clearAbandonTimer() {
    if (this.abandonTimer) {
      clearTimeout(this.abandonTimer);
      this.abandonTimer = null;
    }
  }

  clearMoveTimer() {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
      this.moveTimer = null;
    }
  }

  async exitGame(user) {
    const winner = user.userId === this.player2UserId ? 'WHITE_WINS' : 'BLACK_WINS';
    await this.endGame('PLAYER_EXIT', winner, `${user.name} resigned`);
  }

  async handlePlayerDisconnect(user) {
    socketManager.broadcastToOthers(
      this.gameId,
      user.userId,
      JSON.stringify({
        type: OPPONENT_DISCONNECTED,
        payload: {
          disconnectedPlayerId: user.userId,
          message: 'Opponent disconnected. Abandon timer running...',
        },
      }),
    );
  }

  async endGame(status, result, reason = '') {
    if (this.result) return;
    this.result = result;

    this.clearAbandonTimer();
    this.clearMoveTimer();

    try {
      const updatedGame = await db.game.update({
        where: { id: this.gameId },
        data: {
          status,
          result,
          endAt: new Date(),
        },
        include: {
          moves: {
            orderBy: { moveNumber: 'asc' },
          },
          whitePlayer: true,
          blackPlayer: true,
        },
      });

      // ELO Rating calculation
      if (status === 'COMPLETED' || status === 'PLAYER_EXIT' || status === 'TIME_UP') {
        const whiteRating = updatedGame.whitePlayer?.rating || 1200;
        const blackRating = updatedGame.blackPlayer?.rating || 1200;
        let whiteDiff = 0;
        let blackDiff = 0;

        if (result === 'WHITE_WINS') {
          whiteDiff = +15;
          blackDiff = -15;
        } else if (result === 'BLACK_WINS') {
          whiteDiff = -15;
          blackDiff = +15;
        }

        if (whiteDiff !== 0) {
          await db.$transaction([
            db.user.update({
              where: { id: updatedGame.whitePlayerId },
              data: { rating: Math.max(100, whiteRating + whiteDiff) },
            }),
            db.user.update({
              where: { id: updatedGame.blackPlayerId },
              data: { rating: Math.max(100, blackRating + blackDiff) },
            }),
          ]);
        }
      }

      socketManager.broadcast(
        this.gameId,
        JSON.stringify({
          type: GAME_ENDED,
          payload: {
            result,
            status,
            reason,
            moves: updatedGame.moves,
            whitePlayer: {
              id: updatedGame.whitePlayer.id,
              name: updatedGame.whitePlayer.name,
              rating: updatedGame.whitePlayer.rating,
            },
            blackPlayer: {
              id: updatedGame.blackPlayer.id,
              name: updatedGame.blackPlayer.name,
              rating: updatedGame.blackPlayer.rating,
            },
          },
        }),
      );
    } catch (err) {
      console.error('Error in endGame:', err);
    }
  }
}

module.exports = {
  Game,
  isPromoting,
};
