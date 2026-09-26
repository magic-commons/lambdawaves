/* W128 · ONE CONTROLLER, measured in Electron (Chromium, Dawn) on the real RTX — base vs after, the same scenes on both trees.
 *   LW_PORT=8743 node research/optimization-2026-09-24/probes/W128/w128-controller.mjs <out.json> [scene,…]
 * One boot per scene (a fresh profile each, `?gastab=0` so the axial gas is the old reconstruct-bound kernel), UI hidden for
 * gas/glass (the probe judges the GPU path, as probes/A/governor.js did), both switches ON as shipped, playing SECS s:
 *   gas      the axial gas in the BOX at 128³ × 240 × 1 (reconstruct-bound)  — AUDIT-A FA4's scene
 *   glass    hydrogen 1s+2pz at 128³ × 240 × 1 in the GLASS style (present-bound: ~18 ms present, 0.1 ms reconstruct)
 *   default  1s+2pz at 96³ × 160 × 1, UI shown, 5 s: nothing may move
 *   wigner   sim-ladder with WIGNER open, 10 s (probes/F/probe-f-extra's scene): which readers park, and the probes
 * WARM=1 plays the default scene 1.5 s before the setup (the 120 Hz budget learned, as in a session in use).
 * Every 250 ms: grid, stepCap, mat.steps, governor drop/state/median, autoScale, canvas width, fps.  Then PAUSE: what the pause
 * law put back. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const PORT = process.env.LW_PORT || '8743';
const OUT = process.argv[2] || '';
const SCENES = (process.argv[3] || 'gas,glass,default,wigner').split(',');
const SECS = +(process.env.SECS || 45);
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const MAIN = new URL('../../../../tools/perf/electron-main.cjs', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = { at: new Date().toISOString(), port: PORT, secs: SECS, warm: !!process.env.WARM, scenes: {} };
async function boot(fn) {
  const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-w128-'));
  const cdpPort = 9300 + Math.floor(Math.random() * 180);
  const proc = spawn(ELECTRON, [MAIN, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: '1920', LW_H: '1080', LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE,
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
    await ev(`(()=>{ const w=__LW.warning; if (w && w.open) w.dismiss(); return 1; })()`);
    await sleep(1500);
    return await fn(ev);
  } finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
}
const SETUP = {
  gas: `L.setHamiltonian('well'); L.setGasBasis('axial'); L.enterBox(); L.pause(); L.quality.res=128; L.quality.steps=240; L.quality.scale=1;`,
  glass: `L.setHamiltonian('hydrogen'); L.setGasBasis('reg'); L.loadPreset('1s+2pz'); L.pause(); L.quality.res=128; L.quality.steps=240; L.quality.scale=1; L.setStyle('glass');`,
  default: `L.loadPreset('1s+2pz'); L.pause(); L.quality.res=96; L.quality.steps=160; L.quality.scale=1;`,
  wigner: `L.loadPreset('sim-ladder'); L.pause(); L.layout.reopen('wigner', 'R'); L.windowActivity.presentOffscreen(true);`,
};
const HIDE = { gas: true, glass: true, default: false, wigner: false };
const DUR = { gas: SECS, glass: SECS, default: 5, wigner: 10 };
for (const sc of SCENES) for (let attempt = 0; attempt < 2 && !(R.scenes[sc] && !R.scenes[sc].E); attempt++) {
  try {
    R.scenes[sc] = await boot(async (ev) => ev(`(async()=>{ ${process.env.WARM ? `__LW.loadPreset('1s+2pz'); __LW.play(); await new Promise((r)=>setTimeout(r,1500)); __LW.pause(); await __LW.settle();` : ''} const L=__LW, F=L.field, canvas=document.getElementById("field"), trail=[]; const ST=async(w)=>{ const a=performance.now(); try { await L.settle(); } catch(e) { throw new Error("settle#"+trail.length+" after "+(performance.now()-a).toFixed(0)+" ms: "+e.message+" frames "+L.stats.frames+" sched "+L.stats.scheduled+" vis "+document.visibilityState); } trail.push(1); };
      ${SETUP[sc]} L.schedule(4); await ST("x"); await ST("x");
      L.governor.on=true; L.quality.auto=true; L.quality.autoScale=1;
      ${HIDE[sc] ? `if (!L.uiHidden) L.keys.toggleUI();` : ''} await ST("x");
      const split = await F.throughput({modes:L.modesAt(L.clock.t), obs:L.obs, mat:L.mat, n:20, targetMs:1200});
      await ST("x");
      const series=[]; let lastRes=F.resolution, resChanges=0, lastScale=L.quality.autoScale, scaleChanges=0, lastCap=F.stepCap, capChanges=0;
      const g0=L.governor.changes, p0=L.stats.presents, parked=new Set(), t0=performance.now(); L.play();
      while (performance.now()-t0 < ${DUR[sc]}*1000) {
        await new Promise((r)=>setTimeout(r,250));
        const res=F.resolution; if (res!==lastRes) { resChanges++; lastRes=res; }
        const s=L.quality.autoScale; if (s!==lastScale) { scaleChanges++; lastScale=s; }
        const cap=F.stepCap; if (cap!==lastCap) { capChanges++; lastCap=cap; }
        for (const n of L.governor.parked) parked.add(n);
        series.push({ t:+((performance.now()-t0)/1000).toFixed(2), res, stepCap: cap===Infinity?'inf':cap, steps:L.mat.steps, drop:L.governor.drop, state:L.governor.state, median:+(+L.governor.median).toFixed(1), autoScale:s, cw:canvas.width, fps:+L.stats.fps.toFixed(1) });
      }
      const secs=(performance.now()-t0)/1000, presents=L.stats.presents-p0, probes=L.governor.probes, parkedEnd=L.governor.parked;
      L.pause(); await ST("x"); await ST("x");
      const after = { res:F.resolution, stepCap:F.stepCap===Infinity?'inf':F.stepCap, steps:L.mat.steps, drop:L.governor.drop, autoScale:L.quality.autoScale, cw:canvas.width };
      if (L.uiHidden) L.keys.toggleUI();
      const rows = series.filter((r,i)=>i===0||['res','stepCap','drop','autoScale','steps'].some((k)=>r[k]!==series[i-1][k]));
      const bins=[]; for (let b=0;b<Math.ceil(${DUR[sc]}/5);b++) { const w=series.filter((r)=>r.t>b*5&&r.t<=(b+1)*5); if (w.length) bins.push(+(w.reduce((a,r)=>a+r.fps,0)/w.length).toFixed(1)); }
      return { scene:'${sc}', split:{frameMs:+split.frameMs.toFixed(2), presentMs:+split.presentMs.toFixed(2), reconstructMs:+split.reconstructMs.toFixed(2), w:split.w, h:split.h}, mode:L.perf.mode, secs:+secs.toFixed(1), meanFps:+(presents/secs).toFixed(1), fpsPer5s:bins,
        resChanges, scaleChanges, stepCapChanges:capChanges, governorChanges:L.governor.changes-g0, final:series[series.length-1], rows, parkedSeen:[...parked], parkedEnd, probes, afterPause:after, errs:(window.__e||[]).map(String).slice(0,5) }; })()`));
  } catch (e) { R.scenes[sc] = { E: String(e && e.stack || e) }; }
  const s = R.scenes[sc];
  console.log(sc, JSON.stringify({ split: s.split, meanFps: s.meanFps, fpsPer5s: s.fpsPer5s, resChanges: s.resChanges, scaleChanges: s.scaleChanges, stepCapChanges: s.stepCapChanges, final: s.final, parkedSeen: s.parkedSeen, probes: s.probes, afterPause: s.afterPause, E: s.E }));
  console.log('   rows', JSON.stringify((s.rows || []).map((r) => [r.t, r.res, r.stepCap, r.drop, r.autoScale, r.median, r.fps])));
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
process.exit(0);
