const db = require('../../utils/db');

exports.getStudentCertificates = async (req, res) => {
  const userId = req.user.id;
  const result = await db.query(`
    SELECT certificates.*, events.title AS event_title
    FROM certificates
    JOIN events ON certificates.event_id = events.id
    WHERE certificates.user_id = $1
  `, [userId]);
  res.json(result.rows);
};
