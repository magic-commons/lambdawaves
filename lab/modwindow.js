/* modwindow.js — THE HOST SIDE OF A PORTED WINDOW.  It wires; it does not design.
 *
 * `lab/mir/modwindow/` is an ARTIFACT: BASINS' modulation window, moved here whole under
 * docs/ui/STYLE-LOCK.md's PORTED-WINDOW EXCEPTION.  Its stylesheet is 667 of 667 declaration
 * blocks byte-identical to the source's and its builder emits the source's DOM tree; neither
 * knows this app exists.  **Nothing in this file draws a control, invents a shape, or reaches
 * for the house kit.**  Every element it touches was built by `modwindow.js` in the artifact
 * directory, and every behaviour attached here is a behaviour the artifact deliberately does
 * not carry — it BUILDS AND DOES NOT WIRE (its own words), so the wiring is the host's by
 * construction, not by adaptation.
 *
 * THE ONE SENTENCE THAT MUST NOT APPEAR ANYWHERE BELOW is "the equivalent in our kit would
 * be".  Three previous passes at this port wrote it and each threw the window away.
 *
 * ── WHAT THE HOST SUPPLIES (host-contract.md PART 1, all six) ──────────────────────────────
 *   1. the id `modwin`               — unchanged; 164 selectors read it
 *   2. `title: 'MODULATION'`         — the chip rail's aria-label is built from it and 24
 *                                      rules select on the result byte for byte
 *   3. the two accent hues           — λWAVES' live palette wheel, written onto the window
 *                                      root and the rail by `setAccent()` below
 *   4. the two font names            — `lab/modhost.css`
 *   5. `--ui-scale: 1`               — the house value, already 1
 *   6. the persistence keys          — `lambdawaves.q0.settings`.`modwin`, through
 *                                      `presentation()` / `restore()`; the RACK itself rides
 *                                      in the project file, exactly as before
 *
 * ── THE FOUR EDGES (host-contract.md PART 3) ───────────────────────────────────────────────
 * `port` carries `registry` (edge 1), `targets` (edge 2), `clock` (edge 3) and `apply` — the
 * presentation callback (edge 4) — from `lab/mir/host.js`, which λWAVES has had since the MIR
 * wave.  The model is `lab/mir/mod.js`, the same singleton BASINS runs, so every control the
 * artifact draws already has a model behind it: banks, presets, holds, tap tempo, the dead-send
 * census and the whole AUDIO follower are in the file and were simply never surfaced.
 *
 * ── THE ROUTING OVERLAYS: A SPLIT, DECIDED ON EVIDENCE (see REPORT.md, wave 64) ─────────────
 * The artifact's overlays are the one part of its sheet that is NOT the window — they attach
 * into HOST controls in other windows, which is why the stager left their 39 rules unscoped.
 * ONE of the four travels and is used here: **`.m2ghost`**, the pill the finger carries.  It
 * is `position: fixed` at the pointer, it needs no room beside anything, and it is the
 * window's own material; λWAVES' `.mod-ghost` is deleted rather than shipped beside it.
 *   `.m2ring` and `.m2clr` do NOT travel, and the reason is a MEASUREMENT, not a taste: both
 * are `position: absolute; left: 100%; margin-left: 3px` with a 44 px `::before` band centred
 * on a 26 px box.  BASINS' routed controls stand in a window with room to their right; ours
 * are 34 px dials in 62 px cells packed three and four across a 286 px rack row, so `left:
 * 100%` puts the band on the NEXT knob.  On top of that, wave 61 built the arc Josh asked for
 * in writing ("the coloured arc AROUND the knob changes the arc length") with three things
 * BASINS' ring cannot express: CENTRE / UP / DOWN (the `bi` flag that cost five forced edits
 * in mod.js), the overflow SPUR, and a 360° ring for a WRAP dial.  `.m2clr`'s job — remove —
 * is the arc's double-tap and the popover's REMOVE / REMOVE ALL.
 *   `.m2span` does not travel either: our arc already draws the excursion ON the dial, and
 * two bands on one dial is the failure this wave was warned about.
 *   `[data-m2target].m2droppable / .m2drop` does not travel as PAINT — it is two outline
 * rules, where ours lights every valid target, marks a DUPLICATE differently, marks the one
 * under the pointer, and recedes every other control to .45, which is the whole answer to
 * "there is no hover on a touch screen".  The ATTRIBUTE is stamped anyway: `data-m2target`
 * is the artifact's own word for "this control is routable", and nothing is renamed.
 *   Every rule named above is still in the sheet, unscoped and intact — including `.m2clr`'s
 * copied-broken transparency, which the gate builds one button to prove.
 *
 * ── THE THREE DEFECTS THIS PORT INHERITED, AND WHERE EACH DIES ──────────────────────────────
 *   1. the ENV drag destroying two stages — `wireEditor` latches the KEY, not the index, at
 *      pointerdown (`down.key`), so a drag that takes `hold` to zero cannot re-mean index 2
 *   2. the grip's double-tap firing zero times — `reset()` runs on EVERY pointerup, before the
 *      arm/disarm branch decides anything, so the second tap is the second tap
 *   3. FIT not framing a GATE envelope — FIT frames `envDrawn(s)`, which is what `envPoints`
 *      actually draws (`a + hold + d + r`, always), and `gateMode` is in the render signature
 *      so the caption cannot go stale.  A stage clamped at t = 1 keeps its seconds, because
 *      `envMove` writes the KNOB and never re-reads the clamped point.
 */
import { el, seg, trig, knob, tapWatcher } from './kit.js';
import { bindSliderKeys } from './slider-keys.js';
import { glyphEl } from './mir/glyph.js';                    // wave 75: the rail chip's ink is a drawing, never a character
import { createModWindow, buildChipRail, setDeviceMode, setWorkLane, sizeLaw, GEOM,
         SVG_PLAY, SVG_PAUSE, buildGhost, buildAudioSheet, COPY } from './mir/modwindow/modwindow.js';
import { evaluate as curveEval, curveHash, curveInfo, presetPoints, presetMirror,
         pointsEqual, PRESET_LABEL } from './mir/curve.js';

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
const TAP_MS = 420, TAP_PX = 10, DTAP_MS = 450, TENSION_PX = 114, GRAB = 20;

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

/* ── WAVE 65 · THE THREE CHIPS ARE THE RESUME LAW, AND THEY SAY SO ──────────────────────────────
 * Josh: "inside the modulation window there are already useful buttons to link these behaviours to:
 * ANCH, TRIG, and BPM (from which BPM has WALL/FREE)."  Nothing was added to the artifact's card to
 * carry that — its layout is not ours (docs/ui/STYLE-LOCK.md, THE PORTED-WINDOW EXCEPTION) — so the
 * meaning goes where a meaning belongs: on the control it is about.  `mir/host.js`'s `resumeGrid` is
 * the law; these are its sentences, and the window re-derives none of its arithmetic. */
const CHECK_HINT = {
  sync: 'BPM \u2014 this LFO\u2019s rate is a NOTE on the loop clock rather than a free Hz, so its divisions line up with the global grid. It also decides the RESUME: press play between notes and the beat jumps BACK to the note boundary just passed, so the cycle starts where a cycle starts. WALL and FREE on the strip are its two flavours \u2014 under WALL the beat is the phase and the jump is a beat move; under FREE the phase is this source\u2019s own and the play edge floors it. Same resume, two mechanisms',
  anchor: 'ANCHOR \u2014 the phase is DERIVED from the beat rather than accumulated, in both sync modes. It is also the RESUME that holds: a pause catches the curve somewhere and the play button carries on from exactly there, to the double, however long the transport was down. One ANCHOR anywhere in the rack holds the beat still for the whole rack, so the BPM sources beside it continue rather than jumping back \u2014 the beat is one number and can only obey one law',
  invert: 'read the shape upside down: 1 \u2212 v, after the curve and before SMOOTH and STEPS',
  triplet: 'the note ladder \u00d7 2/3 \u2014 three in the space of two',
  dotted: 'the note ladder \u00d7 3/2 \u2014 a note and a half',
  gate: 'GATE: the envelope holds its sustain while the trigger is held and releases on the lift; one-shot runs the whole shape from a single hit'
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

  /* ── THE ARTIFACT, BUILT ───────────────────────────────────────────────────────────────── */
  const root = createModWindow({
    /* COPY customizes audio's face while the ported files stay frozen. */
    copy: { factory: 'FACTORY', knobs: {...COPY.knobs, audio:[['sens','GAIN','-24','+24'],['attack','ATTACK','0','60s'],['release','RELEASE','0','60s']]},
      audioSheetRows:[['out','BAND'],['lower','LOWER'],['upper','UPPER'],['att','ATTACK'],['rel','RELEASE'],['gate','NOISE GATE'],['thresh','GATE dB'],['hold','GATE HOLD'],['hyst','HYST'],['flux','HIT SENSE']] }
  });
  host.appendChild(root);
  const rail = buildChipRail(root, {});
  dressGlass();                         // wave 74: the boot pass; rebuildDevices' callers do the rest
  seatCurveName();
  seatRailHead();

  /* ── WAVE 75 · THE ADD CONTROL IS A RAIL CHIP ───────────────────────────────────────────────
     JOSH: "Move and change the add plug in to be like another 'chip' or button on the left side of
     the window … Use the 'X' glyph from the chip and just rotate it 45 degrees and center it.
     Insert the chip in between the drag chip and the minimize chip.  Hitting the plus sign will
     show the drop down menu where it's at."
       The artifact's own `.m2add` is a button INSIDE the device run, which is why it drifted around
     the layout as devices came and went.  The rail is where this window's verbs already live, so the
     verb moves there.  The chip is built exactly as `buildChipRail` builds its own — same classes,
     same dataset keys, same 26-px drawing — so every one of the five chip-rail rules in
     modwindow.css reaches it without a single new selector.
       THE MARK IS THE CLOSE GLYPH TURNED 45°, which is Josh's own instruction and is also the
     honest one: a `+` as a text character is a request to whatever font the device resolves (the
     reason glyph.js exists at all), while the X is already a drawn, vendored path — rotate it an
     eighth turn and it IS a plus, at the same weight and the same optical centre as its neighbours.
       The rail's DOM order is close · compact · workbars · ribbon · drag, and `ribbon` wears the
     `leave` bar — the minus-looking one Josh means by "the minimize chip" — so inserting before the
     grip puts the chip exactly between the two he named. */
  const railChips = (root.modwindow && root.modwindow.chiprail && root.modwindow.chiprail.chips) || {};
  const addChip = document.createElement('button');
  addChip.type = 'button';
  addChip.className = 'kwin-tab crail-chip m2addchip';
  addChip.dataset.rail = 'add';
  addChip.dataset.chromeKind = 'action';
  addChip.dataset.reopensWindow = 'false';
  addChip.dataset.ink = 'close';
  addChip.setAttribute('aria-label', 'Add a modulation device — an LFO or an envelope');
  addChip.setAttribute('aria-expanded', 'false');
  addChip.title = 'add a modulation device — an LFO or an envelope';
  { const ink = glyphEl('close', 'crail-ink gly-close', 26); if (ink) addChip.appendChild(ink); }
  if (railChips.drag && railChips.drag.parentNode === rail) rail.insertBefore(addChip, railChips.drag);
  else rail.appendChild(addChip);
  const mw = root.modwindow;
  const panel = mw.panel, foot = mw.foot, transport = mw.transport, rackEl = mw.rack;

  /* THE STATUS LINE IS THE WINDOW'S OWN HINT ROW.  `.m2hint` is where BASINS prints the
     window's one sentence of instruction; a transient message takes that seat and the
     artifact's copy comes back verbatim when it clears — no second surface, nothing added. */
  /* ══ WAVE 105 · THE WINDOW COULD NOT SPEAK ═══════════════════════════════════════════════════
   * Two independent reviews found the same thing: `.m2hint` (reach 22) and `.m2note` (reach 35) are
   * both `display: none`, and between them they are the ONLY surfaces this file writes to — 29
   * `status()` sites and 25 `say()` sites, every one of them computing a sentence into a hidden node.
   * So SAVE with an empty name did nothing, ARM said nothing, "every macro is already driven" said
   * nothing, and the microphone's refusal — the one message a user cannot act without — said nothing.
   *   JOSH'S TWO RULINGS STAND: he removed the permanent hint line ("nine-pixel prose across the foot
   * of an instrument") and the text inside the curve windows, and neither is coming back.  What he
   * objected to was FURNITURE — prose sitting on the glass whether or not it had anything to say.  A
   * refusal is not furniture.  So the hint seat is shown ONLY while it carries a real message and
   * fades when the message expires: nothing at rest, a sentence when the instrument needs to answer.
   *   It is also the window's live region, so a screen reader hears the refusal it can otherwise only
   * infer from a control that did nothing. */
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
       IT STILL OPENS NOTHING.  Adding the device does not touch the microphone; its own MIC button
     does, once, on a press.  See lab/audio.js's header for the whole privacy story. */
  if (pick.btns.audio && !port.audio) {
    pick.btns.audio.disabled = true;
    pick.btns.audio.setAttribute('aria-disabled', 'true');
    pick.btns.audio.title = 'this host supplies no audio capture, so an AUDIO device would have nothing to follow';
  } else if (pick.btns.audio) {
    pick.btns.audio.title = 'add an AUDIO follower — four bands and an onset, from this machine’s microphone. Adding it opens nothing; its own MIC button asks for the microphone when you press it';
  }

  /* ── PRESENTATION STATE.  The window's own, never the model's, never the project's. ────── */
  const P = { x: 0, y: 0, lane: 'bottom', ribbon: false, modes: {}, open: false, folder: {}, macroSide: 'left', macroMin: false };
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

  const CARD_TRIM = 32, FLOAT_ROOM = 6;
  /* ═══ THE GEOMETRY IS ARITHMETIC.  `sizeLaw` never measures the live window. ════════════ */
  const devOrder = () => M.sourceList().filter((s) => s.kind !== 'audioout');
  const modeOf = (id) => { if (P.modes[id]) return P.modes[id] === 'C' ? 'C' : P.modes[id] === 'M' ? 'M' : 'F';
    const s = M.sourceOf(id); return s && s.minimized ? 'M' : 'F'; };   /* the model's own folded flag, when the window has said nothing */
  const cardModes = () => devOrder().map((s) => modeOf(s.id));

  function place() {
    if (root.querySelector('.mod-matrix[open]')) return;
    const lawW = sizeLaw.width(cardModes(), { uiScale: 1, ribbon: P.ribbon }) - (P.macroMin && !P.ribbon ? 112 : 0);
    const h = sizeLaw.height({ uiScale: 1 });
    const vw = window.innerWidth, vh = window.innerHeight;
    /* ── WAVE 100 · THE WINDOW MAY NOT GROW PAST THE SCREEN ──────────────────────────────────────
       JOSH: "sometimes adding a new device to the plugin makes all the devices invisible all of a
       sudden, (the window remains fixed in size)."
         REPRODUCED, and it is not invisibility — it is unbounded width.  `sizeLaw.width` adds a whole
       card (360 + 7) per device and NOTHING clamped the result: measured on a 1600-px viewport, two
       cards give 1083 and seven give 2918, while `placed` holds the left edge still at x = 259.  So
       the window's right edge ends up 1577 px off-screen and every card but the first is past the
       edge of the display — which from the outside is exactly "the devices disappeared and the window
       stayed the same".
         THE LAW IS NOT CHANGED, because the law is the artifact's and the acceptance table measures
       it — `api.geometry()` still reports `lawW` beside the measured width.  What changes is that the
       HOST refuses to paint a window wider than the screen it is on, and `.m2run` then does the job
       the artifact built it for: it has been `overflow-x: auto` with a hidden scrollbar since the
       port, and it never scrolled only because it was always given room for every card at once. */
    const w = Math.min(lawW, vw - 16);
    /* IT STAYS CENTRED UNTIL A HAND MOVES IT.  The window grows and shrinks with the rack — a
       card added is 367 px of new width — and a first appearance that was centred on one card
       and then grew off the right edge is a window nobody can reach the close chip of. */
    /* ⚠ WAVE 93 · CENTRED ONCE, THEN NEVER AGAIN — and the missing `placed = true` is the whole of
       what Josh saw: "when the window resizes in length, they shouldn't resize towards the center."
       `placed` only became true on a DRAG or a restore, so until a hand had moved the window every
       call re-centred it — and `place()` runs on every card added, removed, folded or minimised.  The
       window therefore crept left as it grew and right as it shrank, which reads as resizing from the
       middle.  It is centred on its FIRST appearance, which is the behaviour the paragraph above
       actually describes, and after that the left edge is fixed and the right edge does the moving. */
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
    /* ── WAVE 75 · THE LANE, AND THE TWO THINGS JOSH ASKED OF IT ────────────────────────────────
       "Have the preset bar and Tempo bar never overlap over each other.  Preset bar's left edge
       always lines up with macro's left edge."
         `workBars` RIGHT-ALIGNS the tempo bar to the window (`left = right - TIMING_W`) while the
       preset bar sits at the artifact's `left: 0`, and it derives the preset bar's width from a
       VIEWPORT coordinate.  Both are correct for a window at least 294 + 7 + 450 wide; below that —
       which is every window with no devices in it, and that is the state Josh screenshotted — the two
       boxes are laid on top of one another and the preset name prints through the tempo buttons.
         So the lane is stated in ONE frame of reference, the foot's own, and measured rather than
       assumed: the preset bar starts exactly where the MACRO RAIL starts (a rect difference, so it
       holds whatever padding the panel carries), and the tempo bar may not begin before the preset
       bar ends plus the artifact's own minimum gap.  The artifact's `overflow: visible` on the foot
       is what makes the second rule safe — BARS-012B deliberately lets these boxes paint beyond the
       window, so pushing the tempo bar right costs nothing but a wider lane. */
    let railX = 0;
    const footEl = foot.prebar.parentElement;
    if (footEl && rackEl.rail) {
      const rr = rackEl.root.getBoundingClientRect(), fr = footEl.getBoundingClientRect();
      if (rr.width > 0) railX = Math.round(rr.left - fr.left);
    }
    foot.prebar.style.left = railX + 'px';
    const minPre = railX + bars.presetW + GEOM.WORK_GAP_MIN;
    /* WAVE 76 · AND ITS RIGHT EDGE IS THE LAST DEVICE'S, NOT THE WINDOW'S.  Josh: "the edge of the
       tempo bar is going past the right-most device, I want it to always stay locked to the device's
       farthest right edge."  `workBars` right-aligns to the WINDOW (`left = right - TIMING_W`), and
       the window is sized by `sizeLaw.width` from the card modes — so whenever the window is wider
       than the cards inside it, the bar hangs past the last card by exactly that surplus.
         The devices are the thing the eye lines up against, so they are what the bar is measured
       from: the last `.m2dev`'s right edge, read as a rect and converted into the foot's own frame
       (the same frame the preset bar was put in above, so the whole lane is stated once).  With no
       devices there is no card to align to and the run's own right edge stands in, which is where a
       device would appear.  The no-overlap floor still wins over both — a bar that has been pushed
       left by a narrow rack may not climb back over the preset name. */
    let preLeft = bars.left - P.x;
    if (footEl && rackEl.run) {
      const cards = rackEl.run.querySelectorAll('.m2dev');
      /* WAVE 100 · capped at the RUN's own right edge: once the run scrolls, the last card's rect is
         its scrolled position and can sit far off-screen, which would carry the bar out with it. */
      const runR = rackEl.run.getBoundingClientRect().right;
      const edge = Math.min(cards.length ? cards[cards.length - 1].getBoundingClientRect().right : runR, runR);
      const fr = footEl.getBoundingClientRect();
      if (edge > fr.left) preLeft = (edge - fr.left) - bars.width;
    }
    /* WAVE 80 · THE BAR IS MEASURED, NOT DECLARED.  modhost §58 lets `.m2pre` size to its contents
       (the tempo readout stacks its unit over its Hz now, so the row is far short of GEOM.TIMING_W's
       450), and the right edge still lands on the last device — so the width is read back after the
       box has laid out rather than written from the law.  The law's number is the fallback for the
       frame before layout exists. */
    foot.pre.style.width = '';
    const tw = Math.round(foot.pre.getBoundingClientRect().width) || bars.width;
    if (footEl && rackEl.run) {
      const cards2 = rackEl.run.querySelectorAll('.m2dev');
      const runR2 = rackEl.run.getBoundingClientRect().right;
      const edge2 = Math.min(cards2.length ? cards2[cards2.length - 1].getBoundingClientRect().right : runR2, runR2);
      const fr2 = footEl.getBoundingClientRect();
      if (edge2 > fr2.left) preLeft = (edge2 - fr2.left) - tw;
    }
    foot.pre.style.left = Math.round(Math.max(preLeft, minPre)) + 'px';
    /* WAVE 81 · AND THE HOST IS TOLD WHERE THIS WINDOW NOW IS.  The plugin does not reach out and
       restyle λWAVES' transport — that is the boundary law this port is built on (`close()` says the
       same thing about the clock).  It REPORTS its rect; rack.js decides whether its own playhead is
       in the way and which seat to take.  One call, at the end of every place, which is exactly the
       set of moments the window's box can have changed. */
    if (port.moved) { try { port.moved(root.getBoundingClientRect()); } catch (_) {} }

    /* the rail stands beside the window, on whichever side has room for its 62 px disc.
       WAVE 92 · 10 → 4 (Josh: "Move the chips closer to the windows and in all directions as well").
       `rw` is the chip target PLUS the gap and both branches spend it — the left as `P.x - rw`, the
       right as `+ w + gap` — so one number moves every direction and the two sides cannot drift
       apart.  The disc is 48 inside that 62-px target, so 4 px of box is still 11 px of air. */
    /* WAVE 99 · 4 → 0 (Josh: "Move the chips a liiiittle closer towards the scroller; the gap is a
       little to[o] far for my taste").  The number is the gap to the chip's 62-px TARGET box, and the
       disc inside it is 48 — so seven of the pixels between the disc and the window were never this
       constant's to give.  Zero leaves the visual gap at the disc's own 7 px plus the panel's padding,
       and both sides move together because wave 97 made the right-hand seat read this same number. */
    const RAIL_GAP = 0;
    const rw = 62 + RAIL_GAP;
    /* ── WAVE 97 · THE RIGHT-HAND SEAT IS MEASURED OFF THE LAST DEVICE, NOT OFF THE WINDOW ────────
       JOSH: "When the chips move to teleport to the right when going off screen, they seem to be too
       far away from the rightmost device, can you make the gap just as close as the left-side's way?"
         The two branches were spending the SAME 4 px and still looked nothing alike, because they were
       measured from different things.  `sizeLaw.width` is chrome + rail + run padding + ADD_SEAT_W +
       the cards, and ADD_SEAT_W is 89 px of room for the `.m2add` button that reach 20 HIDES — so the
       window's right edge stands ~96 px past the last card, and chips placed 4 px outside the WINDOW
       are a hundred pixels from the DEVICE the eye lines them up against.  (Wave 76 found this same
       surplus under the tempo bar, in this same function, for this same reason.)
         So this side is measured too.  The LEFT gap is read as laid out — the chips' right edge to the
       macro rail's left edge, which is RAIL_GAP plus whatever padding the panel carries — and the
       right-hand seat puts the chips' LEFT edge exactly that far past the last card.  One measurement
       feeds both sides, so they cannot drift apart the way two constants would. */
    let railLeft;
    if (P.x >= rw) railLeft = P.x - rw;
    else {
      const rb = rackEl.rail ? rackEl.rail.getBoundingClientRect() : null;
      const gap = rb && rb.width > 0 ? Math.max(RAIL_GAP, Math.round(rb.left - (P.x - RAIL_GAP))) : RAIL_GAP;
      const cards3 = rackEl.run ? rackEl.run.querySelectorAll('.m2dev') : [];
      const runR3 = rackEl.run ? rackEl.run.getBoundingClientRect().right : P.x + w;
      const edge3 = Math.min(cards3.length ? cards3[cards3.length - 1].getBoundingClientRect().right : runR3, runR3);
      railLeft = Math.min(vw - 62, Math.round(edge3 + gap));
    }
    rail.style.left = (P.macroSide === 'right' ? Math.min(vw-38,P.x+w+4) : railLeft) + 'px';
    /* WAVE 87 · THE CHIPS SIT ON THE SCROLLER'S CENTRE LINE (Josh: "Center the chips to the center
       height of the scrolling windows (the macros and the devices)").  The rail used to be pinned to
       the WINDOW's top, so it drifted off the cards as the row grew and the work lane came and went.
       It is centred on `.m2root` — the row that actually holds the macro rail and the device run —
       measured, because the rail's own height is its chip count and is not a constant.  The clamp is
       the old one and stays: a rail that leaves the viewport is a rail with no controls. */
    const rootBox = rackEl.root ? rackEl.root.getBoundingClientRect() : null;
    /* WAVE 87 · THE LANE'S LIFT, WRITTEN WHERE THE BARS CAN READ IT.  modhost §77 moves the two work
       bars instead of re-laying the column, and its first cut asked for `var(--m2-view-h)` — which is
       set on `.m2root` and therefore invisible to `.m2workbar`, a SIBLING of it: custom properties
       inherit DOWN, never sideways, so the calc was invalid and the transform silently did nothing
       (measured: the bars moved 8 px instead of the row's height).  The distance is written onto the
       window root, which is an ancestor of both, and it is measured rather than assumed. */
    /* WAVE 89 · THE LIFT IS SOLVED FOR AN EQUAL GAP, NOT ASSUMED.  Josh: "Switching the preset bar
       and tempo bar above and below the scroller is uneven."  It was: below, the bar starts at the
       ROOT's bottom, and the root carries the run's 18-px shadow padding — so the gap under the cards
       was 18 while the gap over them was the run's 6-px top padding.  `rootHeight + 52` could not see
       either number.  The gap BELOW is measured as laid out, and the lift is whatever puts the bar's
       bottom edge exactly that far above the first card. */
    const cardEl = rackEl.run && rackEl.run.querySelector('.m2dev');
    const laneTop = panel.classList.contains('m2bars-top');
    if (rootBox && rootBox.height > 0 && cardEl && !laneTop) {
      /* ⚠ MEASURED FROM THE BAR ITSELF, NOT FROM THE ROOT.  The first cut used `rootBox.bottom` as the
         bar's top and read back 26 below against 18 above — the bar does not start where the root
         ends (the foot has its own box, and the run's shadow padding sits between them).  The only
         honest source for "where is the bar" is the bar.  Skipped while the lane is ALREADY up,
         because the bar's rect is translated then and would fold the lift into itself. */
      const cb = cardEl.getBoundingClientRect();
      const bb = foot.prebar.getBoundingClientRect();
      const gap = Math.round(bb.top - cb.bottom);
      root.style.setProperty('--m2-lane-lift', Math.round(bb.top - (cb.top - gap - bb.height)) + 'px');
    } else if (rootBox && rootBox.height > 0 && !root.style.getPropertyValue('--m2-lane-lift')) {
      root.style.setProperty('--m2-lane-lift', Math.round(rootBox.height + 52) + 'px');
    }
    const railH = rail.offsetHeight || 0;
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
    P.lane = P.lane === 'top' ? 'bottom' : 'top';
    setWorkLane(panel, P.lane);
    chips.workbars.setAttribute('aria-pressed', P.lane === 'top' ? 'true' : 'false');
    chips.workbars.classList.toggle('on', P.lane === 'top');
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
  transport.xport.title = 'start modulation time. It is NOT the physics transport: an LFO keeps animating the camera while ψ is paused, and RATE — itself a modulation target — cannot set how fast the modulator runs. SPACE plays and pauses both clocks at once while MOD is on; this button is the modulation playhead alone';

  const nativeRate = port.rateControl && port.rateControl();
  if (nativeRate) { nativeRate.root.classList.add('m2-native-rate'); transport.xport.parentNode.insertBefore(nativeRate.root, transport.tempo); }

  /* THE TEMPO FIELD.  `.modtempo` and `.modtempoin` stand in the same seat and swap `hidden`;
     the number never goes, only its unit and its derived Hz (`.tight`, then `.tighter`). */
  transport.tempo.title = 'the LOOP CLOCK, in beats per minute — not tempo: a captured loop CLOSES only when every modulator divides one period exactly. Tap to type it';
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
  transport.tap.title = 'tap four times to set the LOOP CLOCK by hand — the model\'s own estimator: a widening window, one wild interval restarts the count, and two that stray the same way shift it';
  transport.tap.addEventListener('click', () => {
    const r = M.tapTempo(taps, performance.now());
    taps = r.taps;
    if (r.bpm) { clock.setBpm(r.bpm); status('tapped ' + r.bpm.toFixed(1) + ' BPM from ' + r.k + ' intervals', ''); }
    else status('keep tapping — two taps make an interval', '');
    paint(true);
  });

  transport.sync.title = 'WALL: beats are DERIVED from the absolute wall stamp, so a long frame cannot slow the LFO down. FREE: beats are ACCUMULATED from dt, and a frame over 0.25 s is clamped';
  transport.sync.addEventListener('click', () => { clock.setSync(M.syncMode() === 'wall' ? 'free' : 'wall'); sync(); });
  transport.cad.title = 'the CADENCE CAP: the modulation applies at most this many times a second, whatever the display runs at. The cap is on the MODULATION, never on the field';
  transport.cad.addEventListener('click', () => { if (port.setCadence) port.setCadence(port.cadence() === 120 ? 60 : 120); sync(); });

  const HOLD_NOTE = ['1/4', '1'];
  transport.holds.forEach((b, i) => {
    b.title = 'the stutter hold: fold the beat into ' + HOLD_NOTE[i] + ' and keep a shadow of the un-held run — release rejoins the shadow. A hold is a GESTURE, so closing this window never releases it';
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
  /* WAVE 100 · THE FACTORY BANK STANDS DOWN (Josh: "Delete the mod presets found in the plugin, I
     will make new ones soon").  It is filtered HERE and not deleted from `lab/mir/mod.js`, which is
     the vendored model and carries its own gates: FACTORY_PRESETS is model DATA, mod.js's own comment
     says so, and a host that wants the bank back drops this one predicate.  Nothing can load one
     either — `loadPreset` is only ever reached from a row this filter built. */
  const userPresets = () => M.presetList().filter((p) => !p.factory);
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
      const grp = psheet.group(f.name, shut, false);
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

  /* ═══════════════════════════════════════════════════════════════════════════════════════
   *  WAVE 61, KEPT: THE MACRO IS THE ROUTER — the arc on the dial, and the two roads to it
   * ═══════════════════════════════════════════════════════════════════════════════════════
   * Everything from here to `removeEditRoute` is λWAVES' own, written to Josh's brief and
   * gated since wave 61.  It is kept over the artifact's `.m2ring` for the reasons in the
   * header, and it now shares the artifact's GHOST and its CLEAR button, so nothing is drawn
   * twice.  The geometry: a 60-unit box over a 60-px dial, so a radius here IS a radius on
   * the glass; two radii 3.5 apart, because at 2.5 the two strokes read as one thick arc. */
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
  const macroIds = () => M.macroList().filter((m) => m.kind !== 'trigger').map((m) => m.id);
  function selectedMacro() {
    const ids = macroIds();
    if (!ids.length) return null;
    if (selMacro && ids.indexOf(selMacro) >= 0) return selMacro;
    selMacro = ids[0];
    return selMacro;
  }
  function selectMacro(id) {
    selMacro = id;
    for (const [mid, rec] of macRows) rec.root.classList.toggle('sel', mid === id);
    paintRings();
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
      rec.svg.remove(); if(rec.depth) rec.depth.root.remove(); if (rec.dial.parentElement) rec.dial.parentElement.classList.remove('has-ring');
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
    wireRing(rec);
    const depth = knob({label:'RANGE',min:-1,max:1,value:0,fmt:v=>(v*100).toFixed(0)+'%',onInput:d=>{const r=editRouteOf(id);if(!r)return;M.setRouteRange(r.id,{min:Math.max(0,-d),max:Math.max(0,d)});apply();paintRings();}});
    depth.root.classList.add('k-route-depth'); depth.root.title='Selected macro range; the large dial sets the base';
    depth.root.addEventListener('pointerdown',e=>e.stopPropagation());
    dial.parentElement.appendChild(depth.root); rec.depth=depth;
    return rec;
  }

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

  /* THE CONTEXT GESTURE: press and hold 450 ms, or the right button.  It is where CENTRE / UP /
     DOWN lives — Josh's "center of dial or highest dial", the mode the model could not express
     until forced edits 2/8–6/8 gave a route its `bi` flag. */
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
        { id: 'centre', label: 'CENTRE', title: 'the knob\'s own position is the MIDDLE of the swing (bipolar) — Josh\'s "center of dial"' },
        { id: 'up', label: 'UP', title: 'the position is the floor: the modulator only adds, and reaches the top exactly' },
        { id: 'down', label: 'DOWN', title: 'the position is the ceiling: the modulator only subtracts, and reaches the bottom exactly' }],
        onChange: (v) => { M.setRouteRange(er.id, rangeFor(id, v)); apply(); paintRings(); paint(true); } });
      popEl.appendChild(sg.root);
    }
    const rw = el('div', 'row tight', popEl);
    if (er) rw.appendChild(trig({ label: 'REMOVE', title: 'remove this macro\'s route into this control — the target goes back to the hand\'s own number, bit for bit',
      onFire: () => { closePop(); removeEditRoute(id); } }).root);
    if (rs.length) rw.appendChild(trig({ label: 'REMOVE ALL', title: 'remove every route into this control',
      onFire: () => { closePop(); M.removeRoutesOfTarget(id); if (registry.has(id)) registry.restoreBase(id);
        clock.recomputeRunning(); apply(); rebuild(); status('every route into ' + (d ? d.label : id) + ' removed', ''); } }).root);
    if (d && d.def !== null && d.def !== undefined) rw.appendChild(trig({ label: 'RESET', title: 'put this control back on its own default — the BASE moves, the routes stay',
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
  /* ── WAVE 100 · A PRESS ANYWHERE ELSE CLOSES EITHER CHOOSER ──────────────────────────────────
     JOSH: "When adding new macro or device in the plugin, a click anywhere else should close the
     drop down menu."  Both sheets were toggle-only: the chip that opened one was the ONLY thing that
     could shut it, so a sheet left open sat over the rack until you found that chip again.  The
     popover one line down has had this since wave 61; the two pickers never got it.
       The opener is excluded as well as the sheet, or the press that closes would be the same press
     the chip re-opens on. */
  const pickAway = (e) => {
    const t = e.target;
    if (devPickOpen && !pick.root.contains(t) && !addChip.contains(t)
        && !(rackEl.add && rackEl.add.contains(t))) setDevPick(false);
    if (macroPickOpen && !mpick.root.contains(t) && !(rackEl.macadd && rackEl.macadd.contains(t))) {
      macroPickOpen = false; mpick.root.hidden = true;
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
  rackEl.macadd.title = 'add a macro: the thing a source (or a hand) drives, and the thing a route carries to a target';
  rackEl.macadd.addEventListener('click', () => {
    if (M.macroList().length >= M.MACRO_MAX) { status('eight macros is the model\'s ceiling', 'warn'); return; }
    macroPickOpen = !macroPickOpen; mpick.root.hidden = !macroPickOpen;
  });
  for (const kind of ['knob', 'trigger']) {
    if (!mpick.btns[kind]) continue;
    mpick.btns[kind].addEventListener('click', () => {
      mpick.root.hidden = true; macroPickOpen = false;
      M.addMacro(null, { kind });
      rebuild();
    });
  }
  rackEl.macdel.title = 'remove the selected macro and every route it carries';
  rackEl.macdel.addEventListener('click', () => {
    const id = selectedMacro();
    if (!id) { status('no macro to remove', 'warn'); return; }
    M.removeMacro(id); clock.recomputeRunning(); apply(); rebuild();
  });

  function rebuildMacros() {
    rackEl.slots.innerHTML = ''; macRows.clear();
    let n = 0;
    for (const m of M.macroList()) {
      n++;
      const rec = mw.addMacro(m, n);
      rec.root.addEventListener('pointerdown', () => { if (m.kind !== 'trigger') selectMacro(m.id); });
      rec.grip.title = 'ROUTE this macro. DRAG it onto any dial — the range starts as the room that dial has left, so nothing clips. Or TAP to ARM it and then tap a lit dial. Double-tap resets the macro';
      rec.grip.setAttribute('aria-label', 'route ' + m.name + ' — drag onto a control, or tap to arm');
      wireGrip(rec.grip, m.id);

      /* THE NUMBERED SEAT is the MASTER DEPTH: one unipolar gain over everything this macro
         sends, on the artifact's own 34-px ring.  A double-tap puts it back to 100 %, which is
         what the window's own hint line promises. */
      const numberInput = {
        get: () => P.macroMin ? M.macroOf(m.id).value : M.macroOf(m.id).masterDepth,
        set: (v) => { const mm = M.macroOf(m.id); if (P.macroMin && mm.sourceId) return; M.setMacro(m.id, P.macroMin ? {value:clamp01(v)} : {masterDepth:clamp01(v)}); apply(); paint(true); },
        reset: () => { const mm=M.macroOf(m.id); if(P.macroMin && mm.sourceId) return; M.setMacro(m.id, P.macroMin ? {value:0} : {masterDepth:1}); apply(); paint(true); },
        axis: 'y',
        editable: () => !P.macroMin || !M.macroOf(m.id).sourceId
      };
      wireSlider(rec.numSeat, numberInput);
      bindSliderKeys(rec.numSeat, numberInput);
      rec.numSeat.title = 'MASTER DEPTH — one gain over everything this macro sends. Drag up and down; double-tap for 100 %';
      /* THE ARIA IS THE HOST'S, AND THE ARTIFACT SAYS SO.  `buildMacroSlot` sets role="slider"
         "because that is what it is; the host's registry writes the aria range and value" — so it
         is written here, on all three of the plugin's slider kinds, and B122's document-wide sweep
         reads them back beside the house's own. */
      aria(rec.numSeat, 'MACRO ' + n + ' DEPTH', 0, 100, 100 * M.macroOf(m.id).masterDepth, '100%');

      if (rec.kind === 'trigger') {
        rec.pad.addEventListener('pointerdown', (e) => { e.preventDefault(); M.fireMacro(m.id); apply(); paint(true); });
        rec.pad.addEventListener('pointerup', () => { M.releaseMacro(m.id); apply(); paint(true); });
        rec.pad.addEventListener('pointercancel', () => { M.releaseMacro(m.id); apply(); });
        rec.pad.title = 'fire this trigger by hand — every source bound to it rewinds and every HIT output fires';
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
        rec.val.title = 'this macro\'s value. Drag sideways to set it by hand; a source-driven macro is locked, because a hand and a modulator cannot share one number';
        aria(rec.val, m.name + ' value', 0, 100, 100 * M.macroOf(m.id).value, '0%');
        /* a DOUBLE-click opens the rename row, which is a sibling already in the DOM: opening it
           only clears `hidden` — nothing is ever reparented. */
        rec.val.addEventListener('dblclick', () => { rec.erow.hidden = false; rec.name.value = M.macroOf(m.id).name; rec.name.focus(); rec.name.select(); });
      }
      rec.name.addEventListener('change', () => { M.setMacro(m.id, { name: rec.name.value }); rec.erow.hidden = true; paint(true); });
      rec.name.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); rec.erow.hidden = true; } });
      rec.clr.title = 'unassign the source driving this macro — the value comes back to the hand';
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
  rackEl.add.title = 'add a modulation device — an LFO or an envelope';
  /* WAVE 75 · THE SHEET OPENS WHERE THE HAND IS.  `.m2pick` is `position: absolute; left: 50%` inside
     the WINDOW, which is the right answer for a button in the run and the wrong one for a chip on a
     rail that is a DOM SIBLING of the window — it would open half a window away from the press.  So
     the sheet goes `fixed` beside the chip (the class does the switching; only the two coordinates
     are inline), and it flips to the chip's other side when there is no room, which is the same
     clamp every popover in this lab already does. */
  function placePickAtChip() {
    const r = addChip.getBoundingClientRect();
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
    addChip.setAttribute('aria-expanded', String(devPickOpen));
    addChip.classList.toggle('on', devPickOpen);
    if (devPickOpen) placePickAtChip();
    else { pick.root.classList.remove('m2pick-at-chip'); pick.root.style.left = ''; pick.root.style.top = ''; }
  }
  addChip.addEventListener('click', () => setDevPick(!devPickOpen));
  rackEl.add.addEventListener('click', () => setDevPick(!devPickOpen));   // the retired button still answers if a host un-hides it
  /* WAVE 100 · ALL THREE KINDS ARE WIRED, AND AUDIO IS STILL DISABLED.  Josh: "prep for everything
     you need for the AUDIO devices minimized, compact, and default adoption into lambdawaves."  The
     loop used to name two kinds, so `ADD AUDIO` carried no listener at all on top of being disabled —
     which meant the AUDIO face could not even be BUILT to dress or measure, and adoption would have
     been a wiring job as well as a capture one.  It is wired now; the button stays disabled and keeps
     the sentence saying why (above), so adoption is one flag rather than a search. */
  /* WAVE 101 · A NEW DEVICE JOINS THE MODE THE RACK IS IN.  Josh: "adding a device adds it in
     expanded mode, when in compact mode making it the odd one out."  `modeOf` answers FULL for any id
     the presentation state has never seen, so every card arrived full whatever its neighbours were
     doing.  The rack's mode is the COMPACT chip's own state — it is the control that put them there —
     so the new source adopts it before the first paint rather than being corrected after one. */
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
    if(s.kind==='audio' && (key==='attack'||key==='release')) {
      const field=key+'Ms',band=()=>audBands.get(s.id)||'level',value=()=>s.audio.outs[band()][field];
      return {get:()=>Math.log1p(value())/Math.log1p(M.AUDIO_TIME_MAX),
        set:u=>M.setSource(s.id,{audio:{outs:{[band()]:{[field]:Math.round(Math.expm1(clamp01(u)*Math.log1p(M.AUDIO_TIME_MAX)))}}}}),
        text:()=>value().toFixed(0)+' ms',hint:'Selected audio band '+key+' time constant; choose LEVEL, LOW, MID or HIGH on its meter'};
    }
    switch (key) {
      case 'rate': return {
        get: () => (s.sync ? s.mult / (nMult - 1) : s.ratePos),
        set: (u) => { if (s.sync) M.setSource(s.id, { mult: Math.round(clamp01(u) * (nMult - 1)) }); else M.setSource(s.id, { ratePos: clamp01(u) }); },
        text: () => (s.sync ? M.LFO_MULT_LABEL[s.mult] + ' · ' + M.lfoHz(s).toFixed(2) : M.lfoHz(s).toFixed(3) + ' Hz'),
        hint: 'free: 0.01 … 3 Hz on a log dial. On the LOOP CLOCK grid: the note ladder, eight detents from a whole note to 1/128' };
      case 'phase': return { get: () => s.phaseOff, set: (u) => M.setSource(s.id, { phaseOff: clamp01(u) }),
        text: () => (s.phaseOff * 360).toFixed(0) + '°', hint: 'the phase offset' };
      case 'smooth': return { get: () => s.smooth, set: (u) => M.setSource(s.id, { smooth: clamp01(u) }),
        text: () => (s.smooth > 0 ? (M.smoothTau(s.smooth) * 1000).toFixed(s.smooth < 0.2 ? 1 : 0) + ' ms' : 'OFF'),
        hint: 'a one-pole filter on the LFO only: tau = 0.5 · v² seconds. With it on, the emitted dot LEAVES the drawn line — which is exactly what the control does' };
      case 'steps': return { get: () => M.stepsRungIndex(s.steps) / (L.length - 1),
        set: (u) => M.setSource(s.id, { steps: L[Math.round(clamp01(u) * (L.length - 1))] }),
        text: () => (s.steps >= M.STEPS_MIN ? String(s.steps) : 'OFF'),
        hint: 'quantise the output to N discrete levels — the 35-rung ladder, drawn as stairs on the picture' };
      case 'hold':
      case 'a': case 'd': case 'r': return {
        get: () => SQ(s[key]), set: (u) => M.setSource(s.id, { [key]: clamp01(u) * clamp01(u) * M.ENV_MAX_S }),
        text: () => fmtSec(s[key]),
        hint: 'a SQUARE law, because linear over 0 … 8 s on a 220-px travel is 36 ms a pixel and the default attack is 10' };
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

  /* ── WAVE 74 · THE SURFACES WEAR THE HOUSE'S OWN GLASS CLASS ────────────────────────────────
     JOSH'S ACCEPTANCE TEST, in his words: "it must follow what the 'about' glass window is doing.
     If it does not do what the 'about' glass does: IT FAILS."
       The ABOUT card is `#sheet`, and everything it does under a setting it does because it carries
     ONE class — `.glass`.  skin.css spends three rules on that class and they are the whole of the
     behaviour Josh is asking for: `body[data-card="refractive"] .glass` and `body[data-card="tinted"]
     .glass` are CARD STYLE, and `body.frost .glass` is FROST (the backdrop filter AND its whisper of
     white).  The artifact ALSO has its own `.mir-modwindow .glass` recipe, which reads --glass-tint,
     --glass-opacity, --glass-border-color, --glass-sheen and `backdrop-filter: var(--glass-filter)`.
       So the honest implementation is not to copy any of those rules.  It is to give the plugin's
     surfaces the same class, and let every present and future house rule reach them by construction.
     That is the only version of this that cannot drift out of agreement with the ABOUT card.
       The artifact already ships `.m2prebar` as `m2workbar m2prebar glass` — this is its own idea,
     applied to the three surfaces the extract left bare. */
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
  /* ── WAVE 89 · THE MACRO RAIL GETS A DEVICE'S HEAD ────────────────────────────────────────────
   * Josh: "Have clicking the macros text … give the macros window the same buffer as LFO and ENV for
   * the row it's in and have the similar dropdown arrow to minimize; no drag option however."
   *   The rail is a card beside two cards and it was the only one you could not fold.  It gets the
   * SAME control the devices carry — a caret that turns a quarter turn — built from the artifact's own
   * `.m2chev`, so it is the device's chevron and not a second drawing of one.  It gets NO grip: the
   * rail's order is not the fire order and there is nothing to reorder it against, which is exactly
   * the reason the devices have one and this does not. */
  function seatRailHead() {
    const head = root.querySelector('.m2railhead');
    if (!head || head.dataset.folder === '1') return;
    head.dataset.folder = '1';
    head.setAttribute('role', 'button');
    head.tabIndex = 0;
    head.setAttribute('aria-expanded', 'true');
    head.title = 'fold the macro rail — layout only, every macro keeps its value and its routes';
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
  sideGrip.hidden=true;sideGrip.disabled=true;sideGrip.type = 'button'; sideGrip.title = 'Drag macros to either end; double-click or use arrow keys to swap sides';
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

  /* WAVE 92 · AND IT GOES BACK TO THE HEAD, WHERE ENV'S OWN LABEL ALREADY LIVES.  Josh: "place it
     similar to the 'REL' is on in ENV, not in the curve window."  `.m2envstage` — the word REL — is
     built into `.m2headc` beside the device name, and `.m2lfowave` is its exact counterpart there;
     the artifact had the two symmetrical and waves 82–84 moved one of them.  The move is undone
     rather than re-aimed: the seat Josh is pointing at is the artifact's own. */
  /* ── WAVE 100 · THE CURVE CYCLER JOINS THE PRESET ROW ────────────────────────────────────────
     JOSH: "add the cycling curve presets that currently [sit] in between the LFO title bar of the
     device and the 'A/B' thingy.  Move the curve cycler to where the 4-triangle curve preset would
     be, move the 4-triangle to where the old 4-saw used to be, delete the 4-saw."
       So the row becomes TRI · SAW↑ · SINE · SQR · MULTI-TRI · WAVE.  Only one node moves: MULTI-SAW
     is hidden by modhost.css and the grid's own auto-flow slides MULTI-TRI up into the fifth seat, so
     nothing is re-ordered by hand and the artifact's six-column template is untouched.  `.m2lfowave`
     is APPENDED, which puts it in the sixth seat the multi-triangle just left.
       It belongs here on its own terms, not only because it fits: it is the road back from a drawn
     curve to an analytic wave, which is the one thing the other five buttons cannot do. */
  function seatCurveName() {
    for (const card of root.querySelectorAll('.m2dev.lfo')) {
      const name = card.querySelector('.m2lfowave'), grid = card.querySelector('.m2presets');
      if (name && grid && name.parentNode !== grid) grid.appendChild(name);
    }
  }

  /* ══ WAVE 97 · THE FOLDED STRIP GETS ONE INDICATOR, AND IT IS THE CURVE ═══════════════════════
   * JOSH: "can we rework the animation/indicator of the LFO/ENV/AUDIO when it's minimized?  We need a
   * new better design for it."
   *
   * WHAT WAS THERE, and why it could not be tuned into shape: THREE DIFFERENT WIDGETS for three kinds
   * of one device.  An LFO folded to a strip showed `.m2lfominshape` — its curve drawn with TIME on X
   * and VALUE on Y into a box 22 px wide and ~200 tall with `preserveAspectRatio: none`, so a whole
   * cycle was crushed into 22 px while the value was stretched over ten times that; an ENV showed
   * `.m2envminprog`, a 5-px progress column with no shape in it at all; AUDIO showed four little LED
   * bars.  Beside them all sat `.m2meter`, an 11-px level rail.  Folding a device did not shrink what
   * you were reading — it replaced it with something else, and a different something per kind.
   *
   * THE NEW ONE IS THE FULL CARD'S PLOT, TRANSPOSED.  Time runs DOWN the strip and the value across
   * it, which is the right way round for a box that is 26 × 200 instead of 340 × 128, and the live dot
   * is the same `.m2playdot` idea riding the same curve.  So a folded device is the same instrument at
   * a smaller size — same shape, same ink, same playhead — which is what a minimised mode should be.
   * ONE object covers all three kinds: LFO and ENV draw their curve, AUDIO draws its level as the line
   * (it has no time base — its follower is a level, and saying so in the same visual language beats a
   * fourth widget).  The artifact's three are hidden by modhost.css, never deleted.
   *
   * THE DOT IS AN ELEMENT, NOT A CIRCLE IN THE SVG, and that is forced: `preserveAspectRatio: none` is
   * what lets the trace fill a tall narrow box, and under it an SVG circle is stretched into an ellipse
   * by exactly the aspect the box has.  An absolutely-positioned `<i>` driven by two custom properties
   * stays round at every height — which is the artifact's own answer for `.m2vedge` in the macro slot. */
  function seatMinTrace(rec) {
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
    for (const s of devOrder()) {
      if (P.modes[s.id] === undefined && saved[s.id] !== undefined) { P.modes[s.id] = saved[s.id]; delete saved[s.id]; }
    }
    /* ── WAVE 100 · ONE DEVICE THAT WILL NOT BUILD MAY NOT EMPTY THE RACK ────────────────────────
       JOSH: "sometimes adding a new device to the plugin makes all the devices invisible all of a
       sudden, (the window remains fixed in size)."  FOUND, and it is this loop.  `buildCard` puts its
       `rec` into `devRows` on its FIRST line and fills `rec.g` on its last, so a throw anywhere in
       between — measured today with an AUDIO source, whose `s.gainDb` the model leaves undefined and
       whose knob caption called `.toFixed` on it — leaves a half-built rec behind AND takes the loop
       down with it.  `rebuildDevices` has already removed every existing card root by then, so every
       device that had not yet been rebuilt simply never is: the rack goes empty, the window keeps
       whatever size the last `place()` gave it, and `paint()` then throws on `rec.g.box` forever.
         So each card is built on its own account.  A device that cannot be built is dropped from the
       rack and SAID OUT LOUD on the window's own hint line rather than taking its neighbours with it —
       the rest of the rack, and the window, stay usable. */
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

    /* ── THE HEAD ── */
    /* WAVE 79 · TWO STATES ON THIS BUTTON, NOT THREE (Josh): "let the behavior of that button be
       'minimize' and 'expand' (to default size not compact (CMP) only).  Have compact only exist when
       hitting compact chip button."  So the cycle drops its middle rung — a device folded from
       COMPACT still expands to FULL, which is what "expand to default size" means from any state. */
    dev.fold.title = 'minimise / expand — COMPACT is the chip on the rail, not this button';
    dev.fold.addEventListener('click', () => {
      const next = modeOf(s.id) === 'M' ? 'F' : 'M';
      setMode(s.id, next);
      dev.fold.setAttribute('aria-expanded', next === 'F' ? 'true' : 'false');
      place(); paint(true); persist();
    });
    dev.pow.title = 'bypass this device — every macro it drives goes quiet, and its patch is kept';
    dev.pow.addEventListener('click', () => { M.setSource(s.id, { on: !s.on }); clock.recomputeRunning(); apply(); sync(); });
    dev.x.title = 'remove this device — every macro bound to it goes back to HAND';
    dev.x.addEventListener('click', () => { M.removeSource(s.id); delete P.modes[s.id]; clock.recomputeRunning(); apply(); rebuild(); });
    dev.bank.btn.title = 'TWO WHOLE SAVED PATCHES per device. Switching saves the side you are leaving and restores this one; the phase, the envelope clock and the power switch do not move';
    dev.bank.btn.addEventListener('click', () => { M.setSource(s.id, { bank: s.bank === 'A' ? 'B' : 'A' }); apply(); sync(); });
    dev.cpy.title = 'copy this side\'s whole patch';
    dev.cpy.addEventListener('click', () => { clip = M.copyBank(s.id); say(rec, 'patch copied — PASTE onto any ' + s.kind.toUpperCase()); });
    dev.pst.title = 'paste the copied patch onto the side showing — a patch of another kind is refused, and says so';
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
      dev.trig.title = 'fire this envelope by hand — an envelope moves on modulation time, so the transport has to be running for it to run its shape';
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
        q.btn.title = PRESET_LABEL[name] + ' — tap to draw it; tap again for its mirror (a symmetric shape says so rather than pretending)';
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
        say(rec, M.WAVE_LABEL[next] + ' — an analytic wave' + (stochastic({ wave: next }) ? ', four cycles shown' : ''));
        apply(); paint(true);
      };
      dev.lfoWave.title = 'the analytic wave this LFO is running — tap to walk the list. Tapping a shape below draws a CURVE instead, and this is the road back';
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
      dev.sw.trig.title = 'TRIG — rewind this LFO\'s phase to 0 on a trigger and on the play edge: SPACE STARTS THE CURVE OVER, which is what makes a recorded run begin at the same phase every time. On a FREE-Hz source the rewind is the source\'s own and costs the rack nothing. On a BPM source it claims the note grid instead, because there the beat OWNS the phase and a rewind the next frame overwrites is a control that changes nothing — and the note boundary is where "start over" and "the truncated note" are the same number';
      dev.sw.trig.addEventListener('click', () => { M.setSource(s.id, { trig: true }); apply(); sync(); });
      dev.sw.off.title = 'free-running: the phase is wherever the beat put it, and a resume takes whatever ANCHOR and BPM decide between them';
      dev.sw.off.addEventListener('click', () => { M.setSource(s.id, { trig: false }); apply(); sync(); });
      dev.flipBtn.title = 'time-reverse the drawn curve: c(t) → c(1−t). A symmetric shape is invariant and says so';
      dev.flipBtn.addEventListener('click', () => {
        if (s.shapeMode !== 'curve') { say(rec, 'an analytic wave has nothing to flip — tap a shape to draw it first'); return; }
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
      zin.title = 'halve the display window — a VIEW quantity: the knobs stay in real seconds and the envelope does not change';
      zin.addEventListener('click', () => { M.setSource(s.id, { timeScale: s.timeScale * 0.5 }); paint(true); say(rec, 'window ' + s.timeScale.toFixed(2) + ' s'); });
      zout.title = 'double the display window';
      zout.addEventListener('click', () => { M.setSource(s.id, { timeScale: s.timeScale * 2 }); paint(true); say(rec, 'window ' + s.timeScale.toFixed(2) + ' s'); });
      zfit.title = 'frame the whole envelope — the picture that is DRAWN, release included, which is what `envPoints` puts on the glass under GATE as well as one-shot';
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
      A.srcBtn.title = 'open or close the microphone. Nothing is recorded, stored or sent — the graph is microphone → analyser and stops there, and what leaves it is six numbers a frame';
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
      A.setBtn.title = 'Input, exact band ranges and timing, noise gate, gate HOLD and onset sensitivity';
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
        row.box.title = key === 'hit'
          ? 'HIT is an EVENT, not a level: it fires an envelope whose TRIG IN names this socket, rather than driving a macro'
          : 'which MACRO this output drives — tap to walk the list. Only macros nothing else is driving are offered';
        row.box.addEventListener('click', () => { if (key !== 'hit') cycleAudioOut(rec, key); });
        row.grip.title = 'this output is a source like any other: bind it from a macro’s own DRIVE, or here';
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
      dev.mac.title = 'which MACRO this device drives — tap to walk the list. A macro a source owns has no fader: you cannot fight a modulator for one number';
      dev.mac.addEventListener('click', () => cycleMacro(rec));
    }
    if (dev.bus) {
      /* ══ WAVE 105 · HIT IS THE SHORTCUT, AND THE FACE NEVER OFFERED IT ═══════════════════════
         Josh: "Hit for envelope is a shortcut key."  That is exactly what an audio HIT socket is —
         the fast way to fire an envelope off the signal itself, instead of routing a trigger macro
         and firing that by hand.  THE MODEL HAS ALWAYS ALLOWED IT: `setSourceTrigger` admits any
         `isFireSource(key)`, and that is `isTriggerMacro(id) || isHitOutput(id)` (mod.js:867).
         Only the FACE was short — it cycled `triggerMacros()` and nothing else, so the one binding
         the model went out of its way to support could not be made here at all.
           AND A HIT THAT *WAS* BOUND READ AS UNBOUND.  The paint below asked `M.macroOf(triggerId)`
         for the number to print; a socket id is not a macro, so it came back null and the seat
         printed `--` — the same thing it prints for nothing at all.  It prints `H`, or `H2` when
         there is more than one AUDIO device, so the binding is legible. */
      dev.bus.title = 'what fires this envelope — tap to walk the TRIGGER macros and then every ' +
        'AUDIO device\'s HIT socket, which fires it off the signal itself. Shift-tap to jump straight to the first HIT';
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

    /* ── WAVE 99 · THE FOLDED STRIP'S NUMERAL SWITCHES THE MACRO, IT DOES NOT EXPAND ────────────
       JOSH: "minimized mode tapping on macro routing number actually expands the window and not
       route to a different macro."  He is quoting the artifact back at us: modwindow.js:827 says in
       so many words "The macro numeral is the macro switcher", and the port wired it to `setMode`
       instead — so the one control the folded strip has for changing what it drives did the same
       thing as the caret two seats above it, and the strip had no way to re-route at all.
       Expanding is still the CARET's job, which is where a fold control belongs. */
    if (dev.minNum) dev.minNum.addEventListener('click', () => cycleMacro(rec));
    return rec;
  }

  /** WAVE 78 · TWO DIGITS, ALWAYS.  Josh: "make it say '01' for the numbers".  A route counter that
   *  is one character wide at 9 and two at 10 makes the whole readout twitch as routes come and go,
   *  and this row sits beside a live meter — so the count is padded and the row stops moving.  Ten or
   *  more prints its own width; the pad is a floor, not a truncation. */
  const pad2 = (n) => (n < 10 ? '0' + n : String(n));

  /** the device → macro assignment, in one direction: the DEVICE says which macro it drives.
   *  `setMacro` REFUSES a source change on a macro already bound to a live source, so this
   *  unbinds first — a face that just calls it reads as a control that does nothing. */
  /* ── WAVE 100 · THE CYCLE ONLY OFFERS SEATS THAT ARE FREE ────────────────────────────────────
     JOSH: "when the route is set to an already incumbent macro, have it be colored red with a red
     outline until it cycles to the next filled one.  Or just cycle between only available routings."
     The second, because the first paints a warning about a state this control should never be able
     to reach.  What it used to do was worse than either: `setMacro(next, {sourceId: null})` SILENTLY
     EVICTED whoever held that macro, so walking one device's OUT could quietly unpatch another one
     two cards away, with nothing on the screen saying so.
       The ring is HAND plus every macro that is unowned or already this source's own, in the model's
     order, so a walk visits each reachable seat once and comes back to `--`.  A macro another source
     drives is not in the ring at all, which is what "only available" means.  A rack with no free
     seat leaves the ring at [HAND] and the control says so rather than doing nothing. */
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
    g.title = 'drag to reorder — the rack runs left to right and run order is fire order';
    /* ⚠ WAVE 84 · THE LISTENERS LIVE ON THE WINDOW, NOT ON THE HANDLE, AND THAT IS THE BUG JOSH HIT:
       "letting go mouse when drag to reorganize LFOs does not work and stays stuck."  The move handler
       calls `rebuildDevices()`, which REMOVES every device root and builds new ones — including the
       very button the pointer was captured on.  A captured node that leaves the document takes its
       capture and its pending `pointerup` with it, so the release never arrived and the drag never
       ended.  The window outlives every rebuild, so the two live-drag listeners go there and are
       taken off again when the gesture ends. */
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
  /* WAVE 105 · A CARD'S MESSAGE GOES TO THE WINDOW'S ONE SEAT.  `.m2note` is `display: none` by
     Josh's own ruling ("Remove the text within the curve windows"), so writing there was writing to
     nobody.  The message is still the CARD's — it is prefixed with the device it came from — but it
     is said where a message can be read. */
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
    if (s.shapeMode !== 'curve') return M.WAVE_LABEL[s.wave] + ' — an analytic wave. Tap a shape to draw it.' +
      (stochastic(s) ? ' Four cycles: each is a fresh hold.' : '');
    const info = curveInfo(s.points);
    return (info.preset ? PRESET_LABEL[info.preset] + (info.mirrored ? ' mirrored' : '') : 'CURVE') +
      ' — ' + info.points + ' points, ' + info.bent + ' bent. Drag a dot; tap to add.';
  }

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
    let mode = null, idx = -1, key = null, box = null, x0 = 0, y0 = 0, t0 = 0, base = 0, moved = false;
    let down = { key: null, t: 0, v: 0 };            // the LATCH: the stage, its seconds, and where the finger took it
    let lastTapAt = 0, lastTapIdx = -1;

    const local = (e) => ({ x: e.clientX - box.left, y: e.clientY - box.top });
    const uv = (p) => ({ t: clamp01((p.x - PAD) / Math.max(1, g.w - 2 * PAD)),
                         v: clamp01(1 - (p.y - PAD) / Math.max(1, g.h - 2 * PAD)) });

    function hit(p) {
      const pts = g.pts; if (!pts) return { kind: null };
      let bi = -1, bd = GRAB;
      for (let i = 0; i < pts.length; i++) {
        const d = Math.hypot(p.x - g.X(pts[i].t), p.y - g.Y(pts[i].v));
        if (d < bd) { bd = d; bi = i; }
      }
      if (bi >= 0) return { kind: 'point', i: bi, d: bd };
      let hi = -1, hd = GRAB;
      for (let k = 0; k < g.hseg.length; k++) {
        const i = g.hseg[k], mt = (pts[i].t + pts[i + 1].t) / 2;
        const d = Math.hypot(p.x - g.X(mt), p.y - g.Y(curveEval(pts, mt)));
        if (d < hd) { hd = d; hi = i; }
      }
      if (hi >= 0) return { kind: 'handle', i: hi, d: hd };
      return { kind: null };
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
      if (s.kind === 'audio') return;
      if (s.kind !== 'env' && s.shapeMode !== 'curve') {
        say(rec, 'this is an analytic wave — tap a shape below to draw it, and then it is yours to bend');
        return;
      }
      e.preventDefault();
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      box = svg.getBoundingClientRect();
      const p = local(e), h = hit(p);
      x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); moved = false;
      mode = h.kind; idx = h.i === undefined ? -1 : h.i;
      key = mode === 'point' && s.kind === 'env' ? envMapOf(s).keys[idx] : null;
      down = { key, t: uv(p).t, v: key ? s[key] : 0 };
      if (mode === 'handle') base = g.pts[idx].tension;
      if (mode === 'handle' && s.kind === 'env') key = envMapOf(s).tens[idx];
    });

    svg.addEventListener('pointermove', (e) => {
      if (!box) return;
      if (!moved && Math.hypot(e.clientX - x0, e.clientY - y0) < 2) return;
      moved = true;
      const p = local(e), q = uv(p);
      if (mode === 'point') {
        if (s.kind === 'env') { if (envMove(q.t, q.v)) syncKnobs(rec); }
        else M.curveEdit(s.id, 'move', { index: idx, t: q.t, v: q.v });
        apply();
      } else if (mode === 'handle') {
        /* UP RAISES THE CURVE, whichever way the segment runs. */
        const a = g.pts[idx], b = g.pts[idx + 1];
        const sgn = b.v < a.v ? -1 : 1;
        const tau = Math.max(-1, Math.min(1, base + sgn * (e.clientY - y0) / TENSION_PX));
        if (s.kind === 'env') { if (key) { M.setSource(s.id, { [key]: tau }); syncKnobs(rec); } }
        else M.curveEdit(s.id, 'tension', { index: idx, tension: tau });
        apply();
      }
    });

    const end = (e) => {
      if (!box) return;
      const wasMode = mode, wasIdx = idx;
      mode = null; box = null; key = null;
      if (moved) return;
      if (performance.now() - t0 > TAP_MS || Math.hypot(e.clientX - x0, e.clientY - y0) > TAP_PX) return;
      const now = performance.now();
      if (wasMode === 'point') {
        if (wasIdx === lastTapIdx && now - lastTapAt < DTAP_MS) {
          lastTapIdx = -1;
          if (s.kind === 'env') { say(rec, 'an envelope has exactly five stages — a point is not removable, but a stage can be dragged to zero'); return; }
          const n0 = g.pts.length;
          M.curveEdit(s.id, 'remove', { index: wasIdx });
          say(rec, s.points.length < n0 ? 'point removed' : 'a curve is two points at the least — this one is at its floor');
          apply();
        } else { lastTapIdx = wasIdx; lastTapAt = now; }
        return;
      }
      lastTapIdx = -1;
      if (s.kind === 'env') { say(rec, 'the ENV follows its knobs — its shape is the five stages, not a drawn curve'); return; }
      const r = svg.getBoundingClientRect();
      const q = uv({ x: e.clientX - r.left, y: e.clientY - r.top });
      const n0 = s.points.length;
      M.curveEdit(s.id, 'add', { t: q.t, v: q.v });
      say(rec, s.points.length > n0 ? 'point added' : 'thirty-two points is the curve\'s ceiling');
      apply();
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', () => { mode = null; box = null; key = null; });
  }

  // Each meter is both an input-level display and a response-range editor.
  function buildAudioRanges(rec) {
    const {s, dev} = rec;
    dev.root.classList.add('audio-ranges');
    const root = el('div', 'aud-ranges', dev.ed.box);
    root.setAttribute('aria-label', 'Audio response ranges');
    const rows = {};
    const select = key => { audBands.set(s.id, key); syncKnobs(rec); paintAudio(rec); };
    const patch = (key, q) => { for(const k of ['floorDb','ceilingDb'])if(Number.isFinite(q[k]))q[k]=Math.round(q[k]*10)/10; M.setSource(s.id, {audio:{outs:{[key]:q}}}); apply(); paintAudio(rec); };
    const shift = (key, delta, base=s.audio.outs[key]) => {
      delta = Math.max(M.AUDIO_RANGE_MIN-base.floorDb, Math.min(M.AUDIO_RANGE_MAX-base.ceilingDb, delta));
      patch(key, {floorDb:base.floorDb+delta, ceilingDb:base.ceilingDb+delta});
    };
    for (const key of M.AUDIO_FOLLOWED) {
      const row = el('div', 'aud-range-row', root); row.dataset.band=key;
      const head = el('button', 'aud-range-name', row); head.type='button';
      const name=el('b','',head,key.toUpperCase()), text=el('span','aud-range-value',head);
      head.addEventListener('click',()=>select(key));
      head.title='Select '+key.toUpperCase()+' for ATTACK and RELEASE';
      const track=el('div','aud-range-track',row);
      const fill=el('div','aud-range-output',track), zone=el('div','aud-range-zone',track), cursor=el('i','aud-range-input',track);
      const handles={};
      for(const endpoint of ['floorDb','ceilingDb']) {
        const handle=el('button','aud-range-handle',track); handle.type='button'; handle.dataset.endpoint=endpoint;
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
        const o=s.audio.outs[key],b=track.getBoundingClientRect();
        const db=M.AUDIO_RANGE_MIN+(e.clientX-b.left)/b.width*(M.AUDIO_RANGE_MAX-M.AUDIO_RANGE_MIN);
        const endpoint=e.target.dataset.endpoint || (db<o.floorDb?'floorDb':db>o.ceilingDb?'ceilingDb':null);
        drag={x:e.clientX,w:b.width,base:{...o},endpoint};
        track.setPointerCapture(e.pointerId); if(endpoint)handles[endpoint].focus();
      });
      track.addEventListener('pointermove',e=>{
        if(!drag)return;const delta=(e.clientX-drag.x)/drag.w*(M.AUDIO_RANGE_MAX-M.AUDIO_RANGE_MIN);
        if(!drag.endpoint)shift(key,delta,drag.base);
        else {
          const lo=drag.endpoint==='floorDb'?M.AUDIO_RANGE_MIN:drag.base.floorDb+M.AUDIO_RANGE_GAP;
          const hi=drag.endpoint==='floorDb'?drag.base.ceilingDb-M.AUDIO_RANGE_GAP:M.AUDIO_RANGE_MAX;
          patch(key,{[drag.endpoint]:Math.max(lo,Math.min(hi,drag.base[drag.endpoint]+delta))});
        }
      });
      const end=()=>{drag=null;};track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);track.addEventListener('lostpointercapture',end);
      track.addEventListener('wheel',e=>{if(!e.deltaY)return;e.preventDefault();e.stopPropagation();select(key);shift(key,(e.deltaY<0?1:-1)*(e.shiftKey ? .1 : 1));},{passive:false});
      track.addEventListener('dblclick',e=>{e.preventDefault();e.stopPropagation();patch(key,{floorDb:M.AUDIO_DB_FLOOR,ceilingDb:M.AUDIO_DB_TOP});});
      track.title='Drag either boundary to resize; drag inside or scroll to shift; double-click to reset. Fill = output, line = input dB.';
      rows[key]={row,head,text,fill,zone,cursor,handles};
    }
    const hint=el('div','aud-range-hint',root,'Drag edges · scroll range · select band for timing');
    rec.audRanges={root,rows,hint};
  }

  function wireAudioConditioning(rec, sh) {
    const s=rec.s, keys=M.AUDIO_FOLLOWED;
    const selected=()=>audBands.get(s.id)||'level';
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
      }
    };
    const changed=()=>{apply();syncKnobs(rec);paintAudio(rec);refresh();};
    for(const [key,spec] of Object.entries(specs)) {
      const row=sh.rows[key],input=el('input','aud-setting-input',row.val);row.input=input;
      input.type='number';input.min=spec.min;input.max=spec.max;input.step=spec.step;input.setAttribute('aria-label',row.lab.textContent+' '+spec.unit);
      const write=v=>{
        if(!Number.isFinite(v)){refresh();return;}
        v=Math.max(+input.min,Math.min(+input.max,v));
        M.setSource(s.id,{audio:spec.global?{[spec.field]:v}:{outs:{[selected()]:{[spec.field]:v}}}});changed();
      };
      input.addEventListener('change',()=>write(input.valueAsNumber));
      row.dn.addEventListener('click',()=>write(input.valueAsNumber-spec.step));row.up.addEventListener('click',()=>write(input.valueAsNumber+spec.step));
    }
    for(const [button,dir] of [[sh.rows.out.dn,-1],[sh.rows.out.up,1]])button.addEventListener('click',()=>{audBands.set(s.id,keys[(keys.indexOf(selected())+dir+keys.length)%keys.length]);changed();});
    for(const button of [sh.rows.gate.dn,sh.rows.gate.up])button.addEventListener('click',()=>{M.setSource(s.id,{audio:{gateEnabled:!s.audio.gateEnabled}});changed();});
    sh.rows.hold.leg.textContent='Gate HOLD delays closing; RELEASE shapes the fall. Turn GATE off for uninterrupted release tails.';
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
      row.text.textContent=o.floorDb.toFixed(1)+' / '+o.ceilingDb.toFixed(1)+' dB';
      row.fill.style.width=(o.out*100).toFixed(1)+'%';row.zone.style.left=lo+'%';row.zone.style.width=(hi-lo)+'%';
      row.cursor.style.left=position(o.inputDb)+'%';
      for(const endpoint of ['floorDb','ceilingDb']) {
        const h=row.handles[endpoint];h.style.left=position(o[endpoint])+'%';
        h.setAttribute('aria-valuemin',endpoint==='floorDb'?M.AUDIO_RANGE_MIN:o.floorDb+M.AUDIO_RANGE_GAP);
        h.setAttribute('aria-valuemax',endpoint==='floorDb'?o.ceilingDb-M.AUDIO_RANGE_GAP:M.AUDIO_RANGE_MAX);
        h.setAttribute('aria-valuenow',o[endpoint]);h.setAttribute('aria-valuetext',o[endpoint].toFixed(1)+' dB');
      }
      row.head.title=key.toUpperCase()+' · '+(o.out*100).toFixed(0)+'% output · '+(Number.isFinite(o.inputDb)?o.inputDb.toFixed(1):'−∞')+' dB input';
    }
    const out=ro.outs[selected];ui.hint.textContent=selected.toUpperCase()+' · A '+out.attackMs.toFixed(0)+' / R '+out.releaseMs.toFixed(0)+' ms · GATE '+(ro.gateEnabled?'ON':'OFF');
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
    A.srcBtn.textContent = cap.live ? 'MIC ON' : 'MIC';
    A.liveLed.style.background = cap.live ? 'var(--acc2)' : '';
    A.liveTxt.textContent = cap.live ? 'LIVE' : cap.state.toUpperCase();
    A.live.classList.toggle('on', cap.live);
    A.note.textContent = cap.live
      ? (ro.sampleRate ? (ro.sampleRate / 1000).toFixed(1) + ' kHz · ' + ro.feedHz.toFixed(0) + ' Hz feed' : 'listening')
      : (cap.reason || 'the microphone is closed — press MIC');
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
    for (const key of Object.keys(A.outs)) {
      const row = A.outs[key], sock = M.scalarOutputId ? M.scalarOutputId(s.id, key) : null;
      const ix = sock ? macros.findIndex((m) => m.sourceId === sock) : -1;
      row.slot.textContent = key === 'hit' ? 'EVT' : (ix >= 0 ? String(ix + 1) : '--');
      const v = ro.outs[key] ? ro.outs[key].out : 0;
      row.row.classList.toggle('on', cap.live && (key === 'hit' ? v > 0 : v > 0.02));
      row.box.classList.toggle('on', ix >= 0);
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
    if(rec.kind==='audio' && (key==='attack'||key==='release'))q.k.dial.setAttribute('aria-label',(audBands.get(rec.id)||'level').toUpperCase()+' '+key.toUpperCase());
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
    /* WAVE 83 · two decimals, not three (Josh: "have it only show up to .00 decimals").  The third
       figure moved on its own at every tap and bought nothing: 1 BPM is 0.0167 Hz, so the second
       decimal already resolves a single beat per minute. */
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
      const shownDepth = P.macroMin ? m.value : m.masterDepth;
      if (force) {
        rec.vname.textContent = m.name;
        rec.root.classList.toggle('m2locked', !!m.sourceId);
        rec.root.style.setProperty('--m2-slot-ink',
          !src ? 'var(--m2-ink-faint)' : src.kind === 'env' ? 'var(--m2-env-ink)' : 'var(--acc)');
        rec.drive.textContent = src ? (src.kind.toUpperCase() + ' ' + (src.label || src.id)) : 'HAND';
        rec.route.textContent = pad2(M.routeCountOfMacro(m.id)) + ' OUT';
        rec.depthArc.style.strokeDasharray = clamp01(shownDepth).toFixed(4) + ' 1';
        rec.numSeat.classList.toggle('m2zero', shownDepth <= 1e-6);
        rec.numSeat.setAttribute('aria-disabled',String(P.macroMin && !!m.sourceId));
        if(rec.val)rec.val.setAttribute('aria-disabled',String(!!m.sourceId));
        rec.numSeat.title = P.macroMin ? m.name+' value'+(m.sourceId?' — driven by source':'') : 'MASTER DEPTH';
      }
      if (rec.kind === 'trigger') {
        rec.signal.style.setProperty('--hit', M.triggerLevel(m.id).toFixed(4));
        rec.vnum.textContent = M.subCountOfTrigger(m.id) + ' SUB';
      } else {
        rec.signal.style.setProperty('--fill', clamp01(m.value).toFixed(4));
        rec.vnum.textContent = (100 * m.value).toFixed(0) + '%';
      }
      /* WAVE 79 · THE INDICATOR WEARS THE CURVE'S OWN COLOUR (Josh: "Have that indicator also match
         the colors of the curves into the indicator").  The device draws its curve in Accent A for an
         LFO and in the artifact's own derived ENV ink for an envelope; the ring on the macro that
         curve is driving now reads the same, so a glance down the rail says WHICH source holds each
         macro without reading the DRIVE line.  A macro on HAND keeps the neutral ring. */
      aria(rec.numSeat, P.macroMin ? m.name+' VALUE' : 'MACRO '+rec.index+' DEPTH', 0, 100, 100*shownDepth, (100*shownDepth).toFixed(0)+'%');
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
      /* WAVE 93 · THE OUT SEAT NAMES THE MACRO BY ITS NUMBER, NOT ITS NAME.  Josh: "OUT routing also
         has to not be the renamed text of the macro name but rather be the number of the macro
         similar to how the minimized version does it."  A macro is renameable, so the name is
         whatever a user typed — it wraps, it truncates, and it changes the width of a fixed seat.
         The NUMBER is what the rail's own indicator shows and it is one character; the minimised
         device already reads that way (`.m2minnum`), so the full one now agrees with it. */
      const macros = M.macroList();
      const heldIx = macros.findIndex((m) => m.sourceId === s.id);
      const heldBy = heldIx >= 0 ? macros[heldIx] : null;
      if (force && dev.mac) dev.mac.textContent = heldBy ? String(heldIx + 1) : '--';
      if (dev.bus) {
        const f = s.triggerId ? fireSources().find((q) => q.id === s.triggerId) : null;
        dev.bus.textContent = f ? f.label : '--';
        dev.bus.classList.toggle('m2bushit', !!(f && f.hit));   /* a signal binding, not a hand one */
      }
      if (force && dev.lfoWave) dev.lfoWave.textContent = s.shapeMode === 'curve' ? 'CURVE' : M.WAVE_LABEL[s.wave];
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
      if (force && dev.compactLfo) { dev.compactLfo.shapeValue.textContent = s.shapeMode === 'curve' ? 'CURVE' : M.WAVE_LABEL[s.wave];
                            dev.compactLfo.macroValue.textContent = heldBy ? heldBy.name : '--'; }

      /* WAVE 101 · A COMPACT ENVELOPE IS ALWAYS FITTED.  Josh: "For ENV in compact mode, it should
         automatically always be in 'fit' mode."  COMPACT hides the ↑ FIT ↓ column outright
         (`.m2dev.m2cmp.env .m2zoom { display: none }`), so the one control that frames the picture is
         not reachable there — a compact envelope could sit at whatever window the FULL card was left
         on and show a flat line or a sliver.  FIT's own arithmetic, applied whenever the drawn length
         has moved off the window by more than a hair, so it costs nothing on a settled card. */
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
      if (e !== lastEdge) { lastEdge = e; place(); }
      paint(true);
    });
    ro.observe(panel);
  }

  /* ═══ OPEN · CLOSE · PERSIST ════════════════════════════════════════════════════════════ */
  let persistFn = port.persist || (() => {});
  const persist = () => persistFn(presentation());
  function presentation() {
    return { x: P.x, y: P.y, lane: P.lane, ribbon: P.ribbon, modes: { ...P.modes }, open: P.open, folder: { ...P.folder }, macroSide: P.macroSide, macroMin: P.macroMin };
  }
  /* WAVE 105 · THE CHIPS TOLD THE TRUTH ONLY UNTIL A RELOAD.  `.on` and `aria-pressed` were
     written by the three click handlers and by nothing else, so a window restored with the
     work lane on top, the ribbon out, or every card compact came back with all three chips
     reading OFF — and the screen reader read them as OFF.  Wave 101 made this worse, not
     better: a compact rack whose chip says otherwise inherits the wrong seat. */
  function syncChips() {
    const all = devOrder();
    const cmp = all.length > 0 && all.every((x) => modeOf(x.id) !== 'F');
    for (const [chip, on] of [[chips.compact, cmp], [chips.workbars, P.lane === 'top'], [chips.ribbon, P.ribbon]]) {
      if (!chip) continue;
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      chip.classList.toggle('on', on);
    }
  }
  function restore(o) {
    if (!o) return;
    if (Number.isFinite(o.x)) { P.x = o.x; P.y = o.y; placed = true; }   // a remembered position is a hand's
    if (o.lane === 'top') { P.lane = 'top'; setWorkLane(panel, 'top'); }
    if (o.ribbon) { P.ribbon = true; rackEl.root.classList.add('m2ribbon'); }
    if (o.modes) Object.assign(saved, o.modes);      /* claimed once, by the first source to bear the id */
    if (o.folder) Object.assign(P.folder, o.folder);
    setMacroSide(o.macroSide === 'right' ? 'right' : 'left');
    P.macroMin = !!o.macroMin; root.querySelector('.m2rail').classList.toggle('m2railmin', P.macroMin);root.querySelector('.m2railhead').setAttribute('aria-expanded',String(!P.macroMin));
    for (const s of devOrder()) { const r = devRows.get(s.id); if (r) setDeviceMode(r.dev, modeOf(s.id)); }
    syncChips();
    if (o.open) open();
    else place();
  }
  function open() {
    P.open = true;
    root.hidden = false; rail.hidden = false;
    rebuild(); place(); paint(true);
    persist();
    return true;
  }
  function close() {
    /* CLOSING IS A LAYOUT ACT AND NOTHING ELSE.  It does not reach the clock, the model or the
       registry — the boundary law, and the other project's one YELLOW was exactly this. */
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
               lawW: sizeLaw.width(cardModes(), { uiScale: 1, ribbon: P.ribbon }),
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
      return { x: b.left + rec.g.X(t), y: b.top + rec.g.Y(v), box: { left: b.left, top: b.top, width: b.width, height: b.height } };
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

  /* WAVE 75 · IT OPENS WITH AN LFO AND AN ENV (Josh, "have it by default have LFO and an ENV for
     testing").  Only ever on a rack that is genuinely EMPTY — a browser that has saved a rack, or a
     host that built one, keeps exactly what it had; this seeds a first run and nothing else. */
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
      audRings.clear(); audBands.clear();
      endArm(); closePop();
      if (ghost) { ghost.remove(); ghost = null; }
      for (const [, rec] of rings) rec.svg.remove(); rings.clear();
      root.remove(); rail.remove();
    }
  };
}
