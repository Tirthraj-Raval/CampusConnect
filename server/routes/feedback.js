const express = require("express");
const router = express.Router();
const { getFeedbacks, getFeedbackStats } = require("../controllers/feedbackController");

router.get("/:clubId/feedbacks", getFeedbacks);
router.get('/:clubId/stats', getFeedbackStats);

module.exports = router;
