/* tools/perf/wait-gpu.mjs (0.5.0 C7) — the lock runs ALONE: wait (up to argv[2] s, default 300) until the 1-min load is under 4 and no other headless Firefox runs. */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const until = Date.now() + 1000 * (+process.argv[2] || 300);
for (;;) {
  const load = +fs.readFileSync('/proc/loadavg', 'utf8').split(' ')[0];
  const ps = execFileSync('ps', ['-eo', 'args'], { encoding: 'utf8' });
  const browsers = ps.split('\n').filter((l) => /marionette/.test(l)).length;
  if (load < 4 && browsers === 0) { console.log('free · load ' + load); process.exit(0); }
  if (Date.now() > until) { console.log('busy · load ' + load + ' · browsers ' + browsers); process.exit(1); }
  await new Promise((r) => setTimeout(r, 5000));
}
