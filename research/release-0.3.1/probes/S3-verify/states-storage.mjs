// VERIFY item 9: STATES lane seats (reg.amp/ph1–8) are in the edit scope only.  A project with STATES lanes saved → opened → saved
// differs only in layout.at; the same with reg.amp2 routed to a playing LFO; an undo of a lane change (routed lane playing) is
// byte-identical; the edit scope does not drift while the routed lane plays; and what S3's wider seat table changes in a saved file
// (chem.kick / chem.speed / reg.morph / reg.e0 / reg.w now seated at their base when modulated).
import { lab } from './kit.mjs';
const g = await lab();
const out = {};
try {
  out.setup = await g.run(`__LW.chem.setOn(true); for (let i = 0; i < 100 && !(__LW.orbitals.ladder && __LW.orbitals.ladder()); i++) await __w(100);
    __LW.register.setMode('states'); await __w(300); for (let i = 0; i < 60; i++) { __LW.states.setOn && __LW.states.setOn(true); if (document.querySelectorAll('.dev[data-id="orbitals"] .sp-row').length) break; await __w(150); }
    __LW.states.select(1, 0.45, 0.3); __LW.states.select(2, 0.3, 1.1); await __w(500); await __settle();
    return { lanes: __LW.serialize().presentation.instruments.states.lanes.length, on: __LW.chem.on };`);
  const roundTrip = (tag) => g.run(`const P = __LW.layout.projects, key = 'lambdawaves.q0.projects';
    const read = (p) => JSON.parse(localStorage.getItem(key)).items[p];
    const ok1 = P.save('probe/${tag}1'); const A = read('probe/${tag}1');
    const c0 = window.confirm; window.confirm = () => true; const opened = P.open('probe/${tag}1'); window.confirm = c0; await __w(1500);
    const ok2 = P.save('probe/${tag}2'); const B = read('probe/${tag}2');
    const mask = (d) => { const o = JSON.parse(JSON.stringify(d)); if (o.presentation.layout) o.presentation.layout.at = 0; return o; };
    const a = mask(A.data), b = mask(B.data), diff = __diff(a, b);
    const rawDiff = __diff(A.data, B.data);
    return { key, ok1, opened, ok2, sameButAt: diff.length === 0, diff: diff.slice(0, 8), rawDiff: rawDiff.slice(0, 4), lanesSaved: (A.data.presentation.instruments.states || {}).lanes };`);
  out.plain = await roundTrip('st'); console.log('plain round trip', JSON.stringify(out.plain).slice(0, 900));
  /* reg.amp2 routed to an LFO-bound macro, playing */
  out.routed = await g.run(`const M = __LW.mod.model, R = __LW.mod.registry, lfo = M.sourceList().find((s) => s.kind === 'lfo'); const m1 = M.macroList()[0].id;
    __LW.mod.bind(m1, lfo.id); const rid = __LW.mod.route(m1, 'reg.amp2', 0, 1); await __w(300); __LW.play(); await __w(1200);
    const ser = [], live = []; for (let i = 0; i < 6; i++) { ser.push(__ser()); live.push(+__LW.serialize().presentation.instruments.states.lanes[2].amp.toFixed(5)); await __w(200); }
    const lane2 = __LW.serialize({ scope: 'edit' }).presentation.instruments.states.lanes[2];
    return { rid, modulated: R.isModulated('reg.amp2'), base: R.baseOf('reg.amp2'), editAmp: lane2.amp, sqrtBase: Math.sqrt(R.baseOf('reg.amp2')), editDrift: new Set(ser).size, liveAmps: live };`);
  console.log('routed lane', JSON.stringify(out.routed));
  /* an undo of a lane change while that lane is routed and playing: byte-identical (edit scope) */
  out.undoRouted = await g.run(`const H = __LW.history; await __settle(); const pre = __ser();
    __LW.states.setPhase(1, 2.2); await __w(550); H.flush(); const post = __ser(); const rows = __rows().slice(-1);
    H.undo(); await __w(300); const u = __ser(); H.redo(); await __w(300); const r = __ser();
    /* a lane change ON the routed lane (its base, amp of lane 2 via setAmp) */
    await __settle(); const pre2 = __ser(); __LW.states.setAmp(2, 0.5); await __w(550); H.flush(); const post2 = __ser(); H.undo(); await __w(300); const u2 = __ser(); H.redo(); await __w(300); const r2 = __ser();
    return { rows, changed: pre !== post, undoSame: u === pre, redoSame: r === post, undoDiff: u === pre ? [] : __diff(JSON.parse(pre), JSON.parse(u)).slice(0, 4),
      routedLane: { changed: pre2 !== post2, undoSame: u2 === pre2, redoSame: r2 === post2, undoDiff: u2 === pre2 ? [] : __diff(JSON.parse(pre2), JSON.parse(u2)).slice(0, 4), redoDiff: r2 === post2 ? [] : __diff(JSON.parse(post2), JSON.parse(r2)).slice(0, 4) } };`);
  console.log('undo with a routed lane playing', JSON.stringify(out.undoRouted));
  /* the saved file while it plays: the routed lane is NOT seated in a project (by design); round trip still differs only in layout.at? */
  out.savedRouted = await roundTrip('rt'); console.log('routed round trip (playing)', JSON.stringify(out.savedRouted).slice(0, 900));
  await g.run(`__LW.pause(); await __w(300); return 1;`);
  /* S3's wider seat table in a SAVED file: chem.kick routed to the playing LFO — which value does the file keep? */
  out.kick = await g.run(`const M = __LW.mod.model, R = __LW.mod.registry, m1 = M.macroList()[0].id; const has = R.has('chem.kick');
    if (!has) return { has };
    __LW.mod.route(m1, 'chem.kick', 0, 1); __LW.play(); await __w(1200);
    const P = __LW.layout.projects; P.save('probe/kick'); const key = 'lambdawaves.q0.projects';
    const d = JSON.parse(localStorage.getItem(key)).items['probe/kick'].data; const liveKappa = __LW.serialize().presentation.instruments.chem.kappa;
    __LW.pause(); return { has, modulated: R.isModulated('chem.kick'), base: R.baseOf('chem.kick'), savedKappa: d.presentation.instruments.chem.kappa, liveKappa, savedBase: d.presentation.modulationBases && d.presentation.modulationBases['chem.kick'] };`);
  console.log('chem.kick in a saved file', JSON.stringify(out.kick));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
