#!/usr/bin/env node
/* tools/hints-census.mjs — A HINT IS ONE LINE (022 H1): every app hint in lab/ (minus lab/mir, the kit's) is ≤ 60 characters.
 * Read: `hint:` `title:` `tip:` `knobTitle:` `.title =` and the second argument of `hint(` / `ariaLabel(` / `keep(`; every string literal of the expression,
 * a ternary's branches measured apart, a `+` chain as one string (an expression counts 3); `['… {x} …', { x }]` reads its first.
 *   node tools/hints-census.mjs [--kit] [--all]   the histogram (≤ 40 · 41–80 · 81–140 · > 140) and the strings over 60 with file:line
 *   node tools/hints-census.mjs --check           exit 1 when an app hint is over 60 (joins ./test.sh node, PLAN call 6) */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const ROOT = new URL('../lab/', import.meta.url).pathname, KIT = process.argv.includes('--kit'), LIMIT = 60;
const files = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? (!KIT && f === 'mir' && d === ROOT ? [] : files(p)) : p.endsWith('.js') ? [p] : []; });
const KEY = /(?:\b(?:hint|title|tip|knobTitle)\s*:(?!:)|\.title\s*=(?!=)|\b(?:hint|ariaLabel|keep)\(\s*[\w.$[\]'"]+\s*,)\s*/g;
const unq = (s) => s.slice(1, -1).replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(.)/g, '$1').replace(/\$\{[^}]*\}/g, '{x}');
/* scan(src, i) → the branches' lengths of the expression at i: literals summed across `+`, split at a top-level `?`/`:`, stopped at , ; ) ] } */
function scan(src, i) {
  const br = [[0, '']]; let depth = 0, first = src[i] === '[';
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1; while (j < src.length && src[j] !== c) j += src[j] === '\\' ? 2 : 1;
      const s = unq(src.slice(i, j + 1)), b = br[br.length - 1]; if (depth === 0 || (first && depth === 1)) { b[0] += [...s].length; b[1] += s; }
      i = j + 1; if (first) return br; continue;
    }
    if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) { if (--depth < 0) break; }
    else if (depth === 0 && (c === ',' || c === ';' || (c === '\n' && !/^\s*[+?:]/.test(src.slice(i + 1)) && !/[+?:(]\s*$/.test(src.slice(0, i))))) break;
    else if (depth === 0 && (c === '?' || (c === ':' && br.length))) { if (src[i + 1] === '.' || src[i + 1] === '?') { i += 2; continue; } br.push([0, '']); }
    else if (depth === 0 && /[\w.$]/.test(c) && !/[\w.$]/.test(src[i - 1] || ' ')) br[br.length - 1][0] += 3;
    i++;
  }
  return br;
}
/* bare(src) → src with every comment blanked (newlines kept, so lines stay); a quote in a regex literal may fool it — none in lab/ does */
const bare = (src) => src.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m) => (m[0] === '/' ? m.replace(/[^\n]/g, ' ') : m));
const rows = [];
for (const f of files(KIT ? join(ROOT, 'mir') : ROOT)) {
  const src = bare(readFileSync(f, 'utf8'));
  for (const m of src.matchAll(KEY)) {
    const line = src.slice(0, m.index).split('\n').length, at = m.index + m[0].length;
    for (const [n, s] of scan(src, at)) if (s) rows.push({ at: relative(ROOT, f) + ':' + line, n, s });
  }
}
const bins = [['≤ 40', 0, 40], ['41–80', 41, 80], ['81–140', 81, 140], ['> 140', 141, 1e9]].map(([k, a, b]) => k + ' ' + rows.filter((r) => r.n >= a && r.n <= b).length);
const over = rows.filter((r) => r.n > LIMIT).sort((a, b) => b.n - a.n);
console.log(`${KIT ? 'kit (lab/mir)' : 'app (lab/ minus lab/mir)'}: ${rows.length} hints · ${bins.join(' · ')} · over ${LIMIT}: ${over.length}`);
for (const r of process.argv.includes('--all') ? rows : over) console.log(`  ${r.at} (${r.n}) ${r.s.length > 100 && !process.argv.includes('--full') ? r.s.slice(0, 97) + '…' : r.s}`);
if (process.argv.includes('--check') && over.length) { console.error(`hints-census: ${over.length} hint(s) over ${LIMIT} characters (A HINT IS ONE LINE)`); process.exit(1); }
