/**
 * Centralised Socket.IO broadcast helpers.
 *
 * Every real-time emit in the application goes through this module. It exists
 * because the previous approach — calling `io.to(...)` inline from whichever
 * controller happened to need it — produced three classes of bug that were
 * individually small and collectively fatal to the live features:
 *
 *   1. Room-name drift. Controllers built room strings by hand, so a listener
 *      joined `club_<id>` while the emitter targeted `event_<id>` and the
 *      message went nowhere.
 *   2. Payload type drift. One code path took the id from `req.body` (number)
 *      and another from `req.params` (string). Clients comparing with `===`
 *      matched the first and silently ignored the second.
 *   3. Missing emits. Client listeners were written for events (`new_feedback`,
 *      `new_subscription`) that no server code ever emitted.
 *
 * Rules enforced here:
 *   - Room names are built ONLY by the `rooms` helpers below.
 *   - Numeric ids are coerced with Number() before they go on the wire, so a
 *     given id always has the same JS type regardless of its request source.
 *   - UUID ids stay strings, coerced with String() for the same reason.
 *   - A missing `io` instance is a no-op, never a crash — a broken socket
 *     layer must not take down an otherwise successful HTTP request.
 */

const rooms = {
  user: (userId) => `user_${String(userId)}`,
  club: (clubId) => `club_${String(clubId)}`,
  event: (eventId) => `event_${Number(eventId)}`,
};

/**
 * Pull the Socket.IO server off the Express app. Returns null when the socket
 * layer is unavailable so callers can stay ignorant of the failure mode.
 */
function getIo(req) {
  const io = req?.app?.get('socketio');
  if (!io) {
    console.warn('[realtime] Socket.IO instance unavailable — skipping broadcast');
    return null;
  }
  return io;
}

/**
 * Seat-count change on an event.
 *
 * Emitted to two audiences:
 *   - `event_<id>`: students viewing/subscribed to that event, who use the
 *     count to render the live seat counter.
 *   - `club_<id>`: the owning club's dashboard, which refreshes its analytics.
 *     Without this second target the club dashboard's `rsvp_update` listener
 *     was dead code, because a club account only ever joins its own club room.
 */
function broadcastRsvpUpdate(req, { eventId, clubId, currentCount, maxCapacity }) {
  const io = getIo(req);
  if (!io) return;

  const payload = {
    eventId: Number(eventId),
    clubId: clubId == null ? null : String(clubId),
    currentCount: Number(currentCount),
    maxCapacity: maxCapacity == null ? null : Number(maxCapacity),
  };

  io.to(rooms.event(eventId)).emit('rsvp_update', payload);
  if (clubId != null) {
    io.to(rooms.club(clubId)).emit('rsvp_update', payload);
  }
}

/**
 * A student subscribed to (followed) a club. Drives the club dashboard's
 * live subscriber counter and its toast notification.
 */
function broadcastNewSubscription(req, { clubId, userId, userName }) {
  const io = getIo(req);
  if (!io) return;

  io.to(rooms.club(clubId)).emit('new_subscription', {
    clubId: String(clubId),
    userId: String(userId),
    // The client renders `data.user_name`; keep that key stable.
    user_name: userName || 'A student',
    at: new Date().toISOString(),
  });
}

/**
 * A student unsubscribed from a club. The dashboard listens so its counter can
 * fall as well as rise — previously it only ever went up until a manual reload.
 */
function broadcastSubscriptionRemoved(req, { clubId, userId }) {
  const io = getIo(req);
  if (!io) return;

  io.to(rooms.club(clubId)).emit('subscription_removed', {
    clubId: String(clubId),
    userId: String(userId),
    at: new Date().toISOString(),
  });
}

/**
 * A student left feedback on an event.
 */
function broadcastNewFeedback(req, { clubId, eventId, eventTitle, rating }) {
  const io = getIo(req);
  if (!io) return;

  io.to(rooms.club(clubId)).emit('new_feedback', {
    clubId: String(clubId),
    eventId: Number(eventId),
    // The client renders `data.event_title`; keep that key stable.
    event_title: eventTitle || 'an event',
    rating: rating == null ? null : Number(rating),
    at: new Date().toISOString(),
  });
}

/**
 * Push a notification to a single student's personal firehose.
 */
function sendUserNotification(req, userId, notification) {
  const io = getIo(req);
  if (!io) return;

  io.to(rooms.user(userId)).emit('new_notification', notification);
}

module.exports = {
  rooms,
  broadcastRsvpUpdate,
  broadcastNewSubscription,
  broadcastSubscriptionRemoved,
  broadcastNewFeedback,
  sendUserNotification,
};
