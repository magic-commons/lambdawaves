/* spectrum.js — the SPECTRUM rail: eigenvalue ladder, one lane per populated mode.
 *
 * A lane shows the ENERGY (eigenvalue, hartree), the degeneracy group (colour = n), the
 * population |c_a|² (a fader that sets |c_a| at the current time), the phase arg c_a(t) as a
 * live free-spinning needle (drag adds a phase; the needle keeps turning while playing),
 * MUTE / SOLO (a reconstruction mask, not an edit) and remove.  Touching a lane selects it.
 * The picker exposes all 91 states grouped by n.  Editing goes through api.* (one road).
 * W-STURMIAN: when api.hamiltonian() carries `eigen` (the SCALE is on) the ladder shows the eigen-decomposition —
 * the rank eigenvalues of S⁻¹H, each with the state's population (its S-metric projection), unoccupied ones dim,
 * E > 0 in a compressed band above the E = 0 line — and a click loads that eigenvector (api.selectEigen); the lanes
 * keep the labels' coefficients under a caption, and the RATE knobs stand down (api.rateDisabled) with a note.
 */
import { BASIS, energy, HARTREE_EV } from './hydrogen.js';
import { el, fader, knob, formula, N_COLOR, nRGB, vividInk, graphHover } from './mir/kit.js';

/* THE LADDER IS A CANVAS, AND A CANVAS HAS NO THEME (wave 44).  Every rule here was written in
   rgba(255,255,255,…) — right on the dark theme, WHITE ON WHITE on the light one, where "E = 0", the footer and
   every population value were ghosts on the shipped hydrogen ladder as much as on wave 39's eigen ladder.  The
   tokens are read from the body instead, exactly as radiationview.js reads its accents: --dim is rated ≥ 4.5:1 on
   the card in both themes, and --fg is what carries a value that has to sit ON a population bar. */
function readRGB(g, name, fallback) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  const keep = g.fillStyle;
  g.fillStyle = fallback; if (v) { try { g.fillStyle = v; } catch (e) { /* an unparseable value leaves the fallback */ } }
  const t = String(g.fillStyle); g.fillStyle = keep;
  let m = /^#([0-9a-f]{6})$/i.exec(t);
  if (m) { const k = parseInt(m[1], 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; }
  m = /^#([0-9a-f]{3})$/i.exec(t);
  if (m) return [0, 1, 2].map((i) => parseInt(m[1][i] + m[1][i], 16));
  m = /rgba?\(([^)]+)\)/i.exec(t);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0] | 0, p[1] | 0, p[2] | 0]; }
  return [255, 255, 255];
}

export function createSpectrum(host, api) {
  const ladder = el('div', 'ladder', host);
  const lcv = el('canvas', '', ladder);
  const head = el('div', 'row tight sp-head', host);
  const hideBtn = el('button', 'trig', head); hideBtn.type = 'button'; hideBtn.textContent = 'HIDE'; hideBtn.title = 'Hide or show the channels';
  const addBtn = el('button', 'trig', head); addBtn.type = 'button'; addBtn.innerHTML = '<span class="trig-g">+</span><span class="trig-l">MODE</span>';
  const clrBtn = el('button', 'trig', head); clrBtn.type = 'button'; clrBtn.textContent = 'CLEAR'; clrBtn.title = 'c ↦ 0 for every label';
  const nrmBtn = el('button', 'trig', head); nrmBtn.type = 'button'; nrmBtn.textContent = 'NORM'; nrmBtn.title = 'Normalize';
  const info = el('div', 'note', head);
  /* ── WAVE 69 · THE REGISTER'S OWN LAW, LIVE ────────────────────────────────────────────────────
   * `c(t) = e^{−iE t} c(0)` is not a caption here, it is what the evolution IS — one phase per mode,
   * exact, no propagator — and every number on this line is read out of the coefficient vector the
   * frame is drawing from.  So this is the strongest of the three places a number was given
   * permission to move: the angle really is E·t folded into a turn, and watching it run is watching
   * the law rather than an animation of it.  It follows the SELECTED lane, or the strongest populated
   * one when nothing is selected, so it is never about a mode that is not there. */
  const psiFx = formula({ cls: 'sp-fx', lines: [
    ['<m>c(t) = e^{−iE t} c(0)   ·   </m>', { s: 'lab' }],
    ['<m>E = </m>', { s: 'E' }, '<m>   t = </m>', { s: 't' }, '<m>   arg c = </m>', { s: 'arg' }, '<m>   |c| = </m>', { s: 'mag' }] ] });
  host.appendChild(psiFx.root);
  const cap = el('div', 'sp-cap', host); cap.hidden = true;                          // W-STURMIAN: the caption over the lanes when the basis is not orthogonal (its own class: the ⓘ sweep folds every .note away)
  hideBtn.addEventListener('click', () => { rowsEl.hidden = !rowsEl.hidden; hideBtn.classList.toggle('on', !rowsEl.hidden); hideBtn.textContent = 'DIALS'; hideBtn.setAttribute('aria-expanded', String(!rowsEl.hidden)); });
  clrBtn.addEventListener('click', () => { if (api.clear) api.clear(); });
  nrmBtn.addEventListener('click', () => { if (api.normalize) api.normalize(); });
  const rowsEl = el('div', 'sp-rows', host);


  rowsEl.hidden = true;
  hideBtn.textContent = 'DIALS'; hideBtn.setAttribute('aria-expanded', 'false');
  const picker = el('div', 'picker', host); picker.hidden = true;
  addBtn.addEventListener('click', () => { picker.hidden = !picker.hidden; addBtn.classList.toggle('on', !picker.hidden); });
  const chips = new Map();
  for (let n = 1; n <= 6; n++) {
    const g = el('div', 'pk-n', picker); g.style.setProperty('--nc', N_COLOR[n]);
    el('div', 'pk-nl', g, 'n' + n);
    const cs = el('div', 'pk-chips', g);
    for (const s of BASIS) if (s.n === n) {
      const b = el('button', 'pk-c', cs, s.label); b.type = 'button'; b.title = `${s.id}  E = ${s.E.toFixed(5)}`;
      b.addEventListener('click', () => api.toggleMode(s.index));
      chips.set(s.index, b);
    }
  }
  const lanes = new Map();     // index → the lane that IS built and in the DOM
  let selected = -1, lastVersion = -1;
  /* ── THE REBUILD IS INCREMENTAL, AND THE BOOKKEEPING IS NOT (wave 49) ────────────────────────────────
     A packet landing (SLAP, or the bow's release) takes the register from a handful of populated labels to
     ninety-one in ONE version bump, and rebuild() used to answer by CONSTRUCTING ninety-one lanes inside a
     single frame — a fader, two knobs and four buttons apiece, 449 ms measured on the landing frame, which
     is also exactly the frame the governor is judging.  The work splits in two, and the two halves obey
     different laws:

       THE BOOKKEEPING IS EXACT AND IMMEDIATE.  The wanted set, the removals, the ORDER of what is already
       built, the chips, the info line, the caption and the ladder are done in full on every version bump.
       They are O(91) reads and almost no DOM writes, and a state that lies for a frame is worse than a
       state that is drawn a frame late.

       THE CONSTRUCTION IS SPREAD.  `pending` is the queue of wanted-but-unbuilt indices, held in `want`
       order, and REDERIVED from scratch on every bump (`want` minus what is built) — so a bump that drops
       a label drops it from the queue, one that adds a label enqueues it, and no bump can leave a stale
       lane behind or lose one.  drain() empties the queue under a LANE_BUDGET_MS = 6 ms budget measured
       from the TOP of update(), stopping when the next lane (at the running cost `laneMs`) would not fit,
       and ALWAYS building at least one so progress cannot stall.  Each finished lane is inserted before
       the first already-built lane that follows it in `want`, which is its ordered place whether the queue
       is draining forwards or a later bump interleaved new indices among old ones.

       THE WRITES ARE DIRTY-CHECKED.  reg.population(a) is a multiply and an add; L.pop.set() is a style
       write and a text write.  refresh() writes only what MOVED since the last one: the fader and the rate
       knob are asked for their own last-painted value (get() is a closure read, so it dirty-checks against
       the DOM itself and a control the user dragged still snaps back), and every lane carries `was` for the
       rest — mute, solo, the muted/solo mask, the selection, and the label and energy strings.  select()
       keeps `was.sel` in step, since it toggles that class itself.

     The drain rides update(), which the rack calls on every CPU frame: no second rAF loop, no call back
     into the rack.  When the transport is paused AND nothing is scheduled the rack stops the loop, so a
     queue can sit unfinished until the next frame anyone asks for — the register cannot move without a
     version bump, so what is on screen is never WRONG, only short, and the next frame finishes it. */
  const LANE_BUDGET_MS = 6;
  let want = [], wantAt = new Map(), pending = [], laneMs = 1;
  let n2 = 1, anySolo = false, rateOff = false;        // the snapshot the cheap half took, reused by lanes built later in the same state
  const RATE_TITLE = 'Set this state’s phase-rate multiplier; double-tap resets';
  /** W-STURMIAN: RATE is a diagonal-phase feature — disabled, with the note on it, while a propagator is in force */
  function paintRate(L, off) { if (off === L.rateOff) return; L.rateOff = off; L.rate.setDisabled(off); L.rate.root.title = off ? (api.rateNote ? api.rateNote() : 'off') : RATE_TITLE; }

  function lane(a) {
    const s = BASIS[a];
    const root = el('div', 'sp-row'); root.style.setProperty('--nc', N_COLOR[s.n]); root.dataset.id = s.id;
    el('div', 'sp-band', root);
    const id = el('div', 'sp-id', root);
    const nm = el('div', 'sp-name sp-nm', id, labelText(a)); nm.dataset.a = s.index;
    const esub = el('div', 'sp-sub sp-e', id, energyText(a)); esub.dataset.a = s.index;   // the operator IN FORCE, never the static basis energy
    id.addEventListener('click', () => api.select(a));
    /* WAVE 62 · A LANE NAMES ITSELF.  `aria` overrides `label` in the kit, which is exactly what these
       three need: the eye reads '|c|²' next to a label it can see, but ninety-one sliders all called
       "|c|²" are ninety-one identical seats to anything that cannot see the row they are in. */
    /* WAVE 69 · the fader's own label is the one string in a lane that is pure mathematics; the
       ARIA name is `mathPlain`ed by the kit, so the marker never reaches an attribute. */
    const pop = fader({ label: '<m>|c|²</m>', aria: '|c|² ' + labelText(a), min: 0, max: 1, value: 0, cls: 'pop', fmt: (v) => v.toFixed(3),
      onInput: (v) => api.setPopulation(a, v), onChange: (v) => api.setPopulation(a, v, true) });
    root.appendChild(pop.root);
    const ph = knob({ aria: 'phase ' + labelText(a), min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'live', fmt: (v) => (v * 180 / Math.PI).toFixed(0) + '°',
      onDelta: (d) => api.addPhase(a, d), onReset: () => api.setPhase(a, 0) });
    const kn = el('div', 'sp-knobs', root); kn.appendChild(ph.root);   // the two knobs stack, half-size
    const rate = knob({ aria: 'phase rate ' + labelText(a), min: 0.25, max: 4, value: api.rateOf ? api.rateOf(a) : 1, log: true, cls: 'rate', fmt: (v) => v.toFixed(2) + '×', onInput: (v) => { if (api.setRate) api.setRate(a, v); } });
    rate.root.title = RATE_TITLE;
    kn.appendChild(rate.root);
    const mute = el('button', 'sp-b mute', root, 'M'); mute.type = 'button'; mute.title = 'mute: drop from the FIELD reconstruction (the state keeps c)';
    mute.setAttribute('aria-label', 'mute ' + labelText(a)); mute.setAttribute('aria-pressed', 'false');
    mute.addEventListener('click', () => api.toggleMute(a));
    const solo = el('button', 'sp-b solo', root, 'S'); solo.type = 'button'; solo.title = 'solo: reconstruct from this mode alone';
    solo.setAttribute('aria-label', 'solo ' + labelText(a)); solo.setAttribute('aria-pressed', 'false');
    solo.addEventListener('click', () => api.toggleSolo(a));
    const x = el('button', 'sp-x', root, '×'); x.type = 'button'; x.title = 'remove (sets c = 0)'; x.setAttribute('aria-label', 'remove ' + labelText(a));
    x.addEventListener('click', () => api.remove(a));
    /* `was` is the dirty-cache: the values ACTUALLY applied to this lane's DOM.  The two strings start at what
       lane() just wrote (so a fresh lane is never rewritten); every other field starts unset, so the lane's
       first refresh() writes it once. */
    return { root, pop, ph, rate, mute, solo, nm, esub, a, rateOff: false,
      was: { mute: null, solo: null, off: null, sel: null, label: nm.textContent, energy: esub.textContent } };
  }
  const labelText = (a) => api.labelOf ? api.labelOf(BASIS[a]) : BASIS[a].label;
  const energyText = (a) => `${(api.energyOf ? api.energyOf(a) : BASIS[a].E).toFixed(4)} ${api.unit ? api.unit() : 'Eh'}`;
  /** one lane's UPDATE: cheap reads, and only the DOM writes whose value moved since the last one */
  function refresh(L, a) {
    const reg = api.reg, w = L.was;
    /* the fader and the two knobs ARE their own cache — get() is a closure read and returns exactly what was last
       painted, so it dirty-checks against the DOM itself and a control the user has dragged still snaps back */
    if (L.rate && api.rateOf) { const rv = api.rateOf(a); if (Math.abs(L.rate.get() - rv) > 1e-12) L.rate.set(rv); }
    if (L.rate) paintRate(L, rateOff);
    const p = reg.population(a) / n2;                    if (L.pop.get() !== p) L.pop.set(p);
    const m = !!reg.muted[a];                            if (w.mute !== m) { w.mute = m; L.mute.classList.toggle('on', m); L.mute.setAttribute('aria-pressed', String(m)); }
    const s = !!reg.solo[a];                             if (w.solo !== s) { w.solo = s; L.solo.classList.toggle('on', s); L.solo.setAttribute('aria-pressed', String(s)); }
    const off = anySolo ? !s : m;                        if (w.off !== off) { w.off = off; L.root.classList.toggle('muted', off); }
    const sel = a === selected;                          if (w.sel !== sel) { w.sel = sel; L.root.classList.toggle('sel', sel); }
    if (L.root.classList.contains('off')) L.root.classList.remove('off');    // nothing here ever sets it; the old rebuild cleared it every pass
    const lt = labelText(a);                             if (w.label !== lt) { w.label = lt; L.nm.textContent = lt; }
    const et = energyText(a);                            if (w.energy !== et) { w.energy = et; L.esub.textContent = et; }
  }
  /** a freshly built lane goes before the first ALREADY-BUILT lane that follows it in `want` (else at the end) */
  function place(a, L) {
    const i = wantAt.has(a) ? wantAt.get(a) : want.length;
    let ref = null;
    for (let j = i + 1; j < want.length; j++) { const M = lanes.get(want[j]); if (M) { ref = M.root; break; } }
    rowsEl.insertBefore(L.root, ref);
  }
  /** THE DRAIN: build pending lanes until the budget (from the top of update()) will not take another — always one */
  function drain(t0) {
    if (!pending.length) return;
    do {
      const a = pending.shift(), t1 = performance.now();
      const L = lane(a); lanes.set(a, L); place(a, L); refresh(L, a);
      laneMs = laneMs * 0.7 + (performance.now() - t1) * 0.3;      // what ONE lane costs on this machine, right now
    } while (pending.length && performance.now() + laneMs - t0 <= LANE_BUDGET_MS);
  }
  /** the cheap half: exact and immediate on every version bump — the lane set, the order, the chips, the info line, the caption, the ladder */
  function rebuild() {
    const reg = api.reg;
    want = reg.populated();
    wantAt.clear(); for (let i = 0; i < want.length; i++) wantAt.set(want[i], i);
    const keep = new Set(want);
    for (const [a, L] of lanes) if (!keep.has(a)) { L.root.remove(); lanes.delete(a); }
    pending.length = 0;
    for (const a of want) if (!lanes.has(a)) pending.push(a);       // the queue, rederived: no stale lane, no lost one
    let prev = null;
    for (const a of want) {                                        // the ORDER of what IS built; the unbuilt ones land in the gaps (place())
      const L = lanes.get(a); if (!L) continue;
      if (prev ? prev.nextSibling !== L.root : rowsEl.firstChild !== L.root) rowsEl.insertBefore(L.root, prev ? prev.nextSibling : rowsEl.firstChild);
      prev = L.root;
    }
    n2 = reg.norm2() || 1;
    anySolo = want.some((a) => reg.solo[a]);
    rateOff = !!(api.rateDisabled && api.rateDisabled());
    for (const [a, L] of lanes) refresh(L, a);
    for (const [a, b] of chips) b.classList.toggle('on', keep.has(a));
    const rs = reg.renderSet();
    const levels = Object.keys(groupByN(want)).length;
    info.textContent = `${want.length} populated · ${rs.rendered} rendered · ${levels} level${levels === 1 ? '' : 's'}`;
    { const HS = api.hamiltonian ? api.hamiltonian() : null, eig = !!(HS && HS.eigen);                          // W-STURMIAN: the caption and the ladder's affordance
      cap.hidden = !eig; if (eig) cap.textContent = HS.caption || 'non-orthogonal basis: populations are projections';
      if (eig !== ladderEigen) { ladderEigen = eig; lcv.style.cursor = eig ? 'pointer' : ''; lcv.title = eig ? 'click an eigenvalue to load its S-normalised eigenvector into the labels' : ''; } }
    lastVersion = reg.version;
    paintLadder();
  }
  function groupByN(list) { const g = {}; for (const a of list) (g[BASIS[a].n] = g[BASIS[a].n] || []).push(a); return g; }

  /* WAVE 46: the ladder's objects are its level lines — one hover, one tip, and the value that used to float on the bar */
  const hover = graphHover(lcv, { repaint: () => paintLadder() });

  /* the eigenvalue ladder: E_n drawn at physical height (the Rydberg bunching is the point),
     populated levels lit with their fraction of the norm */
  function paintLadder() {
    const reg = api.reg;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = ladder.clientWidth, H = ladder.clientHeight;
    if (W < 32 || H < 32) return;                       // folded: no size, nothing to paint
    if (lcv.width !== W * dpr || lcv.height !== H * dpr) { lcv.width = W * dpr; lcv.height = H * dpr; }
    const g = lcv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const INK = readRGB(g, '--dim', '#b8b8b8'), FG = readRGB(g, '--fg', '#ffffff');   // the theme's own ink: this canvas used to be white-only
    const ink = (a) => `rgba(${INK[0]},${INK[1]},${INK[2]},${a})`, fg = (a) => `rgba(${FG[0]},${FG[1]},${FG[2]},${a})`;
    /* --n1…--n6 are ONE palette for both themes (lab.css:29), pastels chosen against a dark ground, and as 8 px
       NUMBERS on the light theme they are unreadable — "50%  −0.1250" was a ghost on the shipped ladder.  The
       lines, the bars and the level names keep the shell's colour, which is what carries the coding; the value
       takes the theme's foreground when the ground is light.  Which ground it is, the theme itself says. */
    /* WAVE 46 — NOTHING FLOATS INSIDE THE PLOT.  The value used to be stroked over a halo ON its own bar
       ("50%  −0.1250"), one more coloured number in the middle of the picture.  The line, the bar and the
       shell colour say WHICH level and HOW MUCH; the number itself is one hover away, in the single tip.
       The gutter keeps the level's name and the footer keeps the law: both are outside the plot rectangle. */
    const pad = 10, left = 44, right = W - 12, top = 10, bot = H - 14;
    const plot = { x0: left, y0: top, x1: right, y1: bot };
    hovers = [];
    const HS = api.hamiltonian ? api.hamiltonian() : null;                    // null = the built-in hydrogen ladder
    eigenHits = [];
    if (HS && HS.eigen) { paintEigen(g, HS, W, H, left, right, top, bot, ink, fg, plot); return; }   // W-STURMIAN: the eigen ladder
    const Emin = HS ? HS.Emin : energy(1), Etop = HS ? HS.Etop : 0;
    const y = (E) => bot - (E - Emin) / (Etop - Emin) * (bot - top);
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle';
    // continuum line — its NAME is placed last, and only if the gutter row is free (see below)
    if (!HS) { g.strokeStyle = ink(0.35); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(left, y(0)); g.lineTo(right, y(0)); g.stroke(); g.setLineDash([]); }
    const n2 = reg.norm2() || 1;
    const pops = {}; for (const a of reg.populated()) { const k = HS ? HS.levelKey(a) : BASIS[a].n; pops[k] = (pops[k] || 0) + reg.population(a) / n2; }
    const LEVELS = HS ? HS.levels : [1, 2, 3, 4, 5, 6].map((n) => ({ key: n, E: energy(n), label: 'n' + n, rgb: nRGB(n) }));
    const names = [];                                    // (the Rydberg bunching crowds the gutter: see the placement below)
    for (const lv of LEVELS) {
      const n = lv.key, yy = y(lv.E), c = vividInk(lv.rgb), lit = pops[n] > 0;
      g.strokeStyle = lit ? `rgba(${c[0]},${c[1]},${c[2]},0.95)` : ink(0.30); g.lineWidth = lit ? 2 : 1;
      g.beginPath(); g.moveTo(left, yy); g.lineTo(right, yy); g.stroke();
      if (lit) { const w = Math.max(6, (right - left) * pops[n]); g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.35)`; g.fillRect(left, yy - 3, w, 6); }
      if (n <= 2 || lit) names.push({ y: yy, txt: lv.label, col: lit ? `rgba(${c[0]},${c[1]},${c[2]},1)` : ink(0.75), lit, n, pop: pops[n] || 0 });
      hovers.push({ kind: 'line', key: 'L' + n, points: [left, yy, right, yy], lw: lit ? 2 : 1, colour: `rgba(${c[0]},${c[1]},${c[2]},1)`,
        info: `${lv.label}  ·  ${lit ? (pops[n] * 100).toFixed(1) + ' %' : 'empty'}  ·  E = ${lv.E.toFixed(4)} Eh` });
    }
    /* THE GUTTER IS 44 px OF ONE COLUMN, AND E_n = −1/(2n²) BUNCHES (wave 46).  n3 … n6 fall inside 6 px of the
       E = 0 line on a 92 px card, so the names used to print straight over one another — "n3" and "n4" and
       "E = 0" as one smear.  A name is placed only when its row is FREE (9 px: the 8 px face's own line box),
       the LIT levels claim their rows first and in order of population, and a level that loses its name still
       has its line, its bar and its hover.  Nothing is nudged: a name away from its own level would lie. */
    const usedY = [];
    const freeRow = (yy) => !usedY.some((q) => Math.abs(q - yy) < 9);
    g.textAlign = 'right';
    for (const nm of [...names].sort((a, b) => (b.lit - a.lit) || (b.pop - a.pop) || (a.n - b.n))) {
      if (!freeRow(nm.y)) continue;
      usedY.push(nm.y); g.fillStyle = nm.col; g.fillText(nm.txt, left - 4, nm.y);   // the gutter, not the plot
    }
    if (!HS && freeRow(y(0))) { g.fillStyle = ink(0.75); g.textAlign = 'right'; g.fillText('E = 0', left - 4, y(0)); }
    g.fillStyle = ink(0.75); g.textAlign = 'left'; g.fillText(HS ? HS.footer : 'EIGENVALUE  E_n = −1/(2n²) hartree', left, H - 5);
    hover.set(hovers, plot);
  }
  /* W-STURMIAN: the eigen ladder — the rank eigenvalues of S⁻¹H at physical height below E = 0 (the same scale and
     colours as the hydrogen ladder: the colour is the dominant label's n), each occupied one (population > 1e-6) lit
     with its population bar and value, unoccupied ones dim, the E > 0 pseudo-continuum compressed above the E = 0 line;
     a click within 6 px of a level loads its eigenvector */
  let eigenHits = [], ladderEigen = false, hovers = [];
  function paintEigen(g, HS, W, H, left, right, top, bot, ink, fg, plot) {
    const Emin = HS.Emin, Emax = Math.max(HS.Emax || 0, 1e-9), split = top + (bot - top) * 0.24;
    const y = (E) => E <= 0 ? bot - (E - Emin) / (0 - Emin) * (bot - split) : split - Math.min(1, E / Emax) * (split - top);
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle';
    g.strokeStyle = ink(0.35); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(left, y(0)); g.lineTo(right, y(0)); g.stroke(); g.setLineDash([]);
    const usedTy = [];                                    // 'E = 0' shares the 44 px gutter with the level names: it is drawn last, and only if its row is free
    const lit = HS.eigen.filter((lv) => lv.pop > 1e-6).sort((a, b) => a.E - b.E), dim = HS.eigen.filter((lv) => !(lv.pop > 1e-6));
    g.strokeStyle = ink(0.24); g.lineWidth = 1;
    for (const lv of dim) { const yy = y(lv.E); g.beginPath(); g.moveTo(left, yy); g.lineTo(right, yy); g.stroke(); eigenHits.push({ y: yy, k: lv.k, pop: 0 });
      hovers.push({ kind: 'line', key: 'D' + lv.k, points: [left, yy, right, yy], lw: 1, colour: ink(0.7), info: `${lv.label}  ·  empty  ·  λ = ${lv.E.toFixed(4)} Eh` }); }
    /* THE DECLUTTER (wave 44).  Lit levels run upward (E ascending — sorted here, since the propagator is assembled
       block by block in (l, m) and hands its eigenvalues over in BLOCK order, not energy order), so a text within
       LEAD px of the last one is nudged up.  The pitch used to be 8 px — exactly the face's own size, so two nudged
       rows TOUCHED — and the nudge was unbounded, so a third marched off the top of the box.  Under STURMIAN that is
       the ordinary case and not an edge one: the E > 0 pseudo-continuum is compressed into about 16 px and a generic
       λ occupies three or four levels inside it.  So LEAD is the 8 px face's real line box, the nudge is CLAMPED to
       the top, a level with no room left keeps its lit line and its bar but loses its text (the `faint` branch's own
       precedent), and a text nudged off its level is tied back to it by a hairline leader in the level's own colour. */
    const LEAD = 11, TOP = top + 3;
    let lastTy = 1e9;
    for (const lv of lit) {
      const yy = y(lv.E), c = nRGB(lv.n), faint = lv.pop < 0.005;          // occupied below ½ %: a coloured hairline, no name (the clock still counts it)
      g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${faint ? 0.6 : 0.95})`; g.lineWidth = faint ? 1 : 2; g.beginPath(); g.moveTo(left, yy); g.lineTo(right, yy); g.stroke();
      eigenHits.push({ y: yy, k: lv.k, pop: lv.pop });
      hovers.push({ kind: 'line', key: 'E' + lv.k, points: [left, yy, right, yy], lw: faint ? 1 : 2, colour: `rgba(${c[0]},${c[1]},${c[2]},1)`,
        info: `${lv.label}  ·  ${(lv.pop * 100).toFixed(lv.pop < 0.1 ? 1 : 0)} %  ·  λ = ${lv.E.toFixed(4)} Eh` });
      if (faint) continue;
      const ty = (lastTy - yy < LEAD) ? lastTy - LEAD : yy;
      const w0 = Math.max(6, (right - left) * lv.pop);
      if (ty < TOP) { g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.35)`; g.fillRect(left, yy - 3, w0, 6); continue; }   // out of room: the line and the bar still say it
      lastTy = ty;
      if (ty !== yy) { g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.45)`; g.lineWidth = 1; g.beginPath(); g.moveTo(left - 3, ty); g.lineTo(left - 1, yy); g.stroke(); }   // the leader back to its own level
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},1)`; g.textAlign = 'right'; g.fillText(lv.label, left - 4, ty); usedTy.push(ty);   // the gutter, not the plot
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.35)`; g.fillRect(left, yy - 3, w0, 6);
    }
    if (!usedTy.some((t) => Math.abs(t - y(0)) < 9)) { g.fillStyle = ink(0.75); g.textAlign = 'right'; g.fillText('E = 0', left - 4, y(0)); }
    g.fillStyle = ink(0.75); g.textAlign = 'left'; g.fillText(HS.footer || '', left, H - 5);
    hover.set(hovers, plot);
  }
  lcv.addEventListener('click', (e) => {
    if (!eigenHits.length || !api.selectEigen) return;
    let best = null;
    for (const h of eigenHits) { const d = Math.abs(h.y - e.offsetY); if (d <= 6 && (!best || d < best.d - 1e-9 || (Math.abs(d - best.d) <= 1e-9 && h.pop > best.pop))) best = { d, k: h.k, pop: h.pop }; }
    if (best) api.selectEigen(best.k);
  });
  /** display-rate update: the bookkeeping on a version bump, one budget of lane construction, then the live phases */
  let fxWall = 0;
  /** the c(t) line, at 5 Hz.  THE CADENCE IS THE LAB'S OWN LAW, not a new one: rack.js prints the `t`
      readout every 200 ms unless KEEP FRAMES is on, because that is as fast as a number can be read;
      a formula is a number and takes the same rule.  It is also the reason nothing here needs a
      throttle of its own — three text writes at 5 Hz cost nothing on any frame. */
  function paintPsi(c, t) {
    const now = performance.now();
    if (now - fxWall < 200) return;
    fxWall = now;
    let a = selected;
    if (a < 0 || !lanes.has(a)) { let best = -1, bp = 0; for (const [i] of lanes) { const p = c.re[i] * c.re[i] + c.im[i] * c.im[i]; if (p > bp) { bp = p; best = i; } } a = best; }
    if (a < 0) { psiFx.set({ lab: '—', E: '—', t: '—', arg: '—', mag: '—' }); return; }
    const re = c.re[a], im = c.im[a];
    let ph = Math.atan2(im, re); if (ph < 0) ph += 2 * Math.PI;
    psiFx.set({ lab: labelText(a), E: (api.energyOf ? api.energyOf(a) : BASIS[a].E).toFixed(6) + ' ' + (api.unit ? api.unit() : 'Eh'),
      t: t.toFixed(2), arg: (ph * 180 / Math.PI).toFixed(1) + '°', mag: Math.sqrt(re * re + im * im).toFixed(4) });
  }
  function update(c, t) {
    const t0 = performance.now();
    const reg = api.reg;
    if (reg.version !== lastVersion) rebuild();
    drain(t0);                                   // the queue rides the rack's frame — no rAF of our own
    for (const [a, L] of lanes) {
      const ph = Math.atan2(c.im[a], c.re[a]);
      L.ph.set(ph < 0 ? ph + 2 * Math.PI : ph);
    }
    paintPsi(c, t);
  }
  function select(a) { selected = a; fxWall = 0; for (const [i, L] of lanes) { const s = i === a; if (L.was.sel !== s) { L.was.sel = s; L.root.classList.toggle('sel', s); } } }
  window.addEventListener('resize', () => paintLadder());
  /* the DIALS fold is project state (a demo opens with its lanes shown or folded as it was saved) */
  const setDials = (on) => { rowsEl.hidden = !on; hideBtn.classList.toggle('on', !!on); hideBtn.setAttribute('aria-expanded', String(!!on)); };
  return { update, rebuild, select, get selected() { return selected; }, lanes, get building() { return pending.length; },
    get dials() { return !rowsEl.hidden; }, setDials,
    openPicker(v = true) { picker.hidden = !v; addBtn.classList.toggle('on', v); }, get pickerOpen() { return !picker.hidden; } };
}
