/* bench-chromium.mjs — the COMPOSITOR baseline: Chromium (Electron 44 / Chromium 152) with the real GPU on the session display.
 * Headless Chromium on this box composites in SwiftShader, so the frost / refractive / Frame costs can only be read here.
 *   LW_PORT=8721 node tools/perf/bench-chromium.mjs [out.json]
 * Needs an Electron binary: ELECTRON=/path/to/electron (default: the hosts-m0 worktree's node_modules/electron).
 * A window opens on the desktop for the run and closes itself. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/baseline-chromium.json';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9700 + Math.floor(Math.random() * 200);
const R = { at: new Date().toISOString(), viewport: [W, H], host: 'electron', boot: null, scenes: [], notes: [] };
const t0 = Date.now();
/* --no-sandbox is a LAUNCH argument: Chromium checks the SUID helper before any app code runs (this box's chrome-sandbox is not root-owned; see hosts-m0's ACCEPTANCE-MATRIX) */
const proc = spawn(ELECTRON, [new URL('./electron-main.cjs', import.meta.url).pathname, ...(process.env.LW_SANDBOX ? [] : ['--no-sandbox'])], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: String(W), LW_H: String(H), LW_NO_SANDBOX: process.env.LW_NO_SANDBOX || '1',
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
  R.boot = await ev(`({readyMs:+performance.now().toFixed(0), adapter:__LW.field.adapterInfo, ok:__LW.field.ok, err:__LW.field.error, errs:window.__e, dpr:devicePixelRatio, w:innerWidth, h:innerHeight, ua:navigator.userAgent, card:document.body.dataset.card, frost:__LW.frost, theme:__LW.theme, blur:getComputedStyle(document.documentElement).getPropertyValue('--glass-blur')})`);
  console.log('boot', JSON.stringify(R.boot));
  if (!R.boot.ok) throw new Error('no WebGPU in this host: ' + R.boot.err);
  await ev(`(async()=>{ __LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.quality.res=96; __LW.quality.steps=160; __LW.quality.scale=1; __LW.schedule(4); await __LW.settle(); return 1; })()`);
  /* one scene = a body/setting state; the number is the compositor's delivered rAF rate over 3 s while playing, beside the loop's own main-thread median */
  const scene = async (label, setup) => {
    const r = await ev(`(async()=>{ ${setup || ''}; await __LW.settle(); await new Promise(r=>setTimeout(r,400)); __LW.perf.resetRing(); __LW.play();
      let n=0; const f0=__LW.stats.frames, t0=performance.now(); await new Promise(r=>{const f=()=>{n++; if(performance.now()-t0<3000) requestAnimationFrame(f); else r();}; requestAnimationFrame(f);});
      const dt=(performance.now()-t0)/1000; __LW.pause();
      return {rafFps:+(n/dt).toFixed(1), appFps:+((__LW.stats.frames-f0)/dt).toFixed(1), loopMedianMs:+__LW.perf.median.toFixed(3), fieldMs:+__LW.perf.profile.field.toFixed(3), encodeMs:+__LW.stats.lastEncodeMs.toFixed(3),
        card:document.body.dataset.card, frost:__LW.frostLive, blur:getComputedStyle(document.documentElement).getPropertyValue('--glass-blur').trim(), disc:__LW.disconnected, uiHidden:__LW.uiHidden, rackHidden:document.body.classList.contains('rack-hidden'), frame:__LW.mat.frameMode, frameOn:__LW.mat.frame, open:document.querySelectorAll('.dev:not(.closed)').length, modwin:__LW.mod.expanded, notebook:__LW.notebook.isOpen}; })()`);
    r.label = label; R.scenes.push(r); console.log('scene', label, JSON.stringify(r)); return r;
  };
  await scene('default · refractive · frost ALWAYS · blur 22 · light', '');
  await scene('UI hidden (H)', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('UI shown again', `if(__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('rack hidden (B), transport visible', `document.body.classList.add('rack-hidden')`);
  await scene('rack shown', `document.body.classList.remove('rack-hidden')`);
  await scene('frost OFF · refractive', `__LW.setFrost('off')`);
  await scene('frost STILL (holds while playing) · refractive', `__LW.setFrost('still')`);
  await scene('frost ALWAYS · blur 8', `__LW.setFrost('always'); document.documentElement.style.setProperty('--glass-blur','8px')`);
  await scene('frost ALWAYS · blur 22 · tinted', `document.documentElement.style.setProperty('--glass-blur','22px'); __LW.setCardStyle('tinted')`);
  await scene('frost OFF · tinted', `__LW.setFrost('off')`);
  await scene('frost ALWAYS · refractive · disconnected', `__LW.setCardStyle('refractive'); __LW.setFrost('always'); __LW.setDisconnected(true)`);
  await scene('connected again', `__LW.setDisconnected(false)`);
  await scene('dark theme · refractive · frost ALWAYS', `__LW.setTheme('dark')`);
  await scene('light theme again', `__LW.setTheme('light')`);
  await scene('FRAME lattice', `__LW.mat.frameMode='lattice'; __LW.setFrame(true)`);
  await scene('FRAME dots', `__LW.mat.frameMode='dots'; __LW.setFrame(true)`);
  await scene('FRAME off', `__LW.setFrame(false)`);
  await scene('FRAME box again', `__LW.mat.frameMode='box'; __LW.setFrame(true)`);
  await scene('modulation window open', `__LW.mod.expand()`);
  await scene('modulation window closed', `__LW.mod.collapse()`);
  await scene('notebook open', `__LW.notebook.open('notes')`);
  await scene('notebook closed', `__LW.notebook.close()`);
  await scene('all rack windows open (every card)', `for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.windowActivity.presentOffscreen(true)`);
  await scene('all rack windows open · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('128³ · axial gas · UI shown', `if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.windowActivity.presentOffscreen(false); for(const d of document.querySelectorAll('.dev')) if(!['spectrum','shadow','settings','state','palette','observer','camera','clip'].includes(d.dataset.id)) d.classList.add('closed'); __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); __LW.quality.res=128; __LW.quality.steps=240; __LW.schedule(4)`);
  await scene('128³ · axial gas · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('128³ · axial gas · UI shown · frost OFF', `if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.setFrost('off')`);
  R.errs = await ev('window.__e');
} catch (e) { console.error('BENCH ERROR', e); R.error = String(e && e.stack || e); R.stderr = stderr.slice(-2000); }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); }
R.wallSec = +((Date.now() - t0) / 1000).toFixed(1);
fs.mkdirSync('research/optimization-2026-09-24', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT, 'in', R.wallSec, 's');
