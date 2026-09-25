/* probe-f-electron.mjs — LANE F in Electron 44 / Chromium 152 on the real RTX (the compositor the headless Firefox lacks).
 *   LW_PORT=8721 node research/optimization-2026-09-24/probes/F/probe-f-electron.mjs [out.json]
 * (1) the RAW per-frame loop cost (accessor on __LW.perf.profile.total → each frame's own ms) and the rAF interval
 *     distribution in: default, modulation window open/closed, every card open, 128³ axial gas UI shown/hidden;
 * (2) a V8 CPU profile of restore(serialize()) and of the modulation window's first open (self time by function). */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/probes/F/probe-f-electron.json';
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const MAIN = path.resolve('tools/perf/electron-main.cjs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9500 + Math.floor(Math.random() * 90);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-f-electron-'));
const R = { at: new Date().toISOString(), scenes: [], profiles: {} };
const proc = spawn(ELECTRON, [MAIN, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: '1920', LW_H: '1080', LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE,
    LW_URL: `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0` } });
let stderr = ''; proc.stderr.on('data', (d) => { stderr += d; });
let ws = null;
try {
  let target = null;
  for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page' && x.url.includes('/lab/')); } catch {} if (!target) await sleep(250); }
  if (!target) throw new Error('no page target: ' + stderr.split('\n').slice(-4).join(' | '));
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable');
  for (let i = 0; i < 400; i++) { try { if (await ev('!!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
  R.boot = await ev(`({ ok: __LW.field.ok, adapter: __LW.field.adapterInfo, dpr: devicePixelRatio, w: innerWidth, h: innerHeight, perfMode: __LW.perf.mode })`);
  console.log('boot', JSON.stringify(R.boot));
  await ev(`(()=>{ const P = __LW.perf.profile, F = window.__F = { on: false, rows: [], cur: null, raf: [], lastRaf: 0 };
    for (const k of Object.keys(P)) { let v = P[k]; Object.defineProperty(P, k, { configurable: true, enumerable: true, get() { return v; },
      set(nv) { const raw = (nv - 0.9 * v) / 0.1; v = nv; if (!F.on) return; if (!F.cur) F.cur = {}; F.cur[k] = (F.cur[k] || 0) + raw; if (k === 'total') { F.rows.push(F.cur); F.cur = null; } } }); }
    const tickRaf = (t) => { if (F.on) { if (F.lastRaf) F.raf.push(t - F.lastRaf); F.lastRaf = t; } requestAnimationFrame(tickRaf); }; requestAnimationFrame(tickRaf);
    window.__Fsum = (arr) => { const a = arr.filter(Number.isFinite).slice().sort((x, y) => x - y); if (!a.length) return null; const q = (p) => +a[Math.min(a.length - 1, Math.floor(p * a.length))].toFixed(2); return { n: a.length, min: +a[0].toFixed(2), p10: q(0.1), median: q(0.5), p90: q(0.9), p99: q(0.99), max: +a[a.length - 1].toFixed(2) }; };
    window.__Fscene = async (ms) => { const F = window.__F; await __LW.settle(); await new Promise((r) => setTimeout(r, 400)); F.rows = []; F.raf = []; F.lastRaf = 0; F.cur = null; F.on = true; __LW.play();
      await new Promise((r) => setTimeout(r, ms)); F.on = false; const lastMedian = __LW.perf.median; __LW.pause();
      const tot = F.rows.map((r) => r.total), keys = new Set(); for (const r of F.rows) for (const k of Object.keys(r)) keys.add(k);
      const per = {}; for (const k of keys) if (k !== 'total') { const v = F.rows.map((r) => r[k] || 0); const s = v.reduce((a, b) => a + b, 0); if (s > 0.05) per[k] = { mean: +(s / F.rows.length).toFixed(3), max: +Math.max(...v).toFixed(2) }; }
      const untracked = F.rows.map((r) => r.total - Object.entries(r).filter(([k]) => k !== 'total').reduce((a, [, v]) => a + v, 0));
      const rafs = F.raf.slice().sort((a, b) => a - b);
      return { frames: F.rows.length, total: __Fsum(tot), untracked: __Fsum(untracked), over8: tot.filter((x) => x > 8).length, raf: __Fsum(F.raf), rafOver2x: F.raf.filter((x) => x > 2 * rafs[rafs.length >> 1]).length, rafFps: +(1000 / (F.raf.reduce((a, b) => a + b, 0) / Math.max(1, F.raf.length))).toFixed(1), perReader: per, perfMedianAsShipped: +lastMedian.toFixed(2) }; };
    return 1; })()`);
  const scene = async (label, setup, ms = 4000) => { try { const r = await ev(`(async()=>{ ${setup || ''}; return await __Fscene(${ms}); })()`); r.label = label; R.scenes.push(r); console.log('scene', label, JSON.stringify(r)); } catch (e) { R.scenes.push({ label, probeError: String(e.message).slice(0, 300) }); console.log('scene', label, 'ERR', e.message); } };
  await ev(`(async()=>{ __LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.quality.res=96; __LW.quality.steps=160; __LW.quality.scale=1; __LW.schedule(4); await __LW.settle(); return 1; })()`);
  await scene('default (sim-ladder 96³, 8 windows)', '');
  await scene('modulation window open', `__LW.mod.expand()`);
  await scene('modulation window closed', `__LW.mod.collapse()`);
  await scene('every card open', `for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.windowActivity.presentOffscreen(true)`);
  await scene('every card open · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('128³ axial gas · UI shown', `if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.windowActivity.presentOffscreen(false); for(const d of document.querySelectorAll('.dev')) if(!['spectrum','shadow','settings','state','palette','observer','camera','clip','transport'].includes(d.dataset.id)) d.classList.add('closed'); __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); __LW.quality.res=128; __LW.quality.steps=240; __LW.schedule(4)`, 6000);
  await scene('128³ axial gas · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`, 6000);
  await ev(`(async()=>{ if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.setHamiltonian('hydrogen'); __LW.setGasBasis('reg'); __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.quality.res=96; __LW.quality.steps=160; __LW.schedule(4); await __LW.settle(); return 1; })()`);
  /* (2) CPU profiles: restore, and the modulation window's open (after a close) */
  await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 100 });
  const prof = async (label, expr) => {
    await send('Profiler.start');
    const ms = await ev(expr);
    const { result } = await send('Profiler.stop');
    const p = result.profile, self = new Map(), total = p.samples.length;
    const dt = p.timeDeltas; const byId = new Map(p.nodes.map((n) => [n.id, n]));
    const tick = new Map(); for (let i = 0; i < p.samples.length; i++) tick.set(p.samples[i], (tick.get(p.samples[i]) || 0) + (dt[i] || 0));
    for (const [nid, us] of tick) { const n = byId.get(nid); const cf = n.callFrame; const key = (cf.functionName || '(anon)') + ' ' + (cf.url || '').split('/').pop() + ':' + (cf.lineNumber + 1); self.set(key, (self.get(key) || 0) + us); }
    const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, us]) => ({ fn: k, selfMs: +(us / 1000).toFixed(1) }));
    R.profiles[label] = { wallMs: ms, samples: total, top };
    console.log('profile', label, ms, JSON.stringify(top.slice(0, 12)));
  };
  await prof('restore(serialize())', `(()=>{ const s = __LW.serialize(); const t = performance.now(); __LW.restore(s); return +(performance.now() - t).toFixed(1); })()`);
  await prof('restore again', `(()=>{ const s = __LW.serialize(); const t = performance.now(); __LW.restore(s); return +(performance.now() - t).toFixed(1); })()`);
  await prof('modulation expand', `(()=>{ __LW.mod.collapse(); const t = performance.now(); __LW.mod.expand(); return +(performance.now() - t).toFixed(1); })()`);
  await ev(`__LW.mod.collapse(), 1`);
  R.errs = await ev('(window.__e || []).map(String).slice(0, 10)');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); R.stderr = stderr.slice(-1500); }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT);
