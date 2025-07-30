const express = require("express");
const router = express.Router();
const { getFeedbacks, getFeedbackStats, exportClubFeedbacks } = require("../controllers/feedbackController");

router.get("/:clubId/feedbacks", getFeedbacks);
router.get('/:clubId/stats', getFeedbackStats);
router.get('/:clubId/feedbacks/exports', exportClubFeedbacks);

module.exports = router;
