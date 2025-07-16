const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
require('../config/passport');

const pool = require('../utils/db');
const universityRoutes = require('../routes/university');
const adminRoutes = require('../routes/admin');
const clubRoutes = require('../routes/club'); // adjust path as needed
const clubAuthRoutes = require('../routes/clubAuth');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

app.use(session({
  secret: 'keyboard cat', // keep safe in prod
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true if using HTTPS
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ Mount routers
app.use('/api/university', universityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/club', clubRoutes);
app.use('/auth/club', clubAuthRoutes);

// ✅ Auth Routes
app.get('/auth/google',
  passport.authenticate('student-google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('student-google', {
    failureRedirect: 'http://localhost:3000/stundent-login'
  }),
  (req, res) => {
    res.redirect('http://localhost:3000');
  }
);

// 🔁 Club Auth Routes
app.get('/auth/club/google',
  passport.authenticate('club-google', { scope: ['profile', 'email'] })
);

app.get('/auth/club/google/callback',
  passport.authenticate('club-google', {
    failureRedirect: 'http://localhost:3000/club-login'
  }),
  (req, res) => {
    res.redirect('http://localhost:3000/clubs/dashboard'); // or desired path
  }
);



// ✅ Auth Session Info
app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    const user = req.user;

    if (user?.role === 'student') {
      return res.status(200).json({ type: 'student', user });
    } else if (user?.role === 'superadmin') {
      console.log("✅ Superadmin session info:", user);
      return res.status(200).json({ type: 'superadmin', user });
    } else if (user?.google_id && user?.name && !user?.role) {
      return res.status(200).json({ type: 'club', user });
    }

    return res.status(500).json({ message: 'Unknown user type' });
  }

  return res.status(401).json({ message: 'Not authenticated' });
});



// 📤  Log the user out
app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(err => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).send('Logout failed');
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ success: true });
    });
  });
});

// ✅ Health Check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend running fine' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
