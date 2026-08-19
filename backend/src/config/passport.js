const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const { db } = require('./db');

function initPassport() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: '/auth/google/callback',
        },
        async function (accessToken, refreshToken, profile, done) {
          try {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (!email) {
              return done(new Error('No email found from Google account'));
            }

            const user = await db.user.upsert({
              create: {
                email,
                name: profile.displayName || profile.username || 'Google User',
                provider: 'GOOGLE',
              },
              update: {
                name: profile.displayName || profile.username,
                lastLogin: new Date(),
              },
              where: {
                email,
              },
            });

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        },
      ),
    );
  } else {
    console.log('[Passport] Google OAuth credentials not provided, skipping GoogleStrategy');
  }

  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
    passport.use(
      new GithubStrategy(
        {
          clientID: GITHUB_CLIENT_ID,
          clientSecret: GITHUB_CLIENT_SECRET,
          callbackURL: '/auth/github/callback',
        },
        async function (accessToken, refreshToken, profile, done) {
          try {
            let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

            if (!email) {
              const res = await fetch('https://api.github.com/user/emails', {
                headers: {
                  Authorization: `token ${accessToken}`,
                  'User-Agent': 'Chess-Backend',
                },
              });
              if (res.ok) {
                const data = await res.json();
                const primaryEmail = data.find((item) => item.primary === true) || data[0];
                if (primaryEmail) {
                  email = primaryEmail.email;
                }
              }
            }

            if (!email) {
              email = `${profile.username}@github.chess.local`;
            }

            const user = await db.user.upsert({
              create: {
                email,
                username: profile.username,
                name: profile.displayName || profile.username || 'Github User',
                provider: 'GITHUB',
              },
              update: {
                name: profile.displayName || profile.username,
                lastLogin: new Date(),
              },
              where: {
                email,
              },
            });

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        },
      ),
    );
  } else {
    console.log('[Passport] GitHub OAuth credentials not provided, skipping GithubStrategy');
  }

  passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        rating: user.rating,
      });
    });
  });

  passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  });
}

module.exports = {
  initPassport,
};
