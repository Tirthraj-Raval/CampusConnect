const express = require("express");
const router = express.Router();
const { issueCertificates, getCertificates, getCertificateThroughId } = require("../controllers/certificatesController");
const verifyClubAccess = require('../middlewares/verifyClubAccess');

// Club-side certificate administration. `/generate` issues certificates in the
// club's name, so leaving it open allowed anyone to mint credentials for any
// club. Students read their own certificates through /api/student/certificates,
// not these routes, so gating them does not affect the student flow.
//
// NOTE: public, unauthenticated certificate verification is deliberately NOT
// part of this router — that arrives later as its own /verify/:code endpoint
// backed by a dedicated verification code rather than an internal row id.
router.get("/:clubId/certificates", verifyClubAccess, getCertificates);
router.post("/:clubId/certificates/generate", verifyClubAccess, issueCertificates);
router.get('/:clubId/certificates/:certificateId', verifyClubAccess, getCertificateThroughId);

module.exports = router;
