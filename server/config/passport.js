const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const pool = require('../utils/db');
const crypto = require('crypto');

const allowedDomain = 'ahduni.edu.in';

function generateUUIDFromGoogleId(googleId) {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const hash = crypto.createHash('sha1').update(namespace + googleId).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f | 0x80).toString(16) + hash.substring(18, 20)),
    hash.substring(20, 32)
  ].join('-');
}

// ✅ Unified serialize/deserialize with superadmin support
passport.serializeUser((user, done) => {
  let type = null;

  if (user?.role === 'superadmin') {
    type = 'superadmin';
  } else if (user?.role === 'student') {
    type = 'student';
  } else {
    type = 'club'; // clubs don't have 'role' field
  }

  done(null, {
    id: user.id,
    type: type,
  });
});

passport.deserializeUser(async (obj, done) => {
  try {
    if (obj.type === 'superadmin' || obj.type === 'student') {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [obj.id]);
      if (rows.length === 0) return done(null, false);
      const user = rows[0];
      user.type = obj.type; // ✅ Restore type from session
      return done(null, user);
    } else if (obj.type === 'club') {
      const { rows } = await pool.query('SELECT * FROM clubs WHERE id = $1', [obj.id]);
      if (rows.length === 0) return done(null, false);
      const club = rows[0];
      club.type = 'club';
      return done(null, club);
    } else {
      return done(null, false); // unknown type
    }
  } catch (err) {
    return done(err, null);
  }
});

//
// 🎓 STUDENT STRATEGY
//
passport.use('student-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  const domain = email.split('@')[1];
  const googleId = profile.id;

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1 AND google_id = $2', [email, googleId]);

    if (existingUser.rows.length > 0) {
      return done(null, existingUser.rows[0]);
    }

    const userByEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userByEmail.rows.length > 0) {
      const updated = await pool.query(
        'UPDATE users SET google_id = $1 WHERE email = $2 RETURNING *',
        [googleId, email]
      );
      return done(null, updated.rows[0]);
    }

    if (domain !== allowedDomain) {
    console.log("❌ Unauthorized domain:", domain);
    return done(null, false);
    }

    const uuid = generateUUIDFromGoogleId(googleId);

    const newUser = await pool.query(`
      INSERT INTO users (id, name, email, profile_pic, role, google_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      uuid,
      profile.displayName,
      email,
      profile.photos[0].value,
      'student',
      googleId
    ]);

    return done(null, newUser.rows[0]);
  } catch (err) {
    console.error("❌ Student login error:", err);
    return done(err, null);
  }
}));


//
// 🏛️ CLUB STRATEGY
//
passport.use('club-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/club/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  const googleId = profile.id;
  const name = profile.displayName;

  try {

    if (domain !== allowedDomain) {
    console.log("❌ Unauthorized domain:", domain);
    return done(null, false);
    }

    // Step 1: Try exact match
    const match = await pool.query('SELECT * FROM clubs WHERE google_id = $1', [googleId]);
    if (match.rows.length > 0) return done(null, match.rows[0]);

    // Step 2: Patch google_id if first login
    const byEmail = await pool.query('SELECT * FROM clubs WHERE email = $1 AND google_id IS NULL', [email]);

    if (byEmail.rows.length > 0) {
      const updated = await pool.query('UPDATE clubs SET google_id = $1 WHERE email = $2 RETURNING *', [googleId, email]);
      return done(null, updated.rows[0]);
    }

    console.log("❌ Club login failed: No matching club found.");
    return done(null, false);
  } catch (err) {
    console.error("❌ Club login error:", err);
    return done(err, null);
  }
}));
