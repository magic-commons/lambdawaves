// sonnet2-e: every file:line in PLAN-DRAFT-2 -> exists / in range / the line text (first line of the range). Bare `:NNN` inherit the last named file in the paragraph; comma lists expand.
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const ROOT = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0';
const plan = fs.readFileSync(ROOT + '/research/release-0.6.0/PLAN-DRAFT-2.md', 'utf8');
const names = execSync(`cd ${ROOT} && git ls-files | grep -v '^research/' | grep -v '^dist/'`, { maxBuffer: 1 << 26 }).toString().split('\n').filter(Boolean);
const byBase = new Map(); for (const n of names) { const b = path.basename(n); if (!byBase.has(b)) byBase.set(b, []); byBase.get(b).push(n); }
const cache = new Map(); const lines = (f) => { if (!cache.has(f)) cache.set(f, fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')); return cache.get(f); };
const results = []; const seen = new Set();
const NUM = '\\d+(?:[–-]\\d+)?';
const tokRe = new RegExp(`([A-Za-z0-9_\\-\\/]+\\.(?:js|mjs|json|md|wgsl|html))(?::(${NUM}(?:,\\s*:?${NUM})*))?|(?<![\\w])\`?:(${NUM}(?:,\\s*:?${NUM})*)`, 'g');
let cur = null;
plan.split('\n').forEach((ln, li) => {
  if (ln.trim() === '') cur = null;
  let m; tokRe.lastIndex = 0;
  while ((m = tokRe.exec(ln))) {
    let file, list;
    if (m[1]) { cur = m[1]; if (!m[2]) continue; file = m[1]; list = m[2]; }
    else { if (!cur) continue; file = cur; list = m[3]; }
    for (const part of list.split(/,\s*:?/)) {
      const [a, b0] = part.split(/[–-]/).map(Number); const b = b0 || a;
      const key = file + ':' + a + (b !== a ? '-' + b : ''); if (seen.has(key)) continue; seen.add(key);
      const cands = byBase.get(path.basename(file)) || [];
      if (!cands.length) { results.push({ ref: key, planLine: li + 1, status: 'NO-SUCH-FILE-IN-TREE' }); continue; }
      const f = (names.includes('lab/' + file) ? 'lab/' + file : null) || names.includes('tools/perf/' + file) && 'tools/perf/' + file || cands.find((c) => c.endsWith(file) && !c.includes('/mir/')) || cands[0]; const txt = lines(f);
      const ok = a >= 1 && b <= txt.length && a <= b;
      results.push({ ref: key, planLine: li + 1, file: f, fileLines: txt.length, status: ok ? 'in-range' : 'OUT-OF-RANGE', text: ok ? txt[a - 1].trim().slice(0, 120) : null });
    }
  }
});
fs.writeFileSync(new URL('./sonnet2-e-citations.json', import.meta.url), JSON.stringify(results, null, 1));
const bad = results.filter((r) => r.status !== 'in-range');
console.log('total', results.length, 'bad', bad.length); console.log(JSON.stringify(bad, null, 1));
