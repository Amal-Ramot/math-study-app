#!/usr/bin/env node
// Makes the app work offline: downloads React / ReactDOM / htm UMD builds into
// app/vendor/ and points the matching <script src> tags in app/index.html at the
// local copies. Never fails the build: on any error it logs a warning, leaves the
// CDN URLs in place and exits 0.
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const APP_DIR = path.join(__dirname, '..', 'app');
const VENDOR_DIR = path.join(APP_DIR, 'vendor');
const INDEX = path.join(APP_DIR, 'index.html');

// match: regex that identifies a CDN <script src> for this library.
const LIBS = [
  {
    file: 'react.production.min.js',
    urls: [
      'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
      'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
      'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
    ],
    match: /\breact(?:@[\d.]+|\/[\d.]+)\/umd\/react\.(?:production\.min|development)\.js/,
  },
  {
    file: 'react-dom.production.min.js',
    urls: [
      'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
      'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
      'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js',
    ],
    match: /\breact-dom(?:@[\d.]+|\/[\d.]+)\/umd\/react-dom\.(?:production\.min|development)\.js/,
  },
  {
    file: 'htm.umd.js',
    urls: [
      'https://unpkg.com/htm@3.1.1/dist/htm.umd.js',
      'https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js',
      'https://cdnjs.cloudflare.com/ajax/libs/htm/3.1.1/htm.umd.js',
    ],
    match: /\bhtm(?:@[\d.]+|\/[\d.]+)\/(?:dist\/)?htm(?:\.umd)?(?:\.min)?\.js/,
  },
];

function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'math-study-app-vendor' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolve(get(new URL(res.headers.location, url).toString(), redirects - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.setTimeout(30000, () => req.destroy(new Error(`timeout for ${url}`)));
    req.on('error', reject);
  });
}

async function fetchFirst(urls) {
  let lastErr;
  for (const url of urls) {
    try {
      const buf = await get(url);
      if (buf.length < 500) throw new Error(`suspiciously small file from ${url}`);
      return { buf, url };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function main() {
  if (!fs.existsSync(INDEX)) {
    console.warn('[vendor] app/index.html not found — nothing to do.');
    return;
  }
  fs.mkdirSync(VENDOR_DIR, { recursive: true });
  let html = fs.readFileSync(INDEX, 'utf8');
  let changed = 0;

  for (const lib of LIBS) {
    // Find <script ... src="..."> tags whose src matches this library.
    const tagRe = /<script\b[^>]*\bsrc\s*=\s*(["'])([^"']+)\1[^>]*>/gi;
    const hits = [...html.matchAll(tagRe)].filter((m) => lib.match.test(m[2]));
    if (hits.length === 0) {
      console.log(`[vendor] ${lib.file}: not referenced in index.html, skipping.`);
      continue;
    }
    let ok = fs.existsSync(path.join(VENDOR_DIR, lib.file));
    try {
      const { buf, url } = await fetchFirst(lib.urls);
      fs.writeFileSync(path.join(VENDOR_DIR, lib.file), buf);
      console.log(`[vendor] ${lib.file}: ${buf.length} bytes from ${url}`);
      ok = true;
    } catch (err) {
      console.warn(`[vendor] ${lib.file}: download failed (${err.message})${ok ? ', using existing copy' : ', keeping CDN'}.`);
    }
    if (!ok) continue;
    for (const m of hits) {
      let tag = m[0].replace(m[2], `vendor/${lib.file}`);
      // SRI hashes / crossorigin refer to the CDN file; drop them for the local copy.
      tag = tag.replace(/\s+integrity\s*=\s*(["'])[^"']*\1/i, '').replace(/\s+crossorigin(?:\s*=\s*(["'])[^"']*\1)?/i, '');
      html = html.replace(m[0], tag);
      changed++;
    }
  }

  if (changed) {
    fs.writeFileSync(INDEX, html);
    console.log(`[vendor] rewrote ${changed} script tag(s) in app/index.html`);
  } else {
    console.log('[vendor] index.html unchanged.');
  }
}

main().catch((err) => {
  console.warn(`[vendor] skipped: ${err && err.message}`);
}).finally(() => process.exit(0));
