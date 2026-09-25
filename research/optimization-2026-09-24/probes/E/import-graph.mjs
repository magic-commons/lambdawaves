// Static import graph from lab/main.js (+ mathworker.js): which lab/ modules are reachable, which are not.
import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('lab');
const seen = new Set(), sizes = {};
const re = /(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)|new URL\(\s*['"](\.[^'"]+\.js)['"]/g;
function walk(f) {
  if (seen.has(f)) return; seen.add(f);
  const src = fs.readFileSync(f, 'utf8'); sizes[f] = src.length;
  for (const m of src.matchAll(re)) { const s = m[1] || m[2] || m[3]; const p = path.resolve(path.dirname(f), s); if (fs.existsSync(p)) walk(p); }
}
walk(path.join(root, 'main.js'));
const all = [];
(function ls(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/vendor|fonts|demos|img/.test(e.name)) ls(p); } else if (p.endsWith('.js')) all.push(p); } })(root);
const unreached = all.filter((f) => !seen.has(f)).map((f) => path.relative(root, f) + ' ' + fs.statSync(f).size);
console.log(JSON.stringify({ reached: seen.size, reachedBytes: Object.values(sizes).reduce((a, b) => a + b, 0), unreached }, null, 1));
