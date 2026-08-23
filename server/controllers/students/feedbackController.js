const db = require('../../utils/db');
const { broadcastNewFeedback } = require('../../utils/realtime');

exports.submitFeedback = async (req, res) => {
  const userId = req.user.id;
  const { event_id, rating, comment } = req.body;

  const eventId = Number(event_id);
  if (!Number.isInteger(eventId)) {
    return res.status(400).json({ message: 'A valid event_id is required' });
  }

  // The column carries CHECK (rating >= 1 AND rating <= 5). Validate here so a
  // bad value returns a clear 400 rather than a constraint-violation 500.
  if (rating != null && (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5)) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  try {
    // Pull the title alongside club_id — the club dashboard renders the event
    // title in its live feedback toast, and fetching it here avoids a second
    // round trip on the client.
    const eventResult = await db.query(
      'SELECT club_id, title FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { club_id, title } = eventResult.rows[0];

    await db.query(
      `INSERT INTO event_feedbacks (user_id, event_id, rating, comment, club_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, eventId, rating, comment, club_id]
    );

    broadcastNewFeedback(req, {
      clubId: club_id,
      eventId,
      eventTitle: title,
      rating,
    });

    res.json({ message: 'Feedback submitted' });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getStudentFeedback = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.eventId;
  const result = await db.query('SELECT * FROM event_feedbacks WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
  res.json(result.rows[0]);
};
