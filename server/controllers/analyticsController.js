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

// GET /clubs/:clubId/dashboard/analytics
exports.getFullClubAnalytics = async (req, res) => {
  const { clubId } = req.params;

  try {
    // 1. RSVP Trends (Area Chart)
    const rsvpTrendsQuery = await pool.query(`
      SELECT TO_CHAR(r.rsvp_time::date, 'YYYY-MM-DD') AS date, COUNT(*) AS count
      FROM rsvps r
      JOIN events e ON e.id = r.event_id
      WHERE e.club_id = $1
      GROUP BY date
      ORDER BY date ASC
    `, [clubId]);

    const rsvp_trends = rsvpTrendsQuery.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count),
    }));

    // 2. Feedback Pie (Pie Chart)
    const feedbackPieQuery = await pool.query(`
      SELECT f.rating, COUNT(*) AS count
      FROM event_feedbacks f
      JOIN events e ON e.id = f.event_id
      WHERE e.club_id = $1
      GROUP BY f.rating
      ORDER BY f.rating
    `, [clubId]);

    const feedback_pie = feedbackPieQuery.rows.map(row => ({
      rating: parseInt(row.rating),
      count: parseInt(row.count),
    }));

    // 3. Subscriber Growth (Line Chart)
    const subscriberGrowthQuery = await pool.query(`
      SELECT TO_CHAR(subscribed_at, 'YYYY-MM') AS month, COUNT(*) AS count
      FROM club_subscriptions
      WHERE club_id = $1
      GROUP BY month
      ORDER BY month ASC
    `, [clubId]);

    const subscriber_growth = subscriberGrowthQuery.rows.map(row => ({
      month: row.month,
      count: parseInt(row.count),
    }));

    // 4. Key Metrics Summary
    const metricsQuery = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM events WHERE club_id = $1) AS total_events,
        (SELECT COUNT(*) FROM rsvps r JOIN events e ON e.id = r.event_id WHERE e.club_id = $1) AS total_rsvps,
        (SELECT COUNT(*) FROM certificates c JOIN events e ON e.id = c.event_id WHERE e.club_id = $1) AS total_certificates,
        (SELECT COUNT(*) FROM club_subscriptions WHERE club_id = $1) AS total_subscribers
    `, [clubId]);

    const {
      total_events,
      total_rsvps,
      total_certificates,
      total_subscribers
    } = metricsQuery.rows[0];

    // 5. Performance Summary

    // 5a. Completed Events
    const completedEventsQuery = await pool.query(`
      SELECT COUNT(*) FROM events
      WHERE club_id = $1 AND status = 'Completed'
    `, [clubId]);
    const completed_events = parseInt(completedEventsQuery.rows[0].count);

    // 5b. Upcoming Events
    const upcomingEventsQuery = await pool.query(`
      SELECT COUNT(*) FROM events
      WHERE club_id = $1 AND status = 'Published' AND event_date > NOW()
    `, [clubId]);
    const upcoming_events = parseInt(upcomingEventsQuery.rows[0].count);

    // 5c. Average Rating
    const avgRatingQuery = await pool.query(`
      SELECT AVG(f.rating) AS avg_rating
      FROM event_feedbacks f
      JOIN events e ON e.id = f.event_id
      WHERE e.club_id = $1
    `, [clubId]);
    const avg_rating = parseFloat(avgRatingQuery.rows[0].avg_rating || 0).toFixed(1);

    // Final response
    res.status(200).json({
      rsvp_trends,
      feedback_pie,
      subscriber_growth,
      total_events: parseInt(total_events),
      total_rsvps: parseInt(total_rsvps),
      total_certificates: parseInt(total_certificates),
      total_subscribers: parseInt(total_subscribers),
      completed_events,
      upcoming_events,
      avg_rating: Number(avg_rating)
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
