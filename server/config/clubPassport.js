const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../utils/db');
const passport = require('passport');
const crypto = require('crypto');

function generateUUIDFromGoogleId(googleId) {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const hash = crypto.createHash('sha1')
    .update(namespace + googleId)
    .digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f | 0x80).toString(16) + hash.substring(18, 20)),
    hash.substring(20, 32)
  ].join('-');
}

passport.use('club-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/club/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  const googleId = profile.id;
  const uuid = generateUUIDFromGoogleId(googleId);

  try {
    // STEP 1: Check if club exists with google_id and email
    const existingClub = await pool.query(`
      SELECT * FROM clubs 
      WHERE google_id = $1 AND email = $2
    `, [googleId, email]);

    if (existingClub.rows.length > 0) {
        console.log("✅ Returning Club login successful:", existingClub.rows[0]);
      return done(null, existingClub.rows[0]);
    }

    // STEP 2: If email exists but google_id is NULL (first-time login)
    const clubByEmail = await pool.query(`
      SELECT * FROM clubs 
      WHERE email = $1 AND google_id IS NULL
    `, [email]);

    if (clubByEmail.rows.length > 0) {
      const updatedClub = await pool.query(`
        UPDATE clubs 
        SET google_id = $1, id = $2
        WHERE email = $3
        RETURNING *
      `, [googleId, uuid, clubByEmail.rows[0].email]);

      console.log("✅ Club login successful:", updatedClub.rows[0]);
      return done(null, updatedClub.rows[0]);
    }


    // STEP 3: No matching club found
    console.log("❌ Club login denied: No matching club found for", email);
    return done(null, false);

  } catch (err) {
    console.error("🚨 Club login error:", err);
    return done(err, null);
  }
}));

passport.serializeUser((club, done) => {
  done(null, { id: club.id, type: 'club' });
});

passport.deserializeUser(async (obj, done) => {
  if (obj.type === 'club') {
    try {
      const { rows } = await pool.query('SELECT * FROM clubs WHERE id = $1', [obj.id]);
      return done(null, rows[0]);
    } catch (err) {
      return done(err, null);
    }
  } else {
    return done(null, false);
  }
});
