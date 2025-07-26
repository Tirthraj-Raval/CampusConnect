const db = require('../../utils/db');

exports.submitFeedback = async (req, res) => {
  const userId = req.user.id;
  const { event_id, rating, comment } = req.body;

  try {
    // Get the club_id from the events table
    const clubResult = await db.query(
      'SELECT club_id FROM events WHERE id = $1',
      [event_id]
    );

    if (clubResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const club_id = clubResult.rows[0].club_id;

    // Insert into event_feedbacks
    await db.query(
      `INSERT INTO event_feedbacks (user_id, event_id, rating, comment, club_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, event_id, rating, comment, club_id]
    );

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
