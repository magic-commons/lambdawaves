/* el-gpu.mjs — Lane C, the GPU-BOUND interleaved A/B of ff-headed-gpu.mjs, in Electron (Chromium 152's compositor, the real
 * RTX, a FRESH profile, the photosensitivity pane dismissed through __LW.warning).  Scene: style GLASS, 128³, 240 steps, so
 * the frame is GPU-limited and ΔGPU ≈ 1000/fpsA − 1000/fpsB.  Each diagnostic REMOVES something only to price it.
 *   LW_PORT=8721 node research/optimization-2026-09-24/probes/C/el-gpu.mjs [out.json]      (LW_DSF=2 for the retina case) */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/probes/C/el-gpu-cull.json';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080), SECS = +(process.env.SECS || 3), REPS = +(process.env.REPS || 3);
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9650 + Math.floor(Math.random() * 100);
const R = { at: new Date().toISOString(), viewport: [W, H], host: 'electron', dsf: process.env.LW_DSF || '1', exps: [] };
const proc = spawn(ELECTRON, [new URL('../../../../tools/perf/electron-main.cjs', import.meta.url).pathname, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: String(W), LW_H: String(H), LW_NO_SANDBOX: '1', LW_PROFILE: `/tmp/lw-labC-gpu-${cdpPort}-${Date.now()}`,
    LW_URL: `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0` } });
let stderr = ''; proc.stderr.on('data', (d) => { stderr += d; });
let ws = null;
try {
  let target = null;
  for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page' && x.url.includes('/lab/')); } catch {} if (!target) await sleep(250); }
  if (!target) throw new Error('no page target: ' + stderr.split('\n').slice(-4).join(' | '));
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{ ${expression} })()`, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable');
  for (let i = 0; i < 400; i++) { try { if (await ev('return !!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
  R.warn = await ev(`const w=__LW.warning; const was=w.open; if (was) w.dismiss(); return { was, open: w.open };`); await sleep(600);
  R.boot = await ev(`return {ok:__LW.field.ok, dpr:devicePixelRatio, w:innerWidth, h:innerHeight, card:document.body.dataset.card, frost:__LW.frost, disc:__LW.disconnected, theme:__LW.theme, warn: !document.getElementById('warnPane').hidden};`);
  console.log('boot', JSON.stringify(R.boot), JSON.stringify(R.warn));
  const setCss = (css) => ev(`let s=document.getElementById('labC'); if(!s){s=document.createElement('style'); s.id='labC'; document.head.appendChild(s);} s.textContent=${JSON.stringify(css || '')}; await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); return 1;`);
  const fps = () => ev(`await __LW.settle(); await new Promise(r=>setTimeout(r,300)); __LW.play();
    let n=0; const t0=performance.now(); await new Promise(r=>{const f=()=>{n++; if(performance.now()-t0<${SECS * 1000}) requestAnimationFrame(f); else r();}; requestAnimationFrame(f);});
    const dt=(performance.now()-t0)/1000; __LW.pause(); return +(n/dt).toFixed(2);`);
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const exp = async (name, { setupA = '', setupB = '', cssA = '', cssB = '' } = {}) => {
    const A = [], B = [];
    for (let i = 0; i < REPS; i++) {
      await setCss(cssA); await ev(`${setupA}; await __LW.settle(); return 1;`); A.push(await fps());
      await setCss(cssB); await ev(`${setupB}; await __LW.settle(); return 1;`); B.push(await fps());
    }
    await setCss(''); await ev(`${setupA}; return 1;`);
    const mA = mean(A), mB = mean(B);
    const r = { name, A, B, fpsA: +mA.toFixed(1), fpsB: +mB.toFixed(1), msA: +(1000 / mA).toFixed(2), msB: +(1000 / mB).toFixed(2), gpuMsSaved: +(1000 / mA - 1000 / mB).toFixed(2) };
    R.exps.push(r); console.log('exp', JSON.stringify(r));
  };
  const NOBF = '{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}';
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.setDisconnected(true); __LW.setFrost('always'); __LW.setCardStyle('refractive'); __LW.setStyle('glass'); __LW.quality.res=128; __LW.quality.steps=240; __LW.quality.scale=1; __LW.schedule(4); await __LW.settle(); return 1;`);
  await exp('A/A calibration (nothing changes)');
  await exp('offscreen cards culled (camera+clip, fully below the rack clip): does Chromium already skip them?', { cssB: '.dev[data-id="camera"],.dev[data-id="clip"],.dev[data-id="camera"]>*,.dev[data-id="clip"]>*{visibility:hidden!important}' });
  await exp('every window open: cards past the 6th in #rack hidden (all off-screen)', { setupA: `for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.windowActivity.presentOffscreen(true)`, setupB: `1`, cssB: '#rack>.dev:nth-child(n+8),#rack>.dev:nth-child(n+8)>*{visibility:hidden!important}' });
  R.errs = await ev('return window.__e');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); R.stderr = stderr.slice(-1500); }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT);
