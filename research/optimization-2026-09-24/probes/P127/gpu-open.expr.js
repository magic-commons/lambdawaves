/* gpu-open.expr.js — wave 127: the frames after a project open, one variant of the WAVE DANCER file per run (a fresh page).
 * window.__V127 (set by the caller's prefix) names the variant: 'full' | 'noui' | 'nolayout' | 'nopalette' | 'nomod' | 'uionly' |
 * 'theme' (no open: setTheme('dark') alone) | 'look' (no open: the file's ui block through the public setters).  Playing, as the device
 * report's scene: each frame's submit time, encode ms, reconstructed/presented, and the GPU completion after its submit. */
(async () => {
  const V = window.__V127 || 'full';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const LW = __LW, field = LW.field, dev = field.device;
  LW.pause(); await LW.settle(); await sleep(1500);
  const text = await (await fetch('demos/wave-dancer.lambdawaves.json')).text();
  const f = JSON.parse(text), p = f.data.presentation;
  if (V === 'noui') delete p.ui;
  if (V === 'nolayout') { delete p.layout; delete p.notebook; }
  if (V === 'nopalette') { delete p.palette; delete p.paletteId; }
  if (V === 'nomod') { delete p.modulation; delete p.modwin; }
  if (V === 'uionly') f.data = { experiment: f.data.experiment, presentation: { ui: p.ui } };
  const path = (V === 'theme' || V === 'look') ? null : LW.projects.importText(JSON.stringify(f));
  LW.play(); await sleep(2000);
  const frames = [], of = field.frame, st = field.stats; let T0 = performance.now();
  field.frame = function (a) {
    const t = performance.now(), p0 = st.presents, r0 = st.reconstructs, fl = field.inFlight;
    const r = of.call(this, a);
    const t1 = performance.now(), rec = { at: +(t - T0).toFixed(1), enc: +(t1 - t).toFixed(2), rc: st.reconstructs > r0, pr: st.presents > p0, fl, cv: field.canvas.width + 'x' + field.canvas.height, as: LW.quality.autoScale, done: null };
    frames.push(rec); dev.queue.onSubmittedWorkDone().then(() => { rec.done = +(performance.now() - t1).toFixed(1); });
    return r;
  };
  await sleep(600);                                       // a steady window before the open (negative `at`)
  const pre = frames.splice(0).map((x) => x.done).filter(Number.isFinite);
  performance.mark('lw127-open'); T0 = performance.now();
  let ok = null;
  if (V === 'theme') LW.setTheme('dark');
  else if (V === 'look') { const U = p.ui; LW.setTheme(U.theme); LW.setCardStyle(U.card); LW.setFrost(U.frost); LW.setDisconnected(U.disc); LW.accent.set(U.accent.a, U.accent.b); }
  else ok = LW.projects.open(path);
  const sync = +(performance.now() - T0).toFixed(1); performance.mark('lw127-open-end');
  const t1 = performance.now(); void document.body.offsetHeight; const sl = +(performance.now() - t1).toFixed(1);
  const i0 = performance.now(); dev.queue.submit([dev.createCommandEncoder().finish()]);
  let idle0 = null; dev.queue.onSubmittedWorkDone().then(() => { idle0 = +(performance.now() - i0).toFixed(1); });
  await sleep(1500);
  field.frame = of;
  const preSorted = pre.sort((a, b) => a - b);
  return { V, ok, sync, styleLayout: sl, idleAfterOpen: idle0, preDoneMedian: preSorted[preSorted.length >> 1], preDoneMax: preSorted[preSorted.length - 1],
    frames: frames.slice(0, 10), maxDone: Math.max(...frames.map((x) => x.done || 0)), theme: LW.theme, card: LW.cardStyle, frost: LW.frost, disc: LW.disconnected };
})()
