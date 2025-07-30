// server/controllers/certificatesController.js
const pool = require('../utils/db');
const { generatePdfFromHtml } = require('../utils/pdf');
const path = require('path');
const fs = require('fs');

exports.getCertificates = async (req, res) => {
  const { clubId } = req.params;
  const q = `
    SELECT c.id, c.event_id, e.title AS event_name, u.id AS user_id, u.name AS recipient, u.email AS user_email,
           c.generated_at, c.certificate_url
    FROM certificates c
    JOIN events e ON e.id = c.event_id
    JOIN users u ON u.id = c.user_id
    WHERE e.club_id = $1
    ORDER BY c.generated_at DESC`;
  try {
    const result = await pool.query(q, [clubId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};

exports.issueCertificates = async (req, res) => {
  const { clubId } = req.params;
  const { eventId, userIds, customHtml } = req.body;

  if (!eventId || !Array.isArray(userIds) || !customHtml) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  try {
    // Adjust this relative path to your project structure
    const certDir = path.join(__dirname, '../../client/public/certificates');

    // Make sure the certificates directory exists in the client folder
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    const eventRes = await pool.query(
      'SELECT title FROM events WHERE id = $1 AND club_id = $2',
      [eventId, clubId]
    );

    if (eventRes.rowCount === 0) return res.status(404).json({ error: 'Event not found.' });
    const eventTitle = eventRes.rows[0].title;

    const generated = [];

    for (let uid of userIds) {
      const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [uid]);
      if (userRes.rowCount === 0) continue;
      const userName = userRes.rows[0].name;

      const html = customHtml
        .replace(/{{name}}/g, userName)
        .replace(/{{event}}/g, eventTitle);

      const pdfBuffer = await generatePdfFromHtml(html);
      const fileName = `cert_${clubId}_${eventId}_${uid}.pdf`;
      const filePath = path.join(certDir, fileName);

      fs.writeFileSync(filePath, pdfBuffer);

      // URL path relative to client public folder
      const url = `/certificates/${fileName}`;

      await pool.query(`
        INSERT INTO certificates (user_id, event_id, certificate_url, custom_html)
        VALUES ($1, $2, $3, $4)
      `, [uid, eventId, url, customHtml]);

      generated.push({ userId: uid, url });
    }

    res.status(201).json({ message: 'Certificates generated', generated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Certificate generation failed' });
  }
};

exports.getCertificateThroughId = async (req, res) => {
  const { certificateId, clubId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        c.id, 
        c.certificate_url, 
        u.name AS recipient, 
        e.title AS event
      FROM certificates c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN events e ON e.id = c.event_id
      WHERE c.id = $1 AND c.club_id = $2
    `, [certificateId, clubId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Certificate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
