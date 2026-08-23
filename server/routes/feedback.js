const express = require("express");
const router = express.Router();
const { getFeedbacks, getFeedbackStats, exportClubFeedbacks } = require("../controllers/feedbackController");
const verifyClubAccess = require('../middlewares/verifyClubAccess');

// Feedback is submitted with an attributable user_id and read back here, so
// these routes expose who said what about a club's events. Previously open.
router.get("/:clubId/feedbacks", verifyClubAccess, getFeedbacks);
router.get('/:clubId/stats', verifyClubAccess, getFeedbackStats);
router.get('/:clubId/feedbacks/exports', verifyClubAccess, exportClubFeedbacks);

module.exports = router;
