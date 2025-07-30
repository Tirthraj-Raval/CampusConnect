// routes/studentAuth.js
const express = require('express');
const passport = require('passport');
require('../config/passport'); // 🔁 Use student-specific passport strategy

const router = express.Router();
const appUrl = process.env.APP_URL || 'http://localhost:3000';

// 🔁 Route to start Google OAuth for students
router.get('/google', passport.authenticate('student-google', {
  scope: ['profile', 'email'],
}));

// ✅ Callback route
router.get('/google/callback',
  passport.authenticate('student-google', {
    failureRedirect: `${appUrl}/student-login`, // redirect to login page on failure
  }),
  (req, res) => {
    const studentId = req.user.id;
    console.log('Student authenticated:', req.user);
    console.log("Session created is req.session:", req.session);
    return res.redirect(`${appUrl}/students/${studentId}/dashboard`);
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
