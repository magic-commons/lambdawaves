/* wiring.test.mjs — THE REACHABILITY GATE.  Node only, no browser, no dependencies.
 *
 * ── WHAT THIS EXISTS TO CATCH (docs/ui/ANTI-PATTERNS.md #17) ────────────────────────────────────────────
 * Three subsystems were built, proved, and SHIPPED INERT in one week — each green in its own suite the whole
 * time, each precached by sw.js so every visitor downloaded it, each imported by nothing:
 *
 *     lab/sw.js            built wave 55, registered wave 56.   Nothing called serviceWorker.register.
 *     lab/capture.js       built wave 57, wired    wave 58.     73 KB, 26 green checks, zero importers.
 *     lab/render-exact.js  built wave 59, INERT AS OF TODAY.    92 KB, 39 green gates, zero importers.
 *
 * The failure mode is silence in BOTH directions: nothing breaks, nothing works, and the gate is green.  #17
 * names the pattern, but a documented pattern is not a gate.  This is the gate.  It resolves the import graph
 * the browser actually walks and FAILS on any lab/**\/*.js that no root reaches.
 *
 * ── WHY IT IS NOT A grep ───────────────────────────────────────────────────────────────────────────────
 * "Does anything mention capture.js?" was TRUE for the whole wave it was inert — sw.js's precache table names
 * it, and its own header comment shows `import { createCapture } from './capture.js';` as usage documentation.
 * Right now `from './render-exact.js'` appears exactly once in lab/, inside render-exact.js's own comment, and
 * `from './overlay.js'` appears in mir/glyph.js as a commented-out line.  A regex would call all three wired.
 * So §2 is a real JavaScript scanner: comments, strings, template literals and regex literals are consumed as
 * what they are, and only import syntax in CODE position becomes an edge.
 *
 * ── THE ROOTS ARE THE TEST ─────────────────────────────────────────────────────────────────────────────
 * A root is what the BROWSER loads, and two of the three are not imports at all:
 *   · the <script> tags in lab/index.html — src'd (classic or module) and inline module blocks alike;
 *   · lab/sw.js, fetched by `navigator.serviceWorker.register('./sw.js')` in main.js;
 *   · lab/mathworker.js, constructed by `new Worker(new URL('./mathworker.js', import.meta.url))` in rack.js.
 * The last two are DISCOVERED by walking the graph, never hardcoded.  Delete the register() call and sw.js
 * becomes an orphan and this test goes red — which is exactly what should have happened in wave 55.
 *
 * Run:  node tests/wiring.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB = path.join(ROOT, 'lab');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => readFileSync(p, 'utf8');
const KB = (p) => (statSync(p).size / 1024).toFixed(1) + ' KB';
const TODAY = new Date();

/* ══ 1.  THE ALLOWLIST ═══════════════════════════════════════════════════════════════════════════════════
 * A module staged for a later wave may name itself here.  It is deliberately awkward, and every rule below
 * is a rule because the easy version of it rots:
 *
 *   · REASON, 80 characters minimum, and #17's own prescription is what it must contain — "say in the REPORT
 *     that it is inert and NAME WHAT WILL CALL IT".  A reason that cannot name a caller is not a reason.
 *   · DATE, ISO, not in the future.  It is printed with its age on EVERY run, passing or failing, so nobody
 *     has to go looking for it to discover an entry has been sitting here since last month.
 *   · An entry for a file that is NOT an orphan FAILS.  A stale allowlist is how this whole mechanism would
 *     quietly stop being a gate: wire the module, forget the entry, and the next orphan inherits its cover.
 *   · An entry EXPIRES.  Loud warning at 14 days, hard failure at 60.  This is a time bomb on purpose: the
 *     alternative is a permanent exemption, which is the thing #17 is about.
 */
const ALLOWLIST = [
  { file: 'lab/mir/shell/about.js', date: '2026-09-21', reason: 'MIR 1.4.2 stages the shared shell until lab/rack.js migrates λWAVES’ commissioned notebook and ABOUT face to it.' },
  { file: 'lab/mir/shell/accent.js', date: '2026-09-21', reason: 'MIR 1.4.2 stages the shared shell until lab/rack.js migrates λWAVES’ commissioned accent editor to it.' },
  { file: 'lab/mir/shell/menubar.js', date: '2026-09-21', reason: 'MIR 1.4.2 stages the shared shell until lab/rack.js migrates λWAVES’ commissioned menubar implementation to it.' },
  { file: 'lab/mir/shell/notebook.js', date: '2026-09-21', reason: 'MIR 1.4.2 stages the shared shell until lab/rack.js migrates λWAVES’ commissioned notebook controller to it.' },
  { file: 'lab/mir/shell/vendor/katex/katex.min.js', date: '2026-09-21', reason: 'MIR 1.4.2 stages this vendor runtime until lab/rack.js calls the shared shell notebook and its loadRenderer function.' },
  { file: 'lab/mir/shell/vendor/marked.min.js', date: '2026-09-21', reason: 'MIR 1.4.2 stages this vendor runtime until lab/rack.js calls the shared shell notebook and its loadRenderer function.' },
  { file: 'lab/mir/shell/wordmark.js', date: '2026-09-21', reason: 'MIR 1.4.2 stages the shared shell until lab/rack.js migrates λWAVES’ commissioned wordmark implementation to it.' },
]; // Wave 107 wired the deterministic renderer into CAPTURE; the ChronusQ ports and the H₂O modules were staged here 2026-09-11/12 and reached by mathworker.js + chemview.js on 2026-09-12.

/* ══ 2.  A JAVASCRIPT SCANNER ════════════════════════════════════════════════════════════════════════════
 * Not a parser — a lexer, which is all an import graph needs and all that can be had from the standard
 * library.  It exists so that a specifier inside a comment, a string or a regex is NOT an edge.  Its own
 * integrity check is bracket balance (§2c): a lexer that mistakes a regex for a division, or misses the end
 * of a template, almost always ends with unbalanced braces, so a silently confused scan fails loudly. */

const ID_START = /[A-Za-z_$¡-￿]/;
const ID_PART = /[A-Za-z0-9_$¡-￿]/;
const DIGIT = /[0-9]/;
/* After these, a `/` opens a regex.  After any other name (an identifier, `this`, `true`) it is division. */
const KEYWORD_BEFORE_REGEX = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else',
  'yield', 'await', 'export', 'default', 'extends',
]);
/* `if (x) /re/.test(y)` is a regex; `(a + b) / 2` is division.  The difference is what the `(` belonged to. */
const CONTROL_HEAD = new Set(['if', 'for', 'while', 'with', 'switch', 'catch']);

function readEscape(src, j) {                                   // j points at the backslash
  const c = src[j + 1];
  if (c === undefined) return { ch: '', next: j + 1 };
  if (c === 'n') return { ch: '\n', next: j + 2 };
  if (c === 't') return { ch: '\t', next: j + 2 };
  if (c === 'r') return { ch: '\r', next: j + 2 };
  if (c === 'b') return { ch: '\b', next: j + 2 };
  if (c === 'f') return { ch: '\f', next: j + 2 };
  if (c === 'v') return { ch: '\v', next: j + 2 };
  if (c === '0' && !DIGIT.test(src[j + 2] || '')) return { ch: '\0', next: j + 2 };
  if (c === 'x') return { ch: String.fromCharCode(parseInt(src.substr(j + 2, 2), 16) || 0), next: j + 4 };
  if (c === 'u') {
    if (src[j + 2] === '{') { const e = src.indexOf('}', j + 3); return { ch: String.fromCodePoint(parseInt(src.slice(j + 3, e), 16) || 0), next: e + 1 }; }
    return { ch: String.fromCharCode(parseInt(src.substr(j + 2, 4), 16) || 0), next: j + 6 };
  }
  if (c === '\n') return { ch: '', next: j + 2 };               // line continuation
  return { ch: c, next: j + 2 };                                // \\  \'  \"  \`  \/  \$ …
}

/** Lex `src`.  Returns { toks, comments } — comments are kept only so §6 can explain a near-miss. */
function lex(src, where) {
  const toks = [], comments = [];
  const n = src.length;
  let i = 0, paren = 0, brace = 0, brack = 0;
  const parenCtl = [];                                          // was each open `(` a control head?
  const tplBrace = [];                                          // brace depths at which `}` resumes a template
  const push = (t) => { toks.push(t); return t; };
  const last = () => toks[toks.length - 1];

  /* Scan template characters from `from`.  Stops at the closing backtick or at a `${`. */
  const scanTpl = (from) => {
    let j = from, cooked = '';
    while (j < n) {
      const c = src[j];
      if (c === '\\') { const e = readEscape(src, j); cooked += e.ch; j = e.next; continue; }
      if (c === '`') return { next: j + 1, closed: true, cooked };
      if (c === '$' && src[j + 1] === '{') return { next: j + 2, closed: false, cooked };
      cooked += c; j++;
    }
    throw new Error(`${where}: unterminated template literal (scanner lost its place)`);
  };

  const regexAllowed = () => {
    const p = last();
    if (!p) return true;
    if (p.t === 'num' || p.t === 'str' || p.t === 'regex' || p.t === 'tplEnd') return false;
    if (p.t === 'name') return KEYWORD_BEFORE_REGEX.has(p.v);
    if (p.t === 'tpl') return true;                             // `${ …  — expression position
    if (p.v === ')') return p.ctl === true;
    if (p.v === ']' || p.v === '++' || p.v === '--') return false;
    return true;                                                // `}` included: a block end starts a statement
  };

  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v' || c === ' ' || c === '﻿') { i++; continue; }

    if (c === '/' && src[i + 1] === '/') {                       // line comment
      const e = src.indexOf('\n', i); const end = e < 0 ? n : e;
      comments.push({ at: i, text: src.slice(i, end) }); i = end; continue;
    }
    if (c === '/' && src[i + 1] === '*') {                       // block comment
      const e = src.indexOf('*/', i + 2);
      assert.ok(e >= 0, `${where}: unterminated block comment at offset ${i}`);
      comments.push({ at: i, text: src.slice(i, e + 2) }); i = e + 2; continue;
    }

    /* A `}` that closes a `${` resumes the template it interrupted — it is not punctuation. */
    if (c === '}' && tplBrace.length && brace === tplBrace[tplBrace.length - 1]) {
      tplBrace.pop();
      const r = scanTpl(i + 1);
      if (r.closed) push({ t: 'tplEnd', v: '', at: i }); else tplBrace.push(brace);
      i = r.next; continue;
    }

    if (c === '"' || c === "'") {                               // string literal
      let j = i + 1, cooked = '';
      while (j < n) {
        const d = src[j];
        if (d === '\\') { const e = readEscape(src, j); cooked += e.ch; j = e.next; continue; }
        if (d === c) { j++; break; }
        assert.notEqual(d, '\n', `${where}: newline inside a ${c} string at offset ${i}`);
        cooked += d; j++;
      }
      push({ t: 'str', v: cooked, at: i }); i = j; continue;
    }

    if (c === '`') {                                            // template literal
      const r = scanTpl(i + 1);
      if (r.closed) push({ t: 'str', v: r.cooked, at: i, tpl: true });
      else { push({ t: 'tpl', v: '', at: i }); tplBrace.push(brace); }
      i = r.next; continue;
    }

    if (DIGIT.test(c) || (c === '.' && DIGIT.test(src[i + 1] || ''))) {   // number
      let j = i;
      while (j < n && /[0-9a-fA-FxXoObBnN_.]/.test(src[j])) {
        if ((src[j] === 'e' || src[j] === 'E') && /[+-]/.test(src[j + 1] || '')) j++;
        j++;
      }
      while (j < n && /[eE]/.test(src[j]) && /[0-9+-]/.test(src[j + 1] || '')) { j += 2; while (j < n && DIGIT.test(src[j])) j++; }
      push({ t: 'num', v: src.slice(i, j), at: i }); i = j; continue;
    }

    if (ID_START.test(c) || c === '#') {                        // identifier / keyword / private name
      let j = i + 1;
      while (j < n && ID_PART.test(src[j])) j++;
      push({ t: 'name', v: src.slice(i, j), at: i }); i = j; continue;
    }

    if (c === '/' && regexAllowed()) {                          // regex literal
      let j = i + 1, cls = false;
      for (; j < n; j++) {
        const d = src[j];
        if (d === '\\') { j++; continue; }
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) break;
        else if (d === '\n') assert.fail(`${where}: newline inside a regex literal at offset ${i}`);
      }
      j++;
      while (j < n && /[a-z]/.test(src[j])) j++;
      push({ t: 'regex', v: src.slice(i, j), at: i }); i = j; continue;
    }

    const two = src.substr(i, 2);                               // punctuation
    if (two === '++' || two === '--' || two === '=>') { push({ t: 'punct', v: two, at: i }); i += 2; continue; }
    if (c === '(') { parenCtl.push(last() && last().t === 'name' && CONTROL_HEAD.has(last().v)); paren++; }
    else if (c === ')') { paren--; push({ t: 'punct', v: ')', at: i, ctl: parenCtl.pop() === true }); i++; assert.ok(paren >= 0, `${where}: unbalanced ) at offset ${i}`); continue; }
    else if (c === '{') brace++;
    else if (c === '}') brace--;
    else if (c === '[') brack++;
    else if (c === ']') brack--;
    assert.ok(brace >= 0 && brack >= 0, `${where}: unbalanced ${c} at offset ${i}`);
    push({ t: 'punct', v: c, at: i }); i++;
  }

  /* ══ 2c.  THE SCANNER'S OWN PROOF.  If any of these is non-zero the scan lost its place and every edge it
     found is suspect — so it is a hard failure, never a warning. */
  assert.equal(paren, 0, `${where}: scanner ended with ${paren} unclosed ( — the lex is not trustworthy`);
  assert.equal(brace, 0, `${where}: scanner ended with ${brace} unclosed { — the lex is not trustworthy`);
  assert.equal(brack, 0, `${where}: scanner ended with ${brack} unclosed [ — the lex is not trustworthy`);
  assert.equal(tplBrace.length, 0, `${where}: scanner ended inside a template literal`);
  return { toks, comments };
}

const lineOf = (src, at) => src.slice(0, at).split('\n').length;

/* ══ 3.  EDGES ═══════════════════════════════════════════════════════════════════════════════════════════
 * Static `import` / `export … from`, dynamic `import()` with a literal specifier, classic `importScripts()`,
 * and the two runtime loaders that make a root out of a file nothing imports.  A dynamic import whose
 * specifier is computed is recorded as UNRESOLVABLE — a hole this gate cannot see through, printed every run
 * so the hole is known rather than assumed absent. */
function edgesOf(src, where) {
  const { toks, comments } = lex(src, where);
  const out = { imports: [], unresolvable: [], workers: [], swRegs: [], comments, toks };

  /* The specifier of `import … from 'x'` / `export … from 'x'`: the `from` before the statement's `;`. */
  const fromSpec = (k) => {
    for (let j = k + 1; j < toks.length && j < k + 400; j++) {
      if (toks[j].t === 'punct' && toks[j].v === ';') return null;
      if (toks[j].t === 'name' && toks[j].v === 'from' && toks[j + 1] && toks[j + 1].t === 'str') return toks[j + 1];
    }
    return null;
  };
  /* Is the token after a string literal the END of that argument?  `import('./' + n)` starts with a string
     token too, and reading only the first token would call a CONCATENATED specifier a literal — the exact
     silent-ignore this section exists to refuse.  A literal argument is a string and then `)` or `,`. */
  const closes = (j) => { const p = toks[j]; return !!p && p.t === 'punct' && (p.v === ')' || p.v === ','); };
  /* The first argument of a call, when it is a literal: `f('x')` or `f(new URL('x', import.meta.url))`. */
  const literalArg = (k) => {                                   // k points at `(`
    const a = toks[k + 1];
    if (!a) return null;
    if (a.t === 'str') return closes(k + 2) ? a : null;
    if (a.t === 'name' && a.v === 'new' && toks[k + 2] && toks[k + 2].v === 'URL'
        && toks[k + 3] && toks[k + 3].v === '(' && toks[k + 4] && toks[k + 4].t === 'str'
        && closes(k + 5)) return toks[k + 4];
    return null;
  };
  /* Does the rest of this call say { type: 'module' }? */
  const saysModule = (k) => {
    for (let j = k + 1, d = 1; j < toks.length && d > 0; j++) {
      if (toks[j].t === 'punct' && toks[j].v === '(') d++;
      else if (toks[j].t === 'punct' && toks[j].v === ')') d--;
      else if (toks[j].t === 'str' && toks[j].v === 'module') return true;
    }
    return false;
  };

  for (let k = 0; k < toks.length; k++) {
    const t = toks[k], prev = toks[k - 1], next = toks[k + 1];
    if (t.t !== 'name') continue;
    if (prev && prev.t === 'punct' && prev.v === '.') {
      /* member position — the only thing we want here is `…serviceWorker.register(` */
      if (t.v === 'register' && toks[k - 2] && toks[k - 2].v === 'serviceWorker' && next && next.v === '(') {
        const a = literalArg(k + 1);
        if (a) out.swRegs.push({ spec: a.v, at: t.at, module: saysModule(k + 1) });
        else out.unresolvable.push({ at: t.at, what: 'serviceWorker.register() with a computed URL' });
      }
      continue;
    }

    if (t.v === 'import') {
      if (next && next.t === 'punct' && next.v === '.') continue;                 // import.meta
      if (next && next.t === 'punct' && next.v === '(') {                         // dynamic
        const a = literalArg(k + 1);
        if (a) out.imports.push({ spec: a.v, at: t.at, dynamic: true, classicOk: true });
        else out.unresolvable.push({ at: t.at, what: 'import() with a computed specifier' });
        continue;
      }
      if (next && next.t === 'str') { out.imports.push({ spec: next.v, at: t.at }); continue; }   // side-effect
      const s = fromSpec(k);
      assert.ok(s, `${where}:${lineOf(src, t.at)}: an \`import\` this scanner cannot read — teach §3 about it`);
      out.imports.push({ spec: s.v, at: t.at });
      continue;
    }

    if (t.v === 'export' && next && next.t === 'punct' && (next.v === '*' || next.v === '{')) {
      const s = fromSpec(k);
      if (s) out.imports.push({ spec: s.v, at: t.at });                           // re-export; plain export → none
      continue;
    }

    if (t.v === 'importScripts' && next && next.v === '(') {                       // classic worker
      for (let j = k + 2; j < toks.length && toks[j].t === 'str'; j += 2) out.imports.push({ spec: toks[j].v, at: toks[j].at, classicOk: true });
      continue;
    }

    if ((t.v === 'Worker' || t.v === 'SharedWorker') && prev && prev.t === 'name' && prev.v === 'new' && next && next.v === '(') {
      const a = literalArg(k + 1);
      if (a) out.workers.push({ spec: a.v, at: t.at, module: saysModule(k + 1) });
      else out.unresolvable.push({ at: t.at, what: `new ${t.v}() with a computed URL` });
    }
  }
  return out;
}

/* ══ 4.  THE ROOTS — what the browser loads, read out of the HTML ════════════════════════════════════════ */
function scriptsIn(htmlPath) {
  const src = read(htmlPath).replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length));   // HTML comments are not markup
  const found = [];
  for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = m[1];
    const src_ = (/\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs) || [])[1] || null;
    const type = ((/\btype\s*=\s*["']([^"']+)["']/i.exec(attrs) || [])[1] || '').toLowerCase();
    found.push({ src: src_, module: type === 'module', body: m[2], at: m.index });
  }
  return found;
}

const resolveSpec = (fromFile, spec) => {
  const bare = spec.split('?')[0].split('#')[0];
  if (/^[a-z]+:/i.test(bare)) return { external: true, spec };
  if (bare.startsWith('/')) return { rooted: true, spec };                          // server-absolute: not used here
  if (!bare.startsWith('.')) return { external: true, spec };                       // bare specifier: no import map
  return { file: path.resolve(path.dirname(fromFile), bare) };
};

/* ══ 5.  THE WALK ════════════════════════════════════════════════════════════════════════════════════════ */
const INDEX = path.join(LAB, 'index.html');
assert.ok(existsSync(INDEX), 'lab/index.html is missing — there is no entry document to start from');

const reached = new Map();                 // abs path -> [reason, …]
const queue = [];
const note = (file, why) => {
  const had = reached.has(file);
  if (!had) { reached.set(file, [why]); queue.push(file); } else reached.get(file).push(why);
  return !had;
};

const classicRoots = new Set();            // a classic <script> cannot use `import`; it is a root AND a leaf
const externals = [], rootedSpecs = [], unresolvable = [], workerRoots = [], swRoots = [];

for (const s of scriptsIn(INDEX)) {
  if (s.src) {
    const r = resolveSpec(INDEX, s.src);
    if (r.external) { externals.push({ from: 'lab/index.html', spec: s.src }); continue; }
    assert.ok(r.file && existsSync(r.file),
      `lab/index.html loads <script src="${s.src}"> and that file does not exist — the page is broken, not merely unwired`);
    if (!s.module) classicRoots.add(r.file);
    note(r.file, `<script${s.module ? ' type="module"' : ''} src> in lab/index.html`);
  } else if (s.module && s.body.trim()) {
    for (const e of edgesOf(s.body, 'lab/index.html (inline module)').imports) {
      const r = resolveSpec(INDEX, e.spec);
      if (r.file) { assert.ok(existsSync(r.file), `lab/index.html inline module imports '${e.spec}' — no such file`); note(r.file, 'inline <script type="module"> in lab/index.html'); }
    }
  }
}
assert.ok(reached.size > 0, 'lab/index.html loads no scripts at all — every module in lab/ is unreachable');

/* Breadth-first over the real edges, discovering runtime roots (workers, the service worker) as it goes. */
const edgeCount = { static: 0, dynamic: 0 };
const sourceOf = new Map();                                        // abs path -> source text, for §6
while (queue.length) {
  const file = queue.shift();
  if (!file.endsWith('.js')) continue;
  const src = read(file);
  sourceOf.set(file, src);
  const E = edgesOf(src, rel(file));
  for (const u of E.unresolvable) unresolvable.push({ file: rel(file), line: lineOf(src, u.at), what: u.what });

  /* A CLASSIC script or worker is scanned too — it cannot carry a static `import`, but it CAN carry
     `import()`, `importScripts()` and `new Worker()`, and a root reached only that way would otherwise read
     as an orphan.  Its static-import edges are dropped rather than trusted: a `from '…'` shape in minified
     classic code is not a module edge, and this gate must never grant reachability it cannot justify. */
  const classic = classicRoots.has(file);
  for (const e of E.imports) {
    if (classic && !e.classicOk) continue;
    const r = resolveSpec(file, e.spec);
    if (r.external) { externals.push({ from: rel(file), spec: e.spec }); continue; }
    if (r.rooted) { rootedSpecs.push({ from: rel(file), spec: e.spec }); continue; }
    assert.ok(existsSync(r.file), `${rel(file)}:${lineOf(src, e.at)} imports '${e.spec}' — no such file`);
    e.dynamic ? edgeCount.dynamic++ : edgeCount.static++;
    note(r.file, `imported by ${rel(file)}:${lineOf(src, e.at)}`);
  }
  for (const w of E.workers) {
    const r = resolveSpec(file, w.spec);
    assert.ok(r.file && existsSync(r.file), `${rel(file)}:${lineOf(src, w.at)} starts a worker from '${w.spec}' — no such file`);
    workerRoots.push({ file: rel(r.file), from: `${rel(file)}:${lineOf(src, w.at)}`, module: w.module });
    if (!w.module) classicRoots.add(r.file);                       // classic worker: only importScripts() reaches further
    note(r.file, `new Worker() in ${rel(file)}:${lineOf(src, w.at)}`);
  }
  for (const g of E.swRegs) {
    const r = resolveSpec(file, g.spec);
    assert.ok(r.file && existsSync(r.file), `${rel(file)}:${lineOf(src, g.at)} registers '${g.spec}' — no such file`);
    swRoots.push({ file: rel(r.file), from: `${rel(file)}:${lineOf(src, g.at)}`, module: g.module });
    if (!g.module) classicRoots.add(r.file);                       // a classic service worker: importScripts() only
    note(r.file, `serviceWorker.register() in ${rel(file)}:${lineOf(src, g.at)}`);
  }
}

/* ══ 6.  THE UNIVERSE, AND WHAT IS NOT IN THE GRAPH ══════════════════════════════════════════════════════ */
const walk = (d, out = []) => { for (const e of readdirSync(d, { withFileTypes: true })) {
  const f = path.join(d, e.name); if (e.isDirectory()) walk(f, out); else out.push(f); } return out; };
const universe = walk(LAB).filter((f) => f.endsWith('.js')).sort();

/* sw.js's precache table, so an orphan can be priced.  Read as data — these strings are never edges. */
const PRECACHED = (() => {
  const p = path.join(LAB, 'sw.js');
  if (!existsSync(p)) return new Set();
  const { toks } = lex(read(p), 'lab/sw.js');
  const k = toks.findIndex((t) => t.t === 'name' && t.v === 'PRECACHE');
  if (k < 0) return new Set();
  const set = new Set();
  for (let j = k, d = 0; j < toks.length; j++) {
    if (toks[j].v === '[') d++;
    else if (toks[j].v === ']') { if (--d === 0 && j > k) break; }
    else if (toks[j].t === 'str' && toks[j].v.startsWith('./')) set.add(path.resolve(LAB, toks[j].v));
  }
  return set;
})();

/* Other HTML in lab/ — bench pages that are NOT roots (sw.js's NEVER_PRECACHE says why for smoke.html).
   They are not counted as reachability, but an orphan they touch deserves the note. */
const benchReach = new Map();
for (const h of walk(LAB).filter((f) => /\.html?$/i.test(f) && f !== INDEX)) {
  for (const s of scriptsIn(h)) {
    const specs = s.src ? [s.src] : (s.module ? edgesOf(s.body, `${rel(h)} (inline)`).imports.map((e) => e.spec) : []);
    for (const sp of specs) { const r = resolveSpec(h, sp); if (r.file && existsSync(r.file)) benchReach.set(r.file, rel(h)); }
  }
}

/* Where does an orphan's NAME appear?  This is the near-miss that made capture.js look wired for a week. */
function mentions(orphan) {
  const base = path.basename(orphan);
  const hits = [];
  for (const [f, src] of sourceOf) {
    if (f === orphan) continue;
    const E = edgesOf(src, rel(f));
    for (const c of E.comments) if (c.text.includes(base)) hits.push(`${rel(f)}:${lineOf(src, c.at)} (comment)`);
    for (const t of E.toks) if (t.t === 'str' && t.v.includes(base)) hits.push(`${rel(f)}:${lineOf(src, t.at)} (string)`);
  }
  if (PRECACHED.has(orphan)) hits.push('lab/sw.js §1 PRECACHE (a data table, not an edge)');
  return [...new Set(hits)];
}

/* ══ 7.  THE REPORT, THEN THE VERDICT ════════════════════════════════════════════════════════════════════ */
const days = (iso) => Math.floor((TODAY - new Date(iso + 'T00:00:00Z')) / 86400000);
const WARN_DAYS = 14, EXPIRE_DAYS = 60;

console.log('\n  ── THE ALLOWLIST (printed every run, passing or failing) ──────────────────────────────────');
if (!ALLOWLIST.length) console.log('    (empty — every module in lab/ is reached by a root)');
for (const a of ALLOWLIST) {
  const age = days(a.date);
  console.log(`    ${a.file}   staged ${a.date} · ${age} day${age === 1 ? '' : 's'} ago · expires in ${EXPIRE_DAYS - age}` +
    (age >= WARN_DAYS ? '   ⚠ OVERDUE' : ''));
  console.log(`      ${a.reason.replace(/\s+/g, ' ')}`);
}

const allowed = new Set();
for (const a of ALLOWLIST) {
  const p = path.resolve(ROOT, a.file);
  assert.match(a.date, /^\d{4}-\d{2}-\d{2}$/, `allowlist ${a.file}: date must be ISO YYYY-MM-DD`);
  assert.ok(days(a.date) >= 0, `allowlist ${a.file}: date ${a.date} is in the future`);
  assert.ok(String(a.reason).trim().length >= 80,
    `allowlist ${a.file}: the reason must NAME WHAT WILL CALL IT (ANTI-PATTERN 17), in at least 80 characters`);
  assert.ok(existsSync(p), `allowlist ${a.file}: no such file — delete the entry`);
  assert.ok(!reached.has(p),
    `allowlist ${a.file}: this module IS reached now (${(reached.get(p) || [''])[0]}) — the entry is stale, delete it.\n` +
    '      A stale allowlist is how this gate stops being one: the next orphan would inherit the cover.');
  assert.ok(days(a.date) < EXPIRE_DAYS,
    `allowlist ${a.file}: staged ${days(a.date)} days ago and still inert. An allowlist entry expires after ` +
    `${EXPIRE_DAYS} days, on purpose — wire it, or delete it and the module with it.`);
  allowed.add(p);
}

console.log('\n  ── THE ROOTS ─────────────────────────────────────────────────────────────────────────────');
for (const s of scriptsIn(INDEX)) if (s.src) console.log(`    lab/index.html  <script${s.module ? ' type="module"' : ''} src="${s.src}">`);
for (const w of workerRoots) console.log(`    ${w.file}  ← new Worker(${w.module ? 'type: module' : 'classic'}) at ${w.from}`);
for (const g of swRoots) console.log(`    ${g.file}  ← serviceWorker.register(${g.module ? 'type: module' : 'classic'}) at ${g.from}`);
if (classicRoots.size) console.log(`    (classic, so no static imports — scanned only for import(), importScripts() and new Worker(): ${[...classicRoots].map(rel).join(', ')})`);

console.log('\n  ── THE GRAPH ─────────────────────────────────────────────────────────────────────────────');
console.log(`    ${reached.size} files reached · ${edgeCount.static} static edges · ${edgeCount.dynamic} dynamic edge${edgeCount.dynamic === 1 ? '' : 's'} (literal specifier)`);
console.log(`    ${universe.length} .js files under lab/ · ${PRECACHED.size} entries in sw.js's precache table`);
if (benchReach.size) console.log(`    bench pages (NOT roots): ${[...new Set(benchReach.values())].join(', ')}`);

console.log('\n  ── HOLES THIS GATE CANNOT SEE THROUGH ────────────────────────────────────────────────────');
if (!unresolvable.length && !rootedSpecs.length) console.log('    none: every specifier in the graph is a literal relative path.');
for (const u of unresolvable) console.log(`    UNRESOLVABLE  ${u.file}:${u.line}  ${u.what} — anything only it loads will read as an orphan`);
for (const r of rootedSpecs) console.log(`    UNRESOLVABLE  ${r.from}  server-absolute specifier '${r.spec}' — resolved against the deploy root, not the repo`);
if (externals.length) console.log(`    external (not this repo's to reach): ${externals.map((e) => e.spec).join(', ')}`);

const orphans = universe.filter((f) => !reached.has(f) && !allowed.has(f));
if (orphans.length) {
  console.log('\n  ── ORPHANS ───────────────────────────────────────────────────────────────────────────────');
  for (const o of orphans) {
    const pre = PRECACHED.has(o);
    console.log(`    ${rel(o)}   ${KB(o)}   ${pre ? 'PRECACHED — every visitor downloads it for nothing' : 'not precached'}`);
    if (benchReach.has(o)) console.log(`      reached only by ${benchReach.get(o)}, which is a bench page and not part of the shipped lab`);
    for (const m of mentions(o)) console.log(`      named in ${m}`);
  }
}

assert.equal(orphans.length, 0,
  `\n\n  ${orphans.length} module${orphans.length === 1 ? '' : 's'} under lab/ that NO root reaches (see above).\n` +
  '  ANTI-PATTERN 17: a subsystem that passes its own suite and that nothing calls ships inert, silently, to\n' +
  '  every visitor. Wire it in this wave, delete it, or — if it is genuinely staged for a named later wave —\n' +
  "  add it to §1's ALLOWLIST with a reason that names its caller and today's date.\n");

const totalKB = (universe.reduce((s, f) => s + statSync(f).size, 0) / 1024).toFixed(0);
console.log(`\nPASS wiring: all ${universe.length} .js files under lab/ (${totalKB} KB) are reached from the real roots ` +
  `(${reached.size} nodes, ${edgeCount.static + edgeCount.dynamic} edges), or named in the allowlist (${ALLOWLIST.length}). ` +
  'Comments, strings, template literals and sw.js\'s precache table are read as data, never as edges.\n');
