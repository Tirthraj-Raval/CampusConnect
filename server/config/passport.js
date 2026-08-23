const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const pool = require('../utils/db');
const crypto = require('crypto');

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

// Comma-separated list of allowed personal-login domains. Falls back to
// ahduni.edu.in for backward compatibility with the pre-cleanup config.
const allowedDomains = (process.env.ALLOWED_UNIVERSITY_DOMAINS || 'ahduni.edu.in')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

// A club email must contain the substring "club" in its local-part and its
// domain must be one of the allowed university domains.
const clubEmailPattern = /^[^@]*club[^@]*@([^@]+)$/i;

function isAllowedDomain(domain) {
  return allowedDomains.includes((domain || '').toLowerCase());
}

function isValidClubEmail(email) {
  const match = clubEmailPattern.exec(email || '');
  if (!match) return false;
  return isAllowedDomain(match[1]);
}

function generateUUIDFromGoogleId(googleId) {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const hash = crypto.createHash('sha1').update(namespace + googleId).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f | 0x80).toString(16) + hash.substring(18, 20)),
    hash.substring(20, 32),
  ].join('-');
}

// ---------------------------------------------------------------------------
// Session serialization — one shared shape for every principal.
// ---------------------------------------------------------------------------
// A session identifies WHICH kind of actor is logged in ("student",
// "superadmin", "club") and which id to look up. Deserialize restores the
// full row and re-attaches `type` so downstream middleware can distinguish
// principals without inspecting Passport internals.
passport.serializeUser((user, done) => {
  let type = null;

  if (user?.role === 'superadmin') {
    type = 'superadmin';
  } else if (user?.role === 'student') {
    type = 'student';
  } else {
    type = 'club'; // clubs live in the clubs table and don't carry `role`
  }

  done(null, { id: user.id, type });
});

passport.deserializeUser(async (obj, done) => {
  try {
    if (obj.type === 'superadmin' || obj.type === 'student') {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [obj.id]);
      if (rows.length === 0) return done(null, false);
      const user = rows[0];
      user.type = obj.type;
      return done(null, user);
    }

    if (obj.type === 'club') {
      const { rows } = await pool.query('SELECT * FROM clubs WHERE id = $1', [obj.id]);
      if (rows.length === 0) return done(null, false);
      const club = rows[0];
      club.type = 'club';
      return done(null, club);
    }

    return done(null, false);
  } catch (err) {
    return done(err, null);
  }
});

// ---------------------------------------------------------------------------
// Student strategy — personal Google OAuth for enrolled students.
// ---------------------------------------------------------------------------
passport.use('student-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${backendUrl}/auth/student/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    console.log('❌ Student login: no email on Google profile');
    return done(null, false);
  }

  const domain = email.split('@')[1];
  const googleId = profile.id;

  try {
    // Fast path: existing (email, google_id) match.
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND google_id = $2',
      [email, googleId]
    );
    if (existingUser.rows.length > 0) {
      return done(null, existingUser.rows[0]);
    }

    // Existing row imported via CSV without a google_id yet — patch it in.
    const userByEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userByEmail.rows.length > 0) {
      const updated = await pool.query(
        'UPDATE users SET google_id = $1 WHERE email = $2 RETURNING *',
        [googleId, email]
      );
      return done(null, updated.rows[0]);
    }

    // Brand-new signup — only permitted from a whitelisted university domain.
    if (!isAllowedDomain(domain)) {
      console.log('❌ Unauthorized domain on student signup:', domain);
      return done(null, false);
    }

    const uuid = generateUUIDFromGoogleId(googleId);
    const newUser = await pool.query(
      `INSERT INTO users (id, name, email, profile_pic, role, google_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [uuid, profile.displayName, email, profile.photos?.[0]?.value || null, 'student', googleId]
    );

    return done(null, newUser.rows[0]);
  } catch (err) {
    console.error('❌ Student login error:', err);
    return done(err, null);
  }
}));

// ---------------------------------------------------------------------------
// Club strategy — shared-credential Google OAuth for club accounts.
// The email MUST contain "club" in its local-part and use an allowed domain.
// A matching row in `clubs` must already exist (provisioned by super admin);
// this strategy does NOT create new club rows on the fly.
// ---------------------------------------------------------------------------
passport.use('club-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${backendUrl}/auth/club/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails?.[0]?.value;
  const googleId = profile.id;
  if (!email) {
    console.log('❌ Club login: no email on Google profile');
    return done(null, false);
  }

  // if (!isValidClubEmail(email)) {
  //   console.log('❌ Club login rejected — email does not match *club*@<allowed_domain>:', email);
  //   return done(null, false);
  // }

  try {
    // Fast path: already linked.
    const matched = await pool.query('SELECT * FROM clubs WHERE google_id = $1', [googleId]);
    if (matched.rows.length > 0) return done(null, matched.rows[0]);

    // First login — link google_id to the pre-provisioned row by email.
    const byEmail = await pool.query(
      'SELECT * FROM clubs WHERE email = $1 AND google_id IS NULL',
      [email]
    );
    if (byEmail.rows.length > 0) {
      const updated = await pool.query(
        'UPDATE clubs SET google_id = $1 WHERE email = $2 RETURNING *',
        [googleId, email]
      );
      return done(null, updated.rows[0]);
    }

    console.log('❌ Club login denied — no pre-provisioned club for', email);
    return done(null, false);
  } catch (err) {
    console.error('❌ Club login error:', err);
    return done(err, null);
  }
}));

module.exports = {
  isAllowedDomain,
  isValidClubEmail,
};
