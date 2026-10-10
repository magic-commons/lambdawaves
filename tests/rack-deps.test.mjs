/* rack-deps.test.mjs — tools/rack-deps.mjs, the measured dependency graph of lab/rack.js (0.5.2 planning).  Node only.
 *
 * §1 the lexer on the shapes that confuse lexers (a regex with `/` in a class, nested templates, division beside a regex,
 *    an unterminated string); §2 the scope walker on a fixture whose every shadow is known — a parameter, an arrow
 *    parameter, a destructured parameter, a for-head over an unbraced body, a catch binding, an inner block's const, an
 *    inner const read before its line (TDZ) — and whose reads / writes / mutates, ui members and LW facade are known;
 *    §3 lab/rack.js itself: ONE boot body, the sections' lines sum to it, every boot-level name in exactly one section,
 *    a clean walk (no warning), and the shadows the file is known to carry (`rk` re-declared in a for-head at line ~3034).
 * §4 (0.5.2 R0) the classes table on the plan's cut — the pieces tile the body, no shared let is left bare, every app.state member is
 *    a key of the literal, no bare cross-module write, the hinge (forward + shared ≤ 25) — and G-A read statically; the app-source helper.
 * §5 (0.5.2 R1) a module that has left rack.js is measured from its file (lab/shell/, lab/windows/) as a piece of its planned module:
 *    a fixture boot + controller file (handed names by key, app chains, the file's seats at its call, a module's fill of its own name
 *    not a crossing, a null slot destructured is a stray, an unplanned file refused), then the real tree keeps its 23 rows.
 *
 * Run:  node tests/rack-deps.test.mjs
 */
import { readFileSync } from 'node:fs';
import { lex, analyze, classes, PLANNED, HINGE } from '../tools/rack-deps.mjs';
import { appFiles, appSource, APP_FOLDERS } from './helpers/app-source.mjs';

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

/* ── §4 THE CLASSES TABLE AND THE CONTEXT (0.5.2 R0: G-G and G-A, read statically) ── */
{
  const src = readFileSync(new URL('../lab/rack.js', import.meta.url), 'utf8');
  let C = null, err = '';
  try { C = classes(src); } catch (e) { err = e.message; }
  check(!!C, '--classes: every anchor of the plan\'s cut is found, in order', err);
  if (C) {
    const P = C.pieces;
    check(P[0].from === C.boot.openLine + 1 && P[P.length - 1].to === C.boot.closeLine - 1 && P.every((p, k) => k === 0 || p.from === P[k - 1].to + 1),
      `--classes: the ${P.length} pieces tile boot's body edge to edge`, JSON.stringify(P.map((p) => [p.module, p.from, p.to])).slice(0, 300));
    check(Object.keys(PLANNED).every((m) => P.some((p) => p.module === m)), 'every planned module holds at least one piece');
    check(C.sharedLets.length === 0, 'every shared let the cut names is an `app.state` member: none is left a bare `let` two scopes touch', C.sharedLets.join(', '));
    const stateKeys = C.appShape.ns.state || [];
    check(C.stateMembers.length > 0 && C.stateMembers.every((x) => stateKeys.includes(x)), `every app.state member the code uses (${C.stateMembers.length}) is a key of the literal's state namespace`,
      C.stateMembers.filter((x) => !stateKeys.includes(x)).join(', '));
    check(C.hinge.crossWrites === 0, 'no bare write to a binding another planned module owns', C.modules.filter((m) => m.crossWrites.length).map((m) => m.id + ': ' + m.crossWrites.join(' ')).join('; '));
    check(C.modules.every((m) => m.stays || m.forwardShared <= HINGE), `THE HINGE: forward + shared ≤ ${HINGE} in every module that moves (the largest: ${C.hinge.worst.id} ${C.hinge.worst.forwardShared})`,
      C.modules.filter((m) => !m.stays && m.forwardShared > HINGE).map((m) => m.id + ' ' + m.forwardShared).join(', '));
    check(C.appShape.line > C.boot.openLine && C.appShape.line <= P[0].to && C.appStrays.length === 0 && C.appShape.largest < 128,
      `G-A: \`app\` is ONE literal in the boot head (line ${C.appShape.line}), every member the code names is a key of it, no Object.assign, no delete, no namespace of 128 keys (V8 would make it a dictionary)`,
      C.appStrays.slice(0, 5).join('; ') + ' · largest ' + C.appShape.largest);
  }
  const files = appFiles();
  check(files[0] === 'rack.js' && files.slice(1).every((f) => APP_FOLDERS.some((d) => f.startsWith(d + '/'))) && appSource().startsWith(src),
    `tests/helpers/app-source.mjs: the app's source is rack.js first, then ${APP_FOLDERS.map((d) => 'lab/' + d + '/').join(' and ')} (${files.length} file${files.length > 1 ? 's' : ''} now)`, files.join(' '));
}

/* ── §5 A MODULE THAT LEFT rack.js IS MEASURED FROM ITS FILE (0.5.2 R1): a fixture boot and its controller file, then the real tree ── */
{
  const rack = [
    'export async function boot(dom) {',
    '  const reg = { n: 1 };',
    '  const app = { dom, reg, state: { seen: false, n: 0 }, loop: { schedule, page: null }, ctl: { gov: null }, w: { wX: null } };',
    '  /* ── ONE ── */',
    '  const { gov, touch } = await createCtl(app);',
    '  /* ── LOOP ── */',
    '  const page = { hidden: false };',
    '  app.loop.page = page;',
    '  function schedule() { return gov.on && reg.n; }',
    '  app.state.n = 2;',
    '  /* ── WIN ── */',
    '  const wX = { x: 1 };',
    '  app.w.wX = wX;',
    '  touch();',
    '  return app;',
    '}',
  ].join('\n') + '\n';
  const mod = (hand) => [
    'export async function createCtl(app) {',
    '  const { reg } = app;',
    `  const { ${hand} } = app.loop;`,
    '  app.state.seen = true;',
    '  const gov = { on: true };',
    '  function touch() { if (!app.loop.page.hidden) schedule(); app.state.n++; return app.w.wX.x + reg.n; }',
    '  return { gov, touch };',
    '}',
  ].join('\n') + '\n';
  const planned = { boot: PLANNED.boot, controller: PLANNED.controller, loop: PLANNED.loop, spectrum: PLANNED.spectrum };
  const cut = [[null, 'boot'], [/^ {2}\/\* ── ONE/, 'controller'], [/^ {2}\/\* ── LOOP/, 'loop'], [/^ {2}\/\* ── WIN/, 'spectrum']];
  let C = null, err = '';
  try { C = classes(rack, { file: 'fixture.js', planned, cut, modules: { 'lab/shell/controller.js': mod('schedule') } }); } catch (e) { err = e.message; }
  check(!!C, 'module files: a fixture boot with its controller in lab/shell/controller.js is measured', err);
  if (C) {
    const row = (id) => C.modules.find((m) => m.id === id);
    const ctl = row('controller'), loop = row('loop'), win = row('spectrum');
    check(ctl.files.length === 1 && ctl.files[0].rel === 'lab/shell/controller.js' && ctl.files[0].fn === 'createCtl' && C.files[0].seat === 4,
      'module files: the controller row is measured from its file, seated at its rack.js piece (line 4)', JSON.stringify(ctl.files));
    check(same(ctl.backward, ['reg']) && same(ctl.forward, ['schedule']) && same(ctl.context, ['loop.page', 'w.wX']),
      'module files: a name handed from app is the boot-level name (reg backward, schedule forward: boot declares it after the seat); app.loop.page and app.w.wX are forward', JSON.stringify([ctl.backward, ctl.forward, ctl.context]));
    check(same(ctl.stateOwn, ['seen']) && same(ctl.state, ['n']) && same(ctl.stateWrites, ['n']) && C.stateOwners.seen === 'controller' && C.stateOwners.n === 'loop',
      'module files: the file\'s eager app.state write is a seat at its call (seen is the controller\'s); its deferred n++ writes the loop\'s member', JSON.stringify([ctl.stateOwn, ctl.state, C.stateOwners]));
    check(ctl.forwardShared === 4 && ctl.crossWrites.length === 0 && ctl.ok, 'module files: forward + shared 4 (schedule, loop.page, w.wX, n), no bare write', String(ctl.forwardShared));
    check(same(loop.context, []) && same(win.context, []) && same(win.backward, ['touch']) && loop.backward.includes('gov'),
      'module files: a fill of a module\'s OWN name (app.loop.page = page, app.w.wX = wX) is its registration, not a crossing; the names the seat destructures are the controller\'s',
      JSON.stringify([loop.context, win.context, win.backward, loop.backward]));
    check(C.crossNames.some((c) => c.name === 'touch' && c.owner === 'controller') && C.crossNames.some((c) => c.name === 'schedule' && c.users.includes('controller')) && C.appStrays.length === 0,
      'module files: the crossing names run both ways across the file (touch the controller\'s, schedule into it); G-A clean', JSON.stringify([C.crossNames, C.appStrays]));
  }
  let S = null;
  try { S = classes(rack, { file: 'fixture.js', planned, cut, modules: { 'lab/shell/controller.js': mod('schedule, page') } }); } catch (e) { err = e.message; }
  check(!!S && S.appStrays.some((x) => /destructures app\.loop\.page, a null slot/.test(x)), 'module files: G-A — destructuring a slot the literal holds as null (filled later by boot) is a stray: it would freeze the null', S ? S.appStrays.join('; ') : err);
  let T = '';
  try { classes(rack, { file: 'fixture.js', planned, cut, modules: { 'lab/shell/nowhere.js': mod('schedule') } }); } catch (e) { T = e.message; }
  check(/no planned module's file/.test(T), 'module files: a file under lab/shell/ that no planned module names is refused', T);
  /* the real tree: every file under lab/shell/ and lab/windows/ is a planned module's, measured; the table keeps one row per planned module */
  const src = readFileSync(new URL('../lab/rack.js', import.meta.url), 'utf8');
  let R = null; err = '';
  try { R = classes(src); } catch (e) { err = e.message; }
  check(!!R && R.modules.length === Object.keys(PLANNED).length && R.modules.length === 23 && R.files.every((F) => R.modules.find((m) => m.id === F.module).files.some((x) => x.rel === F.rel)),
    `the real tree: ${R ? R.files.length : '?'} module file(s) measured as their planned modules (${R ? R.files.map((F) => F.rel + ' → ' + F.module).join(', ') || 'none yet' : err}); the table keeps its 23 rows`, err);
}

if (red) { console.log(`RED ${red} rack-deps check(s)`); process.exit(1); }
console.log('PASS rack-deps: the lexer, the walker\'s shadows and the measure of lab/rack.js');
