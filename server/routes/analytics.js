const express = require("express");
const router = express.Router();
const {getClubAnalytics, getEventPerformance, getEngagementTrends, getSubscriberGrowth, getFeedbackPie, getCertificateIssuance} = require("../controllers/analyticsController");

router.get("/:clubId/dashboard/analytics", getClubAnalytics);
router.get('/:clubId/event-performance', getEventPerformance);
router.get('/:clubId/engagement-trends', getEngagementTrends);
router.get('/:clubId/subscriber-growth', getSubscriberGrowth);
router.get('/:clubId/feedback-pie', getFeedbackPie);
router.get('/:clubId/certificate-issuance', getCertificateIssuance);


module.exports = router;
