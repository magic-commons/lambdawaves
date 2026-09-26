// VERIFY item 5 (the window SHOWS the redone state: source count and the route RING on the routed dial, .has-ring / svg.k-ring) and
// the doc's "an undo does not move the clock" (paused at t = 5, and while playing).
import { lab } from './kit.mjs';
const g = await lab();
try {
  await g.run(`__LW.layout.modulation.expand(); await __w(600); return 1;`);
  const t = await g.run(`for (const k of [__knob('GRAIN'), __knob('ISO'), __knob('KNEE'), __knob('SOFT')]) { if (!k || !k.dataset.param) continue; __show(k);
      for (const block of ['center', 'start', 'end']) { k.scrollIntoView({ block, behavior: 'instant' }); const b = k.querySelector('.k-dial').getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2, h = document.elementFromPoint(x, y);
        const gr = document.querySelector('#modwin .m2slot .m2grip').getBoundingClientRect(); if (h && k.contains(h)) return { param: k.dataset.param, k: [x, y], g: [gr.left + gr.width / 2, gr.top + gr.height / 2] }; } } return { E: 'no drop target' };`);
  await g.run(`await __settle(); return 1;`);
  const read = `const k = document.querySelector('.k[data-param="${t.param}"]'); return { sources: __LW.mod.model.sourceList().length, devs: document.querySelectorAll('#modwin .m2run .m2dev').length, routes: __LW.mod.model.routeList().map((r) => r.targetId),
    rings: document.querySelectorAll('.has-ring').length, targetRing: !!(k && (k.classList.contains('has-ring') || k.querySelector('.has-ring, svg.k-ring'))), editArc: !!(k && k.querySelector('svg.k-ring .k-ring-edit') && k.querySelector('svg.k-ring .k-ring-edit').getAttribute('d')) };`;
  const r0 = await g.run(read);
  const [gx, gy] = t.g, [kx, ky] = t.k; await g.realDrag(g.line(gx, gy, kx - gx, ky - gy, 12), 0, 30);
  const r1 = await g.run(`await __w(600); __LW.history.flush(); ` + read.replace('return {', 'return { row: __rows().slice(-1)[0],'));
  const u = await g.run(`__LW.history.undo(); await __w(400); ` + read);
  const rr = await g.run(`__LW.history.redo(); await __w(400); ` + read);
  /* the clock across an undo: paused at t = 5, then while playing */
  const clock = await g.run(`const H = __LW.history; __LW.pause(); __LW.clock.scrub(5); await __settle(); __LW.setStage(0.33); H.flush(); const t0 = __LW.clock.t; H.undo(); const t1 = __LW.clock.t;
    __LW.play(); await __w(800); __LW.setStage(0.44); H.flush(); const p0 = __LW.clock.t; H.undo(); const p1 = __LW.clock.t; await __w(300); const p2 = __LW.clock.t, playing = __LW.clock.playing; __LW.pause();
    return { paused: { before: t0, after: t1 }, playing: { before: +p0.toFixed(3), after: +p1.toFixed(3), later: +p2.toFixed(3), stillPlaying: playing } };`);
  console.log(JSON.stringify({ target: t.param, before: r0, afterRoute: r1, afterUndo: u, afterRedo: rr, clock, errs: await g.run(`return __e.slice();`) }, null, 1));
} finally { await g.close(); }
