// doubles.mjs — every `app.<ns>.<x> =` across lab/ (rack.js, shell, windows), grouped by slot; prints slots filled more than once.
// app.state members are live and may be written anywhere: they are skipped. Usage: node doubles.mjs [worktree]
import fs from 'node:fs';
import path from 'node:path';
const W = process.argv[2] || new URL('../../../', import.meta.url).pathname;
const files = ['lab/rack.js', ...['lab/shell', 'lab/windows'].flatMap((d) => fs.existsSync(path.join(W, d)) ? fs.readdirSync(path.join(W, d)).filter((f) => f.endsWith('.js')).map((f) => d + '/' + f) : [])];
const by = new Map();
for (const f of files) {
  fs.readFileSync(path.join(W, f), 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\bapp\.(hooks|loop|host|w|ctl|sh)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) {
      const k = `app.${m[1]}.${m[2]}`;
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(`${f}:${i + 1}`);
    }
  });
}
let n = 0;
for (const [k, at] of [...by].sort()) if (at.length > 1) { n++; console.log(`${k}  ×${at.length}  ${at.join('  ')}`); }
console.log(`${by.size} slots filled across ${files.length} files; ${n} filled more than once`);
process.exit(n ? 1 : 0);
