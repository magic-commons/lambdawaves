/* precache.mjs — what sw.js §1 makes every installing visitor download, classified by whether the running lab can
 * ever load it.  node research/optimization-2026-09-24/probes/D/precache.mjs
 * Classes: EAGER (the static graph + index.html's links), DEMAND (reachable at run time: workers, dynamic imports,
 * fetches, font faces, manifest icons, the licence links ABOUT opens), NEVER (no code path in the shipped lab
 * references it). */
import fs from 'node:fs'; import path from 'node:path';
const LAB = path.resolve('lab');
const sw = fs.readFileSync(path.join(LAB, 'sw.js'), 'utf8');
const pc = [...sw.matchAll(/\['\.\/([^']+)',\s*'([0-9a-f]+)'\]/g)].map((m) => m[1]);
const size = (r) => fs.statSync(path.join(LAB, r)).size;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^[ \t]*\/\/.*$/gm, '');
const walk = (roots, dynamic) => { const seen = new Set(); const q = [...roots];
  while (q.length) { const r = q.shift(); if (seen.has(r) || !fs.existsSync(path.join(LAB, r))) continue; seen.add(r); if (!r.endsWith('.js')) continue;
    const src = strip(fs.readFileSync(path.join(LAB, r), 'utf8'));
    const res = [/\bimport\s+(?:[^'";]*?\bfrom\s*)?['"](\.[^'"]+)['"]/g, /\bexport\s+[^'";]*?\bfrom\s*['"](\.[^'"]+)['"]/g];
    if (dynamic) res.push(/\bimport\(\s*['"](\.[^'"]+)['"]/g, /new URL\(\s*['"](\.[^'"]+\.js)['"]\s*,\s*import\.meta\.url/g);
    for (const re of res) for (const m of src.matchAll(re)) q.push(path.posix.normalize(path.posix.join(path.posix.dirname(r), m[1]))); }
  return seen; };
const html = fs.readFileSync(path.join(LAB, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const htmlRefs = [...html.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)].map((m) => m[1]);
const eager = walk(['main.js'], false); for (const r of htmlRefs) if (/\.(css|js)$/.test(r)) eager.add(r);
const demand = walk(['main.js'], true);
for (const r of htmlRefs) demand.add(r);                                   // icons, manifest, licences ABOUT links, warning png
const mf = JSON.parse(fs.readFileSync(path.join(LAB, 'manifest.webmanifest'), 'utf8')); for (const i of mf.icons) demand.add(i.src.replace(/^\.\//, ''));
demand.add('manifest.webmanifest'); demand.add('index.html');
for (const f of pc) if (/^vendor\/katex\/fonts\//.test(f) || /^fonts\//.test(f) || /^vendor\/bse\//.test(f) || /^demos\//.test(f)) demand.add(f);   // css faces, the chem worker's fetch, the DEMOS button
const cls = { EAGER: [], DEMAND: [], NEVER: [] };
for (const f of pc) (eager.has(f) ? cls.EAGER : demand.has(f) ? cls.DEMAND : cls.NEVER).push(f);
const sum = (a) => a.reduce((s, f) => s + size(f), 0);
const out = { entries: pc.length, bytes: sum(pc) };
for (const [k, a] of Object.entries(cls)) out[k] = { n: a.length, bytes: sum(a) };
out.NEVER_list = cls.NEVER.map((f) => [f, size(f)]).sort((a, b) => b[1] - a[1]);
const dup = new Map(); for (const f of pc) { const h = sw.match(new RegExp("\\['\\./" + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "',\\s*'([0-9a-f]+)'"))[1]; (dup.get(h) || dup.set(h, []).get(h)).push(f); }
out.duplicateContent = [...dup.values()].filter((a) => a.length > 1).map((a) => [a, size(a[0])]);
out.duplicateBytes = out.duplicateContent.reduce((s, [a, b]) => s + b * (a.length - 1), 0);
console.log(JSON.stringify(out, null, 1));
