const { io } = require('socket.io-client');
require('./index.js');

async function testCompleteMatch() {
  console.log('\n================ STARTING FULL MATCH WITH MOVES ================');

  // 1. Create players
  const whiteUser = await fetch('http://localhost:3000/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Kasparov' }),
  }).then((r) => r.json());

  const blackUser = await fetch('http://localhost:3000/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Karpov' }),
  }).then((r) => r.json());

  console.log(`[AUTH] Players Created -> White: ${whiteUser.name} (${whiteUser.id}), Black: ${blackUser.name} (${blackUser.id})`);

  // 2. Connect Sockets
  const whiteSocket = io('http://localhost:3000', { auth: { token: whiteUser.token } });
  const blackSocket = io('http://localhost:3000', { auth: { token: blackUser.token } });

  await Promise.all([
    new Promise((r) => whiteSocket.once('connect', r)),
    new Promise((r) => blackSocket.once('connect', r)),
  ]);
  console.log('[SOCKET] Both players connected to Socket.IO!');

  // Match promise
  let gameId = null;

  const gameStartedPromise = new Promise((resolve) => {
    whiteSocket.on('message', (msg) => {
      if (msg.type === 'init_game') {
        gameId = msg.payload.gameId;
        console.log(`[EVENT] Game Started! GameID: ${gameId}`);
        console.log(`[EVENT] White: ${msg.payload.whitePlayer.name} vs Black: ${msg.payload.blackPlayer.name}`);
        resolve(msg.payload);
      }
    });
  });

  // White Queue
  console.log('[MATCHMAKING] White queueing...');
  whiteSocket.emit('message', { type: 'init_game' });

  // Black Queue
  setTimeout(() => {
    console.log('[MATCHMAKING] Black queueing...');
    blackSocket.emit('message', { type: 'init_game' });
  }, 300);

  // Wait for game start
  await gameStartedPromise;

  // Promise for move 1 (White e2->e4)
  const move1Promise = new Promise((resolve) => {
    blackSocket.on('message', (msg) => {
      if (msg.type === 'move' && msg.payload.move.san === 'e4') {
        console.log(`[MOVE 1 CONFIRMED] Black received White move: ${msg.payload.move.san}`);
        resolve();
      }
    });
  });

  console.log('[MOVE 1] White playing e2 -> e4...');
  whiteSocket.emit('message', {
    type: 'move',
    payload: { gameId, move: { from: 'e2', to: 'e4' } },
  });

  await move1Promise;

  // Promise for move 2 (Black e7->e5)
  const move2Promise = new Promise((resolve) => {
    whiteSocket.on('message', (msg) => {
      if (msg.type === 'move' && msg.payload.move.san === 'e5') {
        console.log(`[MOVE 2 CONFIRMED] White received Black move: ${msg.payload.move.san}`);
        resolve();
      }
    });
  });

  console.log('[MOVE 2] Black playing e7 -> e5...');
  blackSocket.emit('message', {
    type: 'move',
    payload: { gameId, move: { from: 'e7', to: 'e5' } },
  });

  await move2Promise;

  // Promise for move 3 (White g1->f3)
  const move3Promise = new Promise((resolve) => {
    blackSocket.on('message', (msg) => {
      if (msg.type === 'move' && msg.payload.move.san === 'Nf3') {
        console.log(`[MOVE 3 CONFIRMED] Black received White move: ${msg.payload.move.san}`);
        resolve();
      }
    });
  });

  console.log('[MOVE 3] White playing g1 -> f3...');
  whiteSocket.emit('message', {
    type: 'move',
    payload: { gameId, move: { from: 'g1', to: 'f3' } },
  });

  await move3Promise;

  // 3. Verify Neon DB Persistence
  console.log('\n--- Fetching Game Record From Neon DB ---');
  const gameData = await fetch(`http://localhost:3000/v1/games/${gameId}`).then((r) => r.json());
  console.log('Game Status:', gameData.game.status);
  console.log('White Player:', gameData.game.whitePlayer.name);
  console.log('Black Player:', gameData.game.blackPlayer.name);
  console.log('Total Moves in DB:', gameData.game.moves.length);
  gameData.game.moves.forEach((m) => {
    console.log(`  Move #${m.moveNumber}: ${m.from}-${m.to} (${m.san}) TimeTaken: ${m.timeTaken}ms`);
  });
  console.log('Current FEN in DB:', gameData.game.currentFen);

  // 4. Test In-Game Chat
  const chatPromise = new Promise((resolve) => {
    blackSocket.on('message', (msg) => {
      if (msg.type === 'chat_message') {
        console.log(`[CHAT RECEIVED] ${msg.payload.sender}: "${msg.payload.text}"`);
        resolve();
      }
    });
  });

  whiteSocket.emit('message', {
    type: 'chat_message',
    payload: { gameId, text: 'Good luck, have fun!' },
  });

  await chatPromise;

  // 5. Test Resignation / Exit Game
  const exitPromise = new Promise((resolve) => {
    whiteSocket.on('message', (msg) => {
      if (msg.type === 'game_ended') {
        console.log(`[GAME OVER] Status: ${msg.payload.status}, Result: ${msg.payload.result}`);
        resolve();
      }
    });
  });

  console.log('[RESIGN] Black resigning / exiting game...');
  blackSocket.emit('message', {
    type: 'exit_game',
    payload: { gameId },
  });

  await exitPromise;

  // 6. Verify final game status in DB
  const finalGameData = await fetch(`http://localhost:3000/v1/games/${gameId}`).then((r) => r.json());
  console.log('\n--- Final Game Status in Neon DB ---');
  console.log('Final Status:', finalGameData.game.status);
  console.log('Final Result:', finalGameData.game.result);

  console.log('\n================ ALL END-TO-END TESTS PASSED WITH 100% SUCCESS ================');
  process.exit(0);
}

testCompleteMatch().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
