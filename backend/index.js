const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');
const { Server: SocketIOServer } = require('socket.io');
const { WebSocketServer } = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');

dotenv.config();

const { initPassport } = require('./src/config/passport');
const { COOKIE_MAX_AGE } = require('./src/config/constants');
const { GameManager } = require('./src/engine/GameManager');
const { User } = require('./src/engine/SocketManager');
const { JWT_SECRET } = require('./src/middlewares/auth');

const authRoutes = require('./src/routes/authRoutes');
const gameRoutes = require('./src/routes/gameRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Passport Strategies
initPassport();

// Express Middlewares
app.use(express.json());
app.use(cookieParser());

const allowedHosts = process.env.ALLOWED_HOSTS
  ? process.env.ALLOWED_HOSTS.split(',').map((h) => h.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedHosts.indexOf(origin) !== -1 || allowedHosts.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

app.use(
  session({
    secret: process.env.COOKIE_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: COOKIE_MAX_AGE,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// REST Routes
app.use('/auth', authRoutes);
app.use('/v1/games', gameRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chess Backend API (Node.js + Prisma + Neon + Socket.IO)',
    version: '1.0.0',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Real-Time Engine Setup
const gameManager = new GameManager();

/**
 * 1. Socket.IO Server Setup
 */
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    // Generate guest fallback if no token provided
    const guestUser = new User(socket, {
      userId: 'guest-' + socket.id.substring(0, 6),
      name: 'Guest Player',
      isGuest: true,
    });
    socket.user = guestUser;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      const guestUser = new User(socket, {
        userId: 'guest-' + socket.id.substring(0, 6),
        name: 'Guest Player',
        isGuest: true,
      });
      socket.user = guestUser;
      return next();
    }
    socket.user = new User(socket, decoded);
    next();
  });
});

io.on('connection', (socket) => {
  const user = socket.user;
  console.log(`[Socket.IO] User connected: ${user.name} (${user.userId})`);
  gameManager.addUser(user);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${user.name} (${user.userId})`);
    gameManager.removeUser(socket);
  });
});

/**
 * 2. Raw WebSocket Server Setup (Port 8080 or dedicated instance for raw ws compatibility)
 */
const WS_PORT = process.env.WS_PORT || 8080;
let wss;

if (!process.env.VERCEL) {
  try {
    wss = new WebSocketServer({ port: WS_PORT });
    wss.on('connection', (ws, req) => {
      try {
        const parsedUrl = url.parse(req.url, true);
        const token = parsedUrl.query.token;

        let userClaims = {
          userId: 'guest-' + Math.random().toString(36).substring(2, 8),
          name: 'Guest User',
          isGuest: true,
        };

        if (token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            userClaims = decoded;
          } catch (err) {
            console.warn('[WS] Invalid JWT token supplied over WS, using fallback guest identity');
          }
        }

        const user = new User(ws, userClaims);
        console.log(`[WS] Client connected: ${user.name} (${user.userId})`);
        gameManager.addUser(user);

        ws.on('close', () => {
          console.log(`[WS] Client disconnected: ${user.name} (${user.userId})`);
          gameManager.removeUser(ws);
        });
      } catch (err) {
        console.error('[WS] Connection error:', err);
      }
    });

    console.log(`WebSocket Server running on ws://localhost:${WS_PORT}`);
  } catch (err) {
    console.error('Error initializing raw WebSocket server:', err);
  }
}

// Start HTTP + Socket.IO Server (only in standalone environments)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`HTTP + Socket.IO Server running on http://localhost:${PORT}`);
  });
}

// Attach references to app for module access
app.server = server;
app.io = io;
app.gameManager = gameManager;

// Export Express app as the default export for Vercel Serverless
module.exports = app;
