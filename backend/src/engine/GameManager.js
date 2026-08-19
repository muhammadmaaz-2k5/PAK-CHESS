const { Game } = require('./Game');
const { db } = require('../config/db');
const { socketManager, User } = require('./SocketManager');
const {
  INIT_GAME,
  MOVE,
  JOIN_ROOM,
  GAME_JOINED,
  GAME_NOT_FOUND,
  GAME_ALERT,
  GAME_ADDED,
  GAME_ENDED,
  EXIT_GAME,
  CHAT_MESSAGE,
} = require('./messages');

class GameManager {
  constructor() {
    this.games = [];
    this.pendingGameId = null;
    this.users = [];
  }

  /**
   * Register a user with the GameManager
   * @param {User} user
   */
  addUser(user) {
    // Remove stale user socket reference if same userId reconnected
    this.users = this.users.filter((u) => u.userId !== user.userId);
    this.users.push(user);
    this.addHandler(user);
  }

  /**
   * Handle user disconnection
   * @param {Object} socket
   */
  removeUser(socket) {
    const user = this.users.find((u) => u.socket === socket);
    if (!user) {
      return;
    }

    // Clean up if user is in pending matchmaking queue
    if (this.pendingGameId) {
      const pendingGame = this.games.find((g) => g.gameId === this.pendingGameId);
      if (pendingGame && pendingGame.player1UserId === user.userId) {
        this.pendingGameId = null;
        this.removeGame(pendingGame.gameId);
      }
    }

    // Notify active games if user was a playing participant
    const activeGame = this.games.find(
      (g) => (g.player1UserId === user.userId || g.player2UserId === user.userId) && !g.result,
    );
    if (activeGame) {
      activeGame.handlePlayerDisconnect(user);
    }

    this.users = this.users.filter((u) => u.socket !== socket);
    socketManager.removeUser(user);
  }

  removeGame(gameId) {
    this.games = this.games.filter((g) => g.gameId !== gameId);
  }

  /**
   * Attach message handlers for a user socket
   * @param {User} user
   */
  addHandler(user) {
    const handleIncomingMessage = async (rawMessage) => {
      console.log(`[GameManager] handleIncomingMessage from ${user.name} (${user.userId}):`, rawMessage);
      let message;
      try {
        let text = rawMessage;
        if (Buffer.isBuffer(rawMessage)) {
          text = rawMessage.toString('utf8');
        } else if (typeof rawMessage === 'object' && rawMessage.toString && !rawMessage.type) {
          text = rawMessage.toString();
        }
        message = typeof text === 'string' ? JSON.parse(text) : text;
      } catch (err) {
        console.error('Invalid message format received:', rawMessage);
        return;
      }

      if (!message || !message.type) {
        return;
      }

      // 1. INIT_GAME: Matchmaking queue
      if (message.type === INIT_GAME) {
        console.log(`[GameManager] INIT_GAME requested by ${user.name} (${user.userId})`);

        // Prevent user already in an active game from starting another concurrently
        const existingActiveGame = this.games.find(
          (g) => (g.player1UserId === user.userId || g.player2UserId === user.userId) && !g.result,
        );
        if (existingActiveGame && existingActiveGame.player2UserId) {
          console.log(`[GameManager] User ${user.userId} already has active game ${existingActiveGame.gameId}`);
          user.send({
            type: GAME_ALERT,
            payload: {
              message: 'You are already in an active game. Rejoining room...',
              gameId: existingActiveGame.gameId,
            },
          });
          socketManager.addUser(user, existingActiveGame.gameId);
          return;
        }

        if (this.pendingGameId) {
          const game = this.games.find((x) => x.gameId === this.pendingGameId);
          if (!game) {
            this.pendingGameId = null;
            return;
          }

          if (user.userId === game.player1UserId) {
            console.log(`[GameManager] User ${user.userId} is already waiting in queue`);
            user.send({
              type: GAME_ALERT,
              payload: {
                message: 'Already queued. Waiting for an opponent...',
              },
            });
            return;
          }

          console.log(`[GameManager] Pairing ${game.player1UserId} (White) with ${user.userId} (Black) on game ${game.gameId}`);
          socketManager.addUser(user, game.gameId);
          await game.updateSecondPlayer(user.userId);
          this.pendingGameId = null;
        } else {
          const game = new Game(user.userId, null);
          this.games.push(game);
          this.pendingGameId = game.gameId;
          socketManager.addUser(user, game.gameId);

          console.log(`[GameManager] Created new pending game ${game.gameId} for ${user.name} (${user.userId})`);
          user.send({
            type: GAME_ADDED,
            gameId: game.gameId,
          });
        }
      }

      // 2. MOVE: Apply chess move
      if (message.type === MOVE) {
        const gameId = message.payload?.gameId;
        const move = message.payload?.move;
        if (!gameId || !move) return;

        const game = this.games.find((g) => g.gameId === gameId);
        if (game) {
          await game.makeMove(user, move);
          if (game.result) {
            this.removeGame(game.gameId);
          }
        }
      }

      // 3. EXIT_GAME: Player resignation / exit
      if (message.type === EXIT_GAME) {
        const gameId = message.payload?.gameId;
        if (!gameId) return;

        const game = this.games.find((g) => g.gameId === gameId);
        if (game) {
          await game.exitGame(user);
          this.removeGame(game.gameId);
        }
      }

      // 4. JOIN_ROOM: Join existing room, reconnect or spectate
      if (message.type === JOIN_ROOM) {
        const gameId = message.payload?.gameId;
        if (!gameId) return;

        let availableGame = this.games.find((g) => g.gameId === gameId);
        const gameFromDb = await db.game.findUnique({
          where: { id: gameId },
          include: {
            moves: {
              orderBy: { moveNumber: 'asc' },
            },
            blackPlayer: true,
            whitePlayer: true,
          },
        });

        // Game created in memory with only 1 player waiting
        if (availableGame && !availableGame.player2UserId && availableGame.player1UserId !== user.userId) {
          socketManager.addUser(user, availableGame.gameId);
          await availableGame.updateSecondPlayer(user.userId);
          return;
        }

        if (!gameFromDb) {
          user.send({
            type: GAME_NOT_FOUND,
          });
          return;
        }

        // Completed / Ended game
        if (gameFromDb.status !== 'IN_PROGRESS') {
          user.send({
            type: GAME_ENDED,
            payload: {
              result: gameFromDb.result,
              status: gameFromDb.status,
              moves: gameFromDb.moves,
              blackPlayer: {
                id: gameFromDb.blackPlayer?.id,
                name: gameFromDb.blackPlayer?.name,
                rating: gameFromDb.blackPlayer?.rating,
              },
              whitePlayer: {
                id: gameFromDb.whitePlayer?.id,
                name: gameFromDb.whitePlayer?.name,
                rating: gameFromDb.whitePlayer?.rating,
              },
            },
          });
          return;
        }

        // Restore game in-memory if server restarted
        if (!availableGame) {
          const game = new Game(
            gameFromDb.whitePlayerId,
            gameFromDb.blackPlayerId,
            gameFromDb.id,
            gameFromDb.startAt,
          );
          game.seedMoves(gameFromDb.moves || []);
          this.games.push(game);
          availableGame = game;
        }

        socketManager.addUser(user, gameId);

        const isPlayer = user.userId === availableGame.player1UserId || user.userId === availableGame.player2UserId;

        user.send({
          type: GAME_JOINED,
          payload: {
            gameId,
            isSpectator: !isPlayer,
            moves: gameFromDb.moves,
            blackPlayer: {
              id: gameFromDb.blackPlayer?.id,
              name: gameFromDb.blackPlayer?.name,
              rating: gameFromDb.blackPlayer?.rating,
            },
            whitePlayer: {
              id: gameFromDb.whitePlayer?.id,
              name: gameFromDb.whitePlayer?.name,
              rating: gameFromDb.whitePlayer?.rating,
            },
            player1TimeConsumed: availableGame.getPlayer1TimeConsumed(),
            player2TimeConsumed: availableGame.getPlayer2TimeConsumed(),
            fen: availableGame.board.fen(),
          },
        });
      }

      // 5. CHAT_MESSAGE: In-game chat
      if (message.type === CHAT_MESSAGE) {
        const gameId = message.payload?.gameId;
        const text = message.payload?.text;
        if (gameId && text) {
          socketManager.broadcast(gameId, {
            type: CHAT_MESSAGE,
            payload: {
              sender: user.name,
              senderId: user.userId,
              text: String(text).substring(0, 300),
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    };

    // Listen on Socket.IO or raw WebSocket events
    if (typeof user.socket.on === 'function') {
      user.socket.on('message', handleIncomingMessage);

      // Support Socket.IO named events directly as well
      const namedEvents = [INIT_GAME, MOVE, JOIN_ROOM, EXIT_GAME, CHAT_MESSAGE];
      namedEvents.forEach((evt) => {
        user.socket.on(evt, (payload) => {
          handleIncomingMessage({ type: evt, payload });
        });
      });
    }
  }
}

module.exports = {
  GameManager,
};
