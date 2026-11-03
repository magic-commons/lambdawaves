/* lab/picker-collage.js — 035 THE COLLAGE (Josh 11-03: "a collage of videos … each row, alternating, slides past each other … at some point
 * during a moment where the grid is perfectly tiled, the motion rule could switch to 'Alt. columns'"): the main menu's face over a wall of
 * square λWAVES clips.  ONE VIDEO, MANY TILES: one ATLAS per theme (img/menu/collage/<theme>.mp4, 12 × 7 SLOTS of 160 px, each slot a 24-s
 * strip of twelve 2-s clips, its cuts staggered by 0.5 s × (k mod 4); tools/menu-collage.mjs) drawn by one canvas tile by tile — a tile is
 * a window onto one slot, and at the slot's cut or the tile's wrap it may jump to another slot whose clip is not its neighbours' family, so
 * the wall never repeats its arrangement.  ROWS: even rows drift right, odd rows left, at P/6 px/s; at the first instant the lattice is
 * tiled again 12 s or more after the last turn it turns to COLUMNS (nothing moves at that instant).  The wall leans by a random 1.5–3.5°
 * either way, chosen per load.  It runs only while the face is shown and the page visible; stillness (picker-fx still()) and λWAVES'
 * PERFORMANCE LIGHT draw the poster once through the same deal.  A plain module: no app, no state outside its root. */
import { onThemeChange } from './mir/kit.js';

const DIR = './img/menu/collage/', GAP = 6, TURN = 12;   // TURN: the least seconds between ROWS ↔ COLUMNS
const mod = (a, n) => ((a % n) + n) % n;

/** createCollage(root, { theme, still, lite }) → { show, hide, setTheme, destroy }: the canvas and the veil become root's first children */
export function createCollage(root, { theme, still, lite }) {
  const cvs = document.createElement('canvas'), veil = document.createElement('div');
  cvs.className = 'mm-collage'; veil.className = 'mm-veil'; cvs.hidden = veil.hidden = true; cvs.setAttribute('aria-hidden', 'true');
  root.prepend(cvs, veil);
  const ctx = cvs.getContext('2d'), buf = document.createElement('canvas'), bctx = buf.getContext('2d');
  const tilt = (Math.random() < 0.5 ? -1 : 1) * (1.5 + 2 * Math.random()) * (Math.PI / 180);
  let man = null, manP = null, th = null, shown = false, raf = 0, last = 0, vid = null, poster = null, use = null, bufAt = -1;
  let W = 0, H = 0, dpr = 1, P = 0, v = 0, T = 0, hx = 0, hy = 0, nc = 0, nr = 0, grid = null, mode = 0, tau = 0;
  const g = [0, 0];   // the lattice's offsets along x and y (a turn on a half tile carries P/2)

  /* the manifest's clock: slot k plays clips[j] over [off + 2j, off + 2j + 2) modulo the loop; at = the atlas' own time */
  const M = () => man.themes[th];
  const beatOf = (k, at) => Math.floor(mod(at - M().slots[k].off, man.dur) / man.beat);
  const famOf = (k, at) => M().slots[k].clips[beatOf(k, at)];
  const toEdge = (k, at) => man.beat - mod(at - M().slots[k].off, man.beat);
  const live = () => !!vid && vid.readyState >= 2;
  const atNow = () => (live() ? vid.currentTime : 0);
  /** the video's frame, copied once per new frame: every tile is a blit from it (a drawImage of the video itself converts the whole frame each call) */
  function frameOf() {
    if (buf.width !== vid.videoWidth) { buf.width = vid.videoWidth; buf.height = vid.videoHeight; bufAt = -1; }
    if (vid.currentTime !== bufAt) { bufAt = vid.currentTime; bctx.drawImage(vid, 0, 0); }
    return buf;
  }

  /* a LINE moves: in ROWS (mode 0) a row along x, in COLUMNS (mode 1) a column along y; ALONG is the tile's place in its line */
  const nAl = () => (mode ? nr : nc), nLn = () => (mode ? nc : nr);
  const cell = (ln, al) => (mode ? grid[al][ln] : grid[ln][al]);
  const shift = (ln, t) => (ln % 2 ? -v : v) * t;
  const along = (ln, al, t) => al * P + g[mode] + shift(ln, t);

  function layout() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
    P = Math.min(190, Math.max(150, 0.11 * W)); v = P / 6;
    const step = P / (2 * v); T = Math.ceil(TURN / step - 1e-9) * step;   // the lattice is tiled each time the lines have slid half a tile apart
    const c = Math.abs(Math.cos(tilt)), s = Math.abs(Math.sin(tilt));
    hx = Math.ceil((W * c + H * s) / 2); hy = Math.ceil((W * s + H * c) / 2);   // the tilted view's half extents: the canvas, turned by CSS (the compositor's
    cvs.width = Math.round(2 * hx * dpr); cvs.height = Math.round(2 * hy * dpr);  // turn is cheaper than a canvas rotate: every tile stays an upright blit)
    Object.assign(cvs.style, { width: 2 * hx + 'px', height: 2 * hy + 'px', left: W / 2 - hx + 'px', top: H / 2 - hy + 'px', transform: `rotate(${tilt}rad)` });
    nc = Math.ceil((2 * hx) / P) + 3; nr = Math.ceil((2 * hy) / P) + 3;   // the overscan: a tile wraps out of sight
    mode = 0; tau = 0; g[0] = g[1] = 0;
    grid = Array.from({ length: nr }, () => Array.from({ length: nc }, () => ({ k: -1, j: -1, lap: 0 })));
    deal();
  }
  /** the tiles touching (ln, al) now: its line's two and the two it overlaps in each line beside it */
  function near(ln, al) {
    const out = [cell(ln, mod(al + 1, nAl())), cell(ln, mod(al - 1, nAl()))], u = along(ln, al, tau);
    for (const l2 of [ln - 1, ln + 1]) {
      if (l2 < 0 || l2 >= nLn()) continue;
      const a = (u - g[mode] - shift(l2, tau)) / P; out.push(cell(l2, mod(Math.floor(a), nAl())), cell(l2, mod(Math.ceil(a), nAl())));
    }
    return out;
  }
  /** a slot for (ln, al): not a neighbour's family at `at`, the least used (no slot twice while one is spare), at random among those;
      `fresh` also asks a second or more before its next cut */
  function choose(ln, al, at, fresh) {
    const ban = new Set(); for (const n of near(ln, al)) if (n.k >= 0) ban.add(famOf(n.k, at));
    let best = [], least = Infinity;
    for (let k = 0; k < use.length; k++) {
      if (ban.has(famOf(k, at)) || (fresh && toEdge(k, at) < 1)) continue;
      if (use[k] < least) { least = use[k]; best = [k]; } else if (use[k] === least) best.push(k);
    }
    return best.length ? best[Math.floor(Math.random() * best.length)] : -1;
  }
  function take(c, k, at) { if (c.k >= 0) use[c.k]--; c.k = k; use[k]++; c.j = beatOf(k, at); }
  function deal() {
    if (!man || !grid || !th) return;
    use = new Array(M().slots.length).fill(0); const at = atNow();
    for (const row of grid) for (const c of row) c.k = -1;
    for (let ln = 0; ln < nLn(); ln++) for (let al = 0; al < nAl(); al++) { const k = choose(ln, al, at, false); take(cell(ln, al), k >= 0 ? k : Math.floor(Math.random() * use.length), at); }
  }
  /** the turn, at t = T exactly: the lines stand tiled, so each tile is re-seated in the lattice and the other axis begins to move */
  function turn() {
    const L = nAl(), g2 = (Math.round((2 * mod(g[mode] + v * T, P)) / P) * (P / 2)) % P, seat = [];
    for (let ln = 0; ln < nLn(); ln++) { const row = []; for (let al = 0; al < L; al++) row[mod(Math.round((along(ln, al, T) - g2) / P), L)] = cell(ln, al); seat.push(row); }
    for (let ln = 0; ln < nLn(); ln++) for (let al = 0; al < L; al++) { const c = seat[ln][al]; c.lap = 0; if (mode) grid[al][ln] = c; else grid[ln][al] = c; }
    g[mode] = g2; mode ^= 1;
  }
  function paint(at, src) {
    if (!src || !grid || (src === poster && !poster.naturalWidth)) return;   // a poster not yet decoded draws nothing
    const sc = src === poster ? 0.5 : 1, t = man.tile * sc, cols = man.cols, ox = (-nc * P) / 2, oy = (-nr * P) / 2, L = nAl() * P, s = P - GAP;
    ctx.setTransform(dpr, 0, 0, dpr, hx * dpr, hy * dpr); ctx.clearRect(-hx, -hy, 2 * hx, 2 * hy);
    for (let ln = 0; ln < nLn(); ln++) for (let al = 0; al < nAl(); al++) {
      const c = cell(ln, al), u = along(ln, al, tau), lap = Math.floor(u / L);
      if (lap !== c.lap) { c.lap = lap; const k = choose(ln, al, at, true); if (k >= 0) take(c, k, at); }   // a wrap re-enters on a new slot
      else if (beatOf(c.k, at) !== c.j) {   // its own cut: half the time a jump, and always when the lines' sliding has brought its family beside it
        c.j = beatOf(c.k, at); const f = famOf(c.k, at);
        if (Math.random() < 0.5 || near(ln, al).some((n) => famOf(n.k, at) === f)) { const k = choose(ln, al, at, true); if (k >= 0 && k !== c.k) take(c, k, at); }
      }
      const a = mod(u, L) + (mode ? oy : ox), w = ln * P + g[mode ^ 1] + (mode ? ox : oy), x = mode ? w : a, y = mode ? a : w;
      if (x > hx || x + P < -hx || y > hy || y + P < -hy) continue;
      ctx.drawImage(src, (c.k % cols) * t, Math.floor(c.k / cols) * t, t, t, x + GAP / 2, y + GAP / 2, s, s);
    }
    if (!cvs.classList.contains('on')) cvs.classList.add('on');   // the first picture fades the wall in (a write once, not a frame)
  }
  function drawCollage(now) {
    raf = 0; if (!shown || root.hidden || document.hidden) return;
    raf = requestAnimationFrame(drawCollage);
    if (now - last < 1000 / man.fps - 4) return;   // the wall moves at the atlas' own 30 frames a second: on a 60-Hz screen every other frame
    tau += Math.min(0.25, (now - last) / 1000); last = now;
    while (tau >= T) { turn(); tau -= T; }
    paint(atNow(), live() ? frameOf() : poster);
  }

  const quiet = () => still() || lite();
  function loadPoster() {
    const want = DIR + th + '.webp'; if (poster && poster.getAttribute('src') === want) return;
    poster = new Image(); poster.decoding = 'async'; poster.src = want;
    poster.addEventListener('load', () => { if (shown && quiet()) paint(0, poster); }, { once: true });
  }
  function start() {
    if (!man || !shown || root.hidden || document.hidden) return;
    if (!th) th = theme();
    if (!grid) layout();
    loadPoster();
    if (quiet()) { if (vid) vid.pause(); paint(0, poster); return; }   // stillness: the poster once (when it has come), no loop
    if (!vid) {
      vid = document.createElement('video'); vid.muted = vid.defaultMuted = vid.loop = vid.playsInline = true; vid.preload = 'metadata';
      vid.addEventListener('error', () => { vid = null; }, { once: true });   // no atlas: the poster stays
    }
    const src = DIR + th + '.mp4'; if (vid.getAttribute('src') !== src) vid.src = src;
    const r = vid.play(); if (r && r.catch) r.catch(() => {});
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(drawCollage); }
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (vid) vid.pause(); }
  const onVis = () => (document.hidden ? stop() : start());
  const onResize = () => { grid = null; if (shown) start(); };
  document.addEventListener('visibilitychange', onVis); addEventListener('resize', onResize);
  const offTheme = onThemeChange(() => api.setTheme(theme()));

  const api = {
    show() {
      if (shown) return; shown = true; cvs.hidden = veil.hidden = false;
      if (!manP) manP = fetch(DIR + 'collage.json').then((r) => (r.ok ? r.json() : null)).then((j) => { man = j && j.themes ? j : null; }, () => {});   // once; none: the plain ground
      manP.then(start);
    },
    hide() { if (!shown) return; shown = false; stop(); cvs.hidden = veil.hidden = true; },
    setTheme(t) {
      t = t === 'light' ? 'light' : 'dark'; if (t === th) return; th = t;
      bufAt = -1; if (man) deal(); cvs.classList.remove('on'); if (shown) start();
    },
    destroy() { api.hide(); offTheme(); document.removeEventListener('visibilitychange', onVis); removeEventListener('resize', onResize); if (vid) vid.removeAttribute('src'); cvs.remove(); veil.remove(); },
  };
  return api;
}
