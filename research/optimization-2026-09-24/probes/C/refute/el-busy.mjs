/* el-layers.mjs — Lane C in Electron (Chromium 152, the real GPU on the desktop): per body state,
 *   · the COMPOSITED LAYER inventory (CDP LayerTree: count, drawsContent, px area, compositing reasons of the big ones),
 *   · the per-frame MAIN-THREAD style/layout work while playing (Performance.getMetrics deltas ÷ frames),
 *   · a 1.5 s devtools.timeline trace while playing: Paint / RasterTask / UpdateLayoutTree(elementCount) / Layout counts per frame.
 * Copied from tools/perf/bench-chromium.mjs's launch, with different scenes.  A window opens on the desktop for ~1 min.
 *   LW_PORT=8721 node research/optimization-2026-09-24/probes/C/el-layers.mjs [out.json] */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/probes/C/refute/el-busy.json';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9500 + Math.floor(Math.random() * 150);
const R = { at: new Date().toISOString(), viewport: [W, H], host: 'electron', scenes: [] };
const proc = spawn(ELECTRON, [new URL('../../../../../tools/perf/electron-main.cjs', import.meta.url).pathname, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: String(W), LW_H: String(H), LW_NO_SANDBOX: '1', LW_PROFILE: `/tmp/lw-labC-${cdpPort}-${Date.now()}`,
    LW_URL: `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0` } });
let stderr = ''; proc.stderr.on('data', (d) => { stderr += d; });
let ws = null;
try {
  let target = null;
  for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page' && x.url.includes('/lab/')); } catch {} if (!target) await sleep(250); }
  if (!target) throw new Error('no page target: ' + stderr.split('\n').slice(-4).join(' | '));
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pend = new Map(); let lastLayers = null; const traceBuf = []; let traceDone = null;
  ws.onmessage = (m) => { const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); return; }
    if (d.method === 'LayerTree.layerTreeDidChange' && d.params.layers) lastLayers = d.params.layers;
    if (d.method === 'Tracing.dataCollected') traceBuf.push(...d.params.value);
    if (d.method === 'Tracing.tracingComplete' && traceDone) traceDone(); };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable'); await send('Performance.enable'); await send('DOM.enable');
  for (let i = 0; i < 400; i++) { try { if (await ev('!!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
  R.warn = await ev(`(()=>{ const w=__LW.warning; const was=w.open; if (was) w.dismiss(); return { was, open: w.open }; })()`); await sleep(500);
  R.boot = await ev(`({ok:__LW.field.ok, dpr:devicePixelRatio, w:innerWidth, h:innerHeight, card:document.body.dataset.card, frost:__LW.frost, disc:__LW.disconnected, theme:__LW.theme})`);
  console.log('boot', JSON.stringify(R.boot));
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.quality.res=96; __LW.quality.steps=160; __LW.quality.scale=1; __LW.setDisconnected(true); __LW.setFrost('always'); __LW.setCardStyle('refractive'); __LW.schedule(4); __LW.settle()`);
  await send('LayerTree.enable');
  const metrics = async () => Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]));
  const layerInventory = async () => {
    lastLayers = null; await ev(`new Promise(r=>{__LW.schedule(4); requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(r,120)))})`);
    for (let i = 0; i < 20 && !lastLayers; i++) await sleep(50);
    const L = lastLayers || [];
    const draws = L.filter((l) => l.drawsContent && !l.invisible);
    const big = draws.map((l) => ({ id: l.layerId, node: l.backendNodeId, w: Math.round(l.width), h: Math.round(l.height), area: Math.round(l.width * l.height) })).sort((a, b) => b.area - a.area);
    const top = [];
    for (const b of big.slice(0, 14)) {
      let reasons = []; try { const cr = await send('LayerTree.compositingReasons', { layerId: b.id }); reasons = cr.result.compositingReasonIds || cr.result.compositingReasons || []; } catch {}
      let who = '';
      if (b.node) { try { const d = await send('DOM.describeNode', { backendNodeId: b.node }); const n = d.result && d.result.node; if (n) { const at = n.attributes || []; const idx = at.indexOf('id'), ci = at.indexOf('class'); who = n.localName + (idx >= 0 ? '#' + at[idx + 1] : '') + (ci >= 0 ? '.' + at[ci + 1].split(' ').slice(0, 3).join('.') : ''); } } catch {} }
      top.push({ ...b, who, reasons: reasons.slice(0, 6) });
    }
    return { layers: L.length, drawing: draws.length, drawingPx: draws.reduce((s, l) => s + l.width * l.height, 0) | 0, top };
  };
  const playWork = async (secs = 3) => {
    const m0 = await metrics(); const f0 = await ev('__LW.stats.frames');
    const fps = await ev(`new Promise(r=>{__LW.play(); let n=0; const t0=performance.now(); const f=()=>{n++; if(performance.now()-t0<${secs * 1000}) requestAnimationFrame(f); else {__LW.pause(); r(+(n/((performance.now()-t0)/1000)).toFixed(1));}}; requestAnimationFrame(f);})`);
    const m1 = await metrics(); const frames = (await ev('__LW.stats.frames')) - f0;
    const d = (k) => m1[k] - m0[k];
    return { fps, frames, perFrame: { recalcStyle: +(d('RecalcStyleCount') / frames).toFixed(2), recalcStyleMs: +(1000 * d('RecalcStyleDuration') / frames).toFixed(3), layout: +(d('LayoutCount') / frames).toFixed(2), layoutMs: +(1000 * d('LayoutDuration') / frames).toFixed(3), scriptMs: +(1000 * d('ScriptDuration') / frames).toFixed(3), taskMs: +(1000 * d('TaskDuration') / frames).toFixed(3) } };
  };
  const trace = async (secs = 1.5) => {
    traceBuf.length = 0;
    await send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,cc,viz', transferMode: 'ReportEvents' });
    const fr = await ev(`new Promise(r=>{__LW.play(); const f0=__LW.stats.frames; setTimeout(()=>{__LW.pause(); r(__LW.stats.frames-f0)}, ${secs * 1000})})`);
    const done = new Promise((r) => { traceDone = r; }); await send('Tracing.end'); await Promise.race([done, sleep(8000)]); traceDone = null;
    const c = {}, dur = {}; let elements = 0;
    for (const e of traceBuf) { if (e.ph !== 'X' && e.ph !== 'B' && e.ph !== 'I') continue;
      const k = e.name; if (!['Paint', 'RasterTask', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Layerize', 'Commit', 'UpdateLayer', 'PaintImage', 'ScheduleStyleRecalculation', 'InvalidateLayout', 'PaintInvalidationTracking', 'UpdateLayerTree'].includes(k)) continue;
      c[k] = (c[k] || 0) + 1; if (e.dur) dur[k] = (dur[k] || 0) + e.dur;
      if (k === 'UpdateLayoutTree' && e.args && e.args.elementCount) elements += e.args.elementCount; }
    const per = (k) => +((c[k] || 0) / Math.max(1, fr)).toFixed(2), ms = (k) => +(((dur[k] || 0) / 1000) / Math.max(1, fr)).toFixed(3);
    return { frames: fr, events: traceBuf.length, perFrame: { paint: per('Paint'), paintMs: ms('Paint'), raster: per('RasterTask'), rasterMs: ms('RasterTask'), styleRecalc: per('UpdateLayoutTree'), styleElements: +(elements / Math.max(1, fr)).toFixed(1), layout: per('Layout'), prePaint: per('PrePaint'), layerize: per('Layerize'), commit: per('Commit') } };
  };
  const scene = async (label, setup) => {
    await ev(`(async()=>{ ${setup || ''}; await __LW.settle(); await new Promise(r=>setTimeout(r,500)); })()`);
    const layers = await layerInventory();
    const work = await playWork(3);
    const tr = await trace(1.5);
    const r = { label, layers, work, trace: tr }; R.scenes.push(r);
    console.log('scene', label, JSON.stringify({ layers: layers.layers, drawing: layers.drawing, drawingPx: layers.drawingPx, fps: work.fps, work: work.perFrame, trace: tr.perFrame }));
    console.log('   top layers', JSON.stringify(layers.top.slice(0, 8).map((t) => [t.who, t.w + 'x' + t.h, t.reasons.join('|')])));
    return r;
  };
  await scene('busy mark DOWN · playing', '');
  await scene('busy mark UP (flash 20 s) · playing', `__LW.busy.flash(20000)`);
  R.busyVisible = await ev(`({shown: __LW.busy.visible, titleBusy: document.querySelector('#title .mark').classList.contains('busy'), anims: document.getAnimations().filter(a=>a.playState==='running').length})`);
  console.log('busy', JSON.stringify(R.busyVisible));
  R.errs = await ev('window.__e');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); R.stderr = stderr.slice(-1500); }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT);
