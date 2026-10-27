/* tools/perf/speedrun-trace.mjs — iteration 017 P1 THE SPEED-RUN TRACE: Josh's hands for ~20 s in a HEADED Chromium on the RTX
 * (the probe-chromium-headed road: snap Chromium on DISPLAY :0, Vulkan/ANGLE, certificate errors ignored), traced through CDP.
 *   python3 tools/gate/server.py "$PWD" 9711 &         (stop it by pid afterwards)
 *   LW_PORT=9711 node tools/perf/speedrun-trace.mjs [--out trace.json] [--json summary.json] [--setup '<js>'] [--label text]
 * THE SCENE (real CDP mouse / wheel / key input, performance.mark per step): the Picker opens and closes · SPECTRUM folds, WAVE is
 * raised and folds, STATE is raised, SPECTRUM unfolds · the right rack wheels top → bottom → top · the ISO dial (or WAVE's first live
 * dial when ISO is greyed) is dragged 2 s · the TIMELINE opens and closes · the Picker picks WATER and then hydrogen's 1s.
 * Recorded: a Tracing trace (devtools.timeline, disabled-by-default-devtools.timeline, v8.execute, blink.user_timing, toplevel), a
 * Profiler cpuprofile over the same window (function self-time with url:line), Performance.getMetrics before → after.
 * Printed: the main thread's self-time by event (FunctionCall and friends carry their url:line), the top functions by self-time,
 * the longest tasks (> 50 ms) with the step they fell in and their heaviest children, the busy ms of the GPU and compositor threads.
 * --setup '<js>' is awaited on the page before the scene (an A/B: e.g. the GLASS BLUR at 0). */
import { sleep } from './cdp.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const PORT = process.env.LW_PORT || '9711';
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const OUT = opt('--out', null), JSON_OUT = opt('--json', null), SETUP = opt('--setup', null), LABEL = opt('--label', '');
const W = 1600, H = 1000, port = 9600 + Math.floor(Math.random() * 300);
const profile = `${process.env.HOME}/snap/chromium/common/lw-trace-${port}`;
const proc = spawn('/snap/bin/chromium', ['--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`, '--window-position=0,0', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--ignore-certificate-errors',
  '--enable-features=Vulkan', '--use-angle=vulkan', 'about:blank'], { stdio: 'ignore', env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' } });
const load = () => fs.readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).map(Number);
const r1 = (x) => Math.round(x * 10) / 10;
let ws;
try {
  let ok = false; for (let i = 0; i < 80 && !ok; i++) { try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ok = true; } catch { await sleep(250); } }
  if (!ok) throw new Error('no devtools port');
  const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(), events = []; let traceDone = null;
  ws.onmessage = (m) => { const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    else if (d.method === 'Tracing.dataCollected') events.push(...d.params.value);
    else if (d.method === 'Tracing.tracingComplete' && traceDone) traceDone(); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text); return r.result.result.value; };
  const mouse = (type, x, y, extra = {}) => send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', buttons: type === 'mouseReleased' ? 0 : (type === 'mousePressed' || extra.held ? 1 : 0), clickCount: type === 'mouseMoved' ? 0 : 1, ...extra });
  const click = async (x, y) => { await mouse('mouseMoved', x, y); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
  const at = (sel) => ev(`(() => { const e = ${sel}; if (!e) return null; e.scrollIntoView && e.scrollIntoView({ block: 'nearest' }); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  const tap = async (sel, why) => { const p = await at(sel); if (!p) { console.log('  (missing: ' + why + ')'); return false; } await click(p.x, p.y); return true; };
  const mark = (n) => ev(`performance.mark('P1 ${n}')`);
  const key = async (k) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: k === 'Escape' ? 27 : 0 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: k === 'Escape' ? 27 : 0 }); };

  await send('Page.enable'); await send('Runtime.enable');
  const url = `https://127.0.0.1:${PORT}/lab/?sw=0&warn=0&starter=home`;
  for (const pass of [1, 2]) {                                       // the warm-up navigation (main-thread.mjs' header), then the measured page
    await send('Page.navigate', { url }); await sleep(500);
    let r = false; for (let i = 0; i < 300 && !r; i++) { try { r = await ev('!!(window.__LW && __LW.ready)'); } catch {} if (!r) await sleep(100); }
    if (!r) throw new Error('the lab never became ready (pass ' + pass + ')');
  }
  const field = await ev(`({ ok: !!__LW.field.ok, adapter: __LW.field.adapterInfo && __LW.field.adapterInfo.description, w: innerWidth, h: innerHeight })`);
  await ev(`(() => { const w = __LW.warning; if (w && w.open) w.dismiss(); return 1; })()`);
  const setup = SETUP ? await ev(`(async () => { const r = await (${SETUP}); return r === undefined ? null : r; })()`) : null;
  await ev(`(async () => { __LW.play(); await __LW.settle(); })()`); await sleep(1500);

  await send('Performance.enable'); await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 200 });
  const metrics = async () => Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]));
  await send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing', 'toplevel'] } });
  await send('Profiler.start');
  await ev(`(() => { window.__P1 = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) __P1.push({ t: e.startTime, d: e.duration, r: e.renderStart ? e.duration - (e.renderStart - e.startTime) : 0, st: e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0, b: e.blockingDuration, s: (e.scripts || []).map((x) => (x.sourceFunctionName || x.invoker || '') + ' ' + String(x.sourceURL || '').replace(/^.*\\/lab\\//, 'lab/') + ':' + (x.sourceCharPosition ?? '') + ' ' + Math.round(x.duration)) }); }).observe({ type: 'long-animation-frame' }); } catch {} return 1; })()`);
  const L0 = load(), m0 = await metrics(), s0 = await ev('({ f: __LW.stats.frames, p: __LW.stats.presents })'), t0 = Date.now();

  await mark('picker'); await tap(`document.getElementById('lwHome')`, 'the Picker button'); await sleep(900);
  await key('Escape'); await sleep(300);
  if (await ev(`!document.getElementById('lwMenu').hidden`)) await tap(`document.getElementById('lwHome')`, 'the Picker button (close)');
  await sleep(500);
  await mark('windows'); const fold = (id) => tap(`document.querySelector('.dev[data-id="${id}"] .dev-fold')`, id + ' fold');
  await fold('spectrum'); await sleep(450); await ev(`__LW.layout.raise('observer')`); await sleep(450); await fold('observer'); await sleep(450);
  await ev(`__LW.layout.raise('state')`); await sleep(450); await fold('observer'); await sleep(450); await fold('spectrum'); await sleep(600);
  await mark('scroll'); const rk = await ev(`(() => { const s = document.querySelector('.dev[data-id="observer"]').parentElement, b = s.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + 200 }; })()`);
  for (const dy of [120, -120]) for (let k = 0; k < 30; k++) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: rk.x, y: rk.y, deltaX: 0, deltaY: dy }); await sleep(33); }
  await sleep(400);
  await mark('knob'); const knob = await ev(`(() => { const w = document.querySelector('.dev[data-id="observer"]'), iso = w.querySelector('.k[data-param="material.iso"]');
    const live = (k) => k && k.getClientRects().length && !k.closest('.muted, [aria-disabled="true"]') && !k.classList.contains('muted');
    const k = live(iso) ? iso : [...w.querySelectorAll('.k')].find(live); if (!k) return null; k.scrollIntoView({ block: 'center' }); const d = k.querySelector(':scope > .k-dial').getBoundingClientRect();
    return { id: k.dataset.param || null, x: d.x + d.width / 2, y: d.y + d.height / 2 }; })()`);
  if (knob) { await sleep(200); await mouse('mouseMoved', knob.x, knob.y); await mouse('mousePressed', knob.x, knob.y);
    for (let k = 0; k < 120; k++) { await mouse('mouseMoved', knob.x, knob.y - 60 * Math.sin(k / 120 * 2 * Math.PI), { held: true }); await sleep(16); }
    await mouse('mouseReleased', knob.x, knob.y); }
  await sleep(400);
  await mark('timeline'); await ev(`__LW.timeline.open()`); await sleep(1200); await ev(`__LW.timeline.close()`); await sleep(600);
  await mark('water'); await tap(`document.getElementById('lwHome')`, 'the Picker'); await sleep(700);
  await tap(`document.querySelectorAll('.mm-tab')[1]`, 'MOLECULAR tab'); await sleep(600);
  const water = await tap(`[...document.querySelectorAll('.mm-mol')].find((t) => /^H₂O$|^H2O$/.test((t.querySelector('.mm-lbl') || {}).textContent || ''))`, 'WATER on this page');
  if (!water) { await key('Escape'); await ev(`(() => { const C = __LW.chem; if (!C.on) C.setOn(true); C.pick('H2O'); return 1; })()`); }
  await sleep(2200);
  await mark('hydrogen'); await tap(`document.getElementById('lwHome')`, 'the Picker'); await sleep(700);
  await tap(`document.querySelectorAll('.mm-tab')[0]`, 'ATOMIC tab'); await sleep(500);
  await tap(`document.querySelector('[data-amode="hydrogen"]')`, 'HYDROGEN deck'); await sleep(600);
  await tap(`document.querySelector('.mm-htable .mm-tile')`, '1s'); await sleep(2000);
  await mark('end');

  const secs = (Date.now() - t0) / 1000, m1 = await metrics(), s1 = await ev('({ f: __LW.stats.frames, p: __LW.stats.presents })'), L1 = load();
  const prof = (await send('Profiler.stop')).result.profile;
  const done = new Promise((r) => { traceDone = r; }); await send('Tracing.end'); await done;
  const loaf = await ev(`(() => { const a = __P1.filter((e) => e.d > 50); return { over50: a.length, blockingMs: Math.round(a.reduce((t, e) => t + e.b, 0)), 
    byStep: (() => { const M = performance.getEntriesByType('mark').filter((m) => /^P1 /.test(m.name)), o = {}; for (const e of a) { let s = '(before)'; for (const m of M) if (m.startTime <= e.t) s = m.name.slice(3); o[s] = (o[s] || 0) + 1; } return o; })(),
    worst: a.sort((x, y) => y.d - x.d).slice(0, 6).map((e) => Math.round(e.d) + ' ms (render ' + Math.round(e.r) + ', style+layout ' + Math.round(e.st) + ')' + (e.s.length ? ': ' + e.s.slice(0, 2).join(' | ') : '')) }; })()`);
  const state = await ev(`({ chem: !!(__LW.chem && __LW.chem.on), menu: !document.getElementById('lwMenu').hidden, tl: __LW.timeline.isOpen(), errs: (window.__e || []).slice(0, 3) })`);
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ traceEvents: events }));
  if (OUT) fs.writeFileSync(OUT.replace(/\.json$/, '') + '.cpuprofile', JSON.stringify(prof));

  /* ---- the analysis ---- */
  const rendererPid = (events.find((e) => e.name === 'TracingStartedInBrowser') || {}).args?.data?.frames?.[0]?.processId;
  const names = new Map(); for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') names.set(e.pid + ':' + e.tid, e.args.name);
  const main = events.filter((e) => e.ph === 'X' && names.get(e.pid + ':' + e.tid) === 'CrRendererMain' && (!rendererPid || e.pid === rendererPid)).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const marks = events.filter((e) => e.cat && e.cat.includes('blink.user_timing') && /^P1 /.test(e.name)).map((e) => ({ n: e.name.slice(3), ts: e.ts })).sort((a, b) => a.ts - b.ts);
  const stepAt = (ts) => { let s = '(before)'; for (const m of marks) if (m.ts <= ts) s = m.n; return s; };
  const label = (e) => { const d = e.args && e.args.data || {}; const u = d.url || (d.stackTrace && d.stackTrace[0] && d.stackTrace[0].url) || '';
    const ours = u.includes('/lab/') ? u.replace(/^.*\/lab\//, 'lab/') + ':' + ((d.lineNumber ?? d.stackTrace?.[0]?.lineNumber ?? 0) + (d.stackTrace ? 1 : 0)) : '';
    return e.name + (d.type ? '(' + d.type + ')' : '') + (d.functionName ? ' ' + d.functionName : '') + (ours ? ' ' + ours : ''); };
  const self = new Map(), stack = [], tasks = [];
  for (const e of main) {
    while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop();
    const parent = stack[stack.length - 1]; e._self = e.dur; e._kids = [];
    if (parent) { parent._self -= e.dur; parent._kids.push(e); }
    stack.push(e); if (e.name === 'RunTask' && !parent) tasks.push(e);
  }
  for (const e of main) { const k = label(e); self.set(k, (self.get(k) || 0) + e._self); }
  const topEvents = [...self].filter(([k]) => !/^(RunTask|ThreadControllerImpl::RunTask)$/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => ({ what: k, ms: r1(v / 1000) }));
  const sum = (e, acc = new Map()) => { const k = label(e); acc.set(k, (acc.get(k) || 0) + e._self); e._kids.forEach((c) => sum(c, acc)); return acc; };
  const longTasks = tasks.filter((t) => t.dur > 50000).sort((a, b) => b.dur - a.dur).slice(0, 8).map((t) => ({ ms: r1(t.dur / 1000), step: stepAt(t.ts),
    top: [...sum(t)].filter(([k]) => k !== 'RunTask').sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k + ' ' + r1(v / 1000)) }));
  const byNode = new Map(prof.nodes.map((n) => [n.id, n])), parent = new Map(), fself = new Map(), callers = new Map(), dts = prof.timeDeltas || [];
  for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n);
  const fk = (n) => { const c = n.callFrame; return (c.functionName || '(anonymous)') + ' ' + (c.url ? c.url.replace(/^.*\/lab\//, 'lab/').replace(/^https?:\/\/[^/]+\//, '') + ':' + (c.lineNumber + 1) : '(' + (c.functionName ? 'native' : '') + ')'); };
  prof.samples.forEach((sid, i) => { const n = byNode.get(sid), k = fk(n), dt = dts[i + 1] || 0; fself.set(k, (fself.get(k) || 0) + dt);
    const p = parent.get(n.id), pk = p ? fk(p) : '-', m = callers.get(k) || new Map(); m.set(pk, (m.get(pk) || 0) + dt); callers.set(k, m); });
  const topFns = [...fself].filter(([k]) => !/^\((idle|program|garbage collector)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => ({ fn: k, ms: r1(v / 1000),
    from: [...callers.get(k)].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, t]) => c + ' ' + r1(t / 1000)) }));
  const busy = {}; for (const e of events) { if (e.ph !== 'X' || e.name !== 'ThreadControllerImpl::RunTask' && e.name !== 'RunTask') continue; const n = names.get(e.pid + ':' + e.tid) || 'tid' + e.tid; if (e.name === 'RunTask' && /CrGpuMain|VizCompositorThread/.test(n)) continue; if (/CrGpuMain|VizCompositorThread|Compositor|CrRendererMain/.test(n)) busy[n] = (busy[n] || 0) + e.dur / 1000; }
  const d = (k) => r1((m1[k] - m0[k]) * 1000);
  const out = { label: LABEL, port: PORT, field, setup, knob, water, state, secs: r1(secs), load: [L0, L1], frames: s1.f - s0.f, presents: s1.p - s0.p, traceEvents: events.length, traceMB: OUT ? r1(fs.statSync(OUT).size / 1e6) : null,
    metrics: { TaskDuration: d('TaskDuration'), ScriptDuration: d('ScriptDuration'), LayoutDuration: d('LayoutDuration'), RecalcStyleDuration: d('RecalcStyleDuration'), LayoutCount: m1.LayoutCount - m0.LayoutCount, RecalcStyleCount: m1.RecalcStyleCount - m0.RecalcStyleCount },
    busyMs: Object.fromEntries(Object.entries(busy).map(([k, v]) => [k, r1(v)])), loaf, longTasks, topEvents, topFns };
  console.log(JSON.stringify(out, null, 1));
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
} catch (e) { console.error('TRACE ERROR', e.message); process.exitCode = 1; }
finally { try { ws && ws.close(); } catch {} proc.kill(); await sleep(500); fs.rmSync(profile, { recursive: true, force: true }); }
