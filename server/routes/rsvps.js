const express = require('express');
const router = express.Router();
const {getActiveEventRSVPs, downloadAllRSVPs, downloadRSVPsByEvent} = require('../controllers/rsvpController');

router.get('/:clubId/rsvps', getActiveEventRSVPs);
router.get('/:clubId/:eventId/download', downloadRSVPsByEvent);
router.get('/:clubId/rsvps/download/all', downloadAllRSVPs);

module.exports = router;
