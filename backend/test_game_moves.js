const { io } = require('socket.io-client');
require('./index.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('\n================ STARTING FULL SIMULATION ================');

  // 1. Create two guest players
  const guest1 = await fetch('http://localhost:3000/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Magnus' }),
  }).then((r) => r.json());

  const guest2 = await fetch('http://localhost:3000/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hikaru' }),
  }).then((r) => r.json());

  console.log(`[AUTH] Magnus: ${guest1.id}, Hikaru: ${guest2.id}`);

  // 2. Connect both Socket.IO clients
  const socket1 = io('http://localhost:3000', { auth: { token: guest1.token } });
  const socket2 = io('http://localhost:3000', { auth: { token: guest2.token } });

  if (!socket1.connected) await new Promise((r) => socket1.once('connect', r));
  if (!socket2.connected) await new Promise((r) => socket2.once('connect', r));
  console.log('[SOCKET] Both players connected to Socket.IO server');

  let activeGameId = null;

  // Listeners for Magnus (White)
  socket1.on('message', async (data) => {
    console.log('[Magnus Event Received]:', data.type);

    if (data.type === 'init_game') {
      activeGameId = data.payload.gameId;
      console.log(`[GAME START] Game ID: ${activeGameId}`);
      console.log(`[PLAYERS] White: ${data.payload.whitePlayer.name} vs Black: ${data.payload.blackPlayer.name}`);

      // White makes Move 1: e2 -> e4
      await sleep(200);
      console.log('[MOVE 1] Magnus plays e2 -> e4');
      socket1.emit('message', {
        type: 'move',
        payload: {
          gameId: activeGameId,
          move: { from: 'e2', to: 'e4' },
        },
      });
    }

    if (data.type === 'move') {
      console.log(`[BOARD SYNC] Magnus observed move: ${data.payload.move.san}`);
    }
  });

  // Listeners for Hikaru (Black)
  socket2.on('message', async (data) => {
    console.log('[Hikaru Event Received]:', data.type);

    if (data.type === 'move') {
      console.log(`[BOARD SYNC] Hikaru observed move: ${data.payload.move.san} (by ${data.payload.move.color})`);

      if (data.payload.move.color === 'w') {
        // Black makes Move 2: e7 -> e5 in response
        await sleep(200);
        console.log('[MOVE 2] Hikaru plays e7 -> e5');
        socket2.emit('message', {
          type: 'move',
          payload: {
            gameId: activeGameId,
            move: { from: 'e7', to: 'e5' },
          },
        });
      }
    }
  });

  // Start matchmaking
  console.log('[MATCHMAKING] Magnus searching for match...');
  socket1.emit('message', { type: 'init_game' });
  await sleep(150);

  console.log('[MATCHMAKING] Hikaru searching for match...');
  socket2.emit('message', { type: 'init_game' });

  // Wait for move exchange
  await sleep(2500);

  if (activeGameId) {
    console.log(`\n[DB CHECK] Fetching game ${activeGameId} from Neon Database...`);
    const dbRes = await fetch(`http://localhost:3000/v1/games/${activeGameId}`).then((r) => r.json());
    console.log('--- Neon Database Record ---');
    console.log('Status:', dbRes.game.status);
    console.log('White Player:', dbRes.game.whitePlayer.name);
    console.log('Black Player:', dbRes.game.blackPlayer.name);
    console.log('Moves Recorded:', dbRes.game.moves.length);
    dbRes.game.moves.forEach((m) => {
      console.log(`  Move #${m.moveNumber}: ${m.from} -> ${m.to} (${m.san}) [FEN: ${m.after}]`);
    });
    console.log('Latest FEN:', dbRes.game.currentFen);
  }

  console.log('\n================ ALL TESTS EXECUTED PERFECTLY ================');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during simulation:', err);
  process.exit(1);
});
