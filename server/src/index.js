const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
require('../config/passport');
const http = require('http');
const { Server } = require('socket.io');

const pool = require('../utils/db');
const universityRoutes = require('../routes/university');
const adminRoutes = require('../routes/admin');
const clubRoutes = require('../routes/club'); // adjust path as needed
const clubAuthRoutes = require('../routes/clubAuth');

const analyticsRoutes = require("../routes/analytics");
const committeeRoutes = require("../routes/committee");
const feedbackRoutes = require("../routes/feedback");
const notificationsRoutes = require("../routes/notifications");
const certificatesRoutes = require("../routes/certificates");
const rsvpsRoutes = require("../routes/rsvps");

const studentRoutes = require('../routes/student');
const studentAuth = require('../routes/studentAuth');

const app = express();
const PORT = process.env.PORT || 5000;
const appUrl = process.env.APP_URL || 'http://localhost:3000';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // or restrict to your frontend domain
    methods: ['GET', 'POST'],
  },
});

// Store Socket.IO instance in app for use in controllers
app.set('socketio', io);

// ✅ Middleware
app.use(cors({
  origin: [process.env.APP_URL, process.env.BACKEND_URL, 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

app.use(session({
  secret: 'keyboard cat', // keep safe in prod
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // set to true if using HTTPS
    httpOnly: true,
    sameSite: 'none'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ Mount routers
app.use('/api/university', universityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/club', clubRoutes);
app.use('/auth/club', clubAuthRoutes);
// Dashboard routes
app.use("/api/clubs", analyticsRoutes);
app.use("/api/clubs", committeeRoutes);
app.use('/api/clubs', rsvpsRoutes);
app.use("/api/clubs", feedbackRoutes);
app.use("/api/clubs", notificationsRoutes);
app.use("/api/clubs", certificatesRoutes);

// Student routes
app.use('/api/student', studentRoutes);
app.use('/auth/student', studentAuth);


// Socket.IO logic
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Join room for an event to receive real-time RSVP updates
  socket.on('join_event_room', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`🟢 Socket ${socket.id} joined event_${eventId}`);
  });

  // Optionally: leave room
  socket.on('leave_event_room', (eventId) => {
    socket.leave(`event_${eventId}`);
    console.log(`🔴 Socket ${socket.id} left event_${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ✅ Auth Routes
app.get('/auth/student/google',
  passport.authenticate('student-google', { scope: ['profile', 'email'] })
);

app.get('/auth/student/google/callback',
  passport.authenticate('student-google', {
    failureRedirect: `${appUrl}/student-login`
  }),
  (req, res) => {
    res.redirect(`${appUrl}`);
  }
);

// 🔁 Club Auth Routes
app.get('/auth/club/google',
  passport.authenticate('club-google', { scope: ['profile', 'email'] })
);

app.get('/auth/club/google/callback',
  passport.authenticate('club-google', {
    failureRedirect: `${appUrl}/club-login`
  }),
  (req, res) => {
    res.redirect(`${appUrl}/clubs/dashboard`);
  }
);



// ✅ Auth Session Info
app.get('/login', (req, res) => {
  console.log("session info:", req.session);
  console.log("Session ID:", req.sessionID);
  console.log("Session cookie:", req.session.cookie);
  console.log("User found in request:", req.user);
  console.log("Is Authenticated:", req.isAuthenticated());
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

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
