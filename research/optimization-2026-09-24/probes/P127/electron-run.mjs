/* electron-run.mjs — wave 127: evaluate one expression file in Electron (Chromium 152, the RTX on DISPLAY :0, fresh profile),
 * the photosensitivity pane dismissed through the app's road, and print the value as JSON.
 *   LW_PORT=8740 node research/optimization-2026-09-24/probes/P127/electron-run.mjs <expr.js> [out.json] [path=/lab/] [query] */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const [EXPR, OUT, PAGE = '/lab/', QUERY = ''] = process.argv.slice(2);
const PORT = process.env.LW_PORT || '8740';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw127-electron-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpPort = 9700 + Math.floor(Math.random() * 200);
const MAIN = new URL('../../../../tools/perf/electron-main.cjs', import.meta.url).pathname;
const proc = spawn(ELECTRON, [MAIN, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: String(W), LW_H: String(H), LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE,
    LW_URL: `https://127.0.0.1:${PORT}${PAGE}?preset=1s%2B2pz&sw=0&warn=0${QUERY}` } });
let stderr = ''; proc.stderr.on('data', (d) => { stderr += d; });
let ws = null, out = null;
try {
  let target = null;
  for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page' && x.url.includes(PAGE)); } catch {} if (!target) await sleep(250); }
  if (!target) throw new Error('no page target: ' + stderr.split('\n').slice(-4).join(' | '));
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable');
  for (let i = 0; i < 400; i++) { try { if (await ev('!!(window.__LW && __LW.ready && __LW.field.ok)')) break; } catch {} await sleep(100); }
  await ev(`(()=>{ const w=__LW.warning; if (w && w.open) w.dismiss(); return 1; })()`);
  const TRACE = process.env.TRACE, events = [];
  if (TRACE) {
    const prev = ws.onmessage; ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === 'Tracing.dataCollected') events.push(...d.params.value); else if (d.method === 'Tracing.tracingComplete') events.done = true; else prev(m); };
    await send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: (process.env.TRACE_CATS || 'toplevel,gpu,viz,cc,blink,blink.user_timing,disabled-by-default-devtools.timeline,benchmark,renderer.scheduler,disabled-by-default-gpu.dawn,dawn').split(',') } });
  }
  out = await ev(fs.readFileSync(EXPR, 'utf8'));
  if (TRACE) { await send('Tracing.end'); for (let i = 0; i < 200 && !events.done; i++) await sleep(100); fs.writeFileSync(TRACE, JSON.stringify(events)); }
} catch (e) { out = { error: String(e && e.stack || e) }; }
finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, Number(process.env.PRINT || 6000)));
