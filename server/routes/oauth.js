const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../utils/jwt');
const {
  db,
  getUserByEmail,
  getUserById,
  getUserByReferralCode,
  updateLastLogin,
} = require('../db/database');

function generateReferralCode(name) {
  const prefix = (name || 'USER').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return prefix + suffix;
}

const router = express.Router();

const GOOGLE_ENABLED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (GOOGLE_ENABLED) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:3001'}/api/oauth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value || '').toLowerCase().trim();
      const name = profile.displayName || email.split('@')[0];
      const googleId = profile.id;

      if (!email) {
        return done(new Error('Google account has no email'));
      }

      let user = await getUserByEmail(email);

      if (!user) {
        const id = uuidv4();

        let referralCode = generateReferralCode(name);
        let attempts = 0;
        while (await getUserByReferralCode(referralCode) && attempts < 10) {
          referralCode = generateReferralCode(name);
          attempts++;
        }

        await db.run(
          `INSERT INTO users (id, email, name, password_hash, referral_code, is_verified, created_at)
           VALUES (?, ?, ?, ?, ?, 1, unixepoch())`,
          [id, email, name, 'GOOGLE_AUTH_' + googleId, referralCode]
        );
        user = await getUserById(id);
      }

      await updateLastLogin(Math.floor(Date.now() / 1000), user.id);

      const token = generateToken(user.id);
      done(null, { user, token });
    } catch (err) {
      done(err);
    }
  }));

  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth?error=google' }),
    (req, res) => {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const token = req.user && req.user.token;
      if (!token) {
        return res.redirect(`${clientUrl}/auth?error=google`);
      }
      res.redirect(`${clientUrl}/auth/callback?token=${encodeURIComponent(token)}`);
    }
  );
} else {
  router.get('/google', (req, res) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth?error=google_not_configured`);
  });
}

module.exports = router;
