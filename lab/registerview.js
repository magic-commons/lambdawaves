/* registerview.js — THE REGISTER: two registers, one pane seg, inside MOLECULES (REGISTER-WINDOW-SPEC-2026-09-18 §0; iteration 008 U).
 *
 *   ORBITAL   the one-electron packet over CHEMISTRY's canonical orbitals (orbitalsview.js): it has a phase, it
 *             beats at orbital gaps Δε, and it says so.
 *   STATES    the many-electron register over S₀ and the singlet CIS states (statesview.js): it beats where the
 *             spectrum's sticks stand, and it is a valid N-electron state at any amplitude.
 *
 * ITERATION 008 U (Josh: "Molecules On and Registry On will be the same function … make it so that 'view' in the molecules window shifts
 * into registry mode") · MO-REGISTRY is no longer a window: its panes sit in MOLECULES under the ON row, the ORBITAL | STATES seg rides
 * that row (`api.bar`), and there is no REGISTRY ON.  A register HAS the field exactly when MOLECULES is ON, MOLECULES' VIEW reads
 * REGISTRY and its pane is the one shown — one state, read here (`want`) and followed (`follow`) whenever any of the three moves.  Each
 * pane keeps its own CLAIM (`claim`: take or release the field, its refusals, STATES' parking for a ladder still to land); `follow` is its
 * only caller from outside.  ON has one owner, handed to each pane as `api.want` / `api.one`: a pane's public setOn (__LW.orbitals.setOn,
 * a stick's press, DRIVE) is the ONE switch, its record writes `on: want()` (the derived state, so a file means what it meant) and a record
 * that says ON loads as the one switch's ON.  Each mode keeps its own register and its own record.
 */
import { el, seg } from './mir/kit.js';
import { createOrbitals } from './orbitalsview.js';
import { createStates } from './statesview.js';

export function createRegister(host, api) {
  let mode = 'orbital';
  const C = () => (api.chem ? api.chem() : null);
  /** the one state: MOLECULES ON, VIEW REGISTRY, and this pane shown */
  const drawn = () => { const c = C(); return !!(c && c.on && c.view === 'registry'); };
  const want = (m) => drawn() && mode === m;
  const modeSeg = seg({ aria: 'Register pane', value: mode, cls: 'reg-mode', options: [{ id: 'orbital', label: 'ORBITAL' }, { id: 'states', label: 'STATES' }],
    onChange: (v) => setMode(v, true) });
  modeSeg.root.title = 'ORBITAL: one electron · STATES: the molecule';
  (api.bar || host).appendChild(modeSeg.root);
  const paneO = el('div', 'reg-pane', host), paneS = el('div', 'reg-pane', host); paneS.hidden = true;

  /* one status line (the card's): a register speaks there only while it is what the field draws */
  const statusOf = { orbital: ['', ''], states: ['', ''] };
  const relay = (m) => (t, cls) => { statusOf[m] = [t, cls]; if (mode === m && drawn() && api.status) api.status(t, cls); };
  /* a hand that painted a pane picked that register: VIEW REGISTRY (api.stroked, molecules.js), this pane */
  const stroked = (m) => { if (m !== mode) setMode(m); if (api.stroked) api.stroked(m); };
  /* each pane's api: the card's, its status relay, and ON's owner — want() reads the one state, one() is the one switch with this pane shown */
  const paneApi = (m, more) => ({ ...api, status: relay(m), stroked, want: () => want(m), one: (v, hand) => one(v, m, hand), ...more });
  const orbitals = createOrbitals(paneO, paneApi('orbital')), states = createStates(paneS, paneApi('states', { show: (m) => setMode(m) }));

  /* the panes' own claims — `follow` and nothing else from outside calls them */
  function follow(hand) {
    const o = want('orbital'), s = want('states');
    if (!o && orbitals.on) orbitals.claim(false);
    if (!s) states.claim(false);                            // OFF also disarms a STATES pane still parked for its ladder
    if (o && !orbitals.on) orbitals.claim(true);
    if (s && !states.on) states.claim(true, !!hand);        // a hand's ON over S₀ alone plays BEAT (statesview)
    const st = statusOf[mode]; if (drawn() && api.status && st[0]) api.status(st[0], st[1]);
    return o || s;
  }
  /** a pane's public ON: the one switch (api.one: MOLECULES ON and VIEW REGISTRY, or MOLECULES OFF), this pane shown */
  function one(v, m, hand) {
    if (v && m !== mode) setMode(m);
    if (api.one) api.one(!!v, !!hand); else follow(hand);
    return m === 'states' ? states.on : orbitals.on;      // as it always answered: does this register hold the field now (a solve in flight: not yet)
  }
  /* a landing can make a refused ORBITAL claim good (the field turns molecular once the solve is in): claim it after the pane's own adopt.
     STATES needs no help: a refused ON arms its own one re-arm seat, the ladder's landing (statesview fetchLadder), keeping a hand's BEAT */
  { const c = C(); if (c && c.subscribe) c.subscribe(() => { if (want('orbital') && !orbitals.on) orbitals.claim(true); }); }

  function setMode(v, hand) {
    const next = v === 'states' ? 'states' : 'orbital';
    if (next === mode) { modeSeg.set(mode); return mode; }
    mode = next; modeSeg.set(mode);
    paneO.hidden = mode !== 'orbital'; paneS.hidden = mode !== 'states';
    states.setShown(mode === 'states');
    if (mode === 'orbital') { orbitals.paint(); orbitals.refresh(); }
    follow(hand);
    return mode;
  }
  states.setShown(false);

  return {
    orbitals, states, follow,
    get mode() { return mode; }, setMode,
    update(t) {
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
