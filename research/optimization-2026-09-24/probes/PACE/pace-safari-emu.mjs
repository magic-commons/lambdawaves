/* PACE · P1 under a SAFARI-LIKE loop, in Electron on the RTX.  Chromium paces rAF to its GPU itself, so on its own it cannot
 * show the iPad's failure; here the page's requestAnimationFrame is replaced by a 60 Hz timer that never waits for the GPU —
 * what pre-frame-pacer WebKit does (WEBKIT-FPS-RESEARCH §1.3) — on a PRESENT-bound scene (hydrogen 1s+2pz, 128³ × 240 × 1 at
 * device scale 2 and quality.scale 2.5 — an emulation knob, not a user setting — ≈ 28 ms a frame, the iPad report's shape: the ray-march is the cost, so AUTO SCALE can fix it).
 *   LW_PORT=8734 node research/optimization-2026-09-24/probes/PACE/pace-safari-emu.mjs [out.json]
 * The same instrument as pace-chromium.mjs (every submit and completion counted in the page) on base and on the paced build:
 * base should queue what the GPU cannot finish (depth grows, AUTO SCALE reads the timer's 16.7 ms and never moves); paced
 * should hold (skipped), keep the queue bounded, present at the GPU's rate, and AUTO SCALE should step. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-pace-emu-'));
const PORT = process.env.LW_PORT || '8734';
const OUT = process.argv[2] || '';
const W = +(process.env.W || 1600), H = +(process.env.H || 1000);
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9700 + Math.floor(Math.random() * 200);
const R = { at: new Date().toISOString(), port: PORT, viewport: [W, H], dsf: process.env.LW_DSF || '2', host: 'electron', loop: '60 Hz timer in place of rAF (no GPU backpressure)' };
const proc = spawn(ELECTRON, [path.resolve('tools/perf/electron-main.cjs'), '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: String(W), LW_H: String(H), LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE, LW_DSF: process.env.LW_DSF || '2',
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
  await ev(`(()=>{ const w=__LW.warning; if (w.open) w.dismiss(); return 1; })()`);
  await sleep(1500);
  R.boot = await ev(`({ok:__LW.field.ok, dpr:devicePixelRatio, paced:__LW.field.paced, waits:__LW.field.paceWaits||null})`);
  await ev(`(async()=>{ __LW.pause(); __LW.governor.on=false; __LW.quality.res=128; __LW.quality.steps=240; __LW.quality.scale=${process.env.SCALE || 2.5}; __LW.schedule(4); await __LW.settle(); await __LW.settle(); return 1; })()`);
  await sleep(600);
  R.gpu = await ev(`(async()=>{ const f=__LW.field; f.resize(1); f.resize(__LW.quality.scale); const t=await f.throughput({modes:__LW.modesAt(__LW.clock.t), obs:__LW.obs, mat:__LW.mat, n:30, targetMs:1500}); return {frameMs:t.frameMs, presentMs:t.presentMs, reconstructMs:t.reconstructMs, w:t.w, h:t.h, steps:t.steps, res:t.res}; })()`);
  console.log('boot', JSON.stringify(R.boot), 'gpu', JSON.stringify(R.gpu));
  /* the Safari-like loop: a 60 Hz timer, drift-corrected, that fires whether or not the GPU has finished */
  await ev(`(()=>{ if (window.__emu) return 1; const T=1000/60, t0=performance.now(); const ids=new Map(); let nid=1;   /* every caller in one tick gets the NEXT slot of one 60 Hz grid, as rAF would */
    window.requestAnimationFrame=(cb)=>{ const id=nid++; const now=performance.now(), k=Math.floor((now-t0)/T+0.5)+1; ids.set(id, setTimeout(()=>{ ids.delete(id); cb(performance.now()); }, Math.max(0, t0+k*T-now))); return id; };
    window.cancelAnimationFrame=(id)=>{ const h=ids.get(id); if (h!==undefined) { clearTimeout(h); ids.delete(id); } };
    const q=__LW.field.device.queue, sub=q.submit.bind(q); const P=window.__pace={subs:0, done:0, doneT:[]};
    q.submit=(b)=>{ sub(b); P.subs++; q.onSubmittedWorkDone().then(()=>{ P.done++; P.doneT.push(performance.now()); }); };
    window.__emu=1; return 1; })()`);
  const play = async (label, setup, ms = 5000) => ev(`(async()=>{ ${setup}; __LW.pause(); await __LW.settle(); await new Promise(r=>setTimeout(r,1500)); const P=window.__pace, S=__LW.stats, f=__LW.field, q=__LW.quality, A=__LW.autoQ;
    const s0=P.subs, d0=P.done, p0=S.presents, k0=S.skipped||0, ch0=A.changes; P.doneT.length=0;
    let n=0, depthMax=0, firstChange=null; const pT=[], sc=[], depth=[]; let lp=S.presents;
    __LW.play(); const t0=performance.now();
    await new Promise(r=>{ const g=(ts)=>{ n++; const el=performance.now()-t0; const d=P.subs-P.done; depthMax=Math.max(depthMax, d); if ((n%30)===0) depth.push(d);
      if (S.presents!==lp) { pT.push(ts); lp=S.presents; } if (firstChange===null && A.changes!==ch0) firstChange=Math.round(el);
      if (!sc.length || sc[sc.length-1][1]!==q.autoScale) sc.push([Math.round(el), q.autoScale]);
      if (el < ${ms}) requestAnimationFrame(g); else r(); }; requestAnimationFrame(g); });
    const dt=(performance.now()-t0)/1000; __LW.pause();
    const drainT0=performance.now(); const backlog=P.subs-P.done; await f.device.queue.onSubmittedWorkDone(); const drainMs=performance.now()-drainT0;
    const iv=pT.slice(1).map((t,i)=>t-pT[i]).sort((a,b)=>a-b);
    return { label:${JSON.stringify(label)}, seconds:+dt.toFixed(2), loopPerS:+(n/dt).toFixed(1), presentsPerS:+((S.presents-p0)/dt).toFixed(1), submitsPerS:+((P.subs-s0)/dt).toFixed(1),
      completionsPerS:+((P.done-d0)/dt).toFixed(1), queueDepthMax:depthMax, depthEvery30:depth, backlogAtPause:backlog, drainMsAtPause:+drainMs.toFixed(0), skipped:(S.skipped||0)-k0, paced:f.paced,
      presentIntervalMedianMs:+(iv.length?iv[iv.length>>1]:0).toFixed(2), autoScaleFirstChangeMs:firstChange, autoScaleTrace:sc, canvas:[f.canvas.width,f.canvas.height] }; })()`);
  R.fixed = await play('1s+2pz 128³ × 240 · AUTO SCALE off', `__LW.quality.auto=false; __LW.quality.autoScale=1`);
  console.log('fixed', JSON.stringify(R.fixed));
  R.auto = await play('1s+2pz 128³ × 240 · AUTO SCALE on', `__LW.quality.auto=true; __LW.quality.autoScale=1`);
  console.log('auto', JSON.stringify(R.auto));
  R.errs = await ev('window.__e');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); R.stderr = stderr.slice(-2000); }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
