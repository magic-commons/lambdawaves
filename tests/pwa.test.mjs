/* pwa.test.mjs — the install-and-offline proof.  Node only, no browser, no dependencies.
 *
 * It proves five things about lab/manifest.webmanifest, lab/sw.js and lab/img/icon-*.png:
 *   A  the manifest parses and every member is not merely present but AGREES with the lab it describes
 *      (the ground colour is read out of lab.css, the icon list out of the directory);
 *   B  every icon file exists and is a valid PNG of its declared size — the IHDR and the pixels are decoded
 *      here, by hand, so a rasteriser that lied would be caught; the maskable variants honour the safe zone
 *      and the nine cell colours are the nine fills of #title .mark in index.html, verbatim;
 *   C  sw.js's precache list is EXACTLY the files on disk, with EXACTLY their current content hashes — the
 *      check that rots first, so it can repair itself (--write) as well as fail;
 *   D  nothing the lab loads is external, and nothing it loads is missing (a 404 offline is a 404 forever);
 *   E  the update policy is EXECUTED, not described: sw.js is loaded into a stub worker global and its
 *      install / activate / fetch / message handlers are driven with fake events.
 *
 * Run:  node tests/pwa.test.mjs            prove it
 *       node tests/pwa.test.mjs --write    refresh sw.js's precache list from lab/ first, then prove it.
 *                                          Run this after ANY wave that adds, removes or edits a file in
 *                                          lab/ — it is the whole maintenance burden of the offline layer.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync, brotliDecompressSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const LAB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'lab');
const read = (rel) => readFileSync(path.join(LAB, rel));
const text = (rel) => read(rel).toString('utf8');
const hex = (s) => s.trim().toLowerCase();

/* ══ 0.  a PNG decoder.  We do not ask a library whether the icon is 512 px — we read the IHDR. ══════════ */
const CRC = (() => { const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c; }
  return (buf) => { let c = -1; for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; }; })();

function decodePNG(buf, name) {
  assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${name}: PNG signature`);
  let off = 8, ihdr = null, seenIEND = false; const idat = [];
  while (off + 12 <= buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('latin1', off + 4, off + 8);
    const body = buf.subarray(off + 8, off + 8 + len);
    assert.equal(CRC(buf.subarray(off + 4, off + 8 + len)), buf.readUInt32BE(off + 8 + len), `${name}: CRC of chunk ${type}`);
    if (type === 'IHDR') ihdr = { w: body.readUInt32BE(0), h: body.readUInt32BE(4), depth: body[8], color: body[9], comp: body[10], filter: body[11], interlace: body[12] };
    else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') { seenIEND = true; off += 12 + len; break; }
    off += 12 + len;
  }
  assert.ok(ihdr, `${name}: no IHDR`);
  assert.ok(seenIEND, `${name}: no IEND`);
  assert.equal(ihdr.depth, 8, `${name}: bit depth must be 8`);
  assert.equal(ihdr.interlace, 0, `${name}: must not be interlaced (a launcher decodes it once, at speed)`);
  const bpp = { 2: 3, 6: 4 }[ihdr.color];
  assert.ok(bpp, `${name}: colour type ${ihdr.color} — an icon must be truecolour (2) or truecolour+alpha (6)`);
  const raw = inflateSync(Buffer.concat(idat)), stride = ihdr.w * bpp, out = Buffer.alloc(ihdr.h * stride);
  assert.equal(raw.length, ihdr.h * (stride + 1), `${name}: inflated IDAT is the wrong length`);
  let p = 0;
  for (let y = 0; y < ihdr.h; y++) {
    const ft = raw[p++], line = raw.subarray(p, p + stride); p += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride), prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev ? prev[x] : 0, c = (prev && x >= bpp) ? prev[x - bpp] : 0;
      let v = line[x];
      if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      else assert.equal(ft, 0, `${name}: unknown row filter ${ft} on row ${y}`);
      cur[x] = v & 0xff;
    }
  }
  return { ...ihdr, bpp, px: (x, y) => { const i = y * stride + x * bpp; return bpp === 4 ? [out[i], out[i + 1], out[i + 2], out[i + 3]] : [out[i], out[i + 1], out[i + 2], 255]; } };
}

/* ══ A.  THE MANIFEST ════════════════════════════════════════════════════════════════════════════════════ */
const mfSrc = text('manifest.webmanifest');
const mf = JSON.parse(mfSrc);                                                    // parses, or this throws

for (const k of ['name', 'short_name', 'description', 'lang', 'start_url', 'scope',
                 'display', 'orientation', 'theme_color', 'background_color', 'icons'])
  assert.ok(mf[k] !== undefined && mf[k] !== '', `manifest: missing member ${k}`);

/* start_url and scope are RELATIVE, so the same file works at /lab/ on 127.0.0.1, at /lab/ on the LAN
   and wherever magic-commons.com eventually puts it.  An absolute "/lab/" would break the last of those. */
for (const k of ['start_url', 'scope']) assert.ok(mf[k].startsWith('./'), `manifest: ${k} must be relative ("./…"), got ${mf[k]}`);
const BASE = 'https://host.invalid/lab/manifest.webmanifest';
const scopeURL = new URL(mf.scope, BASE).href, startURL = new URL(mf.start_url, BASE).href;
assert.ok(startURL.startsWith(scopeURL), 'manifest: start_url must be inside scope');
assert.equal(scopeURL, 'https://host.invalid/lab/', 'manifest: scope must resolve to the lab directory');

/* WAVE 56, FROM THE ADVERSARIAL REVIEW OF 2026-09-05 § 2.8 AND JOSH'S DEPLOY RULING — THERE IS NO `id`
   MEMBER, AND THAT IS THE CORRECT VALUE, NOT AN OMISSION.
   `id` is the one member W3C AppManifest does NOT resolve against the manifest's own URL: its base is the
   ORIGIN of start_url.  So a relative id is not relative to this directory at all — "./" resolves to the
   SITE ROOT (and any second PWA ever served from that origin with a default id would claim the same
   identity and replace the lab on install), and "lab/" resolves to the DEV SERVER's path, which is not
   where this ships: the lab deploys to magic-commons.com/joshs-library/lambdawaves/, with the bare domain
   redirecting there, precisely so that a root-scoped worker cannot persist on a visitor's machine and
   swallow the library Josh intends to put beside it.  With NO id member the identity falls back to
   start_url — "./" against the MANIFEST url — which is right at every depth and cannot rot the next time
   the site moves.  Hard-coding the full deploy path would pass today and be wrong after the next move. */
assert.ok(!('id' in mf), `manifest: an id member is resolved against the ORIGIN, not this directory, so any value written here is wrong somewhere — got ${JSON.stringify(mf.id)}. Delete it: the identity then falls back to start_url, which is relative to the manifest and correct at every deploy depth.`);
assert.equal(startURL, scopeURL, 'manifest: with no id member the app identity IS start_url, so start_url must resolve to the lab directory itself');

assert.equal(mf.display, 'standalone', 'manifest: display must be "standalone" — the goal is a home-screen launch with no browser chrome');
assert.equal(mf.orientation, 'any', 'manifest: orientation must be "any" — skin.css has a portrait arm AND a landscape arm for the phone (wave 51); locking one throws that work away');
assert.ok(mf.short_name.length <= 12, `manifest: short_name "${mf.short_name}" is ${mf.short_name.length} chars — a home-screen label truncates past ~12`);
assert.ok(/λWAVES/.test(mf.name) && /λWAVES/.test(mf.short_name), 'manifest: the name and short_name must carry the λ');
assert.ok(text('index.html').includes('<title>λWAVES'), 'index.html no longer opens with the λWAVES title the manifest name is built from');

/* THE COLOUR DECISION, ASSERTED AGAINST THE STYLESHEET RATHER THAN TYPED TWICE.
   theme_color and background_color are static; the lab's theme is not (LIGHT ships as the default, DARK and
   SYSTEM are a control away).  There is exactly one colour that is not a guess about which theme is on:
   lab.css's unconditional `html, body { background: … }`, which is what the document IS from first paint
   until rack.js resolves a theme, in every theme.  It is also the ground the icons are drawn on, so the
   Android splash (icon on background_color) is one seamless field instead of a dark square on white.
   The LIVE, theme-correct chrome colour is the document's job, not the manifest's: <meta name="theme-color">
   overrides the manifest and setTheme() can rewrite it on every flip.  See the note at the foot of this file. */
const GROUND = hex((text('lab.css').match(/html,\s*body\s*\{[^}]*background:\s*(#[0-9a-fA-F]{3,8})/) || [])[1] || '');
assert.ok(/^#[0-9a-f]{6}$/.test(GROUND), 'lab.css: could not read the unconditional html/body background');
assert.equal(hex(mf.theme_color), GROUND, `manifest: theme_color must be the lab's pre-paint ground ${GROUND} from lab.css, not a theme's guess`);
assert.equal(hex(mf.background_color), GROUND, `manifest: background_color must be the lab's pre-paint ground ${GROUND} from lab.css`);
console.log(`PASS manifest parses; ${Object.keys(mf).length} members, scope ${mf.scope} display ${mf.display} orientation ${mf.orientation}, both colours = lab.css's ground ${GROUND}.`);

/* ══ A2.  THE LINK PREVIEW (wave 59) ═════════════════════════════════════════════════════════════════════
 * Wave 56 made the whole state ride in the URL fragment, which made a LINK the way this lab travels — and
 * the document carried no <meta name="description">, no og:*, no twitter:*, so every share unfurled as a
 * bare URL and the decision to open it was made on nothing.  The sentence is NOT a new one: it is the
 * manifest's own `description` and the ABOUT face's tagline, and the title is the manifest's own `name`.
 * Four copies of one string is exactly ANTI-PATTERN 6, so they are asserted equal rather than trusted. */
const html = text('index.html');
const meta = (attr, key) => { const m = html.match(new RegExp('<meta\\s+' + attr + '="' + key + '"\\s+content="([^"]*)"')); return m ? m[1] : null; };
const esc = (t) => t.replace(/&amp;/g, '&').replace(/&nbsp;/g, '\u00a0');
for (const [attr, key, want, what] of [
  ['name', 'description', mf.description, 'the manifest description'],
  ['property', 'og:description', mf.description, 'the manifest description'],
  ['property', 'og:title', mf.name, 'the manifest name'],
]) assert.equal(meta(attr, key), want, `index.html: <meta ${attr}="${key}"> must be ${what}, character for character — a hand-kept duplicate goes stale (ANTI-PATTERN 6)`);
assert.equal(meta('name', 'twitter:card'), 'summary_large_image', 'index.html: the twitter card type');
const tagline = esc((html.match(/<p class="ab-tagline">([\s\S]*?)<\/p>/) || [])[1] || '').trim();
assert.equal(tagline, mf.description, 'index.html: the ABOUT face tagline and the manifest description are the same sentence and must stay so');
/* og:image is the ONE absolute URL in lab/, because a crawler resolves it against nothing.  It therefore
   names the deploy path, and tools/build-deploy.mjs §V3 re-checks it against BASE_PATH at build time; here
   we only prove it is absolute and points at an icon that really exists and really is precached. */
const og = meta('property', 'og:image');
assert.ok(og && /^https:\/\/[^/]+\/.+\.png$/.test(og), `index.html: og:image must be an absolute https URL to a PNG, got ${og}`);
const ogRel = og.split('/').slice(-2).join('/');
assert.ok(existsSync(path.join(LAB, ogRel)), `index.html: og:image names ${ogRel}, which is not in lab/`);
console.log(`PASS the link preview is the manifest's own words: description (${mf.description.length} chars) and og:title match the manifest and the ABOUT tagline exactly; og:image → ${ogRel}, ${statSync(path.join(LAB, ogRel)).size} bytes.`);

/* ══ B.  THE ICONS ═══════════════════════════════════════════════════════════════════════════════════════ */
/* The nine colours are read OUT OF index.html's #title .mark, so an icon that drifts from the real mark
   fails here rather than looking subtly wrong on someone's home screen. */
const markSVG = (text('index.html').match(/<svg class="mark"[\s\S]*?<\/svg>/) || [])[0];
assert.ok(markSVG, 'index.html: could not find the #title .mark svg the icons are built from');
const MARK = [...markSVG.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)].map((m) => hex(m[1]));
assert.equal(MARK.length, 9, `index.html: the mark should have nine fills, found ${MARK.length}`);
assert.ok(/rotate\(45\s+5\s+5\)/.test(markSVG), 'index.html: the mark is no longer rotated 45° about (5,5) — the icons assume it is');
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const GROUND_RGB = rgb(GROUND);

/* Every icon in the manifest, plus the two the HTML links directly (apple-touch, and the SVG source). */
const EXTRA = [{ src: './img/icon-apple-180.png', sizes: '180x180', type: 'image/png', purpose: 'any', _html: true }];
const ICONS = [...mf.icons, ...EXTRA];
assert.ok(mf.icons.length >= 4, 'manifest: at least 192+512 in both "any" and "maskable"');
for (const want of [['any', '192x192'], ['any', '512x512'], ['maskable', '192x192'], ['maskable', '512x512']])
  assert.ok(mf.icons.some((i) => i.purpose === want[0] && i.sizes === want[1]), `manifest: no ${want[0]} icon at ${want[1]}`);

const inkRadius = {};
for (const ic of ICONS) {
  const rel = ic.src.replace(/^\.\//, '');
  assert.ok(existsSync(path.join(LAB, rel)), `icon file missing: lab/${rel}`);
  assert.equal(ic.type, 'image/png', `${rel}: declared type`);
  const [dw, dh] = ic.sizes.split('x').map(Number);
  const im = decodePNG(read(rel), rel);
  assert.equal(im.w, dw, `${rel}: IHDR says ${im.w} px wide, the manifest declares ${dw}`);
  assert.equal(im.h, dh, `${rel}: IHDR says ${im.h} px tall, the manifest declares ${dh}`);
  assert.equal(im.w, im.h, `${rel}: an app icon must be square`);

  /* Opaque, edge to edge.  A transparent corner survives an "any" icon; a maskable icon with one gets a
     see-through wedge as soon as a launcher rotates its mask. */
  for (const [x, y] of [[0, 0], [im.w - 1, 0], [0, im.h - 1], [im.w - 1, im.h - 1], [im.w >> 1, 0], [0, im.h >> 1]]) {
    const p = im.px(x, y);
    assert.equal(p[3], 255, `${rel}: pixel (${x},${y}) is not opaque`);
    assert.ok(Math.max(...p.slice(0, 3).map((v, i) => Math.abs(v - GROUND_RGB[i]))) <= 3,
      `${rel}: edge pixel (${x},${y}) is ${p.slice(0, 3)}, expected the ground ${GROUND_RGB}`);
  }

  /* The nine cells, at the centres the geometry puts them.  cell = blockSide/3; the group is rotated 45°
     about the icon's centre, so local (lx,ly) lands at C + ((lx−ly)/√2, (lx+ly)/√2). */
  const maskable = ic.purpose === 'maskable';
  const cellUnits = maskable ? 84 : 96;                                   // lab/img/icon*.svg, authored at 512 units
  const s = im.w / 512, C = im.w / 2, R2 = Math.SQRT1_2;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const lx = (c - 1) * cellUnits * s, ly = (r - 1) * cellUnits * s;
    const px = Math.round(C + (lx - ly) * R2), py = Math.round(C + (lx + ly) * R2);
    const got = im.px(px, py).slice(0, 3), want = rgb(MARK[r * 3 + c]);
    assert.ok(Math.max(...got.map((v, i) => Math.abs(v - want[i]))) <= 4,
      `${rel}: cell (${r},${c}) at (${px},${py}) is rgb(${got}); index.html's mark says ${MARK[r * 3 + c]} = rgb(${want})`);
  }

  /* How far the ink actually reaches, measured, not asserted from the source. */
  let maxR = 0, ink = 0;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const p = im.px(x, y);
    if (Math.max(...p.slice(0, 3).map((v, i) => Math.abs(v - GROUND_RGB[i]))) > 8) {
      ink++; maxR = Math.max(maxR, Math.hypot(x + 0.5 - C, y + 0.5 - C));
    }
  }
  const frac = maxR / im.w;
  inkRadius[`${ic.purpose}@${dw}`] = frac;
  assert.ok(ink > im.w * im.h * 0.15, `${rel}: only ${ink} px of ink — the mark is not drawn`);
  if (maskable) {
    /* THE SAFE ZONE.  The maskable spec puts it at a centred circle of radius 40% of the icon's width;
       anything outside is the launcher's to eat.  We hold the mark to 38% so there is real clearance. */
    assert.ok(frac <= 0.40, `${rel}: ink reaches ${(frac * 100).toFixed(1)}% of the width — outside the 40% maskable safe zone, so a launcher will cut the mark's corners off`);
    assert.ok(frac <= 0.38, `${rel}: ink reaches ${(frac * 100).toFixed(1)}% — inside the safe zone but with no margin`);
    assert.ok(frac >= 0.25, `${rel}: ink only reaches ${(frac * 100).toFixed(1)}% — over-padded, the mark will look like a speck`);
  } else {
    assert.ok(frac <= 0.48, `${rel}: ink reaches ${(frac * 100).toFixed(1)}% of the width — an "any" icon should keep its corners off the bleed`);
    assert.ok(frac >= 0.34, `${rel}: ink only reaches ${(frac * 100).toFixed(1)}% — the mark is lost in its own padding`);
  }
}
/* The maskable variants must be a DISTINCT, padded render, not the "any" file copied under another purpose. */
for (const n of [192, 512])
  assert.ok(inkRadius[`maskable@${n}`] < inkRadius[`any@${n}`] - 0.02,
    `the ${n} px maskable icon is not more padded than the "any" one (${(inkRadius[`maskable@${n}`] * 100).toFixed(1)}% vs ${(inkRadius[`any@${n}`] * 100).toFixed(1)}%) — it is the same render under a different purpose`);

/* The two SVG sources the PNGs are rasterised from carry the same nine fills. */
for (const svg of ['img/icon.svg', 'img/icon-maskable.svg']) {
  assert.ok(existsSync(path.join(LAB, svg)), `icon source missing: lab/${svg}`);
  const fills = [...text(svg).matchAll(/<rect[^>]*fill="(#[0-9a-fA-F]{6})"\/>/g)].map((m) => hex(m[1])).slice(-9);
  assert.deepEqual(fills, MARK, `lab/${svg}: the nine fills have drifted from index.html's mark`);
}
console.log(`PASS ${ICONS.length} icons decoded by hand (signature, CRC, IHDR, un-filtered pixels): sizes as declared, opaque to the edge, nine cells = index.html's mark; ink radius ` +
  Object.entries(inkRadius).map(([k, v]) => `${k} ${(v * 100).toFixed(1)}%`).join(' · ') + ' (maskable safe zone 40%).');

/* ══ C.  THE PRECACHE LIST vs THE DIRECTORY ══════════════════════════════════════════════════════════════ */
/* These rules are the whole exclusion policy, and sw.js's NEVER_PRECACHE prose is checked against them.
   WAVE 59 · A LICENCE TEXT IS NOT A SHIPPED DOCUMENT.  The three font OFLs, the KaTeX fonts' OFL, marked's
   licence and vendor/katex/LICENSE are now PRECACHED (22 217 bytes across six files): the fonts they cover
   are precached, and OFL section 2 requires that each copy CONTAIN the licence — an installed app that makes
   zero network requests on its second launch was holding twenty-three font files it could not show a licence
   for.  The predicate is deliberately narrow: `*-SOURCE.txt` (the build records) and every other .md/.txt is
   still prose and still skipped, so a note edit still does not rebuild the cache. */
const LICENCE = (rel) => /(^|\/)(LICENSE|OFL\.txt)$/.test(rel) || /-(OFL|LICENSE)\.(txt|md)$/i.test(rel);
const SKIP = (rel) => rel === 'sw.js' || rel === 'smoke.html' || (/\.(md|txt)$/i.test(rel) && !LICENCE(rel));
const walk = (d, out = []) => { for (const e of readdirSync(d, { withFileTypes: true })) {
  const f = path.join(d, e.name); if (e.isDirectory()) walk(f, out); else out.push(path.relative(LAB, f).split(path.sep).join('/')); } return out; };
const onDisk = walk(LAB).sort();
const wanted = onDisk.filter((r) => !SKIP(r));
const skipped = onDisk.filter(SKIP);
const revOf = (rel) => createHash('sha256').update(read(rel)).digest('hex').slice(0, 12);

let swSrc = text('sw.js');
let SW = loadWorker();                                                            // §E builds the stub; defined below

const HEAD = 'const PRECACHE = [\n';
const survey = () => {
  const listed = SW.LW_SW.PRECACHE.map(([u]) => u.replace(/^\.\//, ''));
  return { listed,
    missing: wanted.filter((r) => !listed.includes(r)),
    stale: listed.filter((r) => !wanted.includes(r)),
    wrongHash: SW.LW_SW.PRECACHE.filter(([u, h]) => wanted.includes(u.replace(/^\.\//, '')) && h !== revOf(u.replace(/^\.\//, ''))) };
};
let { listed, missing, stale, wrongHash } = survey();
if (missing.length || stale.length || wrongHash.length) {
  const w = Math.max(...wanted.map((r) => r.length)) + 8;
  const block = wanted.map((r) => `  ['./${r}',`.padEnd(w) + `'${revOf(r)}'],`).join('\n');
  /* `node tests/pwa.test.mjs --write` refreshes §1 in place, then carries on and proves the result.  A
     check whose repair is a copy-and-paste chore is a check that gets deleted; this one repairs itself and
     still fails loudly in CI, where --write is not passed. */
  if (process.argv.includes('--write')) {
    const file = path.join(LAB, 'sw.js'), src = readFileSync(file, 'utf8');
    const a = src.indexOf(HEAD), b = src.indexOf('\n];\n', a);
    assert.ok(a >= 0 && b > a, 'sw.js: could not find the PRECACHE array to rewrite');
    writeFileSync(file, src.slice(0, a + HEAD.length) + block + src.slice(b));
    console.log(`      --write: sw.js §1 rewritten — ${wanted.length} entries (${missing.length} added, ${stale.length} dropped, ${wrongHash.length} re-hashed).`);
    swSrc = text('sw.js'); SW = loadWorker();
    ({ listed, missing, stale, wrongHash } = survey());
  } else {
    console.error('\n  ── sw.js §1 is out of date.  Re-run with --write, or paste this over the PRECACHE array: ──\n');
    console.error(block + '\n');
  }
}
assert.deepEqual(missing, [], `sw.js: ${missing.length} file(s) in lab/ are NOT precached — they will 404 offline`);
assert.deepEqual(stale, [], `sw.js: ${stale.length} precache entr(y|ies) name a file that is no longer in lab/ — install will reject and the whole worker will never take`);
assert.deepEqual(wrongHash.map(([u]) => u), [], 'sw.js: precache entries whose content hash no longer matches the file');
assert.equal(listed.length, new Set(listed).size, 'sw.js: a duplicate precache entry');
assert.deepEqual(listed, [...listed].sort(), 'sw.js: the precache list must stay sorted so a diff is readable');

const bytes = wanted.reduce((n, r) => n + statSync(path.join(LAB, r)).size, 0);
assert.ok(bytes < 8 * 1024 * 1024, `precache is ${(bytes / 1048576).toFixed(2)} MiB — over the 8 MiB ceiling; something large was added that should be fetched on demand instead`);
assert.ok(listed.includes('index.html'), 'sw.js: index.html must be precached — it is what every offline navigation is served');
assert.ok(!listed.includes('sw.js'), 'sw.js must never precache itself: the browser updates a worker through its own byte comparison, and a Cache API copy in front of that strands the build forever');
assert.ok(listed.includes('manifest.webmanifest'), 'sw.js: the manifest itself must be precached');

/* The prose in sw.js must name every rule the walk actually applies, so the two cannot drift apart silently. */
const never = SW.LW_SW.NEVER_PRECACHE.map(([k]) => k).join(' ');
for (const rule of ['sw.js', 'smoke.html', '*.md, *.txt EXCEPT a LICENCE text'])
  assert.ok(never.includes(rule), `sw.js: NEVER_PRECACHE does not document the rule "${rule}" that the walk applies`);
/* and the exception must be REAL, not merely written: every licence text in lab/ is in the precache list. */
const licences = onDisk.filter(LICENCE);
assert.ok(licences.length >= 6, `only ${licences.length} licence texts found in lab/ — the LICENCE predicate has stopped matching`);
assert.deepEqual(licences.filter((r) => !listed.includes(r)), [],
  'a licence text in lab/ is NOT precached — an offline install would hold the font and not its licence (OFL §2)');
console.log(`PASS the ${licences.length} licence texts are precached with the works they cover (${licences.join(', ')}).`);
console.log(`PASS precache list == lab/ on disk: ${listed.length} files, ${(bytes / 1048576).toFixed(2)} MiB, every content hash re-verified. Skipped by rule: ${skipped.join(', ')}.`);

/* ══ D.  NOTHING EXTERNAL, AND NOTHING MISSING ═══════════════════════════════════════════════════════════ */
const TEXTY = /\.(js|mjs|html|css|md|txt|webmanifest|svg)$/i;
const DOCS = (r) => /\.(md|txt)$/i.test(r) || r === 'vendor/katex/LICENSE';

/* D1 — no absolute URL is ever LOADED.  Every way a browser can be told to go and get something. */
const LOADERS = [
  [/<script[^>]+src\s*=\s*["']\s*(https?:|\/\/)/i, '<script src=…> to another origin'],
  [/<link[^>]+href\s*=\s*["']\s*(https?:|\/\/)/i, '<link href=…> to another origin'],
  [/<img[^>]+src\s*=\s*["']\s*(https?:|\/\/)/i, '<img src=…> to another origin'],
  [/@import\s+(?:url\()?\s*["']?\s*(?:https?:|\/\/)/i, 'a CSS @import from another origin'],
  [/url\(\s*["']?\s*(?:https?:|\/\/)/i, 'a CSS url() to another origin'],
  [/\bfetch\(\s*["'`]\s*(?:https?:|\/\/)/, 'fetch() of an absolute URL'],
  [/\bnew\s+Worker\(\s*["'`]\s*(?:https?:|\/\/)/, 'a Worker from another origin'],
  [/\bimportScripts\(\s*["'`]?\s*(?:https?:|\/\/)/, 'importScripts() from another origin'],
  [/\bimport\s*\(\s*["'`]\s*(?:https?:|\/\/)/, 'a dynamic import() of an absolute URL'],
  [/\bfrom\s+["']\s*(?:https?:|\/\/)/, 'a static import from an absolute URL'],
  /* root-relative too: /foo is same-origin but ABOVE the worker's /lab/ scope, so offline it is as absent
     as another origin.  Everything the lab loads must be relative to lab/. */
  [/<script[^>]+src\s*=\s*["']\/[^/]/i, '<script src="/…"> above the worker scope'],
  [/<link[^>]+href\s*=\s*["']\/[^/]/i, '<link href="/…"> above the worker scope'],
  [/<img[^>]+src\s*=\s*["']\/[^/]/i, '<img src="/…"> above the worker scope'],
  [/url\(\s*["']?\/[^/]/, 'a CSS url(/…) above the worker scope'],
  [/\bfrom\s+["']\/[^/]/, 'a static import from "/…" above the worker scope'],
];
const offences = [];
for (const rel of onDisk.filter((r) => TEXTY.test(r) && !DOCS(r))) {
  const src = text(rel);
  for (const [re, what] of LOADERS) if (re.test(src)) offences.push(`lab/${rel}: ${what}`);
}
assert.deepEqual(offences, [], 'lab/ loads something from the network — offline it will be a hole:\n  ' + offences.join('\n  '));

/* D2 — account for EVERY absolute URL that appears at all, so "none" is a fact and not an impression. */
const found = [];
for (const rel of onDisk.filter((r) => TEXTY.test(r))) {
  for (const m of text(rel).matchAll(/https?:\/\/[^\s"'`)<>,]+/g)) found.push({ rel, url: m[0], src: text(rel) });
}
const ALLOW = [
  [(f) => /^https?:\/\/www\.w3\.org\//.test(f.url), 'an XML namespace — an identifier, never fetched'],
  [(f) => DOCS(f.rel), 'inside a shipped licence or note, not code'],
  [(f) => f.rel === 'index.html' && new RegExp('<a[^>]+href="' + f.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"').test(f.src),
    'an ABOUT credit link: a plain <a target="_blank"> the reader clicks, never a load'],
  [(f) => /(^|\/)vendor\//.test(f.rel), 'a vendored library\'s own banner comment or error text (marked names its home page when it throws) — D1 above scans these same files for every loading construct, so an allowance here cannot hide a real fetch'],
  /* WAVE 59 · og:image is METADATA, and it is the one absolute URL the lab is allowed to contain.  A link
     unfurler is a crawler on another machine with no base URL to resolve against, so a relative og:image is
     simply dropped; this page never fetches it, and D1 above proves that by construction (a <meta content=>
     matches none of the twelve loading constructs).  It is pinned to the ONE tag, not to the origin. */
  [(f) => f.rel === 'index.html' && new RegExp('<meta property="og:image" content="' + f.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '">').test(f.src),
    'the og:image link-preview URL: metadata a crawler reads, never a resource this page loads (§A2 and build-deploy §V3 pin it)'],
];
const external = [], why = new Map();
for (const f of found) { const hit = ALLOW.find(([p]) => p(f)); if (!hit) external.push(`lab/${f.rel}: ${f.url}`); else why.set(hit[1], (why.get(hit[1]) || 0) + 1); }
assert.deepEqual(external, [], 'an absolute URL in lab/ that is neither a namespace, a licence, an ABOUT anchor, nor vendor prose:\n  ' + external.join('\n  '));

/* D3 — every relative thing the lab loads EXISTS and is precached.  A missing file is a 404 offline, and a
   file outside the precache is a 404 offline too, which is the same wound from the other side. */
const dangling = [], uncached = [], beside = [];
/* WAVE 59 · TWO FILES ARE SHIPPED BESIDE THE LAB AND ARE NOT IN IT.  tools/build-deploy.mjs §SHIP_EXTRA
   copies LICENSE and NOTICE from the repo root into dist/<BASE_PATH>/, exactly where `./LICENSE` and
   `./NOTICE` resolve from index.html at the deployed depth — which is why the ABOUT face may point at them
   with `./` and must NOT write `/LICENSE` (that is the LIBRARY's root, and it 404s).  They are correctly
   absent from lab/ and from the precache: a click that opens a licence in a new tab is allowed to need the
   network.  So they are accounted for here rather than counted as dangling, and the repo root is checked —
   build-deploy §V2 re-walks the same two links over the ASSEMBLED tree, which is the check that matters. */
const BESIDE_LAB = { LICENSE: 1, NOTICE: 1 };
const note = (fromRel, ref) => {
  if (/^(https?:|data:|blob:|#|mailto:)/.test(ref)) return;
  if (/\/$/.test(ref.split(/[?#]/)[0])) return;              // a new URL directory base is joined before anything is fetched
  if (BESIDE_LAB[ref.replace(/^\.\//, '')]) {
    const f = ref.replace(/^\.\//, '');
    if (!existsSync(path.join(LAB, '..', f))) dangling.push(`lab/${fromRel} → ${ref}  (SHIP_EXTRA names it, but it is not in the repo root)`);
    else beside.push(f);
    return;
  }
  const target = ref.startsWith('/')
    ? { out: true, rel: ref.slice(1) }
    : { out: false, rel: path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), ref.split(/[?#]/)[0])) };
  if (target.out) return;                                    // above /lab/ — §D4 accounts for those
  if (target.rel.startsWith('..')) return;
  if (!existsSync(path.join(LAB, target.rel))) dangling.push(`lab/${fromRel} → ${ref}`);
  else if (!listed.includes(target.rel)) uncached.push(`lab/${fromRel} → ${ref}`);
};
/* Comments come out first.  mir/glyph.js keeps `// import { publishM4 } from './overlay.js';` as the written
   record of a forced port edit — a disabled import is not a dangling one, and a check that cannot tell the
   difference is a check nobody will keep. */
const live = (s, html) => (html ? s.replace(/<!--[\s\S]*?-->/g, ' ') : s)
  .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^[ \t]*\/\/.*$/gm, '');
let refs = 0;
const noteAll = (rel, src, re, g = 1) => { for (const m of src.matchAll(re)) { refs++; note(rel, m[g]); } };
noteAll('index.html', live(text('index.html'), true), /(?:src|href)="([^"]+)"/g);
for (const rel of onDisk.filter((r) => /\.js$/.test(r) && !r.startsWith('vendor/'))) {
  const src = live(text(rel));
  noteAll(rel, src, /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g);
  noteAll(rel, src, /new URL\(\s*['"](\.[^'"]+)['"]\s*,\s*import\.meta\.url/g);
}
for (const rel of ['mir/css/base.css', 'mir/css/skin.css', 'lab.css', 'skin.css']) noteAll(rel, live(text(rel)), /url\(\s*['"]?(\.[^'")]+)/g);   // MIR's sheets first: the fonts are the kit's
/* the stripper must not have eaten live code: these three are certainly there */
for (const [rel, ref] of [['main.js', './rack.js'], ['index.html', './main.js'], ['rack.js', './mathworker.js']])
  assert.ok(live(text(rel), rel.endsWith('.html')).includes(ref), `the comment stripper removed ${ref} from lab/${rel} — it is over-eager and D3 is not proving anything`);
assert.ok(refs > 150, `D3 only found ${refs} relative references across lab/ — the scan has stopped seeing the source`);
/* KaTeX offers each face as woff2, then woff, then ttf; only the woff2 files are shipped, and every browser
   that can run WebGPU takes the first.  So the check is: the FIRST source of every @font-face exists. */
let faces = 0;
for (const m of text('vendor/katex/katex.min.css').matchAll(/@font-face\s*\{[^}]*src:\s*url\(([^)]+)\)/g)) { faces++; note('vendor/katex/katex.min.css', m[1].replace(/["']/g, '')); }
assert.ok(faces >= 20, `katex.min.css: only ${faces} @font-face rules parsed — the regex has drifted`);
assert.deepEqual(dangling, [], 'lab/ references a file that is not there — a 404 offline and online:\n  ' + dangling.join('\n  '));
assert.deepEqual(uncached, [], 'lab/ loads a file that the precache does not hold — it will 404 offline:\n  ' + uncached.join('\n  '));
assert.deepEqual([...new Set(beside)].sort(), Object.keys(BESIDE_LAB).sort(),
  'the ABOUT face must link BOTH LICENSE and NOTICE with "./" — they ship beside the lab (build-deploy §SHIP_EXTRA) and the site root is the library\'s, not ours');

/* D4 — CLICKS that leave the scope.  D1 has already proved nothing above /lab/ is ever LOADED; a plain <a>
   is different, because the reader chose it and a new tab is allowed to need the network.  These are
   discovered and reported rather than pinned to a fixed list (the ABOUT panel is another wave's to edit),
   but each one must at least resolve to a file that is really in the repo root. */
const ROOT = path.resolve(LAB, '..');
const outOfScope = new Set(), badRoot = [];
for (const rel of ['index.html', ...onDisk.filter((r) => /\.js$/.test(r) && !r.startsWith('vendor/'))]) {
  for (const m of live(text(rel), rel.endsWith('.html')).matchAll(/href=\\?["'](\/[^"'\\ >]*)/g)) {
    outOfScope.add(m[1]);
    if (!existsSync(path.join(ROOT, m[1].slice(1)))) badRoot.push(`lab/${rel} → ${m[1]}`);
  }
}
assert.deepEqual(badRoot, [], 'a link above /lab/ points at a file that is not in the repo root — broken online as well as off:\n  ' + badRoot.join('\n  '));
console.log(`PASS no external URL is loaded anywhere in lab/ — ${LOADERS.length} loading constructs searched, none names an absolute URL; all ${found.length} absolute URLs that appear at all are accounted for (` +
  [...why].map(([k, n]) => `${n} × ${k.split(':')[0].split(' —')[0]}`).join(', ') + `). ` +
  `${faces} KaTeX faces + ${refs} relative src/href/import references all resolve to a file that exists AND is precached. ` +
  `Above /lab/, network-only, click-initiated: ${outOfScope.size ? [...outOfScope].join(' ') : 'none — nothing in lab/ links out of scope at all'}.`);

/* ══ E.  THE UPDATE POLICY, DRIVEN ═══════════════════════════════════════════════════════════════════════ */
/* loadWorker(mount) runs lab/sw.js for real inside a stub worker global, so everything below is the shipped
   code executing, not a paraphrase of it.
   WAVE 68 · AND IT TAKES THE MOUNT.  This harness hard-coded `${origin}/lab/sw.js`, so forty-one asserts
   could only ever prove the worker correct AT THE ONE MOUNT PRODUCTION DOES NOT USE — and the case the
   suite names below in its own words ("a navigation above /lab/ … without it, opening /REPORT.md in a new
   tab would be answered with the lab's own index.html") was refused at /lab/ by a scope check that is a
   NO-OP at '/'. The sentence was right, the mount was wrong, and the whole class closes by running the
   matrix at both. `mount` ends in '/'. */
function loadWorker(mount = '/lab/') {
  const origin = 'https://host.invalid';
  const state = { caches: new Map(), fetched: [], skip: 0, claim: 0, posted: [], handlers: {} };
  class FakeCache {
    constructor() { this.m = new Map(); }
    async keys() { return [...this.m.keys()].map((u) => new Request(u)); }
    async put(req, res) { this.m.set(typeof req === 'string' ? req : req.url, res); }
    async match(req) { return this.m.get(typeof req === 'string' ? req : req.url); }
  }
  const caches = {
    async open(n) { if (!state.caches.has(n)) state.caches.set(n, new FakeCache()); return state.caches.get(n); },
    async keys() { return [...state.caches.keys()]; },
    async delete(n) { return state.caches.delete(n); },
  };
  const fetch = async (input) => {
    const req = typeof input === 'string' ? new Request(input) : input;
    const u = new URL(req.url);
    state.fetched.push({ url: req.url, cache: req.cache });
    const rel = u.pathname.startsWith(mount) ? u.pathname.slice(mount.length) : u.pathname.replace(/^\//, '');
    if (!rel || !existsSync(path.join(LAB, rel)) || statSync(path.join(LAB, rel)).isDirectory()) return new Response('', { status: 404 });
    return new Response(read(rel), { status: 200 });
  };
  const self_ = {
    location: { href: `${origin}${mount}sw.js`, origin },
    addEventListener: (t, fn) => { (state.handlers[t] ||= []).push(fn); },
    skipWaiting: () => { state.skip++; },
    registration: { active: null },
    clients: {
      claim: async () => { state.claim++; },
      matchAll: async () => [{ postMessage: (m) => state.posted.push(m) }],
    },
  };
  new Function('self', 'caches', 'fetch', swSrc)(self_, caches, fetch);
  /* getters, not a spread: `skip` and `claim` are numbers, and a snapshot of them would make every
     "did NOT call skipWaiting" assertion below pass for free — the harness would prove nothing. */
  return { LW_SW: self_.LW_SW, mount, handlers: state.handlers, self_, FakeCache,
    get skip() { return state.skip; }, get claim() { return state.claim; },
    posted: state.posted, caches: state.caches, fetched: state.fetched };
}

/* ANTI-PATTERN 6: there is no hand-written version anywhere.  The build name must be DERIVED — so the string
   it computes must not appear as a literal in its own source. */
const BUILD = SW.LW_SW.BUILD;
assert.ok(BUILD && BUILD.length >= 8, 'sw.js: no derived build name');
assert.ok(!swSrc.includes(BUILD), `sw.js: the build name "${BUILD}" appears as a literal in the source — it must be computed from the precache hashes, never typed`);
assert.ok(!/const\s+(VERSION|CACHE_VERSION|CACHE_NAME)\s*=\s*['"`]/.test(swSrc), 'sw.js: a hand-edited version constant (ANTI-PATTERN 6)');
assert.equal(SW.LW_SW.CACHE, SW.LW_SW.PREFIX + BUILD, 'sw.js: the cache name must be the prefix plus the derived build');
/* and it must actually MOVE when one byte moves, and stand still when nothing does */
const d = SW.LW_SW.digest, line = (a) => a.map(([u, h]) => u + '@' + h).join('\n');
const pc = SW.LW_SW.PRECACHE;
assert.equal(d(line(pc)), BUILD, 'sw.js: the build name is not the digest of the precache list');
assert.equal(d(line(pc)), d(line(pc)), 'digest is not deterministic');
const bumped = pc.map((e, i) => (i === 3 ? [e[0], e[1].slice(0, -1) + (e[1].slice(-1) === 'a' ? 'b' : 'a')] : e));
assert.notEqual(d(line(bumped)), BUILD, 'sw.js: changing a file content hash does not change the cache name — a stale cache would survive a deploy');
assert.notEqual(d(line(pc.slice(0, -1))), BUILD, 'sw.js: dropping a file does not change the cache name');

/* E1 — INSTALL fills the cache, never calls skipWaiting, and busts the HTTP cache by CONTENT. */
const fire = async (type, ev) => { let p; await SW.handlers[type][0]({ waitUntil: (x) => { p = x; }, ...ev }); await p; };
await fire('install', {});
assert.equal(SW.skip, 0, 'sw.js: install called skipWaiting() — that swaps a new build in under a running session, which is the one thing this worker must never do');
assert.equal(SW.posted.length, 0, 'sw.js: a FIRST install (no active worker) must announce nothing');
const cache = SW.caches.get(SW.LW_SW.CACHE);
assert.ok(cache, `sw.js: install did not open ${SW.LW_SW.CACHE}`);
assert.equal(cache.m.size, pc.length, `sw.js: install cached ${cache.m.size} of ${pc.length} files`);
for (const k of cache.m.keys()) assert.ok(!k.includes('?'), `sw.js: cached under a busted URL ${k} — it must be PUT under the clean URL or nothing will ever match it`);
assert.equal(SW.fetched.length, pc.length, 'sw.js: install fetched the wrong number of files');
for (const f of SW.fetched) {
  assert.equal(f.cache, 'reload', `sw.js: ${f.url} was fetched without cache:'reload' — a proxy could hand back yesterday's bytes`);
  const rev = new URL(f.url).searchParams.get('__rev');
  const rel = new URL(f.url).pathname.replace(/^\/lab\//, '');   // this arm is the /lab/ worker; the root mount is exercised by E4b
  assert.equal(rev, revOf(rel), `sw.js: ${rel} was busted with __rev=${rev}, its content hash is ${revOf(rel)}`);
}

/* E2 — ACTIVATE collects only OUR stale caches, and never claims. */
SW.caches.set('lw-lab-anolderbuild', new SW.FakeCache());
SW.caches.set('someone-elses-cache', new SW.FakeCache());
await fire('activate', {});
assert.equal(SW.claim, 0, 'sw.js: activate called clients.claim() — a page that started uncontrolled would begin taking assets from a build it did not boot on');
assert.ok(SW.caches.has(SW.LW_SW.CACHE), 'sw.js: activate deleted its own cache');
assert.ok(!SW.caches.has('lw-lab-anolderbuild'), 'sw.js: activate left a stale lw-lab-* cache behind');
assert.ok(SW.caches.has('someone-elses-cache'), 'sw.js: activate deleted a cache that is not ours');
assert.deepEqual(SW.posted.map((m) => m.type), ['LW_SW_ACTIVE'], 'sw.js: activate must tell the interface which build took over');
assert.equal(SW.posted[0].build, BUILD);

/* E3 — a SECOND install, with a worker already live, is an UPDATE: it announces and still does not swap. */
SW.posted.length = 0; SW.fetched.length = 0;
SW.self_.registration.active = { state: 'activated' };
await fire('install', {});
assert.equal(SW.skip, 0, 'sw.js: an update install called skipWaiting()');
assert.equal(SW.fetched.length, 0, 'sw.js: re-installing the same build refetched files it already holds');
assert.deepEqual(SW.posted.map((m) => m.type), ['LW_SW_WAITING'], 'sw.js: an update install must raise the "a new build is ready" signal the interface reads');
assert.equal(SW.posted[0].build, BUILD);

/* E4 — FETCH: cache-first over the precache, and every refusal actually refuses.  AT BOTH MOUNTS.
 * WAVE 68.  The matrix below is a function of the mount and it is run twice: at '/lab/' (./serve.sh, the
 * browser proof, `wrangler dev` before the domain is attached) and at '/' (lambdawaves.magic-commons.com,
 * which is what ships).  The refusals are the SAME LIST at both, and that is the point — at '/lab/' the
 * documents are refused by the scope check, and at '/' the scope check refuses nothing at all, so only
 * the ENTRY rule can refuse them.  A suite that ran one mount could not tell those two apart, and did not
 * for two waves: `startsWith('/')` is true of every path on the hostname.
 * WHAT CHANGED IN THE EXPECTATIONS, said plainly: 'a navigation deep in scope' used to be ANSWERED with
 * index.html and is now REFUSED.  That is the defect, not a regression — the app has no path routing, so
 * the only navigations it can answer are its own entry, and every other one is a document or a typo that
 * must reach the network and get the real 404 wrangler.jsonc asks for. */
async function fetchMatrix(W, mount) {
  const ask = async (url, init = {}) => {
    let answered = null;
    const req = { method: init.method || 'GET', url, mode: init.mode || 'cors', headers: { get: (h) => (init.headers || {})[h.toLowerCase()] || null } };
    await W.handlers.fetch[0]({ request: req, respondWith: (p) => { answered = p; } });
    return answered === null ? null : await answered;
  };
  const M = (rel) => 'https://host.invalid' + mount + rel;
  const at = `at mount ${mount}`;
  /* the precache still answers, byte for byte */
  const hit = await ask(M('rack.js'));
  assert.ok(hit, `sw.js ${at}: a precached URL was not answered from the worker`);
  /* .clone() throughout: the cache hands back THE SAME Response object every time, and reading a body
     twice throws — which is also a small proof that these really are the stored responses. */
  assert.equal(Buffer.from(await hit.clone().arrayBuffer()).length, statSync(path.join(LAB, 'rack.js')).size, `sw.js ${at}: rack.js came back the wrong length`);
  /* THE APP ENTRY — both spellings of it — is answered, which is what makes the app open offline */
  for (const entry of [mount, mount + 'index.html']) {
    const nav = await ask('https://host.invalid' + entry, { mode: 'navigate' });
    assert.ok(nav, `sw.js ${at}: a navigation to the app entry ${entry} was not answered — offline the lab would not open at all`);
    assert.equal(Buffer.from(await nav.clone().arrayBuffer()).toString('utf8').slice(0, 9), '<!doctype', `sw.js ${at}: the entry navigation must be served index.html`);
  }
  for (const [why, url, init] of [
    ['a POST',                       M('rack.js'), { method: 'POST' }],
    ['a Range request',              M('rack.js'), { headers: { range: 'bytes=0-99' } }],
    /* the cross-origin case deliberately shares our PATH, so only the origin check can catch it — a case
       with a foreign path would be refused by the scope check and prove nothing about the origin check. */
    ['a cross-origin GET at our own path', 'https://elsewhere.invalid' + mount + 'rack.js', {}],
    ['a cross-origin GET',           'https://elsewhere.invalid/x.js',   {}],
    ['an in-scope URL not precached', M('nope.js'), {}],
    ['sw.js itself',                 M('sw.js'),   {}],
    /* THE DOCUMENTS, as sub-resources AND as navigations.  At '/lab/' the scope check refuses them; at
       '/' they are INSIDE the scope and only the ENTRY rule can.  These six lines are the whole finding:
       nine target="_blank" licence links in the ABOUT face, each of which opened a second copy of the lab
       from the second launch onward — and the licence texts are the ones GPL-3.0 §4 and OFL §2 require
       a reader to be able to open. */
    ['a document beside the app',    'https://host.invalid/REPORT.md',  {}],
    ['a NAVIGATION to a document beside the app', 'https://host.invalid/REPORT.md', { mode: 'navigate' }],
    ['a NAVIGATION to /LICENSE',     'https://host.invalid/LICENSE',    { mode: 'navigate' }],
    ['a NAVIGATION to /NOTICE',      'https://host.invalid/NOTICE',     { mode: 'navigate' }],
    ['a NAVIGATION to a vendored licence text', 'https://host.invalid' + mount + 'vendor/katex/LICENSE', { mode: 'navigate' }],
    ['a NAVIGATION to a font licence', 'https://host.invalid' + mount + 'fonts/Roboto-OFL.txt', { mode: 'navigate' }],
    /* and a typo: not_found_handling "404-page" must reach the visitor, not a 200 of HTML that fails later */
    ['a NAVIGATION to a typo',       'https://host.invalid' + mount + 'no-such-page', { mode: 'navigate' }],
    ['a NAVIGATION deep in scope',   'https://host.invalid' + mount + 'anything/at/all', { mode: 'navigate' }],
  ]) assert.equal(await ask(url, init), null, `sw.js ${at}: ${why} was answered from the cache — it must go to the network and be stored nowhere`);
  assert.equal(W.caches.get(W.LW_SW.CACHE).m.size, pc.length, `sw.js ${at}: the fetch handler grew the cache — this worker must never cache at runtime`);
  return { mount, scope: W.LW_SW.SCOPE, entry: [...W.LW_SW.ENTRY] };
}
const mLab = await fetchMatrix(SW, '/lab/');
/* E4b — THE MOUNT THAT SHIPS.  A second worker at the origin root, installed for real, same matrix. */
const SWROOT = loadWorker('/');
await (async () => { let p; await SWROOT.handlers.install[0]({ waitUntil: (x) => { p = x; } }); await p; })();
assert.equal(SWROOT.LW_SW.SCOPE, '/', 'sw.js: at an origin root the scope must be "/" — if it is not, this arm is not testing what ships');
assert.equal(SWROOT.caches.get(SWROOT.LW_SW.CACHE).m.size, pc.length, 'sw.js: the root-mounted worker did not precache the build');
const mRoot = await fetchMatrix(SWROOT, '/');
assert.equal(SWROOT.skip, 0, 'sw.js: the root-mounted worker called skipWaiting()');
assert.deepEqual([mLab.scope, mRoot.scope], ['/lab/', '/'], 'sw.js: the two mounts did not resolve to the two scopes');
const runtime = SW.LW_SW.NEVER_CACHE_AT_RUNTIME.map(([k]) => k).join(' | ');
/* wave 68: the fourth rule used to be spelled "scope" and it is now spelled by what it actually
   refuses — a navigation that is not the app entry — because a path prefix stopped refusing anything
   the day the lab moved to its own origin.  The prose and the mechanism have to name the same rule. */
for (const rule of ['GET', 'Range', 'cross-origin', 'navigation', '§1']) assert.ok(runtime.includes(rule), `sw.js: NEVER_CACHE_AT_RUNTIME does not document "${rule}"`);

/* E5 — the ONLY way a session's build can end is the interface asking, on the user's behalf. */
assert.equal(SW.skip, 0);
let reply = null;
SW.handlers.message[0]({ data: { type: 'LW_SW_HELLO' }, ports: [{ postMessage: (m) => { reply = m; } }] });
assert.deepEqual(reply, { type: 'LW_SW_BUILD', build: BUILD, files: pc.length, cache: SW.LW_SW.CACHE }, 'sw.js: LW_SW_HELLO must answer with the build the session is running');
SW.handlers.message[0]({ data: { type: 'LW_SW_NOT_A_THING' }, ports: [] });
assert.equal(SW.skip, 0, 'sw.js: an unknown message took the update');
SW.handlers.message[0]({ data: { type: 'LW_SW_SKIP_WAITING' }, ports: [] });
assert.equal(SW.skip, 1, 'sw.js: LW_SW_SKIP_WAITING is the interface\'s explicit "the user said yes" and must be the one thing that takes the update');
/* on the CODE, not the prose — the header of sw.js discusses skipWaiting and clients.claim at length. */
const swCode = live(swSrc);
assert.equal((swCode.match(/skipWaiting\(\)/g) || []).length, 1, 'sw.js: skipWaiting() appears more than once in the code — there must be exactly one path to it, the user-driven message');
assert.ok(!/clients\.claim\(/.test(swCode), 'sw.js: clients.claim() is in the code — a page that started uncontrolled would begin taking assets from a build it did not boot on');
assert.ok(!/\bsetTimeout\b|\bsetInterval\b/.test(swCode), 'sw.js: a timer in a service worker is a build swapping itself in on a clock');
assert.ok(!/self\.skipWaiting\(\)\s*;?\s*\}?\s*\)?\s*;?\s*$/m.test(swCode.split('addEventListener(\'message\'')[0]), 'sw.js: skipWaiting() is reachable outside the message handler');

console.log(`PASS update policy executed, not described: install precaches ${pc.length} files with cache:'reload' + ?__rev=<content hash> and does NOT skipWaiting; ` +
  `activate collects only stale lw-lab-* and does NOT claim; fetch is cache-first over the precache and refuses POST / Range / cross-origin / out-of-scope / unlisted, growing nothing; ` +
  `the fetch matrix ran AT BOTH MOUNTS — ${mLab.mount} (scope ${mLab.scope}) and ${mRoot.mount} (scope ${mRoot.scope}, which is what ships) — and a navigation is answered ONLY at the app entry (${mRoot.entry.join(' ')}), so /LICENSE, /NOTICE, /REPORT.md, the six licence texts and a typo all reach the network at either address; ` +
  `the one path to a new build is the interface's LW_SW_SKIP_WAITING. Cache name ${SW.LW_SW.CACHE}, derived — the string appears nowhere in the source.`);

/* ══ F.  THE FONT LICENCES, READ OUT OF THE BINARIES (wave 59) ═══════════════════════════════════════════
 * A licence audit found the one defect in this tree with real consequences: our five-glyph subset of gluk's
 * Spinwerad is a MODIFIED VERSION in the SIL OFL's own words ("any derivative made by adding to, deleting,
 * or substituting … or by changing formats"), "spinwerad" is a Reserved Font Name declared twice — in
 * fonts/Spinwerad-OFL.txt:2 AND in the original binary's own nameID 13 — and OFL §3 forbids a Modified
 * Version from using an RFN as "the primary font name as presented to the users".  The TERMINATION clause
 * makes the licence "null and void if any of the above conditions are not met", so this was not cosmetic:
 * the grant that lets the file ship at all had lapsed.  Un-subsetting would not have fixed it (a WOFF2
 * conversion is still a Modified Version, and it costs 695 KB); RENAMING does, and that is what shipped.
 *
 * THE CHECK IS ON THE BYTES, not on filenames and not on the .txt beside them, because that is exactly the
 * pair that had drifted.  Node has brotli, so the WOFF2 `name` table is decoded here by hand — the same
 * road pwa.test already takes with the PNG icons — and the CSS families are read out of skin.css and
 * required to BE those names.  A future wave that re-subsets a font and forgets to rename it fails here. */
const TAG63 = ('cmap|head|hhea|hmtx|maxp|name|OS/2|post|cvt |fpgm|glyf|loca|prep|CFF |VORG|EBDT|EBLC|gasp|hdmx|kern|LTSH|PCLT|VDMX|vhea|vmtx|BASE|GDEF|GPOS|GSUB|EBSC|JSTF|MATH|CBDT|CBLC|COLR|CPAL|SVG |sbix|acnt|avar|bdat|bloc|bsln|cvar|fdsc|feat|fmtx|fvar|gvar|hsty|just|lcar|mort|morx|opbd|prop|trak|Zapf|Silf|Glat|Gloc|Feat|Sill').split('|');
/** every name record of a WOFF2 face, by nameID, Windows/Unicode records preferred — decoded from the file */
function woff2Names(rel) {
  const buf = read(rel);
  assert.equal(buf.toString('latin1', 0, 4), 'wOF2', `lab/${rel} is not a WOFF2 file`);
  const numTables = buf.readUInt16BE(12), comp = buf.readUInt32BE(20);
  let p = 48, off = 0; const dir = [];
  const base128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const b = buf[p++]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return v; } throw new Error('bad UIntBase128'); };
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++], idx = flags & 0x3f, tv = (flags >> 6) & 3;
    const tag = idx === 63 ? buf.toString('latin1', (p += 4) - 4, p) : TAG63[idx];
    const orig = base128();
    /* glyf and loca are transformed unless version 3; every other table is transformed only above 0 */
    const len = ((tag === 'glyf' || tag === 'loca') ? tv !== 3 : tv !== 0) ? base128() : orig;
    dir.push({ tag, off, len }); off += len;
  }
  const t = dir.find((d) => d.tag === 'name');
  assert.ok(t, `lab/${rel} has no name table`);
  const data = brotliDecompressSync(buf.subarray(p, p + comp));
  const n = data.subarray(t.off, t.off + t.len), count = n.readUInt16BE(2), strOff = n.readUInt16BE(4), out = {};
  for (let i = 0; i < count; i++) {
    const r = 6 + i * 12, pid = n.readUInt16BE(r), nid = n.readUInt16BE(r + 6), l = n.readUInt16BE(r + 8), o = n.readUInt16BE(r + 10);
    const raw = Buffer.from(n.subarray(strOff + o, strOff + o + l));
    out[nid] = (pid === 3 || pid === 0) && !(l & 1) ? raw.swap16().toString('utf16le') : raw.toString('latin1');
  }
  return out;
}
/* Every Reserved Font Name this tree ships a claim to, gathered from BOTH places one can be declared:
   the licence texts, and the faces' own nameID 13.  Nothing is hard-coded — a new font brings its own. */
const RFN = new Set();
const licenceTexts = onDisk.filter(LICENCE);
for (const rel of licenceTexts)
  for (const m of text(rel).matchAll(/Reserved Font Names?\s+((?:"[^"]+"|[A-Za-z_][\w ]*?)(?:\s*,\s*(?:"[^"]+"|[A-Za-z_][\w]*))*)(?=\.|\s+and\s|\n|$)/g))
    for (const nm of m[1].split(/\s*,\s*/)) { const v = nm.replace(/^"|"$/g, '').trim(); if (v && v.toLowerCase() !== 'the' && !/^is /.test(v)) RFN.add(v); }
const FACES = onDisk.filter((r) => /\.woff2$/i.test(r)).sort();
const ours = FACES.filter((r) => r.startsWith('fonts/')), vendored = FACES.filter((r) => !r.startsWith('fonts/'));
assert.equal(ours.length, 3, `expected the three subset interface faces in lab/fonts/, found ${ours.length}`);
for (const root of ['vendor/katex/fonts/', 'mir/shell/vendor/katex/fonts/']) {
  const faces = vendored.filter((r) => r.startsWith(root));
  assert.equal(faces.length, 20, `expected the twenty unmodified KaTeX faces under ${root}, found ${faces.length}`);
}
assert.equal(vendored.length, 40, `expected two complete sets of twenty unmodified KaTeX faces, found ${vendored.length}`);
for (const rel of vendored) for (const m of (woff2Names(rel)[13] || '').matchAll(/Reserved Font Names?\s+([\w]+)/g)) RFN.add(m[1]);
assert.ok(RFN.size >= 13, `only ${RFN.size} Reserved Font Names found across the licences and the faces — the scan has stopped reading them`);

/* THE THREE SUBSET FACES ARE MODIFIED VERSIONS, so no USER-FACING name of theirs may be a Reserved Font
   Name.  nameIDs 1 / 3 / 4 / 6 / 16 / 17 / 18 are the family, the unique id, the full name, the PostScript
   name and the typographic names — everything a user or a stylesheet ever sees.  nameID 13 is the LICENCE
   DESCRIPTION and is deliberately NOT checked: LW Title keeps gluk's verbatim, which is the acknowledgement
   OFL §4 permits and the reason the file can say what it derives from at all. */
const NAMEIDS = [1, 3, 4, 6, 16, 17, 18];
const breaches = [], faceName = {};
for (const rel of ours) {
  const nm = woff2Names(rel); faceName[rel] = nm[1];
  assert.ok(nm[1], `lab/${rel} has no nameID 1`);
  for (const id of NAMEIDS) for (const r of RFN)
    if (nm[id] && nm[id].toLowerCase().includes(r.toLowerCase()))
      breaches.push(`lab/${rel} nameID ${id} = "${nm[id]}" contains the Reserved Font Name "${r}"`);
}
assert.deepEqual(breaches, [], 'a SUBSET font ships under a Reserved Font Name — SIL OFL §3 forbids it and the TERMINATION clause voids the grant. Rename the derivative (fonts/Spinwerad-SOURCE.txt is the worked example); un-subsetting does NOT fix it:\n  ' + breaches.join('\n  '));

/* AND THE CSS SAYS THE SAME NAME THE BINARY DOES.  Half of the original defect was that skin.css declared
   `font-family: 'Spinwerad'` — the RFN — as the name presented to users; a rename in the binary alone
   would have left that half standing. */
/* 2026-09-10: the faces are MIR's (lab/mir/css/skin.css), which reaches the fonts as ../../fonts/ */
const skin = text('mir/css/skin.css'), faceRules = [...skin.matchAll(/@font-face\s*\{[^}]*font-family:\s*'([^']+)'[^}]*url\('(?:\.\.\/\.\.\/|\.\/)([^']+)'\)/g)].map((m) => [m[1], m[2]]);
assert.equal(faceRules.length, 3, `mir/css/skin.css: expected three @font-face rules for lab/fonts/, parsed ${faceRules.length}`);
for (const [fam, url] of faceRules) {
  assert.ok(faceName[url] !== undefined, `skin.css: @font-face '${fam}' names ./${url}, which is not one of the three faces in lab/fonts/`);
  assert.equal(fam, faceName[url], `skin.css: @font-face declares '${fam}' but lab/${url}'s own nameID 1 is "${faceName[url]}" — the family a user sees and the name in the binary must be the same string, or a rename has only been done in one of the two places OFL §3 talks about`);
}
/* THE TWENTY KATEX FACES ARE UNMODIFIED, which is WHY their RFNs may stand — and it is also why they need
   their own licence, which NOTICE claimed was MIT and which did not ship at all before this wave. */
const katexOFL = 'vendor/katex/fonts/OFL.txt';
assert.ok(existsSync(path.join(LAB, katexOFL)), `${katexOFL} is missing: the twenty KaTeX faces are SIL OFL 1.1, not MIT, and OFL §2 requires the licence to travel with each copy`);
const kt = text(katexOFL);
assert.ok(/SIL OPEN FONT LICENSE Version 1\.1/.test(kt), `${katexOFL} does not contain the OFL body`);
for (const holder of ['Design Science', 'Khan Academy'])
  assert.ok(kt.includes(holder), `${katexOFL} does not name the copyright holder ${holder} — the faces' own nameID 13 names both`);
const katexRFN = new Set();
for (const rel of vendored) for (const m of (woff2Names(rel)[13] || '').matchAll(/Reserved Font Names?\s+([\w]+)/g)) katexRFN.add(m[1]);
for (const r of katexRFN) assert.ok(kt.includes(r), `${katexOFL} does not name the Reserved Font Name "${r}" that a shipped face declares`);
/* NOTICE must not still call them MIT, and must not name a font file that is no longer here. */
const notice = readFileSync(path.join(LAB, '..', 'NOTICE'), 'utf8');
assert.ok(/KaTeX fonts[\s\S]{0,400}SIL Open Font License/.test(notice), 'NOTICE: the KaTeX fonts entry must say SIL OFL, not MIT — the faces carry their own nameID 13 and it is not the MIT licence that covers KaTeX\'s code');
for (const rel of ours) assert.ok(notice.includes('lab/' + rel), `NOTICE does not name the shipped file lab/${rel}`);
for (const gone of ['Spinwerad.ttf', 'SpinweradC.ttf', 'Roboto.ttf', 'Spinwerad-title.woff2'])
  assert.ok(!notice.includes(gone), `NOTICE still names ${gone}, which is not in the tree — a NOTICE that is wrong about what is distributed is worse than a thin one`);
console.log(`PASS the font licences, read out of the binaries: ${RFN.size} Reserved Font Names declared across ${licenceTexts.length} licence texts and ${vendored.length} vendored faces; the ${ours.length} SUBSET faces (${ours.map((r) => faceName[r]).join(', ')}) use none of them in any user-facing name, and skin.css's three @font-face families are those same three strings; the ${vendored.length} unmodified KaTeX faces keep theirs and now ship ${katexOFL} naming both copyright holders and all ${katexRFN.size} of them.`);

/* ══ G.  THE MATH FACE COVERS WHAT THE LAB SETS IN IT (wave 69) ══════════════════════════════════════════
 * `fonts/STIXTwoMath-SOURCE.txt` has said since the face was cut that a glyph outside the subset falls
 * back SILENTLY to a serif and looks almost right — which is worse than wrong.  Wave 69 put the face to
 * work in about a hundred places, so that sentence had to stop being a warning nobody can run.
 *   THE MARKER IS THE SCAN'S HANDLE.  kit.js writes mathematics as `<m>…</m>`, one convention for a
 * label, a window title, a note's innerHTML and a live formula's fixed parts alike, so ONE regex over
 * `lab/**` finds every character this tree asks the face for.  The cmap comes out of the WOFF2 itself —
 * the same road §F takes for the `name` table, brotli and all — because the .txt beside a font is
 * exactly the pair that had already drifted: the old prose list claimed `'`, `"` and the Latin
 * subscripts ₓₙₗₘₖ and the shipped binary carried none of the five.
 *   BLOCK COMMENTS ARE STRIPPED FIRST, and that is not a convenience: kit.js documents the convention
 * BY USING IT, so its own doc block would otherwise report `?`, `§` and a backtick as UI. */
function woff2Cmap(rel) {
  const buf = read(rel);
  assert.equal(buf.toString('latin1', 0, 4), 'wOF2', `lab/${rel} is not a WOFF2 file`);
  const numTables = buf.readUInt16BE(12), comp = buf.readUInt32BE(20);
  let p = 48, off = 0; const dir = [];
  const base128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const b = buf[p++]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return v; } throw new Error('bad UIntBase128'); };
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++], idx = flags & 0x3f, tv = (flags >> 6) & 3;
    const tag = idx === 63 ? buf.toString('latin1', (p += 4) - 4, p) : TAG63[idx];
    const orig = base128();
    const len = ((tag === 'glyf' || tag === 'loca') ? tv !== 3 : tv !== 0) ? base128() : orig;
    dir.push({ tag, off, len }); off += len;
  }
  const t = dir.find((d) => d.tag === 'cmap');
  assert.ok(t, `lab/${rel} has no cmap table`);
  const data = brotliDecompressSync(buf.subarray(p, p + comp));
  const c = data.subarray(t.off, t.off + t.len), n = c.readUInt16BE(2), out = new Set();
  /* the best subtable: a format 12 (full Unicode) if the face has one, else the format 4 BMP table */
  let best = null;
  for (let i = 0; i < n; i++) {
    const r = 4 + i * 8, pid = c.readUInt16BE(r), eid = c.readUInt16BE(r + 2), o = c.readUInt32BE(r + 4);
    const fmt = c.readUInt16BE(o);
    const unicode = pid === 0 || (pid === 3 && (eid === 1 || eid === 10));
    if (!unicode) continue;
    if (fmt === 12 && (!best || best.fmt !== 12)) best = { fmt, o };
    else if (fmt === 4 && !best) best = { fmt, o };
  }
  assert.ok(best, `lab/${rel} has no Unicode cmap subtable`);
  if (best.fmt === 12) {
    const groups = c.readUInt32BE(best.o + 12);
    for (let i = 0; i < groups; i++) { const r = best.o + 16 + i * 12;
      for (let u = c.readUInt32BE(r), e = c.readUInt32BE(r + 4); u <= e; u++) out.add(u); }
  } else {
    const seg = c.readUInt16BE(best.o + 6) >> 1, endO = best.o + 14, startO = endO + seg * 2 + 2;
    const deltaO = startO + seg * 2, rangeO = deltaO + seg * 2;
    for (let i = 0; i < seg; i++) {
      const end = c.readUInt16BE(endO + i * 2), start = c.readUInt16BE(startO + i * 2);
      if (start === 0xffff) continue;
      const ro = c.readUInt16BE(rangeO + i * 2), delta = c.readInt16BE(deltaO + i * 2);
      for (let u = start; u <= end && u !== 0x10000; u++) {
        let g;
        if (ro === 0) g = (u + delta) & 0xffff;
        else { const gi = rangeO + i * 2 + ro + (u - start) * 2; if (gi + 1 >= c.length) continue; g = c.readUInt16BE(gi); if (g) g = (g + delta) & 0xffff; }
        if (g) out.add(u);
      }
    }
  }
  return out;
}
const MATH_FACE = 'fonts/STIXTwoMath-subset.woff2';
const mathCmap = woff2Cmap(MATH_FACE);
assert.ok(mathCmap.size >= 150, `the math face's cmap decoded to only ${mathCmap.size} codepoints — the reader has stopped reading it`);
/* the glyph list beside the face IS the subsetter's --text-file, so it cannot drift from the binary */
const glyphList = text('fonts/STIXTwoMath-glyphs.txt');
for (const ch of glyphList) if (ch !== '\n') assert.ok(mathCmap.has(ch.codePointAt(0)),
  `fonts/STIXTwoMath-glyphs.txt asks for U+${ch.codePointAt(0).toString(16).toUpperCase()} and the shipped face does not carry it — re-run the subset command in STIXTwoMath-SOURCE.txt`);

const M_RUN_RE = /<m>([\s\S]*?)<\/m>/g;
const stripBlockComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ');
const mathFiles = onDisk.filter((r) => /\.(js|html|css)$/.test(r) && !r.startsWith('vendor/'));
const uncovered = new Map(); let runs = 0; const seen = new Set();
for (const rel of mathFiles) {
  const src = stripBlockComments(text(rel));
  for (const m of src.matchAll(M_RUN_RE)) {
    runs++;
    const plain = m[1].replace(/<[^>]*>/g, '');                 // <sub>/<sup>/<b> inside a run are markup, not glyphs
    for (const ch of plain) {
      const u = ch.codePointAt(0);
      seen.add(u);
      if (u === 10 || u === 13) continue;
      if (!mathCmap.has(u)) {
        const k = `U+${u.toString(16).toUpperCase().padStart(4, '0')} ${JSON.stringify(ch)}`;
        if (!uncovered.has(k)) uncovered.set(k, new Set());
        uncovered.get(k).add(rel);
      }
    }
  }
}
assert.ok(runs >= 40, `only ${runs} <m> runs found across lab/ — the math face was put to work in about a hundred places, so the scan has stopped finding them`);
assert.deepEqual([...uncovered].map(([k, v]) => k + ' in ' + [...v].sort().join(', ')), [],
  'A CHARACTER IS SET IN THE MATH FACE THAT THE SHIPPED SUBSET DOES NOT CARRY.  The browser falls back to a serif SILENTLY and it looks almost right, which is worse than wrong. Extend lab/fonts/STIXTwoMath-glyphs.txt, re-run the subset command in STIXTwoMath-SOURCE.txt, and state the new byte cost there:\n  ' + [...uncovered].map(([k, v]) => k + ' in ' + [...v].sort().join(', ')).join('\n  '));
console.log(`PASS the math face covers what the lab sets in it: ${runs} <m> runs across ${mathFiles.length} files ask for ${seen.size} distinct characters, and all of them are in the ${mathCmap.size}-codepoint subset (${read(MATH_FACE).length} bytes); the glyph list beside the face is the subsetter's own --text-file and every codepoint in it is in the binary.`);

/* ══ WHAT THE RACK WAVE ACTUALLY ADDED (wave 56) ═════════════════════════════════════════════════════
 * This file owns nothing in index.html, rack.js or main.js, and until wave 56 the block that stood here
 * PRESCRIBED the client wiring.  Three of its four items shipped as written; the fourth did not, and the
 * adversarial review of 2026-09-05 §2.5 is why.  What is in the tree now:
 *
 * 1. lab/index.html <head> — the manifest link, icon.svg + icon-192 + apple-touch-icon, the two
 *    *-web-app-capable metas, apple-mobile-web-app-title, apple-mobile-web-app-status-bar-style=default,
 *    and <meta id="themeColor" name="theme-color" content="#070a0f">.  AS PRESCRIBED.
 * 2. lab/index.html — `color-scheme` is now "light dark".  It said "dark" and the shipped theme is LIGHT.
 *    AS PRESCRIBED.
 * 3. lab/rack.js setTheme() — #themeColor follows the RESOLVED theme (#eef1f6 light / #070a0f dark), so
 *    the chrome colour tracks a live setting the way a manifest never can.  AS PRESCRIBED.
 * 4. lab/main.js — NOT as prescribed.  The snippet that stood here had three holes whose failure mode is
 *    silence: it listened for no `message`, so §3's LW_SW_WAITING announcement was dead code under the
 *    very wiring this file specified; it read `reg.waiting` and `updatefound` but never `reg.installing`,
 *    so a worker already installing when register() resolved was never offered; and it hung the whole
 *    thing on addEventListener('load') AFTER an awaited async boot(), which on a slow WebGPU start is
 *    added when `load` has already fired.  main.js reads all three worker states, listens for the
 *    announcement (and waits for `waiting` to catch up, because the message is sent from inside install's
 *    waitUntil when `registration.waiting` is still null), branches on document.readyState, and gives the first
 *    field a quiet lead before the whole-app precache begins in idle time.
 *    IT ALSO DOES NOT RELOAD BLINDLY.  skipWaiting() re-points EVERY client in scope, so a page cannot
 *    keep this file's ONE LAW by reloading on `controllerchange`: the tab that pressed would take the
 *    unsaved state of every other tab with it.  rack.js's `swClient` decides instead — the tab that ASKED
 *    reloads once, a tab that did not ask is TOLD and keeps running.  See ANTI-PATTERNS 15.
 *    The registration argument and its scope are BOTH RELATIVE ('./sw.js', { scope: './' }): the lab
 *    deploys under a path, and an absolute '/sw.js' is how a root scope sneaks back in.
 * 5. THE AUTOMATION BYPASS, which nothing prescribed and which the browser gate needs: main.js does not
 *    register under `navigator.webdriver` unless `?sw=1` says so (and `?sw=0` always refuses).  A worker
 *    installed on the gate's origin would serve every later navigation out of a cache, so one stale §1
 *    entry would make the whole browser suite measure yesterday's build.  It is the photosensitivity
 *    warning's own three-input shape (rack.js `warning.needed`).
 *
 * NOTE on `apple-mobile-web-app-status-bar-style`: "default" is what shipped, because only skin.css's
 * PHONE block reads env(safe-area-inset-*).  "black-translucent" gives a fuller bleed but puts the iOS
 * clock over #title and #badges on an iPad until those rules get their own safe-area inset. */
