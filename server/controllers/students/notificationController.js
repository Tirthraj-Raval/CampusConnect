const db = require("../../utils/db");

// controllers/studentController.js

exports.getStudentNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notificationsQuery = `
      SELECT sn.id, sn.message, sn.notify_at, sn.sent,
             e.id AS event_id, e.title AS event_title, e.poster_url,
             c.id AS club_id, c.name AS club_name
      FROM scheduled_notifications sn
      LEFT JOIN events e ON e.id = sn.event_id
      LEFT JOIN clubs c ON c.id = sn.club_id
      WHERE sn.user_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM notification_reads nr
          WHERE nr.notification_id = sn.id AND nr.user_id = $1
        )
      ORDER BY sn.notify_at DESC
    `;

    const { rows } = await db.query(notificationsQuery, [userId]);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching student notifications:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// Marks a notification as read by inserting into notification_reads
exports.markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id; // From JWT
  const { clubId } = req.body;

  try {
    await db.query(`
      INSERT INTO notification_reads (notification_id, user_id, club_id)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [notificationId, userId, clubId]);

    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error("Error marking read:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Unread Notifications
exports.getUnreadNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await db.query(`
      SELECT sn.*
      FROM scheduled_notifications sn
      WHERE sn.user_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM notification_reads nr
          WHERE nr.notification_id = sn.id AND nr.user_id = $1
        )
      ORDER BY notify_at DESC
    `, [userId]);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching unread notifications:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Activity Status
exports.getActivityStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await db.query(`
      SELECT read_at
      FROM notification_reads
      WHERE user_id = $1
      ORDER BY read_at DESC
      LIMIT 10
    `, [userId]);

    const isActive = rows.length > 0 && new Date(rows[0].read_at) >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // Active if last read was within 7 days

    res.status(200).json({ active: isActive });
  } catch (err) {
    console.error("Error checking activity:", err);
    res.status(500).json({ error: err.message });
  }
};
