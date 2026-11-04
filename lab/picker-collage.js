/* lab/picker-collage.js — 035 THE COLLAGE (Josh 11-03: "a collage of videos … each row, alternating, slides past each other … at some point
 * during a moment where the grid is perfectly tiled, the motion rule could switch to 'Alt. columns'"): the main menu's face over a wall of
 * square λWAVES clips.  ONE VIDEO, MANY TILES: one ATLAS per theme (img/menu/collage/<theme>.mp4, 12 × 7 SLOTS of 160 px, each slot a 24-s
 * strip of twelve 2-s clips, its cuts staggered by 0.5 s × (k mod 4); tools/menu-collage.mjs) drawn by one canvas tile by tile — a tile is
 * a window onto one slot, and at the slot's cut or the tile's wrap it may jump to another slot — never one playing within 3 tiles, the
 * least seen on screen, not its neighbours' family — so the wall never repeats its arrangement and shows no twin while a slot is spare.  ROWS: even rows drift right, odd rows left, at P/6 px/s; at the first instant the lattice is
 * tiled again 12 s or more after the last turn it turns to COLUMNS (nothing moves at that instant).  The wall leans by a random 1.5–3.5°
 * either way, chosen per load.  It runs only while the face is shown and the page visible; stillness (picker-fx still()) and λWAVES'
 * PERFORMANCE LIGHT, looked at once a second while it runs, pause it on the poster drawn through the same deal.  A plain module: no app,
 * no state outside its root. */
import { onThemeChange } from './mir/kit.js';

const DIR = './img/menu/collage/', TURN = 12, DRAW_HZ = 30, NEAR = 3.5, INSET = 2;   // TURN: the least seconds between ROWS ↔ COLUMNS; NEAR: no twin
                     // within 3 tiles (Chebyshev, half a tile of slack mid-slide); INSET: atlas px off each side of a slot (x264's cross-slot bleed)
const mod = (a, n) => ((a % n) + n) % n;

/** createCollage(root, { theme, still, lite }) → { show, hide, setTheme, destroy }: the canvas and the veil become root's first children */
export function createCollage(root, { theme, still, lite }) {
  const cvs = document.createElement('canvas'), veil = document.createElement('div');
  cvs.className = 'mm-collage'; veil.className = 'mm-veil'; cvs.hidden = veil.hidden = true; cvs.setAttribute('aria-hidden', 'true');
  root.prepend(cvs, veil);
  const ctx = cvs.getContext('2d'), buf = document.createElement('canvas'), bctx = buf.getContext('2d');
  const tilt = (Math.random() < 0.5 ? -1 : 1) * (1.5 + 2 * Math.random()) * (Math.PI / 180);
  let man = null, manP = null, th = null, shown = false, raf = 0, last = 0, vid = null, poster = null, bufAt = -1, qAt = 0, qT = 0;
  let W = 0, H = 0, dpr = 1, P = 0, v = 0, T = 0, hx = 0, hy = 0, nc = 0, nr = 0, ox = 0, oy = 0, grid = null, mode = 0, tau = 0, px = 0, py = 0;
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
  /** the tile's top-left on the canvas now → px, py */
  function place(ln, al) {
    const a = mod(along(ln, al, tau), nAl() * P) + (mode ? oy : ox), w = ln * P + g[mode ^ 1] + (mode ? ox : oy);
    px = mode ? w : a; py = mode ? a : w;
  }
  const inView = () => px < hx && px + P > -hx && py < hy && py + P > -hy;

  function layout() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
    P = (2 * Math.round((Math.min(190, Math.max(150, 0.11 * W)) * dpr) / 2)) / dpr; v = P / 6;   // NO EDGE (036 C3): the pitch an even count of device px
    const step = P / (2 * v); T = Math.ceil(TURN / step - 1e-9) * step;   // the lattice is tiled each time the lines have slid half a tile apart
    const c = Math.abs(Math.cos(tilt)), s = Math.abs(Math.sin(tilt));
    hx = Math.ceil((W * c + H * s) / 2); hy = Math.ceil((W * s + H * c) / 2);   // the tilted view's half extents: the canvas, turned by CSS (the compositor's
    cvs.width = Math.round(2 * hx * dpr); cvs.height = Math.round(2 * hy * dpr);  // turn is cheaper than a canvas rotate: every tile stays an upright blit)
    Object.assign(cvs.style, { width: 2 * hx + 'px', height: 2 * hy + 'px', left: W / 2 - hx + 'px', top: H / 2 - hy + 'px', transform: `rotate(${tilt}rad)` });
    nc = Math.ceil((2 * hx) / P) + 3; nr = Math.ceil((2 * hy) / P) + 3; ox = (-nc * P) / 2; oy = (-nr * P) / 2;   // the overscan: a tile wraps out of sight
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
  /** a slot for (ln, al): never one playing within NEAR tiles, not a neighbour's family at `at` (this rule gives way first), with `fresh`
      a second or more before its next cut; among those the least seen on screen, at random */
  function choose(ln, al, at, fresh) {
    const S = M().slots.length, seen = new Int16Array(S), ban = new Uint8Array(S), fam = new Set(), R = NEAR * P;
    place(ln, al); const x0 = px, y0 = py;
    for (let l2 = 0; l2 < nLn(); l2++) for (let a2 = 0; a2 < nAl(); a2++) {
      const c = cell(l2, a2); if (c.k < 0 || (l2 === ln && a2 === al)) continue;
      place(l2, a2); if (Math.abs(px - x0) < R && Math.abs(py - y0) < R) ban[c.k] = 1;
      if (inView()) seen[c.k]++;
    }
    for (const n of near(ln, al)) if (n.k >= 0) fam.add(famOf(n.k, at));
    for (const strict of [true, false]) {
      let best = [], least = Infinity;
      for (let k = 0; k < S; k++) {
        if (ban[k] || (strict && fam.has(famOf(k, at))) || (fresh && toEdge(k, at) < 1)) continue;
        if (seen[k] < least) { least = seen[k]; best = [k]; } else if (seen[k] === least) best.push(k);
      }
      if (best.length) return best[Math.floor(Math.random() * best.length)];
    }
    return -1;
  }
  /** at its own cut a tile must move when the sliding lines have brought its family beside it or its slot within NEAR tiles */
  function crowded(ln, al, at) {
    const k = cell(ln, al).k, f = famOf(k, at), R = NEAR * P; if (near(ln, al).some((n) => n.k >= 0 && famOf(n.k, at) === f)) return true;
    place(ln, al); const x0 = px, y0 = py;
    for (let l2 = 0; l2 < nLn(); l2++) for (let a2 = 0; a2 < nAl(); a2++) {
      if (cell(l2, a2).k !== k || (l2 === ln && a2 === al)) continue;
      place(l2, a2); if (Math.abs(px - x0) < R && Math.abs(py - y0) < R) return true;
    }
    return false;
  }
  function take(c, k, at) { c.k = k; c.j = beatOf(k, at); }
  function deal() {
    if (!man || !grid || !th) return;
    const at = atNow(); for (const row of grid) for (const c of row) c.k = -1;
    for (let ln = 0; ln < nLn(); ln++) for (let al = 0; al < nAl(); al++) { const k = choose(ln, al, at, false); take(cell(ln, al), k >= 0 ? k : Math.floor(Math.random() * M().slots.length), at); }
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
    const sc = src === poster ? 0.5 : 1, t = man.tile * sc, e = INSET * sc, cols = man.cols, L = nAl() * P, s = Math.round(P * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cvs.width, cvs.height); ctx.imageSmoothingQuality = 'medium';
    for (let ln = 0; ln < nLn(); ln++) for (let al = 0; al < nAl(); al++) {
      const c = cell(ln, al), u = along(ln, al, tau), lap = Math.floor(u / L);
      if (lap !== c.lap) { c.lap = lap; const k = choose(ln, al, at, true); if (k >= 0) take(c, k, at); }   // a wrap re-enters on a new slot
      else if (beatOf(c.k, at) !== c.j) {   // its own cut: half the time a jump, and always when it is crowded
        c.j = beatOf(c.k, at);
        if (Math.random() < 0.5 || crowded(ln, al, at)) { const k = choose(ln, al, at, true); if (k >= 0 && k !== c.k) take(c, k, at); }
      }
      place(ln, al); if (!inView()) continue;
      ctx.drawImage(src, (c.k % cols) * t + e, Math.floor(c.k / cols) * t + e, t - 2 * e, t - 2 * e, Math.round((px + hx) * dpr), Math.round((py + hy) * dpr), s, s);   // a whole device px, abutting
    }
    if (!cvs.classList.contains('on')) cvs.classList.add('on');   // the first picture fades the wall in (a write once, not a frame)
  }
  function drawCollage(now) {
    raf = 0; if (!shown || root.hidden || document.hidden) return;
    if (now - qAt > 1000) { qAt = now; if (quiet()) { rest(); return; } }   // MOTION or PERFORMANCE may change under the open menu: a look a second
    raf = requestAnimationFrame(drawCollage);
    if (now - last < 1000 / DRAW_HZ - 4) return;   // the wall moves 30 times a second: on a 60-Hz screen every other frame
    tau += Math.min(0.25, (now - last) / 1000); last = now;
    while (tau >= T) { turn(); tau -= T; }
    paint(atNow(), live() ? frameOf() : poster);
  }

  const quiet = () => still() || lite();
  /** quiet: the video paused, the poster drawn once through the same deal, and a look once a second for the way back */
  function rest() {
    if (raf) cancelAnimationFrame(raf); raf = 0; if (vid) vid.pause(); paint(0, poster);
    clearTimeout(qT); qT = setTimeout(function wake() { qT = 0; if (!shown || root.hidden || document.hidden) return; if (quiet()) qT = setTimeout(wake, 1000); else start(); }, 1000);
  }
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
    if (quiet()) { rest(); return; }   // stillness: the poster once (when it has come), no loop
    if (!vid) {
      vid = document.createElement('video'); vid.muted = vid.defaultMuted = vid.loop = vid.playsInline = true; vid.preload = 'metadata';
      vid.addEventListener('error', () => { vid = null; }, { once: true });   // no atlas: the poster stays
    }
    const src = DIR + th + '.mp4'; if (vid.getAttribute('src') !== src) vid.src = src;
    const r = vid.play(); if (r && r.catch) r.catch(() => {});
    if (!raf) { last = qAt = performance.now(); raf = requestAnimationFrame(drawCollage); }
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; clearTimeout(qT); qT = 0; if (vid) vid.pause(); }
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
