// server/utils/pdf.js
const puppeteer = require('puppeteer');

async function generatePdfFromHtml(html) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdf;
}

module.exports = { generatePdfFromHtml };
