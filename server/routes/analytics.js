const express = require("express");
const router = express.Router();
const {getClubAnalytics, getFullClubAnalytics, getEventPerformance, getEngagementTrends, getSubscriberGrowth, getFeedbackPie, getCertificateIssuance, getRSVPTrends} = require("../controllers/analyticsController");
const verifyClubAccess = require('../middlewares/verifyClubAccess');

// Every route here is scoped to a single club's private analytics and was
// previously unauthenticated — any caller who knew a club's UUID could read its
// full engagement history. Only the owning club account may read these.
router.get("/:clubId/dashboard/analytics", verifyClubAccess, getFullClubAnalytics);
router.get('/:clubId/event-performance', verifyClubAccess, getEventPerformance);
router.get('/:clubId/engagement-trends', verifyClubAccess, getEngagementTrends);
router.get('/:clubId/subscriber-growth', verifyClubAccess, getSubscriberGrowth);
router.get('/:clubId/feedback-pie', verifyClubAccess, getFeedbackPie);
router.get('/:clubId/certificate-issuance', verifyClubAccess, getCertificateIssuance);
router.get('/:clubId/rsvp-trends', verifyClubAccess, getRSVPTrends); // Reusing engagement trends for RSVP trends

module.exports = router;
