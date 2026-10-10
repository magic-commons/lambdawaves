/* names a file uses that nothing in it declares (globals and undeclared) — the tree's files vs the base rack.js: a name free now
   that was bound in the base is a lost import or binding */
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
    if (next && next.t === 'punct' && next.v === ':' && prev && prev.t === 'punct' && (prev.v === '{' || prev.v === ',')) continue;   // an object key
    if (!declared.has(t.v)) out.add(t.v);
  }
  return out;
};
const base = free(execFileSync('git', ['-C', root, 'show', 'ff2b3e6:lab/rack.js'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
const baseAll = new Set(base);
for (const f of ['lab/rack.js', 'lab/shell/settings.js', 'lab/shell/persist.js', 'lab/shell/links.js', 'lab/shell/history.js']) {
  const fr = free(readFileSync(root + f, 'utf8'), f.includes('shell') ? /^create[A-Z]\w*$/ : null);
  const fresh = [...fr].filter((n) => !baseAll.has(n));
  const bindings = execFileSync('git', ['-C', root, 'show', 'ff2b3e6:lab/rack.js'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const lost = [...fr].filter((n) => !base.has(n) || true).filter((n) => new RegExp('(import|const|let|function)[^;\\n]*\\b' + n + '\\b').test(bindings) && base.has(n) === false);
  console.log(`${f}: free names not free in the base rack.js: ${fresh.join(', ') || 'none'}${lost.length ? ' · bound in the base: ' + lost.join(', ') : ''}`);
}
