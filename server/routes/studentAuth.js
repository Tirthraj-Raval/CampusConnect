// routes/studentAuth.js
const express = require('express');
const passport = require('passport');
require('../config/passport'); // 🔁 Use student-specific passport strategy

const router = express.Router();

// 🔁 Route to start Google OAuth for students
router.get('/google', passport.authenticate('student-google', {
  scope: ['profile', 'email'],
}));

// ✅ Callback route
router.get('/google/callback',
  passport.authenticate('student-google', {
    failureRedirect: 'http://localhost:3000/student-login', // redirect to login page on failure
  }),
  (req, res) => {
    const studentId = req.user.id;
    return res.redirect(`http://localhost:3000/students/${studentId}/dashboard`);
  }
);

// 🔁 Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(err => {
      if (err) console.error(err);
      res.clearCookie('connect.sid');
      res.redirect('http://localhost:3000');
    });
  });
});

module.exports = router;
