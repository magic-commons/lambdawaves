/* names a file uses that nothing in it declares (globals and undeclared): a name free now that was not free in the base rack.js is a lost binding */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { lex, pairBrackets, scopeWalk } from '../tools/rack-deps.mjs';
const root = new URL('../', import.meta.url).pathname;
const free = (src, rootRe) => {
  const L = lex(src), M = pairBrackets(L.toks), W = scopeWalk(L.toks, M, rootRe ? { root: rootRe } : {});
  const declared = new Set(); for (const s of W.scopes.values()) for (const n of s.names.keys()) declared.add(n);
  const T = L.toks, out = new Set();
  for (let i = 0; i < T.length; i++) {
    const t = T[i]; if (t.t !== 'name') continue;
    const prev = T[i - 1], next = T[i + 1];
    if (prev && prev.t === 'punct' && (prev.v === '.' || prev.v === '?.')) continue;
    if (next && next.t === 'punct' && next.v === ':' && prev && prev.t === 'punct' && (prev.v === '{' || prev.v === ',')) continue;
    if (!declared.has(t.v)) out.add(t.v);
  }
  return out;
};
const base = free(execFileSync('git', ['-C', root, 'show', '1d5b060:lab/rack.js'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
for (const f of ['lab/rack.js', 'lab/windows/readouts.js', 'lab/windows/kepler.js']) {
  const fr = free(readFileSync(root + f, 'utf8'), f.includes('windows') ? /^create[A-Z]\w*$/ : null);
  console.log(`${f}: free names not free in the base rack.js: ${[...fr].filter((n) => !base.has(n)).join(', ') || 'none'}`);
}
