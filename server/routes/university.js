const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const pool = require('../utils/db');
const fs = require('fs');
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const checkSuperadminEmail = require('../middlewares/checkSuperAdminEmail');

const upload = multer({ dest: 'uploads/' });

// 🔐 Utility: UUID v5 based on email (deterministic)
function generateUUIDFromGoogleId(email) {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // demo namespace
  const hash = crypto.createHash('sha1')
    .update(namespace + email)
    .digest('hex');

  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f | 0x80).toString(16) + hash.substring(18, 20)),
    hash.substring(20, 32)
  ].join('-');
}

// 🔗 Generate Gravatar-style profile picture
function getGravatar(email) {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

// ✅ 1. Create University
router.post('/', checkSuperadminEmail, async (req, res) => {
  const { name, domain, logo_url, description } = req.body;

  if (!name || !domain) {
    return res.status(400).json({ error: 'Name and domain are required' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO universities (name, domain, logo_url, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, domain, logo_url, description]);

    res.status(201).json({ message: 'University created', university: result.rows[0] });
  } catch (err) {
    console.error('Error creating university:', err);
    res.status(500).json({ error: 'Failed to create university' });
  }
});

// ✅ 2. Upload Students CSV
router.post('/:id/upload-students', checkSuperadminEmail, upload.single('csv'), async (req, res) => {
  const university_id = req.params.id;
  const filePath = req.file?.path;

  if (!filePath) return res.status(400).json({ error: 'CSV file missing' });

  const students = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => students.push(row))
    .on('end', async () => {
      try {
        let inserted = 0;

        for (const student of students) {
          const name = student.name?.trim();
          const email = student.email?.trim().toLowerCase();

          if (!name || !email || !email.includes('@')) continue; // basic validation

          const uuid = generateUUIDFromGoogleId(email);
          const profile_pic = getGravatar(email);

          await pool.query(`
            INSERT INTO users (id, name, email, profile_pic, role, university_id)
            VALUES ($1, $2, $3, $4, 'student', $5)
            ON CONFLICT (email) DO NOTHING
          `, [uuid, name, email, profile_pic, university_id]);

          inserted++;
        }

        fs.unlinkSync(filePath);
        res.status(200).json({ message: `${inserted} students uploaded successfully` });
      } catch (err) {
        console.error('Error uploading students:', err);
        res.status(500).json({ error: 'Failed to upload students' });
      }
    });
});

// ✅ 3. Upload Clubs CSV with sanitization and club_email + about_html support
router.post('/:id/upload-clubs', checkSuperadminEmail, upload.single('csv'), async (req, res) => {
  const university_id = req.params.id;
  const filePath = req.file?.path;

  if (!filePath) return res.status(400).json({ error: 'CSV file missing' });

  const clubs = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      // Normalize all keys to lowercase for consistent access
      const normalized = {};
      for (const key in row) {
        normalized[key.trim().toLowerCase()] = row[key]?.trim();
      }
      clubs.push(normalized);
    })
    .on('end', async () => {
      try {
        let inserted = 0, skipped = 0;

        for (const club of clubs) {
          const name = club.name;
          const description = club.description || null;
          const logo_url = club.logo_url || null;
          const secretary_email = club.secretary_email?.toLowerCase();
          const club_email = club.club_email?.toLowerCase() || null;
          let about_html = club.about_html || '';

          if (!name || !secretary_email) {
            skipped++;
            continue;
          }

          // Sanitize about_html safely (allow basic formatting)
          about_html = sanitizeHtml(about_html, {
            allowedTags: ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'br', 'span', 'div', 'a'],
            allowedAttributes: {
              a: ['href', 'target', 'rel'],
              '*': ['style'],
            },
            allowedSchemes: ['http', 'https', 'mailto'],
          });

          // Get secretary ID
          const secResult = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [secretary_email]
          );
          const secretary_id = secResult.rows.length ? secResult.rows[0].id : null;

          await pool.query(
            `
            INSERT INTO clubs (name, description, logo_url, university_id, secretary_id, club_email, about_html)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
            [
              name,
              description,
              logo_url,
              university_id,
              secretary_id,
              club_email,
              about_html,
            ]
          );

          inserted++;
        }

        fs.unlinkSync(filePath); // clean up
        return res.status(200).json({ message: `${inserted} clubs uploaded successfully, ${skipped} skipped.` });
      } catch (err) {
        console.error('Error uploading clubs:', err);
        return res.status(500).json({ error: 'Failed to upload clubs' });
      }
    });
});

module.exports = router;
