/* lab/light-window.js — 037 L · THE LIGHTING WINDOW (Josh, 037 BRIEF "CONTROLLABLE CAMERA LIGHT": "I see that light shine/shadow in solid and ESP;
 * let me edit/modulate it!"; CALLS 8: "powerful like Blender's or Houdini's … an experienced user can recognize them … no scrolling … don't make the
 * window too tall").  A three-point rig an artist recognises, on the old light by default: the KEY (the SUN pad — the view's sphere of directions
 * seen from the front, azimuth around, elevation by radius: the centre faces the eye, the dashed ring is the horizon, the rim is straight behind
 * — its intensity KEY, its colour HUE · TINT and RADIUS, the lamp's size), FRAME (CAMERA: a headlight that turns with the eye, as PyMOL's and VMD's;
 * WORLD: a lamp fixed to the object), AMBIENT · SPECULAR · SHINE · RIM, and behind MORE the FILL (intensity and its own direction) and the SPOT
 * (CONE, BLEND).  RESET returns every home.  A direction is two degrees of freedom (azimuth, elevation): a quaternion's third, roll about the
 * light's own axis, does nothing to a light, so there are no "quaternion knobs".
 * THE RECORD is `mat.light`, written only by a hand and only with the values off their homes (field.js LIGHT_HOME; absent = the old light: THE
 * LEGACY GATE in the shader stays shut and every lit line runs its old text).  It rides the project inside `presentation.mat` and the history
 * with the look; never in NEW.  In lab/, not windows/: rack-deps admits only rack.js's planned modules there (informational.js' precedent). */
import { el, knob, seg, trig, chip } from './mir/kit.js'; import { xyPad } from './mir/controls/xy.js'; import { glyphEl } from './mir/glyph.js'; import { fold } from './fold.js'; import { summon } from './summon.js';
import { TIER } from './tier.js'; import { LIGHT_HOME as HOME, lightRgb, cameraBasis } from './field.js';
const RAD = Math.PI / 180, deg = (v) => v.toFixed(0) + '°', two = (v) => v.toFixed(2);
/** every dial: key → [label, min, max, fmt, hint, log, wrap]; the modulation targets (L3) take these ranges, so a route never disagrees with its dial */
const DIALS = {
  key: ['KEY', 0, 3, two, 'KEY · the main light’s strength (1 = the old light)'],
  softness: ['RADIUS', 0, 1, two, 'RADIUS · the lamp’s size: softer edge, wider shine'],
  hue: ['HUE', 0, 1, (v) => deg(v * 360), 'HUE · the key light’s colour (with TINT)', false, true],
  tint: ['TINT', 0, 1, two, 'TINT · how coloured the key light is (0 = white)'],
  ambient: ['AMBIENT', 0, 1, two, 'AMBIENT · light from everywhere: the shadow’s floor'],
  specular: ['SPECULAR', 0, 1, two, 'SPECULAR · the highlight (surfaces begin above 0.32)'],
  shine: ['SHINE', 2, 256, (v) => v.toFixed(0), 'SHINE · the highlight’s tightness (Phong power)', true],
  rim: ['RIM', 0, 1, two, 'RIM · a glow along the silhouette’s grazing edges'],
  fill: ['FILL', 0, 2, two, 'FILL · a second light, no colour, no highlight'],
  fillAz: ['FILL AZ', -180, 180, deg, 'FILL AZ · the fill light’s azimuth', false, true],
  fillEl: ['FILL EL', -90, 90, deg, 'FILL EL · the fill light’s elevation'],
  cone: ['CONE', 10, 180, (v) => (v >= 180 ? 'OFF' : deg(v)), 'CONE · the key as a spotlight (180° = no spot)'],
  blend: ['BLEND', 0, 1, two, 'BLEND · the spot’s soft edge'],
};
/** THE TARGETS (L3): `light.<key>`, the dials' own ranges; AZ and EL are the SUN pad's (no dial: a route moves the sun) */
const TARGETS = [['az', 'LIGHT AZ', 'wrap', -180, 180], ['el', 'LIGHT EL', 'linear', -90, 90], ...['key', 'ambient', 'specular', 'shine', 'rim', 'hue', 'tint', 'fill', 'cone', 'softness']
  .map((k) => [k, 'LIGHT ' + DIALS[k][0], DIALS[k][6] ? 'wrap' : DIALS[k][5] ? 'log' : 'linear', DIALS[k][1], DIALS[k][2]])];
export const LIGHT_KEYS = Object.freeze(TARGETS.map((t) => t[0]));   // persist.js modSeats: each target's base sits at presentation.mat.light[key]
export function lightDefs(app) {
  const { ui, mat } = app;
  return TARGETS.map(([k, label, map, min, max]) => ({ id: 'light.' + k, label, map, min, max, def: HOME[k], group: 'light',
    knob: () => (ui.light && ui.light.knobs[k]) || null, get: () => valOf(mat.light, k), set: (v) => { if (ui.light) ui.light.put(k, v); } }));
}
/** 037 L4 · THE SUMMONS: LIGHTING opens directly below CAMERA with THE MITOSIS (chain T's lab/summon.js; from the FINDER it opens as any card) */
export function summonLight(app) { summon(app.sh.rk, 'camera', 'light'); }
const valOf = (L, k) => (L && (k === 'frame' ? L.frame === 'world' : Number.isFinite(L[k])) ? L[k] : HOME[k]);
/** a direction in the frame (degrees) ↔ the unit vector (x right, y up, z toward the eye) ↔ the SUN pad's point (centre = toward the eye, r ½ = the horizon) */
const vecOf = (az, el) => [Math.cos(el * RAD) * Math.cos(az * RAD), Math.cos(el * RAD) * Math.sin(az * RAD), Math.sin(el * RAD)];
const angOf = (d) => [Math.atan2(d[1], d[0]) / RAD, Math.asin(Math.max(-1, Math.min(1, d[2]))) / RAD];
const padOf = (az, el) => { const r = (90 - el) / 180; return [r * Math.cos(az * RAD), r * Math.sin(az * RAD)]; };

export function createLight(app) {
  const { ui, device, mat, obs } = app, { schedule } = app.loop, { modHand, setKnob } = app.ctl;
  const w = device({ id: 'light', eyebrow: 'LIGHTING', title: 'the key, the fill, the rim', status: '' });
  w.root.classList.add('native-clean', 'closed', 'lw-light'); app.host.rack.appendChild(w.root);
  const knobs = {}, cur = (k) => valOf(mat.light, k);
  /** the one write: the record keeps only what is off its home, and goes when nothing is.  038 K6: a FRESH record every write, never an edit in place —
   *  the record may be an object a history row also holds, and a dial moved after an undo must not rewrite that row */
  function write(k, v) {
    const L = { ...mat.light };
    if (v === HOME[k]) delete L[k]; else L[k] = v;
    if (Object.keys(L).length) mat.light = L; else delete mat.light;
    if (k === 'az' || k === 'el' || k === 'hue' || k === 'tint') paintSun();
    schedule(TIER.PRESENT);
  }
  const hand = (k, v) => { if (!modHand('light.' + k, v)) write(k, v); };
  const dial = (k) => { const [label, min, max, fmt, title, log, wrap] = DIALS[k];
    return (knobs[k] = knob({ label, min, max, value: HOME[k], log: !!log, wrap: !!wrap, fmt, title, onInput: (v) => hand(k, v) })); };

  /* ── the verbs: FRAME · RESET · MORE's chevron ── */
  const verbs = el('div', 'row tight fit lw-light-verbs', w.body);
  const frameSeg = seg({ aria: 'the light’s frame', value: HOME.frame, cls: 'lw-light-frame', options: [
    { id: 'camera', label: 'CAMERA', title: 'A headlight: the light turns with your eye' },
    { id: 'world', label: 'WORLD', title: 'A lamp fixed to the object as you orbit' }], onChange: (f) => reframe(f) });
  verbs.appendChild(frameSeg.root);
  verbs.appendChild(chip(trig({ label: 'RESET', cls: 'lw-light-reset', title: 'RESET · every light value home: the old light', onFire: reset }).root, 'reload', 'RESET'));   // 038 K2: the reload glyph, as PALETTE's RELOAD

  /* ── the KEY: the SUN pad (the kit's XY pad dressed as a disc, its lattice swelling under the sun) and its dials ── */
  const top = el('div', 'lw-light-key', w.body), hp = padOf(HOME.az, HOME.el);
  const sun = xyPad({ aria: 'the key light’s direction', cls: 'lw-sun', home: hp, wrap: 'sphere', onInput: fromPad, onChange: fromPad,   // 038 K3: MIR 1.5.7-alpha.13 THE PAD WRAPS
    x: { label: 'ACROSS', min: -1, max: 1, value: hp[0] }, y: { label: 'UP', min: -1, max: 1, value: hp[1] } });
  top.appendChild(sun.root);
  sun.pad.querySelector('.xy-lattice').insertAdjacentHTML('afterend', '<svg class="lw-sun-rings" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="49"/><circle class="lw-sun-horizon" cx="50" cy="50" r="25"/></svg>');
  const mark = sun.pad.querySelector('.xy-dot'); mark.append(glyphEl('sun', 'gly', 20));
  const side = el('div', 'lw-light-side', top);
  for (const k of ['key', 'softness', 'hue', 'tint']) side.appendChild(dial(k).root);
  function fromPad(u, v) {
    let r = Math.hypot(u, v);
    if (r > 1) { u /= r; v /= r; r = 1; sun.set(u, v); }                  // the rim is straight behind: a drag past it comes round the far side (the pad's 'sphere' wrap); the two hidden knobs may still ask r > 1, and slide onto it
    const home = Math.abs(u - hp[0]) < 1e-9 && Math.abs(v - hp[1]) < 1e-9;   // Home or a double-tap: the old light's numbers exactly
    hand('az', home ? HOME.az : r < 1e-6 ? cur('az') : Math.atan2(v, u) / RAD); hand('el', home ? HOME.el : 90 - 180 * r);
  }
  function paintSun() {
    const az = cur('az'), el = cur('el'), [u, v] = padOf(az, el), t = cur('tint'), c = lightRgb(cur('hue'), t);
    if (Math.abs(sun.x.get() - u) > 1e-9 || Math.abs(sun.y.get() - v) > 1e-9) sun.set(u, v);
    sun.pad.classList.toggle('behind', el < 0);
    sun.pad.style.setProperty('--lw-sun', t > 0 ? 'rgb(' + c.map((x) => Math.round(x * 255)).join(' ') + ')' : '');
    sun.pad.setAttribute('aria-valuetext', 'azimuth ' + deg(az) + ', elevation ' + deg(el));
  }

  /* ── the surface: AMBIENT · SPECULAR · SHINE · RIM ── */
  const surf = el('div', 'row tight fit lw-light-surf', w.body);
  for (const k of ['ambient', 'specular', 'shine', 'rim']) surf.appendChild(dial(k).root);

  /* ── MORE: the FILL and the SPOT, behind the verbs' chevron (lab/fold.js, CAMERA's pattern) ── */
  const more = el('div', 'lw-light-more', w.body);
  const fillRow = el('div', 'row tight fit', more), spotRow = el('div', 'row tight fit', more);
  for (const k of ['fill', 'fillAz', 'fillEl']) fillRow.appendChild(dial(k).root);
  for (const k of ['cone', 'blend']) spotRow.appendChild(dial(k).root);
  fold(verbs, more, { what: 'the fill and the spot', key: 'light-more' });
  el('div', 'note', w.body).innerHTML = '<b>Lighting.</b> Drag the sun: the centre faces you, the dashed ring is the horizon, the rim is straight behind, and a drag past the rim comes round the other side. CAMERA keeps the light on your eye as you orbit; WORLD leaves it on the object. RESET is the old light.';

  /* FRAME: the lights stay where they are as the frame changes (the eye's basis now), so the press changes what an orbit does, never the picture */
  function reframe(to) {
    if (cur('frame') === to) return;
    const B = cameraBasis(obs), turn = (az, el) => { const d = vecOf(az, el);
      return angOf(to === 'world' ? [0, 1, 2].map((i) => d[0] * B.right[i] + d[1] * B.up[i] + d[2] * B.dir[i]) : [B.right, B.up, B.dir].map((b) => d[0] * b[0] + d[1] * b[1] + d[2] * b[2])); };
    const [az, el] = turn(cur('az'), cur('el')), [fa, fe] = turn(cur('fillAz'), cur('fillEl'));
    write('frame', to); hand('az', az); hand('el', el); hand('fillAz', fa); hand('fillEl', fe); sync();
  }
  function reset() { for (const k of Object.keys(HOME)) if (k === 'frame') write(k, HOME.frame); else hand(k, HOME[k]); sync(); }
  /** the record → every control (a project, an undo, RESET) */
  function sync() { for (const k in knobs) knobs[k].set(cur(k)); frameSeg.set(cur('frame')); paintSun(); }
  /* the modulation's road (L3): a route's value written as a hand's would be, and its dial (or the sun) shown there */
  ui.light = { knobs, sync, put(k, v) { write(k, v); if (knobs[k]) setKnob(knobs[k], v); } };
  paintSun();
  return w;
}
