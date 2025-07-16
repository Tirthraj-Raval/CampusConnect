const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
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
router.get('/:clubId/events', async (req, res) => {
  const clubId = req.params.clubId;

  try {
    const result = await pool.query(`SELECT * FROM events WHERE club_id = $1 ORDER BY event_date DESC`, [clubId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ error: 'Could not fetch events' });
  }
});

// Create new event for club
router.post('/:clubId/events', async (req, res) => {
  const clubId = req.params.clubId;
  const { title, description, date } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO events (club_id, title, description, event_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [clubId, title, description, date]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// GET single event by ID
router.get('/:clubId/events/:eventId', verifyClubAccess, async (req, res) => {
  const { eventId } = req.params;
  const result = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
  res.json(result.rows[0]);
});

// PUT (edit) event
router.put('/:clubId/events/:eventId', verifyClubAccess, async (req, res) => {
  const { eventId } = req.params;
  const { title, description, date } = req.body;
  const result = await pool.query(`
    UPDATE events SET title = $1, description = $2, event_date = $3 WHERE id = $4 RETURNING *
  `, [title, description, date, eventId]);
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
        id, name, description, logo_url, university_id 
      FROM clubs
      ORDER BY created_at DESC
    `);

    return res.status(200).json({ clubs: rows });
  } catch (err) {
    console.error('Error fetching clubs:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔜 (Planned) GET club events — we’ll add this later
// router.get('/:id/events', async (req, res) => { ... });

// 🔜 (Planned) GET/POST committee members

module.exports = router;
