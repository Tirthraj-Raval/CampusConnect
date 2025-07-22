const express = require("express");
const router = express.Router();
const {
  getCommitteeMembers,
  addCommitteeMember,
  removeCommitteeMember,
  updateCommitteeMember,
  searchStudentInUniversity
} = require("../controllers/committeeController");

router.get("/:clubId/committee", getCommitteeMembers);
router.post("/:clubId/committee", addCommitteeMember);
router.put("/:clubId/committee/:userId", updateCommitteeMember);
router.delete("/:clubId/committee/:userId", removeCommitteeMember);
router.post('/:clubId/search', searchStudentInUniversity);

module.exports = router;
