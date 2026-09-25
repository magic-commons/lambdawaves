/* graph.mjs — the STATIC module graph main.js pulls in before it can run (the same walk tools/build-deploy.mjs §3
 * does), with depth, bytes, and which modules are reached only through windows that ship CLOSED.
 *   node research/optimization-2026-09-24/probes/D/graph.mjs [--preload-html]
 * --preload-html prints the <link rel="modulepreload"> block, ordered by depth then size, for the lab-m probe copy. */
import fs from 'node:fs'; import path from 'node:path';
const LAB = path.resolve('lab');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^[ \t]*\/\/.*$/gm, '');
const edges = new Map(), depth = new Map(), size = new Map();
const q = [['main.js', 0]];
depth.set('main.js', 0);
while (q.length) {
  const [rel, d] = q.shift();
  const src = strip(fs.readFileSync(path.join(LAB, rel), 'utf8'));
  size.set(rel, fs.statSync(path.join(LAB, rel)).size);
  const out = [];
  for (const re of [/\bimport\s+(?:[^'";]*?\bfrom\s*)?['"](\.[^'"]+)['"]/g, /\bexport\s+[^'";]*?\bfrom\s*['"](\.[^'"]+)['"]/g])
    for (const m of src.matchAll(re)) out.push(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])));
  edges.set(rel, out);
  for (const t of out) if (!depth.has(t)) { depth.set(t, d + 1); q.push([t, d + 1]); }
}
const files = [...depth.keys()];
const bytes = files.reduce((s, f) => s + size.get(f), 0);
const byDepth = {}; for (const f of files) { const d = depth.get(f); (byDepth[d] ||= { n: 0, bytes: 0 }); byDepth[d].n++; byDepth[d].bytes += size.get(f); }
/* the longest import CHAIN (what a browser without preload hints must walk level by level) */
const memo = new Map();
const chain = (f, seen = new Set()) => { if (memo.has(f)) return memo.get(f); if (seen.has(f)) return [f]; seen.add(f); let best = [];
  for (const t of edges.get(f) || []) { const c = chain(t, seen); if (c.length > best.length) best = c; } seen.delete(f); const r = [f, ...best]; memo.set(f, r); return r; };
if (process.argv.includes('--preload-html')) {
  const order = files.filter((f) => f !== 'main.js').sort((a, b) => depth.get(a) - depth.get(b) || size.get(b) - size.get(a));
  console.log(order.map((f) => `<link rel="modulepreload" href="./${f}">`).join('\n'));
} else {
  console.log(JSON.stringify({ modules: files.length, bytes, byDepth, longestChain: chain('main.js'), rackDirect: (edges.get('rack.js') || []).length }, null, 1));
}
