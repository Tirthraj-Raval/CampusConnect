const express = require("express");
const router = express.Router();
const {
  getCommitteeMembers,
  addCommitteeMember,
  removeCommitteeMember,
  updateCommitteeMember,
  searchStudentInUniversity
} = require("../controllers/committeeController");

const verifyClubAccess = require('../middlewares/verifyClubAccess');

// The mutating routes here were completely open: any caller could appoint or
// remove committee members on any club. `/search` returns student directory
// records, so it is gated too.
router.get("/:clubId/committee", verifyClubAccess, getCommitteeMembers);
router.post("/:clubId/committee", verifyClubAccess, addCommitteeMember);
router.put("/:clubId/committee/:userId", verifyClubAccess, updateCommitteeMember);
router.delete("/:clubId/committee/:userId", verifyClubAccess, removeCommitteeMember);
router.post('/:clubId/search', verifyClubAccess, searchStudentInUniversity);

module.exports = router;
