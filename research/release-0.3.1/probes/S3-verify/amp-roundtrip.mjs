// Is the reg.amp2 base lost across a project round trip S3's doing?  Run against the S3 tree (LW_PORT=8745) and a pre-S3 copy
// (6c2740f's rack.js/history.js/sw.js over the same lab/, LW_PORT=8746).  STATES lanes, reg.amp2 routed to an LFO-bound macro, playing;
// save → open → save; compare modulationBases['reg.amp2'] and the lanes.
import { lab } from './kit.mjs';
const g = await lab();
try {
  const r = await g.run(`__LW.chem.setOn(true); for (let i = 0; i < 100 && !(__LW.orbitals.ladder && __LW.orbitals.ladder()); i++) await __w(100);
    __LW.register.setMode('states'); await __w(300); for (let i = 0; i < 60; i++) { __LW.states.setOn && __LW.states.setOn(true); if (document.querySelectorAll('.dev[data-id="orbitals"] .sp-row').length) break; await __w(150); }
    __LW.states.select(1, 0.45, 0.3); __LW.states.select(2, 0.3, 1.1); await __w(600);
    const M = __LW.mod.model, R = __LW.mod.registry, lfo = M.sourceList().find((s) => s.kind === 'lfo'), m1 = M.macroList()[0].id;
    __LW.mod.bind(m1, lfo.id); __LW.mod.route(m1, 'reg.amp2', 0, 1); await __w(300);
    const P = __LW.layout.projects, key = 'lambdawaves.q0.projects', read = (p) => JSON.parse(localStorage.getItem(key)).items[p].data;
    const paused = {}; P.save('probe/p1'); paused.saved = read('probe/p1').presentation.modulationBases['reg.amp2'];
    { const c0 = window.confirm; window.confirm = () => true; P.open('probe/p1'); window.confirm = c0; } await __w(1500);
    paused.baseAfterOpen = R.baseOf('reg.amp2'); P.save('probe/p2'); paused.resaved = read('probe/p2').presentation.modulationBases['reg.amp2'];
    paused.lanesAfterOpen = __LW.serialize().presentation.instruments.states.lanes.map((l) => +l.amp.toFixed(4));
    __LW.play(); await __w(1500);
    const playing = { liveLane1: +__LW.serialize().presentation.instruments.states.lanes[1].amp.toFixed(4), base: R.baseOf('reg.amp2') };
    P.save('probe/q1'); playing.saved = read('probe/q1').presentation.modulationBases['reg.amp2']; playing.savedLane1 = read('probe/q1').presentation.instruments.states.lanes[1].amp;
    { const c0 = window.confirm; window.confirm = () => true; P.open('probe/q1'); window.confirm = c0; } await __w(1500);
    playing.baseAfterOpen = R.baseOf('reg.amp2'); P.save('probe/q2'); playing.resaved = read('probe/q2').presentation.modulationBases['reg.amp2'];
    __LW.pause();
    return { build: __LW.build, s3: typeof __LW.serialize({ scope: 'edit' }).presentation.layout === 'undefined', paused, playing, errs: __e.slice() };`);
  console.log(JSON.stringify(r));
} finally { await g.close(); }
