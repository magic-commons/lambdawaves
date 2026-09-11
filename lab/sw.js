/* sw.js — λWAVES OFFLINE.  The whole lab is local, so the whole lab is precached and the network is never
 * needed again.  Registered by index.html at ./sw.js, so the scope is WHEREVER THE LAB IS SERVED FROM —
 * /lab/ on ./serve.sh, and THE WHOLE ORIGIN at lambdawaves.magic-commons.com, which is the address this
 * app now ships at.  That sentence used to end "so the scope is /lab/ and nothing above it is ours", and
 * §5 enforced it with `startsWith(SCOPE)` — a refusal that refuses NOTHING when SCOPE is "/".  See §5.
 *
 * ── THE ONE LAW ────────────────────────────────────────────────────────────────────────────────────────
 * A NEW BUILD IS NEVER SWAPPED IN UNDER A RUNNING SESSION.  This lab holds unsaved state — a prepared
 * superposition, a notebook page, a layout — and half of an old build talking to half of a new one is the
 * worst failure a cache can cause.  So: no skipWaiting() on install, no clients.claim() ever.  A new worker
 * precaches itself and then WAITS; the old worker keeps serving every byte of the build the session started
 * on until the last tab of that session closes.  The UI is told a build is ready (§5) and the USER decides.
 * The price is honest and small: the very first visit runs uncontrolled, so offline works from the SECOND
 * launch onward.  We pay it rather than swap assets under a page that is already running.
 *
 * ── ANTI-PATTERN 6 (docs/ui/ANTI-PATTERNS.md: "a hand-written version in the UI") ──────────────────────
 * There is NO version number here.  §1 is a generated list of [url, content hash]; §2 derives the cache
 * name from those hashes alone.  Change one byte of one file and the hash changes, the cache name changes,
 * and the old cache is collected.  Change nothing and the name is bit-identical — no churn, no stale
 * constant to forget.  A hand-edited `const VERSION` would have gone stale on the first wave that forgot it.
 *
 * ── REGENERATING §1 ────────────────────────────────────────────────────────────────────────────────────
 * `node tests/pwa.test.mjs` walks lab/ itself, re-hashes every file, and FAILS if §1 has a missing entry, a
 * stale entry, or a wrong hash.  `node tests/pwa.test.mjs --write` REWRITES §1 from the directory and then
 * proves the result, so the whole refresh procedure after a wave that touched lab/ is that one command.
 * Without --write it only prints the corrected block, so a gate still fails instead of silently repairing.
 */
'use strict';

/* ── 1. THE PRECACHE — every file under lab/ that the running lab actually loads ────────────────────────
 * [url relative to this worker, first 12 hex of the file's sha-256].  GENERATED — see the header. */
const PRECACHE = [
  ['./atoms.js',                                          '1bfbfc778e10'],
  ['./atomsview.js',                                      '8a999c2c9509'],
  ['./audio.js',                                          '67458cc4f589'],
  ['./bessel.js',                                         '0689408ac984'],
  ['./calculus.js',                                       '43eae3b25a72'],
  ['./calculusview.js',                                   '52b7e86057fc'],
  ['./capture.js',                                        'ce61dd15e8ec'],
  ['./clock.js',                                          '6431963e1506'],
  ['./cornell.js',                                        '70b64dee2baa'],
  ['./dynamics.js',                                       'e45f1820ad91'],
  ['./dynamicsview.js',                                   'dde4262d990d'],
  ['./electrostatics.js',                                 '793bcb83905b'],
  ['./field.js',                                          'a7423d28b0ff'],
  ['./fieldview.js',                                      'c334f3474f43'],
  ['./fonts/LWTitle-title.woff2',                         '8069abf19624'],
  ['./fonts/Roboto-OFL.txt',                              '061402327a96'],
  ['./fonts/Roboto-ui.woff2',                             '5cd6c496e9eb'],
  ['./fonts/STIXTwoMath-OFL.txt',                         '0c8825913b60'],
  ['./fonts/STIXTwoMath-subset.woff2',                    'ace34bc7ff28'],
  ['./fonts/Spinwerad-OFL.txt',                           '0c31d0af7f9a'],
  ['./frame-budget.js',                                   'd609c4fc6278'],
  ['./frame-settle.js',                                   'a3b2724d2033'],
  ['./frontier.js',                                       'dc07edd67f5c'],
  ['./gas.js',                                            'c08e2760306c'],
  ['./h2.js',                                             '5dc1410a91c0'],
  ['./h2ci.js',                                           '85f80a0bc1f3'],
  ['./h2view.js',                                         '280200cb670e'],
  ['./hamiltonian.js',                                    'd5a31e2ef118'],
  ['./helium.js',                                         'a6f522f5cc59'],
  ['./heliumview.js',                                     'c3dc0ffa2788'],
  ['./history.js',                                        '9ed98fa37072'],
  ['./hydrogen.js',                                       '8022044a45f5'],
  ['./img/icon-192.png',                                  '3b8a6aa2c577'],
  ['./img/icon-512.png',                                  '45570c173962'],
  ['./img/icon-apple-180.png',                            '96b3612f8ccc'],
  ['./img/icon-maskable-192.png',                         '2e4c37cc5cb8'],
  ['./img/icon-maskable-512.png',                         'dcb168a7591f'],
  ['./img/icon-maskable.svg',                             '8a719456bbf1'],
  ['./img/icon.svg',                                      'd836bdb7bfea'],
  ['./img/warning-orbital.png',                           'fb796735bfd5'],
  ['./index.html',                                        '05f0e262fdd9'],
  ['./kepler.js',                                         '11e0235e3f0d'],
  ['./keplerview.js',                                     'b822e144586e'],
  ['./keymap.js',                                         'e7223b63ae61'],
  ['./kick.js',                                           'dd58e709b0c3'],
  ['./lab.css',                                           '5fc4dc04b741'],
  ['./ladder-model.js',                                   '69199febdca1'],
  ['./ladder.js',                                         '2d23cf3e7506'],
  ['./main.js',                                           'c77d9a48909e'],
  ['./manifest.webmanifest',                              '4771fb9dfe63'],
  ['./mathworker.js',                                     'f6e232dcabcd'],
  ['./meters.js',                                         'bb0185bebb1a'],
  ['./mir/control-help.js',                               'ce0bac5acf0a'],
  ['./mir/css/base.css',                                  'a8436a74724e'],
  ['./mir/css/skin.css',                                  '546710c07fb9'],
  ['./mir/glyph.js',                                      '6941c8aa4fd7'],
  ['./mir/kit.js',                                        '8163f225597f'],
  ['./mir/modulation/curve.js',                           'f5ccc9c84f11'],
  ['./mir/modulation/host.js',                            '27ddb69a20e0'],
  ['./mir/modulation/mod.js',                             '535142d3b50c'],
  ['./mir/modulation/modhost.css',                        '8aa4650c5d45'],
  ['./mir/modulation/modwindow/modwindow.css',            '8c97686a881b'],
  ['./mir/modulation/modwindow/modwindow.js',             '4a7d7bf7f4b4'],
  ['./mir/modulation/registry.js',                        '543131e58af4'],
  ['./mir/plane-model.js',                                '63bd13a486e6'],
  ['./mir/slider-keys.js',                                '87fbf95d5aa3'],
  ['./mir/window-activity.js',                            'a39d679279da'],
  ['./mo.js',                                             'ef8b99702547'],
  ['./modrive.js',                                        '89b99a6568d1'],
  ['./modwindow.js',                                      '5d450648ba42'],
  ['./molecule.js',                                       'a2f3c70b3705'],
  ['./moleculeview.js',                                   '5e12309ef3ff'],
  ['./momentum.js',                                       '0b32cc20e73a'],
  ['./moview.js',                                         '17f70c0bfe21'],
  ['./native-ui.js',                                      '9bfe023c8ee6'],
  ['./notebook-math.js',                                  'fa1312541d4c'],
  ['./notebook-render.js',                                '60f8e1193c27'],
  ['./orbit.js',                                          'ad20efd4e400'],
  ['./palette.js',                                        '5c7332ba789c'],
  ['./paletteview.js',                                    '24bd35e76f27'],
  ['./particles.js',                                      'b473594f2035'],
  ['./period.js',                                         'c04a731fcddd'],
  ['./project-import.js',                                 '1dcec46408e2'],
  ['./project-storage.js',                                '7aab1a439779'],
  ['./pulse.js',                                          '454ae330ee2f'],
  ['./pulseview.js',                                      '8bd9386477e3'],
  ['./qcd.js',                                            'd719df2e6c5c'],
  ['./qcdview.js',                                        'f9c72c4c4ff4'],
  ['./qho.js',                                            'dc55dfe4479f'],
  ['./rack.js',                                           'c7adc0ea25f2'],
  ['./radiation.js',                                      '3fdc3094e486'],
  ['./radiationview.js',                                  '655a6aef068a'],
  ['./render-exact.js',                                   'cf0cdb3eaeda'],
  ['./rotor4.js',                                         '074250aea7e6'],
  ['./shadow.js',                                         '98d26391c1b5'],
  ['./shadowview.js',                                     'cdd5544049a9'],
  ['./skin.css',                                          '8ea7391e512f'],
  ['./slice.js',                                          '6d7648bd5e5b'],
  ['./sliceview.js',                                      'd8bfc51da499'],
  ['./spectrum.js',                                       '63b2e40fa490'],
  ['./state.js',                                          '363f7991924b'],
  ['./statelink.js',                                      '5655f0dbdcfe'],
  ['./sturmian.js',                                       '47ed5b7c81da'],
  ['./sturmianreg.js',                                    '1ce5f44b2fae'],
  ['./twocentre.js',                                      'ee6db36dfc49'],
  ['./vendor/katex/LICENSE',                              '766ccc1f306c'],
  ['./vendor/katex/fonts/KaTeX_AMS-Regular.woff2',        '0cdd387c9590'],
  ['./vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',   'de7701e42cf1'],
  ['./vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2','5d53e70ad607'],
  ['./vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',       '74444efd593c'],
  ['./vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',    '51814d270d06'],
  ['./vendor/katex/fonts/KaTeX_Main-Bold.woff2',          '0f60d1b89793'],
  ['./vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',    '99cd42a3c072'],
  ['./vendor/katex/fonts/KaTeX_Main-Italic.woff2',        '97479ca6cce9'],
  ['./vendor/katex/fonts/KaTeX_Main-Regular.woff2',       'c2342cd8b869'],
  ['./vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',    'dc47344dbb6c'],
  ['./vendor/katex/fonts/KaTeX_Math-Italic.woff2',        '7af58c5ec8f1'],
  ['./vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',     'e99ae51144bf'],
  ['./vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',   '00b26ac825e2'],
  ['./vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',  '68e8c73ef42a'],
  ['./vendor/katex/fonts/KaTeX_Script-Regular.woff2',     '036d4e95149b'],
  ['./vendor/katex/fonts/KaTeX_Size1-Regular.woff2',      '6b47c40166b6'],
  ['./vendor/katex/fonts/KaTeX_Size2-Regular.woff2',      'd04c54219f9e'],
  ['./vendor/katex/fonts/KaTeX_Size3-Regular.woff2',      '73d591271b16'],
  ['./vendor/katex/fonts/KaTeX_Size4-Regular.woff2',      'a4af7d414440'],
  ['./vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2', '71d517d67827'],
  ['./vendor/katex/fonts/OFL.txt',                        'fda55663cd51'],
  ['./vendor/katex/katex.min.css',                        '717bc9ae7853'],
  ['./vendor/katex/katex.min.js',                         'e6bfe5deebd4'],
  ['./vendor/marked-LICENSE.md',                          '8e3a3f82f59a'],
  ['./vendor/marked.min.js',                              '15fabce5b658'],
  ['./vortex.js',                                         '1f92837bb309'],
  ['./well.js',                                           '603218807b57'],
  ['./wigner.js',                                         '370c23027ea3'],
  ['./wignerview.js',                                     'e0a32cb0f767'],
];

/* WHAT IS DELIBERATELY *NOT* IN §1, and why.  The test asserts this list is exactly what the walk skips. */
const NEVER_PRECACHE = [
  ['sw.js',                'a worker that caches itself can never be updated: the browser fetches sw.js through its own byte-comparison path, and a Cache API copy in front of that is the classic way to strand a build forever.'],
  ['smoke.html',           'a bench page for the browser proof, not part of the lab; caching it would put a dev harness on the home screen.'],
  ['*.md, *.txt EXCEPT a LICENCE text',
                           'shipped documents (skin-notes, PORT-NOTES, the *-SOURCE.txt build records) are served, never loaded by the running lab — precaching them would make every prose edit a new build. THE LICENCES ARE THE EXCEPTION and they ARE precached (wave 59): the font binaries they cover are in this list, and OFL section 2 says each copy must CONTAIN the licence — an offline install that holds twenty-three fonts and cannot reach one licence is not that copy. It costs 22 KB and licence texts change approximately never.'],
  ['vendor/katex/LICENSE', 'NO LONGER SKIPPED, for the same reason: it is the MIT text for KaTeX\'s code and it is precached with vendor/katex/fonts/OFL.txt beside it.'],
];

/* AND WHAT THE FETCH HANDLER REFUSES TO CACHE AT RUNTIME (§4), each with its reason. */
const NEVER_CACHE_AT_RUNTIME = [
  ['any method but GET',        'a POST/PUT is a write; replaying one from a cache is a lie about what the server did.'],
  ['a Range request',           'the answer is a 206 with a slice of the body. A partial response stored under a whole-file key is a poisoned entry that fails silently later.'],
  ['a cross-origin request',    'lab/ has none (the test proves it), and an opaque response has status 0 and an unreadable body — it cannot be validated, so it is never kept.'],
  ['any navigation that is not the app entry', '/REPORT.md, /LICENSE, /NOTICE and the eight licence texts ABOUT opens in a new tab are DOCUMENTS, not the lab. They change every wave; a cached build log is a lie. This used to be enforced by a path prefix ("above /lab/"), which silently became a no-op the day the lab moved to its own origin and SCOPE became "/" — every navigation on the hostname was then answered with the lab\'s own index.html, and the nine document links in ABOUT each opened a second copy of the lab. Only the ENTRY set is served: everything else is the network\'s, which is also what restores the real 404 wrangler.jsonc\'s not_found_handling asks for. Offline a document fails, which is honest — it is not the lab.'],
  ['anything not already in §1', 'this worker NEVER grows a runtime cache. The precache is the whole app; a URL that is not in it is a URL the lab does not need, so it goes to the network and nothing is stored.'],
];

/* ── 2. THE BUILD NAME — a pure function of §1's contents, computed here, written nowhere ───────────────
 * Two interleaved 32-bit mixes over "url@hash" lines; base-36 concatenated. Not cryptographic and does not
 * need to be — it names a cache, and it only has to change when the bytes change and not otherwise. */
function digest(s) {
  let a = 0x811c9dc5, b = 0x9e3779b9;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    a = Math.imul(a ^ ch, 0x01000193) >>> 0;
    b = Math.imul(b + ch, 0x85ebca6b) >>> 0;
    b = (b ^ (b >>> 13)) >>> 0;
  }
  return a.toString(36) + b.toString(36);
}
const PREFIX = 'lw-lab-';
const BUILD  = digest(PRECACHE.map(([u, h]) => u + '@' + h).join('\n'));
const CACHE  = PREFIX + BUILD;

const BASE  = self.location.href;                              // …/lab/sw.js — or …/sw.js at an origin root
const SCOPE = new URL('./', BASE).pathname;                    // '/lab/' on the dev server, '/' deployed
const INDEX = new URL('./index.html', BASE).pathname;
/* THE APP ENTRY — the only two paths a navigation may be answered from the precache with (§5).  It is a
   SET of paths and not a prefix on purpose: a prefix is what stopped working when the prefix became '/'. */
const ENTRY = new Set([SCOPE, INDEX]);
/* pathname → the request we stored it under.  Query and hash never take part: the precache fetches with a
   ?__rev= buster (§3) but PUTS under the clean URL, so a plain request finds it. */
const BY_PATH = new Map(PRECACHE.map(([u]) => [new URL(u, BASE).pathname, new URL(u, BASE).href]));
const BYTES_HINT = PRECACHE.length;

/* ── 3. INSTALL — fill the cache, then WAIT.  No skipWaiting(). ─────────────────────────────────────────
 * Each file is fetched with `cache: 'reload'` AND a ?__rev=<content hash> so neither the HTTP cache nor any
 * proxy in between can hand us yesterday's bytes; the response is then PUT under the clean URL. If a single
 * file fails, the whole install rejects and the browser throws the new worker away — the old one keeps
 * serving, which is exactly the outcome we want from a half-uploaded deploy. */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const already = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    await Promise.all(PRECACHE.map(async ([url, rev]) => {
      const href = new URL(url, BASE).href;
      if (already.has(new URL(href).pathname)) return;          // a re-install of the same build is free
      const res = await fetch(new Request(href + (href.includes('?') ? '&' : '?') + '__rev=' + rev, { cache: 'reload' }));
      if (!res || !res.ok) throw new Error('precache ' + url + ' → ' + (res && res.status));
      await cache.put(new Request(href), res);
    }));
    /* THE SIGNAL (§5): if a worker is already live, this install is an UPDATE and the sessions running on
       the old build are told — while they keep running on it. A first install announces nothing. */
    if (self.registration && self.registration.active) await announce({ type: 'LW_SW_WAITING', build: BUILD, files: PRECACHE.length });
  })());
});

/* ── 4. ACTIVATE — collect the caches no worker will ever read again.  No clients.claim(). ──────────────
 * Because §3 never calls skipWaiting(), activate can only run when the previous worker has been released —
 * i.e. when no page is left on the old build. So this sweep can never delete the cache a live session is
 * reading. The one exception is the user-driven path in §6, and §5's cache miss falls through to the
 * network, so even that page degrades to "slower" and never to "broken". */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith(PREFIX) && n !== CACHE).map((n) => caches.delete(n)));
    await announce({ type: 'LW_SW_ACTIVE', build: BUILD, files: PRECACHE.length });
  })());
});

/* ── 5. FETCH — cache-first over §1, and nothing else is ever stored ────────────────────────────────────
 * The refusals above, in order, then: a navigation TO THE APP ENTRY gets index.html, and a precached URL
 * gets its stored copy. A miss inside the precache cannot happen in a healthy install, but if storage was
 * evicted we go to the network rather than fail.
 *
 * ── WAVE 68 · THE NAVIGATION RULE, AND THE RULE THAT REPLACED A COINCIDENCE ────────────────────────────
 * This arm used to be "any navigation in scope gets index.html", refused above it by
 * `startsWith(SCOPE)`. At /lab/ that refusal did the work; at the origin root SCOPE is '/' and
 * `startsWith('/')` refuses NOTHING, so from the second launch onward EVERY navigation on the hostname —
 * /LICENSE, /NOTICE, /REPORT.md, a typo — was answered from the cache with the lab. Measured in real
 * Firefox against `wrangler dev`. The nine document links in the ABOUT face each opened a second copy of
 * λWAVES, which is a GPL-3.0 §4 and OFL §2 REACHABILITY problem and not a cosmetic one, and
 * `not_found_handling: "404-page"` was defeated for every controlled visitor.
 * THE RULE IS NOW ON THE PATH ITSELF: a navigation is answered from the precache only when it names the
 * app entry (SCOPE or SCOPE + 'index.html'). The app has NO path routing at all — state travels in the
 * fragment (statelink.js) — so nothing is lost, and every other URL reaches the network exactly as this
 * file's own §NEVER_CACHE_AT_RUNTIME prose has always said it should. The scope check stays: it is still
 * the right refusal at /lab/, and it costs nothing at the root.
 * The general shape, and it is the second time this tree has met it: A RULE ENFORCED BY A COINCIDENCE OF
 * THE ADDRESS STOPS BEING A RULE WHEN THE ADDRESS CHANGES, silently and with the comment still standing.
 * tests/pwa.test.mjs now runs its whole fetch matrix AT BOTH MOUNTS, which is what closes the class. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                                     // never a write
  if (req.headers && req.headers.get && req.headers.get('range')) return;   // never a 206
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;                      // never cross-origin / opaque
  if (!url.pathname.startsWith(SCOPE)) return;                          // never above the mount (a no-op at an origin root — see above)
  if (req.mode === 'navigate') { if (!ENTRY.has(url.pathname)) return; event.respondWith(serve(INDEX, req)); return; }   // the APP ENTRY only; a document is the network's
  if (!BY_PATH.has(url.pathname)) return;                               // not ours: network, and store nothing
  event.respondWith(serve(url.pathname, req));
});

async function serve(pathname, req) {
  const href = BY_PATH.get(pathname);
  if (href) {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(new Request(href));
    if (hit) return hit;
  }
  return fetch(req);
}

/* ── 6. THE UI CHANNEL — how the lab asks, and how the USER (never the worker) takes an update ──────────
 *   page → worker  { type: 'LW_SW_HELLO' }         → replies { type:'LW_SW_BUILD', build, files, cache }
 *   page → worker  { type: 'LW_SW_SKIP_WAITING' }  → this waiting worker takes over; the page reloads on
 *                                                    navigator.serviceWorker's 'controllerchange'.
 *   worker → page  { type: 'LW_SW_WAITING', build } → a new build finished installing and is waiting (§3).
 *   worker → page  { type: 'LW_SW_ACTIVE',  build } → a build took over (first install, or after a skip).
 * SKIP_WAITING is the ONLY thing in this file that can end a session's build, and only the interface can
 * send it — the worker never sends it to itself, and no timer sends it either. */
self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'LW_SW_SKIP_WAITING') { self.skipWaiting(); return; }
  if (d.type === 'LW_SW_HELLO') {
    const msg = { type: 'LW_SW_BUILD', build: BUILD, files: PRECACHE.length, cache: CACHE };
    const port = event.ports && event.ports[0];
    if (port) port.postMessage(msg);
    else if (event.source && event.source.postMessage) event.source.postMessage(msg);
  }
});

async function announce(msg) {
  if (!self.clients || !self.clients.matchAll) return;
  const list = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const c of list) c.postMessage(msg);
}

/* Read by tests/pwa.test.mjs, which loads this file for real and drives the handlers above. */
self.LW_SW = { PREFIX, BUILD, CACHE, PRECACHE, NEVER_PRECACHE, NEVER_CACHE_AT_RUNTIME, SCOPE, INDEX, ENTRY, BY_PATH, digest };
