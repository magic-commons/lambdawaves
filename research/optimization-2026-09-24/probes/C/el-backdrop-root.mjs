/* el-backdrop-root.mjs — Lane C: does an ancestor's opacity < 1 (a BACKDROP ROOT) strip the frost from DISCONNECTED cards?
 * `.dev.dragging` sets opacity .97 on the card whose head/body carry the backdrop-filter; `body.rack-hidden #rack` fades the
 * rack's opacity during its slide.  Paused field, three crops of the SPECTRUM card: normal, card opacity .97, rack opacity .99.
 *   LW_PORT=8721 node research/optimization-2026-09-24/probes/C/el-backdrop-root.mjs */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const ELECTRON = createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9760 + Math.floor(Math.random() * 60);
const DIR = 'research/optimization-2026-09-24/probes/C/';
const proc = spawn(ELECTRON, [new URL('../../../../tools/perf/electron-main.cjs', import.meta.url).pathname, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: '1920', LW_H: '1080', LW_NO_SANDBOX: '1', LW_PROFILE: `/tmp/lw-labC-br-${cdpPort}-${Date.now()}`,
    LW_URL: `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0` } });
let ws = null; const out = {};
try {
  let target = null;
  for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page' && x.url.includes('/lab/')); } catch {} if (!target) await sleep(250); }
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{ ${expression} })()`, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.text); return r.result.result.value; };
  await send('Runtime.enable'); await send('Page.enable');
  for (let i = 0; i < 400; i++) { try { if (await ev('return !!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
  await ev(`__LW.warning.dismiss(); return 1;`); await sleep(600);
  await ev(`__LW.loadPreset('sim-ladder'); __LW.setDisconnected(true); __LW.setFrost('always'); __LW.setCardStyle('refractive'); __LW.setTheme('dark'); __LW.pause(); __LW.quality.res=96; __LW.schedule(4); await __LW.settle(); await new Promise(r=>setTimeout(r,1500)); return 1;`);
  const box = await ev(`const r=document.querySelector('.dev[data-id="spectrum"] .dev-body').getBoundingClientRect(); return {x:Math.max(0,r.left-8), y:Math.max(0,r.top-50), width:Math.min(320,r.width+16), height:420};`);
  const shot = async (name, css) => {
    await ev(`let s=document.getElementById('labC'); if(!s){s=document.createElement('style'); s.id='labC'; document.head.appendChild(s);} s.textContent=${JSON.stringify(css)}; await new Promise(r=>setTimeout(r,500)); return 1;`);
    const r = await send('Page.captureScreenshot', { format: 'png', clip: { ...box, scale: 1 } });
    fs.writeFileSync(DIR + 'br-' + name + '.png', Buffer.from(r.result.data, 'base64')); out[name] = r.result.data.length;
  };
  const STRIPES = '#stage{background:repeating-linear-gradient(45deg,#f00 0 6px,#00f 6px 12px)!important}#field{opacity:0!important}';
  await shot('normal', STRIPES);
  await shot('card-opacity-097', STRIPES + '.dev[data-id="spectrum"]{opacity:.97!important}');
  await shot('rack-opacity-099', STRIPES + '#rack{opacity:.99!important}#rackL{opacity:.99!important}');
  await shot('dragging-class', STRIPES);
  await ev(`document.querySelector('.dev[data-id="spectrum"]').classList.add('dragging'); await new Promise(r=>setTimeout(r,500)); return 1;`);
  { const r = await send('Page.captureScreenshot', { format: 'png', clip: { ...box, scale: 1 } }); fs.writeFileSync(DIR + 'br-dragging-class.png', Buffer.from(r.result.data, 'base64')); }
  console.log(JSON.stringify(out));
} catch (e) { console.error('PROBE ERROR', e); }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); }
