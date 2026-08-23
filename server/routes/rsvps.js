const express = require('express');
const router = express.Router();
const {getActiveEventRSVPs, downloadAllRSVPs, downloadRSVPsByEvent} = require('../controllers/rsvpController');
const verifyClubAccess = require('../middlewares/verifyClubAccess');

// These endpoints return, and export as CSV, the attendee roster including
// student email addresses. They were fully unauthenticated: knowing a club UUID
// was enough to download every registrant's contact details.
router.get('/:clubId/rsvps', verifyClubAccess, getActiveEventRSVPs);
router.get('/:clubId/:eventId/download', verifyClubAccess, downloadRSVPsByEvent);
router.get('/:clubId/rsvps/download/all', verifyClubAccess, downloadAllRSVPs);

module.exports = router;
