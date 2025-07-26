const pool = require("../utils/db");

exports.getClubAnalytics = async (req, res) => {
  const { clubId } = req.params;

  try {
    // Step 1: Get all published events of the club
    const eventsRes = await pool.query(
      `SELECT id AS event_id, title FROM events WHERE club_id = $1 AND status = 'Published'`,
      [clubId]
    );
    const events = eventsRes.rows;

    // Step 2: RSVP counts per event
    const rsvpRes = await pool.query(
      `SELECT event_id, COUNT(*) AS rsvp_count FROM rsvps GROUP BY event_id`
    );
    const rsvpMap = Object.fromEntries(rsvpRes.rows.map(row => [row.event_id, Number(row.rsvp_count)]));

    // Step 3: View counts per event
    const viewsRes = await pool.query(
      `SELECT event_id, COUNT(*) AS views FROM event_views GROUP BY event_id`
    );
    const viewMap = Object.fromEntries(viewsRes.rows.map(row => [row.event_id, Number(row.views)]));

    // Step 4: Merge
    const analytics = events.map(event => ({
      title: event.title,
      rsvps: rsvpMap[event.event_id] || 0,
      views: viewMap[event.event_id] || 0
    }));

    res.json(analytics);
  } catch (err) {
    console.error('Error fetching club analytics:', err);
    res.status(500).json({ error: 'Server error' });
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

// 📈 RSVP Trends Front page
exports.getRSVPTrends = async (req, res) => {
  const { clubId } = req.params;

  try {
    const result = await pool.query(
      `SELECT DATE(rsvp_time) AS date, COUNT(*) AS count
       FROM rsvps r
       JOIN events e ON e.id = r.event_id
       WHERE e.club_id = $1
       GROUP BY DATE(rsvp_time)
       ORDER BY DATE(rsvp_time) ASC`,
      [clubId]
    );

    res.json(result.rows); // [{ date: '2025-07-22', count: '5' }, ...]
  } catch (err) {
    console.error('RSVP Trends Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
