const express = require("express");
const router = express.Router();
const {getClubAnalytics, getEventPerformance, getEngagementTrends, getSubscriberGrowth, getFeedbackPie, getCertificateIssuance, getRSVPTrends} = require("../controllers/analyticsController");

router.get("/:clubId/dashboard/analytics", getClubAnalytics);
router.get('/:clubId/event-performance', getEventPerformance);
router.get('/:clubId/engagement-trends', getEngagementTrends);
router.get('/:clubId/subscriber-growth', getSubscriberGrowth);
router.get('/:clubId/feedback-pie', getFeedbackPie);
router.get('/:clubId/certificate-issuance', getCertificateIssuance);
router.get('/:clubId/rsvp-trends', getRSVPTrends); // Reusing engagement trends for RSVP trends

module.exports = router;
