#!/usr/bin/env node
/* tools/release/live-check.mjs — THE WIRE IS THE BUILD (030 V, finding F1).  After `wrangler deploy`, fetch the live index.html and sw.js
 * and compare them byte for byte with dist/.  sw.js digests every precached body against its recorded hash and REJECTS the install when
 * a byte differs, so anything that rewrites a response on the way out — Cloudflare's bot-detection beacon (JavaScript Detections appends a
 * per-request <script> before </body>), Rocket Loader, Email Obfuscation, Web Analytics — silently costs every visitor the offline install.
 * The 030 outside-eye review found exactly that on the live site; this is the check that sees it.
 *
 *   node tools/release/live-check.mjs [https://lambdawaves.magic-commons.com]      exit 0 when both match, 1 with the first differing lines
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGIN = (process.argv[2] || 'https://lambdawaves.magic-commons.com').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) Firefox/145.0';   // Cloudflare answers 403 to a bare tool agent; a browser's is what visitors send
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 12);

let bad = 0;
for (const [url, file] of [['/', 'index.html'], ['/sw.js', 'sw.js']]) {
  const local = path.join(ROOT, 'dist', file);
  if (!existsSync(local)) { console.error(`dist/${file} is not built: node tools/build-deploy.mjs first`); process.exit(2); }
  const want = readFileSync(local);
  const res = await fetch(ORIGIN + url, { headers: { 'user-agent': UA, 'cache-control': 'no-cache' } });
  const got = Buffer.from(await res.arrayBuffer());
  const csp = res.headers.get('content-security-policy') ? 'CSP sent' : 'NO CSP';
  if (res.ok && got.equals(want)) { console.log(`PASS  ${url}  ${got.length} B  sha ${sha(got)} = dist/${file}  (${csp})`); continue; }
  bad++;
  console.log(`FAIL  ${url}  HTTP ${res.status}  ${got.length} B  sha ${sha(got)} ≠ dist/${file} ${sha(want)}  (${csp})`);
  const a = want.toString('utf8').split('\n'), b = got.toString('utf8').split('\n');
  for (let i = 0, shown = 0; i < Math.max(a.length, b.length) && shown < 4; i++) {
    if (a[i] !== b[i]) { shown++; console.log(`      line ${i + 1}  build: ${(a[i] || '').slice(0, 100)}\n                live:  ${(b[i] || '').slice(0, 100)}`); }
  }
}
if (bad) {
  console.log('\nThe live bytes are not the build\'s: sw.js will refuse to install (its ONE LAW: a precached body that does not digest to its recorded');
  console.log('hash rejects the install), so no visitor gets the offline app.  A <script> before </body> that is not in the build is Cloudflare rewriting');
  console.log('the response: turn off JavaScript Detections / Bot Fight Mode, Rocket Loader, Email Obfuscation and Web Analytics for this hostname');
  console.log('in the dashboard (Security › Settings, Speed › Optimization, Analytics), then run this again.');
  process.exit(1);
}
console.log('the wire is the build: a visitor\'s first launch installs exactly what was proven.');
