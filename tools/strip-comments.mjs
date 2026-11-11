#!/usr/bin/env node
/* strip-comments.mjs — THE DEPLOY STRIPS COMMENTS (042 Z, Josh 11-11: "Deploy should strip comments. Keep it super clean.").
 * tools/build-deploy.mjs runs it over the JS, the CSS and index.html it copies into dist/; lab/ keeps every comment. A lexer, not a
 * regex: strings, template literals (with `${ … }` holding code, strings, templates and comments again), regular expressions told from
 * division by the token before them, // and block comments, a hashbang. It removes comments and the blank lines and trailing blanks they
 * leave, and nothing else: no string, template chunk or regular expression changes by a byte (the WGSL shaders are template literals; THE
 * LOCK's digests and the pipeline caches key on their text), no line is joined, nothing is renamed or re-indented.
 *   A block comment holding a line break becomes that line break (ASI); one without becomes a space only where the two tokens would
 *   otherwise join (in CSS an empty comment, as a space would be a descendant combinator); a // comment goes up to its line break.
 *   A licence comment stays: @license, @preserve, Copyright, SPDX-License-Identifier, ©, "(c) 2026", or one that begins /*!.
 *
 *   node tools/strip-comments.mjs --self-test     the hard cases, each against its expected output and its token proof
 *   node tools/strip-comments.mjs <file>          the stripped file on stdout, for a look
 *
 * THE PROOF (build-deploy §V8 runs it on every file): tokens(original) === tokens(stripped). A JS token is every significant token with
 * its text byte for byte (each string, template chunk and regex) and whether a line break precedes it; a CSS token likewise, with every
 * whitespace run one token; for index.html, the text outside comments with its whitespace runs as one space. The licence comments kept
 * must be exactly the original's. Then node --check (build-deploy). */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* ══ JS ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
const U_ID_START = /\p{ID_Start}/u, U_ID_PART = /[\p{ID_Continue}‌‍]/u, U_WS = /[\p{Zs}﻿]/u;
const LT_RE = /\r\n|[\n\r\u2028\u2029]/, HAS_LT = /[\n\r\u2028\u2029]/;
const isLT = (c) => c === 10 || c === 13 || c === 0x2028 || c === 0x2029;
const isWS = (c) => c === 9 || c === 11 || c === 12 || c === 32 || c === 0xA0 || (c > 127 && U_WS.test(String.fromCharCode(c)));
const isDigit = (c) => c >= 48 && c <= 57;
const asciiStart = (c) => (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || c === 36 || c === 95;
const asciiPart = (c) => asciiStart(c) || isDigit(c);
const PUNCT = new Map();
for (const p of ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=', '&&', '||', '??',
  '?.', '++', '--', '+=', '-=', '*=', '%=', '&=', '|=', '^=', '**', '<<', '>>']) (PUNCT.get(p[0]) || PUNCT.set(p[0], []).get(p[0])).push(p);
/* a `/` after one of these words starts a regex, and a `{` after one of them (but do / else) is an object literal */
const BEFORE_EXPR = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
const CONDS = new Set(['if', 'while', 'for', 'with']);   // `)` closing their parenthesis is followed by a statement, so `/` there is a regex
const GAP = new Set(['ws', 'line', 'block', 'hashbang']);

/** the source as pieces that cover it exactly: ws · line · block · hashbang · id · priv · num · str · tpl · re · p */
export function lexJS(src, { module = true } = {}) {
  const out = [], n = src.length, braces = [], parens = [];
  let i = 0, prev = null, lineStart = true;
  const err = (m) => { throw new Error(`${m} at line ${src.slice(0, i).split(LT_RE).length}`); };
  const push = (k, s, x) => { const t = x ? { k, s, ...x } : { k, s }; out.push(t); if (!GAP.has(k)) { prev = t; lineStart = false; } };
  const lineEnd = (j) => { while (j < n && !isLT(src.charCodeAt(j))) j++; return j; };
  const word = (t) => t && t.k === 'id' && !t.dot;
  const regexOK = () => !prev ? true
    : prev.k === 'id' ? word(prev) && BEFORE_EXPR.has(prev.s)
    : prev.k === 'p' ? (prev.s === ')' ? !!prev.cond : prev.s === '}' ? !!prev.block : !(prev.s === ']' || prev.s === '++' || prev.s === '--'))
    : prev.k === 'tpl' ? !!prev.open : false;
  const braceKind = () => !prev ? 'block'
    : prev.k === 'id' ? (word(prev) && BEFORE_EXPR.has(prev.s) && prev.s !== 'do' && prev.s !== 'else' ? 'expr' : 'block')
    : prev.k === 'p' ? ([')', '}', ';', '{', '=>'].includes(prev.s) ? 'block' : 'expr')
    : prev.k === 'tpl' && prev.open ? 'expr' : 'block';
  const uescape = (j) => {   // at a backslash inside an identifier
    if (src[j + 1] !== 'u') err('a stray backslash');
    if (src[j + 2] === '{') { const e = src.indexOf('}', j + 3); if (e < 0) err('an unterminated \\u{…}'); return e + 1; }
    if (!/^[0-9a-fA-F]{4}$/.test(src.slice(j + 2, j + 6))) err('a bad \\u escape');
    return j + 6;
  };
  const ident = (j, start, k) => {
    while (j < n) {
      const c = src.charCodeAt(j);
      if (c < 128) { if (asciiPart(c)) { j++; continue; } if (c === 92) { j = uescape(j); continue; } break; }
      const ch = String.fromCodePoint(src.codePointAt(j));
      if (U_ID_PART.test(ch)) { j += ch.length; continue; }
      break;
    }
    push(k, src.slice(start, j), k === 'id' ? { dot: !!(prev && prev.k === 'p' && (prev.s === '.' || prev.s === '?.')) } : null);
    return j;
  };
  const idStart = (j) => { const c = src.charCodeAt(j); return c < 128 ? asciiStart(c) || c === 92 : U_ID_START.test(String.fromCodePoint(src.codePointAt(j))); };
  const string = (j0, q) => {
    let j = j0 + 1;
    for (;;) {
      if (j >= n) err('an unterminated string');
      const c = src.charCodeAt(j);
      if (c === q) { j++; break; }
      if (c === 92) { j += src.charCodeAt(j + 1) === 13 && src.charCodeAt(j + 2) === 10 ? 3 : 2; continue; }
      if (c === 10 || c === 13) err('a line break inside a string');
      j++;
    }
    push('str', src.slice(j0, j)); return j;
  };
  const template = (j0) => {   // at ` or at the } that closes a ${
    let j = j0 + 1;
    for (;;) {
      if (j >= n) err('an unterminated template');
      const c = src.charCodeAt(j);
      if (c === 96) { j++; push('tpl', src.slice(j0, j)); return j; }
      if (c === 92) { j += 2; continue; }
      if (c === 36 && src.charCodeAt(j + 1) === 123) { j += 2; braces.push('tpl'); push('tpl', src.slice(j0, j), { open: true }); return j; }
      j++;
    }
  };
  const regex = (j0) => {
    let j = j0 + 1, cls = false;
    for (;;) {
      if (j >= n || isLT(src.charCodeAt(j))) err('an unterminated regular expression');
      const c = src.charCodeAt(j);
      if (c === 92) { j += 2; continue; }
      if (cls) { if (c === 93) cls = false; } else if (c === 91) cls = true; else if (c === 47) { j++; break; }
      j++;
    }
    while (j < n && asciiPart(src.charCodeAt(j))) j++;   // the flags
    push('re', src.slice(j0, j)); return j;
  };
  const number = (j0) => {
    const radix = src.charCodeAt(j0) === 48 && /[xXoObB]/.test(src[j0 + 1] || '');
    let j = j0;
    while (j < n) {
      const c = src.charCodeAt(j);
      if ((asciiPart(c) && c !== 36) || c === 46) { j++; continue; }
      if ((c === 43 || c === 45) && !radix && (src[j - 1] === 'e' || src[j - 1] === 'E')) { j++; continue; }
      break;
    }
    push('num', src.slice(j0, j)); return j;
  };

  if (src.startsWith('#!')) { const e = lineEnd(0); push('hashbang', src.slice(0, e)); i = e; }
  while (i < n) {
    const c = src.charCodeAt(i);
    if (isWS(c) || isLT(c)) {
      let j = i, nl = false;
      for (; j < n; j++) { const d = src.charCodeAt(j); if (isLT(d)) nl = true; else if (!isWS(d)) break; }
      push('ws', src.slice(i, j)); if (nl) lineStart = true; i = j; continue;
    }
    if (c === 47) {
      const d = src.charCodeAt(i + 1);
      if (d === 47) { const e = lineEnd(i); push('line', src.slice(i, e)); i = e; continue; }
      if (d === 42) {
        const e = src.indexOf('*/', i + 2); if (e < 0) err('an unterminated comment');
        const s = src.slice(i, e + 2); push('block', s); if (HAS_LT.test(s)) lineStart = true; i = e + 2; continue;
      }
      if (regexOK()) { i = regex(i); continue; }
      const s = d === 61 ? '/=' : '/'; push('p', s); i += s.length; continue;
    }
    if (!module && (src.startsWith('<!--', i) || (lineStart && src.startsWith('-->', i)))) err('an HTML-like comment in a classic script');
    if (c === 39 || c === 34) { i = string(i, c); continue; }
    if (c === 96) { i = template(i); continue; }
    if (isDigit(c) || (c === 46 && isDigit(src.charCodeAt(i + 1)))) { i = number(i); continue; }
    if (c === 35) { i = ident(i + 1, i, 'priv'); continue; }
    if (idStart(i)) { i = ident(i, i, 'id'); continue; }
    if (c === 123) { braces.push(braceKind()); push('p', '{'); i++; continue; }
    if (c === 125) { const k = braces.pop(); if (k === 'tpl') { i = template(i); continue; } push('p', '}', { block: k !== 'expr' }); i++; continue; }
    if (c === 40) { parens.push(word(prev) && CONDS.has(prev.s)); push('p', '('); i++; continue; }
    if (c === 41) { push('p', ')', { cond: !!parens.pop() }); i++; continue; }
    let s = (PUNCT.get(src[i]) || []).find((p) => src.startsWith(p, i));
    if (s === '?.' && isDigit(src.charCodeAt(i + 2))) s = null;   // a ? .5 : b
    s = s || String.fromCodePoint(src.codePointAt(i));
    push('p', s); i += s.length;
  }
  return out;
}

const LICENCE = /@license|@preserve|Copyright|COPYRIGHT|SPDX-License-Identifier|©|\([cC]\)\s*\d{4}/;   // a notice's own spelling: "the copyright line" in prose is not one
export const isLicence = (s) => s.startsWith('/*!') || LICENCE.test(s);
const H_WS = /[\t\v\f  ﻿\p{Zs}]/u, H_WS_END = /[\t\v\f  ﻿\p{Zs}]+$/u, H_WS_START = /^[\t\v\f  ﻿\p{Zs}]+/u;
const rstrip = (s) => s.replace(H_WS_END, '');

/* One gap (the comments and whitespace between two tokens) rewritten: a removed comment is \0 until its two sides are known; a kept one
   is \u0001 (opaque: its own lines and blanks are never touched); then every line of the gap loses its trailing blanks and an empty line
   goes, the gap keeping a line break when it had one. */
function gap(G, prev, next, css, stats) {
  const kept = []; let g = '';
  for (const p of G) {
    if (p.k === 'ws') { g += p.s; continue; }
    if (p.k === 'hashbang' || isLicence(p.s)) { kept.push(p.s); g += '\u0001'; stats.kept++; continue; }
    stats.removed++;
    if (p.k === 'line') continue;
    const lt = !css && LT_RE.exec(p.s);
    g += lt ? lt[0] : '\u0000';
  }
  g = g.replace(/\u0000+/g, '\u0000');
  for (let x = g.indexOf('\u0000'); x >= 0; x = g.indexOf('\u0000', x)) {
    const L = x > 0 ? g[x - 1] : prev ? prev.s[prev.s.length - 1] : '\n', R = x + 1 < g.length ? g[x + 1] : next ? next.s[0] : '\n';
    const apart = (ch) => ch === '\u0001' || H_WS.test(ch) || HAS_LT.test(ch);
    let put = '', rest = g.slice(x + 1);
    if (apart(L) || apart(R)) { if (H_WS.test(L)) rest = rest.replace(H_WS_START, ''); }
    else if (joins(prev.s, next.s, css)) put = css ? '/**/' : ' ';
    g = g.slice(0, x) + put + rest; x += put.length;
  }
  const parts = g.split(/(\r\n|[\n\r\u2028\u2029])/);
  let r;
  if (parts.length === 1) r = next ? g : rstrip(g);
  else {
    const first = rstrip(parts[0]);
    r = prev || first ? first + parts[1] : '';
    for (let x = 2; x < parts.length - 1; x += 2) { const line = rstrip(parts[x]); if (line) r += line + parts[x + 1]; }
    if (next) r += parts[parts.length - 1];
  }
  let k = 0; return r.replace(/\u0001/g, () => kept[k++]);
}
/* would two tokens, written with nothing between them, read as other tokens? (in isolation; when unsure, yes) */
function joins(a, b, css) {
  try { const t = (css ? sigCSS(lexCSS(a + b)) : sigJS(lexJS(a + b))); return !(t.length === 2 && t[0] === a && t[1] === b); } catch { return true; }
}
const sigJS = (P) => P.filter((p) => !GAP.has(p.k)).map((p) => p.s);

function rewrite(P, css) {
  const stats = { removed: 0, kept: 0 }, isGap = css ? (p) => p.k === 'ws' || p.k === 'block' : (p) => GAP.has(p.k);
  let out = '', prev = null;
  for (let k = 0; k < P.length;) {
    if (!isGap(P[k])) { out += P[k].s; prev = P[k]; k++; continue; }
    let e = k; while (e < P.length && isGap(P[e])) e++;
    out += gap(P.slice(k, e), prev, P[e] || null, css, stats); k = e;
  }
  return { out, ...stats };
}

/** strip a JS source. `module: false` for a classic script (sw.js), where <!-- and a line's leading --> are comments: refused, never guessed. */
export const stripJS = (src, opts) => rewrite(lexJS(src, opts), false);
/** the proof's view: every token but comments and blanks, byte for byte, each marked by whether a line break precedes it (ASI) */
export function tokensJS(src, opts) {
  const T = []; let nl = false;
  for (const p of lexJS(src, opts)) {
    if (p.k === 'ws' || p.k === 'block') { if (HAS_LT.test(p.s)) nl = true; continue; }
    if (p.k === 'line' || p.k === 'hashbang') continue;
    T.push((T.length && nl ? '\n' : ' ') + p.k + ' ' + p.s); nl = false;
  }
  return T;
}
const commentsOf = (P, kinds) => P.filter((p) => kinds.has(p.k)).map((p) => p.s);

/* ══ CSS (CSS Syntax 3's tokens: enough to know which comments separate what) ═══════════════════════════════════════════════════════ */
const cssWS = (c) => c === 32 || c === 9 || c === 10 || c === 13 || c === 12;
const nameStart = (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 || c >= 128;
const nameChar = (c) => nameStart(c) || isDigit(c) || c === 45;
const isHex = (c) => isDigit(c) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102);
/** the stylesheet as pieces that cover it exactly: ws · block · str · url · ident · fn · at · hash · num · p */
export function lexCSS(src) {
  const out = [], n = src.length; let i = 0;
  const at = (j) => src.charCodeAt(j);
  const err = (m) => { throw new Error(`${m} at line ${src.slice(0, i).split(LT_RE).length}`); };
  const esc = (j) => at(j) === 92 && j + 1 < n && !(at(j + 1) === 10 || at(j + 1) === 13 || at(j + 1) === 12);
  const identAt = (j) => at(j) === 45 ? nameStart(at(j + 1)) || at(j + 1) === 45 || esc(j + 1) : nameStart(at(j)) || esc(j);
  const numberAt = (j) => { if (at(j) === 43 || at(j) === 45) j++; return isDigit(at(j)) || (at(j) === 46 && isDigit(at(j + 1))); };
  const escape = (j) => {   // at the backslash
    j++;
    if (isHex(at(j))) { let k = 0; while (k < 6 && isHex(at(j))) { j++; k++; } if (at(j) === 13 && at(j + 1) === 10) j += 2; else if (cssWS(at(j))) j++; return j; }
    return j + String.fromCodePoint(src.codePointAt(j)).length;
  };
  const name = (j) => { while (j < n) { if (nameChar(at(j))) j++; else if (esc(j)) j = escape(j); else break; } return j; };
  const number = (j) => {
    if (at(j) === 43 || at(j) === 45) j++;
    while (isDigit(at(j))) j++;
    if (at(j) === 46 && isDigit(at(j + 1))) { j++; while (isDigit(at(j))) j++; }
    if ((at(j) === 69 || at(j) === 101) && (isDigit(at(j + 1)) || ((at(j + 1) === 43 || at(j + 1) === 45) && isDigit(at(j + 2))))) { j += 2; while (isDigit(at(j))) j++; }
    return j;
  };
  const push = (k, j) => { out.push({ k, s: src.slice(i, j) }); i = j; };
  while (i < n) {
    const c = at(i);
    if (c === 47 && at(i + 1) === 42) { const e = src.indexOf('*/', i + 2); if (e < 0) err('an unterminated comment'); push('block', e + 2); continue; }
    if (cssWS(c)) { let j = i; while (j < n && cssWS(at(j))) j++; push('ws', j); continue; }
    if (c === 34 || c === 39) {
      let j = i + 1;
      for (;;) { if (j >= n) err('an unterminated string'); const d = at(j); if (d === c) { j++; break; } if (d === 92) { j += at(j + 1) === 13 && at(j + 1 + 1) === 10 ? 3 : 2; continue; } if (d === 10 || d === 13 || d === 12) err('a line break inside a string'); j++; }
      push('str', j); continue;
    }
    if (c === 35 && (nameChar(at(i + 1)) || esc(i + 1))) { push('hash', name(i + 1)); continue; }
    if (numberAt(i)) { let j = number(i); if (identAt(j)) j = name(j); else if (at(j) === 37) j++; push('num', j); continue; }
    if (src.startsWith('<!--', i)) { push('p', i + 4); continue; }
    if (src.startsWith('-->', i)) { push('p', i + 3); continue; }
    if (c === 64 && identAt(i + 1)) { push('at', name(i + 1)); continue; }
    if (identAt(i)) {
      const j = name(i);
      if (at(j) !== 40) { push('ident', j); continue; }
      if (src.slice(i, j).toLowerCase() === 'url') {
        let k = j + 1; while (cssWS(at(k))) k++;
        if (at(k) !== 34 && at(k) !== 39) {   // an unquoted url( … ): its body is the URL's, comments and all
          for (;;) { if (k >= n) err('an unterminated url('); if (at(k) === 41) { k++; break; } k = esc(k) ? escape(k) : k + 1; }
          push('url', k); continue;
        }
      }
      push('fn', j + 1); continue;
    }
    push('p', i + String.fromCodePoint(src.codePointAt(i)).length);
  }
  return out;
}
const sigCSS = (P) => P.filter((p) => p.k !== 'ws' && p.k !== 'block').map((p) => p.s);
export const stripCSS = (src) => rewrite(lexCSS(src), true);
/** the proof's view: every token but comments, each whitespace run one token, none at the two ends */
export function tokensCSS(src) {
  const T = [];
  for (const p of lexCSS(src)) {
    if (p.k === 'block') continue;
    if (p.k === 'ws') { if (T.length && T[T.length - 1] !== ' ') T.push(' '); continue; }
    T.push(p.k + ' ' + p.s);
  }
  if (T[T.length - 1] === ' ') T.pop();
  return T;
}

/* ══ HTML (index.html: a comment outside script, style, textarea and title goes; a conditional or licence comment stays) ══════════ */
export function lexHTML(src) {
  const out = [], n = src.length, low = src.toLowerCase(); let i = 0;
  while (i < n) {
    if (src.startsWith('<!--', i)) { const e = src.indexOf('-->', i + 4); if (e < 0) throw new Error('an unterminated <!--'); out.push({ k: 'comment', s: src.slice(i, e + 3) }); i = e + 3; continue; }
    let j;
    if (src[i] === '<' && /[a-zA-Z]/.test(src[i + 1] || '')) {
      j = i + 1; let q = '';
      for (; j < n; j++) { const c = src[j]; if (q) { if (c === q) q = ''; } else if (c === '"' || c === "'") q = c; else if (c === '>') break; }
      j++;
      const tag = /^<([a-zA-Z][^\s/>]*)/.exec(src.slice(i, j))[1].toLowerCase();
      if (['script', 'style', 'textarea', 'title'].includes(tag)) { const e = low.indexOf('</' + tag, j); j = e < 0 ? n : e; }
    } else { j = src.indexOf('<', i + 1); if (j < 0) j = n; }
    out.push({ k: 'raw', s: src.slice(i, j) }); i = j;
  }
  return out;
}
const keepHTML = (s) => s.startsWith('<!--[if') || s.startsWith('<![endif]') || isLicence(s);
export function stripHTML(src) {
  let removed = 0, kept = 0;
  const marked = lexHTML(src).map((p) => p.k !== 'comment' ? p.s : keepHTML(p.s) ? (kept++, p.s) : (removed++, '\u0000')).join('');
  const parts = marked.split(/(\r\n|\n)/); let out = '';
  for (let x = 0; x < parts.length; x += 2) {
    const line = parts[x], lt = parts[x + 1] || '';
    if (!line.includes('\u0000')) { out += line + lt; continue; }
    const s = rstrip(line.replace(/\u0000/g, ''));
    if (s.trim()) out += s + lt;
  }
  return { out, removed, kept };
}
export const tokensHTML = (src) => [lexHTML(src).map((p) => p.k !== 'comment' ? p.s : keepHTML(p.s) ? p.s : '').join('').replace(/\s+/g, ' ').trim()];

/* ══ ONE FILE, BY ITS NAME, WITH ITS PROOF ═══════════════════════════════════════════════════════════════════════════════════════ */
/** strip `src` (named `rel`) and prove it: { out, removed, kept, why } — `why` is null when the proof holds, else what broke */
export function stripFile(rel, src, { classic = false } = {}) {
  const kind = /\.css$/i.test(rel) ? 'css' : /\.html?$/i.test(rel) ? 'html' : 'js', opts = { module: !classic };
  const r = kind === 'css' ? stripCSS(src) : kind === 'html' ? stripHTML(src) : stripJS(src, opts);
  const tok = kind === 'css' ? tokensCSS : kind === 'html' ? tokensHTML : (s) => tokensJS(s, opts);
  const a = tok(src), b = tok(r.out);
  let why = null;
  if (a.length !== b.length || a.some((t, x) => t !== b[x])) {
    const x = Math.max(0, a.findIndex((t, k) => t !== b[k])), s = a[x] || '', t = b[x] || '';
    let d = 0; while (d < s.length && s[d] === t[d]) d++;
    const cut = (u) => JSON.stringify(u.slice(Math.max(0, d - 30), d + 50) || '(end)');
    why = `token ${x} of ${a.length}: ${cut(s)} became ${cut(t)}`;
  } else if (kind !== 'html') {
    const kinds = kind === 'css' ? new Set(['block']) : new Set(['line', 'block', 'hashbang']);
    const lex = kind === 'css' ? lexCSS : (s) => lexJS(s, opts);
    const want = commentsOf(lex(src), kinds).filter((s) => isLicence(s) || s.startsWith('#!')), got = commentsOf(lex(r.out), kinds).filter((s) => s !== '/**/');
    if (want.length !== got.length || want.some((s, x) => s !== got[x])) why = `the comments left are not the original's licence comments (${got.length} left, ${want.length} kept)`;
  }
  const count = (k) => a.filter((t) => t.startsWith(k + ' ', kind === 'js' ? 1 : 0)).length;
  return { ...r, why, n: kind === 'html' ? {} : { str: count('str'), tpl: count('tpl'), re: count('re'), url: count('url') } };
}

/* ══ THE SELF-TEST ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
const CASES = [
  // [name, input, expected output, the token kinds that must (+) or must not (-) appear, opts]
  ['regex holding /*', 'x = /\\/\\*/g; // c\n', 'x = /\\/\\*/g;\n', '+re'],
  ['regex class holding /', 'x = s.split(/[/]/); // c\n', 'x = s.split(/[/]/);\n', '+re'],
  ['regex class holding ] and /*', 'x = /[\\]/*]+/; /* c */ y\n', 'x = /[\\]/*]+/; y\n', '+re'],
  ['a / b / c is division', 'q = a / b / c; // c\n', 'q = a / b / c;\n', '-re'],
  ['x = y /re/.test(z) is division', 'x = y /re/.test(z) // c\n', 'x = y /re/.test(z)\n', '-re'],
  ['the template with code, a comment and a template inside', 'x = `a ${ b /* c */ + `d // e ${f}` } // g` // h\n', 'x = `a ${ b + `d // e ${f}` } // g`\n', ''],
  ['braces in strings inside ${ } and a } in a template\'s text', 'x = `a } ${ \'}\' + "{" + `}` } /* t */` + \'${\'; // c\n', 'x = `a } ${ \'}\' + "{" + `}` } /* t */` + \'${\';\n', ''],
  ['strings holding // and /*', 's = "//"; t = \'/*\'; u = "*/" // c\n', 's = "//"; t = \'/*\'; u = "*/"\n', ''],
  ['division after )', 'r = (a + b) / 2 / c; // c\n', 'r = (a + b) / 2 / c;\n', '-re'],
  ['a regex after the ) of an if', 'if (a) /x\\/\\/y/.test(s) && f(); // c\n', 'if (a) /x\\/\\/y/.test(s) && f();\n', '+re'],
  ['a regex after return', 'function f(s) { return /\\/\\/x/g.test(s); } // c\n', 'function f(s) { return /\\/\\/x/g.test(s); }\n', '+re'],
  ['typeof, in and of before a regex', 'a = typeof /x/; b = 1 in /y/; for (const m of /z/g.exec(s) || []) {}\n', 'a = typeof /x/; b = 1 in /y/; for (const m of /z/g.exec(s) || []) {}\n', '+re'],
  ['a keyword after a dot is a name', 'v = o.return / 2 / t; // c\n', 'v = o.return / 2 / t;\n', '-re'],
  ['a++ / b', 'v = a++ / b / c; // c\n', 'v = a++ / b / c;\n', '-re'],
  ['x = /=/ and x /= 2', 'x = /=/; x /= 2; // c\n', 'x = /=/; x /= 2;\n', '+re'],
  ['a block\'s } then a regex', 'if (a) { b(); }\n/x\\/\\/y/.test(s); // c\n', 'if (a) { b(); }\n/x\\/\\/y/.test(s);\n', '+re'],
  ['an object\'s } then division', 'v = { a: 1 }.a / 2 / c; w = `${ { k: 1 }.k / 2 / d }`;\n', 'v = { a: 1 }.a / 2 / c; w = `${ { k: 1 }.k / 2 / d }`;\n', '-re'],
  ['unicode escapes and letters', 'const \\u0061b = 1, πr = 2 /* c */ + \'é\\u00e9\'; // ü\n', 'const \\u0061b = 1, πr = 2 + \'é\\u00e9\';\n', ''],
  ['</script> and <!-- in strings', 's = \'</script><!-- x -->\'; // c\n', 's = \'</script><!-- x -->\';\n', ''],
  ['a CRLF file', 'a = 1; // c\r\n\r\n/* d\r\n */\r\nb = 2;\r\n', 'a = 1;\r\nb = 2;\r\n', ''],
  ['the end is a line comment with no line break', 'a = 1 // c', 'a = 1', ''],
  ['a/**/b does not join', 'a/**/b', 'a b', ''],
  ['a /**/ / b', 'x = a /**/ / b', 'x = a / b', '-re'],
  ['1/**//2', 'x = 1/**//2', 'x = 1/2', '-re'],
  ['+/**/+ does not join', 'x = a +/**/+ b', 'x = a + + b', ''],
  ['a block comment with a line break keeps ASI', 'function f() { return /* a\n b */ x }\n', 'function f() { return\n x }\n', ''],
  ['blank lines and trailing blanks go', 'a = 1;   \n\n\n  // c\n  b = 2;\t\n', 'a = 1;\n  b = 2;\n', ''],
  ['a template\'s own lines are its own', 'const S = /* wgsl */ `\n  // a\n\n  x = 1;   // b\n`; // c\n', 'const S = `\n  // a\n\n  x = 1;   // b\n`;\n', ''],
  ['licence comments stay', '/*! keep */\n/* © 2026 J */ x; /* @license MIT */ y; // SPDX-License-Identifier: MIT\n// (a), (b), (c) a list\nz;\n',
    '/*! keep */\n/* © 2026 J */ x; /* @license MIT */ y; // SPDX-License-Identifier: MIT\nz;\n', ''],
  ['the hashbang stays', '#!/usr/bin/env node\n// c\nx;\n', '#!/usr/bin/env node\nx;\n', ''],
  ['<!-- in a module is an operator', 'if (a <!--b) f(); // c\n', 'if (a <!--b) f();\n', ''],
  ['a ? .5 : b', 'x = a?/**/.5:b; // c\n', 'x = a?.5:b;\n', ''],
  ['a file that begins with a regex', '/\\/\\/x/.test(s) && f(); // c\n', '/\\/\\/x/.test(s) && f();\n', '+re'],
  ['a regex after ? and :', 'x = a ? /\\/\\// : /\\*/; // c\n', 'x = a ? /\\/\\// : /\\*/;\n', '+re'],
  ['a private name and a number with an exponent', 'class A { #x = 1e-3 / 2; m() { return this.#x / 2 / 3; } } // c\n', 'class A { #x = 1e-3 / 2; m() { return this.#x / 2 / 3; } }\n', '-re'],
  ['the end of a comment-only file', '// a\n/* b */\n', '', ''],
  ['css: a comment between declarations', 'a { color: red; /* c */ }\n/* d */\nb { x: 1 }\n', 'a { color: red; }\nb { x: 1 }\n', '', { css: true }],
  ['css: url( ) and strings keep their slashes', 'a { b: url(x/*y*/z.png); c: url( "q/*r*/" ); d: "/* s */"; } /* t */\n', 'a { b: url(x/*y*/z.png); c: url( "q/*r*/" ); d: "/* s */"; }\n', '', { css: true }],
  ['css: .a/**/.b is .a.b, a/**/b keeps an empty comment', '.a/**/.b {} a/**/b {} .c/*\n*/.d {}\n', '.a.b {} a/**/b {} .c.d {}\n', '', { css: true }],
  ['css: a licence comment stays', '/*! keep */\n/* Copyright 2026 J */\na {}\n', '/*! keep */\n/* Copyright 2026 J */\na {}\n', '', { css: true }],
  ['html: comments outside script, style and textarea', '<p>a<!-- x -->b</p>\n<!-- y\n z -->\n<link rel="x">   <!-- w -->\n<script>// <!-- s\n</script><textarea><!-- t --></textarea><!--[if IE]>k<![endif]-->\n',
    '<p>ab</p>\n<link rel="x">\n<script>// <!-- s\n</script><textarea><!-- t --></textarea><!--[if IE]>k<![endif]-->\n', '', { html: true }],
];
/** the table above, run: the number of cases that failed (0 is the lexer's own proof; build-deploy §V8 runs it quietly) */
export function selfTest({ quiet = false } = {}) {
  let bad = 0; const log = quiet ? (s) => { if (s.startsWith('FAIL')) console.log('      ' + s); } : console.log;
  for (const [name, input, want, kinds, o = {}] of CASES) {
    const rel = o.css ? 'x.css' : o.html ? 'x.html' : 'x.js';
    let r, msg = '';
    try { r = stripFile(rel, input); } catch (e) { msg = 'threw ' + e.message; }
    if (!msg && r.out !== want) msg = `gave ${JSON.stringify(r.out)}, wanted ${JSON.stringify(want)}`;
    if (!msg && r.why) msg = 'the proof failed: ' + r.why;
    if (!msg && kinds) { const has = lexJS(input).some((p) => p.k === kinds.slice(1)); if (has !== (kinds[0] === '+')) msg = `the lexer ${has ? 'saw' : 'did not see'} a ${kinds.slice(1)}`; }
    log(`${msg ? 'FAIL' : 'PASS'}  ${name}${msg ? '  — ' + msg : ''}`); if (msg) bad++;
  }
  for (const [name, src] of [['<!-- in a classic script', 'a <!--b\n'], ['--> at a classic line start', 'a\n--> b\n']]) {
    let threw = false; try { stripJS(src, { module: false }); } catch { threw = true; }
    log(`${threw ? 'PASS' : 'FAIL'}  ${name} is refused, never guessed`); if (!threw) bad++;
  }
  if (!quiet) console.log(bad ? `${bad} FAILED` : `ALL ${CASES.length + 2} PASS`);
  return bad;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--self-test') process.exit(selfTest() ? 1 : 0);
  if (!a) { console.error('usage: node tools/strip-comments.mjs --self-test | <file>'); process.exit(2); }
  const r = stripFile(a, readFileSync(a, 'utf8'), { classic: /(^|\/)sw\.js$/.test(a) });
  process.stdout.write(r.out);
  if (r.why) { console.error('PROOF FAILED: ' + r.why); process.exit(1); }
}
