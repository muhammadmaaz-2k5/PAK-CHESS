const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/db');
const { COOKIE_MAX_AGE } = require('../config/constants');
const { JWT_SECRET } = require('../middlewares/auth');

const router = express.Router();
const CLIENT_URL = process.env.AUTH_REDIRECT_URL || 'http://localhost:5173/game/random';

/**
 * POST /auth/guest
 * Create or register guest user and return JWT
 */
router.post('/guest', async (req, res) => {
  try {
    const { name } = req.body;
    const guestUUID = 'guest-' + uuidv4().substring(0, 8);
    const displayName = name ? String(name).trim().substring(0, 30) : `Guest_${guestUUID.split('-')[1]}`;

    const user = await db.user.create({
      data: {
        username: guestUUID,
        email: `${guestUUID}@chess100x.com`,
        name: displayName,
        provider: 'GUEST',
        rating: 1200,
      },
    });

    const token = jwt.sign(
      { userId: user.id, name: user.name, isGuest: true },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const userDetails = {
      id: user.id,
      name: user.name,
      token,
      isGuest: true,
      rating: user.rating,
    };

    res.cookie('guest', token, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: false,
      sameSite: 'lax',
    });

    return res.status(201).json(userDetails);
  } catch (err) {
    console.error('Error creating guest user:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /auth/refresh
 * Refresh or extract current authenticated user info
 */
router.get('/refresh', async (req, res) => {
  try {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.guest) {
      token = req.cookies.guest;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userDb = await db.user.findUnique({
          where: { id: decoded.userId || decoded.id },
        });

        if (userDb) {
          const refreshedToken = jwt.sign(
            { userId: userDb.id, name: userDb.name, isGuest: userDb.provider === 'GUEST' },
            JWT_SECRET,
            { expiresIn: '7d' },
          );

          res.cookie('guest', refreshedToken, { maxAge: COOKIE_MAX_AGE, sameSite: 'lax' });
          return res.json({
            id: userDb.id,
            name: userDb.name,
            rating: userDb.rating,
            token: refreshedToken,
            isGuest: userDb.provider === 'GUEST',
          });
        }
      } catch (tokenErr) {
        // Token invalid/expired, fall back to session
      }
    }

    if (req.user) {
      const user = req.user;
      const userDb = await db.user.findUnique({
        where: { id: user.id || user.userId },
      });

      if (!userDb) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      const newToken = jwt.sign(
        { userId: userDb.id, name: userDb.name, isGuest: userDb.provider === 'GUEST' },
        JWT_SECRET,
        { expiresIn: '7d' },
      );

      return res.json({
        token: newToken,
        id: userDb.id,
        name: userDb.name,
        rating: userDb.rating,
        isGuest: userDb.provider === 'GUEST',
      });
    }

    return res.status(401).json({ success: false, message: 'Unauthorized' });
  } catch (err) {
    console.error('Error in /auth/refresh:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /auth/login/failed
 */
router.get('/login/failed', (req, res) => {
  res.status(401).json({ success: false, message: 'Authentication failed' });
});

/**
 * GET /auth/logout
 */
router.get('/logout', (req, res) => {
  res.clearCookie('guest');
  res.clearCookie('jwt');
  if (typeof req.logout === 'function') {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      return res.json({ success: true, message: 'Logged out successfully' });
    });
  } else {
    return res.json({ success: true, message: 'Logged out successfully' });
  }
});

/**
 * OAuth Routes: Google & GitHub with safety checks
 */
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ success: false, error: 'Google OAuth not configured in .env' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect('/auth/login/failed');
    }
    passport.authenticate('google', {
      successRedirect: CLIENT_URL,
      failureRedirect: '/auth/login/failed',
    })(req, res, next);
  },
);

router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(503).json({ success: false, error: 'GitHub OAuth not configured in .env' });
  }
  passport.authenticate('github', { scope: ['read:user', 'user:email'] })(req, res, next);
});

router.get(
  '/github/callback',
  (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return res.redirect('/auth/login/failed');
    }
    passport.authenticate('github', {
      successRedirect: CLIENT_URL,
      failureRedirect: '/auth/login/failed',
    })(req, res, next);
  },
);

module.exports = router;
