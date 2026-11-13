/* lab/loader.js — THE LOADING SCREEN (036 G7; Josh, FOR JOSH 035 answer 2: "When first opening the site, there should be a loading screen that
 * goes from 0% to 100% with the MIR logo filling up like a defragging kind of heuristic … everything for the whole app loads with the fonts,
 * videos, built in molecules... everything except the expansions").  It stands between the notice's CONTINUE and the menu's face on an open
 * where THE SET is not all on this device or the build is new (rack.js; never for a test driver unless ?loader=1).
 * THE SET: (a) THE APP — the worker's precache: its cache's entries counted against the worker's `files` every 150 ms until it is active
 * (the worker says no word per entry; a page it already controls is done); (b) THE FACES — document.fonts.load, then ready; (c) THE MENU's
 * DATA — the wall's atlases, its still walls (WALLS) and collage.json, the face's art, VOL. I's heroes, the tutorial's films and stills, the strip's two
 * faces — fetched with a byte reader and kept whole (library.js keepData; the worker answers a film's Range from it); (d) THE MOLECULES —
 * the 47 built-in records (library.json's rows and vibrations), each checked against its name (fetchRecord).  The volumes never.
 * THE FRESHNESS (img/menu/ left the worker's sweep): on the first open of a build (the PREFERENCE `lambdawaves.q0.loader` { build }) every
 * kept menu file is compared with the deployed one by a HEAD (its ETag, else its length and date) and dropped when it changed, and the other
 * kept menu pictures are dropped as the sweep did; the records are named by their bytes.
 * THE PICTURE: the MIR flag (the wordmark's nine, turned as the mark), each square an 8 × 8 field — 576 cells — lit in a seeded scatter of
 * short runs as the bytes climb (a defrag map), the newest run bright; the percentage under it and one line naming what loads.  At 100 % the
 * flag holds 400 ms and the face comes in.  Reduced motion: the cells fill, nothing flickers.  A quiet CONTINUE after 8 s lets the face in
 * at once while the loading goes on.  A plain module: no app. */
import { BUILD_ID } from './build-id.js';
import { keepData, fetchRecord, DATA_CACHE } from './library.js';
import { jsonStore } from './mir/core/prefs.js';
import { el } from './mir/kit.js';
import { TUTORIAL, HEROES, WALLS } from './picker.js';

const KEY = 'lambdawaves.q0.loader';
const APP_MEAN = 20000, FACE_W = 40000;   // the bar's weight of one precache entry (≈ 8.2 MiB over ≈ 430 files) and of one face, in bytes
const AI_FACES = globalThis.lwavesDesktop ? [] : [['600 15px "OpenAI Sans"', 'OpenAISans-Semibold.woff2'], ['600 15px "Google Sans Flex"', 'GoogleSansFlex-Semibold.ttf']];   // 044 S1: the credits strip's faces; the desktop build has no strip and no such file
const FACES = ['16px Roboto', '16px "LW Title"', '16px "STIX Two Math"', ...AI_FACES.map((f) => f[0])];
const FLAG = ['#f15b66', '#f5bf5e', '#5bcfc2', '#f58b53', '#68cb83', '#767fd3', '#bad969', '#5ca9e4', '#b979d0'];   // img/mir-logo-*.svg's nine, row by row
const OFF = new Set(['automation', 'declined', 'unsupported', 'failed']);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const abs = (u) => new URL(u, location.href).href;
const MB = (b) => (b / 1048576).toFixed(1) + ' MB';

function menuSet() {
  const out = [], add = (g, f) => out.push({ g, url: abs('./img/menu/' + f) });
  for (const t of ['dark', 'light']) { add('wall', `collage/${t}.mp4`); for (const w of WALLS) add('wall', `wall/${w}.${t}.webp`); }   // 037 M2: no poster; the still walls
  add('wall', 'collage/collage.json');
  for (const f of ['mir-interface.webp', 'library-dark.webp', 'library-light.webp']) add('wall', 'face/' + f);
  for (const [id, th] of Object.entries(HEROES)) for (const t of th.split(' ')) { add('wall', `vol/${id}.${t}.mp4`); add('wall', `vol/${id}.${t}.webp`); }
  for (const f of AI_FACES) add('faces', 'ai/' + f[1]);
  for (const r of TUTORIAL) for (const t of r.themes.split(' ')) { add('tut', `tut/${r.id}.${t}.mp4`); add('tut', `tut/${r.id}.${t}.webp`); }
  return out;
}
async function recordSet() {
  try { const j = await (await fetch('./library.json')).json();
    return [...(j.rows || []), ...(j.vibrations || [])].filter((r) => r.hash).map((r) => ({ g: 'mol', hash: r.hash, bytes: r.bytes || 0, url: abs('./library/' + r.hash + '.json') })); } catch (_) { return []; }
}
const appSettled = (sw) => !('serviceWorker' in navigator) || !!navigator.serviceWorker.controller || OFF.has(sw && sw.mode);
/** the worker's own count and cache name (its HELLO answer; an installing worker answers too) */
const hello = (w) => new Promise((res) => {
  const ch = new MessageChannel(), t = setTimeout(() => res(null), 1000);
  ch.port1.onmessage = (e) => { clearTimeout(t); const d = e.data || {}; res(d.files && d.cache ? { files: d.files, cache: d.cache } : null); };
  try { w.postMessage({ type: 'LW_SW_HELLO' }, [ch.port2]); } catch (_) { clearTimeout(t); res(null); }
});
/** n promises at a time over `list` */
async function pool(list, n, fn) { let i = 0; await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => { while (i < list.length) await fn(list[i++]); })); }
/** the kept copy's word against the deployed one's: true when they differ (a HEAD that fails changes nothing) */
async function changed(dc, url) {
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-cache' }); if (!r.ok) return false;
    const k = await dc.match(url); if (!k) return true;
    const h = (x, n) => x.headers.get(n) || '';
    if (h(r, 'etag') && h(k, 'etag')) return h(r, 'etag') !== h(k, 'etag');
    return h(r, 'content-length') !== h(k, 'content-length') || h(r, 'last-modified') !== h(k, 'last-modified');
  } catch (_) { return false; }
}
/** the cells' order: short runs (3–10 cells along a square's row) from seeded scattered starts — the defrag map's writes */
function defrag(seed = 0x6d1f) {
  let s = seed >>> 0; const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const lit = new Uint8Array(576), order = [];
  while (order.length < 576) {
    let k = Math.floor(rnd() * 576); while (lit[k]) k = (k + 1) % 576;
    for (let run = 3 + Math.floor(rnd() * 8); run > 0 && !lit[k]; run--) { lit[k] = 1; order.push(k); k = (k + 1) % 576; }
  }
  return order;
}

/** runLoader({ sw }) → a promise that settles when the face may come: at once when THE SET is here, else at 100 % (or a press on CONTINUE —
    the loading then goes on behind) */
export function runLoader(o = {}) {
  let release = null; const gate = new Promise((r) => { release = r; });
  work(o, release).catch(() => {}).finally(() => release());
  return gate;
}
async function work({ sw = null }, release) {
  const store = jsonStore(KEY), was = store.get(), fresh = !!(was && was.build === BUILD_ID);
  let dc; try { dc = await caches.open(DATA_CACHE); } catch (_) { return; }   // no Cache Storage here: nothing can be kept
  const items = menuSet(), recs = await recordSet(), every = [...items, ...recs];
  let kept = new Set((await dc.keys().catch(() => [])).map((r) => r.url));
  if (fresh && every.every((i) => kept.has(i.url)) && appSettled(sw)) return;   // THE SET is here: straight to the face

  /* ── the screen ── */
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || /^(reduced|off)$/.test(document.documentElement.dataset.motion || '');
  const root = el('div', 'lw-loader', document.body); root.id = 'lwLoader'; root.setAttribute('role', 'progressbar'); root.setAttribute('aria-label', 'Loading λWAVES');
  root.setAttribute('aria-valuemin', '0'); root.setAttribute('aria-valuemax', '100'); root.setAttribute('aria-valuenow', '0');
  const cv = el('canvas', 'ld-flag', root), pct = el('b', 'ld-pct', root, '0 %'), line = el('span', 'ld-line', root), skip = el('button', 'ld-skip', root, 'CONTINUE');
  skip.type = 'button'; skip.hidden = true; document.body.classList.add('lw-loading');
  const order = defrag(), at = new Float64Array(576).fill(-1);   // at[k]: when cell k was lit (its write-head brightness fades over 320 ms from there)
  let shown = 0, raf = 0, frac = 0, ended = false, gone = false;
  const draw = () => {
    const S = cv.clientWidth || 220, dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(S * dpr)) { cv.width = cv.height = Math.round(S * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, S);
    g.translate(S / 2, S / 2); g.rotate(Math.PI / 4);
    const G = (S / Math.SQRT2) * 0.94, sq = G / 3, gap = sq * 0.08, cs = (sq - gap) / 8, light = document.body.dataset.theme === 'light';
    const now = performance.now(), want = Math.round(frac * 576); while (shown < want) at[order[shown++]] = now;
    for (let k = 0; k < 576; k++) {
      const q = k >> 6, w = k & 63, x = -G / 2 + (q % 3) * sq + gap / 2 + (w & 7) * cs, y = -G / 2 + Math.floor(q / 3) * sq + gap / 2 + (w >> 3) * cs, age = at[k] < 0 ? -1 : now - at[k];
      g.globalAlpha = age < 0 ? (light ? 0.2 : 0.14) : 1; g.fillStyle = FLAG[q]; g.fillRect(x + cs * 0.07, y + cs * 0.07, cs * 0.86, cs * 0.86);
      if (age >= 0 && age < 320 && !still) { g.globalAlpha = 0.85 * (1 - age / 320); g.fillStyle = '#fff'; g.fillRect(x + cs * 0.07, y + cs * 0.07, cs * 0.86, cs * 0.86); }   // the write head
    }
    g.globalAlpha = 1;
  };
  const tick = () => { draw(); raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  const leave = () => { if (gone) return; gone = true; clearTimeout(skipT); root.classList.add('out'); document.body.classList.remove('lw-loading'); release();
    setTimeout(() => { cancelAnimationFrame(raf); root.remove(); }, still ? 0 : 460); };
  const skipT = setTimeout(() => { skip.hidden = false; }, 8000);
  skip.addEventListener('click', leave);

  /* ── the bar: bytes, the app weighed by its count ── */
  const P = { app: { n: 0, of: 0, done: appSettled(sw) }, faces: { n: 0, of: FACES.length }, wall: { n: 0, of: 0, b: 0 }, tut: { n: 0, of: 0 }, mol: { n: 0, of: recs.length } };
  for (const i of items) if (i.g !== 'faces') P[i.g].of++;
  const appW = P.app.done ? 0 : 430 * APP_MEAN;
  let done = 0, total = FACES.length * FACE_W + appW, failed = 0;
  const say = () => {
    const appB = P.app.done ? appW : P.app.of ? appW * Math.min(1, P.app.n / P.app.of) : 0;
    frac = Math.min(ended ? 1 : 0.995, (done + appB) / Math.max(1, total));
    const p = Math.floor(frac * 100); pct.textContent = p + ' %'; root.setAttribute('aria-valuenow', String(p));
    line.textContent = [P.app.done ? 'APP ✓' : 'APP ' + P.app.n + ' / ' + (P.app.of || '…'), P.faces.n < P.faces.of ? 'FONTS ' + P.faces.n + ' / ' + P.faces.of : 'FONTS ✓',
      'THE MENU ' + MB(P.wall.b), 'TUTORIAL ' + P.tut.n + ' / ' + P.tut.of, 'MOLECULES ' + P.mol.n + ' / ' + P.mol.of].join(' · ');
  };
  say();

  /* ── THE FRESHNESS: a new build compares what is kept; then the sizes of what is missing ── */
  if (!fresh) {
    await pool(items.filter((i) => kept.has(i.url)), 8, async (i) => { if (await changed(dc, i.url)) await dc.delete(i.url).catch(() => {}); });
    const set = new Set(items.map((i) => i.url)), MENU = abs('./img/menu/');
    for (const r of await dc.keys().catch(() => [])) if (r.url.startsWith(MENU) && !set.has(r.url)) await dc.delete(r).catch(() => {});   // the other kept menu pictures, as the sweep did
    kept = new Set((await dc.keys().catch(() => [])).map((r) => r.url));
  }
  const want = every.filter((i) => !kept.has(i.url));
  for (const i of every) if (kept.has(i.url) && i.g !== 'faces') P[i.g].n++;
  await pool(want.filter((i) => i.g !== 'mol'), 8, async (i) => { try { const r = await fetch(i.url, { method: 'HEAD', cache: 'no-cache' }); i.bytes = +r.headers.get('content-length') || 0; } catch (_) { i.bytes = 0; } });
  for (const i of want) total += i.bytes || 0;
  say();

  /* ── (a) the app: the worker's cache counted ── */
  const appRun = (async () => {
    const t0 = performance.now(); let info = null, asked = 0;
    while (!P.app.done && !appSettled(sw)) {
      const reg = (sw && sw.registration) || await navigator.serviceWorker.getRegistration().catch(() => null);
      if (reg) {
        if (!reg.installing) break;   // nothing installing: the precache is as full as it gets (active — a first install's page stays uncontrolled until its next load —, waiting, or a first install that went redundant)
        const w = reg.installing;
        if (!info && w && performance.now() - asked > 1000) { asked = performance.now(); info = await hello(w); }
        if (info) { P.app.of = info.files; P.app.n = (await (await caches.open(info.cache)).keys().catch(() => [])).length; }
      } else if (performance.now() - t0 > 30000) break;   // no worker came: nothing to wait for
      say(); await wait(150);
    }
    P.app.done = true; say();
  })();
  /* ── (c) (d) the DATA — the menu's first, then the tutorial and the records; (b) the faces once their files are kept ── */
  const pull = async (i) => {
    try {
      if (i.g === 'mol') { let had = 0; const r = await fetchRecord(i.hash, { network: true, onProgress: (got) => { done += got - had; had = got; say(); } }); if (!r.record) failed++; done += Math.max(0, (i.bytes || 0) - had); P.mol.n++; say(); return; }
      const res = await fetch(i.url, { cache: 'no-cache' }); if (!res.ok) throw new Error(String(res.status));
      const parts = [];
      if (res.body && res.body.getReader) { const rd = res.body.getReader(); for (;;) { const { done: end, value } = await rd.read(); if (end) break; parts.push(value); done += value.length; if (i.g !== 'tut') P.wall.b += value.length; say(); } }
      else { const b = new Uint8Array(await res.arrayBuffer()); parts.push(b); done += b.length; }
      if (!(await keepData(i.url, new Response(new Blob(parts), { status: res.status, statusText: res.statusText, headers: res.headers })))) failed++;
      if (i.g !== 'faces') P[i.g].n++;
    } catch (_) { failed++; done += i.bytes || 0; if (i.g !== 'faces') P[i.g].n++; }
    say();
  };
  const dataRun = (async () => {
    await pool(want.filter((i) => i.g === 'wall' || i.g === 'faces'), 4, pull);
    const facesRun = Promise.all(FACES.map((f) => document.fonts.load(f).catch(() => null).then(() => { P.faces.n++; done += FACE_W; say(); }))).then(() => document.fonts.ready);
    await pool(want.filter((i) => i.g === 'tut' || i.g === 'mol'), 4, pull);
    await facesRun;
  })();
  await Promise.all([appRun, dataRun]);
  ended = true; say();
  if (!failed) store.set({ build: BUILD_ID }); else line.textContent = 'OFFLINE · ' + failed + ' FILES WAIT FOR THE NETWORK';
  if (!gone) { await wait(failed ? 1200 : 400); leave(); }   // the flag complete, held, then the face
}
