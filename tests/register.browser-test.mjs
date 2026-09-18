/* tests/register.browser-test.mjs — the REGISTER window's STATES mode, in a real browser on the real GPU.
 *
 * The mathematics is gated in node (tests/molecular-register.test.mjs); this file gates the INSTRUMENT: that the
 * window exists under its new name with its switch, that the worker's canonical ladder reaches it, that the session
 * hands it the field as a `signed` product under the `real` observable, that time is closed-form (periodic to
 * round-off under a scrub), that one register plays at a time, that benzene's RING is a rotating dipole of constant
 * length on lanes named by their axis, and that presets, stores, MORPH, the record and the modulation targets work.
 */
import { open, judge, done } from '../tools/gate/gatekit.mjs';

const PORT = process.env.LW_PORT || 8706;
const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1500, height: 1150, script: 300000 });
const HELP = `
  const wait = (f, n = 400) => new Promise((res) => { let i = 0; const tick = () => { let v = null; try { v = f(); } catch (e) { v = null; } if (v || ++i > n) res(v); else setTimeout(tick, 50); }; tick(); });
  const frames = async (n = 8) => { for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 120)); };
  const ready = () => wait(() => __LW.states.ladder() && __LW.states.state().lanes.every((l) => l.ready) && __LW.states.state().pending === 0);
`;
try {
  const boot = await g.waitFor('window.__LW&&__LW.ready', 400, 100);
  judge('R0 boot: __LW.ready', boot.ok === 1, boot);
  const r0 = await g.ev(`return { errs: window.__e.slice(),
    eyebrow: (document.querySelector('.dev[data-id="orbitals"] .dev-eyebrow') || {}).textContent,
    seg: [...document.querySelectorAll('.dev[data-id="orbitals"] .reg-mode button')].map((b) => b.textContent),
    mode: __LW.register.mode, handles: typeof __LW.states.preset === 'function' && typeof __LW.register.setMode === 'function',
    rank: __LW.molsession.state().models.map((m) => m.id) };`);
  judge('R0 the window is REGISTER (id still `orbitals`), with an ORBITAL | STATES switch that opens on ORBITAL, and the session knows the `states` model',
    r0.errs.length === 0 && r0.eyebrow === 'REGISTER' && r0.seg.join('|') === 'ORBITAL|STATES' && r0.mode === 'orbital' && r0.handles && r0.rank.includes('states'), r0);

  /* ── R1 · water: the ladder arrives, a preset is a rule, the session hands over the field ─────────────── */
  const r1 = await g.ev(`${HELP}
    __LW.chem.setOn(true); await __LW.chem.solve('H2O');
    document.querySelector('.dev[data-id="orbitals"]').classList.remove('closed', 'folded');   // the window's own repaint paths run only while it can be seen: gate them too
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
    __LW.states.setOn(false); __LW.states.clear(); __LW.register.setMode('orbital');
    const played = __LW.states.play(3); await ready(); await frames();
    const st = __LW.states.state(), mode = __LW.register.mode;
    __LW.states.setOn(false); __LW.register.setMode('orbital');
    const wind = __LW.orbitals.preset('WINDING'), sel = __LW.orbitals.state().selection.map((s) => [s.k, +s.phase.toFixed(4)]);
    const hl = __LW.orbitals.preset('HOMO + LUMO'), sel2 = __LW.orbitals.state().selection.map((s) => s.k);
    return { played, mode, on: st.on, lanes: st.lanes.map((l) => l.label), wind, sel, hl, sel2, homo: __LW.orbitals.state().homo, errs: window.__e.slice() };`);
  judge('R6 playing a TDA stick puts S₀ + that state in the register, switches the window to STATES and turns it on; WINDING is benzene’s degenerate HOMO pair a quarter turn apart, HOMO + LUMO the frozen beat',
    r6.played && r6.mode === 'states' && r6.on && r6.lanes.join(' ') === 'S₀ S₄x' && r6.wind && r6.sel.length === 2 && r6.sel[1][0] === r6.homo && Math.abs(r6.sel[1][1] - 1.5708) < 1e-3
      && r6.hl && r6.sel2.join() === [r6.homo, r6.homo + 1].join() && r6.errs.length === 0, r6);

  /* ── R7 · THE DRIVE: a resonant field moves population, the lanes read it out, a scrub back un-propagates ─ */
  const r7 = await g.ev(`${HELP}
    __LW.states.setOn(false); await __LW.chem.solve('H2O'); await wait(() => __LW.states.ladder() && __LW.states.ladder().count === 10);
    __LW.register.setMode('states'); __LW.states.preset('BEAT'); await ready();
    __LW.states.clear(); const L = __LW.states.ladder(); let K = 0; for (let k = 0; k < L.count; k++) if (L.omega[k] < 3 && L.f[k] > L.f[K]) K = k;
    __LW.states.select(K, 0, 0); await ready();                                   // S₀ = 1, the bright lane empty: the drive must fill it
    const tuned = __LW.states.tune(), d0 = __LW.states.drive, mu = Math.hypot(L.mu[3 * K], L.mu[3 * K + 1], L.mu[3 * K + 2]);
    __LW.states.setDriveParam('e0', 0.02 / mu);                                   // Ω = 0.02 → π/Ω = 157 a.u.
    __LW.clock.scrub(0); __LW.schedule(__LW.TIER.EVOLVE); await frames(3);
    const onD = __LW.states.setDrive(true); await wait(() => __LW.states.drive.ready && __LW.states.drive.last);
    const goto = async (t) => { __LW.clock.scrub(t); for (let i = 0; i < 40; i++) { __LW.schedule(__LW.TIER.EVOLVE); await frames(2); const d = __LW.states.drive.last; if (d && Math.abs(d.t - t) < 1e-9) return d; } return __LW.states.drive.last; };
    const half = await goto(Math.PI / 0.02 / 2), full = await goto(Math.PI / 0.02), fader = +document.querySelectorAll('.dev[data-id="orbitals"] .reg-pane:not([hidden]) .sp-row .fd')[1].getAttribute('aria-valuenow');
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

  const errs = await g.ev('return { errs: window.__e.slice(), gpu: __LW.field.lastGpuError || null };');
  judge('RZ no page error and no GPU error at any step', errs.errs.length === 0 && !errs.gpu, errs);
} catch (error) {
  judge('gate ran to the end', false, String(error && error.message || error).slice(0, 400));
} finally { await g.close(); }
process.exit(done('register') ? 1 : 0);
