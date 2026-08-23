const express = require("express");
const router = express.Router();
const verifyClubAccess = require("../middlewares/verifyClubAccess");
const {
  scheduleNotification,
  getScheduledNotifications,
  sendNotificationNow,
} = require("../controllers/notificationsController");

// verifyClubAccess was already imported here but never actually applied, so
// every route below ran unauthenticated. `/notify` is the most serious of the
// three: it fans a message out to every subscriber of the club, which made it a
// ready-made spam and phishing vector for anyone who knew a club UUID.
router.post("/:clubId/notifications", verifyClubAccess, scheduleNotification);
router.get("/:clubId/notifications", verifyClubAccess, getScheduledNotifications);
router.post(
  "/:clubId/events/:eventId/notify",
  verifyClubAccess,
  sendNotificationNow
);

module.exports = router;
