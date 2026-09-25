/* trace-gpu.mjs — wave 127: the GPU process's main thread after the 'lw127-open' mark, by kind: raster (RendererRasterWorker,
 * of which Skia's GL program compiles), WebGPU (DawnCommands), compositing (SkiaOutputSurface), other — and the renderer's
 * forced style/layout inside the open.   node trace-gpu.mjs trace.json [fromMs=0] [toMs=1000] */
import fs from 'node:fs';
const [F, FROM = '0', TO = '1000'] = process.argv.slice(2);
const ev = JSON.parse(fs.readFileSync(F, 'utf8'));
const pname = {}, tname = {};
for (const e of ev) if (e.ph === 'M') { if (e.name === 'process_name') pname[e.pid] = e.args.name; if (e.name === 'thread_name') tname[e.pid + ':' + e.tid] = e.args.name; }
const mark = ev.find((e) => e.name === 'lw127-open'), end = ev.find((e) => e.name === 'lw127-open-end');
const t0 = mark.ts, a = t0 + FROM * 1000, b = t0 + TO * 1000;
const on = (e, p, t) => e.ph === 'X' && pname[e.pid] === p && tname[e.pid + ':' + e.tid] === t;
const inW = (e) => e.ts >= a && e.ts < b;
const G = ev.filter((e) => on(e, 'GPU Process', 'CrGpuMain') && inW(e));
const sum = (name) => G.filter((e) => e.name === name).reduce((s, e) => s + e.dur, 0) / 1000;
const top = G.filter((e) => e.name === 'ThreadControllerImpl::RunTask').reduce((s, e) => s + e.dur, 0) / 1000;
const main = ev.filter((e) => on(e, 'Renderer', 'CrRendererMain') && e.ts >= t0 && e.ts <= (end ? end.ts : t0));
const forced = main.filter((e) => e.name === 'Blink.ForcedStyleAndLayout.UpdateTime');
const r = { busyMs: +top.toFixed(1), rasterMs: +sum('RendererRasterWorker').toFixed(1), shaderCompileMs: +sum('shader_compile').toFixed(1), shaderCompiles: G.filter((e) => e.name === 'shader_compile').length,
  webgpuMs: +sum('DawnCommands').toFixed(1), compositeMs: +sum('SkiaOutputSurfaceImplOnGpu::FinishPaintRenderPass').toFixed(1),
  openMs: end ? +((end.ts - t0) / 1000).toFixed(1) : null, forcedLayouts: forced.length, forcedMs: +(forced.reduce((s, e) => s + e.dur, 0) / 1000).toFixed(1) };
console.log(JSON.stringify(r));
