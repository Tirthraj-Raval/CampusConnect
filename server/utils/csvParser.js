const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // run: npm install csv-parser

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

module.exports = { parseCSV };

// Sample CSV Format
// name,email
// Tirthraj Raval,tirth@ahduni.edu.in
// Jay Patel,jayp@ahduni.edu.in

