/* ══════════════════════════════════════════════════════════════════════════
   mir/modwindow/modwindow.js — THE MODULATION WINDOW'S DOM, PORTABLE.

   This began as BASINS' modulation window tree and retains its portable
   builder contract.  The macro rail now carries the host's shipping controls:
   explicit ADD MACRO / ADD DEVICE actions, a delete control on each row, and
   no redundant OUT caption.  The remaining builders keep the source's DOM
   vocabulary and are labelled with their original anim.js locations.

   IT BUILDS AND IT DOES NOT WIRE.  There is no model, no registry, no
   persistence and no paint in this file.  It returns element references; the
   host attaches behaviour to them.  See host-contract.md.

   IT KNOWS NOTHING ABOUT ANY HOST APP.  The only app-shaped strings are in
   COPY below, and the only one that is load-bearing for PAINT is
   `WINDOW_TITLE` — the chip rail's aria-label is built from it and the
   stylesheet selects on that exact string.

   TWO DEAD-CODE TRAPS FROM THE EXTRACTION, DELIBERATELY NOT BUILT:
     · m2mkBarGrip (anim.js:3670) builds button.m2bargrip > svg.gly.gly-grip
       and is never called; m2preGrip and m2prebarGrip are only ever assigned
       null.  Its CSS travels (harmless); its JS must not.
     · m2preDel (anim.js:1705, 3827, 9415) is set to null.  No delete button
       is built in the preset bar, even though paintPresetStrip still guards
       for `.m2predel` / `.m2arm`.

   ONE RENAME, FROM THE EXTRACTION'S §7.4: the element helper is `m2mk`, not
   `mk`.  window.js exports a DIFFERENT `mk(tag, cls, txt)` whose third
   argument is TEXT and which does not append; anim.js's local `mk(tag, cls,
   parent)` appends.  Both are in the same import graph in BASINS.  The rename
   is mechanical and makes the collision impossible.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── THE NAMESPACE ──────────────────────────────────────────────────────── */

/** The one class modwindow.css scopes on.  It goes on the window root and on
 *  nothing else. */
export const NS = 'mir-modwindow';

/** The window's id.  modwindow.css reads `#modwin` 164 times at specificity
 *  (1,x,y).  If it must change, run one substitution across the stylesheet —
 *  do NOT demote the id selectors to classes. */
export const WINDOW_ID = 'modwin';

/** LOAD-BEARING FOR PAINT.  The chip rail's label is (title || root.id) +
 *  ' window controls', and five rules in modwindow.css select on the result
 *  byte-for-byte.  Translate this and the chips silently lose their material,
 *  with no error and no hint beyond "the chips look wrong". */
export const WINDOW_TITLE = 'MODULATION';
export const CHIPRAIL_LABEL = WINDOW_TITLE + ' window controls';

/** The ten global ids the window plants.  Only modwin, mod2css,
 *  m2-dead-send-warning and m2-dead-send-inspector are load-bearing (the last
 *  two through aria-controls); the six transport ids are handles. */
export const IDS = {
  win: WINDOW_ID,
  panel: 'modpanel',
  xport: 'modxport',
  tempo: 'modtempo',
  tempoIn: 'modtempoin',
  tap: 'modtap',
  sync: 'modsync',
  cad: 'modcad',
  deadWarn: 'm2-dead-send-warning',
  deadInspector: 'm2-dead-send-inspector'
};

/** anim.js:1612-1712.  Every number the size laws use.  Nine of these are
 *  interpolated into the stylesheet and are already literals there. */
export const GEOM = {
  CARD_FULL: { w: 360, h: 368 },   // M2_CARD.E
  CARD_COMPACT: { w: 320, h: 368 },   // M2_CARD.C
  STRIP_W: 64,           // M2_STRIP_W        a folded card
  VIEW_MIN: 220,          // M2_VIEW_MIN
  RAIL_W: 224,          // M2_RAIL_W         the MACROS rail
  SLOT_H: 64,           // M2_SLOT_H
  PREBAR_W: 294,          // M2_PREBAR_W
  PREBAR_MIN_W: 244,          // M2_PREBAR_MIN_W
  PRE_DEAD_EXT_W: 46,           // M2_PRE_DEAD_EXT_W
  MIN_W: 360,          // M2_MIN_W          the window minimum
  TIMING_W: 450,          // M2_TIMING_W       fixed, never elastic
  WORK_GAP: 16,           // M2_WORK_GAP
  WORK_GAP_MIN: 7,            // M2_WORK_GAP_MIN
  WORK_LANE_H: 52,           // M2_WORK_LANE_H
  RACK_GAP: 7,            // M2_RACK_GAP
  RUN_PAD_W: 14,           // M2_RUN_PAD_W
  ADD_SEAT_W: 89,           // M2_ADD_SEAT_W
  SHELL_W: 22,           // M2_SHELL_W
  CHROME_H: 98,           // M2_CHROME_H
  CURVE_H: 128,          // M2_CURVE_H
  NOTE_BAND: 14,           // M2_NOTE_BAND
  PAD: 11,           // M2_PAD
  RING_PITCH: 44,           // M2_RING_PITCH
  CLR_GAP: 46,           // M2_CLR_GAP
  MAX_H_FRAC: 0.86
};

/** anim.js:6790 / 6802 / 6746 / 6750 — arithmetic only, nothing is measured. */
export const sizeLaw = {
  width(cards, opts) {
    const o = opts || {};
    const scale = o.uiScale || 1;
    const rail = o.ribbon ? 58 : GEOM.RAIL_W;
    let sum = 0;
    for (const c of cards) {
      sum += c === 'M' ? GEOM.STRIP_W
        : c === 'C' ? GEOM.CARD_COMPACT.w : GEOM.CARD_FULL.w;
    }
    return Math.max(GEOM.MIN_W, Math.round(GEOM.SHELL_W * scale) + rail +
      GEOM.RUN_PAD_W + GEOM.ADD_SEAT_W + sum + cards.length * GEOM.RACK_GAP);
  },
  height(opts) {
    const o = opts || {};
    return Math.round(GEOM.CHROME_H * (o.uiScale || 1)) + GEOM.CARD_FULL.h;
  },
  minHeight(opts) {
    const o = opts || {};
    return Math.round(GEOM.CHROME_H * (o.uiScale || 1)) + GEOM.VIEW_MIN;
  },
  /* anim.js:6901 — the work-bar placement law.  `right` is the rack's right
     edge in viewport px; `dead` is whether any send is dormant. */
  workBars(right, viewport, dead) {
    const ext = dead ? GEOM.PRE_DEAD_EXT_W : 0;
    const idealMin = GEOM.PREBAR_W + ext + GEOM.WORK_GAP + GEOM.TIMING_W;
    const requiredMin = GEOM.PREBAR_MIN_W + ext + GEOM.WORK_GAP_MIN + GEOM.TIMING_W;
    const r = Math.max(requiredMin, Math.min(Math.max(right, idealMin), viewport));
    const left = r - GEOM.TIMING_W;
    const coreW = Math.max(GEOM.PREBAR_MIN_W,
      Math.min(GEOM.PREBAR_W, left - ext - GEOM.WORK_GAP_MIN));
    return { left, width: GEOM.TIMING_W, coreW, presetW: coreW + ext };
  }
};

/** Every literal string the tree carries.  Overridable through host.copy.
 *  `{factory}` is the one host word: BASINS ships the factory preset folder
 *  named MANDELBROT, and the extraction's §5 calls it "a word, not a
 *  mechanism". */
export const COPY = {
  railHead: 'MACROS',
  tab: 'MOD',
  presetPlaceholder: 'PRESET NAME',
  deadChip: '⊘ 0',
  tap: 'TAP',
  hold: ['HOLD 1/4', 'HOLD 1'],
  colHead: { lfo: 'PRESET', env: 'TIME', audio: 'SOURCE' },
  zoom: ['↑', 'FIT', '↓'],
  lfoPresets: [
    ['tri', 'TRI'], ['sawup', 'SAW↑'], ['sine', 'SINE'],
    ['square', 'SQR'], ['msaw', 'MULTI-SAW'], ['mtri', 'MULTI-TRI']
  ],
  lfoChecks: [
    ['invert', 'INVERT'], ['sync', 'BPM'], ['anchor', 'ANCHOR'],
    ['triplet', 'TRIPLET'], ['dotted', 'DOTTED']
  ],
  envChecks: [['invert', 'INVERT'], ['gate', 'GATE']],
  audioOuts: ['level', 'low', 'mid', 'high', 'hit'],
  lfoCmpToggles: [['trig', 'TRIG'], ['invert', 'INVERT'], ['sync', 'BPM'], ['anchor', 'ANCHOR']],
  /* [dataKnob, cap, lo, hi].  The cap paints; lo/hi land in `.m2kends`, which
     `#modwin .m2kends { display: none }` never shows — they are MODEL-DERIVED
     in the source (String(M.ENV_MAX_S) + 's', String(M.STEPS_MAX), …) and are
     reproduced here at BASINS' shipping values.  A host with different model
     limits should override these through host.copy; nothing paints either way. */
  knobs: {
    lfo: [['rate', 'RATE', '0.01', '3.0'], ['phase', 'PHASE', '0', '1'],
    ['smooth', 'SMOOTH', 'OFF', '500'], ['steps', 'STEPS', 'OFF', '1024']],
    env: [['a', 'ATTACK', '0', '8s'], ['hold', 'HOLD', '0', '8s'],
    ['d', 'DECAY', '0', '8s'], ['s', 'SUSTAIN', '0', '1'],
    ['r', 'RELEASE', '0', '8s'], ['steps', 'STEPS', 'OFF', '1024']],
    audio: [['sens', 'GAIN', '-24', '+24'], ['attack', 'ATTACK', '0', '2s'],
    ['release', 'RELEASE', '0', '2s'], ['peakHold', 'HOLD', '0', '2s']]
  },
  audioSheetRows: [['out', 'OUTPUT'], ['att', 'ATTACK'], ['rel', 'RELEASE'],
  ['hyst', 'HYST'], ['flux', 'SENSE']],
  devicePick: [['lfo', 'ADD LFO'], ['env', 'ADD ENV'], ['audio', 'ADD AUDIO']],
  macroPick: [['knob', 'KNOB'], ['trigger', 'TRIGGER']],
  factory: 'FACTORY',
  presetSheetLabel: 'Rack presets, in folders: {factory} ships with the app, ' +
    'the rest are yours',
  presetOpenLabel: 'Open the preset list — {factory} ships with the app, ' +
    'the rest are yours',
  /* anim.js:3932 — the hint line, verbatim, U+2019 apostrophes and all. */
  hint: 'Drag ✥ onto a slider or knob to route it (a PAD’s ✥ makes that ' +
    'control get hit) · drop it there again to release · ' +
    'a macro bar: drag sideways to set, double-tap to reset, tap to rename or unassign · ' +
    'number ring: up/down = master depth, double-tap = 100% · route ring: up/down = depth, ' +
    'sideways = direction.',
  chips: [
    { id: 'compact', glyph: 'compact', label: 'COMPACT' },
    { id: 'workbars', glyph: 'barsTop', label: 'Move work bars to top' },
    { id: 'ribbon', glyph: 'leave', label: 'RIBBON' }
  ]
};

/* anim.js:1525-1526 — the two transport faces, verbatim.  They are swapped
   through innerHTML; they are not glyphs. */
export const SVG_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="width:14px;height:14px;display:block;margin:auto"><rect x="6" y="4" width="3.5" height="16" rx="1"/><rect x="14.5" y="4" width="3.5" height="16" rx="1"/></svg>';
export const SVG_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="width:14px;height:14px;display:block;margin:auto"><polygon points="6 4 20 12 6 20 6 4"/></svg>';

/* ── THE TWO ELEMENT HELPERS (anim.js:1042, 3313) ───────────────────────── */

const SVGNS = 'http://www.w3.org/2000/svg';

/** anim.js:1042, renamed per §7.4.  `cls` may be a space-separated string of
 *  several classes.  There is no text argument: text is always assigned
 *  afterwards as .textContent. */
export function m2mk(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  return e;
}

/** anim.js:3313. */
export function m2svg(tag, cls, parent, attrs) {
  const e = document.createElementNS(SVGNS, tag);
  if (cls) e.setAttribute('class', cls);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

/* ── THE GLYPHS (EXTRACT file 05, verbatim from glyph.js) ────────────────── */

/* glyph.js:44,60,65,70 — ONE stroke weight for the whole set. */
const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.9" ' +
  'stroke-linecap="round" stroke-linejoin="round"';

export const GLYPHS = {
  chevronDown:
    '<path ' + STROKE + ' d="M6.6 9.4 L12 15.2 L17.4 9.4"/>',
  clear:
    '<path ' + STROKE + ' d="M8.6 5.4 L20.1 5.4 A1.7 1.7 0 0 1 21.8 7.1 ' +
    'L21.8 16.9 A1.7 1.7 0 0 1 20.1 18.6 L8.6 18.6 L2.4 12 Z"/>' +
    '<path ' + STROKE + ' d="M11.6 9.4 L16.8 14.6 M16.8 9.4 L11.6 14.6"/>',
  close:
    '<path ' + STROKE + ' d="M7.1 7.1 L16.9 16.9 M16.9 7.1 L7.1 16.9"/>',


  dirNext:
    '<path fill="currentColor" d="M9.4 6.4 L17.4 11.4 A0.7 0.7 0 0 1 17.4 12.6 ' +
    'L9.4 17.6 A0.7 0.7 0 0 1 8.3 17 L8.3 7 A0.7 0.7 0 0 1 9.4 6.4 Z"/>',
  dirPrev:
    '<path fill="currentColor" d="M14.6 6.4 L6.6 11.4 A0.7 0.7 0 0 0 6.6 12.6 ' +
    'L14.6 17.6 A0.7 0.7 0 0 0 15.7 17 L15.7 7 A0.7 0.7 0 0 0 14.6 6.4 Z"/>',
  grip:
    '<circle cx="9" cy="7" r="1.45" fill="currentColor"/>' +
    '<circle cx="15" cy="7" r="1.45" fill="currentColor"/>' +
    '<circle cx="9" cy="12" r="1.45" fill="currentColor"/>' +
    '<circle cx="15" cy="12" r="1.45" fill="currentColor"/>' +
    '<circle cx="9" cy="17" r="1.45" fill="currentColor"/>' +
    '<circle cx="15" cy="17" r="1.45" fill="currentColor"/>',
  leave:
    '<path ' + STROKE + ' d="M6.6 12 L17.4 12"/>',
  save:
    '<circle cx="12" cy="12" r="9.2" ' + STROKE + '/>' +
    '<path ' + STROKE + ' d="M7.78 6.79 H14.23 L17.21 9.77 V16.22 ' +
    'A0.99 0.99 0 0 1 16.22 17.21 H7.78 A0.99 0.99 0 0 1 6.79 16.22 V7.78 ' +
    'A0.99 0.99 0 0 1 7.78 6.79 Z"/>' +
    '<path ' + STROKE + ' d="M9.52 6.79 V9.89 H13.61 V6.79"/>' +
    '<path ' + STROKE + ' d="M9.15 17.21 V13.36 H14.85 V17.21"/>',
  swap:
    '<path ' + STROKE + ' d="M3.4 9.1 L20.6 9.1 M16.6 5.1 L20.6 9.1 L16.6 13.1"/>' +
    '<path ' + STROKE + ' d="M20.6 16.5 L3.4 16.5 M7.4 12.5 L3.4 16.5 L7.4 20.5"/>',
  compact:
    '<path ' + STROKE + ' d="M7.6 3.9 L7.6 20.1 M16.4 3.9 L16.4 20.1"/>' +
    '<path ' + STROKE + ' d="M2.2 12 L6.5 12 M4.5 9.6 L6.9 12 L4.5 14.4"/>' +
    '<path ' + STROKE + ' d="M21.8 12 L17.5 12 M19.5 9.6 L17.1 12 L19.5 14.4"/>',
  barsTop:
    '<path ' + STROKE + ' d="M3.1 5.2 H9.2 M14.8 5.2 H20.9"/>' +
    '<path ' + STROKE + ' opacity="0.42" d="M3.1 18.8 H20.9"/>',
  barsBottom:
    '<path ' + STROKE + ' opacity="0.42" d="M3.1 5.2 H20.9"/>' +
    '<path ' + STROKE + ' d="M3.1 18.8 H9.2 M14.8 18.8 H20.9"/>'
};

/** glyph.js:~70 glyphEl.  createElementNS + innerHTML — NOT createElement,
 *  which makes an HTML element named svg that lays out as an inline box and
 *  draws nothing. */
export function glyphEl(name, cls, size) {
  const body = GLYPHS[name];
  if (!body) return null;
  const s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('class', cls || ('gly gly-' + name));
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  const px = String(size === undefined ? 20 : size);
  s.setAttribute('width', px);
  s.setAttribute('height', px);
  s.innerHTML = body;
  return s;
}

/** glyph.js:414 setGlyph, exactly. */
export function setGlyph(el, name, opts) {
  const o = opts || {};
  const s = glyphEl(name, o.cls, o.size);
  if (!s) return null;
  el.textContent = '';
  el.appendChild(s);
  el.setAttribute('data-gly', name);
  if (o.label) el.setAttribute('aria-label', o.label);
  return s;
}

/* ── THE KNOB ARC (window.js:4175 knobArc) ──────────────────────────────── */

const ARC_VIEW = 100;

/** window.js:4175.  Four elements: svg.ckarc with three circles, plus b.ckval.
 *  Every knob in this window uses span 300/360 and start -150, so all three
 *  circles carry transform="rotate(-240 50 50)". */
export function knobArc(elm, opts) {
  const o = opts || {};
  const r1 = Number.isFinite(o.r1) ? o.r1 : 40;
  const r2 = Number.isFinite(o.r2) ? o.r2 : r1 + 9;
  const span = Number.isFinite(o.span) ? o.span : 1;
  const start = Number.isFinite(o.start) ? o.start : 0;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'ckarc');
  svg.setAttribute('viewBox', '0 0 ' + ARC_VIEW + ' ' + ARC_VIEW);
  svg.setAttribute('aria-hidden', 'true');
  /* THE ROTATION IS A PRESENTATION ATTRIBUTE, NOT A CSS TRANSFORM. */
  const ring = (cls, r) => {
    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('class', cls);
    c.setAttribute('cx', String(ARC_VIEW / 2));
    c.setAttribute('cy', String(ARC_VIEW / 2));
    c.setAttribute('r', String(r));
    c.setAttribute('transform', 'rotate(' + (start - 90) + ' ' +
      (ARC_VIEW / 2) + ' ' + (ARC_VIEW / 2) + ')');
    svg.appendChild(c);
    return c;
  };
  const pack = {
    svg, span, start, r1, r2,
    c1: 2 * Math.PI * r1, c2: 2 * Math.PI * r2,
    trk: ring('ckarc-trk', r1),
    band: ring('ckarc-band', r2),
    val: ring('ckarc-val', r1),
    chip: null, shown: null
  };
  /* THE TRACK NEVER MOVES, so it is written ONCE here and never on a paint. */
  pack.trk.style.strokeDasharray = (span * pack.c1).toFixed(2) + ' 9999';
  pack.band.style.strokeDasharray = '0 9999';
  pack.val.style.strokeDasharray = '0 9999';
  elm.appendChild(svg);
  if (o.val !== false) {
    pack.chip = document.createElement('b');
    pack.chip.className = 'ckval';
    pack.chip.setAttribute('aria-hidden', 'true');
    elm.appendChild(pack.chip);
  }
  return pack;
}

/* ── SMALL SHARED ICONS (anim.js:3322, 3332) ────────────────────────────── */

/** anim.js:3322 — the four-way drag cross.  The svg has NO class. */
export function gripIcon(parent) {
  const s = m2svg('svg', null, parent, { viewBox: '0 0 24 24' });
  m2svg('path', null, s, {
    d: 'M12 2.5 L15 6 H13 V11 H18 V9 L21.5 12 L18 15 V13 H13 V18 H15 L12 21.5 L9 18 H11 V13 H6 V15 ' +
      'L2.5 12 L6 9 V11 H11 V6 H9 Z',
    fill: 'currentColor'
  });
  return s;
}

/** anim.js:3332 — the power ring.  The svg has NO class. */
export function powIcon(parent) {
  const s = m2svg('svg', null, parent, { viewBox: '0 0 24 24' });
  m2svg('path', null, s, {
    d: 'M12 2 V11', stroke: 'currentColor', 'stroke-width': '2.6',
    'stroke-linecap': 'round', fill: 'none'
  });
  m2svg('path', null, s, {
    d: 'M6.2 5.6 A8.4 8.4 0 1 0 17.8 5.6', stroke: 'currentColor',
    'stroke-width': '2.2', 'stroke-linecap': 'round', fill: 'none'
  });
  return s;
}

/* ══════════════════════════════════════════════════════════════════════════
   THE WINDOW
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Builds the whole modulation window and returns its root element.
 *
 * @param {object} host  every field optional; see host-contract.md
 *        host.copy       partial override of COPY
 *        host.title      default 'MODULATION' — LOAD-BEARING, see above
 *        host.id         default 'modwin'     — LOAD-BEARING, 164 selectors
 *        host.document   default globalThis.document
 * @returns {HTMLElement} the `.kwin` root.  Its `.modwindow` property carries
 *        every reference the host needs plus the sub-builders.
 */
export function createModWindow(host) {
  const h = host || {};
  const copy = Object.assign({}, COPY, h.copy || {});
  const id = h.id || WINDOW_ID;
  const title = h.title === undefined ? WINDOW_TITLE : h.title;

  /* ── THE SHELL (anim.js:1052-1106 through window.js createWindow) ──────
     The root class string is the literal concatenation
       'kwin glass kwin-kind-' + kind + ' kwin-chips-only' + ' ' + className
     which for this window resolves to exactly this.  `mir-modwindow` is the
     one addition this port makes, and modwindow.css scopes on it. */
  const root = m2mk('div', 'kwin glass kwin-kind-persistent kwin-chips-only modwin ' + NS);
  root.id = id;
  root.dataset.windowKind = 'persistent';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', title);
  root.hidden = true;
  /* .m2retired hides the retired tab strip: `.modwin.m2retired .kwin-tabs
     { display: none }`.  anim.js:1115 puts it on the window root and 1116 on
     <html>; only the root copy is read by any rule. */
  root.classList.add('m2retired');

  /* THE BAR IS BUILT AND THEN EMPTIED.  barlessAlways + FROST_KIT.modwin
     .barless = '.m2pre' means applyBarless moves every child of .kwin-bar
     into .m2pre — except .kwin-title, and except .kwin-close because the root
     is .kwin-chips-only.  `.kwin.kwin-chips-only > .kwin-bar` then hides it. */
  const bar = m2mk('div', 'kwin-bar', root);
  const titleEl = m2mk('span', 'kwin-title', bar);
  titleEl.textContent = title;
  const close = m2mk('button', 'kwin-close', bar);
  close.type = 'button';
  close.setAttribute('aria-label', 'Close ' + title);
  close.dataset.ink = 'close';
  const closeInk = glyphEl('close', 'crail-ink gly-close', 26);
  if (closeInk) close.appendChild(closeInk);

  /* BUILT, then hidden by .m2retired. */
  const tabs = m2mk('div', 'kwin-tabs', root);
  tabs.setAttribute('role', 'tablist');
  const tab = m2mk('button', 'kwin-tab on', tabs);
  tab.type = 'button';
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-selected', 'true');
  tab.tabIndex = 0;
  tab.dataset.tab = 'mod';
  tab.textContent = copy.tab;

  const body = m2mk('div', 'kwin-body', root);
  const panel = m2mk('div', 'kwin-panel on', body);
  panel.id = IDS.panel;
  panel.setAttribute('role', 'tabpanel');
  panel.dataset.tab = 'mod';
  panel.dataset.kitSlot = 'mod';

  /* .kwin-halo and .kwin-grip are NOT built: this window is resizable:false. */

  /* ── THE PANEL, in source order root -> foot -> hint (anim.js:3888) ──── */
  const rack = buildRack(panel, copy);
  const foot = buildPresetStrip(panel, copy);
  const hint = m2mk('div', 'm2hint', panel);
  hint.textContent = copy.hint;

  /* THE BARLESS SWAP, done here rather than deferred: the timing bar's DOM
     order is pure install order, which is why the strip reads
     play · tempo · TAP · WALL · QUARTER · HOLD 1/4 · HOLD 1. */
  root.classList.add('kwin-barless');
  foot.pre.classList.add('fr-bar');
  const transport = buildTimingBar(foot.pre, copy);

  const api = {
    root, bar, title: titleEl, close, tabs, tab, body, panel,
    rack, foot, transport, hint, copy, id, windowTitle: title,
    chiprail: null,
    /* the sub-builders, so the host can grow the rack after the first paint */
    addMacro: (m, index) => buildMacroSlot(rack.slots, m, index),
    addDevice: (src) => buildDevice(rack.run, null, src, copy),
    setDeviceMode, setViewHeight: (px) => setViewHeight(rack.root, px),
    buildRing, buildSpan, buildClear, buildGhost,
    buildDevicePick: () => buildDevicePick(root, copy),
    buildMacroPick: () => buildMacroPick(root, copy),
    buildPresetSheet: () => buildPresetSheet(root, copy),
    buildDeadInspector: () => buildDeadInspector(root)
  };
  root.modwindow = api;
  return root;
}

/* ── THE FLOATING CHIP RAIL (window.js:1745, chipItems anim.js:1073) ─────
   A SIBLING of the window, appended to owner.root.parentNode.  In f01.png it
   is the vertical column of five discs at the far left of the screen. */
export function buildChipRail(windowRoot, host) {
  const h = host || {};
  const copy = Object.assign({}, COPY, h.copy || {});
  const side = h.side === 'right' ? 'right' : 'left';
  const title = windowRoot.modwindow ? windowRoot.modwindow.windowTitle : WINDOW_TITLE;
  const rail = m2mk('div', 'crail crail-float kwin-chiprail kwin-chiprail-' + side);
  rail.setAttribute('role', 'toolbar');
  /* window.js builds this as (o.title || root.id) + ' window controls'.
     modwindow.css selects on the exact result in five rules. */
  rail.setAttribute('aria-label', (title || windowRoot.id) + ' window controls');

  const chips = {};
  const chip = (spec, kind) => {
    const drag = kind === 'drag';
    const b = m2mk(drag ? 'div' : 'button', 'kwin-tab crail-chip' +
      (drag ? ' crail-grip' : '') + (kind === 'close' ? ' kwin-close-chip' : ''));
    if (!drag) b.type = 'button';
    b.dataset.rail = spec.id;
    b.dataset.chromeKind = kind;
    b.dataset.reopensWindow = 'false';
    b.setAttribute('aria-label', spec.label);
    b.title = spec.title || spec.label;
    rail.appendChild(b);
    chips[spec.id] = b;
    return b;
  };

  const closeChip = chip({ id: 'close', label: 'Close window', title: 'Close window' }, 'close');
  closeChip.dataset.ink = 'close';
  const closeInk = glyphEl('close', 'crail-ink gly-close', 26);
  if (closeInk) closeChip.appendChild(closeInk);

  for (const c of copy.chips) {
    const b = chip({ id: c.id, label: c.label, title: c.label }, 'action');
    b.setAttribute('aria-pressed', 'false');
    b.dataset.ink = c.glyph;
    const ink = glyphEl(c.glyph, 'crail-ink gly-' + c.glyph, 26);
    if (ink) b.appendChild(ink);
  }

  /* A DIV, not a button; no type attribute. */
  const grip = chip({ id: 'drag', label: 'Drag window', title: 'Drag window' }, 'drag');
  const dots = m2mk('span', 'kwin-grip-dots', grip);
  dots.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 9; i++) m2mk('i', null, dots);   // exactly nine, a 3x3 grid

  if (windowRoot.parentNode) windowRoot.parentNode.appendChild(rail);
  if (windowRoot.modwindow) windowRoot.modwindow.chiprail = { root: rail, chips };
  return rail;
}

/* ══════════════════════════════════════════════════════════════════════════
   THE RACK — anim.js:3888 buildMod2
   ══════════════════════════════════════════════════════════════════════════ */

function buildRack(panel, copy) {
  const root = m2mk('div', 'm2root', panel);

  const rail = m2mk('div', 'm2rail', root);
  const railhead = m2mk('div', 'm2railhead', rail);
  railhead.textContent = copy.railHead;
  const slots = m2mk('div', 'm2slots', rail);
  /* PINNED OUTSIDE THE SCROLLER, at the rail's foot, so "the button that grows
     the rail can never be pushed out of view by growing the rail". */
  const macrow = m2mk('div', 'm2macrow', rail);
  const macadd = m2mk('button', 'm2macadd', macrow);
  macadd.type = 'button';
  macadd.textContent = 'ADD MACRO';
  const devadd = m2mk('button', 'm2devadd', macrow);
  devadd.type = 'button';
  devadd.textContent = 'ADD DEVICE';

  const run = m2mk('div', 'm2run', root);
  run.dataset.inputOwner = 'rack-scroll';

  return { root, rail, railhead, slots, macrow, macadd, devadd, run };
}

/** anim.js:6763 — the only fluid vertical number, clamped to [220, 368]. */
export function setViewHeight(rackRoot, winH, uiScale) {
  const chrome = Math.round(GEOM.CHROME_H * (uiScale || 1));
  const want = Math.max(GEOM.VIEW_MIN,
    Math.min(GEOM.CARD_FULL.h, Math.round(winH - chrome)));
  rackRoot.style.setProperty('--m2-view-h', want + 'px');
  return want;
}

/** The work lane flips with one class on the panel; CSS `order` does the rest
 *  (.m2foot order 2 -> 0). */
export function setWorkLane(panel, where) {
  panel.classList.toggle('m2bars-top', where === 'top');
}

/* ══════════════════════════════════════════════════════════════════════════
   THE TRANSPORT STRIP — anim.js:3764 buildPresetStrip + the five installers

   TWO INDEPENDENT ABSOLUTELY-POSITIONED BOXES INSIDE ONE 52 px LANE.  They
   are not one bar.  The gap between them is real and the picture shows
   through it: .m2foot is pointer-events:none with overflow:visible, and each
   .m2workbar inside it is pointer-events:auto.
   ══════════════════════════════════════════════════════════════════════════ */

function buildPresetStrip(panel, copy) {
  const foot = m2mk('div', 'm2foot', panel);
  const prebar = m2mk('div', 'm2workbar m2prebar glass', foot);
  const core = m2mk('div', 'm2precore', prebar);

  const navBtn = (cls, glyph, size, label, parent) => {
    const b = m2mk('button', cls, parent || core);
    b.type = 'button';
    if (glyph && GLYPHS[glyph]) setGlyph(b, glyph, { size, label });
    else { if (glyph) b.textContent = glyph; b.setAttribute('aria-label', label); }
    return b;
  };

  /* the ▾: dirNext turned a quarter turn by the stylesheet — glyph.js carries
     no chevron-down, and a drawing rotated is still a drawing. */
  const open = navBtn('m2prenav m2preopen', 'chevronDown', 15,
    copy.presetOpenLabel.replace('{factory}', copy.factory));
  open.setAttribute('aria-haspopup', 'listbox');
  open.setAttribute('aria-expanded', 'false');
  open.title = 'PRESETS';

  const save = navBtn('m2presave', 'save', 21, 'Save this rack as a preset');
  save.title = 'SAVE';

  const name = m2mk('input', 'm2prename', core);
  name.type = 'text';
  name.spellcheck = false;
  name.placeholder = copy.presetPlaceholder;
  name.setAttribute('autocapitalize', 'characters');
  name.setAttribute('aria-label', 'Preset name — type one, then tap SAVE');

  const prev = navBtn('m2prenav', 'dirPrev', 15, 'Previous preset');
  const next = navBtn('m2prenav', 'dirNext', 15, 'Next preset');
  /* m2preDel is null.  NO DELETE BUTTON IS BUILT. */

  /* THE DEAD LIGHT.  A SIBLING of .m2precore, not inside it, so it lives in
     the 46 px extension.  Hidden entirely when nothing is dormant — a warning
     that is always on the glass is furniture, not a warning. */
  const dead = navBtn('m2predead off', copy.deadChip,
    null, 'Sends that are dead until their controls come back', prebar);
  dead.id = IDS.deadWarn;
  dead.setAttribute('aria-haspopup', 'dialog');
  dead.setAttribute('aria-controls', IDS.deadInspector);
  dead.setAttribute('aria-expanded', 'false');

  /* THE TIMING BAR — the kit's barless host.  Built EMPTY here. */
  const pre = m2mk('div', 'm2workbar m2pre', foot);
  /* m2preGrip and m2prebarGrip are null.  m2mkBarGrip is never called. */

  return { root: foot, prebar, core, open, save, name, prev, next, dead, pre };
}

/** anim.js:1135 / 1178 / 1432 / 8947 / 9013 — installed in this order, and
 *  the order IS the strip: each installer appends to the barless bar, whose
 *  querySelector('.kwin-close') is null there. */
function buildTimingBar(pre, copy) {
  const xport = m2mk('button', 'modxport', pre);
  xport.type = 'button';
  xport.id = IDS.xport;
  xport.innerHTML = SVG_PLAY;

  const tempo = m2mk('button', 'modtempo', pre);
  tempo.type = 'button';
  tempo.id = IDS.tempo;
  const tempoNum = m2mk('b', null, tempo);
  const tempoUnit = m2mk('span', null, tempo);
  tempoUnit.textContent = 'BPM';                    // hidden by .tighter
  const tempoHz = m2mk('i', 'modhz', tempo);        // hidden by .tight

  /* It stands exactly where the field stood: the two swap `hidden`. */
  const tempoIn = m2mk('input', 'modtempoin', pre);
  tempoIn.id = IDS.tempoIn;
  tempoIn.type = 'text';
  tempoIn.inputMode = 'decimal';
  tempoIn.maxLength = 5;
  tempoIn.spellcheck = false;
  tempoIn.hidden = true;

  const tap = m2mk('button', 'modtap', pre);
  tap.type = 'button';
  tap.id = IDS.tap;
  tap.textContent = copy.tap;

  const sync = m2mk('button', 'modsync', pre);
  sync.type = 'button';
  sync.id = IDS.sync;

  const cad = m2mk('button', 'modcad', pre);
  cad.type = 'button';
  cad.id = IDS.cad;

  /* anim.js:8951 mkHold sets, in this exact order: className, type,
     textContent, aria-label, aria-pressed, title. */
  const holds = copy.hold.map((label) => {
    const b = m2mk('button', 'm2hold', pre);
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-pressed', 'false');
    b.title = label;
    return b;
  });

  return { xport, tempo, tempoNum, tempoUnit, tempoHz, tempoIn, tap, sync, cad, holds };
}

/* ══════════════════════════════════════════════════════════════════════════
   THE MACROS CARD — anim.js:4408 / 4423 / 4448 / 4530
   ══════════════════════════════════════════════════════════════════════════ */

/** anim.js:4408.  The round numbered token: a depth ring and a numeral. */
function buildMacroNumber(row, index) {
  const seat = m2mk('div', 'm2numseat', row);
  seat.setAttribute('role', 'slider');
  const ring = m2svg('svg', 'm2depthring', seat,
    { viewBox: '0 0 36 36', 'aria-hidden': 'true' });
  const track = m2svg('circle', 'm2depthtrack', ring,
    { cx: 18, cy: 18, r: 15, pathLength: 1 });
  const depthArc = m2svg('circle', 'm2deptharc', ring,
    { cx: 18, cy: 18, r: 15, pathLength: 1, 'stroke-dasharray': '1 1' });
  const num = m2mk('span', 'm2num', seat);
  num.setAttribute('aria-hidden', 'true');
  num.textContent = String(index);
  return { seat, ring, track, num, depthArc };
}

/** anim.js:4423.  THE HORIZONTAL TRACK LINE UNDER THE NAME IS A
 *  PSEUDO-ELEMENT (.m2signal::before), not a node.  There is nothing in the
 *  DOM to find. */
function buildMacroFace(hostEl, trigger) {
  const info = m2mk('span', 'm2vinfo', hostEl);
  info.setAttribute('aria-hidden', 'true');
  const vname = m2mk('span', 'm2vname', info);
  const vnum = m2mk('span', 'm2vnum', info);
  const signal = m2mk('span', 'm2signal', hostEl);
  signal.setAttribute('aria-hidden', 'true');
  let fill = null, marker = null, spark = null, sparkLine = null, padin = null;
  if (trigger) {
    padin = m2mk('i', 'm2padin', signal);
  } else {
    spark = m2svg('svg', 'm2spark', signal,
      { viewBox: '0 0 100 12', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    sparkLine = m2svg('polyline', null, spark, { points: '' });
    fill = m2mk('i', 'm2vfill', signal);
    marker = m2mk('i', 'm2vedge', signal);
  }
  const meta = m2mk('span', 'm2vmeta', hostEl);
  meta.setAttribute('aria-hidden', 'true');
  const drive = m2mk('span', 'm2drive', meta);
  return { info, vname, vnum, signal, fill, marker, spark, sparkLine, padin, meta, drive };
}

/** anim.js:4313.  A SIBLING of .m2slotrow, absolutely positioned over the
 *  face.  Nothing is ever reparented; opening it only clears `hidden`. */
function mkEditRow(root, what, index) {
  const row = m2mk('div', 'm2namerow', root);
  row.hidden = true;
  const name = m2mk('input', 'm2name', row);
  name.type = 'text';
  name.maxLength = 24;
  name.spellcheck = false;
  name.setAttribute('autocapitalize', 'characters');
  name.setAttribute('aria-label', what + ' ' + index + ' name — type your own');
  const clr = m2mk('button', 'm2mclr', row);
  clr.type = 'button';
  setGlyph(clr, 'clear', { size: 16 });
  return { row, name, clr };
}

/** anim.js:4530 / 4448.  `index` is 1-based. */
export function buildMacroSlot(slotbox, m, index) {
  const trigger = m && m.kind === 'trigger';
  const root = m2mk('div', trigger ? 'm2slot m2trigslot' : 'm2slot', slotbox);
  if (m && m.id !== undefined) root.dataset.macro = String(m.id);
  const row = m2mk('div', 'm2slotrow', root);   // grid: 44px 44px minmax(0,1fr)

  const grip = m2mk('button', 'm2grip', row);   // the four-way drag cross
  grip.type = 'button';
  gripIcon(grip);

  const numbered = buildMacroNumber(row, index);

  /* role="slider" because that is what it is; the host's registry writes the
     aria range and value. */
  const face = trigger ? m2mk('button', 'm2pad', row) : m2mk('div', 'm2val', row);
  if (trigger) face.type = 'button'; else face.setAttribute('role', 'slider');
  const parts = buildMacroFace(face, trigger);

  const del = m2mk('button', 'm2slotx', row);
  del.type = 'button';
  setGlyph(del, 'close', { size: 14, label: 'Delete ' + (trigger ? 'trigger ' : 'macro ') + index });

  const ed = mkEditRow(root, trigger ? 'Trigger' : 'Macro', index);

  return {
    id: m && m.id, kind: trigger ? 'trigger' : 'knob', index,
    root, row, grip, del, val: trigger ? null : face, pad: trigger ? face : null,
    numSeat: numbered.seat, num: numbered.num, depthArc: numbered.depthArc,
    vname: parts.vname, vnum: parts.vnum, signal: parts.signal,
    marker: parts.marker, fill: parts.fill, spark: parts.spark,
    sparkLine: parts.sparkLine, padin: parts.padin,
    drive: parts.drive,
    erow: ed.row, name: ed.name, clr: ed.clr
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   A DEVICE CARD — anim.js:6000 buildMod2Device
   ONE BUILDER FOR ALL THREE KINDS.  The root class string is the
   concatenation 'm2dev ' + kind.  m2cmp / m2min / m2off / m2drag / m2swaphot
   are added on top at runtime.
   ══════════════════════════════════════════════════════════════════════════ */

/** anim.js:5462 — the small shared status anatomy. */
function statusCapsule(parent, o) {
  const root = m2mk('div', 'm2status ' + o.rootClass, parent);
  const main = m2mk('span', 'm2statusmain ' + o.mainClass, root);
  m2mk('i', 'm2statuslamp', main);
  const text = m2mk('b', null, main);
  text.textContent = o.text;
  const middle = o.middleClass ? m2mk('span', o.middleClass, root) : null;
  if (middle) middle.textContent = o.middleText;
  const out = m2mk('span', o.outClass, root);
  out.textContent = o.outText;
  return { root, main, text, middle, out };
}

/** anim.js:5476 m2buildEditor.  CHILDREN OF THE SVG ARE CREATED IN EXACTLY
 *  THIS ORDER, WHICH IS THE PAINT ORDER. */
function buildEditor(dev, body, kind) {
  const box = m2mk('div', 'm2edit m2hero', body);
  const svg = m2svg('svg', 'm2svg', box, { preserveAspectRatio: 'none' });
  const gGrid = m2svg('g', null, svg);            // NO class
  const mid = m2svg('line', 'm2mid', svg);
  const fill = m2svg('path', 'm2fill', svg);
  const path = m2svg('path', 'm2path', svg);
  const play = m2svg('line', 'm2play', svg);
  const pdot = m2svg('circle', 'm2playdot', svg, { cx: -10, cy: -10, r: 3.6 });
  const gTens = m2svg('g', null, svg);            // NO class
  const gPts = m2svg('g', null, svg);             // NO class
  const note = m2mk('div', 'm2note', box);

  let status = null, progress = null, progressFill = null;
  if (kind === 'lfo') {
    status = statusCapsule(box, {
      rootClass: 'm2lfostatus', mainClass: 'm2lforun',
      text: 'HOLD', outClass: 'm2lfoout', outText: '0 OUT'
    });
  } else if (kind === 'env') {
    status = statusCapsule(box, {
      rootClass: 'm2envstatus', mainClass: 'm2envrun',
      text: 'IDLE', outClass: 'm2envout', outText: '0.00 · 0 OUT'
    });
    progress = m2mk('div', 'm2envprogress', box);
    progressFill = m2mk('i', null, progress);
  } else {
    status = statusCapsule(box, {
      rootClass: 'm2audiostatus', mainClass: 'm2audiolife', text: 'OFF',
      middleClass: 'm2audiolevel', middleText: 'LEVEL 0.00',
      outClass: 'm2audioout', outText: '0 OUT'
    });
  }
  return {
    box, svg, gGrid, mid, fill, path, play, pdot, gTens, gPts, note,
    status, progress, progressFill,
    w: 0, h: GEOM.CURVE_H
  };
}

/** anim.js:7655 m2audioBuildMeter.  Appended INSIDE the editor's svg, after
 *  gPts, so it paints last. */
function buildAudioMeter(ed) {
  const g = m2svg('g', 'm2audg', ed.svg);
  const rect = (cls) => m2svg('rect', cls, g, { x: 0, y: 0, width: 0, height: 0 });
  const m = {
    g,
    traceWell: rect('m2audtracewell'),
    trace: m2svg('path', 'm2audtrace', g, {}),
    traceDot: m2svg('circle', 'm2audtracedot', g, { cx: -10, cy: -10, r: 2.8 }),
    well: rect('m2audwell'),
    hyst: m2svg('rect', 'm2audhyst', g, {}),
    lvl: rect('m2audbar'),
    gate: m2svg('line', 'm2audgate', g, {}),
    bands: [rect('m2audwell'), rect('m2audwell'), rect('m2audwell')],
    fills: [rect('m2audbar'), rect('m2audbar'), rect('m2audbar')],
    fwell: rect('m2audwell'),
    flux: rect('m2audbar m2audq'),
    ftick: m2svg('line', 'm2audtick', g, {}),
    flash: m2svg('rect', 'm2audflash', g, { x: -10, y: -10, width: 8, height: 8, rx: 1.5 }),
    labels: []
  };
  for (const t of ['LOW', 'MID', 'HIGH']) {
    const e = m2svg('text', 'm2audtxt', g, { x: 2, y: 0 });
    e.textContent = t;
    m.labels.push(e);
  }
  m.scale = m2svg('text', 'm2audtxt', g, { x: 2, y: 0 });
  m.scale.textContent = 'LEVEL';
  m.hitLabel = m2svg('text', 'm2audtxt m2audhitlabel', g, { x: 0, y: 0 });
  m.hitLabel.textContent = 'HIT';
  return m;
}

/** anim.js:5840 m2mkKnob. */
function mkKnob(parent, o, arcFn) {
  const root = m2mk('div', 'm2k m2dial', parent);
  if (o.knob) root.dataset.knob = o.knob;
  const dial = m2mk('div', 'm2kd m2dialink', root);
  dial.setAttribute('role', 'slider');
  m2mk('i', 'm2kn', dial);                        // the needle; drawn in CSS
  const arc = (arcFn || knobArc)(dial, {
    span: o.bounded === false ? 1 : 300 / 360,
    start: o.bounded === false ? 0 : -150
  });
  const cap = m2mk('div', 'm2kcap', root);
  cap.textContent = o.cap;
  const val = m2mk('div', 'm2kval', root);
  const ends = m2mk('div', 'm2kends', root);      // display:none inside #modwin
  const e1 = m2mk('span', null, ends);
  e1.textContent = o.lo === undefined ? 'MIN' : o.lo;
  const e2 = m2mk('span', null, ends);
  e2.textContent = o.hi === undefined ? 'MAX' : o.hi;
  return { root, dial, cap, val, ends, e1, e2, arc, id: o.id, label: o.cap };
}

/** anim.js:5910 m2mkCheck.  The lamp is a 9 px `i.m2dot`, all CSS. */
function mkCheck(parent, label, aria) {
  const b = m2mk('button', 'm2chk m2seat44', parent);
  b.type = 'button';
  m2mk('i', 'm2dot', b);
  const t = m2mk('span', null, b);                // NO class
  t.textContent = label;
  if (aria) b.setAttribute('aria-label', aria);
  b.setAttribute('aria-pressed', 'false');
  return b;
}

/**
 * @param {HTMLElement} run   the `.m2run` scroller
 * @param {HTMLElement|null} add optional insertion sentinel retained for callers of this exported builder
 * @param {object} src        { id, kind: 'lfo'|'env'|'audio' }
 */
export function buildDevice(run, add, src, copyIn) {
  const copy = Object.assign({}, COPY, copyIn || {});
  const kind = src.kind;
  const root = m2mk('div', 'm2dev ' + kind);
  if (src.id !== undefined) root.dataset.id = String(src.id);
  if (add && add.parentNode === run) run.insertBefore(root, add);
  else run.appendChild(root);

  const swapBadge = m2mk('i', 'm2swapbadge', root);
  setGlyph(swapBadge, 'swap', { size: 22 });
  swapBadge.setAttribute('aria-hidden', 'true');

  /* ── THE HEAD ─────────────────────────────────────────────────────────
     .m2headl and .m2headr become display:contents when folded, so their
     children flatten onto the 64 px column and re-sequence with `order`. */
  const head = m2mk('div', 'm2head', root);
  const headl = m2mk('div', 'm2headl', head);

  const grab = m2mk('button', 'm2grab', headl);
  grab.type = 'button';
  m2mk('i', null, grab);                          // NO class — dotted by CSS

  const fold = m2mk('button', 'm2fold', headl);
  fold.type = 'button';
  fold.setAttribute('aria-expanded', 'true');
  m2mk('i', 'm2chev', fold);                      // empty; a CSS triangle
  const kindEl = m2mk('span', 'm2kind', fold);
  kindEl.textContent = kind.toUpperCase();
  const modeLabel = m2mk('span', 'm2modelabel', fold);
  modeLabel.textContent = 'FULL';

  /* .m2headc is present on all three kinds. */
  const headc = m2mk('div', 'm2headc', head);
  const lfoWave = kind === 'lfo' ? m2mk('span', 'm2lfowave', headc) : null;
  if (lfoWave) lfoWave.textContent = 'SINE';
  const envStage = kind === 'env' ? m2mk('span', 'm2envstage', headc) : null;
  if (envStage) envStage.textContent = 'IDLE';
  const audioState = kind === 'audio' ? m2mk('span', 'm2audioheadstate', headc) : null;
  if (audioState) audioState.textContent = 'OFF';

  const bank = m2mk('button', 'm2bank', headc);
  bank.type = 'button';
  const bankA = m2mk('span', 'm2ba', bank); bankA.textContent = 'A';
  m2mk('span', 'm2bslash', bank).textContent = '/';
  const bankB = m2mk('span', 'm2bb', bank); bankB.textContent = 'B';

  const cpy = m2mk('button', 'm2ab', headc);
  cpy.type = 'button'; cpy.textContent = 'COPY';
  const pst = m2mk('button', 'm2ab', headc);
  pst.type = 'button'; pst.textContent = 'PASTE';

  /* back into .m2headl: the macro numeral, the vertical bay, the status line */
  const minNum = m2mk('button', 'm2minnum', headl);
  minNum.type = 'button';

  const minBay = m2mk('div', 'm2minbay', headl);
  const meter = m2mk('div', 'm2meter', minBay);
  meter.setAttribute('aria-hidden', 'true');
  const meterFill = m2mk('i', 'm2meterfill', meter);
  const envMinProg = kind === 'env' ? m2mk('div', 'm2envminprog', minBay) : null;
  const envMinProgFill = envMinProg ? m2mk('i', null, envMinProg) : null;
  const minName = m2mk('span', 'm2minname', minBay);   // the ROTATED label
  minName.setAttribute('aria-hidden', 'true');
  let minWave = null, minWavePath = null, minLeds = null;
  if (kind === 'lfo') {
    minWave = m2svg('svg', 'm2lfominshape', minBay,
      { viewBox: '0 0 100 100', preserveAspectRatio: 'none' });
    minWavePath = m2svg('path', null, minWave);   // NO class
  }
  if (kind === 'audio') {
    const lc = m2mk('div', 'm2audminleds', minBay);
    lc.setAttribute('aria-hidden', 'true');
    minLeds = {};
    for (const k of copy.audioOuts) {
      minLeds[k] = m2mk('i', null, lc);
      minLeds[k].dataset.out = k;
    }
  }
  const minOut = m2mk('span', 'm2minstatus ' +
    (kind === 'lfo' ? 'm2lfominout' : kind === 'env' ? 'm2envminout' : 'm2audminout'), headl);

  const headr = m2mk('div', 'm2headr', head);
  const mvL = m2mk('button', 'm2move', headr);
  mvL.type = 'button'; mvL.textContent = '◂';
  const mvR = m2mk('button', 'm2move', headr);
  mvR.type = 'button'; mvR.textContent = '▸';
  let trig = null;
  if (kind === 'env') {
    trig = m2mk('button', 'm2trig', headr);
    trig.type = 'button'; trig.textContent = 'TRIG';
  }
  const pow = m2mk('button', 'm2pow', headr);
  pow.type = 'button';
  pow.setAttribute('aria-pressed', 'true');
  powIcon(pow);
  const x = m2mk('button', 'm2x', headr);
  x.type = 'button';
  setGlyph(x, 'close', { size: 14 });

  /* ── THE BODY: col, then the editor, then rt ──────────────────────────── */
  const body = m2mk('div', 'm2body', root);
  const col = m2mk('div', 'm2col', body);
  const colhead = m2mk('div', 'm2colhead', col);
  colhead.textContent = copy.colHead[kind];

  const presets = {};
  const zoom = [];
  let aud = null;
  if (kind === 'lfo') {
    const grid = m2mk('div', 'm2presets', col);
    for (const [name, label] of copy.lfoPresets) {
      const b = m2mk('button', 'm2preset', grid);
      b.type = 'button';
      b.dataset.preset = name;
      const s = m2svg('svg', null, b, { viewBox: '0 0 40 26', preserveAspectRatio: 'none' });
      /* the `d` is SAMPLED FROM THE PRESET ITSELF by the host's curve maths,
         so the button can never draw a shape the engine would not produce. */
      const p = m2svg('path', 'm2gl', s, { d: '' });
      b.setAttribute('aria-label', label);
      presets[name] = { btn: b, path: p };
    }
  } else if (kind === 'audio') {
    const wrap = m2mk('div', 'm2aud', col);
    const srcBtn = m2mk('button', 'm2audsrc', wrap);
    srcBtn.type = 'button'; srcBtn.textContent = 'AUDIO IN';
    srcBtn.setAttribute('aria-pressed', 'false');
    /* its OWN class, not .m2audout: the five routable outputs are counted by
       a gate, and a LIVE lamp in that count is a sixth output that does not
       exist. */
    const live = m2mk('div', 'm2audlive', wrap);
    const liveLed = m2mk('i', 'm2audled', live);
    const liveTxt = m2mk('span', null, live);     // NO class
    liveTxt.textContent = 'OFF';
    const setBtn = m2mk('button', 'm2audsrc', wrap);
    setBtn.type = 'button'; setBtn.textContent = 'SET';
    const note = m2mk('div', 'm2audnote', col);
    note.textContent = 'OFF';
    aud = { srcBtn, setBtn, live, liveLed, liveTxt, note, outs: {}, meter: null, sheet: null };
  } else {
    /* FIT is spelled out because a magnifier glyph reads as zoom. */
    for (const glyph of copy.zoom) {
      const b = m2mk('button', 'm2zoom m2seat44' + (glyph === 'FIT' ? ' m2fit' : ''), col);
      b.type = 'button';
      b.textContent = glyph;
      zoom.push(b);
    }
  }

  /* AUDIO has no .m2macbox and no .m2capbox at all. */
  let macbox = null, mac = null, bus = null, capbox = null;
  if (kind !== 'audio') {
    macbox = m2mk('div', 'm2macbox', col);
    mac = m2mk('button', 'm2mac', macbox);
    mac.type = 'button'; mac.textContent = '--'; mac.title = 'MACRO';
    capbox = m2mk('div', 'm2capbox', col);
    /* the captions "OUT" and "TRIG IN" are pseudo-elements on .m2mac; these
       two divs are the SEPARATE caption row .m2capbox carries. */
    const macCap = m2mk('div', 'm2maccap m2capgone', capbox);
    macCap.textContent = 'MACRO';
    macCap.setAttribute('aria-hidden', 'true');
    if (kind === 'env') {
      bus = m2mk('button', 'm2mac m2bus', macbox);
      bus.type = 'button'; bus.textContent = '--'; bus.title = 'TRIG';
      const busCap = m2mk('div', 'm2maccap', capbox);
      busCap.textContent = 'TRIG';
    }
  }

  /* ── the CENTRE: the editor, appended AFTER .m2col ────────────────────── */
  const ed = buildEditor(null, body, kind);

  /* ── the RIGHT column ─────────────────────────────────────────────────── */
  const rt = m2mk('div', 'm2rt', body);
  const checks = {}, sw = {};
  let flipBtn = null;
  if (kind === 'lfo') {
    const swBox = m2mk('div', 'm2sw', rt);
    sw.trig = m2mk('button', 'm2swb m2seat44', swBox);
    sw.trig.type = 'button'; sw.trig.textContent = 'TRIG';
    sw.trig.setAttribute('aria-pressed', 'false');
    flipBtn = m2mk('button', 'm2flipb m2seat44', swBox);
    flipBtn.type = 'button'; flipBtn.textContent = 'FLIP';
    sw.off = m2mk('button', 'm2swb m2seat44', swBox);
    sw.off.type = 'button'; sw.off.textContent = 'OFF';
    sw.off.setAttribute('aria-pressed', 'false');
    const cks = m2mk('div', 'm2chks', rt);
    for (const [key, label] of copy.lfoChecks) checks[key] = mkCheck(cks, label);
  } else if (kind === 'audio') {
    const outs = m2mk('div', 'm2chks', rt);
    for (const k of copy.audioOuts) {
      const rowEl = m2mk('div', 'm2audout', outs);
      rowEl.dataset.out = k;
      const grip = m2mk('button', 'm2audgrip', rowEl);
      grip.type = 'button';
      const led = m2mk('i', 'm2audled', grip);    // created BEFORE the svg
      gripIcon(grip);
      const boxBtn = m2mk('button', 'm2audmac', rowEl);
      boxBtn.type = 'button';
      boxBtn.dataset.child = '';
      const nm = m2mk('span', 'm2audname', boxBtn);
      nm.textContent = k.toUpperCase();
      const slot = m2mk('span', 'm2audslot', boxBtn);
      slot.textContent = '--';
      aud.outs[k] = { row: rowEl, grip, led, box: boxBtn, name: nm, slot };
    }
  } else {
    const cks = m2mk('div', 'm2chks', rt);
    for (const [key, label] of copy.envChecks) checks[key] = mkCheck(cks, label);
  }

  /* ── THE KNOB ROW — a DIRECT CHILD OF THE ROOT, sibling of .m2head and
        .m2body, not inside .m2body. ───────────────────────────────────── */
  const kr = m2mk('div', 'm2knobs', root);
  const knobs = {};
  for (const [key, cap, lo, hi] of copy.knobs[kind]) {
    knobs[key] = mkKnob(kr, { knob: key, cap, lo, hi, id: src.id + '#' + key },
      (typeof src.knobArc === 'function' ? src.knobArc : null));
  }

  /* ── the Compact LFO performance bank, ALWAYS in the DOM ──────────────── */
  let compactLfo = null;
  if (kind === 'lfo') {
    const zone = m2mk('div', 'm2lfocmpzone', root);
    const shape = m2mk('button', 'm2lfocmpcmd m2lfocmpshape', zone);
    shape.type = 'button';
    const shapeCap = m2mk('span', 'm2lfocmpcap', shape); shapeCap.textContent = 'WAVE';
    const shapeSvg = m2svg('svg', null, shape,
      { viewBox: '0 0 52 14', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const shapePath = m2svg('path', null, shapeSvg, {});
    const shapeValue = m2mk('span', 'm2lfocmpvalue', shape); shapeValue.textContent = 'SINE';

    const macroBtn = m2mk('button', 'm2lfocmpcmd m2lfocmpmacro', zone);
    macroBtn.type = 'button';
    m2mk('span', 'm2lfocmpcap', macroBtn).textContent = 'OUT';
    const macroValue = m2mk('span', 'm2lfocmpvalue', macroBtn); macroValue.textContent = '--';

    const toggles = {};
    for (const [key, label] of copy.lfoCmpToggles) {
      const b = m2mk('button', 'm2lfocmpcmd m2lfocmptoggle', zone);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      m2mk('span', 'm2lfocmplabel', b).textContent = label;
      toggles[key] = b;
    }
    const copyCmd = m2mk('button', 'm2lfocmpcmd m2lfocmpclip', zone);
    copyCmd.type = 'button'; copyCmd.textContent = 'COPY';
    const pasteCmd = m2mk('button', 'm2lfocmpcmd m2lfocmpclip', zone);
    pasteCmd.type = 'button'; pasteCmd.textContent = 'PASTE';
    compactLfo = {
      root: zone, shape, shapeCap, shapeSvg, shapePath, shapeValue,
      macro: macroBtn, macroValue, toggles, copy: copyCmd, paste: pasteCmd
    };
  }

  if (kind === 'audio') aud.meter = buildAudioMeter(ed);

  const dev = {
    id: src.id, kind, root, swapBadge,
    head, headl, headc, headr, grab, fold, chev: fold.firstChild,
    kindEl, modeLabel, minNum, minBay, meter, meterFill, minName, minOut,
    envMinProg, envMinProgFill, minWave, minWavePath, minLeds,
    lfoWave, envStage, audioState, bank: { btn: bank, A: bankA, B: bankB },
    cpy, pst, mvL, mvR, trig, pow, x,
    body, col, colhead, presets, zoom, macbox, mac, bus, capbox,
    rt, sw, flipBtn, checks, knobs, compactLfo, aud, ed,
    status: ed.status
  };
  root.modwindowDevice = dev;
  setDeviceMode(dev, 'F');
  return dev;
}

/** anim.js:6651 m2syncDevicePresentation.  'F' | 'C' | 'M'. */
export function setDeviceMode(dev, mode, anatomy) {
  const d = dev && dev.root ? dev : (dev && dev.modwindowDevice) || null;
  if (!d || !d.root) return 'F';
  const want = mode === 'M' ? 'M' : (mode === 'C' ? 'C' : 'F');
  const an = anatomy === undefined ? (want === 'M' ? 'F' : want) : anatomy;
  d.root.dataset.mode = want === 'M' ? 'minimized' : (want === 'C' ? 'compact' : 'full');
  d.root.dataset.anatomy = an === 'C' ? 'compact' : 'full';
  d.root.classList.toggle('m2cmp', want === 'C');
  d.root.classList.toggle('m2min', want === 'M');
  if (d.modeLabel) d.modeLabel.textContent = an === 'C' ? 'CMP' : 'FULL';
  return want;
}

/** anim.js:7904 m2audioBuildSheet.  A direct child of the device root.
 *  ⚠ THE LEGEND DIVS ARE APPENDED TO THE SHEET ROOT, NOT TO THEIR ROW, so
 *  rows and legends interleave as siblings.  That is the source's shape. */
export function buildAudioSheet(dev, copyIn) {
  const copy = Object.assign({}, COPY, copyIn || {});
  const root = m2mk('div', 'm2audsheet', dev.root);
  root.hidden = true;
  const head = m2mk('div', 'm2audshead', root);
  head.textContent = 'CONDITIONING';              // set FIRST; children after
  const input = m2mk('select', 'm2audinput', head);
  input.setAttribute('aria-label', 'Audio input device');
  const opt = document.createElement('option');
  opt.value = '';
  opt.textContent = 'SYSTEM DEFAULT';
  input.appendChild(opt);
  const x = m2mk('button', 'm2audsx', head);
  x.type = 'button';
  x.textContent = '×';
  x.setAttribute('aria-label', 'Close the conditioning sheet');
  const rows = {};
  for (const [key, label] of copy.audioSheetRows) {
    const row = m2mk('div', 'm2audsrow', root);
    const lab = m2mk('div', 'm2audslab', row);
    lab.textContent = label;
    const dn = m2mk('button', 'm2audsbtn', row);
    dn.type = 'button'; dn.textContent = '−';
    dn.setAttribute('aria-label', 'Lower ' + label);
    const val = m2mk('div', 'm2audsval', row);
    const up = m2mk('button', 'm2audsbtn', row);
    up.type = 'button'; up.textContent = '+';
    up.setAttribute('aria-label', 'Raise ' + label);
    const leg = m2mk('div', 'm2audsleg', root);   // ← the sheet root, not `row`
    rows[key] = { row, lab, dn, val, up, leg };
  }
  if (dev.aud) dev.aud.sheet = { root, rows, input };
  return { root, rows, input, close: x };
}

/* ══════════════════════════════════════════════════════════════════════════
   THE ROUTING OVERLAYS — anim.js:5011 / 5041 / 5065 / 5114 / 4932

   THESE ATTACH TO THE ROUTED CONTROL, WHICH MAY BE THE HOST'S OWN, ANYWHERE
   IN THE DOCUMENT.  Their rules in modwindow.css are the one part of the
   sheet that is deliberately NOT scoped, for exactly this reason.
   ══════════════════════════════════════════════════════════════════════════ */

/** anim.js:5011 m2ringGeom — R 10, C 13, SWEEP 300. */
export const ringGeom = {
  R: 10, C: 13, SWEEP: 300,
  ang(v) { return (-240 + 300 * Math.min(1, Math.max(0, v))) * Math.PI / 180; },
  pt(v) { const a = this.ang(v); return [this.C + this.R * Math.cos(a), this.C + this.R * Math.sin(a)]; },
  track() {
    const a = this.pt(0), b = this.pt(1);
    return 'M' + a + 'A10 10 0 1 1 ' + b;
  },
  arc(lo, hi) {
    const [x1, y1] = this.pt(lo), [x2, y2] = this.pt(hi);
    if (hi - lo < 1e-6) return 'M' + x1 + ' ' + y1 + 'L' + x1 + ' ' + y1;
    return 'M' + x1 + ' ' + y1 + 'A10 10 0 ' + ((hi - lo) * 300 > 180 ? 1 : 0) +
      ' 1 ' + x2 + ' ' + y2;
  }
};

/** anim.js:5065.  Appended INTO the target control element. */
export function buildRing(hostEl, o) {
  const root = m2mk('div', 'm2ring', hostEl);
  if (o && o.routeId !== undefined) root.dataset.route = String(o.routeId);
  if (o && o.targetId !== undefined) root.dataset.target = String(o.targetId);
  root.dataset.polarity = (o && o.polarity) || 'positive';
  const s = m2svg('svg', null, root, { viewBox: '0 0 26 26' });   // NO class
  const trk = m2svg('path', 'm2ringtrk', s, { d: ringGeom.track() });
  const arc = m2svg('path', 'm2ringarc', s, { d: ringGeom.arc(0, 0) });
  const dot = m2svg('circle', 'm2ringdot', s, { r: 2 });
  const n = m2mk('span', 'm2ringn', root);
  const num = m2mk('div', 'm2ringnum', root);
  num.setAttribute('aria-hidden', 'true');
  const hi = m2mk('span', 'm2rnhi', num);
  const lo = m2mk('span', 'm2rnlo', num);
  return { root, svg: s, trk, arc, dot, n, num, hi, lo };
}

/** anim.js:5041 m2buildSpan.  `shape` is 'round' when the host carries
 *  .ctl-round, else 'vert' when rect.height >= rect.width, else 'horz'. */
export function buildSpan(hostEl, shape) {
  const root = m2mk('div', 'm2span ' + shape, hostEl);
  root.setAttribute('aria-hidden', 'true');
  hostEl.classList.add('m2spanned');
  if (shape === 'round') {
    const s = m2svg('svg', null, root, { viewBox: '0 0 100 100' });   // NO class
    return {
      shape, root, arc: m2svg('path', 'm2spanarc', s),
      base: m2svg('path', 'm2spanbase', s), live: m2svg('path', 'm2spanlive', s),
      cap: null, liveCap: null
    };
  }
  /* the two caps are SIBLINGS of the band, children of the host. */
  const cap = m2mk('i', 'm2spancap ' + shape, hostEl);
  cap.setAttribute('aria-hidden', 'true');
  const liveCap = m2mk('i', 'm2spanlivecap ' + shape, hostEl);
  liveCap.setAttribute('aria-hidden', 'true');
  return { shape, root, cap, liveCap, arc: null, base: null, live: null };
}

/** anim.js:5114 m2ensureClear. */
export function buildClear(hostEl, targetId) {
  const b = m2mk('button', 'm2clr', hostEl);
  b.type = 'button';
  b.dataset.target = String(targetId);
  setGlyph(b, 'clear', { size: 16 });
  return b;
}

/** anim.js:4932.  Appended to document.body, outside every window. */
export function buildGhost(text) {
  const g = m2mk('div', 'm2ghost', document.body);
  g.textContent = String(text === undefined ? 'MACRO' : text).slice(0, 12);
  return g;
}

/* ══════════════════════════════════════════════════════════════════════════
   THE SHEETS — anim.js:3949 / 3982 / the preset list / the dead inspector
   All four are appended to the WINDOW ROOT (panelWin.root), not to the panel.
   ══════════════════════════════════════════════════════════════════════════ */


export function buildDevicePick(windowRoot, copyIn) {
  const copy = Object.assign({}, COPY, copyIn || {});
  const root = m2mk('div', 'm2pick', windowRoot);
  const btns = {};
  for (const [kind, label] of copy.devicePick) {
    const b = m2mk('button', 'm2pickb', root);
    b.type = 'button';
    b.textContent = label;
    btns[kind] = b;
  }
  root.hidden = true;          // born closed, so the first tap SHOWS
  return { root, btns };
}

/** anim.js:3949. */
export function buildMacroPick(windowRoot, copyIn) {
  const copy = Object.assign({}, COPY, copyIn || {});
  const root = m2mk('div', 'm2pick m2mpick', windowRoot);
  const btns = {};
  for (const [kind, label] of copy.macroPick) {
    const b = m2mk('button', 'm2pickb', root);
    b.type = 'button';
    b.textContent = label;
    btns[kind] = b;
  }
  root.hidden = true;
  return { root, btns };
}

/** The preset list.  `.m2ppick glass` — it takes the app's glass rather than
 *  --m2-plate, which is why it does NOT have the .m2pick defect. */
export function buildPresetSheet(windowRoot, copyIn) {
  const copy = Object.assign({}, COPY, copyIn || {});
  const root = m2mk('div', 'm2ppick glass', windowRoot);
  root.setAttribute('role', 'listbox');
  root.setAttribute('aria-label', copy.presetSheetLabel.replace('{factory}', copy.factory));
  root.hidden = true;
  return { root, group: (name, shut, on) => buildPresetGroup(root, name, shut, on) };
}

function buildPresetGroup(sheet, name, shut, on) {
  const grp = m2mk('div', 'm2pgrp', sheet);
  grp.setAttribute('role', 'group');
  grp.setAttribute('aria-label', name);
  grp.dataset.folder = name;
  const fold = m2mk('button', 'm2pfold' + (shut ? ' m2shut' : '') + (on ? ' on' : ''), grp);
  fold.type = 'button';
  fold.dataset.folder = name;
  fold.setAttribute('aria-expanded', shut ? 'false' : 'true');
  const caret = m2mk('span', 'm2pcaret', fold);
  caret.setAttribute('aria-hidden', 'true');
  setGlyph(caret, 'chevronDown', { size: 13 });
  const foldName = m2mk('span', 'm2pfoldname', fold);
  foldName.textContent = name;
  const tag = m2mk('span', 'm2prowtag', fold);
  return {
    root: grp, fold, foldName, tag,
    /* one .m2prowwrap per preset, unless the folder is shut.  The delete
       button is a SIBLING of the load button, never nested. */
    row: (preset, opts) => {
      const o = opts || {};
      const wrap = m2mk('div', 'm2prowwrap', grp);
      const b = m2mk('button', 'm2pickb m2prow' + (o.factory ? ' m2fac' : '') +
        (o.on ? ' on' : '') + (o.stale ? ' m2stale' : ''), wrap);
      b.type = 'button';
      b.dataset.preset = preset;
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', o.on ? 'true' : 'false');
      const nm = m2mk('span', 'm2prowname', b);
      nm.textContent = preset;
      const rtag = m2mk('span', 'm2prowtag', b);
      rtag.textContent = o.factory ? 'FACTORY' : (o.stale ? 'OLDER MODEL' : '');
      if (o.factory) return { wrap, btn: b, name: nm, tag: rtag, del: null };
      const del = m2mk('button', 'm2prowdel', wrap);
      del.type = 'button';
      setGlyph(del, 'clear', { size: 15 });
      return { wrap, btn: b, name: nm, tag: rtag, del };
    }
  };
}

/** The dead-send inspector. */
export function buildDeadInspector(windowRoot) {
  const root = m2mk('div', 'm2deadpick glass', windowRoot);
  root.id = IDS.deadInspector;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Dead-send inspector');
  root.hidden = true;
  root.dataset.side = 'below';
  const head = m2mk('div', 'm2deadhead', root);
  const title = m2mk('span', null, head);         // NO class
  const close = m2mk('button', 'm2deadclose', head);
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close dead-send inspector');
  const list = m2mk('div', 'm2deadlist', root);
  list.setAttribute('role', 'list');
  return {
    root, head, title, close, list,
    row: (o) => {
      const r = m2mk('div', 'm2deadrow', list);
      r.setAttribute('role', 'listitem');
      if (o.routeId !== undefined) r.dataset.routeId = String(o.routeId);
      if (o.macroId !== undefined) r.dataset.macroId = String(o.macroId);
      if (o.sourceId !== undefined) r.dataset.sourceId = String(o.sourceId);
      if (o.targetId !== undefined) r.dataset.targetId = String(o.targetId);
      r.dataset.reason = o.reason || 'target-unavailable';
      const route = m2mk('div', 'm2deadroute', r);
      const source = m2mk('span', 'm2deadsource', route);
      route.appendChild(document.createTextNode(' → '));   // a REAL text node
      const target = m2mk('span', 'm2deadtarget', route);
      const meta = m2mk('div', 'm2deadmeta', r);
      const why = m2mk('span', 'm2deadwhy', meta);
      const trail = document.createTextNode('');                // a REAL text node
      meta.appendChild(trail);
      const remove = m2mk('button', 'm2deadremove', r);
      remove.type = 'button';
      if (o.routeId !== undefined) remove.dataset.routeId = String(o.routeId);
      remove.textContent = 'REMOVE';
      return { root: r, source, target, why, trail, remove };
    }
  };
}

export default createModWindow;
