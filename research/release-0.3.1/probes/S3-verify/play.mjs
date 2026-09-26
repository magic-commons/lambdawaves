// VERIFY item 3 (zero rows during play: default 5 s, WAVE DANCER 30 s with its LFO routes, MOLECULES + RT 5 s — rows, canUndo AND
// whether the edit scope itself drifts, sampled every 500 ms) and item 4 (undo while playing: transport, LFO continuity, routed exposure;
// a route ADD undone while playing; a hand turn of a routed knob), plus item 4 with LINKED time off (a preference).
import { lab } from './kit.mjs';
const g = await lab();
const out = {};
const playFor = (ms, label) => g.run(`const H = __LW.history; await __settle(); const n0 = H.entries().length, c0 = H.canUndo, s0 = __ser();
  let saves = 0; const sv = __LW.chem.save; __LW.chem.save = function () { saves++; return sv.apply(this, arguments); };
  __LW.play(); const drift = []; const t0 = performance.now();
  while (performance.now() - t0 < ${ms}) { await __w(500); const s = __ser(); if (s !== s0 && drift.length < 3) drift.push(__diff(JSON.parse(s0), JSON.parse(s)).slice(0, 4)); }
  const during = { rows: H.entries().length - n0, canUndo: H.canUndo, modPlaying: __LW.mod.playing, fieldPlaying: __LW.clock.playing };
  __LW.chem.save = sv; __LW.pause(); await __w(600);
  return { label: ${JSON.stringify(label)}, ms: ${ms}, rowsAdded: H.entries().length - n0, canUndoBefore: c0, canUndoAfter: H.canUndo, during, editScopeReadsDuringPlay: saves, drift, errs: __e.slice() };`);
try {
  out.default5 = await playFor(5000, 'default scene, 5 s'); console.log(JSON.stringify(out.default5));
  /* WAVE DANCER */
  out.open = await g.run(`const P = __LW.layout.projects, c0 = window.confirm; window.confirm = () => true;
    const r = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); window.__dancer = P.importText(await r.text()); const ok = P.open(window.__dancer); window.confirm = c0; await __w(1500);
    return { ok, rows: __rows(), routes: __LW.mod.model.routeList().map((r) => r.targetId), sources: __LW.mod.model.sourceList().map((s) => s.kind), link: __LW.mod.clockLink };`);
  console.log('open', JSON.stringify(out.open));
  out.dancer30 = await playFor(30000, 'WAVE DANCER, 30 s'); console.log(JSON.stringify(out.dancer30));

  out.dancerReads = await g.run(`await __settle(); let saves = 0; const sv = __LW.chem.save; __LW.chem.save = function () { saves++; return sv.apply(this, arguments); };
    const n0 = __LW.history.entries().length; __LW.play(); await __w(5000); __LW.pause(); await __w(100); __LW.chem.save = sv; return { saves, rows: __LW.history.entries().length - n0 };`);
  console.log('WAVE DANCER 5 s, no sampling: edit-scope reads', JSON.stringify(out.dancerReads));
  /* ITEM 4a · an unrelated LOOK edit (STYLE via its segment) undone while WAVE DANCER plays, the modulation window open */
  const u4 = (clockLink) => g.run(`const H = __LW.history, M = __LW.mod.model, R = __LW.mod.registry; __LW.mod.clockLink = ${clockLink}; __LW.layout.modulation.expand(); await __w(400);
    __LW.play(); if (!${clockLink}) __LW.mod.clock.play(); await __w(1500); await __settle();
    const sample = () => ({ t: performance.now(), playing: __LW.mod.playing, macros: M.macroList().map((m) => +(+m.value).toFixed(4)), exposure: +__LW.mat.exposure.toFixed(4), expBase: +R.baseOf('material.exposure').toFixed(4) });
    const seq = []; for (let i = 0; i < 4; i++) { seq.push(sample()); await __w(50); }
    const seg = __segb('STYLE', __LW.mat.style === 1 ? 'CLOUD' : 'SOLID', 'observer'); __show(seg); await __spress(seg); await __w(500); H.flush();
    const rowName = __rows().slice(-1)[0];
    const pre = sample(); const run = document.querySelector('#modwin .m2run'), dev0 = run && run.querySelector('.m2dev');
    const t0 = performance.now(); const undid = H.undo(); const ms = performance.now() - t0; const post = sample();
    await new Promise((r) => requestAnimationFrame(r)); const frame = sample();
    await __w(600); const later = sample();
    const res = { clockLink: ${clockLink}, rowName, undid, undoMs: +ms.toFixed(2), sameDevNode: run ? dev0 === run.querySelector('.m2dev') : null, seq, pre, post, frame, later };
    /* ITEM 4b · a route ADD (MACRO 1 → the first unmodulated of STAGE / KNEE / GRAIN) undone while it plays */
    const T = ['material.stage', 'material.knee', 'material.grain'].find((id) => !R.isModulated(id)), KL = { 'material.stage': 'STAGE', 'material.knee': 'KNEE', 'material.grain': 'GRAIN' }[T];
    const live = () => T === 'material.stage' ? +__LW.serialize().presentation.ui.stage.mix : +__LW.mat[T.split('.')[1]];
    if (T === 'material.stage') __LW.setStage(0.3); await __settle(); const m1 = M.macroList()[0].id, base0 = R.baseOf(T), live0 = live();
    __LW.mod.route(m1, T, 0, 1); await __w(700); H.flush();
    const routed = { T, base0, live0, live: live(), base: R.baseOf(T), modulated: R.isModulated(T), playing: __LW.mod.playing, row: __rows().slice(-1)[0] };
    H.undo(); const undone0 = { live: live(), base: R.baseOf(T), modulated: R.isModulated(T), playing: __LW.mod.playing };
    await __w(400); const undone = { live: live(), base: R.baseOf(T), modulated: R.isModulated(T), playing: __LW.mod.playing, macroMoving: null };
    { const a = M.macroList().map((m) => m.value).join(); await __w(300); undone.macroMoving = M.macroList().map((m) => m.value).join() !== a; }
    H.redo(); await __w(500); const redone = { live: live(), base: R.baseOf(T), modulated: R.isModulated(T), playing: __LW.mod.playing };
    /* the hand turns the routed knob: its base moves, and the undo gives the base back */
    const k = __show(__knob(KL)); await __w(80); const b0 = R.baseOf(T); await __sdrag(k.querySelector('.k-dial'), 0, -40); await __w(550); H.flush();
    const handRow = __rows().slice(-1)[0], b1 = R.baseOf(T); H.undo(); await __w(300); const b2 = R.baseOf(T), stillPlaying = __LW.mod.playing;
    __LW.pause(); __LW.mod.clock.pause(); await __w(400); __LW.mod.clockLink = true;
    { const c0 = window.confirm; window.confirm = () => true; __LW.layout.projects.open(window.__dancer); window.confirm = c0; await __w(1200); }
    return { ...res, routed, undone0, undone, redone, hand: { row: handRow, base0: b0, baseAfterHand: b1, baseAfterUndo: b2, stillPlaying }, errs: __e.slice() };`);
  out.u4linked = await u4(true); console.log('4 linked', JSON.stringify(out.u4linked));
  out.u4free = await u4(false); console.log('4 free', JSON.stringify(out.u4free));

  /* MOLECULES on + RT: 5 s */
  out.chemSetup = await g.run(`const c0 = window.confirm; window.confirm = () => true; await __LW.layout.projects.fresh(); window.confirm = c0; await __w(800);
    __LW.chem.setOn(true); for (let i = 0; i < 100 && !(__LW.orbitals.ladder && __LW.orbitals.ladder()); i++) await __w(100); await __w(500);
    let run = null; try { run = __LW.chem.setRun ? __LW.chem.setRun(true) : 'no setRun'; } catch (e) { run = 'threw ' + e.message; } await __w(1500);
    return { on: __LW.chem.on, run, rows: __rows() };`);
  console.log('chem setup', JSON.stringify(out.chemSetup));
  out.chem5 = await playFor(5000, 'MOLECULES + RT, 5 s'); console.log(JSON.stringify(out.chem5));
  out.chemRtOnly = await g.run(`const H = __LW.history; await __settle(); const n0 = H.entries().length, s0 = __ser(); await __w(5000); const s1 = __ser();
    return { rowsAdded: H.entries().length - n0, canUndo: H.canUndo, drift: s1 === s0 ? [] : __diff(JSON.parse(s0), JSON.parse(s1)).slice(0, 5) };`);
  console.log('chem RT paused-field 5 s', JSON.stringify(out.chemRtOnly));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
