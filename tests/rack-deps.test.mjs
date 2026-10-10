/* rack-deps.test.mjs — tools/rack-deps.mjs, the measured dependency graph of lab/rack.js (0.5.2 planning).  Node only.
 *
 * §1 the lexer on the shapes that confuse lexers (a regex with `/` in a class, nested templates, division beside a regex,
 *    an unterminated string); §2 the scope walker on a fixture whose every shadow is known — a parameter, an arrow
 *    parameter, a destructured parameter, a for-head over an unbraced body, a catch binding, an inner block's const, an
 *    inner const read before its line (TDZ) — and whose reads / writes / mutates, ui members and LW facade are known;
 *    §3 lab/rack.js itself: ONE boot body, the sections' lines sum to it, every boot-level name in exactly one section,
 *    a clean walk (no warning), and the shadows the file is known to carry (`rk` re-declared in a for-head at line ~3034).
 *
 * Run:  node tests/rack-deps.test.mjs
 */
import { readFileSync } from 'node:fs';
import { lex, analyze } from '../tools/rack-deps.mjs';

let red = 0;
const check = (ok, what, detail = '') => { if (ok) console.log('PASS ' + what); else { red++; console.log('RED  ' + what + (detail ? ' — ' + detail : '')); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── §1 THE LEXER ── */
{
  const { toks } = lex('const r = /[/]+/g.test(s) ? a / b / c : `t${ `${u}` }`; if (x) /re/.test(y); const q = (1) / 2;');
  const kinds = toks.map((t) => t.t);
  check(kinds.filter((k) => k === 'regex').length === 2, 'lexer: two regex literals (`/[/]+/g` after `=`, `/re/` after a control head)');
  check(toks.filter((t) => t.v === '/').length === 3, 'lexer: three divisions (`a / b / c`, `(1) / 2`)');
  check(kinds.filter((k) => k === 'tplStart').length === 2 && kinds.filter((k) => k === 'tplEnd').length === 2, 'lexer: a template nested in a template\'s ${…}');
  let threw = '';
  try { lex("const s = 'open;\nfoo();"); } catch (e) { threw = e.message; }
  check(/newline inside a ' string/.test(threw), 'lexer: an unterminated string throws', threw);
  threw = '';
  try { lex('function f() { return (1; }'); } catch (e) { threw = e.message; }
  check(threw !== '', 'lexer: unbalanced brackets throw', threw);
}

/* ── §2 THE WALKER ON A KNOWN FIXTURE ── */
{
  const src = [
    "import { x as importedX } from './a.js';",                                   // 1
    'const TOP = 1;',                                                              // 2
    'export async function boot(dom) {',                                           // 3
    '  const a = 1, { b, c: cc = 2, ...rest } = dom.opts, [d, , e = a] = [];',     // 4
    '  let w = 0, k = 0;',                                                         // 5
    '  const ui = {};',                                                            // 6
    '  /* ── ONE ───────── */',                                                    // 7
    '  function f(a) { return a + b; }',                                           // 8   a: the parameter
    '  const g = (b) => b + cc;',                                                  // 9   b: the arrow's parameter
    '  const h = ({ d }) => d + e;',                                               // 10  d: a destructured parameter
    '  for (const k of [1]) w += k;',                                              // 11  k: the for-head, over an unbraced body
    '  try { f(); } catch (rest) { rest.x = 1; }',                                 // 12  rest: the catch binding
    '  ui.one = () => a;',                                                         // 13
    '  /* ── TWO ───────── */',                                                    // 14
    '  { const a = 5; w = a; }',                                                   // 15  a: an inner block's const
    '  w++;',                                                                      // 16
    '  const o = { a, b: c2(), d() { return d; }, get e() { return importedX + TOP; } };',   // 17
    '  rest.push(1);',                                                             // 18
    '  if (ui.one) ui.two = 2;',                                                   // 19
    '  function c2() { const later = () => z; const z = 1; return later; }',       // 20  z: an inner const, read before its line
    '  const z = 3;',                                                              // 21
    '  const LW = { a, w: () => w, f, o };',                                       // 22
    '  LW.extra = g(h(z));',                                                       // 23
    '  window.__LW = LW;',                                                         // 24
    '  return LW;',                                                                // 25
    '}',                                                                           // 26
  ].join('\n') + '\n';
  const R = analyze(src, { file: 'fixture.js' });
  const S = R.sections;
  check(R.boot.count === 1 && R.boot.bodyLines === 22 && S.length === 3, 'fixture: one boot body of 22 lines in three sections (the head, ONE, TWO)',
    `${R.boot.count} · ${R.boot.bodyLines} · ${S.length}`);
  check(same(S.map((s) => s.lines), [3, 7, 12]), 'fixture: the sections\' lines are 3 + 7 + 12', JSON.stringify(S.map((s) => s.lines)));
  check(same(S[0].declared, ['a', 'b', 'cc', 'rest', 'd', 'e', 'w', 'k', 'ui']), 'fixture: the head declares a b cc rest d e w k ui (destructuring, holes, defaults, rest)', S[0].declared.join(' '));
  check(same(S[1].declared, ['f', 'g', 'h']) && same(S[2].declared, ['o', 'c2', 'z', 'LW']), 'fixture: ONE declares f g h; TWO declares o c2 z LW');
  const nm = (xs) => xs.map((x) => x.name).sort();
  check(same(nm(S[1].reads), ['a', 'b', 'cc', 'e', 'ui', 'w']), 'fixture: ONE reads a b cc e ui w — never d (h\'s parameter), k (the for-head) or rest (the catch)', nm(S[1].reads).join(' '));
  check(same(nm(S[1].writes), ['w']) && same(nm(S[1].mutates), ['ui']), 'fixture: ONE writes w (`w += k`) and mutates only ui (`ui.one =`; `rest.x =` is the catch binding\'s)');
  check(same(nm(S[2].reads), ['a', 'd', 'f', 'g', 'h', 'rest', 'ui', 'w']), 'fixture: TWO reads a d f g h rest ui w (shorthand keys are references, plain keys are not)', nm(S[2].reads).join(' '));
  check(same(nm(S[2].writes), ['w']) && same(nm(S[2].mutates), ['rest', 'ui']), 'fixture: TWO writes w (`w = a`, `w++`) and mutates rest (`rest.push(`) and ui (`ui.two =`)');
  check(same(S[1].ui.defines, ['one']) && same(S[2].ui.defines, ['two']) && same(S[2].ui.foreign, ['one']), 'fixture: ui.one is ONE\'s, ui.two is TWO\'s, TWO reads ONE\'s');
  check(same(S[2].lw.defines, ['a', 'extra', 'f', 'o', 'w']), 'fixture: the LW facade — the literal\'s keys plus `LW.extra =`', S[2].lw.defines.join(' '));
  check(same(S[2].imports, ['importedX']) && same(S[2].module, ['TOP']), 'fixture: TWO uses the import importedX and the top-level TOP');
  check(same(S[0].dom.uses, ['opts']), 'fixture: the head touches dom.opts');
  check(same(Object.keys(R.shadows.byName), ['a', 'b', 'd', 'k', 'rest', 'z']), 'fixture: the six shadows are seen as shadows (a ×2 sites, b, d, k, rest, z read before its inner line)', Object.keys(R.shadows.byName).join(' '));
  const zUsers = R.names.find((x) => x.name === 'z').users;
  check(same(zUsers, [2]), 'fixture: the boot-level z is used only where it is declared (c2\'s z is c2\'s own)', JSON.stringify(zUsers));
  check(R.warnings.length === 0, 'fixture: the walk is clean', JSON.stringify(R.warnings));
}

/* ── §2b SHAPES: no semicolons (ASI), a switch whose case holds a block, a label, a declarator list of arrows ── */
{
  const src = [
    'export async function boot(dom) {',
    '  let n = 0',
    '  const m = 1',
    '  switch (n) { case 1: { const n = 2; m + n; } break; default: n++; }',
    '  outer: for (let i = 0; i < 2; i++) { if (i) continue outer; }',
    '  const arr = [1].map((x) => x + m), sum = arr.reduce((a, b) => a + b, 0)',
    '  return { n, sum };',
    '}',
  ].join('\n') + '\n';
  const R = analyze(src, { file: 'shapes.js' });
  check(same(R.names.map((x) => x.name), ['n', 'm', 'arr', 'sum']) && R.warnings.length === 0, 'shapes: ASI, a case block, a label and an arrow list declare n m arr sum and nothing inner',
    R.names.map((x) => x.name).join(' ') + ' ' + JSON.stringify(R.warnings));
  check(same(R.shadows.byName, { n: [4] }), 'shapes: the case block\'s `const n` shadows the boot-level n', JSON.stringify(R.shadows.byName));
}

/* ── §3 lab/rack.js ── */
{
  const src = readFileSync(new URL('../lab/rack.js', import.meta.url), 'utf8');
  let R = null, err = '';
  try { R = analyze(src); } catch (e) { err = e.message; }
  check(!!R, 'rack.js: the lexer and the walker survive the file (no unterminated string / template / regex / comment; brackets balanced)', err);
  if (R) {
    check(R.boot.count === 1 && R.boot.signature === 'export async function boot(dom)', 'rack.js: ONE `export async function boot(dom)` with one body', `${R.boot.count} · ${R.boot.signature}`);
    const sum = R.sections.reduce((k, s) => k + s.lines, 0);
    check(sum === R.boot.bodyLines && R.sections.every((s, k) => k === 0 || s.from === R.sections[k - 1].to + 1), 'rack.js: the sections tile the body — their lines sum to it, edge to edge', `${sum} vs ${R.boot.bodyLines}`);
    const declared = R.sections.flatMap((s) => s.declared);
    const names = R.names.map((x) => x.name);
    check(declared.length === names.length && new Set(declared).size === declared.length && names.every((x) => declared.includes(x)),
      `rack.js: every boot-level name (${names.length}) is attributed to exactly one section`, `${declared.length} attributed, ${new Set(declared).size} distinct, ${names.length} names`);
    check(R.names.every((x) => x.section >= 0 && x.section < R.sections.length && R.sections[x.section].from <= x.line && x.line <= R.sections[x.section].to), 'rack.js: each name\'s section holds its declaring line');
    check(R.warnings.length === 0, 'rack.js: the walk is clean (no class, no stray bracket, no name declared twice in one scope)', R.warnings.slice(0, 5).map((w) => `${w.line}: ${w.what}`).join('; '));
    const rkShadows = R.shadows.byName.rk || [];
    const rkFor = src.split('\n').findIndex((l) => /for \(const rk of \[rack, rackL\]\)/.test(l)) + 1;
    check(rkFor > 0 && rkShadows.includes(rkFor), `rack.js: the for-head \`rk\` at line ${rkFor} is a shadow, never a use of the boot-level rack`, JSON.stringify(rkShadows));
    check(R.totals.forward.eagerTdz === 0, 'rack.js: no eager use of a let/const from a later section (it would throw at boot)', String(R.totals.forward.eagerTdz));
  }
}

if (red) { console.log(`RED ${red} rack-deps check(s)`); process.exit(1); }
console.log('PASS rack-deps: the lexer, the walker\'s shadows and the measure of lab/rack.js');
