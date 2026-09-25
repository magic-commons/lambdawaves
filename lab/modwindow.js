

import { el, seg, trig, knob, tapWatcher, gripDots } from './mir/kit.js';
import { bindSliderKeys } from './mir/slider-keys.js';
import { createModWindow, buildChipRail, setDeviceMode, setWorkLane, sizeLaw, GEOM,
         SVG_PLAY, SVG_PAUSE, buildGhost, buildAudioSheet, COPY } from './mir/modulation/modwindow/modwindow.js';
import { evaluate as curveEval, curveHash, curveInfo, presetPoints, presetMirror,
         pointsEqual, PRESET_LABEL } from './mir/modulation/curve.js';
import { svgPoint, curveHit, curveAction, pointDrag, pointAddValue, tensionDelta,
         editablePresetForWave } from './mir/modulation/curve-gesture.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const pct = (u) => (100 * clamp01(u)).toFixed(2) + '%';
const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, cls, parent) => {
  const e = document.createElementNS(SVGNS, tag);
  if (cls) e.setAttribute('class', cls);
  if (parent) parent.appendChild(e);
  return e;
};
/* the house drag ladder, from kit.js's own knob: 220 px is a full scale, 900 with Shift, 320
   under a finger.  Reused rather than re-chosen so the artifact's dials feel like the lab's. */
const TRAVEL = (e, touch) => (e.shiftKey ? 900 : touch ? 320 : 220);
const TENSION_PX = 114, GRAB = 20;

function fmtVal(d, v) {
  if (!d) return String(v);
  if (d.fmt) { try { return d.fmt(v); } catch (e) { /* a descriptor's own formatter */ } }
  const a = Math.abs(v);
  const s = a >= 100 ? v.toFixed(1) : a >= 10 ? v.toFixed(2) : a >= 1 ? v.toFixed(3) : v.toFixed(4);
  return s + (d.unit || '');
}
const fmtSec = (v) => (v >= 1 ? v.toFixed(2) + ' s' : (1000 * v).toFixed(v < 0.1 ? 1 : 0) + ' ms');

/** a breakpoint list sampled into [[u, v], …] — the polyline both the editor and every
 *  preset glyph draw, so a button can never show a shape the engine would not produce */
function polyOf(pts, n) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const seg = Math.max(2, Math.round(n * Math.max(0.02, b.t - a.t)));
    for (let k = 0; k < seg; k++) { const u = a.t + (b.t - a.t) * (k / seg); out.push([u, curveEval(pts, u)]); }
  }
  const last = pts[pts.length - 1];
  out.push([last.t, last.v]);
  return out;
}

/** WHAT `envPoints` ACTUALLY DRAWS.  `envDuration` drops `r` under GATE; the drawing never
 *  does — it always advances `acc += s.r` before the final point.  FIT frames THIS, which is
 *  the whole of inherited defect 3. */
const envDrawn = (s) => s.a + s.hold + s.d + s.r;

const stochastic = (s) => s.wave === 'sh' || s.wave === 'drift';
const cyclesShown = (s) => (stochastic(s) ? 4 : 1);
const SHAPES = ['tri', 'sawup', 'sine', 'square', 'msaw', 'mtri'];


const CHECK_HINT = {
  sync: 'BPM · quantise the LFO rate to the loop clock',
  anchor: 'ANCHOR · resume from the paused phase',
  invert: 'Invert the curve output: 1 \u2212 v',
  triplet: 'the note ladder \u00d7 2/3 \u2014 three in the space of two',
  dotted: 'the note ladder \u00d7 3/2 \u2014 a note and a half',
  gate: 'GATE holds sustain until release; ONE-SHOT runs once'
};

/* ═══════════════════════════════════════════════════════════════════════════════════════════
 *  THE WINDOW
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * @param {HTMLElement} host  where the window and its chip rail are appended (`#floats`)
 * @param {object} port  { M, registry, targets, clock, apply, status, cadence, setCadence, knobOf }
 */
export function createModulation(host, port) {
  const M = port.M, registry = port.registry, clock = port.clock;
  const apply = port.apply || (() => {});
  const audBands = new Map();
  const audRoutes = new Map();

  /* ── THE ARTIFACT, BUILT ───────────────────────────────────────────────────────────────── */
  const root = createModWindow({
    /* COPY customizes audio's face while the ported files stay frozen. */
    copy: { factory: 'FACTORY', knobs: {...COPY.knobs, audio:[['sens','GAIN','-24','+24'],['attack','ATTACK','0','2s'],['release','RELEASE','0','2s'],['peakHold','HOLD','0','2s']]},
      audioSheetRows:[['out','BAND'],['lower','LOWER'],['upper','UPPER'],['att','ATTACK'],['rel','RELEASE'],['gate','NOISE GATE'],['thresh','GATE dB'],['hold','GATE HOLD'],['hyst','HYST'],['flux','HIT SENSE']] }
  });
  host.appendChild(root);
  const rail = buildChipRail(root, {});
  dressGlass();                         // wave 74: the boot pass; rebuildDevices' callers do the rest
  seatCurveName();
  seatRailHead();

  /* Adding belongs with the rack it changes. The macro rail now owns the two
     explicit ADD MACRO and ADD DEVICE buttons, leaving the window chip rail
     for window-level actions only. */
  const mw = root.modwindow;
  const panel = mw.panel, foot = mw.foot, transport = mw.transport, rackEl = mw.rack;

  /* THE STATUS LINE IS THE WINDOW'S OWN HINT ROW.  `.m2hint` is where BASINS prints the
     window's one sentence of instruction; a transient message takes that seat and the
     artifact's copy comes back verbatim when it clears — no second surface, nothing added. */


  const SAY_MS = 4200;
  let hintMsg = '', hintCls = '', hintAt = 0, hintTimer = 0;
  mw.hint.setAttribute('role', 'status'); mw.hint.setAttribute('aria-live', 'polite');   /* ONE region, ONE line: access.test's A4 counts lines */
  const status = (t, cls) => {
    hintMsg = t || ''; hintCls = cls || '';
    hintAt = hintMsg ? performance.now() : 0;
    mw.hint.textContent = hintMsg;
    mw.hint.classList.toggle('m2dead', !!hintMsg && hintCls === 'warn');
    mw.hint.classList.toggle('m2say', !!hintMsg);
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = 0; }
    if (hintMsg) hintTimer = setTimeout(() => { hintTimer = 0; status('', ''); }, SAY_MS);
  };
  /** WHICH LAW THE RACK'S OWN CHIPS PUT ON THE NEXT RESUME — `mir/host.js`'s `resumeGrid`, printed.
   *  The window re-derives NOTHING (ANTI-PATTERNS 20): the law, the counts and the grid are the
   *  clock's own answer and this only turns them into a sentence. */
  function resumeSentence() {
    const r = clock.resumePlan ? clock.resumePlan() : null;
    if (!r) return '';
    if (r.law === 'ANCH') return 'ANCHOR holds the beat: the ' + r.anch + ' anchored source' + (r.anch === 1 ? '' : 's') + ' — and every BPM source beside them — resume exactly where the pause caught them';
    if (r.law === 'BPM') return 'the loop clock claims the resume: the beat jumped back ' + r.last.moved.toFixed(3) + ' of a beat to the ' + r.grid + '-beat note boundary just passed';
    if (r.law === 'TRIG') return 'TRIG: the curve starts over';
    return '';
  }

  const pick = mw.buildDevicePick();
  const mpick = mw.buildMacroPick();
  const psheet = mw.buildPresetSheet();
  const dead = mw.buildDeadInspector();

  /* ADD AUDIO is offered by the artifact and refused by this host, out loud: `mod.js` carries
     the whole normalised follower, and their `audio.js` — its only feed — was deliberately not
     ported (lab/mir/PORT-NOTES.md).  A control that changes nothing is not offered, and the
     button stays in the sheet so the sheet keeps its geometry. */
  /* ── WAVE 102 · ADD AUDIO IS OFFERED, BECAUSE THERE IS NOW SOMETHING BEHIND IT ───────────────
     The refusal above was honest for six waves: `mod.js` carried the whole follower and BASINS'
     `audio.js` — its only feed — was deliberately not ported, so the button would have built a
     device that could never move.  `lab/audio.js` is that feed, and `rack.js` pumps it at the
     modulation cadence, so the control now changes something and may be offered.
       IT STILL OPENS NOTHING.  Adding the device does not touch the microphone; its own AUDIO IN button
     does, once, on a press.  See lab/audio.js's header for the whole privacy story. */
  if (pick.btns.audio && !port.audio) {
    pick.btns.audio.disabled = true;
    pick.btns.audio.setAttribute('aria-disabled', 'true');
      pick.btns.audio.title = 'Audio input is unavailable in this browser';
  } else if (pick.btns.audio) {
      pick.btns.audio.title = 'Add an audio follower; AUDIO IN uses the microphone';
  }

  /* ── PRESENTATION STATE.  The window's own, never the model's, never the project's. ────── */
  const P = { x: 0, y: 0, lane: 'bottom', ribbon: false, modes: {}, audioMini: {}, open: false, folder: {}, macroSide: 'left', macroMin: false };
  /* THE STORED MODES ARE ADOPTED ONCE, AND A DEAD ID TAKES ITS MODE WITH IT.  `modReset()` recycles
     source ids — the next `s1` is a different device — so a mode kept by id and never pruned puts a
     brand-new LFO on the screen folded because something called `s1` was folded last session.  The
     settings key lands in `saved`; a source claims its entry the first time it is built and the
     entry is spent; and `rebuildDevices` drops the mode of every id the rack no longer has. */
  const saved = {};
  let placed = false;
  /* WAVE 98 · the lane's width law reads the dormant count; this is what tells it the count moved */
  let lastDead = -1;
  /* WAVE 100 · the width at the last place, so only a GROWTH pulls the window back on screen */
  let lastW = -1;

  const CARD_TRIM = 32, FLOAT_ROOM = 6, MACRO_MIN_W = 144;
  /* ═══ THE GEOMETRY IS ARITHMETIC.  `sizeLaw` never measures the live window. ════════════ */
  const devOrder = () => M.sourceList().filter((s) => s.kind !== 'audioout');
  const modeOf = (id) => { if (P.modes[id]) return P.modes[id] === 'C' ? 'C' : P.modes[id] === 'M' ? 'M' : 'F';
    const s = M.sourceOf(id); return s && s.minimized ? 'M' : 'F'; };   /* the model's own folded flag, when the window has said nothing */
  const cardModes = () => devOrder().map((s) => modeOf(s.id));

  /* 2026-09-24 · A CLOSED WINDOW ASKS FOR NO LAYOUT (optimization LB1; AUDIT-D FD5(a), AUDIT-E FE2).  Closed is
     `root.hidden = rail.hidden = true`, i.e. `display: none`, so every rect place() reads below answered the ZERO
     rect anyway — at the price of a forced style + layout of the whole, still-growing document, several times
     during boot and again in every restoreModulation.  While closed the same zero rect is handed back without
     asking; every style write keeps the value it had, and the host is still told `moved()` (rack.js modDodge
     re-seats the transport and dirties the occlusion mask on it).  open() sets P.open BEFORE its own place(), so
     the first open measures exactly as it always did. */
  const ZERO_RECT = Object.freeze({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 });
  function place() {
    if (root.querySelector('.mod-matrix[open]')) return;
    const live = P.open;
    const rectOf = (node) => (live ? node.getBoundingClientRect() : ZERO_RECT);
    const macroTrim = P.macroMin && !P.ribbon ? GEOM.RAIL_W - MACRO_MIN_W : 0;
    const lawW = sizeLaw.width(cardModes(), { uiScale: 1, ribbon: P.ribbon }) - macroTrim;
    const h = sizeLaw.height({ uiScale: 1 });
    const vw = window.innerWidth, vh = window.innerHeight;


    const w = Math.min(lawW, vw - 16);
    /* IT STAYS CENTRED UNTIL A HAND MOVES IT.  The window grows and shrinks with the rack — a
       card added is 367 px of new width — and a first appearance that was centred on one card
       and then grew off the right edge is a window nobody can reach the close chip of. */


    if (!placed) {
      P.x = Math.round((vw - w) / 2); P.y = Math.round(Math.max(56, (vh - h) / 2));
      placed = true;
    }
    /* ── WAVE 100 · A WINDOW THAT GREW IS PULLED BACK ONTO THE SCREEN ────────────────────────────
       Clamping the width stops the growth; it does not undo the fact that a window which grew while
       its left edge was pinned now ends 243 px past the right of the display (measured).  So on a
       change of WIDTH — a card added, removed, folded or compacted — the window is slid left by
       exactly enough to fit, and never past the screen's own left edge.
         IT IS GATED ON THE WIDTH CHANGING, and that is what keeps wave 93's ruling intact: a DRAG
       does not change `w`, so a window the hand deliberately pushed half off the screen stays where
       the hand left it, and "they shouldn't resize towards the center" still holds for every other
       call.  Only growth moves it, and only far enough. */
    if (w !== lastW) {
      if (P.x + w > vw - 8) P.x = Math.max(8, vw - 8 - w);
      lastW = w;
    }
    /* THE CLAMP IS THE HOUSE'S: a header stays reachable, 120 px across and all 52 of it down. */
    P.x = Math.round(Math.max(120 - w, Math.min(vw - 120, P.x)));
    P.y = Math.round(Math.max(0, Math.min(Math.max(0, vh - 52), P.y)));
    /* WAVE 77 · +18 for the card's float, which the view height cannot carry (setViewHeight clamps to
       CARD_FULL.h).  modhost.css §42 spends it as the run's bottom padding; this keeps the window
       from clipping the row that grew. */
    /* WAVE 95 · the card lost 32 (modhost §96) and the float's room came down 18 → 6 (§42), so the
       window follows both: `sizeLaw.height` still returns chrome + CARD_FULL, and the two numbers
       below are the only place that difference is spent. */
    root.style.width = w + 'px'; root.style.height = (h - CARD_TRIM + FLOAT_ROOM) + 'px';
    root.style.left = P.x + 'px'; root.style.top = P.y + 'px';
    mw.setViewHeight(h);
    /* the artifact clamps its view to CARD_FULL.h, which is still 368 — the shorter card is ours, so
       the view is re-stated after its setter rather than fought with a second one. */
    if (rackEl.root) rackEl.root.style.setProperty('--m2-view-h', (GEOM.CARD_FULL.h - CARD_TRIM) + 'px');
    /* THE WORK-BAR LANE.  Two absolutely-positioned boxes in one 52 px lane with a real hole
       between them, placed by the artifact's own law in VIEWPORT pixels and written back
       relative to the window. */
    const bars = sizeLaw.workBars(P.x + w, vw, M.dormantCount() > 0);
    foot.prebar.style.width = bars.presetW + 'px';
    foot.prebar.style.setProperty('--m2-precore-w', bars.coreW + 'px');


    let railX = 0;
    const footEl = foot.prebar.parentElement;
    if (footEl && rackEl.rail) {
      const rr = rectOf(rackEl.root), fr = rectOf(footEl);
      if (rr.width > 0) railX = Math.round(rr.left - fr.left);
    }
    foot.prebar.style.left = railX + 'px';
    const minPre = railX + bars.presetW + GEOM.WORK_GAP_MIN;


    let preLeft = bars.left - P.x;
    if (footEl && rackEl.run) {
      const cards = rackEl.run.querySelectorAll('.m2dev');
      /* WAVE 100 · capped at the RUN's own right edge: once the run scrolls, the last card's rect is
         its scrolled position and can sit far off-screen, which would carry the bar out with it. */
      const runR = rectOf(rackEl.run).right;
      const edge = Math.min(cards.length ? rectOf(cards[cards.length - 1]).right : runR, runR);
      const fr = rectOf(footEl);
      if (edge > fr.left) preLeft = (edge - fr.left) - bars.width;
    }
    /* WAVE 80 · THE BAR IS MEASURED, NOT DECLARED.  modhost §58 lets `.m2pre` size to its contents
       (the tempo readout stacks its unit over its Hz now, so the row is far short of GEOM.TIMING_W's
       450), and the right edge still lands on the last device — so the width is read back after the
       box has laid out rather than written from the law.  The law's number is the fallback for the
       frame before layout exists. */
    foot.pre.style.width = '';
    const tw = Math.round(rectOf(foot.pre).width) || bars.width;
    if (footEl && rackEl.run) {
      const cards2 = rackEl.run.querySelectorAll('.m2dev');
      const runR2 = rectOf(rackEl.run).right;
      const edge2 = Math.min(cards2.length ? rectOf(cards2[cards2.length - 1]).right : runR2, runR2);
      const fr2 = rectOf(footEl);
      if (edge2 > fr2.left) preLeft = (edge2 - fr2.left) - tw;
    }
    foot.pre.style.left = Math.round(Math.max(preLeft, minPre)) + 'px';
    /* WAVE 81 · AND THE HOST IS TOLD WHERE THIS WINDOW NOW IS.  The plugin does not reach out and
       restyle λWAVES' transport — that is the boundary law this port is built on (`close()` says the
       same thing about the clock).  It REPORTS its rect; rack.js decides whether its own playhead is
       in the way and which seat to take.  One call, at the end of every place, which is exactly the
       set of moments the window's box can have changed. */
    if (port.moved) { try { port.moved(live ? root.getBoundingClientRect() : (typeof DOMRect === 'function' ? new DOMRect(0, 0, 0, 0) : { ...ZERO_RECT })); } catch (_) {} }


    const RAIL_GAP = 0;
    const rw = 62 + RAIL_GAP;


    let railLeft;
    if (P.x >= rw) railLeft = P.x - rw;
    else {
      const rb = rackEl.rail ? rectOf(rackEl.rail) : null;
      const gap = rb && rb.width > 0 ? Math.max(RAIL_GAP, Math.round(rb.left - (P.x - RAIL_GAP))) : RAIL_GAP;
      const cards3 = rackEl.run ? rackEl.run.querySelectorAll('.m2dev') : [];
      const runR3 = rackEl.run ? rectOf(rackEl.run).right : P.x + w;
      const edge3 = Math.min(cards3.length ? rectOf(cards3[cards3.length - 1]).right : runR3, runR3);
      railLeft = Math.min(vw - 62, Math.round(edge3 + gap));
    }
    rail.style.left = (P.macroSide === 'right' ? Math.min(vw-38,P.x+w+4) : railLeft) + 'px';


    const rootBox = rackEl.root ? rectOf(rackEl.root) : null;
    /* WAVE 87 · THE LANE'S LIFT, WRITTEN WHERE THE BARS CAN READ IT.  modhost §77 moves the two work
       bars instead of re-laying the column, and its first cut asked for `var(--m2-view-h)` — which is
       set on `.m2root` and therefore invisible to `.m2workbar`, a SIBLING of it: custom properties
       inherit DOWN, never sideways, so the calc was invalid and the transform silently did nothing
       (measured: the bars moved 8 px instead of the row's height).  The distance is written onto the
       window root, which is an ancestor of both, and it is measured rather than assumed. */


    const cardEl = rackEl.run && rackEl.run.querySelector('.m2dev');
    const laneTop = panel.classList.contains('m2bars-top');
    if (rootBox && rootBox.height > 0 && cardEl && !laneTop) {
      /* ⚠ MEASURED FROM THE BAR ITSELF, NOT FROM THE ROOT.  The first cut used `rootBox.bottom` as the
         bar's top and read back 26 below against 18 above — the bar does not start where the root
         ends (the foot has its own box, and the run's shadow padding sits between them).  The only
         honest source for "where is the bar" is the bar.  Skipped while the lane is ALREADY up,
         because the bar's rect is translated then and would fold the lift into itself. */
      const cb = rectOf(cardEl);
      const bb = rectOf(foot.prebar);
      const gap = Math.round(bb.top - cb.bottom);
      root.style.setProperty('--m2-lane-lift', Math.round(bb.top - (cb.top - gap - bb.height)) + 'px');
    } else if (rootBox && rootBox.height > 0 && !root.style.getPropertyValue('--m2-lane-lift')) {
      root.style.setProperty('--m2-lane-lift', Math.round(rootBox.height + 52) + 'px');
    }
    const railH = live ? (rail.offsetHeight || 0) : 0;
    const wantTop = rootBox && rootBox.height > 0
      ? Math.round(rootBox.top + rootBox.height / 2 - railH / 2)
      : P.y;
    rail.style.top = Math.max(4, Math.min(vh - Math.max(80, railH) - 4, wantTop)) + 'px';
  }

  /** the four accent numbers the artifact derives 57 tints from — host-contract PART 1 §3.
   *  λWAVES publishes `--acc` / `--acc2` as resolved colours from the palette wheel, so the
   *  HUE and SATURATION are handed over here rather than left at a literal the wheel cannot
   *  move.  Two elements carry them: the window and its rail.  Nothing else is written. */
  function setAccent(a, b) {
    for (const [n, v] of [['--hue-acc', a[0]], ['--sat-acc', a[1] + '%'],
                          ['--hue-acc2', b[0]], ['--sat-acc2', b[1] + '%']]) {
      root.style.setProperty(n, String(v)); rail.style.setProperty(n, String(v));
    }
  }

  /* ═══ THE CHIP RAIL — five discs, and the drag is one of them ═══════════════════════════ */
  const chips = mw.chiprail.chips;
  const WORK_LANES = ['bottom', 'top', 'hidden'];
  function syncWorkbarChip() {
    const chip = chips.workbars; if (!chip) return;
    const next = WORK_LANES[(WORK_LANES.indexOf(P.lane) + 1) % WORK_LANES.length];
    const names = { bottom: 'below', top: 'above', hidden: 'hidden' };
    chip.dataset.workLane = P.lane;
    chip.setAttribute('aria-pressed', P.lane === 'top' ? 'true' : P.lane === 'hidden' ? 'mixed' : 'false');
    chip.setAttribute('aria-label', 'Work bars: ' + names[P.lane] + '. Tap to ' + (next === 'hidden' ? 'hide them' : 'move them ' + names[next]));
    chip.title = 'WORK BARS · ' + P.lane.toUpperCase();
    chip.classList.toggle('on', P.lane === 'top');
  }
  chips.close.addEventListener('click', () => close());
  chips.compact.addEventListener('click', () => {
    const all = devOrder();
    const toC = all.some((s) => modeOf(s.id) === 'F');
    for (const s of all) setMode(s.id, toC ? 'C' : 'F');
    chips.compact.setAttribute('aria-pressed', toC ? 'true' : 'false');
    chips.compact.classList.toggle('on', toC);
    place(); paint(true); persist();
  });
  chips.workbars.addEventListener('click', () => {
    P.lane = WORK_LANES[(WORK_LANES.indexOf(P.lane) + 1) % WORK_LANES.length];
    setWorkLane(panel, P.lane);
    syncWorkbarChip();
    if (P.lane !== 'hidden') place();
    persist();
  });
  /* THE RIBBON IS THE ARTIFACT'S OWN SECOND FORM.  Its 21 rules and `sizeLaw`'s 58-px rail
     travelled complete; only BASINS' own caller stopped reaching them (`m2SetRibbon` removes
     the class and never adds it — MANIFEST, "copied broken").  The chip is here, so the form
     it names is here: `.m2ribbon` on the rack root, and the width law told about it. */
  chips.ribbon.addEventListener('click', () => {
    P.ribbon = !P.ribbon;
    rackEl.root.classList.toggle('m2ribbon', P.ribbon);
    chips.ribbon.setAttribute('aria-pressed', P.ribbon ? 'true' : 'false');
    chips.ribbon.classList.toggle('on', P.ribbon);
    place(); paint(true); persist();
  });

  /* THE DRAG.  The house pattern (rack.js's floating windows): capture on the source, move
     the window and its rail together, resolve on pointerup.  The grip is a DIV with nine dots
     and it is the only thing on this window that moves it. */
  {
    const grip = chips.drag;
    let d = null;
    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { grip.setPointerCapture(e.pointerId); } catch (_) {}
      d = { x: e.clientX - P.x, y: e.clientY - P.y };
      placed = true;                                   // the hand owns the position from here
      grip.classList.add('drag');
    });
    grip.addEventListener('pointermove', (e) => { if (!d) return; P.x = e.clientX - d.x; P.y = e.clientY - d.y; place(); });
    const stop = () => { if (!d) return; d = null; grip.classList.remove('drag'); persist(); };
    grip.addEventListener('pointerup', stop);
    grip.addEventListener('pointercancel', stop);
  }
  const onResize = () => { if (P.open) place(); };
  window.addEventListener('resize', onResize, { passive: true });

  /* ═══ THE TRANSPORT STRIP — play · tempo · TAP · SYNC · CADENCE · HOLD 1/4 · HOLD 1 ═════ */
  transport.xport.addEventListener('click', () => {
    /* WAVE 65 · THE WINDOW'S PLAYHEAD ARMS THE RACK RATHER THAN DOING NOTHING.  MOD lives on the
       λWAVES transport, because this window's timing bar is the artifact's and is not ours to grow —
       so the press that most obviously means "I want modulation" asks the host to arm, and the lamp
       out on the transport lights.  The host owns the flag, the glow and the persistence. */
    const armed = port.armed ? port.armed() : true;
    if (!armed && port.arm) { port.arm(true); status('MOD is on — the arm is the small button beside λWAVES’ own play', ''); }
    const r = clock.toggle(performance.now() / 1000);
    if (!r.ok) status('nothing is routed — the transport has nothing to do', 'warn');
    else if (armed) status(r.playing ? resumeSentence() : '', '');
    sync();
  });
  transport.xport.title = 'Play or pause modulation';

  const nativeRate = port.rateControl && port.rateControl();
  if (nativeRate) { nativeRate.root.classList.add('m2-native-rate'); transport.xport.parentNode.insertBefore(nativeRate.root, transport.tempo); }

  /* THE TEMPO FIELD.  `.modtempo` and `.modtempoin` stand in the same seat and swap `hidden`;
     the number never goes, only its unit and its derived Hz (`.tight`, then `.tighter`). */
  transport.tempo.title = 'Set the modulation clock in beats per minute';
  let tempoDragged = false;
  transport.tempo.addEventListener('click', () => {
    if (tempoDragged) { tempoDragged = false; return; }
    const seat=transport.tempo.getBoundingClientRect();transport.tempoIn.style.width=seat.width+'px';transport.tempoIn.style.flex='0 0 '+seat.width+'px';transport.tempoIn.style.height=seat.height+'px';
    transport.tempo.hidden = true; transport.tempoIn.hidden = false;
    transport.tempoIn.value = String(Math.round(M.transport.bpm));
    transport.tempoIn.focus(); transport.tempoIn.select();
  });
  const closeTempo = (take) => {
    if (transport.tempoIn.hidden) return;
    if (take) { const v = parseFloat(transport.tempoIn.value); if (Number.isFinite(v)) clock.setBpm(v); }
    transport.tempoIn.hidden = true; transport.tempo.hidden = false; paint(true);
  };
  transport.tempoIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); closeTempo(true); }
    else if (e.key === 'Escape') { e.preventDefault(); closeTempo(false); }
  });
  transport.tempoIn.addEventListener('blur', () => closeTempo(true));
  /* AND IT IS A DIAL TOO: a vertical drag on the number is the BPM knob this strip has no room
     for, on the house ladder — 220 px of travel over the model's own [20, 300]. */
  {
    let d = null;
    transport.tempo.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      d = { y: e.clientY, bpm: M.transport.bpm, moved: false, touch: e.pointerType === 'touch' };
      try { transport.tempo.setPointerCapture(e.pointerId); } catch (_) {}
    });
    transport.tempo.addEventListener('pointermove', (e) => {
      if (!d) return;
      if (!d.moved && Math.abs(e.clientY - d.y) < 4) return;
      d.moved = true;
      const span = M.BPM_MAX - M.BPM_MIN;
      clock.setBpm(d.bpm + (d.y - e.clientY) / TRAVEL(e, d.touch) * span);
      paint(true);
    });
    /* A DRAG IS NOT A TAP.  `click` fires after `pointerup` whatever the pointer did, so the
       drag leaves a mark the click handler reads and clears — without it every dial turn also
       opened the type-in field over the number it had just moved. */
    const stop = () => { if (!d) return; if (d.moved) tempoDragged = true; d = null; };
    transport.tempo.addEventListener('pointerup', stop);
    transport.tempo.addEventListener('pointercancel', () => { d = null; });
  }

  /* TAP.  Wave 60 refused a tap tempo — "nobody taps a fractal" — and the artifact ships the
     button, so the refusal is reversed rather than left as a dead 44 px seat: BPM is the LOOP
     CLOCK here, and tapping four bars is a way to name a loop period with a hand. */
  /* `tapTempo` reads MILLISECONDS (TAP_GAP_MS is 2600) and hands back a NEW run rather than
     mutating the one it was given, so the run is reassigned and never appended to. */
  let taps = [];
  transport.tap.title = 'Tap repeatedly to set the modulation clock';
  transport.tap.addEventListener('click', () => {
    const r = M.tapTempo(taps, performance.now());
    taps = r.taps;
    if (r.bpm) { clock.setBpm(r.bpm); status('tapped ' + r.bpm.toFixed(1) + ' BPM from ' + r.k + ' intervals', ''); }
    else status('keep tapping — two taps make an interval', '');
    paint(true);
  });

  transport.sync.title = 'WALL follows elapsed time. FREE accumulates frame time.';
  transport.sync.addEventListener('click', () => { clock.setSync(M.syncMode() === 'wall' ? 'free' : 'wall'); sync(); });
  transport.cad.title = 'Limit modulation updates per second';
  transport.cad.addEventListener('click', () => { if (port.setCadence) port.setCadence(port.cadence() === 120 ? 60 : 120); sync(); });

  const HOLD_NOTE = ['1/4', '1'];
  transport.holds.forEach((b, i) => {
    b.title = 'Hold and repeat ' + HOLD_NOTE[i] + '; release to resume the original clock';
    b.addEventListener('click', () => {
      if (M.transport.hold && M.transport.holdNote === HOLD_NOTE[i]) { clock.release(); status('STUTTER released — rejoined the running beat', ''); }
      else { if (M.transport.hold) clock.release(); clock.hold(HOLD_NOTE[i]); status('STUTTER '+HOLD_NOTE[i]+' latched — applies to BPM-synced LFOs; press again to release', ''); }
      sync();
    });
  });

  /* ═══ THE PRESET BAR ════════════════════════════════════════════════════════════════════ */
  let presetOpen = false;
  foot.open.addEventListener('click', () => { presetOpen ? closePresets() : openPresets(); });
  foot.save.addEventListener('click', () => {
    const name = (foot.name.value || '').trim();
    if (!name) { status('type a name first — the field beside SAVE', 'warn'); foot.name.focus(); return; }
    let r = M.presetSave(name, M.serializeRack());
    /* A NAME THAT IS ALREADY TAKEN IS A REPLACE, not a refusal — the model asks first and
       this window answers yes, because SAVE on a name you just loaded means "keep this". */
    if (r && r.error === 'exists') r = M.presetSave(name, M.serializeRack(), { replace: true });
    if (r && r.ok) { foot.name.classList.remove('m2predirty'); status('saved \u201c' + r.name + '\u201d', ''); }
    else status(r && r.error === 'factory-name' ? 'that name belongs to a factory preset — try “' + r.suggest + '”' : 'could not save that preset', 'warn');
    if (presetOpen) openPresets();
  });


  const userPresets = () => M.presetList().filter((p) => !p.factory);
  const folderLabel = (name) => name === M.PRESET_FOLDER_DEFAULT ? 'MY PRESETS' : name;
  const stepPreset = (dir) => {
    const list = userPresets();
    if (!list.length) { status('no presets yet — type a name and press SAVE', 'warn'); return; }
    const cur = list.findIndex((p) => p.name === foot.name.value);
    const next = list[((cur < 0 ? (dir > 0 ? -1 : 0) : cur) + dir + list.length) % list.length];
    loadPreset(next.id);
  };
  foot.prev.addEventListener('click', () => stepPreset(-1));
  foot.next.addEventListener('click', () => stepPreset(1));
  foot.name.addEventListener('input', () => foot.name.classList.add('m2predirty'));

  function loadPreset(id) {
    const r = M.presetApply(id);
    if (!r || r.ok === false) { status(r && r.error === 'foreign' ? 'that preset was written by a model this build cannot honour' : 'that preset could not be loaded', 'warn'); return; }
    foot.name.value = r.name || ''; foot.name.classList.remove('m2predirty');
    M.syncDormant((id2) => registry.has(id2));
    clock.recomputeRunning(); apply(); rebuild();
    status('loaded “' + (r.name || id) + '”', '');
  }
  function closePresets() { presetOpen = false; psheet.root.hidden = true; foot.open.setAttribute('aria-expanded', 'false'); }
  function openPresets() {
    presetOpen = true;
    psheet.root.innerHTML = '';
    const all = userPresets();
    const cur = foot.name.value;
    for (const f of M.presetFolders().filter((f) => !f.factory)) {
      const mine = all.filter((p) => p.folder === f.name);
      const shut = !!P.folder[f.name];
      const grp = psheet.group(folderLabel(f.name), shut, false);
      grp.tag.textContent = String(mine.length);
      grp.fold.addEventListener('click', () => { P.folder[f.name] = !P.folder[f.name]; openPresets(); persist(); });
      if (shut) continue;
      for (const p of mine) {
        const row = grp.row(p.name, { factory: !!p.factory, on: p.name === cur, stale: !!p.stale });
        row.btn.addEventListener('click', () => { closePresets(); loadPreset(p.id); });
        if (row.del) row.del.addEventListener('click', (e) => {
          e.stopPropagation(); M.presetDelete(p.id); openPresets();
          status('deleted “' + p.name + '”', '');
        });
      }
    }
    psheet.root.hidden = false;
    foot.open.setAttribute('aria-expanded', 'true');
  }

  /* THE DEAD SENDS.  A route whose target this build does not have keeps its settings and says
     so; the warning is hidden entirely while nothing is dormant, because a warning that is
     always on the glass is furniture. */
  let deadOpen = false;
  foot.dead.addEventListener('click', () => { deadOpen ? closeDead() : openDead(); });
  function closeDead() { deadOpen = false; dead.root.hidden = true; foot.dead.setAttribute('aria-expanded', 'false'); }
  function openDead() {
    deadOpen = true;
    dead.title.textContent = 'DEAD SENDS';
    dead.list.innerHTML = '';
    for (const r of M.dormantRoutes()) {
      const m = M.macroOf(r.macroId);
      const row = dead.row({ routeId: r.id, macroId: r.macroId, targetId: r.targetId, reason: 'target-unavailable' });
      row.source.textContent = m ? m.name : r.macroId;
      row.target.textContent = r.targetId;
      row.why.textContent = 'this build has no such target';
      row.trail.nodeValue = ' — the route keeps its range until one appears';
      row.remove.addEventListener('click', () => { M.removeRoute(r.id); clock.recomputeRunning(); apply(); rebuild(); openDead(); });
    }
    dead.root.hidden = false;
    foot.dead.setAttribute('aria-expanded', 'true');
  }
  dead.close.addEventListener('click', closeDead);


  const RING_C = 30, R_EDIT = 21.5, R_STACK = 18, R_HIT = 28, R_SPUR = 24.5, R_TICK0 = 19.6, R_TICK1 = 23.4;
  const ringGeom = (wrap) => (wrap ? { a0: -90, sweep: 360 } : { a0: -225, sweep: 270 });
  const ringPt = (u, r, g) => { const a = (g.a0 + g.sweep * u) * Math.PI / 180;
                                return [RING_C + r * Math.cos(a), RING_C + r * Math.sin(a)]; };
  const fullD = (r) => 'M ' + (RING_C - r) + ' ' + RING_C + ' A ' + r + ' ' + r + ' 0 1 1 ' + (RING_C + r) + ' ' + RING_C +
                       ' A ' + r + ' ' + r + ' 0 1 1 ' + (RING_C - r) + ' ' + RING_C;
  function arcD(u0, u1, r, g) {
    const deg = (u1 - u0) * g.sweep;
    if (deg >= 359.9) return fullD(r);
    const [x0, y0] = ringPt(u0, r, g), [x1, y1] = ringPt(u1, r, g);
    return 'M ' + x0.toFixed(3) + ' ' + y0.toFixed(3) + ' A ' + r + ' ' + r + ' 0 ' +
           (deg > 180 ? 1 : 0) + ' 1 ' + x1.toFixed(3) + ' ' + y1.toFixed(3);
  }
  const radialD = (u, r0, r1, g) => { const [x0, y0] = ringPt(u, r0, g), [x1, y1] = ringPt(u, r1, g);
    return 'M ' + x0.toFixed(3) + ' ' + y0.toFixed(3) + ' L ' + x1.toFixed(3) + ' ' + y1.toFixed(3); };

  let cat = [];
  const rebuildCatalogue = () => { cat = registry.describe(); };
  const descOf = (id) => cat.find((d) => d.id === id) || (registry.has(id) ? registry.describeOne(id) : null);

  const EMPTY_SPAN = Object.freeze({ lo: 0, hi: 0, live: 0, dormant: 0 });
  function spanOf(id) {
    const q = routeIndex().get(id);
    return q ? { lo: q.lo, hi: q.hi, live: q.live, dormant: q.dormant } : EMPTY_SPAN;
  }

  /** THE SELECTED MACRO — view state, never serialized: it decides which macro's route the
   *  OUTER arc of a ring edits, and nothing else. */
  let selMacro = null;
  let selSource = null;
  const macroIds = () => M.macroList().filter((m) => m.kind !== 'trigger').map((m) => m.id);
  const sourceOwnsMacro = (sourceId, m) => !!(sourceId && m && m.sourceId &&
    (m.sourceId === sourceId || m.sourceId.startsWith(sourceId + ':')));
  function selectedMacro() {
    const ids = macroIds();
    if (!ids.length) return null;
    if (selMacro && ids.indexOf(selMacro) >= 0) return selMacro;
    selMacro = ids[0];
    return selMacro;
  }
  function selectMacro(id) {
    selMacro = id; selSource = null;
    for (const [mid, rec] of macRows) rec.root.classList.toggle('sel', mid === id);
    paintRings();
  }
  function selectSource(id) {
    selSource = id;
    const owned = M.macroList().filter((m) => sourceOwnsMacro(id, m));
    if (owned.length) selMacro = owned[0].id;
    for (const [mid, rec] of macRows) rec.root.classList.toggle('sel', owned.some((m) => m.id === mid));
    paintRings();
  }
  function routeSelected(r) {
    const m = r && M.macroOf(r.macroId);
    return !!(m && (selSource ? sourceOwnsMacro(selSource, m) : r.macroId === selectedMacro()));
  }
  function editRouteOf(id) {
    const sel = selectedMacro(); if (!sel) return null;
    for (const r of M.routesOfTarget(id)) if (r.macroId === sel) return r;
    return null;
  }
  function routeSpan(r) {
    const m = M.macroOf(r.macroId);
    const d = (r.max - r.min) * (m ? m.masterDepth : 1);
    return r.bi ? { lo: -Math.abs(d) / 2, hi: Math.abs(d) / 2, d } : d < 0 ? { lo: d, hi: 0, d } : { lo: 0, hi: d, d };
  }
  function liveSpan(r) {
    if (r.dormant || r.enabled === false) return null;
    const m = M.macroOf(r.macroId); if (!m) return null;
    if (m.sourceId) { const s = M.sourceOf(m.sourceId); if (!s || !s.on) return null; }
    return routeSpan(r);
  }
  /** the drop fills exactly the room the knob has left, in the direction it has room — where
   *  we beat Serum, which infers polarity from where the control stands and then assigns a
   *  FULL-SCALE depth.  Nothing clips on the first frame. */
  function defaultRange(id) {
    const b = registry.state(id).baseNorm, d = descOf(id);
    if (registry.isWrap(id)) return { min: 0, max: 1, bi: false };
    if ((d && d.map === 'bipolar') || Math.abs(b - 0.5) <= 0.02) {
      const h = Math.min(b, 1 - b);
      return { min: 0, max: 2 * h, bi: true };
    }
    if (b <= 0.5) return { min: 0, max: 1 - b, bi: false };
    return { min: b, max: 0, bi: false };
  }
  function rangeMode(r) { return r.bi ? 'centre' : (r.max >= r.min ? 'up' : 'down'); }
  function rangeFor(id, mode) {
    const b = registry.isWrap(id) ? 0.5 : registry.state(id).baseNorm;
    if (mode === 'centre') { const h = registry.isWrap(id) ? 0.5 : Math.min(b, 1 - b); return { min: 0, max: 2 * h, bi: true }; }
    if (mode === 'down') return { min: registry.isWrap(id) ? 1 : b, max: 0, bi: false };
    return { min: 0, max: registry.isWrap(id) ? 1 : 1 - b, bi: false };
  }

  const rings = new Map();
  const knobOf = (id) => (port.knobOf ? port.knobOf(id) : null);
  const dialOf = (id) => { const k = knobOf(id);
    const r = (k && k.root) || document.querySelector('.k[data-param="' + id + '"]');
    return r ? r.querySelector('.k-dial') : null; };

  function syncRings() {
    const idx = routeIndex();
    for (const [id, rec] of rings) {
      if (idx.has(id) && registry.has(id) && rec.dial.isConnected) continue;
      rec.svg.remove(); if(rec.depth) rec.depth.root.remove(); if (rec.x) rec.x.remove(); if (ringFocus === id) ringFocus = null;
      if (rec.dial.parentElement) rec.dial.parentElement.classList.remove('has-ring', 'mod-selected', 'ring-focus');
      rings.delete(id);
    }
    for (const id of idx.keys()) {
      if (!registry.has(id)) continue;
      const dial = dialOf(id); if (!dial) continue;   /* yaw and pitch carry no dial: picker-only */
      if (!rings.has(id)) rings.set(id, buildRing(dial, id));
    }
    paintRings(idx);
  }

  function buildRing(dial, id) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'k-ring'); svg.setAttribute('viewBox', '0 0 60 60');
    svg.setAttribute('aria-hidden', 'true');
    const rec = { id, dial, svg,
      stack: svgEl('path', 'k-ring-stack', svg), edit: svgEl('path', 'k-ring-edit', svg),
      tick: svgEl('path', 'k-ring-tick', svg), spur: svgEl('path', 'k-ring-spur', svg),
      hit: svgEl('path', 'k-ring-hit', svg) };
    rec.hit.setAttribute('d', fullD(R_HIT));
    dial.appendChild(svg);
    if (dial.parentElement) dial.parentElement.classList.add('has-ring');
    dial.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      const rs = M.routesOfTarget(id).filter((r) => !r.dormant);
      const chosen = rs.find(routeSelected) || rs[0];
      if (chosen) selectMacro(chosen.macroId);
    });
    wireRing(rec);
    const depth = knob({label:'RANGE',min:-1,max:1,value:0,fmt:v=>(v*100).toFixed(0)+'%',onInput:d=>{const r=editRouteOf(id);if(!r)return;M.setRouteRange(r.id,{min:Math.max(0,-d),max:Math.max(0,d)});apply();paintRings();}});
    depth.root.classList.add('k-route-depth'); depth.root.title='Selected macro range; the large dial sets the base';
    depth.root.addEventListener('pointerdown',e=>e.stopPropagation());
    dial.parentElement.appendChild(depth.root); rec.depth=depth;
    /* THE ROUTED KNOB's OWN TWO BADGES, AND ONLY ON THE ONE THE HAND IS ON (2026-09-18).  The range dial used to sit
       beside EVERY routed dial, which pushed each dial 10 px off its own label and covered the right of its arc; and
       the only ways to take a route off were a double-tap or a 450 ms hold on an 8-px ring band.  Now a routed dial
       stays under its label (lab.css), and touching it gives THAT control its range dial at one corner and a × at
       the other: × removes the selected macro's route, or opens the list when several macros hold the control.
       A right-click or a held press on the DIAL ITSELF opens the same pop-over the ring band always had. */
    const x = el('button', 'k-route-x', dial.parentElement, '×'); x.type = 'button';
    x.title = 'Remove the macro from this control'; x.setAttribute('aria-label', 'remove the macro from this control');
    x.addEventListener('pointerdown', (e) => e.stopPropagation());
    x.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation();
      const rs = M.routesOfTarget(id).filter((r) => !r.dormant);
      if (rs.length > 1) { const b = x.getBoundingClientRect(); openPop(id, b.left, b.bottom + 4); return; }
      if (!removeEditRoute(id) && rs.length) { M.removeRoute(rs[0].id); if (registry.has(id)) registry.restoreBase(id); clock.recomputeRunning(); apply(); rebuild(); }
    });
    rec.x = x;
    let holdDial = 0;
    dial.addEventListener('pointerdown', (e) => {
      focusRing(id);
      if (e.button) return;
      const x0 = e.clientX, y0 = e.clientY; clearTimeout(holdDial);
      holdDial = setTimeout(() => { holdDial = 0; openPop(id, x0, y0); }, 600);
      const move = (ev) => { if (Math.abs(ev.clientX - x0) > 4 || Math.abs(ev.clientY - y0) > 4) done(); };
      const done = () => { clearTimeout(holdDial); holdDial = 0; window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', done, true); window.removeEventListener('pointercancel', done, true); };
      window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', done, true); window.addEventListener('pointercancel', done, true);
    });
    dial.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); focusRing(id); openPop(id, e.clientX, e.clientY); });
    return rec;
  }
  /** one routed control at a time wears its badges: the one the hand last touched */
  let ringFocus = null;
  function focusRing(id) {
    if (ringFocus === id) return;
    const was = ringFocus && rings.get(ringFocus); if (was && was.dial.parentElement) was.dial.parentElement.classList.remove('ring-focus');
    ringFocus = id;
    const now = id && rings.get(id); if (now && now.dial.parentElement) now.dial.parentElement.classList.add('ring-focus');
  }
  document.addEventListener('pointerdown', (e) => {
    if (!ringFocus) return;
    const k = e.target.closest && e.target.closest('.k.has-ring');
    if (k && k.dataset.param === ringFocus) return;
    if (e.target.closest && e.target.closest('.mod-pop')) return;
    focusRing(null);
  }, true);

  /** ONE pass over the route list into a Map — every reader of a paint tick is handed the same
   *  index, rather than each slicing the whole list for itself. */
  function routeIndex() {
    const m = new Map();
    for (const r of M.routeList()) {
      let q = m.get(r.targetId);
      if (!q) { q = { lo: 0, hi: 0, live: 0, dormant: 0, rs: [] }; m.set(r.targetId, q); }
      q.rs.push(r);
      if (r.dormant) { q.dormant++; continue; }
      const sp = liveSpan(r); if (!sp) continue;
      q.live++; q.lo += sp.lo; q.hi += sp.hi;
    }
    return m;
  }
  function paintRings(idx) {
    if (!rings.size) return;
    const index = idx || routeIndex();
    for (const [id, rec] of rings) paintRing(rec, index.get(id));
  }
  function paintRing(rec, q) {
    const id = rec.id;
    const hide = (p) => p.setAttribute('d', '');
    const root = rec.dial.parentElement;
    if (root) root.classList.toggle('mod-selected', !!(q && q.rs.some(routeSelected)));
    if (rec.depth) { const route = editRouteOf(id); rec.depth.root.hidden = !q || !route; if (route) rec.depth.set(route.max - route.min); }
    if (!q || !registry.has(id)) { hide(rec.edit); hide(rec.stack); hide(rec.tick); hide(rec.spur); return; }
    const st = registry.state(id), wrap = st.wrap, g = ringGeom(wrap);
    const b = wrap ? ((st.baseNorm % 1) + 1) % 1 : st.baseNorm;
    const er = editRouteOf(id);
    if (er) {
      const sp = routeSpan(er);
      let lo = b + sp.lo, hi = b + sp.hi;
      const overLo = !wrap && lo < -1e-9, overHi = !wrap && hi > 1 + 1e-9;
      if (!wrap) { lo = clamp01(lo); hi = clamp01(hi); }
      if (Math.abs(sp.hi - sp.lo) < 0.001) {
        /* ZERO DEPTH IS A REAL STATE and it keeps its handle: a 4-px radial TICK at the base. */
        hide(rec.edit); rec.tick.setAttribute('d', radialD(b, R_TICK0, R_TICK1, g));
      } else if (wrap && hi - lo >= 1) {
        hide(rec.tick); rec.edit.setAttribute('d', fullD(R_EDIT));
      } else {
        hide(rec.tick); rec.edit.setAttribute('d', arcD(lo, hi, R_EDIT, g));
      }
      if (overLo || overHi) rec.spur.setAttribute('d', radialD(overLo ? 0 : 1, R_EDIT, R_SPUR, g));
      else hide(rec.spur);
      rec.svg.classList.toggle('is-dormant', !liveSpan(er));
    } else { hide(rec.edit); hide(rec.tick); hide(rec.spur); rec.svg.classList.remove('is-dormant'); }
    let slo = 0, shi = 0, sn = 0;
    for (const r of q.rs) {
      if (er && r === er) continue;
      const sp = liveSpan(r); if (!sp) continue;
      slo += sp.lo; shi += sp.hi; sn++;
    }
    if (sn && Math.abs(shi - slo) > 1e-9) {
      let lo = b + slo, hi = b + shi;
      if (!wrap) { lo = clamp01(lo); hi = clamp01(hi); }
      rec.stack.setAttribute('d', (wrap && hi - lo >= 1) ? fullD(R_STACK) : arcD(lo, hi, R_STACK, g));
    } else hide(rec.stack);
    rec.svg.classList.toggle('has-stack', sn > 0);
  }

  function reachText(id) {
    const st = registry.state(id), d = descOf(id), q = routeIndex().get(id);
    const sp = q || { lo: 0, hi: 0 };
    let lo = st.baseNorm + sp.lo, hi = st.baseNorm + sp.hi;
    const clipLo = !st.wrap && lo < -1e-9, clipHi = !st.wrap && hi > 1 + 1e-9;
    if (hi - lo >= 1) return { lo: fmtVal(d, d.min), hi: fmtVal(d, d.max), clipLo, clipHi, whole: true };
    const nrm = (u) => (st.wrap ? ((u % 1) + 1) % 1 : clamp01(u));
    return { lo: fmtVal(d, registry.fromNorm(id, nrm(lo))), hi: fmtVal(d, registry.fromNorm(id, nrm(hi))),
             clipLo, clipHi, whole: false };
  }
  function showReach(id) {
    const k = knobOf(id), r = (k && k.root) || (rings.get(id) && rings.get(id).dial.parentElement);
    const t = reachText(id);
    const v = r && r.querySelector('.k-val');
    if (v) {
      v.textContent = '';
      const a = document.createElement('i'); if (t.clipLo) a.className = 'clip'; a.textContent = t.lo; v.appendChild(a);
      v.appendChild(document.createTextNode(' … '));
      const c = document.createElement('i'); if (t.clipHi) c.className = 'clip'; c.textContent = t.hi; v.appendChild(c);
    }
    return t;
  }
  const restoreVal = (id) => { const k = knobOf(id); if (k && k.paint) k.paint(); };

  /* THE GHOST IS THE ARTIFACT'S — a fixed `--acc` pill, built into `document.body`, text
     truncated to twelve characters by the builder itself.  One ghost, made once and reused. */
  let ghost = null;
  function showGhost(text, x, y, touch) {
    if (!ghost) { ghost = buildGhost(text); }
    ghost.textContent = String(text).slice(0, 12);
    ghost.style.transform = 'translate3d(' + Math.round(x + (touch ? -34 : 12)) + 'px,' +
                            Math.round(y + (touch ? -44 : 12)) + 'px,0)';
    /* `.m2ghost` declares `display: flex`, which beats the UA's `[hidden] { display: none }`
       at author origin — so the pill is hidden by its own display and never by `hidden`. */
    ghost.style.display = 'flex';
  }
  const hideGhost = () => { if (ghost) ghost.style.display = 'none'; };

  /* THE GESTURE.  Two roads decided by 4 px of slop: a DRAG (Serum's road) or a tap that ARMS
     (Bitwig's routing mode), shipped at every size because a gesture that exists on one
     breakpoint is one nobody learns.  The drop marks are OURS and the ATTRIBUTE is the
     artifact's — see the header on why the paint did not travel and the word did. */
  let armed = null;
  function targetsOn(on) {
    document.body.classList.toggle('mod-arming', on);
    for (const k of document.querySelectorAll('.k[data-param]')) {
      const id = k.dataset.param;
      if (!on || !registry.has(id)) { k.classList.remove('mod-drop', 'is-dup', 'is-over'); continue; }
      /* the ARTIFACT'S word for "this control is routable", stamped so nothing is renamed —
         the PAINT is ours, for the reasons in the header. */
      k.dataset.m2target = id;
      k.classList.add('mod-drop');
      k.classList.toggle('is-dup', !!(armed && M.routesOfTarget(id).some((r) => r.macroId === armed.macroId)));
      k.classList.remove('is-over');
    }
  }
  function overAt(x, y) {
    const el2 = document.elementFromPoint(x, y);
    const k = el2 && el2.closest && el2.closest('.k[data-param]');
    const id = k && k.dataset.param;
    const ok = id && registry.has(id) ? k : null;
    if (armed && armed.over !== ok) {
      if (armed.over) armed.over.classList.remove('is-over');
      armed.over = ok; if (ok) ok.classList.add('is-over');
    }
    return ok ? id : null;
  }
  function startArm(macroId, e, grip) {
    if (armed) endArm();
    armed = { macroId, grip, pid: e.pointerId, mode: 'press', x0: e.clientX, y0: e.clientY, over: null,
              touch: e.pointerType === 'touch' };
    grip.classList.add('m2armed');
    targetsOn(true);
  }
  function endArm() {
    if (!armed) return;
    if (armed.over) armed.over.classList.remove('is-over');
    armed.grip.classList.remove('m2armed');
    armed = null;
    targetsOn(false); hideGhost();
  }
  function dropOn(macroId, tid) {
    const d = descOf(tid), label = d ? d.label : tid, m = M.macroOf(macroId);
    const name = m ? m.name : macroId;
    const q = defaultRange(tid);
    const r = M.addRoute(macroId, tid, q.min, q.max);
    if (!r) { status('that macro cannot carry a route', 'warn'); return null; }
    if (r.already) { selectMacro(macroId); status(name + ' already reaches ' + label, 'warn'); return r.route; }
    if (q.bi) M.setRouteRange(r.route.id, { bi: true });
    selMacro = macroId;
    clock.recomputeRunning(); apply(); rebuild();
    const t = reachText(tid);
    status(name + ' → ' + label + '  ·  ' + t.lo + ' … ' + t.hi, '');
    return r.route;
  }

  /** THE GRIP.  `reset()` runs on EVERY pointerup and BEFORE anything decides what this press
   *  meant — which is inherited defect 2, and the whole of its fix: in the source the
   *  arm/disarm branch returned from `pointerdown` before the watcher was ever reached, so only
   *  every other tap counted and the advertised double-tap took three. */
  function wireGrip(grip, macroId) {
    const reset = tapWatcher(() => {
      M.setMacro(macroId, { value: 0, masterDepth: 1 });
      apply(); rebuild(); status('macro reset — value 0, depth 100 %', '');
    });
    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const disarm = !!(armed && armed.macroId === macroId && armed.mode === 'armed');
      selectMacro(macroId);
      if (disarm) { endArm(); status('', ''); grip.dataset.disarmed = '1'; return; }
      delete grip.dataset.disarmed;
      try { grip.setPointerCapture(e.pointerId); } catch (_) {}
      startArm(macroId, e, grip);
    });
    grip.addEventListener('pointermove', (e) => {
      if (!armed || armed.grip !== grip || armed.mode === 'armed') return;
      if (armed.mode === 'press' && Math.abs(e.clientX - armed.x0) < 4 && Math.abs(e.clientY - armed.y0) < 4) return;
      armed.mode = 'drag';
      const m = M.macroOf(macroId);
      showGhost(m ? m.name : macroId, e.clientX, e.clientY, armed.touch);
      overAt(e.clientX, e.clientY);
    });
    grip.addEventListener('pointerup', (e) => {
      /* EVERY lift is a tap for the watcher's purposes — the disarming one included.  A drag
         is not: it moved past the slop and meant something else. */
      const dragging = !!(armed && armed.grip === grip && armed.mode === 'drag');
      if (!dragging) reset();
      if (grip.dataset.disarmed) { delete grip.dataset.disarmed; return; }
      if (!armed || armed.grip !== grip) return;
      if (dragging) {
        const tid = overAt(e.clientX, e.clientY);
        const mid = armed.macroId;
        endArm();
        if (tid) dropOn(mid, tid);       /* dropped on nothing: silent, and no state changed */
        return;
      }
      armed.mode = 'armed';
      grip.classList.add('m2arm');
      hideGhost();
      const m = M.macroOf(macroId);
      status('ARMED: ' + (m ? m.name : macroId) + ' — tap a lit control to route it, tap the grip again to cancel', '');
    });
    grip.addEventListener('pointercancel', () => { if (armed && armed.grip === grip) { endArm(); status('', ''); } });
  }

  const armTap = (e) => {
    if (!armed || armed.mode !== 'armed') return;
    const k = e.target.closest && e.target.closest('.k[data-param]');
    const tid = k && k.dataset.param;
    if (tid && registry.has(tid)) {
      e.preventDefault(); e.stopPropagation();
      const mid = armed.macroId; endArm(); dropOn(mid, tid);
      return;
    }
    if (e.target.closest && e.target.closest('.m2grip')) return;   // the grip's own handler answers
    endArm(); status('', '');
  };
  const armKey = (e) => {
    if (!armed || e.key !== 'Escape') return;
    e.preventDefault(); e.stopPropagation(); endArm(); status('', '');
  };
  document.addEventListener('pointerdown', armTap, true);
  window.addEventListener('keydown', armKey, true);

  /* THE DEPTH GESTURE.  Travel is VERTICAL, over the whole card, never along the arc: 270° of
     a 43-px circle is 101 px and a fingertip is 44. */
  function wireRing(rec) {
    const id = rec.id, hit = rec.hit;
    let drag = null, hold = 0, moved = false;
    const dtap = tapWatcher(() => removeEditRoute(id));
    const cancelHold = () => { if (hold) { clearTimeout(hold); hold = 0; } };
    hit.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();                  /* the press must NOT also turn the dial */
      const r = editRouteOf(id);
      if (!r) { openPop(id, e.clientX, e.clientY); return; }
      try { hit.setPointerCapture(e.pointerId); } catch (_) {}
      drag = { r, y0: e.clientY, x0: e.clientX, d0: r.max - r.min, touch: e.pointerType === 'touch' };
      moved = false;
      rec.dial.parentElement.classList.add('ring-drag');
      hold = setTimeout(() => { hold = 0; if (drag && !moved) { const p = [drag.x0, drag.y0]; endDrag(); openPop(id, p[0], p[1]); } }, 450);
      showReach(id);
    });
    hit.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!moved && Math.abs(e.clientY - drag.y0) < 4 && Math.abs(e.clientX - drag.x0) < 4) return;
      if (!moved) { moved = true; cancelHold(); }
      let d = drag.d0 + (drag.y0 - e.clientY) / TRAVEL(e, drag.touch);
      d = d < -1 ? -1 : d > 1 ? 1 : d;
      M.setRouteRange(drag.r.id, { min: Math.max(0, -d), max: Math.max(0, d) });
      apply(); paintRings();
      const t = showReach(id);
      showGhost(t.lo + ' … ' + t.hi, e.clientX, e.clientY, drag.touch);
    });
    const endDrag = () => {
      if (!drag) return;
      cancelHold();
      const wasMoved = moved;
      drag = null; moved = false;
      rec.dial.parentElement.classList.remove('ring-drag');
      hideGhost(); restoreVal(id);
      if (wasMoved) { apply(); paint(true); }
      else dtap();
    };
    hit.addEventListener('pointerup', endDrag);
    hit.addEventListener('pointercancel', () => { cancelHold(); if (drag) { drag = null; moved = false;
      rec.dial.parentElement.classList.remove('ring-drag'); hideGhost(); restoreVal(id); } });
    hit.addEventListener('dblclick', (e) => { e.preventDefault(); e.stopPropagation(); removeEditRoute(id); });
    hit.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); openPop(id, e.clientX, e.clientY); });
  }

  /** DRAGGING THE DEPTH TO ZERO IS NOT REMOVAL AND MUST NEVER BE. */
  function removeEditRoute(id) {
    const r = editRouteOf(id);
    if (!r) { const n = M.routeCountOfTarget(id); status(n ? 'that macro does not reach this control' : '', n ? 'warn' : ''); return false; }
    M.removeRoute(r.id);
    if (registry.has(id)) registry.restoreBase(id);
    clock.recomputeRunning(); apply(); rebuild();
    const d = descOf(id);
    status('route removed — ' + (d ? d.label : id) + ' is the hand\'s again', '');
    return true;
  }


  let popEl = null;
  function closePop() { if (popEl) { popEl.remove(); popEl = null; } }
  function openPop(id, x, y) {
    closePop();
    const d = descOf(id), rs = M.routesOfTarget(id);
    const er = editRouteOf(id);
    popEl = el('div', 'mod-pop');
    const head = el('div', 'mod-poph', popEl);
    el('b', '', head, d ? d.label : id);
    el('span', '', head, er ? (M.macroOf(er.macroId) || { name: er.macroId }).name : (rs.length ? 'no route from the selected macro' : 'no route'));
    if (er) {
      const sg = seg({ label: 'RANGE', value: rangeMode(er), options: [
      { id: 'centre', label: 'CENTRE', title: 'Use the knob position as the centre of a bipolar range' },
      { id: 'up', label: 'UP', title: 'Use the knob position as the minimum' },
      { id: 'down', label: 'DOWN', title: 'Use the knob position as the maximum' }],
        onChange: (v) => { M.setRouteRange(er.id, rangeFor(id, v)); apply(); paintRings(); paint(true); } });
      popEl.appendChild(sg.root);
    }
    const rw = el('div', 'row tight', popEl);
    if (er) rw.appendChild(trig({ label: 'REMOVE', title: 'Remove this route',
      onFire: () => { closePop(); removeEditRoute(id); } }).root);
    if (rs.length) rw.appendChild(trig({ label: 'REMOVE ALL', title: 'remove every route into this control',
      onFire: () => { closePop(); M.removeRoutesOfTarget(id); if (registry.has(id)) registry.restoreBase(id);
        clock.recomputeRunning(); apply(); rebuild(); status('every route into ' + (d ? d.label : id) + ' removed', ''); } }).root);
    if (d && d.def !== null && d.def !== undefined) rw.appendChild(trig({ label: 'RESET', title: 'Reset the base value and keep its routes',
      onFire: () => { closePop(); registry.setBase(id, d.def); apply(); paintRings(); } }).root);
    if (rs.length > 1) {
      const l = el('div', 'mod-poprts', popEl);
      el('div', 'grp-lbl', l, 'THIS CONTROL IS HELD BY ' + rs.length + ' MACROS  ·  which one the outer arc edits');
      for (const r of rs) {
        const m = M.macroOf(r.macroId);
        const b = el('button', 'mod-mchip' + (er && r.id === er.id ? ' on' : ''), l, m ? m.name : r.macroId);
        b.type = 'button';
        b.addEventListener('click', () => { closePop(); selectMacro(r.macroId); openPop(id, x, y); });
      }
    }
    document.body.appendChild(popEl);
    const b = popEl.getBoundingClientRect();
    popEl.style.left = Math.round(Math.max(6, Math.min(innerWidth - b.width - 6, x - b.width / 2))) + 'px';
    popEl.style.top = Math.round(Math.max(6, Math.min(innerHeight - b.height - 6, y + 14))) + 'px';
  }


  const pickAway = (e) => {
    const t = e.target;
    if (devPickOpen && !pick.root.contains(t) && !rackEl.devadd.contains(t)) setDevPick(false);
    if (macroPickOpen && !mpick.root.contains(t) && !(rackEl.macadd && rackEl.macadd.contains(t))) {
      macroPickOpen = false; mpick.root.hidden = true; rackEl.macadd.setAttribute('aria-expanded', 'false');
    }
  };
  document.addEventListener('pointerdown', pickAway, true);
  const popAway = (e) => { if (popEl && !popEl.contains(e.target)) closePop(); };
  const popKey = (e) => { if (popEl && e.key === 'Escape') { e.stopPropagation(); closePop(); } };
  document.addEventListener('pointerdown', popAway, true);
  window.addEventListener('keydown', popKey, true);

  /* ═══════════════════════════════════════════════════════════════════════════════════════
   *  THE MACRO RAIL — the artifact's slots, wired
   * ═══════════════════════════════════════════════════════════════════════════════════════ */
  const macRows = new Map();
  let macroPickOpen = false;
  rackEl.macadd.title = 'Add a macro';
  rackEl.macadd.setAttribute('aria-expanded', 'false');
  rackEl.macadd.addEventListener('click', () => {
    if (M.macroList().length >= M.MACRO_MAX) { status('eight macros is the model\'s ceiling', 'warn'); return; }
    macroPickOpen = !macroPickOpen; mpick.root.hidden = !macroPickOpen;
    rackEl.macadd.setAttribute('aria-expanded', String(macroPickOpen));
  });
  for (const kind of ['knob', 'trigger']) {
    if (!mpick.btns[kind]) continue;
    mpick.btns[kind].addEventListener('click', () => {
      mpick.root.hidden = true; macroPickOpen = false;
      rackEl.macadd.setAttribute('aria-expanded', 'false');
      M.addMacro(null, { kind });
      rebuild();
    });
  }

  /* Reordering has a dedicated grip. The value face is therefore only a value
     control, and compact mode can hide that face without losing rearranging. */
  function wireMacroReorder(rec, macroId, rename) {
    let d = null;
    const renameTap = tapWatcher(rename);
    const detach = () => {
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', cancel, true);
    };
    const move = (e) => {
      if (!d || e.pointerId !== d.pointerId) return;
      if (!d.moved && Math.abs(e.clientY - d.y) < 6) return;
      d.moved = true;
      e.preventDefault(); e.stopPropagation();
      rec.root.classList.add('m2reorder');
      const rows = [...rackEl.slots.querySelectorAll(':scope > .m2slot')].filter((r) => r !== rec.root);
      const before = rows.find((r) => e.clientY < r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2);
      if (before) rackEl.slots.insertBefore(rec.root, before); else rackEl.slots.appendChild(rec.root);
    };
    const stop = (e, cancel) => {
      if (!d || e.pointerId !== d.pointerId) return;
      const moved = d.moved; d = null;
      detach();
      rec.root.classList.remove('m2reorder');
      if (!moved) { if (!cancel) renameTap(); return; }
      e.preventDefault(); e.stopPropagation();
      if (!cancel) {
        const to = [...rackEl.slots.querySelectorAll(':scope > .m2slot')].indexOf(rec.root);
        M.moveMacro(macroId, to); apply();
      }
      rebuild();
    };
    const up = (e) => stop(e, false);
    const cancel = (e) => stop(e, true);
    rec.reorder.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      e.preventDefault(); e.stopPropagation();
      try { rec.reorder.setPointerCapture(e.pointerId); } catch (_) {}
      d = { y: e.clientY, pointerId: e.pointerId, moved: false };
      document.addEventListener('pointermove', move, true);
      document.addEventListener('pointerup', up, true);
      document.addEventListener('pointercancel', cancel, true);
    });
    rec.reorder.addEventListener('keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'NumpadEnter'].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Enter' || e.key === 'NumpadEnter') { rename(); return; }
      const list = M.macroList(), at = list.findIndex((m) => m.id === macroId);
      const to = e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1
        : at + (e.key === 'ArrowUp' ? -1 : 1);
      M.moveMacro(macroId, to); apply(); rebuild();
    });
  }

  function rebuildMacros() {
    rackEl.slots.innerHTML = ''; macRows.clear();
    let n = 0;
    for (const m of M.macroList()) {
      n++;
      const rec = mw.addMacro(m, n);
      rec.root.addEventListener('pointerdown', () => { if (m.kind !== 'trigger') selectMacro(m.id); });
      const rename = () => {
        rec.erow.hidden = false;
        rec.name.value = M.macroOf(m.id).name;
        rec.name.focus(); rec.name.select();
      };
      rec.grip.title = 'Drag to route; tap to arm; double-tap to reset';
      rec.grip.setAttribute('aria-label', 'route ' + m.name + ' — drag onto a control, or tap to arm');
      wireGrip(rec.grip, m.id);
      rec.reorder.title = 'Drag to reorder; double-tap to rename';
      rec.reorder.setAttribute('aria-label', 'reorder or rename ' + m.name);
      rec.reorder.replaceChildren(gripDots());                  // Josh: the dot grip for reorder; the cross stays the routing grip
      wireMacroReorder(rec, m.id, rename);
      rec.del.title = 'delete ' + m.name + ' and its routes';
      rec.del.setAttribute('aria-label', rec.del.title);
      rec.del.addEventListener('click', (e) => {
        e.stopPropagation();
        M.removeMacro(m.id); clock.recomputeRunning(); apply(); rebuild();
      });

      /* THE NUMBERED SEAT is the MASTER DEPTH: one unipolar gain over everything this macro
         sends, on the artifact's own 34-px ring.  A double-tap puts it back to 100 %, which is
         what the window's own hint line promises. */
      const numberInput = {
        get: () => M.macroOf(m.id).masterDepth,
        set: (v) => { M.setMacro(m.id, { masterDepth: clamp01(v) }); apply(); paint(true); },
        reset: () => { M.setMacro(m.id, { masterDepth: 1 }); apply(); paint(true); },
        axis: 'y',
        editable: () => true
      };
      wireSlider(rec.numSeat, numberInput);
      bindSliderKeys(rec.numSeat, numberInput);
      rec.numSeat.title = 'Master depth for this macro. Double-tap for 100%.';
      /* THE ARIA IS THE HOST'S, AND THE ARTIFACT SAYS SO.  `buildMacroSlot` sets role="slider"
         "because that is what it is; the host's registry writes the aria range and value" — so it
         is written here, on all three of the plugin's slider kinds, and B122's document-wide sweep
         reads them back beside the house's own. */
      aria(rec.numSeat, 'MACRO ' + n + ' DEPTH', 0, 100, 100 * M.macroOf(m.id).masterDepth, '100%');

      if (rec.kind === 'trigger') {
        rec.pad.addEventListener('pointerdown', (e) => { e.preventDefault(); M.fireMacro(m.id); apply(); paint(true); });
        rec.pad.addEventListener('pointerup', () => { M.releaseMacro(m.id); apply(); paint(true); });
        rec.pad.addEventListener('pointercancel', () => { M.releaseMacro(m.id); apply(); });
        rec.pad.title = 'Fire this trigger';
      } else {
        /* A HAND MACRO IS A BAR YOU DRAG SIDEWAYS.  A SOURCE-DRIVEN one is a LOCKED meter: you
           cannot turn a knob a source owns, because there is no knob there to turn. */
        const valueInput = {
          get: () => M.macroOf(m.id).value,
          set: (v) => { const mm = M.macroOf(m.id); if (mm.sourceId) return; M.setMacro(m.id, { value: clamp01(v) }); apply(); paint(true); },
          /* ⚠ WAVE 105 · NO `reset` HERE, DELIBERATELY.  `wireSlider` fires its reset from BOTH a
             tapWatcher double-tap AND a `dblclick`, and this element already carries a `dblclick`
             of its own that opens the rename row.  One double-click therefore ran three handlers
             and did two contradictory things: it zeroed the macro AND opened rename over the top.
             The reset is not lost — it lives on the GRIP, which is where it is advertised
             ("Double-tap resets the macro", and B130 drives that gesture).  The value bar's
             double-click is rename, alone, which is what the comment below always claimed. */
          axis: 'x',
          editable: () => !M.macroOf(m.id).sourceId
        };
        wireSlider(rec.val, valueInput);
        bindSliderKeys(rec.val, valueInput);
        rec.val.title = 'Drag sideways to set; double-tap the row grip to rename';
        aria(rec.val, m.name + ' value', 0, 100, 100 * M.macroOf(m.id).value, '0%');
        /* a DOUBLE-click opens the rename row, which is a sibling already in the DOM: opening it
           only clears `hidden` — nothing is ever reparented. */
        rec.val.addEventListener('dblclick', rename);
      }
      rec.name.addEventListener('blur', () => { M.setMacro(m.id, { name: rec.name.value }); rec.erow.hidden = true; paint(true); });
      rec.name.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); rec.erow.hidden = true; }
        if (e.key === 'Enter') { e.preventDefault(); rec.name.blur(); }
      });
      rec.clr.title = 'Disconnect the source from this macro';
      rec.clr.addEventListener('click', () => { M.setMacro(m.id, { sourceId: null }); rec.erow.hidden = true; clock.recomputeRunning(); apply(); rebuild(); });
      macRows.set(m.id, rec);
    }
    const sel = selectedMacro();
    for (const [mid, rec] of macRows) rec.root.classList.toggle('sel', mid === sel);
  }

  /* Live modulation ticks can call this dozens of times per second. Avoid notifying
     the accessibility tree when a value is already current. */
  function attr(elm, name, value) {
    const next = String(value);
    if (elm.getAttribute(name) !== next) elm.setAttribute(name, next);
  }
  /** the four attributes a `role="slider"` owes a reader, in one place */
  function aria(elm, label, lo, hi, now, text) {
    attr(elm, 'aria-label', label);
    attr(elm, 'aria-valuemin', lo);
    attr(elm, 'aria-valuemax', hi);
    attr(elm, 'aria-valuenow', Math.round(now));
    if (text !== undefined) attr(elm, 'aria-valuetext', text);
  }

  /** ONE POINTER CONTRACT for every plain drag surface in this window — the artifact's numbered
   *  seats, its macro bars and its dials all take it, on kit.js's ladder, so the ported controls
   *  feel like the lab's without one of them being replaced by a house widget. */
  function wireSlider(elm, o) {
    let d = null;
    const dtap = tapWatcher(() => { if (o.reset) o.reset(); });
    elm.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      e.preventDefault(); e.stopPropagation();
      try { elm.setPointerCapture(e.pointerId); } catch (_) {}
      d = { x: e.clientX, y: e.clientY, v: o.get(), moved: false, touch: e.pointerType === 'touch' };
      elm.classList.add('drag');
    });
    elm.addEventListener('pointermove', (e) => {
      if (!d) return;
      if (!d.moved && Math.abs(e.clientX - d.x) < 3 && Math.abs(e.clientY - d.y) < 3) return;
      d.moved = true;
      const dp = o.axis === 'x' ? (e.clientX - d.x) / TRAVEL(e, d.touch)
        : o.axis === 'y' ? (d.y - e.clientY) / TRAVEL(e, d.touch)
        : ((d.y - e.clientY) + (e.clientX - d.x)) / TRAVEL(e, d.touch);
      o.set(d.v + dp);
    });
    const stop = () => { if (!d) return; const moved = d.moved; d = null; elm.classList.remove('drag'); if (!moved) dtap(); };
    elm.addEventListener('pointerup', stop);
    elm.addEventListener('pointercancel', () => { d = null; elm.classList.remove('drag'); });
    elm.addEventListener('dblclick', (e) => { e.preventDefault(); if (o.reset) o.reset(); });
  }

  /* ═══════════════════════════════════════════════════════════════════════════════════════
   *  THE DEVICE RACK
   * ═══════════════════════════════════════════════════════════════════════════════════════ */
  const devRows = new Map();
  /* WAVE 105 · per-SOURCE audio state that must outlive a card rebuild — the 96-frame level ring, the
     onset count the lamp compares against, and when it last flashed. */
  const audRings = new Map();
  let devPickOpen = false;
  rackEl.devadd.title = 'Add an LFO, envelope, or audio follower';
  rackEl.devadd.setAttribute('aria-expanded', 'false');
  /* The picker opens beside the explicit ADD DEVICE button and flips to its
     other side when the viewport has no room. */
  function placeDevicePicker() {
    const r = rackEl.devadd.getBoundingClientRect();
    pick.root.classList.add('m2pick-at-chip');
    /* ⚠ `position: fixed` HERE IS NOT THE VIEWPORT'S, AND THAT IS THE ARTIFACT'S OWN DOING:
       `#modwin.mir-modwindow.modwin` declares `contain: layout` (modwindow.css:499), and a layout
       containment box is a containing block for FIXED descendants — so the window itself is the
       origin.  Measured, not reasoned: the first cut of this wrote a correct viewport left of 207 px
       and the sheet painted at 417, off by the window's own x.  Rather than special-case that one
       cause, the ORIGIN IS MEASURED — park the sheet at (0,0), read where that lands, and offset by
       the difference.  It is then right whatever creates the containing block, today or later (a
       transform on an ancestor, a filter, FROST's backdrop-filter, another `contain`). */
    pick.root.style.left = '0px'; pick.root.style.top = '0px';
    const o = pick.root.getBoundingClientRect();
    const w = o.width || 200, h = o.height || 120;
    let x = r.right + 8;
    if (x + w > window.innerWidth - 8) x = Math.max(8, r.left - 8 - w);   // no room to the right: the chip's other side
    let y = r.top;
    if (y + h > window.innerHeight - 8) y = Math.max(8, window.innerHeight - 8 - h);
    pick.root.style.left = Math.round(x - o.left) + 'px';
    pick.root.style.top = Math.round(y - o.top) + 'px';
  }
  function setDevPick(on) {
    devPickOpen = !!on;
    pick.root.hidden = !devPickOpen;
    rackEl.devadd.setAttribute('aria-expanded', String(devPickOpen));
    rackEl.devadd.classList.toggle('on', devPickOpen);
    if (devPickOpen) placeDevicePicker();
    else { pick.root.classList.remove('m2pick-at-chip'); pick.root.style.left = ''; pick.root.style.top = ''; }
  }
  rackEl.devadd.addEventListener('click', () => setDevPick(!devPickOpen));


  const rackMode = () => (chips.compact && chips.compact.classList.contains('on') ? 'C' : 'F');
  for (const kind of ['lfo', 'env', 'audio']) {
    if (!pick.btns[kind]) continue;
    pick.btns[kind].addEventListener('click', () => {
      setDevPick(false);
      const src = M.addSource(kind);
      const id = src && (src.id !== undefined ? src.id : src);
      const mode = rackMode();
      if (id !== undefined && id !== null && mode !== 'F') P.modes[String(id)] = mode;
      rebuild();
    });
  }

  /** F / C / M is the window's own PRESENTATION state and it rides in the settings key, exactly as
   *  host-contract.md §6 says.  But the MODEL has one boolean of its own — `minimized` — and it
   *  travels in a project file, so FOLDED is written there as well: a card folded when the project
   *  was saved comes back folded, which is a promise wave 60 made and this port keeps. */
  function setMode(id, mode) {
    P.modes[id] = mode;
    const rec = devRows.get(id);
    if (rec) setDeviceMode(rec.dev, mode);
    const s = M.sourceOf(id);
    if (s && !!s.minimized !== (mode === 'M')) M.setSource(id, { minimized: mode === 'M' });
  }

  /** the knob table: one row per dial the artifact draws, in the artifact's own key order.
   *  `get` and `set` speak NORMALISED position; `text` is what the dial prints. */
  function knobSpec(s, key) {
    const L = M.STEPS_LADDER;
    const SQ = (v) => Math.sqrt(Math.max(0, v) / M.ENV_MAX_S);
    const nMult = M.LFO_MULTS.length;
    if(s.kind==='audio' && (key==='attack'||key==='release'||key==='peakHold')) {
      const field=key==='peakHold'?'holdMs':key+'Ms',band=()=>audBands.get(s.id)||'level',value=()=>s.audio.outs[band()][field];
      return {get:()=>Math.log1p(value())/Math.log1p(M.AUDIO_TIME_MAX),
        set:u=>M.setSource(s.id,{audio:{outs:{[band()]:{[field]:Math.round(Math.expm1(clamp01(u)*Math.log1p(M.AUDIO_TIME_MAX)))}}}}),
        text:()=>value()>=1000?(value()/1000).toFixed(value()%1000?2:0)+' s':value().toFixed(0)+' ms',
        hint:'Selected audio band '+(key==='peakHold'?'peak hold':key+' time constant')+'; choose LEVEL, LOW, MID or HIGH on its meter'};
    }
    switch (key) {
      case 'rate': return {
        get: () => (s.sync ? s.mult / (nMult - 1) : s.ratePos),
        set: (u) => { if (s.sync) M.setSource(s.id, { mult: Math.round(clamp01(u) * (nMult - 1)) }); else M.setSource(s.id, { ratePos: clamp01(u) }); },
        text: () => (s.sync ? M.LFO_MULT_LABEL[s.mult] + ' · ' + M.lfoHz(s).toFixed(2) : M.lfoHz(s).toFixed(3) + ' Hz'),
        hint: 'Set free rate or a loop-clock division' };
      case 'phase': return { get: () => s.phaseOff, set: (u) => M.setSource(s.id, { phaseOff: clamp01(u) }),
        text: () => (s.phaseOff * 360).toFixed(0) + '°', hint: 'the phase offset' };
      case 'smooth': return { get: () => s.smooth, set: (u) => M.setSource(s.id, { smooth: clamp01(u) }),
        text: () => (s.smooth > 0 ? (M.smoothTau(s.smooth) * 1000).toFixed(s.smooth < 0.2 ? 1 : 0) + ' ms' : 'OFF'),
        hint: 'Smooth the LFO output' };
      case 'steps': return { get: () => M.stepsRungIndex(s.steps) / (L.length - 1),
        set: (u) => M.setSource(s.id, { steps: L[Math.round(clamp01(u) * (L.length - 1))] }),
        text: () => (s.steps >= M.STEPS_MIN ? String(s.steps) : 'OFF'),
        hint: 'Quantise output to discrete levels' };
      case 'hold':
      case 'a': case 'd': case 'r': return {
        get: () => SQ(s[key]), set: (u) => M.setSource(s.id, { [key]: clamp01(u) * clamp01(u) * M.ENV_MAX_S }),
        text: () => fmtSec(s[key]),
        hint: 'Set the envelope stage time' };
      case 's': return { get: () => s.s, set: (u) => M.setSource(s.id, { s: clamp01(u) }),
        text: () => (100 * s.s).toFixed(0) + '%', hint: 'the sustain LEVEL — the one ADSR control that is not a time' };
      /* ⚠ WAVE 100 · THESE READ DEFENSIVELY, AND THAT IS NOT TIDINESS.  `M.addSource('audio')` does
         not initialise `gainDb` or `gateDb` — the capture half that would own them was never ported —
         so both of these called `.toFixed` on `undefined` and threw INSIDE `buildCard`, which is the
         throw that used to empty the whole rack (see rebuildDevices).  A face may not depend on a
         model field existing; it may only report what is there. */
      /* ⚠ WAVE 105 · THE FIELD PATH WAS WRONG IN BOTH DIRECTIONS, AND WAVE 100's COMMENT BLAMED THE
         MODEL FOR IT.  These live at `s.audio.{gainDb, thresholdDb, holdMs}` and `setSource` applies
         them ONLY from a nested `patch.audio` (mod.js:1224-1242) — there is no top-level branch for
         any of the three, so every write was silently dropped and every read found `undefined`.
         `gateDb` does not exist in the model under any name; it is `thresholdDb`.
           So SENS read +0.0 for ever, THRESH read −60 dB for ever, HOLD read 0 ms, and turning any of
         them did nothing — while the meter two inches away drew the REAL threshold from the readout,
         so the card contradicted itself.  Wave 100's defensive `Number.isFinite` reads did not paper
         over a model gap (the model initialises all three, one level down); they hid a path error. */
      case 'sens': {
        const db = () => ((s.audio && Number.isFinite(s.audio.gainDb)) ? s.audio.gainDb : 0);
        return { get: () => (db() + M.AUDIO_GAIN_MAX) / (2 * M.AUDIO_GAIN_MAX),
          set: (u) => M.setSource(s.id, { audio: { gainDb: (clamp01(u) * 2 - 1) * M.AUDIO_GAIN_MAX } }),
          text: () => (db() >= 0 ? '+' : '') + db().toFixed(1) + ' dB', hint: 'input gain, ±24 dB before the band response ranges' }; }
      case 'thresh': {
        const db = () => ((s.audio && Number.isFinite(s.audio.thresholdDb)) ? s.audio.thresholdDb : M.AUDIO_DB_FLOOR);
        return { get: () => clamp01((db() - M.AUDIO_DB_FLOOR) / M.AUDIO_DB_SPAN),
          set: (u) => M.setSource(s.id, { audio: { thresholdDb: M.AUDIO_DB_FLOOR + clamp01(u) * M.AUDIO_DB_SPAN } }),
          text: () => db().toFixed(0) + ' dB', hint: 'the gate opens here and stays open until hysteresis below it' }; }
      default: return { get: () => 0, set: () => {}, text: () => '--', hint: '' };
    }
  }


  function dressGlass() {
    for (const n of root.querySelectorAll('.m2rail, .m2pre, .m2dev')) n.classList.add('glass');
  }

  /* WAVE 84 · THE CURVE'S NAME IS RE-PARENTED, BECAUSE CSS CANNOT MOVE A NODE.  Wave 82 tried to put
     it on the plot with `position: absolute` and wave 84's first cut tried again against `.m2edit` —
     both failed for the same reason, and it took reading the markup to see it: `.m2lfowave` is built
     inside `.m2headc`, so `.m2edit` is not an ANCESTOR of it and no selector of that shape can ever
     match.  Absolute positioning re-parents nothing; it only chooses which ancestor to measure from.
     So the node itself moves, once per build, into the box it names.  The artifact still BUILDS it
     where it always did — this is the host re-seating it, which is the host's own half of the port. */


  function seatRailHead() {
    const head = root.querySelector('.m2railhead');
    if (!head || head.dataset.folder === '1') return;
    head.dataset.folder = '1';
    head.setAttribute('role', 'button');
    head.tabIndex = 0;
    head.setAttribute('aria-expanded', 'true');
  head.title = 'Collapse or expand the macro rail';
    const chev = document.createElement('i');
    chev.className = 'm2chev';
    head.insertBefore(chev, head.firstChild);
    const toggle = () => {
      const rail = head.closest('.m2rail');
      const on = rail.classList.toggle('m2railmin'); P.macroMin = on;
      head.setAttribute('aria-expanded', String(!on));
      paint(true);place(); persist();
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); toggle(); }
    });
  }

  function setMacroSide(side) {
    P.macroSide = side;
    const macro = root.querySelector('.m2rail');
    if (macro) macro.style.order = side === 'right' ? '2' : '0';
  }
  const macroHead = root.querySelector('.m2railhead');
  const sideGrip = el('button', 'm2-side-grip', macroHead, '⠿');
  sideGrip.hidden=true;sideGrip.disabled=true;sideGrip.type = 'button'; sideGrip.title = 'Move macros to either side';
  sideGrip.setAttribute('aria-label', 'Move macros to left or right end');
  let sideDrag = null;
  sideGrip.addEventListener('click', (e) => e.stopPropagation());
  sideGrip.addEventListener('pointerdown', (e) => { e.stopPropagation(); sideDrag = e.clientX; sideGrip.setPointerCapture(e.pointerId); });
  sideGrip.addEventListener('pointerup', (e) => { if (sideDrag === null) return; if (Math.abs(e.clientX - sideDrag) > 8) { setMacroSide(e.clientX > root.getBoundingClientRect().left + root.offsetWidth / 2 ? 'right' : 'left'); place(); persist(); } sideDrag = null; });
  sideGrip.addEventListener('pointercancel', () => { sideDrag = null; });
  sideGrip.addEventListener('dblclick', (e) => { e.stopPropagation(); setMacroSide(P.macroSide === 'right' ? 'left' : 'right'); place(); persist(); });
  sideGrip.addEventListener('keydown', (e) => { e.stopPropagation(); if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return; e.preventDefault(); setMacroSide(e.key === 'ArrowLeft' ? 'left' : 'right'); place(); persist(); });

  // The matrix and the ring gestures edit the same route objects.
  const matrix = el('dialog', 'mod-matrix', root);
  const matrixHead = el('div', 'mod-matrix-head', matrix);
  el('b', '', matrixHead, 'MODULATION MATRIX');
  const matrixClose = el('button', '', matrixHead, 'CLOSE'); matrixClose.type = 'button';
  const matrixBars = el('div', 'mod-matrix-bars m2foot', matrix);
  const matrixBody = el('div', 'mod-matrix-body', matrix);
  const matrixButton = el('button', 'm2-matrix-open', macroHead, '▦'); matrixButton.hidden=true;matrixButton.disabled=true;matrixButton.type = 'button';
  matrixButton.title = 'Open modulation matrix'; matrixButton.setAttribute('aria-label', 'Open modulation matrix');
  let barHomes = [];
  const closeMatrix = () => {
    for (const [node, parent, next] of barHomes) parent.insertBefore(node, next && next.parentNode === parent ? next : null);
    barHomes = []; matrix.close(); place(); matrixButton.focus();
  };
  matrixClose.addEventListener('click', closeMatrix);
  matrix.addEventListener('cancel', (e) => { e.preventDefault(); closeMatrix(); });
  function renderMatrix() {
    matrixBody.replaceChildren();
    const table = el('table', '', matrixBody), head = el('tr', '', el('thead', '', table));
    for (const name of ['ON', 'SOURCE', 'DESTINATION', 'AMOUNT', 'POLARITY', 'CURVE', '']) el('th', '', head, name);
    const body = el('tbody', '', table);
    const select = (cell, values, value, label, change) => {
      const input = el('select', '', cell); input.setAttribute('aria-label', label);
      for (const [id, name] of values) { const option = el('option', '', input, name); option.value = id; }
      input.value = value; input.addEventListener('change', () => change(input.value)); return input;
    };
    const macros = M.macroList().filter(m => m.kind !== 'trigger').map(m => [m.id, m.name]);
    const targets = registry.describe().map(d => [d.id, d.label]);
    const update = (r, patch) => { M.setRouteRange(r.id, patch); clock.recomputeRunning(); apply(); paintRings(); };
    for (const r of M.routeList()) {
      const row = el('tr', '', body), cell = () => el('td', '', row);
      const on = el('input', '', cell()); on.type = 'checkbox'; on.checked = r.enabled !== false; on.setAttribute('aria-label', 'Enable route');
      on.addEventListener('change', () => update(r, { enabled: on.checked }));
      select(cell(), macros, r.macroId, 'Route source', value => { const dup = M.routesOfTarget(r.targetId).some(q => q.id !== r.id && q.macroId === value); if (!dup) update(r, { macroId: value }); renderMatrix(); });
      select(cell(), targets.some(d=>d[0]===r.targetId) ? targets : [...targets,[r.targetId,r.targetId+' (unavailable)']], r.targetId, 'Route destination', value => {
        if (value===r.targetId || M.routesOfTarget(value).some(q=>q.macroId===r.macroId)) { renderMatrix(); return; }
        const next=M.addRoute(r.macroId,value,r.min,r.max);
        if(next && !next.already) { M.setRouteRange(next.route.id,{bi:r.bi,enabled:r.enabled,curve:r.curve}); M.removeRoute(r.id); clock.recomputeRunning(); apply(); rebuild(); }
        renderMatrix();
      });
      const amount = el('input', '', cell()); amount.type = 'number'; amount.min = -100; amount.max = 100; amount.step = 1; amount.value = ((r.max - r.min) * 100).toFixed(1); amount.setAttribute('aria-label', 'Signed route amount percent');
      amount.addEventListener('change', () => { if (!Number.isFinite(amount.valueAsNumber)) return; const d = Math.max(-1, Math.min(1, amount.valueAsNumber / 100)); update(r, {min:Math.max(0,-d),max:Math.max(0,d)}); amount.value = (d*100).toFixed(1); });
      select(cell(), [['uni','UNIPOLAR'],['bi','BIPOLAR']], r.bi ? 'bi' : 'uni', 'Route polarity', v => update(r, {bi:v === 'bi'}));
      const curve = el('input', '', cell()); curve.type = 'range'; curve.min = -1; curve.max = 1; curve.step = .01; curve.value = r.curve || 0; curve.setAttribute('aria-label', 'Response curve, zero is linear'); curve.addEventListener('input', () => update(r, {curve:curve.valueAsNumber}));
      const remove = el('button', '', cell(), 'REMOVE'); remove.type = 'button'; remove.addEventListener('click', () => { M.removeRoute(r.id); clock.recomputeRunning(); apply(); rebuild(); renderMatrix(); });
    }
    const add = el('div', 'mod-matrix-add', matrixBody);
    const source = select(add, macros, selectedMacro(), 'New route source', () => {});
    const target = select(add, targets, targets[0] && targets[0][0], 'New route destination', () => {});
    const button = el('button', '', add, 'ADD ROUTE'); button.type = 'button'; button.disabled = !macros.length || !targets.length;
    button.addEventListener('click', () => { dropOn(source.value, target.value); renderMatrix(); });
    if (!macros.length) el('p', '', matrixBody, 'Add a macro in the modulation window to begin routing.');
  }
  matrixButton.addEventListener('click', (e) => {
    e.stopPropagation(); renderMatrix();
    barHomes = [foot.prebar, transport.xport.parentNode].filter(Boolean).map(node => [node, node.parentNode, node.nextSibling]);
    for (const [node] of barHomes) matrixBars.appendChild(node);
    matrix.showModal();
  });


  function seatCurveName() {
    for (const card of root.querySelectorAll('.m2dev.lfo')) {
      const name = card.querySelector('.m2lfowave'), grid = card.querySelector('.m2presets');
      if (name && grid && name.parentNode !== grid) grid.appendChild(name);
    }
  }


  function seatMinTrace(rec) {
    if (rec.kind === 'audio') return;
    const bay = rec.dev.minBay;
    if (!bay || bay.querySelector('.m2mintrace')) return;
    const box = document.createElement('div');
    box.className = 'm2mintrace';
    box.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'm2mintsvg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    box.appendChild(svg);
    const rest = svgEl('line', 'm2mintrest', svg);
    rest.setAttribute('x1', '50'); rest.setAttribute('x2', '50');
    rest.setAttribute('y1', '0');  rest.setAttribute('y2', '100');
    const fill = svgEl('path', 'm2mintfill', svg);
    const path = svgEl('path', 'm2mintpath', svg);
    const dot = document.createElement('i');
    dot.className = 'm2mintdot';
    box.appendChild(dot);
    bay.appendChild(box);
    rec.minTrace = { box, svg, rest, fill, path, dot, sig: '' };
  }

  /** THE STRIP'S PAINT.  X is the VALUE (6 … 94, so the dot never rides half off its own box) and Y is
   *  TIME, which is the transpose named above.  It is signature-guarded exactly as `render()` is, so a
   *  settled strip costs two custom-property writes a frame and nothing else. */
  function paintMinTrace(rec, s, force) {
    const t = rec.minTrace; if (!t) return;
    /* BOTH AXES ARE INSET, and the Y one is not cosmetic: the dot is a real element riding this
       geometry, so a trace that ran the full 0 … 100 would hang half a dot outside the bay at t = 0
       and t = 1 — over the fold button above it and the power switch below.  6 … 94 across and
       3 … 97 down keeps every mark inside the box that owns it. */
    const X = (v) => (6 + clamp01(v) * 88).toFixed(2);
    const Y = (u) => (3 + clamp01(u) * 94).toFixed(2);
    if (s.kind === 'audio') {
      /* no time base: the follower IS a level, so the level is the trace and the dot sits on it */
      const x = X(s.out);
      t.path.setAttribute('d', 'M' + x + ' ' + Y(0) + 'L' + x + ' ' + Y(1));
      t.fill.setAttribute('d', 'M50 ' + Y(0) + 'L' + x + ' ' + Y(0) + 'L' + x + ' ' + Y(1) + 'L50 ' + Y(1) + 'Z');
      t.sig = 'audio';
      t.dot.style.setProperty('--tx', x);
      t.dot.style.setProperty('--ty', Y(0.5));
      return;
    }
    if (force || !t.sig) {
      t.sig = sigOf(s, 26, 200);
      const sm = sampleShape(s, 96);
      let d = '';
      for (let i = 0; i < sm.length; i++) d += (i ? 'L' : 'M') + X(sm[i][1]) + ' ' + Y(sm[i][0]);
      t.path.setAttribute('d', d);
      /* the body is the band between the REST line and the trace, so a shape reads as a shape and not
         as a hairline at 26 px — closed back along the rest line, never along the box's edge */
      t.fill.setAttribute('d', d ? d + 'L50 ' + Y(1) + 'L50 ' + Y(0) + 'Z' : '');
    }
    t.dot.style.setProperty('--tx', X(s.out));
    t.dot.style.setProperty('--ty', Y(headU(s)));
  }

  function rebuildDevices() {
    for (const rec of devRows.values()) rec.dev.root.remove();
    devRows.clear();
    const live = new Set(devOrder().map((s) => s.id));
    for (const k of Object.keys(P.modes)) if (!live.has(k)) delete P.modes[k];
    for (const k of Object.keys(P.audioMini)) if (!live.has(k)) delete P.audioMini[k];
    for (const s of devOrder()) {
      if (P.modes[s.id] === undefined && saved[s.id] !== undefined) { P.modes[s.id] = saved[s.id]; delete saved[s.id]; }
    }


    const broken = [];
    for (const s of devOrder()) {
      try { buildCard(s); }
      catch (e) {
        const rec = devRows.get(s.id);
        if (rec && rec.dev && rec.dev.root) rec.dev.root.remove();
        devRows.delete(s.id);
        broken.push(s.kind.toUpperCase() + ' ' + s.id);
        try { console.error('[modwindow] device ' + s.id + ' failed to build', e); } catch (_) {}
      }
    }
    for (const s of devOrder()) { const rec = devRows.get(s.id); if (rec) setDeviceMode(rec.dev, modeOf(s.id)); }
    if (broken.length) status(broken.join(', ') + ' could not be built and ' +
      (broken.length === 1 ? 'is' : 'are') + ' not on the rack — the rest of the rack is unaffected', 'warn');
  }

  function buildCard(s) {
    const dev = mw.addDevice({ id: s.id, kind: s.kind === 'env' ? 'env' : s.kind === 'audio' ? 'audio' : 'lfo' });
    const rec = { dev, s, id: s.id, kind: dev.kind, g: null, say: '', sig: '' };
    devRows.set(s.id, rec);
    dev.root.addEventListener('pointerdown', () => selectSource(s.id));

    /* ── THE HEAD ── */


      dev.fold.title = 'Collapse or expand this device';
    dev.fold.addEventListener('click', () => {
      const next = modeOf(s.id) === 'M' ? 'F' : 'M';
      setMode(s.id, next);
      dev.fold.setAttribute('aria-expanded', next === 'F' ? 'true' : 'false');
      place(); paint(true); persist();
    });
      dev.pow.title = 'Bypass this device and keep its settings';
    dev.pow.addEventListener('click', () => { M.setSource(s.id, { on: !s.on }); clock.recomputeRunning(); apply(); sync(); });
      dev.x.title = 'Remove this device and release its macros';
    dev.x.addEventListener('click', () => { M.removeSource(s.id); delete P.modes[s.id]; delete P.audioMini[s.id]; clock.recomputeRunning(); apply(); rebuild(); });
      dev.bank.btn.title = 'Switch between two saved patches for this device';
    dev.bank.btn.addEventListener('click', () => { M.setSource(s.id, { bank: s.bank === 'A' ? 'B' : 'A' }); apply(); sync(); });
    dev.cpy.title = 'copy this side\'s whole patch';
    dev.cpy.addEventListener('click', () => { clip = M.copyBank(s.id); say(rec, 'patch copied — PASTE onto any ' + s.kind.toUpperCase()); });
      dev.pst.title = 'Paste a compatible device patch';
    dev.pst.addEventListener('click', () => {
      if (!clip) { say(rec, 'nothing copied yet — press COPY on a device first'); return; }
      const w = M.pasteBank(s.id, clip, s.bank);
      if (!w) { say(rec, String(clip.kind).toUpperCase() + ' and ' + s.kind.toUpperCase() + ' patches cannot be pasted across — they are different devices'); return; }
      apply(); sync();
    });
    /* THE RUN ORDER IS THE FIRE ORDER, and the ◂ ▸ buttons that say so are `display: none` in
       both modes in the source (`anim.js:2597 / 2107`).  They are wired anyway, exactly as
       BASINS wires them, because the defect is the CSS's and it travels as it is. */
    dev.mvL.addEventListener('click', () => { M.moveSource(s.id, M.sourceIndexOf(s.id) - 1); rebuild(); });
    dev.mvR.addEventListener('click', () => { M.moveSource(s.id, M.sourceIndexOf(s.id) + 1); rebuild(); });
    /* the grab handle moves the card in the run order by a real drag */
    wireGrab(rec);

    if (dev.trig) {
      dev.trig.hidden=true;dev.trig.disabled=true;
        dev.trig.title = 'Trigger this envelope. Start modulation to advance it.';
      /* WAVE 105 · A GATE MUST NOT BE STRANDABLE.  `pointerup` on the BUTTON only fires if the
         finger is still over it; sliding off mid-gate left the envelope held with no way back
         but a second press.  The pointer is captured, and a cancel releases too. */
      const trigUp = () => { if (s.gateMode === 'gate') { M.release(s.id); apply(); } };
      dev.trig.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { dev.trig.setPointerCapture(e.pointerId); } catch (_) {}
        M.trigger(s.id); apply(); paint(true);
      });
      dev.trig.addEventListener('pointerup', trigUp);
      dev.trig.addEventListener('pointercancel', trigUp);
    }

    /* ── THE LEFT COLUMN ── */
    if (dev.kind === 'lfo') {
      for (const name of SHAPES) {
        const q = dev.presets[name]; if (!q) continue;
        q.btn.title = PRESET_LABEL[name] + ' · tap to draw; tap again to mirror';
        q.btn.addEventListener('click', () => {
          M.setSource(s.id, { preset: name });
          const lp = s.lastPreset || {};
          say(rec, lp.symmetric ? PRESET_LABEL[name] + ' is its own mirror — nothing to flip'
            : lp.flipped ? PRESET_LABEL[name] + ' flipped' : PRESET_LABEL[name] + ' drawn');
          apply(); paint(true);
        });
      }
      /* THE WAY BACK TO AN ANALYTIC WAVE.  The head already PRINTS the wave's name; tapping it
         walks the model's own list.  Without a door here S&H and DRIFT would be stranded —
         no preset can draw a per-cycle stochastic wave, which is why the picture shows four
         cycles of them.  The same behaviour is on the compact bank's WAVE command. */
      const cycleWave = (dir) => {
        const i = M.WAVES.indexOf(s.wave);
        const next = M.WAVES[((i < 0 ? 0 : i) + dir + M.WAVES.length) % M.WAVES.length];
        M.setSource(s.id, { wave: next, shapeMode: 'wave' });
        say(rec, M.WAVE_LABEL[next] + ' · waveform' + (stochastic({ wave: next }) ? ', four cycles shown' : ''));
        apply(); paint(true);
      };
      dev.lfoWave.title = 'Select the LFO waveform';
      dev.lfoWave.style.cursor = 'pointer';
      dev.lfoWave.addEventListener('click', () => cycleWave(1));
      if (dev.compactLfo) {
        dev.compactLfo.shape.title = dev.lfoWave.title;
        dev.compactLfo.shape.addEventListener('click', () => cycleWave(1));
        dev.compactLfo.macro.addEventListener('click', () => cycleMacro(rec));
        dev.compactLfo.copy.addEventListener('click', () => dev.cpy.click());
        dev.compactLfo.paste.addEventListener('click', () => dev.pst.click());
        for (const [key, b] of Object.entries(dev.compactLfo.toggles)) {
          b.addEventListener('click', () => { M.setSource(s.id, { [key]: !s[key] }); apply(); sync(); });
        }
      }
      /* TRIG · FLIP · OFF — the retrigger pair and the time-reverse, the artifact's own three seats */
      dev.sw.trig.title = 'Restart phase on triggers and playback';
      dev.sw.trig.addEventListener('click', () => { M.setSource(s.id, { trig: true }); apply(); sync(); });
      dev.sw.off.title = 'Continue from the clock phase';
      dev.sw.off.addEventListener('click', () => { M.setSource(s.id, { trig: false }); apply(); sync(); });
      dev.flipBtn.title = 'Reverse the curve in time';
      dev.flipBtn.addEventListener('click', () => {
        if (s.shapeMode !== 'curve') { say(rec, 'Select a curve before reversing it'); return; }
        const h0 = curveHash(s.points);
        M.curveEdit(s.id, 'flip');
        say(rec, curveHash(s.points) === h0 ? 'this shape is its own mirror — nothing to flip' : 'flipped in time');
        apply(); paint(true);
      });
    } else if (dev.kind === 'env') {
      /* ↑ FIT ↓ — and FIT IS THE FIX FOR INHERITED DEFECT 3.  It frames what `envPoints`
         DRAWS (a + hold + d + r, always), not what `envDuration` returns (which drops `r`
         under GATE and framed 0.3565 s of a 0.910 s picture — 155 % past the right edge). */
      const [zin, zfit, zout] = dev.zoom;
      zin.title = 'Zoom into the envelope graph';
      zin.addEventListener('click', () => { M.setSource(s.id, { timeScale: s.timeScale * 0.5 }); paint(true); say(rec, 'window ' + s.timeScale.toFixed(2) + ' s'); });
      zout.title = 'Zoom out of the envelope graph';
      zout.addEventListener('click', () => { M.setSource(s.id, { timeScale: s.timeScale * 2 }); paint(true); say(rec, 'window ' + s.timeScale.toFixed(2) + ' s'); });
      zfit.title = 'Fit the full envelope in the graph';
      zfit.addEventListener('click', () => {
        M.setSource(s.id, { timeScale: Math.min(M.ENV_MAX_S, Math.max(0.25, envDrawn(s) * 1.15)) });
        paint(true); say(rec, 'fitted to ' + s.timeScale.toFixed(2) + ' s');
      });
    }

    /* ── WAVE 102 · THE AUDIO FACE ────────────────────────────────────────────────────────────
       Three controls and five sockets.  MIC asks for the microphone (and gives it back); SET opens
       the artifact's own conditioning sheet; each of the five output rows binds ONE macro to ONE
       socket.  `scalarOutputId(dev, key)` is the model's own name for that socket — `a1:low` — and
       binding is a macro whose `sourceId` IS that id, which is why this reads like `cycleMacro`
       with one substitution rather than like a second routing system. */
    if (dev.kind === 'audio' && dev.aud) {
      const A = dev.aud;
      /* ⚠ WAVE 105 · EVERY `await` BELOW IS A PLACE THE CARD CAN VANISH.  Opening a microphone is a
         permission prompt: the user can take seconds over it, and in that time a rebuild (a macro
         bound, a device added, reordered or removed) replaces every `.m2dev` root in the window.
         The handlers then wrote their sentence into a DETACHED node and repainted a card that is no
         longer in the document — silently, which is why it was never noticed.  `stillMine()` is the
         one check that makes an async handler safe here: the record this closure captured must
         still be THE record the rack holds for this source. */
      const stillMine = () => devRows.get(s.id) === rec;
      A.srcBtn.title = 'Open or close audio input. Audio is analysed locally and is not stored.';
      A.srcBtn.addEventListener('click', async () => {
        if (!port.audio) { say(rec, 'this host supplies no audio capture'); return; }
        const st = port.audio.state();
        if (st.live) { await port.audio.stop(); if (!stillMine()) return; say(rec, 'microphone closed'); }
        else {
          const sup = port.audio.support();
          if (!sup.ok) { say(rec, sup.why); paint(true); return; }
          say(rec, 'asking for the microphone…');
          await port.audio.start();
          if (!stillMine()) return;
          const now = port.audio.state();
          say(rec, now.live ? 'microphone open' : (now.reason || 'the microphone did not open'));
        }
        sync(); paint(true);
      });
      A.setBtn.title = 'Audio input, band ranges, timing, gate, and onset settings';
      A.setBtn.addEventListener('click', () => {
        /* the sheet's whole content is the CAPTURE's — a host with none has nothing to condition.
           A restored session can carry an AUDIO source onto such a host, so this is reachable. */
        if (!port.audio) { say(rec, 'this host supplies no audio capture'); return; }
        if (!rec.audSheet) rec.audSheet = buildAudioSheet(dev, mw.copy);
        const sh = rec.audSheet;
        if (!sh) { say(rec, 'the conditioning sheet is not available in this build'); return; }
        sh.root.hidden = !sh.root.hidden; if(sh.refresh)sh.refresh();
        if (!sh.wired) { sh.wired = true;
          wireAudioConditioning(rec, sh);
          sh.close.addEventListener('click', () => { sh.root.hidden = true; });
          sh.input.addEventListener('change', async () => {
            if (!port.audio) { say(rec, 'this host supplies no audio capture'); return; }
            await port.audio.start(sh.input.value || '');
            if (!stillMine()) return;
            const st2 = port.audio.state();
            say(rec, st2.live ? 'input changed' : (st2.reason || 'that input did not open')); paint(true);
          });
          port.audio.devices().then((list) => {
            if (!sh.input.isConnected) return;      // the sheet was closed and dropped while we asked
            sh.input.innerHTML = '';
            const d0 = document.createElement('option'); d0.value = ''; d0.textContent = 'SYSTEM DEFAULT';
            sh.input.appendChild(d0);
            for (const d of list) { const op = document.createElement('option');
              op.value = d.id; op.textContent = d.label; sh.input.appendChild(op); }
            sh.input.value = port.audio.state().deviceId || '';
          });
        }
      });
      for (const key of Object.keys(A.outs)) {
        const row = A.outs[key];
        row.box.title = key === 'hit' ? 'HIT event output' : 'Route '+key.toUpperCase()+' to a macro';
        row.box.addEventListener('click', () => {
          if (key !== 'hit') cycleAudioOut(rec, key);
        });
        row.grip.setAttribute('aria-hidden', 'true');
      }
      /* WAVE 105 · THE LEVEL RING SURVIVES A REBUILD.  It was allocated per CARD, so binding a macro —
         or adding, removing or reordering any device — blanked the audio trace to zeros.  It is state
         about the SOURCE, so it is keyed on the source id and outlives the card.
         `audHits` is seeded from the model rather than left `undefined`: `ro.hits !== undefined` is
         true on the first paint of every card, which fired the onset lamp with no onset. */
      let ring = audRings.get(s.id);
      if (!ring) { ring = { hist: new Float32Array(96), i: 0, hits: -1, flashAt: -1e9 }; audRings.set(s.id, ring); }
      rec.audRing = ring;
    }

    /* MACRO / TRIG IN — the device says which macro it drives, and which trigger fires it. */
    if (dev.mac) {
      dev.mac.title = 'Select the macro driven by this device';
      dev.mac.addEventListener('click', () => cycleMacro(rec));
    }
    if (dev.bus) {


      dev.bus.title = 'Select the envelope trigger; Shift-click selects AUDIO HIT';
      dev.bus.addEventListener('click', (e) => {
        const list = fireSources();
        if (e.shiftKey) {                                   // the shortcut, straight to the signal
          const hit = list.find((f) => f.hit);
          M.setSourceTrigger(s.id, hit ? hit.id : null);
          if (!hit) say(rec, 'add an AUDIO device and its HIT can fire this envelope');
          apply(); sync(); return;
        }
        const cur = list.findIndex((f) => f.id === s.triggerId);
        const next = list[cur + 1] || null;
        M.setSourceTrigger(s.id, next ? next.id : null);
        apply(); sync();
      });
    }

    /* ── THE CHECKS ── */
    for (const [key, b] of Object.entries(dev.checks)) {
      if (CHECK_HINT[key]) b.title = CHECK_HINT[key];
      if (key === 'gate') continue;               // a MODE, not a flag — see below
      b.addEventListener('click', () => { M.setSource(s.id, { [key]: !s[key] }); apply(); sync(); paint(true); });
    }
    if (dev.compactLfo) for (const [key, b] of Object.entries(dev.compactLfo.toggles)) {
      if (CHECK_HINT[key]) b.title = CHECK_HINT[key];
    }
    /* GATE IS A MODE AND NOT A FLAG.  `gateMode` is a word in the model ('gate' | 'oneshot')
       and a boolean on the glass, so it takes the one arm `setSource` understands — and
       leaving GATE while the envelope is held releases it rather than stranding it open. */
    if (dev.checks.gate) dev.checks.gate.addEventListener('click', () => {
      const want = s.gateMode !== 'gate';
      if (!want && s.gate) M.release(s.id);
      M.setSource(s.id, { gateMode: want ? 'gate' : 'oneshot' });
      apply(); sync(); paint(true);
    });

    /* ── THE KNOBS ── */
    rec.knobs = {};
    for (const [key, k] of Object.entries(dev.knobs)) {
      const spec = knobSpec(s, key);
      rec.knobs[key] = { k, spec };
      k.dial.classList.add('kctl', 'ctl-round');
      k.dial.title = spec.hint;
      aria(k.dial, dev.kind.toUpperCase() + ' ' + s.id + ' ' + k.label, 0, 100, 100 * clamp01(spec.get()), spec.text());
      wireSlider(k.dial, {
        get: spec.get, set: (u) => { spec.set(u); apply(); paintKnob(rec, key); paint(true); },
        reset: () => { }, axis: 'both'
      });
    }

    /* ── THE EDITOR ── */
    rec.g = { box: dev.ed.box, svg: dev.ed.svg, ed: dev.ed, w: 0, h: 0, X: (t) => t, Y: (v) => v,
              samples: [], levels: 0, hseg: [], pts: null, sig: '' };
    wireEditor(rec);
    if(s.kind==='audio')buildAudioRanges(rec);
    seatMinTrace(rec);                  // wave 97: the folded strip's one indicator

    if (s.kind === 'audio' && dev.minMeter) {
      const syncMiniMeter = () => {
        const all = P.audioMini[s.id] === 'all';
        dev.minMeter.classList.toggle('is-all', all);
        dev.minMeter.setAttribute('aria-pressed', String(all));
        const label = all ? 'All' : 'Low, Mid and High';
        const next = all ? 'Low, Mid and High' : 'All';
        dev.minMeter.setAttribute('aria-label', 'Audio mini meter: ' + label + '. Click to show ' + next);
        dev.minMeter.title = label + ' meter · click for ' + next;
      };
      rec.syncMiniMeter = syncMiniMeter;
      syncMiniMeter();
      dev.minMeter.addEventListener('click', (e) => {
        e.stopPropagation();
        if (P.audioMini[s.id] === 'all') delete P.audioMini[s.id];
        else P.audioMini[s.id] = 'all';
        syncMiniMeter(); persist();
      });
    }


    if (dev.minNum) dev.minNum.addEventListener('click', () => {
      if (s.kind === 'audio') cycleAudioOut(rec, audRoutes.get(s.id) || audBands.get(s.id) || 'level');
      else cycleMacro(rec);
    });
    return rec;
  }


  const pad2 = (n) => (n < 10 ? '0' + n : String(n));

  /** the device → macro assignment, in one direction: the DEVICE says which macro it drives.
   *  `setMacro` REFUSES a source change on a macro already bound to a live source, so this
   *  unbinds first — a face that just calls it reads as a control that does nothing. */


  function cycleMacro(rec) {
    const s = rec.s;
    const all = M.macroList().filter((m) => m.kind !== 'trigger');
    const ring = [null, ...all.filter((m) => !m.sourceId || m.sourceId === s.id)];
    if (ring.length === 1) { say(rec, 'every macro is already driven by another source — free one, or add a macro'); return; }
    const at = ring.findIndex((m) => m && m.sourceId === s.id);
    const next = ring[((at < 0 ? 0 : at) + 1) % ring.length];
    const cur = all.find((m) => m.sourceId === s.id);
    if (cur) M.setMacro(cur.id, { sourceId: null });
    if (next) M.setMacro(next.id, { sourceId: s.id });      /* guaranteed free: nothing is evicted */
    clock.recomputeRunning(); apply(); rebuild();
  }

  /** WAVE 102 · THE SAME WALK AS `cycleMacro`, ONE SUBSTITUTION.  An audio output is a SOURCE with
   *  an id of its own (`a1:low`), so binding it is a macro whose `sourceId` is that id — there is no
   *  second routing system here, and wave 100's rule that a cycle never evicts an incumbent holds
   *  exactly as it does for a whole device. */
  function cycleAudioOut(rec, key) {
    const sock = M.scalarOutputId ? M.scalarOutputId(rec.s.id, key) : null;
    if (!sock) { say(rec, 'that output cannot be bound'); return; }
    const all = M.macroList().filter((m) => m.kind !== 'trigger');
    const ring = [null, ...all.filter((m) => !m.sourceId || m.sourceId === sock)];
    if (ring.length === 1) { say(rec, 'every macro is already driven by another source — free one, or add a macro'); return; }
    const at = ring.findIndex((m) => m && m.sourceId === sock);
    const next = ring[((at < 0 ? 0 : at) + 1) % ring.length];
    const cur = all.find((m) => m.sourceId === sock);
    if (cur) M.setMacro(cur.id, { sourceId: null });
    if (next) M.setMacro(next.id, { sourceId: sock });
    clock.recomputeRunning(); apply(); rebuild();
  }

  /** the grab handle reorders the rack.  The run order IS the fire order, which is why the
   *  handle sits beside the name and not in a menu. */
  function wireGrab(rec) {
    const g = rec.dev.grab;
    let d = null;
    g.title = 'Drag to reorder';


    let onMove = null, onUp = null;
    const release = () => {
      if (onMove) window.removeEventListener('pointermove', onMove);
      if (onUp) { window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); }
      onMove = onUp = null;
    };
    g.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      d = { x: e.clientX, i: M.sourceIndexOf(rec.id) };
      rec.dev.root.classList.add('m2drag');
      release();
      onMove = (ev) => moveTo(ev);
      onUp = () => { release(); stop(); };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });
    function moveTo(e) {
      if (!d) return;
      const el2 = document.elementFromPoint(e.clientX, e.clientY);
      const card = el2 && el2.closest && el2.closest('.m2dev');
      if (!card || card === rec.dev.root) return;
      const over = card.dataset.id;
      const j = M.sourceIndexOf(over);
      if (j < 0 || j === M.sourceIndexOf(rec.id)) return;
      M.moveSource(rec.id, j);
      rebuildDevices(); paint(true);
      const again = devRows.get(rec.id);
      if (again) { again.dev.root.classList.add('m2drag'); }
    }
    const stop = () => {
      if (!d) return;
      d = null;
      /* the card under the hand may be a DIFFERENT element than the one the drag began on, so the
         class comes off whatever is carrying it now — and off every card, in case a rebuild landed
         between the last move and the release. */
      for (const r of devRows.values()) r.dev.root.classList.remove('m2drag');
      persist();
    };
  }

  let clip = null;


  const say = (rec, t) => {
    rec.say = t;
    if (rec.dev.ed.note) rec.dev.ed.note.textContent = t;   // kept for a host that un-hides the caption
    if (t) status((rec.dev.kind ? rec.dev.kind.toUpperCase() + ' — ' : '') + t, '');
  };

  /* ═══════════════════════════════════════════════════════════════════════════════════════
   *  THE PICTURE — one renderer, three kinds, and the artifact's own measuring law
   * ═══════════════════════════════════════════════════════════════════════════════════════
   * host-contract.md: `w = max(60, round(box.clientWidth) || 206)`,
   * `h = max(60, round(box.clientHeight - 14) || 128)`, `px(t, v) = [11 + t·(w − 22),
   * h − 11 − v·(h − 22)]`.  PAD is 11 because the artifact says 11; nothing here chooses a
   * number the window did not already have.
   */
  const PAD = GEOM.PAD;
  const cycleNow = (s) => (s.cycles | 0) + Math.floor(s.phase + s.phaseOff);
  const cycleBase = (s) => { const c = cycleNow(s); return c - ((c % 4) + 4) % 4; };
  function headU(s) {
    if (s.kind === 'env') return clamp01(s.timeScale > 0 ? s.t / s.timeScale : 0);
    const sum = s.phase + s.phaseOff, p = sum - Math.floor(sum);
    const n = cyclesShown(s);
    return n === 1 ? p : clamp01(((cycleNow(s) - cycleBase(s)) + p) / n);
  }
  /** the points a drawing may be EDITED through — null in wave mode, which is read-only */
  const editPoints = (s) => (s.kind === 'env' ? M.envPoints(s) : (s.shapeMode === 'curve' ? s.points : null));

  function sampleShape(s, w) {
    const pts = editPoints(s);
    if (pts) return polyOf(pts, Math.max(24, w));
    const n = Math.max(48, w), cyc = cyclesShown(s), base = cycleBase(s), out = new Array(n + 1);
    for (let i = 0; i <= n; i++) {
      const u = i / n, g = u * cyc, k = Math.min(cyc - 1, Math.floor(g));
      out[i] = [u, M.waveAt(s.wave, g - k, { cycles: base + k, seed: s.rseed })];
    }
    return out;
  }

  /** WHAT THE RENDERER REBUILDS ON.  `gateMode` is in here, which is the second half of
   *  inherited defect 3: without it a GATE toggle left the printed duration 2.94× stale for
   *  ever, because nothing else in the signature moved. */
  function sigOf(s, w, h) {
    if (s.kind === 'audio') return w + '|' + h + '|a';
    if (s.kind === 'env') return w + '|' + h + '|e|' + curveHash(M.envPoints(s)) + '|' + s.steps + '|' + s.timeScale + '|' + s.gateMode;
    if (s.shapeMode === 'curve') return w + '|' + h + '|c|' + curveHash(s.points) + '|' + s.steps;
    return w + '|' + h + '|w|' + s.wave + '|' + s.steps + '|' + s.rseed + '|' + (stochastic(s) ? cycleBase(s) : 0);
  }

  function render(rec) {
    const s = rec.s, g = rec.g, ed = rec.dev.ed;
    const w = Math.max(60, Math.round(g.box.clientWidth) || 206);
    const h = Math.max(60, Math.round(g.box.clientHeight - 14) || 128);
    g.w = w; g.h = h;
    g.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    const X = (t) => PAD + clamp01(t) * (w - 2 * PAD), Y = (v) => h - PAD - clamp01(v) * (h - 2 * PAD);
    g.X = X; g.Y = Y;
    const sm = sampleShape(s, w);
    g.samples = sm;

    /* the well: the two rails, and for an ENVELOPE a REAL-TIME grid with its own labels */
    ed.gGrid.replaceChildren();
    const rails = svgEl('path', 'm2gridline', ed.gGrid);
    let gd = 'M' + X(0) + ' ' + Y(0) + 'H' + X(1) + 'M' + X(0) + ' ' + Y(1) + 'H' + X(1);
    if (s.kind === 'env') {
      const ts = s.timeScale, step = ts >= 4 ? 1 : ts >= 2 ? 0.5 : ts >= 0.8 ? 0.25 : 0.1;
      let lastLbl = -1e9;
      for (let t = step; t < ts - 1e-9; t += step) {
        const x = X(t / ts);
        gd += 'M' + x.toFixed(1) + ' ' + Y(1) + 'V' + Y(0);
        if (x - lastLbl < 30) continue;
        lastLbl = x;
        const lb = svgEl('text', 'm2gridtxt', ed.gGrid);
        lb.setAttribute('x', (x + 2).toFixed(1)); lb.setAttribute('y', (h - PAD - 2).toFixed(1));
        lb.textContent = (step < 1 ? t.toFixed(2) : t.toFixed(0)) + 's';
      }
    }
    rails.setAttribute('d', gd);
    ed.mid.setAttribute('x1', X(0)); ed.mid.setAttribute('x2', X(1));
    ed.mid.setAttribute('y1', Y(0.5).toFixed(2)); ed.mid.setAttribute('y2', Y(0.5).toFixed(2));

    /* THE LADDER IS A SHAPE AND IT LOOKS LIKE ONE: when STEPS is on, the drawn line is the
       STAIRCASE the engine emits, not the smooth shape it emits it from. */
    const stepped = s.steps >= M.STEPS_MIN;
    let d = '';
    if (stepped) {
      let last = null; const lv = new Set();
      for (let i = 0; i < sm.length; i++) {
        const q = M.stepQuant(sm[i][1], s.steps), x = X(sm[i][0]).toFixed(2);
        lv.add(q);
        if (last === null) d = 'M' + x + ' ' + Y(q).toFixed(2);
        else { d += 'L' + x + ' ' + Y(last).toFixed(2); if (q !== last) d += 'L' + x + ' ' + Y(q).toFixed(2); }
        last = q;
      }
      g.levels = lv.size;
    } else {
      for (let i = 0; i < sm.length; i++) d += (i ? 'L' : 'M') + X(sm[i][0]).toFixed(2) + ' ' + Y(sm[i][1]).toFixed(2);
      g.levels = 0;
    }
    ed.path.setAttribute('d', d);
    ed.fill.setAttribute('d', d + 'L' + X(1).toFixed(2) + ' ' + Y(0).toFixed(2) + 'L' + X(0).toFixed(2) + ' ' + Y(0).toFixed(2) + 'Z');

    /* the points and the tension handles — only where there is something to grab */
    const pts = editPoints(s);
    g.pts = pts; g.hseg = [];
    ed.gPts.replaceChildren(); ed.gTens.replaceChildren();
    if (pts) {
      for (let i = 0; i < pts.length; i++) {
        const c = svgEl('circle', 'm2pt', ed.gPts);
        c.setAttribute('cx', X(pts[i].t).toFixed(2)); c.setAttribute('cy', Y(pts[i].v).toFixed(2)); c.setAttribute('r', '3.4');
      }
      const tens = s.kind === 'env' ? envMapOf(s).tens : null;
      for (let i = 0; i < pts.length - 1; i++) {
        if (pts[i + 1].t - pts[i].t < 1e-9) continue;         // a jump has no bendable middle
        if (tens && !tens[i]) continue;                       // the ENV's plateau bends nothing
        const mt = (pts[i].t + pts[i + 1].t) / 2;
        const c = svgEl('circle', 'm2tn', ed.gTens);
        c.setAttribute('cx', X(mt).toFixed(2)); c.setAttribute('cy', Y(curveEval(pts, mt)).toFixed(2)); c.setAttribute('r', '3');
        g.hseg.push(i);
      }
    }
    ed.play.setAttribute('y1', (PAD - 4).toFixed(1)); ed.play.setAttribute('y2', (h - PAD + 4).toFixed(1));
    ed.pdot.setAttribute('r', '3.6');
    if (!rec.say) ed.note.textContent = captionOf(s);
  }

  /** the honest sentence under the drawing: what this picture IS, and whether it may be drawn on */
  function captionOf(s) {
    if (s.kind === 'audio') {
      /* WAVE 105.  This sentence said "inert: no capture half was ported" for eleven waves after
         wave 102 ported one.  It now reports what the DEVICE is actually doing, which is the only
         thing a caption under a live meter may say. */
      const cap = port.audio ? port.audio.state() : null;
      const live = !!(cap && cap.live);
      return 'AUDIO — ' + (live ? 'listening at ' + Math.round((cap.sampleRate || 0) / 1000) + ' kHz'
                                : !port.audio ? 'this host supplies no capture'
                                : cap.reason || 'not listening') +
        '. LEVEL, three BANDS and HIT leave as sockets; patch one to a macro.';
    }
    if (s.kind === 'env') return 'ENV — ' + envDrawn(s).toFixed(3) + ' s drawn over a ' + s.timeScale.toFixed(2) +
      ' s window. Drag the stages; FIT frames it.';
    if (s.shapeMode !== 'curve') return M.WAVE_LABEL[s.wave] + (stochastic(s)
      ? ' · analytic: choose a breakpoint shape to edit it. Four cycles: each is a fresh hold.'
      : ' · analytic: right-drag the curve to make it editable.');
    const info = curveInfo(s.points);
    return (info.preset ? PRESET_LABEL[info.preset] + (info.mirrored ? ' mirrored' : '') : 'CURVE') +
      ' — ' + info.points + ' points, ' + info.bent + ' bent. Right-drag empty space to add; drag dots and handles.';
  }
  const shapeLabel = (s) => {
    if (s.shapeMode !== 'curve') return M.WAVE_LABEL[s.wave];
    const preset = curveInfo(s.points).preset;
    return preset ? PRESET_LABEL[preset] : 'CURVE';
  };

  const stateOf = (s) => (!s.on ? 'OFF'
    : s.kind === 'env' ? (s.gate ? 'GATE' : s.fired ? (s.releasedAt !== null ? 'REL' : 'RUN') : 'IDLE')
    : clock.isRunning() ? 'RUN' : 'HOLD');
  /* WAVE 105 · THE AUDIO CARD READ `00 OUT` WHATEVER YOU PATCHED.  An AUDIO device is not a
     source that macros bind to: it OWNS five child sources (`kind: 'audioout'`, mod.js:636), and
     a macro's `sourceId` names one of THOSE.  Matching on the device's own id could therefore
     never match, and the count was structurally pinned at zero. */
  /* EVERYTHING THAT MAY FIRE AN ENVELOPE, in one order the cycle and the caption agree on:
     the trigger macros in rail order first, then each AUDIO device's HIT socket in run order.
     `label` is what the TRIG IN seat prints — a macro's rail number, or H / H<n> for a hit. */
  function fireSources() {
    const out = [];
    for (const t of M.triggerMacros()) out.push({ id: t.id, hit: false, label: String(t.index) });
    const auds = M.sourceList ? M.sourceList().filter((q) => q.kind === 'audio') : [];
    auds.forEach((q, i) => {
      const id = M.scalarOutputId ? M.scalarOutputId(q.id, 'hit') : null;
      if (id) out.push({ id, hit: true, label: auds.length > 1 ? 'H' + (i + 1) : 'H' });
    });
    return out;
  }

  function outsOf(s) {
    const audio = s.kind === 'audio';
    let n = 0;
    for (const m of M.macroList()) {
      if (!m.sourceId) continue;
      let mine;
      if (audio) { const c = M.audioOutputOf(m.sourceId); mine = !!c && c.deviceId === s.id; }
      else mine = m.sourceId === s.id;
      if (mine) n += M.routeCountOfMacro(m.id);
    }
    return n;
  }

  /* ── THE ENVELOPE'S POINT → KNOB MAP, from `envPoints`' own construction ─────────────────
   * keys[i]  the stage knob point i drags (null: the origin, and the tail at t = 1)
   * tens[i]  the tension the handle on segment i bends (null: the hold plateau) */
  function envMapOf(s) {
    const keys = [null], tens = ['ta'];
    keys.push('a');
    if (s.hold > 0) { tens.push(null); keys.push('hold'); tens.push('td'); } else tens.push('td');
    keys.push('d'); tens.push('tr');
    keys.push('r'); tens.push(null);
    return { keys, tens };
  }

  /* ── ONE POINTER CONTRACT, both kinds ────────────────────────────────────────────────────
   * INHERITED DEFECT 1 DIES HERE.  The source latched the point's INDEX at pointerdown and
   * re-read `envMapOf(s)` on every move; the map is six long when `hold > 0` and five when it
   * is 0, so the instant a drag took `hold` to zero, index 2 stopped meaning `hold` and
   * started meaning `d` — measured, `d` 0.8 s → 0 and the sustain 0.5 → 1, neither touched,
   * with no road back.  The KEY is latched instead, at pointerdown, and a drag can therefore
   * only ever write the stage the finger picked up. */
  function wireEditor(rec) {
    const s = rec.s, g = rec.g, svg = g.svg;
    let pid = null, mode = null, idx = -1, key = null, y0 = 0, base = 0;
    let anchor = { x: 0, y: 0 };
    let down = { key: null, t: 0, v: 0 };            // the LATCH: the stage, its seconds, and where the finger took it

    const local = (e) => svgPoint(svg, e);
    const uv = (p) => ({ t: clamp01((p.x - PAD) / Math.max(1, g.w - 2 * PAD)),
                         v: clamp01(1 - (p.y - PAD) / Math.max(1, g.h - 2 * PAD)) });

    function hit(p) {
      const pts = g.pts; if (!pts) return { kind: null };
      const points = pts.map((q, i) => ({ x: g.X(q.t), y: g.Y(q.v), i }));
      const handles = g.hseg.map((i) => {
        const mt = (pts[i].t + pts[i + 1].t) / 2;
        return { x: g.X(mt), y: g.Y(curveEval(pts, mt)), i };
      });
      return curveHit(p, points, handles, GRAB);
    }

    function ensureCurve() {
      if (s.kind === 'env' || s.shapeMode === 'curve') return true;
      const preset = editablePresetForWave(s.wave);
      if (!preset) {
        say(rec, M.WAVE_LABEL[s.wave] + ' is stochastic — choose a breakpoint shape before editing');
        return false;
      }
      M.setSource(s.id, { preset });
      apply(); paint(true);
      return true;
    }

    function writeTension(i, value) {
      if (s.kind === 'env') {
        const k = envMapOf(s).tens[i];
        if (k) { M.setSource(s.id, { [k]: value }); syncKnobs(rec); }
      } else M.curveEdit(s.id, 'tension', { index: i, tension: value });
      apply(); paint(true);
    }

    /** AN ENV STAGE DRAG, AND THE INVERSE IS RELATIVE ON PURPOSE.  The source's inverse was
     *  ABSOLUTE — it read the pointer's t, multiplied by the window and subtracted the earlier
     *  stages — which cannot express a stage LONGER than the window: `envPoints` clamps such a
     *  point to t = 1, so a two-pixel twitch on a 6.5 s release inside a 1 s window wrote
     *  0.682 s and threw 5.8 s away.  Latching the stage's own seconds and the finger's own t at
     *  pointerdown and moving by the DIFFERENCE fixes that, and is identical to the absolute
     *  inverse everywhere the point is not clamped — with the bonus that grabbing a point 15 px
     *  off centre no longer jumps it under the finger.  `s` (the sustain LEVEL) stays absolute,
     *  because the vertical axis has no window to run out of. */
    function envMove(t, v) {
      const k = down.key;
      if (!k) return false;
      const d = (t - down.t) * s.timeScale;
      if (k === 'a') M.setSource(s.id, { a: Math.max(0, Math.min(M.ENV_MAX_S, down.v + d)) });
      else if (k === 'hold') M.setSource(s.id, { hold: Math.max(0, Math.min(M.ENV_MAX_S, down.v + d)) });
      else if (k === 'd') M.setSource(s.id, { d: Math.max(0, Math.min(M.ENV_MAX_S, down.v + d)), s: v });
      else if (k === 'r') M.setSource(s.id, { r: Math.max(0, Math.min(M.ENV_MAX_S, down.v + d)) });
      return true;
    }

    svg.addEventListener('pointerdown', (e) => {
      if (s.kind === 'audio' || pid !== null) return;
      const p = local(e), h = hit(p), action = curveAction(e, h);
      if (!action) return;                // FL: a plain left click on empty curve is inert
      e.preventDefault();
      if (action === 'point-menu') { say(rec, 'Alt-click deletes this point; drag it to move'); return; }
      if (action === 'remove-point') {
        if (s.kind === 'env') { say(rec, 'an envelope has fixed stages — drag a stage to zero instead'); return; }
        const n0 = s.points.length;
        M.curveEdit(s.id, 'remove', { index: h.i });
        say(rec, s.points.length < n0 ? 'point removed' : 'a curve keeps at least two points');
        apply(); paint(true); return;
      }
      if (action === 'reset-tension') { writeTension(h.i, 0); say(rec, 'tension reset'); return; }
      if (action === 'add-point') {
        if (s.kind === 'env') { say(rec, 'the ENV has fixed stages — drag a stage or its tension handle'); return; }
        if (!ensureCurve()) return;
        const q = uv(p), n0 = s.points.length;
        q.v = pointAddValue(e, q.v, curveEval(g.pts, q.t));
        M.curveEdit(s.id, 'add', { t: q.t, v: q.v, tension: 0 });
        if (s.points.length === n0) { say(rec, 'thirty-two points is the curve\'s ceiling'); return; }
        idx = s.points.reduce((best, x, i) => Math.abs(x.t - q.t) + Math.abs(x.v - q.v) < best.d
          ? { i, d: Math.abs(x.t - q.t) + Math.abs(x.v - q.v) } : best, { i: 0, d: Infinity }).i;
        mode = 'point';
        apply(); paint(true);
      } else {
        mode = action === 'move-tension' ? 'handle' : 'point';
        idx = h.i;
      }
      pid = e.pointerId;
      try { svg.setPointerCapture(pid); } catch (_) {}
      const q0 = uv(p), pt = g.pts && g.pts[idx];
      anchor = { x: pt ? pt.t : q0.t, y: pt ? pt.v : q0.v };
      key = mode === 'point' && s.kind === 'env' ? envMapOf(s).keys[idx] : null;
      down = { key, t: q0.t, v: key ? s[key] : 0 };
      y0 = p.y;
      if (mode === 'handle') base = g.pts[idx].tension;
      if (mode === 'handle' && s.kind === 'env') key = envMapOf(s).tens[idx];
    });

    svg.addEventListener('pointermove', (e) => {
      if (pid !== e.pointerId) return;
      const p = local(e), q = uv(p);
      if (mode === 'point') {
        const locked = pointDrag(anchor, { x: q.t, y: q.v }, e);
        if (s.kind === 'env') { if (envMove(e.ctrlKey ? down.t : locked.x, locked.y)) syncKnobs(rec); }
        else M.curveEdit(s.id, 'move', { index: idx, t: locked.x, v: locked.y });
        apply();
        /* A paused host supplies only the one frame requested by apply().  That frame may land
           inside paint()'s 33 ms meter throttle and be discarded, leaving the edited geometry
           stale until Play creates another frame.  The hand owns this picture now, so repaint
           the editor synchronously; the scheduled host frame still presents the routed result. */
        paint(true);
      } else if (mode === 'handle') {
        /* UP RAISES THE CURVE, whichever way the segment runs. */
        const a = g.pts[idx], b = g.pts[idx + 1];
        const sgn = b.v < a.v ? -1 : 1;
        const tau = Math.max(-1, Math.min(1, base + sgn * tensionDelta(y0, p.y, e) / TENSION_PX));
        writeTension(idx, tau);
      }
    });

    const end = (e) => { if (pid !== e.pointerId) return; pid = null; mode = null; key = null; };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('lostpointercapture', end);
    svg.addEventListener('dblclick', (e) => {
      const h = hit(local(e));
      if (curveAction(e, h) !== 'reset-tension') return;
      e.preventDefault();
      writeTension(h.i, 0);
      say(rec, 'tension reset');
    });
    svg.addEventListener('contextmenu', (e) => e.preventDefault());
    svg.setAttribute('aria-label', 'Curve editor: right-drag empty space to add a point; Shift-right-click adds at the current curve value; left-drag a point to move it; left-drag a tension handle to bend it; Ctrl makes tension fine; right-click or double-click a tension handle resets it; Alt-click a point deletes it.');
  }

  // Each meter is both an input-level display and a response-range editor.
  function buildAudioRanges(rec) {
    const {s, dev} = rec;
    dev.root.classList.add('audio-ranges');
    const root = el('div', 'aud-ranges', dev.ed.box);
    root.setAttribute('aria-label', 'Audio response ranges');
    const rows = {};
    const select = key => { audBands.set(s.id, key); audRoutes.set(s.id, key); syncKnobs(rec); paintAudio(rec); };
    const patch = (key, q) => { for(const k of ['floorDb','ceilingDb'])if(Number.isFinite(q[k]))q[k]=Math.round(q[k]*10)/10; M.setSource(s.id, {audio:{outs:{[key]:q}}}); apply(); paintAudio(rec); };
    const patchMix = (key, value) => {
      value=clamp01(value);M.setSource(s.id,{audio:{levelMix:{[key]:value}}});
      apply();paintAudio(rec);return value;
    };
    const makeMix = (row, key) => {
      // Use the macro depth control's real ring anatomy. Audio only supplies its
      // own value and gesture; the established track/arc nodes own the shape.
      const root=el('div','aud-level-mix',row),dial=el('div','aud-level-mix-dial m2numseat',root);
      const ring=svgEl('svg','m2depthring',dial);ring.setAttribute('viewBox','0 0 36 36');ring.setAttribute('aria-hidden','true');
      const track=svgEl('circle','m2depthtrack',ring),arc=svgEl('circle','m2deptharc',ring);
      for(const node of [track,arc]){node.setAttribute('cx','18');node.setAttribute('cy','18');node.setAttribute('r','15');node.setAttribute('pathLength','1');node.setAttribute('transform','rotate(135 18 18)');}
      track.setAttribute('stroke-dasharray','1 1');arc.setAttribute('stroke-dasharray','1 1');
      el('span','m2num aud-level-mix-core',dial).setAttribute('aria-hidden','true');
      const value=el('output','aud-level-mix-value',root);
      dial.setAttribute('role','slider');
      const input={
        get:()=>s.audio.levelMix[key],
        set:v=>{select(key);patchMix(key,v);},
        reset:()=>{select(key);patchMix(key,1);},
        axis:'y',editable:()=>true
      };
      wireSlider(dial,input);bindSliderKeys(dial,input);
      aria(dial,(key==='level'?'LEVEL master':key.toUpperCase()+' contribution')+' to LEVEL',0,100,100*input.get(),Math.round(100*input.get())+'%');
      return {root,dial,value,arc};
    };
    const shift = (key, delta, base=s.audio.outs[key]) => {
      delta = Math.max(M.AUDIO_RANGE_MIN-base.floorDb, Math.min(M.AUDIO_RANGE_MAX-base.ceilingDb, delta));
      patch(key, {floorDb:base.floorDb+delta, ceilingDb:base.ceilingDb+delta});
    };
    for (const key of M.AUDIO_FOLLOWED) {
      const row = el('div', 'aud-range-row', root); row.dataset.band=key;
      const mix=makeMix(row,key);
      const head = el('button', 'aud-range-name', row); head.type='button';
      el('b','aud-range-full',head,key.toUpperCase());
      el('span','aud-range-short',head,key==='level'?'A':key[0].toUpperCase());
      const text=el('output','aud-range-value',row);
      head.addEventListener('click',()=>select(key));
      head.title='Select '+key.toUpperCase()+' for ATTACK, RELEASE and HOLD';
      const track=el('div','aud-range-track',row);
      const low=el('div','aud-range-low',track),high=el('div','aud-range-high',track),zone=el('div','aud-range-zone',track),fill=el('div','aud-range-output',track),cursor=el('i','aud-range-input',track);
      const handles={};
      for(const endpoint of ['floorDb','ceilingDb']) {
        const handle=el('button','aud-range-handle '+(endpoint==='floorDb'?'lower':'upper'),track); handle.type='button'; handle.dataset.endpoint=endpoint;
        handle.setAttribute('role','slider'); handle.setAttribute('aria-orientation','horizontal');
        handle.setAttribute('aria-label',key.toUpperCase()+' '+(endpoint==='floorDb'?'lower':'upper')+' response boundary dB');
        handle.addEventListener('keydown',e=>{
          if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
          e.preventDefault(); e.stopPropagation(); select(key);
          const o=s.audio.outs[key],lo=endpoint==='floorDb'?M.AUDIO_RANGE_MIN:o.floorDb+M.AUDIO_RANGE_GAP,
            hi=endpoint==='floorDb'?o.ceilingDb-M.AUDIO_RANGE_GAP:M.AUDIO_RANGE_MAX;
          const v=e.key==='Home'?lo:e.key==='End'?hi:o[endpoint]+(['ArrowRight','ArrowUp'].includes(e.key)?1:-1)*(e.shiftKey ? .1 : 1);
          patch(key,{[endpoint]:Math.max(lo,Math.min(hi,v))});
        });
        handles[endpoint]=handle;
      }
      let drag=null;
      track.addEventListener('pointerdown',e=>{
        if(e.button!==0)return; e.preventDefault();e.stopPropagation();select(key);
        const o=s.audio.outs[key],b=track.getBoundingClientRect(),vertical=dev.root.classList.contains('m2cmp');
        const u=vertical?1-(e.clientY-b.top)/b.height:(e.clientX-b.left)/b.width;
        const db=M.AUDIO_RANGE_MIN+u*(M.AUDIO_RANGE_MAX-M.AUDIO_RANGE_MIN);
        const endpoint=e.target.dataset.endpoint || (db<o.floorDb?'floorDb':db>o.ceilingDb?'ceilingDb':null);
        drag={x:e.clientX,y:e.clientY,w:b.width,h:b.height,vertical,base:{...o},endpoint};
        row.classList.add('editing');track.setPointerCapture(e.pointerId); if(endpoint)handles[endpoint].focus();
      });
      track.addEventListener('pointermove',e=>{
        if(!drag)return;const delta=(drag.vertical?(drag.y-e.clientY)/drag.h:(e.clientX-drag.x)/drag.w)*(M.AUDIO_RANGE_MAX-M.AUDIO_RANGE_MIN);
        if(!drag.endpoint)shift(key,delta,drag.base);
        else {
          const lo=drag.endpoint==='floorDb'?M.AUDIO_RANGE_MIN:drag.base.floorDb+M.AUDIO_RANGE_GAP;
          const hi=drag.endpoint==='floorDb'?drag.base.ceilingDb-M.AUDIO_RANGE_GAP:M.AUDIO_RANGE_MAX;
          patch(key,{[drag.endpoint]:Math.max(lo,Math.min(hi,drag.base[drag.endpoint]+delta))});
        }
      });
      const end=()=>{drag=null;row.classList.remove('editing');};track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);track.addEventListener('lostpointercapture',end);
      track.addEventListener('wheel',e=>{if(!e.deltaY)return;e.preventDefault();e.stopPropagation();select(key);shift(key,(e.deltaY<0?1:-1)*(e.shiftKey ? .1 : 1));},{passive:false});
      track.addEventListener('dblclick',e=>{e.preventDefault();e.stopPropagation();patch(key,{floorDb:M.AUDIO_DB_FLOOR,ceilingDb:M.AUDIO_DB_TOP});});
    track.title='Resize at the edges; shift inside; double-click to reset';
      rows[key]={row,head,text,mix,low,high,fill,zone,cursor,handles};
    }
    const hint=el('div','aud-range-hint',root,'Select a band for timing');
    rec.audRanges={root,rows,hint};
  }

  function wireAudioConditioning(rec, sh) {
    const s=rec.s, keys=M.AUDIO_FOLLOWED;
    const selected=()=>audBands.get(s.id)||'level';
    const timeText=v=>v>=1000?(v/1000).toFixed(v%1000?2:0)+' s':Math.round(v)+' ms';
    const specs={
      lower:{min:M.AUDIO_RANGE_MIN,max:M.AUDIO_RANGE_MAX-M.AUDIO_RANGE_GAP,step:1,unit:'dB',field:'floorDb'},
      upper:{min:M.AUDIO_RANGE_MIN+M.AUDIO_RANGE_GAP,max:M.AUDIO_RANGE_MAX,step:1,unit:'dB',field:'ceilingDb'},
      att:{min:0,max:M.AUDIO_TIME_MAX,step:1,unit:'ms',field:'attackMs'},
      rel:{min:0,max:M.AUDIO_TIME_MAX,step:1,unit:'ms',field:'releaseMs'},
      thresh:{min:-90,max:0,step:1,unit:'dB',field:'thresholdDb',global:true},
      hold:{min:0,max:4000,step:10,unit:'ms',field:'holdMs',global:true},
      hyst:{min:0,max:24,step:1,unit:'dB',field:'hysteresisDb',global:true},
      flux:{min:.001,max:10,step:.001,unit:'',field:'fluxFloor',global:true}
    };
    const refresh=()=>{
      sh.rows.out.val.textContent=selected().toUpperCase();
      sh.rows.gate.val.textContent=s.audio.gateEnabled?'ON':'OFF';
      for(const [key,spec] of Object.entries(specs)) {
        const row=sh.rows[key],o=spec.global?s.audio:s.audio.outs[selected()];
        if(document.activeElement!==row.input)row.input.value=o[spec.field];
        row.input.min=key==='upper'?o.floorDb+M.AUDIO_RANGE_GAP:spec.min;
        row.input.max=key==='lower'?o.ceilingDb-M.AUDIO_RANGE_GAP:spec.max;
        const v=o[spec.field];
        row.output.textContent=spec.unit==='ms'?timeText(v):
          (spec.unit==='dB'?(v>0?'+':'')+Number(v).toFixed(key==='lower'||key==='upper'?1:0)+' dB':Number(v).toFixed(v<.1?3:2));
      }
    };
    const changed=()=>{apply();syncKnobs(rec);paintAudio(rec);refresh();};
    for(const [key,spec] of Object.entries(specs)) {
      const row=sh.rows[key],input=el('input','aud-setting-input',row.val),output=el('output','m2audsreadout',row.val);row.input=input;row.output=output;
      row.row.classList.add('m2audscontinuous');
      input.type='range';input.min=spec.min;input.max=spec.max;input.step=spec.step;input.setAttribute('aria-label',row.lab.textContent+' '+spec.unit);
      const write=v=>{
        if(!Number.isFinite(v)){refresh();return;}
        v=Math.max(+input.min,Math.min(+input.max,v));
        M.setSource(s.id,{audio:spec.global?{[spec.field]:v}:{outs:{[selected()]:{[spec.field]:v}}}});changed();
      };
      input.addEventListener('input',()=>write(input.valueAsNumber));
      row.dn.addEventListener('click',()=>write(input.valueAsNumber-spec.step));row.up.addEventListener('click',()=>write(input.valueAsNumber+spec.step));
    }
    for(const [button,dir] of [[sh.rows.out.dn,-1],[sh.rows.out.up,1]])button.addEventListener('click',()=>{const next=keys[(keys.indexOf(selected())+dir+keys.length)%keys.length];audBands.set(s.id,next);audRoutes.set(s.id,next);changed();});
    for(const button of [sh.rows.gate.dn,sh.rows.gate.up])button.addEventListener('click',()=>{M.setSource(s.id,{audio:{gateEnabled:!s.audio.gateEnabled}});changed();});
    sh.rows.hold.leg.textContent='Gate hold keeps the noise gate open. The face HOLD knob separately holds each band peak before release.';
    sh.rows.lower.leg.textContent='Input dB at 0% output; upper boundary reaches 100%.';
    sh.refresh=refresh;refresh();
  }

  function paintAudioMeter(rec, ro) {
    const ui=rec.audRanges;if(!ui)return;
    const position=v=>100*clamp01((v-M.AUDIO_RANGE_MIN)/(M.AUDIO_RANGE_MAX-M.AUDIO_RANGE_MIN));
    const selected=audBands.get(rec.id)||'level';
    for(const key of M.AUDIO_FOLLOWED) {
      const row=ui.rows[key],o=ro.outs[key],lo=position(o.floorDb),hi=position(o.ceilingDb);
      row.head.setAttribute('aria-pressed',String(key===selected));
      row.row.dataset.selected=String(key===selected);
      const db=v=>(v>0?'+':'')+(Math.abs(v)<.05?'0':v.toFixed(1));
      row.text.textContent=db(o.floorDb)+'…'+db(o.ceilingDb)+' dB';
      const input=position(o.inputDb),mix=ro.levelMix[key];
      const vertical=rec.dev.root.classList.contains('m2cmp');
      if(vertical){
        row.low.style.cssText='height:'+lo+'%;bottom:0';row.high.style.cssText='height:'+(100-hi)+'%;bottom:'+hi+'%';
        row.zone.style.cssText='height:'+(hi-lo)+'%;bottom:'+lo+'%';row.fill.style.cssText='height:'+input+'%;bottom:0';row.cursor.style.cssText='bottom:'+input+'%';
      }else{
        row.low.style.cssText='width:'+lo+'%;left:0';row.high.style.cssText='width:'+(100-hi)+'%;left:'+hi+'%';
        row.zone.style.cssText='width:'+(hi-lo)+'%;left:'+lo+'%';row.fill.style.cssText='width:'+input+'%;left:0';row.cursor.style.cssText='left:'+input+'%';
      }
      row.mix.arc.style.strokeDasharray=(clamp01(mix)*.75).toFixed(4)+' 1';row.mix.dial.classList.toggle('m2zero',mix<=0);
      row.mix.value.textContent=Math.round(mix*100)+'%';row.mix.dial.setAttribute('aria-valuenow',String(Math.round(mix*100)));row.mix.dial.setAttribute('aria-valuetext',Math.round(mix*100)+' percent');
      for(const endpoint of ['floorDb','ceilingDb']) {
        const h=row.handles[endpoint],p=position(o[endpoint]);
        h.style.cssText=vertical?'bottom:'+p+'%':'left:'+p+'%';h.setAttribute('aria-orientation',vertical?'vertical':'horizontal');
        h.setAttribute('aria-valuemin',endpoint==='floorDb'?M.AUDIO_RANGE_MIN:o.floorDb+M.AUDIO_RANGE_GAP);
        h.setAttribute('aria-valuemax',endpoint==='floorDb'?o.ceilingDb-M.AUDIO_RANGE_GAP:M.AUDIO_RANGE_MAX);
        h.setAttribute('aria-valuenow',o[endpoint]);h.setAttribute('aria-valuetext',o[endpoint].toFixed(1)+' dB');
      }
      row.head.title=key.toUpperCase()+' · '+(o.out*100).toFixed(0)+'% output · '+(Number.isFinite(o.inputDb)?o.inputDb.toFixed(1):'−∞')+' dB input';
    }
    const out=ro.outs[selected];ui.hint.textContent=selected.toUpperCase()+' · A '+out.attackMs.toFixed(0)+' · R '+out.releaseMs.toFixed(0)+' · H '+out.holdMs.toFixed(0)+' ms';
  }

  /** the AUDIO device's words and lamps — the capture's own state first, because a follower with no
   *  microphone behind it should say THAT rather than print a confident 0.00. */
  function paintAudio(rec) {
    const s = rec.s, dev = rec.dev;
    if (dev.kind !== 'audio' || !dev.aud) return;
    const A = dev.aud, cap = port.audio ? port.audio.state() : { state: 'idle', reason: '', live: false };
    const ro = M.audioReadout ? M.audioReadout(s.id) : null;
    if (!ro) return;
    const ring = rec.audRing;
    if (cap.live && ring) { ring.hist[ring.i] = ro.outs.level.out; ring.i = (ring.i + 1) % ring.hist.length; }
    A.srcBtn.classList.toggle('on', cap.live);
    A.srcBtn.setAttribute('aria-pressed', String(cap.live));
    A.srcBtn.textContent = cap.live ? 'AUDIO ON' : 'AUDIO IN';
    A.liveLed.style.background = cap.live ? 'var(--acc2)' : '';
    A.liveTxt.textContent = cap.live ? 'LIVE' : cap.state.toUpperCase();
    A.live.classList.toggle('on', cap.live);
    A.note.textContent = cap.live
      ? (ro.sampleRate ? (ro.sampleRate / 1000).toFixed(1) + ' kHz · ' + ro.feedHz.toFixed(0) + ' Hz feed' : 'listening')
      : (cap.reason || 'audio input is closed — press AUDIO IN');
    if (dev.audioState) { dev.audioState.textContent = cap.live ? (ro.gateOpen ? 'OPEN' : 'GATED') : 'OFF';
      dev.audioState.classList.toggle('on', cap.live && ro.gateOpen);
      dev.audioState.classList.toggle('bad', cap.state === 'denied' || cap.state === 'error'); }
    if (dev.status) {
      dev.status.main.classList.toggle('on', cap.live && ro.gateOpen);
      dev.status.text.textContent = cap.live ? (ro.gateOpen ? 'OPEN' : 'GATED') : 'OFF';
      if (dev.status.middle) dev.status.middle.textContent = 'LEVEL ' + ro.outs.level.out.toFixed(2);
      dev.status.out.textContent = pad2(outsOf(s)) + ' OUT';
    }
    /* each socket says which macro holds it, by NUMBER — the same reading the rail's indicator and
       the minimised strip give, so one macro is one number wherever you meet it */
    const macros = M.macroList();
    const selected = audBands.get(s.id) || 'level';
    const selectedRoute = audRoutes.get(s.id) || selected;
    for (const key of Object.keys(A.outs)) {
      const row = A.outs[key], sock = M.scalarOutputId ? M.scalarOutputId(s.id, key) : null;
      const ix = sock ? macros.findIndex((m) => m.sourceId === sock) : -1;
      row.slot.textContent = key === 'hit' ? 'EVT' : (ix >= 0 ? String(ix + 1) : '--');
      const v = ro.outs[key] ? ro.outs[key].out : 0;
      row.row.classList.toggle('on', cap.live && (key === 'hit' ? v > 0 : v > 0.02));
      row.box.classList.toggle('on', ix >= 0);
      row.row.dataset.routeSelected = String(key === selectedRoute);
    }
    if (dev.minLeds) {
      for (const key of ['level', 'low', 'mid', 'high']) {
        const lamp = dev.minLeds[key], out = ro.outs[key];
        if (lamp) lamp.style.setProperty('--signal', clamp01(out ? out.out : 0).toFixed(4));
      }
    }
    const selectedSock = M.scalarOutputId ? M.scalarOutputId(s.id, selectedRoute) : null;
    const selectedIx = selectedSock ? macros.findIndex((m) => m.sourceId === selectedSock) : -1;
    if (dev.minNum) {
      dev.minNum.textContent = selectedIx >= 0 ? String(selectedIx + 1) : '--';
      dev.minNum.classList.toggle('m2nomac', selectedIx < 0);
      dev.minNum.setAttribute('aria-label', selectedRoute.toUpperCase()+' audio routing'+(selectedIx >= 0?' macro '+(selectedIx+1):' hand'));
      dev.minNum.title = selectedRoute.toUpperCase()+' routing — click to cycle available macros';
    }
    paintAudioMeter(rec, ro);
  }

  /* ═══ THE PAINT.  Reads the model, writes text and a handful of attributes. ═════════════ */
  function paintKnob(rec, key) {
    const q = rec.knobs[key]; if (!q) return;
    const u = clamp01(q.spec.get());
    q.k.dial.style.setProperty('--needle', (-150 + u * 300).toFixed(2) + 'deg');
    /* Value arcs restored by the September 8 UI follow-up; span tracks normalized value. */
    if (q.k.arc && q.k.arc.val) {
      const a = q.k.arc;
      a.val.style.strokeDasharray = (u * a.span * a.c1).toFixed(2) + ' 9999';
      a.val.style.strokeDashoffset = '0';
    }
    /* TWO SEATS, TWO READINGS.  `.ckval` is the 7.5 px chip INSIDE the dial and `.m2kval` is the
       line under the caption; printing one string in both is a number said twice.  The chip
       takes the magnitude — which is all a 7.5 px seat inside a 48 px dial can hold — and the
       line under the cap takes the whole reading with its unit. */
    const t = q.spec.text();
    if(rec.kind==='audio' && (key==='attack'||key==='release'||key==='peakHold'))q.k.dial.setAttribute('aria-label',(audBands.get(rec.id)||'level').toUpperCase()+' '+(key==='peakHold'?'HOLD':key.toUpperCase()));
    if (q.k.arc && q.k.arc.chip) q.k.arc.chip.textContent = q.spec.short ? q.spec.short() : t.split(' ')[0];
    q.k.val.textContent = t;
    q.k.dial.setAttribute('aria-valuenow', String(Math.round(100 * u)));
    q.k.dial.setAttribute('aria-valuetext', t);
  }
  const syncKnobs = (rec) => { for (const key in rec.knobs) paintKnob(rec, key); };

  let lastPaint = 0, paintCalls = 0, paintRuns = 0, paintMs = 0;
  function paint(force) {
    const t = performance.now();
    paintCalls++;
    if (!force && t - lastPaint < 33) return false;      // 30 Hz is plenty for a number to be read at
    lastPaint = t;
    const T = M.transport;
    if (nativeRate) nativeRate.set(registry.state('transport.rate').current);

    /* ── the transport strip ── */
    const playing = clock.isPlaying();
    if (transport.xport.dataset.face !== (playing ? 'pause' : 'play')) {
      transport.xport.dataset.face = playing ? 'pause' : 'play';
      transport.xport.innerHTML = playing ? SVG_PAUSE : SVG_PLAY;
    }
    transport.xport.classList.toggle('on', clock.isRunning());
    transport.tempoNum.textContent = T.bpm.toFixed(T.bpm < 100 ? 1 : 0);


    transport.tempoHz.textContent = (T.bpm / 60).toFixed(2) + ' Hz';
    transport.sync.textContent = M.syncMode() === 'wall' ? 'WALL' : 'FREE';
    transport.sync.classList.toggle('on', M.syncMode() === 'wall');
    const hz = port.cadence ? port.cadence() : 60;
    transport.cad.textContent = hz + ' HZ';
    transport.cad.classList.toggle('on', hz === 120);
    transport.holds.forEach((b, i) => {
      const on = !!T.hold && T.holdNote === HOLD_NOTE[i];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('on', on);
      b.classList.toggle('held', on);
    });
    const nd = M.dormantCount();
    foot.dead.textContent = '⊘ ' + nd;
    foot.dead.classList.toggle('off', nd === 0);
    /* WAVE 98 · AND THE LANE IS RE-PLACED WHEN THAT NUMBER MOVES.  `sizeLaw.workBars` takes `dead` as
       an INPUT and adds 46 px of extension for the warning, but `place()` only ever ran on a card
       event — so a route going dormant un-hid a 44-px chip into a bar that was still sized for none,
       and `overflow: hidden` cut 39 px of it off (measured).  This is the one moment the law's own
       input changes without a card moving. */
    if (nd !== lastDead) { lastDead = nd; place(); }

    /* ── the macro rail ── */
    for (const m of M.macroList()) {
      const rec = macRows.get(m.id); if (!rec) continue;
      const src = m.sourceId ? M.sourceOf(m.sourceId) : null;
      const shownDepth = m.masterDepth;
      if (force) {
        rec.vname.textContent = m.name;
        rec.root.classList.toggle('m2locked', !!m.sourceId);
        rec.root.style.setProperty('--m2-slot-ink',
          !src ? 'var(--m2-ink-faint)' : src.kind === 'env' ? 'var(--m2-env-ink)' : 'var(--acc)');
        rec.drive.textContent = src ? (src.kind.toUpperCase() + ' ' + (src.label || src.id)) : 'HAND';
        rec.depthArc.style.strokeDasharray = clamp01(shownDepth).toFixed(4) + ' 1';
        rec.numSeat.classList.toggle('m2zero', shownDepth <= 1e-6);
        rec.numSeat.setAttribute('aria-disabled','false');
        if(rec.val)rec.val.setAttribute('aria-disabled',String(!!m.sourceId));
        rec.numSeat.title = 'Master depth for ' + m.name;
      }
      if (rec.kind === 'trigger') {
        rec.signal.style.setProperty('--hit', M.triggerLevel(m.id).toFixed(4));
        rec.vnum.textContent = M.subCountOfTrigger(m.id) + ' SUB';
      } else {
        rec.signal.style.setProperty('--fill', clamp01(m.value).toFixed(4));
        rec.vnum.textContent = (100 * m.value).toFixed(0) + '%';
      }


      aria(rec.numSeat, 'MACRO '+rec.index+' DEPTH', 0, 100, 100*shownDepth, (100*shownDepth).toFixed(0)+'%');
      if (rec.val) aria(rec.val, m.name + ' value', 0, 100, 100 * m.value, rec.vnum.textContent);
    }

    /* ── the device rack ── */
    for (const s of devOrder()) {
      const rec = devRows.get(s.id); if (!rec) continue;
      const dev = rec.dev, g = rec.g;
      if (force) {
        dev.root.classList.toggle('m2off', !s.on);
        dev.pow.setAttribute('aria-pressed', s.on ? 'true' : 'false');
        dev.bank.btn.classList.toggle('on', s.bank === 'B');
        dev.bank.A.classList.toggle('on', s.bank === 'A');
        dev.bank.B.classList.toggle('on', s.bank === 'B');
      }


      const macros = M.macroList();
      const heldIx = macros.findIndex((m) => m.sourceId === s.id);
      const heldBy = heldIx >= 0 ? macros[heldIx] : null;
      if (force && dev.mac) dev.mac.textContent = heldBy ? String(heldIx + 1) : '--';
      if (dev.bus) {
        const f = s.triggerId ? fireSources().find((q) => q.id === s.triggerId) : null;
        dev.bus.textContent = f ? f.label : '--';
        dev.bus.classList.toggle('m2bushit', !!(f && f.hit));   /* a signal binding, not a hand one */
      }
      if (force && dev.lfoWave) dev.lfoWave.textContent = shapeLabel(s);
      if (dev.envStage) dev.envStage.textContent = stateOf(s);
      const outs = outsOf(s);
      if (dev.status) {
        dev.status.main.classList.toggle('on', s.on && stateOf(s) !== 'IDLE' && stateOf(s) !== 'OFF');
        dev.status.text.textContent = stateOf(s);
        dev.status.out.textContent = s.out.toFixed(2) + ' · ' + pad2(outs) + ' OUT';
      }
      /* the folded strip's bay */
      if (dev.meterFill) dev.meterFill.style.height = pct(s.out);
      if (force && dev.minName) dev.minName.textContent = s.label || s.kind.toUpperCase();
      if (dev.minOut) dev.minOut.textContent = stateOf(s);
      if (force && dev.minNum) dev.minNum.textContent = heldBy ? String(M.macroList().filter((m) => m.kind !== 'trigger').indexOf(heldBy) + 1) : '--';
      if (dev.envMinProgFill) dev.envMinProgFill.style.height = pct(s.kind === 'env' && s.timeScale > 0 ? s.t / s.timeScale : 0);
      if (force && dev.compactLfo) { dev.compactLfo.shapeValue.textContent = shapeLabel(s);
                            dev.compactLfo.macroValue.textContent = heldBy ? heldBy.name : '--'; }


      if (s.kind === 'env' && modeOf(s.id) === 'C') {
        const want = Math.min(M.ENV_MAX_S, Math.max(0.25, envDrawn(s) * 1.15));
        if (Math.abs(want - s.timeScale) > 1e-3) M.setSource(s.id, { timeScale: want });
      }
      /* WAVE 97 · THE STRIP IS PAINTED ABOVE THE GUARD, AND THAT IS ALSO A FIX.  Everything below the
         next line is skipped for a device with no editor box — which is precisely a MINIMISED one — so
         `.m2lfominshape` has never been repainted while folded: a folded LFO showed whatever shape it
         held when it was last expanded, for as long as it stayed folded.  The new indicator is painted
         here, ABOVE the guard, so a folded strip is live. */
      paintMinTrace(rec, s, force);
      if (rec.kind === 'audio') paintAudio(rec);
      if (force) {
        /* 2026-09-24 · CLOSED IS `display: none`, so the read below could only answer 0 → `g.sig = ''` — the same
           outcome, now without the forced layout it cost (optimization LB1, AUDIT-D FD5(a)).  Placed here and
           nowhere earlier: the compact ENV's timeScale fit above is a MODEL write that saved projects carry, and the
           strip, the audio face and the house-knob rings (after this loop) all keep painting while closed. */
        if (!P.open) { g.sig = ''; continue; }
        const w = Math.round(g.box.clientWidth), h = Math.round(g.box.clientHeight);
        if (!(w > 8 && h > 8)) { g.sig = ''; continue; }        // folded, closed, or not laid out yet
        const sig = sigOf(s, w, h);
        if (sig !== g.sig) { g.sig = sig; render(rec); paintPresetGlyphs(rec); }
      } else if (!g.sig) continue;
      const x = g.X(headU(s)).toFixed(2);
      dev.ed.play.setAttribute('x1', x); dev.ed.play.setAttribute('x2', x);
      dev.ed.pdot.setAttribute('cx', x); dev.ed.pdot.setAttribute('cy', g.Y(s.out).toFixed(2));
      if (force && dev.minWavePath) dev.minWavePath.setAttribute('d', minShapeD(s));
    }

    /* ── the routing overlays ── */
    if (force) paintRings(routeIndex());
    paintRuns++; paintMs += performance.now() - t;
    return true;
  }

  /** THE GLYPH IS THE PRESET ITSELF, sampled — a button can never draw a shape the engine
   *  would not produce — and it is redrawn MIRRORED when the mirror is what is loaded. */
  function paintPresetGlyphs(rec) {
    const s = rec.s, dev = rec.dev;
    if (dev.kind !== 'lfo') return;
    for (const name of SHAPES) {
      const q = dev.presets[name]; if (!q) continue;
      const curve = s.shapeMode === 'curve' ? s.points : null;
      const base = presetPoints(name), mir = presetMirror(name);
      const isBase = !!curve && pointsEqual(curve, base), isMir = !!curve && pointsEqual(curve, mir);
      const poly = polyOf(isMir ? mir : base, 22);
      let d = '';
      for (let i = 0; i < poly.length; i++) d += (i ? 'L' : 'M') + (3 + poly[i][0] * 34).toFixed(1) + ' ' + (3 + (1 - poly[i][1]) * 20).toFixed(1);
      q.path.setAttribute('d', d);
      q.btn.classList.toggle('on', isBase || isMir);
      q.btn.setAttribute('aria-pressed', isBase || isMir ? 'true' : 'false');
      q.btn.classList.toggle('mirrored', isMir);
    }
    if (dev.compactLfo && dev.compactLfo.shapePath) dev.compactLfo.shapePath.setAttribute('d', cmpShapeD(s));
  }
  const shapePath = (s, w, h) => {
    const poly = polyOf(editPoints(s) || [{ t: 0, v: 0.5, tension: 0 }, { t: 1, v: 0.5, tension: 0 }], 26);
    let d = '';
    for (let i = 0; i < poly.length; i++) d += (i ? 'L' : 'M') + (poly[i][0] * w).toFixed(1) + ' ' + ((1 - poly[i][1]) * h).toFixed(1);
    return d;
  };
  const minShapeD = (s) => (s.kind === 'env' || s.kind === 'audio' ? '' : shapePath(s, 100, 100));
  const cmpShapeD = (s) => shapePath(s, 52, 14);

  /* ═══ SYNC — the cheap half of a rebuild: what moved without the LIST moving ════════════ */
  function sync() {
    if (nativeRate && port.registry.has('transport.rate')) nativeRate.set(port.registry.state('transport.rate').current);
    for (const s of devOrder()) {
      const rec = devRows.get(s.id); if (!rec) continue;
      const dev = rec.dev;
      for (const [key, b] of Object.entries(dev.checks)) {
        const on = key === 'gate' ? s.gateMode === 'gate' : !!s[key];
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.classList.toggle('on', on);
      }
      if (dev.sw.trig) { dev.sw.trig.setAttribute('aria-pressed', s.trig ? 'true' : 'false'); dev.sw.trig.classList.toggle('on', !!s.trig); }
      if (dev.sw.off) { dev.sw.off.setAttribute('aria-pressed', s.trig ? 'false' : 'true'); dev.sw.off.classList.toggle('on', !s.trig); }
      if (dev.compactLfo) for (const [key, b] of Object.entries(dev.compactLfo.toggles)) {
        b.setAttribute('aria-pressed', s[key] ? 'true' : 'false'); b.classList.toggle('on', !!s[key]);
      }
      syncKnobs(rec);
      rec.say = '';
    }
    paint(true);
  }

  function rebuild() {
    rebuildCatalogue();
    rebuildMacros();
    rebuildDevices();
    dressGlass();                       // wave 74: a device built after boot gets the house glass too
    seatCurveName();                    // wave 84: …and its curve name sits on its plot
    seatRailHead();                     // wave 89: the macro rail folds like a device
    M.syncDormant((id) => registry.has(id));
    /* WAVE 105 · TWO THINGS A REBUILD MUST TELL.  The chips, because adding or removing a card
       changes whether "all compact" is still true; and the HOST, because a newly built AUDIO
       device is born unarmed and `audioDemand` is dead until something arms it (rack.js:655). */
    syncChips();
    if (port.audio && port.audio.sync) port.audio.sync();
    place(); sync(); syncRings();
  }

  /* THE PICKER IS THE REGISTRY'S: its own register / unregister events rebuild the overlays,
     so a control registered after this window was built is routable with no edit here. */
  const off = registry.subscribe('*', (ev) => {
    if (ev.reason === 'register' || ev.reason === 'unregister') { rebuildCatalogue(); syncRings(); return; }
    if (ev.reason === 'modulated') return;      // the ring is anchored to the BASE; output moves nothing
    paintRings();
  });

  /* A CARD WITH NO WIDTH CANNOT BE DRAWN.  The window ships closed and a card folds, so the
     size itself is the trigger. */
  let ro = null;
  if (typeof ResizeObserver === 'function') {
    /* WAVE 76 · THE LANE IS RE-PLACED WHEN THE DEVICES MOVE, and it has to be.  The tempo bar's
       right edge is now MEASURED off the last device card, and `place()` runs once — at open, and
       again only when something calls it.  A card added, removed, folded or switched between FULL and
       COMPACT changes that edge without going through `place()`, so the bar would keep the edge it
       was born with.  This observer already fires on exactly those events.
         IT IS DIRTY-CHECKED, because `place()` writes the window's own width and height and an
       unguarded re-entry here is the classic ResizeObserver loop ("undelivered notifications").  The
       check is the ONE number the lane depends on: re-place only when the measured edge actually
       moved, so a settled layout costs one rect read per notification and nothing else. */
    let lastEdge = -1;
    const laneEdge = () => {
      if (!rackEl.run) return -1;
      const cards = rackEl.run.querySelectorAll('.m2dev');
      const el2 = cards.length ? cards[cards.length - 1] : rackEl.run;
      return Math.round(el2.getBoundingClientRect().right);
    };
    ro = new ResizeObserver(() => {
      if (!P.open) return;
      const e = laneEdge();
      if (e !== lastEdge) { lastEdge = e; place(); paint(true); }   // 2026-09-11: only a moved lane edge earns a forced repaint; a resize that changed nothing gets the throttled one
      else paint(false);
    });
    ro.observe(panel);
  }

  /* ═══ OPEN · CLOSE · PERSIST ════════════════════════════════════════════════════════════ */
  let persistFn = port.persist || (() => {});
  const persist = () => persistFn(presentation());
  function presentation() {
    return { x: P.x, y: P.y, lane: P.lane, ribbon: P.ribbon, modes: { ...P.modes }, audioMini: { ...P.audioMini }, open: P.open,
      folder: { ...P.folder }, macroSide: P.macroSide, macroMin: P.macroMin, selectedMacro: selMacro, selectedSource: selSource,
      audioBands: Object.fromEntries(audBands), audioRoutes: Object.fromEntries(audRoutes) };
  }
  /* WAVE 105 · THE CHIPS TOLD THE TRUTH ONLY UNTIL A RELOAD.  `.on` and `aria-pressed` were
     written by the three click handlers and by nothing else, so a window restored with the
     work lane on top, the ribbon out, or every card compact came back with all three chips
     reading OFF — and the screen reader read them as OFF.  Wave 101 made this worse, not
     better: a compact rack whose chip says otherwise inherits the wrong seat. */
  function syncChips() {
    const all = devOrder();
    const cmp = all.length > 0 && all.every((x) => modeOf(x.id) !== 'F');
    for (const [chip, on] of [[chips.compact, cmp], [chips.ribbon, P.ribbon]]) {
      if (!chip) continue;
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      chip.classList.toggle('on', on);
    }
    syncWorkbarChip();
  }
  function restore(o) {
    if (!o) return;
    if (Number.isFinite(o.x)) { P.x = o.x; P.y = o.y; placed = true; }   // a remembered position is a hand's
    P.lane = WORK_LANES.includes(o.lane) ? o.lane : 'bottom';
    setWorkLane(panel, P.lane);
    P.ribbon = !!o.ribbon; rackEl.root.classList.toggle('m2ribbon', P.ribbon);
    for (const bag of [P.modes, P.audioMini, P.folder, saved]) for (const key of Object.keys(bag)) delete bag[key];
    audBands.clear(); audRoutes.clear();
    if (o.modes) { Object.assign(P.modes, o.modes); Object.assign(saved, o.modes); } // live project rows read P; boot-time rows claim saved once
    if (o.audioMini) for (const [id, mode] of Object.entries(o.audioMini)) if (mode === 'all') P.audioMini[id] = mode;
    if (o.audioBands) for (const [id, band] of Object.entries(o.audioBands)) if (M.AUDIO_FOLLOWED.includes(band)) audBands.set(id, band);
    if (o.audioRoutes) for (const [id, band] of Object.entries(o.audioRoutes)) if (M.AUDIO_FOLLOWED.includes(band) || band === 'hit') audRoutes.set(id, band);
    selMacro = typeof o.selectedMacro === 'string' && M.macroOf(o.selectedMacro) ? o.selectedMacro : null;
    selSource = typeof o.selectedSource === 'string' && M.sourceOf(o.selectedSource) ? o.selectedSource : null;
    if (o.folder) Object.assign(P.folder, o.folder);
    setMacroSide(o.macroSide === 'right' ? 'right' : 'left');
    P.macroMin = !!o.macroMin; root.querySelector('.m2rail').classList.toggle('m2railmin', P.macroMin);root.querySelector('.m2railhead').setAttribute('aria-expanded',String(!P.macroMin));
    for (const s of devOrder()) { const r = devRows.get(s.id); if (r) { setDeviceMode(r.dev, modeOf(s.id)); if (r.syncMiniMeter) r.syncMiniMeter(); } }
    syncChips();
    if (o.open) open();
    else close();
  }
  function open() {
    P.open = true;
    root.hidden = false; rail.hidden = false;
    if (port.opened) port.opened();
    rebuild(); place(); paint(true);
    persist();
    return true;
  }
  function close() {
    /* Closing releases only the preview's presentation demand. Routed modulation remains machinery
       and the host clock keeps it running; an unrouted source no longer burns frames for a hidden graph. */
    P.open = false;
    if (port.closed) port.closed();
    root.hidden = true; rail.hidden = true;
    /* WAVE 105 · a closed window may not leave a sheet floating.  The two PICKERS were the pair
       `closePop/closePresets/closeDead` never covered. */
    devPickOpen = false; if (pick && pick.root) pick.root.hidden = true;
    macroPickOpen = false; if (mpick && mpick.root) mpick.root.hidden = true;
    closePop(); closePresets(); closeDead();
    if (matrix.open) closeMatrix();
    persist();
    return true;
  }
  root.hidden = true; rail.hidden = true;

  /* ═══ THE API — what the gates read, and the one door a proof drives ════════════════════ */
  const api = {
    /* 2026-09-10 · THE TRANSPORT'S MINIATURE RAIL USES THIS WINDOW'S OWN GESTURES, not copies of them:
       the routing grip (drag to route, tap to arm), the numbered depth seat (vertical drag, keys,
       double-tap to 100 %) and the rail's reorder. One code path, two faces. */
    wireGrip: (grip, macroId) => wireGrip(grip, macroId),
    wireDepth(seat, macroId, n) {
      const input = {
        get: () => (M.macroOf(macroId) || { masterDepth: 1 }).masterDepth,
        set: (v) => { M.setMacro(macroId, { masterDepth: clamp01(v) }); apply(); paint(true); },
        reset: () => { M.setMacro(macroId, { masterDepth: 1 }); apply(); paint(true); },
        axis: 'y', editable: () => true
      };
      wireSlider(seat, input); bindSliderKeys(seat, input);
      seat.title = 'Master depth for this macro. Double-tap for 100%.';
      aria(seat, 'MACRO ' + n + ' DEPTH', 0, 100, 100 * input.get(), '100%');
    },
    paintDepth(seat, arc, macroId) {
      const m = M.macroOf(macroId); if (!m) return;
      arc.style.strokeDasharray = clamp01(m.masterDepth).toFixed(4) + ' 1';
      seat.classList.toggle('m2zero', m.masterDepth <= 1e-6);
      seat.setAttribute('aria-valuenow', String(Math.round(100 * m.masterDepth))); seat.setAttribute('aria-valuetext', Math.round(100 * m.masterDepth) + '%');
    },
    moveMacro: (id, to) => { M.moveMacro(id, to); apply(); rebuildMacros(); },
    rebuildMacros: () => rebuildMacros(),
    targets: () => registry.describe(),
    picker: () => registry.describe().map((d) => d.id),
    macros: () => M.macroList().map((m) => ({ id: m.id, name: m.name, kind: m.kind, value: m.value, depth: m.masterDepth, source: m.sourceId })),
    sources: () => devOrder().map((s) => ({ id: s.id, kind: s.kind, on: s.on, out: s.out })),
    routes: () => M.routeList().map((r) => ({ id: r.id, macro: r.macroId, target: r.targetId, min: r.min, max: r.max, bi: !!r.bi, dormant: r.dormant })),
    span: spanOf,
    selected: () => selectedMacro(),
    select: (id) => { selectMacro(id); return selectedMacro(); },
    drops: () => [...document.querySelectorAll('.k[data-param]')].map((k) => k.dataset.param).filter((id) => registry.has(id)),
    arming: () => (armed ? { macro: armed.macroId, mode: armed.mode, over: armed.over ? armed.over.dataset.param : null } : null),
    defaultRange: (id) => (registry.has(id) ? defaultRange(id) : null),
    ring(id) {
      const rec = rings.get(id); if (!rec) return null;
      const st = registry.state(id), er = editRouteOf(id), sp = er ? routeSpan(er) : null;
      const q = routeIndex().get(id) || EMPTY_SPAN;
      return { id, wrap: st.wrap, baseNorm: st.baseNorm,
               edit: rec.edit.getAttribute('d') || '', stack: rec.stack.getAttribute('d') || '',
               tick: rec.tick.getAttribute('d') || '', spur: rec.spur.getAttribute('d') || '',
               route: er ? er.id : null, macro: er ? er.macroId : null, bi: er ? !!er.bi : null,
               depth: sp ? sp.d : null, lo: st.baseNorm + q.lo, hi: st.baseNorm + q.hi,
               dormant: rec.svg.classList.contains('is-dormant'),
               valText: (rec.dial.parentElement.querySelector('.k-val') || {}).textContent || '',
               dragging: rec.dial.parentElement.classList.contains('ring-drag') };
    },
    rings: () => [...rings.keys()],
    pop: (id, x, y) => { openPop(id, x === undefined ? 40 : x, y === undefined ? 40 : y); return !!popEl; },
    popState: () => (popEl ? { range: [...popEl.querySelectorAll('.seg-b')].filter((b) => b.classList.contains('on')).map((b) => b.textContent),
                               buttons: [...popEl.querySelectorAll('.trig .trig-l')].map((b) => b.textContent),
                               routes: [...popEl.querySelectorAll('.mod-mchip')].map((b) => b.textContent + (b.classList.contains('on') ? '*' : '')) } : null),
    closePop,
    reach: (id) => (registry.has(id) ? reachText(id) : null),
    cards: () => devOrder().map((s, i) => ({
      i, id: s.id, kind: s.kind, label: s.label, name: s.label || s.id, on: s.on, bank: s.bank,
      mode: s.shapeMode, wave: s.wave, steps: s.steps, present: modeOf(s.id),
      minimized: modeOf(s.id) === 'M' })),
    /** the artifact's own geometry, read back — the acceptance table's live half */
    geometry() {
      const r = root.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), x: P.x, y: P.y,
               lawW: sizeLaw.width(cardModes(), { uiScale: 1, ribbon: P.ribbon })
                 - (P.macroMin && !P.ribbon ? GEOM.RAIL_W - MACRO_MIN_W : 0),
               lawH: sizeLaw.height({ uiScale: 1 }) - CARD_TRIM + FLOAT_ROOM, modes: cardModes(), lane: P.lane, ribbon: P.ribbon,
               rail: rail.getAttribute('aria-label'), chips: Object.keys(chips).length };
    },
    curve(id) {
      const s = M.sourceOf(id), rec = devRows.get(String(id));
      if (!s || !rec || !rec.g) return null;
      const g = rec.g, pts = g.pts;
      return { id: s.id, kind: s.kind, mode: s.shapeMode, wave: s.wave, cycles: cyclesShown(s),
        w: g.w, h: g.h, pad: PAD, sig: g.sig, steps: s.steps, levels: g.levels,
        samples: g.samples.map((a) => [a[0], a[1]]),
        points: pts ? pts.map((p) => ({ t: p.t, v: p.v, tension: p.tension })) : null,
        hash: pts ? curveHash(pts) : null,
        ptsPx: pts ? pts.map((p) => [+g.X(p.t).toFixed(3), +g.Y(p.v).toFixed(3)]) : null,
        hseg: g.hseg.slice(),
        head: +rec.dev.ed.play.getAttribute('x1'),
        dot: [+rec.dev.ed.pdot.getAttribute('cx'), +rec.dev.ed.pdot.getAttribute('cy')],
        headU: headU(s), out: s.out, drawn: s.kind === 'env' ? envDrawn(s) : null,
        caption: captionOf(s), status: rec.dev.ed.status ? rec.dev.ed.status.text.textContent + ' ' + rec.dev.ed.status.out.textContent : '',
        note: rec.dev.ed.note.textContent, say: rec.say };
    },
    at(id, t, v) {
      const rec = devRows.get(String(id)); if (!rec || !rec.g) return null;
      const b = rec.g.svg.getBoundingClientRect();
      return { x: b.left + rec.g.X(t) * b.width / rec.g.w,
        y: b.top + rec.g.Y(v) * b.height / rec.g.h,
        box: { left: b.left, top: b.top, width: b.width, height: b.height } };
    },
    shapes: (id) => { const rec = devRows.get(String(id)); if (!rec || rec.dev.kind !== 'lfo') return null;
      return SHAPES.map((name) => { const q = rec.dev.presets[name];
        return { name, on: q.btn.classList.contains('on'), mirrored: q.btn.classList.contains('mirrored'), d: q.path.getAttribute('d') }; }); },
    evalAt: (pts, u) => curveEval(pts, u),
    envMap: (id) => { const s = M.sourceOf(id); return s && s.kind === 'env' ? envMapOf(s) : null; },
    /** the KNOBS the artifact draws, read back per device */
    knobs: (id) => { const rec = devRows.get(String(id)); if (!rec) return null;
      const o = {}; for (const key in rec.knobs) o[key] = { u: rec.knobs[key].spec.get(), text: rec.knobs[key].spec.text() }; return o; },
    sync,
    read(id) {
      if (!registry.has(id)) return null;
      const st = registry.state(id), sp = spanOf(id), d = descOf(id);
      const lo = st.baseNorm + sp.lo, hi = st.baseNorm + sp.hi;
      const whole = sp.hi - sp.lo >= 1;
      return { id, base: st.base, current: st.current, modulated: st.modulated,
               baseNorm: st.baseNorm, currentNorm: st.currentNorm, whole,
               lo: whole ? d.min : registry.fromNorm(id, st.wrap ? ((lo % 1) + 1) % 1 : clamp01(lo)),
               hi: whole ? d.max : registry.fromNorm(id, st.wrap ? ((hi % 1) + 1) % 1 : clamp01(hi)),
               live: sp.live, label: d ? d.label : id };
    },
    presets: () => M.presetList().map((p) => ({ id: p.id, name: p.name, folder: p.folder, factory: !!p.factory })),
    dead: () => M.dormantRoutes().map((r) => ({ id: r.id, macro: r.macroId, target: r.targetId })),
    performance: () => ({ calls: paintCalls, paints: paintRuns, ms: paintMs, averageMs: paintRuns ? paintMs / paintRuns : 0 })
  };


  if (devOrder().length === 0) { M.addSource('lfo'); M.addSource('env'); }

  rebuild();

  return {
    root, rail, api, paint, sync, rebuild, presentation, restore, setAccent,
    /** the host's road to the window's ONE line of prose — the same seat every message takes */
    say: (t, cls) => status(t, cls),
    resumeSentence,
    open, close, toggle: () => (P.open ? close() : open()),
    get isOpen() { return P.open; },
    /** the window OPENING re-reads the model; it does not restart it */
    wake() { rebuild(); paint(true); },
    dispose() {
      off(); if (ro) { ro.disconnect(); ro = null; }
      document.removeEventListener('pointerdown', armTap, true);
      document.removeEventListener('pointerdown', popAway, true);
      document.removeEventListener('pointerdown', pickAway, true);
      window.removeEventListener('keydown', armKey, true);
      window.removeEventListener('keydown', popKey, true);
      window.removeEventListener('resize', onResize);
      if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
      audRings.clear(); audBands.clear(); audRoutes.clear();
      endArm(); closePop();
      if (ghost) { ghost.remove(); ghost = null; }
      for (const [, rec] of rings) rec.svg.remove(); rings.clear();
      root.remove(); rail.remove();
    }
  };
}
