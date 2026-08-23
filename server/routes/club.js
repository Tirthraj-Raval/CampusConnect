const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const {restrictTo, ensureAuthenticated} = require("../middlewares/auth");
const verifyClubAccess = require('../middlewares/verifyClubAccess'); // Middleware to verify club access

// ✅ GET club by ID (used for dashboard, about page)
router.get('/:clubId', async (req, res) => {
  const clubId = req.params.clubId;

  try {
    const result = await pool.query(
      `SELECT id, name, description, logo_url, about_html, university_id, google_id, created_at
       FROM clubs
       WHERE id = $1`,
      [clubId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching club:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ✅ PUT update club profile (logo, description, about_html, etc.)
// Only the club account itself is allowed to edit its profile.
// `about_html` is sanitized server-side (see utils/htmlSanitize.js).
const { sanitizeRichHtml } = require('../utils/htmlSanitize');

router.put('/:clubId', verifyClubAccess, async (req, res) => {
  const clubId = req.params.clubId;
  const { name, description, logo_url, about_html } = req.body;

  const safeAboutHtml = about_html == null ? null : sanitizeRichHtml(about_html);

  try {
    const result = await pool.query(
      `UPDATE clubs
       SET name = $1, description = $2, logo_url = $3, about_html = $4
       WHERE id = $5
       RETURNING *`,
      [name, description, logo_url, safeAboutHtml, clubId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json({ success: true, club: result.rows[0] });
  } catch (err) {
    console.error('Error updating club profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get events for a club, each with its RSVP count.
//
// Reachable by students as well as the owning club (the student dashboard
// lists a club's events), so it must not return per-attendee rows. It
// previously attached `all_rsvps` — every RSVP row including user_ids — which
// no client ever read, and which leaked the full attendee list of every event
// to any unauthenticated caller.
//
// The old shape also ran 2 extra queries per event (N+1); a single LEFT JOIN
// with GROUP BY returns the same counts in one round trip.
router.get('/:clubId/events', async (req, res) => {
  const clubId = req.params.clubId;

  try {
    const result = await pool.query(
      `SELECT e.*, COUNT(r.id)::int AS rsvps
         FROM events e
         LEFT JOIN rsvps r ON r.event_id = e.id
        WHERE e.club_id = $1
        GROUP BY e.id
        ORDER BY e.event_date DESC`,
      [clubId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch events with RSVPs error:', err);
    res.status(500).json({ error: 'Could not fetch events with RSVP data' });
  }
});


// Subscriber roster — names and email addresses. Restricted to the owning club
// account; this was previously unauthenticated, so anyone who knew a club id
// could dump its entire follower list with contact details.
router.get('/:clubId/subscriptions', verifyClubAccess, async (req, res) => {
  const { clubId } = req.params;

  try {
    const result = await pool.query(
      `SELECT cs.id, cs.subscribed_at, 
              u.id AS user_id, 
              u.name AS user_name, 
              u.email AS user_email
       FROM club_subscriptions cs
       JOIN users u ON u.id = cs.user_id
       WHERE cs.club_id = $1`,
      [clubId]
    );

    // Add `status: 'active'` field to match frontend expectations
    const formatted = result.rows.map(sub => ({
      ...sub,
      status: 'active',
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching club subscriptions:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Create new event for club — must be the club account itself.
// If `is_custom_html`, sanitize `custom_html` before storing.
router.post('/:clubId/events', verifyClubAccess, async (req, res) => {
  const clubId = req.params.clubId;
  const {
    title, description, event_date, max_capacity, location, status, poster_url,
    is_custom_html, custom_html,
  } = req.body;

  const safeCustomHtml = is_custom_html && custom_html
    ? sanitizeRichHtml(custom_html)
    : null;

  try {
    const result = await pool.query(`
      INSERT INTO events (
        club_id, title, description, event_date, max_capacity, location,
        status, poster_url, is_custom_html, custom_html
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      clubId, title, description, event_date, max_capacity, location,
      status, poster_url, Boolean(is_custom_html), safeCustomHtml,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// GET single event by ID
router.get('/:clubId/events/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const result = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
  res.json(result.rows[0]);
});

// PUT (edit) event
router.put('/:clubId/events/:eventId', verifyClubAccess, async (req, res) => {
  const { eventId } = req.params;
  const {
    title, description, event_date, max_capacity, location, status, poster_url,
    is_custom_html, custom_html,
  } = req.body;

  const safeCustomHtml = is_custom_html && custom_html
    ? sanitizeRichHtml(custom_html)
    : null;

  // Scope the UPDATE to the club from the verified session as well as the
  // event id. Without the club_id predicate, a club account could edit another
  // club's event by guessing its id — verifyClubAccess only proves the caller
  // owns the club named in the path, not that the event belongs to it.
  try {
    const result = await pool.query(`
      UPDATE events
         SET title = $1, description = $2, event_date = $3, max_capacity = $4,
             location = $5, status = $6, poster_url = $7,
             is_custom_html = $8, custom_html = $9
       WHERE id = $10 AND club_id = $11
       RETURNING *
    `, [
      title, description, event_date, max_capacity, location, status, poster_url,
      Boolean(is_custom_html), safeCustomHtml, eventId, req.params.clubId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found for this club' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    // Previously unguarded: a failing query rejected the handler's promise and
    // left the request hanging until the client timed out.
    console.error('Update event error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});


router.delete('/:clubId/events/:eventId', verifyClubAccess, async (req, res) => {
  const { eventId, clubId } = req.params;
  try {
    // Scoped to club_id for the same reason as the UPDATE above: prevent one
    // club from deleting another club's event by id.
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 AND club_id = $2',
      [eventId, clubId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found for this club' });
    }

    res.status(204).end();
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// GET /api/users/search?q=term&universityId=...
// Directory lookup used by the club dashboard when appointing committee
// members. Returns names and email addresses, so it requires a session — it
// was previously open, which let anyone enumerate a university's students.
router.get('/users/search', ensureAuthenticated, async (req, res) => {
  const { q, universityId } = req.query;

  if (!q || !universityId) {
    return res.status(400).json({ error: 'Missing query or universityId' });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, name, email, profile_pic 
      FROM users 
      WHERE university_id = $1 
        AND (name ILIKE $2 OR email ILIKE $2)
      LIMIT 10
      `,
      [universityId, `%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// Get registrations for event
router.get('/:clubId/events/:eventId/registrations', verifyClubAccess, async (req, res) => {
  const { eventId } = req.params;
  const result = await pool.query(`
    SELECT er.id, u.name, u.email
    FROM event_registrations er
    JOIN users u ON er.user_id = u.id
    WHERE er.event_id = $1
  `, [eventId]);
  res.json(result.rows);
});


//Route for fetching all clubs
router.get('/', async (req, res) => {
  try {
    // Explicit column list rather than SELECT *. This endpoint is public, and
    // `clubs` also holds `google_id` and the club's login `email`, neither of
    // which belongs in a public directory response.
    const { rows } = await pool.query(`
      SELECT id, name, description, logo_url, about_html, university_id, created_at
      FROM clubs
      ORDER BY created_at DESC
    `);

    return res.status(200).json({ clubs: rows });
  } catch (err) {
    console.error('Error fetching clubs:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/events/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT events.*, clubs.name AS club_name
       FROM events
       JOIN clubs ON events.club_id = clubs.id
       WHERE status = 'Published'
       ORDER BY event_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Search events by name and date
router.get('/events/search', async (req, res) => {
  const { query } = req.query;
  console.log("Search query received:", query);

  if (!query || query.trim() === '') {
    return res.json([]);
  }

  try {
    const result = await pool.query(
      `
      SELECT * FROM events 
      WHERE LOWER(title) LIKE LOWER($1)
      ORDER BY event_date DESC
      `,
      [`%${query}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Event search error:', err.message);
    res.status(500).json({ error: 'Failed to search events' });
  }
});


router.get('/events/:eventId', async (req, res) => {
  const { eventId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM events WHERE id = $1`,
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching event by ID:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/clubs/search', async (req, res) => {
  const query = req.query.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    const searchText = `%${query.trim().toLowerCase()}%`;
    // Same reasoning as the club directory above: no SELECT * on a public
    // endpoint over a table holding google_id and the club login email.
    const result = await pool.query(
      `SELECT id, name, description, logo_url, about_html, university_id, created_at
         FROM clubs
        WHERE LOWER(name) LIKE $1
        ORDER BY name LIMIT 20`,
      [searchText]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error searching clubs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔜 (Planned) GET club events — we’ll add this later
// router.get('/:id/events', async (req, res) => { ... });

// 🔜 (Planned) GET/POST committee members

module.exports = router;
