/* lab/picker-collage.js — 035 THE COLLAGE (Josh 11-03: "a collage of videos … each row, alternating, slides past each other … at some point
 * during a moment where the grid is perfectly tiled, the motion rule could switch to 'Alt. columns'"): the main menu's face over a wall of
 * square λWAVES clips.  ONE VIDEO, MANY TILES: one ATLAS per theme (img/menu/collage/<theme>.mp4, 12 × 7 SLOTS of 160 px, each slot a 24-s
 * strip of twelve 2-s clips, its cuts staggered by 0.5 s × (k mod 4); tools/menu-collage.mjs); a tile is a window onto one slot, and at the
 * slot's cut or the tile's wrap it may jump to another — never one playing within 3 tiles, the least seen on screen, not its neighbours'
 * family — so the wall never repeats its arrangement and shows no twin while a slot is spare.  ROWS: even rows drift right, odd rows left, at
 * P/6 px/s; at the first instant the lattice is tiled again 12 s or more after the last turn it turns to COLUMNS (nothing moves at that
 * instant).  The wall leans by a random 1.5–3.5° either way, chosen per load.
 * 036 C4 THE SMOOTH WALL (Josh 11-03: "the Collage itself sometimes freezes for a split second every now and then"): THE STRIPS — each row
 * (ROWS) or column (COLUMNS) is its own canvas of its line's tiles at the atlas' own 156 px (the 160-px slot less its 2-px inset: x264's
 * cross-slot bleed), scaled to the pitch by the compositor and laid one device px over its neighbour (a turned layer's edge is antialiased:
 * the overlap keeps the ground out of the seam).  A leg (12 s, two tiles of travel) is ONE linear animation per strip, so the compositor
 * slides the wall at the display's rate and a busy main thread (the lab's own pauses — a GC or a cycle collection of 100–200 ms about every
 * 10 s, there with the wall stopped too) holds the pictures, never the motion; a strip carries two spare slots on its trailing side, so its
 * tiles never wrap mid-leg.  The blits happen only on a NEW VIDEO FRAME (requestVideoFrameCallback; else the frame count, a rAF a look): the
 * frame copied once to a buffer (a drawImage of the video converts the whole frame each call), then each slot in view a 1:1 blit from it.
 * THE TURN re-seats the lattice, blits the other set once and swaps the two; a resize (debounced) keeps the mode and the clock; a dip of the
 * video holds its last frame (the poster only before the first frame and in stillness).  It runs only while the face is shown and the page
 * visible; stillness (picker-fx still()) and λWAVES' PERFORMANCE LIGHT, looked at once a second, hold it on the poster drawn through the same
 * deal.  collage.json and the poster are kept on the device (library.js keepData), so a cold start and an offline face have the poster.
 * A plain module: no app, no state outside its root. */
import { onThemeChange } from './mir/kit.js';
import { keepData } from './library.js';

const DIR = './img/menu/collage/', TURN = 12, NEAR = 3.5, INSET = 2, SPARE = 2;   // TURN: the least seconds between ROWS ↔ COLUMNS; NEAR: no twin within 3
const RVFC = typeof HTMLVideoElement !== 'undefined' && 'requestVideoFrameCallback' in HTMLVideoElement.prototype;   // tiles (Chebyshev, half a tile of slack)
const mod = (a, n) => ((a % n) + n) % n;
const clock = () => document.timeline.currentTime;   // the animations' own clock (ms)

/** createCollage(root, { theme, still, lite }) → { show, hide, setTheme, destroy }: the wall and the veil become root's first children */
export function createCollage(root, { theme, still, lite }) {
  const wall = document.createElement('div'), veil = document.createElement('div'), sets = [document.createElement('div'), document.createElement('div')];
  wall.className = 'mm-collage'; veil.className = 'mm-veil'; wall.hidden = veil.hidden = true; wall.setAttribute('aria-hidden', 'true');
  for (const s of sets) { s.className = 'mm-strips'; s.hidden = true; wall.append(s); }
  const par = sets.map((s) => [0, 1].map(() => { const d = document.createElement('div'); d.className = 'mm-par'; s.append(d); return d; }));   // even lines, odd lines
  root.prepend(wall, veil);
  const buf = document.createElement('canvas'), bctx = buf.getContext('2d');
  const tilt = (Math.random() < 0.5 ? -1 : 1) * (1.5 + 2 * Math.random()) * (Math.PI / 180);
  let man = null, manP = null, th = null, shown = false, running = false, dead = false, vid = null, poster = null, fresh = false, vfc = 0, raf = 0, lastFrames = -1;
  let qT = 0, turnT = 0, sizeT = 0, legStart = 0, held = 0, TS = 156;
  let W = 0, H = 0, P = 0, v = 0, T = TURN, hx = 0, hy = 0, nc = 0, nr = 0, ox = 0, oy = 0, grid = null, mode = 0, tau = 0, px = 0, py = 0;
  const g = [0, 0];   // the lattice's offsets along x and y (a turn on a half tile carries P/2)
  const strips = [[], []], anims = [null, null];   // per mode: { cvs, ctx, off, a0 }; the leg's two motions (the even lines', the odd lines')
  let seen = null, ban = null, fams = null, best = null; const nb = new Array(6);   // choose()'s scratch, reused: no allocation per frame

  /* the manifest's clock: slot k plays clips[j] over [off + 2j, off + 2j + 2) modulo the loop; at = the atlas' own time */
  const M = () => man.themes[th];
  const beatOf = (k, at) => Math.floor(mod(at - M().slots[k].off, man.dur) / man.beat);
  const famOf = (k, at) => M().slots[k].clips[beatOf(k, at)];
  const toEdge = (k, at) => man.beat - mod(at - M().slots[k].off, man.beat);
  const legTime = () => (running ? Math.min(T, Math.max(0, (clock() - legStart) / 1000)) : held);

  /* a LINE moves: in ROWS (mode 0) a row along x, in COLUMNS (mode 1) a column along y; ALONG is the tile's place in its line */
  const nAl = () => (mode ? nr : nc), nLn = () => (mode ? nc : nr);
  const cell = (ln, al) => (mode ? grid[al][ln] : grid[ln][al]);
  const dir = (ln) => (ln % 2 ? -1 : 1);
  const shift = (ln, t) => dir(ln) * v * t;
  const along = (ln, al, t) => al * P + g[mode] + shift(ln, t);
  const across = (ln) => ln * P + g[mode ^ 1] + (mode ? ox : oy);   // the line's place across its motion
  /** the tile's top-left in the turned view now (its centre the origin) → px, py */
  function place(ln, al) {
    const a = mod(along(ln, al, tau), nAl() * P) + (mode ? oy : ox), w = across(ln);
    px = mode ? w : a; py = mode ? a : w;
  }
  const inView = () => px < hx && px + P > -hx && py < hy && py + P > -hy;

  function layout() {
    W = innerWidth; H = innerHeight; const dp = devicePixelRatio || 1, P0 = P;
    P = (2 * Math.round((Math.min(190, Math.max(150, 0.11 * W)) * dp) / 2)) / dp; v = P / 6;   // the pitch an even count of device px (NO EDGE)
    const step = P / (2 * v); T = Math.ceil(TURN / step - 1e-9) * step;   // the lattice is tiled each time the lines have slid half a tile apart
    const c = Math.abs(Math.cos(tilt)), s = Math.abs(Math.sin(tilt));
    hx = Math.ceil((W * c + H * s) / 2); hy = Math.ceil((W * s + H * c) / 2);   // the turned view's half extents
    Object.assign(wall.style, { width: 2 * hx + 'px', height: 2 * hy + 'px', left: W / 2 - hx + 'px', top: H / 2 - hy + 'px', transform: `rotate(${tilt}rad)` });
    const c2 = Math.ceil((2 * hx) / P) + 3, r2 = Math.ceil((2 * hy) / P) + 3;   // the overscan: a tile wraps out of sight
    if (P0) { g[0] *= P / P0; g[1] *= P / P0; }   // a resize keeps the lattice's phase, the mode and the clock
    if (!grid || c2 !== nc || r2 !== nr) {
      nc = c2; nr = r2; grid = Array.from({ length: nr }, () => Array.from({ length: nc }, () => ({ k: -1, j: -1, lap: 0 }))); if (man && th) deal();
    }
    ox = (-nc * P) / 2; oy = (-nr * P) / 2;
    for (const m of [0, 1]) {
      const L = m ? nc : nr, n = (m ? nr : nc) + SPARE, list = strips[m];
      while (list.length > L) list.pop().cvs.remove();
      while (list.length < L) { const cv = document.createElement('canvas'); par[m][list.length % 2].append(cv); list.push({ cvs: cv, ctx: cv.getContext('2d'), off: 0, a0: 0 }); }
      for (const S of list) { const w = m ? TS : n * TS, h = m ? n * TS : TS; if (S.cvs.width !== w || S.cvs.height !== h) { S.cvs.width = w; S.cvs.height = h; } S.ctx.imageSmoothingQuality = 'medium'; }
    }
  }
  /** the tiles touching (ln, al) now → nb[0 … n): its line's two and the two it overlaps in each line beside it */
  function near(ln, al) {
    let n = 0; nb[n++] = cell(ln, mod(al + 1, nAl())); nb[n++] = cell(ln, mod(al - 1, nAl())); const u = along(ln, al, tau);
    for (const l2 of [ln - 1, ln + 1]) {
      if (l2 < 0 || l2 >= nLn()) continue;
      const a = (u - g[mode] - shift(l2, tau)) / P; nb[n++] = cell(l2, mod(Math.floor(a), nAl())); nb[n++] = cell(l2, mod(Math.ceil(a), nAl()));
    }
    return n;
  }
  /** a slot for (ln, al): never one playing within NEAR tiles, not a neighbour's family at `at` (this rule gives way first), with `fresh`
      a second or more before its next cut; among those the least seen on screen, at random */
  function choose(ln, al, at, soon) {
    const S = M().slots.length, R = NEAR * P;
    if (!seen || seen.length !== S) { seen = new Int16Array(S); ban = new Uint8Array(S); best = new Int16Array(S); }
    if (!fams || fams.length < M().families.length) fams = new Uint8Array(M().families.length);
    seen.fill(0); ban.fill(0); fams.fill(0);
    place(ln, al); const x0 = px, y0 = py;
    for (let l2 = 0; l2 < nLn(); l2++) for (let a2 = 0; a2 < nAl(); a2++) {
      const c = cell(l2, a2); if (c.k < 0 || (l2 === ln && a2 === al)) continue;
      place(l2, a2); if (Math.abs(px - x0) < R && Math.abs(py - y0) < R) ban[c.k] = 1;
      if (inView()) seen[c.k]++;
    }
    for (let i = 0, n = near(ln, al); i < n; i++) if (nb[i].k >= 0) fams[famOf(nb[i].k, at)] = 1;
    for (const strict of [true, false]) {
      let nBest = 0, least = Infinity;
      for (let k = 0; k < S; k++) {
        if (ban[k] || (strict && fams[famOf(k, at)]) || (soon && toEdge(k, at) < 1)) continue;
        if (seen[k] < least) { least = seen[k]; nBest = 0; best[nBest++] = k; } else if (seen[k] === least) best[nBest++] = k;
      }
      if (nBest) return best[Math.floor(Math.random() * nBest)];
    }
    return -1;
  }
  /** at its own cut a tile must move when the sliding lines have brought its family beside it or its slot within NEAR tiles */
  function crowded(ln, al, at) {
    const k = cell(ln, al).k, f = famOf(k, at), R = NEAR * P;
    for (let i = 0, n = near(ln, al); i < n; i++) if (nb[i].k >= 0 && famOf(nb[i].k, at) === f) return true;
    place(ln, al); const x0 = px, y0 = py;
    for (let l2 = 0; l2 < nLn(); l2++) for (let a2 = 0; a2 < nAl(); a2++) {
      if (cell(l2, a2).k !== k || (l2 === ln && a2 === al)) continue;
      place(l2, a2); if (Math.abs(px - x0) < R && Math.abs(py - y0) < R) return true;
    }
    return false;
  }
  function take(c, k, at) { c.k = k; c.j = beatOf(k, at); }
  function deal() {
    const at = vid && fresh ? vid.currentTime : 0; for (const row of grid) for (const c of row) c.k = -1;
    for (let ln = 0; ln < nLn(); ln++) for (let al = 0; al < nAl(); al++) { const k = choose(ln, al, at, false); take(cell(ln, al), k >= 0 ? k : Math.floor(Math.random() * M().slots.length), at); }
  }
  /** the turn, at t = T exactly: the lines stand tiled, so each tile is re-seated in the lattice and the other axis begins to move */
  function turn() {
    const L = nAl(), g2 = (Math.round((2 * mod(g[mode] + v * T, P)) / P) * (P / 2)) % P, seat = [];
    for (let ln = 0; ln < nLn(); ln++) { const row = []; for (let al = 0; al < L; al++) row[mod(Math.round((along(ln, al, T) - g2) / P), L)] = cell(ln, al); seat.push(row); }
    for (let ln = 0; ln < nLn(); ln++) for (let al = 0; al < L; al++) { const c = seat[ln][al]; c.lap = 0; if (mode) grid[al][ln] = c; else grid[ln][al] = c; }
    g[mode] = g2; mode ^= 1;
  }

  /* THE STRIPS: line ln's slot q holds the tile al = (q − off) mod nAl and sits at a0 + dir·v·t + q·P along its line, t the leg's time; a
     strip stands still in its parity's layer (every even line moves as one, every odd line as one), and the two layers carry the motion: a
     canvas redrawn while its own transform is animated costs Firefox a slow frame each time (45 fps against 102 still and 116 unredrawn) */
  function seat() {
    const e = 1 / (devicePixelRatio || 1), sx = (mode ? P + e : P) / TS, sy = (mode ? P : P + e) / TS, hW = mode ? hx : hy;   // one device px over the next line
    strips[mode].forEach((S, ln) => {
      const s0 = g[mode], w0 = Math.floor(s0 / P), d = dir(ln), w = across(ln);
      S.off = w0 + (d > 0 ? SPARE : 0); S.a0 = (mode ? oy : ox) + (s0 - w0 * P) - (d > 0 ? SPARE * P : 0);
      S.cvs.style.transform = `translate(${(mode ? w : S.a0) + hx}px, ${(mode ? S.a0 : w) + hy}px) scale(${sx}, ${sy})`;
      S.cvs.style.visibility = w < hW && w + P > -hW ? '' : 'hidden';   // a line out of sight stays blank
    });
  }
  const ptf = (p, t) => { const a = (p ? -1 : 1) * v * t; return mode ? `translate(0px, ${a}px)` : `translate(${a}px, 0px)`; };
  /** the leg's motion handed to the compositor: one linear animation for the even lines, one for the odd, from legStart */
  function animate() {
    for (const p of [0, 1]) {
      if (anims[p]) anims[p].cancel();
      anims[p] = par[mode][p].animate([{ transform: ptf(p, 0) }, { transform: ptf(p, T) }], { duration: T * 1000, easing: 'linear', fill: 'both' });
      anims[p].startTime = legStart;
    }
  }
  /** the lines held where they stand (the motion stopped: stillness, a hidden page, a hidden face) */
  function hold() {
    held = legTime();
    for (const p of [0, 1]) { par[mode][p].style.transform = ptf(p, held); if (anims[p]) { anims[p].cancel(); anims[p] = null; } }
  }
  function showSet() { sets[mode].hidden = false; sets[mode ^ 1].hidden = true; }

  /** the deal's events at the atlas time `at` (cuts and wraps), then every slot in view (and half a tile beyond) blitted from src */
  function paint(at, src) {
    if (!src || !grid || !man || (src === poster && !poster.naturalWidth)) return;   // a poster not yet decoded draws nothing
    tau = legTime();
    const L = nAl() * P;
    for (let ln = 0; ln < nLn(); ln++) for (let al = 0; al < nAl(); al++) {
      const c = cell(ln, al), lap = Math.floor(along(ln, al, tau) / L);
      if (lap !== c.lap) { c.lap = lap; const k = choose(ln, al, at, true); if (k >= 0) take(c, k, at); }   // a wrap re-enters on a new slot
      else if (beatOf(c.k, at) !== c.j) {   // its own cut: half the time a jump, and always when it is crowded
        c.j = beatOf(c.k, at);
        if (Math.random() < 0.5 || crowded(ln, al, at)) { const k = choose(ln, al, at, true); if (k >= 0 && k !== c.k) take(c, k, at); }
      }
    }
    const sc = src === poster ? 0.5 : 1, t = man.tile * sc, e = INSET * sc, cols = man.cols, n = nAl() + SPARE, hA = mode ? hy : hx, hW = mode ? hx : hy, m = P / 2;
    strips[mode].forEach((S, ln) => {
      const w = across(ln); if (w >= hW || w + P <= -hW) return;   // a line out of sight
      const a = S.a0 + dir(ln) * v * tau;
      for (let q = 0; q < n; q++) {
        const x = a + q * P; if (x >= hA + m || x + P <= -hA - m) continue;
        const k = cell(ln, mod(q - S.off, nAl())).k;
        S.ctx.drawImage(src, (k % cols) * t + e, Math.floor(k / cols) * t + e, t - 2 * e, t - 2 * e, mode ? 0 : q * TS, mode ? q * TS : 0, TS, TS);
      }
    });
    if (!wall.classList.contains('on')) wall.classList.add('on');   // the first picture fades the wall in (a write once, not a frame)
  }
  /** a NEW VIDEO FRAME: copied once, then the slots in view */
  function frame(at) {
    if (buf.width !== vid.videoWidth) { buf.width = vid.videoWidth; buf.height = vid.videoHeight; }
    bctx.drawImage(vid, 0, 0); fresh = true;
    if (legTime() >= T) flip(); else paint(at, buf);
  }
  function onFrame(now, meta) { vfc = 0; if (!running || !vid) return; vfc = vid.requestVideoFrameCallback(onFrame); frame(meta.mediaTime); }
  function onRaf() {   // no requestVideoFrameCallback: a look at the frame count each display frame
    raf = 0; if (!running || !vid) return; raf = requestAnimationFrame(onRaf);
    const q = vid.getVideoPlaybackQuality ? vid.getVideoPlaybackQuality().totalVideoFrames : Math.round(vid.currentTime * man.fps);
    if (q !== lastFrames && vid.readyState >= 2) { lastFrames = q; frame(vid.currentTime); }
  }
  /** THE TURN: at the tiled instant the lattice is re-seated, the other set blitted once (the held frame) and shown, the next leg begins */
  function flip() {
    clearTimeout(turnT); turnT = 0; if (!running) return;
    tau = T; turn(); legStart += T * 1000;
    seat(); animate(); paint(vid && fresh ? vid.currentTime : 0, fresh ? buf : poster); showSet();
    turnT = setTimeout(flip, Math.max(0, legStart + T * 1000 - clock()));
  }

  const quiet = () => still() || lite();
  /** MOTION or PERFORMANCE may change under the open menu: a look a second, to rest or to wake */
  const look = () => { clearTimeout(qT); qT = setTimeout(() => {
    qT = 0; if (!shown || root.hidden || document.hidden) return;
    const q = quiet(); if (q && running) rest(); else if (!q && !running && !dead) start(); else look();
  }, 1000); };
  /** quiet: the video paused, the strips held, the poster drawn once through the same deal */
  function rest() { pause(); paint(0, poster); look(); }
  function pause() {
    if (running) hold(); running = false;
    if (vfc && vid) vid.cancelVideoFrameCallback(vfc); vfc = 0; if (raf) cancelAnimationFrame(raf); raf = 0;
    clearTimeout(turnT); turnT = 0; if (vid) vid.pause();
  }
  function loadPoster() {
    const want = DIR + th + '.webp'; if (poster && poster.getAttribute('src') === want) return;
    poster = new Image(); poster.decoding = 'async'; poster.src = want;
    poster.addEventListener('load', () => { keepData(want); if (shown && !running) paint(0, poster); }, { once: true });
  }
  function start() {
    if (!man || !shown || root.hidden || document.hidden) return;
    if (!th) th = theme();
    if (!grid) { layout(); seat(); hold(); showSet(); }
    loadPoster();
    if (quiet() || dead) { rest(); return; }   // stillness (or no atlas): the poster once (when it has come), no loop
    if (!vid) {
      vid = document.createElement('video'); vid.muted = vid.defaultMuted = vid.loop = vid.playsInline = true; vid.preload = 'auto';
      vid.addEventListener('error', () => { pause(); vid = null; dead = true; paint(0, poster); }, { once: true });   // no atlas: the poster stays
    }
    const src = DIR + th + '.mp4'; if (vid.getAttribute('src') !== src) { vid.src = src; fresh = false; }
    const r = vid.play(); if (r && r.catch) r.catch(() => {});
    if (!running) {
      running = true; legStart = clock() - held * 1000; animate();
      turnT = setTimeout(flip, Math.max(0, legStart + T * 1000 - clock()));
      if (RVFC) vfc = vid.requestVideoFrameCallback(onFrame); else raf = requestAnimationFrame(onRaf);
    }
    look();
  }
  function stop() { pause(); clearTimeout(qT); qT = 0; }
  const onVis = () => (document.hidden ? stop() : start());
  const onResize = () => { clearTimeout(sizeT); sizeT = setTimeout(() => {   // debounced: a phone's bar fires a stream of them
    sizeT = 0; if (!grid) return; const was = running; if (was) hold(); layout(); seat(); hold(); showSet(); if (was) { legStart = clock() - held * 1000; animate(); } paint(vid && fresh ? vid.currentTime : 0, fresh ? buf : poster);
  }, 150); };
  document.addEventListener('visibilitychange', onVis); addEventListener('resize', onResize);
  const offTheme = onThemeChange(() => api.setTheme(theme()));

  const api = {
    show() {
      if (shown) return; shown = true; wall.hidden = veil.hidden = false;
      if (!manP) manP = fetch(DIR + 'collage.json').then((r) => { if (!r.ok) return null; keepData(DIR + 'collage.json', r.clone()); return r.json(); })
        .then((j) => { man = j && j.themes ? j : null; if (man) TS = man.tile - 2 * INSET; }, () => {});   // once; none: the plain ground
      manP.then(start);
    },
    hide() { if (!shown) return; shown = false; stop(); wall.hidden = veil.hidden = true; },
    setTheme(t) {
      t = t === 'light' ? 'light' : 'dark'; if (t === th) return; th = t;
      const was = running; if (was) pause(); fresh = false; if (man && grid) deal(); wall.classList.remove('on'); if (shown) start();   // the new atlas: its own frame callbacks
    },
    destroy() { api.hide(); offTheme(); document.removeEventListener('visibilitychange', onVis); removeEventListener('resize', onResize); if (vid) vid.removeAttribute('src'); wall.remove(); veil.remove(); },
  };
  return api;
}
