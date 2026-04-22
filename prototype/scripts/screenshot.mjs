import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const variation = process.argv[2] || 'unknown';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '..', 'prototype.html');
const outPath = path.resolve(__dirname, '..', 'screenshots', `variation-${variation}.png`);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`file://${htmlPath}`);
await page.waitForTimeout(1500);
// Ensure VOC page is shown
await page.evaluate(() => {
  document.querySelectorAll('[id^="page-"]').forEach(el => el.style.display = 'none');
  const voc = document.getElementById('page-voc');
  if (voc) voc.style.display = '';
});
await page.waitForTimeout(500);
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(`Screenshot saved: ${outPath}`);
