/* .tmp/rigfree.mjs — exit 0 when the rig is free: no geckodriver, no marionette Firefox, no headless chrome but the editor's
   playwright one (argv0 under ms-playwright), the 1-min load under 4.  Reads /proc by argv0, so a shell line that merely NAMES
   one of these words (another builder's poll) never counts.  Prints what it saw. */
import fs from 'node:fs';
import path from 'node:path';
const seen = [];
for (const pid of fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d))) {
  let argv; try { argv = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean); } catch { continue; }
  if (!argv.length) continue;
  const b = path.basename(argv[0]);
  if (b === 'geckodriver') seen.push(`${pid} geckodriver`);
  else if (/firefox/.test(b) && argv.some((a) => /^--?marionette$/.test(a))) seen.push(`${pid} firefox -marionette`);
  else if (/^(chrome|chromium|headless_shell)/.test(b) && !argv[0].includes('ms-playwright') && argv.some((a) => a.startsWith('--headless'))) seen.push(`${pid} ${b} --headless`);
}
const load = +fs.readFileSync('/proc/loadavg', 'utf8').split(' ')[0];
console.log(`load ${load}${seen.length ? ' · ' + seen.join(' · ') : ''}`);
process.exit(load < 4 && !seen.length ? 0 : 1);
