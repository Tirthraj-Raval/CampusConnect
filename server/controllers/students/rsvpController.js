const pool = require('../../utils/db');
const { broadcastRsvpUpdate } = require('../../utils/realtime');

exports.rsvpEvent = async (req, res) => {
  const client = await pool.connect();
  // `events.id` is an integer column. The body may deliver it as a string
  // depending on the caller, so normalise once here — the value we broadcast
  // must have the same type as the one the browser holds, or strict equality
  // on the client silently drops the update.
  const eventId = Number(req.body.event_id);
  const user_id = req.user.id;

  if (!Number.isInteger(eventId)) {
    client.release();
    return res.status(400).json({ error: 'A valid event_id is required' });
  }

  try {
    await client.query('BEGIN');

    // Lock the event row so concurrent RSVPs serialise on capacity.
    const eventResult = await client.query(`
      SELECT id, club_id, max_capacity FROM events
      WHERE id = $1
      FOR UPDATE
    `, [eventId]);

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    const countResult = await client.query(`
      SELECT COUNT(*) FROM rsvps WHERE event_id = $1
    `, [eventId]);

    const currentCount = parseInt(countResult.rows[0].count, 10);
    if (currentCount >= event.max_capacity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Event is full' });
    }

    // ON CONFLICT: rsvps now carries UNIQUE(user_id, event_id) from the
    // hotfix migration. Without this clause a double-submit raises a unique
    // violation and surfaces as an opaque 500 instead of a clear message.
    const insertResult = await client.query(`
      INSERT INTO rsvps (event_id, user_id, club_id, rsvp_time)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, event_id) DO NOTHING
    `, [eventId, user_id, event.club_id]);

    if (insertResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You have already RSVP\'d to this event' });
    }

    // Re-read the count inside the transaction rather than assuming
    // `currentCount + 1`. The row lock above means this is the authoritative
    // number, and it stays correct even if rows are removed concurrently.
    const finalCountResult = await client.query(`
      SELECT COUNT(*) FROM rsvps WHERE event_id = $1
    `, [eventId]);
    const updatedCount = parseInt(finalCountResult.rows[0].count, 10);

    await client.query('COMMIT');

    broadcastRsvpUpdate(req, {
      eventId,
      clubId: event.club_id,
      currentCount: updatedCount,
      maxCapacity: event.max_capacity,
    });

    res.json({ success: true, currentCount: updatedCount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('RSVP Error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};


exports.cancelRSVP = async (req, res) => {
  const client = await pool.connect();
  const userId = req.user.id;
  // Route params always arrive as strings. Left as-is, the broadcast below
  // carried a string `eventId` while the RSVP path carried a number, so the
  // client's strict `===` comparison never matched and the seat counter only
  // moved on refresh. Normalise to match the RSVP path exactly.
  const eventId = Number(req.params.eventId);

  if (!Number.isInteger(eventId)) {
    client.release();
    return res.status(400).json({ error: 'A valid event id is required' });
  }

  try {
    await client.query('BEGIN');

    const eventResult = await client.query(`
      SELECT id, club_id, max_capacity FROM events WHERE id = $1 FOR UPDATE
    `, [eventId]);

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    const deleteResult = await client.query(`
      DELETE FROM rsvps
      WHERE user_id = $1 AND event_id = $2
    `, [userId, eventId]);

    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'RSVP not found for user' });
    }

    const countResult = await client.query(`
      SELECT COUNT(*) FROM rsvps WHERE event_id = $1
    `, [eventId]);
    const updatedCount = parseInt(countResult.rows[0].count, 10);

    await client.query('COMMIT');

    broadcastRsvpUpdate(req, {
      eventId,
      clubId: event.club_id,
      currentCount: updatedCount,
      maxCapacity: event.max_capacity,
    });

    res.json({ message: 'RSVP removed', currentCount: updatedCount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cancel RSVP Error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};


exports.getStudentRSVPs = async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query(`
    SELECT events.* FROM events
    JOIN rsvps ON events.id = rsvps.event_id
    WHERE rsvps.user_id = $1
  `, [userId]);
  res.json(result.rows);
};

// server/controllers/rsvpController.js
exports.getEventCapacities = async (req, res) => {
  const result = await pool.query(`
    SELECT 
      e.id AS "eventId",
      e.title,
      e.event_date,
      e.max_capacity AS "maxCapacity",
      COUNT(r.id) AS "currentCount"
    FROM events e
    LEFT JOIN rsvps r ON e.id = r.event_id
    GROUP BY e.id
    ORDER BY e.event_date
  `);

  res.json(result.rows);
};
