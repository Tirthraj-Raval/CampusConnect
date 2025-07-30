const db = require('../../utils/db');

exports.getStudentCertificates = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(`
      SELECT 
        certificates.*, 
        events.title AS event_title,
        clubs.name AS club_name,
        universities.name AS university_name
      FROM certificates
      JOIN events ON certificates.event_id = events.id
      JOIN clubs ON events.club_id = clubs.id
      JOIN universities ON clubs.university_id = universities.id
      WHERE certificates.user_id = $1
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching certificates:", err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};
