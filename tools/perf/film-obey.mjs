/* tools/perf/film-obey.mjs (025 B4) — THE OBEDIENCE AUDIT, walked: every row of the RENDER card set through its own controls, a real RENDER pressed,
 * and the card's audit (render-exact.js audit over the kit's result, the frame log and the FILE: film.last.audit) read back, one line per run;
 * then the IMAGE section's scale sizes (×1 … ×4) against the canvas.  The TIMELINE's SELECTION is a drag gesture (the kit's, tested there):
 * here the editor's range() is handed the span a drag would leave.
 *   LW_PORT=9691 GD_PORT=5691 node tools/perf/film-obey.mjs [out.json]
 */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '9691';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1280, height: 800, script: 1800000,
  prefs: { 'privacy.reduceTimerPrecision': false, 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
const out = { runs: [] };
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    window.__w = (ms) => new Promise((r) => setTimeout(r, ms)); window.__R = __LW.render; window.__C = __R.view.controls;
    window.__set = (f, v) => { f.value = v; f.dispatchEvent(new Event('change')); };
    if (__LW.mod.armed) __LW.mod.arm(false);
    const M = __LW.mod.model; for (const a of M.sourceList().filter((x) => x.kind === 'audio' && x.on !== false)) M.setSource(a.id, { on: false });   /* a live input cannot replay */
    __LW.pause(); __LW.scrub(0.5); __LW.layout.raise('render'); await __w(600); await __LW.settle();
    window.__run = async (o) => { const ls = (k, v) => localStorage.setItem('lambdawaves.q0.render.' + k, v);
      for (const [k, f] of [['motion', 'motion'], ['format', 'recFormat'], ['size', 'recSize'], ['fps', 'recFps'], ['duration', 'recDuration'], ['offset', 'recOffset'], ['modulation', 'modSelect'], ['timeline', 'timelineSelect'], ['audio', 'audioSelect']]) if (o[k] !== undefined) __set(__C[f], String(o[k]));
      if (o.nodes) ls('nodes', o.nodes); if (o.chrome) ls('chrome', o.chrome);
      __LW.scrub(0.5); await __LW.settle(); await __w(200);
      const L0 = __LW.captureUI.exact.last; __C.renderBtn.click(); await __w(300);
      for (let i = 0; i < 1500 && (__R.view.state().running || __R.recorder.running()); i++) await __w(200);
      await __w(300); const L = __LW.captureUI.exact.last;
      if (!L || L === L0 || !L.audit) return { o, none: true, status: __R.view.state().status, est: __R.view.state().estimate };
      return { o, ok: L.audit.ok, lies: L.audit.lies, rows: L.audit.rows.map((r) => (r.ok ? '✓ ' : '✗ ') + r.setting + ' · asked ' + r.asked + ' · ' + r.witness) };
    };
    return 1;`);
  const run = async (name, o) => { const r = await g.ev(`return await __run(${JSON.stringify(o)});`); r.name = name; out.runs.push(r);
    console.log((r.ok ? 'OBEYED ' : r.none ? 'NO RUN ' : 'LIED   ') + name + (r.lies && r.lies.length ? ' · ' + r.lies.join(', ') : '') + (r.none ? ' · ' + r.status + ' · ' + r.est : ''));
    if (r.rows) for (const x of r.rows) console.log('    ' + x); };
  const still = { motion: 'still', format: 'mp4', size: 'current', fps: 30, duration: 0.2, offset: 0, modulation: 'off', timeline: 'off', audio: 'on', nodes: 'on', chrome: 'labels' };
  await run('SIZE current', still);
  for (const s of ['1080p', '1440p', '2160p']) await run('SIZE ' + s, { ...still, size: s, duration: 0.1 });
  for (const f of [24, 48, 60]) await run('FPS ' + f, { ...still, fps: f, duration: 0.25 });
  await run('LENGTH 0.5 · START AT 0.2', { ...still, duration: 0.5, offset: 0.2 });
  await run('FORMAT PNG', { ...still, format: 'png' });
  await run('TIMELINE ON (still)', { ...still, timeline: 'on' });
  await g.ev(`__LW.mod.arm(true); return 1;`);
  await run('MODULATION ON', { ...still, modulation: 'on' });
  await g.ev(`__LW.mod.arm(false); return 1;`);
  await run('NODES OFF · CHROME OFF', { ...still, nodes: 'off', chrome: 'off' });
  await g.ev(`__LW.nodes.add('grain'); await __w(300); return 1;`);
  await run('NODES ON (FILM GRAIN)', { ...still, nodes: 'on' });
  /* the TIMELINE: a KEEP audio clip (a synthetic 2 s click track) at beat 0, ACTIVE over beats 0 → 2 */
  out.clip = await g.ev(`const tl = __LW.timeline; tl.open(); await __w(600); const ed = tl.editor, bpm = __LW.mod.model.transport.bpm;
    const sr = 48000, n = sr * 2, pcm = new Int16Array(n); for (let b = 0; b < 4; b++) { const at = Math.round(b * 60 / bpm * sr); for (let i = 0; i < 480 && at + i < n; i++) pcm[at + i] = 16000 * Math.sin(i / 3); }
    const head = new DataView(new ArrayBuffer(44)), w4 = (o, s) => [...s].forEach((c, i) => head.setUint8(o + i, c.charCodeAt(0)));
    w4(0, 'RIFF'); head.setUint32(4, 36 + n * 2, true); w4(8, 'WAVE'); w4(12, 'fmt '); head.setUint32(16, 16, true); head.setUint16(20, 1, true); head.setUint16(22, 1, true);
    head.setUint32(24, sr, true); head.setUint32(28, sr * 2, true); head.setUint16(32, 2, true); head.setUint16(34, 16, true); w4(36, 'data'); head.setUint32(40, n * 2, true);
    const { audioClipFromFile } = await import('/lab/mir/timeline/audio-analysis.js');
    const made = await audioClipFromFile(new File([head.buffer, pcm.buffer], 'click.wav', { type: 'audio/wav' }), { bpm, keep: true });
    const id = ed.addClip('audio', made.source, { start: 0, duration: made.duration, laneId: ed.model.state().lanes[0].id, name: 'CLICK' });
    ed.setActiveRange({ start: 0, end: 2 }); tl.close(); await __w(500); await __LW.settle();
    return { id, bpm, duration: made.duration, active: ed.activeRange() };`);
  console.log('clip', JSON.stringify(out.clip));
  const tla = { ...still, motion: 'timeline-active', timeline: 'on', nodes: 'on' };
  await run('RANGE ACTIVE · AUDIO ON · MP4', tla);
  await run('RANGE ACTIVE · AUDIO OFF', { ...tla, audio: 'off' });
  await run('RANGE ACTIVE · AUDIO ON · PNG (WAV)', { ...tla, format: 'png' });
  await run('RANGE ACTIVE · 24 fps', { ...tla, fps: 24 });
  await g.ev(`const ed = __LW.timeline.editor; ed.range = () => ({ start: 0.5, end: 1.5 }); return 1;`);
  await run('RANGE SELECTION 0.5 → 1.5', { ...tla, motion: 'timeline-selection' });
  await g.ev(`__R.place(); await __w(800); __LW.timeline.close(); await __w(400); await __LW.settle(); return 1;`);
  await run('RANGE PERIOD (PLACE ONE PERIOD)', { ...tla, audio: 'off' });
  /* IMAGE: the scale sizes — the card's picture road (capture.picture) against canvas × scale */
  out.image = await g.ev(`const C = __LW.captureUI.capture, cv = __LW.field.canvas, o = [];
    for (const s of [1, 2, 3, 4]) { const r = await C.picture({ scale: s, caption: false }); o.push({ s, want: [Math.round(cv.width * s), Math.round(cv.height * s)], got: [r.w, r.h], ok: r.w === Math.round(cv.width * s) && r.h === Math.round(cv.height * s), clipped: r.clipped }); }
    return o;`);
  for (const x of out.image) console.log((x.ok ? 'OBEYED ' : 'LIED   ') + 'IMAGE ×' + x.s + ' · want ' + x.want.join('×') + ' · got ' + x.got.join('×') + (x.clipped ? ' (clipped)' : ''));
  out.errs = await g.ev(`return (window.__e || []).slice(-5).map(String);`);
} finally { await g.close(); }
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
const lied = out.runs.filter((r) => !r.ok).map((r) => r.name);
console.log(lied.length ? 'LIES: ' + lied.join(' · ') : 'EVERY SETTING OBEYED (' + out.runs.length + ' runs)');
