import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const W = process.argv[2] ? process.argv[2].replace(/\/?$/, '/') : new URL('../../../', import.meta.url).pathname;
const tmp = path.join(os.tmpdir(), 'lw-syntax-one-' + process.pid + '.mjs');
const files = ['lab/rack.js', ...['lab/shell', 'lab/windows'].flatMap((d) => fs.readdirSync(W + d).filter((f) => f.endsWith('.js')).map((f) => d + '/' + f))];
let bad = 0;
for (const f of files) {
  fs.copyFileSync(W + f, tmp);
  try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); console.log('ok  ', f); }
  catch (e) { bad++; console.log('FAIL', f, '\n' + String(e.stderr).split('\n').slice(0, 6).join('\n')); }
}
process.exit(bad ? 1 : 0);
