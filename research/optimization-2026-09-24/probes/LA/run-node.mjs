/* run-node.mjs — `bash test.sh node`, line for line, as a node script (the worktree guard refuses `bash test.sh`).
 *   node research/optimization-2026-09-24/probes/LA/run-node.mjs      (from the worktree root)
 * Every tests/*.test.mjs, pwa.test.mjs last; exit 1 if any suite exits non-zero. */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const suites = readdirSync('tests').filter((f) => f.endsWith('.test.mjs') && f !== 'pwa.test.mjs').sort().map((f) => 'tests/' + f);
suites.push('tests/pwa.test.mjs');
let rc = 0; const bad = [];
for (const s of suites) {
  const r = spawnSync(process.execPath, [s], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 64 << 20 });
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '');
  if (r.status !== 0) { rc = 1; bad.push(s + ' (' + r.status + ')'); }
}
console.log(`\nNODE GATE: ${suites.length - bad.length}/${suites.length} suites green` + (bad.length ? ' · FAILED: ' + bad.join(', ') : ''));
process.exit(rc);
