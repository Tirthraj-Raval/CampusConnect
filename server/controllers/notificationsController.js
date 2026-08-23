const pool = require("../utils/db");
const { sendUserNotification } = require("../utils/realtime");


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

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'A message is required' });
  }

  // eventId is optional (a club may broadcast without tying it to an event),
  // but when present it must be a valid integer or the FK insert will fail.
  let normalisedEventId = null;
  if (eventId !== undefined && eventId !== null && eventId !== '') {
    normalisedEventId = Number(eventId);
    if (!Number.isInteger(normalisedEventId)) {
      return res.status(400).json({ error: 'eventId must be an integer when provided' });
    }
  }

  try {
    const { rows: subscribers } = await pool.query(
      `SELECT cs.user_id, u.name
         FROM club_subscriptions cs
         JOIN users u ON u.id = cs.user_id
        WHERE cs.club_id = $1
          AND u.is_active = true`,
      [clubId]
    );

    if (subscribers.length === 0) {
      return res.status(200).json({ message: 'No subscribers to notify', sent: 0 });
    }

    const notifyAt = new Date();
    const userIds = subscribers.map((s) => s.user_id);

    // Single bulk INSERT rather than one round trip per subscriber. The old
    // loop issued N sequential queries, so a club with 500 followers held the
    // request open for 500 round trips and partially completed on any failure.
    // UNNEST expands the id array into rows server-side.
    const { rows: inserted } = await pool.query(
      `INSERT INTO scheduled_notifications (event_id, user_id, notify_at, sent, club_id, message)
       SELECT $1, unnest($2::uuid[]), $3, true, $4, $5
       RETURNING id, user_id`,
      [normalisedEventId, userIds, notifyAt, clubId, message]
    );

    // Fan out over the persisted rows so each client receives the row id it
    // needs in order to mark the notification read.
    for (const row of inserted) {
      sendUserNotification(req, row.user_id, {
        id: row.id,
        eventId: normalisedEventId,
        clubId,
        notifyAt,
        message,
      });
    }

    console.log(
      `Sent notification for event ${normalisedEventId} in club ${clubId} to ${inserted.length} subscribers`
    );
    return res
      .status(200)
      .json({ message: 'Notifications sent successfully', sent: inserted.length });
  } catch (err) {
    console.error("Error sending notification:", err);
    return res.status(500).json({ error: err.message });
  }
};
