const db = require('../../utils/db');
const {
  broadcastNewSubscription,
  broadcastSubscriptionRemoved,
} = require('../../utils/realtime');

exports.subscribeClub = async (req, res) => {
  const studentId = req.user.id;
  // The route is declared as POST /subscriptions/:club_id, but this handler
  // previously read the id from the body only. It worked purely because the
  // client happens to send it in both places — any caller that followed the
  // route signature alone got a silent failure. Accept either, preferring the
  // path parameter since that is what the route advertises.
  const club_id = req.params.club_id || req.body?.club_id;

  if (!club_id) {
    return res.status(400).json({ message: 'club_id is required' });
  }

  try {
    // club_subscriptions now carries UNIQUE(user_id, club_id) from the hotfix
    // migration. Previously this INSERT had no conflict handling and no
    // try/catch at all, so a double-click raised an unhandled unique violation
    // and rejected the request promise.
    const result = await db.query(
      `INSERT INTO club_subscriptions (user_id, club_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, club_id) DO NOTHING`,
      [studentId, club_id]
    );

    // Only announce genuinely new subscriptions, so a repeated click does not
    // spam the club dashboard with duplicate toasts.
    if (result.rowCount > 0) {
      broadcastNewSubscription(req, {
        clubId: club_id,
        userId: studentId,
        userName: req.user.name,
      });
    }

    res.json({ message: 'Subscribed' });
  } catch (error) {
    console.error('Error subscribing to club:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.unsubscribeClub = async (req, res) => {
  const userId = req.user.id;
  const clubId = req.params.clubId;

  try {
    const result = await db.query(
      'DELETE FROM club_subscriptions WHERE user_id = $1 AND club_id = $2',
      [userId, clubId]
    );

    if (result.rowCount > 0) {
      broadcastSubscriptionRemoved(req, { clubId, userId });
    }

    res.json({ message: 'Unsubscribed' });
  } catch (error) {
    console.error('Error unsubscribing from club:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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
