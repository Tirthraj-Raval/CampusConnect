const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required by Supabase
  },
  // Force IPv4 DNS resolution
  family: 4,
});

module.exports = pool;
