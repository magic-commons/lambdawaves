#!/usr/bin/env node
/* build-deploy.mjs — ASSEMBLE THE SITE, PROVE IT, AND SAY WHAT IT COSTS.
 *
 *   node tools/build-deploy.mjs            assemble dist/, verify it, print the payload
 *   node tools/build-deploy.mjs --no-test  skip the tests/pwa.test.mjs subprocess (faster while iterating)
 *   node tools/build-deploy.mjs --quiet    the verdicts and the payload only, no per-file listing
 *
 * Node stdlib only — this repo has no dependencies and the thing that ships it must not be the exception.
 * (`wrangler` is a devDependency of the DEPLOY, installed by npm and never imported here; the no-deps
 * charter is about the shipped app, and dist/ still contains nothing but the lab. DEPLOY.md says so.)
 *
 * ── WHAT THIS IS FOR ───────────────────────────────────────────────────────────────────────────────────
 * λWAVES is a static application.  Shipping it is therefore ONE command and ONE login, and the only reason
 * it is ever more than that is that nobody wrote down which bytes go and which stay.  This writes that down
 * as code: dist/ IS the answer, and everything below the assembly is a proof that the answer is complete.
 * It is the dossier's §29 steps 1–3 and 5 (inventory, path audit, build the deployment directory, robots)
 * executed on every run rather than once.
 *
 * ── THE ADDRESS: A SUBDOMAIN, AND WHY THAT DECIDES EVERYTHING BELOW ────────────────────────────────────
 * λWAVES ships to its OWN HOSTNAME — lambdawaves.magic-commons.com, staged first on workers.dev (dossier
 * §1, §3, §23).  Magic Commons is the future institution and λWAVES is the first exhibit; the parent site
 * should LINK to the application, not contain its infrastructure, so the app keeps an independent release
 * cycle.  The app therefore sits at the ORIGIN ROOT, and BASE_PATH is empty.
 *
 * THAT IS A REVERSAL OF AN EARLIER DESIGN, AND THE REASON IT IS SAFE IS WORTH KEEPING. ──────────────────
 *   A service worker's scope is the directory it is SERVED FROM, and service workers PERSIST on the
 *   visitor's machine: they are not a cache you can purge from the server, and they outlive the deploy
 *   that installed them.  sw.js §5 answers every in-scope NAVIGATION with the lab's index.html.  So a
 *   root-scoped worker on a SHARED origin would go on serving λWAVES, from other people's laptops, for
 *   URLs that later belong to a sibling app — and the only remedy is a tombstone worker whose whole job is
 *   to unregister its predecessor, plus the hope that everyone comes back to collect it.
 *
 *   A PER-APP SUBDOMAIN MAKES THE ROOT SCOPE CORRECT.  The isolation now comes from the ORIGIN, not from a
 *   directory: lambdawaves.magic-commons.com is λWAVES and nothing else, so "the whole origin" is exactly
 *   the right amount of territory for this worker to own.  The trap above is not gone — it is out of
 *   reach, and it comes back the instant λWAVES is moved under a shared origin's path.  Hence OWN_ORIGIN.
 *
 * ── WHY A COPY, AND NOT A REWRITE ──────────────────────────────────────────────────────────────────────
 * The lab is deliberately RELATIVE — every import is "./…", and the manifest's start_url and scope are "./"
 * — which is what lets the same bytes run at 127.0.0.1:8700/lab/, on the LAN, under `wrangler dev`, and at
 * an origin root.  So the whole build is a move, and §V2 re-proves that by walking every reference in the
 * assembled tree rather than assuming it — including the one member of the manifest for which "./" is NOT
 * relative to the manifest (see MANIFEST IDENTITY in §V2).  Nothing in lab/ is rewritten, ./serve.sh and
 * ./test.sh keep working, and the dossier's "preserve a rational existing structure, avoid unnecessary
 * migration churn" (§7) and "preserving working behavior" (§35) are honoured by construction.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, copyFileSync, statSync, existsSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ══ THE THREE CONSTANTS ════════════════════════════════════════════════════════════════════════════════
 *
 * BASE_PATH — where the app sits under its hostname.  EMPTY means the origin root, which is what a per-app
 * subdomain wants.  Set it to e.g. 'joshs-library/lambdawaves' only if λWAVES is ever moved under a SHARED
 * origin — and then set OWN_ORIGIN to false, because on a shared origin the root scope is the trap in the
 * header above.  This one line is the whole setting; nothing else in the tool and nothing at all in lab/
 * needs to change to move the site.  ASCII only: 'λwaves' percent-encodes to %CE%BB, which is what a
 * browser copies, what a chat client mangles and what nobody can type.  λWAVES is the DISPLAY name — it is
 * the <title>, the manifest name and the mark — and none of that has to be in the URL (dossier §3).
 *
 * OWN_ORIGIN — true when the deployment hostname serves λWAVES AND NOTHING ELSE
 * (lambdawaves.magic-commons.com, or lambdawaves.<account>.workers.dev).  This is what makes an empty
 * BASE_PATH correct rather than dangerous.  If λWAVES ever shares a hostname with another application,
 * this is false and BASE_PATH must be non-empty.
 *
 * ALPHA_UNLISTED — the dossier's visibility model (§4, §26): "publicly reachable, but not publicly
 * advertised".  Emits robots.txt and an X-Robots-Tag.  UNLISTED IS NOT PRIVATE and this is NOT access
 * control: anyone with the URL can open it, and that is intended.  Flip to false on the day the Alpha is
 * announced.  If real restriction is ever wanted it is Cloudflare Access, evaluated separately. */
const BASE_PATH      = '';
const OWN_ORIGIN     = true;
const ALPHA_UNLISTED = true;
/* DEPLOY_ORIGIN — the scheme + hostname the app is ANNOUNCED at, and the only thing in this tree that
 * needs it is `og:image`: a link unfurler is a crawler on another machine with no base URL to resolve
 * against, so that one meta tag must be absolute, and being absolute is exactly what makes it rot.
 * WAVE 68: it had rotted.  It still named `magic-commons.com/joshs-library/lambdawaves/` — the PATH
 * architecture this deploy reversed — so the card 404'd for every unfurler; and TWO separate comments
 * (lab/index.html:20-21 and tests/pwa.test.mjs:355) claimed §V3 checked it against BASE_PATH while
 * `grep -c "og:" tools/build-deploy.mjs` answered 0.  §V3 checks it now, which is the only way a claim
 * like that stays true.  THE CUSTOM DOMAIN AND NOT THE workers.dev STAGE, deliberately: the card is for
 * the address the Alpha is announced at, and during staging ALPHA_UNLISTED's robots.txt forbids the
 * unfurl anyway (Slackbot, Twitterbot, Discordbot and facebookexternalhit all read it), so a staging
 * URL in this constant would buy nothing and be one more thing to remember to change back. */
const DEPLOY_ORIGIN  = 'https://lambdawaves.magic-commons.com';

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB  = path.join(ROOT, 'lab');
const DIST = path.join(ROOT, 'dist');
const ARGS = new Set(process.argv.slice(2));
const RUN_TEST = !ARGS.has('--no-test');
const QUIET    = ARGS.has('--quiet');

const SEGS = BASE_PATH.split('/').filter(Boolean);
const SITE = SEGS.length ? SEGS.join('/') + '/' : '';       // dist-relative prefix; '' at an origin root
const URLPATH = '/' + SITE;                                 // what a browser sees
const at = (rel) => SITE + rel;                             // a lab-relative path, placed in dist/
const INDEX = at('index.html');

/* ── THE MANIFEST OF THE SHIP ───────────────────────────────────────────────────────────────────────────
 * Everything under lab/ goes, minus DROP; plus SHIP_EXTRA from the repo root; plus generated _headers,
 * _redirects and robots.txt.  Everything else in the repo stays, and the reason is
 * written beside it so a later wave can argue with it instead of guessing. */
const DROP = [
  ['smoke.html', 'a diagnostic bench that boots the WebGPU field with no rack and no PHOTOSENSITIVITY gate. ' +
                 'sw.js already calls it "a bench page for the browser proof, not part of the lab"; ' +
                 'tests/smoke.mjs opens it from the DEV server (lab/smoke.html), never from dist/, so dropping it ' +
                 'costs nothing and keeps an ungated strobing page off a public URL.'],
];
/* THE DOCUMENTS SHIP.  Dossier §8 and acceptance criterion 8: /LICENSE, /NOTICE and /REPORT.md must be
 * reachable at the deployment root.  This REVERSES an earlier decision here to withhold REPORT.md as an
 * internal notebook — the dossier's judgement, and the better one: a build log is an honest thing for a
 * curious reader to find, and §25 says deployment must not casually remove acknowledgement material.
 * Note what §8 could not know: wave 55 DELIBERATELY removed the three site-root links from the ABOUT face
 * (they 404ed under /lab/ on the dev server).  So these files are reachable but no longer linked — and now
 * that λWAVES owns its origin, a root-relative link would resolve again if a later wave restores one. */
const SHIP_EXTRA = [
  ['LICENSE',      'Apache-2.0 §4(a): a browser that runs lab/*.js is a recipient of the work in source form, so the copy of the Licence travels with it. Dossier §8, §25.'],
  ['NOTICE',       'Apache-2.0 §4(d): the NOTICE text must accompany the distribution. Dossier §8, §25.'],
  ['REPORT.md',    'the lab notebook — the laws, the constants, the measured numbers and the named proofs. Dossier §8 and acceptance criterion 8 want /REPORT.md to work. 226 KB, never loaded by the running lab, never precached (a .md by rule), so it costs a reader nothing unless they ask for it.'],
  ['CHANGELOG.md', 'the release history, generated from REPORT.md by tools/changelog.mjs. Dossier §15 makes it the traceability record a tester quotes ("the VORTEX issue happened in v0.3.1-alpha"), which is only useful if it is reachable from the deployed address.'],
];
/* NOT SHIPPED, and why:
 *   research/      gigabytes of rounds and probes; not the app, and not small.
 *   tests/ tools/  the proofs and the build; a reader needs neither, and tools/ names local absolute paths.
 *   docs/          the UI law, written to the builders.
 *   serve*.sh/py   dev servers that hardcode a path into the MANDELBROT checkout.
 *   .tmp/ .git/    scratch (15 MB) and history. */

/* ── THE FILES THE SERVICE WORKER DELIBERATELY DOES NOT PRECACHE ────────────────────────────────────────
 * sw.js §NEVER_PRECACHE is the authority; this is the same policy as a predicate so §V1 can classify a file
 * in dist/ that is absent from the precache list as EXPECTED rather than as a hole.  tests/pwa.test.mjs
 * proves the predicate and sw.js's prose still agree — that check is not repeated here. */
const NOT_PRECACHED = (labRel) =>
  labRel === 'sw.js' || /\.(md|txt)$/i.test(labRel) || labRel === 'vendor/katex/LICENSE';

/* Deploy-only files: correctly absent from the precache, because they are not in lab/ at all. */
const DEPLOY_ONLY = new Set(['_headers', '_redirects', 'robots.txt', ...SHIP_EXTRA.map(([f]) => at(f))]);

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
const problems = [];
const notes    = [];
const fail = (section, msg) => problems.push({ section, msg });
const note = (msg) => notes.push(msg);
const walk = (dir, base = dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, base, out);
    else out.push(path.relative(base, f).split(path.sep).join('/'));
  }
  return out;
};
const rev  = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12);
const kb   = (n) => n >= 1048576 ? (n / 1048576).toFixed(2) + ' MiB' : (n / 1024).toFixed(1) + ' KiB';
const rule = (t) => console.log('\n' + t + ' ' + '─'.repeat(Math.max(0, 100 - t.length)));

/* ══ 1.  ASSEMBLE ═══════════════════════════════════════════════════════════════════════════════════════ */
rule('1 · ASSEMBLE');
if (!existsSync(LAB)) { console.error('no lab/ — run this from the λWAVES repo.'); process.exit(2); }
if (existsSync(DIST)) {
  if (lstatSync(DIST).isSymbolicLink()) { console.error('dist/ is a symlink; refusing to touch it.'); process.exit(2); }
  rmSync(DIST, { recursive: true, force: true });
}
mkdirSync(DIST, { recursive: true });

/* THE SCOPE STATEMENT — the one line that decides whether the layout is correct or a trap. */
if (!SITE && OWN_ORIGIN)
  console.log('the app IS the origin root, which is CORRECT here: λWAVES is deployed to its own hostname, so sw.js\'s scope "/" owns exactly one application. The isolation is the ORIGIN, not a directory.');
else if (!SITE && !OWN_ORIGIN)
  note('BASE_PATH is empty AND OWN_ORIGIN is false — the app is at the root of a SHARED origin, and sw.js will take scope over the whole domain. ' +
       'Service workers persist on visitors\' machines and outlive the deploy that installed them, so every URL this hostname ever grows would be answered ' +
       'with the lab\'s index.html by browsers that visited today, and the only remedy is a tombstone worker. ' +
       'Either give λWAVES its own hostname (OWN_ORIGIN = true) or give it a BASE_PATH. Read the header of this file.');
else
  console.log(`the app is published under ${URLPATH}; sw.js's scope is therefore ${URLPATH} and not "/".`);
for (const s of SEGS) if (!/^[a-z0-9][a-z0-9._~-]*$/i.test(s))
  note(`BASE_PATH segment "${s}" is not plain ASCII — it will appear percent-encoded in every copied link (λ → %CE%BB). ` +
       `λWAVES is the display name; the URL does not have to carry it. (Dossier §3.)`);

const dropped = new Map(DROP);
const labFiles = walk(LAB);
for (const rel of labFiles) {
  if (dropped.has(rel)) continue;
  const dst = path.join(DIST, at(rel));
  mkdirSync(path.dirname(dst), { recursive: true });
  copyFileSync(path.join(LAB, rel), dst);
}
for (const [file] of SHIP_EXTRA) {
  if (!existsSync(path.join(ROOT, file))) { fail('1', `SHIP_EXTRA names ${file}, which is not in the repo root`); continue; }
  const dst = path.join(DIST, at(file));
  mkdirSync(path.dirname(dst), { recursive: true });
  copyFileSync(path.join(ROOT, file), dst);
}
console.log(`lab/ → dist/${SITE} : ${labFiles.length - dropped.size} files`);
for (const [f, why] of DROP)       console.log(`  dropped  ${f.padEnd(16)} ${QUIET ? '' : why}`);
for (const [f, why] of SHIP_EXTRA) console.log(`  added    ${f.padEnd(16)} ${QUIET ? '' : why}`);

/* ══ 2a.  ROBOTS ════════════════════════════════════════════════════════════════════════════════════════ */
rule('2a · ROBOTS  (dist/robots.txt)');
if (ALPHA_UNLISTED) {
  writeFileSync(path.join(DIST, 'robots.txt'),
    '# λWAVES Alpha — GENERATED by tools/build-deploy.mjs (ALPHA_UNLISTED). Edit the tool, not this file.\n' +
    '#\n' +
    '# "Publicly reachable, but not publicly advertised" (dossier §4, §26). This is an INDEXING REQUEST and\n' +
    '# NOT access control: UNLISTED IS NOT PRIVATE, anyone holding the URL can open the app, and that is\n' +
    '# intended for the Alpha. If real restriction is ever wanted, that is Cloudflare Access, evaluated\n' +
    '# separately — no authentication is introduced here.\n' +
    '\n' +
    'User-agent: *\n' +
    'Disallow: /\n');
  console.log('wrote dist/robots.txt — User-agent: * / Disallow: / (an indexing request; UNLISTED IS NOT PRIVATE)');
  console.log('      _headers also sends X-Robots-Tag: noindex — robots.txt asks a crawler not to FETCH, which does');
  console.log('      not stop a URL learned from a link being indexed; the header refuses the indexing itself.');
} else console.log('ALPHA_UNLISTED is false — no robots.txt, no X-Robots-Tag: the Alpha is announced and indexable.');

/* ══ 2b.  HEADERS ═══════════════════════════════════════════════════════════════════════════════════════
 * VERIFIED against Cloudflare's own documentation for WORKERS STATIC ASSETS (not Pages):
 * developers.cloudflare.com/workers/static-assets/headers/ — a plain-text `_headers` file in the assets
 * directory is parsed by Workers and its rules applied to asset responses; the file is NOT itself served.
 * Same format and same semantics as Pages, so this generator is unchanged by the platform switch.
 *
 * ONE CAVEAT FROM THOSE DOCS, WORTH KNOWING BEFORE ANYONE ADDS A WORKER SCRIPT: `_headers` rules do NOT
 * apply to responses generated by Worker CODE.  The Alpha is assets-only (wrangler.jsonc has no `main`),
 * so every response here comes from the asset server and every rule below applies.  If a Worker script is
 * ever added, these headers have to be attached in that script as well.
 *
 * Generated from the assembled tree, so a file type a later wave adds gets its rule without anyone
 * remembering to come here. */
rule('2b · HEADERS  (dist/_headers)');
const EXT_TYPE = new Map([
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.wgsl',        'text/wgsl; charset=utf-8'],
  ['.md',          'text/plain; charset=utf-8'],
  ['.txt',         'text/plain; charset=utf-8'],
]);
const typed = [];
for (const rel of walk(DIST)) {
  if (rel === 'robots.txt') continue;                                 // a crawler wants text/plain, which it already gets
  const base = path.posix.basename(rel), dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot).toLowerCase() : '';
  if (ext && EXT_TYPE.has(ext)) typed.push([rel, EXT_TYPE.get(ext)]);
  else if (!ext) typed.push([rel, 'text/plain; charset=utf-8']);      // LICENSE, NOTICE, vendor/katex/LICENSE
}
const H = [];
H.push('# _headers — Cloudflare WORKERS STATIC ASSETS.  GENERATED by tools/build-deploy.mjs; edit the tool.');
H.push('# Parsed by Workers and applied to asset responses; this file is never served as an asset itself.');
H.push('# It does NOT cover responses produced by Worker code — the Alpha is assets-only, so that is moot.');
H.push('#');
H.push('# CACHING, and why it is uniform.  NOT ONE URL IN THIS BUILD CARRIES A CONTENT HASH: the files are');
H.push('# main.js, rack.js, lab.css — stable names whose bytes change every wave.  So any max-age above zero');
H.push('# is a window in which a shipped fix is invisible to a returning visitor, and there is no hashed-URL');
H.push('# escape hatch to buy that window back.  Nor does a long TTL buy the offline layer anything: sw.js');
H.push('# precaches with `cache: \'reload\'` AND a ?__rev=<content hash>, so it deliberately goes around the');
H.push('# HTTP cache, and once a session is controlled the Cache API answers every request and the network is');
H.push('# not touched at all.  The steady state is ZERO requests, not cheap ones — so the right policy is');
H.push('# "always revalidate" and let ETags make the uncontrolled first launch cost 304s.');
H.push('#   the shell    index.html and sw.js MUST revalidate or a new build is never discovered.');
H.push('#   the assets   revalidate too, for the reason above; the service worker is what makes them instant.');
H.push('# Cloudflare\'s own DEFAULT for static assets is already `public, max-age=0, must-revalidate` with an');
H.push('# ETag, which is the same conclusion from the other side.  The rule is written out anyway, so the');
H.push('# reasoning is on the record and a change of platform default cannot silently change the policy.');
H.push('#');
H.push('# NO COOP / COEP.  Cross-origin isolation is only needed for SharedArrayBuffer (and precise timers).');
H.push('# The build re-proves on every run that dist/ contains no SharedArrayBuffer, no Atomics and no');
H.push('# crossOriginIsolated (§V4).  Sending COEP would be worse than useless: require-corp breaks every');
H.push('# cross-origin subresource, and this lab loads none, so it would buy nothing and could only cost.');
H.push('# WebGPU needs a SECURE CONTEXT, which HTTPS provides; it does not need isolation.');
H.push('#');
H.push('# NO SPA FALLBACK.  The lab has no path routing at all — state travels in the fragment');
H.push('# (statelink.js) and the only query read at boot is location.search.  wrangler.jsonc therefore sets');
H.push('# not_found_handling "404-page" and NOT "single-page-application": a mistyped asset URL must 404,');
H.push('# not return 200 of HTML that fails later and more confusingly.');
H.push('');
H.push('/*');
H.push('  Cache-Control: public, max-age=0, must-revalidate');
H.push('  X-Content-Type-Options: nosniff');
H.push('  Referrer-Policy: strict-origin-when-cross-origin');
if (ALPHA_UNLISTED) {
  H.push('  X-Robots-Tag: noindex');
  H.push('# ↑ robots.txt asks a crawler not to FETCH; it does not stop a URL learned from a link being indexed.');
  H.push('#   This refuses the indexing itself. Still an indexing request, still NOT access control (§4, §26).');
}
H.push('');
H.push('# Content types Workers will not necessarily get right on its own — Wrangler assigns Content-Type');
H.push('# from the file EXTENSION at upload time, so an extensionless file (LICENSE, NOTICE) has none and is');
H.push('# served as a download instead of a page.  .webmanifest must arrive as application/manifest+json or');
H.push('# the browser will not offer to install the app.  .md is typed text/plain so a reader gets the build');
H.push('# log in a tab rather than in their downloads folder.');
for (const [rel, type] of typed) { H.push(''); H.push('/' + rel); H.push('  Content-Type: ' + type); }
H.push('');
writeFileSync(path.join(DIST, '_headers'), H.join('\n'));
console.log(`wrote dist/_headers — 1 site-wide rule + ${typed.length} content-type rules`);
if (!QUIET) for (const [rel, type] of typed) console.log(`  /${rel.padEnd(30)} ${type}`);
const wgsl = walk(DIST).filter((r) => r.endsWith('.wgsl'));
console.log(wgsl.length
  ? `.wgsl: ${wgsl.length} file(s), typed above`
  : `.wgsl: none in the tree — every WGSL shader in this lab is an inline template literal in field.js, so no MIME rule is needed (the generator would add one if a .wgsl file ever appeared)`);

/* ══ 2c.  THE ROOT REWRITE, AND (UNDER A PATH) THE FRONT DOOR ══════════════════════════════════════════
 * wrangler.jsonc sets html_handling "none" so that GET /index.html is served DIRECTLY and never 307ed to
 * "/" — see the measured table there; the short version is that sw.js precaches "./index.html", and a
 * redirected response stored under that key makes every offline NAVIGATION throw in respondWith().
 * "none" also means "/" is not mapped to anything, so this file maps it — with status 200, which in
 * _redirects means REWRITE, not redirect: no Location header, no hop, nothing for the worker to choke on.
 * Verified against wrangler 4.129.0 serving this exact tree: both "/" and "/index.html?__rev=x" are 200
 * and neither is redirected.
 *
 * Workers Static Assets honours _redirects with the same format as Pages
 * (developers.cloudflare.com/workers/static-assets/redirects/), and the file is parsed, never served —
 * confirmed empirically: GET /_redirects and GET /_headers both 404. */
rule('2c · ROUTING  (dist/_redirects)');
{
  const R = [
    '# _redirects — Cloudflare Workers Static Assets.  GENERATED by tools/build-deploy.mjs; edit the tool.',
    '# Parsed by Workers and never served as an asset (GET /_redirects is a 404).',
    '#',
    '# THE REWRITE (status 200 = rewrite, not redirect).  wrangler.jsonc sets html_handling "none" so that',
    '# /index.html is served directly instead of being 307ed to its directory — sw.js precaches',
    '# "./index.html", and a REDIRECTED response stored under that key is one that respondWith() refuses',
    '# to return for a navigation, which would break the app from its second launch onward.  "none" leaves',
    `# "${URLPATH}" unmapped, so it is mapped here, without a hop.`,
  ];
  if (SITE) R.push(
    '#',
    '# THE FRONT DOOR.  The app is not at the root of this hostname, so the root is sent to it — 302, NOT',
    '# 301, because a 301 is cached by the browser, sometimes permanently, and the day "/" means something',
    '# else every returning visitor would still be bounced here by their own cache.',
  );
  R.push('# No catch-all: anything else stays a real 404, which is the honest answer for an app with no routing.', '');
  if (SITE) R.push(`/                 ${URLPATH}                 302`);
  R.push(`${URLPATH.padEnd(17)} ${(URLPATH + 'index.html').padEnd(17)} 200`, '');
  writeFileSync(path.join(DIST, '_redirects'), R.join('\n'));
  console.log(`wrote dist/_redirects — "${URLPATH}" rewritten to "${URLPATH}index.html" with status 200 (a rewrite: no Location, no hop, so the precached response is not "redirected")`);
  if (SITE) console.log(`      plus the front door: "/" → ${URLPATH} (302)`);
  else console.log(`      no front door needed: the app is at the root of its own hostname, so "/" already IS λWAVES (dossier §1).`);
}

/* ══════════════════════ VERIFY ═════════════════════════════════════════════════════════════════════════ */
const distFiles = walk(DIST);
const inDist = new Set(distFiles);
const readD  = (rel) => readFileSync(path.join(DIST, rel));
const textD  = (rel) => readD(rel).toString('utf8');

/* ══ V1.  THE PRECACHE LIST vs dist/ ════════════════════════════════════════════════════════════════════
 * tests/pwa.test.mjs §C already proves sw.js's §1 is exactly lab/ with exactly its hashes, and it can
 * repair itself with --write.  That proof is not repeated.  What IS asked here is the deploy-side question
 * it cannot answer: is the list exactly what is IN THE UPLOAD?  A file that survives lab/ but not the copy
 * is a precache entry that 404s, and a rejected install means the worker never takes and offline never
 * works.  (Dossier §29 step 1: do not assume index.html names the whole dependency graph.) */
rule('V1 · PRECACHE  ↔  dist/' + SITE);
const swSrc = inDist.has(at('sw.js')) ? textD(at('sw.js')) : '';
const block = (swSrc.match(/const PRECACHE = \[\n([\s\S]*?)\n\];/) || [])[1] || '';
const PRECACHE = [...block.matchAll(/\[\s*'([^']+)'\s*,\s*'([0-9a-f]{6,})'\s*\]/g)].map((m) => [m[1].replace(/^\.\//, ''), m[2]]);
if (PRECACHE.length < 50) fail('V1', `parsed only ${PRECACHE.length} entries out of dist/${at('sw.js')}'s PRECACHE array — the array moved and this check is proving nothing`);
const pcNames = new Set(PRECACHE.map(([u]) => at(u)));
const missing = [], wrong = [];
for (const [url, hash] of PRECACHE) {
  const rel = at(url);
  if (!inDist.has(rel)) { missing.push(url); continue; }
  if (rev(readD(rel)) !== hash) wrong.push(url);
}
const unexplained = distFiles.filter((r) => {
  if (pcNames.has(r) || DEPLOY_ONLY.has(r)) return false;
  if (!SITE || r.startsWith(SITE)) return !NOT_PRECACHED(SITE ? r.slice(SITE.length) : r);
  return true;
});
for (const u of missing) fail('V1', `precached "${u}" is NOT at dist/${at(u)} — install rejects, the worker never takes, nothing is ever offline`);
for (const u of wrong)   fail('V1', `precached "${u}" is in dist/${SITE} with different bytes than its recorded hash. sw.js derives its CACHE NAME from these hashes alone, so a stale one means the build name does NOT change when the file does: every returning visitor keeps serving the OLD bytes out of the OLD cache and never learns a new build exists. Fix: node tests/pwa.test.mjs --write`);
for (const u of unexplained) fail('V1', `dist/${u} is neither precached nor covered by a NEVER_PRECACHE rule — it will 404 offline`);
if (!missing.length && !wrong.length && !unexplained.length) {
  const bytes = PRECACHE.reduce((n, [u]) => n + statSync(path.join(DIST, at(u))).size, 0);
  console.log(`PASS  ${PRECACHE.length} precache entries: every one present in dist/ and every content hash re-verified against the shipped bytes (${kb(bytes)}).`);
  const skipped = distFiles.filter((r) => !pcNames.has(r));
  console.log(`      ${skipped.length} shipped-but-not-precached, each by rule: ${skipped.join(', ')}`);
}

/* ══ V2.  EVERY REFERENCE IN THE ASSEMBLED TREE RESOLVES ════════════════════════════════════════════════
 * Dossier §29 step 2 and §8, executed: every src= href= url( import new URL( Worker( in the assembled
 * tree, classified relative / root-relative / remote, and resolved against the deployment root. */
rule('V2 · LINKS  (walked over dist/, resolved against the deployment root)');
const stripJS   = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^[ \t]*\/\/.*$/gm, '');
const stripHTML = (s) => s.replace(/<!--[\s\S]*?-->/g, ' ');
const refs = [];                                              // { from, ref, kind: load|link }
const add = (from, ref, kind) => refs.push({ from, ref, kind });

for (const rel of distFiles.filter((r) => /\.(html|svg)$/i.test(r))) {
  const src = stripHTML(textD(rel));
  const anchors = new Set([...src.matchAll(/<a\b[^>]*?(?:src|href)\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]));
  for (const m of src.matchAll(/(?:src|href)\s*=\s*["']([^"']*)["']/gi)) add(rel, m[1], anchors.has(m[1]) ? 'link' : 'load');
}
for (const rel of distFiles.filter((r) => /\.js$/i.test(r) && r !== at('sw.js'))) {
  const src = stripJS(textD(rel));
  for (const m of src.matchAll(/\bimport\s+(?:[^'";]*?\bfrom\s*)?['"]([^'"]+)['"]/g)) add(rel, m[1], 'load');
  for (const m of src.matchAll(/\bexport\s+[^'";]*?\bfrom\s*['"]([^'"]+)['"]/g)) add(rel, m[1], 'load');
  for (const m of src.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)) add(rel, m[1], 'load');
  for (const m of src.matchAll(/new URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g)) add(rel, m[1], 'load');
  /* HTML built in JS strings — this is where the three site-root links (/LICENSE, /NOTICE, /REPORT.md) lived. */
  for (const m of src.matchAll(/href=\\?["']([^"'\\ >]+)/g)) add(rel, m[1], 'link');
}
for (const rel of distFiles.filter((r) => /\.css$/i.test(r))) {
  /* A `src:` list in @font-face is a FALLBACK CHAIN: only the first entry has to exist.  KaTeX offers
     woff2 → woff → ttf and only the woff2 files are vendored, so checking every url() there would invent
     ~40 failures.  Take the first url() of each @font-face block, and every url() outside them. */
  const src = stripJS(textD(rel));
  let rest = src;
  for (const m of src.matchAll(/@font-face\s*\{[^}]*\}/g)) {
    rest = rest.replace(m[0], ' ');
    const first = m[0].match(/url\(\s*['"]?([^'")]+)/);
    if (first) add(rel, first[1], 'load');
  }
  for (const m of rest.matchAll(/url\(\s*['"]?([^'")]+)/g)) add(rel, m[1], 'load');
}
for (const rel of distFiles.filter((r) => /\.webmanifest$/i.test(r))) {
  let mf; try { mf = JSON.parse(textD(rel)); } catch (e) { fail('V2', `dist/${rel} is not valid JSON: ${e.message}`); continue; }
  for (const ic of mf.icons || []) add(rel, ic.src, 'load');
  for (const k of ['start_url', 'scope']) if (mf[k]) add(rel, mf[k], 'load');
  /* `id` is NOT added here: it is not resolved against the manifest's URL — see MANIFEST IDENTITY below. */
}
/* the stripper must not have eaten live code, or this whole section proves nothing */
for (const [rel, needle] of [[at('main.js'), './rack.js'], [INDEX, './main.js'], [at('rack.js'), './mathworker.js']])
  if (inDist.has(rel) && !(rel.endsWith('.html') ? stripHTML(textD(rel)) : stripJS(textD(rel))).includes(needle))
    fail('V2', `the comment stripper removed ${needle} from dist/${rel} — it is over-eager and this check is not proving anything`);
if (refs.length < 150) fail('V2', `only ${refs.length} references found across dist/ — the scan has stopped seeing the source`);

const dangling = new Set(), escaped = new Set(), siteRoot = new Map(), external = new Map();
for (const { from, ref, kind } of refs) {
  const clean = ref.split('#')[0].split('?')[0];
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) { external.set(ref, (external.get(ref) || 0) + 1); continue; }
  if (!clean) continue;                                                       // a bare "#…"
  const root = clean.startsWith('/');
  let target = root ? clean.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(from), clean));
  if (target.startsWith('..')) { escaped.add(`dist/${from} → ${ref}  (climbs above the deployment root)`); continue; }
  /* A reference to a DIRECTORY — the manifest's start_url and scope are "./" — is a request for that
     directory's index.html, which is what the asset server returns under html_handling and what the
     worker's navigate arm serves. */
  target = target.replace(/^\.\//, '');
  if (target === '' || target === '.' || target === './') target = 'index.html';
  else if (target.endsWith('/')) target += 'index.html';
  const ok = inDist.has(target);
  if (root) siteRoot.set(`${ref}  ${ok ? '→ dist/' + target + '  (RESOLVES — λWAVES owns this origin, so a root-relative path is the app\'s own root)' : '→ MISSING from dist/'}`, kind);
  if (!ok) dangling.add(`dist/${from} → ${ref}  [${kind}]  (looked for dist/${target})`);
}
for (const d of dangling) fail('V2', d);
for (const e of escaped)  fail('V2', e);
if (!dangling.size && !escaped.size)
  console.log(`PASS  ${refs.length} relative src / href / import / url() / manifest references walked; every one resolves to a file that is in dist/. None climbs above the deployment root.`);
console.log(`      site-root ("/…") paths found: ${siteRoot.size ? '' : 'none — the ABOUT face\'s three file links were removed by wave 55; the FILES ship anyway (dossier §8), so /LICENSE, /NOTICE and /REPORT.md all answer'}`);
for (const [k, kind] of siteRoot) console.log(`        [${kind}] ${k}`);
console.log(`      absolute URLs (clicked, never loaded — V1's precache and the worker's cross-origin refusal keep them off the critical path): ${[...external.keys()].join(' ') || 'none'}`);
/* Acceptance criterion 8: the three document URLs must work. Asserted, not assumed. */
for (const f of ['LICENSE', 'NOTICE', 'REPORT.md', 'CHANGELOG.md'])
  if (!inDist.has(at(f))) fail('V2', `/${f} is not in dist/ — dossier §8 and acceptance criterion 8 require that URL to answer`);
console.log(`      documents at the deployment root: ${SHIP_EXTRA.map(([f]) => '/' + f).join('  ')}  — all present.`);

/* ── MANIFEST IDENTITY, AND THE ONE MEMBER FOR WHICH "./" IS NOT RELATIVE ───────────────────────────────
 * `scope` and `start_url` are resolved against the MANIFEST'S URL, so "./" means the app's directory and
 * the move is free.  `id` is NOT: the Web App Manifest spec resolves it against the ORIGIN of start_url,
 * so "./" means "https://host/" at every depth.  At an origin root that happens to be correct — but only
 * by luck, and a value like "lab/" (the dev server's path) is wrong even here.  Computed the way a browser
 * computes it, so the answer survives the site moving again. */
const MFREL = at('manifest.webmanifest');
if (inDist.has(MFREL)) {
  let mf = null; try { mf = JSON.parse(textD(MFREL)); } catch (e) { /* V2 above already reported it */ }
  if (mf) {
    const ORIGIN = 'https://host.invalid';
    const MFURL  = ORIGIN + URLPATH + 'manifest.webmanifest';
    const want   = ORIGIN + URLPATH;
    const startURL = new URL(mf.start_url === undefined ? './' : mf.start_url, MFURL).href;
    const got = {
      scope:     { href: new URL(mf.scope === undefined ? './' : mf.scope, MFURL).href, base: "the manifest's URL" },
      start_url: { href: startURL, base: "the manifest's URL" },
      id:        { href: mf.id === undefined ? startURL : new URL(mf.id, new URL(startURL).origin + '/').href,
                   base: mf.id === undefined ? 'absent, so it falls back to start_url' : "the ORIGIN of start_url (per spec), NOT the manifest's URL" },
    };
    let bad = 0;
    for (const [k, v] of Object.entries(got)) {
      if (k === 'scope' ? v.href === want : v.href.startsWith(want)) continue;
      bad++;
      const why = k !== 'id' ? '' :
        `\n      "id" is resolved against the ORIGIN, so a relative value is NOT relative to the manifest and does not travel with the app: this one names ${v.href}, which is not where λWAVES is published.`;
      const how = k !== 'id' ? '  Fix it in lab/manifest.webmanifest.'
        : `\n      Fix in lab/manifest.webmanifest: DELETE the "id" member — it then falls back to start_url, which is "./", is resolved against the MANIFEST, and is therefore correct at every address including the dev server — or hard-code "${URLPATH}", which is correct only until the app moves. tests/pwa.test.mjs asserts this value, so that assertion moves with it.`;
      fail('V2', `manifest "${k}": ${JSON.stringify(mf[k] === undefined ? '(absent)' : mf[k])} resolves against ${v.base} to ${v.href}, but the app is published at ${want}.` + why + how);
    }
    if (!bad) console.log(`PASS  manifest scope / start_url / id all resolve to ${want} (id: ${mf.id === undefined ? 'absent → falls back to start_url' : JSON.stringify(mf.id) + ' against the origin'}).`);
  }
}

/* ══ V3.  IS THE PWA LAYER ACTUALLY WIRED INTO THE PAGE? ════════════════════════════════════════════════
 * The manifest, the icons and the worker can all be perfect and the app can still be uninstallable and
 * permanently online, because a document that never links the manifest and never calls register() has no
 * PWA at all.  tests/pwa.test.mjs proves the ARTEFACTS; nothing proves the WIRING, and the wiring is what
 * a deploy exposes.  Acceptance criterion 6 (browser persistence) leans on it. */
rule('V3 · INSTALLABILITY  (dist/' + INDEX + ')');
if (!inDist.has(INDEX)) fail('V3', `no dist/${INDEX}`);
else {
  const html = textD(INDEX);
  const js = distFiles.filter((r) => /\.js$/.test(r) && r !== at('sw.js')).map(textD).join('\n');
  const has = (re, s = html) => re.test(s);
  const reg = js.match(/serviceWorker\s*\.\s*register\s*\(\s*['"]([^'"]+)['"]/);
  const W = [
    [has(/<link[^>]+rel\s*=\s*["']manifest["']/i), 'ERROR', '<link rel="manifest" href="./manifest.webmanifest">',
      'without it the browser never reads the manifest, so there is NO install prompt, no name, no icon, no standalone display — the whole lab/manifest.webmanifest is inert'],
    [has(/serviceWorker\s*(?:\.|\[)/, js) && has(/\.register\s*\(/, js), 'ERROR', 'navigator.serviceWorker.register(\'./sw.js\')',
      'nothing in the shipped JS registers the worker, so lab/sw.js is never installed: no precache, no offline, and the LW_SW_WAITING / LW_SW_SKIP_WAITING channel sw.js §6 documents has no other end'],
    [has(/<link[^>]+rel\s*=\s*["'][^"']*\bicon\b[^"']*["']/i), 'WARN', '<link rel="icon" href="./img/icon.svg"> (and a 192 png fallback)',
      'no favicon: the browser falls back to /favicon.ico, which is not in dist/, so every tab shows a blank page glyph and the 404 is logged on every visit'],
    [has(/<link[^>]+rel\s*=\s*["']apple-touch-icon["']/i), 'WARN', '<link rel="apple-touch-icon" href="./img/icon-apple-180.png">',
      'iOS ignores the manifest icons for "Add to Home Screen"; lab/img/icon-apple-180.png exists and is proved by tests/pwa.test.mjs §B for exactly this, and nothing points at it'],
    [has(/<meta[^>]+name\s*=\s*["']theme-color["']/i), 'WARN', '<meta name="theme-color" content="#070a0f">',
      'the manifest theme_color only colours an installed window; the browser chrome on a normal visit reads the meta, which is also the one the theme flip can rewrite'],
  ];
  for (const [ok, level, what, why] of W) {
    if (ok) { console.log(`PASS  ${what}`); continue; }
    if (level === 'ERROR') fail('V3', `dist/${INDEX} has no ${what} — ${why}`);
    else { console.log(`WARN  missing ${what}`); note(`index.html: ${what} — ${why}`); }
  }
  /* THE ONE ABSOLUTE URL IN lab/, checked against the address this build is FOR (wave 68). */
  const ogm = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const ogWant = DEPLOY_ORIGIN + URLPATH + 'img/icon-512.png';
  if (!ogm) note('index.html has no og:image — a shared link unfurls as a bare URL, which wave 59 added the card to stop.');
  else if (ogm[1] !== ogWant)
    fail('V3', `index.html og:image is "${ogm[1]}" but this build deploys to ${DEPLOY_ORIGIN}${URLPATH} — it must be "${ogWant}". ` +
      `It is the ONLY absolute URL in lab/ and nothing resolves it for you: an unfurler fetches exactly this string, so a stale one is a 404 in every chat app the link travels through.`);
  else console.log(`PASS  og:image ${ogm[1]} — absolute, and it is this build's own address (DEPLOY_ORIGIN + BASE_PATH).`);
  if (reg) {
    /* At an origin root './sw.js' and '/sw.js' resolve to the same URL and the same scope, so neither is
       wrong TODAY.  Relative is still the one to keep: it is the reason the same bytes serve correctly
       from /lab/ on ./serve.sh, from localhost:8787 under `wrangler dev`, and from the origin root. */
    if (reg[1].startsWith('/') && SITE)
      fail('V3', `register('${reg[1]}') is a hostname-root path, but the app is served from ${URLPATH} — there is no such file, and if there were, the worker's scope would be the whole origin. Use './sw.js'.`);
    else if (reg[1].startsWith('/'))
      /* WAVE 106 · A NOTE IS NOT A GATE, AND THIS IS THE ONE PLACE THAT MATTERS.  This arm used to warn and
         pass, on the reasoning above: at an origin root the two spellings resolve alike, so nothing is wrong
         TODAY.  But the whole OWN_ORIGIN argument is about a trap that is out of reach rather than gone, and
         a check that can only fire once the app has ALREADY moved under a shared origin fires one deploy too
         late — by then the absolute path is in the tree, the reviewer has read a PASS, and the worker takes
         scope over somebody else's application.  The rule the header states is 'relative is the one to keep,
         everywhere', so the gate now says exactly that, at the root as well.  It costs nothing while main.js
         is right and it is the only way the claim stays true after the move. */
      fail('V3', `register('${reg[1]}') is absolute. It resolves correctly at an origin root TODAY, so nothing is broken yet — and that is precisely why this fails rather than warns: it breaks ./serve.sh (which serves the lab at /lab/) now, and the day λWAVES moves under a shared origin an absolute path takes the worker's scope over the whole domain. './sw.js' is right everywhere. Use it.`);
    else console.log(`PASS  register('${reg[1]}') is relative → the worker is served from ${URLPATH}sw.js and its scope is ${URLPATH}${SITE ? '' : ' — the whole origin, which is correct: this hostname is λWAVES and nothing else'}.`);
  }
}

/* ══ V4.  THE COOP/COEP CLAIM, RE-PROVED ════════════════════════════════════════════════════════════════ */
rule('V4 · CROSS-ORIGIN ISOLATION');
const iso = [];
for (const rel of distFiles.filter((r) => /\.(js|html|css|webmanifest)$/i.test(r)))
  for (const m of textD(rel).matchAll(/\b(SharedArrayBuffer|crossOriginIsolated|Atomics)\b/g)) iso.push(`dist/${rel}: ${m[1]}`);
if (iso.length) { for (const i of iso) fail('V4', `${i} — this needs cross-origin isolation, so _headers must grow COOP: same-origin and COEP: require-corp (and every subresource must then be CORP-clean)`); }
else console.log(`PASS  no SharedArrayBuffer, no Atomics, no crossOriginIsolated anywhere in the ${distFiles.length} shipped files. COOP/COEP are NOT needed and are deliberately not sent.`);
console.log(`      (WebGPU needs a secure context, which Cloudflare gives for free over HTTPS — it does not need isolation. Acceptance criteria 3 and 7.)`);

/* ══ V5.  THE UPSTREAM GATE ═════════════════════════════════════════════════════════════════════════════ */
rule('V5 · tests/pwa.test.mjs');
const T = path.join(ROOT, 'tests', 'pwa.test.mjs');
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
if (!RUN_TEST) console.log('SKIP  --no-test');
else if (!existsSync(T)) fail('V5', 'tests/pwa.test.mjs is missing — the manifest, the icons and the update policy are unproven');
else {
  try {
    const out = execFileSync(process.execPath, [T], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    for (const l of out.trim().split('\n')) console.log('      ' + l);
    console.log('PASS  the manifest, the icons, the precache and the update policy are proved against lab/.');
  } catch (e) {
    const all = ((e.stdout || '') + '\n' + (e.stderr || '')).replace(ANSI, '').split('\n');
    for (const l of all) if (/^PASS /.test(l)) console.log('      ' + l);
    const i = all.findIndex((l) => /(AssertionError|Error)\b.*:/.test(l));
    const said = i < 0 ? all.filter(Boolean).slice(-4) : all.slice(i, i + 10).filter((l) => l.trim() && !/^\s+at /.test(l));
    fail('V5', `tests/pwa.test.mjs FAILED. Almost always: a wave edited lab/ and sw.js §1 is stale, and the fix is one command —\n        node tests/pwa.test.mjs --write\n      it said:\n        ${said.join('\n        ')}`);
  }
}

/* ══ V6.  THE CLOUDFLARE CONFIGURATION ══════════════════════════════════════════════════════════════════
 * wrangler.jsonc is the other half of the deploy and the one place where a wrong path is silent: point
 * `assets.directory` at a folder that is not this build and Wrangler cheerfully deploys the wrong bytes,
 * or nothing.  Checked here so the build and the config cannot drift. */
rule('V6 · wrangler.jsonc');
const WFILE = ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml'].map((f) => path.join(ROOT, f)).find(existsSync);
if (!WFILE) fail('V6', 'no wrangler.jsonc at the repo root — `npx wrangler dev` and `npx wrangler deploy` have nothing to read (dossier §10)');
else if (WFILE.endsWith('.toml')) console.log(`NOTE  ${path.basename(WFILE)} is TOML; not parsed here. The jsonc form is what DEPLOY.md documents.`);
else {
  /* JSONC → JSON: strip comments, respecting string literals so a "//" inside a URL survives. */
  const raw = readFileSync(WFILE, 'utf8');
  let out = '', inStr = false, esc = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i], d = raw[i + 1];
    if (inStr) { out += c; if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && d === '/') { while (i < raw.length && raw[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < raw.length && !(raw[i] === '*' && raw[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  let cfg = null;
  try { cfg = JSON.parse(out.replace(/,(\s*[}\]])/g, '$1')); } catch (e) { fail('V6', `${path.basename(WFILE)} does not parse: ${e.message}`); }
  if (cfg) {
    const a = cfg.assets || {};
    const dir = a.directory ? path.resolve(ROOT, a.directory) : null;
    if (!a.directory) fail('V6', 'wrangler.jsonc has no assets.directory — nothing would be uploaded (dossier §10)');
    else if (dir !== DIST) fail('V6', `wrangler.jsonc assets.directory is "${a.directory}" → ${dir}, but this build writes ${DIST}. Wrangler would deploy the wrong bytes, or none.`);
    if (!cfg.name) fail('V6', 'wrangler.jsonc has no name — it is the workers.dev subdomain and the project identity');
    else if (!/^[a-z0-9][a-z0-9-]*$/.test(cfg.name)) fail('V6', `wrangler.jsonc name "${cfg.name}" is not a legal hostname label (lowercase, digits, hyphens) — it becomes ${cfg.name}.<account>.workers.dev`);
    if (!cfg.compatibility_date) fail('V6', 'wrangler.jsonc has no compatibility_date — the runtime behaviour would drift under you');
    if (cfg.main) note(`wrangler.jsonc declares main "${cfg.main}" — this is no longer an assets-only Worker, and Cloudflare's docs are explicit that _headers rules do NOT apply to responses produced by Worker code. Those headers must be set in the script too.`);
    if (a.not_found_handling === 'single-page-application')
      fail('V6', 'not_found_handling is "single-page-application" — every mistyped asset URL would return 200 with index.html, which fails later and more confusingly than a 404. This app has no path routing; "404-page" is correct.');
    /* THE 307 TRAP, checked statically because it is invisible until the second launch in production.
       Every html_handling mode but "none" canonicalises /index.html to its directory with a 307.  sw.js
       precaches './index.html' and hands the stored response to respondWith() for navigations, and a
       navigation request's redirect mode is "manual", so a redirected response is refused: the app
       installs, runs on the first visit, and then will not open.  Measured against wrangler 4.129.0. */
    if (a.html_handling && a.html_handling !== 'none' && pcNames.has(at('index.html')))
      fail('V6', `html_handling is "${a.html_handling}", which 307s GET ${URLPATH}index.html to ${URLPATH} — and "${at('index.html')}" IS precached.\n      sw.js §3 fetches it with a ?__rev= buster and stores the result under the clean URL, so the cached Response carries redirected = true; sw.js §5 then hands that response to event.respondWith() for every NAVIGATION, whose redirect mode is "manual", and the browser refuses it ("The response is a redirected response, but the request was not"). The app would install, work on the first visit, and fail to open from the second launch onward.\n      Fix: html_handling "none" in wrangler.jsonc — this build's _redirects already rewrites ${URLPATH} to ${URLPATH}index.html with status 200 (a rewrite, not a hop), so both URLs answer 200 and neither is redirected.`);
    /* WAVE 68 · THE SECOND ORIGIN.  With no `workers_dev` key the default is TRUE and a custom domain does
       not turn it off, so a deploy leaves a permanent staging hostname carrying its own root-scoped
       service worker, its own localStorage and — the manifest having no `id` — its own installed PWA
       identity.  Named here rather than only in wrangler.jsonc's prose, because this file is what runs. */
    if (cfg.workers_dev === undefined)
      note('wrangler.jsonc has no "workers_dev" key, so it DEFAULTS TO TRUE: this deploy would leave a second live origin (' + cfg.name + '.<account>.workers.dev) with its own root-scoped service worker, its own localStorage and its own installed PWA identity — a worker you cannot purge from a server, on an address you stopped using. Set "workers_dev": false unless you are deliberately smoke-testing there.');
    else if (cfg.workers_dev === true)
      note('wrangler.jsonc sets "workers_dev": true — deliberate staging, then. Two things to know before anyone does real work on that URL: localStorage is PER ORIGIN, so every setting, notebook and project saved there is stranded when you move; and the worker installed from it stays installed. Set it back to false before attaching the custom domain.');
    else console.log('PASS  workers_dev: false — one origin, one service worker, one PWA identity.');
    if (a.html_handling === 'none' && !existsSync(path.join(DIST, '_redirects')))
      fail('V6', `html_handling is "none", which leaves ${URLPATH} unmapped — without the _redirects rewrite this build writes, the front page is a 404.`);
    if (cfg) console.log(`PASS  ${path.basename(WFILE)}: name "${cfg.name}" → ${cfg.name}.<account>.workers.dev · compatibility_date ${cfg.compatibility_date} · assets.directory "${a.directory}" = this build · html_handling ${JSON.stringify(a.html_handling)} · not_found_handling ${JSON.stringify(a.not_found_handling)} · assets-only (no Worker script).`);
  }
}

/* ══ 3.  THE PAYLOAD ════════════════════════════════════════════════════════════════════════════════════ */
rule('3 · PAYLOAD');
const sizes = distFiles.map((r) => [r, statSync(path.join(DIST, r)).size]).sort((a, b) => b[1] - a[1]);
const total = sizes.reduce((n, [, s]) => n + s, 0);
console.log(`dist/ : ${distFiles.length} files, ${kb(total)} total`);
console.log('largest ten:');
for (const [r, s] of sizes.slice(0, 10)) console.log(`  ${kb(s).padStart(10)}  ${r}`);

/* THE COLD FIRST VISIT.  Counted, not guessed: index.html's own subresources plus the TRANSITIVE static
   module graph from its <script type="module">, because a module graph is fetched in full before the entry
   executes.  Everything a browser fetches later or conditionally is listed separately and honestly.
   (Dossier §20: watch initial asset weight and unnecessary network requests.) */
const eager = new Set([INDEX]);
if (inDist.has(INDEX)) {
  const html = stripHTML(textD(INDEX));
  const entries = [];
  for (const m of html.matchAll(/<link[^>]+rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["']([^"']+)["']/gi)) entries.push(m[1]);
  for (const m of html.matchAll(/<script[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) entries.push(m[1]);
  for (const m of html.matchAll(/<link[^>]+rel\s*=\s*["'](?:manifest|icon|apple-touch-icon|shortcut icon)["'][^>]*href\s*=\s*["']([^"']+)["']/gi)) entries.push(m[1]);
  const seen = new Set();
  const visit = (rel) => {
    if (!rel || seen.has(rel) || !inDist.has(rel)) return;
    seen.add(rel); eager.add(rel);
    if (!/\.js$/.test(rel)) return;
    const src = stripJS(textD(rel));
    for (const re of [/\bimport\s+(?:[^'";]*?\bfrom\s*)?['"](\.[^'"]+)['"]/g, /\bexport\s+[^'";]*?\bfrom\s*['"](\.[^'"]+)['"]/g])
      for (const m of src.matchAll(re)) visit(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])));
  };
  for (const e of entries) visit(path.posix.normalize(path.posix.join(SITE || '.', e.replace(/^\.\//, ''))));
}
const eagerBytes = [...eager].reduce((n, r) => n + (inDist.has(r) ? statSync(path.join(DIST, r)).size : 0), 0);
const ownFonts = distFiles.filter((r) => r.startsWith(at('fonts/')) && r.endsWith('.woff2'));
const katex    = distFiles.filter((r) => r.startsWith(at('vendor/katex/fonts/')));
const later = [
  [ownFonts.length, `the lab's own faces (${ownFonts.map((f) => path.posix.basename(f)).join(', ')}) — @font-face with font-display:swap, requested during the first paint`],
  [inDist.has(at('img/warning-orbital.png')) ? 1 : 0, 'img/warning-orbital.png — the PHOTOSENSITIVITY panel is shown at boot'],
  [inDist.has(at('sw.js')) && !eager.has(at('sw.js')) ? 1 : 0, 'sw.js — fetched by register(); it then precaches the WHOLE tree in the background (see below)'],
  [inDist.has(at('mathworker.js')) ? 1 : 0, 'mathworker.js — a module Worker, constructed on demand by rack.js, not at boot'],
  [katex.length, 'KaTeX faces — a @font-face loads only when a glyph in it is actually rendered; a first visit typically pulls 2–5 of these, never all'],
].filter(([n]) => n > 0);
console.log(`\ncold first visit — ${eager.size} requests are certain:`);
console.log(`  index.html + its stylesheets and scripts + the whole transitive ES-module graph (fetched in full before main.js runs) = ${eager.size} files, ${kb(eagerBytes)}`);
console.log('then, on the same first visit:');
for (const [n, why] of later) console.log(`  + up to ${String(n).padStart(2)}  ${why}`);
const maxN = eager.size + later.reduce((n, [c]) => n + c, 0);
console.log(`  ⇒ a cold first visit is ${eager.size} certain requests, at most ${maxN}, and at most ${kb(total)} of bytes.`);
if (PRECACHE.length) console.log(`  the service worker then fetches all ${PRECACHE.length} precache entries in the background; from the SECOND launch the app makes ZERO network requests (sw.js's ONE LAW: no skipWaiting, so the first visit runs uncontrolled).`);

/* ══ 4.  VERDICT ════════════════════════════════════════════════════════════════════════════════════════ */
rule('4 · VERDICT');
let ignored = false;
try { execFileSync('git', ['check-ignore', '-q', 'dist'], { cwd: ROOT, stdio: 'ignore' }); ignored = true; } catch (e) { /* not ignored */ }
if (!ignored) note('dist/ is not in .gitignore — add a `dist/` line, and a `node_modules/` line is already there. Without it the next `git add -A` commits the whole build, and dossier §10/§13 want the REPO to answer "what is deployed", not a copy of the output.');
for (const n of notes) console.log('NOTE  ' + n);
if (problems.length) {
  /* TWO KINDS OF WRONG, kept apart because they are not the same decision.  Everything but V3 means the
     SITE is broken — a 404, a stranded cache, a wrong identity, a config that deploys the wrong folder.
     A V3 failure means the site loads and runs perfectly and the APP is not there: no install, no offline.
     Both stop the build; only one is an emergency, and a report that blurs them teaches Josh to ignore it. */
  const broken = problems.filter((p) => p.section !== 'V3');
  const unwired = problems.filter((p) => p.section === 'V3');
  console.log(`\n${problems.length} problem(s) — dist/ is on disk so you can look at it, but DO NOT DEPLOY IT.\n`);
  if (broken.length) {
    console.log(`THE SITE IS BROKEN (${broken.length}) — 404s, stranded caches, wrong identities, missing proofs:`);
    for (const p of broken) console.log(`  ✗ ${p.section}: ${p.msg}`);
  }
  if (unwired.length) {
    console.log(`${broken.length ? '\n' : ''}THE SITE WOULD LOAD, BUT THE PWA IS NOT WIRED IN (${unwired.length}) — every artefact exists and is proved;`);
    console.log('nothing in the document reaches for it, so this deploys as an ordinary web page with no offline and no install:');
    for (const p of unwired) console.log(`  ✗ ${p.section}: ${p.msg}`);
    console.log('  → DEPLOY.md · "The line that is missing".');
  }
  console.log('\nsee DEPLOY.md.');
  process.exit(1);
}
console.log(`\ndist/ is complete and verified — ${distFiles.length} files, ${kb(total)}.  Next: \`npx wrangler dev\`, then DEPLOY.md.`);
