/* tools/perf/film-bake.mjs (025 B) — THE FILM IS THE SCREEN, measured: the film's own determinism (`__LW.captureUI.exact.verify`: one short schedule
 * rendered twice through the kit's recorder, digest against digest) with the graph EMPTY and with CURVES + FILM GRAIN + DECOHERE, and a frame of a
 * baked film beside the stage's screenshot at the same t (B-shots); `overlays` (B2: VORTEX + PARTICLES) and `words` (B3: H₂O under ESP).
 *   LW_PORT=9691 GD_PORT=5691 node tools/perf/film-bake.mjs [steps: empty,graph,nodes,shaders,overlays,words,shot] [out-dir for the shots]
 */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '9691';
const STEPS = (process.argv[2] || 'empty,graph').split(',');
const DIR = process.argv[3] || 'research/iteration-025/B-shots';
const PRESET = process.env.PRESET || '1s%2B2pz';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=${PRESET}&sw=0`, { width: 1280, height: 800, script: 900000,
  prefs: { 'privacy.reduceTimerPrecision': false, 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
const out = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    __LW.pause(); __LW.scrub(0.5); await __LW.settle(); await __LW.settle(); return 1;`);
  const verify = `const v = await __LW.captureUI.exact.verify({ frames: 6, width: 320 }); const L = __LW.captureUI.exact.last;
    return { ok: v.ok, message: v.message, digests: v.digests, mismatches: v.mismatches, baked: L && L.baked };`;
  if (STEPS.includes('empty')) { out.empty = await g.ev(`__LW.nodes.setOff(false); for (const n of __LW.nodes.nodes()) __LW.nodes.remove(n.id); await __LW.settle(); ${verify}`); console.log('empty', JSON.stringify(out.empty)); }
  if (STEPS.includes('graph') || STEPS.includes('nodes')) {
    out.graph0 = await g.ev(`__LW.nodes.setHas(true); __LW.curves.preset('MASTER', 'S'); __LW.nodes.add('grain'); __LW.nodes.add('decohere');
      await new Promise((r) => setTimeout(r, 400)); await __LW.settle(); return __LW.nodes.nodes().map((n) => n.type + (n.bypass ? '×' : ''));`);
    console.log('graph', JSON.stringify(out.graph0));
  }
  if (STEPS.includes('graph')) {
    out.graphA = await g.ev(verify); console.log('graphA', JSON.stringify(out.graphA));
    out.graphB = await g.ev(verify); console.log('graphB', JSON.stringify(out.graphB));
    out.sameAcross = JSON.stringify(out.graphA.digests) === JSON.stringify(out.graphB.digests);
    console.log('two verify calls (four runs) agree:', out.sameAcross);
  }
  /* 027 N4 · the three stateful/splat SHADER nodes: FEEDBACK + REFRACT + FLOW, the film's own state from black at frame 0 — two calls, four runs */
  if (STEPS.includes('shaders')) {
    out.shaders0 = await g.ev(`__LW.nodes.setOff(false); for (const n of __LW.nodes.nodes()) __LW.nodes.remove(n.id);
      for (const t of ['feedback', 'refract', 'flow']) __LW.nodes.add(t);
      await new Promise((r) => setTimeout(r, 400)); await __LW.settle(); return __LW.nodes.nodes().map((n) => n.type);`);
    console.log('shaders', JSON.stringify(out.shaders0));
    out.shadersA = await g.ev(verify); console.log('shadersA', JSON.stringify(out.shadersA));
    out.shadersB = await g.ev(verify); console.log('shadersB', JSON.stringify(out.shadersB));
    console.log('shaders: two verify calls (four runs) agree:', JSON.stringify(out.shadersA.digests) === JSON.stringify(out.shadersB.digests));
  }
  /* B2 · the overlays: VORTEX raised, PARTICLES on and seeded, VORTEX's LOCATE + OVERLAY pressed */
  if (STEPS.includes('overlays')) {
    out.overlays0 = await g.ev(`__LW.layout.raise('vortex'); await new Promise((r) => setTimeout(r, 300));
      const w = document.querySelector('.dev[data-id="vortex"]'); w.classList.remove('closed', 'folded');
      const sw = (n) => [...w.querySelectorAll('.sw')].find((e) => (e.querySelector('.sw-lbl') || {}).textContent === n);
      for (const n of ['LOCATE', 'OVERLAY']) { const e = sw(n); if (e) (e.querySelector('button') || e).click(); }
      __LW.particles.setOn(true); __LW.particles.seed(120, __LW.reg, __LW.clock.t, __LW.domain.half); __LW.schedule(__LW.TIER.PRESENT);
      await new Promise((r) => setTimeout(r, 800)); await __LW.settle();
      return { particles: __LW.particles.on, vortex: !!__LW.vortex.last, cv: ['vortex', 'particles'].map((id) => document.getElementById(id).width), theme: document.body.dataset.theme };`);
    fs.writeFileSync('.tmp/ov0.png', Buffer.from(await g.snap(), 'base64'));
    console.log('overlays', JSON.stringify(out.overlays0));
    out.overlaysA = await g.ev(verify); out.overlaysB = await g.ev(verify);
    fs.writeFileSync('.tmp/ov1.png', Buffer.from(await g.snap(), 'base64'));
    out.overlays1 = await g.ev(`const a = __LW.field.stats.presents; __LW.schedule(__LW.TIER.PRESENT); await new Promise((r) => setTimeout(r, 500)); return { dpr: window.devicePixelRatio, cv: [__LW.field.canvas.width, __LW.field.canvas.height], presents: [a, __LW.field.stats.presents], sched: __LW.stats.scheduled, e: (window.__e || []).slice(-3).map(String), fault: __LW.stats.fault || null, lf: __LW.stats.loopFault || null };`);
    console.log('after the films', JSON.stringify(out.overlays1));
    console.log('overlaysA', JSON.stringify(out.overlaysA)); console.log('overlays two calls agree:', JSON.stringify(out.overlaysA.digests) === JSON.stringify(out.overlaysB.digests));
  }
  /* B3 · the words: MOLECULES on (H₂O), STYLE ESP — the ATOM LABELS and the ESP BAR */
  if (STEPS.includes('words')) {
    out.words0 = await g.ev(`const L = __LW, nap = (ms) => new Promise((r) => setTimeout(r, ms));
      L.chem.setOn(true); for (let i = 0; i < 80 && !(L.chem.on && L.chem.row()); i++) await nap(100); L.setStyle('esp'); await nap(900); await L.settle();
      return { on: L.chem.on, labels: !document.getElementById('atomLabels').hidden, bar: !!document.querySelector('.lw-espbar:not([hidden])') };`);
    console.log('words', JSON.stringify(out.words0));
    out.wordsA = await g.ev(verify); out.wordsB = await g.ev(verify);
    console.log('wordsA', JSON.stringify(out.wordsA)); console.log('words two calls agree:', JSON.stringify(out.wordsA.digests) === JSON.stringify(out.wordsB.digests));
  }
  if (STEPS.includes('shot')) {
    fs.mkdirSync(DIR, { recursive: true });
    await g.ev(`__LW.schedule(__LW.TIER.PRESENT); await new Promise((r) => setTimeout(r, 500)); await __LW.settle(); return 1;`);   // a paused stage after a film waits for a present (seen at 2fda4dc7 too)
    const b64 = await g.snap();
    fs.writeFileSync(DIR + '/.stage.png', Buffer.from(b64, 'base64'));
    const r = await g.ev(`const F = __LW.captureUI.exact, cv = __LW.field.canvas, W = cv.clientWidth & ~1;
      const s = F.laws.exactSchedule({ mode: 'loop', T: 1, t0: __LW.clock.t, fps: 30, frames: 1 });
      const r = await F.render({ schedule: s, width: W, format: 'png' }).done; if (!r.ok) return { E: r.error || r.message };
      const z = await import('/lab/mir/core/zip.js'), m = z.readStoredZip(new Uint8Array(await r.files[0].blob.arrayBuffer()));
      const png = [...m.keys()].find((n) => /\\.png$/.test(n)), bm = await createImageBitmap(new Blob([m.get(png)], { type: 'image/png' }));
      const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0);
      await F.discard(r); return { w: bm.width, h: bm.height, t: r.manifest.frames[0].t, digest: r.manifest.frames[0].digest, jpg: c.toDataURL('image/jpeg', 0.82).split(',')[1], baked: r.manifest.picture.baked };`);
    if (r.E) console.log('shot', r.E);
    else { fs.writeFileSync(DIR + '/.film.jpg', Buffer.from(r.jpg, 'base64')); delete r.jpg; console.log('shot', JSON.stringify(r)); }
  }
} finally { await g.close(); }
