const db = require('../../utils/db');

exports.getStudentCertificates = async (req, res) => {
  const userId = req.user.id;

  try {
    // LEFT JOINs throughout, deliberately.
    //
    // 02_referential_integrity.sql sets certificates.event_id to NULL when an
    // event is deleted, so that a certificate a student earned outlives the
    // event it was issued for. With the original INNER JOINs, such a
    // certificate would silently vanish from the student's list — the row still
    // exists but the join drops it. The same applied to a certificate whose
    // club had been deleted.
    //
    // COALESCE keeps the UI readable in that case rather than rendering "null".
    const result = await db.query(`
      SELECT
        certificates.*,
        COALESCE(events.title, 'Event no longer listed')   AS event_title,
        COALESCE(clubs.name, 'Club no longer listed')      AS club_name,
        universities.name                                   AS university_name
      FROM certificates
      LEFT JOIN events       ON certificates.event_id = events.id
      LEFT JOIN clubs        ON clubs.id = COALESCE(events.club_id, certificates.club_id)
      LEFT JOIN universities ON clubs.university_id = universities.id
      WHERE certificates.user_id = $1
      ORDER BY certificates.generated_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching certificates:", err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};
