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
