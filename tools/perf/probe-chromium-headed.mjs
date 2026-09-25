/* probe-chromium-headed.mjs — a HEADED Chromium on the session display: on this box it is the only way Chromium gets the
 * RTX for both WebGPU and compositing (headless=new falls to SwiftShader).  Prints the adapter and a 2 s play fps. */
import { sleep } from './cdp.mjs';
import { spawn } from 'node:child_process';
const PORT = process.env.LW_PORT || '8721';
const port = 9600 + Math.floor(Math.random() * 300);
const profile = `/home/joshua-hosain/snap/chromium/common/lw-headed-${port}`;
const extra = (process.env.CHROME_ARGS || '').split(' ').filter(Boolean);
const proc = spawn('/snap/bin/chromium', ['--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1600,900', '--window-position=0,0',
  '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--ignore-certificate-errors', ...extra, 'about:blank'], { stdio: 'ignore', env: { ...process.env, DISPLAY: ':0' } });
try {
  let ok = false; for (let i = 0; i < 80 && !ok; i++) { try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ok = true; } catch { await sleep(250); } }
  if (!ok) throw new Error('no devtools port');
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.text); return r.result.result.value; };
  await send('Page.enable'); await send('Page.navigate', { url: `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0` });
  for (let i = 0; i < 300; i++) { try { if (await ev('!!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
  console.log(JSON.stringify(await ev(`({ok: __LW.field.ok, err: __LW.field.error, adapter: __LW.field.adapterInfo, errs: window.__e, dpr: devicePixelRatio, w: innerWidth, h: innerHeight, gl: (()=>{const c=document.createElement('canvas');const g=c.getContext('webgl2');const d=g&&g.getExtension('WEBGL_debug_renderer_info');return d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):null})()})`), null, 1));
  console.log('play 2 s:', JSON.stringify(await ev(`new Promise(r=>{__LW.play();let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else{__LW.pause();r({fps:n/2, median:__LW.perf.median, appFps:__LW.stats.fps})}};requestAnimationFrame(f)})`)));
} catch (e) { console.error('PROBE ERROR', e.message); }
finally { proc.kill(); await sleep(300); spawn('rm', ['-rf', profile]); }
