/* modulation/window.js — THE MODULATION WINDOW'S CONTROLLER, importable.
 *
 * What it is: the controller that wires the kit's modulation window (modwindow/modwindow.js builds its DOM and wires
 * nothing) to the model (mod.js), a parameter registry (registry.js) and a clock (host.js).  Until 1.5 every app
 * carried its own copy of this file — λWAVES lab/modwindow.js, byte-identical in NEBULA and SOLEIL (3,084 lines), a
 * fork in BASINS — because it could not be imported.  This is that file, taken into the kit; an app imports it (most
 * through bind.js, which builds the port from a parameter list) and deletes its copy.
 *   createModulation(host, port) → { root, rail, api, open, close, toggle, isOpen, paint, sync, rebuild,
 *                                    presentation, restore, setAccent, say, resumeSentence, wake, dispose }
 *
 * THE LAWS IT KEEPS
 *   1. ONE WINDOW SET.  The chip rail is window/rail.js createRail (so the long press, the keyboard and the Shift-drag
 *      relocation come with it); the placement is window/window.js windowLayout (the house clamp and the dock); the
 *      drag is core/pointer.js drag (Escape, a lost capture, a blur or a hidden page rolls it back); the dock guide is
 *      window/dock.js createDockGuide, drawn at exactly the rect windowLayout lands the window in, with the chip lane
 *      on whichever side the chips sit (BASINS' guide reserved the left lane always and landed elsewhere); the landing
 *      and every relocation travel by core/motion.js tweenRect (transform, one layout commit); open and close by
 *      presence.  The rail keeps the plugin's own material — its sheets key on data-mir-rail="modulation" — so the
 *      resting window does not change.  The pane is NOT a window.js pane: #modwin lays out overflow:visible with
 *      floating work bars and pickers outside its box, which `.mir-win` (overflow hidden, contain paint) would cut.
 *   2. A FADER IS A TARGET LIKE A KNOB.  `.k[data-param]` and `.fd[data-param]` route (port.targets).  A knob wears
 *      the ring; a fader wears a range bar (.m2fdrange); both get the range dial and the × while the hand is on them.
 *   3. ROUTING SHOWS WHERE IT WILL LAND.  While a macro's grip is dragged every routable control gets a strength by
 *      distance (core/proximity.js); inside capture, release routes there even when the finger is beside a small
 *      target.  Painted in accent B — a route is a relationship.
 *   4. THE PLAY DOT IS TRUE.  It is placed from the model on every paint, and a forced paint that met an unlaid
 *      editor box no longer pins the box's signature empty for ever (the cause; see paint()).
 *   5. STRINGS ARE NOT CODE.  Every word this file shows goes through t() / label() / ariaLabel(); case is the
 *      string's, never toUpperCase(); nothing is found by its label text.
 *   6. IDLE COSTS NOTHING.  No interval and no rAF of its own: the host's clock calls paint().
 *   7. ONE CLOCK (1.5.0-alpha.4).  The work bar's first seat is modulation's POWER (BASINS' drawing and behaviour), not a
 *      play: a press flips port.arm, which bypasses or restores the routes; the window never plays or pauses time.
 * Kept as they were: every law in modwindow/ACCEPTANCE.md and host-contract.md, the FL curve gestures
 * (curve-gesture.js), Sol's automation / exact resume / runtime capture in host.js and mod.js.
 */
import { el, svgEl, seg, trig, knob, tapWatcher, gripDots, label, ariaLabel, hint as hintTo, gearOf, watchTouches } from '../kit.js';
import { bindSliderKeys } from '../slider-keys.js';
import { createModWindow, setDeviceMode, setWorkLane, sizeLaw, GEOM,
         buildGhost, buildAudioSheet, COPY } from './modwindow/modwindow.js';
import { evaluate as curveEval, curveHash, curveInfo, presetPoints, presetMirror,
         pointsEqual, PRESET_LABEL } from './curve.js';
import { svgPoint, curveHit, curveAction, pointDrag, pointAddValue, tensionDelta,
         editablePresetForWave } from './curve-gesture.js';
import { createRail, seatRail, seatOn, roomFor, SIDES } from '../window/rail.js';
import { createDockGuide } from '../window/dock.js';
import { windowLayout, dockInput, stackedAt, windowOf, gripGesture } from '../window/window.js';
import { workspaceSwitch } from '../window/workspaces.js';
import { bindTempoField } from '../shell/transport.js';
import { tweenRect, presence, owns, settled } from '../core/motion.js';
import { createProximity } from '../core/proximity.js';
import { rect as rectOf } from '../core/perf.js';
import { t, tn, phrase, onLanguage } from '../core/i18n.js';
import { clipKinds } from '../timeline/kinds.js';
import { normalizeTimelinePoints } from '../timeline/source.js';
import { STEP_BEATS } from '../pattern/model.js';
import { createReadoutLayer } from '../timeline/readout.js';
import { createModCursor } from './mod-cursor.js';
import { createLayoutMotion, wireReorder as reorderEngine } from './layout-motion.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const pct = (u) => (100 * clamp01(u)).toFixed(2) + '%';
const SVGNS = 'http://www.w3.org/2000/svg';
/* the house drag ladder, from kit.js's own knob: 220 px is a full scale, 900 with Shift, 320
   under a finger.  Reused rather than re-chosen so the artifact's dials feel like the lab's.  Shift is 1/8 (1760), as BASINS
   has it (Josh 09-12: "currently holding shift gives a 1/4 fine tuning, can we make this 1/8?"). */
const TRAVEL = (e, touch) => (e.shiftKey ? 1760 : touch ? 320 : 220);
const TENSION_PX = 114, GRAB = 20;

/** the controls a macro may route onto: a knob, a fader and a range slider's thumb, each carrying the registry id in data-param */
export const ROUTABLE = '.k[data-param], .fd[data-param], .rng-t[data-param]';
/** the routing glow's law (core/proximity.js): a control starts to glow 56 px away and captures the drop at 18 px */
export const ROUTE_REACH = 56, ROUTE_CAPTURE = 18;

/** the words for a kind and a band, so no code upper-cases a string (docs/LANGUAGES.md: case is the string's) */
const KIND_WORD = Object.freeze({ lfo: { t: 'LFO' }, env: { t: 'ENV' }, audio: { t: 'AUDIO' }, audioout: { t: 'AUDIO' } });
const BAND_WORD = Object.freeze({ level: { t: 'LEVEL' }, low: { t: 'LOW' }, mid: { t: 'MID' }, high: { t: 'HIGH' }, hit: { t: 'HIT' }, beat: { t: 'BEAT' } });
const BAND_SHORT = Object.freeze({ level: 'A', low: 'L', mid: 'M', high: 'H' });
/** a device's run state, as the paint shows it (the logic compares the English ids) */
/* the waveform and shape labels mod.js (WAVE_LABEL) and curve.js (PRESET_LABEL) name: those two files are ports kept
   by diff, so their tables stay plain, and the catalogue learns the words here.  Shown through { t: … } below.  Not
   exported (nothing imports it): the phrase() calls are what it is for. */
const WAVE_WORDS = Object.freeze([phrase('SAW↑'), phrase('SAW↓'), phrase('SINE'), phrase('TRI'), phrase('SQR'), phrase('S&H'), phrase('DRIFT'), phrase('MULTI-SAW'), phrase('MULTI-TRI')]);   // tr: waveform names (saw up, saw down, sine, triangle, square, sample-and-hold, a slow random drift); most languages keep these as written
const STATE_WORD =Object.freeze({ OFF: { t: 'OFF' }, GATE: { t: 'GATE' }, REL: { t: 'REL' }, RUN: { t: 'RUN' }, IDLE: { t: 'IDLE' }, HOLD: { t: 'clock state::HOLD' } });   // tr[clock state::HOLD]: — the modulation clock is held (paused in place), as opposed to RUN
const CAPTURE_WORD = Object.freeze({ idle: { t: 'IDLE' }, asking: { t: 'ASKING' }, live: { t: 'LIVE' }, denied: { t: 'DENIED' }, error: { t: 'ERROR' }, closed: { t: 'CLOSED' } });
const kindWord = (k) => (KIND_WORD[k] ? t(KIND_WORD[k].t) : String(k));
const bandWord = (k) => (BAND_WORD[k] ? t(BAND_WORD[k].t) : String(k));
const stateWord = (s) => (STATE_WORD[s] ? t(STATE_WORD[s].t) : String(s));

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
const cyclesShown = (s) => (s.shapeMode !== 'curve' && stochastic(s) ? 4 : 1);
const fmtBeat = (v) => (v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3)) + ' beat';
const SHAPES = ['tri', 'sawup', 'sine', 'square', 'msaw', 'mtri'];


const CHECK_HINT = {
  sync: phrase('{:BPM} · quantise the LFO rate to the loop clock'),
  anchor: phrase('{:ANCHOR} · resume from the paused phase'),
  invert: phrase('Invert the curve output: 1 − v'),
  triplet: phrase('the note ladder × 2/3 — three in the space of two'),
  dotted: phrase('the note ladder × 3/2 — a note and a half'),
  gate: phrase('{:GATE} holds sustain until release; off, the envelope runs once')
};

/** THE CHIP RAIL, as window/rail.js chip tables.  One row per state, declared once: what aria-pressed means for
 *  WORK BARS (true above, mixed hidden) is written here and nowhere else. */
const GRIP_HINT = phrase('Drag window · Shift-drag, or hold, to move these controls to another edge · arrows when focused');
const RAIL_CHIPS = Object.freeze([
  { name: 'close', kind: 'close', glyph: 'close', label: 'Close window', hint: 'Close window' },
  { name: 'compact', kind: 'cycle', label: 'COMPACT', states: [
    { id: 'F', pressed: false, glyph: 'compact', label: 'Devices: Full. Tap for Compact', hint: 'COMPACT · FULL' },
    { id: 'C', pressed: true, glyph: 'compact', label: 'Devices: Compact. Tap for Minimized', hint: 'COMPACT · COMPACT' },
    { id: 'M', pressed: 'mixed', glyph: 'compact', label: 'Devices: Minimized. Tap for Full', hint: 'COMPACT · MINIMIZED' }] },
  { name: 'workbars', kind: 'cycle', label: 'Work bars', states: [
    { id: 'bottom', pressed: false, glyph: 'barsTop', label: 'Work bars: below. Tap to move them above', hint: 'WORK BARS · BOTTOM' },
    { id: 'top', pressed: true, glyph: 'barsTop', label: 'Work bars: above. Tap to hide them', hint: 'WORK BARS · TOP' },
    { id: 'hidden', pressed: 'mixed', glyph: 'barsTop', label: 'Work bars: hidden. Tap to move them below', hint: 'WORK BARS · HIDDEN' }] },
  { name: 'ribbon', kind: 'toggle', glyph: 'leave', label: 'RIBBON', hint: 'RIBBON' },
  { name: 'drag', kind: 'grip', label: 'Drag window', hint: GRIP_HINT },
]);
/** the English label of a chip in a state (the rail writes it; the controller translates it in place) */
function chipWords(name, state) {
  const spec = RAIL_CHIPS.find((c) => c.name === name); if (!spec) return null;
  if (spec.kind === 'cycle') { const row = spec.states.find((s) => s.id === state) || spec.states[0]; return { label: row.label, hint: row.hint }; }
  return { label: spec.label, hint: spec.hint };
}

/* ═══ THE MACRO ROW'S GESTURES, IMPORTABLE (1.5.0-alpha.12) ════════════════════════════════════════════════════════════
   Another face of the macro row (BASINS' transport tempo panel: transport.js buildMacros) uses THIS window's own
   gestures, never copies: the routing grip (drag to route, tap to arm), the numbered depth seat (vertical drag, keys,
   double-tap to 100 %), its paint, and the reorder.  The model is one per page (mod.js), so the window is too: these
   reach the window createModulation mounted last, and do nothing (→ false) while none is mounted.
     wireGrip(grip, macroId) · wireDepth(seat, macroId, n) · paintDepth(seat, arc, macroId) · moveMacro(macroId, to) */
let liveApi = null;
export function wireGrip(grip, macroId) { if (!liveApi) return false; liveApi.wireGrip(grip, macroId); return true; }
export function wireDepth(seat, macroId, n) { if (!liveApi) return false; liveApi.wireDepth(seat, macroId, n); return true; }
export function paintDepth(seat, arc, macroId) { if (!liveApi) return false; liveApi.paintDepth(seat, arc, macroId); return true; }
export function moveMacro(macroId, to) { if (!liveApi) return false; liveApi.moveMacro(macroId, to); return true; }

/* ═══════════════════════════════════════════════════════════════════════════════════════════
 *  THE WINDOW
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * @param {HTMLElement} host  where the window and its chip rail are appended (`#floats`)
 * @param {object} port — what the app supplies (bind.js builds all of it from a parameter list):
 *   M, registry, clock     the model, the registry and the clock (host.js createModHost)
 *   apply()                after an edit: re-apply the routes and ask for a frame
 *   knobOf(id)             the widget a target id drives ({ root, paint }), or null (then the DOM's [data-param])
 *   persist(presentation)  store the window's own state (position, dock, chip side, card modes …)
 *   cadence(), setCadence(hz)   the modulation update rate, 60 | 120
 *   armed(), arm(on)       modulation's power (bind.js power / setPower); absent: clock.setModulationEnabled
 *   audio                  the audio capture edge ({ state, support, start, stop, sync, devices }), or absent
 *   rateControl()          a widget to seat in the timing bar, or absent
 *   moved(rect | null)     where the window now is (null when it closes), for a transport dodge
 *   opened(), closed()     presentation demand
 *   presetKey              this app's preset storage key (mod.js setPresetKey); absent keeps the model's
 *   copy                   words of the window (modwindow.js COPY), e.g. { factory: 'MANDELBROT' }
 *   dock                   { span: observeSpan(…), guide: () => bool } · false: never docks · absent: the viewport
 *   targets                the selector of routable controls (default ROUTABLE)
 */
export function createModulation(host, port) {
  const M = port.M, registry = port.registry, clock = port.clock;
  const apply = port.apply || (() => {});
  const ROUTE_SEL = port.targets || ROUTABLE;
  const owned = typeof port.owned === 'function' ? port.owned : () => false;   // a macro a panel drives (bind.js own): never a source's
  if (port.presetKey && M.setPresetKey) M.setPresetKey(port.presetKey);
  const audBands = new Map();
  const audRoutes = new Map();

  /* ── THE ARTIFACT, BUILT ───────────────────────────────────────────────────────────────── */
  const root = createModWindow({
    /* COPY customizes audio's face while the ported files stay frozen. */
    copy: { factory: phrase('FACTORY'), knobs: {...COPY.knobs, audio:[['sens',phrase('GAIN'),'-24','+24'],['attack',phrase('ATTACK'),'0','2s'],['release',phrase('RELEASE'),'0','2s'],['peakHold',phrase('HOLD', 'peak hold'),'0','2s']]},
      audioSheetRows:[['out',phrase('BAND')],['lower',phrase('LOWER')],['upper',phrase('UPPER')],['att',phrase('ATTACK')],['rel',phrase('RELEASE')],['gate',phrase('NOISE GATE')],['thresh',phrase('GATE dB')],['hold',phrase('GATE HOLD')],['hyst',phrase('HYST')],['flux',phrase('HIT SENSE')]],
      ...(port.copy || {}) }
  });
  host.appendChild(root);

  /* ═══ THE CHIP RAIL — window/rail.js, wearing the plugin's own material ═════════════════════
     createRail builds `.mir-rail > .mir-chip`; this window's sheets paint `.crail.kwin-chiprail[data-mir-rail=
     "modulation"] .crail-chip` (modwindow.css PART A, modhost.css), so the rail is re-classed once and its inks
     after each write — the same DOM the old builder made, now with a grip that is a button (keyboard, long press). */
  let P = null;                                       // the presentation state, below; the rail's callbacks read it late
  const rail = createRail({ id: 'modulation', title: 'MODULATION', chips: RAIL_CHIPS, layer: host,
    seats: () => SIDES.map((side) => ({ id: side, rect: relocated(side).seat })),
    onChip: (name, state) => chipPressed(name, state),
    onSide(side, phase) {
      if (phase === 'preview') { if (!kbBefore) kbBefore = { ...P }; relocate(side); return; }
      if (phase === 'cancel') { if (kbBefore) { Object.assign(P, kbBefore); kbBefore = null; place({ animate: true }); } return; }
      kbBefore = null;
      if (side && side !== P.chipSide) relocate(side);
      persist();
    },
    onNudge(dx, dy) { if (P.dock || !box) return; P.x = box.left + dx; P.y = box.top + dy; place({ animate: true }); persist(); },
  });
  host.appendChild(rail.el);
  rail.el.className = 'crail crail-float kwin-chiprail kwin-chiprail-left';
  ariaLabel(rail.el, '{name} window controls', { name: { t: 'MODULATION' } });
  const chips = { close: rail.chip('close'), compact: rail.chip('compact'), workbars: rail.chip('workbars'), ribbon: rail.chip('ribbon'), drag: rail.grip };
  /** the plugin's classes and hooks on one chip, and its words in the current language */
  function dressChip(name) {
    const b = chips[name]; if (!b) return;
    const kind = b.dataset.kind;
    b.classList.remove('mir-chip');
    b.classList.add('kwin-tab', 'crail-chip');
    if (kind === 'grip') b.classList.add('crail-grip');
    if (kind === 'close') b.classList.add('kwin-close-chip');
    b.dataset.rail = name;
    b.dataset.chromeKind = kind === 'grip' ? 'drag' : kind === 'close' ? 'close' : 'action';
    b.dataset.reopensWindow = 'false';
    const ink = b.querySelector(':scope > svg');
    if (ink) { ink.classList.remove('mir-chip-ink'); ink.classList.add('crail-ink'); }
    const dots = b.querySelector(':scope > .mir-grip-dots');
    if (dots) dots.className = 'kwin-grip-dots';
    const w = chipWords(name, rail.state(name));
    if (w) ariaLabel(b, w.label);
  }
  const setChip = (name, state) => { rail.setChip(name, state); dressChip(name); };
  for (const name of Object.keys(chips)) dressChip(name);
  root.modwindow.chiprail = { root: rail.el, chips };

  dressGlass();                         // wave 74: the boot pass; rebuildDevices' callers do the rest
  seatCurveName();
  seatRailHead();

  /* Adding belongs with the rack it changes. The macro rail now owns the two
     explicit ADD MACRO and ADD DEVICE buttons, leaving the window chip rail
     for window-level actions only. */
  const mw = root.modwindow;
  const panel = mw.panel, foot = mw.foot, transport = mw.transport, rackEl = mw.rack;
  /* BASINS' LAYOUT MOTION (layout-motion.js): a fold, COMPACT, the macro rail folding and a reorder animate the real
     widths and the travel; the dragged device or macro follows the hand.  The window's own box is not registered with
     the one-writer registry (its placement would wait on it). */
  const layoutMotion = createLayoutMotion(() => [root, panel, rackEl.rail,
    ...rackEl.run.querySelectorAll('.m2dev'), ...rackEl.slots.querySelectorAll('.m2slot'),
    foot.prebar, transport.root].filter(Boolean), { skipOwn: (n) => n === root });
  let cancelReorder = null;
  /** the English name of an audio-sheet row (COPY.audioSheetRows), never read back from the DOM */
  const sheetWord = (key) => { const r = (mw.copy.audioSheetRows || []).find((x) => x[0] === key); return r ? r[1] : key; };

  /* THE STATUS LINE IS THE WINDOW'S OWN HINT ROW.  `.m2hint` is where BASINS prints the
     window's one sentence of instruction; a transient message takes that seat and the
     artifact's copy comes back verbatim when it clears — no second surface, nothing added.
     Every caller hands it a sentence already through t(). */


  const SAY_MS = 4200;
  let hintMsg = '', hintCls = '', hintAt = 0, hintTimer = 0;
  mw.hint.setAttribute('role', 'status'); mw.hint.setAttribute('aria-live', 'polite');   /* ONE region, ONE line: access.test's A4 counts lines */
  const status = (msg, cls) => {
    hintMsg = msg || ''; hintCls = cls || '';
    hintAt = hintMsg ? performance.now() : 0;
    /* a message is not a label: its English key goes, so a language pass never writes the idle hint over it */
    if (hintMsg) { delete mw.hint.dataset.t; delete mw.hint.dataset.tVars; mw.hint.textContent = hintMsg; } else label(mw.hint, mw.copy.hint);
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
    if (r.law === 'ANCH') return tn(r.anch, '{:ANCHOR} holds the beat: the {n} anchored source — and every BPM source beside it — resumes exactly where the pause caught it',
      '{:ANCHOR} holds the beat: the {n} anchored sources — and every BPM source beside them — resume exactly where the pause caught them');
    if (r.law === 'BPM') return t('the loop clock claims the resume: the beat jumped back {moved} of a beat to the {grid}-beat note boundary just passed', { moved: r.last.moved.toFixed(3), grid: r.grid });
    if (r.law === 'TRIG') return t('{:TRIG}: the curve starts over');
    return '';
  }

  const pick = mw.buildDevicePick();
  const mpick = mw.buildMacroPick();
  const psheet = mw.buildPresetSheet();
  const dead = mw.buildDeadInspector();

  /* ADD AUDIO is offered when the host supplies an audio edge (port.audio) and refused out loud otherwise: a
     control that changes nothing is not offered, and the button stays in the sheet so the sheet keeps its
     geometry.  Adding the device does not touch the microphone; its own AUDIO IN button does, once, on a press. */
  if (pick.btns.audio && !port.audio) {
    pick.btns.audio.disabled = true;
    pick.btns.audio.setAttribute('aria-disabled', 'true');
    pick.btns.audio.title = 'Audio input is unavailable in this browser';
  } else if (pick.btns.audio) {
    pick.btns.audio.title = 'Add an audio follower; {:AUDIO IN} uses the microphone';
  }

  /* ── PRESENTATION STATE.  The window's own, never the model's, never the project's. ────── */
  P = { x: 0, y: 0, lane: 'bottom', ribbon: false, modes: {}, audioMini: {}, open: false, folder: {}, macroSide: 'left', macroMin: false, compactMode: 'F',
        dock: null, chipSide: 'auto' };
  /* THE STORED MODES ARE ADOPTED ONCE, AND A DEAD ID TAKES ITS MODE WITH IT.  `modReset()` recycles
     source ids — the next `s1` is a different device — so a mode kept by id and never pruned puts a
     brand-new LFO on the screen folded because something called `s1` was folded last session.  The
     settings key lands in `saved`; a source claims its entry the first time it is built and the
     entry is spent; and `rebuildDevices` drops the mode of every id the rack no longer has. */
  /* DOCKED, A VERTICAL WHEEL SCROLLS THE DEVICE RUN SIDEWAYS (BASINS deviceWheel): a docked window is as wide as the span
     and its run scrolls; a mouse has only a vertical wheel.  A horizontal wheel, Ctrl (zoom) and a run that fits pass. */
  const deviceWheel = (e) => {
    if (!P.dock || e.defaultPrevented || e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)
      || rackEl.run.scrollWidth <= rackEl.run.clientWidth) return;
    const step = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rackEl.run.clientWidth : 1;
    e.preventDefault(); e.stopPropagation(); rackEl.run.scrollLeft += e.deltaY * step;
  };
  rackEl.run.addEventListener('wheel', deviceWheel, { passive: false });
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

  let stackedLane = false;                            // docked and narrow: the work bars in two rows (placeLane)
  /** the law's box: the width from the cards, the height from the chrome — and what the window's box is */
  function lawBox() {
    const macroTrim = P.macroMin && !P.ribbon ? GEOM.RAIL_W - MACRO_MIN_W : 0;
    const w = sizeLaw.width(cardModes(), { uiScale: 1, ribbon: P.ribbon }) - macroTrim;
    const lawH = sizeLaw.height({ uiScale: 1 });
    /* WAVE 95 · the card lost 32 (modhost §96) and the float's room came down 18 → 6 (§42): `sizeLaw.height` still
       returns chrome + CARD_FULL, and these two numbers are the only place that difference is spent. */
    return { w, h: lawH - CARD_TRIM + FLOAT_ROOM + (stackedLane ? 52 : 0), lawH };
  }
  /* ═══ THE PLACE: one state, one layout — window/window.js windowLayout, the same function the guide asks ══════ */
  const dockOpt = port.dock === false ? null : (port.dock || {});
  const view = () => ({ width: window.innerWidth, height: window.innerHeight });
  const viewSpan = (v) => ({ left: 8, right: v.width - 8, top: 8, bottom: v.height - 8 });
  const env = () => { const v = view(); return { view: v, sizes: rail.sizes(), span: dockOpt ? (dockOpt.span ? dockOpt.span.read() : viewSpan(v)) : null }; };
  /* THE RAIL'S DEFAULT SEAT IS `auto` (BASINS modwindow.js positionChips): the macros' side — left, or right when the
     macro rail sits on the right.  A side the hand chose (Shift-drag, the keyboard, a long press) is kept as chosen. */
  const sideOf = (Q) => (Q.chipSide === 'auto' || !Q.chipSide ? (Q.macroSide === 'right' ? 'right' : 'left') : Q.chipSide);
  const stateFor = (Q) => { const b = lawBox(); return { x: Q.x, y: Q.y, w: b.w, h: b.h, dock: stackOn ? null : Q.dock, chipSide: sideOf(Q) }; };
  let box = null, moving = null, deferred = false, rackOff = null, gripping = () => false, kbBefore = null, stack = null, stackOn = false;
  /* THE CONTENT BOX DOCKS (BASINS modwindow.js place(): "shift = dock top ? geometry.y - content.top : geometry.bottom
     - content.bottom"): the rack and the work bars that show meet the dock edge, not the window's own box, whose float
     room and a lane above the rack would leave a gap or overhang.  The offsets are measured once each layout (placeLane). */
  let contentOff = null;
  /** the window's box and its rail's seat for a state.  On a side seat the rail centres on the RACK, as it always
   *  has (the work-bar lane below the rack is not what the chips belong to). */
  function layoutOf(Q) {
    const e = env();
    let L = windowLayout(stateFor(Q), e);
    if ((L.docked === 'top' || L.docked === 'bottom') && contentOff) {
      const shifted = { ...L.box, top: Math.round(L.box.top + (L.docked === 'top' ? -contentOff.top : contentOff.bottom)) };
      L = { ...L, box: shifted, seat: seatOn(L.seat.side, shifted, e.sizes, e.view) };
    }
    let seat = L.seat;
    /* a top or bottom rail sits outside the CONTENT too (BASINS chipBox = the content box): work bars that hang outside
       the window's box would otherwise sit under it; the outer of the two edges (the window's own glass is never under it) */
    if ((seat.side === 'top' || seat.side === 'bottom') && contentOff && (contentOff.top < 0 || contentOff.bottom < 0)) {
      const top = L.box.top + Math.min(0, contentOff.top), bottom = L.box.top + L.box.height - Math.min(0, contentOff.bottom);
      seat = seatOn(seat.side, { left: L.box.left, width: L.box.width, top, height: bottom - top }, e.sizes, e.view);
    }
    if ((seat.side === 'left' || seat.side === 'right') && rackOff) {
      seat = seatOn(seat.side, { left: L.box.left, width: L.box.width, top: L.box.top + rackOff.top, height: Math.min(rackOff.height, L.box.height) }, e.sizes, e.view);
    }
    return { L, seat, e };
  }
  /** the state after the hand chooses `side`: a floating window makes room for its rail there */
  function relocated(side) {
    const Q = { ...P, chipSide: side };
    if (!Q.dock) { const { L, e } = layoutOf(Q); const r = roomFor(L.box, side, e.sizes, e.view); Q.x = r.left; Q.y = r.top; }
    return { Q, seat: layoutOf(Q).seat };
  }
  function relocate(side) { Object.assign(P, relocated(side).Q); place({ animate: true }); }

  function place({ animate = false } = {}) {
    /* a motion owns the pane — its own landing, or the entrance (presence scales it): a plain place waits for it to
       land (window.js's rule), because the work-bar lane is MEASURED and a transformed box measures wrong */
    if (!animate && owns(root)) {
      if (!deferred) { deferred = true; settled(root).then(() => { deferred = false; place(); }); }
      return;
    }
    const lb = lawBox(), v = view();
    const w = Math.min(lb.w, v.width - 16);
    /* IT STAYS CENTRED UNTIL A HAND MOVES IT.  The window grows and shrinks with the rack — a
       card added is 367 px of new width — and a first appearance that was centred on one card
       and then grew off the right edge is a window nobody can reach the close chip of. */
    if (!placed) {
      P.x = Math.round((v.width - w) / 2); P.y = Math.round(Math.max(56, (v.height - lb.lawH) / 2));
      placed = true;
    }
    /* ── WAVE 100 · A WINDOW THAT GREW IS PULLED BACK ONTO THE SCREEN ── on a change of WIDTH only, so a window the
       hand deliberately pushed half off the screen stays where the hand left it. */
    if (w !== lastW) {
      if (P.x + w > v.width - 8) P.x = Math.max(8, v.width - 8 - w);
      lastW = w;
    }
    /* the rail carries the dock (data-dock): docked at the top or bottom its chips sit tighter, so its length is set first */
    /* THE LEGO STACK (window/workspaces.js, BASINS stackAbove): 8 px above the window stack() names, left edges together */
    const on = stack && !gripping() ? stack() : null;
    stackOn = !!on;
    if (on) {   /* BASINS: the CONTENT's bottom 8 px over the lower window, the window's left on the lower's */
      const off = contentOff || { top: 0, bottom: 0 };
      const at = stackedAt({ width: w, height: lb.h - off.top - off.bottom }, on, v); P.x = at.left; P.y = at.top - off.top;
    }
    const wantDock = !on && P.dock && dockOpt ? P.dock : null;
    rail.setDock(wantDock);
    let { L, seat } = layoutOf(P);
    if ((L.docked || null) !== wantDock) { rail.setDock(L.docked); ({ L, seat } = layoutOf(P)); }   // no room to dock: it floats for now
    box = L.box;
    /* THE CLAMP IS THE HOUSE'S (window.js CLAMP: a header stays reachable, 120 px across and 52 down); a floating
       window keeps the clamped place as its own */
    if (!P.dock) { P.x = box.left; P.y = box.top; }
    if (L.docked) root.dataset.dock = L.docked; else delete root.dataset.dock;
    mw.setViewHeight(lb.lawH);
    /* the artifact clamps its view to CARD_FULL.h, which is still 368 — the shorter card is ours, so
       the view is re-stated after its setter rather than fought with a second one. */
    if (rackEl.root) rackEl.root.style.setProperty('--m2-view-h', (GEOM.CARD_FULL.h - CARD_TRIM) + 'px');
    if (animate && !root.hidden) {
      const tw = tweenRect(root, box); moving = tw;
      tw.then(() => { if (moving !== tw) return; moving = null; placeLane(); seatRail(false); geometryChanged(); });
    } else {
      moving = null;
      root.style.left = box.left + 'px'; root.style.top = box.top + 'px';
      root.style.width = box.width + 'px'; root.style.height = box.height + 'px';
      placeLane();
    }
    rail.seat(animate ? seat : layoutOf(P).seat, { animate });
    /* WAVE 81 · AND THE HOST IS TOLD WHERE THIS WINDOW NOW IS.  The plugin does not reach out and restyle the
       host's transport; it REPORTS its rect, and the host decides whether its own playhead is in the way. */
    if (port.moved) { try { port.moved({ ...box, right: box.left + box.width, bottom: box.top + box.height }); } catch (_) {} }   // a whole rect, as a DOMRect reads: BASINS' shell keeps a report only when it has `right` (W20 TR, the dodge)
    if (P.open) geometryChanged();
  }
  /* THE SEAT ABOVE THE DEVICES (BASINS modwindow.js §391; the PATTERN window docks there): every place, landing, open and
     close is told to the watchers, and `seatBox` reads the device run and the content box (the rack and the work bars
     that show) back.  An animation after a place is the watcher's to follow (pattern/window.js follows for 450 ms). */
  const geometryWatchers = new Set();
  function geometryChanged() { for (const fn of geometryWatchers) { try { fn(P.open); } catch (e) { (globalThis.reportError || console.error)(e); } } }
  function contentBox() {
    const r = rackEl.root.getBoundingClientRect();
    const a = P.lane !== 'hidden' ? foot.prebar.getBoundingClientRect() : r;
    const b = P.lane !== 'hidden' ? foot.pre.getBoundingClientRect() : r;
    return { left: r.left, right: r.right, top: Math.min(r.top, a.top, b.top), bottom: Math.max(r.bottom, a.bottom, b.bottom) };
  }
  const seatBox = () => (P.open ? { run: rackEl.run.getBoundingClientRect(), content: contentBox() } : null);
  /** the rail on its seat for the state as it stands (after a landing, when the rack's offset is measured again) */
  function seatRail(animate) { if (P.open) rail.seat(layoutOf(P).seat, { animate }); }

  /** THE WORK-BAR LANE.  Two absolutely-positioned boxes in one 52 px lane with a real hole between them, placed by
   *  the artifact's own law in VIEWPORT pixels and written back relative to the window.  It measures the laid-out
   *  window, so it runs when the box has landed (at once, or when a landing ends). */
  function placeLane() {
    const v = view();
    const bars = sizeLaw.workBars(box.left + box.width, v.width, M.dormantCount() > 0);
    /* the MIR switch takes 44 px of the preset bar (BASINS: the extended bar clamps inside a narrow window, never past it) */
    if (wsSwitch) {
      const deadWidth = bars.presetW - bars.coreW;
      bars.coreW = Math.min(bars.coreW + 44, Math.max(200, box.width - 22 - deadWidth));
      bars.presetW = bars.coreW + deadWidth;
    }
    foot.prebar.style.width = bars.presetW + 'px';
    foot.prebar.style.setProperty('--m2-precore-w', bars.coreW + 'px');

    let railX = 0;
    const footEl = foot.prebar.parentElement;
    if (footEl && rackEl.rail) {
      const rr = rackEl.root.getBoundingClientRect(), fr = footEl.getBoundingClientRect();
      if (rr.width > 0) railX = Math.round(rr.left - fr.left);
    }
    foot.prebar.style.left = railX + 'px';
    const minPre = railX + bars.presetW + GEOM.WORK_GAP_MIN;

    let preLeft = bars.left - box.left;
    /* WAVE 80 · THE BAR IS MEASURED, NOT DECLARED.  modhost §58 lets `.m2pre` size to its contents, and the right
       edge still lands on the last device — so the width is read back after the box has laid out rather than
       written from the law.  The law's number is the fallback for the frame before layout exists.  WAVE 100 · the
       edge is capped at the RUN's own right edge: a scrolled run's last card can sit far off-screen. */
    foot.pre.style.width = '';
    const tw = Math.round(foot.pre.getBoundingClientRect().width) || bars.width;
    if (footEl && rackEl.run) {
      const cards = rackEl.run.querySelectorAll('.m2dev');
      const runR = rackEl.run.getBoundingClientRect().right;
      const edge = Math.min(cards.length ? cards[cards.length - 1].getBoundingClientRect().right : runR, runR);
      const fr = footEl.getBoundingClientRect();
      if (edge > fr.left) preLeft = (edge - fr.left) - tw;
    }
    /* DOCKED AND NARROW, THE TWO WORK BARS TAKE TWO ROWS (BASINS place(): "two geometry rows only when the central span
       cannot fit both"): the timing bar drops to a second 52 px row, right-aligned, and scrolls under a finger when even
       that row is too short; the window's height grows by the row (lawBox), so a dock keeps its edge. */
    const barRoom = Math.round(rackEl.root.getBoundingClientRect().width) || box.width - 22;
    const stacked = !!P.dock && P.lane !== 'hidden' && barRoom < bars.presetW + tw + GEOM.WORK_GAP_MIN;
    if (footEl) { footEl.style.height = stacked ? '104px' : ''; footEl.style.flexBasis = stacked ? '104px' : ''; }
    foot.pre.style.top = stacked ? '52px' : '';
    foot.pre.style.overflowX = stacked && tw > barRoom ? 'auto' : '';
    foot.pre.style.overflowY = stacked && tw > barRoom ? 'hidden' : '';
    if (stacked && tw > barRoom) foot.pre.style.width = barRoom + 'px';
    foot.pre.style.left = Math.round(stacked ? Math.max(0, barRoom - tw) : Math.max(preLeft, minPre)) + 'px';
    if (stacked !== stackedLane) { stackedLane = stacked; queueMicrotask(() => { if (P.open) place(); }); }   // the height changed: one more place

    const rootBox = rackEl.root ? rackEl.root.getBoundingClientRect() : null;
    const winBox = root.getBoundingClientRect();
    if (rootBox && rootBox.height > 0) rackOff = { top: rootBox.top - winBox.top, height: rootBox.height };
    if (rootBox && rootBox.height > 0 && !moving) {
      const cb = contentBox(), next = { top: Math.round(cb.top - winBox.top), bottom: Math.round(winBox.bottom - cb.bottom) };
      const was = contentOff; contentOff = next;
      /* the content's offset moved (the lane went up or down, the bars stacked): a docked or stacked window places again */
      if ((P.dock || stack) && (!was || was.top !== next.top || was.bottom !== next.bottom)) queueMicrotask(() => { if (P.open) place(); });
    }
    /* WAVE 87 · THE LANE'S LIFT, WRITTEN WHERE THE BARS CAN READ IT — on the window root, an ancestor of both the
       rack and the bars (custom properties inherit down, never sideways), and MEASURED FROM THE BAR ITSELF: the
       bar does not start where the root ends.  Skipped while the lane is already up, because the bar's rect is
       translated then and would fold the lift into itself. */
    const cardEl = rackEl.run && rackEl.run.querySelector('.m2dev');
    const laneTop = panel.classList.contains('m2bars-top');
    if (rootBox && rootBox.height > 0 && cardEl && !laneTop) {
      const cb = cardEl.getBoundingClientRect();
      const bb = foot.prebar.getBoundingClientRect();
      const gap = Math.round(bb.top - cb.bottom);
      root.style.setProperty('--m2-lane-lift', Math.round(bb.top - (cb.top - gap - bb.height - (stackedLane ? 52 : 0))) + 'px');
    } else if (rootBox && rootBox.height > 0 && !root.style.getPropertyValue('--m2-lane-lift')) {
      root.style.setProperty('--m2-lane-lift', Math.round(rootBox.height + 52) + 'px');
    }
  }

  /** the four accent numbers the artifact derives 57 tints from — host-contract PART 1 §3.  Two elements carry
   *  them: the window and its rail.  Nothing else is written. */
  function setAccent(a, b) {
    for (const [n, v] of [['--hue-acc', a[0]], ['--sat-acc', a[1] + '%'],
                          ['--hue-acc2', b[0]], ['--sat-acc2', b[1] + '%']]) {
      root.style.setProperty(n, String(v)); rail.el.style.setProperty(n, String(v));
    }
  }

  /* ═══ THE CHIP RAIL'S PRESSES ═════════════════════════════════════════════════════════════ */
  const WORK_LANES = ['bottom', 'top', 'hidden'];
  /** the rack's COMPACT state, read from its devices (any Full → F, else any Compact → C, else M) */
  const compactMode = () => {
    const all = devOrder();
    if (all.some((x) => modeOf(x.id) === 'F')) return 'F';
    if (all.some((x) => modeOf(x.id) === 'C')) return 'C';
    return all.length ? 'M' : P.compactMode;
  };
  function setMacroMin(on) {
    P.macroMin = !!on;
    rackEl.rail.classList.toggle('m2railmin', P.macroMin);
    root.querySelector('.m2railhead').setAttribute('aria-expanded', String(!P.macroMin));
  }
  function syncWorkbarChip() {
    setChip('workbars', P.lane);
    chips.workbars.dataset.workLane = P.lane;
  }
  function chipPressed(name, state) {
    if (name === 'close') { close(); return; }
    if (name === 'compact') {             // BASINS: F → C → M → F, read from the devices, the macro rail folding at M
      const next = { F: 'C', C: 'M', M: 'F' }[compactMode()];
      P.compactMode = next;
      layoutMotion.change(() => {
        for (const s of devOrder()) setMode(s.id, next);
        setMacroMin(next === 'M');
        syncChips(); place(); paint(true);
      });
      persist();
      return;
    }
    if (name === 'workbars') {
      P.lane = WORK_LANES.includes(state) ? state : 'bottom';
      setWorkLane(panel, P.lane);
      syncWorkbarChip();
      if (P.lane !== 'hidden') place();
      persist();
      return;
    }
    /* THE RIBBON IS THE ARTIFACT'S OWN SECOND FORM: `.m2ribbon` on the rack root, and the width law told about it. */
    if (name === 'ribbon') {
      P.ribbon = !!state;
      rackEl.root.classList.toggle('m2ribbon', P.ribbon);
      setChip('ribbon', P.ribbon);
      place(); paint(true); persist();
    }
  }

  /* THE DRAG — core/pointer.js on the grip.  Shift: the nearest edge takes the rail.  Near a dock the guide draws
     the exact landing; release there and the window travels into it.  Any cancel puts everything back. */
  const guide = dockOpt ? createDockGuide({ layer: host, enabled: dockOpt.guide || (() => true) }) : null;
  /** stop the window's own travel where it is seen, so a hand can take it */
  function still() {
    if (!moving) return;
    moving = null;
    const r = rectOf(root);
    tweenRect(root, r);
    box = { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
  }
  const grip = gripGesture(rail, { P: () => P, box: () => box, moving: () => !!moving, still, layout: place, relocate, guide, save: () => persist(),
    floatSize: () => { const v = view(), lb = lawBox(); return { w: Math.min(lb.w, v.width - 16), h: Math.min(lb.h, v.height - 16) }; },
    /* the guide is the landing: the CONTENT box lands at the edge (BASINS snapTarget(contentBox())), so the guide is drawn
       at the content's height and measured from the content */
    track: () => {
      const off = contentOff || { top: 0, bottom: 0 }, inp = dockInput(stateFor(P), env());
      guide.track({ ...box, top: box.top + off.top, height: box.height - off.top - off.bottom }, { ...inp, height: Math.max(52, inp.height - off.top - off.bottom) });
    },
    begin: () => { placed = true; const s = stack; stack = null; stackOn = false; return s; },
    undo: (s) => { stack = s; } });
  const gripDrag = grip.drag; gripping = grip.active;
  const onResize = () => { if (P.open) place(); };
  window.addEventListener('resize', onResize, { passive: true });
  const unSpan = dockOpt && dockOpt.span && dockOpt.span.subscribe ? dockOpt.span.subscribe(() => { if (P.open && P.dock) place(); }) : null;

  /* ═══ THE WORK BAR — MOD power · tempo · TAP · SYNC · CADENCE · HOLD 1/4 · HOLD 1 ═════════
     1.5.0-alpha.4 · ONE CLOCK (Josh, 2026-10-01).  The first seat is MODULATION'S POWER, as BASINS has it, and no
     longer a play: the window never starts or stops time — the app's one play does (the timeline's, the transport
     bar's until then).  Off, every route is bypassed and every target is back on its base (host.js
     setModulationEnabled); the clock, the sources, the tempo and the HOLDs carry on, so power on picks up in time.
     The host owns the flag and its persistence (port.armed / port.arm — bind.js power / setPower). */
  const powered = () => (port.armed ? !!port.armed() : clock.isModulationEnabled());
  const setPower = (on) => { if (port.arm) port.arm(!!on); else clock.setModulationEnabled(!!on); };
  transport.xport.addEventListener('click', () => {
    const on = !powered();
    setPower(on);
    status(on ? t('MOD on') : t('MOD off'), '');   // tr: MOD: modulation as a whole, switched on or off by its power button
    sync();
  });
  transport.xport.title = 'Enable or bypass modulation';

  const nativeRate = port.rateControl && port.rateControl();
  if (nativeRate) { nativeRate.root.classList.add('m2-native-rate'); transport.xport.parentNode.insertBefore(nativeRate.root, transport.tempo); }

  /* THE TEMPO FIELD — the house's one inline BPM editor (shell/transport.js bindTempoField; BASINS tempo-editor.js, shared
     by the modulation and timeline work bars): a click types it (8 characters, decimals; Enter or blur commits, Escape
     cancels and gives the focus back), a vertical drag turns it (220 px for the whole range, a finger 320, Shift 1760);
     a drag is not a click. */
  transport.tempo.title = 'Set the modulation clock in beats per minute';
  const tempoField = bindTempoField({ button: transport.tempo, input: transport.tempoIn, drag: true, paint: () => paint(true),
    tempo: { get: () => M.transport.bpm, set: (v) => clock.setBpm(v), commit: () => {}, min: M.BPM_MIN, max: M.BPM_MAX } });

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
    if (r.bpm) { clock.setBpm(r.bpm); status(t('tapped {bpm} BPM from {n} intervals', { bpm: r.bpm.toFixed(1), n: r.k }), ''); }
    else status(t('keep tapping — two taps make an interval'), '');
    paint(true);
  });

  transport.sync.title = '{:WALL} follows elapsed time. {:FREE} accumulates frame time.';
  transport.sync.addEventListener('click', () => { clock.setSync(M.syncMode() === 'wall' ? 'free' : 'wall'); sync(); });
  transport.cad.title = 'Limit modulation updates per second';
  transport.cad.dataset.w = '120 HZ';                                 // THE HAND: the chip keeps its widest word's width (modhost.css), so 60 ⇄ 120 moves nothing after it
  transport.cad.addEventListener('click', () => { if (port.setCadence) port.setCadence(port.cadence() === 120 ? 60 : 120); sync(); });

  const HOLD_NOTE = ['1/4', '1'];
  transport.holds.forEach((b, i) => {
    hintTo(b, 'Hold and repeat {note}; release to resume the original clock', { note: HOLD_NOTE[i] });   // tr: {note} is a note value, 1/4 or 1 (a beat or a bar)
    b.addEventListener('click', () => {
      if (M.transport.hold && M.transport.holdNote === HOLD_NOTE[i]) { clock.release(); status(t('STUTTER released — rejoined the running beat'), ''); }
      else { if (M.transport.hold) clock.release(); clock.hold(HOLD_NOTE[i]); status(t('STUTTER {note} latched — applies to BPM-synced LFOs; press again to release', { note: HOLD_NOTE[i] }), ''); }   // tr: STUTTER: the clock holds the current beat and repeats it at the note value {note} (1/4 or 1)
      sync();
    });
  });

  /* ═══ THE PRESET BAR ════════════════════════════════════════════════════════════════════ */
  let presetOpen = false, activePresetId = null;
  foot.open.addEventListener('click', () => { presetOpen ? closePresets() : openPresets(); });
  foot.save.addEventListener('click', () => {
    const name = (foot.name.value || '').trim();
    if (!name) { status(t('type a name first — the field beside {:SAVE}'), 'warn'); foot.name.focus(); return; }
    let r = M.presetSave(name, M.serializeRack());
    /* A NAME THAT IS ALREADY TAKEN IS A REPLACE, not a refusal — the model asks first and
       this window answers yes, because SAVE on a name you just loaded means "keep this". */
    if (r && r.error === 'exists') r = M.presetSave(name, M.serializeRack(), { replace: true });
    if (r && r.ok) { activePresetId = r.id; foot.name.classList.remove('m2predirty'); status(t('saved “{name}”', { name: r.name }), ''); }
    else status(r && r.error === 'factory-name' ? t('that name belongs to a factory preset — try “{name}”', { name: r.suggest }) : t('could not save that preset'), 'warn');
    if (presetOpen) openPresets();
  });


  /* THE BUNDLED STARTERS (BASINS starter-modulation.js; installModulation({ factory })): the app's authored presets, in
     their own folder, named in CAPS, apart from the user's saves — listed first, tagged STARTER, never deleted; SAVE on
     one keeps an editable user preset.  port.applyStarterPreset(id) loads one (bind.js; an app may remap its routes). */
  const bundledPresets = () => (port.starterPresets ? port.starterPresets() : []);
  const userPresets = () => bundledPresets().concat(M.presetList().filter((p) => !p.factory));
  const folderLabel = (name) => name === M.PRESET_FOLDER_DEFAULT ? t('MY PRESETS') : name;
  const stepPreset = (dir) => {
    const list = userPresets();
    if (!list.length) { status(t('no presets yet — type a name and press {:SAVE}'), 'warn'); return; }
    let cur = list.findIndex((p) => p.id === activePresetId && p.name === foot.name.value);
    if (cur < 0) cur = list.findIndex((p) => p.name === foot.name.value);
    const next = list[((cur < 0 ? (dir > 0 ? -1 : 0) : cur) + dir + list.length) % list.length];
    loadPreset(next.id);
  };
  foot.prev.addEventListener('click', () => stepPreset(-1));
  foot.next.addEventListener('click', () => stepPreset(1));
  /* THE MIR SWITCH (BASINS modwindow.js 563–566): after the picker arrows; it swaps to the timeline.  Only when the host has
     two workspaces (port.switchWorkspace). */
  const wsSwitch = typeof port.switchWorkspace === 'function' ? workspaceSwitch({ run: () => port.switchWorkspace(), title: 'Switch to Timeline' }) : null;
  if (wsSwitch) foot.core.appendChild(wsSwitch.root);
  foot.name.addEventListener('input', () => foot.name.classList.add('m2predirty'));

  function loadPreset(id) {
    const bundled = bundledPresets().some((p) => p.id === id);
    const r = bundled && port.applyStarterPreset ? port.applyStarterPreset(id) : M.presetApply(id);
    if (!r || r.ok === false) { status(r && r.error === 'foreign' ? t('that preset was written by a model this build cannot honour') : t('that preset could not be loaded'), 'warn'); return; }
    activePresetId = id;
    foot.name.value = r.name || ''; foot.name.classList.remove('m2predirty');
    M.syncDormant((id2) => registry.has(id2));
    clock.recomputeRunning(); apply(); rebuild();
    status(t('loaded “{name}”', { name: r.name || id }), '');
  }
  function closePresets() { presetOpen = false; psheet.root.hidden = true; foot.open.setAttribute('aria-expanded', 'false'); }
  function openPresets() {
    presetOpen = true;
    psheet.root.innerHTML = '';
    const all = userPresets();
    const cur = foot.name.value;
    const folders = M.presetFolders().filter((f) => !f.factory);
    for (const p of bundledPresets()) if (!folders.some((f) => f.name === p.folder)) folders.unshift({ name: p.folder });
    for (const f of folders) {
      const mine = all.filter((p) => p.folder === f.name);
      const shut = !!P.folder[f.name];
      const grp = psheet.group(folderLabel(f.name), shut, false);
      grp.tag.textContent = String(mine.length);
      grp.fold.addEventListener('click', () => { P.folder[f.name] = !P.folder[f.name]; openPresets(); persist(); });
      if (shut) continue;
      for (const p of mine) {
        const row = grp.row(p.name, { factory: !!p.factory, on: activePresetId ? p.id === activePresetId : p.name === cur, stale: !!p.stale });
        row.btn.addEventListener('click', () => { closePresets(); loadPreset(p.id); });
        if (p.bundled) {
          label(row.tag, 'STARTER');   // tr[STARTER]: a preset the app ships (a starter project's modulation), not one the user saved
          row.btn.title = 'Bundled starter modulation · Save keeps an editable user preset';
          if (row.del) row.del.remove();
        }
        if (!p.bundled && row.del) row.del.addEventListener('click', (e) => {
          e.stopPropagation(); M.presetDelete(p.id); openPresets();
          status(t('deleted “{name}”', { name: p.name }), '');
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
    label(dead.title, 'DEAD SENDS');   // tr[DEAD SENDS]: routes (sends) whose target control is missing from this build: they wait, keeping their range, until it comes back
    dead.list.innerHTML = '';
    for (const r of M.dormantRoutes()) {
      const m = M.macroOf(r.macroId);
      const row = dead.row({ routeId: r.id, macroId: r.macroId, targetId: r.targetId, reason: 'target-unavailable' });
      row.source.textContent = m ? m.name : r.macroId;
      row.target.textContent = r.targetId;
      label(row.why, 'this build has no such target — the route keeps its range until one appears'); row.trail.nodeValue = '';
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
  /** the routable control a target id is drawn by: the host's widget, else the DOM's [data-param] (never its label) */
  const controlOf = (id) => { const k = knobOf(id);
    if (k && k.root) return k.root;
    for (const n of document.querySelectorAll('[data-param]')) if (n.dataset.param === id && n.matches(ROUTE_SEL)) return n;
    return null; };
  /** what a route's overlay hangs on: a knob's dial, or a fader's own root (a fader has no dial) */
  const dialOf = (id) => { const r = controlOf(id); if (!r) return null;
    return r.classList.contains('fd') ? r : r.querySelector('.k-dial'); };

  function syncRings() {
    const idx = routeIndex();
    for (const [id, rec] of rings) {
      if (idx.has(id) && registry.has(id) && rec.dial.isConnected) continue;
      dropRing(rec);
      rings.delete(id);
    }
    for (const id of idx.keys()) {
      if (!registry.has(id)) continue;
      const dial = dialOf(id); if (!dial) continue;   /* yaw and pitch carry no dial: picker-only */
      if (!rings.has(id)) rings.set(id, buildRing(dial, id));
    }
    paintRings(idx);
  }
  function dropRing(rec) {
    if (rec.svg) rec.svg.remove(); if (rec.range) rec.range.remove(); if (rec.dot) rec.dot.remove(); if (rec.depth) rec.depth.root.remove(); if (rec.x) rec.x.remove();
    if (ringFocus === rec.id) ringFocus = null;
    rec.host.classList.remove('has-ring', 'mod-selected', 'ring-focus');
  }

  /** a press held 600 ms (or a right-click) on `node` opens the route pop-over — the touch road to what Serum puts
   *  behind a right-click */
  function holdForPop(node, id, capture = false) {
    let hold = 0;
    /* `capture`: the press is heard on the node's parent in the capture phase, so a control that takes its own press in capture and stops it
       (the arc knob, controls/arc.js) still starts the hold; only a press on `node` itself counts */
    (capture && node.parentElement ? node.parentElement : node).addEventListener('pointerdown', (e) => {
      if (capture && !node.contains(e.target)) return;
      focusRing(id);
      if (e.button) return;
      const x0 = e.clientX, y0 = e.clientY; clearTimeout(hold);
      hold = setTimeout(() => { hold = 0; openPop(id, x0, y0); }, 600);
      const move = (ev) => { if (Math.abs(ev.clientX - x0) > 4 || Math.abs(ev.clientY - y0) > 4) done(); };
      const done = () => { clearTimeout(hold); hold = 0; window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', done, true); window.removeEventListener('pointercancel', done, true); };
      window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', done, true); window.addEventListener('pointercancel', done, true);
    }, capture);
    node.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); focusRing(id); openPop(id, e.clientX, e.clientY); });
  }

  /** THE ROUTE'S OVERLAY.  A knob gets the ring (its arcs, its depth gesture, its pop-over); a fader gets a range
   *  bar — the selected route's span along its own track — because a ring around a slider says nothing.  Both get
   *  the range dial and the × while the hand is on them (ring-focus). */
  function buildRing(dial, id) {
    const fader = dial.classList.contains('fd');
    const hostEl = fader ? dial : dial.parentElement;
    const rec = { id, dial, host: hostEl, fader, svg: null };
    if (fader) {
      rec.range = el('i', 'm2fdrange', hostEl);
      rec.range.setAttribute('aria-hidden', 'true');
      /* BASINS' live dot on the bar (colour-controls.js laneFader .fd-range-dot): the composed value, pure CSS off the
         fader's own --fill — no paint of its own */
      rec.dot = el('i', 'm2fdrangedot', hostEl); rec.dot.setAttribute('aria-hidden', 'true'); rec.dot.hidden = true;
    } else {
      const svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'k-ring'); svg.setAttribute('viewBox', '0 0 60 60');
      svg.setAttribute('aria-hidden', 'true');
      Object.assign(rec, { svg,
        stack: svgEl('path', 'k-ring-stack', svg), edit: svgEl('path', 'k-ring-edit', svg),
        tick: svgEl('path', 'k-ring-tick', svg), spur: svgEl('path', 'k-ring-spur', svg),
        hit: svgEl('path', 'k-ring-hit', svg) });
      rec.hit.setAttribute('d', fullD(R_HIT));
      dial.appendChild(svg);
      wireRing(rec);
    }
    hostEl.classList.add('has-ring');
    /* heard on the host in the capture phase: an arc knob takes its own press in capture and stops it, which a listener on the dial would miss */
    hostEl.addEventListener('pointerdown', (e) => {
      if (e.button || !dial.contains(e.target) || e.target.closest('.k-route-depth, .k-route-x')) return;
      const rs = M.routesOfTarget(id).filter((r) => !r.dormant);
      const chosen = rs.find(routeSelected) || rs[0];
      if (chosen) selectMacro(chosen.macroId);
    }, true);
    const depth = knob({ label: 'RANGE', min: -1, max: 1, value: 0, fmt: (v) => (v * 100).toFixed(0) + '%',
      onInput: (d) => { const r = editRouteOf(id); if (!r) return; M.setRouteRange(r.id, { min: Math.max(0, -d), max: Math.max(0, d) }); apply(); paintRings(); } });
    depth.root.classList.add('k-route-depth'); depth.root.title = 'Selected macro range; the large dial sets the base';
    depth.root.addEventListener('pointerdown', (e) => e.stopPropagation());
    hostEl.appendChild(depth.root); rec.depth = depth;
    /* THE ROUTED CONTROL'S OWN TWO BADGES, AND ONLY ON THE ONE THE HAND IS ON (2026-09-18): touching it gives THAT
       control its range dial at one corner and a × at the other.  × removes the selected macro's route, or opens the
       list when several macros hold the control.  A held press or a right-click opens the pop-over. */
    const x = el('button', 'k-route-x', hostEl, '×'); x.type = 'button';
    x.title = 'Remove the macro from this control'; ariaLabel(x, 'remove the macro from this control');
    x.addEventListener('pointerdown', (e) => e.stopPropagation());
    x.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation();
      const rs = M.routesOfTarget(id).filter((r) => !r.dormant);
      if (rs.length > 1) { const b = x.getBoundingClientRect(); openPop(id, b.left, b.bottom + 4); return; }
      if (!removeEditRoute(id) && rs.length) { M.removeRoute(rs[0].id); if (registry.has(id)) registry.restoreBase(id); clock.recomputeRunning(); apply(); rebuild(); }
    });
    rec.x = x;
    /* a knob's dial is the door to the pop-over; a fader's track is its value (a hold there would fight the drag),
       so its range dial is the door — and a right-click on the fader opens it as well */
    if (fader) {
      holdForPop(depth.root, id);
      hostEl.addEventListener('pointerdown', () => focusRing(id));
      hostEl.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); focusRing(id); openPop(id, e.clientX, e.clientY); });
    } else holdForPop(dial, id, true);
    return rec;
  }
  /** one routed control at a time wears its badges: the one the hand last touched */
  let ringFocus = null;
  function focusRing(id) {
    if (ringFocus === id) return;
    const was = ringFocus && rings.get(ringFocus); if (was) was.host.classList.remove('ring-focus');
    ringFocus = id;
    const now = id && rings.get(id); if (now) now.host.classList.add('ring-focus');
  }
  const focusAway = (e) => {
    if (!ringFocus) return;
    const k = e.target.closest && e.target.closest('.has-ring');
    if (k && k.dataset.param === ringFocus) return;
    if (e.target.closest && e.target.closest('.mod-pop')) return;
    focusRing(null);
  };
  document.addEventListener('pointerdown', focusAway, true);

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
    rec.host.classList.toggle('mod-selected', !!(q && q.rs.some(routeSelected)));
    if (rec.depth) { const route = editRouteOf(id); rec.depth.root.hidden = !q || !route; if (route) rec.depth.set(route.max - route.min); }
    if (rec.fader) { paintFaderRange(rec, q); return; }
    const hide = (p) => p.setAttribute('d', '');
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
  /** the fader branch: the selected route's span (base → base + signed range) along the fader's own normalised track,
   *  by two custom properties (.m2fdrange draws it); the live value needs no write — fader() keeps --fill live */
  function paintFaderRange(rec, q) {
    const id = rec.id, er = q && registry.has(id) ? editRouteOf(id) : null;
    if (!er) { rec.range.hidden = true; if (rec.dot) rec.dot.hidden = true; return; }
    const b = registry.state(id).baseNorm, sp = routeSpan(er);
    let lo = clamp01(b + sp.lo), hi = clamp01(b + sp.hi);
    if (hi < lo) { const s = lo; lo = hi; hi = s; }
    rec.range.hidden = false; if (rec.dot) rec.dot.hidden = false;
    rec.range.style.setProperty('--m2-route-lo', lo.toFixed(4));
    rec.range.style.setProperty('--m2-route-span', Math.max(1e-4, hi - lo).toFixed(4));
    rec.range.classList.toggle('is-dormant', !liveSpan(er));
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
    const r = controlOf(id) || (rings.get(id) && rings.get(id).host);
    const reach = reachText(id);
    const v = r && r.querySelector('.k-val, .fd-val');
    if (v) {
      v.textContent = '';
      const a = document.createElement('i'); if (reach.clipLo) a.className = 'clip'; a.textContent = reach.lo; v.appendChild(a);
      v.appendChild(document.createTextNode(' … '));
      const c = document.createElement('i'); if (reach.clipHi) c.className = 'clip'; c.textContent = reach.hi; v.appendChild(c);
    }
    return reach;
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
     breakpoint is one nobody learns.  While it is live every routable control is marked (.mod-drop,
     data-m2target), and during a DRAG each one glows by its distance from the finger — core/proximity.js,
     in its own layer (.m2route-glow) where the accent is accent B — and the one inside capture is where the
     release lands: a finger beside a small knob still routes onto it. */
  let armed = null;
  const glowLayer = el('div', 'm2route-glow', document.body);
  glowLayer.setAttribute('aria-hidden', 'true');
  const glow = createProximity({ layer: glowLayer, reach: ROUTE_REACH, capture: ROUTE_CAPTURE,
    enabled: port.routeGlow || (() => true), onCancel: () => { if (armed && armed.mode === 'drag') { endArm(); status('', ''); } } });
  let drops = [];                                                  // the targets of the live drag, measured once
  const routables = () => [...document.querySelectorAll(ROUTE_SEL)].filter((k) => registry.has(k.dataset.param));
  function targetsOn(on) {
    document.body.classList.toggle('mod-arming', on);
    for (const k of document.querySelectorAll(ROUTE_SEL)) {
      const id = k.dataset.param;
      if (!on || !registry.has(id)) { k.classList.remove('mod-drop', 'is-dup', 'is-over'); continue; }
      /* the ARTIFACT'S word for "this control is routable", stamped so nothing is renamed */
      k.dataset.m2target = id;
      k.classList.add('mod-drop');
      k.classList.toggle('is-dup', !!(armed && M.routesOfTarget(id).some((r) => r.macroId === armed.macroId)));
      k.classList.remove('is-over');
    }
  }
  /** the proximity targets: a knob is measured at its dial (a round guide), a fader at its track */
  function measureDrops() {
    drops = routables().map((k) => {
      const fader = k.classList.contains('fd'), anchor = fader ? k : (k.querySelector('.k-dial') || k);
      const r = rectOf(anchor);
      /* no `el`: the guide is a pooled overlay in the glow's own layer (accent B), never a paint on the app's control */
      return { id: k.dataset.param, node: k, rect: { left: r.left, top: r.top, width: r.width, height: r.height }, shape: fader ? 'rect' : 'ring' };
    });
  }
  /** the control a release at (x, y) routes onto: the one under the finger, else the one the glow has captured */
  function overAt(x, y, captured) {
    const el2 = document.elementFromPoint(x, y);
    const k = el2 && el2.closest && el2.closest(ROUTE_SEL);
    let ok = k && registry.has(k.dataset.param) ? k : null;
    if (!ok && captured) ok = captured.node;
    if (armed && armed.over !== ok) {
      if (armed.over) armed.over.classList.remove('is-over');
      armed.over = ok; if (ok) ok.classList.add('is-over');
    }
    return ok ? ok.dataset.param : null;
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
    const wasDrag = armed.mode === 'drag';
    armed = null; drops = [];
    if (wasDrag) glow.end();
    targetsOn(false); hideGhost();
  }
  function dropOn(macroId, tid) {
    const d = descOf(tid), name0 = d ? d.label : tid, m = M.macroOf(macroId);
    const name = m ? m.name : macroId;
    const q = defaultRange(tid);
    const r = M.addRoute(macroId, tid, q.min, q.max);
    if (!r) { status(t('that macro cannot carry a route'), 'warn'); return null; }
    if (r.already) { selectMacro(macroId); status(t('{macro} already reaches {target}', { macro: name, target: { t: name0 } }), 'warn'); return r.route; }
    if (q.bi) M.setRouteRange(r.route.id, { bi: true });
    selMacro = macroId;
    clock.recomputeRunning(); apply(); rebuild();
    const reach = reachText(tid);
    status(t('{macro} → {target}  ·  {lo} … {hi}', { macro: name, target: { t: name0 }, lo: reach.lo, hi: reach.hi }), '');
    return r.route;
  }

  /** THE GRIP.  `reset()` runs on EVERY pointerup and BEFORE anything decides what this press
   *  meant — which is inherited defect 2, and the whole of its fix: in the source the
   *  arm/disarm branch returned from `pointerdown` before the watcher was ever reached, so only
   *  every other tap counted and the advertised double-tap took three. */
  function wireGrip(grip, macroId) {
    const reset = tapWatcher(() => {
      M.setMacro(macroId, { value: 0, masterDepth: 1 });
      apply(); rebuild(); status(t('macro reset — value 0, depth 100 %'), '');
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
      if (armed.mode !== 'drag') { armed.mode = 'drag'; measureDrops(); }
      const m = M.macroOf(macroId);
      showGhost(m ? m.name : macroId, e.clientX, e.clientY, armed.touch);
      const g = glow.update({ x: e.clientX, y: e.clientY }, drops);
      overAt(e.clientX, e.clientY, g && g.captured);
    });
    grip.addEventListener('pointerup', (e) => {
      /* EVERY lift is a tap for the watcher's purposes — the disarming one included.  A drag
         is not: it moved past the slop and meant something else. */
      const dragging = !!(armed && armed.grip === grip && armed.mode === 'drag');
      if (!dragging) reset(e);
      if (grip.dataset.disarmed) { delete grip.dataset.disarmed; return; }
      if (!armed || armed.grip !== grip) return;
      if (dragging) {
        const g = glow.update({ x: e.clientX, y: e.clientY }, drops);
        const tid = overAt(e.clientX, e.clientY, g && g.captured);
        const mid = armed.macroId;
        endArm();
        if (tid) dropOn(mid, tid);       /* dropped on nothing: silent, and no state changed */
        return;
      }
      armed.mode = 'armed';
      grip.classList.add('m2arm');
      hideGhost();
      const m = M.macroOf(macroId);
      status(t('ARMED: {macro} — tap a lit control to route it, tap the grip again to cancel', { macro: m ? m.name : macroId }), '');   // tr: ARMED: the macro waits for a tap on a control to route itself there (as a record button is armed)
    });
    const cancel = () => { if (armed && armed.grip === grip) { if (armed.mode === 'drag') glow.cancel(); endArm(); status('', ''); } };
    grip.addEventListener('pointercancel', cancel);
    grip.addEventListener('lostpointercapture', () => { if (armed && armed.grip === grip && armed.mode === 'drag') cancel(); });
  }

  const armTap = (e) => {
    if (!armed || armed.mode !== 'armed') return;
    const k = e.target.closest && e.target.closest(ROUTE_SEL);
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
    e.preventDefault(); e.stopPropagation(); if (armed.mode === 'drag') glow.cancel(); endArm(); status('', '');
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
      rec.host.classList.add('ring-drag');
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
      const reach = showReach(id);
      showGhost(reach.lo + ' … ' + reach.hi, e.clientX, e.clientY, drag.touch);
    });
    const endDrag = (e) => {
      if (!drag) return;
      cancelHold();
      const wasMoved = moved;
      drag = null; moved = false;
      rec.host.classList.remove('ring-drag');
      hideGhost(); restoreVal(id);
      if (wasMoved) { apply(); paint(true); }
      else dtap(e);
    };
    hit.addEventListener('pointerup', endDrag);
    hit.addEventListener('pointercancel', () => { cancelHold(); if (drag) { drag = null; moved = false;
      rec.host.classList.remove('ring-drag'); hideGhost(); restoreVal(id); } });
    hit.addEventListener('dblclick', (e) => { e.preventDefault(); e.stopPropagation(); removeEditRoute(id); });
    hit.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); openPop(id, e.clientX, e.clientY); });
  }

  /** DRAGGING THE DEPTH TO ZERO IS NOT REMOVAL AND MUST NEVER BE. */
  function removeEditRoute(id) {
    const r = editRouteOf(id);
    if (!r) { const n = M.routeCountOfTarget(id); status(n ? t('that macro does not reach this control') : '', n ? 'warn' : ''); return false; }
    M.removeRoute(r.id);
    if (registry.has(id)) registry.restoreBase(id);
    clock.recomputeRunning(); apply(); rebuild();
    const d = descOf(id);
    status(t('route removed — {target} is the hand’s again', { target: d ? { t: d.label } : id }), '');
    return true;
  }


  let popEl = null;
  function closePop() { if (popEl) { popEl.remove(); popEl = null; } }
  function openPop(id, x, y) {
    closePop();
    const d = descOf(id), rs = M.routesOfTarget(id);
    const er = editRouteOf(id);
    popEl = el('div', 'mod-pop glass');
    const head = el('div', 'mod-poph', popEl);
    if (d) label(el('b', '', head), d.label); else el('b', '', head, id);
    if (er) el('span', '', head, (M.macroOf(er.macroId) || { name: er.macroId }).name);
    else label(el('span', '', head), rs.length ? 'no route from the selected macro' : 'no route');
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
        clock.recomputeRunning(); apply(); rebuild(); status(t('every route into {target} removed', { target: d ? { t: d.label } : id }), ''); } }).root);
    if (d && d.def !== null && d.def !== undefined) rw.appendChild(trig({ label: 'RESET', title: 'Reset the base value and keep its routes',
      onFire: () => { closePop(); registry.setBase(id, d.def); apply(); paintRings(); } }).root);
    if (rs.length > 1) {
      const l = el('div', 'mod-poprts', popEl);
      label(el('div', 'grp-lbl', l), 'THIS CONTROL IS HELD BY {n} MACROS  ·  which one the outer arc edits', { n: rs.length });
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
    const tg = e.target;
    if (devPickOpen && !pick.root.contains(tg) && !rackEl.devadd.contains(tg)) setDevPick(false);
    if (macroPickOpen && !mpick.root.contains(tg) && !(rackEl.macadd && rackEl.macadd.contains(tg))) {
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
    if (M.macroList().length >= M.MACRO_MAX) { status(t('eight macros is the model’s ceiling'), 'warn'); return; }
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
  /* THE REORDER, ANIMATED (BASINS modwindow.js wireReorder + rack-motion.js; Josh: "Copy the same thing to the
     modulation window devices and macros").  The grip's drag is core/pointer.js (the last sample flushed before the commit;
     Escape, a lost capture, a blur or a hidden page cancel it).  The held node follows the hand along its axis; crossing a
     neighbour's middle (8 px past it) moves the neighbours past it in the DOM inside a layout transaction, so they glide;
     nothing is rebuilt during the drag.  Release commits the order to the model and the node settles into its slot; a
     cancel puts it back where it was.  A press that never travels is a tap (`tap`). */
  /* the engine is layout-motion.js wireReorder (lifted out in wave 22 so the transport's macro tiles share it, Josh's
     call 21): the NEIGHBOURS move, never the held node — re-inserting the node that holds the pointer would release its
     capture (BASINS moved the node and listened on the document; core/pointer.js keeps the gesture on the grip) */
  function wireReorder(grip, node, host, selector, axis, commit, tap = () => {}) {
    reorderEngine(grip, node, { host, selector, axis, motion: layoutMotion, commit, tap,
      began: (cancel) => { if (cancelReorder) cancelReorder(); cancelReorder = cancel; },
      ended: () => { cancelReorder = null; },
      settle: () => { apply(); paint(true); persist(); } });
  }
  function wireMacroReorder(rec, macroId, rename) {
    wireReorder(rec.reorder, rec.root, rackEl.slots, ':scope > .m2slot', 'y', (to) => M.moveMacro(macroId, to), tapWatcher(rename));
    rec.reorder.addEventListener('keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'NumpadEnter'].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Enter' || e.key === 'NumpadEnter') { rename(); return; }
      const list = M.macroList(), at = list.findIndex((m) => m.id === macroId);
      const to = e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : at + (e.key === 'ArrowUp' ? -1 : 1);
      const rows = [...rackEl.slots.querySelectorAll(':scope > .m2slot')], target = rows[Math.max(0, Math.min(rows.length - 1, to))];
      if (target && target !== rec.root) layoutMotion.change(() => rackEl.slots.insertBefore(rec.root, to < at ? target : target.nextSibling), false);
      M.moveMacro(macroId, to); apply(); paint(true); persist();
    });
  }

  function rebuildMacros() {
    if (cancelReorder) cancelReorder();
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
      rec.grip.title = 'Drag to route; tap to arm; double-tap to reset';   // tr: route: connect this macro to a control so it moves it; arm: make it wait for a tap on the control to connect to
      ariaLabel(rec.grip, 'route {macro} — drag onto a control, or tap to arm', { macro: m.name });
      wireGrip(rec.grip, m.id);
      rec.reorder.title = 'Drag to reorder; double-tap to rename';
      ariaLabel(rec.reorder, 'reorder or rename {macro}', { macro: m.name });
      rec.reorder.replaceChildren(gripDots());                  // Josh: the dot grip for reorder; the cross stays the routing grip
      wireMacroReorder(rec, m.id, rename);
      hintTo(rec.del, 'delete {macro} and its routes', { macro: m.name });
      ariaLabel(rec.del, 'delete {macro} and its routes', { macro: m.name });
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
      aria(rec.numSeat, t('MACRO {i} DEPTH', { i: n }), 0, 100, 100 * M.macroOf(m.id).masterDepth, '100%');

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
        aria(rec.val, t('{macro} value', { macro: m.name }), 0, 100, 100 * M.macroOf(m.id).value, '0%');
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
      watchTouches();
      d = { id: e.pointerId, p: 0, lx: e.clientX, ly: e.clientY, x: e.clientX, y: e.clientY, v: o.get(), moved: false, touch: e.pointerType === 'touch' };
      elm.classList.add('drag');
    });
    elm.addEventListener('pointermove', (e) => {
      if (!d || e.pointerId !== d.id) return;
      /* THE ONE KNOB LAW (kit.js): the gear (⅛ on any modifier or a second finger) multiplies the step since the last move, so engaging it
         moves nothing; the travel is the plain 220 px (320 under a finger) */
      const span = d.touch ? 320 : 220, g = gearOf(e, d.id);
      d.p += g * (o.axis === 'x' ? e.clientX - d.lx : o.axis === 'y' ? d.ly - e.clientY : (d.ly - e.clientY) + (e.clientX - d.lx)) / span;
      d.lx = e.clientX; d.ly = e.clientY;
      if (!d.moved && Math.abs(e.clientX - d.x) < 3 && Math.abs(e.clientY - d.y) < 3) return;
      d.moved = true;
      o.set(d.v + d.p);
    });
    const stop = (e) => { if (!d) return; const moved = d.moved; d = null; elm.classList.remove('drag'); if (!moved) dtap(e); };
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


  const rackMode = () => compactMode();
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
        hint:key==='peakHold'?t('Selected audio band peak hold; choose {:LEVEL}, {:LOW}, {:MID} or {:HIGH} on its meter'):key==='attack'?t('Selected audio band attack time constant; choose {:LEVEL}, {:LOW}, {:MID} or {:HIGH} on its meter'):t('Selected audio band release time constant; choose {:LEVEL}, {:LOW}, {:MID} or {:HIGH} on its meter')};
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
        text: () => (s.smooth > 0 ? (M.smoothTau(s.smooth) * 1000).toFixed(s.smooth < 0.2 ? 1 : 0) + ' ms' : t('OFF')),
        hint: 'Smooth the LFO output' };
      case 'steps': return { get: () => M.stepsRungIndex(s.steps) / (L.length - 1),
        set: (u) => M.setSource(s.id, { steps: L[Math.round(clamp01(u) * (L.length - 1))] }),
        text: () => (s.steps >= M.STEPS_MIN ? String(s.steps) : t('OFF')),
        hint: 'Quantise output to discrete levels' };
      case 'hold':
      case 'a': case 'd': case 'r': return {
        get: () => SQ(s[key]), set: (u) => M.setSource(s.id, { [key]: clamp01(u) * clamp01(u) * M.ENV_MAX_S }),
        text: () => fmtSec(s[key]),
        hint: 'Set the envelope stage time' };
      case 's': return { get: () => s.s, set: (u) => M.setSource(s.id, { s: clamp01(u) }),
        text: () => (100 * s.s).toFixed(0) + '%', hint: 'the sustain {:LEVEL} — the one ADSR control that is not a time' };
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
          text: () => db().toFixed(0) + ' dB', hint: 'the gate opens here and stays open until hysteresis below it' }; }   // tr: hysteresis: a small margin below the opening level, so the gate does not flicker open and shut
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
      layoutMotion.change(() => { setMacroMin(!P.macroMin); syncChips(); paint(true); place(); });
      persist();
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
    if (P.open && P.chipSide === 'auto') place();             // `auto` follows the macros' side
  }
  const macroHead = root.querySelector('.m2railhead');
  const sideGrip = el('button', 'm2-side-grip', macroHead, '⠿');
  sideGrip.hidden=true;sideGrip.disabled=true;sideGrip.type = 'button'; sideGrip.title = 'Move macros to either side';
  ariaLabel(sideGrip, 'Move macros to left or right end');
  let sideDrag = null;
  sideGrip.addEventListener('click', (e) => e.stopPropagation());
  sideGrip.addEventListener('pointerdown', (e) => { e.stopPropagation(); sideDrag = e.clientX; sideGrip.setPointerCapture(e.pointerId); });
  sideGrip.addEventListener('pointerup', (e) => { if (sideDrag === null) return; if (Math.abs(e.clientX - sideDrag) > 8) { setMacroSide(e.clientX > root.getBoundingClientRect().left + root.offsetWidth / 2 ? 'right' : 'left'); place(); persist(); } sideDrag = null; });
  sideGrip.addEventListener('pointercancel', () => { sideDrag = null; });
  sideGrip.addEventListener('dblclick', (e) => { e.stopPropagation(); setMacroSide(P.macroSide === 'right' ? 'left' : 'right'); place(); persist(); });
  sideGrip.addEventListener('keydown', (e) => { e.stopPropagation(); if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return; e.preventDefault(); setMacroSide(e.key === 'ArrowLeft' ? 'left' : 'right'); place(); persist(); });

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
    const sig = sigOf(s, 26, 200);
    if (force || sig !== t.sig) {
      t.sig = sig;
      const sm = sampleShape(s, 96);
      let d = '';
      for (let i = 0; i < sm.length; i++) {
        const value = s.steps >= M.STEPS_MIN ? M.stepQuant(sm[i][1], s.steps) : sm[i][1];
        if (i && s.steps >= M.STEPS_MIN) d += 'L' + X(M.stepQuant(sm[i - 1][1], s.steps)) + ' ' + Y(sm[i][0]);
        d += (i ? 'L' : 'M') + X(value) + ' ' + Y(sm[i][0]);
      }
      t.path.setAttribute('d', d);
      /* the body is the band between the REST line and the trace, so a shape reads as a shape and not
         as a hairline at 26 px — closed back along the rest line, never along the box's edge */
      t.fill.setAttribute('d', d ? d + 'L50 ' + Y(1) + 'L50 ' + Y(0) + 'Z' : '');
    }
    t.dot.style.setProperty('--tx', X(shapeAtHead(s)));
    t.dot.style.setProperty('--ty', Y(headU(s)));
  }

  /* the editor boxes' one observer: a box that gains a size after a paint skipped it is redrawn (the play dot) */
  const boxRec = new WeakMap();
  const boxRO = typeof ResizeObserver === 'function' ? new ResizeObserver((entries) => {
    if (!P.open) return;
    for (const e of entries) {
      const rec = boxRec.get(e.target);
      if (rec && !rec.g.sig && e.contentRect.width > 8 && e.contentRect.height > 8) { paint(true); return; }
    }
  }) : null;
  function rebuildDevices() {
    if (cancelReorder) cancelReorder();
    for (const rec of devRows.values()) { if (rec.readout) rec.readout.dispose(); if (boxRO) boxRO.unobserve(rec.dev.ed.box); rec.dev.root.remove(); }
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
        broken.push(t('{kind} {id}', { kind: KIND_WORD[s.kind] || s.kind, id: s.id }));   // tr: a device's name: its kind and its id (LFO s2); reorder if your language puts the id first
        try { console.error('[modwindow] device ' + s.id + ' failed to build', e); } catch (_) {}
      }
    }
    for (const s of devOrder()) { const rec = devRows.get(s.id); if (rec) setDeviceMode(rec.dev, modeOf(s.id)); }
    syncPatt(); { const pt = patternOf(); if (pt) pt.model.rackChanged(); }
    if (broken.length) status(tn(broken.length, 'One device could not be built and is not on the rack: {list}. The rest of the rack is unaffected.',
      '{n} devices could not be built and are not on the rack: {list}. The rest of the rack is unaffected.', { list: broken.join(', ') }), 'warn');
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
      layoutMotion.change(() => {
        setMode(s.id, next);
        dev.fold.setAttribute('aria-expanded', next === 'F' ? 'true' : 'false');
        syncChips(); place(); paint(true);
      });
      persist();
    });
      dev.pow.title = 'Bypass this device and keep its settings';
    dev.pow.addEventListener('click', () => { M.setSource(s.id, { on: !s.on }); clock.recomputeRunning(); apply(); sync(); });
      dev.x.title = 'Remove this device and release its macros';
    dev.x.addEventListener('click', () => { M.removeSource(s.id); delete P.modes[s.id]; delete P.audioMini[s.id]; clock.recomputeRunning(); apply(); rebuild(); });
      dev.bank.btn.title = 'Switch between two saved patches for this device';
    dev.bank.btn.addEventListener('click', () => { M.setSource(s.id, { bank: s.bank === 'A' ? 'B' : 'A' }); apply(); sync(); });
    dev.cpy.title = 'copy this side\'s whole patch';
    dev.cpy.addEventListener('click', () => { clip = M.copyBank(s.id); say(rec, t('patch copied — {:PASTE} onto any {kind}', { kind: KIND_WORD[s.kind] || s.kind })); });   // tr: a patch: all of one device’s settings together, as a synth patch; {kind} is the device kind (LFO, ENV, AUDIO)
      dev.pst.title = 'Paste a compatible device patch';
    dev.pst.addEventListener('click', () => {
      if (!clip) { say(rec, t('nothing copied yet — press {:COPY} on a device first')); return; }
      const w = M.pasteBank(s.id, clip, s.bank);
      if (!w) { say(rec, t('{a} and {b} patches cannot be pasted across — they are different devices', { a: KIND_WORD[clip.kind] || String(clip.kind), b: KIND_WORD[s.kind] || s.kind })); return; }
      apply(); sync();
    });
    /* → TL (BASINS LANE P): this device as a clip on the timeline at the playhead — only while a timeline is attached */
    if (dev.kind !== 'audio' && timelineOf()) {
      const tl = label(el('button', 'm2ab m2tl'), '→TL'); tl.type = 'button'; dev.pst.after(tl); dev.tl = tl;   // tr: → TL: send to the timeline
      tl.title = 'Send to the timeline: one cycle of the LFO, the ENV\'s stages, or its live pattern row';
      tl.addEventListener('click', () => { const msg = sendToTimeline(s); if (msg) say(rec, msg); });
    }
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
        hintTo(q.btn, '{shape} · tap to draw; tap again to mirror', { shape: { t: PRESET_LABEL[name] } });
        q.btn.addEventListener('click', () => {
          M.setSource(s.id, { preset: name });
          const lp = s.lastPreset || {};
          const shape = { t: PRESET_LABEL[name] };
          say(rec, lp.symmetric ? t('{shape} is its own mirror — nothing to flip', { shape })
            : lp.flipped ? t('{shape} flipped', { shape }) : t('{shape} drawn', { shape }));
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
        say(rec, stochastic({ wave: next }) ? t('{wave} · waveform, four cycles shown', { wave: { t: M.WAVE_LABEL[next] } }) : t('{wave} · waveform', { wave: { t: M.WAVE_LABEL[next] } }));
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
        if (s.shapeMode !== 'curve') { say(rec, t('Select a curve before reversing it')); return; }
        const h0 = curveHash(s.points);
        M.curveEdit(s.id, 'flip');
        say(rec, curveHash(s.points) === h0 ? t('this shape is its own mirror — nothing to flip') : t('flipped in time'));
        apply(); paint(true);
      });
    } else if (dev.kind === 'env') {
      /* ↑ FIT ↓ — and FIT IS THE FIX FOR INHERITED DEFECT 3.  It frames what `envPoints`
         DRAWS (a + hold + d + r, always), not what `envDuration` returns (which drops `r`
         under GATE and framed 0.3565 s of a 0.910 s picture — 155 % past the right edge). */
      const [zin, zfit, zout] = dev.zoom;
      zin.title = 'Zoom into the envelope graph';
      zin.addEventListener('click', () => { M.setSource(s.id, { timeScale: s.timeScale * 0.5 }); paint(true); say(rec, t('window {s} s', { s: s.timeScale.toFixed(2) })); });   // tr: a window of time: the envelope graph now spans {s} seconds
      zout.title = 'Zoom out of the envelope graph';
      zout.addEventListener('click', () => { M.setSource(s.id, { timeScale: s.timeScale * 2 }); paint(true); say(rec, t('window {s} s', { s: s.timeScale.toFixed(2) })); });
      zfit.title = 'Fit the full envelope in the graph';
      zfit.addEventListener('click', () => {
        M.setSource(s.id, { timeScale: Math.min(M.ENV_MAX_S, Math.max(0.25, envDrawn(s) * 1.15)) });
        paint(true); say(rec, t('fitted to {s} s', { s: s.timeScale.toFixed(2) }));
      });
      /* PATT (BASINS LANE P): this ENV's step row in the PATTERN window — on, the row drives it (and the window opens);
         off, the row is kept.  On the Full face after ↑ FIT ↓, on Compact beside OUT / TRIG IN, never on the minimised
         strip (Josh 10-01: "ALL modes 'Compact' and 'Full' EXCEPT for the minimized mode").  Only with a pattern attached. */
      if (patternOf()) {
        const patt = label(el('button', 'm2zoom m2fit m2seat44 m2patt'), 'PATT'); patt.type = 'button'; zout.after(patt); dev.patt = patt;   // tr: PATT: pattern — the ENV's step row
        dev.root.classList.add('m2haspatt');
        patt.title = 'Pattern: drive this envelope from its step row in the PATTERN window';
        patt.addEventListener('click', () => {
          const pt = patternOf(); if (!pt) return;
          const on = !pt.model.isLive(s.id); pt.model.setLive(s.id, on);
          if (on && pt.show) pt.show(s.id);
          say(rec, on ? t('pattern on — its row drives this envelope') : t('pattern off — the row is kept'));
        });
      }
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
        if (!port.audio) { say(rec, t('this host supplies no audio capture')); return; }
        const st = port.audio.state();
        if (st.live) { await port.audio.stop(); if (!stillMine()) return; say(rec, t('microphone closed')); }
        else {
          const sup = port.audio.support();
          if (!sup.ok) { say(rec, sup.why); paint(true); return; }
          say(rec, t('asking for the microphone…'));
          await port.audio.start();
          if (!stillMine()) return;
          const now = port.audio.state();
          say(rec, now.live ? t('microphone open') : (now.reason || t('the microphone did not open')));
        }
        sync(); paint(true);
      });
      A.setBtn.title = 'Audio input, band ranges, timing, gate, and onset settings';
      A.setBtn.addEventListener('click', () => {
        /* the sheet's whole content is the CAPTURE's — a host with none has nothing to condition.
           A restored session can carry an AUDIO source onto such a host, so this is reachable. */
        if (!port.audio) { say(rec, t('this host supplies no audio capture')); return; }
        if (!rec.audSheet) rec.audSheet = buildAudioSheet(dev, mw.copy);
        const sh = rec.audSheet;
        if (!sh) { say(rec, t('the conditioning sheet is not available in this build')); return; }
        sh.root.hidden = !sh.root.hidden; if(sh.refresh)sh.refresh();
        if (!sh.wired) { sh.wired = true;
          wireAudioConditioning(rec, sh);
          sh.close.addEventListener('click', () => { sh.root.hidden = true; });
          sh.input.addEventListener('change', async () => {
            if (!port.audio) { say(rec, t('this host supplies no audio capture')); return; }
            await port.audio.start(sh.input.value || '');
            if (!stillMine()) return;
            const st2 = port.audio.state();
            say(rec, st2.live ? t('input changed') : (st2.reason || t('that input did not open'))); paint(true);
          });
          port.audio.devices().then((list) => {
            if (!sh.input.isConnected) return;      // the sheet was closed and dropped while we asked
            sh.input.innerHTML = '';
            const d0 = document.createElement('option'); d0.value = ''; label(d0, 'SYSTEM DEFAULT');
            sh.input.appendChild(d0);
            for (const d of list) { const op = document.createElement('option');
              op.value = d.id; op.textContent = t(d.label); sh.input.appendChild(op); }
            sh.input.value = port.audio.state().deviceId || '';
          });
        }
      });
      for (const key of Object.keys(A.outs)) {
        const row = A.outs[key];
        if (key === 'hit') hintTo(row.box, '{:HIT} event output'); else hintTo(row.box, 'Route {band} to a macro', { band: BAND_WORD[key] || key });
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


      dev.bus.title = 'Select the envelope trigger; Shift-click selects the {:AUDIO} {:HIT} output';
      dev.bus.addEventListener('click', (e) => {
        const list = fireSources();
        if (e.shiftKey) {                                   // the shortcut, straight to the signal
          const hit = list.find((f) => f.hit);
          M.setSourceTrigger(s.id, hit ? hit.id : null);
          if (!hit) say(rec, t('add an {:AUDIO} device and its {:HIT} can fire this envelope'));
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
      aria(k.dial, t('{name} on {kind} {id}', { kind: KIND_WORD[dev.kind] || dev.kind, id: s.id, name: { t: k.label } }), 0, 100, 100 * clamp01(spec.get()), spec.text());
      wireSlider(k.dial, {
        get: spec.get, set: (u) => { spec.set(u); apply(); paintKnob(rec, key); paint(true); },
        reset: () => { }, axis: 'both'
      });
    }

    /* ── THE EDITOR ── */
    rec.g = { box: dev.ed.box, svg: dev.ed.svg, ed: dev.ed, w: 0, h: 0, X: (u) => u, Y: (v) => v,
              samples: [], levels: 0, hseg: [], pts: null, sig: '' };
    boxRec.set(dev.ed.box, rec); if (boxRO) boxRO.observe(dev.ed.box);
    rec.drag = null;
    wireEditor(rec);
    /* THE SAME READOUT LAYER THE TIMELINE HAS (BASINS mod-cursor.js on readout-layer.js, MODWINDOW-READOUT 10-01), on this
       device's own curve editor: time in beats of the cycle when synced, seconds when free; held, it locks to the dragged
       point.  AUDIO has no curve to hover, and a closed window mounts none (its document listeners would idle). */
    if (s.kind === 'audio' || !P.open) rec.readout = null;
    else {
      const cursor = createModCursor({ rec, timeTextAt: cursorTimeText, inkOf: cursorInk });
      rec.readout = createReadoutLayer({ mount: rec.g.box, resolve: (ev) => (document.body.classList.contains('ui-hidden') ? null : cursor.gesture() || cursor.resolve(ev)) });
    }
    if(s.kind==='audio')buildAudioRanges(rec);
    seatMinTrace(rec);                  // wave 97: the folded strip's one indicator

    if (s.kind === 'audio' && dev.minMeter) {
      const syncMiniMeter = () => {
        const all = P.audioMini[s.id] === 'all';
        dev.minMeter.classList.toggle('is-all', all);
        dev.minMeter.setAttribute('aria-pressed', String(all));
        ariaLabel(dev.minMeter, all ? 'Audio mini meter: All. Click to show Low, Mid and High' : 'Audio mini meter: Low, Mid and High. Click to show All');
        dev.minMeter.title = all ? 'All meter · click for Low, Mid and High' : 'Low, Mid and High meter · click for All';
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
    const ring = [null, ...all.filter((m) => (!m.sourceId && !owned(m.id)) || m.sourceId === s.id)];
    if (ring.length === 1) { say(rec, t('every macro is already driven by another source — free one, or add a macro')); return; }
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
    if (!sock) { say(rec, t('that output cannot be bound')); return; }
    const all = M.macroList().filter((m) => m.kind !== 'trigger');
    const ring = [null, ...all.filter((m) => (!m.sourceId && !owned(m.id)) || m.sourceId === sock)];
    if (ring.length === 1) { say(rec, t('every macro is already driven by another source — free one, or add a macro')); return; }
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
    rec.dev.grab.title = 'Drag to reorder';
    wireReorder(rec.dev.grab, rec.dev.root, rackEl.run, ':scope > .m2dev', 'x', () => {
      const rest = M.sourceList().filter((x) => x.id !== rec.id);
      const next = rec.dev.root.nextElementSibling && rec.dev.root.nextElementSibling.dataset.id;
      const previous = rec.dev.root.previousElementSibling && rec.dev.root.previousElementSibling.dataset.id;
      const to = next ? rest.findIndex((x) => x.id === next) : previous ? rest.findIndex((x) => x.id === previous) + 1 : 0;
      M.moveSource(rec.id, Math.max(0, to));
    });
  }

  let clip = null;

  /* ═══ THE PATTERN AND THE TIMELINE, ATTACHED (1.5.0-alpha.12) ═══════════════════════════════
     Two plugins the window works with when the app has them: the PATTERN (pattern/window.js installPattern attaches
     { model, show(envId) }) puts PATT on every ENV face; the TIMELINE (installModulation's setTimeline, or
     port.timeline()) puts → TL on every LFO and ENV head.  Neither is imported for its own sake: absent, nothing shows. */
  let patternHost = null, timelineHost = null;
  const patternOf = () => patternHost;
  const timelineOf = () => timelineHost || (typeof port.timeline === 'function' ? port.timeline() : null);
  let offPattern = null;
  /** PATT's lamp follows the pattern model (the window, a project restore, an undo) */
  function syncPatt() {
    const pt = patternOf();
    for (const rec of devRows.values()) if (rec.dev.patt) { const on = !!pt && pt.model.isLive(rec.id); rec.dev.patt.classList.toggle('on', on); rec.dev.patt.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  }
  /* → TL, THE EXPERIMENT (BASINS LANE P): an LFO = one cycle of its shape, an ENV = its stages over timeScale seconds, an ENV
     with a live lit row = a PATTERN clip of that row.  It lands at the playhead's beat on the timeline's active lane
     (editor.addClip); a curve clip targets the device's first live route. */
  const routedTarget = (s) => { for (const m of M.macroList()) if (m.sourceId === s.id) for (const r of M.routesOfMacro(m.id)) if (!r.dormant && registry.has(r.targetId)) return r.targetId; return null; };
  const hexInk = (rec) => { const m = rec && /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(getComputedStyle(rec.dev.ed.path).stroke || ''); return m ? '#' + [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, '0')).join('') : undefined; };
  const warn = (msg) => { if (typeof port.toast === 'function') port.toast(msg); else status(msg, 'warn'); return null; };
  function sendToTimeline(s) {
    const tlh = timelineOf(); if (!tlh) return warn(t('add the timeline first — a device is sent to it'));
    const T = M.transport, bpm = T.bpm, start = Math.max(0, Math.floor(T.beats + 1e-9)), rec = devRows.get(s.id);
    const editor = tlh.editor, name = (s.label || (KIND_WORD[s.kind] ? KIND_WORD[s.kind].t : s.kind)) + ' ' + s.id;   // a clip's name is data: the English kind, as BASINS saves it
    const add = (kind, source, o) => (editor && editor.addClip ? editor.addClip(kind, source, { start, ...o })
      : tlh.model.create({ targetId: o.targetId || kind + ':' + s.id, name: o.name, value: 0, start, duration: o.duration, source: kind === 'curve' ? source : { ...source, kind } }));
    const done = (id, what, beats) => { if (!id) return warn(t('No room on the timeline for {what} — add a lane or move the playhead', { what }));
      return t('{what} → timeline · {beats} beats at beat {start}', { what, beats: +beats.toFixed(3), start }); };
    const pt = patternOf();
    if (s.kind === 'env' && pt && pt.model.isLive(s.id) && pt.model.lit(s.id)) {
      if (!clipKinds().includes('pattern')) return warn(t('pattern clips arrive with the timeline lane'));
      const steps = pt.model.steps(s.id), beats = steps.length * STEP_BEATS;
      return done(add('pattern', { envId: s.id, steps, name, color: hexInk(rec) }, { duration: beats, name }), t('the pattern'), beats);
    }
    const targetId = routedTarget(s);
    if (!targetId) return warn(t('Route {name} to a control first — its clip needs a target', { name }));
    let points, beats;
    if (s.kind === 'env') { points = M.envPoints(s); beats = s.timeScale * bpm / 60; }
    else {
      const hz = M.lfoHz(s);
      beats = s.sync ? M.beatsPerCycle(s) : hz > 0 ? bpm / (60 * hz) : 0;
      points = s.shapeMode === 'curve' ? s.points.map((p) => ({ t: p.t, v: p.v, tension: p.tension || 0 }))
        : Array.from({ length: 64 }, (_, i) => ({ t: i / 63, v: M.waveAt(s.wave, i / 63, { cycles: 0, seed: s.rseed }), tension: 0 }));
    }
    if (s.invert) points = points.map((p) => ({ ...p, v: 1 - p.v }));
    points = normalizeTimelinePoints(points);
    if (!points || !(beats > 0)) return warn(t('This device has no shape to send'));
    const d = registry.describe().find((x) => x.id === targetId);
    return done(add('curve', { points, color: hexInk(rec) }, { duration: beats, targetId, name: (d && d.label) || targetId }), s.kind === 'env' ? t('the envelope') : t('one cycle'), beats);
  }


  const say = (rec, msg) => {
    rec.say = msg;
    if (rec.dev.ed.note) rec.dev.ed.note.textContent = msg;   // kept for a host that un-hides the caption
    if (msg) status(KIND_WORD[rec.dev.kind] ? t('{kind} — {message}', { kind: KIND_WORD[rec.dev.kind], message: msg }) : msg, '');   // tr: a status line: the device kind (LFO, ENV, AUDIO), then a message that is already a whole sentence
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
  /** the drawn shape's value under the play head (the dot sits ON the curve, stepped when STEPS quantises) — BASINS */
  function shapeAtHead(s) {
    const u = headU(s), points = editPoints(s);
    const value = points ? curveEval(points, u) : M.waveAt(s.wave, s.phase + s.phaseOff, { cycles: cycleNow(s), seed: s.rseed });
    return s.steps >= M.STEPS_MIN ? M.stepQuant(value, s.steps) : value;
  }
  /* THE READOUT'S TIME UNIT — beats of one cycle when BPM-synced (M.beatsPerCycle), seconds/ms when free; an ENV is always
     free against its own timeScale window.  `cyclesShown` decides how many periods the box draws, so u's elapsed amount
     is u times that many periods — the same accounting headU and sampleShape use. */
  function cursorTimeText(s, u) {
    const elapsed = u * cyclesShown(s);
    if (s.kind === 'env') return fmtSec(elapsed * s.timeScale);
    if (s.sync) return fmtBeat(elapsed * M.beatsPerCycle(s));
    const hz = M.lfoHz(s);
    return fmtSec(hz > 0 ? elapsed / hz : 0);
  }
  const cursorInk = (rec) => getComputedStyle(rec.dev.ed.path).stroke;
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
      /* WAVE 105.  It reports what the DEVICE is actually doing, which is the only thing a caption under a live
         meter may say. */
      const cap = port.audio ? port.audio.state() : null;
      const live = !!(cap && cap.live);
      const state = live ? t('listening at {k} kHz', { k: Math.round((cap.sampleRate || 0) / 1000) })
        : !port.audio ? t('this host supplies no capture') : cap.reason || t('not listening');
      return t('{:AUDIO} — {state}. {:LEVEL}, three bands and {:HIT} leave as sockets; patch one to a macro.', { state });
    }
    if (s.kind === 'env') return t('{:ENV} — {drawn} s drawn over a {window} s window. Drag the stages; {:FIT} frames it.',
      { drawn: envDrawn(s).toFixed(3), window: s.timeScale.toFixed(2) });
    if (s.shapeMode !== 'curve') return stochastic(s)
      ? t('{wave} · analytic: choose a breakpoint shape to edit it. Four cycles: each is a fresh hold.', { wave: { t: M.WAVE_LABEL[s.wave] } })
      : t('{wave} · analytic: right-drag the curve to make it editable.', { wave: { t: M.WAVE_LABEL[s.wave] } });
    const info = curveInfo(s.points);
    const shape = !info.preset ? { t: 'CURVE' } : info.mirrored ? t('{shape} mirrored', { shape: { t: PRESET_LABEL[info.preset] } }) : { t: PRESET_LABEL[info.preset] };
    return t('{shape} — {points} points, {bent} bent. Right-drag empty space to add; drag dots and handles.', { shape, points: info.points, bent: info.bent });
  }
  /** the shape's name as the device head prints it */
  const shapeLabel = (s) => {
    if (s.shapeMode !== 'curve') return t(M.WAVE_LABEL[s.wave]);
    const preset = curveInfo(s.points).preset;
    return preset ? t(PRESET_LABEL[preset]) : t('CURVE');
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
        say(rec, t('{wave} is stochastic — choose a breakpoint shape before editing', { wave: { t: M.WAVE_LABEL[s.wave] } }));
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
      if (action === 'point-menu') { say(rec, t('Alt-click deletes this point; drag it to move')); return; }
      if (action === 'remove-point') {
        if (s.kind === 'env') { say(rec, t('an envelope has fixed stages — drag a stage to zero instead')); return; }
        const n0 = s.points.length;
        M.curveEdit(s.id, 'remove', { index: h.i });
        say(rec, s.points.length < n0 ? t('point removed') : t('a curve keeps at least two points'));
        apply(); paint(true); return;
      }
      if (action === 'reset-tension') { writeTension(h.i, 0); say(rec, t('tension reset')); return; }
      if (action === 'add-point') {
        if (s.kind === 'env') { say(rec, t('the {:ENV} has fixed stages — drag a stage or its tension handle')); return; }
        if (!ensureCurve()) return;
        const q = uv(p), n0 = s.points.length;
        q.v = pointAddValue(e, q.v, curveEval(g.pts, q.t));
        M.curveEdit(s.id, 'add', { t: q.t, v: q.v, tension: 0 });
        if (s.points.length === n0) { say(rec, t('thirty-two points is the curve’s ceiling')); return; }
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
      rec.drag = { kind: mode, index: idx };               // the readout's held state, same frame
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

    const end = (e) => { if (pid !== e.pointerId) return; pid = null; mode = null; key = null; rec.drag = null; };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('lostpointercapture', end);
    svg.addEventListener('dblclick', (e) => {
      const h = hit(local(e));
      if (curveAction(e, h) !== 'reset-tension') return;
      e.preventDefault();
      writeTension(h.i, 0);
      say(rec, t('tension reset'));
    });
    svg.addEventListener('contextmenu', (e) => e.preventDefault());
    ariaLabel(svg, 'Curve editor: right-drag empty space to add a point; Shift-right-click adds at the current curve value; left-drag a point to move it; left-drag a tension handle to bend it; Ctrl makes tension fine; right-click or double-click a tension handle resets it; Alt-click a point deletes it.');
  }

  // Each meter is both an input-level display and a response-range editor.
  function buildAudioRanges(rec) {
    const {s, dev} = rec;
    dev.root.classList.add('audio-ranges');
    const root = el('div', 'aud-ranges', dev.ed.box);
    ariaLabel(root, 'Audio response ranges');
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
      aria(dial,key==='level'?t('{:LEVEL} master to {:LEVEL}'):t('{band} contribution to {:LEVEL}',{band:BAND_WORD[key]||key}),0,100,100*input.get(),Math.round(100*input.get())+'%');
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
      label(el('b','aud-range-full',head),BAND_WORD[key]?BAND_WORD[key].t:key);
      el('span','aud-range-short',head,BAND_SHORT[key]||key);
      const text=el('output','aud-range-value',row);
      head.addEventListener('click',()=>select(key));
      hintTo(head,'Select {band} for {:ATTACK}, {:RELEASE} and {:peak hold::HOLD}',{band:BAND_WORD[key]||key});
      const track=el('div','aud-range-track',row);
      const low=el('div','aud-range-low',track),high=el('div','aud-range-high',track),zone=el('div','aud-range-zone',track),fill=el('div','aud-range-output',track),cursor=el('i','aud-range-input',track);
      const handles={};
      for(const endpoint of ['floorDb','ceilingDb']) {
        const handle=el('button','aud-range-handle '+(endpoint==='floorDb'?'lower':'upper'),track); handle.type='button'; handle.dataset.endpoint=endpoint;
        handle.setAttribute('role','slider'); handle.setAttribute('aria-orientation','horizontal');
        ariaLabel(handle,endpoint==='floorDb'?'{band} lower response boundary dB':'{band} upper response boundary dB',{band:BAND_WORD[key]||key});
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
    const hint=label(el('div','aud-range-hint',root),'Select a band for timing');
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
      sh.rows.out.val.textContent=bandWord(selected());
      sh.rows.gate.val.textContent=s.audio.gateEnabled?t('ON'):t('OFF');
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
      input.type='range';input.min=spec.min;input.max=spec.max;input.step=spec.step;ariaLabel(input,'{name} in {unit}',{name:{t:sheetWord(key)},unit:spec.unit});
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
    label(sh.rows.hold.leg,'{:GATE HOLD} keeps the noise gate open. The face’s {:peak hold::HOLD} knob separately holds each band peak before release.');
    label(sh.rows.lower.leg,'Input dB at 0% output; upper boundary reaches 100%.');
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
      hintTo(row.head,'{band} · {out}% output · {db} dB input',{band:BAND_WORD[key]||key,out:(o.out*100).toFixed(0),db:Number.isFinite(o.inputDb)?o.inputDb.toFixed(1):'−∞'});
    }
    const out=ro.outs[selected];ui.hint.textContent=t('{band} · A {a} · R {r} · H {h} ms',{band:BAND_WORD[selected]||selected,a:out.attackMs.toFixed(0),r:out.releaseMs.toFixed(0),h:out.holdMs.toFixed(0)});   // tr: A, R and H are the initials of ATTACK, RELEASE and HOLD (the peak hold), each in milliseconds: use the initials of your own labels
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
    A.srcBtn.textContent = cap.live ? t('AUDIO ON') : t('AUDIO IN');
    A.liveLed.style.background = cap.live ? 'var(--acc2)' : '';
    A.liveTxt.textContent = cap.live ? t('LIVE') : (CAPTURE_WORD[cap.state] ? t(CAPTURE_WORD[cap.state].t) : String(cap.state));   // tr[LIVE]: the microphone is open and being listened to right now
    A.live.classList.toggle('on', cap.live);
    A.note.textContent = cap.live
      ? (ro.sampleRate ? t('{k} kHz · {hz} Hz feed', { k: (ro.sampleRate / 1000).toFixed(1), hz: ro.feedHz.toFixed(0) }) : t('listening'))
      : (cap.reason || t('audio input is closed — press {:AUDIO IN}'));
    if (dev.audioState) { dev.audioState.textContent = cap.live ? (ro.gateOpen ? t('OPEN') : t('GATED')) : t('OFF');   // tr[GATED]: the audio input's noise gate is shut: the sound is below the threshold, so nothing passes (the opposite of OPEN)
      dev.audioState.classList.toggle('on', cap.live && ro.gateOpen);
      dev.audioState.classList.toggle('bad', cap.state === 'denied' || cap.state === 'error'); }
    if (dev.status) {
      dev.status.main.classList.toggle('on', cap.live && ro.gateOpen);
      dev.status.text.textContent = cap.live ? (ro.gateOpen ? t('OPEN') : t('GATED')) : t('OFF');
      if (dev.status.middle) dev.status.middle.textContent = t('{:LEVEL} {v}', { v: ro.outs.level.out.toFixed(2) });
      dev.status.out.textContent = t('{n} OUT', { n: pad2(outsOf(s)) });
    }
    /* each socket says which macro holds it, by NUMBER — the same reading the rail's indicator and
       the minimised strip give, so one macro is one number wherever you meet it */
    const macros = M.macroList();
    const selected = audBands.get(s.id) || 'level';
    const selectedRoute = audRoutes.get(s.id) || selected;
    for (const key of Object.keys(A.outs)) {
      const row = A.outs[key], sock = M.scalarOutputId ? M.scalarOutputId(s.id, key) : null;
      const ix = sock ? macros.findIndex((m) => m.sourceId === sock) : -1;
      row.slot.textContent = key === 'hit' ? t('EVT') : (ix >= 0 ? String(ix + 1) : '--');   // tr[EVT]: short for EVENT: this output fires on a hit (an onset), it does not carry a level
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
      attr(dev.minNum, 'aria-label', selectedIx >= 0 ? t('{band} audio routing macro {i}', { band: BAND_WORD[selectedRoute] || selectedRoute, i: selectedIx + 1 }) : t('{band} audio routing: {:HAND}', { band: BAND_WORD[selectedRoute] || selectedRoute }));
      hintTo(dev.minNum, '{band} routing — click to cycle available macros', { band: BAND_WORD[selectedRoute] || selectedRoute });
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
    const txt = q.spec.text();
    if(rec.kind==='audio' && (key==='attack'||key==='release'||key==='peakHold'))attr(q.k.dial,'aria-label',t('{knob} of {band}',{band:BAND_WORD[audBands.get(rec.id)||'level'],knob:key==='peakHold'?{t:'peak hold::HOLD'}:key==='attack'?{t:'ATTACK'}:{t:'RELEASE'}}));
    if (q.k.arc && q.k.arc.chip) q.k.arc.chip.textContent = q.spec.short ? q.spec.short() : txt.split(' ')[0];
    q.k.val.textContent = txt;
    q.k.dial.setAttribute('aria-valuenow', String(Math.round(100 * u)));
    q.k.dial.setAttribute('aria-valuetext', txt);
  }
  const syncKnobs = (rec) => { for (const key in rec.knobs) paintKnob(rec, key); };

  let lastPaint = 0, paintCalls = 0, paintRuns = 0, paintMs = 0;
  function paint(force) {
    if (document.body.classList.contains('ui-hidden')) return false;   // H: the interface is hidden, the paint costs nothing (BASINS)
    const t0 = performance.now();
    paintCalls++;
    /* CLOSED, THE BODY IS NOT PAINTED.  Everything below writes into the window (its work bar, macro rail and device
       cards), which nobody sees while it is closed; open() rebuilds and force-paints it all.  What shows outside it is
       the routing rings on the app's own controls, and a forced paint still redraws those (wave 18: an app ticking
       paint(true) 17 times a second paid the whole body, 11.6 ms/s, with the window shut) */
    if (!P.open) { if (force) paintRings(routeIndex()); return false; }
    if (!force && t0 - lastPaint < 33) return false;      // 30 Hz is plenty for a number to be read at
    lastPaint = t0;
    const T = M.transport;
    if (nativeRate) nativeRate.set(registry.state('transport.rate').current);

    /* ── the work bar: the power is lit while modulation is on, whatever the app's clock is doing ── */
    const on = powered();
    transport.xport.classList.toggle('on', on);
    attr(transport.xport, 'aria-pressed', on);
    transport.tempoNum.textContent = T.bpm.toFixed(T.bpm < 100 ? 1 : 0);


    transport.tempoHz.textContent = (T.bpm / 60).toFixed(2) + ' Hz';
    transport.sync.textContent = M.syncMode() === 'wall' ? t('WALL') : t('FREE');
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
        rec.index = M.macroList().indexOf(m) + 1;
        if (rec.num && rec.num.textContent !== String(rec.index)) rec.num.textContent = String(rec.index);
        rec.vname.textContent = m.name;
        rec.root.classList.toggle('m2locked', !!m.sourceId);
        rec.root.style.setProperty('--m2-slot-ink',
          !src ? 'var(--m2-ink-faint)' : src.kind === 'env' ? 'var(--m2-env-ink)' : 'var(--acc)');
        rec.drive.textContent = src ? t('{kind} {name}', { kind: KIND_WORD[src.kind] || src.kind, name: src.label || src.id }) : t('HAND');   // tr: what drives a macro: a device (its kind and name, e.g. LFO 2), or HAND — the value set by hand, nothing modulating it
        rec.depthArc.style.strokeDasharray = clamp01(shownDepth).toFixed(4) + ' 1';
        rec.numSeat.classList.toggle('m2zero', shownDepth <= 1e-6);
        rec.numSeat.setAttribute('aria-disabled','false');
        if(rec.val)rec.val.setAttribute('aria-disabled',String(!!m.sourceId));
        hintTo(rec.numSeat, 'Master depth for {macro}', { macro: m.name });
      }
      if (rec.kind === 'trigger') {
        rec.signal.style.setProperty('--hit', M.triggerLevel(m.id).toFixed(4));
        rec.vnum.textContent = t('{n} SUB', { n: M.subCountOfTrigger(m.id) });
      } else {
        rec.signal.style.setProperty('--fill', clamp01(m.value).toFixed(4));
        rec.vnum.textContent = (100 * m.value).toFixed(0) + '%';
      }


      aria(rec.numSeat, t('MACRO {i} DEPTH', { i: rec.index }), 0, 100, 100*shownDepth, (100*shownDepth).toFixed(0)+'%');
      if (rec.val) aria(rec.val, t('{macro} value', { macro: m.name }), 0, 100, 100 * m.value, rec.vnum.textContent);
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
      const st = stateOf(s);
      if (dev.envStage) dev.envStage.textContent = stateWord(st);
      const outs = outsOf(s);
      if (dev.status) {
        dev.status.main.classList.toggle('on', s.on && st !== 'IDLE' && st !== 'OFF');
        dev.status.text.textContent = stateWord(st);
        dev.status.out.textContent = t('{value} · {n} OUT', { value: s.out.toFixed(2), n: pad2(outs) });
      }
      /* the folded strip's bay */
      if (dev.meterFill) dev.meterFill.style.height = pct(s.out);
      if (force && dev.minName) dev.minName.textContent = s.label || kindWord(s.kind);
      if (dev.minOut) dev.minOut.textContent = stateWord(st);
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
      /* THE PLAY DOT.  A forced paint that meets an editor box with no size (folded, closed, not laid out yet) empties
         the signature, and a tick skips a box with no signature.  That used to be the end of it: nothing forced a
         paint when the box came back, so the dot sat dead until something else did (BASINS 2026-10-01, cause 3).
         Now the box's own ResizeObserver (boxRO, below) forces the one paint that redraws it. */
      if (force) {
        const w = Math.round(g.box.clientWidth), h = Math.round(g.box.clientHeight);
        if (!(w > 8 && h > 8)) { g.sig = ''; continue; }        // folded, closed, or not laid out yet
        const sig = sigOf(s, w, h);
        if (sig !== g.sig) { g.sig = sig; render(rec); paintPresetGlyphs(rec); }
      } else if (!g.sig) continue;
      else {                                            // a shape the clock changed (a route on a device knob) redraws, at the paint's 30 Hz
        const sig = sigOf(s, g.w, g.h + 14);
        if (sig !== g.sig) { g.sig = sig; render(rec); }
      }
      const x = g.X(headU(s)).toFixed(2);
      dev.ed.play.setAttribute('x1', x); dev.ed.play.setAttribute('x2', x);
      dev.ed.pdot.setAttribute('cx', x); dev.ed.pdot.setAttribute('cy', g.Y(shapeAtHead(s)).toFixed(2));
      if (force && dev.minWavePath) dev.minWavePath.setAttribute('d', minShapeD(s));
    }

    /* ── the routing overlays ── */
    if (force) paintRings(routeIndex());
    paintRuns++; paintMs += performance.now() - t0;
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
  /** the window's own state, for the host's settings.  dock and chipSide are window.js's shape (readShape). */
  function presentation() {
    return { x: P.x, y: P.y, lane: P.lane, ribbon: P.ribbon, modes: { ...P.modes }, audioMini: { ...P.audioMini }, open: P.open,
      folder: { ...P.folder }, macroSide: P.macroSide, macroMin: P.macroMin, compactMode: compactMode(), selectedMacro: selMacro, selectedSource: selSource,
      audioBands: Object.fromEntries(audBands), audioRoutes: Object.fromEntries(audRoutes), dock: P.dock, chipSide: P.chipSide };
  }
  /* WAVE 105 · THE CHIPS TOLD THE TRUTH ONLY UNTIL A RELOAD — so the three that carry a state are written from the
     state on every rebuild and restore, through the rail's own tables. */
  function syncChips() {
    const all = devOrder();
    setChip('compact', compactMode()); chips.compact.dataset.compactMode = compactMode();
    setChip('ribbon', P.ribbon);
    syncWorkbarChip();
  }
  function restore(o) {
    if (!o) return;
    if (Number.isFinite(o.x)) { P.x = o.x; P.y = o.y; placed = true; }   // a remembered position is a hand's
    P.lane = WORK_LANES.includes(o.lane) ? o.lane : 'bottom';
    setWorkLane(panel, P.lane);
    P.ribbon = !!o.ribbon; rackEl.root.classList.toggle('m2ribbon', P.ribbon);
    P.dock = o.dock === 'top' || o.dock === 'bottom' ? o.dock : null;
    P.chipSide = ['left', 'right', 'top', 'bottom', 'auto'].includes(o.chipSide) ? o.chipSide : 'auto';
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
    P.compactMode = ['F', 'C', 'M'].includes(o.compactMode) ? o.compactMode : 'F';
    setMacroMin(o.macroMin);
    for (const s of devOrder()) { const r = devRows.get(s.id); if (r) { setDeviceMode(r.dev, modeOf(s.id)); if (r.syncMiniMeter) r.syncMiniMeter(); } }
    syncChips();
    if (o.open) open();
    else close();
  }
  /** open — laid out once with nothing painted (the rail measured, the window placed), then the entrance: window and
   *  rail together (core/motion.js presence; under reduced motion a fade, under 'off' nothing) */
  function open() {
    const wasHidden = root.hidden, exiting = !P.open && !root.hidden;   // closed, or still on its way out (reversed)
    P.open = true;
    root.hidden = false; rail.el.hidden = false;
    if (port.opened) port.opened();
    /* THE RAIL RISES WITH ITS WINDOW, in the rails' tier above every window (window/window.js law 5): a window in the one
       stack (bind.js registers it) is raised there, pane and rail; one outside it keeps its rail just above its pane */
    const w = windowOf(root); if (w) w.raise();
    rebuild(); rail.measure();
    /* (outside the stack, its z-index is read AFTER the measure, whose layout left the style clean: the read costs nothing,
       where read straight after the un-hide it forced a style pass of its own) */
    if (!w) { const z = parseInt(getComputedStyle(root).zIndex, 10); if (Number.isFinite(z)) rail.el.style.zIndex = String(z + 1); }
    place(); paint(true);
    if (wasHidden) { root.hidden = true; rail.el.hidden = true; }
    if (wasHidden || exiting) { presence(root, true); presence(rail.el, true); }
    persist();
    return true;
  }
  function close() {
    /* Closing releases only the preview's presentation demand. Routed modulation remains machinery
       and the host clock keeps it running; an unrouted source no longer burns frames for a hidden graph. */
    const was = P.open;
    P.open = false;
    gripDrag.cancel(); if (guide) guide.cancel(); moving = null;
    if (port.closed) port.closed();
    if (was) { presence(root, false); presence(rail.el, false); } else { root.hidden = true; rail.el.hidden = true; }
    /* WAVE 105 · a closed window may not leave a sheet floating.  The two PICKERS were the pair
       `closePop/closePresets/closeDead` never covered. */
    devPickOpen = false; if (pick && pick.root) pick.root.hidden = true;
    macroPickOpen = false; if (mpick && mpick.root) mpick.root.hidden = true;
    closePop(); closePresets(); closeDead();
    if (was && port.moved) { try { port.moved(null); } catch (_) {} }
    if (cancelReorder) cancelReorder(); tempoField.close(false);
    /* the per-editor readouts' document listeners have nothing to follow while the window is hidden; open() rebuilds them */
    for (const rec of devRows.values()) { if (rec.readout) { rec.readout.dispose(); rec.readout = null; } }
    persist(); geometryChanged();
    return true;
  }
  root.hidden = true; rail.el.hidden = true;

  /* A LANGUAGE CHANGE: kit.js relabels every node written through label()/ariaLabel(); the rest — the chips' names,
     the sentences the paint writes — is written again here, once. */
  const offLanguage = onLanguage(() => { for (const name of Object.keys(chips)) dressChip(name); if (P.open) { rebuild(); paint(true); } });

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
      aria(seat, t('MACRO {i} DEPTH', { i: n }), 0, 100, 100 * input.get(), '100%');
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
    /** a press on a routed control's dial, for a host whose dial takes its own presses (BASINS' COLOUR arc knobs): THIS
     *  window's rule — the control wears its badges (focusRing), and the route whose macro is selected, else the first
     *  live one, selects that macro.  → the macro id now selected, or null. */
    selectForTarget: (id) => { if (rings.has(id)) focusRing(id); const rs = M.routesOfTarget(id).filter((r) => !r.dormant); const chosen = rs.find(routeSelected) || rs[0]; if (!chosen) return null; selectMacro(chosen.macroId); return selectedMacro(); },
    drops: () => routables().map((k) => k.dataset.param),
    arming: () => (armed ? { macro: armed.macroId, mode: armed.mode, over: armed.over ? armed.over.dataset.param : null } : null),
    defaultRange: (id) => (registry.has(id) ? defaultRange(id) : null),
    ring(id) {
      const rec = rings.get(id); if (!rec) return null;
      const st = registry.state(id), er = editRouteOf(id), sp = er ? routeSpan(er) : null;
      const q = routeIndex().get(id) || EMPTY_SPAN;
      const d = (p) => (p ? p.getAttribute('d') || '' : '');
      return { id, wrap: st.wrap, baseNorm: st.baseNorm, fader: rec.fader,
               edit: d(rec.edit), stack: d(rec.stack), tick: d(rec.tick), spur: d(rec.spur),
               range: rec.range ? { shown: !rec.range.hidden, lo: +rec.range.style.getPropertyValue('--m2-route-lo') || 0,
                                    span: +rec.range.style.getPropertyValue('--m2-route-span') || 0 } : null,
               route: er ? er.id : null, macro: er ? er.macroId : null, bi: er ? !!er.bi : null,
               depth: sp ? sp.d : null, lo: st.baseNorm + q.lo, hi: st.baseNorm + q.hi,
               dormant: (rec.svg || rec.range).classList.contains('is-dormant'),
               valText: (rec.host.querySelector('.k-val, .fd-val') || {}).textContent || '',
               dragging: rec.host.classList.contains('ring-drag') };
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
               rail: rail.el.getAttribute('aria-label'), chips: Object.keys(chips).length };
    },
    /** where the window is and where it would land: { box (the state's rect), dock, chipSide, side (the rail's seat),
     *  landing: { top, bottom } — dockGeometry's rect for each dock with the chips where they are (the guide's rect: the
     *  CONTENT box, rack + bars, which is what docks), content: the content box now } */
    placement() {
      const e = env(), S = stateFor(P), L = layoutOf(P);
      const landing = {};
      const off = contentOff || { top: 0, bottom: 0 };   // the CONTENT lands at the edge: the landing (and the guide) is the content's rect
      for (const dk of ['top', 'bottom']) { const g = windowLayout({ ...S, h: Math.max(52, S.h - off.top - off.bottom), dock: dk }, e); landing[dk] = g.docked ? g.box : null; }
      const cb = P.open ? contentBox() : null;
      return { box: box ? { ...box } : null, dock: P.dock, chipSide: P.chipSide, side: L.seat.side, seat: { ...L.seat }, landing, moving: !!moving,
        content: cb ? { left: cb.left, top: cb.top, width: cb.right - cb.left, height: cb.bottom - cb.top } : null };
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
    at(id, u, v) {
      const rec = devRows.get(String(id)); if (!rec || !rec.g) return null;
      const b = rec.g.svg.getBoundingClientRect();
      return { x: b.left + rec.g.X(u) * b.width / rec.g.w,
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
    presets: () => bundledPresets().concat(M.presetList()).map((p) => ({ id: p.id, name: p.name, folder: p.folder, factory: !!p.factory, bundled: !!p.bundled })),
    presetKey: () => (M.presetStoreState ? M.presetStoreState().key : null),
    dead: () => M.dormantRoutes().map((r) => ({ id: r.id, macro: r.macroId, target: r.targetId })),
    performance: () => ({ calls: paintCalls, paints: paintRuns, ms: paintMs, averageMs: paintRuns ? paintMs / paintRuns : 0 }),
    /** → TL for one device (the PATTERN row menu's SEND TO TIMELINE): the sentence said, or null (refused out loud) */
    sendToTimeline: (id) => { const s = M.sourceOf(id); return s ? sendToTimeline(s) : null; }
  };


  if (devOrder().length === 0) { M.addSource('lfo'); M.addSource('env'); }

  rebuild();
  liveApi = api;                                                       // the importable macro gestures reach this window

  return {
    root, rail: rail.el, chipRail: rail, api, paint, sync, rebuild, presentation, restore, setAccent,
    /** the seat above the devices: { run, content } viewport rects while open (null closed), and the notice of every
     *  place, landing, open and close: onGeometry(fn(open)) → off */
    seatBox, onGeometry(fn) { geometryWatchers.add(fn); return () => geometryWatchers.delete(fn); },
    /** setPattern({ model, show(envId) } | null) — PATT on every ENV face (pattern/window.js installPattern calls it) */
    setPattern(p) {
      if (offPattern) { offPattern(); offPattern = null; }
      patternHost = p && p.model ? p : null;
      if (patternHost) offPattern = patternHost.model.subscribe(syncPatt);
      rebuild(); if (P.open) paint(true);
    },
    /** setTimeline({ editor, model } | null) — → TL on every LFO and ENV head (installModulation's setTimeline calls it) */
    setTimeline(tl) { timelineHost = tl || null; rebuild(); if (P.open) paint(true); },
    /** the host's road to the window's ONE line of prose — the same seat every message takes */
    say: (msg, cls) => status(msg, cls),
    resumeSentence,
    open, close, toggle: () => (P.open ? close() : open()),
    get isOpen() { return P.open; },
    /** the window OPENING re-reads the model; it does not restart it */
    wake() { rebuild(); paint(true); },
    /** the lego stack (window/workspaces.js): sit 8 px above anchor() (another window's rect); null ends it; a grip drag ends it */
    stackAbove(anchor) { stack = typeof anchor === 'function' ? anchor : null; stackOn = false; if (P.open) place(); },
    get isStacked() { return !!stack; },
    stackHeight: () => (box ? box.height : lawBox().h),
    dispose() {
      if (liveApi === api) liveApi = null;
      if (offPattern) { offPattern(); offPattern = null; } geometryWatchers.clear();
      rackEl.run.removeEventListener('wheel', deviceWheel);
      if (wsSwitch) wsSwitch.destroy(); tempoField.destroy();
      if (cancelReorder) cancelReorder(); layoutMotion.destroy();
      for (const rec of devRows.values()) if (rec.readout) rec.readout.dispose();
      off(); offLanguage(); if (ro) { ro.disconnect(); ro = null; } if (boxRO) boxRO.disconnect();
      document.removeEventListener('pointerdown', armTap, true);
      document.removeEventListener('pointerdown', popAway, true);
      document.removeEventListener('pointerdown', pickAway, true);
      document.removeEventListener('pointerdown', focusAway, true);
      window.removeEventListener('keydown', armKey, true);
      window.removeEventListener('keydown', popKey, true);
      window.removeEventListener('resize', onResize);
      if (unSpan) unSpan();
      if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
      audRings.clear(); audBands.clear(); audRoutes.clear();
      endArm(); closePop();
      gripDrag.destroy(); if (guide) guide.destroy(); glow.destroy(); glowLayer.remove();
      if (ghost) { ghost.remove(); ghost = null; }
      for (const [, rec] of rings) dropRing(rec); rings.clear();
      rail.destroy(); root.remove();
    }
  };
}
