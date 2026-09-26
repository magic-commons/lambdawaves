// S4 VERIFY item 8 (fresh context): THE ROTATION DRIVE's `driven` = "the last drive tick moved the register".
// (a) ROTATE z 0.3 on 1s+2pz (m = 0: nothing turns): a REAL STAGE knob drag, a palette change, an LFO add → each a named row.
// (b) ROTATE z 0.3 on 2p_x, paused 3 s and playing 3 s → phantom rows; the rate back to 0 → at most one 'rotation drive' row.
// (c) what a hand meets DURING a turning drive: a knob drag and a C key while 2p_x turns, then Ctrl+Z — what survives?
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/drive.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = {};
const blur = () => g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
const knobAt = (t) => g.run(`const k = __knob(${JSON.stringify(t)}); if (!k) return null; __show(k); await __w(80); return __at(k);`);
try {
  /* (a) */
  await g.run(`__LW.loadPreset('1s+2pz'); __LW.pause(); await __settle(); __LW.history.clear('probe'); __LW.setRotRate('z', 0.3); await __w(700); __LW.history.flush(); window.__n0 = __LW.history.entries().length; return 1;`);
  out.a0 = await g.run(`return { driving: __LW.rotDriving, rows: __LW.history.entries().map((e) => e.label) };`);
  const st = await knobAt('STAGE');
  await g.realDrag(g.line(st[0], st[1], 0, -40, 10), 0, 40);
  await g.run(`await __w(600); return 1;`);
  await g.run(`const P = __LW.palette; const ids = (P.list ? P.list() : []).map((p) => p.id || p); window.__palIds = ids; const cur = __LW.serialize().presentation.paletteId; const next = ids.find((i) => i !== cur); if (P.select && next) P.select(next); __LW.history.note('PALETTE (probe)'); await __w(600); return 1;`);
  await g.run(`__LW.mod.addSource('lfo'); await __w(600); return 1;`);
  out.a = await g.run(`__LW.history.flush(); return { driving: __LW.rotDriving, rows: __LW.history.entries().slice(window.__n0).map((e) => e.label), palIds: (window.__palIds || []).length };`);
  await g.run(`__LW.setRotRate('z', 0); await __w(700); __LW.history.flush(); return 1;`);
  out.aStop = await g.run(`return __LW.history.entries().slice(window.__n0).map((e) => e.label);`);
  console.log('(a) m = 0 under ROTATE z', JSON.stringify(out.a0), JSON.stringify(out.a), 'after stop', JSON.stringify(out.aStop));
  /* (b) */
  out.b = await g.run(`const H = __LW.history; __LW.loadPreset('2px'); __LW.pause(); await __settle(); H.clear('probe'); const n0 = H.entries().length;
    __LW.setRotRate('z', 0.3); await __w(3000); const paused = { rows: H.entries().length - n0, labels: H.entries().slice(n0).map((e) => e.label), playing: __LW.clock.playing };
    __LW.play(); await __w(3000); const playing = { rows: H.entries().length - n0, labels: H.entries().slice(n0).map((e) => e.label) };
    __LW.pause(); __LW.setRotRate('z', 0); await __w(700); H.flush(); const stopped = H.entries().slice(n0).map((e) => e.label);
    return { paused, playing, stopped };`);
  console.log('(b) 2p_x under ROTATE z', JSON.stringify(out.b));
  /* (b2) the rate set by the REAL knob (ROTATE z dial), turned back to 0 by the API */
  /* (c) a hand during a turning drive, then Ctrl+Z */
  await g.run(`const H = __LW.history; __LW.loadPreset('2px'); __LW.pause(); await __settle(); H.clear('probe'); __LW.setStyle('cloud'); __LW.setRotRate('z', 0.3); H.note('ROTATE (probe)'); await __w(50); H.flush(); await __w(400);
    window.__c0 = { exposure: __LW.serialize().presentation.mat.exposure, style: __LW.mat.style, rows: H.entries().map((e) => e.label) }; return 1;`);
  const ex = await knobAt('EXPOSURE');
  await g.realDrag(g.line(ex[0], ex[1], 0, -60, 10), 0, 40);
  await g.run(`await __w(300); return 1;`); await blur(); await g.key('c');
  out.c1 = await g.run(`await __w(900); const H = __LW.history; return { before: window.__c0, exposure: __LW.serialize().presentation.mat.exposure, style: __LW.mat.style, rows: H.entries().map((e) => e.label), canUndo: H.canUndo, depth: H.depth, cursor: H.cursor };`);
  await blur(); await g.key('z', ['']);
  out.c2 = await g.run(`await __w(700); const H = __LW.history; return { exposure: __LW.serialize().presentation.mat.exposure, style: __LW.mat.style, driving: __LW.rotDriving, rows: H.entries().map((e) => e.label + (e.state === 'current' ? '*' : '')), canRedo: H.canRedo };`);
  await blur(); await g.key('z', ['', '']);
  out.c3 = await g.run(`await __w(700); const H = __LW.history; return { exposure: __LW.serialize().presentation.mat.exposure, style: __LW.mat.style, driving: __LW.rotDriving, rows: H.entries().map((e) => e.label + (e.state === 'current' ? '*' : '')) };`);
  console.log('(c) during a turning drive: after a knob drag + C', JSON.stringify(out.c1));
  console.log('    then Ctrl+Z', JSON.stringify(out.c2));
  console.log('    then Ctrl+Shift+Z', JSON.stringify(out.c3));
  await g.run(`__LW.setRotRate('z', 0); await __w(500); return 1;`);
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
