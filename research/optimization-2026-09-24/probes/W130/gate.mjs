/* gate.mjs — wave 130's per-seam neutrality gate, one command: serialize bytes against base1, the digest lock (states @96
 * on the W125 fixture), the MIR stylehash (every window open, disconnected and connected, against the base captures
 * with their noise pair), and the browser suites that read the moved block.
 *   LW_PORT=8746 GD_PORT=5256 node research/optimization-2026-09-24/probes/W130/gate.mjs <tag> [suite …]
 * Prints one line per read and exits 1 if any is not neutral. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const [tag, ...suites] = process.argv.slice(2);
if (!tag) { console.error('usage: gate.mjs <tag> [tests/x.browser-test.mjs …]'); process.exit(2); }
const env = { ...process.env, LW_PORT: process.env.LW_PORT || '8746', GD_PORT: process.env.GD_PORT || '5256' };
const run = (args, t = 900000) => spawnSync(process.execPath, args, { env, encoding: 'utf8', timeout: t, maxBuffer: 64 << 20 });
const D = 'research/optimization-2026-09-24/probes/W130/';
let bad = 0;
const say = (ok, what, more = '') => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (more ? '  ' + more : '')); };

let r = run([D + 'serialize-bytes.mjs', tag]);
try {
  const a = JSON.parse(fs.readFileSync(D + 'serialize-bytes.base1.json', 'utf8')), b = JSON.parse(fs.readFileSync(D + `serialize-bytes.${tag}.json`, 'utf8'));
  say(JSON.stringify(a.states) === JSON.stringify(b.states) && !b.error && !(b.errs || []).length, 'serialize bytes (11 snapshots incl. demo/save/reopen/link/round trip/fresh)', b.error || (b.errs || []).join(' | '));
} catch (e) { say(false, 'serialize bytes', String(e) + (r.stderr || '').slice(-400)); }

r = run(['tools/perf/digest-lock.mjs', '--check', '--fixture', 'research/optimization-2026-09-24/digest-lock-base-w125.json', '--only', 'states', '--grids', '96']);
say(r.status === 0, 'digest lock states@96', ((r.stdout || '').trim().split('\n').pop() || '') + (r.status ? (r.stderr || '').slice(-300) : ''));

for (const [name, mode, base, noise] of [[tag + '-d', 'disc', 'base', 'base2'], [tag + '-c', 'conn', 'cbase', 'cbase2']]) {
  /* up to three tries: a headless Chromium under load sometimes never opens its DevTools port and leaves an empty dir */
  for (let i = 0; i < 3 && !fs.existsSync(`/tmp/lw130-sh/${name}/meta.json`); i++) run([D + 'sh.mjs', 'capture', name, mode]);
  const c = run([D + 'sh.mjs', 'compare', base, name, noise]);
  const last = (c.stdout || '').trim().split('\n').pop() || '';
  say(c.status === 0 && /neutral/.test(last), `stylehash ${mode} (8 theme × card × frost states)`, last);
}

for (const s of suites) {
  r = run([s], 1200000);
  const tail = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  say(r.status === 0, s, tail.slice(0, 200));
}
console.log(bad ? `GATE ${tag}: ${bad} FAILING` : `GATE ${tag}: ALL NEUTRAL`);
process.exit(bad ? 1 : 0);
