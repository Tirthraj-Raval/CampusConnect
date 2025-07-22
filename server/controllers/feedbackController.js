const pool = require("../utils/db");

exports.getFeedbacks = async (req, res) => {
  const { clubId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM event_feedbacks WHERE club_id = $1 ORDER BY submitted_at DESC",
      [clubId]
    );
    res.json(result.rows);
  } catch (err) {
    console.log('Error fetching feedbacks:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getFeedbackStats = async (req, res) => {
  const { clubId } = req.params;

  try {
    const result = await pool.query(`
      SELECT rating, COUNT(*) AS count
      FROM event_feedbacks f
      JOIN events e ON e.id = f.event_id
      WHERE e.club_id = $1
      GROUP BY rating
      ORDER BY rating DESC
    `, [clubId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Feedback stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};