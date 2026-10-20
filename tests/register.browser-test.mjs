/* tests/register.browser-test.mjs — the REGISTER window's STATES mode, in a real browser on the real GPU.
 *
 * The mathematics is gated in node (tests/molecular-register.test.mjs); this file gates the INSTRUMENT: that the
 * window exists under its new name with its switch, that the worker's canonical ladder reaches it, that the session
 * hands it the field as a `signed` product under the `real` observable, that time is closed-form (periodic to
 * round-off under a scrub), that one register plays at a time, that benzene's RING is a rotating dipole of constant
 * length on lanes named by their axis, and that presets, stores, MORPH, the record and the modulation targets work.
 * 0.5.3 M2 · R11 drives C₆₀'s ladder by hand: a pick of C₆₀ under the browser's change rule after a failed record open, the
 * driver's real clicks and a real drag down the ladder, a real press of ON.  M3 · R12: the sentence on the STATES switch, a real press
 * of ON over S₀ alone, and the one re-arm seat.  M10 · R13: the eight ORBITAL presets on water and on C₆₀.
 * Iteration 008 U: the register lives INSIDE MOLECULES (`chem`): ORBITAL | STATES rides the ON row, there is no REGISTRY ON — a register
 * has the field under MOLECULES ON + VIEW REGISTRY + its pane — so "off the field" is VIEW DENSITY here, and the real presses are VIEW REGISTRY's.
 */
import http from 'node:http';
import { open, judge, done } from '../tools/gate/gatekit.mjs';

const PORT = process.env.LW_PORT || 8706;
const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1500, height: 1150, script: 300000 });
const HELP = `
  if (window.__LW && __LW.stageText) __LW.stageText.prefs.set({ sayPreset: true });   /* iteration 007 I: THE FADE is the preset kind, off on a first run */
  const wait = (f, n = 400) => new Promise((res) => { let i = 0; const tick = () => { let v = null; try { v = f(); } catch (e) { v = null; } if (v || ++i > n) res(v); else setTimeout(tick, 50); }; tick(); });
  const frames = async (n = 8) => { for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 120)); };
  const ready = () => wait(() => __LW.states.ladder() && __LW.states.state().lanes.every((l) => l.ready) && __LW.states.state().pending === 0);
`;
try {
  const boot = await g.waitFor('window.__LW&&__LW.ready', 400, 100);
  judge('R0 boot: __LW.ready', boot.ok === 1, boot);
  const r0 = await g.ev(`return { errs: window.__e.slice(),
    eyebrow: (document.querySelector('.dev[data-id="chem"] .dev-eyebrow') || {}).textContent, gone: !document.querySelector('.dev[data-id="orbitals"]'),
    seg: [...document.querySelectorAll('.dev[data-id="chem"] .mol-top .reg-mode .seg-b')].map((b) => b.textContent),
    mode: __LW.register.mode, handles: typeof __LW.states.preset === 'function' && typeof __LW.register.setMode === 'function',
    rank: __LW.molsession.state().models.map((m) => m.id) };`);
  judge('R0 the register is inside MOLECULES (no `orbitals` window), its ORBITAL | STATES seg on the ON row opens on ORBITAL, and the session knows the `states` model',
    r0.errs.length === 0 && r0.eyebrow === 'MOLECULES' && r0.gone && r0.seg.join('|') === 'ORBITAL|STATES' && r0.mode === 'orbital' && r0.handles && r0.rank.includes('states'), r0);

  /* ── R1 · water: the ladder arrives, a preset is a rule, the session hands over the field ─────────────── */
  const r1 = await g.ev(`${HELP}
    __LW.chem.setOn(true); await __LW.chem.solve('H2O');
    document.querySelector('.dev[data-id="chem"]').classList.remove('closed', 'folded');   // the window's own repaint paths run only while it can be seen: gate them too
    const lad = await wait(() => __LW.states.ladder());
    __LW.register.setMode('states');
    const ring = __LW.states.preset('RING'), ringStatus = __LW.states.state().status;
    const beat = __LW.states.preset('BEAT'); await ready();
    const on = __LW.states.setOn(true); await frames();
    const st = __LW.states.state(), ses = __LW.molsession.state();
    return { count: lad && lad.count, ring, ringStatus, beat, on, lanes: st.lanes.map((l) => l.label + ':' + l.omega.toFixed(6)), beatAs: st.beat && st.beat.attoseconds, status: st.status,
      selected: ses.selected, kind: ses.last.kind, view: ses.view, chemTda: __LW.chem.state().tda, stats: await __LW.field.readStats(), errs: window.__e.slice() };`);
  judge('R1 H₂O: 10 states arrive in the canonical gauge; RING is refused with a sentence (no twofold level), BEAT is S₀ + the brightest valence state',
    r1.count === 10 && r1.ring === false && /no bright degenerate pair/.test(r1.ringStatus) && r1.beat === true && r1.lanes.length === 2 && r1.lanes[0].startsWith('S₀'), r1);
  judge('R1 REGISTER ON: the session selects `states`, the product is `signed` under the `real` observable, CHEMISTRY shows its TDA ladder, the status says TD-CIS',
    r1.on === true && r1.selected === 'states' && r1.kind === 'signed' && r1.view === 'real' && r1.chemTda === true && /TD-CIS/.test(r1.status) && r1.errs.length === 0, r1);

  /* ── R2 · time is closed form: a scrub by one beat period returns the dipole, half a period does not ──── */
  const r2 = await g.ev(`${HELP}
    const st0 = __LW.states.state(), T = st0.beat.period, at = async (t) => { __LW.clock.scrub(t); __LW.schedule(__LW.TIER.EVOLVE); await frames(4); return __LW.states.state().dipole; };
    const a = await at(1.0), h = await at(1.0 + T / 2), b = await at(1.0 + T), back = await at(1.0);
    return { T, a, h, b, back };`);
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  judge('R2 the dipole is periodic in the beat period to 1e-9 and reversible under a scrub back; half a period away it is somewhere else (> 0.1 a.u.)',
    dist(r2.a, r2.b) < 1e-9 && dist(r2.a, r2.back) < 1e-12 && dist(r2.a, r2.h) > 0.1, { T: r2.T, periodic: dist(r2.a, r2.b), reversible: dist(r2.a, r2.back), half: dist(r2.a, r2.h) });

  /* ── R3 · the views, and one register at a time ──────────────────────────────────────────────────────── */
  const r3 = await g.ev(`${HELP}
    __LW.states.setView('density'); await frames(); const dens = __LW.molsession.state();
    __LW.states.setView('change'); __LW.states.setRef('mean'); await frames(); const mean = __LW.molsession.state();
    __LW.states.setRef('ground');
    __LW.register.setMode('orbital'); __LW.orbitals.setOn(true); await frames();
    const o = { orb: __LW.orbitals.on, st: __LW.states.on, sel: __LW.molsession.state().selected };
    __LW.register.setMode('states'); __LW.states.setOn(true); await frames();
    const s = { orb: __LW.orbitals.on, st: __LW.states.on, sel: __LW.molsession.state().selected };
    return { dens: [dens.last.kind, dens.view], mean: [mean.last.kind, mean.view], o, s, errs: window.__e.slice() };`);
  judge('R3 DENSITY is a `density` product under the density observable; MEAN is a `signed` one under `real`',
    r3.dens.join() === 'density,density' && r3.mean.join() === 'signed,real', r3);
  judge('R3 one register at a time: ORBITAL on turns STATES off (orbital-packet has the field), and back again',
    r3.o.orb === true && r3.o.st === false && r3.o.sel === 'orbital-packet' && r3.s.orb === false && r3.s.st === true && r3.s.sel === 'states' && r3.errs.length === 0, r3);

  /* ── R4 · stores, MORPH, the record, the modulation targets ──────────────────────────────────────────── */
  const r4 = await g.ev(`${HELP}
    __LW.states.preset('BEAT'); await ready(); const A = __LW.states.store('A');
    __LW.states.preset('KICK Y'); await ready(); const B = __LW.states.store('B');
    const before = __LW.states.state().dipole; __LW.clock.scrub(2.0); __LW.schedule(__LW.TIER.EVOLVE); await frames(4);
    const m = __LW.states.setMorph(true, 0.5); await ready(); await frames(4); const mid = __LW.states.state();
    __LW.states.setMorph(false, 0.5);
    const rec = __LW.states.save(); __LW.states.clear(); const cleared = __LW.states.state().lanes.length;
    __LW.states.load(rec); await ready(); await frames(4); const back = __LW.states.state();
    const reg = __LW.mod.registry, ids = ['reg.morph', 'reg.amp1', 'reg.amp8', 'reg.ph1', 'reg.ph8'].map((id) => reg.has(id));
    return { A, B, m, midDip: mid.dipole, morphOn: mid.morphOn, cleared, lanes: back.lanes.map((l) => l.label), recLanes: rec.lanes.length, hasA: back.hasA, hasB: back.hasB, ids, errs: window.__e.slice() };`);
  judge('R4 → A, → B and MORPH play a path between two stored registers; the record restores the lanes and both stores; the rack offers reg.morph and eight amp + phase slots',
    r4.A && r4.B && r4.m === true && r4.morphOn === true && r4.midDip.every(Number.isFinite) && r4.cleared === 1 && r4.lanes.length === r4.recLanes && r4.hasA && r4.hasB
      && r4.ids.every(Boolean) && r4.errs.length === 0, r4);

  /* ── R5 · benzene: the ring ──────────────────────────────────────────────────────────────────────────── */
  const r5 = await g.ev(`${HELP}
    const t0 = performance.now(); await __LW.chem.solve('C6H6'); await wait(() => __LW.states.ladder() && __LW.states.ladder().count === 315);
    const ladderMs = performance.now() - t0;
    const okRing = __LW.states.preset('RING'); await ready(); __LW.states.setOn(true); await frames();
    const st = __LW.states.state(), L = __LW.states.ladder(), kx = st.lanes[1].key, ky = st.lanes[2].key;
    const T = st.beat.period, mags = [], angs = [];
    for (let k = 0; k < 12; k++) { __LW.clock.scrub(T * k / 12); __LW.schedule(__LW.TIER.EVOLVE); await frames(3); const d = __LW.states.state().dipole; mags.push(Math.hypot(d[0], d[1])); angs.push(Math.atan2(d[1], d[0])); }
    let turn = 0; for (let k = 1; k < 12; k++) { let da = angs[k] - angs[k - 1]; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; turn += da; }
    __LW.states.setPhase(ky, 0); await frames(3); const lin = []; for (let k = 0; k < 6; k++) { __LW.clock.scrub(T * k / 6); __LW.schedule(__LW.TIER.EVOLVE); await frames(3); const d = __LW.states.state().dipole; lin.push(Math.atan2(d[1], d[0])); }
    return { ladderMs, okRing, labels: st.lanes.map((l) => l.label), muX: [L.mu[3 * kx], L.mu[3 * kx + 1], L.mu[3 * kx + 2]], muY: [L.mu[3 * ky], L.mu[3 * ky + 1], L.mu[3 * ky + 2]],
      as: st.beat.attoseconds, spread: Math.max(...mags) - Math.min(...mags), mag: mags[0], turn: turn / (2 * Math.PI), lin, sel: __LW.molsession.state().selected, errs: window.__e.slice() };`);
  const linFold = r5.lin.map((a) => Math.abs(Math.abs(((a % Math.PI) + Math.PI) % Math.PI - Math.PI / 4)));
  judge('R5 C₆H₆ RING: lanes S₀, S₄x, S₄y — the pair lies on (μ, 0, 0) and (0, μ, 0) in the canonical gauge, and its beat is 389 as',
    r5.okRing && r5.labels.join(' ') === 'S₀ S₄x S₄y' && r5.muX[0] > 2 && Math.abs(r5.muX[1]) < 1e-8 && r5.muY[1] > 2 && Math.abs(r5.muY[0]) < 1e-8 && Math.abs(r5.as - 389.4) < 0.5, r5);
  judge('R5 a quarter turn on the y lane is a ring current: |δμ| constant to 1e-9 while it turns 11/12 of a revolution in 11/12 of a period; at 0° it is a slosh along one diagonal',
    r5.spread < 1e-9 && r5.mag > 0.5 && Math.abs(Math.abs(r5.turn) - 11 / 12) < 1e-6 && Math.max(...linFold) < 1e-6 && r5.sel === 'states' && r5.errs.length === 0,
    { spread: r5.spread, mag: r5.mag, turn: r5.turn, linFold, ladderMs: r5.ladderMs });

  /* ── R6 · a stick is PLAYED; the ORBITAL mode has its presets too ────────────────────────────────────── */
  const r6 = await g.ev(`${HELP}
    __LW.chem.setView('density'); __LW.states.clear(); __LW.register.setMode('orbital');
    const played = __LW.states.play(3); await ready(); await frames();
    const st = __LW.states.state(), mode = __LW.register.mode;
    __LW.chem.setView('density'); __LW.register.setMode('orbital');
    const wind = __LW.orbitals.preset('WINDING'), sel = __LW.orbitals.state().selection.map((s) => [s.k, +s.phase.toFixed(4)]);
    const hl = __LW.orbitals.preset('HOMO + LUMO'), sel2 = __LW.orbitals.state().selection.map((s) => s.k);
    return { played, mode, on: st.on, lanes: st.lanes.map((l) => l.label), wind, sel, hl, sel2, homo: __LW.orbitals.state().homo, errs: window.__e.slice() };`);
  judge('R6 playing a TDA stick puts S₀ + that state in the register, switches the window to STATES and turns it on; WINDING is benzene’s degenerate HOMO pair a quarter turn apart, HOMO + LUMO the frozen beat',
    r6.played && r6.mode === 'states' && r6.on && r6.lanes.join(' ') === 'S₀ S₄x' && r6.wind && r6.sel.length === 2 && r6.sel[1][0] === r6.homo && Math.abs(r6.sel[1][1] - 1.5708) < 1e-3
      && r6.hl && r6.sel2.join() === [r6.homo, r6.homo + 1].join() && r6.errs.length === 0, r6);

  /* ── R7 · THE DRIVE: a resonant field moves population, the lanes read it out, a scrub back un-propagates ─ */
  const r7 = await g.ev(`${HELP}
    __LW.chem.setView('density'); await __LW.chem.solve('H2O'); await wait(() => __LW.states.ladder() && __LW.states.ladder().count === 10);
    __LW.register.setMode('states'); __LW.states.preset('BEAT'); await ready();
    __LW.states.clear(); const L = __LW.states.ladder(); let K = 0; for (let k = 0; k < L.count; k++) if (L.omega[k] < 3 && L.f[k] > L.f[K]) K = k;
    __LW.states.select(K, 0, 0); await ready();                                   // S₀ = 1, the bright lane empty: the drive must fill it
    const tuned = __LW.states.tune(), d0 = __LW.states.drive, mu = Math.hypot(L.mu[3 * K], L.mu[3 * K + 1], L.mu[3 * K + 2]);
    __LW.states.setDriveParam('e0', 0.02 / mu);                                   // Ω = 0.02 → π/Ω = 157 a.u.
    __LW.clock.scrub(0); __LW.schedule(__LW.TIER.EVOLVE); await frames(3);
    const onD = __LW.states.setDrive(true); await wait(() => __LW.states.drive.ready && __LW.states.drive.last);
    const goto = async (t) => { __LW.clock.scrub(t); for (let i = 0; i < 40; i++) { __LW.schedule(__LW.TIER.EVOLVE); await frames(2); const d = __LW.states.drive.last; if (d && Math.abs(d.t - t) < 1e-9) return d; } return __LW.states.drive.last; };
    const half = await goto(Math.PI / 0.02 / 2), full = await goto(Math.PI / 0.02), fader = +document.querySelectorAll('.dev[data-id="chem"] .reg-pane:not([hidden]) .sp-row .fd')[1].getAttribute('aria-valuenow');
    const back = await goto(0);
    const ids = ['reg.e0', 'reg.w'].map((id) => __LW.mod.registry.has(id));
    const off = __LW.states.setDrive(false), st = __LW.states.state();
    return { tuned, pol: d0.pol, omega: d0.omega, wK: L.omega[K], onD, half: [half.p0, half.pops[K], half.norm], full: [full.p0, full.pops[K], full.norm, full.steps], fader, back: [back.p0, back.pops[K]], ids, off, lanesAfter: st.lanes.map((l) => +l.amp.toFixed(4)), sel: __LW.molsession.state().selected, errs: window.__e.slice() };`);
  judge('R7 ω → LANE tunes the drive to the stick and its axis; on resonance the population flops at Ω = E₀μ: half way at π/2Ω, across at π/Ω, the norm kept',
    r7.tuned && Math.abs(r7.omega - r7.wK) < 1e-12 && r7.onD === true && Math.abs(r7.half[1] - 0.5) < 0.03 && r7.full[1] > 0.99 && r7.full[0] < 0.01 && Math.abs(r7.full[2] - 1) < 1e-9 && r7.ids.every(Boolean), r7);
  judge('R7 the lane’s fader is the driven population; a scrub back to t = 0 un-propagates to S₀ = 1; DRIVE OFF freezes the state into the lanes and the register keeps the field',
    (Number.isNaN(r7.fader) || r7.fader > 0.95) && r7.back[0] > 1 - 1e-9 && r7.back[1] < 1e-9 && r7.off === false && r7.lanesAfter[0] > 0.999 && r7.sel === 'states' && r7.errs.length === 0, r7);

  /* ── R8 · FLOW: tracers on the stage ride the ring's current, and turn with it ───────────────────────── */
  const r8 = await g.ev(`${HELP}
    await __LW.chem.solve('C6H6'); await wait(() => __LW.states.ladder() && __LW.states.ladder().count === 315);
    __LW.states.preset('RING'); await ready(); __LW.states.setOn(true); const fl = __LW.states.setFlow(true);
    __LW.clock.scrub(0); __LW.schedule(__LW.TIER.EVOLVE); await frames(4);
    const p0 = __LW.states.flowState();
    /* walk the clock forward in small steps, as a playing transport would, and watch the tracers' mean angular motion */
    const pts0 = null; let Lsum = 0, moved = 0;
    const cv = document.getElementById('flow'), snap = () => { const g2 = cv.getContext('2d'), d = g2.getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) lit++; return lit; };
    for (let k = 1; k <= 30; k++) { __LW.clock.scrub(0.25 * k); __LW.schedule(__LW.TIER.EVOLVE); await frames(2); }
    const p1 = __LW.states.flowState(), lit = snap();
    const off = __LW.states.setFlow(false); await frames(3); const p2 = __LW.states.flowState();
    return { fl, p0, p1, lit, off, p2, errs: window.__e.slice() };`);
  judge('R8 FLOW seeds tracers where the current runs, they advance with the clock and are drawn on their own stage canvas; FLOW off takes them away',
    r8.fl === true && r8.p0 && r8.p0.on && r8.p0.count >= 150 && r8.p1.alive > 100 && r8.p1.maxSpeed > 1e-3 && r8.lit > 20 && r8.off === false && r8.p2.on === false && r8.errs.length === 0, r8);

  /* ── R9 · FLOW follows the model that is playing: the ORBITAL packet's WINDING, then CHEMISTRY's real-time run ─ */
  const r9 = await g.ev(`${HELP}
    __LW.chem.setView('density'); __LW.register.setMode('orbital'); __LW.orbitals.preset('WINDING'); __LW.orbitals.setOn(true); const fo = __LW.orbitals.setFlow(true);
    for (let k = 1; k <= 24; k++) { __LW.clock.scrub(0.3 * k); __LW.schedule(__LW.TIER.EVOLVE); await frames(2); }
    const orb = { sel: __LW.molsession.state().selected, flow: __LW.states.flowState() };
    __LW.chem.setView('density'); __LW.orbitals.setFlow(false);
    await __LW.chem.solve('H2O'); __LW.chem.setAxis('y'); __LW.chem.setFlow(true); await __LW.chem.kick(); await frames(3);
    const still = __LW.states.flowState();
    __LW.chem.setRun(true); await wait(() => __LW.chem.state().steps > 150, 600); await frames(6);
    const run = { sel: __LW.molsession.state().selected, flow: __LW.states.flowState() };
    __LW.chem.setRun(false); __LW.chem.setFlow(false); await frames(4);
    return { fo, orb, still, run, after: __LW.states.flowState(), errs: window.__e.slice() };`);
  judge('R9 FLOW in ORBITAL mode rides the WINDING orbital’s own phase gradient; in CHEMISTRY it rides the real-time TDHF current, under the tdhf model; off, the stage is clear',
    r9.fo === true && r9.orb.sel === 'orbital-packet' && r9.orb.flow.on && r9.orb.flow.alive > 100 && r9.orb.flow.maxSpeed > 1e-3
      && r9.run.sel === 'tdhf' && r9.run.flow.on && r9.run.flow.alive > 50 && r9.after.on === false && r9.errs.length === 0, r9);

  /* ── R10 · THE LARGER BASIS: the whole register runs in 6-31+G* — ammonia's E pair is a ring there too ──── */
  const r10 = await g.ev(`${HELP}
    await __LW.chem.solve('NH3'); const t0 = performance.now(); await __LW.chem.setBasis('6-31+g-star');
    const lad = await wait(() => __LW.states.ladder() && __LW.states.ladder().count > 50 && __LW.states.ladder()), ms = performance.now() - t0;
    __LW.register.setMode('states'); const ring = __LW.states.preset('RING'); await ready(); __LW.states.setOn(true); await frames();
    const st = __LW.states.state(), T = st.beat.period, mags = [];
    for (let k = 0; k < 8; k++) { __LW.clock.scrub(T * k / 8); __LW.schedule(__LW.TIER.EVOLVE); await frames(3); const d = __LW.states.state().dipole; mags.push(Math.hypot(d[0], d[1], d[2])); }
    const refused = await __LW.chem.solve('C6H6').then(() => __LW.chem.basis);
    await __LW.chem.setBasis('sto-3g');
    return { nAO: __LW.chem.solution() && 0, basisNH3: '6-31+g-star', count: lad && lad.count, ms, ring, labels: st.lanes.map((l) => l.label), spread: Math.max(...mags) - Math.min(...mags), mag: mags[0], refused, energy: null, errs: window.__e.slice() };`);
  judge('R10 NH₃ in 6-31+G* (25 Cartesian AOs, 100 states): the canonical ladder arrives, RING finds the E pair and its dipole turns at constant length; benzene falls back to STO-3G with a sentence',
    r10.count === 100 && r10.ring === true && r10.labels.length === 3 && /x$|y$|z$/.test(r10.labels[1]) && r10.spread < 1e-9 && r10.mag > 0.05 && r10.refused === 'sto-3g' && r10.errs.length === 0, r10);

  /* ── R11 · C₆₀'S LADDER (0.5.3 M2), by hand: a failed record open gives the dropdown back; no click on a dim rung refuses ON ──── */
  const wd = (method, path, body) => new Promise((res, rej) => {   // the driver's own pointer road: real presses and a real drag on the ladder
    const q = http.request({ host: '127.0.0.1', port: process.env.GD_PORT || 4444, path, method, headers: { 'content-type': 'application/json' } }, (x) => {
      let b = ''; x.on('data', (d) => { b += d; }); x.on('end', () => { try { res(JSON.parse(b).value); } catch (e) { rej(e); } }); });
    q.on('error', rej); q.end(body ? JSON.stringify(body) : undefined); });
  /* the hand's pick, under the browser's own rule: a <select> fires `change` only when its VALUE changes (Firefox's driver fires it on
     every <option> click, so its element road cannot stand in for a hand here) — the page turned to the molecule's section first */
  const choose = (id) => g.ev(`const s = document.querySelector('.dev[data-id="chem"] .mol-pick select.sel');
    for (const sec of ['DIATOMICS', 'HYDRIDES', 'ORGANIC', 'BIO', 'LATTICE', 'HEAVY']) { if ([...s.options].some((o) => o.value === '${id}')) break; __LW.chem.section(sec); }
    if (s.value === '${id}') return false;
    s.value = '${id}'; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); return true;`);
  const r11a = await g.ev(`__LW.chem.setOn(true);
    const h = ((await (await fetch('./library.json')).json()).rows.find((r) => r.id === 'C60') || {}).hash;
    if ('caches' in window) await (await caches.open('lw-data-v1')).delete(new URL('./library/' + h + '.json', location.href).href);
    window.__f0 = window.fetch; window.fetch = (u, o) => (String(u && u.url || u).includes(h) ? Promise.reject(new TypeError('the gate is offline for C60')) : __f0(u, o));
    return { h, before: __LW.chem.preset() };`);
  const pick1 = await choose('C60');
  const r11b = await g.ev(`${HELP}
    await wait(() => /record is not open/.test(__LW.chem.state().status));
    const s = document.querySelector('.dev[data-id="chem"] .mol-pick select.sel');
    const out = { preset: __LW.chem.preset(), value: s.value, sol: !!__LW.chem.solution(), status: __LW.chem.state().status };
    window.fetch = __f0; return out;`);
  const pick2 = await choose('C60');
  const r11c = await g.ev(`${HELP} const ok = await wait(() => { const s = __LW.chem.solution(); return s && /^C60\\|/.test(s.key); }, ${pick2 ? 600 : 1}); return { ok: !!ok, preset: __LW.chem.preset() };`);
  judge('R11 C₆₀ offline: the failed record open gives the dropdown back (the last solved molecule chosen again, no solution), so a hand re-pick of C₆₀ is a change and opens it',
    r11a.before !== 'C60' && pick1 && r11b.preset === r11a.before && r11b.value === r11a.before && !r11b.sol && pick2 && r11c.ok && r11c.preset === 'C60', { r11a, pick1, r11b, pick2, r11c });
  const geo = await g.ev(`${HELP}
    __LW.register.setMode('orbital'); const d = document.querySelector('.dev[data-id="chem"]'); d.classList.remove('closed', 'folded'); d.scrollIntoView({ block: 'start' });
    await frames(); __LW.chem.setView('density'); __LW.orbitals.clear(); await frames(2);
    const b = d.querySelector('.reg-pane:not([hidden]) canvas.mol-c').getBoundingClientRect();
    return { x: Math.round(b.left + b.width * 0.6), y0: Math.round(b.top + 14), y1: Math.round(b.bottom - 30) };`);
  const clicks = [];
  for (let y = geo.y0; y <= geo.y1; y += 3) clicks.push({ type: 'pointerMove', duration: 0, origin: 'viewport', x: geo.x, y }, { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 20 }, { type: 'pointerUp', button: 0 });
  await wd('POST', `/session/${g.s}/actions`, { actions: [{ type: 'pointer', id: 'r11c', parameters: { pointerType: 'mouse' }, actions: clicks }] });
  await wd('DELETE', `/session/${g.s}/actions`);
  const afterClicks = await g.ev(`${HELP} await frames(2); return __LW.orbitals.state().selection.map((q) => q.k);`);
  const drag = [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: geo.x, y: geo.y0 }, { type: 'pointerDown', button: 0 }];
  for (let y = geo.y0 + 6; y <= geo.y1; y += 6) drag.push({ type: 'pointerMove', duration: 16, origin: 'viewport', x: geo.x, y });
  drag.push({ type: 'pointerUp', button: 0 });
  await wd('POST', `/session/${g.s}/actions`, { actions: [{ type: 'pointer', id: 'r11d', parameters: { pointerType: 'mouse' }, actions: drag }] });
  await wd('DELETE', `/session/${g.s}/actions`);
  const r11d = await g.ev(`${HELP} await frames(2); const st = __LW.orbitals.state(); return { sel: st.selection.map((q) => q.k), cols: __LW.orbitals.solution().cols.slice(), refusal: st.refusal, rungs: st.rungs.length };`);
  const r11v = await g.ev(`${HELP} const v = __LW.chem.state().view; __LW.chem.setView('density'); await frames(2); document.querySelector('.dev[data-id="chem"] .mol-view').scrollIntoView({ block: 'center' }); await frames(2); return v;`);
  const tapOn = await g.tap('.dev[data-id="chem"] .mol-view .seg-b:nth-child(3)');   // VIEW REGISTRY, a real press
  const r11e = await g.ev(`${HELP} await frames(4); const st = __LW.orbitals.state(); const out = { view: __LW.chem.state().view, on: __LW.orbitals.on, refusal: st.refusal, status: st.status, sel: __LW.molsession.state().selected, errs: window.__e.slice() };
    __LW.chem.setView('density'); return out;`);
  judge('R11 C₆₀ by hand: ' + clicks.length / 4 + ' clicks and a drag down the whole ladder put only carried levels (cols 175–182) in the register (the strokes picked VIEW REGISTRY), and a real press of VIEW REGISTRY is answered, not refused',
    afterClicks.every((k) => r11d.cols.includes(k)) && r11d.sel.length > 0 && r11d.sel.every((k) => r11d.cols.includes(k)) && r11d.refusal === null && r11v === 'registry'
      && tapOn.ok === 1 && r11e.view === 'registry' && r11e.on === true && r11e.refusal === null && r11e.sel === 'orbital-packet' && r11e.errs.length === 0, { afterClicks, r11d, r11v, tapOn, r11e });

  /* ── R12 · STATES ANSWERS (0.5.3 M3): the sentence on the switch, a hand's ON over S₀ alone plays BEAT, and ONE re-arm seat — the
         ladder's landing — for a re-solve under ON, an ON refused while the ladder is out, and a parked record that was ON ──────────── */
  const SWQ = `.dev[data-id="chem"] .mol-view .seg-b:nth-child(3)`;   // VIEW REGISTRY (iteration 008 U: the register's ON)
  const r12a = await g.ev(`${HELP}
    __LW.chem.setView('density'); __LW.register.setMode('states'); await wait(() => __LW.states.state().refusal && /frontier orbitals only/.test(__LW.states.state().refusal));
    const fb = document.querySelector('.dev[data-id="chem"] .reg-pane:not([hidden]) .reg-fill'), says = { status: __LW.states.state().status, fill: !!(fb && fb.disabled) };
    await __LW.chem.solve('H2O'); await wait(() => __LW.states.ladder() && __LW.states.ladder().count === 10); await frames(2);
    __LW.states.clear(); await frames(2); document.querySelector('${SWQ}').scrollIntoView({ block: 'center' });
    return { says, back: !fb.disabled && fb.getAttribute('aria-label'), lanes0: __LW.states.state().lanes.length };`);
  const tapStates = await g.tap(SWQ);
  const r12b = await g.ev(`${HELP} await frames(2); const banner = __LW.stageText.banner; await ready(); await frames(2);
    const st = __LW.states.state(); return { on: st.on, lanes: st.lanes.map((l) => l.label), banner, sel: __LW.molsession.state().selected };`);
  judge('R12 STATES says why (C₆₀: the worker\'s sentence on its status line, FILL ALL stood down; water: FILL ALL again), and a hand\'s VIEW REGISTRY over S₀ alone plays BEAT',
    /frontier orbitals only/.test(r12a.says.status) && r12a.says.fill === true && r12a.back === 'FILL ALL' && r12a.lanes0 === 1
      && tapStates.ok === 1 && r12b.on === true && r12b.lanes.length === 2 && r12b.lanes[0] === 'S₀' && r12b.banner === 'BEAT' && r12b.sel === 'states', { r12a, tapStates, r12b });
  const r12c = await g.ev(`${HELP}
    const L0 = __LW.states.ladder().count; await __LW.chem.solve('NH3');
    const back = await wait(() => __LW.states.ladder() && __LW.states.ladder().count !== L0 && __LW.states.on && __LW.states.state().lanes.length === 2); await ready();
    const re = { on: __LW.states.on, lanes: __LW.states.state().lanes.map((l) => l.label), sel: __LW.molsession.state().selected };
    __LW.chem.setView('density'); let hit = null;
    const un = __LW.chem.subscribe((s) => { if (s && /^C6H6\\|/.test(s.key) && !hit) hit = { ladder: !!__LW.states.ladder(), on: __LW.states.setOn(true), status: __LW.states.state().status }; });
    await __LW.chem.solve('C6H6'); await wait(() => __LW.states.ladder() && __LW.states.ladder().count === 315 && __LW.states.on); un();
    const refused = { hit, on: __LW.states.on, lanes: __LW.states.state().lanes.map((l) => l.label) };
    await __LW.chem.solve('H2O'); await wait(() => __LW.states.ladder() && __LW.states.ladder().count === 10);
    __LW.chem.setView('density'); __LW.states.preset('BEAT'); await ready(); const rec = __LW.states.save(); let parked = null;
    await __LW.chem.solve('NH3'); await wait(() => __LW.states.ladder() && __LW.states.ladder().count !== 10);
    const un2 = __LW.chem.subscribe((s) => { if (s && /^H2O\\|/.test(s.key) && !parked) parked = { ladder: !!__LW.states.ladder(), load: __LW.states.load({ ...rec, on: true }), on: __LW.states.on }; });
    await __LW.chem.solve('H2O');
    await wait(() => __LW.states.ladder() && __LW.states.on); await ready(); un2();
    const loaded = { parked, on: __LW.states.on, lanes: JSON.stringify(__LW.states.save().lanes) === JSON.stringify(rec.lanes) };
    __LW.chem.setView('density');
    return { back: !!back, re, refused, loaded, errs: window.__e.slice() };`);
  judge('R12 ONE re-arm seat: a re-solve under ON comes back ON (BEAT on the new ladder); an ON refused while the ladder is out, and a parked record that was ON, come ON when it lands',
    r12c.back && r12c.re.on && r12c.re.lanes.length === 2 && r12c.re.sel === 'states'
      && r12c.refused.hit && r12c.refused.hit.ladder === false && r12c.refused.hit.on === false && /ON when it lands/.test(r12c.refused.hit.status) && r12c.refused.on === true && r12c.refused.lanes.join() === 'S₀'
      && r12c.loaded.parked && r12c.loaded.parked.ladder === false && r12c.loaded.parked.load === true && r12c.loaded.on === true && r12c.loaded.lanes && r12c.errs.length === 0, r12c);

  /* ── R13 · THE EIGHT ORBITAL PRESETS (0.5.3 M10), one table: on water each takes its levels or refuses with its sentence; on C₆₀
         every one stays inside the record's columns (0.6.1 F1: the 180 occupied + the LUMO set, so OCCUPIED works there too) ─────────────────────────────── */
  const r13 = await g.ev(`${HELP}
    __LW.register.setMode('orbital'); const opts = [...document.querySelector('.dev[data-id="chem"] .reg-bar select.sel').options].map((o) => o.value).filter(Boolean);
    const run = () => Object.fromEntries(opts.map((p) => { const ok = __LW.orbitals.preset(p), st = __LW.orbitals.state();
      return [p, ok ? st.selection.map((q) => q.k + ':' + q.amp.toFixed(4) + (q.phase ? '@' + q.phase.toFixed(4) : '')).join(' ') : 'refused · ' + st.status]; }));
    await __LW.chem.solve('H2O'); await wait(() => __LW.orbitals.solution() && __LW.orbitals.solution().nAO === 7); const water = run();
    await __LW.chem.solve('C60'); await wait(() => __LW.orbitals.solution() && __LW.orbitals.solution().cols); const c60 = run(), cols = __LW.orbitals.solution().cols.slice();
    const on = __LW.orbitals.preset('FRONTIER FOUR') && __LW.orbitals.setOn(true); await frames(3); const st = __LW.orbitals.state(); __LW.chem.setView('density');
    return { opts, water, c60, cols, on, refusal: st.refusal, errs: window.__e.slice() };`);
  const ks = (v) => (v.startsWith('refused') ? null : v.split(' ').map((t) => +t.split(':')[0]));
  const inCols = Object.values(r13.c60).filter((v) => !v.startsWith('refused')).every((v) => ks(v).every((k) => r13.cols.includes(k)));
  judge('R13 eight ORBITAL presets from one table: water takes HOMO 4 · LUMO 5 · FRONTIER FOUR 3–6 · OCCUPIED 1–4 (equal |c|, equal phase) and refuses WINDING with its sentence; on C₆₀ every preset stays inside the record\'s columns (the frontier eight at 175–182; 0.6.1: all 183) and OCCUPIED takes the 120 valence orbitals 60–179; ON is answered',
    r13.opts.slice(0, 8).join('|') === 'HOMO|LUMO|HOMO + LUMO|FRONTIER FOUR|HOMO SET|LUMO SET|WINDING|OCCUPIED'
      && r13.water['HOMO'] === '4:1.0000' && r13.water['LUMO'] === '5:1.0000' && r13.water['HOMO + LUMO'] === '4:0.7071 5:0.7071'
      && r13.water['FRONTIER FOUR'] === '3:0.5000 4:0.5000 5:0.5000 6:0.5000' && r13.water['HOMO SET'] === '4:1.0000' && r13.water['LUMO SET'] === '5:1.0000'
      && /^refused · WINDING: no degenerate orbital pair/.test(r13.water['WINDING']) && r13.water['OCCUPIED'] === '1:0.5000 2:0.5000 3:0.5000 4:0.5000'
      && inCols && ks(r13.c60['HOMO SET']).every((k) => k < 180) && ks(r13.c60['HOMO SET']).includes(179) && ks(r13.c60['LUMO SET']).every((k) => k >= 180) && ks(r13.c60['LUMO SET']).includes(180)
      && ks(r13.c60['FRONTIER FOUR']).join() === '178,179,180,181' && (() => { const k = ks(r13.c60['OCCUPIED']); return k && k.length === 120 && k[0] === 60 && k[119] === 179; })()   /* 0.6.1 F1: the record carries every occupied column, so OCCUPIED takes the 120 valence orbitals 60–179 (the core 60 frozen), as water takes 1–4 */
      && r13.on === true && r13.refusal === null && r13.errs.length === 0, r13);

  /* iteration 012 R2 · the seven more from the same table, on water (core 0, valence lines 1–6, no degenerate level); INVERT runs last, over VIRTUAL's 5–6 */
  judge('R13b ALL ODD 1·3·5 · ALL EVEN 2·4·6 · BELOW HOMO 1–3 · ABOVE LUMO 6 · VIRTUAL 5–6 on water, DEGENERATE refused with its sentence, INVERT the complement 0–4',
    r13.opts.slice(8).join('|') === 'ALL ODD|ALL EVEN|BELOW HOMO|ABOVE LUMO|VIRTUAL|DEGENERATE|INVERT'
      && r13.water['ALL ODD'] === '1:0.5774 3:0.5774 5:0.5774' && r13.water['ALL EVEN'] === '2:0.5774 4:0.5774 6:0.5774'
      && r13.water['BELOW HOMO'] === '1:0.5774 2:0.5774 3:0.5774' && r13.water['ABOVE LUMO'] === '6:1.0000' && r13.water['VIRTUAL'] === '5:0.7071 6:0.7071'
      && /^refused · DEGENERATE: no degenerate level/.test(r13.water['DEGENERATE']) && r13.water['INVERT'] === '0:0.4472 1:0.4472 2:0.4472 3:0.4472 4:0.4472', r13.water);

  const errs = await g.ev('return { errs: window.__e.slice(), gpu: __LW.field.lastGpuError || null };');
  judge('RZ no page error and no GPU error at any step', errs.errs.length === 0 && !errs.gpu, errs);
} catch (error) {
  judge('gate ran to the end', false, String(error && error.message || error).slice(0, 400));
} finally { await g.close(); }
process.exit(done('register') ? 1 : 0);
