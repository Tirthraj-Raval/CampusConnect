const pool = require('../utils/db');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

exports.getActiveEventRSVPs = async (req, res) => {
  const { clubId } = req.params;

  try {
    const result = await pool.query(`
      SELECT e.id AS event_id, e.title AS event_name, r.user_id, s.name AS student_name, r.rsvp_time
      FROM rsvps r
      JOIN events e ON e.id = r.event_id
      JOIN users s ON s.id = r.user_id
      WHERE e.club_id = $1 AND e.status = 'Published'
    `, [clubId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Active RSVP fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.downloadRSVPsByEvent = async (req, res) => {
  const { clubId, eventId } = req.params;

  try {
    const result = await pool.query(`
      SELECT s.name, s.email, r.rsvp_time
      FROM rsvps r
      JOIN users s ON s.id = r.user_id
      WHERE r.event_id = $1
    `, [eventId]);

    const csvWriter = createObjectCsvWriter({
      path: 'event_rsvps.csv',
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'rsvp_time', title: 'RSVP Time' },
      ],
    });

    await csvWriter.writeRecords(result.rows);
    res.download('event_rsvps.csv');
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.downloadAllRSVPs = async (req, res) => {
  const { clubId } = req.params;

  try {
    const result = await pool.query(`
      SELECT e.title AS event_name, s.name, s.email, r.rsvp_time
      FROM rsvps r
      JOIN users s ON s.id = r.user_id
      JOIN events e ON e.id = r.event_id
      WHERE e.club_id = $1
    `, [clubId]);

    const csvWriter = createObjectCsvWriter({
      path: 'all_rsvps.csv',
      header: [
        { id: 'event_name', title: 'Event' },
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'created_at', title: 'RSVP Time' },
      ],
    });

    await csvWriter.writeRecords(result.rows);
    res.download('all_rsvps.csv');
  } catch (err) {
    console.error('All RSVPs download error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
