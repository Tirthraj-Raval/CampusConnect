const express = require("express");
const router = express.Router();
const verifyClubAccess = require("../middlewares/verifyClubAccess");
const {
  scheduleNotification,
  getScheduledNotifications,
  sendNotificationNow,
} = require("../controllers/notificationsController");

router.post("/:clubId/notifications", scheduleNotification);
router.get("/:clubId/notifications", getScheduledNotifications);
router.post(
  "/:clubId/events/:eventId/notify",
  sendNotificationNow
);

module.exports = router;
