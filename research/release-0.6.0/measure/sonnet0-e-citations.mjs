// (e) every file:line the plan cites -> does the file exist in the worktree, is the line in range, and what does that line say (first 110 chars)
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const ROOT = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0';
const plan = fs.readFileSync(ROOT + '/research/release-0.6.0/PLAN-DRAFT-0.md', 'utf8');
const names = execSync(`cd ${ROOT} && git ls-files | grep -v '^research/' | grep -v '^dist/' `, { maxBuffer: 1 << 26 }).toString().split('\n');
const byBase = new Map(); for (const n of names) { const b = path.basename(n); if (!byBase.has(b)) byBase.set(b, []); byBase.get(b).push(n); }
const re = /(?<![\w/.-])([A-Za-z0-9_.\/-]+\.(?:js|mjs|json|md|wgsl|html)):(\d+)(?:[–-](\d+))?(?:,\s*:?(\d+)(?:[–-](\d+))?)*/g;
const results = []; let m; const seen = new Set();
const lineRefRe = /([A-Za-z0-9_.\/-]+\.(?:js|mjs|json|md|html)):((?:\d+(?:[–-]\d+)?(?:,\s*:?)?)+)/g;
while ((m = lineRefRe.exec(plan))) {
  const file = m[1]; const nums = m[2].split(/,\s*:?/).filter(Boolean);
  const cands = byBase.get(path.basename(file)) || [];
  for (const nstr of nums) {
    const [a, b] = nstr.split(/[–-]/).map(Number); const key = file + ':' + nstr; if (seen.has(key)) continue; seen.add(key);
    // plan lines this appears on
    const pos = plan.slice(0, m.index).split('\n').length;
    if (!cands.length) { results.push({ ref: key, planLine: pos, status: 'FILE-NOT-FOUND-IN-TREE (git ls-files outside research/)' }); continue; }
    const f = cands.find((c) => c.endsWith(file)) || cands[0]; const txt = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
    const ok = a >= 1 && (b || a) <= txt.length;
    results.push({ ref: key, planLine: pos, file: f, fileLines: txt.length, status: ok ? 'in-range' : 'OUT-OF-RANGE', text: ok ? txt[a - 1].trim().slice(0, 110) : null });
  }
}
fs.writeFileSync(new URL('./sonnet0-e-citations.json', import.meta.url), JSON.stringify(results, null, 1));
const bad = results.filter((r) => r.status !== 'in-range');
console.log('total refs', results.length, 'not in range / not found', bad.length); console.log(JSON.stringify(bad, null, 1));
