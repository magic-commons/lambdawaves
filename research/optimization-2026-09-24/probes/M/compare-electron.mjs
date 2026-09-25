/* compare-electron.mjs — lane M · M1/K10 A/B in Electron 44 / Chromium 152 on the RTX: the two MARKED copies from
 * mk-marks.py, interleaved, a fresh profile per boot (pattern: tools/perf/probe-chromium.mjs, probes/F/*-electron.mjs).
 *   LW_PORT=8723 node research/optimization-2026-09-24/probes/M/compare-electron.mjs [runs] [out.json]
 * Reads the marks (createField split: sm → ci → pl), ready, first present, digest, limits, serialize hash. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const PORT = process.env.LW_PORT || '8723';
const RUNS = +(process.argv[2] || 4);
const OUT = process.argv[3] || '/tmp/lwM-compare-electron.json';
const ELECTRON = process.env.ELECTRON || createRequire('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/hosts-m0/shells/electron/package.json')('electron');
const MAIN = path.resolve('tools/perf/electron-main.cjs');
const M = 'research/optimization-2026-09-24/probes/M/';
const V = (process.env.VARIANTS || 'base:lab-base-mk,built:lab-mk').split(',').map((s) => s.split(':'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const runs = [];
async function boot(tag, dir) {
  const cdpPort = 9600 + Math.floor(Math.random() * 90);
  const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-m-cmp-'));
  const proc = spawn(ELECTRON, [MAIN, '--no-sandbox'], { stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', LW_CDP_PORT: String(cdpPort), LW_W: '1600', LW_H: '900', LW_NO_SANDBOX: '1', LW_PROFILE: PROFILE,
      LW_URL: `https://127.0.0.1:${PORT}/${M}${dir}/?preset=1s%2B2pz&sw=0&warn=0` } });
  let stderr = ''; proc.stderr.on('data', (d) => { stderr += d; });
  let ws = null;
  try {
    let target = null;
    for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page' && x.url.includes(`/${dir}/`)); } catch {} if (!target) await sleep(100); }
    if (!target) throw new Error('no page target: ' + stderr.split('\n').slice(-3).join(' | '));
    ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
    let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
    const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
    for (let i = 0; i < 200; i++) { try { if (await ev('!!(window.__LW && __LW.ready && __LW.stats.presents > 0)')) break; } catch {} await sleep(50); }
    const r = await ev(`(async()=>{ try { __LW.warning.dismiss(); } catch (_) {} __LW.schedule(4); await __LW.settle();
      const m = Object.fromEntries(performance.getEntriesByType('mark').map(e => [e.name, +e.startTime.toFixed(2)]));
      const o = __LW.serialize(); if (o.presentation && o.presentation.layout) o.presentation.layout.at = 0; const ser = JSON.stringify(o);
      let h = 2166136261 >>> 0; for (let i = 0; i < ser.length; i++) { h = (h ^ ser.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; }
      const d = await __LW.fieldDigest();
      return { m, digest: d && d.hash, serHash: h, limits: __LW.field.limitsRequested, ok: __LW.field.ok, errs: (window.__e || []).length }; })()`);
    r.tag = tag; return r;
  } finally { try { ws && ws.close(); } catch {} proc.kill('SIGTERM'); await sleep(500); if (proc.exitCode === null) proc.kill('SIGKILL'); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
}
for (let i = 0; i < RUNS; i++) for (const [tag, dir] of (i % 2 ? [...V].reverse() : V)) {
  try { const r = await boot(tag, dir); runs.push(r); const m = r.m;
    console.log(tag, i, 'ready', m['lw-ready'], 'first', m['first-present'], 'cf', (m['field-end'] - m['field-start']).toFixed(1), 'sm→ci', (m['ci-start'] - m['sm-start']).toFixed(2), 'ci', (m['ci-end'] - m['ci-start']).toFixed(2), 'pl', (m['pl-end'] - m['ci-end']).toFixed(2), 'gb', m['gb-start'], m['gb-adapter'], m['gb-device'], 'digest', r.digest, 'ser', r.serHash, 'errs', r.errs); }
  catch (e) { console.log(tag, i, 'ERROR', e.message); }
}
const med = (a) => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); return v.length ? +v[v.length >> 1].toFixed(2) : null; };
const S = {};
for (const [tag] of V) { const R = runs.filter((r) => r.tag === tag); S[tag] = { n: R.length, ready: med(R.map((r) => r.m['lw-ready'])), first: med(R.map((r) => r.m['first-present'])), createField: med(R.map((r) => r.m['field-end'] - r.m['field-start'])), compileInfo: med(R.map((r) => r.m['ci-end'] - r.m['ci-start'])), pipelines: med(R.map((r) => r.m['pl-end'] - r.m['ci-end'])), digests: [...new Set(R.map((r) => r.digest))], ser: [...new Set(R.map((r) => r.serHash))], limits: [...new Set(R.map((r) => JSON.stringify(r.limits)))], errs: R.reduce((s, r) => s + r.errs, 0) }; }
console.log(JSON.stringify(S));
fs.writeFileSync(OUT, JSON.stringify({ runs, S }, null, 1));
