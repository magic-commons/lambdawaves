/* registerview.js — THE REGISTER WINDOW: one window, two registers, one switch (REGISTER-WINDOW-SPEC-2026-09-18 §0).
 *
 *   ORBITAL   the one-electron packet over CHEMISTRY's canonical orbitals (orbitalsview.js): it has a phase, it
 *             beats at orbital gaps Δε, and it says so.
 *   STATES    the many-electron register over S₀ and the singlet CIS states (statesview.js): it beats where the
 *             spectrum's sticks stand, and it is a valid N-electron state at any amplitude.
 *
 * Each mode keeps its own register and its own record; the switch chooses which pane is shown, and turning one
 * register ON turns the other OFF — the molecular session would rank them anyway (states over orbital-packet),
 * but two lit REGISTER ON switches in one window would be a lie about which one the field is showing.
 */
import { el, seg } from './mir/kit.js';
import { createOrbitals } from './orbitalsview.js';
import { createStates } from './statesview.js';

export function createRegister(host, api) {
  let mode = 'orbital';
  const bar = el('div', 'row tight reg-mode', host);
  const modeSeg = seg({ label: 'REGISTER', value: mode, options: [{ id: 'orbital', label: 'ORBITAL' }, { id: 'states', label: 'STATES' }],
    onChange: (v) => setMode(v) });
  modeSeg.root.title = 'ORBITAL: one electron over the molecule’s orbitals — it has a phase, and beats at orbital gaps. '
    + 'STATES: the whole molecule over its ground and excited states — it beats where the spectrum’s sticks stand.';
  bar.appendChild(modeSeg.root);
  const paneO = el('div', 'reg-pane', host), paneS = el('div', 'reg-pane', host); paneS.hidden = true;

  const statusOf = { orbital: ['', ''], states: ['', ''] };
  const relay = (m) => (t, cls) => { statusOf[m] = [t, cls]; if (mode === m && api.status) api.status(t, cls); };
  let orbitals = null, states = null;
  orbitals = createOrbitals(paneO, { ...api, status: relay('orbital') });
  states = createStates(paneS, { ...api, status: relay('states'), show: (m) => setMode(m) });

  /* one register at a time: the wrapped setOn of each turns the other off first */
  const onO = orbitals.setOn, onS = states.setOn;
  orbitals.setOn = (v) => { if (v && states.on) onS(false); return onO(v); };
  states.setOn = (v) => { if (v && orbitals.on) onO(false); return onS(v); };

  function setMode(v) {
    const next = v === 'states' ? 'states' : 'orbital';
    if (next === mode) { modeSeg.set(mode); return mode; }
    mode = next; modeSeg.set(mode);
    paneO.hidden = mode !== 'orbital'; paneS.hidden = mode !== 'states';
    states.setShown(mode === 'states');
    if (mode === 'orbital') { orbitals.paint(); orbitals.refresh(); }
    const st = statusOf[mode]; if (api.status && st[0]) api.status(st[0], st[1]);
    return mode;
  }
  states.setShown(false);

  return {
    orbitals, states,
    get mode() { return mode; }, setMode,
    update(t) {
      /* a switch pressed inside a pane calls that pane's own setOn, not the wrapped one: settle it here, in favour
         of the pane the hand is in, before either register asks the session for the field */
      if (orbitals.on && states.on) (mode === 'states' ? onO : onS)(false);
      const a = orbitals.update(t), b = states.update(t); return a || b;
    },
    setActive(v) { orbitals.setActive(v && mode === 'orbital'); states.setActive(v && mode === 'states'); },
    save() { return { mode, orbitals: orbitals.save(), states: states.save() }; },
    /** a record written before the switch existed is the ORBITALS record itself */
    load(r) {
      if (!r) return false;
      if (r.selection && !r.orbitals) { orbitals.load(r); return true; }
      if (r.orbitals) orbitals.load(r.orbitals);
      if (r.states) states.load(r.states);
      setMode(r.mode);
      return true;
    },
    dispose() { orbitals.dispose(); states.dispose(); },
  };
}
