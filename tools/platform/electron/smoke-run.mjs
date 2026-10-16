#!/usr/bin/env node
// smoke-run.mjs — launch the host (dev tree, or --packaged linux-x64), drive it over CDP, one GREEN/RED line per check, one acceptance row.
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { isDeepStrictEqual } from 'node:util';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { distHash } from './dist-hash.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../..');
const PACKAGED = process.argv.includes('--packaged'), X11 = process.argv.includes('--x11');
const PKG = path.join(HERE, 'out/lambdawaves-desktop-linux-x64');
const BIN = PACKAGED ? path.join(PKG, 'lambdawaves-desktop') : createRequire(import.meta.url)('electron');
const DIST = PACKAGED ? path.join(PKG, 'resources/dist') : path.join(REPO, 'dist');
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-smoke-'));
const NAME = 'smoke/p03-roundtrip', FILE = path.join(DIR, 'smoke__p03-roundtrip.lambdawaves.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sh = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const checks = [], res = { dir: DIR, mode: PACKAGED ? 'packaged' : 'dev', checks }, row = {};
const mark = (name, ok, detail = '') => { checks.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'GREEN' : 'RED  '} ${name}${detail === '' ? '' : ' — ' + detail}`); return !!ok; };
const freePort = () => new Promise((r) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
let proc = null;

async function finish(code) {
  res.row = Object.values(row).join(' · '); res.verdict = code === 0 ? 'GREEN' : 'RED';
  fs.writeFileSync(path.join(DIR, 'result.json'), JSON.stringify(res, null, 1));
  console.log('\n' + res.row + '\nresult: ' + path.join(DIR, 'result.json'));
  if (proc && proc.exitCode === null) { proc.kill('SIGTERM'); for (let i = 0; i < 20 && proc.exitCode === null; i++) await sleep(250); if (proc.exitCode === null) proc.kill('SIGKILL'); }
  process.exit(code);
}
setTimeout(() => { mark('hard timeout 120 s', false); finish(1); }, 120000);

async function launch(extra) {
  const port = await freePort();
  const p = spawn(BIN, [...(PACKAGED ? [] : [HERE]), `--remote-debugging-port=${port}`, ...extra], { env: { ...process.env, LW_SMOKE_DIR: DIR }, stdio: ['ignore', 'ignore', 'pipe'] });
  let err = ''; p.stderr.on('data', (d) => { err += d; });
  for (let i = 0; i < 120 && p.exitCode === null; i++) {
    try { const t = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((x) => x.type === 'page' && x.url.startsWith('lambdawaves://app')); if (t) return { p, t }; } catch {}
    await sleep(250);
  }
  if (p.exitCode === null) p.kill('SIGKILL'); else await sleep(300);
  return { p: null, err };
}

function cdp(url) {
  const ws = new WebSocket(url); let id = 0; const pend = new Map(), thrown = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.exceptionThrown') thrown.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise((ok, no) => { const i = ++id; pend.set(i, (d) => (d.error ? no(new Error(method + ': ' + d.error.message)) : ok(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression, userGesture = false) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture }); if (r.exceptionDetails) throw new Error('page: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result.value; };
  return new Promise((ok, no) => { ws.onopen = () => ok({ send, ev, thrown }); ws.onerror = no; });
}
const until = async (fn, ms = 15000) => { for (const end = Date.now() + ms; Date.now() < end; await sleep(100)) { const v = await fn(); if (v) return v; } return null; };

async function main() {
const flags = X11 ? ['--ozone-platform=x11'] : [];
let L = await launch(flags), sandbox = 'on';
const suid = !L.p && (L.err.match(/make sure that (\S+chrome-sandbox) is owned by root/) || [])[1];
if (suid) { sandbox = `sandbox OFF (needs sudo: sudo chown root:root ${suid} && sudo chmod 4755 ${suid})`; flags.push('--no-sandbox'); L = await launch(flags); }
if (!L.p) { mark('window opened', false, (L.err || '').split('\n').filter(Boolean).slice(-3).join(' | ')); await finish(1); }
proc = L.p;
const page = await cdp(L.t.webSocketDebuggerUrl);
await page.send('Runtime.enable');

// (a) the origin
const a = await page.ev(`({ gpu: !!navigator.gpu, secure: isSecureContext, origin: location.origin })`);
const pol = await page.ev(`(async () => { const r = await fetch('/main.js'), s = async (u) => (await fetch(u)).status;
  return { type: r.headers.get('content-type'), nosniff: r.headers.get('x-content-type-options'), headers: await s('/_headers'), up: await s('/%2e%2e/package.json'), enc: await s('/..%2fpackage.json'), bs: await s('/..%5cpackage.json') }; })()`);
mark('protocol policy (MIME, nosniff, _headers 404, traversal refused)', /^text\/javascript/.test(pol.type) && pol.nosniff === 'nosniff' && pol.headers === 404 && pol.up >= 400 && pol.enc >= 400 && pol.bs >= 400, JSON.stringify(pol));
mark('navigator.gpu', a.gpu); mark('isSecureContext', a.secure === true); mark('origin', a.origin === 'lambdawaves://app', a.origin);

// (b) the field
const ff = await page.ev(`new Promise((r) => { const t = () => (window.__LW && __LW.stats && __LW.stats.frames > 0) ? r(Math.round(performance.now())) : performance.now() > 60000 ? r(-1) : setTimeout(t, 5); t(); })`);
await until(() => page.ev('!!(window.__LW && __LW.ready === true)'), 30000);
await page.ev(`(() => { const p = document.getElementById('warnPane'), b = p && p.querySelector('.warn-btn'); if (p && !p.hidden && b) b.click(); })()`, true);
await page.ev('__LW.settle()');
const b = await page.ev(`(async () => { const f = __LW.field, px = await __LW.readPixels(), ad = f.adapter;
  return { ready: __LW.ready === true, ok: f.ok, info: f.adapterInfo, fallback: ad && ((ad.info && ad.info.isFallbackAdapter) ?? ad.isFallbackAdapter), format: f.format,
    maxTex: f.device && f.device.limits.maxTextureDimension2D, frames: __LW.stats.frames, nonBlack: px && px.nonBlack, sw: __LW.sw && __LW.sw.mode,
    errors: [...(window.__e || [])], maths: __LW.maths && __LW.maths.ok, desktop: window.lwavesDesktop && window.lwavesDesktop.platformInfo().kind }; })()`);
mark('__LW.ready', b.ready); mark('field.ok', b.ok); mark('not a fallback adapter', b.fallback === false, String(b.fallback));
mark('frames > 0', b.frames > 0, b.frames); mark('nonBlack > 500', b.nonBlack > 500, b.nonBlack); mark("sw.mode === 'declined'", b.sw === 'declined', b.sw);
mark('lwavesDesktop bridge', b.desktop === 'desktop'); console.log(`      first frame ${ff} ms after navigation start`);

// (c) project round trip: save → export to disk → remove → import from disk → compare
let rt = false;
try {
  const kept = await page.ev(`__LW.projects.save(${JSON.stringify(NAME)}) ? __LW.projects.exportText() : null`);
  await page.ev(`document.querySelector('.pj-export').click()`, true);
  await until(() => fs.existsSync(FILE) && fs.statSync(FILE).size === Buffer.byteLength(kept || ''));
  const disk = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : null;
  const gone = await page.ev(`__LW.projects.remove(${JSON.stringify(NAME)}) && !__LW.projects.list().some((p) => p.path === ${JSON.stringify(NAME)})`);
  await page.ev(`document.querySelector('.pj-import input').click()`, true);
  const back = await until(() => page.ev(`__LW.projects.exportText(${JSON.stringify(NAME)})`));
  const same = !!(kept && back) && isDeepStrictEqual(JSON.parse(back).data, JSON.parse(kept).data) && isDeepStrictEqual(JSON.parse(back).notebook, JSON.parse(kept).notebook);
  rt = mark('export bytes on disk === exportText()', disk !== null && disk === kept, disk ? disk.length + ' B' : 'no file') & mark('removed', gone) & mark('re-imported data deep-equals original', same);
} catch (e) { mark('round trip', false, e.message); }

// (d) the screenshot, taken by the host (capturePage), not by the page
await page.ev(`console.log('__LW_SMOKE_CAPTURE__')`);
const shot = await until(() => fs.existsSync(path.join(DIR, 'screenshot.png')), 10000) ? fs.readFileSync(path.join(DIR, 'screenshot.png')) : null;
mark('screenshot via capturePage', shot && shot.length > 10000, shot ? shot.length + ' B' : 'none');

// (e) the errors, the host facts, the row
const errs = [...b.errors, ...page.thrown];
mark('__e empty', b.errors.length === 0, b.errors.join(' | ')); mark('no uncaught exceptions', page.thrown.length === 0, page.thrown.join(' | '));
const host = await until(() => fs.existsSync(path.join(DIR, 'host.json')) && JSON.parse(fs.readFileSync(path.join(DIR, 'host.json'), 'utf8')), 5000) || { versions: {}, gpuFeatureStatus: {}, switches: [] };
const ps = sh('ps', ['-eo', 'pid=,ppid=,args=']).split('\n').map((l) => l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/)).filter(Boolean), tree = new Set([proc.pid]);
for (let k = 0; k < 4; k++) for (const [, p, pp] of ps) if (tree.has(+pp)) tree.add(+p);
const oz = (ps.filter((m) => tree.has(+m[1])).map((m) => m[3]).join(' ').match(/--ozone-platform=(\w+)/) || [])[1] || 'default';
const gate = sh('ps', ['-C', 'geckodriver', '-o', 'etimes=']).split('\n').filter((s) => s && +s < 6 * 3600).length;
const dh = distHash(DIST), i = b.info || {};
Object.assign(res, { a, b, firstFrameMs: ff, host, sandbox, ozone: oz, gateConcurrent: gate, dist: dh, screenshotSha256: shot && sha(shot) });
const ok = checks.every((c) => c.ok);
Object.assign(row, { date: new Date().toISOString().slice(0, 10), git: sh('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD']) + '/' + (sh('git', ['-C', REPO, 'describe', '--tags', '--always']) || '-'),
  dist: `dist ${dh.distSha256.slice(0, 12)} (${dh.fileCount} files)`, mode: res.mode, versions: `Electron ${host.versions.electron}/Chromium ${host.versions.chrome}/Node ${host.versions.node}`,
  os: `${(sh('sh', ['-c', '. /etc/os-release; echo $PRETTY_NAME']))} ${os.release()}`, display: oz + (process.env.WAYLAND_DISPLAY ? ' (wayland session)' : ''),
  gpu: sh('nvidia-smi', ['--query-gpu=name,driver_version', '--format=csv,noheader']) || 'no nvidia-smi', adapter: `${i.vendor}/${i.architecture}/${i.description || i.device || '-'}`,
  status: 'webgpu:' + host.gpuFeatureStatus.webgpu, switches: 'switches: ' + (host.switches.join(' ') || 'none'), sandbox, format: b.format, maxTex: 'maxTex2D ' + b.maxTex,
  ff: `first frame ${ff} ms` + (gate ? ` (gate concurrent: ${gate} live geckodriver)` : ''), frames: 'frames ' + b.frames, nonBlack: 'nonBlack ' + b.nonBlack,
  rt: 'round-trip ' + (rt ? 'GREEN' : 'RED'), shot: 'shot ' + (shot ? sha(shot).slice(0, 12) : '-'), errors: 'errors ' + errs.length, verdict: ok ? 'GREEN' : 'RED' });
await finish(ok ? 0 : 1);
}
main().catch((e) => { mark('smoke script', false, e.message); finish(1); });
