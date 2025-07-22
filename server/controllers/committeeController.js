const pool = require("../utils/db");

exports.getCommitteeMembers = async (req, res) => {
  const { clubId } = req.params;
  try {
    const result = await pool.query(
      "SELECT u.id, u.name, c.role, c.joined_at FROM users u JOIN club_committee_members c ON u.id = c.user_id WHERE c.club_id = $1",
      [clubId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addCommitteeMember = async (req, res) => {
  const { clubId } = req.params;
  const { userId, role } = req.body;
  try {
    await pool.query(
      "INSERT INTO club_committee_members (club_id, user_id, role) VALUES ($1, $2, $3)",
      [clubId, userId, role]
    );
    res.status(201).json({ message: "Member added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeCommitteeMember = async (req, res) => {
  const { clubId, userId } = req.params;
  try {
    await pool.query(
      "DELETE FROM club_committee_members WHERE club_id = $1 AND user_id = $2",
      [clubId, userId]
    );
    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCommitteeMember = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  console.log("Updating committee member role:", userId, "to", role);
  try {
    await pool.query(
      `UPDATE club_committee_members SET role = $1 WHERE user_id = $2`,
      [role, userId]
    );
    res.json({ message: "Position updated." });
  } catch(err) {
    console.error('Error updating committee member:', err);
    res.status(500).json({ error: "Update failed." });
  }
};

exports.searchStudentInUniversity = async (req, res) => {
  const { clubId } = req.params;
  const { query } = req.body;

  try {
    const university = await pool.query(
      `SELECT university_id FROM clubs WHERE id = $1`,
      [clubId]
    );

    const universityId = university.rows[0]?.university_id;
    if (!universityId) return res.status(404).json({ error: 'Club or university not found' });

    const result = await pool.query(
      `SELECT id, name, email FROM students
       WHERE university_id = $1 AND (name ILIKE $2 OR email ILIKE $2)`,
      [universityId, `%${query}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Committee search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
