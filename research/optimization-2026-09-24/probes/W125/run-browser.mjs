/* run-browser.mjs — W125's browser suites, one after another, on this builder's server (LW_PORT / GD_PORT from the env):
 *   LW_PORT=8729 GD_PORT=5247 node research/optimization-2026-09-24/probes/W125/run-browser.mjs [suite …]
 * (a plain node loop: the worktree guard refuses a shell loop over computed node arguments). */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const suites = process.argv.slice(2).length ? process.argv.slice(2) : ['official-defaults-palette', 'render-regressions', 'gpu-recovery', 'current', 'menubar'];
const rows = [];
for (const s of suites) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [`tests/${s}.browser-test.mjs`], { encoding: 'utf8', maxBuffer: 64 << 20, timeout: 1200000, env: process.env });
  const out = (r.stdout || '') + (r.stderr || '');
  fs.writeFileSync(`/tmp/w125-br-${s}.log`, out);
  const tail = out.trim().split('\n').slice(-2).join(' | ').slice(0, 400);
  rows.push({ suite: s, exit: r.status, secs: Math.round((Date.now() - t0) / 1000), tail });
  console.log(`== ${s} exit ${r.status} (${Math.round((Date.now() - t0) / 1000)} s) — ${tail}`);
}
console.log(`BROWSER: ${rows.filter((x) => x.exit === 0).length}/${rows.length} suites green`);
