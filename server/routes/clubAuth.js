const express = require('express');
const passport = require('passport');
require('../config/clubPassport'); // 🔁 Import club passport config

const router = express.Router();
const appUrl = process.env.APP_URL || 'http://localhost:3000';

// 🔁 Route to start OAuth login for club
router.get('/google', passport.authenticate('club-google', {
  scope: ['profile', 'email'],
}));

// ✅ Callback route
router.get('/google/callback',
  passport.authenticate('club-google', {
    failureRedirect: `${appUrl}/club-login`, // custom failure UI
  }),
  (req, res) => {
    // ✅ On success, redirect to that club's dashboard
    const clubId = req.user.id;
    return res.redirect(`${appUrl}/clubs/${clubId}/dashboard`);
  }
);


// 🔁 Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(err => {
      if (err) console.error(err);
      res.clearCookie('connect.sid');
      res.redirect(`${appUrl}`);
    });
  });
});

module.exports = router;
