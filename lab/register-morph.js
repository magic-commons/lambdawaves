/* register-morph.js — THE A ↔ B MORPH both register panes carry (ORBITAL, orbitalsview.js; STATES, statesview.js), written once (iteration 008
 * fix round, architecture C2; Sos C3).  Two stored registers, a position s on the normalised path between them (molecular-register.js
 * slerpCoefficients — for orthogonal stores cos/sin, hydrogen's TRANSITION envelope), MORPH that plays it: → A · → B into the pane's bar, MORPH
 * and the A ↔ B knob into its row.  A performance path, not dynamics.  Each pane keeps its own target id (`reg.omorph` ORBITAL, ADR-0002;
 * `reg.morph` STATES), its own record shape and what a change repaints — handed in, never decided here:
 *   bar, row      where → A · → B and MORPH · A ↔ B go          id       the target the knob's hand law asks (api.modHand)
 *   key           the stored entries' key name ('k' · 'key')      valid(k) a stored key this pane's ladder still holds
 *   snapshot()    the pane's register as Map key → { re, im }     stored(M) after → A / → B, changed() after a MORPH change (the pane's own repaint)
 *   lanes, knobTitle   the knob's and the switch's words          hand(id, v), status(t, cls), rows() (the dials, dimmed while MORPH plays) */
import { el, sw, knob } from './mir/kit.js';
import { slerpCoefficients } from './molecular-register.js';

export function createMorph(o) {
  let A = null, B = null, on = false, s = 0;
  const aBtn = el('button', 'trig', o.bar); aBtn.type = 'button'; aBtn.textContent = '→ A'; aBtn.title = 'Store this register as A';
  const bBtn = el('button', 'trig', o.bar); bBtn.type = 'button'; bBtn.textContent = '→ B'; bBtn.title = 'Store this register as B';
  aBtn.addEventListener('click', () => api.store('A')); bBtn.addEventListener('click', () => api.store('B'));
  const morphSw = sw({ label: 'MORPH', value: false, title: `Play the normalised path from A to B instead of the ${o.lanes} — a performance path, not dynamics`, onChange: (v) => api.set(v, s) });
  const morphK = knob({ label: '<m>A ↔ B</m>', aria: 'morph A to B', min: 0, max: 1, value: 0, fmt: (v) => v.toFixed(3), title: o.knobTitle,
    onInput: (v) => { if (o.hand(o.id, v)) return; api.set(on, v); } });   // iteration 007 (MIR check B2): routed, the hand moves the base
  o.row.appendChild(morphSw.root); o.row.appendChild(morphK.root);
  const lamps = () => { aBtn.classList.toggle('on', !!A); bBtn.classList.toggle('on', !!B); };
  const pack = (M) => (M ? [...M].map(([k, c]) => ({ [o.key]: k, re: c.re, im: c.im })) : null);
  const unpack = (a) => { if (!Array.isArray(a)) return null; const M = new Map();
    for (const e of a) { const k = Math.round(e && e[o.key]); if (Number.isFinite(k) && o.valid(k)) M.set(k, { re: +e.re || 0, im: +e.im || 0 }); } return M.size ? M : null; };
  const api = {
    get on() { return on; }, get s() { return s; }, get A() { return A; }, get B() { return B; }, knob: morphK,
    /** what plays while MORPH is up: the path's coefficients at s (key → { re, im }), else null */
    path() { return on && A && B ? slerpCoefficients(A, B, s) : null; },
    /** → A / → B: the pane's register stored; the Map, or null when there is nothing to store */
    store(which) {
      const M = o.snapshot(); if (!M.size) return null;
      if (which === 'A') A = M; else B = M;
      lamps(); o.stored(M); return M;
    },
    set(v, sv) {
      s = Math.min(1, Math.max(0, Number.isFinite(sv) ? sv : s));
      const want = !!v && !!A && !!B;
      if (v && !want) o.status('MORPH needs both stores: → A, change the register, → B', 'warn');
      on = want; morphSw.set(on); if (morphK.get() !== s) morphK.set(s);
      o.rows().classList.toggle('reg-morphing', on);
      o.changed(); return on;
    },
    /** the modulator's road (a route, a TIMELINE lane): store the position; true when it moved — what follows is the pane's */
    setValue(v) { const x = Math.min(1, Math.max(0, +v || 0)); if (x === s) return false; s = x; return true; },
    /** a new solve: no stores, no path (and the lanes undimmed) */
    reset() { A = B = null; lamps(); on = false; morphSw.set(false); o.rows().classList.remove('reg-morphing'); },
    /** the stores, the position and MORPH as a record carries them (each pane decides when it writes them) */
    save() { return { morph: s, morphOn: on, A: pack(A), B: pack(B) }; },
    load(r) { A = unpack(r && r.A); B = unpack(r && r.B); lamps(); s = Math.min(1, Math.max(0, +(r && r.morph) || 0)); morphK.set(s); on = !!(r && r.morphOn) && !!A && !!B; morphSw.set(on);
      o.rows().classList.toggle('reg-morphing', on); },   // iteration 009 F2: a restored MORPH dims the lanes / dials exactly as a hand-set one (both panes)
  };
  return api;
}
