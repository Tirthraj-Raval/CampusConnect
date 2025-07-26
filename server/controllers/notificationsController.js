const pool = require("../utils/db");


exports.scheduleNotification = async (req, res) => {
  const { clubId } = req.params;
  const { eventId, userId, notifyAt } = req.body;
  try {
    await pool.query(
      "INSERT INTO scheduled_notifications (club_id, event_id, user_id, notify_at, sent) VALUES ($1, $2, $3, $4, false)",
      [clubId, eventId, userId, notifyAt]
    );
    res.status(201).json({ message: "Notification scheduled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getScheduledNotifications = async (req, res) => {
  const { clubId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM scheduled_notifications WHERE club_id = $1",
      [clubId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Emits to all connected subscribers via socket
exports.sendNotificationNow = async (req, res) => {
  const { clubId } = req.params;
  const { eventId, message } = req.body;
  const io = req.app.get('socketio');

  try {
    const { rows: subscribers } = await pool.query(
      `SELECT user_id FROM club_subscriptions WHERE club_id = $1`,
      [clubId]
    );
    
    const notifyAt = new Date();

    for (const subscriber of subscribers) {
      await pool.query(
        `INSERT INTO scheduled_notifications (event_id, user_id, notify_at, sent, club_id, message)
         VALUES ($1, $2, $3, true, $4, $5)`,
        [eventId, subscriber.user_id, notifyAt, clubId, message]
      );

      // Send real-time notification
      io.to(`user_${subscriber.user_id}`).emit("new_notification", {
        eventId,
        clubId,
        notifyAt,
        message,
      });
    }
    console.log(`Sent notification for event ${eventId} in club ${clubId} to ${subscribers.length} subscribers`);
    return res.status(200).json({ message: "Notifications sent successfully" });
  } catch (err) {
    console.error("Error sending notification:", err);
    return res.status(500).json({ error: err.message });
  }
};
