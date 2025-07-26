const db = require('../../utils/db');

exports.getStudentProfile = async (req, res) => {
  const userId = req.user.id;
  const result = await db.query('SELECT id, name, email, profile_pic, university_id FROM users WHERE id = $1', [userId]);
  res.json(result.rows[0]);
};

exports.updateStudentProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, profile_pic } = req.body;
  await db.query('UPDATE users SET name = $1, profile_pic = $2 WHERE id = $3', [name, profile_pic, userId]);
  res.json({ message: 'Profile updated' });
};

exports.deleteStudentAccount = async (req, res) => {
  const userId = req.user.id;
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
  res.json({ message: 'Account deleted' });
};

//Global Search
exports.globalSearch = async (req, res) => {
  const { query, type = 'all' } = req.query;
  const userId = req.user.id;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  try {
    // Get current user's university
    const universityQuery = `SELECT university_id FROM users WHERE id = $1`;
    const uniRes = await db.query(universityQuery, [userId]);
    const universityId = uniRes.rows[0]?.university_id;

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    const results = {};

    // 1. Search clubs
    if (type === 'all' || type === 'clubs') {
      const clubsQuery = `
        SELECT id, name, logo_url, description
        FROM clubs
        WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1
        LIMIT 10
      `;
      const clubsRes = await db.query(clubsQuery, [searchTerm]);
      results.clubs = clubsRes.rows;
    }

    // 2. Search students from same university
    if (type === 'all' || type === 'students') {
      const studentsQuery = `
        SELECT id, name, email
        FROM users
        WHERE university_id = $1 AND (LOWER(name) LIKE $2 OR LOWER(email) LIKE $2)
        LIMIT 10
      `;
      const studentsRes = await db.query(studentsQuery, [universityId, searchTerm]);
      results.students = studentsRes.rows;
    }

    // 3. Search events
    if (type === 'all' || type === 'events') {
      const eventsQuery = `
        SELECT e.id, e.title, e.description, e.event_date, e.location, c.name AS club_name
        FROM events e
        JOIN clubs c ON c.id = e.club_id
        WHERE LOWER(e.title) LIKE $1 OR LOWER(e.description) LIKE $1
        ORDER BY e.event_date DESC
        LIMIT 10
      `;
      const eventsRes = await db.query(eventsQuery, [searchTerm]);
      results.events = eventsRes.rows;
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

