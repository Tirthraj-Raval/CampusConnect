const { parseCSV } = require("../utils/csvParser");
const pool = require("../utils/db");
const fs = require("fs");
const path = require("path");

exports.getFeedbacks = async (req, res) => {
  const { clubId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM event_feedbacks WHERE club_id = $1 ORDER BY submitted_at DESC",
      [clubId]
    );
    res.json(result.rows);
  } catch (err) {
    console.log('Error fetching feedbacks:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getFeedbackStats = async (req, res) => {
  const { clubId } = req.params;

  try {
    const result = await pool.query(`
      SELECT rating, COUNT(*) AS count
      FROM event_feedbacks f
      JOIN events e ON e.id = f.event_id
      WHERE e.club_id = $1
      GROUP BY rating
      ORDER BY rating DESC
    `, [clubId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Feedback stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.exportClubFeedbacks = async (req, res) => {
  const { clubId } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.name, u.email, f.rating, f.comment, f.submitted_at
       FROM event_feedbacks f
       INNER JOIN users u ON u.id = f.user_id
       WHERE f.club_id = $1`,
      [clubId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No feedbacks found for this club' });
    }

    // CSV Headers
    const headers = ['Name', 'Email', 'Rating', 'Comment', 'Submitted At'];
    const filePath = path.join(__dirname, '../../exports', `feedbacks_club_${clubId}.csv`);

    // Ensure exports folder exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Write CSV content manually
    const csvLines = [headers.join(',')]; // header row

    for (const row of result.rows) {
      const line = [
        `"${row.name}"`,
        `"${row.email}"`,
        row.rating,
        `"${row.comment?.replace(/"/g, '""') || ''}"`, // escape quotes
        row.submitted_at.toISOString()
      ].join(',');
      csvLines.push(line);
    }

    fs.writeFileSync(filePath, csvLines.join('\n'), 'utf8');

    res.download(filePath, `feedbacks_club_${clubId}.csv`, (err) => {
      if (err) {
        console.error('Error sending CSV:', err);
        res.status(500).json({ error: 'Failed to export feedbacks' });
      } else {
        fs.unlink(filePath, () => {}); // delete after sending
      }
    });

  } catch (error) {
    console.error('Error exporting feedbacks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};