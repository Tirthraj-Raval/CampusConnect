const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// One-time bootstrap for the very first superadmin account.
//
// This route previously guarded itself with an in-process `let routeUsed = false`
// flag. That flag lives only in the current Node process, so it reset on every
// restart — every nodemon reload in development and every redeploy in
// production. Combined with the absence of any authentication, that made this a
// standing privilege-escalation endpoint: anyone who could reach the API after a
// restart could grant themselves the superadmin role.
//
// It is now gated two ways, both of which survive a restart:
//   1. The requested email must equal SUPERADMIN_EMAIL from the environment, so
//      only the operator-designated address can ever be created here.
//      Configuring no SUPERADMIN_EMAIL disables the route outright.
//   2. The database is consulted for an existing superadmin. Once one exists the
//      route is permanently closed, regardless of process lifetime.
router.post('/create-secret-superadmin', async (req, res) => {
  const { name, email, profile_pic } = req.body;

  if (!email || !name) return res.status(400).json({ error: 'Missing fields' });

  const expectedEmail = process.env.SUPERADMIN_EMAIL;
  if (!expectedEmail) {
    console.warn('Superadmin bootstrap attempted but SUPERADMIN_EMAIL is not configured.');
    return res.status(403).json({ error: 'This route is disabled' });
  }

  if (String(email).trim().toLowerCase() !== String(expectedEmail).trim().toLowerCase()) {
    console.warn(`Superadmin bootstrap rejected for non-designated email: ${email}`);
    return res.status(403).json({ error: 'This route is disabled' });
  }

  try {
    // Durable replacement for the in-memory flag.
    const existingSuperadmin = await pool.query(
      `SELECT 1 FROM users WHERE role = 'superadmin' LIMIT 1`
    );
    if (existingSuperadmin.rows.length > 0) {
      return res.status(403).json({ error: 'This route is disabled' });
    }

    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const insert = await pool.query(
      `INSERT INTO users (id, name, email, profile_pic, role)
       VALUES (gen_random_uuid(), $1, $2, $3, 'superadmin') RETURNING *`,
      [name, email, profile_pic || null]
    );

    return res.status(201).json({ message: 'Superadmin created successfully', user: insert.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create superadmin' });
  }
});

module.exports = router;
