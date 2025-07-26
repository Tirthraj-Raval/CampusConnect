const db = require('../../utils/db');

exports.subscribeClub = async (req, res) => {
  const studentId = req.user.id;
  const { club_id } = req.body;
  await db.query('INSERT INTO club_subscriptions (user_id, club_id) VALUES ($1, $2)', [studentId, club_id]);
  res.json({ message: 'Subscribed' });
};

exports.unsubscribeClub = async (req, res) => {
  const userId = req.user.id;
  const clubId = req.params.clubId;
  await db.query('DELETE FROM club_subscriptions WHERE user_id = $1 AND club_id = $2', [userId, clubId]);
  res.json({ message: 'Unsubscribed' });
};

exports.getSubscriptions = async (req, res) => {
  const userId = req.user.id;
  const result = await db.query(`
    SELECT clubs.* FROM clubs
    JOIN club_subscriptions ON clubs.id = club_subscriptions.club_id
    WHERE club_subscriptions.user_id = $1
  `, [userId]);
  res.json(result.rows);
};

// controller: controllers/clubController.js

exports.getSubscribedClubEvents = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT e.*, c.name AS club_name
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       WHERE e.status = 'Published'
         AND e.club_id IN (
           SELECT club_id
           FROM club_subscriptions
           WHERE user_id = $1
         )
       ORDER BY e.event_date DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching subscribed club events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
