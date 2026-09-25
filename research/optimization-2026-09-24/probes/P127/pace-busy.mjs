/* pace-busy.mjs — wave 127 · PACE1 under a BUSY START, in Electron on the RTX.  Before the page's first script, the first
 * completions of the device's queue are made late (GPUQueue.prototype.onSubmittedWorkDone resolves DELAYS[i] ms after the
 * real answer) — a GPU still busy at boot (another tab, the previous page), the 8th iPad report's 57/20/45 ms — then the
 * page reloads with that in place and field.paced / field.paceWaits are read after the chain ends.
 *   LW_PORT=8740 DELAYS=57,20,45 node research/optimization-2026-09-24/probes/P127/pace-busy.mjs [out.json]
 * DELAYS='' → no delay (the plain Electron read). */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const OUT = process.argv[2] || '';
const PORT = process.env.LW_PORT || '8740';
const DELAYS = (process.env.DELAYS ?? '57,20,45').split(',').filter(Boolean).map(Number);
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw127-pace-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9700 + Math.floor(Math.random() * 200);
const MAIN = new URL('../../../../tools/perf/electron-main.cjs', import.meta.url).pathname;
const proc = spawn(ELECTRON, [MAIN, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: '1600', LW_H: '1000', LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE,
    LW_URL: `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0` } });
let ws = null, out = null;
try {
  let target = null;
  for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page' && x.url.includes('/lab/')); } catch {} if (!target) await sleep(250); }
  if (!target) throw new Error('no page target');
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { if (!self.GPUQueue) return; const orig = GPUQueue.prototype.onSubmittedWorkDone, D = ${JSON.stringify(DELAYS)}; let n = 0;
    GPUQueue.prototype.onSubmittedWorkDone = function () { const d = D[n++]; const p = orig.call(this); return d === undefined ? p : p.then(() => new Promise((r) => setTimeout(r, d))); }; })();` });
  await send('Page.reload', { ignoreCache: true });
  await sleep(500);
  for (let i = 0; i < 400; i++) { try { if (await ev('!!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
  await sleep(3500);                                        // the chain ends on its own (≤ 30 tries / 1.5 s)
  out = await ev(`({ delays: ${JSON.stringify(DELAYS)}, paced: __LW.field.paced, waits: __LW.field.paceWaits, ua: navigator.userAgent.replace(/.*(Chrome\\/[0-9.]+).*/, '$1') })`);
} catch (e) { out = { error: String(e && e.stack || e) }; }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
