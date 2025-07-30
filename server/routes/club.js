const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const {restrictTo} = require("../middlewares/auth");
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
router.put('/:clubId', async (req, res) => {
  const clubId = req.params.clubId;
  const { name, description, logo_url, about_html } = req.body;

  try {
    const result = await pool.query(
      `UPDATE clubs
       SET name = $1, description = $2, logo_url = $3, about_html = $4
       WHERE id = $5
       RETURNING *`,
      [name, description, logo_url, about_html, clubId]
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

// Update club profile
router.put('/:clubId', async (req, res) => {
  const clubId = req.params.clubId;
  const { name, logo_url, description, about_html } = req.body;

  try {
    const result = await pool.query(`
      UPDATE clubs
      SET name = $1, logo_url = $2, description = $3, about_html = $4
      WHERE id = $5
      RETURNING *
    `, [name, logo_url, description, about_html, clubId]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update club error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Get events for a club
// Get events for a club with RSVP count and all RSVPs
router.get('/:clubId/events', async (req, res) => {
  const clubId = req.params.clubId;

  try {
    const eventsResult = await pool.query(
      `SELECT * FROM events WHERE club_id = $1 ORDER BY event_date DESC`,
      [clubId]
    );

    const events = eventsResult.rows;

    // For each event, fetch its RSVP count and full RSVP data
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const rsvpCountResult = await pool.query(
          `SELECT COUNT(*) FROM rsvps WHERE event_id = $1`,
          [event.id]
        );

        const allRsvpsResult = await pool.query(
          `SELECT * FROM rsvps WHERE event_id = $1`,
          [event.id]
        );

        return {
          ...event,
          rsvps: parseInt(rsvpCountResult.rows[0].count, 10),
          all_rsvps: allRsvpsResult.rows,
        };
      })
    );

    res.json(enrichedEvents);
  } catch (err) {
    console.error('Fetch events with RSVPs error:', err);
    res.status(500).json({ error: 'Could not fetch events with RSVP data' });
  }
});


router.get('/:clubId/subscriptions', async (req, res) => {
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


// Create new event for club
router.post('/:clubId/events', async (req, res) => {
  const clubId = req.params.clubId;
  const { title, description, event_date, max_capacity, location, status, poster_url } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO events (club_id, title, description, event_date, max_capacity, location, status, poster_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [clubId, title, description, event_date, max_capacity, location, status, poster_url]);

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
  const { title, description, event_date, max_capacity, location, status, poster_url } = req.body;
  console.log("Request to edit event:", { eventId, title, description, event_date, max_capacity, location, status, poster_url });
  const result = await pool.query(`
    UPDATE events SET title = $1, description = $2, event_date = $3, max_capacity = $4, location = $5, status = $6, poster_url = $7 WHERE id = $8 RETURNING *
  `, [title, description, event_date, max_capacity, location, status, poster_url, eventId]);
  res.json(result.rows[0]);
});


router.delete('/:clubId/events/:eventId', verifyClubAccess, async (req, res) => {
  const { eventId } = req.params;
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// GET /api/users/search?q=term&universityId=...
router.get('/users/search', async (req, res) => {
  const { q, universityId } = req.query;
  console.log("This backend is hit with query:", q, "and universityId:", universityId);

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
    console.log("First user found:", result.rows[0]);
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
    const { rows } = await pool.query(`
      SELECT 
        * 
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
    const result = await pool.query(
      `SELECT * FROM clubs WHERE LOWER(name) LIKE $1 ORDER BY name LIMIT 20`,
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
