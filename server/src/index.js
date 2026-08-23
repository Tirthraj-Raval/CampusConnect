const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
require('../config/passport');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

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

const allowedOrigins = [
  process.env.APP_URL,
  process.env.BACKEND_URL,
  'http://localhost:3000',
  'http://localhost:5000',
].filter(Boolean);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store Socket.IO instance in app for use in controllers
app.set('socketio', io);

// ✅ Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.set('trust proxy', 1);

app.use(express.json());
app.use(morgan('dev'));

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not set — refusing to start with an insecure fallback.');
}

// Session middleware is extracted into a variable so we can share it with
// Socket.IO via io.engine.use(...) — that's what gives every socket access
// to the authenticated Passport user on socket.request.user.
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Share session + passport with Socket.IO so socket handlers see req.user.
io.engine.use(sessionMiddleware);
io.engine.use(passport.initialize());
io.engine.use(passport.session());

// Certificate Route files
// Replace your current certificate route with:
app.use('/certificates', express.static(path.join(__dirname, '../certificates'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

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


// ---------------------------------------------------------------------------
// Socket.IO — authenticated sessions + room conventions.
// ---------------------------------------------------------------------------
// Room conventions:
//   user_<userId>   → per-user firehose (notifications, personal RSVP echoes)
//   club_<clubId>   → per-club firehose (new subscription, new feedback, etc.)
//   event_<eventId> → live event page (seat counter, live updates)
//
// The server OWNS the room name — clients emit bare IDs and the server prefixes
// them. Ownership rooms (`user_*`, `club_*`) are auto-joined on connect based
// on the authenticated session, so clients don't have to remember. Membership
// in the ownership rooms is also enforced: you cannot subscribe to another
// user's notification firehose even if you know their id.
io.on('connection', (socket) => {
  const req = socket.request;
  const user = req.user || null;

  console.log(
    '🔌 New client connected:',
    socket.id,
    user ? `as ${user.type} ${user.id}` : '(unauthenticated)'
  );

  // Auto-join ownership rooms based on the session.
  if (user) {
    if (user.type === 'club') {
      socket.join(`club_${user.id}`);
    } else if (user.type === 'student' || user.type === 'superadmin') {
      socket.join(`user_${user.id}`);
    }
  }

  // Live-event pages: any authenticated user can subscribe to events they can
  // legitimately see. We don't enforce read permission here — the browser only
  // shows the page after the REST call succeeds, so joining the room only
  // matters to receive real-time deltas.
  socket.on('join_event_room', (eventId) => {
    if (!user) return;
    if (eventId === undefined || eventId === null) return;
    socket.join(`event_${eventId}`);
    console.log(`🟢 Socket ${socket.id} joined event_${eventId}`);
  });

  socket.on('leave_event_room', (eventId) => {
    if (eventId === undefined || eventId === null) return;
    socket.leave(`event_${eventId}`);
    console.log(`🔴 Socket ${socket.id} left event_${eventId}`);
  });

  // Manual join_user_room — legacy clients may still emit this. We only accept
  // it if the id matches the authenticated user.
  socket.on('join_user_room', (userId) => {
    if (!user || String(user.id) !== String(userId)) {
      console.log(`⛔ join_user_room denied for socket ${socket.id}`);
      return;
    }
    socket.join(`user_${userId}`);
  });

  // Manual join_club_room — accepted only from the matching club account.
  socket.on('join_club_room', (clubId) => {
    if (!user || user.type !== 'club' || String(user.id) !== String(clubId)) {
      console.log(`⛔ join_club_room denied for socket ${socket.id}`);
      return;
    }
    socket.join(`club_${clubId}`);
  });

  socket.on('leave_club_room', (clubId) => {
    if (clubId === undefined || clubId === null) return;
    socket.leave(`club_${clubId}`);
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

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
