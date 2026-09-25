/* PACE · a bare Electron boot that prints what the expressions on the command line evaluate to after __LW.ready.
 *   LW_PORT=8734 node research/optimization-2026-09-24/probes/PACE/electron-eval.mjs '<expr>' ['<expr>' …]
 * LW_QS appends to the lab's query string. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-pace-ev-'));
const PORT = process.env.LW_PORT || '8734';
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9700 + Math.floor(Math.random() * 200);
const proc = spawn(ELECTRON, [path.resolve('tools/perf/electron-main.cjs'), '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: process.env.W || '1920', LW_H: process.env.H || '1080', LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE,
    LW_URL: `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0${process.env.LW_QS || ''}` } });
let ws = null;
try {
  let target = null;
  for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page' && x.url.includes('/lab/')); } catch {} if (!target) await sleep(250); }
  if (!target) throw new Error('no page target');
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable');
  for (let i = 0; i < 400; i++) { try { if (await ev('!!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
  await ev(`(()=>{ const w=__LW.warning; if (w.open) w.dismiss(); return 1; })()`);
  await sleep(+(process.env.WAIT || 800));
  for (const e of process.argv.slice(2)) console.log(JSON.stringify(await ev(e)));
} catch (e) { console.error('EVAL ERROR', e.message); }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
