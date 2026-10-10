#!/usr/bin/env node
/* tools/rack-deps.mjs — THE MEASURED DEPENDENCY GRAPH OF lab/rack.js.  A diagnostic: tools/, never lab/, never precached.
 *
 * 0.5.2 plans to dissolve rack.js — one `export async function boot(dom)` of ~4,800 lines in ~30 comment-headed
 * sections — into modules.  This measures what each section would have to be handed if it left: the boot-level names it
 * declares, the ones it reads / writes / mutates from other sections, the `ui` bag's members, the LW facade (`__LW`),
 * the `__LW_hooks` bag, the imports and the `dom` members it touches — and from those the section × section matrix, the
 * hubs, the cycles and a moving-cost ranking.
 *
 *   node tools/rack-deps.mjs                  the summary; writes research/release-0.5.2/RACK-DEPS.md + rack-deps.json
 *   node tools/rack-deps.mjs --section 8      one section's detail (its § number, or a word of its header); writes nothing
 *   node tools/rack-deps.mjs --no-write       the summary only
 *   node tools/rack-deps.mjs --file x.js      another file of the same shape (exactly one `export async function boot(dom)`)
 *
 * No dependencies (the repo has no node_modules, so no acorn).  §1 is a lexer: comments, strings, templates with ${…}
 * nesting, regex literals (a `/` after an operator, an opener, a `,` `;` `:` or a keyword such as `return` / `typeof`
 * starts one; after `)` only when the `(` was a control head), multi-character punctuators and brace depth; it throws on
 * an unterminated string / template / regex / comment and on unbalanced brackets, so a confused lex fails loudly.  §2
 * pairs the brackets.  §3 is a two-pass SCOPE WALKER over the tokens — pass 1 declares, pass 2 resolves — so a name a
 * nested function or block re-declares (a parameter, a destructured parameter, an inner const / let / function, a
 * for-head, a catch binding, an arrow parameter) is that inner binding and never a use of the boot-level one, wherever
 * in the block the inner declaration sits (TDZ and hoisting both resolve to the inner binding, as JavaScript does).
 * §4 cuts boot's body into sections at its own `/* ── NAME ──` headers (two-space indent, brace depth 1); the smaller
 * headers become sub-notes.  §5 measures; §6 writes.  Deterministic: no clock, no randomness, every list sorted.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ══ 1.  THE LEXER ═══════════════════════════════════════════════════════════════════════════════════════════════ */
const ID_START = /[A-Za-z_$\u00a1-\uffff]/;
const ID_PART = /[A-Za-z0-9_$\u00a1-\uffff]/;
const DIGIT = /[0-9]/;
const WS = new Set([' ', '\t', '\n', '\r', '\f', '\v', '\u00a0', '\ufeff', '\u2028', '\u2029']);
/* After these names a `/` opens a regex; after any other name (an identifier, `this`, `true`) it divides. */
const KEYWORD_BEFORE_REGEX = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case',
  'do', 'else', 'yield', 'await', 'export', 'default', 'extends']);
/* `if (x) /re/.test(y)` is a regex; `(a + b) / 2` divides: what the `(` belonged to decides. */
const CONTROL_HEAD = new Set(['if', 'for', 'while', 'with', 'switch', 'catch']);
const PUNCT = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=',
  '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>'];

/** Lex `src` → { toks, comments, lineOf, stats }.  A token is { t, v, at, line } with t ∈ name · num · str · regex · punct ·
 *  tplStart (`…${) · tplMid (}…${) · tplEnd (}…`); a no-substitution template is a `str`.  A tplStart carries `parts`, the
 *  token indices of itself and of every tplMid / tplEnd of its template.  A comment carries its line, column and the
 *  bracket depths it sits at. */
export function lex(src) {
  const toks = [], comments = [];
  const n = src.length;
  const lineStarts = [0];
  for (let k = 0; k < n; k++) if (src.charCodeAt(k) === 10) lineStarts.push(k + 1);
  const lineOf = (at) => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= at) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
  let i = 0, paren = 0, brace = 0, brack = 0;
  const parenCtl = [], tplBrace = [], tplOpen = [];
  const stats = { regex: 0, templates: 0, strings: 0 };
  const fail = (what, at) => { throw new Error(`lex: ${what} at line ${lineOf(at)}`); };
  const push = (t, v, at, extra) => { const tok = { t, v, at, line: lineOf(at) }; if (extra) Object.assign(tok, extra); toks.push(tok); return tok; };
  const last = () => toks[toks.length - 1];
  const comment = (at, end) => {
    const line = lineOf(at);
    comments.push({ at, end, line, col: at - lineStarts[line - 1], text: src.slice(at, end), block: src[at + 1] === '*',
      brace, paren, brack, tpl: tplBrace.length });
  };
  const scanTpl = (from) => {
    let j = from;
    while (j < n) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '`') return { next: j + 1, closed: true };
      if (c === '$' && src[j + 1] === '{') return { next: j + 2, closed: false };
      j++;
    }
    return fail('unterminated template literal', from);
  };
  const regexAllowed = () => {
    const p = last();
    if (!p) return true;
    if (p.t === 'num' || p.t === 'str' || p.t === 'regex' || p.t === 'tplEnd') return false;
    if (p.t === 'name') return KEYWORD_BEFORE_REGEX.has(p.v);
    if (p.t === 'tplStart' || p.t === 'tplMid') return true;          // `${ …` — expression position
    if (p.v === ')') return p.ctl === true;
    if (p.v === ']' || p.v === '++' || p.v === '--') return false;
    return true;                                                       // `}` included: a block's end starts a statement
  };

  while (i < n) {
    const c = src[i];
    if (WS.has(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); const end = e < 0 ? n : e; comment(i, end); i = end; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      if (e < 0) fail('unterminated block comment', i);
      comment(i, e + 2); i = e + 2; continue;
    }
    /* A `}` that closes a `${` resumes the template it interrupted — it is not punctuation. */
    if (c === '}' && tplBrace.length && brace === tplBrace[tplBrace.length - 1]) {
      tplBrace.pop();
      const r = scanTpl(i + 1);
      if (r.closed) { push('tplEnd', '}`', i); tplOpen.pop().parts.push(toks.length - 1); }
      else { push('tplMid', '}${', i); tplOpen[tplOpen.length - 1].parts.push(toks.length - 1); tplBrace.push(brace); }
      i = r.next; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      for (;;) {
        if (j >= n) fail(`unterminated ${c} string`, i);
        const d = src[j];
        if (d === '\\') { j += 2; continue; }
        if (d === c) { j++; break; }
        if (d === '\n') fail(`newline inside a ${c} string`, i);
        j++;
      }
      stats.strings++; push('str', src.slice(i, j), i); i = j; continue;
    }
    if (c === '`') {
      stats.templates++;
      const r = scanTpl(i + 1);
      if (r.closed) push('str', src.slice(i, r.next), i, { tpl: true });
      else { const tok = push('tplStart', '`${', i, { parts: [toks.length] }); tplOpen.push(tok); tplBrace.push(brace); }
      i = r.next; continue;
    }
    if (DIGIT.test(c) || (c === '.' && DIGIT.test(src[i + 1] || ''))) {
      let j = i;
      while (j < n && /[0-9a-fA-FxXoObBnN_.]/.test(src[j])) {
        if ((src[j] === 'e' || src[j] === 'E') && /[+-]/.test(src[j + 1] || '')) j++;
        j++;
      }
      push('num', src.slice(i, j), i); i = j; continue;
    }
    if (ID_START.test(c) || c === '#') {
      let j = i + 1;
      while (j < n && ID_PART.test(src[j])) j++;
      push('name', src.slice(i, j), i); i = j; continue;
    }
    if (c === '/' && regexAllowed()) {
      let j = i + 1, cls = false;
      for (; j < n; j++) {
        const d = src[j];
        if (d === '\\') { j++; continue; }
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) break;
        else if (d === '\n') fail('newline inside a regex literal', i);
      }
      if (j >= n) fail('unterminated regex literal', i);
      j++;
      while (j < n && /[a-z]/.test(src[j])) j++;
      stats.regex++; push('regex', src.slice(i, j), i); i = j; continue;
    }
    let p = null;
    for (const q of PUNCT) if (src.startsWith(q, i)) { if (q === '?.' && DIGIT.test(src[i + 2] || '')) continue; p = q; break; }
    if (p) { push('punct', p, i); i += p.length; continue; }
    if (c === '(') { parenCtl.push(!!(last() && last().t === 'name' && CONTROL_HEAD.has(last().v))); paren++; push('punct', c, i); i++; continue; }
    if (c === ')') { paren--; if (paren < 0) fail('unbalanced )', i); push('punct', c, i, { ctl: parenCtl.pop() === true }); i++; continue; }
    if (c === '{') brace++;
    else if (c === '}') brace--;
    else if (c === '[') brack++;
    else if (c === ']') brack--;
    if (brace < 0 || brack < 0) fail(`unbalanced ${c}`, i);
    push('punct', c, i); i++;
  }
  /* THE LEXER'S OWN PROOF: a lex that lost its place almost always ends unbalanced. */
  if (paren || brace || brack) throw new Error(`lex: ended with ${paren} ( · ${brace} { · ${brack} [ unclosed — the lex is not trustworthy`);
  if (tplBrace.length) throw new Error('lex: ended inside a template literal');
  const lines = lineStarts.length - (n && src[n - 1] === '\n' ? 1 : 0);   // as `wc -l` counts a file that ends in a newline
  return { toks, comments, lineOf, lines, stats: { tokens: toks.length, comments: comments.length, ...stats } };
}

/* ══ 2.  BRACKETS ════════════════════════════════════════════════════════════════════════════════════════════════ */
export function pairBrackets(toks) {
  const M = new Int32Array(toks.length).fill(-1);
  const st = [];
  const CLOSE = { '(': ')', '[': ']', '{': '}' };
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== 'punct') continue;
    if (CLOSE[t.v]) st.push(k);
    else if (t.v === ')' || t.v === ']' || t.v === '}') {
      const o = st.pop();
      if (o === undefined || CLOSE[toks[o].v] !== t.v) throw new Error(`brackets: ${t.v} at line ${t.line} closes ${o === undefined ? 'nothing' : toks[o].v + ' of line ' + toks[o].line}`);
      M[o] = k; M[k] = o;
    }
  }
  if (st.length) throw new Error(`brackets: ${st.length} left open (first at line ${toks[st[0]].line})`);
  return M;
}

/* ══ 3.  THE SCOPE WALKER ════════════════════════════════════════════════════════════════════════════════════════
 * Not a parser — a walk over the token ranges the brackets delimit, which knows the handful of forms that BIND a name
 * (const / let / var with destructuring, function declarations and expressions, methods, arrows, for-heads, catch) and
 * the forms where a name is NOT a reference (a property after `.` / `?.`, an object-literal key, a method name, a label).
 * Scopes are keyed by the token that opens them, so pass 2 finds pass 1's scopes complete and resolves every reference
 * against the bindings of its whole block — a later `const x` in an inner block shadows `x` from the block's first line. */
const RESERVED = new Set(['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else',
  'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super',
  'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'await', 'enum',
  'undefined', 'arguments']);
const OPERATOR_WORDS = new Set(['typeof', 'void', 'delete', 'new', 'await', 'in', 'of', 'instanceof', 'yield', 'return', 'throw',
  'case', 'else', 'do', 'extends']);
const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=', '||=', '??=']);
/* `name.<m>(` with one of these is a MUTATION of the object the name holds (an array's, a Map's or a Set's own verbs). */
const MUTATORS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin', 'set', 'add', 'delete', 'clear']);

export function scopeWalk(toks, M) {
  const N = toks.length;
  const scopes = new Map();
  const warnings = [], refs = [], shadows = [], fns = [], imports = [], bootHits = [];
  const objKeys = new Map();     // `{` index of an object literal → its keys [{ key, kind, at }]
  const declInit = new Map();    // the name token of `const name = …` → { fn } | { obj: `{` index }
  let pass = 1;

  const P = (k) => (k >= 0 && k < N && toks[k].t === 'punct' ? toks[k].v : null);
  const isP = (k, v) => P(k) === v;
  const isN = (k, v) => k >= 0 && k < N && toks[k].t === 'name' && (v === undefined || toks[k].v === v);
  const jump = (k) => {
    const t = toks[k];
    if (t.t === 'punct' && (t.v === '(' || t.v === '[' || t.v === '{')) return M[k] + 1;
    if (t.t === 'tplStart') return t.parts[t.parts.length - 1] + 1;
    return k + 1;
  };
  const warn = (k, what) => { if (pass === 1) warnings.push({ line: toks[Math.min(Math.max(k, 0), N - 1)].line, what }); };
  const scopeAt = (key, kind, parent) => {
    let s = scopes.get(key);
    if (!s) { s = { key, kind, parent, names: new Map() }; scopes.set(key, s); }
    return s;
  };
  const module = scopeAt(-1, 'module', null);
  const fnScopeOf = (s) => { while (s.kind !== 'function' && s.kind !== 'module') s = s.parent; return s; };
  const declare = (scope, name, at, kind) => {
    const prev = scope.names.get(name);
    if (!prev) { scope.names.set(name, { at, kind }); return; }
    if (prev.at !== at) warn(at, `\`${name}\` declared twice in one scope (lines ${toks[prev.at].line} and ${toks[at].line})`);
  };
  const bootScope = () => (bootHits.length ? bootHits[0].scope : null);

  /* ── ASI, as far as a token walk can have it: a NAME on a new line after a token that ends an expression starts a new
     statement (an identifier cannot continue an expression; `in` / `of` / `instanceof` can). */
  const endsExpr = (t) => {
    if (t.t === 'name') return !OPERATOR_WORDS.has(t.v);
    if (t.t === 'num' || t.t === 'str' || t.t === 'regex' || t.t === 'tplEnd') return true;
    return t.t === 'punct' && (t.v === ')' || t.v === ']' || t.v === '}' || t.v === '++' || t.v === '--');
  };
  const asiBreak = (j) => {
    const t = toks[j], p = toks[j - 1];
    return t.line > p.line && t.t === 'name' && t.v !== 'in' && t.v !== 'of' && t.v !== 'instanceof' && endsExpr(p);
  };
  /** the end of the expression starting at i: the first `,` or `;` at this bracket level, an ASI break, or hi */
  const exprEnd = (i, hi) => {
    let j = i;
    while (j < hi) {
      if (isP(j, ',') || isP(j, ';')) return j;
      if (j > i && asiBreak(j)) return j;
      j = jump(j);
    }
    return hi;
  };
  /** the end of ONE statement starting at i (a for-loop's unbraced body: its head's bindings scope over exactly this) */
  const stmtEnd = (i, hi) => {
    if (i >= hi) return hi;
    const t = toks[i];
    if (isP(i, '{')) return M[i] + 1;
    if (isP(i, ';')) return i + 1;
    if (t.t === 'name') {
      if (t.v === 'if' && isP(i + 1, '(')) { let j = stmtEnd(M[i + 1] + 1, hi); if (isN(j, 'else')) j = stmtEnd(j + 1, hi); return j; }
      if ((t.v === 'for' || t.v === 'while' || t.v === 'with') && (isP(i + 1, '(') || isP(i + 2, '('))) return stmtEnd(M[isP(i + 1, '(') ? i + 1 : i + 2] + 1, hi);
      if (t.v === 'do') { let j = stmtEnd(i + 1, hi); if (isN(j, 'while') && isP(j + 1, '(')) j = M[j + 1] + 1; if (isP(j, ';')) j++; return j; }
      if (t.v === 'try' && isP(i + 1, '{')) {
        let j = M[i + 1] + 1;
        if (isN(j, 'catch')) { j++; if (isP(j, '(')) j = M[j] + 1; if (isP(j, '{')) j = M[j] + 1; }
        if (isN(j, 'finally') && isP(j + 1, '{')) j = M[j + 1] + 1;
        return j;
      }
      if (t.v === 'function' || (t.v === 'async' && isN(i + 1, 'function'))) {
        let j = i; while (j < hi && !isP(j, '(')) j++;
        return isP(M[j] + 1, '{') ? M[M[j] + 1] + 1 : M[j] + 1;
      }
    }
    let j = i;
    while (j < hi) {
      if (isP(j, ';')) return j + 1;
      if (j > i && asiBreak(j)) return j;
      j = jump(j);
    }
    return hi;
  };
  /** split [lo, hi) at its own-level commas */
  const forEachEntry = (lo, hi, fn) => {
    let a = lo, j = lo;
    while (j < hi) { if (isP(j, ',')) { fn(a, j); a = j + 1; j++; } else j = jump(j); }
    if (a < hi) fn(a, hi);
  };

  /* ── a reference: resolved against the scope chain (pass 2 only) ── */
  const isDeferred = (scope) => {
    const b = bootScope();
    for (let s = scope; s && s !== b; s = s.parent) if (s.kind === 'function') return true;
    return false;
  };
  const refKind = (i) => {
    const prev = P(i - 1), prevName = isN(i - 1) ? toks[i - 1].v : null;
    let j = i + 1, members = 0, first = null;
    for (;;) {
      if ((isP(j, '.') || isP(j, '?.')) && isN(j + 1)) { if (!members) first = toks[j + 1].v; members++; j += 2; continue; }
      if (isP(j, '[')) { members++; j = M[j] + 1; continue; }
      break;
    }
    const sameLine = (k) => toks[k].line === toks[k - 1].line;
    if (!members) {
      if (prev === '++' || prev === '--') return 'rw';
      const nx = P(i + 1);
      if (nx === '=') return 'write';
      if (ASSIGN.has(nx)) return 'rw';
      if ((nx === '++' || nx === '--') && sameLine(i + 1)) return 'rw';
    } else {
      const at = P(j);
      if (ASSIGN.has(at) || ((at === '++' || at === '--') && sameLine(j))) return 'mutate';
      if (prev === '++' || prev === '--' || prevName === 'delete') return 'mutate';
      if (members === 1 && first && MUTATORS.has(first) && isP(j, '(')) return 'mutate';
    }
    if (prev === '(' && isN(i - 2, 'assign') && isP(i - 3, '.') && isN(i - 4, 'Object')) return 'mutate';
    return 'read';
  };
  const noteRef = (i, scope, forced) => {
    if (pass !== 2) return;
    const name = toks[i].v;
    let s = scope;
    while (s && !s.names.has(name)) s = s.parent;
    if (!s) return;                                                    // a global (window, document, Math …): not this graph's
    const b = bootScope();
    if (s !== b && s !== module) {                                     // an inner binding — a shadow if boot has the same name
      if (b && b.names.has(name) && b.names.get(name).kind !== 'param') {
        let inside = false;
        for (let q = s; q; q = q.parent) if (q === b) { inside = true; break; }
        if (inside) shadows.push({ name, line: toks[i].line, binding: toks[s.names.get(name).at].line });
      }
      return;
    }
    const r = { name, at: i, line: toks[i].line, where: s === b ? 'boot' : 'module', kind: forced || refKind(i), deferred: isDeferred(scope) };
    if ((isP(i + 1, '.') || isP(i + 1, '?.')) && isN(i + 2)) { r.member = toks[i + 2].v; r.memberDef = ASSIGN.has(P(i + 3)); }
    else if (isP(i + 1, '[')) r.dynamic = true;
    if (isP(i - 1, '(') && isN(i - 2, 'assign') && isP(i - 3, '.') && isN(i - 4, 'Object') && isP(i + 1, ',') && isP(i + 2, '{')) r.assignObj = i + 2;
    refs.push(r);
  };

  /* ── binding patterns: parameters, declarations, catch ── */
  const bindTarget = (i, hi, ds, es, kind) => {
    if (isN(i)) { declare(ds, toks[i].v, i, kind); return i + 1; }
    if (isP(i, '{')) { objPattern(i + 1, M[i], ds, es, kind); return M[i] + 1; }
    if (isP(i, '[')) { bindList(i + 1, M[i], ds, es, kind); return M[i] + 1; }
    warn(i, `unexpected ${toks[i].v} in a binding pattern`);
    return i + 1;
  };
  const bindElem = (i, hi, ds, es, kind) => {
    if (isP(i, '...')) i++;
    i = bindTarget(i, hi, ds, es, kind);
    if (isP(i, '=')) { const e = exprEnd(i + 1, hi); walk(i + 1, e, es, 'expr'); i = e; }
    if (i < hi && !isP(i, ',')) { warn(i, 'residue after a binding element'); const e = exprEnd(i, hi); walk(i, e, es, 'expr'); i = e; }
    return i;
  };
  const bindList = (lo, hi, ds, es, kind) => {
    let i = lo;
    while (i < hi) { if (isP(i, ',')) { i++; continue; } i = bindElem(i, hi, ds, es, kind); }
  };
  const objPattern = (lo, hi, ds, es, kind) => {
    forEachEntry(lo, hi, (a, b) => {
      if (isP(a, '...')) { bindTarget(a + 1, b, ds, es, kind); return; }
      let k = a;
      if (isP(k, '[')) { walk(k + 1, M[k], es, 'expr'); k = M[k] + 1; } else k++;
      if (isP(k, ':')) { bindElem(k + 1, b, ds, es, kind); return; }
      if (isN(a)) declare(ds, toks[a].v, a, kind);                     // shorthand { a } / { a = 1 }
      if (isP(k, '=')) walk(k + 1, b, es, 'expr');
    });
  };
  /* destructuring ASSIGNMENT ([a, b] = … / ({ a } = …)): its plain names are writes */
  const assignTargets = (lo, hi, scope, isObj) => {
    forEachEntry(lo, hi, (a, b) => {
      let k = a;
      if (isP(k, '...')) k++;
      if (isObj) {
        if (isP(k, '[')) { walk(k + 1, M[k], scope, 'expr'); k = M[k] + 1; if (isP(k, ':')) k++; }
        else if (isP(k + 1, ':')) k += 2;
        else { if (isN(k)) { noteRef(k, scope, 'write'); k++; } if (isP(k, '=')) walk(k + 1, b, scope, 'expr'); return; }
      }
      if (isP(k, '{') || isP(k, '[')) { assignTargets(k + 1, M[k], scope, isP(k, '{')); k = M[k] + 1; }
      else if (isN(k) && (k + 1 >= b || isP(k + 1, '='))) { noteRef(k, scope, 'write'); k++; }
      else { let j = k; while (j < b && !isP(j, '=')) j = jump(j); walk(k, j, scope, 'expr'); k = j; }
      if (isP(k, '=')) walk(k + 1, b, scope, 'expr');
    });
  };

  const initKind = (s, e) => {
    let k = s;
    if (isN(k, 'async')) k++;
    if (isN(k, 'function') || (isN(k) && isP(k + 1, '=>')) || (isP(k, '(') && isP(M[k] + 1, '=>'))) return { fn: true };
    if (isP(s, '{') && M[s] + 1 === e) return { obj: s };
    return {};
  };
  const declList = (i, hi, scope, kw) => {
    const ds = kw === 'var' ? fnScopeOf(scope) : scope;
    i++;
    while (i < hi) {
      const at = i;
      i = bindTarget(i, hi, ds, scope, kw);
      if (isP(i, '=')) {
        const e = exprEnd(i + 1, hi);
        if (isN(at) && pass === 1) declInit.set(at, initKind(i + 1, e));
        walk(i + 1, e, scope, 'expr');
        i = e;
      }
      if (isP(i, ',')) { i++; continue; }
      break;
    }
    return i;
  };

  /* ── functions ── */
  const funcAt = (i, scope, decl) => {
    let j = i + 1;
    if (isP(j, '*')) j++;
    let nameAt = -1;
    if (isN(j)) { nameAt = j; j++; }
    if (!isP(j, '(')) { warn(i, 'function without a parameter list'); return i + 1; }
    const body = M[j] + 1;
    if (!isP(body, '{')) { warn(i, 'function without a body'); return body; }
    const fs = scopeAt(body, 'function', scope);
    if (nameAt >= 0) declare(decl ? scope : fs, toks[nameAt].v, nameAt, decl ? 'function' : 'fnexpr');
    if (pass === 1 && decl && scope === module && nameAt >= 0 && toks[nameAt].v === 'boot') {
      bootHits.push({ scope: fs, fnAt: i, nameAt, params: [j, M[j]], open: body, close: M[body] });
    }
    bindList(j + 1, M[j], fs, fs, 'param');
    walk(body + 1, M[body], fs, 'stmt');
    if (pass === 2) fns.push({ kind: decl ? 'function' : 'function-expr', at: i, line: toks[i].line, name: nameAt >= 0 ? toks[nameAt].v : null });
    return M[body] + 1;
  };
  const arrowAt = (pLo, pHi, arrow, hi, scope, single) => {
    const fs = scopeAt(arrow, 'function', scope);
    if (single) declare(fs, toks[pLo].v, pLo, 'param'); else bindList(pLo, pHi, fs, fs, 'param');
    const b = arrow + 1;
    if (pass === 2) fns.push({ kind: 'arrow', at: single ? pLo : pLo - 1, line: toks[single ? pLo : pLo - 1].line, name: null });
    if (isP(b, '{')) { walk(b + 1, M[b], fs, 'stmt'); return M[b] + 1; }
    const end = exprEnd(b, hi);
    walk(b, end, fs, 'expr');
    return end;
  };

  /* ── object literals: keys are not references; methods are functions; shorthand is a reference ── */
  const objectAt = (open, scope) => {
    const close = M[open], keys = [];
    forEachEntry(open + 1, close, (a, b) => {
      if (isP(a, '...')) { keys.push({ key: '...', kind: 'spread', at: a }); walk(a + 1, b, scope, 'expr'); return; }
      let k = a, mod = null;
      const t = toks[a];
      if (t.t === 'name' && (t.v === 'get' || t.v === 'set' || t.v === 'async' || t.v === 'static') && k + 1 < b
        && !isP(k + 1, '(') && !isP(k + 1, ',') && !isP(k + 1, ':') && !isP(k + 1, '=')) { mod = t.v; k++; }
      if (isP(k, '*')) { mod = mod || 'generator'; k++; }
      let key, keyAt = k;
      if (isP(k, '[')) { walk(k + 1, M[k], scope, 'expr'); key = '[computed]'; k = M[k] + 1; }
      else if (toks[k].t === 'name' || toks[k].t === 'str' || toks[k].t === 'num') { key = toks[k].t === 'str' ? toks[k].v.slice(1, -1) : toks[k].v; k++; }
      else { warn(a, 'object entry not understood'); walk(a, b, scope, 'expr'); return; }
      if (isP(k, '(')) {
        const body = M[k] + 1;
        if (!isP(body, '{')) { warn(a, 'method without a body'); walk(a, b, scope, 'expr'); return; }
        const fs = scopeAt(body, 'function', scope);
        bindList(k + 1, M[k], fs, fs, 'param');
        walk(body + 1, M[body], fs, 'stmt');
        if (pass === 2) fns.push({ kind: 'method', at: keyAt, line: toks[keyAt].line, name: key });
        keys.push({ key, kind: mod === 'get' || mod === 'set' ? mod : 'method', at: keyAt });
        if (M[body] + 1 < b) { warn(a, 'residue after a method'); walk(M[body] + 1, b, scope, 'expr'); }
        return;
      }
      if (isP(k, ':')) { keys.push({ key, kind: 'value', at: keyAt }); walk(k + 1, b, scope, 'expr'); return; }
      if (isN(keyAt) && !mod && k === b) { keys.push({ key, kind: 'shorthand', at: keyAt }); noteRef(keyAt, scope); return; }
      if (isN(keyAt) && !mod && isP(k, '=')) { keys.push({ key, kind: 'shorthand', at: keyAt }); noteRef(keyAt, scope); walk(k + 1, b, scope, 'expr'); return; }
      warn(a, 'object entry not understood'); walk(a, b, scope, 'expr');
    });
    if (pass === 1) objKeys.set(open, keys);
  };

  const parseImport = (i, hi) => {
    let j = i + 1;
    const names = [];
    if (toks[j].t === 'str') { j++; if (isP(j, ';')) j++; return j; }
    if (isN(j) && (isN(j + 1, 'from') || isP(j + 1, ','))) { names.push({ local: toks[j].v, imported: 'default', at: j }); j++; if (isP(j, ',')) j++; }
    if (isP(j, '*') && isN(j + 1, 'as') && isN(j + 2)) { names.push({ local: toks[j + 2].v, imported: '*', at: j + 2 }); j += 3; }
    if (isP(j, '{')) {
      const c = M[j];
      let k = j + 1;
      while (k < c) {
        if (isP(k, ',')) { k++; continue; }
        const imported = toks[k].t === 'str' ? toks[k].v.slice(1, -1) : toks[k].v;
        let local = toks[k].v, at = k;
        k++;
        if (isN(k, 'as')) { local = toks[k + 1].v; at = k + 1; k += 2; }
        names.push({ local, imported, at });
      }
      j = c + 1;
    }
    if (isN(j, 'from')) j++;
    const from = toks[j] && toks[j].t === 'str' ? toks[j].v.slice(1, -1) : '?';
    j++;
    if (isP(j, ';')) j++;
    for (const nm of names) {
      declare(module, nm.local, nm.at, 'import');
      if (pass === 1) imports.push({ local: nm.local, imported: nm.imported, from, line: toks[nm.at].line });
    }
    return j;
  };

  /* ── THE WALK.  mode 'stmt' is a statement list (a `{` at a statement's start is a block); mode 'expr' an expression
     (a `{` is an object literal).  `stmt` says whether the walk stands at a statement's start. ── */
  function walk(lo, hi, scope, mode) {
    let i = lo, stmt = true, caseOpen = false;
    while (i < hi) {
      const t = toks[i];
      if (mode === 'stmt' && !stmt && i > lo && asiBreak(i)) stmt = true;
      if (t.t === 'name') {
        const v = t.v;
        if (isP(i - 1, '.') || isP(i - 1, '?.')) { i++; stmt = false; continue; }                       // a property
        if (v === 'import' && scope === module && mode === 'stmt' && !isP(i + 1, '(') && !isP(i + 1, '.')) { i = parseImport(i, hi); stmt = true; continue; }
        if (v === 'export') { i++; if (isN(i, 'default')) i++; continue; }
        if ((v === 'const' || v === 'let' || v === 'var') && (isN(i + 1) || isP(i + 1, '{') || isP(i + 1, '['))) { i = declList(i, hi, scope, v); stmt = false; continue; }
        if (v === 'async' && isN(i + 1, 'function') && toks[i + 1].line === t.line) { i++; continue; }
        if (v === 'function') { const decl = mode === 'stmt' && stmt; i = funcAt(i, scope, decl); stmt = decl; continue; }
        if (v === 'class') { warn(i, 'a class body is not modelled'); i++; stmt = false; continue; }
        if (isP(i + 1, '=>') && !RESERVED.has(v)) { i = arrowAt(i, i + 1, i + 1, hi, scope, true); stmt = false; continue; }
        if (v === 'async' && ((isN(i + 1) && isP(i + 2, '=>')) || (isP(i + 1, '(') && isP(M[i + 1] + 1, '=>')))) { i++; continue; }
        if (v === 'for' && (isP(i + 1, '(') || (isN(i + 1, 'await') && isP(i + 2, '(')))) {
          const open = isP(i + 1, '(') ? i + 1 : i + 2, close = M[open];
          const fs = scopeAt(i, 'block', scope);                       // the head's bindings scope over the head and the body
          walk(open + 1, close, fs, 'stmt');
          const end = stmtEnd(close + 1, hi);
          walk(close + 1, end, fs, 'stmt');
          i = end; stmt = true; continue;
        }
        if (v === 'catch' && isP(i + 1, '(')) {
          const close = M[i + 1], body = close + 1;
          if (!isP(body, '{')) { warn(i, 'catch without a block'); i = body; continue; }
          const cs = scopeAt(body, 'block', scope);
          bindList(i + 2, close, cs, cs, 'catch');
          walk(body + 1, M[body], cs, 'stmt');
          i = M[body] + 1; stmt = true; continue;
        }
        if ((v === 'if' || v === 'while' || v === 'with' || v === 'switch') && isP(i + 1, '(')) { walk(i + 2, M[i + 1], scope, 'expr'); i = M[i + 1] + 1; stmt = true; continue; }
        if (v === 'else' || v === 'do' || v === 'try' || v === 'finally') { i++; stmt = true; continue; }
        if (v === 'break' || v === 'continue') { i++; if (isN(i) && toks[i].line === t.line && !RESERVED.has(toks[i].v)) i++; stmt = false; continue; }
        if (mode === 'stmt' && stmt && isP(i + 1, ':') && !RESERVED.has(v)) { i += 2; stmt = true; continue; }   // a label
        if (v === 'case' || (v === 'default' && isP(i + 1, ':'))) { caseOpen = true; i++; stmt = false; continue; }   // its `:` starts a statement
        if (RESERVED.has(v)) { i++; stmt = false; continue; }
        noteRef(i, scope);
        i++; stmt = false; continue;
      }
      if (t.t === 'punct') {
        const v = t.v;
        if (v === '{') {
          if (mode === 'stmt' && stmt) { walk(i + 1, M[i], scopeAt(i, 'block', scope), 'stmt'); i = M[i] + 1; stmt = true; continue; }
          if (isP(M[i] + 1, '=')) { assignTargets(i + 1, M[i], scope, true); i = M[i] + 1; stmt = false; continue; }
          objectAt(i, scope); i = M[i] + 1; stmt = false; continue;
        }
        if (v === '(') {
          if (isP(M[i] + 1, '=>')) { i = arrowAt(i + 1, M[i], M[i] + 1, hi, scope, false); stmt = false; continue; }
          walk(i + 1, M[i], scope, 'expr'); i = M[i] + 1; stmt = false; continue;
        }
        if (v === '[') {
          if (isP(M[i] + 1, '=') && (stmt || isP(i - 1, '('))) { assignTargets(i + 1, M[i], scope, false); i = M[i] + 1; stmt = false; continue; }
          walk(i + 1, M[i], scope, 'expr'); i = M[i] + 1; stmt = false; continue;
        }
        if (v === ';') { i++; stmt = true; continue; }
        if (v === ':' && caseOpen) { caseOpen = false; i++; stmt = true; continue; }
        if (v === ')' || v === ']' || v === '}') { warn(i, `stray ${v}`); i++; continue; }
        if (v === '=>') { warn(i, 'an arrow the walk did not see coming'); i++; continue; }
        i++; stmt = false; continue;
      }
      if (t.t === 'tplStart') {
        const p = t.parts;
        for (let k = 0; k + 1 < p.length; k++) walk(p[k] + 1, p[k + 1], scope, 'expr');
        i = p[p.length - 1] + 1; stmt = false; continue;
      }
      i++; stmt = false;                                               // str · num · regex
    }
  }

  for (pass = 1; pass <= 2; pass++) walk(0, N, module, 'stmt');
  return { module, scopes, refs, shadows, fns, imports, bootHits, objKeys, declInit, warnings };
}

/* ══ 4.  SECTIONS ════════════════════════════════════════════════════════════════════════════════════════════════
 * A header is a block comment at two-space indent at boot's own brace depth.  `/* ── NAME ──` opens a SECTION (the
 * integrator's boundary); a smaller header — `/* ══ …`, `/* WAVE …`, `/** THE …`, `/* 0.5.0 C2 · THE …`: any whose first
 * word of three or more letters is ALL CAPS — is a sub-note of the section it sits in.  The lines before the first
 * section header are §0, the boot head. */
const headerTitle = (text) => text.split('\n')[0].replace(/^\/\*+\s*/, '').replace(/\*\/\s*$/, '').replace(/^[─═]+\s*/, '')
  .replace(/\s*[─═]+\s*$/, '').replace(/\s+/g, ' ').trim();
const clip = (s, k) => { const a = Array.from(s); return a.length > k ? a.slice(0, k).join('') : s; };
const isMajor = (text) => /^\/\*\*?\s*──/.test(text);
const isNote = (text) => {
  for (const w of headerTitle(text).match(/[A-Za-z\u00c0-\u024f]+/g) || []) { if (w.length >= 3) return w === w.toUpperCase(); }
  return false;
};

/* ══ 5.  THE MEASURE ═════════════════════════════════════════════════════════════════════════════════════════════ */
const BAGS = ['ui', '__LW_hooks', 'LW'];   // boot-level objects whose MEMBERS are the shared state (dom, the parameter, likewise)
const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const uniq = (xs) => [...new Set(xs)].sort(byName);

export function analyze(src, opts = {}) {
  const file = opts.file || 'lab/rack.js';
  const L = lex(src);
  const { toks } = L;
  const M = pairBrackets(toks);
  const W = scopeWalk(toks, M);
  if (!W.bootHits.length) throw new Error(`${file}: no top-level \`function boot\``);
  const B = W.bootHits[0];
  const bootSig = [toks[B.fnAt - 2], toks[B.fnAt - 1]].map((t) => (t ? t.v : '')).join(' ') + ' function boot(' + toks.slice(B.params[0] + 1, B.params[1]).map((t) => t.v).join('') + ')';
  const openLine = toks[B.open].line, closeLine = toks[B.close].line;
  const bodyLines = closeLine - openLine - 1;

  /* ── the sections ── */
  const headers = L.comments.filter((c) => c.block && c.line > openLine && c.line < closeLine && c.col === 2
    && src.slice(c.at - 2, c.at) === '  ' && c.brace === 1 && c.paren === 0 && c.brack === 0 && c.tpl === 0);
  const majors = headers.filter((c) => isMajor(c.text));
  const starts = [];
  if (!majors.length || majors[0].line > openLine + 1) starts.push({ from: openLine + 1, title: '(boot head, before the first ── header)', header: '' });
  for (const c of majors) starts.push({ from: c.line, title: clip(headerTitle(c.text), 70), header: headerTitle(c.text) });
  const sections = starts.map((s, k) => {
    const to = k + 1 < starts.length ? starts[k + 1].from - 1 : closeLine - 1;
    return { n: k, from: s.from, to, lines: to - s.from + 1, title: s.title, header: s.header,
      notes: headers.filter((c) => !isMajor(c.text) && isNote(c.text) && c.line >= s.from && c.line <= to).map((c) => ({ line: c.line, title: clip(headerTitle(c.text), 90) })) };
  });
  const secOf = (line) => {
    if (line <= openLine || line >= closeLine) return -1;
    let lo = 0, hi = sections.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (sections[mid].from <= line) lo = mid; else hi = mid - 1; }
    return lo;
  };

  /* ── the boot-level names ── */
  const bootNames = new Map();
  for (const [name, d] of B.scope.names) {
    if (d.kind === 'param') continue;
    const line = toks[d.at].line;
    bootNames.set(name, { name, line, at: d.at, kind: d.kind, fn: d.kind === 'function' || !!(W.declInit.get(d.at) || {}).fn,
      section: secOf(line), refs: 0, users: new Set([secOf(line)]), readers: new Set(), writers: new Set(), mutators: new Set(), perSection: new Map() });
  }
  const params = [...B.scope.names].filter(([, d]) => d.kind === 'param').map(([n]) => n);
  const bootRefs = W.refs.filter((r) => r.where === 'boot' && secOf(r.line) >= 0);
  const modRefs = W.refs.filter((r) => r.where === 'module' && secOf(r.line) >= 0);

  const S = sections.map((s) => ({ ...s, declared: [], foreign: new Map(), own: new Set(),
    bags: Object.fromEntries([...BAGS, 'dom'].map((b) => [b, { defines: new Set(), uses: new Set(), dynamic: [], whole: [] }])),
    imports: new Set(), module: new Set(), functions: 0, closures: 0 }));
  for (const d of bootNames.values()) if (d.section >= 0) S[d.section].declared.push(d.name);
  for (const r of bootRefs) {
    const sec = S[secOf(r.line)];
    if (BAGS.includes(r.name) || params.includes(r.name)) {
      const bag = sec.bags[params.includes(r.name) ? 'dom' : r.name];
      if (r.member) (r.memberDef ? bag.defines : bag.uses).add(r.member);
      else if (r.dynamic) bag.dynamic.push(r.line);
      else if (!r.assignObj) bag.whole.push(r.line);
      if (r.assignObj) for (const k of W.objKeys.get(r.assignObj) || []) if (k.kind !== 'spread') bag.defines.add(k.key);
    }
    const d = bootNames.get(r.name);
    if (!d) continue;                                                // the parameter
    d.refs++; d.users.add(sec.n);
    d.perSection.set(sec.n, (d.perSection.get(sec.n) || 0) + 1);
    if (r.kind === 'write' || r.kind === 'rw') d.writers.add(sec.n);
    if (r.kind !== 'write') d.readers.add(sec.n);
    if (r.kind === 'mutate') d.mutators.add(sec.n);
    if (d.section === sec.n) { sec.own.add(r.name); continue; }
    let f = sec.foreign.get(r.name);
    if (!f) { f = { name: r.name, from: d.section, kinds: new Set(), eager: false, deferred: false, refs: 0 }; sec.foreign.set(r.name, f); }
    f.kinds.add(r.kind); f.refs++;
    if (r.deferred) f.deferred = true; else f.eager = true;
  }
  /* the bags' literals: `const LW = { … }` (and `const ui = {}`) define members in the section that holds them */
  const literalOf = (name) => {
    const d = B.scope.names.get(name);
    const init = d && W.declInit.get(d.at);
    return init && init.obj !== undefined ? { section: secOf(toks[d.at].line), keys: (W.objKeys.get(init.obj) || []).filter((k) => k.kind !== 'spread') } : null;
  };
  const literals = {};
  for (const b of BAGS) {
    const lit = literalOf(b);
    literals[b] = lit;
    if (lit && lit.section >= 0) for (const k of lit.keys) S[lit.section].bags[b].defines.add(k.key);
  }
  for (const r of modRefs) {
    const sec = S[secOf(r.line)];
    if (W.imports.some((m) => m.local === r.name)) sec.imports.add(r.name); else sec.module.add(r.name);
  }
  for (let k = B.open + 1; k < B.close; k++) { const q = secOf(toks[k].line); if (q >= 0) S[q].tokens = (S[q].tokens || 0) + 1; }
  for (const f of W.fns) {
    const k = secOf(f.line);
    if (k < 0) continue;
    S[k].closures++;
  }
  for (const d of bootNames.values()) if (d.fn && d.section >= 0) S[d.section].functions++;

  /* ── per-name classes, hubs ── */
  const names = [...bootNames.values()].sort((a, b) => a.at - b.at);
  const hubSet = new Set(names.filter((d) => d.users.size >= 4).map((d) => d.name));
  const n = S.length;

  /* ── the bags across sections ── */
  const bagTable = (b) => {
    const members = new Map();
    const get = (m) => { if (!members.has(m)) members.set(m, { member: m, definedIn: new Set(), users: new Set() }); return members.get(m); };
    for (const s of S) { for (const m of s.bags[b].defines) get(m).definedIn.add(s.n); for (const m of s.bags[b].uses) get(m).users.add(s.n); }
    return [...members.values()].sort((x, y) => byName(x.member, y.member))
      .map((x) => ({ member: x.member, definedIn: [...x.definedIn].sort((p, q) => p - q), users: [...x.users].sort((p, q) => p - q) }));
  };
  const uiBag = bagTable('ui'), hooksBag = bagTable('__LW_hooks'), lwBag = bagTable('LW'), domBag = bagTable('dom');
  const uiDefinedIn = new Map(uiBag.map((x) => [x.member, x.definedIn]));

  /* ── the per-section record ── */
  const sec = S.map((s) => {
    const foreign = [...s.foreign.values()].sort((a, b) => byName(a.name, b.name));
    const reads = foreign.filter((f) => f.kinds.has('read') || f.kinds.has('rw') || f.kinds.has('mutate'));
    const writes = foreign.filter((f) => f.kinds.has('write') || f.kinds.has('rw'));
    const mutates = foreign.filter((f) => f.kinds.has('mutate'));
    const bag = (b) => ({ defines: uniq(s.bags[b].defines), uses: uniq([...s.bags[b].uses].filter((m) => !s.bags[b].defines.has(m))),
      dynamic: s.bags[b].dynamic.slice().sort((p, q) => p - q), whole: s.bags[b].whole.slice().sort((p, q) => p - q) });
    const ui = bag('ui');
    ui.foreign = ui.uses.filter((m) => !(uiDefinedIn.get(m) || []).includes(s.n));
    const declared = s.declared.slice().sort((a, b) => bootNames.get(a).at - bootNames.get(b).at);
    const counted = (xs) => xs.filter((f) => f.name !== 'ui');      // the ui bag is counted by its members, never as one name
    const hubsUsed = foreign.filter((f) => hubSet.has(f.name) && f.name !== 'ui').map((f) => f.name);
    const cost = { reads: counted(reads).length, writes: counted(writes).length, ui: ui.foreign.length, hubs: hubsUsed.length };
    cost.total = cost.reads + 3 * cost.writes + cost.ui + cost.hubs;
    const fwd = foreign.filter((f) => f.from > s.n);
    return {
      n: s.n, from: s.from, to: s.to, lines: s.lines, title: s.title, header: s.header, notes: s.notes,
      tokens: s.tokens || 0, commentOnly: !s.tokens,
      declared, functions: s.functions, closures: s.closures,
      private: declared.filter((x) => bootNames.get(x).users.size === 1),
      api: declared.filter((x) => bootNames.get(x).users.size > 1),
      reads: reads.map((f) => ({ name: f.name, from: f.from, eager: f.eager })),
      writes: writes.map((f) => ({ name: f.name, from: f.from })),
      mutates: mutates.map((f) => ({ name: f.name, from: f.from })),
      ui, hooks: bag('__LW_hooks'), lw: bag('LW'), dom: bag('dom'),
      imports: uniq(s.imports), module: uniq(s.module),
      hubsUsed: uniq(hubsUsed), cost,
      forward: {
        names: fwd.map((f) => f.name),
        deferred: fwd.filter((f) => !f.eager).map((f) => f.name),
        hoisted: fwd.filter((f) => f.eager && bootNames.get(f.name).kind === 'function').map((f) => f.name),
        eagerTdz: fwd.filter((f) => f.eager && bootNames.get(f.name).kind !== 'function').map((f) => f.name),
      },
      deps: {
        reads: counted(reads).filter((f) => !f.kinds.has('write') && !f.kinds.has('rw')).map((f) => f.name),
        writes: counted(writes).map((f) => f.name),
        ui: ui.foreign, hooks: uniq([...s.bags.__LW_hooks.uses, ...s.bags.__LW_hooks.defines]),
        lw: uniq([...s.bags.LW.uses].filter((m) => !s.bags.LW.defines.has(m))), dom: uniq([...s.bags.dom.uses]),
      },
    };
  });

  /* ── the matrix: rows DECLARE, columns USE ── */
  const reads = Array.from({ length: n }, () => new Array(n).fill(0));
  const writes = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const s of S) for (const f of s.foreign.values()) {
    if (f.kinds.has('read') || f.kinds.has('rw') || f.kinds.has('mutate')) reads[f.from][s.n]++;
    if (f.kinds.has('write') || f.kinds.has('rw')) writes[f.from][s.n]++;
  }
  const edge = (a, b) => reads[a][b] + writes[a][b] > 0;   // b uses a's names

  /* ── cycles: Tarjan over "b depends on a" ── */
  const sccs = [];
  {
    let index = 0;
    const idx = new Array(n).fill(-1), low = new Array(n).fill(0), on = new Array(n).fill(false), st = [];
    const strong = (v) => {
      idx[v] = low[v] = index++; st.push(v); on[v] = true;
      for (let a = 0; a < n; a++) {
        if (a === v || !edge(a, v)) continue;
        if (idx[a] < 0) { strong(a); low[v] = Math.min(low[v], low[a]); } else if (on[a]) low[v] = Math.min(low[v], idx[a]);
      }
      if (low[v] === idx[v]) { const c = []; let w; do { w = st.pop(); on[w] = false; c.push(w); } while (w !== v); if (c.length > 1) sccs.push(c.sort((p, q) => p - q)); }
    };
    for (let v = 0; v < n; v++) if (idx[v] < 0) strong(v);
    sccs.sort((p, q) => q.length - p.length || p[0] - q[0]);
  }
  const mutual = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (edge(a, b) && edge(b, a)) mutual.push({ a, b, aUsesB: reads[b][a] + writes[b][a], bUsesA: reads[a][b] + writes[a][b] });

  /* ── the ranking, and its inverse ── */
  const ranking = sec.map((s) => ({ n: s.n, title: s.title, lines: s.lines, commentOnly: s.commentOnly, cost: s.cost, deps: s.deps }))
    .sort((a, b) => a.cost.total - b.cost.total || a.n - b.n);
  const coupling = sec.map((s) => {
    let inbound = 0;
    for (let b = 0; b < n; b++) if (b !== s.n) for (const nm of s.declared) if (S[b].foreign.has(nm)) inbound++;
    const outbound = s.reads.length + s.writes.filter((w) => !s.reads.some((r) => r.name === w.name)).length;
    return { n: s.n, title: s.title, inbound, outbound, total: inbound + outbound, api: s.api.length, private: s.private.length, declared: s.declared.length };
  }).sort((a, b) => b.total - a.total || a.n - b.n);

  /* ── totals ── */
  const users = names.map((d) => d.users.size);
  const crossEdges = S.reduce((k, s) => k + s.foreign.size, 0);
  const fwdAll = sec.reduce((acc, s) => { acc.names += s.forward.names.length; acc.deferred += s.forward.deferred.length; acc.hoisted += s.forward.hoisted.length; acc.eagerTdz += s.forward.eagerTdz.length; return acc; }, { names: 0, deferred: 0, hoisted: 0, eagerTdz: 0 });
  const pct = (k) => (names.length ? Math.round((1000 * k) / names.length) / 10 : 0);
  const lwBySection = sec.map((s) => ({ n: s.n, count: s.lw.defines.length })).filter((x) => x.count);
  const totals = {
    bodyLines, sections: n, names: names.length,
    unused: names.filter((d) => d.refs === 0).length,
    private: users.filter((u) => u === 1).length, shared: users.filter((u) => u >= 2 && u <= 3).length, hubs: users.filter((u) => u >= 4).length,
    crossEdges, forward: fwdAll,
    uiBag: uiBag.length, hooksBag: hooksBag.length, lwFacade: lwBag.filter((x) => x.definedIn.length).length, lwBySection,
    functions: names.filter((d) => d.fn).length, closures: W.fns.filter((f) => secOf(f.line) >= 0).length,
    shadows: W.shadows.length, warnings: W.warnings.length,
  };
  totals.blind = { this: 0, arguments: 0, eval: 0, with: 0 };
  for (let k = B.open + 1; k < B.close; k++) {
    const t = toks[k];
    if (t.t !== 'name' || (k > 0 && toks[k - 1].t === 'punct' && (toks[k - 1].v === '.' || toks[k - 1].v === '?.'))) continue;
    if (Object.hasOwn(totals.blind, t.v) && (t.v !== 'eval' || (toks[k + 1] && toks[k + 1].v === '(')) && (t.v !== 'with' || (toks[k + 1] && toks[k + 1].v === '('))) totals.blind[t.v]++;
  }
  totals.share = { private: pct(totals.private), shared: pct(totals.shared), hubs: pct(totals.hubs), unused: pct(totals.unused) };

  const importUsers = new Map();
  for (const r of modRefs) { const k = secOf(r.line); if (!importUsers.has(r.name)) importUsers.set(r.name, new Set()); importUsers.get(r.name).add(k); }
  const allModRefs = W.refs.filter((r) => r.where === 'module');
  return {
    file, sha256: createHash('sha256').update(src).digest('hex'), lines: L.lines,
    lexer: L.stats,
    boot: { signature: bootSig, count: W.bootHits.length, openLine, closeLine, bodyLines, params },
    totals,
    sections: sec,
    names: names.map((d) => ({ name: d.name, line: d.line, kind: d.kind, fn: d.fn, section: d.section, refs: d.refs,
      users: [...d.users].sort((p, q) => p - q), readers: [...d.readers].sort((p, q) => p - q), writers: [...d.writers].sort((p, q) => p - q),
      mutators: [...d.mutators].sort((p, q) => p - q), perSection: Object.fromEntries([...d.perSection].sort((p, q) => p[0] - q[0])) })),
    hubs: names.filter((d) => hubSet.has(d.name)).sort((a, b) => b.users.size - a.users.size || byName(a.name, b.name))
      .map((d) => ({ name: d.name, section: d.section, kind: d.kind, fn: d.fn, users: [...d.users].sort((p, q) => p - q), writers: [...d.writers].filter((w) => w !== d.section).sort((p, q) => p - q) })),
    matrix: { rowsDeclare: true, reads, writes },
    bags: { ui: uiBag, __LW_hooks: hooksBag, LW: lwBag, dom: domBag },
    lw: { literalSection: literals.LW ? literals.LW.section : -1, literalKeys: literals.LW ? literals.LW.keys.length : 0, bySection: lwBySection,
      /* a key the literal names twice: the LATER definition wins, silently (a getter after a value replaces the value) */
      duplicateKeys: literals.LW ? uniq(literals.LW.keys.map((k) => k.key)).map((key) => ({ key, defs: literals.LW.keys.filter((k) => k.key === key).map((k) => ({ line: toks[k.at].line, kind: k.kind })) })).filter((x) => x.defs.length > 1) : [] },
    sccs, mutual, ranking, coupling,
    imports: W.imports.map((m) => ({ ...m, users: [...(importUsers.get(m.local) || [])].sort((p, q) => p - q),
      refs: allModRefs.filter((r) => r.name === m.local).length, shadowedByBoot: B.scope.names.has(m.local) })),
    topLevel: [...W.module.names].filter(([, d]) => d.kind !== 'import').map(([name, d]) => ({ name, kind: d.kind, line: toks[d.at].line,
      users: [...(importUsers.get(name) || [])].sort((p, q) => p - q) })).sort((a, b) => a.line - b.line),
    shadows: { count: W.shadows.length, byName: Object.fromEntries(uniq(W.shadows.map((x) => x.name)).map((nm) => [nm, W.shadows.filter((x) => x.name === nm).map((x) => x.line)])) },
    warnings: W.warnings,
  };
}

/* ══ 6.  THE REPORTS ═════════════════════════════════════════════════════════════════════════════════════════════ */
const sid = (k) => '§' + k;
const list = (xs, empty = '—') => (xs && xs.length ? xs.join(', ') : empty);
const code = (xs, empty = '—') => (xs && xs.length ? xs.map((x) => '`' + x + '`').join(', ') : empty);
const mdCell = (s) => String(s).replace(/\|/g, '\\|');

function foundOnTheWay(R) {
  const dead = R.imports.filter((m) => m.refs === 0 && !m.shadowedByBoot).map((m) => m.local);
  const shadowed = R.imports.filter((m) => m.shadowedByBoot).map((m) => m.local);
  const dup = R.lw.duplicateKeys.map((d) => d.key);
  return [`imports never referenced ${dead.length ? '(' + dead.join(', ') + ')' : 'none'}`,
    `imports boot re-declares ${shadowed.length ? '(' + shadowed.join(', ') + ')' : 'none'}`,
    `LW literal keys named twice ${dup.length ? '(' + dup.join(', ') + ')' : 'none'}`].join(' · ');
}

function costLine(s) { return `${s.cost.total} = ${s.cost.reads} + 3×${s.cost.writes} + ${s.cost.ui} + ${s.cost.hubs}`; }

export function summary(R) {
  const T = R.totals, out = [];
  out.push(`rack-deps · ${R.file} · ${R.lines} lines · sha-256 ${R.sha256.slice(0, 12)}`);
  out.push(`${R.boot.signature}: body lines ${R.boot.openLine + 1}–${R.boot.closeLine - 1} = ${T.bodyLines} lines in ${T.sections} sections (§0 the head, §1… the ── headers)`);
  out.push(`boot-level names ${T.names}: private (one section) ${T.private} = ${T.share.private}% · two–three sections ${T.shared} = ${T.share.shared}% · hubs (≥ 4) ${T.hubs} = ${T.share.hubs}% · never referenced ${T.unused}`);
  out.push(`ui bag ${T.uiBag} members · LW facade ${T.lwFacade} members (${T.lwBySection.map((x) => sid(x.n) + ' ' + x.count).join(', ')}) · __LW_hooks ${T.hooksBag} members`);
  out.push(`cross-section uses ${T.crossEdges} (section × name) · forward ${T.forward.names} (deferred ${T.forward.deferred}, hoisted functions ${T.forward.hoisted}, eager let/const ${T.forward.eagerTdz})`);
  out.push(`shadowing: ${T.shadows} references resolved to an inner binding that shares a boot-level name · walker warnings ${T.warnings}`);
  out.push(`found on the way: ${foundOnTheWay(R)}`);
  out.push('');
  out.push('THE RANKING — cheapest to move first.  cost = foreign names read + 3 × foreign names written + foreign ui members + foreign hubs');
  for (const [k, r] of R.ranking.entries()) out.push(`  ${String(k + 1).padStart(2)}. ${sid(r.n).padEnd(4)} ${String(r.lines).padStart(4)} lines  cost ${costLine({ cost: r.cost }).padEnd(22)} ${r.commentOnly ? '(comment only) ' : ''}${r.title}`);
  out.push('');
  out.push('THE HUBS — boot-level names used by ≥ 4 sections (users include the declaring section)');
  for (const h of R.hubs.slice(0, 25)) out.push(`  ${h.name.padEnd(22)} ${sid(h.section).padEnd(4)} ${String(h.users.length).padStart(2)} sections${h.writers.length ? ' · written by ' + h.writers.map(sid).join(' ') : ''}`);
  if (R.hubs.length > 25) out.push(`  … ${R.hubs.length - 25} more in RACK-DEPS.md`);
  if (R.sccs.length) { out.push(''); out.push(`CYCLES: ${R.sccs.map((c) => c.length + ' sections {' + c.map(sid).join(' ') + '}').join(' · ')}`); }
  return out.join('\n');
}

export function sectionDetail(R, k) {
  const s = R.sections[k], out = [];
  const from = (xs) => xs.map((x) => `${x.name} ${sid(x.from)}${x.eager === false ? ' (deferred)' : ''}`);
  out.push(`${sid(s.n)} · lines ${s.from}–${s.to} (${s.lines}) · ${s.header || s.title}`);
  for (const nt of s.notes) out.push(`    note ${nt.line}: ${nt.title}`);
  out.push(`  cost ${costLine(s)}   (boot-level functions ${s.functions}, closures ${s.closures})`);
  out.push(`  declares ${s.declared.length}: ${list(s.declared.map((d) => { const x = R.names.find((y) => y.name === d); return x.users.length > 1 ? `${d}→${x.users.filter((u) => u !== s.n).map(sid).join('')}` : d; }))}`);
  out.push(`  private ${s.private.length} · API ${s.api.length}`);
  out.push(`  reads ${s.reads.length}: ${list(from(s.reads))}`);
  out.push(`  writes ${s.writes.length}: ${list(from(s.writes))}`);
  out.push(`  mutates ${s.mutates.length}: ${list(from(s.mutates))}`);
  out.push(`  ui defines ${s.ui.defines.length}: ${list(s.ui.defines)}`);
  out.push(`  ui uses ${s.ui.uses.length} (foreign ${s.ui.foreign.length}): ${list(s.ui.uses)}`);
  if (s.ui.whole.length) out.push(`  ui passed whole at lines ${s.ui.whole.join(', ')}`);
  out.push(`  __LW_hooks defines ${list(s.hooks.defines)} · uses ${list(s.hooks.uses)}`);
  out.push(`  LW defines ${s.lw.defines.length}: ${list(s.lw.defines)}`);
  out.push(`  LW reads ${list(s.lw.uses)}`);
  out.push(`  dom ${list(s.dom.uses)}${s.dom.whole.length ? ' · passed whole at lines ' + s.dom.whole.join(', ') : ''}`);
  out.push(`  imports ${s.imports.length}: ${list(s.imports)}`);
  out.push(`  module-level ${list(s.module)}`);
  out.push(`  forward refs ${s.forward.names.length}: deferred ${list(s.forward.deferred)} · hoisted ${list(s.forward.hoisted)} · eager let/const ${list(s.forward.eagerTdz)}`);
  return out.join('\n');
}

export function markdown(R) {
  const T = R.totals, out = [];
  const p = (s) => out.push(s);
  p('# RACK-DEPS — the measured dependency graph of `lab/rack.js`');
  p('');
  p(`Generated by \`node tools/rack-deps.mjs\` from \`${R.file}\` (${R.lines} lines, sha-256 \`${R.sha256}\`).  Deterministic: no clock, every list sorted; re-run after any edit to rack.js and diff.  The machine-readable twin is \`rack-deps.json\`; \`node tools/rack-deps.mjs --section <n>\` prints one section.`);
  p('');
  p('Words.  A **boot-level name** is one declared directly in `boot(dom)`\'s own scope (const / let / function, destructuring included; `dom` is the parameter and is tracked by member).  A section **uses** a name when a reference in it resolves — through every nested block and function, shadowing respected — to that boot-level binding.  **reads** = any non-assigning reference (a call, a pass, a property read, a mutation); **writes** = a direct assignment `name =` / `name +=` / `name++` (the binding itself changes, so a module needs a setter); **mutates** = a property write `name.x =` / `name[k] =` / `name.push(` / `Object.assign(name, …)` (the object changes, the binding does not).  **Users** of a name are the sections that reference it plus its declaring section.  A reference is **deferred** when it sits inside a nested function (it runs after boot has declared everything) and **eager** when it runs while boot runs.');
  p('');
  p('## 1. Totals');
  p('');
  p('| measure | value |');
  p('|---|---|');
  p(`| boot body | lines ${R.boot.openLine + 1}–${R.boot.closeLine - 1} = **${T.bodyLines}** lines (\`${R.boot.signature}\` at line ${R.boot.openLine}; ${R.boot.count} such function) |`);
  p(`| sections | **${T.sections}** (§0 the head before the first \`/* ──\` header; §1… one per \`/* ── NAME ──\` header) |`);
  p(`| boot-level names | **${T.names}** (${T.functions} of them functions; ${T.closures} function bodies of any depth inside boot) |`);
  p(`| used by exactly one section (private) | ${T.private} (${T.share.private}%) — of which never referenced at all: ${T.unused} (${T.share.unused}%) |`);
  p(`| used by two to three sections | ${T.shared} (${T.share.shared}%) |`);
  p(`| used by four or more sections (hubs) | ${T.hubs} (${T.share.hubs}%) |`);
  p(`| cross-section uses (section × foreign name) | ${T.crossEdges} |`);
  p(`| forward uses (a name declared in a LATER section) | ${T.forward.names}: deferred ${T.forward.deferred} · hoisted function declarations ${T.forward.hoisted} · eager let/const ${T.forward.eagerTdz} |`);
  p(`| the \`ui\` bag | **${T.uiBag}** members |`);
  p(`| the LW facade (\`__LW\`) | **${T.lwFacade}** members — ${T.lwBySection.map((x) => `${sid(x.n)} ${x.count}`).join(' · ')} |`);
  p(`| the \`__LW_hooks\` bag | ${T.hooksBag} members |`);
  p(`| references that resolved to an inner binding sharing a boot-level name (shadowing) | ${T.shadows} |`);
  p(`| lexer | ${R.lexer.tokens} tokens · ${R.lexer.comments} comments · ${R.lexer.strings} strings · ${R.lexer.templates} templates · ${R.lexer.regex} regex literals · brackets balanced |`);
  p(`| found on the way | ${foundOnTheWay(R)} |`);
  p(`| walker warnings | ${T.warnings}${R.warnings.length ? ' — ' + R.warnings.slice(0, 8).map((w) => `line ${w.line}: ${w.what}`).join('; ') : ''} |`);
  p('');
  p('## 2. The sections');
  p('');
  p('`decl` boot-level names it declares (`fn` of them functions; `api` used elsewhere) · `rd` / `wr` / `mut` foreign names read / written / mutated · `ui` members used that another section defines / members it defines · `LW` facade members it defines · `imp` imports used · `cost` = rd + 3·wr + ui + hubs (`ui` itself is counted by its members, never as a name).');
  p('');
  p('| § | lines | span | tokens | header | decl | fn | api | rd | wr | mut | ui use/def | LW | imp | cost |');
  p('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const s of R.sections) p(`| ${s.n} | ${s.lines} | ${s.from}–${s.to} | ${s.tokens || '0 (comment only)'} | ${mdCell(s.title)} | ${s.declared.length} | ${s.functions} | ${s.api.length} | ${s.reads.length} | ${s.writes.length} | ${s.mutates.length} | ${s.ui.foreign.length}/${s.ui.defines.length} | ${s.lw.defines.length} | ${s.imports.length} | ${s.cost.total} |`);
  p(`| | **${R.sections.reduce((k, s) => k + s.lines, 0)}** | | ${R.sections.reduce((k, s) => k + s.tokens, 0)} | the body, summed | **${R.sections.reduce((k, s) => k + s.declared.length, 0)}** | | | | | | | | | |`);
  p('');
  p('### The sub-notes (the smaller headers folded into each section)');
  p('');
  for (const s of R.sections) if (s.notes.length) p(`- **${sid(s.n)}** ${mdCell(s.title)}: ${s.notes.map((x) => `${x.line} ${x.title}`).join(' · ')}`);
  p('');
  p('## 3. The matrix');
  p('');
  p('Rows DECLARE, columns USE: a cell is how many of the row section\'s boot-level names the column section uses — `reads` alone, or `reads/writes` when the column also assigns some of them.  Blank = 0.  Row sums are a section\'s exports; column sums its imports from the rest of boot.');
  p('');
  const n = R.sections.length;
  p('| decl ↓ · use → | ' + R.sections.map((s) => s.n).join(' | ') + ' | Σ |');
  p('|---' + '|---'.repeat(n + 1) + '|');
  for (let a = 0; a < n; a++) {
    const cells = [];
    let sum = 0;
    for (let b = 0; b < n; b++) {
      if (a === b) { cells.push('·'); continue; }
      const r = R.matrix.reads[a][b], w = R.matrix.writes[a][b];
      sum += r;
      cells.push(r || w ? (w ? `${r}/${w}` : String(r)) : '');
    }
    p(`| **${a}** | ${cells.join(' | ')} | ${sum} |`);
  }
  const colSum = R.sections.map((s, b) => R.matrix.reads.reduce((k, row, a) => k + (a === b ? 0 : row[b]), 0));
  p(`| Σ | ${colSum.join(' | ')} | |`);
  p('');
  p('## 4. The hubs — boot-level names used by four or more sections');
  p('');
  p('| name | declared | kind | sections | users | written by (other than its own) |');
  p('|---|---|---|---|---|---|');
  for (const h of R.hubs) p(`| \`${h.name}\` | ${sid(h.section)} | ${h.fn ? 'function' : h.kind} | ${h.users.length} | ${h.users.map(sid).join(' ')} | ${h.writers.length ? h.writers.map(sid).join(' ') : ''} |`);
  p('');
  p('## 5. The `ui` bag');
  p('');
  p(`\`const ui = {}\` (${sid(R.names.find((x) => x.name === 'ui')?.section ?? -1)}) and its ${R.bags.ui.length} members: where each is assigned (\`ui.x = …\`) and which sections read it.  A member read but never assigned in boot is set from outside (a module handed \`ui\` whole) or is dead.`);
  p('');
  p('| member | defined in | users | user sections |');
  p('|---|---|---|---|');
  for (const m of R.bags.ui) p(`| \`${m.member}\` | ${m.definedIn.length ? m.definedIn.map(sid).join(' ') : '—'} | ${m.users.length} | ${m.users.map(sid).join(' ')} |`);
  const whole = R.sections.filter((s) => s.ui.whole.length).map((s) => `${sid(s.n)} (lines ${s.ui.whole.join(', ')})`);
  p('');
  p(`\`ui\` passed WHOLE (to a module whose reads this tool cannot see): ${whole.length ? whole.join(' · ') : 'nowhere'}.  Dynamic \`ui[…]\`: ${R.sections.filter((s) => s.ui.dynamic.length).map((s) => `${sid(s.n)} (lines ${s.ui.dynamic.join(', ')})`).join(' · ') || 'none'}.`);
  p('');
  p('## 6. The LW facade (`window.__LW`) by section, and `__LW_hooks`');
  p('');
  p(`The \`const LW = { … }\` literal sits in ${sid(R.lw.literalSection)} with ${R.lw.literalKeys} keys; later \`LW.x = …\` assignments add members where they stand.`);
  if (R.lw.duplicateKeys.length) {
    p('');
    p(`**The literal names ${R.lw.duplicateKeys.length} key${R.lw.duplicateKeys.length > 1 ? 's' : ''} twice** — the later definition wins, silently: ${R.lw.duplicateKeys.map((d) => `\`${d.key}\` (${d.defs.map((x) => `line ${x.line} ${x.kind}`).join(', then ')})`).join(' · ')}.`);
  }
  p('');
  p('| § | defines | members |');
  p('|---|---|---|');
  for (const s of R.sections) if (s.lw.defines.length) p(`| ${s.n} | ${s.lw.defines.length} | ${code(s.lw.defines)} |`);
  p('');
  const lwReaders = R.sections.filter((s) => s.lw.uses.length);
  p(`Sections that READ \`LW.<x>\`: ${lwReaders.length ? lwReaders.map((s) => `${sid(s.n)} (${code(s.lw.uses)})`).join(' · ') : 'none'}.`);
  p('');
  p('`__LW_hooks` (the hook bag the facade\'s getters read):');
  p('');
  p('| member | defined in | users |');
  p('|---|---|---|');
  for (const m of R.bags.__LW_hooks) p(`| \`${m.member}\` | ${m.definedIn.map(sid).join(' ') || '—'} | ${m.users.map(sid).join(' ') || '—'} |`);
  p('');
  p('`dom` (boot\'s parameter): ' + R.bags.dom.map((m) => `\`${m.member}\` ${m.users.map(sid).join(' ')}`).join(' · ') + '.  Passed whole: ' + (R.sections.filter((s) => s.dom.whole.length).map((s) => `${sid(s.n)} (lines ${s.dom.whole.join(', ')})`).join(' · ') || 'nowhere') + '.');
  p('');
  p('## 7. The moving-cost ranking — cheapest first, with what a `deps` object would carry');
  p('');
  p('cost = foreign names read + 3 × foreign names written + foreign `ui` members used + foreign hubs used.  `deps.reads` are values or getters; `deps.writes` need a setter (or the state moves with the section); `ui` the members it reads that another section assigns; `hooks` / `LW` / `dom` the members it touches.');
  p('');
  for (const [k, r] of R.ranking.entries()) {
    const s = R.sections[r.n];
    p(`**${k + 1}. ${sid(r.n)} ${mdCell(r.title)}** — ${r.lines} lines · cost ${costLine(r)}${r.commentOnly ? ' · a comment only, no code: it folds into the section after it' : ''}`);
    p('');
    if (r.commentOnly) continue;
    p(`- reads (${r.deps.reads.length}): ${code(r.deps.reads)}`);
    p(`- writes (${r.deps.writes.length}): ${code(r.deps.writes)}`);
    if (s.mutates.length) p(`- mutates (${s.mutates.length}): ${code(s.mutates.map((x) => x.name))}`);
    p(`- ui (${r.deps.ui.length}): ${code(r.deps.ui)}`);
    if (r.deps.hooks.length) p(`- __LW_hooks: ${code(r.deps.hooks)}`);
    if (r.deps.lw.length) p(`- LW: ${code(r.deps.lw)}`);
    if (r.deps.dom.length) p(`- dom: ${code(r.deps.dom)}`);
    p(`- its API (names others use, ${s.api.length}): ${code(s.api)}`);
    p('');
  }
  p('## 8. The inverse — the coupling a section takes out of boot if moved first');
  p('');
  p('`in` = (other section × name) uses of this section\'s names (its API becomes an export); `out` = foreign names it uses (become its `deps`).  Moving a section turns `in + out` shared-scope edges into an explicit interface; its `private` names leave boot\'s scope outright.  A section with `in` = 0 is a leaf: nothing waits on it.');
  p('');
  p('| rank | § | header | in | out | in+out | API names | private names | declared |');
  p('|---|---|---|---|---|---|---|---|---|');
  for (const [k, c] of R.coupling.entries()) p(`| ${k + 1} | ${c.n} | ${mdCell(c.title)} | ${c.inbound} | ${c.outbound} | ${c.total} | ${c.api} | ${c.private} | ${c.declared} |`);
  p('');
  p('## 9. Cycles');
  p('');
  if (R.sccs.length) for (const c of R.sccs) p(`- a strongly connected cluster of **${c.length}** sections: ${c.map(sid).join(' ')}`);
  else p('No strongly connected cluster.');
  p('');
  p(`Mutual pairs (each uses the other's names): ${R.mutual.length}.`);
  p('');
  p('| a | b | a uses b | b uses a |');
  p('|---|---|---|---|');
  for (const m of R.mutual) p(`| ${sid(m.a)} | ${sid(m.b)} | ${m.aUsesB} | ${m.bUsesA} |`);
  p('');
  p('## 10. Forward uses — names a section takes from a LATER section');
  p('');
  p('A module order follows the declaration order only where every use points backward.  A forward use is legal today because it is deferred (inside a callback), or a hoisted function declaration; an eager forward use of a let/const would throw (TDZ) if that line ran during boot, so a non-zero count there marks a path boot does not take or a misread.');
  p('');
  p('| § | forward | deferred | hoisted functions | eager let/const |');
  p('|---|---|---|---|---|');
  for (const s of R.sections) if (s.forward.names.length) p(`| ${s.n} | ${s.forward.names.length} | ${code(s.forward.deferred)} | ${code(s.forward.hoisted)} | ${code(s.forward.eagerTdz)} |`);
  p('');
  p('## 11. The file\'s top level: imports and declarations outside `boot`');
  p('');
  p('| local | imported | from | line | refs | sections |');
  p('|---|---|---|---|---|---|');
  for (const m of R.imports) p(`| \`${m.local}\` | ${m.imported === m.local ? '' : '`' + m.imported + '`'} | \`${m.from}\` | ${m.line} | ${m.refs}${m.shadowedByBoot ? ' (boot re-declares it)' : ''} | ${m.users.map(sid).join(' ')} |`);
  p('');
  p('| top-level declaration | kind | line | sections |');
  p('|---|---|---|---|');
  for (const d of R.topLevel) p(`| \`${d.name}\` | ${d.kind} | ${d.line} | ${d.users.map(sid).join(' ')} |`);
  p('');
  p('## 12. What the walker cannot see');
  p('');
  p('- **Dynamic property names** — `ui[k]`, `LW[x]`, `obj[name]`: counted per section as dynamic accesses, never attributed to a member.');
  p('- **Aliases** — `const u = ui; u.x = 1` writes `ui.x` invisibly; a bag destructured (`const { a } = ui`) reads `ui` whole.');
  p('- **Bags passed whole** — `reworkNative({ ui, … })`, `createX({ … })`: the module\'s own reads and writes of the object are outside this file (§5 names the lines).');
  p('- **Calls are reads** — calling a boot function that assigns shared state is a read of the function; there is no call-graph closure, so a section\'s TRANSITIVE writes are not counted.');
  p(`- **\`this\`, \`arguments\`, \`eval\`, \`with\`** — not modelled; inside boot's body: \`this\` ×${T.blind.this}, \`arguments\` ×${T.blind.arguments}, \`eval(\` ×${T.blind.eval}, \`with (\` ×${T.blind.with}.`);
  p('- **Deferred is lexical** — a reference inside any nested function counts as deferred, including a callback boot invokes while it runs (`forEach`, an IIFE, a constructor that calls back at once); such a forward use is really eager.  The TDZ column of §10 is exact only for references at boot\'s own statement level.');
  p('- **Destructured renames** — `const { hand: modHand } = mod` declares `modHand` and reads `mod`, as JavaScript does; the link from `modHand` back to `mod.hand` is not kept.');
  p('- **ASI** — statement ends are `;`, a closing bracket, or a NAME on a new line after a token that ends an expression; a file that leans on other ASI shapes could mis-scope a for-loop body or an arrow\'s expression body.');
  p('- **Classes** — not modelled (rack.js has none; a class would raise a walker warning).');
  p('- **Shadowing — how far it goes**: function parameters (plain, defaulted, destructured, rest), arrow parameters, inner `const` / `let` / `function` / `var` per block, for-heads (also over an unbraced body), catch bindings and named function expressions all shadow, and resolution uses the WHOLE block (a later inner `const x` shadows `x` from the block\'s first line, as the TDZ does).  An arrow\'s expression body inside a ternary branch extends to the next `,` / `;`, so a second arrow in the other branch sees the first one\'s parameters (harmless unless they share a boot-level name).');
  p(`- Shadowing measured: ${R.shadows.count} references resolved to an inner binding that shares a boot-level name — ${Object.entries(R.shadows.byName).map(([nm, ls]) => `\`${nm}\` ×${ls.length}`).join(', ') || 'none'}.`);
  p('');
  return out.join('\n') + '\n';
}

/** the JSON twin, diffable: the top level and its collections one entry per line, each entry compact */
export function jsonText(R) {
  const pretty = (v, ind, depth) => {
    if (depth >= 2 || v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) {
      if (!v.length || v.every((x) => x === null || typeof x !== 'object')) return JSON.stringify(v);
      return '[\n' + v.map((x) => ind + ' ' + pretty(x, ind + ' ', depth + 1)).join(',\n') + '\n' + ind + ']';
    }
    const e = Object.entries(v);
    if (!e.length) return '{}';
    return '{\n' + e.map(([k, x]) => ind + ' ' + JSON.stringify(k) + ': ' + pretty(x, ind + ' ', depth + 1)).join(',\n') + '\n' + ind + '}';
  };
  return pretty(R, '', 0) + '\n';
}

/* ══ 7.  THE COMMAND ═════════════════════════════════════════════════════════════════════════════════════════════ */
function main(argv) {
  const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const rel = arg('--file') || 'lab/rack.js';
  const R = analyze(readFileSync(path.resolve(ROOT, rel), 'utf8'), { file: rel });
  const want = arg('--section');
  if (want !== undefined) {
    let k = /^\d+$/.test(want) ? +want : R.sections.findIndex((s) => (s.header || s.title).toLowerCase().includes(want.toLowerCase()));
    if (!(k >= 0 && k < R.sections.length)) { console.error(`no section ${want} (0–${R.sections.length - 1}, or a word of a header)`); process.exit(2); }
    console.log(sectionDetail(R, k));
    return;
  }
  console.log(summary(R));
  if (argv.includes('--no-write')) return;
  const dir = path.join(ROOT, 'research', 'release-0.5.2');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'RACK-DEPS.md'), markdown(R));
  writeFileSync(path.join(dir, 'rack-deps.json'), jsonText(R));
  console.log('\nwrote research/release-0.5.2/RACK-DEPS.md and research/release-0.5.2/rack-deps.json');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main(process.argv.slice(2));
