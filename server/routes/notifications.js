const express = require("express");
const router = express.Router();
const {
  scheduleNotification,
  getScheduledNotifications,
} = require("../controllers/notificationsController");

router.post("/:clubId/notifications", scheduleNotification);
router.get("/:clubId/notifications", getScheduledNotifications);

module.exports = router;
