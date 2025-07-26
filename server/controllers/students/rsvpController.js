const pool = require('../../utils/db');

exports.rsvpEvent = async (req, res) => {
  const client = await pool.connect();
  const { event_id } = req.body;
  const user_id = req.user.id;

  try {
    await client.query('BEGIN');

    // Lock the event row
    const eventResult = await client.query(`
      SELECT id, max_capacity FROM events
      WHERE id = $1
      FOR UPDATE
    `, [event_id]);

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    // Count existing RSVPs
    const countResult = await client.query(`
      SELECT COUNT(*) FROM rsvps WHERE event_id = $1
    `, [event_id]);

    const currentCount = parseInt(countResult.rows[0].count, 10);
    if (currentCount >= event.max_capacity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Event is full' });
    }

    // Insert RSVP
    await client.query(`
      INSERT INTO rsvps (event_id, user_id, club_id, rsvp_time)
      VALUES ($1, $2, (SELECT club_id FROM events WHERE id = $1), NOW())
    `, [event_id, user_id]);

    await client.query('COMMIT');

    // Broadcast the update via Socket.IO
    const io = req.app.get('socketio');
    io.to(`event_${event_id}`).emit('rsvp_update', {
      eventId: event_id,
      currentCount: currentCount + 1,
    });

    res.json({ success: true });
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
  const eventId = req.params.eventId;

  try {
    await client.query('BEGIN');

    // Check if event exists
    const eventResult = await client.query(`
      SELECT id FROM events WHERE id = $1 FOR UPDATE
    `, [eventId]);

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete RSVP
    const deleteResult = await client.query(`
      DELETE FROM rsvps
      WHERE user_id = $1 AND event_id = $2
    `, [userId, eventId]);

    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'RSVP not found for user' });
    }

    // Re-count RSVPs
    const countResult = await client.query(`
      SELECT COUNT(*) FROM rsvps WHERE event_id = $1
    `, [eventId]);
    const updatedCount = parseInt(countResult.rows[0].count, 10);

    await client.query('COMMIT');

    // Notify clients via WebSocket
    const io = req.app.get('socketio');
    io.to(`event_${eventId}`).emit('rsvp_update', {
      eventId: eventId,
      currentCount: updatedCount,
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
      e.max_capacity AS "maxCapacity",
      COUNT(r.id) AS "currentCount"
    FROM events e
    LEFT JOIN rsvps r ON e.id = r.event_id
    GROUP BY e.id
    ORDER BY e.event_date
  `);

  res.json(result.rows);
};
