/* electron-gas.mjs — LANE B: hunt the lead's "10.9 ms loop median in 128³ axial gas · UI shown" (baseline-chromium.json)
 * in the SAME host (Electron 44 / Chromium 152, real GPU, session display), with the frame-inventory shim installed so
 * every loop frame is timed and attributed.  Replays the bench's last three scenes (every window open → UI hidden →
 * the gas scene) and then the gas scene again with the two default-folded windows (settings, state) folded back.
 *   LW_PORT=8721 node research/optimization-2026-09-24/probes/B/electron-gas.mjs [out.json]
 * A window opens on the desktop for ~1 minute and closes itself. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/probes/B/electron-gas.json';
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-electron-laneB-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9500 + Math.floor(Math.random() * 150);
const src = fs.readFileSync(new URL('./frame-inventory.mjs', import.meta.url), 'utf8');
const SHIM = src.slice(src.indexOf('String.raw`') + 11, src.indexOf('return { wrapFail: B.wrapFail };`') + 'return { wrapFail: B.wrapFail };'.length);
const R = { at: new Date().toISOString(), host: 'electron', scenes: [], notes: [] };
const proc = spawn(ELECTRON, [new URL('../../../../tools/perf/electron-main.cjs', import.meta.url).pathname, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
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
  const ev = async (body) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{ ${body} })()`, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable');
  for (let i = 0; i < 400; i++) { try { if (await ev('return !!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
  R.boot = await ev(`const w=__LW.warning; if (w.open) w.dismiss(); return {ok:__LW.field.ok, ua:navigator.userAgent, dpr:devicePixelRatio, frost:__LW.frost, perfMode:__LW.perf.mode};`);
  console.log('boot', JSON.stringify(R.boot));
  R.shim = await ev(SHIM); console.log('shim', JSON.stringify(R.shim));
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.quality.res=96; __LW.quality.steps=160; __LW.quality.scale=1; __LW.schedule(4); await __LW.settle(); return 1;`);
  const scene = async (label, setup, secs = 3) => {
    const r = await ev(`${setup || ''}; await __LW.settle(); await new Promise(r=>setTimeout(r,400)); __LW.perf.resetRing(); __B.reset(); __LW.play();
      await new Promise(r=>setTimeout(r,${secs * 1000})); const s=__B.summary(); __LW.pause(); await __LW.settle();
      s.open=[...document.querySelectorAll('.dev:not(.closed)')].map(d=>d.dataset.id+(d.classList.contains('folded')?'(f)':'')).join(' '); s.uiHidden=__LW.uiHidden; s.frost=__LW.frostLive; s.res=__LW.field.resolution;
      s.perFrameMs = __B.log.map(f=>+f.ms.toFixed(2)); s.perFrameTop = __B.log.map(f=>Object.entries(f.t).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>k+':'+v.toFixed(2)).join(',')); return s;`);
    r.label = label; R.scenes.push(r);
    console.log('scene', label, JSON.stringify({ frames: r.frames, loopMs: r.loopMs, lw: r.lwPerfMedian, profile: r.profile, perFrame: r.perFrame }));
    return r;
  };
  await scene('all rack windows open (every card)', `for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.windowActivity.presentOffscreen(true)`);
  await scene('all rack windows open · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  const gas = `if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.windowActivity.presentOffscreen(false); for(const d of document.querySelectorAll('.dev')) if(!['spectrum','shadow','settings','state','palette','observer','camera','clip'].includes(d.dataset.id)) d.classList.add('closed'); __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); __LW.quality.res=128; __LW.quality.steps=240; __LW.schedule(4)`;
  await scene('128³ · axial gas · UI shown (bench replay)', gas, 4);
  await scene('128³ · axial gas · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`, 4);
  await scene('128³ · axial gas · UI shown again', `if(__LW.uiHidden) __LW.keys.toggleUI()`, 4);
  await scene('128³ · axial gas · settings+state folded back', `for (const id of ['settings','state']) { const d=document.querySelector('.dev[data-id="'+id+'"]'); if (d && !d.classList.contains('folded')) d.querySelector('.dev-fold')?.click(); }`, 4);
  await scene('128³ · axial gas · perf FULL', `__LW.perf.setMode('full')`, 4);
  R.errs = await ev('return window.__e');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); R.stderr = stderr.slice(-2000); }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); console.log('wrote', OUT);
