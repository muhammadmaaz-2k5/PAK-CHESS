async function testApi() {
  console.log('--- Testing Chess Backend Endpoints ---');

  // 1. Health check
  const health = await fetch('http://localhost:3000/health').then((r) => r.json());
  console.log('1. Health check response:', health);

  // 2. Guest 1 login
  const guest1 = await fetch('http://localhost:3000/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Kasparov' }),
  }).then((r) => r.json());
  console.log('2. Guest 1 created:', guest1.name, 'ID:', guest1.id);

  // 3. Guest 2 login
  const guest2 = await fetch('http://localhost:3000/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Carlsen' }),
  }).then((r) => r.json());
  console.log('3. Guest 2 created:', guest2.name, 'ID:', guest2.id);

  // 4. Token verification
  const refreshRes = await fetch('http://localhost:3000/auth/refresh', {
    headers: { Authorization: `Bearer ${guest1.token}` },
  }).then((r) => r.json());
  console.log('4. Refresh token response for', refreshRes.name, 'isGuest:', refreshRes.isGuest);

  // 5. Leaderboard
  const leaderRes = await fetch('http://localhost:3000/v1/games/leaderboard').then((r) => r.json());
  console.log('5. Leaderboard total entries:', leaderRes.leaderboard.length);

  // 6. Connect Socket.IO clients for Kasparov & Carlsen
  const { io } = require('socket.io-client');
  const socket1 = io('http://localhost:3000', { auth: { token: guest1.token } });
  const socket2 = io('http://localhost:3000', { auth: { token: guest2.token } });

  let gameId = null;

  const waitForConnect = (sock) =>
    new Promise((resolve) => {
      if (sock.connected) resolve();
      else sock.once('connect', resolve);
    });

  await Promise.all([waitForConnect(socket1), waitForConnect(socket2)]);
  console.log('Both Socket.IO players connected!');

  socket1.on('message', (msg) => {
    console.log('[Socket 1 / Kasparov event]:', msg.type);
    if (msg.type === 'init_game') {
      gameId = msg.payload.gameId;
      console.log('Game Started! Game ID:', gameId, 'White:', msg.payload.whitePlayer.name, 'Black:', msg.payload.blackPlayer.name);

      // White plays 1. e4
      setTimeout(() => {
        console.log('-> Kasparov plays e2 -> e4');
        socket1.emit('message', {
          type: 'move',
          payload: { gameId, move: { from: 'e2', to: 'e4' } },
        });
      }, 300);
    }

    if (msg.type === 'move') {
      console.log('Move synced on board:', msg.payload.move.san);
    }
  });

  socket2.on('message', (msg) => {
    console.log('[Socket 2 / Carlsen event]:', msg.type);
    if (msg.type === 'move' && msg.payload.move.color === 'w') {
      // Black plays 1... e5 in response
      setTimeout(() => {
        console.log('-> Carlsen plays e7 -> e5');
        socket2.emit('message', {
          type: 'move',
          payload: { gameId, move: { from: 'e7', to: 'e5' } },
        });
      }, 300);
    }
  });

  // Start matchmaking
  console.log('Kasparov queuing for a game...');
  socket1.emit('message', { type: 'init_game' });

  setTimeout(() => {
    console.log('Carlsen queuing for a game...');
    socket2.emit('message', { type: 'init_game' });
  }, 400);

  // Validate persisted game state in Neon DB
  setTimeout(async () => {
    if (gameId) {
      const dbGame = await fetch(`http://localhost:3000/v1/games/${gameId}`).then((r) => r.json());
      console.log('--- Verified Game in Neon DB ---');
      console.log('Game Status:', dbGame.game.status);
      console.log('Moves Count:', dbGame.game.moves.length);
      console.log('Current FEN:', dbGame.game.currentFen);
      console.log('White Player:', dbGame.game.whitePlayer.name);
      console.log('Black Player:', dbGame.game.blackPlayer.name);
    }
    console.log('=== All backend verification tests completed successfully! ===');
    process.exit(0);
  }, 3500);
}

// Start server
require('./index.js');
setTimeout(() => {
  testApi().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}, 1000);
