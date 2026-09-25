/* probes/A/run-electron.mjs — the same probe body, in Chromium 152 (Electron 44, Dawn) on the real RTX, via CDP.
 *   LW_PORT=8721 node research/optimization-2026-09-24/probes/A/run-electron.mjs <probe-body.js> [out.json]
 * Reuses tools/perf/electron-main.cjs (a fresh profile per run, the photosensitivity pane dismissed through the app's own
 * road).  A window opens on the session display for the run and closes itself.  PRE is prepended to the body, as in run.mjs. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const PORT = process.env.LW_PORT || '8721';
const body = (process.env.PRE || '') + fs.readFileSync(process.argv[2], 'utf8');
const OUT = process.argv[3] || process.argv[2].replace(/\.js$/, '.electron.out.json');
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const MAIN = new URL('../../../../tools/perf/electron-main.cjs', import.meta.url).pathname;
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-electron-A-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9500 + Math.floor(Math.random() * 150);
const t0 = Date.now();
const proc = spawn(ELECTRON, [MAIN, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: String(W), LW_H: String(H), LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE,
    LW_URL: `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0` } });
let stderr = ''; proc.stderr.on('data', (d) => { stderr += d; });
let ws = null, R = null;
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
  R = await ev(`(async()=>{ try { ${body} } catch (e) { return { E: String(e && e.stack || e) }; } })()`);
  if (R && typeof R === 'object') R.host = 'electron-chromium152-dawn';
} catch (e) { R = { E: String(e && e.stack || e) }; }
finally { try { ws && ws.close(); } catch {} proc.kill(); }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log(JSON.stringify(R).slice(0, 3000));
console.log('wrote', OUT, 'in', ((Date.now() - t0) / 1000).toFixed(1), 's');
try { process.kill(proc.pid, 'SIGKILL'); } catch {}
process.exit(0);
