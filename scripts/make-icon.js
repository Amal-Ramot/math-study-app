#!/usr/bin/env node
// Renders build/icon.png (1024x1024): rounded blue square with a white "+" and "×".
// Requires Playwright (dev-time only; the PNG is committed, so CI does not run this).
'use strict';

const path = require('path');
const { chromium } = require('playwright');

const SIZE = 1024;
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect x="64" y="64" width="896" height="896" rx="200" fill="url(#g)"/>
  <g stroke="#ffffff" stroke-width="64" stroke-linecap="round" fill="none">
    <!-- plus, upper-left -->
    <line x1="230" y1="380" x2="490" y2="380"/>
    <line x1="360" y1="250" x2="360" y2="510"/>
    <!-- times, lower-right -->
    <line x1="560" y1="560" x2="770" y2="770"/>
    <line x1="770" y1="560" x2="560" y2="770"/>
  </g>
</svg>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg}</body></html>`
  );
  const out = path.join(__dirname, '..', 'build', 'icon.png');
  await page.locator('svg').screenshot({ path: out, omitBackground: true });
  await browser.close();
  console.log('wrote', out);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
