const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

let routeUsed = false; // In-memory flag (or you can use DB check instead)

router.post('/create-secret-superadmin', async (req, res) => {
  if (routeUsed) return res.status(403).json({ error: 'This route is disabled' });

  const { name, email, profile_pic } = req.body;

  if (!email || !name) return res.status(400).json({ error: 'Missing fields' });

  try {
    // Check if already exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const insert = await pool.query(
      `INSERT INTO users (id, name, email, profile_pic, role)
       VALUES (gen_random_uuid(), $1, $2, $3, 'superadmin') RETURNING *`,
      [name, email, profile_pic || null]
    );

    routeUsed = true; // Disable future usage
    return res.status(201).json({ message: 'Superadmin created successfully', user: insert.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create superadmin' });
  }
});

module.exports = router;
