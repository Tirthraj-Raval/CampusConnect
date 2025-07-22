const express = require("express");
const router = express.Router();
const { issueCertificates, getCertificates, getCertificateThroughId } = require("../controllers/certificatesController");

router.get("/:clubId/certificates", getCertificates);
router.post("/:clubId/certificates/generate", issueCertificates);
router.get('/:clubId/certificates/:certificateId', getCertificateThroughId);

module.exports = router;
