/* PACE · P1's Chromium gate (Electron, the real RTX on the session display).  The 128³ axial gas with ?gastab=0 (a GPU-bound
 * scene): does the loop now submit what the GPU completes, and does AUTO SCALE now see it?
 *   LW_PORT=8734 node research/optimization-2026-09-24/probes/PACE/pace-chromium.mjs [out.json]
 * The probe wraps device.queue.submit to count every submission and its completion (onSubmittedWorkDone), the same on the
 * base build and the paced one, so "presents vs GPU completions" is read by one instrument on both. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-pace-'));
const PORT = process.env.LW_PORT || '8734';
const OUT = process.argv[2] || '';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9700 + Math.floor(Math.random() * 200);
const R = { at: new Date().toISOString(), port: PORT, viewport: [W, H], host: 'electron' };
const proc = spawn(ELECTRON, [path.resolve('tools/perf/electron-main.cjs'), '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: String(W), LW_H: String(H), LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE,
    LW_URL: `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0&gastab=0` } });
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
  await sleep(600);
  R.boot = await ev(`({ok:__LW.field.ok, adapter:__LW.field.adapterInfo, dpr:devicePixelRatio, w:innerWidth, h:innerHeight, ua:navigator.userAgent, paced:__LW.field.paced, quality:{...__LW.quality}})`);
  console.log('boot', JSON.stringify(R.boot));
  /* the instrument: every submit and its completion, counted in the page */
  await ev(`(()=>{ const q=__LW.field.device.queue; if (q.__pace) return 1; const sub=q.submit.bind(q); const P=window.__pace={subs:0, done:0, doneT:[], subT:[]};
    q.submit=(b)=>{ sub(b); P.subs++; P.subT.push(performance.now()); q.onSubmittedWorkDone().then(()=>{ P.done++; P.doneT.push(performance.now()); }); }; q.__pace=1; return 1; })()`);
  const gpu = async () => ev(`(async()=>{ __LW.pause(); await __LW.settle(); const f=__LW.field; f.resize(__LW.quality.scale); const t=await f.throughput({modes:__LW.modesAt(__LW.clock.t), obs:__LW.obs, mat:__LW.mat, n:30, targetMs:1500}); return {frameMs:t.frameMs, presentMs:t.presentMs, reconstructMs:t.reconstructMs, w:t.w, h:t.h, steps:t.steps, res:t.res}; })()`);
  const play = async (label, setup, ms = 4000) => ev(`(async()=>{ ${setup}; __LW.pause(); await __LW.settle(); await new Promise(r=>setTimeout(r,400)); const P=window.__pace, S=__LW.stats, f=__LW.field, q=__LW.quality, A=__LW.autoQ;
    const s0=P.subs, d0=P.done, p0=S.presents, fr0=S.frames, k0=S.skipped||0, ch0=A.changes; P.doneT.length=0; P.subT.length=0; __LW.perf.resetRing();
    let n=0, depthMax=0, inFlightMax=0, firstChange=null; const pT=[], sc=[]; let lp=S.presents;
    __LW.play(); const t0=performance.now();
    await new Promise(r=>{ const g=(ts)=>{ n++; const el=performance.now()-t0; depthMax=Math.max(depthMax, P.subs-P.done); inFlightMax=Math.max(inFlightMax, f.inFlight||0);
      if (S.presents!==lp) { pT.push(ts); lp=S.presents; } if (firstChange===null && A.changes!==ch0) firstChange=Math.round(el);
      if (!sc.length || sc[sc.length-1][1]!==q.autoScale) sc.push([Math.round(el), q.autoScale]);
      if (el < ${ms}) requestAnimationFrame(g); else r(); }; requestAnimationFrame(g); });
    const dt=(performance.now()-t0)/1000; const loopMedian=__LW.perf.loopMedian; __LW.pause();
    const iv=pT.slice(1).map((t,i)=>t-pT[i]).sort((a,b)=>a-b); const med=iv.length?iv[iv.length>>1]:0;
    const doneT=P.doneT.slice(), civ=doneT.slice(1).map((t,i)=>t-doneT[i]).sort((a,b)=>a-b);
    return { label:${JSON.stringify(label)}, seconds:+dt.toFixed(2), rafPerS:+(n/dt).toFixed(1), loopFramesPerS:+((S.frames-fr0)/dt).toFixed(1), presentsPerS:+((S.presents-p0)/dt).toFixed(1),
      submitsPerS:+((P.subs-s0)/dt).toFixed(1), completionsPerS:+((P.done-d0)/dt).toFixed(1), queueDepthMax:depthMax, skipped:(S.skipped||0)-k0, skippedDefined:S.skipped!==undefined,
      paced:f.paced, inFlightMax, presentIntervalMedianMs:+med.toFixed(2), completionIntervalMedianMs:+(civ.length?civ[civ.length>>1]:0).toFixed(2), loopMedianMs:+loopMedian.toFixed(3),
      autoScaleFirstChangeMs:firstChange, autoScaleTrace:sc, autoScaleEnd:q.autoScale, governor:__LW.governor.state, canvas:[f.canvas.width,f.canvas.height] }; })()`);
  R.default = await play('as booted · 1s+2pz · 64³/160/1 · AUTO SCALE on · governor on', '');
  console.log('default', JSON.stringify(R.default));
  /* the 128³ axial gas, UI shown, only the core windows (bench-chromium's scene) */
  await ev(`(async()=>{ __LW.windowActivity.presentOffscreen(false); for(const d of document.querySelectorAll('.dev')) if(!['spectrum','shadow','settings','state','palette','observer','camera','clip'].includes(d.dataset.id)) d.classList.add('closed');
    __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); __LW.quality.res=128; __LW.quality.steps=240; __LW.quality.scale=1; __LW.schedule(4); await __LW.settle(); await __LW.settle(); return 1; })()`);
  await sleep(800);
  R.gpuAtScale1 = await gpu();
  console.log('gpu', JSON.stringify(R.gpuAtScale1));
  R.fixed = await play('128³ gas · AUTO SCALE off · governor off', `__LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1`);
  console.log('fixed', JSON.stringify(R.fixed));
  R.auto = await play('128³ gas · AUTO SCALE on · governor off', `__LW.governor.on=false; __LW.quality.auto=true; __LW.quality.autoScale=1`);
  console.log('auto', JSON.stringify(R.auto));
  R.autoGov = await play('128³ gas · AUTO SCALE on · governor on (as shipped)', `__LW.governor.on=true; __LW.quality.auto=true; __LW.quality.autoScale=1`);
  console.log('autoGov', JSON.stringify(R.autoGov));
  R.errs = await ev('window.__e');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); R.stderr = stderr.slice(-2000); }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
