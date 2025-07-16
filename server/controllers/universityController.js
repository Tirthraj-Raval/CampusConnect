const pool = require('../utils/db');
const { parseCSV } = require('../utils/csvParser');
const path = require('path');

// ✅ Create new university
exports.createUniversity = async (req, res) => {
  const { name, domain, description, logo_url } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO universities (name, domain, description, logo_url)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `, [name, domain, description, logo_url]);

    return res.status(201).json({ university: result.rows[0] });
  } catch (err) {
    console.error('University creation failed:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

// ✅ Upload Students CSV
exports.uploadStudents = async (req, res) => {
  const universityId = req.params.id;

  if (!req.file) return res.status(400).json({ error: 'CSV file required' });

  try {
    const students = await parseCSV(req.file.path);
    for (const student of students) {
      const { name, email } = student;
      await pool.query(`
        INSERT INTO users (id, name, email, role, university_id)
        VALUES (gen_random_uuid(), $1, $2, 'student', $3)
        ON CONFLICT (email) DO NOTHING;
      `, [name, email, universityId]);
    }

    return res.status(200).json({ message: 'Students uploaded successfully' });
  } catch (err) {
    console.error('CSV Upload Error:', err);
    return res.status(500).json({ error: 'Failed to upload students' });
  }
};

// ✅ Upload Clubs CSV
exports.uploadClubs = async (req, res) => {
  const universityId = req.params.id;

  if (!req.file) return res.status(400).json({ error: 'CSV file required' });

  try {
    const clubs = await parseCSV(req.file.path);
    for (const club of clubs) {
      const { name, description, logo_url, secretary_email } = club;

      // Find secretary user ID
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [secretary_email]);
      const secretaryId = userRes.rows[0]?.id;

      await pool.query(`
        INSERT INTO clubs (name, description, logo_url, university_id, secretary_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name, university_id) DO NOTHING;
      `, [name, description, logo_url, universityId, secretaryId]);
    }

    return res.status(200).json({ message: 'Clubs uploaded successfully' });
  } catch (err) {
    console.error('Clubs upload error:', err);
    return res.status(500).json({ error: 'Failed to upload clubs' });
  }
};
