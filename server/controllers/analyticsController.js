const pool = require("../utils/db");

exports.getClubAnalytics = async (req, res) => {
  const { clubId } = req.params;
  try {
    const rsvpStats = await pool.query(
      "SELECT event_id, COUNT(*) as rsvp_count FROM rsvps WHERE club_id = $1 GROUP BY event_id",
      [clubId]
    );

    const viewStats = await pool.query(
      "SELECT event_id, COUNT(*) as views FROM event_views WHERE club_id = $1 GROUP BY event_id",
      [clubId]
    );

    const feedbackStats = await pool.query(
      "SELECT event_id, AVG(rating) as avg_rating FROM event_feedbacks WHERE club_id = $1 GROUP BY event_id",
      [clubId]
    );

    res.json({
      rsvp: rsvpStats.rows,
      views: viewStats.rows,
      feedbacks: feedbackStats.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📊 Event RSVPs and views
exports.getEventPerformance = async (req, res) => {
  const { clubId } = req.params;
  try {
    const result = await pool.query(`
      SELECT e.id AS event_id, e.title AS event_name,
             COUNT(DISTINCT r.user_id) AS rsvp_count,
             COUNT(DISTINCT v.id) AS view_count
      FROM events e
      LEFT JOIN rsvps r ON r.event_id = e.id
      LEFT JOIN event_views v ON v.event_id = e.id
      WHERE e.club_id = $1
      GROUP BY e.id
    `, [clubId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Event performance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 📈 Engagement trend (views over time)
exports.getEngagementTrends = async (req, res) => {
  const { clubId } = req.params;
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(date_trunc('month', v.viewed_at), 'YYYY-MM') AS month,
             COUNT(*) AS views
      FROM event_views v
      JOIN events e ON e.id = v.event_id
      WHERE e.club_id = $1
      GROUP BY month
      ORDER BY month
    `, [clubId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Engagement trend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 📈 Subscriber growth over months
exports.getSubscriberGrowth = async (req, res) => {
  const { clubId } = req.params;
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(date_trunc('month', subscribed_at), 'YYYY-MM') AS month,
             COUNT(*) AS new_subscribers
      FROM club_subscriptions
      WHERE club_id = $1
      GROUP BY month
      ORDER BY month
    `, [clubId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Subscriber growth error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 📊 Feedback Pie
exports.getFeedbackPie = async (req, res) => {
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
    console.error('Feedback pie error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 📈 Certificate Issuance
exports.getCertificateIssuance = async (req, res) => {
  const { clubId } = req.params;
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(issued_on, 'YYYY-MM') AS month,
             COUNT(*) AS count
      FROM certificates c
      JOIN events e ON e.id = c.event_id
      WHERE e.club_id = $1
      GROUP BY month
      ORDER BY month
    `, [clubId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Certificate issuance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
