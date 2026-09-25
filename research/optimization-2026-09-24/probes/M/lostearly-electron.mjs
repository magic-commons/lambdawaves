/* lostearly-electron.mjs — lane M · M1 gate, the same three lost-device copies as lostearly.mjs in Electron 44 /
 * Chromium 152 on the RTX (pattern: probes/F/probe-f-lostearly-electron.mjs; fresh profile per copy).
 *   LW_PORT=8723 node research/optimization-2026-09-24/probes/M/lostearly-electron.mjs */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const PORT = process.env.LW_PORT || '8723';
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const MAIN = path.resolve('tools/perf/electron-main.cjs');
const M = 'research/optimization-2026-09-24/probes/M/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = {};
for (const tag of ['base-lostearly', 'lostearly', 'lostcompile']) {
  const cdpPort = 9600 + Math.floor(Math.random() * 90);
  const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-m-lost-'));
  const proc = spawn(ELECTRON, [MAIN, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: '1400', LW_H: '900', LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE,
      LW_URL: `https://127.0.0.1:${PORT}/${M}lab-${tag}/?preset=1s%2B2pz&sw=0&warn=0` } });
  let stderr = ''; proc.stderr.on('data', (d) => { stderr += d; });
  let ws = null;
  try {
    let target = null;
    for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page' && x.url.includes(`/lab-${tag}/`)); } catch {} if (!target) await sleep(250); }
    if (!target) throw new Error('no page target: ' + stderr.split('\n').slice(-4).join(' | '));
    ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
    let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
    const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
    await send('Runtime.enable');
    for (let i = 0; i < 100; i++) { try { if (await ev('!!(window.__LW && __LW.ready) || !!(window.__e && window.__e.some(e => /BOOT/.test(e)))')) break; } catch {} await sleep(100); }
    await sleep(1500);
    R[tag] = await ev(`(async()=>{ const b = document.getElementById('banner'); const f = window.__LW && __LW.field;
      let px = null; try { px = __LW && __LW.ready ? await __LW.readPixels() : null; } catch (e) { px = { threw: String(e && e.message || e).slice(0, 80) }; }
      return { ready: !!(window.__LW && __LW.ready), fieldOk: f ? f.ok : null, error: f ? f.error : null, hasMethods: !!(f && f.setDprCap),
        bannerShown: b ? !b.hidden : null, bannerTitle: b ? (b.querySelector('h3') || {}).textContent : null,
        readPixels: px && (px.threw || { nonBlack: px.nonBlack, total: px.total }), errs: (window.__e || []).map(String).map(s => s.slice(0, 160)).slice(0, 4) }; })()`);
    console.log(tag, JSON.stringify(R[tag]));
  } catch (e) { console.error('PROBE ERROR', tag, e); R[tag] = { probeError: String(e && e.message || e) }; }
  finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(600); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
}
const ok = (r) => r && r.ready === true && r.fieldOk === false && /^device lost/.test(r.error || '') && r.bannerShown && /lost/.test(r.bannerTitle || '') && (r.errs || []).length === 0;
const pass = ok(R.lostearly) && ok(R.lostcompile);
fs.writeFileSync('/tmp/lwM-lostearly-electron.json', JSON.stringify(R, null, 1));
console.log((pass ? 'GREEN' : 'RED') + ' lost-early Chromium: built copies ready + ok:false + lost banner + 0 errors');
process.exit(pass ? 0 : 1);
