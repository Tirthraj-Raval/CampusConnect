const { Pool } = require('pg');
require('dotenv').config();

try {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    family: 4,
  });

  console.log('✅ PostgreSQL pool created successfully');

  module.exports = pool;
} catch (error) {
  console.error('❌ Failed to create PostgreSQL pool:', error.message);
  process.exit(1);
}
