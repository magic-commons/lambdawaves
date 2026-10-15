/* lab/verbs.js — THE VERB TABLE + THE INVENTORY (0.6.6 G1, "Ask Gemma"): ONE table of HAND verbs (each the road a hand takes), run in order by a model's
 * list or a notebook `lw:` link as ONE history row a list; `inventory()` is only what the app already prints.  DOM-free at its top (tools/gemma imports VERBS
 * in node).  An arg spec: 'string' | 'number' | 'bool' (a '|' union) or 'enum a|b|c', '?' first when optional.  A row's run(app, a) returns nothing,
 * { own } (it announced itself), { fade } (THE FADE, said when no row of the list announced itself) or a string: the sentence it was refused with. */
import { PRESET_BY_ID } from './state.js'; import { MOLECULE_BY_ID } from './molecules.js'; import { VIEW, VIEW_NAMES } from './field.js'; import { BASIS } from './hydrogen.js';
import { orbitalName } from './names.js'; import { mdText, stateLatex, stemOf, BASIS_LABEL } from './latex-state.js'; import { statusOf } from './status.js';
import { aliasOf, FLASH_HZ } from './flash-law.js'; import { EQ_PRESETS } from './equalizer.js'; import { getHamiltonian } from './hamiltonian.js'; import { isField } from './mir/core/pointer.js';
/** an orbital by number (1…nAO) or by any of its names (HOMO, LUMO−1, 1b1) → its number; 0 for none (0.5.1 D8, from the notebook's link runner) */
const orbitalOf = (s, w) => { if (!s) return 0; if (/^\d+$/.test(w)) return +w >= 1 && +w <= s.nAO ? +w : 0;
  for (let k = 0; k < s.nAO; k++) if (orbitalName(s.names, k, s.nocc).replace(/ \(\w\)/, '').split(' · ').some((x) => x.toLowerCase() === w.toLowerCase().replace('-', '−'))) return k + 1;
  return 0; };
const orb = (c, w) => { const s = c.solution(), k = orbitalOf(s, String(w)); if (!k) return `there is no orbital "${w}" in this molecule`;
  c.setView('orbital'); c.orbital(k); return { fade: 'ORBITAL · ' + orbitalName(s.names, k - 1, s.nocc, 'latex') }; };
const flip = (s, on) => { if (s && s.get() !== on) s.root.click(); }; let sayBye = null;   // flip: a switch the hand's way, its click and its onChange; sayBye: the held `say`'s dismissal
export const VERBS = [
  { id: 'preset', args: { id: 'string' }, doc: "load one of STATE's PRESET hydrogen states by its id (1s+2pz, …), announced on the stage",
    run: (app, a) => (PRESET_BY_ID.has(a.id) ? { own: !!app.ctl.loadPreset(a.id, { hand: true }) } : `there is no preset "${a.id}"`) },
  { id: 'molecule', args: { id: 'string', basis: '?enum sto-3g|6-31+g-star', view: '?enum density|orbital|diff|esp', orbital: '?string|number' },
    doc: 'pick a library molecule by id (H2O, NH3, C6H6, …) and switch MOLECULES on; its head shows once solved; then the basis, the view and an orbital by number or name (HOMO, LUMO, 1b1)',
    async run(app, a) {
      const c = app.state.chem, id = [...MOLECULE_BY_ID.keys()].find((k) => k.toLowerCase() === a.id.toLowerCase()); if (!id) return `there is no molecule "${a.id}" in the library`;
      const p = c.pick(id); c.setOn(true); await p;
      if (a.basis && a.basis !== c.basis) await c.setBasis(a.basis); if (a.view) c.setView(a.view);   // after the pick's solve (and the basis's)
      const r = a.orbital === undefined ? null : orb(c, a.orbital); return typeof r === 'string' ? r : { own: true };
    } },
  { id: 'view', args: { id: 'enum density|phase|real|imag|diff|reim|orbital|esp', orbital: '?string|number' },
    doc: 'the observable on the field: under MOLECULES density|orbital|diff|esp (orbital by number or name), otherwise density|phase|real|imag|diff|reim',
    run(app, a) {
      const c = app.state.chem;
      if (c && c.on && ['density', 'orbital', 'diff', 'esp'].includes(a.id)) { if (a.orbital !== undefined) return orb(c, a.orbital); c.setView(a.id); }
      else if (VIEW[a.id] === undefined) return `${a.id} is a MOLECULES view and MOLECULES is off`; else app.sh.LW.setView(a.id);
      return { fade: 'VIEW · ' + mdText(a.id) };
    } },
  { id: 'window', args: { id: 'string', open: 'bool', side: '?enum L|R' }, doc: 'open or close a window by its id (spectrum, chem, orbitals, camera, settings, informational, render, …), onto the left (L) or right (R) rack',
    run(app, a) { const { rk, layout } = app.sh; if (!rk.windows().some((w) => w.id === a.id)) return `there is no window "${a.id}"`; if (a.open) layout.reopen(a.id, a.side); else rk.close(a.id); } },
  { id: 'camera', args: { yaw: '?number', pitch: '?number', zoom: '?number', fov: '?number', autoRotate: '?bool', home: '?bool' },
    doc: 'pose the camera: yaw and pitch in radians (pitch −1.52…1.52), zoom the distance (1.2 near … 8 far), fov 0.25…1.2; home first puts it back; each value is clamped',
    run(app, a) { const P = app.host.cameraPort; if (a.home) P.home();
      for (const k of ['yaw', 'pitch', 'zoom', 'fov']) if (a[k] !== undefined) { const r = P.ranges[k]; P.set(k, Math.min(r.max, Math.max(r.min, a[k]))); }
      if (a.autoRotate !== undefined) P.set('autoRotate', a.autoRotate); } },
  { id: 'rate', args: { value: 'number' }, doc: 'the transport RATE, atomic units of time a second (0.1 … 3000); refused when the beats would flash above 3 a second on screen',
    run(app, a) { const v = Math.min(3000, Math.max(0.1, a.value)), { stats, modHand } = app.ctl, w = aliasOf(app.w.periodEnergies(), v, stats.fps >= 10 ? Math.round(stats.fps) : 60);
      if (w && w.alias > FLASH_HZ) return `RATE ${v} would flash: a beat of ${w.hz.toFixed(1)} Hz shows at ${w.alias.toFixed(1)} Hz on screen, above ${FLASH_HZ} a second`;
      app.ui.rateKnob.set(v); if (!modHand('transport.rate', v)) app.clock.setRate(v); } },
  { id: 'play', args: { on: 'bool' }, doc: 'play (true) or pause (false) the one clock', run(app, a) { if (a.on) app.sh.LW.play(); else app.sh.LW.pause(); } },
  { id: 'scrub', args: { t: 'number' }, doc: 'move the clock to time t (atomic units)', run(app, a) { app.sh.LW.scrub(a.t); } },
  { id: 'switch', args: { id: 'enum locate|particles|formula|labels|equalizer', on: 'bool|string' },
    doc: "a hand switch on or off: VORTEX's LOCATE, PARTICLES, STAGE FORMULA, ATOM LABELS; equalizer takes a preset name instead (FLAT, GAUSSIAN JITTER, COMB, BEATS ONLY, …)",
    run(app, a) { const { ui } = app;
      if (a.id === 'equalizer') { const p = EQ_PRESETS.find((q) => [q.id, q.label].includes(String(a.on).toLowerCase()) || q.label === String(a.on).toUpperCase()); if (!p) return `there is no equalizer preset "${a.on}"`; ui.eqPick(p.id); return; }
      if (typeof a.on !== 'boolean') return `${a.id} takes on: true or false`;
      flip({ locate: ui.vorOn && { get: () => app.w.vortex.on, root: ui.vorOn }, particles: ui.pOn, formula: ui.molFormulaSw, labels: ui.atomLabelsSw }[a.id], a.on); } },
  { id: 'say', args: { md: 'string' }, doc: 'write one short markdown paragraph on the stage ($…$ maths allowed), held until Escape or the next say',
    run(app, a) { const T = app.state.stageText; if (sayBye) sayBye(); if (!T || !T.announce(a.md, 0)) return 'not shown: STAGE FORMULA is off';
      const life = new AbortController(), bye = sayBye = () => { life.abort(); if (sayBye === bye) sayBye = null; T.dismiss(a.md); };
      addEventListener('keydown', (e) => { if (e.key === 'Escape' && !isField(e.target, true)) bye(); }, { signal: life.signal }); return { own: true }; } },
  { id: 'notebook', args: { md: 'string' }, doc: "append a markdown block to this project's notebook (opening it to read)",
    run(app, a) { const N = app.sh.layout.notebook, was = N.isOpen; N.text = N.text.trim() ? N.text.replace(/\s*$/, '\n\n') + a.md : a.md;
      if (!was) N.open('notes'); if (!was || N.mode === 'view') N.setMode('view'); } },
  { id: 'new', args: {}, doc: 'open a new empty project (asking first when this one has unsaved changes)',
    async run(app) { if (!(await app.sh.layout.projects.requestFresh())) return 'NEW did not open: the unsaved project was kept, or the empty project could not be fetched'; } },
];
const BY_ID = new Map(VERBS.map((v) => [v.id, v]));
/** '' when `args` fits the row, else the sentence: never guessed */
function check(row, args) {
  if (!row) return 'there is no such verb';
  if (!args || typeof args !== 'object' || Array.isArray(args)) return 'its args must be an object';
  for (const k of Object.keys(args)) if (!Object.hasOwn(row.args, k)) return `${row.id} has no argument "${k}"`;
  for (const [k, spec] of Object.entries(row.args)) {
    const s = spec.replace(/^\?/, ''), v = args[k]; if (v === undefined) { if (s !== spec) continue; return `${row.id} needs ${k}`; }
    const ok = s.startsWith('enum ') ? s.slice(5).split('|').includes(v) : s.split('|').some((t) => typeof v === (t === 'bool' ? 'boolean' : t) && (t !== 'number' || Number.isFinite(v)));
    if (!ok) return `${row.id}.${k} must be ${s}, not ${JSON.stringify(v)}`;
  }
  return '';
}
export function createVerbs(app) {
  /** run(list, { who, name }) → { ran, refused }: the accepted verbs in order, each awaited (a molecule's solve before what follows), the whole
   *  list ONE history row `${who} · <the first verb in three words>` (or `name`): held across the awaits, held again after NEW's clear */
  async function run(list, { who = 'GEMMA', name } = {}) {
    const ran = [], refused = [], todo = [];
    for (const v of Array.isArray(list) ? list : []) { const why = check(BY_ID.get(v && v.verb), (v && v.args) || {}); if (why) refused.push({ verb: v && v.verb, why }); else todo.push(v); }
    if (!todo.length) return { ran, refused };
    const H = app.state.history, f = todo.find((v) => v.verb !== 'new') || todo[0], row = name || who + ' · ' + [f.verb, ...Object.values(f.args || {})].join(' ').split(/\s+/).slice(0, 3).join(' ');
    const keep = () => { if (!H) return; const was = H.holding; H.hold(row); if (was) H.release(); };
    let fade = '', own = false; keep();
    try {
      for (const v of todo) { keep(); let r; try { r = await BY_ID.get(v.verb).run(app, v.args || {}); } catch (e) { r = String((e && e.message) || e); }
        if (typeof r === 'string') refused.push({ verb: v.verb, why: r }); else { ran.push(v); own = own || !!(r && r.own); fade = fade || (r && r.fade) || ''; } }
    } finally { if (H) H.release(); }
    if (fade && !own && app.state.stageText) app.state.stageText.announce(fade);
    return { ran, refused };
  }
  /** what the app already prints, as compact JSON for a reader with no eyes: nothing here is computed for her */
  function inventory() {
    const { clock, reg, ui, mat } = app, c = app.state.chem, H = getHamiltonian(), P = app.host.cameraPort, mol = c && c.on ? MOLECULE_BY_ID.get(c.preset()) : null;
    const sol = mol && c.solution(), live = sol && sol.key === c.preset() + '|' + c.basis + '|' + mol.charge ? sol : null, s = live && (live.stem || stemOf(live)), cs = mol && c.state(), st = mol ? c.said : statusOf({ owner: H.id });
    const ro = (r) => (r ? [...r.root.querySelectorAll('.ro-val, .ro-sub')].map((e) => e.textContent).filter(Boolean).join(' · ') : '');
    const P0 = reg.populated(), lbl = (a) => (H.id === 'hydrogen' ? BASIS[a].label : H.labelOf(BASIS[a]));
    return { owner: mol ? 'MOLECULES' : H.label.split(/\s{2,}/)[0],
      molecule: mol && (live ? { formula: mol.formula.replace(/<\/?m>/g, ''), name: mol.name, basis: BASIS_LABEL[c.basis], E: +live.energy.toFixed(6), nocc: live.nocc, nAO: live.nAO, group: s.pointGroup, homo: s.homo,
        gapEh: +s.gapEh.toFixed(4), gapEv: +s.gapEv.toFixed(2), orbital: cs.orbitalName, head: st && st.head } : { formula: mol.formula.replace(/<\/?m>/g, ''), name: mol.name, solving: true }),
      status: st ? st.line : null,
      states: mol ? null : { prose: stateLatex({ H, states: P0.map((a) => ({ n: BASIS[a].n, l: BASIS[a].l, m: BASIS[a].m, re: reg.re0[a], im: reg.im0[a] })) }).split('\n')[0],
        populations: Object.fromEntries(P0.map((a) => [lbl(a), +(reg.re0[a] ** 2 + reg.im0[a] ** 2).toFixed(4)])) },
      repeats: ro(ui.periodRo), rate: clock.rate, t: +clock.t.toFixed(3), playing: !!clock.playing,
      camera: Object.fromEntries(['yaw', 'pitch', 'zoom', 'fov', 'autoRotate'].map((k) => { const v = P.get(k); return [k, typeof v === 'number' ? +v.toFixed(3) : v]; })),
      windows: app.sh.rk.windows().filter((w) => w.open).map((w) => w.id), view: cs ? cs.view : VIEW_NAMES[mat.view], notebook: app.sh.layout.notebook.text.slice(-600) };
  }
  return { run, inventory, table: VERBS };
}
